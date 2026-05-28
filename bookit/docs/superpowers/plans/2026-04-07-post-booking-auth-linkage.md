# Post-Booking Auth Linkage — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Гарантувати 100% прив'язку guest bookings до акаунту клієнта через DB тригер — незалежно від мережевих збоїв або закритих табів.

**Architecture:** DB trigger `trg_link_bookings_on_phone` на `profiles.phone` атомарно прив'язує bookings при кожному upsert профілю з телефоном. PostBookingAuth прибирає ненадійний другий fetch. Google OAuth клієнти без телефону отримують mandatory phone onboarding сторінку `/my/setup/phone`.

**Tech Stack:** Next.js 16 App Router, Supabase (PostgreSQL triggers, Admin Client), TypeScript strict, Tailwind CSS v4, Framer Motion, `@supabase/ssr`

**Spec:** `docs/superpowers/specs/2026-04-07-post-booking-auth-linkage-design.md`

---

## File Map

| File | Action | Відповідальність |
|---|---|---|
| `supabase/migrations/063_link_bookings_on_phone_set.sql` | CREATE | Trigger function + trigger |
| `src/app/api/auth/link-booking/route.ts` | DELETE | Більше не потрібен |
| `src/components/public/PostBookingAuth.tsx` | MODIFY | Прибрати link-booking fetch |
| `src/app/my/setup/phone/actions.ts` | CREATE | Server action: verifyOTP + upsert phone |
| `src/components/client/PhoneSetupForm.tsx` | CREATE | Client UI для phone onboarding |
| `src/app/my/setup/phone/page.tsx` | CREATE | Server component wrapper |
| `src/app/auth/callback/route.ts` | MODIFY | Redirect клієнтів без phone до /my/setup/phone |

---

## Task 1: DB Trigger — Атомарна прив'язка bookings

**Files:**
- Create: `bookit/supabase/migrations/063_link_bookings_on_phone_set.sql`

- [ ] **Step 1: Створити файл міграції**

```sql
-- Migration 063: Auto-link guest bookings when profile.phone is set
-- Trigger fires AFTER any INSERT or UPDATE that sets/changes profiles.phone.
-- Atomically updates bookings.client_id = profiles.id
-- for all rows where client_phone = NEW.phone AND client_id IS NULL.

CREATE OR REPLACE FUNCTION public.link_bookings_by_phone()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Тільки якщо phone з'явився або змінився (не NULL → NULL не рахується)
  IF NEW.phone IS NOT NULL
     AND (OLD IS NULL OR OLD.phone IS DISTINCT FROM NEW.phone)
  THEN
    UPDATE bookings
    SET client_id = NEW.id
    WHERE client_phone = NEW.phone
      AND client_id IS NULL;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_link_bookings_on_phone
  AFTER INSERT OR UPDATE OF phone ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.link_bookings_by_phone();

COMMENT ON FUNCTION public.link_bookings_by_phone() IS
  'Auto-links guest bookings to a profile when phone is set/updated. '
  'Fires via trg_link_bookings_on_phone trigger on profiles table.';
```

- [ ] **Step 2: Застосувати міграцію**

```bash
cd bookit
npx supabase db push
```

Expected: `Applying migration 063_link_bookings_on_phone_set.sql... done`

- [ ] **Step 3: Перевірити що тригер існує в БД**

```bash
npx supabase db diff
```

Expected: no pending migrations (empty diff)

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/063_link_bookings_on_phone_set.sql
git commit -m "feat(db): trigger auto-link bookings when profile phone is set"
```

---

## Task 2: Видалити `/api/auth/link-booking` route

**Files:**
- Delete: `src/app/api/auth/link-booking/route.ts`

- [ ] **Step 1: Видалити файл**

```bash
rm bookit/src/app/api/auth/link-booking/route.ts
```

Також видалити порожню директорію якщо залишилась:
```bash
rmdir bookit/src/app/api/auth/link-booking 2>/dev/null || true
```

- [ ] **Step 2: Перевірити що на route більше немає посилань**

```bash
grep -r "link-booking" bookit/src --include="*.ts" --include="*.tsx"
```

Expected: match тільки в `PostBookingAuth.tsx` (яку змінимо в Task 3). Якщо є інші — видалити посилання.

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "chore: remove /api/auth/link-booking route (replaced by DB trigger)"
```

