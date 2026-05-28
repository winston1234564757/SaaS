# Phase 1.5 — Auth UX Redesign + Tour Persistence

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign auth flow з 3-step UX (role → phone → otp), fix Google OAuth loading bug, fix OTP race condition, persist dashboard tour до master_profiles DB.

**Architecture:** `PhoneOtpForm` отримує новий крок `role_select` перед auth. `/register` redirects до `/login`. `DashboardPage` (server component) передає `has_seen_tour` в `DashboardTourProvider`.

**Tech Stack:** Next.js 16 App Router, TypeScript strict, Framer Motion, Supabase, Tailwind v4

---

## File Map

| Файл | Що змінюємо |
|------|-------------|
| `supabase/migrations/058_has_seen_tour.sql` | **NEW** — додає колонку |
| `src/types/database.ts` | `MasterProfile` + `has_seen_tour` поле |
| `src/components/auth/PhoneOtpForm.tsx` | **MAJOR** — role_select step, OAuth fix, OTP fix |
| `src/app/(auth)/register/page.tsx` | → redirect 301 |
| `src/app/(auth)/login/page.tsx` | Update metadata |
| `src/components/master/dashboard/DashboardTourContext.tsx` | + `initialHasSeenTour` prop |
| `src/app/(master)/dashboard/actions.ts` | **NEW** — `markTourSeen` server action |
| `src/app/(master)/dashboard/page.tsx` | async + pass `has_seen_tour` |

---

## Task 1: Міграція has_seen_tour

**Files:**
- Create: `bookit/supabase/migrations/058_has_seen_tour.sql`

- [ ] **Крок 1: Створити файл міграції**

```sql
-- bookit/supabase/migrations/058_has_seen_tour.sql
ALTER TABLE master_profiles
  ADD COLUMN IF NOT EXISTS has_seen_tour BOOLEAN NOT NULL DEFAULT FALSE;
```

- [ ] **Крок 2: Застосувати міграцію**

```bash
cd bookit && npx supabase db push
```

Очікуваний вивід: `Applying migration 058_has_seen_tour.sql...` без помилок.

- [ ] **Крок 3: Commit**

```bash
git add bookit/supabase/migrations/058_has_seen_tour.sql
git commit -m "feat(db): додати has_seen_tour до master_profiles (migration 058)"
```

---

## Task 2: Оновити тип MasterProfile

**Files:**
- Modify: `bookit/src/types/database.ts`

- [ ] **Крок 1: Додати поле в інтерфейс**

У `src/types/database.ts` знайти `export interface MasterProfile` і додати поле після `avatar_emoji`:

```typescript
export interface MasterProfile {
  id: string;
  slug: string;
  business_name: string | null;
  bio: string | null;
  categories: string[];
  mood_theme: string;
  accent_color: string;
  subscription_tier: SubscriptionTier;
  subscription_expires_at: string | null;
  commission_rate: number;
  rating: number;
  rating_count: number;
  is_published: boolean;
  address: string | null;
  city: string | null;
  latitude: number | null;
  longitude: number | null;
  instagram_url: string | null;
  telegram_url: string | null;
  telegram_chat_id: string | null;
  avatar_emoji: string;
  has_seen_tour: boolean;           // ← НОВЕ ПОЛЕ
  pricing_rules: PricingRules | null;
  working_hours: WorkingHoursConfig | null;
  created_at: string;
  updated_at: string;
}
```

- [ ] **Крок 2: Перевірити TypeScript**

```bash
cd bookit && npx tsc --noEmit 2>&1 | head -20
```

Очікуваний вивід: без помилок.

- [ ] **Крок 3: Commit**

```bash
git add bookit/src/types/database.ts
git commit -m "feat(types): додати has_seen_tour до MasterProfile"
```

---

## Task 3: Server Action markTourSeen

**Files:**
- Create: `bookit/src/app/(master)/dashboard/actions.ts`

