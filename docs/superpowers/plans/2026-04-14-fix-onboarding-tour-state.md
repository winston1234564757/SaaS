# Fix Onboarding Tour State Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make all dashboard and feature-page tours cross-device stable by persisting completion state in DB (`seen_tours JSONB`), eliminating fire-and-forget failures and localStorage-only cross-device bugs.

**Architecture:** Add `seen_tours JSONB` column to `master_profiles`. Generalize `markTourSeen(tourName)` server action with fetch-merge-update to safely accumulate tour keys. Rewrite `DashboardTourContext` to read from `useMasterContext()` (no server prop, no localStorage) with `useMutation` + optimistic hide. Upgrade `useTour` hook with `initialSeen`/`onComplete` options; all 7 feature pages opt in.

**Tech Stack:** Next.js 15 App Router, Supabase (PostgreSQL + server client), TanStack Query v5 (`useMutation`), TypeScript strict

---

## Files Map

| File | Action |
|---|---|
| `supabase/migrations/073_seen_tours.sql` | **Create** — add `seen_tours JSONB` column |
| `src/types/database.ts` | **Modify** — add `seen_tours` to `MasterProfile` |
| `src/app/(master)/layout.tsx` | **Modify** — add `seen_tours` to master_profiles select |
| `src/lib/supabase/context.tsx` | **Modify** — add `seen_tours` to `fetchProfile` select |
| `src/app/(master)/dashboard/actions.ts` | **Modify** — generalize `markTourSeen(tourName)` |
| `src/components/master/dashboard/DashboardTourContext.tsx` | **Modify** — full rewrite: context reads from `useMasterContext`, uses `useMutation` |
| `src/app/(master)/dashboard/page.tsx` | **Modify** — remove server DB fetch + `initialHasSeenTour` prop |
| `src/lib/hooks/useTour.ts` | **Modify** — add `UseTourOptions` interface + `initialSeen` / `onComplete` |
| `src/components/master/reviews/ReviewsPage.tsx` | **Modify** — pass `initialSeen` + `onComplete` to `useTour` |
| `src/components/master/analytics/AnalyticsPage.tsx` | **Modify** — pass `initialSeen` + `onComplete` to `useTour` |
| `src/components/master/settings/SettingsPage.tsx` | **Modify** — pass `initialSeen` + `onComplete` to `useTour` |
| `src/components/master/loyalty/LoyaltyPage.tsx` | **Modify** — pass `initialSeen` + `onComplete` to `useTour` |
| `src/components/master/flash/FlashDealPage.tsx` | **Modify** — pass `initialSeen` + `onComplete` to `useTour` |
| `src/components/master/referral/ReferralPage.tsx` | **Modify** — add `useMasterContext` + pass `initialSeen` / `onComplete` |
| `src/components/master/pricing/DynamicPricingPage.tsx` | **Modify** — add `useMasterContext` + pass `initialSeen` / `onComplete` |

---

## Task 1: DB Migration — `seen_tours JSONB`

**Files:**
- Create: `bookit/supabase/migrations/073_seen_tours.sql`

- [ ] **Step 1: Create migration file**

```sql
-- 073_seen_tours.sql
ALTER TABLE master_profiles
  ADD COLUMN IF NOT EXISTS seen_tours JSONB NOT NULL DEFAULT '{}';
```

- [ ] **Step 2: Apply migration**

```bash
cd C:/Users/Vitossik/SaaS/bookit
npx supabase db push
```

Expected: `Applying migration 073_seen_tours.sql... done`

- [ ] **Step 3: Commit**

```bash
git add bookit/supabase/migrations/073_seen_tours.sql
git commit -m "feat: add seen_tours JSONB column to master_profiles"
```

---

## Task 2: Update TypeScript Types

**Files:**
- Modify: `bookit/src/types/database.ts`

- [ ] **Step 1: Add `seen_tours` field to `MasterProfile`**

Find the `MasterProfile` interface (around line 36) and add after `has_seen_tour: boolean;`:

