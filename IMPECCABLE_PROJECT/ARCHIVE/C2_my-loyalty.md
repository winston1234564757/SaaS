# C2: `/my/loyalty` — Impeccable Audit (Skill Workflow)

**Route**: `/my/loyalty` (client loyalty & referrals)
**Files**: `MyLoyaltyPage.tsx` (420 lines), `page.tsx` (143 lines)
**Total**: 563 lines
**Register**: Product (client zone)
**Date**: 2026-06-01
**Methodology**: critique (split assessment) → audit → animate → overdrive → polish → layout → optimize

---

## critique — Combined Report

### Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 4/4 | Copy feedback, progress bars, active/used states all clear |
| 2 | Match System / Real World | 3/4 | Ukrainian everywhere. "Barter" only in internal naming. |
| 3 | User Control and Freedom | 3/4 | Tab navigation standard. No undo (expected). |
| 4 | Consistency and Standards | **2/4** | Dual error handling (catch vs no catch). Dual type aliases. Dual URL strategies. |
| 5 | Error Prevention | **2/4** | Hydration mismatch risk (window.location.origin). No clipboard fallback. |
| 6 | Recognition Rather Than Recall | 3/4 | Emoji+name references consistent. Stats line slightly dense (3 metrics in 12px). |
| 7 | Flexibility and Efficiency | 3/4 | Adequate for scope. Tabs + sub-tabs. |
| 8 | Aesthetic and Minimalist Design | 3/4 | Clean. `animate-pulse` adds minor visual noise. |
| 9 | Error Recovery | **2/4** | Share + clipboard failures completely invisible. Silent `.catch(() => {})`. |
| 10 | Help and Documentation | 3/4 | C2C "Як це працює" card. C2B hero explains itself. |
| **Total** | | **28/40** | **Good** |

### Anti-Patterns Verdict

**LLM Assessment (sub-agent)**: LOW — 4 P1 issues, all error-handling related

| Violation | Line | Severity |
|-----------|------|----------|
| `navigator.share().catch(() => {})` — silent swallow | 69 | **P1** |
| `navigator.clipboard.writeText` — no `.catch()` | 61 | **P1** |
| `setTimeout` with no cleanup | 63 | **P1** |
| Dual reward type aliases (`percent_discount` / `discount_percent`) | 354 | **P1** |
| `window.location.origin` in render — hydration flicker | 58 | P2 |
| Tab group missing `role="tablist"` / `role="tab"` | 78-103 | P2 |
| `animate-pulse` no `prefers-reduced-motion` | 331 | P2 |
| Three metrics on one line in 12px — dense | 213 | P3 |

**Deterministic scan**: `npx impeccable detect` → `[]` — no patterns detected.

**Visual overlays**: Skipped (no browser automation needed for client component audit).

### Overall Impression

Clean, well-structured loyalty page. The component has clear information architecture with two-tier tabs (loyalty / referral → C2C / C2B). The gradient hero card for C2B is the standout visual. Main issues are all in error handling: share and clipboard failures are silently swallowed, setTimeout has no cleanup, and the dual reward type aliases leak a DB inconsistency into the UI. Nothing blocking, but 4 P1 fixes needed before release.

### What's Working

1. **C2B gradient hero card** (lines 246-287) — Strong visual hierarchy with `from-accent to-accent/80`, blurred decorative circle, `backdrop-blur` on the invite link input. The stats footer (invited / bonus count) with vertical divider is clean product design.

2. **Loyalty progress cards with spring animation** (lines 359-419) — `spring(300,24)` mount stagger, animated progress bar with `easeOut` duration 0.7s, "Нагорода готова!" reveal at 100%. Good use of motion to celebrate achievement.

3. **C2C per-master referral cards** (lines 198-240) — Clear stats row, share/copy dual-action buttons, balance badge. The `balance = completed * c2cDiscountPct` formula displayed as "+N%" badge when positive is a nice micro-reward signal.

### Priority Issues

