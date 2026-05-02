'use client';

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Share2, Smartphone, ShieldCheck, RotateCw, Phone } from 'lucide-react';

export interface TelegramLinkSuccessPayload {
  email?: string;
  token?: string;
  initData?: string;
}

interface TelegramWelcomeProps {
  onSuccess: (payload: TelegramLinkSuccessPayload) => void;
}

type PollingStatus = 'idle' | 'polling' | 'success' | 'timeout' | 'cancelled' | 'error' | 'manual_input';
type TabType = 'contact' | 'manual';
const CONTACT_FALLBACK_ATTEMPT = 3;
const CONTACT_BOT_START_PARAM = 'share_phone';

export function TelegramWelcome({ onSuccess }: TelegramWelcomeProps) {
  const [status, setStatus] = useState<PollingStatus>('idle');
  const [activeTab, setActiveTab] = useState<TabType>('contact');
  const [error, setError] = useState<string | null>(null);
  const [pollingAttempt, setPollingAttempt] = useState(0);
  const [pollingMax, setPollingMax] = useState(10);
  const [manualPhone, setManualPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string[]>([]);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const pollingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pollingStoppedRef = useRef(false);

  function pushDebug(message: string) {
    setDebugInfo((current) => {
      const next = [...current, `${new Date().toLocaleTimeString('uk-UA', { hour12: false })} ${message}`];
      return next;
    });
  }

  function getTelegramInitData(): string | undefined {
    const tg = window.Telegram?.WebApp;
    if (tg?.initDataRaw) return tg.initDataRaw;

    const fullUrl = window.location.hash + window.location.search;
    const params = new URLSearchParams(fullUrl.replace(/^#/, ''));
    return params.get('tgWebAppData') || params.get('TGWEBAPPDATA') || undefined;
  }

  async function handleShareContact() {
    if (status !== 'idle' && status !== 'timeout' && status !== 'error') return;

    const tg = window.Telegram?.WebApp;
    const rawBotName = process.env.NEXT_PUBLIC_TELEGRAM_BOT_NAME || '';
    const botName = rawBotName.replace('@', '').trim();

    if (!tg || !botName) {
      setStatus('error');
      const errorMsg = !tg ? 'Telegram WebApp недоступний' : 'Username бота (NEXT_PUBLIC_TELEGRAM_BOT_NAME) не налаштований';
      setError(errorMsg);
      pushDebug(errorMsg);
      return;
    }

    setStatus('polling');
    setError(null);
    setPollingAttempt(0);
    setPollingMax(10);
    setDebugInfo([]);
    pushDebug(`init flow: bot=@${botName}, tg.initDataRaw=${tg.initDataRaw ? 'yes' : 'no'}`);

    tg.HapticFeedback.impactOccurred('medium');

    try {
      const initData = getTelegramInitData();
      pushDebug(`initData available: ${initData ? 'yes' : 'no'}`);

      if (!initData) {
        setStatus('error');
        setError('Помилка: не вдалось отримати дані Telegram. Перезавантажте додаток.');
        pushDebug('missing initData for contact flow');
        return;
      }

      const botLink = `https://t.me/${botName}?start=${CONTACT_BOT_START_PARAM}`;
      pushDebug(`opening bot link: ${botLink}`);
      
      try {
        if (typeof tg.openLink === 'function') {
          tg.openLink(botLink);
        } else if (typeof tg.openTelegramLink === 'function') {
          tg.openTelegramLink(botLink);
        } else {
          pushDebug('SDK link methods missing, using window.open');
          window.open(botLink, '_blank');
        }
      } catch (openLinkErr) {
        pushDebug(`SDK link failed: ${openLinkErr instanceof Error ? openLinkErr.message : 'Unknown'}`);
        window.open(botLink, '_blank');
      }
      
      setError('У чаті з ботом натисніть "Поділитися номером", потім поверніться в BookIT кнопку з повідомлення бота.');

      setTimeout(() => {
        pushDebug('starting polling...');
        void startPolling(initData);
      }, 1500);
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'Unknown error';
      console.error('[TelegramWelcome] Error opening bot chat:', errMsg, err);
      setStatus('error');
      setError(`Не вдалося відкрити чат бота: ${errMsg}`);
      pushDebug(`open bot error: ${errMsg}`);
    }
  }

  async function startPolling(initDataRaw: string) {
    if (pollingIntervalRef.current) clearTimeout(pollingIntervalRef.current);
    if (pollingTimeoutRef.current) clearTimeout(pollingTimeoutRef.current);

    pollingStoppedRef.current = false;
    let attempts = 0;
    const maxAttempts = 10;
    const pollIntervalMs = 1000;

    pushDebug(`polling initiated, initDataRaw=${initDataRaw ? 'yes' : 'no'}`);

    const stopPolling = () => {
      pollingStoppedRef.current = true;
      if (pollingIntervalRef.current) {
        clearTimeout(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
      if (pollingTimeoutRef.current) {
        clearTimeout(pollingTimeoutRef.current);
        pollingTimeoutRef.current = null;
      }
    };

    const tryPoll = async (): Promise<void> => {
      if (pollingStoppedRef.current) return;
      attempts++;
      setPollingAttempt(attempts);
      pushDebug(`poll attempt ${attempts}/${maxAttempts}`);

      try {
        const res = await fetch('/api/auth/telegram', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ initData: initDataRaw }),
        });

        pushDebug(`poll response status=${res.status}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const data = await res.json();
        pushDebug(`poll payload: ${data.status || (data.success ? 'success' : 'unknown')}`);

        if (data.success && data.token) {
          stopPolling();

          setStatus('success');
          setTimeout(() => {
            onSuccess({
              email: data.email,
              token: data.token,
              initData: initDataRaw,
            });
          }, 500);
          return;
        }

        if (data.status === 'NEED_PHONE' || data.status === 'WAITING_FOR_PHONE') {
          if (attempts === CONTACT_FALLBACK_ATTEMPT) {
            setActiveTab('manual');
            setStatus('manual_input');
            setError('Telegram не передав контакт боту. Введіть номер вручну, щоб продовжити без затримки.');
            pushDebug('switching to manual fallback');
            stopPolling();
            return;
          }

          if (attempts >= maxAttempts) {
            stopPolling();
            setStatus('timeout');
            setError('Контакт не синхронізувався. Спробуйте вручну ввести номер.');
            pushDebug('polling timeout');
            return;
          }
        }
      } catch (err: unknown) {
        console.error(`[TelegramWelcome] Poll attempt ${attempts} failed:`, err);
        pushDebug(`poll error on attempt ${attempts}`);
        if (attempts >= maxAttempts) {
          stopPolling();
          setStatus('timeout');
          setError('Контакт не синхронізувався. Спробуйте вручну ввести номер.');
          pushDebug('polling timeout');
          return;
        }
      }

      if (!pollingStoppedRef.current) {
        pollingIntervalRef.current = setTimeout(() => {
          void tryPoll();
        }, pollIntervalMs);
      }
    };

    pollingTimeoutRef.current = setTimeout(() => {
      if (pollingStoppedRef.current) return;
      stopPolling();
      setStatus('timeout');
      setError('Контакт не синхронізувався. Спробуйте вручну ввести номер.');
      pushDebug('polling timeout');
    }, maxAttempts * pollIntervalMs + 2000);

    await tryPoll();
  }

  async function handleManualSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (isSubmitting) return;

    const phone = manualPhone.replace(/\D/g, '');
    if (phone.length < 10) {
      setError('Номер повинен мати мінімум 10 цифр');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const tg = window.Telegram?.WebApp;

    // Get initData from various sources
    let initData: string | undefined;

    // Try tg.initDataRaw first
    if (tg?.initDataRaw) {
      initData = tg.initDataRaw;
    } else {
      // Try to extract from URL parameters
      const fullUrl = (window.location.hash + window.location.search);
      const params = new URLSearchParams(fullUrl.replace(/^#/, ''));
      initData = params.get('tgWebAppData') || params.get('TGWEBAPPDATA') || undefined;
    }

    if (!initData) {
      setError('Помилка: не вдалось отримати дані Telegram. Перезавантажте додаток.');
      setIsSubmitting(false);
      return;
    }

    console.log('[TelegramWelcome] Manual submit: phone=', phone, 'initData length=', initData.length);

    try {
      const res = await fetch('/api/auth/telegram/link-phone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          initData: initData,
          phone: phone,
        }),
      });

      console.log('[TelegramWelcome] link-phone response:', res.status);

      if (!res.ok) {
        let errorMsg = 'Помилка при зв\'язуванні номера';
        try {
          const data = await res.json();
          errorMsg = data.error || errorMsg;
        } catch {
          // response is not JSON
        }
        throw new Error(errorMsg);
      }

      const data = await res.json();
      console.log('[TelegramWelcome] link-phone success:', !!data.token);

      if (data.success && data.token) {
        setStatus('success');
        setTimeout(() => {
          onSuccess({
            email: data.email,
            token: data.token,
            initData,
          });
        }, 500);
      } else {
        throw new Error(data.error || 'Невірна відповідь від сервера');
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : 'Помилка при зв\'язуванні номера. Спробуйте ще раз.';
      console.error('[TelegramWelcome] Manual link error:', message, err);
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleRetry() {
    if (pollingIntervalRef.current) clearTimeout(pollingIntervalRef.current);
    if (pollingTimeoutRef.current) clearTimeout(pollingTimeoutRef.current);
    pollingStoppedRef.current = false;
    setStatus('idle');
    setError(null);
    setPollingAttempt(0);
    setDebugInfo([]);
  }

  const isLoading = status === 'polling' || isSubmitting;
  const showError = status === 'timeout' || status === 'error' || status === 'cancelled';
  const showSuccess = status === 'success';

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
        className="heading-serif text-3xl text-foreground mb-2"
      >
        Вітаємо в BookIT!
      </motion.h1>

      <motion.p
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="text-muted-foreground mb-8 max-w-[280px] text-sm"
      >
        Для запису та керування візитами підтвердіть номер телефону.
      </motion.p>

      {/* Tabs */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.35 }}
        className="w-full flex gap-2 mb-8 px-4"
      >
        <button
          onClick={() => {
            setActiveTab('contact');
            setError(null);
          }}
          className={`flex-1 py-2 px-3 rounded-lg font-medium text-sm transition-all ${
            activeTab === 'contact'
              ? 'bg-sage text-white'
              : 'bg-sage/10 text-sage hover:bg-sage/20'
          }`}
        >
          <Share2 className="w-4 h-4 inline mr-2" />
          Контакт
        </button>
        <button
          onClick={() => {
            setActiveTab('manual');
            setError(null);
          }}
          className={`flex-1 py-2 px-3 rounded-lg font-medium text-sm transition-all ${
            activeTab === 'manual'
              ? 'bg-sage text-white'
              : 'bg-sage/10 text-sage hover:bg-sage/20'
          }`}
        >
          <Phone className="w-4 h-4 inline mr-2" />
          Вручну
        </button>
      </motion.div>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="w-full space-y-4 px-4"
      >
        {/* Contact Tab */}
        <AnimatePresence>
          {activeTab === 'contact' && (
            <motion.div
              key="contact"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              <button
                onClick={handleShareContact}
                disabled={isLoading}
                className="w-full h-[60px] bg-[#789A99] text-white rounded-2xl flex items-center justify-center gap-3 font-bold text-lg active:scale-95 transition-all disabled:opacity-50 shadow-lg shadow-sage/20 border border-white/20"
              >
                {status === 'polling' ? (
                  <>
                    <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Синхронізація... {pollingAttempt}/{pollingMax}</span>
                  </>
                ) : showSuccess ? (
                  <>
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
                    <span>Успішно!</span>
                  </>
                ) : (
                  <>
                    <Share2 size={22} className="text-white" />
                    <span>Через чат бота</span>
                  </>
                )}
              </button>
              <p className="text-xs leading-relaxed text-muted-foreground">
                Відкриємо чат з ботом, де Telegram попросить поділитися контактом стандартною кнопкою.
              </p>
            </motion.div>
          )}

          {/* Manual Tab */}
          {activeTab === 'manual' && (
            <motion.form
              key="manual"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onSubmit={handleManualSubmit}
              className="space-y-4"
            >
              <input
                type="tel"
                placeholder="+380 (67) 123-45-67"
                value={manualPhone}
                onChange={(e) => setManualPhone(e.target.value)}
                disabled={isSubmitting}
                className="w-full h-[60px] px-4 py-3 border border-sage/20 rounded-2xl font-bold text-lg bg-white/50 placeholder-muted-foreground/50 focus:outline-none focus:border-sage focus:bg-white transition-all"
              />

              <button
                type="submit"
                disabled={isSubmitting || manualPhone.replace(/\D/g, '').length < 10}
                className="w-full h-[60px] bg-[#789A99] text-white rounded-2xl flex items-center justify-center gap-3 font-bold text-lg active:scale-95 transition-all disabled:opacity-50 shadow-lg shadow-sage/20 border border-white/20"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Обробка...</span>
                  </>
                ) : (
                  <>
                    <Phone size={22} className="text-white" />
                    <span>Продовжити</span>
                  </>
                )}
              </button>
            </motion.form>
          )}
        </AnimatePresence>

        {/* Error */}
        <AnimatePresence>
          {showError && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-error/10 border border-error/20 p-4 rounded-xl space-y-3"
            >
              <p className="text-error text-sm font-medium">{error}</p>
              <div className="flex gap-2">
                <button
                  onClick={handleRetry}
                  className="flex-1 h-12 bg-error/20 hover:bg-error/30 text-error rounded-lg flex items-center justify-center gap-2 font-medium transition-all active:scale-95"
                >
                  <RotateCw size={16} />
                  <span>Ще раз</span>
                </button>
                {activeTab === 'manual' && (
                  <button
                    onClick={() => setActiveTab('contact')}
                    className="flex-1 h-12 bg-sage/20 hover:bg-sage/30 text-sage rounded-lg font-medium transition-all active:scale-95"
                  >
                    Контакт
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground/60 mt-4">
          <ShieldCheck size={14} />
          <span>Ваш номер захищено Telegram</span>
        </div>

        {activeTab === 'contact' && debugInfo.length > 0 && (
          <div className="rounded-2xl border border-sage/15 bg-white/50 p-4 text-left">
            <p className="mb-2 text-[11px] font-black uppercase tracking-[0.2em] text-sage/70">
              Debug Contact Flow
            </p>
            <div className="space-y-1 font-mono text-[11px] text-sage/80">
              {debugInfo.map((item) => (
                <div key={item}>{item}</div>
              ))}
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
