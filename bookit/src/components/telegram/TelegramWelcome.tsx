'use client';

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Share2, Smartphone, ShieldCheck, RotateCw } from 'lucide-react';

interface TelegramWelcomeProps {
  onSuccess: (phone: string) => void;
}

type PollingStatus = 'idle' | 'polling' | 'success' | 'timeout' | 'cancelled' | 'error';

export function TelegramWelcome({ onSuccess }: TelegramWelcomeProps) {
  const [status, setStatus] = useState<PollingStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [pollingAttempt, setPollingAttempt] = useState(0);
  const [pollingMax, setPollingMax] = useState(10);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const pollingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  async function handleShareContact() {
    if (status !== 'idle' && status !== 'timeout' && status !== 'error') return;

    const tg = window.Telegram?.WebApp;
    if (!tg) {
      setStatus('error');
      setError('Telegram WebApp не доступний');
      return;
    }

    setStatus('polling');
    setError(null);
    setPollingAttempt(0);
    setPollingMax(10);

    tg.HapticFeedback.impactOccurred('medium');

    try {
      tg.requestContact((res: { status: 'sent' | 'cancelled' }) => {
        if (res.status === 'sent') {
          startPolling(tg.initDataRaw);
        } else {
          setStatus('cancelled');
          setError('Ви скасували запит контакту');
        }
      });
    } catch (err: any) {
      console.error('[TelegramWelcome] Error requesting contact:', err);
      setStatus('error');
      setError('Не вдалося ініціювати запит');
    }
  }

  async function startPolling(initDataRaw: string) {
    let attempts = 0;
    const maxAttempts = 10;
    const pollIntervalMs = 1000; // 1 second

    const tryPoll = async () => {
      attempts++;
      setPollingAttempt(attempts);

      try {
        const res = await fetch('/api/auth/telegram', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ initData: initDataRaw }),
        });

        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }

        const data = await res.json();

        if (data.success && data.token) {
          if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
          if (pollingTimeoutRef.current) clearTimeout(pollingTimeoutRef.current);

          setStatus('success');
          setTimeout(() => {
            onSuccess('linked');
          }, 500);
          return;
        }

        // If we got a response but not logged in yet, continue polling
        if (data.status === 'NEED_PHONE' || data.status === 'WAITING_FOR_PHONE') {
          if (attempts >= maxAttempts) {
            throw new Error('Timeout');
          }
          // Continue polling
        }
      } catch (err: any) {
        console.error(`[TelegramWelcome] Poll attempt ${attempts} failed:`, err);
        if (attempts >= maxAttempts) {
          throw new Error('Timeout after all attempts');
        }
      }
    };

    // Start polling loop
    pollingIntervalRef.current = setInterval(tryPoll, pollIntervalMs);

    // Call once immediately
    await tryPoll();

    // Setup timeout safety net
    pollingTimeoutRef.current = setTimeout(() => {
      if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
      if (status !== 'success') {
        setStatus('timeout');
        setError(
          'Не вдалось синхронізувати контакт. Перевірте що ви підтвердили номер у Telegram і спробуйте ще раз.'
        );
      }
    }, maxAttempts * pollIntervalMs + 2000);
  }

  function handleRetry() {
    if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
    if (pollingTimeoutRef.current) clearTimeout(pollingTimeoutRef.current);
    setStatus('idle');
    setError(null);
    setPollingAttempt(0);
  }

  const isLoading = status === 'polling';
  const showError = status === 'timeout' || status === 'error' || status === 'cancelled';
  const showSuccess = status === 'success';
  const isButtonDisabled = status === 'polling' || status === 'success';

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] p-6 text-center">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, type: 'spring' }}
        className="w-24 h-24 bg-sage/20 rounded-3xl flex items-center justify-center mb-8"
      >
        <Smartphone className="w-12 h-12 text-sage" />
      </motion.div>

      <motion.h1
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="heading-serif text-3xl text-foreground mb-4"
      >
        Вітаємо в BookIT!
      </motion.h1>

      <motion.p
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="text-muted-foreground mb-12 max-w-[280px]"
      >
        Для швидкого запису та керування вашими візитами, будь ласка, підтвердіть свій номер телефону.
      </motion.p>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="w-full space-y-4 px-4"
      >
        <button
          onClick={handleShareContact}
          disabled={isButtonDisabled}
          className="w-full h-[60px] bg-[#789A99] text-white rounded-2xl flex items-center justify-center gap-3 font-bold text-lg active:scale-95 transition-all disabled:opacity-50 shadow-lg shadow-sage/20 border border-white/20"
        >
          {isLoading ? (
            <>
              <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>
                Синхронізація... {pollingAttempt}/{pollingMax}
              </span>
            </>
          ) : showSuccess ? (
            <>
              <div className="w-6 h-6 flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-white animate-pulse"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <span>Успішно!</span>
            </>
          ) : (
            <>
              <Share2 size={22} className="text-white" />
              <span>Підтвердити номер</span>
            </>
          )}
        </button>

        <AnimatePresence>
          {showError && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-error/10 border border-error/20 p-4 rounded-xl space-y-3"
            >
              <p className="text-error text-sm font-medium">{error}</p>

              <button
                onClick={handleRetry}
                className="w-full h-12 bg-error/20 hover:bg-error/30 text-error rounded-lg flex items-center justify-center gap-2 font-medium transition-all active:scale-95"
              >
                <RotateCw size={16} />
                <span>Спробувати ще раз</span>
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground/60 mt-4">
          <ShieldCheck size={14} />
          <span>Ми використовуємо захищений запит Telegram</span>
        </div>
      </motion.div>

      {/* Debug info (can be removed in production) */}
      {isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-12 text-[10px] text-muted-foreground/50 text-center max-w-[280px]"
        >
          <p>Чекаємо підтвердження контакту від Telegram...</p>
          <p className="mt-1">Залишилось спроб: {pollingMax - pollingAttempt}</p>
        </motion.div>
      )}
    </div>
  );
}
