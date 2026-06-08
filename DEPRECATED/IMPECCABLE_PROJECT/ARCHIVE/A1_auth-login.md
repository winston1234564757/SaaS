# A1: `/login` + `/register` — Impeccable Audit (Skill Workflow)

**Route**: `/(auth)/login` + `/(auth)/register`
**Files**: `PhoneOtpForm.tsx` (786 lines), `LoginForm.tsx` (7 lines), `RegisterForm.tsx` (7 lines), `register/actions.ts` (217 lines)
**Register**: Product (auth — critical user flow)
**Date**: 2026-06-01
**Methodology**: critique (split assessment) → audit → animate → overdrive → polish → layout → optimize

---

## critique — Combined Report

### Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 4/4 | Loading spinners, cooldown timer, progress bars — all present |
| 2 | Match System / Real World | 4/4 | UA phone format, Ukrainian labels, clear role metaphors |
| 3 | User Control and Freedom | 3/4 | Back buttons on phone/OTP. No explicit "exit" or "cancel" |
| 4 | Consistency and Standards | **1/4** | Entire design system inline: 60+ hardcoded hex/rgba. No Tailwind tokens, no dark mode possible |
| 5 | Error Prevention | 2/4 | Phone validation `length < 9` only. No confirm before SMS send |
| 6 | Recognition Rather Than Recall | 3/4 | Steps labeled, progressive. OTP auto-submit may disorient |
| 7 | Flexibility and Efficiency | **1/4** | No keyboard shortcuts. No SMS fallback explanation |
| 8 | Aesthetic and Minimalist Design | 3/4 | Clean visual design. 786-line file is anti-minimalist code |
| 9 | Error Recovery | 2/4 | Generic messages. No actionable guidance |
| 10 | Help and Documentation | 0/4 | Zero help text, no support link, no "Why SMS?" explanation |
| **Total** | | **23/40** | **Acceptable** |

### Anti-Patterns Verdict

**LLM Assessment (sub-agent)**: HIGH — "AI Made This" would be believed immediately.

**60+ hardcoded color instances** across 786 lines. Zero Tailwind color tokens used. The entire design system is embedded as inline styles:

| Value | Tailwind Eq | Count | Role |
|-------|-------------|-------|------|
| `#0F172A` | `slate-900` | ~14 | Primary dark |
| `#64748B` | `slate-500` | ~7 | Muted text |
| `#6366F1` | `indigo-500` | ~6 | Accent |
| `#4338CA` | `indigo-700` | ~3 | Links |
| `#EF4444` | `red-500` | ~2 | Error |
| `#F8F9FF` | custom | ~2 | Input bg |
| `#FFFFFF` | `white` | ~6 | White |
| `rgba(99,102,241,*)` | indigo | ~12 | Shadows/borders |
| `rgba(15,23,42,*)` | dark | ~6 | Shadows |

**Other slop tells**:
- `transition-all` on every button (lines 515, 574, 653, 737)
- No `prefers-reduced-motion` on any framer-motion animation
- `whileTap={{ scale: 0.985 }}` without reduced-motion guard
- `AnimatePresence` over-used (checkbox checkmark, error messages)
- `void userId` dead code (line 175)

**Deterministic scan**: `npx impeccable detect --json --gpt` → `[]` — no patterns detected by CLI scanner.

### Overall Impression

The 3-step progressive disclosure is well-executed UX. But the implementation is textbook AI-generated: 60+ inline color values, a 76-line monolithic auth function, dead variables, and zero accessibility motion controls. The visual design is clean (consistent indigo/navy palette), but it's locked in inline styles — changing a shade requires grep-and-replace across 786 lines. This is the highest-priority refactoring target found so far.

### What's Working

1. **3-step progressive disclosure** — Role → phone → OTP maps cleanly to user's mental model. Good wizard pattern.
2. **Role selection cards** — Strong visual states. Selected (dark solid + inset shadow) vs unselected (dashed indigo border) distinguishable even for color-blind users.
3. **OTP auto-submit + paste handling** — `setTimeout(() => handleVerifyOtp(next.join('')), 80)` shows awareness of React batching issues. Power-user-friendly.

### Priority Issues

