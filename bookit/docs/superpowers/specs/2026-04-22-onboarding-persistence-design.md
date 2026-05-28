# Auth State Persistence — Onboarding Wizard

**Date:** 2026-04-22  
**Status:** Approved  
**Author:** Principal Staff Engineer

---

## Problem

The onboarding wizard stores all state in ephemeral React `useState`. If a user drops off mid-flow (tab close, refresh, phone call) they restart from `BASIC` regardless of progress. This causes conversion loss.

## Goal

Zero data loss during onboarding. User resumes exactly where they left off — same step, same form values.

---

## Data Model

### Migration 080 — `profiles` table

```sql
ALTER TABLE profiles
  ADD COLUMN onboarding_step TEXT NOT NULL DEFAULT 'BASIC',
  ADD COLUMN onboarding_data JSONB NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE profiles ADD CONSTRAINT profiles_onboarding_step_check
  CHECK (onboarding_step IN (
    'BASIC', 'SCHEDULE_PROMPT', 'SCHEDULE_FORM',
    'SERVICES_PROMPT', 'SERVICES_FORM', 'SUCCESS'
  ));
```

**Rationale:** `profiles` is the canonical user record fetched on every auth. Collocating progress here avoids extra joins. The CHECK constraint prevents invalid state at the DB level.

### `onboarding_data` JSONB shape (typed via `OnboardingData`)

```ts
interface OnboardingData {
  // BASIC step
  fullName?: string;
  specialization?: string;   // emoji e.g. "💅"
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

All fields are optional — missing fields fall back to component defaults. Type lives in `src/types/onboarding.ts`.

---

## Architecture

### Layer 1 — Server Action: `saveOnboardingProgress`

**File:** `src/app/(master)/dashboard/onboarding/actions.ts`

```ts
export async function saveOnboardingProgress(
  step: Step,
  data: OnboardingData
): Promise<{ error: string | null }>
```

- Verifies auth via `getUser()` — returns error if unauthenticated
- Updates `profiles` row: `{ onboarding_step: step, onboarding_data: data }`
- No `revalidatePath` — this is a fire-and-forget tracker, not a data mutation
- Returns `{ error: string | null }` for silent error logging on client

### Layer 2 — Server Component: `onboarding/page.tsx`

Becomes `async`:

```ts
export default async function OnboardingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Redirect already-completed users
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('onboarding_step, onboarding_data')
    .eq('id', user.id)
    .maybeSingle()

  const initialStep = (profile?.onboarding_step as Step) ?? 'BASIC'
  const initialData = (profile?.onboarding_data ?? {}) as OnboardingData

  // Guard: user already completed onboarding
  if (initialStep === 'SUCCESS') redirect('/dashboard')

  return (
    <>
      <BlobBackground />
      <OnboardingWizard initialStep={initialStep} initialData={initialData} />
    </>
  )
}
```

### Layer 3 — Client Component: `OnboardingWizard`

**Signature change:**
```ts
interface OnboardingWizardProps {
  initialStep: Step;
  initialData: OnboardingData;
}
export function OnboardingWizard({ initialStep, initialData }: OnboardingWizardProps)
```

**State hydration:**
```ts
const [step, setStep] = useState<Step>(initialStep)
const [fullName, setFullName] = useState(initialData.fullName ?? profile?.full_name ?? '')
const [specialization, setSpecialization] = useState(initialData.specialization ?? '💅')
const [phone, setPhone] = useState(initialData.phone ?? e164ToInputPhone(profile?.phone))
const [schedule, setSchedule] = useState(initialData.schedule ?? DEFAULT_SCHEDULE)
const [bufferTime, setBufferTime] = useState(initialData.bufferTime ?? 0)
const [breaks, setBreaks] = useState(initialData.breaks ?? [])
const [serviceName, setServiceName] = useState(initialData.serviceName ?? '')
const [servicePrice, setServicePrice] = useState(initialData.servicePrice ?? '')
const [serviceDuration, setServiceDuration] = useState(initialData.serviceDuration ?? 60)
```

**Progress persistence helper:**
```ts
function buildSnapshot(): OnboardingData {
  return {
    fullName, specialization, phone,
    schedule, bufferTime, breaks,
    serviceName, servicePrice, serviceDuration,
  }
}

function persistProgress(nextStep: Step) {
  saveOnboardingProgress(nextStep, buildSnapshot()).catch(err =>
    console.error('[onboarding] progress save failed:', err)
  )
}
```

**Hook into each handler:**

```ts
async function handleSaveProfile() {
  // ... existing save logic ...
  if (error) return
  persistProgress('SCHEDULE_PROMPT')   // fire-and-forget
  goTo('SCHEDULE_PROMPT')
}

async function handleSaveSchedule() {
  // ... existing save logic ...
  if (error) return
  persistProgress('SERVICES_PROMPT')
  goTo('SERVICES_PROMPT')
}

async function handleSaveService() {
  // ... existing save logic (or skip) ...
  persistProgress('SUCCESS')
  goTo('SUCCESS')
}

async function handleComplete() {
  // Await final step — marks onboarding done in DB
  await saveOnboardingProgress('SUCCESS', buildSnapshot())
  await revalidateAfterOnboarding()
  await refresh()
  // ...existing redirect logic...
}
```

**Skip handlers** (SCHEDULE_PROMPT → skip, SERVICES_PROMPT → skip) also call `persistProgress` with the appropriate next step before navigating.

---

## Edge Cases

| Case | Handling |
|------|----------|
| User revisits `/dashboard/onboarding` after completing | `initialStep === 'SUCCESS'` → `redirect('/dashboard')` |
| `profiles` row missing (race condition) | `initialStep` defaults to `'BASIC'`, `initialData` defaults to `{}` |
| `saveOnboardingProgress` fails (network) | Silent console.error — UX proceeds unblocked, user just doesn't persist that checkpoint |
| avatarUrl not yet uploaded when progress saved mid-BASIC | `avatarUrl` field is undefined in snapshot — avatarPreview stays as local blob URL (non-persisted), avatar upload only happens on real `handleSaveProfile` commit |
| TypeScript strict mode | `OnboardingData` is `Partial` — all consumers use `?? default` |

---

## Files Changed

| File | Change |
|------|--------|
| `bookit/supabase/migrations/080_onboarding_persistence.sql` | New migration |
| `bookit/src/types/onboarding.ts` | New file — `OnboardingData` + re-export of `Step` |
| `bookit/src/app/(master)/dashboard/onboarding/actions.ts` | Add `saveOnboardingProgress` |
| `bookit/src/app/(master)/dashboard/onboarding/page.tsx` | Async server component with hydration |
| `bookit/src/components/master/onboarding/OnboardingWizard.tsx` | Props, hydration, persistProgress |
| `bookit/BOOKIT.md` | Changelog entry |

---

## Non-Goals

- Saving avatarUrl draft to DB (avatar only commits on real profile save)
- Debounced per-keystroke saves (save-on-step-advance is sufficient)
- Multi-device sync during active wizard session (covered by DB persistence on step advance)