```ts
  has_seen_tour: boolean;
  seen_tours: Record<string, boolean>;
```

- [ ] **Step 2: Verify tsc**

```bash
cd C:/Users/Vitossik/SaaS/bookit && npx tsc --noEmit 2>&1 | tail -5
```

Expected: `EXIT:0` (no errors)

- [ ] **Step 3: Commit**

```bash
git add bookit/src/types/database.ts
git commit -m "feat: add seen_tours to MasterProfile type"
```

---

## Task 3: Add `seen_tours` to Select Queries

**Files:**
- Modify: `bookit/src/app/(master)/layout.tsx` (line 17)
- Modify: `bookit/src/lib/supabase/context.tsx` (line 53)

Both files select from `master_profiles` — `seen_tours` must be included so the field reaches every client component via `masterProfile`.

- [ ] **Step 1: Update `layout.tsx` master_profiles select**

In `layout.tsx` line 17, the select string currently ends with `...referral_code, referred_by, created_at, updated_at`. Add `seen_tours` after `has_seen_tour`:

Find:
```ts
    supabase.from('master_profiles').select('id, slug, business_name, bio, categories, mood_theme, accent_color, subscription_tier, subscription_expires_at, commission_rate, rating, rating_count, is_published, address, city, latitude, longitude, instagram_url, telegram_url, telegram_chat_id, avatar_emoji, has_seen_tour, pricing_rules, working_hours, timezone, referral_code, referred_by, created_at, updated_at').eq('id', user.id).maybeSingle(),
```

Replace with:
```ts
    supabase.from('master_profiles').select('id, slug, business_name, bio, categories, mood_theme, accent_color, subscription_tier, subscription_expires_at, commission_rate, rating, rating_count, is_published, address, city, latitude, longitude, instagram_url, telegram_url, telegram_chat_id, avatar_emoji, has_seen_tour, seen_tours, pricing_rules, working_hours, timezone, referral_code, referred_by, created_at, updated_at').eq('id', user.id).maybeSingle(),
```

- [ ] **Step 2: Update `context.tsx` `fetchProfile` select**

In `context.tsx` line 53, find the master_profiles select (same long string). Add `seen_tours` after `has_seen_tour`:

Find:
```ts
      supabase.from('master_profiles').select('id, slug, business_name, bio, categories, mood_theme, accent_color, subscription_tier, subscription_expires_at, commission_rate, rating, rating_count, is_published, address, city, latitude, longitude, instagram_url, telegram_url, telegram_chat_id, avatar_emoji, has_seen_tour, pricing_rules, working_hours, timezone, referral_code, referred_by, created_at, updated_at').eq('id', userId).single(),
```

Replace with:
```ts
      supabase.from('master_profiles').select('id, slug, business_name, bio, categories, mood_theme, accent_color, subscription_tier, subscription_expires_at, commission_rate, rating, rating_count, is_published, address, city, latitude, longitude, instagram_url, telegram_url, telegram_chat_id, avatar_emoji, has_seen_tour, seen_tours, pricing_rules, working_hours, timezone, referral_code, referred_by, created_at, updated_at').eq('id', userId).single(),
```

- [ ] **Step 3: Verify tsc**

```bash
cd C:/Users/Vitossik/SaaS/bookit && npx tsc --noEmit 2>&1 | tail -5
```

Expected: `EXIT:0`

- [ ] **Step 4: Commit**

```bash
git add bookit/src/app/\(master\)/layout.tsx bookit/src/lib/supabase/context.tsx
git commit -m "feat: include seen_tours in master_profiles select queries"
```

---

## Task 4: Generalize `markTourSeen` Server Action

**Files:**
- Modify: `bookit/src/app/(master)/dashboard/actions.ts`

The current action takes no arguments and only sets `has_seen_tour = true`. New version accepts a `tourName` string, merges it into `seen_tours` JSONB, and returns `{ error: string | null }` for proper error propagation.

- [ ] **Step 1: Replace `markTourSeen` in `actions.ts`**

