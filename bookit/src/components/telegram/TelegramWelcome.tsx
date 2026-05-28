'use client';

import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Share2, Smartphone, ShieldCheck, Phone, MessageCircle } from 'lucide-react';

export interface TelegramLinkSuccessPayload {
  email?: string;
  token?: string;
  initData?: string;
  role?: 'client' | 'master';
}

interface TelegramWelcomeProps {
  onSuccess: (payload: TelegramLinkSuccessPayload) => void;
}

type FlowStatus =
  | 'idle'           // before button press
  | 'requesting'     // tg.requestContact() called, waiting for native popup callback
  | 'polling'        // contact 'sent' acknowledged → polling /api/auth/telegram
  | 'success'        // magiclink ready, animating before onSuccess
  | 'cancelled'      // user dismissed native popup
  | 'timeout'        // polling exhausted without finding linked profile
  | 'error';         // misconfig or unexpected

const POPUP_CALLBACK_TIMEOUT_MS = 4_000;
const POLL_INTERVAL_MS = 1_500;
const POLL_MAX_ATTEMPTS = 30;

function getTelegramInitData(): string | undefined {
  const tg = window.Telegram?.WebApp;
  if (tg?.initDataRaw) return tg.initDataRaw;
  const params = new URLSearchParams(
    (window.location.hash + window.location.search).replace(/^#/, '')
  );
  return params.get('tgWebAppData') || params.get('TGWEBAPPDATA') || undefined;
}

function getBotName(): string {
  return (process.env.NEXT_PUBLIC_TELEGRAM_BOT_NAME || '').replace('@', '').trim();
}

export function TelegramWelcome({ onSuccess }: TelegramWelcomeProps) {
  const [userRole, setUserRole] = useState<'client' | 'master' | null>(null);
  const [status, setStatus] = useState<FlowStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [showBotFallback, setShowBotFallback] = useState(false);

  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const pollingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pollingStoppedRef = useRef(false);
  const popupTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const callbackFiredRef = useRef(false);

  const stopPolling = useCallback(() => {
    pollingStoppedRef.current = true;
    if (pollingIntervalRef.current) { clearTimeout(pollingIntervalRef.current); pollingIntervalRef.current = null; }
    if (pollingTimeoutRef.current) { clearTimeout(pollingTimeoutRef.current); pollingTimeoutRef.current = null; }
  }, []);

  const clearPopupTimeout = useCallback(() => {
    if (popupTimeoutRef.current) { clearTimeout(popupTimeoutRef.current); popupTimeoutRef.current = null; }
  }, []);

  // ── Polling ────────────────────────────────────────────────────────────────
  const startPolling = useCallback(async (initDataRaw: string) => {
    stopPolling();
    pollingStoppedRef.current = false;
    let attempts = 0;

    const tryPoll = async (): Promise<void> => {
      if (pollingStoppedRef.current) return;
      attempts++;

      try {
        const res = await fetch('/api/auth/telegram', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ initData: initDataRaw }),
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();

        if (data.success && data.token) {
          stopPolling();
          setStatus('success');
          setTimeout(() => {
            onSuccess({
              email: data.email,
              token: data.token,
              initData: initDataRaw,
              role: (data.user?.role as 'client' | 'master') ?? userRole ?? undefined,
            });
          }, 400);
          return;
        }

        // After 5 polls (~7.5s) without confirmation, surface the bot fallback so
        // user has an explicit escape hatch if Telegram never delivered the contact.
        if (attempts === 5) setShowBotFallback(true);

        if (attempts >= POLL_MAX_ATTEMPTS) {
          stopPolling();
          setStatus('timeout');
          setError('Не вдалось підтвердити контакт. Спробуйте ще раз або скористайтесь чатом бота.');
          setShowBotFallback(true);
          return;
        }
      } catch (err: unknown) {
        console.error(`[TelegramWelcome] Poll #${attempts} failed:`, err);
        if (attempts >= POLL_MAX_ATTEMPTS) {
          stopPolling();
          setStatus('timeout');
          setError("Помилка з'єднання. Спробуйте ще раз.");
          setShowBotFallback(true);
          return;
        }
      }

      if (!pollingStoppedRef.current) {
        pollingIntervalRef.current = setTimeout(() => { void tryPoll(); }, POLL_INTERVAL_MS);
      }
    };

    pollingTimeoutRef.current = setTimeout(() => {
      if (pollingStoppedRef.current) return;
      stopPolling();
      setStatus('timeout');
      setError('Час очікування вичерпано.');
      setShowBotFallback(true);
    }, POLL_MAX_ATTEMPTS * POLL_INTERVAL_MS + 2_000);

    await tryPoll();
  }, [onSuccess, stopPolling, userRole]);

  // ── Fallback: open bot chat with /start <param> for bot-keyboard flow ──────
  const openBotFallback = useCallback(() => {
    const tg = window.Telegram?.WebApp;
    const botName = getBotName();
    if (!botName) {
      setStatus('error');
      setError('Username бота не налаштований (NEXT_PUBLIC_TELEGRAM_BOT_NAME).');
      return;
    }

    const startParam = userRole === 'master' ? 'share_phone_master' : 'share_phone_client';
    const botLink = `https://t.me/${botName}?start=${startParam}`;

    const initData = getTelegramInitData();
    if (initData) {
      // Keep polling so when bot-keyboard contact arrives, we'll detect it.
      if (status !== 'polling') {
        setStatus('polling');
        void startPolling(initData);
      }
    }

    try {
      if (tg && typeof tg.openTelegramLink === 'function') {
        tg.openTelegramLink(botLink);
      } else if (tg && typeof tg.openLink === 'function') {
        tg.openLink(botLink);
      } else {
        window.open(botLink, '_blank');
      }
    } catch {
      window.open(botLink, '_blank');
    }
  }, [startPolling, status, userRole]);

  // ── Main button: native TMA popup → on confirm → polling ───────────────────
  const handleShareContact = useCallback(async () => {
    if (status !== 'idle' && status !== 'cancelled' && status !== 'timeout' && status !== 'error') return;

    const tg = window.Telegram?.WebApp;
    if (!tg) {
      setStatus('error');
      setError('Telegram WebApp недоступний. Перезавантажте додаток.');
      return;
    }

    const initData = getTelegramInitData();
    if (!initData) {
      setStatus('error');
      setError('Не вдалось отримати дані Telegram. Перезавантажте додаток.');
      return;
    }

    setError(null);
    setShowBotFallback(false);
    callbackFiredRef.current = false;

    try { tg.HapticFeedback?.impactOccurred?.('medium'); } catch {}

    // Pre-flight: log role intent so the bot webhook (which fires moments later
    // when contact arrives) knows whether to create a 'master' or 'client' profile.
    // Non-blocking — UX continues even if this fails.
    if (userRole) {
      void fetch('/api/auth/telegram/intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ initData, role: userRole }),
      }).catch(() => { /* soft-fail */ });
    }

    // Path A: native requestContact in TMA
    if (typeof tg.requestContact === 'function') {
      setStatus('requesting');

      // Safety: if Telegram client never invokes the callback (older client, missing
      // permission), surface bot fallback so user isn't stuck.
      popupTimeoutRef.current = setTimeout(() => {
        if (callbackFiredRef.current) return;
        console.warn('[TelegramWelcome] requestContact callback timeout — showing bot fallback');
        setStatus('error');
        setError('Запит не відобразився. Підтвердіть номер через чат бота.');
        setShowBotFallback(true);
      }, POPUP_CALLBACK_TIMEOUT_MS);

      // Telegram changed callback signature across versions:
      //   v6.9–v7.x: callback({ status: 'sent' | 'cancelled' })
      //   v8+:       callback(boolean, response)
      // Handle both defensively.
      tg.requestContact((arg1: unknown) => {
        callbackFiredRef.current = true;
        clearPopupTimeout();

        let isSent = false;
        if (typeof arg1 === 'boolean') {
          isSent = arg1;
        } else if (arg1 && typeof arg1 === 'object' && 'status' in arg1) {
          isSent = (arg1 as { status: string }).status === 'sent';
        }
        console.log('[TelegramWelcome] requestContact callback:', { arg1, isSent });

        if (isSent) {
          try { tg.HapticFeedback?.notificationOccurred?.('success'); } catch {}
          setStatus('polling');
          void startPolling(initData);
        } else {
          try { tg.HapticFeedback?.notificationOccurred?.('warning'); } catch {}
          setStatus('cancelled');
          setError('Ви відхилили запит. Натисніть кнопку, щоб спробувати знову, або підтвердіть через чат бота.');
          setShowBotFallback(true);
        }
      });
      return;
    }

    // Path B: requestContact unavailable (older client) → bot deep link + polling
    console.warn('[TelegramWelcome] tg.requestContact unavailable — falling back to bot link');
    setStatus('polling');
    void startPolling(initData);
    openBotFallback();
  }, [clearPopupTimeout, openBotFallback, startPolling, status, userRole]);

  function handleRetry() {
    stopPolling();
    clearPopupTimeout();
    pollingStoppedRef.current = false;
    callbackFiredRef.current = false;
    setStatus('idle');
    setError(null);
    setShowBotFallback(false);
  }

  const isWorking = status === 'requesting' || status === 'polling';
  const showError = status === 'cancelled' || status === 'timeout' || status === 'error';
  const showSuccess = status === 'success';

  // ── Role selector ──────────────────────────────────────────────────────────
  if (userRole === null) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] p-6 text-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, type: 'spring' }}
          className="w-20 h-20 bg-sage/20 rounded-[28px] flex items-center justify-center mb-8"
        >
          <Smartphone className="w-10 h-10 text-sage" />
        </motion.div>

        <motion.h1
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="heading-serif text-3xl text-foreground mb-3"
        >
          Вітаємо в BookIT!
        </motion.h1>

        <motion.p
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-muted-foreground mb-10 max-w-[280px] text-sm leading-relaxed"
        >
          Оберіть вашу роль для налаштування персонального кабінету
        </motion.p>

        <div className="grid grid-cols-1 gap-4 w-full px-2 max-w-[320px]">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setUserRole('master')}
            className="group relative overflow-hidden bg-white/50 border border-white/60 p-5 rounded-[24px] flex items-center gap-4 transition-all hover:bg-white/80 hover:border-white shadow-sm"
          >
            <div className="w-14 h-14 bg-sage text-white rounded-2xl flex items-center justify-center shadow-lg shadow-sage/20 group-hover:scale-105 transition-transform duration-500">
              <Smartphone className="w-7 h-7" />
            </div>
            <div className="text-left">
              <h3 className="text-lg font-bold text-sage leading-tight">Я Майстер</h3>
              <p className="text-[11px] text-muted-foreground/80 mt-0.5">Керування графіком та клієнтами</p>
            </div>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setUserRole('client')}
            className="group relative overflow-hidden bg-white/50 border border-white/60 p-5 rounded-[24px] flex items-center gap-4 transition-all hover:bg-white/80 hover:border-white shadow-sm"
          >
            <div className="w-14 h-14 bg-white text-sage rounded-2xl flex items-center justify-center shadow-lg shadow-black/5 group-hover:scale-105 transition-transform duration-500">
              <Phone className="w-7 h-7" />
            </div>
            <div className="text-left">
              <h3 className="text-lg font-bold text-foreground leading-tight">Я Клієнт</h3>
              <p className="text-[11px] text-muted-foreground/80 mt-0.5">Запис до улюблених майстрів</p>
            </div>
          </motion.button>

          <p className="text-[10px] text-muted-foreground/30 mt-6 uppercase tracking-[0.2em] font-bold">
            Ви зможете змінити роль пізніше
          </p>
        </div>
      </div>
    );
  }

  // ── Auth screen ────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] p-6 text-center">
      <AnimatePresence mode="popLayout">
        <motion.div
          key="auth-screen"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="w-full max-w-[320px] flex flex-col items-center"
        >
          <div className="w-20 h-20 bg-sage/10 rounded-[28px] flex items-center justify-center mb-8">
            <ShieldCheck className="w-10 h-10 text-sage/60" />
          </div>

          <h2 className="heading-serif text-2xl text-foreground mb-2">
            Підтвердіть номер
          </h2>
          <p className="text-muted-foreground mb-10 text-sm leading-relaxed px-4">
            Telegram надішле ваш контакт боту BookIT. Ви побачите нативне підтвердження.
          </p>

          <div className="w-full space-y-4">
            <button
              onClick={handleShareContact}
              disabled={isWorking}
              className="w-full h-[64px] bg-sage text-white rounded-2xl flex items-center justify-center gap-3 font-bold text-lg active:scale-95 transition-all disabled:opacity-80 shadow-xl shadow-sage/20 border border-white/20"
            >
              {status === 'requesting' ? (
                <>
                  <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Чекаємо підтвердження...</span>
                </>
              ) : status === 'polling' ? (
                <>
                  <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Перевіряємо...</span>
                </>
              ) : showSuccess ? (
                <>
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                    <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </motion.div>
                  <span>Готово!</span>
                </>
              ) : (
                <>
                  <Share2 size={22} className="text-white" />
                  <span>Увійти автоматично</span>
                </>
              )}
            </button>

            <AnimatePresence>
              {showError && error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-error/10 border border-error/10 p-4 rounded-xl"
                >
                  <p className="text-error text-xs font-medium mb-3">{error}</p>
                  <button
                    onClick={handleRetry}
                    className="w-full h-10 bg-error/20 text-error rounded-lg text-xs font-bold uppercase tracking-widest transition-all active:scale-95"
                  >
                    Спробувати ще раз
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {showBotFallback && status !== 'success' && (
                <motion.button
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  onClick={openBotFallback}
                  className="w-full h-12 bg-white/60 border border-white/80 text-foreground rounded-xl flex items-center justify-center gap-2 text-sm font-semibold active:scale-95 transition-all"
                >
                  <MessageCircle size={18} className="text-sage" />
                  <span>Підтвердити через чат бота</span>
                </motion.button>
              )}
            </AnimatePresence>
          </div>

          <div className="flex items-center justify-center gap-2 text-[10px] text-muted-foreground/40 mt-12 uppercase tracking-widest font-bold">
            <ShieldCheck size={12} />
            <span>Захищено Telegram</span>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
