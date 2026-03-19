'use client';

import { useState, useRef, useEffect, KeyboardEvent, ClipboardEvent } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Loader2, Phone, MessageSquare } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { createClient } from '@/lib/supabase/client';
import { GoogleIcon } from '@/components/icons/GoogleIcon';
import { formatPhoneDisplay, normalizePhoneInput, toFullPhone } from '@/lib/utils/phone';

interface Props {
  mode: 'login' | 'register';
}

export function PhoneOtpForm({ mode }: Props) {
  const router = useRouter();
  const supabase = createClient();

  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phone, setPhone] = useState('');
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const digitRefs = useRef<(HTMLInputElement | null)[]>([]);
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => () => { if (cooldownRef.current) clearInterval(cooldownRef.current); }, []);

  function handlePhoneChange(val: string) {
    setPhone(normalizePhoneInput(val));
    setError('');
  }

  function getCleanPhone() {
    return toFullPhone(phone);
  }

  // ── Крок 1: Відправка SMS ────────────────────────────────────────────────
  async function handleSendSms() {
    if (phone.length < 9) {
      setError('Введіть повний номер телефону');
      return;
    }
    setLoading(true);
    setError('');

    const res = await fetch('/api/auth/send-sms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: getCleanPhone() }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error || 'Помилка відправки SMS');
      return;
    }

    setStep('otp');
    startResendCooldown();
  }

  // ── Крок 2: Верифікація OTP ──────────────────────────────────────────────
  async function handleVerifyOtp() {
    const otp = digits.join('');
    if (otp.length < 6) {
      setError('Введіть 6-значний код');
      return;
    }
    setLoading(true);
    setError('');

    const res = await fetch('/api/auth/verify-sms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: getCleanPhone(), otp }),
    });

    const data = await res.json();

    if (!res.ok) {
      setLoading(false);
      setError(data.error || 'Невірний код');
      setDigits(['', '', '', '', '', '']);
      digitRefs.current[0]?.focus();
      return;
    }

    const { data: authData, error: authError } = await supabase.auth.verifyOtp({
      email: data.email,
      token: data.token,
      type: 'magiclink',
    });

    if (authError || !authData.session) {
      setLoading(false);
      setError('Помилка авторизації. Спробуйте знову.');
      return;
    }

    router.push(data.isNew ? '/dashboard/onboarding' : '/dashboard');
    router.refresh();
  }

  // ── OTP Input handlers ───────────────────────────────────────────────────
  function handleDigitChange(index: number, val: string) {
    const char = val.replace(/\D/g, '').slice(-1);
    const next = [...digits];
    next[index] = char;
    setDigits(next);
    setError('');
    if (char && index < 5) digitRefs.current[index + 1]?.focus();
    if (next.every(d => d !== '') && char) {
      // Auto-submit when all filled
      setTimeout(() => handleVerifyOtp(), 80);
    }
  }

  function handleDigitKeyDown(index: number, e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      digitRefs.current[index - 1]?.focus();
    }
  }

  function handleDigitPaste(e: ClipboardEvent<HTMLInputElement>) {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;
    const next = [...digits];
    pasted.split('').forEach((c, i) => { if (i < 6) next[i] = c; });
    setDigits(next);
    const lastFilled = Math.min(pasted.length, 5);
    digitRefs.current[lastFilled]?.focus();
  }

  // ── Cooldown для re-send ─────────────────────────────────────────────────
  function startResendCooldown() {
    if (cooldownRef.current) clearInterval(cooldownRef.current);
    setResendCooldown(60);
    cooldownRef.current = setInterval(() => {
      setResendCooldown(prev => {
        if (prev <= 1) { clearInterval(cooldownRef.current!); cooldownRef.current = null; return 0; }
        return prev - 1;
      });
    }, 1000);
  }

  async function handleResend() {
    if (resendCooldown > 0) return;
    setDigits(['', '', '', '', '', '']);
    setError('');
    setLoading(true);

    const res = await fetch('/api/auth/send-sms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: getCleanPhone() }),
    });

    setLoading(false);
    if (res.ok) startResendCooldown();
    else {
      const d = await res.json();
      setError(d.error || 'Помилка повторної відправки');
    }
  }

  async function handleGoogleLogin() {
    setIsGoogleLoading(true);
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=/dashboard`,
      },
    });
  }

  const isLogin = mode === 'login';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 24 }}
    >
      <Card>
        {/* Header */}
        <div className="mb-7 text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#789A99]/15 mb-4">
            {step === 'phone' ? (
              <Phone size={24} className="text-[#789A99]" />
            ) : (
              <MessageSquare size={24} className="text-[#789A99]" />
            )}
          </div>
          <h1 className="heading-serif text-2xl text-[#2C1A14] mb-1.5">
            {step === 'phone'
              ? isLogin ? 'Вхід у Bookit' : 'Реєстрація в Bookit'
              : 'Введіть код'}
          </h1>
          <p className="text-sm text-[#A8928D]">
            {step === 'phone'
              ? 'Введіть номер телефону — надішлемо SMS з кодом'
              : `Код надіслано на +38 ${formatPhoneDisplay(phone)}`}
          </p>
        </div>

        <AnimatePresence mode="wait">
          {/* ── Крок 1: Телефон ───────────────────────────────────────────── */}
          {step === 'phone' && (
            <motion.div
              key="phone"
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 16 }}
              transition={{ duration: 0.2 }}
            >
              {/* Google OAuth */}
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={isGoogleLoading}
                className="flex items-center justify-center gap-2.5 w-full py-4 px-6 rounded-2xl bg-white text-[#2C1A14] text-base font-semibold border border-[#E8D0C8] hover:border-[#D4B8AE] hover:shadow-md active:scale-[0.98] transition-all shadow-sm mb-5 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isGoogleLoading ? <Loader2 size={18} className="animate-spin" /> : <GoogleIcon />}
                Продовжити з Google
              </button>

              {/* Divider */}
              <div className="relative mb-5">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-[#E8D8D2]" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white/80 px-3 text-[#A8928D] tracking-wide">Або через SMS</span>
                </div>
              </div>

              <div className="mb-4">
                <div className="flex items-center gap-0 rounded-2xl border border-[#E8D0C8] bg-white overflow-hidden focus-within:border-[#789A99] focus-within:ring-2 focus-within:ring-[#789A99]/20 transition-all">
                  <span className="pl-4 pr-2 text-[#6B5750] font-medium text-base select-none shrink-0">
                    +38
                  </span>
                  <input
                    type="tel"
                    inputMode="numeric"
                    placeholder="0XX XXX XX XX"
                    value={formatPhoneDisplay(phone)}
                    onChange={e => handlePhoneChange(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSendSms()}
                    className="flex-1 py-4 pr-4 text-[#2C1A14] text-base bg-transparent outline-none placeholder:text-[#C4A89E]"
                    autoFocus
                    autoComplete="tel-national"
                  />
                </div>
                {error && (
                  <p className="mt-2 text-sm text-[#C05B5B] pl-1">{error}</p>
                )}
              </div>

              <button
                type="button"
                onClick={handleSendSms}
                disabled={loading || phone.length < 9}
                className="flex items-center justify-center gap-2 w-full py-4 rounded-2xl bg-[#789A99] text-white text-base font-semibold hover:bg-[#6a8988] active:scale-[0.98] transition-all shadow-lg shadow-[#789A99]/25 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? <Loader2 size={18} className="animate-spin" /> : null}
                {loading ? 'Відправляємо...' : 'Отримати код'}
              </button>

              <p className="text-center text-sm text-[#6B5750] mt-5">
                {isLogin ? (
                  <>Ще не зареєстровані?{' '}
                    <a href="/register" className="text-[#789A99] font-medium hover:underline">Створити акаунт</a>
                  </>
                ) : (
                  <>Вже є акаунт?{' '}
                    <a href="/login" className="text-[#789A99] font-medium hover:underline">Увійти</a>
                  </>
                )}
              </p>
            </motion.div>
          )}

          {/* ── Крок 2: OTP ───────────────────────────────────────────────── */}
          {step === 'otp' && (
            <motion.div
              key="otp"
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              transition={{ duration: 0.2 }}
            >
              {/* 6-digit boxes */}
              <div className="flex justify-center gap-2.5 mb-5">
                {digits.map((d, i) => (
                  <input
                    key={i}
                    ref={el => { digitRefs.current[i] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={d}
                    onChange={e => handleDigitChange(i, e.target.value)}
                    onKeyDown={e => handleDigitKeyDown(i, e)}
                    onPaste={i === 0 ? handleDigitPaste : undefined}
                    autoFocus={i === 0}
                    className="w-11 h-14 text-center text-xl font-bold text-[#2C1A14] rounded-2xl border-2 border-[#E8D0C8] bg-white outline-none focus:border-[#789A99] focus:ring-2 focus:ring-[#789A99]/20 transition-all caret-[#789A99]"
                  />
                ))}
              </div>

              {error && (
                <p className="mb-4 text-sm text-[#C05B5B] text-center">{error}</p>
              )}

              <button
                type="button"
                onClick={handleVerifyOtp}
                disabled={loading || digits.some(d => !d)}
                className="flex items-center justify-center gap-2 w-full py-4 rounded-2xl bg-[#789A99] text-white text-base font-semibold hover:bg-[#6a8988] active:scale-[0.98] transition-all shadow-lg shadow-[#789A99]/25 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? <Loader2 size={18} className="animate-spin" /> : null}
                {loading ? 'Перевіряємо...' : 'Підтвердити'}
              </button>

              {/* Back + resend */}
              <div className="flex items-center justify-between mt-5">
                <button
                  type="button"
                  onClick={() => {
                    setStep('phone');
                    setDigits(['', '', '', '', '', '']);
                    setError('');
                  }}
                  className="flex items-center gap-1.5 text-sm text-[#6B5750] hover:text-[#2C1A14] transition-colors"
                >
                  <ArrowLeft size={15} />
                  Змінити номер
                </button>

                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resendCooldown > 0}
                  className="text-sm text-[#789A99] font-medium disabled:text-[#A8928D] disabled:cursor-default hover:underline transition-colors"
                >
                  {resendCooldown > 0 ? `Повторно через ${resendCooldown}с` : 'Надіслати знову'}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </motion.div>
  );
}