- [ ] **Крок 1: Створити файл з server action**

```typescript
// bookit/src/app/(master)/dashboard/actions.ts
'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function markTourSeen(): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const admin = createAdminClient();
  await admin
    .from('master_profiles')
    .update({ has_seen_tour: true })
    .eq('id', user.id);
}
```

- [ ] **Крок 2: Перевірити TypeScript**

```bash
cd bookit && npx tsc --noEmit 2>&1 | head -20
```

- [ ] **Крок 3: Commit**

```bash
git add bookit/src/app/(master)/dashboard/actions.ts
git commit -m "feat(actions): додати markTourSeen server action"
```

---

## Task 4: Оновити DashboardTourProvider

**Files:**
- Modify: `bookit/src/components/master/dashboard/DashboardTourContext.tsx`

- [ ] **Крок 1: Переписати компонент**

Повністю замінити вміст файлу:

```typescript
'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { markTourSeen } from '@/app/(master)/dashboard/actions';

const LS_KEY = 'dashboardTourComplete';

interface TourContextValue {
  tourStep: number;
  handleNextStep: () => void;
  closeTour: () => void;
}

const TourContext = createContext<TourContextValue>({
  tourStep: -1,
  handleNextStep: () => {},
  closeTour: () => {},
});

export function useTourStep() {
  return useContext(TourContext);
}

export function DashboardTourProvider({
  children,
  initialHasSeenTour,
}: {
  children: React.ReactNode;
  initialHasSeenTour: boolean;
}) {
  // -1 = not yet initialized (prevents flash on SSR)
  const [tourStep, setTourStep] = useState(-1);

  useEffect(() => {
    // Якщо DB каже що тур вже бачили — пропускаємо на всіх пристроях
    if (initialHasSeenTour) return;

    const val = localStorage.getItem(LS_KEY);
    if (val === null) {
      localStorage.setItem(LS_KEY, 'in-progress');
      const t = setTimeout(() => setTourStep(0), 1000);
      return () => clearTimeout(t);
    }
    // 'in-progress' або 'true' — тур вже стартував або завершений
  }, [initialHasSeenTour]);

  function handleNextStep() {
    if (tourStep < 2) {
      setTourStep(prev => prev + 1);
    } else {
      finishTour();
    }
  }

  function closeTour() {
    finishTour();
  }

  function finishTour() {
    setTourStep(-1);
    localStorage.setItem(LS_KEY, 'true');
    void markTourSeen(); // fire-and-forget, DB persistence
  }

  return (
    <TourContext.Provider value={{ tourStep, handleNextStep, closeTour }}>
      {children}
    </TourContext.Provider>
  );
}
```

- [ ] **Крок 2: Перевірити TypeScript**

```bash
cd bookit && npx tsc --noEmit 2>&1 | head -20
```

- [ ] **Крок 3: Commit**

```bash
git add bookit/src/components/master/dashboard/DashboardTourContext.tsx
git commit -m "feat(tour): додати DB persistence через initialHasSeenTour prop"
```

---

## Task 5: Оновити DashboardPage (async + has_seen_tour)

**Files:**
- Modify: `bookit/src/app/(master)/dashboard/page.tsx`

- [ ] **Крок 1: Зробити сторінку async, додати fetch has_seen_tour**

Повністю замінити вміст файлу:

