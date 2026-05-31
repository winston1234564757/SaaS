# React Doctor Verbose Report
Generated: 2026-05-30 | Tool: react-doctor v0.2.14 | Project: bookit
Share: https://www.react.doctor/share?p=bookit&s=2&e=445&w=2802&f=466

---

## Health Score: 2 / 100 — Critical

| Metric | Count |
|---|---|
| Total issues | 3247 |
| Errors | 445 |
| Warnings | 2802 |

---

## Errors by Rule (445 total)

### React Compiler (336 errors)

| Rule | Count | Description |
|---|---|---|
| `react-compiler-no-manual-memoization` | ×192 | Remove `useMemo`/`useCallback`/`memo` — Compiler auto-memoizes |
| `no-adjust-state-on-prop-change` | ×72 | State set in `useEffect` on prop change → extra stale render |
| `todo` (import expressions) | ×64 | React Compiler can't optimize dynamic imports |
| `set-state-in-effect` | ×58 | `setState` called synchronously inside effect body |
| `refs` | ×9 | `ref.current` accessed during render |
| `purity` | ×5 | `Math.random()` called during render (impure) |
| `immutability` | ×4 | Variable accessed before declaration |
| `use-memo` | ×1 | Invalid dependency list syntax |
| `incompatible-library` | ×1 | Incompatible library skipped by Compiler |
| `hooks` | ×1 | Hook called conditionally |

**Top offenders:**
- `src/components/master/marketing/StoryGenerator.tsx` — 15+ Compiler errors
- `src/components/shared/wizard/useBookingWizardState.ts` — 18 prop-change state errors
- `src/components/master/products/ProductEditor.tsx` — 14 prop-change state errors
- `src/components/master/dashboard/widgets/frost/PeakHoursWidget.tsx` — 3 ref-during-render errors
- `src/components/master/dashboard/widgets/studio/PeakHoursWidget.tsx` — 3 ref-during-render errors
- `src/components/master/dashboard/widgets/blossom/PeakHoursWidget.tsx` — 3 ref-during-render errors

### Server / Security (26 errors)

| Rule | Count | Description |
|---|---|---|
| `server-auth-actions` | ×23 | Server action missing `auth()` check at top |
| `nextjs-no-side-effect-in-get-handler` | ×2 | GET handler calls `cookies().set()` — CSRF risk |
| `server-no-mutable-module-state` | ×1 | Module-scoped `const PLAN = {}` in `"use server"` file |

**Critical files:**
- `src/app/(auth)/register/actions.ts:15`
- `src/app/(master)/dashboard/products/actions.ts` — 8 unprotected actions
- `src/lib/actions/referrals.ts` — 6 unprotected actions
- `src/app/auth/callback/route.ts:8` — GET with cookies().set()
- `src/app/r/[code]/route.ts:4` — GET with side effect
- `src/app/(master)/dashboard/billing/actions.ts:17` — mutable module state

### Correctness (9 errors)

| Rule | Count | Description |
|---|---|---|
| `effect-needs-cleanup` | ×6 | `subscribe()` without cleanup — memory leak on unmount |
| `alt-text` | ×2 | Missing `alt` attribute on `<img>` |
| `rules-of-hooks` | ×2 | `useMemo` called conditionally |
| `jsx-key` | ×1 | Missing `key` prop in `.map()` |
| `aria-role` | ×1 | Invalid ARIA role `"client"` |

**Files:**
- `src/components/client/ClientRealtimeSync.tsx:14` — no cleanup
- `src/lib/supabase/hooks/useRealtimeNotifications.ts:39` — no cleanup
- `src/lib/hooks/useLiveChat.ts:22` — no cleanup
- `src/components/master/marketing/StoryGenerator.tsx:1171, 1188` — missing alt
- `src/components/master/flash/FlashDealPage.tsx:118` — conditional hook
- `src/components/shared/support/SupportWidget.tsx:111` — conditional hook
- `src/components/master/clients/ClientsPage.tsx:591` — missing key
- `src/components/client/MyProfilePage.tsx:351` — invalid role

---

## Key Warnings (2802 total)

### Design / Tailwind (599 warnings)

| Rule | Count | Description |
|---|---|---|
| `design-no-redundant-size-axes` | ×599 | `w-N h-N` → `size-N` shorthand (Tailwind v3.4+) |

Spread across 100+ files. Pure cosmetic cleanup, no behavior change.

### Dead Code / Architecture (403 warnings)

Unused imports, variables, exports across the codebase.

### Performance (252 warnings)

Heavy components not lazy-loaded, Intl constructors recreated on every call, etc.

