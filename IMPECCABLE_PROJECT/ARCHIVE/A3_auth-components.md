# A3: Auth Components — Impeccable Audit (Skill Workflow)

**Files**: `ClientAuthSheet.tsx` (282ln), `NavLoginSheet.tsx` (158ln), `PostBookingAuth.tsx` (661ln), `TelegramProvider.tsx` (335ln)
**Total**: 1,436 lines across 4 files
**Register**: Product (auth — client onboarding)
**Date**: 2026-06-01
**Methodology**: critique (split assessment) → audit → animate → overdrive → polish → layout → optimize

---

## critique — Combined Report

### Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3/4 | Loading spinners, TG bot state. No phone-on-OTP-step reminder (PostBookingAuth). |
| 2 | Match System / Real World | 4/4 | Ukrainian. Beauty metaphors. Clear benefit descriptions. |
| 3 | User Control and Freedom | 4/4 | Skip buttons on every step. Back navigation. Close on NavLoginSheet. |
| 4 | Consistency and Standards | **2/4** | 8 functions duplicated with A1. GoogleIcon inline ×2. inputCls ×2. Mixed inline/Tailwind in PostBookingAuth. |
| 5 | Error Prevention | 3/4 | Phone length validation. Password min length. OTP auto-focus. Supabase error handled. |
| 6 | Recognition Rather Than Recall | 3/4 | Icons + text on all actions. TG bot name visible. |
| 7 | Flexibility and Efficiency | 2/4 | OTP auto-submit + paste. No keyboard shortcuts. Power-user limited. |
| 8 | Aesthetic and Minimalist Design | **2/4** | PostBookingAuth 661 lines. TelegramProvider 3 interacting useEffects. |
| 9 | Error Recovery | 2/4 | Generic error messages. .catch(() ⇒ {}) on booking link (ClientAuthSheet line 79). |
| 10 | Help and Documentation | 1/4 | TG Provider has good safety comments. PostBookingAuth lacks docs for 4-step state machine. |
| **Total** | | **26/40** | **Acceptable** |

### Anti-Patterns Verdict

**LLM Assessment (sub-agent)**:

| File | Slop | Key Issues |
|------|------|------------|
| ClientAuthSheet (282ln) | CLEAN | 2 inline `var(--accent)`. GoogleIcon inline duplicate. |
| NavLoginSheet (158ln) | CLEAN | Zero inline styles. GoogleIcon inline duplicate. 3× repeated pattern class. |
| PostBookingAuth (661ln) | MODERATE | ~20 inline `var(--*)` styles. `backdrop-filter: blur(8px)` GPU concern. `.then()` mixed with async. 2× eslint-disable. |
| TelegramProvider (335ln) | CLEAN | `console.log` in production. `as any` casts ×2. Em-dash overuse (detected by CLI). |

**Deterministic scan**: `npx impeccable detect` → 1 finding: em-dash overuse in TelegramProvider (6 em-dashes in body text).

**Duplication with A1 (PhoneOtpForm)**: 8 functions/patterns shared:

| # | Function | Files | Match |
|---|----------|-------|-------|
| 1 | `getCleanPhone()` | PostBookingAuth + PhoneOtpForm | Identical |
| 2 | `handleSendSms()` | PostBookingAuth + PhoneOtpForm | Near-identical |
| 3 | `handleDigitChange()` | PostBookingAuth + PhoneOtpForm | Identical |
| 4 | `handleDigitKeyDown()` | PostBookingAuth + PhoneOtpForm | Identical |
| 5 | `handlePaste()` | PostBookingAuth + PhoneOtpForm | Identical |
| 6 | `startCooldown()` | PostBookingAuth + PhoneOtpForm | Identical |
| 7 | `handleResend()` | PostBookingAuth + PhoneOtpForm | Near-identical |
| 8 | `handleVerify()` | PostBookingAuth + PhoneOtpForm | Same core pattern |

**Other duplication**: GoogleIcon inline ×2 (shared component exists), `inputCls` ×2, `active:scale-[0.95] transition-all cursor-pointer` repeated ~21× across 3 files.

### Overall Impression

Strong user-facing UX across all 4 components. The auth flow is well-designed for conversion (benefits → Google → phone → OTP → channels). But the implementation has the worst duplication problem in the project: 8 functions copied verbatim from A1, GoogleIcon re-inlined, input styles duplicated. PostBookingAuth at 661 lines needs extraction. TelegramProvider is the most production-hardened code in this batch.

### What's Working