| ID | P | What | Why | Fix |
|----|---|------|-----|-----|
| C2-I1 | **P1** | `navigator.share().catch(() => {})` silent swallow (line 69) | User clicks share, browser fails (no Web Share API on desktop), nothing happens — user thinks it worked | Show toast/alert on failure |
| C2-I2 | **P1** | `navigator.clipboard.writeText` no `.catch()` (line 61) | Unhandled promise rejection if clipboard access denied. Console error + no feedback to user. | Add `.catch()` with fallback |
| C2-I3 | **P1** | `setTimeout` with no cleanup (line 63) | Component unmounts during 2s countdown → `setCopied(null)` fires on unmounted component | `useEffect` cleanup or `useRef` guard |
| C2-I4 | **P1** | Dual reward type aliases (line 354) | DB has both `percent_discount` and `discount_percent`. Fallback assumes % if unknown type — wrong reward displayed silently | Unify DB values or handle all known types explicitly |
| C2-I5 | **P2** | `window.location.origin` in render (line 58) | SSR hydration mismatch. Server renders `/invite/${code}`, client renders `http://.../invite/${code}` | Use `NEXT_PUBLIC_SITE_URL` like server does (line 131) |
| C2-I6 | **P2** | Tab group missing ARIA roles (lines 78-103, 154-177) | No `role="tablist"`, `role="tab"`, `role="tabpanel"`. Screen reader sees just buttons. | Add proper ARIA tab pattern |
| C2-I7 | **P2** | `animate-pulse` without reduced-motion (line 331) | Vestibular trigger potential. `prefers-reduced-motion` not respected. | Add CSS media query or conditional |

### Persona Red Flags

**Olena (Client earning bonuses)**:
- Shares master link with friend → Web Share API fails (desktop) → nothing happens → thinks she shared → friend never gets link → asks "why didn't my friend get the bonus?" (P1-I1)
- Uses browser without clipboard permission → `writeText` throws silent rejection → "Copied" feedback shown but nothing in clipboard (P1-I2)

**Dmytro (Frontend dev)**:
- Sees `percent_discount` and `discount_percent` both in DB → stores new program with `discount_percentage` → fallback doesn't match → wrong reward shown to user (P1-I4)
- Fixes reward label → `setTimeout` fires after unmount → React warning (P1-I3)

---

## audit — Technical Quality

| # | Dimension | Score | Key Finding |
|---|-----------|-------|-------------|
| 1 | Accessibility | **2/4** | Tab groups missing ARIA roles. `animate-pulse` no reduced-motion. aria-pressed on tabs correct. |
| 2 | Performance | 4/4 | No heavy computations. Stagger mount efficient. No unnecessary re-renders. |
| 3 | Theming | 3/4 | Uses CSS variables. Gradient uses `from-accent`. No hard-coded colors visible. |
| 4 | Responsive | 3/4 | Touch targets mostly ≥44px. 3 metrics in 12px on one line tight for mobile. |
| 5 | Anti-Patterns | 3/4 | Clean. Silent error catches are the main anti-pattern. |
| **Total** | | **15/20** | **Good** |

### Executive Summary

**15/20** — Good. All issues are in error handling hygiene. The component is well-structured technically.

---

## animate — Motion Analysis

**Score**: 7/10

| Element | Current | Verdict |
|---------|---------|---------|
| Tab switch (main) | AnimatePresence popLayout, x: -10→0→10 | Clean. Both directions handled. |
| Tab switch (sub-tabs) | AnimatePresence popLayout, x: -8→0→8 | Same pattern, slightly shorter travel = good. |
| Loyalty card stagger | `spring(300,24)`, delay `index*0.06` | Clean. Appropriate easing. |
| Progress bar fill | `easeOut`, 0.7s duration with `index*0.06+0.15` delay | Well-sequenced. Feels natural. |
| C2C card stagger | `delay: i*0.05`, y: 10→0 | Consistent with rest. |
| Completed reward reveal | `spring(300,20)`, delay `index*0.06+0.4` | Nice delayed reveal. Adds delight. |
| Promocode card stagger | `delay: i*0.05`, y: 10→0 | Consistent. |
| Active badge pulse | `animate-pulse` (CSS) | Only motion lacking `prefers-reduced-motion`. |

All transitions use 150-300ms range. Product-appropriate (no orchestrated page load, just reveal/transition animation for state changes). Missing: `prefers-reduced-motion` media query.

---

## overdrive — Push Limits

```
──────────── ⚡ OVERDRIVE ─────────────
》》》 Entering overdrive mode...
```

