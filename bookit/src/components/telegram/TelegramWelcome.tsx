'use client';

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Share2, Smartphone, ShieldCheck, RotateCw, Phone } from 'lucide-react';
import { parseError } from '@/lib/utils/errors';

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
  const [userRole, setUserRole] = useState<'client' | 'master' | null>(null);
  const [status, setStatus] = useState<PollingStatus>('idle');
  const [activeTab, setActiveTab] = useState<TabType>('contact');
  const [error, setError] = useState<string | null>(null);
  const [pollingAttempt, setPollingAttempt] = useState(0);
  const [pollingMax, setPollingMax] = useState(10);
  const [manualPhone, setManualPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const pollingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pollingStoppedRef = useRef(false);

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
      return;
    }

    setStatus('polling');
    setError(null);
    setPollingAttempt(0);
    setPollingMax(30);

    tg.HapticFeedback.impactOccurred('medium');

    try {
      const initData = getTelegramInitData();

      if (!initData) {
        setStatus('error');
        setError('Помилка: не вдалось отримати дані Telegram. Перезавантажте додаток.');
        return;
      }

      const roleParam = userRole === 'master' ? 'share_phone_master' : 'share_phone_client';
      const botLink = `https://t.me/${botName}?start=${roleParam}`;

      // Start polling IMMEDIATELY so we catch the webhook even if the SDK callback is flaky
      setStatus('polling');
      setTimeout(() => {
        void startPolling(initData);
      }, 500);

      if (typeof tg.requestContact === 'function') {
        tg.requestContact((result) => {
          // We don't stop polling here anymore, startPolling is already running
        });
        return;
      }

      try {
        if (typeof tg.openLink === 'function') {
          tg.openLink(botLink);
        } else if (typeof tg.openTelegramLink === 'function') {
          tg.openTelegramLink(botLink);
        } else {
          window.open(botLink, '_blank');
        }
      } catch (openLinkErr) {
        window.open(botLink, '_blank');
      }
      
      setError('У чаті з ботом натисніть "Поділитися номером", потім поверніться в BookIT кнопку з повідомлення бота.');

      setTimeout(() => {
        void startPolling(initData);
      }, 1500);
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'Unknown error';
      console.error('[TelegramWelcome] Error opening bot chat:', errMsg, err);
      setStatus('error');
      setError(`Не вдалося відкрити чат бота: ${errMsg}`);
    }
  }

  async function startPolling(initDataRaw: string) {
    if (pollingIntervalRef.current) clearTimeout(pollingIntervalRef.current);
    if (pollingTimeoutRef.current) clearTimeout(pollingTimeoutRef.current);

    pollingStoppedRef.current = false;
    let attempts = 0;
    const maxAttempts = 30;
    const pollIntervalMs = 1500;


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

      try {
        const res = await fetch('/api/auth/telegram', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ initData: initDataRaw, role: userRole }),
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
            });
          }, 500);
          return;
        }

        if (data.status === 'NEED_PHONE' || data.status === 'WAITING_FOR_PHONE') {
          if (attempts === CONTACT_FALLBACK_ATTEMPT) {
            setActiveTab('manual');
            setStatus('manual_input');
            setError('Telegram не передав контакт боту. Введіть номер вручну, щоб продовжити без затримки.');
            stopPolling();
            return;
          }

          if (attempts >= maxAttempts) {
            stopPolling();
            setStatus('timeout');
            setError('Контакт не синхронізувався. Спробуйте вручну ввести номер.');
            return;
          }
        }
      } catch (err: unknown) {
        console.error(`[TelegramWelcome] Poll attempt ${attempts} failed:`, err);
        if (attempts >= maxAttempts) {
          stopPolling();
          setStatus('timeout');
          setError('Контакт не синхронізувався. Спробуйте вручну ввести номер.');
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
          role: userRole,
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
      const message = parseError(err);
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
  }

  const isLoading = status === 'polling' || isSubmitting;
  const showError = status === 'timeout' || status === 'error' || status === 'cancelled';
  const showSuccess = status === 'success';

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

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] p-6 text-center">
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="w-full max-w-[320px] flex flex-col items-center"
        >
          <div className="w-20 h-20 bg-sage/10 rounded-[28px] flex items-center justify-center mb-8">
            <ShieldCheck className="w-10 h-10 text-sage/60" />
          </div>

          <h2 className="heading-serif text-2xl text-foreground mb-2">
            Підтвердіть номер
          </h2>
          <p className="text-muted-foreground mb-10 text-sm leading-relaxed px-4">
            Це необхідно для безпечного доступу до вашого профілю
          </p>

          <div className="w-full space-y-6">
            {activeTab === 'contact' ? (
              <div className="space-y-6">
                <button
                  onClick={handleShareContact}
                  disabled={isLoading}
                  className="w-full h-[64px] bg-sage text-white rounded-2xl flex items-center justify-center gap-3 font-bold text-lg active:scale-95 transition-all disabled:opacity-80 shadow-xl shadow-sage/20 border border-white/20"
                >
                  {status === 'polling' ? (
                    <>
                      <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Налаштовуємо...</span>
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
                
                <button
                  onClick={() => setActiveTab('manual')}
                  disabled={isLoading}
                  className="text-xs font-bold text-sage/60 uppercase tracking-widest hover:text-sage transition-colors"
                >
                  Ввести номер вручну
                </button>
              </div>
            ) : (
              <form onSubmit={handleManualSubmit} className="space-y-6 w-full">
                <div className="relative">
                  <input
                    type="tel"
                    placeholder="+380 (__) ___-__-__"
                    value={manualPhone}
                    onChange={(e) => setManualPhone(e.target.value)}
                    disabled={isSubmitting}
                    className="w-full h-[64px] px-6 border border-sage/20 rounded-2xl font-bold text-xl bg-white/50 focus:bg-white focus:outline-none focus:border-sage transition-all text-center placeholder:text-muted-foreground/30"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || manualPhone.replace(/\D/g, '').length < 10}
                  className="w-full h-[64px] bg-sage text-white rounded-2xl flex items-center justify-center gap-3 font-bold text-lg active:scale-95 transition-all disabled:opacity-50 shadow-xl shadow-sage/20 border border-white/20"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Обробка...</span>
                    </>
                  ) : (
                    <span>Продовжити</span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('contact')}
                  className="text-xs font-bold text-sage/60 uppercase tracking-widest hover:text-sage transition-colors"
                >
                  Повернутись назад
                </button>
              </form>
            )}

            <AnimatePresence>
              {showError && (
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
