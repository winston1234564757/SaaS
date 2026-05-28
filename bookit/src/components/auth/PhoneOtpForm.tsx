'use client';

import { useState, useRef, useEffect, KeyboardEvent, ClipboardEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Loader2, Phone, MessageSquare,
  UserRound, Scissors, CheckCircle2,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { createClient } from '@/lib/supabase/client';
import { GoogleIcon } from '@/components/icons/GoogleIcon';
import { claimMasterRole } from '@/app/(auth)/register/actions';
import { formatPhoneDisplay, normalizePhoneInput, toFullPhone } from '@/lib/utils/phone';
import Cookies from 'js-cookie';

type Step = 'role_select' | 'phone' | 'otp';
type Role = 'client' | 'master';

const STEPS_ORDER: Step[] = ['role_select', 'phone', 'otp'];

const STEP_SPRING = { type: 'spring', stiffness: 320, damping: 28 } as const;

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
    icon: <UserRound size={30} strokeWidth={1.5} />,
  },
  {
    id: 'master',
    label: 'Я Майстер',
    description: 'Керую записами, клієнтами та доходом',
    icon: <Scissors size={30} strokeWidth={1.5} />,
  },
];

export function PhoneOtpForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const nextParam = searchParams.get('next');

  // Extract pathname only — guards against /%2F%2F and other encoded open-redirects
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

  // Cleanup cooldown on unmount
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

  // Крок 1: Відправка SMS
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

  // Крок 2: Верифікація OTP
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

    setLoading(false);
    router.refresh();

    if (selectedRole === 'master') {
      const intendedPlan = Cookies.get('intended_plan') ?? null;
      Cookies.remove('intended_plan');

      if (intendedPlan === 'pro' || intendedPlan === 'studio') {
        router.push(`/dashboard/billing?plan=${intendedPlan}`);
      } else if (needsOnboarding) {
        // is_published=false → майстер ще не пройшов онбординг
        router.push(getSafeRedirect('/dashboard/onboarding'));
      } else {
        router.push(getSafeRedirect('/dashboard'));
      }
    } else {
      router.push(getSafeRedirect('/my/bookings'));
    }
  }

  // OTP Input handlers
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

  // Cooldown
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

  // Google OAuth
  async function handleGoogleLogin() {
    // Fix: guard від дублікатів
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
      // Fix: якщо помилка — скидаємо loading і показуємо error
      if (error) {
        setIsGoogleLoading(false);
        setError(error.message || 'Помилка входу через Google');
      } else {
        oauthRedirectingRef.current = true; // redirect initiated — don't reset loading on focus
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
      initial={{ opacity: 0, y: 20, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: 'spring', stiffness: 320, damping: 26 } as const}
    >
      <Card padding="none" className="p-8">

        {/* Step progress indicator */}
        <div className="flex items-center justify-center gap-2 mb-8" aria-hidden="true">
          {STEPS_ORDER.map((s, i) => (
            <motion.div
              key={s}
              initial={false}
              animate={{
                width: stepIndex === i ? 22 : 6,
                opacity: i <= stepIndex ? 1 : 0.2,
              }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 } as const}
              style={{
                height: 6,
                borderRadius: 100,
                backgroundColor: i <= stepIndex ? 'var(--accent)' : 'var(--border)',
              }}
            />
          ))}
        </div>

        <AnimatePresence mode="popLayout">

          {/* ══ Step: role_select ════════════════════════════════════════════ */}
          {step === 'role_select' && (
            <motion.div
              key="role_select"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -14, scale: 0.98 }}
              transition={STEP_SPRING}
            >
              {/* Header */}
              <div className="text-center mb-7">
                <h1 className="heading-serif text-2xl text-foreground mb-2">
                  Ласкаво просимо
                </h1>
                <p className="text-sm text-muted-foreground/60">
                  Як будете використовувати Bookit?
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
                        p-5 rounded-2xl border-2 transition-all duration-150 active:scale-[0.97]
                        ${isSelected
                          ? 'border-primary bg-primary/8 text-foreground'
                          : 'border-border bg-secondary/70 text-muted-foreground hover:border-border/60 hover:bg-secondary'
                        }
                      `}
                    >
                      {isSelected && (
                        <span className="absolute top-2.5 right-2.5 text-primary">
                          <CheckCircle2 size={16} strokeWidth={2} />
                        </span>
                      )}
                      <span className={isSelected ? 'text-primary' : 'text-muted-foreground/55'}>
                        {role.icon}
                      </span>
                      <div>
                        <p className="font-semibold text-sm leading-tight mb-1">
                          {role.label}
                        </p>
                        <p className="text-xs text-muted-foreground/55 leading-snug">
                          {role.description}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Terms checkbox */}
              <label className="flex items-start gap-3 cursor-pointer mb-5 group">
                <div className="relative mt-0.5 shrink-0">
                  <input
                    type="checkbox"
                    checked={termsAccepted}
                    onChange={e => setTermsAccepted(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-5 h-5 rounded-md border-2 border-border bg-secondary peer-checked:bg-primary peer-checked:border-primary transition-all flex items-center justify-center">
                    {termsAccepted && (
                      <svg width="11" height="8" viewBox="0 0 11 8" fill="none" aria-hidden="true">
                        <path d="M1 4L4 7L10 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </div>
                </div>
                <span className="text-xs text-muted-foreground leading-relaxed">
                  Я ознайомлений(а) та погоджуюсь з{' '}
                  <a
                    href="/legal/terms-of-service"
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={e => e.stopPropagation()}
                    className="text-primary underline underline-offset-2 hover:text-primary/90 transition-colors"
                  >
                    Умовами надання послуг
                  </a>
                  ,{' '}
                  <a
                    href="/legal/public-offer"
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={e => e.stopPropagation()}
                    className="text-primary underline underline-offset-2 hover:text-primary/90 transition-colors"
                  >
                    Публічною офертою
                  </a>{' '}
                  та{' '}
                  <a
                    href="/legal/privacy-policy"
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={e => e.stopPropagation()}
                    className="text-primary underline underline-offset-2 hover:text-primary/90 transition-colors"
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
                className="flex items-center justify-center w-full py-[14px] rounded-full bg-primary text-white text-sm font-semibold tracking-wide hover:opacity-90 active:scale-[0.97] transition-all shadow-lg shadow-primary/20 disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none disabled:scale-100"
              >
                Продовжити
              </button>
            </motion.div>
          )}

          {/* ══ Step: phone ══════════════════════════════════════════════════ */}
          {step === 'phone' && (
            <motion.div
              key="phone"
              initial={{ opacity: 0, x: 18 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -18, scale: 0.99 }}
              transition={STEP_SPRING}
            >
              {/* Role badge — клік повертає до вибору ролі */}
              <button
                type="button"
                onClick={() => { setStep('role_select'); setError(''); }}
                className="flex items-center gap-1.5 text-xs font-medium text-primary bg-primary/8 rounded-full px-3 py-1.5 mb-6 hover:bg-primary/14 transition-colors active:scale-[0.97]"
              >
                <ArrowLeft size={13} />
                {roleLabel}
              </button>

              {/* Header */}
              <div className="mb-7 text-center">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 mb-4">
                  <Phone size={22} className="text-primary" />
                </div>
                <h1 className="heading-serif text-2xl text-foreground mb-1.5">
                  Вхід у Bookit
                </h1>
                <p className="text-sm text-muted-foreground/60">
                  Введіть номер — надішлемо код
                </p>
              </div>

              {/* Google OAuth */}
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={isGoogleLoading}
                className="flex items-center justify-center gap-2.5 w-full py-[13px] px-6 rounded-full bg-secondary text-foreground text-sm font-semibold border border-border hover:border-border/60 hover:shadow-md active:scale-[0.97] transition-all shadow-sm mb-5 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isGoogleLoading ? <Loader2 size={17} className="animate-spin" /> : <GoogleIcon />}
                Продовжити з Google
              </button>

              {/* Divider */}
              <div className="relative mb-5">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-[11px] uppercase">
                  <span className="bg-secondary/80 px-3 text-muted-foreground/50 tracking-wide">
                    або через SMS
                  </span>
                </div>
              </div>

              {/* Phone field */}
              <div className="mb-4">
                <div className="flex items-center rounded-full border border-border bg-secondary overflow-hidden focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/15 transition-all">
                  <span className="pl-5 pr-2 text-muted-foreground font-medium text-sm select-none shrink-0">
                    +38
                  </span>
                  <input
                    type="tel"
                    inputMode="numeric"
                    placeholder="0XX XXX XX XX"
                    value={formatPhoneDisplay(phone)}
                    onChange={e => handlePhoneChange(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSendSms()}
                    className="flex-1 py-[14px] pr-5 text-foreground text-sm bg-transparent outline-none placeholder:text-muted-foreground/50"
                    autoFocus
                    autoComplete="tel-national"
                  />
                </div>
                {error && (
                  <motion.p
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.15 }}
                    className="mt-2 text-sm text-destructive pl-2"
                  >
                    {error}
                  </motion.p>
                )}
              </div>

              <button
                type="button"
                onClick={handleSendSms}
                disabled={loading || phone.length < 9}
                className="flex items-center justify-center gap-2 w-full py-[14px] rounded-full bg-primary text-white text-sm font-semibold tracking-wide hover:opacity-90 active:scale-[0.97] transition-all shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : null}
                {loading ? 'Надсилаємо...' : 'Отримати код'}
              </button>
            </motion.div>
          )}

          {/* ══ Step: otp ════════════════════════════════════════════════════ */}
          {step === 'otp' && (
            <motion.div
              key="otp"
              initial={{ opacity: 0, x: 18 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -18, scale: 0.99 }}
              transition={STEP_SPRING}
            >
              {/* Header */}
              <div className="mb-7 text-center">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 mb-4">
                  <MessageSquare size={22} className="text-primary" />
                </div>
                <h1 className="heading-serif text-2xl text-foreground mb-1.5">
                  Введіть код
                </h1>
                <p className="text-sm text-muted-foreground/60">
                  Код надіслано на +38 {formatPhoneDisplay(phone)}
                </p>
              </div>

              {/* 6-digit boxes */}
              <div className="flex justify-center gap-2 mb-5">
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
                    className="w-11 h-[60px] text-center text-xl font-bold text-foreground rounded-xl border-2 border-border bg-secondary outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 transition-all caret-primary"
                  />
                ))}
              </div>

              {error && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.15 }}
                  className="mb-4 text-sm text-destructive text-center"
                >
                  {error}
                </motion.p>
              )}

              <button
                type="button"
                onClick={() => handleVerifyOtp()}
                disabled={loading || digits.some(d => !d)}
                className="flex items-center justify-center gap-2 w-full py-[14px] rounded-full bg-primary text-white text-sm font-semibold tracking-wide hover:opacity-90 active:scale-[0.97] transition-all shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : null}
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
                  className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors active:scale-[0.97]"
                >
                  <ArrowLeft size={14} />
                  Змінити номер
                </button>

                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resendCooldown > 0}
                  className="text-sm text-primary font-medium disabled:text-muted-foreground/50 disabled:cursor-default hover:underline transition-colors"
                >
                  {resendCooldown > 0 ? `Знову через ${resendCooldown} с` : 'Надіслати знову'}
                </button>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </Card>
    </motion.div>
  );
}
