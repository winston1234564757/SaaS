# Auth State Persistence (Onboarding) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Persist onboarding wizard step and all form field values to the DB so users resume exactly where they left off after refresh/close.

**Architecture:** Add `onboarding_step` + `onboarding_data` columns to `profiles`, save a full flat JSONB snapshot on every step transition (fire-and-forget), hydrate wizard state from DB on page load via async Server Component.

**Tech Stack:** Next.js App Router, Supabase (PostgreSQL + JS client), TypeScript strict, React useState

---

## File Map

| Action | Path | Responsibility |
|--------|------|----------------|
| CREATE | `bookit/supabase/migrations/080_onboarding_persistence.sql` | DB columns + CHECK constraint |
| CREATE | `bookit/src/types/onboarding.ts` | `OnboardingData` interface + `Step` re-export |
| MODIFY | `bookit/src/app/(master)/dashboard/onboarding/actions.ts` | Add `saveOnboardingProgress` |
| MODIFY | `bookit/src/app/(master)/dashboard/onboarding/page.tsx` | Async server component — fetch + pass props |
| MODIFY | `bookit/src/components/master/onboarding/OnboardingWizard.tsx` | Props, hydration, persistProgress, hook handlers |
| MODIFY | `bookit/BOOKIT.md` | Changelog entry |

---

## Task 1: Database Migration

**Files:**
- Create: `bookit/supabase/migrations/080_onboarding_persistence.sql`

- [ ] **Step 1: Create migration file**

```sql
-- Migration 080: onboarding state persistence
-- Adds onboarding_step + onboarding_data to profiles
-- so users resume exactly where they left off after refresh/close.

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS onboarding_step TEXT NOT NULL DEFAULT 'BASIC',
  ADD COLUMN IF NOT EXISTS onboarding_data JSONB  NOT NULL DEFAULT '{}'::jsonb;

-- Guard: only valid wizard steps allowed at DB level
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_onboarding_step_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_onboarding_step_check
  CHECK (onboarding_step IN (
    'BASIC',
    'SCHEDULE_PROMPT',
    'SCHEDULE_FORM',
    'SERVICES_PROMPT',
    'SERVICES_FORM',
    'SUCCESS'
  ));

-- Fast lookup when hydrating the wizard on page load
CREATE INDEX IF NOT EXISTS profiles_onboarding_step_idx
  ON profiles (onboarding_step)
  WHERE onboarding_step <> 'SUCCESS';
```

- [ ] **Step 2: Push migration to Supabase**

```bash
cd bookit
npx supabase db push
```

Expected: `Applying migration 080_onboarding_persistence.sql... Done`

- [ ] **Step 3: Verify columns exist**

```bash
npx supabase db diff --use-migra
```

Expected: no diff (migration already applied).

- [ ] **Step 4: Commit**

```bash
git add bookit/supabase/migrations/080_onboarding_persistence.sql
git commit -m "feat(db): migration 080 — onboarding step + data persistence"
```

---

## Task 2: TypeScript Types

**Files:**
- Create: `bookit/src/types/onboarding.ts`

- [ ] **Step 1: Create types file**

```ts
// src/types/onboarding.ts
import type { DayKey, DaySchedule, Step } from '@/components/master/onboarding/steps/types';

export type { Step };

export interface OnboardingData {
  // BASIC step
  fullName?: string;
  specialization?: string;
  phone?: string;
  avatarUrl?: string;

  // SCHEDULE_FORM step
  schedule?: Record<DayKey, DaySchedule>;
  bufferTime?: number;
  breaks?: Array<{ start: string; end: string }>;

  // SERVICES_FORM step
  serviceName?: string;
  servicePrice?: string;
  serviceDuration?: number;
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd bookit
npx tsc --noEmit 2>&1 | head -20
```

Expected: no errors related to `src/types/onboarding.ts`

- [ ] **Step 3: Commit**

```bash
git add bookit/src/types/onboarding.ts
git commit -m "feat(types): OnboardingData interface for persistence"
```

---

## Task 3: Server Action — `saveOnboardingProgress`

**Files:**
- Modify: `bookit/src/app/(master)/dashboard/onboarding/actions.ts`

- [ ] **Step 1: Add import and action to actions.ts**

Add at the top of the file (after existing imports):

