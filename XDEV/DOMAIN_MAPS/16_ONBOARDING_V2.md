# 16 — Onboarding v2 Domain Map

## 1. Domain Overview

5-кроковий онбординг нового майстра: PROFILE → SERVICES → SCHEDULE → PREVIEW → SUCCESS. Збереження прогресу через admin client (RLS bypass), 3-layer theme enforcement.

### Key Files
- `src/app/(master)/dashboard/onboarding/page.tsx` — Primary route
- `src/app/(master)/dashboard/onboarding/actions.ts` — Server actions
- `src/app/(master)/dashboard/onboarding/loading.tsx` — Frost skeleton
- `src/app/(master)/layout.tsx` — isOnboarding guard
- `src/app/layout.tsx` — Root layout (x-pathname theme)
- `src/app/onboarding/page.tsx` — Legacy route
- `src/components/master/onboarding/OnboardingWizard.tsx` — State machine
- `src/components/master/onboarding/OnboardingProgress.tsx` — 5-dot progress
- `src/components/master/onboarding/steps/StepProfile.tsx` — Step 1
- `src/components/master/onboarding/steps/StepServices.tsx` — Step 2
- `src/components/master/onboarding/steps/StepSchedule.tsx` — Step 3
- `src/components/master/onboarding/steps/StepPreview.tsx` — Step 4
- `src/components/master/onboarding/steps/StepSuccess.tsx` — Step 5

### DB Tables
- `profiles.onboarding_step` — Current step name
- `profiles.onboarding_data` — JSON state
- `master_profiles` — slug, business_name, working_hours, categories
- `services` — First service created during onboarding

---

## 2. State Machine

### 2.1 Onboarding Steps

```
[ENTRY] → check onboarding_step in profiles
  → 'completed' → redirect /dashboard
  → other → resume at saved step
  → NULL → start at PROFILE

Step transitions (v2):
  PROFILE → SERVICES → SCHEDULE → PREVIEW → SUCCESS

Legacy mapping (v1 → v2):
  BASIC → PROFILE
  SCHEDULE_PROMPT/FORM → SCHEDULE
  SERVICES_PROMPT/FORM → SERVICES
  PROFIT_PREDICTOR/PROFILE_PREVIEW → PREVIEW
  CHANNELS → SUCCESS (CHANNELS step removed in v2)
```

### 2.2 Per-Step States

**PROFILE (Step 1):**
```
[LOADING] → check if returning user
  → [EDITING]:
    → business_name (required)
    → slug (generated, editable)
    → category selection
  → [VALIDATING] → regex on slug, name required
  → [SAVING] → saveOnboardingProgress
  → [SAVED] → advance to SERVICES
  → [ERROR] → toast
```

**SERVICES (Step 2):**
```
[LOADING] → fetch categories
  → [EDITING]:
    → Per-category price
    → Per-category service types (tiers)
    → categoryPrices: Record<catId, string>
    → categoryServiceTypes: Record<catId, Record<tier, bool>>
  → [SAVING] → save categories + first service
  → [SAVED] → advance to SCHEDULE
```

**SCHEDULE (Step 3):**
```
[EDITING]:
  → Quick chip: "Пн–Сб 10–19" → one-tap save
  → Custom: "Свій графік" → per-day rows
    → each day: start time / end time
    → "до всіх" button → copy to all days
  → [SAVING] → save working_hours
  → [SAVED] → advance to PREVIEW
```

**PREVIEW (Step 4):**
```
[LOADING] → resume saved data
  → [VIEWING]:
    → Glassmorphism card preview of public page
    → Slug edit inline → checkAndUpdateSlug action
    → Business info display
  → [SAVING] → final save
  → [SAVED] → advance to SUCCESS
```

**SUCCESS (Step 5):**
```
[LOADING] → transition animation
  → [COMPLETE]:
    → Confetti / success animation
    → "До дашборду" CTA
    → Redirect /dashboard
```

### 2.3 Persistence States

```
Per step:
  → saveOnboardingProgress(stepName, stepData)
    → createAdminClient() — bypass RLS (important!)
    → UPDATE profiles SET onboarding_step = stepName, onboarding_data = stepData
    → IF error → log + toast

On reload:
  → page reads onboarding_step from profiles
  → if 'completed' → /dashboard
  → else → OnboardingWizard initializes with saved step

Critical (2026-05-29 fix):
  Previously used anon client → UPDATE returned {error:null} with 0 rows
  → step NEVER saved → user restarted every time
  → Fixed: admin client guarantees write
```

---

## 3. Environment Matrix

### Theme Enforcement (3-layer)