1. **TelegramProvider safety patterns** — 8s timeout prevents infinite loader. 15× retry for SDK race. Min-loader (1.5s) for premium feel. MutationObserver for theme sync.
2. **PostBookingAuth channel onboarding** — TG bot deep-link with userId + Push subscription with VAPID key. Best post-auth UX in the project.
3. **NavLoginSheet spring animation** (stiffness 420, damping 42) — correct bottom sheet feel. `aria-label="Закрити"` present. `autoComplete` on inputs.

### Priority Issues

| ID | P | What | Why | Fix |
|----|---|------|-----|-----|
| A3-I1 | **P0** | 8 OTP/auth functions duplicated with A1 (PhoneOtpForm) | Bug fix in one file is invisible in the other. Already diverging. | Extract shared `usePhoneAuth` hook |
| A3-I2 | **P0** | GoogleIcon SVG inline in 2 files (ClientAuthSheet + NavLoginSheet) | Shared component exists at `@/components/icons/GoogleIcon`. Triple maintenance surface. | Replace with `import { GoogleIcon }` |
| A3-I3 | **P0** | PostBookingAuth ~20 inline `var(--accent-light, --accent-on)` styles | These CSS vars may not exist in all 3 themes. Breaks theme switching. | Convert to Tailwind tokens or ensure variables in all themes |
| A3-I4 | **P1** | PostBookingAuth 661 lines — refactoring candidate | Impossible to test. Mixed concerns (4-step state + loyalty + push + TG). | Extract step components + `usePostBookingAuth` hook |
| A3-I5 | **P1** | `backdrop-filter: blur(8px)` on bento cards (PostBookingAuth line 303) | Forces GPU compositing layer. Layout thrash on iOS Safari scroll. | Use Tailwind `backdrop-blur-sm` or remove |
| A3-I6 | **P1** | `console.log` in TelegramProvider (lines 134, 165) | Debug log in production. Leaks internal state. | Guard with `process.env.NODE_ENV` or remove |
| A3-I7 | **P1** | `.then()` mixed with async/await (PostBookingAuth line 68) | Inconsistent patterns. Harder to reason about error flow. | Convert to async/await |
| A3-I8 | **P2** | `inputCls` duplicated (ClientAuthSheet line 32 + NavLoginSheet line 24) | DRY violation across 2 files | Extract to shared constants file |
| A3-I9 | **P2** | `active:scale-[0.95] transition-all cursor-pointer` repeated ~21× | Pattern drift risk. Dead code overload. | Extract to reusable class or `Clickable` component |
| A3-I10 | **P3** | NavLoginSheet close button `size-8` (32px < 44px) | Below minimum touch target on mobile. WCAG 2.5.5. | `size-11` with inner icon |

### Persona Red Flags

**Olena (Client, just booked)**:
- Sees PostBookingAuth → reads benefits → picks Google → auth done → channels step → configures TG bot and Push → great experience
- But if she returns later → same flow again — no session persistence hint

**Dmytro (Developer maintaining auth)**:
- Fixes OTP bug in PhoneOtpForm → doesn't know PostBookingAuth has identical code → bug persists
- Sees GoogleIcon defined 3 ways (inline×2 + import) → confused which is source of truth

---

## audit — Technical Quality

| # | Dimension | Score | Key Finding |
|---|-----------|-------|-------------|
| 1 | Accessibility | 3/4 | NavLoginSheet has aria-label. ClientAuthSheet back button missing aria-label. |
| 2 | Performance | 3/4 | backdrop-filter GPU cost. No memoization on 661-line component. |
| 3 | Theming | **2/4** | PostBookingAuth inline var(--*) may break themes. TelegramProvider theme-color sync is correct. |
| 4 | Responsive | 3/4 | Touch targets mostly ≥44px. NavLoginSheet close button 32px. |
| 5 | Code Quality | **2/4** | 8 duplicated functions. 661-line component. inline SVGs. as any casts. console.log. |
| **Total** | | **13/20** | **Acceptable** |

### Executive Summary

**13/20** — Acceptable. Worst code quality of any phase so far due to duplication problem. The UX is strong, but the implementation needs consolidation.

---

## animate — Motion Analysis

**Score**: 7/10