| ID | P | What | Why | Fix |
|----|---|------|-----|-----|
| A1-I1 | **P1** | 60+ hardcoded inline colors — no Tailwind tokens anywhere | Dark mode impossible. Design changes require hunting 60+ values. No CSS variable pipeline. | Define `customColors` in tailwind.config.ts, replace all inline colors with Tailwind classes |
| A1-I2 | **P1** | 786-line component — refactoring candidate | Impossible to test. `void userId` dead code at line 175. Every change risks regression. | Extract `RoleSelectStep`, `PhoneStep`, `OtpStep` into `steps/` + `useAuthPhone` hook |
| A1-I3 | **P1** | No `prefers-reduced-motion` on any animation | Vestibular disorder users affected. WCAG 2.3.3 requirement. | Import `useReducedMotion()` from framer-motion, disable whileTap + step transitions |
| A1-I4 | **P1** | `handleVerifyOtp` auth monolith (76 lines, lines 116-192) | Multiple `setLoading(false)` branches. Side effects (cookies) invisible. Fragile error recovery. | Split into `verifyOtp()`, `handleMasterRole()`, `handlePostAuthRouting()` |
| A1-I5 | **P1** | `void userId` dead code on line 175 | Indicates incomplete refactor. Variable assigned but never used. | Remove dead variable and assignments |
| A1-I6 | **P2** | Generic error messages | "Помилка сервера" — user can't identify the real problem. Increases support tickets. | Differentiate: wrong code vs expired code vs network error |
| A1-I7 | **P2** | Cookie keys as magic strings (lines 160,171,179,264) | No single source of truth. Server-side cookie + client-side js-cookie mixed. | Create `authCookies.ts` with named functions |
| A1-I8 | **P2** | `supabase = createClient()` created every render (line 40) | New client instance on every render. Unnecessary re-initialization. | `useMemo(() => createClient(), [])` |
| A1-I9 | **P3** | OTP inputs `type="text" inputMode="numeric"` (line 698) | Should be `type="tel"` for better mobile keyboard | Change to `type="tel" inputMode="numeric"` |
| A1-I10 | **P3** | Inline spring config duplication — `SPRING` constant defined but not used everywhere | Lines 429, 460 use inline configs | Unify under `SPRING` constant |

### Persona Red Flags

**Olena (mobile user, first-time)**:
- Opens login → sees role select → picks Клієнт → enters phone → gets SMS → auto-focus works ✓
- But types slowly → OTP auto-submits before she's ready → frustrates (auto-submit on 6th digit is aggressive)

**Dmytro (Safari voiceover user)**:
- Opens login → role buttons lack `aria-pressed` → doesn't know which role is selected
- OTP inputs: auto-focus on first field but no `aria-label` for "digit 1 of 6"
- Enters wrong code → "Невірний код" — no hint if it's format, expiry, or mismatch

**Mykola (vestibular disorder)**:
- Opens login → framer-motion slide transitions without reduced-motion → feels vertigo
- Taps role → `whileTap={{ scale: 0.985 }}` — subtle but triggers symptoms

### Questions to Consider
- "Would splitting this form into route-level steps (3 separate pages) be simpler than one SPA-style wizard?"
- "What if the OTP input used a single masked input instead of 6 separate `<input>` elements?"

---

## audit — Technical Quality

| # | Dimension | Score | Key Finding |
|---|-----------|-------|-------------|
| 1 | Accessibility | **2/4** | Missing `aria-pressed` on role buttons. No `prefers-reduced-motion`. OTP inputs lack `aria-label`. |
| 2 | Performance | 3/4 | `supabase` client not memoized. `transition-all` everywhere. AnimatePresence on micro-elements. |
| 3 | Theming | **0/4** | Zero Tailwind color tokens. 60+ hardcoded hex/rgba. Dark mode impossible. |
| 4 | Responsive | 3/4 | `w-full` + flex layout. Touch targets at `py-[14px]` ≈ 38px < 44px on buttons. |
| 5 | Anti-Patterns | **1/4** | 60+ inline styles = heavy AI aesthetic. `transition-all`. Over-animated micro-elements. |
| **Total** | | **9/20** | **Poor** |

### Executive Summary

**9/20** — Poor. Theming (0/4) and Anti-Patterns (1/4) are critical. This is the lowest-scoring file audited so far. The auth flow UX is solid but the implementation quality is the worst in the project.

### Detailed Findings

- **[P1]** 60+ inline hardcoded colors — theming, entire file
- **[P1]** 786-line component — code quality
- **[P1]** No reduced-motion — a11y
- **[P1]** `handleVerifyOtp` 76-line monolith — code quality
- **[P1]** `void userId` dead code — code quality
- **[P2]** Generic errors — a11y
- **[P2]** Cookie magic strings — code quality
- **[P2]** `supabase` not memoized — performance
- **[P3]** OTP input type — responsive
- **[P3]** Spring config duplication — code quality

### Positive Findings
- 3-step wizard UX is well-designed
- OTP auto-submit + paste is power-user-friendly
- Consistent visual palette (indigo/navy) despite being inline

---

## animate — Motion Analysis

**Score**: 5/10

| Element | Current | Verdict |
|---------|---------|---------|
| Step transitions | `AnimatePresence popLayout` with slide+fade | Good UX. Missing reduced-motion. |
| Role card tap | `whileTap={{ scale: 0.985 }}` | Subtle, correct. No reduced-motion guard. |
| Progress bar | `motion.div` scaleX animation | Clean. |
| Checkbox checkmark | Animated SVG via AnimatePresence | Over-animated for a micro-element. |
| Error messages | AnimatePresence fade-in | Acceptable. |
| Button states | CSS transition `background 180ms ease` | Mixed framer/CSS paradigm. |

**Issues**:
1. No `prefers-reduced-motion` anywhere (P1)
2. `transition-all` on buttons instead of property-specific (P2)
3. Checkbox checkmark doesn't need AnimatePresence — CSS transition would suffice (P3)