---

## Task 3: PostBookingAuth — прибрати link-booking fetch

**Files:**
- Modify: `src/components/public/PostBookingAuth.tsx:116-122`

- [ ] **Step 1: Відкрити файл і знайти блок для видалення**

У функції `handleVerify()` (рядки ~116-122), знайти і видалити:

```ts
// ВИДАЛИТИ цей блок повністю:
await fetch('/api/auth/link-booking', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ bookingId, phone: getCleanPhone() }),
}).catch(() => {});
```

- [ ] **Step 2: Переконатись що redirect залишився правильним**

Після видалення, кінець функції `handleVerify` має виглядати так:

```ts
    const { error: authError } = await supabase.auth.verifyOtp({
      email: verifyData.email,
      token: verifyData.token,
      type: 'email',
    });

    if (authError) {
      setLoading(false);
      setError('Помилка авторизації. Спробуйте знову.');
      return;
    }

    router.push('/my/bookings');
    router.refresh();
  }
```

`router.refresh()` інвалідує RSC кеш — сторінка `/my/bookings` перезавантажить свіжі дані з сервера.

- [ ] **Step 3: TypeScript check**

```bash
cd bookit && npx tsc --noEmit 2>&1 | head -30
```

Expected: 0 errors

- [ ] **Step 4: Commit**

```bash
git add src/components/public/PostBookingAuth.tsx
git commit -m "fix(auth): remove fire-and-forget link-booking fetch from PostBookingAuth"
```

---

## Task 4: Server Action — `confirmPhone`

**Files:**
- Create: `src/app/my/setup/phone/actions.ts`

Ця дія перевіряє OTP для вже авторизованого Google OAuth клієнта і оновлює `profiles.phone`. Тригер з Task 1 спрацює автоматично.

- [ ] **Step 1: Створити файл**

```ts
'use server';

import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

const phoneSchema = z
  .string()
  .transform(v => v.replace(/\D/g, ''))
  .pipe(z.string().regex(/^380\d{9}$/, 'Некоректний формат телефону (380XXXXXXXXX)'));

const otpSchema = z
  .string()
  .trim()
  .regex(/^\d{6}$/, 'Код має містити 6 цифр');

export async function confirmPhone(
  phone: string,
  otp: string,
): Promise<{ error: string } | { success: true }> {
  // 1. Валідація вхідних даних
  const parsedPhone = phoneSchema.safeParse(phone);
  const parsedOtp = otpSchema.safeParse(otp);

  if (!parsedPhone.success) return { error: parsedPhone.error.issues[0]?.message ?? 'Некоректний телефон' };
  if (!parsedOtp.success) return { error: 'Код має містити 6 цифр' };

  const cleanPhone = parsedPhone.data;
  const cleanOtp = parsedOtp.data;

  // 2. Авторизований користувач (Google OAuth сесія)
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthorized' };

  const admin = createAdminClient();

  // 3. Atomic rate-limit check (той самий RPC що і у verify-sms)
  const { data: allowed, error: rpcError } = await admin.rpc(
    'check_and_log_sms_attempt',
    { p_phone: cleanPhone, max_attempts: 10, window_minutes: 15 },
  );

  if (rpcError) {
    console.error('[confirmPhone] RPC error:', rpcError.message);
    return { error: 'Помилка перевірки. Спробуйте пізніше.' };
  }
  if (!allowed) return { error: 'Забагато спроб. Зачекайте 15 хвилин.' };

  // 4. Отримати OTP-запис
  const { data: record, error: fetchError } = await admin
    .from('sms_otps')
    .select('otp, created_at')
    .eq('phone', cleanPhone)
    .single();

  if (fetchError || !record) {
    return { error: 'Код не знайдено або він застарів. Запросіть новий.' };
  }

  // 5. Перевірка TTL: 10 хвилин
  if (Date.now() - new Date(record.created_at).getTime() > 10 * 60 * 1000) {
    await admin.from('sms_otps').delete().eq('phone', cleanPhone);
    return { error: 'Код застарів. Запросіть новий.' };
  }

  // 6. Перевірка коду
  if (record.otp !== cleanOtp) {
    return { error: 'Невірний код. Спробуйте ще раз.' };
  }

  // 7. Очистити OTP та лог спроб
  await Promise.all([
    admin.from('sms_otps').delete().eq('phone', cleanPhone),
    admin.from('sms_verify_attempts').delete().eq('phone', cleanPhone),
  ]);

  // 8. Перевірка: чи не зайнятий номер іншим акаунтом
  const { data: conflict } = await admin
    .from('profiles')
    .select('id')
    .eq('phone', cleanPhone)
    .neq('id', user.id)
    .maybeSingle();

  if (conflict) {
    return { error: 'Цей номер вже прив\'язаний до іншого акаунту. Зверніться до підтримки.' };
  }

  // 9. Оновити phone у profiles → тригер trg_link_bookings_on_phone спрацює автоматично
  const { error: upsertError } = await admin
    .from('profiles')
    .upsert(
      { id: user.id, phone: cleanPhone },
      { onConflict: 'id', ignoreDuplicates: false },
    );

  if (upsertError && upsertError.code !== '23505') {
    console.error('[confirmPhone] upsert error:', upsertError.message);
    return { error: 'Помилка збереження номеру. Спробуйте ще раз.' };
  }

  return { success: true };
}
```