| Rule | Notable |
|---|---|
| `prefer-dynamic-import` | `recharts` in `AdminOverviewCharts.tsx` — not lazy |
| `js-hoist-intl` | `new Intl.NumberFormat()` inside function in `src/lib/utils/currency.ts:2` |
| `rerender-lazy-state-init` | `useState(normalizeStep())` → `useState(() => normalizeStep())` |

### Bundle Size (174 warnings)

Heavy synchronous imports instead of dynamic chunks.

### Accessibility (313 warnings + 3 errors)

Includes `design-no-redundant-size-axes` touch target sizing, missing labels, invalid roles.

Notable:
- `src/components/shared/support/SupportWidget.tsx:385` — `animate-bounce` (dated UX)
- `src/components/master/portfolio/PortfolioItemCard.tsx:49` — nested `<button>` inside `<button>`
- `src/components/shared/wizard/ClientCombobox.tsx:110` — redundant `role="combobox"` on `<input>`

### Next.js (59 warnings)

| Rule | File |
|---|---|
| `nextjs-no-native-script` | `src/app/layout.tsx:135` — `<script>` instead of `next/script` |
| `no-undeferred-third-party` | `src/app/layout.tsx:135` — blocking first paint |
| `rendering-script-defer-async` | `src/app/layout.tsx:135` — no `defer`/`async` |

### Other Notable Singles

| Rule | File | Issue |
|---|---|---|
| `no-gradient-text` | `src/app/(public)/error.tsx:26` | Gradient on text |
| `no-uncontrolled-input` | `src/components/client/MyProfilePage.tsx:200` | `value` without `onChange` |
| `html-no-nested-interactive` | `src/components/master/portfolio/PortfolioItemCard.tsx:49` | `<button>` in `<button>` |
| `jsx-no-target-blank` | `src/components/master/settings/widgets/PublicStatusWidget.tsx:121` | Missing `rel="noreferrer"` |
| `no-pass-live-state-to-parent` | `src/components/master/marketing/StoryGenerator.tsx:689` | State pushed via effect |
| `advanced-event-handler-refs` | `src/components/shared/wizard/ServiceSelector.tsx:61` | Re-subscribes on handler change |
| `no-wide-letter-spacing` | `src/components/master/marketing/StoryGenerator.tsx:610` | 0.08em on body text |
| `js-set-map-lookups` | `src/components/master/portfolio/PortfolioPhotoUploader.tsx:86` | `array.includes()` in loop |

---

## Priority Fix Plan

### P0 — Security (fix before next deploy)
1. `server-auth-actions` ×23 — add auth check to all server actions
2. `nextjs-no-side-effect-in-get-handler` ×2 — move `cookies().set()` to POST
3. `jsx-no-target-blank` — add `rel="noreferrer"`

### P1 — Correctness (fix this sprint)
4. `effect-needs-cleanup` ×6 — add return cleanup to subscriptions
5. `rules-of-hooks` ×2 — unconditionalize hooks in FlashDealPage + SupportWidget
6. `html-no-nested-interactive` — PortfolioItemCard nested buttons
7. `jsx-key` — ClientsPage missing key
8. `alt-text` ×2 — StoryGenerator images

### P2 — React Compiler readiness (next sprint)
9. `no-adjust-state-on-prop-change` ×72 — migrate to inline state adjustment
10. `set-state-in-effect` ×58 — refactor setState-in-effect patterns
11. `refs` ×9 — move ref.current access out of render (PeakHoursWidget ×3 themes)
12. `purity` ×5 — move Math.random() outside render

### P3 — Cleanup (batch PR)
13. `react-compiler-no-manual-memoization` ×192 — remove useMemo/useCallback
14. `todo` ×64 — replace dynamic import() expressions
15. `design-no-redundant-size-axes` ×599 — w-N h-N → size-N (codemod-able)

### P4 — Performance (ongoing)
16. `prefer-dynamic-import` — lazy-load recharts
17. `js-hoist-intl` — hoist Intl.NumberFormat to module scope
18. `nextjs-no-native-script` — replace `<script>` with `<Script>`

---

## Notes

- Score 2/100 is expected for a large pre-Compiler codebase — not an emergency
- 192 `useMemo` errors are false alarms in practice (Compiler not enabled yet)
- P0 security issues are real and should be verified against Supabase RLS
- `StoryGenerator.tsx` is the single most problematic file (15+ rules violated)
- `useBookingWizardState.ts` has 18 prop-change state errors — candidate for full refactor

## Commands

```bash
# Scan only changed files
npx react-doctor@latest --verbose --diff main

# Install permanently
npx react-doctor install --yes

# Score only
npx react-doctor@latest --score
```