```ts
import type { OnboardingData, Step } from '@/types/onboarding';
```

Add at the end of the file:

```ts
export async function saveOnboardingProgress(
  step: Step,
  data: OnboardingData,
): Promise<{ error: string | null }> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Не авторизований' };

  const { error } = await supabase
    .from('profiles')
    .update({ onboarding_step: step, onboarding_data: data })
    .eq('id', user.id);

  if (error) return { error: error.message };
  return { error: null };
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd bookit
npx tsc --noEmit 2>&1 | head -20
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add bookit/src/app/\(master\)/dashboard/onboarding/actions.ts
git commit -m "feat(actions): saveOnboardingProgress — fire-and-forget step tracker"
```

---

## Task 4: Async Server Component — `onboarding/page.tsx`

**Files:**
- Modify: `bookit/src/app/(master)/dashboard/onboarding/page.tsx`

- [ ] **Step 1: Replace page.tsx with async version**

```tsx
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { BlobBackground } from '@/components/shared/BlobBackground';
import { OnboardingWizard } from '@/components/master/onboarding/OnboardingWizard';
import type { Step, OnboardingData } from '@/types/onboarding';

export const metadata: Metadata = { title: 'Налаштування профілю — Bookit' };

export default async function OnboardingPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('onboarding_step, onboarding_data')
    .eq('id', user.id)
    .maybeSingle();

  const initialStep = (profile?.onboarding_step as Step | undefined) ?? 'BASIC';
  const initialData = (profile?.onboarding_data ?? {}) as OnboardingData;

  // User already completed onboarding — skip wizard
  if (initialStep === 'SUCCESS') redirect('/dashboard');

  return (
    <>
      <BlobBackground />
      <OnboardingWizard initialStep={initialStep} initialData={initialData} />
    </>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd bookit
npx tsc --noEmit 2>&1 | head -20
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add bookit/src/app/\(master\)/dashboard/onboarding/page.tsx
git commit -m "feat(onboarding): async page — hydrate wizard step+data from DB"
```

---

## Task 5: OnboardingWizard — Hydration & persistProgress

**Files:**
- Modify: `bookit/src/components/master/onboarding/OnboardingWizard.tsx`

- [ ] **Step 1: Replace OnboardingWizard.tsx with full hydrated version**

```tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import { useMasterContext } from '@/lib/supabase/context';
import { useToast } from '@/lib/toast/context';
import {
  revalidateAfterOnboarding,
  saveOnboardingProfile,
  saveOnboardingSchedule,
  saveOnboardingService,
  saveOnboardingProgress,
} from '@/app/(master)/dashboard/onboarding/actions';
import { e164ToInputPhone, toFullPhone } from '@/lib/utils/phone';
import { generateSecureToken } from '@/lib/utils/token';
import type { OnboardingData } from '@/types/onboarding';
import {
  type Step, type DayKey, type DaySchedule,
  STEP_ORDER, DEFAULT_SCHEDULE, TEMPLATE_SCHEDULE,
} from './steps/types';
import { StepBasic } from './steps/StepBasic';
import { StepSchedulePrompt } from './steps/StepSchedulePrompt';
import { StepScheduleForm } from './steps/StepScheduleForm';
import { StepServicesPrompt } from './steps/StepServicesPrompt';
import { StepServicesForm } from './steps/StepServicesForm';
import { StepSuccess } from './steps/StepSuccess';

interface OnboardingWizardProps {
  initialStep: Step;
  initialData: OnboardingData;
}

function getProgressStep(s: Step): number {
  if (s === 'BASIC') return 1;
  if (s === 'SCHEDULE_PROMPT' || s === 'SCHEDULE_FORM') return 2;
  return 3;
}

export function OnboardingWizard({ initialStep, initialData }: OnboardingWizardProps) {
  const { profile, refresh } = useMasterContext();
  const { showToast } = useToast();
  const router = useRouter();
  const supabase = createClient();

  const [step, setStep] = useState<Step>(initialStep);
  const [direction, setDirection] = useState<1 | -1>(1);
  const [saving, setSaving] = useState(false);
  const [savedSlug, setSavedSlug] = useState('');
  const [copied, setCopied] = useState(false);

  // BASIC
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState('');
  const [fullName, setFullName] = useState(initialData.fullName ?? profile?.full_name ?? '');
  const [phone, setPhone] = useState(initialData.phone ?? e164ToInputPhone(profile?.phone));
  const hasPhone = !!profile?.phone;
  const [specialization, setSpecialization] = useState(initialData.specialization ?? '💅');

  // SCHEDULE_FORM
  const [schedule, setSchedule] = useState<Record<DayKey, DaySchedule>>(
    initialData.schedule ?? DEFAULT_SCHEDULE
  );
  const [bufferTime, setBufferTime] = useState(initialData.bufferTime ?? 0);
  const [breaks, setBreaks] = useState<Array<{ start: string; end: string }>>(
    initialData.breaks ?? []
  );

  // SERVICES_FORM
  const [serviceName, setServiceName] = useState(initialData.serviceName ?? '');
  const [servicePrice, setServicePrice] = useState(initialData.servicePrice ?? '');
  const [serviceDuration, setServiceDuration] = useState(initialData.serviceDuration ?? 60);

  function goTo(next: Step) {
    const currentIdx = STEP_ORDER.indexOf(step);
    const nextIdx = STEP_ORDER.indexOf(next);
    setDirection(nextIdx >= currentIdx ? 1 : -1);
    setStep(next);
  }

  function buildSnapshot(): OnboardingData {
    return {
      fullName,
      specialization,
      phone,
      schedule,
      bufferTime,
      breaks,
      serviceName,
      servicePrice,
      serviceDuration,
    };
  }

  function persistProgress(nextStep: Step) {
    saveOnboardingProgress(nextStep, buildSnapshot()).catch(err =>
      console.error('[onboarding] progress save failed:', err)
    );
  }

  async function handleSaveProfile() {
    if (!fullName.trim()) return;
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const uid = profile?.id ?? user.id;

      let avatarUrl: string | null = null;
      if (avatarFile) {
        const ext = avatarFile.name.split('.').pop() ?? 'jpg';
        const path = `avatars/${uid}/${uid}.${ext}`;
        let uploadTimeoutId: ReturnType<typeof setTimeout> | undefined;
        try {
          const { data: up, error: upError } = await Promise.race([
            supabase.storage.from('images').upload(path, avatarFile, { upsert: true }),
            new Promise<never>((_, reject) => {
              uploadTimeoutId = setTimeout(() => reject(new Error('Timeout завантаження аватара')), 10_000);
            }),
          ]);
          clearTimeout(uploadTimeoutId);
          if (up) {
            const { data: urlData } = supabase.storage.from('images').getPublicUrl(path);
            avatarUrl = urlData.publicUrl;
          } else if (upError) {
            console.error('[onboarding] avatar upload error:', upError.message);
            showToast({ type: 'error', title: 'Аватар не завантажено', message: 'Спробуйте пізніше в налаштуваннях' });
          }
        } catch (uploadErr) {
          clearTimeout(uploadTimeoutId);
          console.error('[onboarding] avatar upload failed:', uploadErr);
          showToast({ type: 'error', title: 'Аватар не завантажено', message: 'Спробуйте пізніше в налаштуваннях' });
        }
      }

      const nameSlug = fullName.trim()
        .toLowerCase()
        .replace(/[іїєьъ]/g, '')
        .replace(/[^a-z0-9]/gi, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 24);
      const finalSlug = nameSlug || `master-${uid.slice(0, 8)}`;

      const referralCode = generateSecureToken(8);

      const { error } = await saveOnboardingProfile({
        fullName: fullName.trim(),
        phone: phone.trim() ? toFullPhone(phone) : null,
        avatarUrl,
        avatarEmoji: specialization,
        slug: finalSlug,
        referralCode,
      });

      if (error) { showToast({ type: 'error', title: 'Помилка збереження', message: error }); return; }

      setSavedSlug(finalSlug);
      persistProgress('SCHEDULE_PROMPT');
      goTo('SCHEDULE_PROMPT');
    } catch (err: unknown) {
      showToast({ type: 'error', title: 'Помилка', message: err instanceof Error ? err.message : 'Щось пішло не так' });
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveSchedule() {
    setSaving(true);
    try {
      const { error } = await saveOnboardingSchedule({ schedule, bufferTime, breaks });
      if (error) { showToast({ type: 'error', title: 'Помилка збереження', message: error }); return; }
      persistProgress('SERVICES_PROMPT');
      goTo('SERVICES_PROMPT');
    } catch (err: unknown) {
      showToast({ type: 'error', title: 'Помилка', message: err instanceof Error ? err.message : 'Щось пішло не так' });
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveService() {
    if (!serviceName.trim() || !servicePrice) {
      persistProgress('SUCCESS');
      goTo('SUCCESS');
      return;
    }
    setSaving(true);
    try {
      const { error } = await saveOnboardingService({
        name: serviceName.trim(),
        emoji: specialization,
        price: parseFloat(servicePrice),
        durationMinutes: serviceDuration,
      });
      if (error) { showToast({ type: 'error', title: 'Помилка збереження', message: error }); return; }
      persistProgress('SUCCESS');
      goTo('SUCCESS');
    } catch (err: unknown) {
      showToast({ type: 'error', title: 'Помилка', message: err instanceof Error ? err.message : 'Щось пішло не так' });
    } finally {
      setSaving(false);
    }
  }

  async function handleComplete() {
    // Await final save — marks onboarding as done so page.tsx redirects on revisit
    await saveOnboardingProgress('SUCCESS', buildSnapshot());
    await revalidateAfterOnboarding();
    await refresh();
    if (typeof window !== 'undefined') localStorage.setItem('bookit_hints_pending', 'true');
    router.push('/dashboard');
  }

  function handleCopyLink() {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://bookit.com.ua';
    navigator.clipboard.writeText(`${origin}/${savedSlug}`).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  }

  const slideVariants = {
    enter: (dir: number) => ({ opacity: 0, x: dir * 44, scale: 0.97 }),
    center: { opacity: 1, x: 0, scale: 1 },
    exit: (dir: number) => ({ opacity: 0, x: dir * -44, scale: 0.97 }),
  };
  const transition = { type: 'spring' as const, stiffness: 320, damping: 28 };
  const progressStep = getProgressStep(step);
  const showProgress = step !== 'SUCCESS';

  return (
    <div className="min-h-dvh flex flex-col items-center justify-start px-4 py-8">
      <div className="w-full max-w-sm">

        <p className="text-center mb-7">
          <span className="font-serif text-2xl font-semibold text-[#2C1A14]">
            Bookit<span className="text-[#789A99]">.</span>
          </span>
        </p>

        {showProgress && (
          <div className="flex items-center gap-1.5 mb-6">
            {[1, 2, 3].map(n => (
              <div
                key={n}
                className="flex-1 h-1.5 rounded-full transition-all duration-500"
                style={{ background: progressStep >= n ? '#789A99' : '#E8D5CF' }}
              />
            ))}
          </div>
        )}

        <AnimatePresence mode="wait" custom={direction}>
          {step === 'BASIC' && (
            <StepBasic
              direction={direction} slideVariants={slideVariants} transition={transition}
              avatarPreview={avatarPreview} specialization={specialization}
              fullName={fullName} phone={phone} hasPhone={hasPhone} saving={saving}
              onAvatarChange={e => { const f = e.target.files?.[0]; if (f) { setAvatarFile(f); setAvatarPreview(URL.createObjectURL(f)); } }}
              onSpecializationChange={setSpecialization}
              onFullNameChange={setFullName}
              onPhoneChange={setPhone}
              onSave={handleSaveProfile}
            />
          )}
          {step === 'SCHEDULE_PROMPT' && (
            <StepSchedulePrompt
              direction={direction} slideVariants={slideVariants} transition={transition}
              onSetupSchedule={() => { persistProgress('SCHEDULE_FORM'); goTo('SCHEDULE_FORM'); }}
              onSkip={() => { persistProgress('SERVICES_PROMPT'); goTo('SERVICES_PROMPT'); }}
            />
          )}
          {step === 'SCHEDULE_FORM' && (
            <StepScheduleForm
              direction={direction} slideVariants={slideVariants} transition={transition}
              schedule={schedule} bufferTime={bufferTime} breaks={breaks} saving={saving}
              onToggleDay={day => setSchedule(s => ({ ...s, [day]: { ...s[day], is_working: !s[day].is_working } }))}
              onScheduleTimeChange={(day, field, val) => setSchedule(s => ({ ...s, [day]: { ...s[day], [field]: val } }))}
              onBufferChange={setBufferTime}
              onAddBreak={() => setBreaks(prev => [...prev, { start: '13:00', end: '14:00' }])}
              onRemoveBreak={i => setBreaks(prev => prev.filter((_, idx) => idx !== i))}
              onBreakFieldChange={(i, field, val) => setBreaks(prev => prev.map((b, idx) => idx === i ? { ...b, [field]: val } : b))}
              onApplyTemplate={() => setSchedule(TEMPLATE_SCHEDULE)}
              onBack={() => { persistProgress('SCHEDULE_PROMPT'); goTo('SCHEDULE_PROMPT'); }}
              onSave={handleSaveSchedule}
            />
          )}
          {step === 'SERVICES_PROMPT' && (
            <StepServicesPrompt
              direction={direction} slideVariants={slideVariants} transition={transition}
              onAddService={() => { persistProgress('SERVICES_FORM'); goTo('SERVICES_FORM'); }}
              onSkip={handleComplete}
            />
          )}
          {step === 'SERVICES_FORM' && (
            <StepServicesForm
              direction={direction} slideVariants={slideVariants} transition={transition}
              serviceName={serviceName} servicePrice={servicePrice} serviceDuration={serviceDuration}
              saving={saving}
              onServiceNameChange={setServiceName}
              onServicePriceChange={setServicePrice}
              onServiceDurationChange={setServiceDuration}
              onSave={handleSaveService}
              onBack={() => { persistProgress('SERVICES_PROMPT'); goTo('SERVICES_PROMPT'); }}
            />
          )}
          {step === 'SUCCESS' && (
            <StepSuccess
              direction={direction} slideVariants={slideVariants} transition={transition}
              savedSlug={savedSlug} copied={copied}
              onCopyLink={handleCopyLink}
              onComplete={handleComplete}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd bookit
npx tsc --noEmit 2>&1 | head -20
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add bookit/src/components/master/onboarding/OnboardingWizard.tsx
git commit -m "feat(onboarding): hydrate wizard from DB + fire-and-forget persistProgress"
```