- [ ] **Step 2: TypeScript check**

```bash
cd bookit && npx tsc --noEmit 2>&1 | head -30
```

Expected: 0 errors

- [ ] **Step 3: Commit**

```bash
git add src/app/my/setup/phone/actions.ts
git commit -m "feat(auth): confirmPhone server action for Google OAuth phone onboarding"
```

---

## Task 5: PhoneSetupForm — клієнтський компонент

**Files:**
- Create: `src/components/client/PhoneSetupForm.tsx`

Stripped-down версія `PhoneOtpForm` — без вибору ролі, без Google, без кнопки "пропустити". Починається одразу зі step `phone`.

- [ ] **Step 1: Створити компонент**

```tsx
'use client';

import { useState, useRef, useEffect, KeyboardEvent, ClipboardEvent, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Loader2, Phone, MessageSquare } from 'lucide-react';
import { confirmPhone } from '@/app/my/setup/phone/actions';
import { formatPhoneDisplay, normalizePhoneInput, toFullPhone } from '@/lib/utils/phone';

type Step = 'phone' | 'otp';

export function PhoneSetupForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [step, setStep] = useState<Step>('phone');
  // phone — 9 цифр без ведучого 0 (як в PostBookingAuth і PhoneOtpForm)
  const [phone, setPhone] = useState('');
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);

  const digitRefs = useRef<(HTMLInputElement | null)[]>([]);
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => () => { if (cooldownRef.current) clearInterval(cooldownRef.current); }, []);

  function getCleanPhone() {
    return toFullPhone(phone);
  }

  function handlePhoneChange(val: string) {
    setPhone(normalizePhoneInput(val));
    setError('');
  }

  // ── Крок 1: Відправка SMS ────────────────────────────────────────────────
  async function handleSendSms() {
    if (phone.length < 9) { setError('Введіть повний номер телефону'); return; }
    setLoading(true);
    setError('');

    const res = await fetch('/api/auth/send-sms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: getCleanPhone() }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) { setError(data.error || 'Помилка відправки SMS'); return; }
    setStep('otp');
    startCooldown();
  }

  // ── Крок 2: Верифікація OTP через server action ──────────────────────────
  async function handleVerify(otpOverride?: string) {
    const otp = otpOverride ?? digits.join('');
    if (otp.length < 6) { setError('Введіть 6-значний код'); return; }

    startTransition(async () => {
      const result = await confirmPhone(getCleanPhone(), otp);

      if ('error' in result) {
        setError(result.error);
        setDigits(['', '', '', '', '', '']);
        digitRefs.current[0]?.focus();
        return;
      }

      // Успіх — тригер вже спрацював, bookings прив'язані
      router.push('/my/bookings');
      router.refresh();
    });
  }

  // ── OTP digit handlers ────────────────────────────────────────────────────
  function handleDigitChange(i: number, val: string) {
    const char = val.replace(/\D/g, '').slice(-1);
    const next = [...digits];
    next[i] = char;
    setDigits(next);
    setError('');
    if (char && i < 5) digitRefs.current[i + 1]?.focus();
    if (next.every(d => d !== '') && char) setTimeout(() => handleVerify(next.join('')), 80);
  }

  function handleDigitKeyDown(i: number, e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace' && !digits[i] && i > 0) digitRefs.current[i - 1]?.focus();
  }

  function handlePaste(e: ClipboardEvent<HTMLInputElement>) {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;
    const next = [...digits];
    pasted.split('').forEach((c, i) => { if (i < 6) next[i] = c; });
    setDigits(next);
    digitRefs.current[Math.min(pasted.length, 5)]?.focus();
    if (pasted.length === 6) setTimeout(() => handleVerify(pasted), 80);
  }

  function startCooldown() {
    if (cooldownRef.current) clearInterval(cooldownRef.current);
    setResendCooldown(60);
    cooldownRef.current = setInterval(() => {
      setResendCooldown(p => {
        if (p <= 1) { clearInterval(cooldownRef.current!); cooldownRef.current = null; return 0; }
        return p - 1;
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
    if (res.ok) startCooldown();
    else { const d = await res.json(); setError(d.error || 'Помилка'); }
  }

  const isSubmitting = loading || isPending;

  return (
    <AnimatePresence mode="wait">

      {/* ── Введення телефону ─────────────────────────────────────────────── */}
      {step === 'phone' && (
        <motion.div
          key="phone"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.22 }}
          className="flex flex-col gap-4"
        >
          <div className="text-center mb-2">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#789A99]/15 mb-4">
              <Phone size={24} className="text-[#789A99]" />
            </div>
            <h1 className="heading-serif text-2xl text-[#2C1A14] mb-1.5">
              Підтвердіть номер
            </h1>
            <p className="text-sm text-[#A8928D] leading-relaxed">
              Номер телефону — обов'язкова умова.<br />
              Він потрібен для доступу до ваших записів.
            </p>
          </div>

          <div className="flex items-center gap-0 rounded-2xl border border-[#E8D0C8] bg-white overflow-hidden focus-within:border-[#789A99] focus-within:ring-2 focus-within:ring-[#789A99]/20 transition-all">
            <span className="pl-4 pr-2 text-[#6B5750] font-medium text-base select-none shrink-0">+38</span>
            <input
              type="tel"
              inputMode="numeric"
              placeholder="0XX XXX XX XX"
              value={formatPhoneDisplay(phone)}
              onChange={e => handlePhoneChange(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSendSms()}
              autoFocus
              autoComplete="tel-national"
              className="flex-1 py-4 pr-4 text-[#2C1A14] text-base bg-transparent outline-none placeholder:text-[#C4A89E]"
            />
          </div>

          {error && <p className="text-sm text-[#C05B5B] pl-1">{error}</p>}

          <button
            type="button"
            onClick={handleSendSms}
            disabled={isSubmitting || phone.length < 9}
            className="flex items-center justify-center gap-2 w-full py-4 rounded-2xl bg-[#789A99] text-white text-base font-semibold hover:bg-[#6a8988] active:scale-[0.98] transition-all shadow-lg shadow-[#789A99]/25 disabled:opacity-50"
          >
            {isSubmitting && <Loader2 size={18} className="animate-spin" />}
            {isSubmitting ? 'Відправляємо...' : 'Отримати код'}
          </button>
        </motion.div>
      )}

      {/* ── Введення OTP ──────────────────────────────────────────────────── */}
      {step === 'otp' && (
        <motion.div
          key="otp"
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -16 }}
          transition={{ duration: 0.2 }}
          className="flex flex-col gap-4"
        >
          <div className="text-center mb-2">
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

          <div className="flex justify-center gap-2.5">
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
                onPaste={i === 0 ? handlePaste : undefined}
                autoFocus={i === 0}
                className="w-11 h-14 text-center text-xl font-bold text-[#2C1A14] rounded-2xl border-2 border-[#E8D0C8] bg-white outline-none focus:border-[#789A99] focus:ring-2 focus:ring-[#789A99]/20 transition-all"
              />
            ))}
          </div>

          {error && <p className="text-sm text-[#C05B5B] text-center">{error}</p>}

          <button
            type="button"
            onClick={() => handleVerify()}
            disabled={isSubmitting || digits.some(d => !d)}
            className="flex items-center justify-center gap-2 w-full py-4 rounded-2xl bg-[#789A99] text-white text-base font-semibold hover:bg-[#6a8988] active:scale-[0.98] transition-all shadow-lg shadow-[#789A99]/25 disabled:opacity-50"
          >
            {isSubmitting && <Loader2 size={18} className="animate-spin" />}
            {isSubmitting ? 'Перевіряємо...' : 'Підтвердити'}
          </button>

          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => { setStep('phone'); setDigits(['', '', '', '', '', '']); setError(''); }}
              className="flex items-center gap-1.5 text-sm text-[#6B5750] hover:text-[#2C1A14] transition-colors"
            >
              <ArrowLeft size={15} /> Змінити номер
            </button>
            <button
              type="button"
              onClick={handleResend}
              disabled={resendCooldown > 0}
              className="text-sm text-[#789A99] font-medium disabled:text-[#A8928D] disabled:cursor-default hover:underline"
            >
              {resendCooldown > 0 ? `Через ${resendCooldown}с` : 'Надіслати знову'}
            </button>
          </div>
        </motion.div>
      )}

    </AnimatePresence>
  );
}
```