Find and replace the entire `markTourSeen` function:

Old:
```ts
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

New:
```ts
export async function markTourSeen(tourName: string = 'dashboard'): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthorized' };

  const admin = createAdminClient();

  // Fetch current seen_tours to merge — avoids overwriting previously completed tours
  const { data: current } = await admin
    .from('master_profiles')
    .select('seen_tours')
    .eq('id', user.id)
    .single();

  const currentTours = (current?.seen_tours as Record<string, boolean> | null) ?? {};

  const { error } = await admin
    .from('master_profiles')
    .update({
      seen_tours: { ...currentTours, [tourName]: true },
      // Keep legacy has_seen_tour in sync for dashboard tour
      ...(tourName === 'dashboard' ? { has_seen_tour: true } : {}),
    })
    .eq('id', user.id);

  return { error: error?.message ?? null };
}
```

- [ ] **Step 2: Verify tsc**

```bash
cd C:/Users/Vitossik/SaaS/bookit && npx tsc --noEmit 2>&1 | tail -5
```

Expected: `EXIT:0`

- [ ] **Step 3: Commit**

```bash
git add bookit/src/app/\(master\)/dashboard/actions.ts
git commit -m "feat: generalize markTourSeen(tourName) — JSONB merge, returns error"
```

---

## Task 5: Rewrite `DashboardTourContext`

**Files:**
- Modify: `bookit/src/components/master/dashboard/DashboardTourContext.tsx`

Remove: `initialHasSeenTour` prop, all `localStorage` usage.  
Add: reads `masterProfile` from `useMasterContext()`, guards on `isLoading`, uses `useMutation` for DB persistence with optimistic hide + error toast.

- [ ] **Step 1: Replace entire file content**

```tsx
'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useMasterContext } from '@/lib/supabase/context';
import { useToast } from '@/lib/toast/context';
import { markTourSeen } from '@/app/(master)/dashboard/actions';

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

export function DashboardTourProvider({ children }: { children: React.ReactNode }) {
  const { masterProfile, isLoading, refresh } = useMasterContext();
  const { showToast } = useToast();
  const [tourStep, setTourStep] = useState(-1);
  // Prevents re-evaluation after profile refreshes post-completion
  const [evaluated, setEvaluated] = useState(false);

  useEffect(() => {
    // Wait for profile load; only evaluate once per mount
    if (isLoading || evaluated) return;
    setEvaluated(true);

    const seenTours = masterProfile?.seen_tours as Record<string, boolean> | null;
    const hasSeen = seenTours?.dashboard ?? masterProfile?.has_seen_tour ?? false;
    if (hasSeen) return;

    const t = setTimeout(() => setTourStep(0), 1000);
    return () => clearTimeout(t);
  }, [isLoading, masterProfile, evaluated]);

  const { mutate: completeTour } = useMutation({
    mutationFn: () => markTourSeen('dashboard'),
    onMutate: () => {
      // Optimistic: hide tour immediately before server confirms
      setTourStep(-1);
    },
    onError: () => {
      showToast({
        type: 'error',
        title: 'Помилка',
        message: 'Не вдалося зберегти прогрес туру',
      });
    },
    onSuccess: () => {
      // Re-sync masterProfile so seen_tours reflects new state
      refresh();
    },
  });

  function handleNextStep() {
    if (tourStep < 2) {
      setTourStep(prev => prev + 1);
    } else {
      completeTour();
    }
  }

  function closeTour() {
    completeTour();
  }

  return (
    <TourContext.Provider value={{ tourStep, handleNextStep, closeTour }}>
      {children}
    </TourContext.Provider>
  );
}
```

- [ ] **Step 2: Verify tsc**

```bash
cd C:/Users/Vitossik/SaaS/bookit && npx tsc --noEmit 2>&1 | tail -5
```

Expected: `EXIT:0`

- [ ] **Step 3: Commit**

```bash
git add bookit/src/components/master/dashboard/DashboardTourContext.tsx
git commit -m "feat: rewrite DashboardTourContext — DB-backed via useMutation, no localStorage"
```

---

## Task 6: Simplify `DashboardPage`

**Files:**
- Modify: `bookit/src/app/(master)/dashboard/page.tsx`

`DashboardTourProvider` no longer takes `initialHasSeenTour` prop — `DashboardPage` can remove its server DB fetch entirely.

- [ ] **Step 1: Remove server fetch + prop from `DashboardPage`**

Replace the entire file with:

```tsx
import type { Metadata } from 'next';
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