```
Layer 1: root layout (src/app/layout.tsx)
  → reads x-pathname header
  → if /dashboard/onboarding or /onboarding → force theme='frost'
  → inline beforeInteractive script sets body.bg='#EFF2FF'

Layer 2: master layout (src/app/(master)/layout.tsx)
  → isOnboarding = pathname.startsWith('/dashboard/onboarding')
  → <style>html,body{bg:#EFF2FF!important}</style>
  → clean Frost div (no DashboardLayout, no sidebar, no SupportWidget)

Layer 3: OnboardingWizard useEffect
  → html/body overflow:hidden
  → overscrollBehavior:none
  → backgroundColor:#EFF2FF
  → Prevents iOS rubber-band overscroll with Blossom bg
```

### Device Variants
| Device | Onboarding Layout |
|---|---|
| Desktop | Centered card, full width |
| Mobile | Full screen, scroll per step |
| Tablet | Like desktop |

### Race Condition Fix (2026-05-29)
```
OLD: router.refresh() → router.push() → race condition (RSC refresh vs navigation)
FIX: Removed router.refresh() before router.push()
```

---

## 4. Load & Concurrency Vectors

| Vector | Risk |
|---|---|
| Multiple saves same step | Last-write-wins |
| Browser refresh mid-save | Step saved, data partial? |
| Navigate back after save | Should show saved state |
| Concurrent onboarding same user | Edge case, theoretically possible |

---

## 5. Data Variations

| Variation | Effect |
|---|---|
| No categories selected | Services step shows error |
| Empty business_name | Profile step validation error |
| Slug already taken | checkAndUpdateSlug returns error → suggest alternative |
| Invalid slug (special chars) | regex validation |
| No schedule set | Schedule step required |
| Time range invalid (end < start) | Validation error |
| DST time range | Accept as-is |
| Categories with no services | Can happen → preview shows empty |
| Very long business_name | Truncate in preview |
| Zero categories in DB | Empty state → contact support |

---

## 6. Test Vectors

### Unit Tests
- [ ] Onboarding step mapping (v1 legacy → v2)
- [ ] Progress calculation: 5 steps → 20% each
- [ ] Slug regex validation
- [ ] Schedule validation (end > start, min duration)
- [ ] Category price parsing

### Integration Tests
- [ ] Save step → profiles.onboarding_step updated
- [ ] Save step → profiles.onboarding_data updated
- [ ] Reload page → resume at saved step
- [ ] Completed onboarding → redirect /dashboard
- [ ] Slug check: unique → accept
- [ ] Slug check: taken → reject
- [ ] Admin client: bypass RLS → save succeeds

### E2E Tests
- [ ] Full onboarding: PROFILE → SERVICES → SCHEDULE → PREVIEW → SUCCESS → /dashboard
- [ ] Validate step: empty business_name → error
- [ ] Validate step: invalid slug → error
- [ ] Validate step: no schedule → error
- [ ] Resume: close browser mid-way → reopen → resume at saved step
- [ ] Resume: completed step → skip to next
- [ ] Quick schedule: "Пн-Сб 10-19" → saves
- [ ] Custom schedule: per-day → "до всіх" → copies
- [ ] Preview: slug edit → save → preview updates
- [ ] Onboarding in Frost theme → background #EFF2FF
- [ ] Legacy /onboarding route → same flow
- [ ] Skip/reset: restart onboarding

### Security Tests
- [ ] Admin client used correctly (not leaked to client)
- [ ] RLS bypass intentional and scoped
- [ ] Auth required: unauthenticated → cannot access
- [ ] Master role required: client cannot access

---

## 7. File Inventory

### Pages
- `src/app/(master)/dashboard/onboarding/page.tsx`
- `src/app/(master)/dashboard/onboarding/actions.ts`
- `src/app/(master)/dashboard/onboarding/loading.tsx`
- `src/app/onboarding/page.tsx` (legacy)
- `src/app/layout.tsx` (theme enforcement)
- `src/app/(master)/layout.tsx` (isOnboarding guard)

### Components
- `src/components/master/onboarding/OnboardingWizard.tsx`
- `src/components/master/onboarding/OnboardingProgress.tsx`
- `src/components/master/onboarding/steps/StepProfile.tsx`
- `src/components/master/onboarding/steps/StepServices.tsx`
- `src/components/master/onboarding/steps/StepSchedule.tsx`
- `src/components/master/onboarding/steps/StepPreview.tsx`
- `src/components/master/onboarding/steps/StepSuccess.tsx`

### DB
- `profiles.onboarding_step`
- `profiles.onboarding_data`
- `master_profiles`
- `services`
- `service_categories`