- [ ] **Step 2: TypeScript check**

```bash
cd bookit && npx tsc --noEmit 2>&1 | head -30
```

Expected: 0 errors

- [ ] **Step 3: Commit**

```bash
git add src/components/client/PhoneSetupForm.tsx
git commit -m "feat(client): PhoneSetupForm component for mandatory phone onboarding"
```

---

## Task 6: Сторінка `/my/setup/phone`

**Files:**
- Create: `src/app/my/setup/phone/page.tsx`

Сторінка захищена автоматично — `src/app/my/layout.tsx` redirects до `/login` якщо немає сесії.

- [ ] **Step 1: Створити page.tsx**

```tsx
import { PhoneSetupForm } from '@/components/client/PhoneSetupForm';
import { BlobBackground } from '@/components/shared/BlobBackground';

export const metadata = { title: 'Підтвердження номеру — BookIT' };

export default function PhoneSetupPage() {
  return (
    <div className="min-h-dvh flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-1.5 bg-[#789A99]/12 rounded-full px-3 py-1 mb-4">
            <span className="text-[10px] font-semibold text-[#789A99] uppercase tracking-widest">
              Один крок до акаунту
            </span>
          </div>
        </div>

        {/* Form card */}
        <div
          className="rounded-3xl p-6"
          style={{
            background: 'rgba(255,255,255,0.72)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(255,255,255,0.9)',
            boxShadow: '0 4px 32px rgba(44,26,20,0.08)',
          }}
        >
          <PhoneSetupForm />
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: TypeScript check**

```bash
cd bookit && npx tsc --noEmit 2>&1 | head -30
```

Expected: 0 errors

- [ ] **Step 3: Перевірити що `/my/setup/phone` рендериться без помилок**

```bash
cd bookit && npx next build 2>&1 | tail -20
```

Expected: successful build, route `/my/setup/phone` visible in output

- [ ] **Step 4: Commit**

```bash
git add src/app/my/setup/phone/page.tsx
git commit -m "feat(client): /my/setup/phone mandatory phone onboarding page"
```

---

## Task 7: `auth/callback` — redirect клієнтів без телефону

**Files:**
- Modify: `src/app/auth/callback/route.ts:114-132`

Додаємо перевірку після `client_profiles.upsert` — якщо у клієнта немає телефону → redirect на `/my/setup/phone`.

- [ ] **Step 1: Знайти блок для модифікації**

У файлі `src/app/auth/callback/route.ts`, знайти секцію `else` (client role, рядки ~114-132):

```ts
  } else {
    await admin.from('client_profiles').upsert(
      { id: user.id },
      { onConflict: 'id', ignoreDuplicates: true }
    );
  }

  // Link a pending booking for clients
  if (bid && user.email) {
    await admin.from('bookings')
      .update({ client_id: user.id })
      .eq('id', bid)
      .eq('client_email', user.email)
      .is('client_id', null);
  }
}

