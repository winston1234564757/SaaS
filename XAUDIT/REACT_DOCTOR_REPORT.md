# 🩺 React Doctor Audit Report
Generated: 2026-05-10

## 📊 Overview
- **Health Score:** 45/100
- **Total Issues:** 1695
- **Affected Files:** 380/491
- **Scan Time:** 7.7s

---

## 🔴 Critical Security (92 Issues)
### `react-doctor/server-auth-actions`
Server actions in the dashboard are missing explicit authentication checks.
**Recommendation:** Add `const { data: { user } } = await supabase.auth.getUser()` or `auth()` at the top of each action.

**Affected files (samples):**
- `src/app/(master)/dashboard/studio/actions.ts`
- `src/app/(master)/dashboard/settings/actions.ts`
- `src/app/(master)/dashboard/products/actions.ts`
- `src/app/[slug]/actions.ts`
- `src/app/(master)/dashboard/pricing/actions.ts`
- `src/app/(master)/dashboard/portfolio/actions.ts`
- `src/app/(master)/dashboard/onboarding/actions.ts`
- `src/app/(master)/dashboard/marketing/actions.ts`
- `src/app/(master)/dashboard/loyalty/actions.ts`
- `src/app/(master)/dashboard/flash/actions.ts`
- `src/app/(master)/dashboard/clients/actions.ts`
- `src/app/(master)/dashboard/bookings/actions.ts`

---

## 🟠 Correctness & Memory Leaks
### `react-doctor/effect-needs-cleanup` (4 Issues)
Effects subscribe to events but never unsubscribe.
- `src/components/client/ClientRealtimeSync.tsx:14`
- `src/components/master/settings/LocationPicker.tsx:102`
- `src/lib/supabase/hooks/useRealtimeNotifications.ts:37`
- `src/components/providers/TelegramProvider.tsx:142`

### `react-hooks/rules-of-hooks` (1 Issue)
Conditional Hook call.
- `src/components/master/flash/FlashDealPage.tsx:118`

### `react-doctor/server-no-mutable-module-state` (1 Issue)
Module-scoped mutable state in server file.
- `src/app/(master)/dashboard/billing/actions.ts:17`

---

## ⚡ Performance & Bundle Optimization
### `react-doctor/use-lazy-motion` (130 Issues)
Using `motion` instead of `m` with `LazyMotion` from Framer Motion. Adds ~30kb to bundle size.
**Recommendation:** Refactor to use `LazyMotion` provider and `m` components.

### `react-doctor/design-no-redundant-size-axes` (396 Issues)
Using `w-N h-N` instead of `size-N`.
**Recommendation:** Batch replace `w-(\d+) h-\1` with `size-$1`.

---

## 🧹 Code Hygiene
### `knip/files` (76 Issues)
Unused files detected.
**Recommendation:** Audit and delete files in `scratch/`, `scripts/` and legacy components.

### `jsx-a11y/alt-text` (2 Issues)
Missing alt text.
- `src/components/master/marketing/StoryGenerator.tsx:1166`
- `src/components/master/marketing/StoryGenerator.tsx:1183`

---

## 📝 Next Steps
1. **Security Patch:** Implement auth guards in all dashboard actions.
2. **Memory Leaks:** Add cleanup functions to identified `useEffect` hooks.
3. **Tailwind Refactor:** Use `size-N` classes.
4. **Framer Motion:** Migrate to `LazyMotion`.