```typescript
import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { DashboardGreeting } from '@/components/master/dashboard/DashboardGreeting';
import { WelcomeBanner } from '@/components/master/dashboard/WelcomeBanner';
import { ProfileStrengthWidget } from '@/components/master/dashboard/ProfileStrengthWidget';
import { StatsStrip } from '@/components/master/dashboard/StatsStrip';
import { WeeklyOverview } from '@/components/master/dashboard/WeeklyOverview';
import { PushSubscribeCard } from '@/components/shared/PushSubscribeCard';
import { DashboardTourProvider } from '@/components/master/dashboard/DashboardTourContext';
import { ShareCardWithHint } from '@/components/master/dashboard/ShareCardWithHint';
import { TodayScheduleWithHint } from '@/components/master/dashboard/TodayScheduleWithHint';
import { QuickActionsWithHint } from '@/components/master/dashboard/QuickActionsWithHint';

export const metadata: Metadata = {
  title: 'Dashboard — Bookit',
};

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: masterProfile } = user
    ? await supabase
        .from('master_profiles')
        .select('has_seen_tour')
        .eq('id', user.id)
        .single()
    : { data: null };

  const hasSeenTour = masterProfile?.has_seen_tour ?? false;

  return (
    <DashboardTourProvider initialHasSeenTour={hasSeenTour}>
      <div className="flex flex-col gap-4">
        <DashboardGreeting />
        <ProfileStrengthWidget />
        <WelcomeBanner />
        <StatsStrip />
        <TodayScheduleWithHint />
        <WeeklyOverview />
        <QuickActionsWithHint />
        <PushSubscribeCard />
        <ShareCardWithHint />
      </div>
    </DashboardTourProvider>
  );
}
```

- [ ] **Крок 2: Перевірити TypeScript**

```bash
cd bookit && npx tsc --noEmit 2>&1 | head -20
```

- [ ] **Крок 3: Commit**

```bash
git add bookit/src/app/(master)/dashboard/page.tsx
git commit -m "feat(dashboard): передати has_seen_tour з DB в DashboardTourProvider"
```

---

## Task 6: Register → redirect

**Files:**
- Modify: `bookit/src/app/(auth)/register/page.tsx`

- [ ] **Крок 1: Замінити на redirect**

```typescript
// bookit/src/app/(auth)/register/page.tsx
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default function RegisterPage() {
  redirect('/login');
}
```

- [ ] **Крок 2: Commit**

```bash
git add bookit/src/app/(auth)/register/page.tsx
git commit -m "feat(auth): /register → redirect до /login (unified auth flow)"
```

---

## Task 7: Оновити Login page metadata

**Files:**
- Modify: `bookit/src/app/(auth)/login/page.tsx`

- [ ] **Крок 1: Оновити**

```typescript
// bookit/src/app/(auth)/login/page.tsx
import type { Metadata } from 'next';
import { PhoneOtpForm } from '@/components/auth/PhoneOtpForm';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Увійти — Bookit',
  description: 'Увійдіть або зареєструйтесь у Bookit',
};

export default function LoginPage() {
  return <PhoneOtpForm />;
}
```

Зверни увагу: `PhoneOtpForm` більше не отримує `mode` prop — він буде видалений у наступному таску.

- [ ] **Крок 2: Commit**

```bash
git add bookit/src/app/(auth)/login/page.tsx
git commit -m "feat(auth): оновити login page (без mode prop)"
```

---

## Task 8: Оновити LoginForm і RegisterForm (видалити mode prop)

**Files:**
- Modify: `bookit/src/components/auth/LoginForm.tsx`
- Modify: `bookit/src/components/auth/RegisterForm.tsx`

- [ ] **Крок 1: Спростити LoginForm**

```typescript
// bookit/src/components/auth/LoginForm.tsx
'use client';

import { PhoneOtpForm } from './PhoneOtpForm';

export function LoginForm() {
  return <PhoneOtpForm />;
}
```

- [ ] **Крок 2: Спростити RegisterForm (залишається для сумісності, але не використовується)**

```typescript
// bookit/src/components/auth/RegisterForm.tsx
'use client';

import { PhoneOtpForm } from './PhoneOtpForm';

export function RegisterForm() {
  return <PhoneOtpForm />;
}
```

- [ ] **Крок 3: Commit**

```bash
git add bookit/src/components/auth/LoginForm.tsx bookit/src/components/auth/RegisterForm.tsx
git commit -m "feat(auth): прибрати mode prop з LoginForm і RegisterForm"
```

---