return NextResponse.redirect(new URL(next, origin));
```

- [ ] **Step 2: Замінити на нову версію**

```ts
  } else {
    await admin.from('client_profiles').upsert(
      { id: user.id },
      { onConflict: 'id', ignoreDuplicates: true }
    );

    // Клієнти без підтвердженого телефону → mandatory phone onboarding.
    // Тригер trg_link_bookings_on_phone прив'яже bookings автоматично після setup.
    const { data: profile } = await admin
      .from('profiles')
      .select('phone')
      .eq('id', user.id)
      .single();

    if (!profile?.phone) {
      return NextResponse.redirect(new URL('/my/setup/phone', origin));
    }
  }

  return NextResponse.redirect(new URL(next, origin));
```

**Важливо:** видалити старий блок email-based booking link для клієнтів (він більше не потрібен — тригер покриває по phone):

```ts
  // ВИДАЛИТИ цей блок:
  // Link a pending booking for clients
  // Verify email ownership to prevent IDOR via crafted ?bid= URL param
  if (bid && user.email) {
    await admin.from('bookings')
      .update({ client_id: user.id })
      .eq('id', bid)
      .eq('client_email', user.email)
      .is('client_id', null);
  }
```

- [ ] **Step 3: Перевірити що master flow не змінився**

Master redirect logic (рядки ~91-113) не торкаємось. Блок `if (assignedRole === 'master')` повертається раніше через `return NextResponse.redirect(...)` — наш новий код в `else` блоці ніколи не виконається для майстрів.

- [ ] **Step 4: TypeScript check**

```bash
cd bookit && npx tsc --noEmit 2>&1 | head -30
```

Expected: 0 errors

- [ ] **Step 5: Commit**

```bash
git add src/app/auth/callback/route.ts
git commit -m "feat(auth): redirect Google OAuth clients without phone to /my/setup/phone"
```

---

## Фінальна перевірка

- [ ] **Build check**

```bash
cd bookit && npx next build 2>&1 | tail -30
```

Expected: successful build, no TypeScript errors, no missing imports

- [ ] **Перевірити всі нові міграції застосовані**

```bash
cd bookit && npx supabase db diff
```

Expected: empty diff (всі міграції застосовані)

- [ ] **Перевірити що link-booking більше не згадується в коді**

```bash
grep -r "link-booking" bookit/src --include="*.ts" --include="*.tsx"
```

Expected: no matches

- [ ] **Фінальний commit тільки якщо є незакомічені зміни**

```bash
git status
```

---

## Резюме: Як вирішено проблему orphaned bookings

| Сценарій | До | Після |
|---|---|---|
| SMS OTP через PostBookingAuth | Client-side fetch `.catch(()=>{})` — ненадійно | `verify-sms` upserts `profiles.phone` → DB trigger auto-links |
| Google OAuth + є phone у профілі | Не покривалось | `auth/callback` phone check passes → `/my/bookings` |
| Google OAuth + немає phone | Bookings залишались orphaned | Redirect → `/my/setup/phone` → OTP → upsert phone → trigger |
| Прямий SMS login (не через PostBookingAuth) | Не покривалось | `verify-sms` upserts phone → trigger auto-links |
| Будь-який майбутній auth метод | N/A | Будь-який upsert `profiles.phone` → trigger |