export default function DashboardPage() {
  return (
    <DashboardTourProvider>
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

Note: `async` keyword removed since no server-side fetching needed; `createClient` import removed.

- [ ] **Step 2: Verify tsc**

```bash
cd C:/Users/Vitossik/SaaS/bookit && npx tsc --noEmit 2>&1 | tail -5
```

Expected: `EXIT:0`

- [ ] **Step 3: Commit**

```bash
git add bookit/src/app/\(master\)/dashboard/page.tsx
git commit -m "refactor: DashboardPage — remove redundant has_seen_tour server fetch"
```

---

## Task 7: Upgrade `useTour` Hook

**Files:**
- Modify: `bookit/src/lib/hooks/useTour.ts`

Add optional `initialSeen` (skip tour if DB says already seen) and `onComplete` (DB persistence callback). Keep `localStorage` as same-device cache for backwards compat. The hook does not call server actions itself — callers pass `onComplete`.

- [ ] **Step 1: Replace entire file content**

```ts
'use client';

import { useEffect, useState } from 'react';

interface UseTourOptions {
  /** If true, tour never starts (DB says already seen on another device). */
  initialSeen?: boolean;
  /** Called when tour finishes. Caller is responsible for DB persistence. */
  onComplete?: () => Promise<void>;
}

export function useTour(tourName: string, totalSteps: number, options?: UseTourOptions) {
  // Destructure to stable primitives — avoids effect re-runs from new object refs
  const initialSeen = options?.initialSeen ?? false;
  const onComplete = options?.onComplete;

  // -1 = not yet initialized (avoids SSR flash)
  const [currentStep, setCurrentStep] = useState(-1);

  useEffect(() => {
    // DB says done — never show, even if localStorage is empty (new device)
    if (initialSeen) return;

    // Same-device cache: if localStorage marks done, skip
    if (localStorage.getItem(`tour_${tourName}`) === 'done') return;

    const t = setTimeout(() => setCurrentStep(0), 800);
    return () => clearTimeout(t);
  }, [tourName, initialSeen]);

  async function finishTour() {
    setCurrentStep(-1);
    localStorage.setItem(`tour_${tourName}`, 'done');
    if (onComplete) {
      try {
        await onComplete();
      } catch (err) {
        console.error(`[useTour:${tourName}] onComplete failed:`, err);
      }
    }
  }

  function nextStep() {
    if (currentStep < totalSteps - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      finishTour();
    }
  }

  function closeTour() {
    finishTour();
  }

  function resetTour() {
    localStorage.removeItem(`tour_${tourName}`);
    setCurrentStep(0);
  }

  return { currentStep, nextStep, closeTour, resetTour };
}
```

- [ ] **Step 2: Verify tsc**

```bash
cd C:/Users/Vitossik/SaaS/bookit && npx tsc --noEmit 2>&1 | tail -5
```

Expected: `EXIT:0`

- [ ] **Step 3: Commit**

```bash
git add bookit/src/lib/hooks/useTour.ts
git commit -m "feat: useTour — add initialSeen + onComplete options for DB-backed tours"
```

---

## Task 8: Update Feature Pages

**Files:** 7 pages — all follow the same pattern.

For each page:
1. Extract `seen_tours` from `masterProfile` (already in context)
2. Add `import { markTourSeen }` from actions
3. Pass `initialSeen` + `onComplete` to `useTour`

`ReferralPage` and `DynamicPricingPage` don't currently import `useMasterContext` — add it.

---

### 8a — `ReviewsPage.tsx`

Already imports `useMasterContext`. Change:

- [ ] **Step 1: Add `markTourSeen` import**

Add to existing imports:
```ts
import { markTourSeen } from '@/app/(master)/dashboard/actions';
```

- [ ] **Step 2: Update `useTour` call**

Find:
```ts
  const { currentStep, nextStep, closeTour } = useTour('reviews', 1);
  const { masterProfile } = useMasterContext();
```

Replace with:
```ts
  const { masterProfile } = useMasterContext();
  const seenTours = masterProfile?.seen_tours as Record<string, boolean> | null;
  const { currentStep, nextStep, closeTour } = useTour('reviews', 1, {
    initialSeen: seenTours?.reviews ?? false,
    onComplete: () => markTourSeen('reviews').then(() => undefined),
  });
```

---

### 8b — `AnalyticsPage.tsx`

Already imports `useMasterContext`.

- [ ] **Step 1: Add `markTourSeen` import**

```ts
import { markTourSeen } from '@/app/(master)/dashboard/actions';
```

- [ ] **Step 2: Update `useTour` call** (line ~385)

Find:
```ts
  const { currentStep, nextStep, closeTour } = useTour('analytics', 2);
  const { masterProfile } = useMasterContext();
```

Replace with:
```ts
  const { masterProfile } = useMasterContext();
  const seenTours = masterProfile?.seen_tours as Record<string, boolean> | null;
  const { currentStep, nextStep, closeTour } = useTour('analytics', 2, {
    initialSeen: seenTours?.analytics ?? false,
    onComplete: () => markTourSeen('analytics').then(() => undefined),
  });
```

---

### 8c — `SettingsPage.tsx`

Already imports `useMasterContext`.

- [ ] **Step 1: Add `markTourSeen` import**

```ts
import { markTourSeen } from '@/app/(master)/dashboard/actions';
```

- [ ] **Step 2: Update `useTour` call** (line ~44)

Find:
```ts
  const { currentStep, nextStep, closeTour } = useTour('settings', 2);
  const { profile, masterProfile, refresh } = useMasterContext();
```

Replace with:
```ts
  const { profile, masterProfile, refresh } = useMasterContext();
  const seenTours = masterProfile?.seen_tours as Record<string, boolean> | null;
  const { currentStep, nextStep, closeTour } = useTour('settings', 2, {
    initialSeen: seenTours?.settings ?? false,
    onComplete: () => markTourSeen('settings').then(() => undefined),
  });
```

---

### 8d — `LoyaltyPage.tsx`

Already imports `useMasterContext`.

- [ ] **Step 1: Add `markTourSeen` import**

```ts
import { markTourSeen } from '@/app/(master)/dashboard/actions';
```

- [ ] **Step 2: Update `useTour` call** (line ~109)

Find:
```ts
  const { masterProfile } = useMasterContext();
  ...
  const { currentStep, nextStep, closeTour } = useTour('loyalty', 2);
```

Replace with:
```ts
  const { masterProfile } = useMasterContext();
  const seenTours = masterProfile?.seen_tours as Record<string, boolean> | null;
  const { currentStep, nextStep, closeTour } = useTour('loyalty', 2, {
    initialSeen: seenTours?.loyalty ?? false,
    onComplete: () => markTourSeen('loyalty').then(() => undefined),
  });
```

---

### 8e — `FlashDealPage.tsx`

Already imports `useMasterContext`.

- [ ] **Step 1: Add `markTourSeen` import**

```ts
import { markTourSeen } from '@/app/(master)/dashboard/actions';
```

- [ ] **Step 2: Update `useTour` call** (line ~58)

Find:
```ts
  const { currentStep, nextStep, closeTour } = useTour('flash', 2);
  ...
  const { masterProfile } = useMasterContext();
```

Replace with:
```ts
  const { masterProfile } = useMasterContext();
  const seenTours = masterProfile?.seen_tours as Record<string, boolean> | null;
  const { currentStep, nextStep, closeTour } = useTour('flash', 2, {
    initialSeen: seenTours?.flash ?? false,
    onComplete: () => markTourSeen('flash').then(() => undefined),
  });
```

---

### 8f — `ReferralPage.tsx`

Does NOT currently import `useMasterContext` — add it.

- [ ] **Step 1: Add imports**

```ts
import { useMasterContext } from '@/lib/supabase/context';
import { markTourSeen } from '@/app/(master)/dashboard/actions';
```

- [ ] **Step 2: Update `useTour` call** (line ~26, inside `ReferralPage` function)

Find:
```ts
  const { currentStep, nextStep, closeTour } = useTour('referral', 1);
```

Replace with:
```ts
  const { masterProfile } = useMasterContext();
  const seenTours = masterProfile?.seen_tours as Record<string, boolean> | null;
  const { currentStep, nextStep, closeTour } = useTour('referral', 1, {
    initialSeen: seenTours?.referral ?? false,
    onComplete: () => markTourSeen('referral').then(() => undefined),
  });
```

---

### 8g — `DynamicPricingPage.tsx`

Does NOT currently import `useMasterContext` — add it.

- [ ] **Step 1: Add imports**

```ts
import { useMasterContext } from '@/lib/supabase/context';
import { markTourSeen } from '@/app/(master)/dashboard/actions';
```

- [ ] **Step 2: Update `useTour` call** (line ~79, inside `DynamicPricingPage` function)

Find:
```ts
  const { currentStep, nextStep, closeTour } = useTour('pricing', 2);
```

Replace with:
```ts
  const { masterProfile } = useMasterContext();
  const seenTours = masterProfile?.seen_tours as Record<string, boolean> | null;
  const { currentStep, nextStep, closeTour } = useTour('pricing', 2, {
    initialSeen: seenTours?.pricing ?? false,
    onComplete: () => markTourSeen('pricing').then(() => undefined),
  });
```

---

### 8h — Final tsc + commit all pages

- [ ] **Step 1: Verify tsc**

```bash
cd C:/Users/Vitossik/SaaS/bookit && npx tsc --noEmit 2>&1 | tail -10
```

Expected: `EXIT:0`

- [ ] **Step 2: Commit all 7 pages**

```bash
git add \
  bookit/src/components/master/reviews/ReviewsPage.tsx \
  bookit/src/components/master/analytics/AnalyticsPage.tsx \
  bookit/src/components/master/settings/SettingsPage.tsx \
  bookit/src/components/master/loyalty/LoyaltyPage.tsx \
  bookit/src/components/master/flash/FlashDealPage.tsx \
  bookit/src/components/master/referral/ReferralPage.tsx \
  bookit/src/components/master/pricing/DynamicPricingPage.tsx
git commit -m "feat: DB-backed tours on all feature pages via useTour initialSeen + onComplete"
```

---

## Task 9: Final Verification

- [ ] **Step 1: Full tsc check**

```bash
cd C:/Users/Vitossik/SaaS/bookit && npx tsc --noEmit 2>&1
```

Expected: zero errors, zero output, exit 0.

- [ ] **Step 2: Smoke test checklist (manual)**

1. Open dashboard in Browser A (fresh user, `seen_tours = {}`). Tour should start after 1s.
2. Complete all 3 steps. Tour hides immediately (optimistic). Check DB: `seen_tours = {"dashboard": true}`, `has_seen_tour = true`.
3. Refresh dashboard in Browser A. Tour should NOT appear.
4. Open dashboard in Browser B (different device / incognito). Tour should NOT appear (DB gate prevents it).
5. Navigate to Analytics page in Browser B. Tour starts (first visit on this device). Complete it. Check DB: `seen_tours = {"dashboard": true, "analytics": true}`.
6. Refresh Analytics in Browser B. Tour should NOT appear.
7. Open Analytics in Browser A (different device). Tour should NOT appear (DB has `analytics: true`).