## Task 9: Major refactor PhoneOtpForm

**Files:**
- Modify: `bookit/src/components/auth/PhoneOtpForm.tsx`

Це найбільший таск. Повністю замінити файл.

**Три кроки:**
- `role_select` — два великі картки Клієнт/Майстер
- `phone` — Google + телефон (з role badge)
- `otp` — 6 boxes (без змін структурно)

**Fixes вбудовані:**
- Google OAuth: `window.focus` listener скидає `isGoogleLoading`; guard від дублікатів; try/catch
- OTP: `handleVerifyOtp(otpOverride?: string)` приймає otp напряму

- [ ] **Крок 1: Повністю замінити PhoneOtpForm.tsx**

```typescript
'use client';

import { useState, useRef, useEffect, KeyboardEvent, ClipboardEvent } from 'react';
import Link from 'next/link';
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

  // ── Cleanup cooldown on unmount ──────────────────────────────────────────
  useEffect(() => () => {
    if (cooldownRef.current) clearInterval(cooldownRef.current);
  }, []);

  // ── Fix: скидаємо Google loading коли юзер повертається (відмінив OAuth) ──
  useEffect(() => {
    const handleFocus = () => setIsGoogleLoading(false);
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

    if (selectedRole === 'master') {
      const { error: roleError } = await claimMasterRole(getCleanPhone());
      if (roleError) {
        setLoading(false);
        setError(roleError);
        return;
      }
    }

    if (selectedRole === 'master' && data.isNew && authData.user?.id) {
      const refCode = typeof window !== 'undefined'
        ? localStorage.getItem('bookit_ref')
        : null;
      if (refCode) {
        void processRegistrationReferral(authData.user.id, refCode);
        localStorage.removeItem('bookit_ref');
      }
    }

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

              {/* Footer */}
              <p className="text-center text-sm text-[#6B5750] mt-5">
                Вже маєш акаунт?{' '}
                <Link href="/login" className="text-[#789A99] font-medium hover:underline">
                  Увійти
                </Link>
              </p>
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
```

- [ ] **Крок 2: Перевірити TypeScript**

```bash
cd bookit && npx tsc --noEmit 2>&1 | head -30
```

Очікуваний вивід: без помилок або тільки pre-existing помилки не з цього файлу.

- [ ] **Крок 3: Commit**

```bash
git add bookit/src/components/auth/PhoneOtpForm.tsx
git commit -m "feat(auth): role_select step + Google OAuth fix + OTP race fix"
```

---

## Task 10: Перевірка збірки

- [ ] **Крок 1: TypeScript перевірка всього проекту**

```bash
cd bookit && npx tsc --noEmit 2>&1
```

Очікуваний вивід: 0 нових помилок.

- [ ] **Крок 2: Build перевірка**

```bash
cd bookit && npm run build 2>&1 | tail -20
```

Очікуваний вивід: `✓ Compiled successfully` або аналогічне.

- [ ] **Крок 3: Фінальний commit**

```bash
git add -A
git status
# Переконатись що немає зайвих файлів
git commit -m "feat: Phase 1.5 complete — auth redesign + tour DB persistence" --allow-empty
```

---

## Checklist верифікації

- [ ] `/login` показує step "role_select" першим
- [ ] `/register` редиректить на `/login`
- [ ] Вибір Client → Google OAuth → редирект `/my/bookings`
- [ ] Вибір Master → SMS → новий майстер → `/dashboard/onboarding`
- [ ] Вибір Master → SMS → існуючий майстер → `/dashboard`
- [ ] Role badge у phone step клікабельний (повертає до role_select)
- [ ] Google: відміна OAuth → кнопка розблокована (window.focus listener)
- [ ] OTP: clipboard paste 6 цифр → auto-submit без помилки
- [ ] Dashboard tour: перший вхід → тур показується
- [ ] Dashboard tour: закрити тур → новий браузер/пристрій → тур НЕ показується
