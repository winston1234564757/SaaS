'use client';

import { useState, useRef, useEffect, KeyboardEvent, ClipboardEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Loader2, Phone, MessageSquare,
  UserRound, Scissors,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { GoogleIcon } from '@/components/icons/GoogleIcon';
import { claimMasterRole } from '@/app/(auth)/register/actions';
import { formatPhoneDisplay, normalizePhoneInput, toFullPhone } from '@/lib/utils/phone';
import Cookies from 'js-cookie';

type Step = 'role_select' | 'phone' | 'otp';
type Role = 'client' | 'master';

const STEPS_ORDER: Step[] = ['role_select', 'phone', 'otp'];
const SPRING = { type: 'spring', stiffness: 340, damping: 30 } as const;

const ROLES: { id: Role; label: string; description: string; icon: React.ReactNode }[] = [
  {
    id: 'client',
    label: 'Я Клієнт',
    description: 'Записуюсь до майстрів онлайн',
    icon: <UserRound size={22} strokeWidth={1.5} />,
  },
  {
    id: 'master',
    label: 'Я Майстер',
    description: 'Керую записами, клієнтами та доходом',
    icon: <Scissors size={22} strokeWidth={1.5} />,
  },
];

export function PhoneOtpForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const nextParam = searchParams.get('next');

  const getSafeRedirect = (defaultPath: string) => {
    if (!nextParam) return defaultPath;
    try {
      return new URL(nextParam, 'https://x').pathname || defaultPath;
    } catch {
      return defaultPath;
    }
  };

  const [step, setStep] = useState<Step>('role_select');
  const [selectedRole, setSelectedRole] = useState<Role>('client');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [phone, setPhone] = useState('');
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const digitRefs = useRef<(HTMLInputElement | null)[]>([]);
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const oauthRedirectingRef = useRef(false);

  useEffect(() => () => {
    if (cooldownRef.current) clearInterval(cooldownRef.current);
  }, []);

  // Fix: скидаємо Google loading коли юзер повертається (відмінив OAuth)
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

  // Fix: приймає otpOverride щоб уникнути stale state в auto-submit
  async function handleVerifyOtp(otpOverride?: string) {
    const otp = otpOverride ?? digits.join('');
    if (otp.length < 6) return;
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

    let needsOnboarding = false;
    if (selectedRole === 'master') {
      const refCodeFromCookie = Cookies.get('bookit_ref') || null;
      const { error: roleError, needsOnboarding: onb } = await claimMasterRole(getCleanPhone(), refCodeFromCookie);

      if (roleError) {
        setLoading(false);
        setError(roleError);
        return;
      }

      needsOnboarding = onb ?? false;
      if (refCodeFromCookie) {
        Cookies.remove('bookit_ref');
      }
    }

    void userId;
    setLoading(false);

    if (selectedRole === 'master') {
      const intendedPlan = Cookies.get('intended_plan') ?? null;
      Cookies.remove('intended_plan');

      if (intendedPlan === 'pro' || intendedPlan === 'studio') {
        router.push(`/dashboard/billing?plan=${intendedPlan}`);
      } else if (needsOnboarding) {
        router.push(getSafeRedirect('/dashboard/onboarding'));
      } else {
        router.push(getSafeRedirect('/dashboard'));
      }
    } else {
      router.push(getSafeRedirect('/my/bookings'));
    }
  }

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
    if (pasted.length === 6) {
      setTimeout(() => handleVerifyOtp(pasted), 80);
    }
  }

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

  // Fix: guard від дублікатів
  async function handleGoogleLogin() {
    if (isGoogleLoading) return;
    setIsGoogleLoading(true);
    setError('');

    const planValue = Cookies.get('intended_plan') ?? '';
    const isPaidPlan = planValue === 'pro' || planValue === 'studio';

    let nextPath = selectedRole === 'master'
      ? isPaidPlan ? `/dashboard/billing?plan=${planValue}` : '/dashboard'
      : '/my/bookings';

    nextPath = getSafeRedirect(nextPath);

    const cbParams = new URLSearchParams({ role: selectedRole, next: nextPath });
    if (isPaidPlan) cbParams.set('plan', planValue);

    // V-17: Set role intent as httpOnly cookie via server route (not document.cookie)
    await fetch('/api/auth/set-role-intent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: selectedRole }),
    });

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback?${cbParams.toString()}`,
          queryParams: { prompt: 'select_account' },
        },
      });
      if (error) {
        setIsGoogleLoading(false);
        setError(error.message || 'Помилка входу через Google');
      } else {
        // Fix: redirect initiated — не скидаємо loading при поверненні фокусу
        oauthRedirectingRef.current = true;
      }
    } catch {
      setIsGoogleLoading(false);
      setError('Помилка входу через Google. Спробуйте ще раз.');
    }
  }

  const roleLabel = selectedRole === 'client' ? 'Клієнт' : 'Майстер';
  const stepIndex = STEPS_ORDER.indexOf(step);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={SPRING}
      className="w-full"
    >
      {/* ── White architectural container ───────────────────────────────── */}
      <div
        className="bg-white rounded-[28px] overflow-hidden"
        style={{
          boxShadow: [
            '0 0 0 1px rgba(99,102,241,0.07)',
            '0 4px 8px rgba(99,102,241,0.06)',
            '0 16px 48px rgba(99,102,241,0.08)',
          ].join(', '),
        }}
      >
        {/* ── Progress — 3 thin segments ──────────────────────────────── */}
        <div className="flex gap-1.5 px-7 pt-6 pb-0">
          {STEPS_ORDER.map((s, i) => (
            <div
              key={s}
              className="h-[3px] flex-1 rounded-full overflow-hidden"
              style={{ background: 'rgba(99,102,241,0.10)' }}
            >
              <motion.div
                className="h-full w-full rounded-full"
                style={{ background: '#0F172A', transformOrigin: 'left' }}
                initial={false}
                animate={{ scaleX: i <= stepIndex ? 1 : 0 }}
                transition={{ ...SPRING, delay: i <= stepIndex ? 0 : 0 }}
              />
            </div>
          ))}
        </div>

        <div className="px-7 pb-7 pt-6">
          <AnimatePresence mode="popLayout">

            {/* ══ Step: role_select ══════════════════════════════════════ */}
            {step === 'role_select' && (
              <motion.div
                key="role_select"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10, scale: 0.98 }}
                transition={SPRING}
              >
                {/* Header */}
                <div className="text-center mb-6">
                  <h1 className="heading-serif text-[1.85rem] leading-tight text-[#0F172A] mb-1.5">
                    Ласкаво просимо
                  </h1>
                  <p className="text-sm text-[#64748B]">
                    Як будете використовувати Bookit?
                  </p>
                </div>

                {/* Role cards — stacked rows, NOT identical 2-col grid */}
                <div className="flex flex-col gap-2.5 mb-5">
                  {ROLES.map(role => {
                    const isSelected = selectedRole === role.id;
                    return (
                      <motion.button
                        key={role.id}
                        type="button"
                        onClick={() => setSelectedRole(role.id)}
                        whileTap={{ scale: 0.985 }}
                        className="relative w-full flex items-center gap-3.5 p-4 rounded-2xl text-left"
                        style={{
                          background: isSelected ? '#0F172A' : '#FFFFFF',
                          border: isSelected
                            ? '1.5px solid #0F172A'
                            : '1.5px dashed rgba(99,102,241,0.28)',
                          boxShadow: isSelected
                            ? '0 4px 20px rgba(15,23,42,0.16), inset 0 1px 0 rgba(255,255,255,0.06)'
                            : 'none',
                          transition: 'background 180ms ease, border-color 180ms ease, box-shadow 180ms ease',
                        }}
                      >
                        {/* Icon */}
                        <div
                          className="shrink-0 size-11 rounded-xl flex items-center justify-center"
                          style={{
                            background: isSelected
                              ? 'rgba(255,255,255,0.10)'
                              : 'rgba(99,102,241,0.08)',
                          }}
                        >
                          <span style={{ color: isSelected ? '#FFFFFF' : '#6366F1' }}>
                            {role.icon}
                          </span>
                        </div>

                        {/* Text */}
                        <div className="flex-1 min-w-0">
                          <p
                            className="text-sm font-semibold leading-tight"
                            style={{ color: isSelected ? '#FFFFFF' : '#0F172A' }}
                          >
                            {role.label}
                          </p>
                          <p
                            className="text-xs mt-0.5 leading-snug"
                            style={{ color: isSelected ? 'rgba(255,255,255,0.72)' : '#64748B' }}
                          >
                            {role.description}
                          </p>
                        </div>

                        {/* Radio dot */}
                        <div
                          className="shrink-0 size-5 rounded-full border-2 flex items-center justify-center"
                          style={{
                            borderColor: isSelected
                              ? 'rgba(255,255,255,0.45)'
                              : 'rgba(99,102,241,0.25)',
                          }}
                        >
                          <motion.div
                            animate={{ scale: isSelected ? 1 : 0, opacity: isSelected ? 1 : 0 }}
                            transition={{ type: 'spring', stiffness: 500, damping: 28 } as const}
                            className="size-2.5 rounded-full bg-white"
                          />
                        </div>
                      </motion.button>
                    );
                  })}
                </div>

                {/* Terms */}
                <label className="flex items-start gap-3 cursor-pointer mb-5 select-none">
                  <div className="relative mt-[1px] shrink-0">
                    <input
                      type="checkbox"
                      checked={termsAccepted}
                      onChange={e => setTermsAccepted(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div
                      className="w-[18px] h-[18px] rounded-[5px] border-[1.5px] flex items-center justify-center transition-colors duration-150"
                      style={{
                        background: termsAccepted ? '#0F172A' : '#FFFFFF',
                        borderColor: termsAccepted ? '#0F172A' : 'rgba(99,102,241,0.28)',
                      }}
                    >
                      <AnimatePresence>
                        {termsAccepted && (
                          <motion.svg
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0, opacity: 0 }}
                            transition={{ type: 'spring', stiffness: 600, damping: 28 } as const}
                            width="10" height="7" viewBox="0 0 10 7"
                            fill="none" aria-hidden="true"
                          >
                            <path
                              d="M1 3.5L3.5 6L9 1"
                              stroke="white"
                              strokeWidth="1.75"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </motion.svg>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                  <span className="text-xs text-[#64748B] leading-relaxed">
                    Я ознайомлений(а) та погоджуюсь з{' '}
                    <a
                      href="/legal/terms-of-service"
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={e => e.stopPropagation()}
                      className="text-[#4338CA] underline underline-offset-2"
                    >
                      Умовами надання послуг
                    </a>
                    ,{' '}
                    <a
                      href="/legal/public-offer"
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={e => e.stopPropagation()}
                      className="text-[#4338CA] underline underline-offset-2"
                    >
                      Публічною офертою
                    </a>{' '}
                    та{' '}
                    <a
                      href="/legal/privacy-policy"
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={e => e.stopPropagation()}
                      className="text-[#4338CA] underline underline-offset-2"
                    >
                      Політикою конфіденційності
                    </a>
                  </span>
                </label>

                {/* CTA */}
                <button
                  type="button"
                  onClick={() => setStep('phone')}
                  disabled={!termsAccepted}
                  className="w-full py-[14px] rounded-full text-sm font-semibold text-white tracking-wide active:scale-[0.97] transition-all duration-150 disabled:cursor-not-allowed"
                  style={{
                    background: termsAccepted ? '#0F172A' : 'rgba(15,23,42,0.28)',
                    boxShadow: termsAccepted
                      ? '0 4px 24px rgba(15,23,42,0.22)'
                      : 'none',
                  }}
                >
                  Продовжити
                </button>
              </motion.div>
            )}

            {/* ══ Step: phone ════════════════════════════════════════════ */}
            {step === 'phone' && (
              <motion.div
                key="phone"
                initial={{ opacity: 0, x: 22 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -22, scale: 0.99 }}
                transition={SPRING}
              >
                {/* Back badge */}
                <button
                  type="button"
                  onClick={() => { setStep('role_select'); setError(''); }}
                  className="inline-flex items-center gap-1.5 text-xs font-medium mb-6 transition-opacity hover:opacity-70 active:scale-[0.97]"
                  style={{
                    color: '#4338CA',
                    background: 'rgba(99,102,241,0.08)',
                    borderRadius: 100,
                    padding: '5px 12px 5px 10px',
                  }}
                >
                  <ArrowLeft size={12} strokeWidth={2} />
                  {roleLabel}
                </button>

                {/* Header */}
                <div className="text-center mb-6">
                  <div
                    className="inline-flex items-center justify-center size-12 rounded-2xl mb-4"
                    style={{ background: 'rgba(99,102,241,0.08)' }}
                  >
                    <Phone size={20} strokeWidth={1.5} style={{ color: '#6366F1' }} />
                  </div>
                  <h1 className="heading-serif text-[1.65rem] leading-tight text-[#0F172A] mb-1">
                    Вхід у Bookit
                  </h1>
                  <p className="text-sm text-[#64748B]">
                    Введіть номер. Надішлемо код.
                  </p>
                </div>

                {/* Google */}
                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  disabled={isGoogleLoading}
                  className="flex items-center justify-center gap-2.5 w-full py-[13px] rounded-full text-sm font-semibold transition-all active:scale-[0.97] mb-4 disabled:opacity-55 disabled:cursor-not-allowed"
                  style={{
                    background: '#FFFFFF',
                    border: '1.5px solid rgba(15,23,42,0.12)',
                    color: '#0F172A',
                    boxShadow: '0 1px 4px rgba(15,23,42,0.06)',
                  }}
                >
                  {isGoogleLoading
                    ? <Loader2 size={16} className="animate-spin" />
                    : <GoogleIcon />
                  }
                  Продовжити з Google
                </button>

                {/* Divider */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex-1 h-px" style={{ background: 'rgba(99,102,241,0.10)' }} />
                  <span
                    className="text-[11px] uppercase tracking-wider"
                    style={{ color: '#64748B' }}
                  >
                    або SMS
                  </span>
                  <div className="flex-1 h-px" style={{ background: 'rgba(99,102,241,0.10)' }} />
                </div>

                {/* Phone input */}
                <div className="mb-4">
                  <div
                    className="flex items-center rounded-2xl overflow-hidden transition-all duration-150 focus-within:ring-2 focus-within:ring-[rgba(99,102,241,0.14)]"
                    style={{
                      background: '#F8F9FF',
                      border: '1.5px solid rgba(99,102,241,0.16)',
                    }}
                  >
                    <span
                      className="pl-5 pr-2 text-sm select-none shrink-0 font-medium"
                      style={{ color: '#64748B' }}
                    >
                      +38
                    </span>
                    <input
                      type="tel"
                      inputMode="numeric"
                      placeholder="0XX XXX XX XX"
                      value={formatPhoneDisplay(phone)}
                      onChange={e => handlePhoneChange(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleSendSms()}
                      className="flex-1 py-[13px] pr-5 text-sm bg-transparent outline-none"
                      style={{
                        color: '#0F172A',
                      }}
                      autoFocus
                      autoComplete="tel-national"
                    />
                  </div>

                  <AnimatePresence>
                    {error && (
                      <motion.p
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.14 }}
                        className="mt-2 text-xs pl-1"
                        style={{ color: '#EF4444' }}
                      >
                        {error}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>

                {/* CTA */}
                <button
                  type="button"
                  onClick={handleSendSms}
                  disabled={loading || phone.length < 9}
                  className="flex items-center justify-center gap-2 w-full py-[14px] rounded-full text-sm font-semibold text-white tracking-wide transition-all duration-150 active:scale-[0.97] disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{
                    background: '#0F172A',
                    boxShadow: (loading || phone.length < 9)
                      ? 'none'
                      : '0 4px 24px rgba(15,23,42,0.22)',
                  }}
                >
                  {loading && <Loader2 size={15} className="animate-spin" />}
                  {loading ? 'Надсилаємо...' : 'Отримати код'}
                </button>
              </motion.div>
            )}

            {/* ══ Step: otp ══════════════════════════════════════════════ */}
            {step === 'otp' && (
              <motion.div
                key="otp"
                initial={{ opacity: 0, x: 22 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -22, scale: 0.99 }}
                transition={SPRING}
              >
                {/* Header */}
                <div className="text-center mb-6">
                  <div
                    className="inline-flex items-center justify-center size-12 rounded-2xl mb-4"
                    style={{ background: 'rgba(99,102,241,0.08)' }}
                  >
                    <MessageSquare size={20} strokeWidth={1.5} style={{ color: '#6366F1' }} />
                  </div>
                  <h1 className="heading-serif text-[1.65rem] leading-tight text-[#0F172A] mb-1">
                    Введіть код
                  </h1>
                  <p className="text-sm text-[#64748B]">
                    Надіслано на +38 {formatPhoneDisplay(phone)}
                  </p>
                </div>

                {/* OTP digits */}
                <div className="flex justify-center gap-2 mb-4">
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
                      className={[
                        'w-11 h-[58px] text-center text-xl font-bold rounded-2xl outline-none',
                        'transition-all duration-150 caret-[#6366F1]',
                        d
                          ? 'bg-[rgba(15,23,42,0.04)] border-2 border-[#0F172A] text-[#0F172A]'
                          : 'bg-[#F8F9FF] border-2 border-[rgba(99,102,241,0.18)] text-[#0F172A] focus:border-[#6366F1] focus:ring-2 focus:ring-[rgba(99,102,241,0.12)]',
                      ].join(' ')}
                    />
                  ))}
                </div>

                <AnimatePresence>
                  {error && (
                    <motion.p
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.14 }}
                      className="mb-3 text-xs text-center"
                      style={{ color: '#EF4444' }}
                    >
                      {error}
                    </motion.p>
                  )}
                </AnimatePresence>

                {/* CTA */}
                <button
                  type="button"
                  onClick={() => handleVerifyOtp()}
                  disabled={loading || digits.some(d => !d)}
                  className="flex items-center justify-center gap-2 w-full py-[14px] rounded-full text-sm font-semibold text-white tracking-wide mb-5 transition-all duration-150 active:scale-[0.97] disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{
                    background: '#0F172A',
                    boxShadow: (loading || digits.some(d => !d))
                      ? 'none'
                      : '0 4px 24px rgba(15,23,42,0.22)',
                  }}
                >
                  {loading && <Loader2 size={15} className="animate-spin" />}
                  {loading ? 'Перевіряємо...' : 'Підтвердити'}
                </button>

                {/* Back + resend */}
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => {
                      setStep('phone');
                      setDigits(['', '', '', '', '', '']);
                      setError('');
                    }}
                    className="flex items-center gap-1.5 text-sm transition-opacity hover:opacity-60 active:scale-[0.97]"
                    style={{ color: '#64748B' }}
                  >
                    <ArrowLeft size={13} strokeWidth={2} />
                    Змінити номер
                  </button>

                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={resendCooldown > 0}
                    className="text-sm font-medium transition-colors disabled:cursor-default"
                    style={{ color: resendCooldown > 0 ? '#64748B' : '#4338CA' }}
                  >
                    {resendCooldown > 0
                      ? `Повторити через ${resendCooldown} с`
                      : 'Надіслати знову'
                    }
                  </button>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}
