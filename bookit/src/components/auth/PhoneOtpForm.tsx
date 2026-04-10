'use client';

import { useState, useRef, useEffect, KeyboardEvent, ClipboardEvent } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Loader2, Phone, MessageSquare,
  UserRound, Scissors, CheckCircle2,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { createClient } from '@/lib/supabase/client';
import { GoogleIcon } from '@/components/icons/GoogleIcon';
import { claimMasterRole } from '@/app/(auth)/register/actions';
import { processRegistrationReferral } from '@/lib/actions/referrals';
import { formatPhoneDisplay, normalizePhoneInput, toFullPhone } from '@/lib/utils/phone';
import Cookies from 'js-cookie';

type Step = 'role_select' | 'phone' | 'otp';
type Role = 'client' | 'master';

const ROLES: {
  id: Role;
  label: string;
  description: string;
  icon: React.ReactNode;
}[] = [
  {
    id: 'client',
    label: 'Я Клієнт',
    description: 'Записуюсь до майстрів онлайн',
    icon: <UserRound size={32} strokeWidth={1.5} />,
  },
  {
    id: 'master',
    label: 'Я Майстер',
    description: 'Керую записами, клієнтами та доходом',
    icon: <Scissors size={32} strokeWidth={1.5} />,
  },
];

export function PhoneOtpForm() {
  const router = useRouter();
  const supabase = createClient();

  const [step, setStep] = useState<Step>('role_select');
  const [selectedRole, setSelectedRole] = useState<Role>('client');
  const [phone, setPhone] = useState('');
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const digitRefs = useRef<(HTMLInputElement | null)[]>([]);
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const oauthRedirectingRef = useRef(false);

  // ── Cleanup cooldown on unmount ──────────────────────────────────────────
  useEffect(() => () => {
    if (cooldownRef.current) clearInterval(cooldownRef.current);
  }, []);

  // ── Fix: скидаємо Google loading коли юзер повертається (відмінив OAuth) ──
  useEffect(() => {
    const handleFocus = () => {
      if (!oauthRedirectingRef.current) setIsGoogleLoading(false);
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

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
  // Fix: приймає otpOverride щоб уникнути stale state в auto-submit
  async function handleVerifyOtp(otpOverride?: string) {
    const otp = otpOverride ?? digits.join('');
    if (otp.length < 6) return; // silent guard
    setLoading(true);
    setError('');

    const res = await fetch('/api/auth/verify-sms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: getCleanPhone(), otp, role: selectedRole }),
    });

    const data = await res.json();

    if (!res.ok) {
      setLoading(false);
      setError(data.error || 'Невірний код');
      setDigits(['', '', '', '', '', '']);
      digitRefs.current[0]?.focus();
      return;
    }

    let userId: string | undefined;

    if (!data.isExistingSession) {
      const { data: authData, error: authError } = await supabase.auth.verifyOtp({
        email: data.email,
        token: data.token,
        type: 'email',
      });

      if (authError || !authData.session) {
        setLoading(false);
        setError('Помилка авторизації. Спробуйте знову.');
        return;
      }
      userId = authData.user?.id;
    } else {
      const { data: userData } = await supabase.auth.getUser();
      userId = userData.user?.id;
    }

    if (selectedRole === 'master') {
      const refCodeFromCookie = Cookies.get('bookit_ref') || null;
      const { error: roleError } = await claimMasterRole(getCleanPhone(), refCodeFromCookie);
      
      if (roleError) {
        setLoading(false);
        setError(roleError);
        return;
      }

      if (refCodeFromCookie) {
        console.log('[PhoneOtpForm] Referral code applied via claimMasterRole:', refCodeFromCookie);
        Cookies.remove('bookit_ref');
      }
    }

    setLoading(false);
    
    router.refresh();

    if (selectedRole === 'master') {
      const match = document.cookie.match(/(?:^|; )intended_plan=([^;]*)/);
      const intendedPlan = match ? match[1] : null;
      document.cookie = 'intended_plan=; path=/; max-age=0';

      if (intendedPlan === 'pro' || intendedPlan === 'studio') {
        router.push(`/dashboard/billing?plan=${intendedPlan}`);
      } else if (data.isNew) {
        router.push('/dashboard/onboarding');
      } else {
        router.push('/dashboard');
      }
    } else {
      router.push('/my/bookings');
    }
  }

  // ── OTP Input handlers ───────────────────────────────────────────────────
  function handleDigitChange(index: number, val: string) {
    const char = val.replace(/\D/g, '').slice(-1);
    const next = [...digits];
    next[index] = char;
    setDigits(next);
    setError('');
    if (char && index < 5) digitRefs.current[index + 1]?.focus();
    // Fix: передаємо next.join('') напряму, уникаємо stale state
    if (next.every(d => d !== '') && char) {
      setTimeout(() => handleVerifyOtp(next.join('')), 80);
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
    // Auto-submit якщо вставили повний код
    if (pasted.length === 6) {
      setTimeout(() => handleVerifyOtp(pasted), 80);
    }
  }

  // ── Cooldown ─────────────────────────────────────────────────────────────
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

  // ── Google OAuth ─────────────────────────────────────────────────────────
  async function handleGoogleLogin() {
    // Fix: guard від дублікатів
    if (isGoogleLoading) return;
    setIsGoogleLoading(true);
    setError('');

    const planMatch = document.cookie.match(/(?:^|; )intended_plan=([^;]*)/);
    const planValue = planMatch?.[1] ?? '';
    const isPaidPlan = planValue === 'pro' || planValue === 'studio';
    const nextPath = selectedRole === 'master'
      ? isPaidPlan ? `/dashboard/billing?plan=${planValue}` : '/dashboard'
      : '/my/bookings';
    const cbParams = new URLSearchParams({ role: selectedRole, next: nextPath });
    if (isPaidPlan) cbParams.set('plan', planValue);

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback?${cbParams.toString()}`,
          queryParams: { prompt: 'select_account' },
        },
      });
      // Fix: якщо помилка — скидаємо loading і показуємо error
      if (error) {
        setIsGoogleLoading(false);
        setError(error.message || 'Помилка входу через Google');
      } else {
        oauthRedirectingRef.current = true; // redirect initiated — don't reset loading on focus
      }
      // Якщо успіх — redirect відбувається сам, loading лишається true до переходу сторінки
    } catch {
      setIsGoogleLoading(false);
      setError('Помилка входу через Google. Спробуйте ще раз.');
    }
  }

  const roleLabel = selectedRole === 'client' ? 'Клієнт' : 'Майстер';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 24 }}
    >
      <Card>
        <AnimatePresence mode="wait">

          {/* ══ Step: role_select ════════════════════════════════════════════ */}
          {step === 'role_select' && (
            <motion.div
              key="role_select"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.22 }}
            >
              {/* Header */}
              <div className="text-center mb-7">
                <h1 className="heading-serif text-2xl text-[#2C1A14] mb-2">
                  Ласкаво просимо
                </h1>
                <p className="text-sm text-[#A8928D]">
                  Як ви хочете використовувати Bookit?
                </p>
              </div>

              {/* Role cards */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                {ROLES.map(role => {
                  const isSelected = selectedRole === role.id;
                  return (
                    <button
                      key={role.id}
                      type="button"
                      onClick={() => setSelectedRole(role.id)}
                      className={`
                        relative flex flex-col items-center text-center gap-3
                        p-5 rounded-2xl border-2 transition-all duration-150
                        ${isSelected
                          ? 'border-[#789A99] bg-[#789A99]/8 text-[#2C1A14] scale-[1.02]'
                          : 'border-[#E8D0C8] bg-white text-[#6B5750] hover:border-[#C4A89E]'
                        }
                      `}
                    >
                      {isSelected && (
                        <span className="absolute top-2.5 right-2.5 text-[#789A99]">
                          <CheckCircle2 size={16} strokeWidth={2} />
                        </span>
                      )}
                      <span className={isSelected ? 'text-[#789A99]' : 'text-[#A8928D]'}>
                        {role.icon}
                      </span>
                      <div>
                        <p className="font-semibold text-sm leading-tight mb-1">
                          {role.label}
                        </p>
                        <p className="text-xs text-[#A8928D] leading-snug">
                          {role.description}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* CTA */}
              <button
                type="button"
                onClick={() => setStep('phone')}
                className="flex items-center justify-center w-full py-4 rounded-2xl bg-[#789A99] text-white text-base font-semibold hover:bg-[#6a8988] active:scale-[0.98] transition-all shadow-lg shadow-[#789A99]/25"
              >
                Продовжити
              </button>

            </motion.div>
          )}

          {/* ══ Step: phone ══════════════════════════════════════════════════ */}
          {step === 'phone' && (
            <motion.div
              key="phone"
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              transition={{ duration: 0.2 }}
            >
              {/* Role badge — клік повертає до вибору ролі */}
              <button
                type="button"
                onClick={() => { setStep('role_select'); setError(''); }}
                className="flex items-center gap-1.5 text-xs font-medium text-[#789A99] bg-[#789A99]/10 rounded-full px-3 py-1.5 mb-5 hover:bg-[#789A99]/18 transition-colors"
              >
                <ArrowLeft size={13} />
                {roleLabel}
              </button>

              {/* Header */}
              <div className="mb-7 text-center">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#789A99]/15 mb-4">
                  <Phone size={24} className="text-[#789A99]" />
                </div>
                <h1 className="heading-serif text-2xl text-[#2C1A14] mb-1.5">
                  Вхід у Bookit
                </h1>
                <p className="text-sm text-[#A8928D]">
                  Введіть номер — надішлемо SMS з кодом
                </p>
              </div>

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

              {/* Phone field */}
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
            </motion.div>
          )}

          {/* ══ Step: otp ════════════════════════════════════════════════════ */}
          {step === 'otp' && (
            <motion.div
              key="otp"
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              transition={{ duration: 0.2 }}
            >
              {/* Header */}
              <div className="mb-7 text-center">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#789A99]/15 mb-4">
                  <MessageSquare size={24} className="text-[#789A99]" />
                </div>
                <h1 className="heading-serif text-2xl text-[#2C1A14] mb-1.5">
                  Введіть код
                </h1>
                <p className="text-sm text-[#A8928D]">
                  Код надіслано на +38 {formatPhoneDisplay(phone)}
                </p>
              </div>

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
                onClick={() => handleVerifyOtp()}
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