---

## Task 6: Changelog

**Files:**
- Modify: `bookit/BOOKIT.md`

- [ ] **Step 1: Add changelog entry**

In `BOOKIT.md`, find the most recent iteration entry and prepend:

```markdown
## Ітерація 28 — Auth State Persistence (Onboarding) [2026-04-22]

- **Migration 080**: `profiles.onboarding_step TEXT` + `profiles.onboarding_data JSONB` — DB-level CHECK constraint на валідні кроки
- **`saveOnboardingProgress`**: нова server action у `onboarding/actions.ts` — fire-and-forget tracker без revalidatePath
- **`OnboardingPage`**: async Server Component — читає `onboarding_step`/`onboarding_data`, якщо `SUCCESS` → redirect `/dashboard`
- **`OnboardingWizard`**: приймає `initialStep` + `initialData` props, гідрує всі `useState` з DB, `persistProgress()` після кожного переходу між кроками (включно зі skip-handlers)
- **Zero data loss**: юзер закрив браузер на `SCHEDULE_FORM` → повертається на `SCHEDULE_FORM` з заповненими полями
```

- [ ] **Step 2: Commit**

```bash
git add bookit/BOOKIT.md
git commit -m "docs(changelog): iteration 28 — onboarding state persistence"
```

---

## Self-Review Checklist

- [x] Migration covers both columns + constraint + index
- [x] `OnboardingData` types match actual field names in wizard
- [x] `saveOnboardingProgress` — no revalidatePath (correct — fire-and-forget)
- [x] `handleComplete` — **awaits** `saveOnboardingProgress('SUCCESS', ...)` (not fire-and-forget — this is the terminal state)
- [x] Skip handlers (SCHEDULE_PROMPT → skip, SERVICES_PROMPT → skip, SERVICES_FORM back) all call `persistProgress` before `goTo`
- [x] `initialData.schedule` fallback to `DEFAULT_SCHEDULE` (not undefined)
- [x] `page.tsx` — `SUCCESS` guard redirects to `/dashboard` on revisit
- [x] All 6 files accounted for in File Map