### Direction A: Loyalty Progress Confetti Celebration
When a client hits 100% on a loyalty program (reward ready), trigger an inline confetti/micro-celebration effect using Canvas or a lightweight library. Small burst of particles + spring animation. Only fires once per completion. Makes the "Нагорода готова!" moment feel earned.

### Direction B: C2C Share Progress Tracking
Add a tiny inline share tracker per C2C card: "3 friends clicked your link → 1 booked → waiting for visit completion → +10% bonus pending". Real-time status pipeline makes the abstract "Запрошено / Завершили / Баланс" feel alive.

### Direction C: Animated C2B Hero Background
Replace the static gradient + blur circle with a subtle slow-shifting gradient animation or a particle field that responds to scroll. The hero card is the visual centerpiece — a living background raises the perceived value of the referral program.

---

## polish — Final Quality

### Design System Alignment

| Location | Value | Expected | Status |
|----------|-------|----------|--------|
| Line 58 | `window.location.origin` | `NEXT_PUBLIC_SITE_URL` | Drift from server pattern (L131) |
| Line 354 | Dual type aliases | Single canonical type | DB inconsistency normalized |
| Lines 78-103 | Button-based tabs | ARIA tab pattern | Missing roles |

### Copy
All Ukrainian. "Лояльність", "Refer & Earn" (English), "Для подруг", "Запросити майстра", "Як це працює". Mixed "Refer & Earn" is English in an otherwise Ukrainian UI — minor copy drift.

### Missing States
- Share failure: no error state (silent catch)
- Clipboard failure: no fallback
- `setTimeout` cleanup: unmount guard
- `prefers-reduced-motion`: not handled on `animate-pulse`

---

## layout — Spatial Design

**Score**: 8/10

```
┌──────────────────────────────────┐
│ [Лояльність] [Refer & Earn]      │ tab bar
├──────────────────────────────────┤
│ ┌─ Loyalty tab ────────────────┐ │
│ │ Лояльність                    │ │
│ │ N активних програм            │ │
│ ├───────────────────────────────┤ │
│ │ [LoyaltyCard 1]  progress bar│ │
│ │ [LoyaltyCard 2]  progress bar│ │
│ └───────────────────────────────┘ │
│                                  │
│ ┌─ Referral tab ──────────────┐ │
│ │ [Для подруг] [Запросити м-ра]│ │ sub-tabs
│ │                              │ │
│ │ C2C: cards per master        │ │
│ │   [emoji] Name  inv/comp/bal │ │
│ │   [Поділитись] [Копіювати]   │ │
│ │                              │ │
│ │ C2B: gradient hero card      │ │
│ │   -50% heading, invite link  │ │
│ │   stats footer: inv/bonuses  │ │
│ │                              │ │
│ │   Твої Бонуси за Майстрів    │ │
│ │   [promocode card 1] active  │ │
│ │   [promocode card 2] used    │ │
│ └──────────────────────────────┘ │
└──────────────────────────────────┘
```

Clean bento-card layout. Two-tier tab navigation is well-executed. The C2B gradient hero is the strongest visual element — good use of space with stats footer. Empty states present for both C2C and promocodes. Loyalty empty state has "Знайти майстрів" CTA — good recovery path.

---

## optimize — Performance

**Score**: 8/10

- No heavy computations. Stagger mount efficient.
- `useState` only — no unnecessary re-renders.
- All server data fetched on server page — no client waterfall.
- Memory: `setTimeout` without cleanup is only leak risk.
- No `transition-all` — property-specific transitions.
- No images — emoji-only, zero image weight.

---

## Summary — All 7 Commands

| Command | Result |
|---------|--------|
| critique | 28/40 heuristics — Good. 4 P1 (all error handling) |
| audit | 15/20 — Good. A11y 2/4 (missing ARIA tab roles) |
| animate | 7/10 — Clean stagger. Missing `prefers-reduced-motion`. |
| overdrive | 3 directions: Confetti celebration, Share tracking, Animated hero |
| polish | 2 drifts (URL strategy, dual type aliases). Copy: "Refer & Earn" in English |
| layout | 8/10 — Clean bento. Two-tier tabs. Gradient hero C2B standout. |
| optimize | 8/10 — Efficient. Only leak: setTimeout cleanup. |

**Priority fix order**: Share catch → Clipboard catch → setTimeout cleanup → Reward type aliases → Hydration URL → ARIA tab roles → `prefers-reduced-motion`