---

## overdrive — Push Limits

### Direction A: Extract into Route-Level Steps
Replace the SPA wizard with 3 separate routes: `/login` → `/login/phone` → `/login/verify`. Each page is a Server Component shell wrapping a lightweight client form. Better SEO, better back button behavior, shareable verify-state URLs.

### Direction B: Biometric Auth
Add `credentials` API (TouchID / FaceID / Windows Hello) as a returning-user shortcut. Uses WebAuthn API. No password, no OTP for returning users who've registered a device.

### Direction C: Auth State Machine Hook
Extract the entire `useState` + handler mess into a `useAuthPhone()` hook with a discriminated union type for each step's data. Turns 786 lines of spaghetti into 200 lines of hook + 3 × 150-line step components.

---

## polish — Final Quality

### Design System Alignment

**Root cause**: No design system tokens used. The entire palette is inline.

**Drift categories**:
- **Missing tokens**: `#0F172A`, `#64748B`, `#6366F1`, `#4338CA`, `#F8F9FF`, `rgba(99,102,241,*)`, `rgba(15,23,42,*)` — none exist in any theme
- **One-off implementations**: Every single styled element uses inline `style={}` — no shared components
- **Conceptual misalignment**: Forms use inconsistent animation model (framer for transitions, CSS transitions for button hover, inline for checkbox)

### Copy
All Ukrainian: "Ласкаво просимо", "Я Клієнт", "Я Майстер", "Продовжити", "Вхід у Bookit", "Отримати код", "Введіть код", "Підтвердити", "Змінити номер", "Надіслати знову". Humanizer: clean.

### Interaction States
- Role buttons: selected/unselected (2 states). Missing hover, focus-visible.
- Google button: loading spinner. Missing hover, focus-visible.
- Phone input: focus ring via `focus-within:ring-2` (line 604). Missing error state visual.
- OTP inputs: filled/unfilled/focused (3 states). Good.

### Missing States
- Empty role (none selected): impossible by design — client is default
- Error during phone send: shows `data.error` — could be generic
- OTP expired vs wrong distinction: no differentiation

---

## layout — Spatial Design

**Score**: 6/10

```
┌──────────────────────────────────┐
│  ┌──┐ ┌──┐ ┌──┐                  │  ← 3-step progress bar
│  ██  ██  ██                      │
│                                  │
│       Ласкаво просимо            │
│    Як будете використовувати?     │
│                                  │
│  ┌────────────────────────────┐  │
│  │ 👤 Я Клієнт            ○  │  │  ← role cards
│  │   Записуюсь...              │  │
│  └────────────────────────────┘  │
│  ┌────────────────────────────┐  │
│  │ ✂️ Я Майстер           ○  │  │
│  │   Керую записами...         │  │
│  └────────────────────────────┘  │
│                                  │
│  ☐ Я ознайомлений з Умовами...   │
│                                  │
│  ┌────────────────────────────┐  │
│  │       Продовжити           │  │  ← full-width CTA
│  └────────────────────────────┘  │
└──────────────────────────────────┘
```

Clean centered layout. `w-full` + `max-w` (via parent). Progress bar at top — good. Role cards stacked vertically (correct — 2 items not worth a grid). Terms below roles is visually heavy — consider compact checkbox. The white card `bg-white rounded-[28px]` with multi-layered shadow creates good elevation on any parent background.

---

## optimize — Performance

**Score**: 6/10

| Aspect | Assessment |
|--------|------------|
| `supabase` client | Not memoized — created every render (P2) |
| `transition-all` | 4 buttons use `transition-all` — minor, trivial |
| framer-motion | `AnimatePresence` on 3 step components + error messages + checkbox. Could consolidate. |
| Bundle | framer-motion already a dep. GoogleIcon is inline SVG — efficient. |
| `handleVerifyOtp` | 76-line function creates closures over state. Not memoized. |

**Recommendations**: Memoize `supabase`, replace `transition-all` with property-specific, consolidate AnimatePresence instances to only the step container.

---

## Summary — All 7 Commands

| Command | Result |
|---------|--------|
| critique | 23/40 heuristics — Acceptable. 60+ inline colors, 786-line file |
| audit | 9/20 — **Poor**. Theming 0/4, Anti-Patterns 1/4 |
| animate | 5/10 — Good step transitions. No reduced-motion. Over-animated micro-elements |
| overdrive | 3 directions: Route-level steps, WebAuthn biometrics, Auth state machine hook |
| polish | All colors missing from tokens. Copy clean. Missing hover/focus states |
| layout | 6/10 — Clean centered wizard. Terms placement heavy |
| optimize | 6/10 — `supabase` not memoized. `transition-all`. AnimatePresence over-use |

**Priority fix order**: Theming (60+ inline colors → tokens) → Code splitting (786 lines → steps + hook) → Reduced-motion → handleVerifyOtp split → Dead code removal → Error messages → Cookie utility → useMemo supabase → input types