| Component | Motion | Verdict |
|-----------|--------|---------|
| ClientAuthSheet | Stagger benefits (70ms delay), AnimatePresence mode switch (slide x for email form) | Clean. Missing reduced-motion. |
| NavLoginSheet | Spring bottom sheet (420/42), backdrop fade | Correct. |
| PostBookingAuth | Step transitions (slide x + fade), stagger cards, loyaly/C2C/fade reveals | Over-animated. 3 different AnimatePresence containers. |
| TelegramProvider | Loader ↔ content switch (fade, 0.3/0.4s) | Clean. |

**No `prefers-reduced-motion`** on any AnimatePresence or stagger — consistent gap across all 4 components.

---

## overdrive — Push Limits

### Direction A: Extract shared `usePhoneAuth` hook
Consolidate all 8 duplicated OTP functions into `src/hooks/usePhoneAuth.ts`. Single source of truth for: sendSms, verifyOtp, digitChange, paste, cooldown, resend. Imported by both PhoneOtpForm and PostBookingAuth.

### Direction B: Auth Flow State Machine
Create `src/lib/auth/authMachine.ts` — typed discriminated union for auth flow state:
```ts
type AuthStep = 
  | { type: 'choose' }
  | { type: 'phone'; phone: string }
  | { type: 'otp'; phone: string; digits: string[] }
  | { type: 'channels'; userId: string }
```
Used by both PhoneOtpForm and PostBookingAuth. Eliminates duplication entirely.

### Direction C: Universal Auth Sheet
Combine ClientAuthSheet + NavLoginSheet + PostBookingAuth into one `AuthSheet` component that adapts to context: `mode: 'navbar' | 'booking' | 'post-booking'`. Eliminates 3 duplicate Google OAuth buttons, benefit displays, and skip handlers.

---

## polish — Final Quality

### Design System Alignment

| Component | Drift |
|-----------|-------|
| ClientAuthSheet | 2 inline var(--accent). Otherwise tokens. |
| NavLoginSheet | Zero drift. Best aligned. |
| PostBookingAuth | ~20 inline var(--*). Worst drift in A3. |
| TelegramProvider | Zero drift. |

### Copy
All Ukrainian. "Твій beauty-кабінет", "Збережи запис — керуй красою легко", "Пропустити, без акаунту →". Humanizer: clean.

### Missing States
- ClientAuthSheet: no error state for Google OAuth failure
- NavLoginSheet: no loading spinner on Google login (line 34: `setLoading(true)` but no loading UI in Google button)
- PostBookingAuth: no phone-on-OTP-step reminder header (user sees "Код надіслано на +38..." but not which phone)

---

## layout — Spatial Design

**Score**: 7/10

**ClientAuthSheet**: Benefits cards stacked with icon + text. Clean. Email form has icon-prefixed inputs with proper spacing.

**NavLoginSheet**: Bottom sheet layout. Handle bar at top. Google button → divider → email form → register link. Standard auth sheet pattern. Correct.

**PostBookingAuth**: 2-column bento benefits grid (lines 274-312). Adaptive loyalty grid (1/2/3 columns based on program count). C2C referral card. Channel cards with state-dependent styling. Well-structured for rich content.

**TelegramProvider**: Full-screen loader overlay. No layout (provider pattern).

---

## optimize — Performance

**Score**: 6/10

| Issue | Impact |
|-------|--------|
| PostBookingAuth 661 lines = full re-render on any state change | Major. Memoize step components. |
| `backdrop-filter: blur(8px)` on cards (line 303) | GPU layer creation. iOS scroll jank. |
| TelegramProvider Promise.race with 5s timeout ×2 | Minor. But `as any` bypasses type safety. |
| No memo on any component | Acceptable for auth flow (not frequently re-rendered). |

---

## Summary — All 7 Commands

| Command | Result |
|---------|--------|
| critique | 26/40 heuristics — Acceptable. 3 P0 (duplication, icons, inline vars) |
| audit | 13/20 — Acceptable. Code Quality 2/4. Theming 2/4 |
| animate | 7/10 — Clean motions. No reduced-motion. Over-animated PostBookingAuth |
| overdrive | 3 directions: Shared usePhoneAuth hook, Auth state machine, Universal Auth Sheet |
| polish | Worst duplication in project (8 functions, Icons, inputCls, 21× pattern class) |
| layout | 7/10 — Clean bento benefits. Adaptive loyalty grid. |
| optimize | 6/10 — 661-line re-render cost. backdrop-filter GPU. |

**Priority fix order**: Extract shared usePhoneAuth hook → Move GoogleIcon to import → Fix PostBookingAuth inline vars → Split PostBookingAuth → Remove backdrop-filter → Guard console.log → inputCls → pattern class → Touch target 44px
