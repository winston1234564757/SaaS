# P2: `/[slug]` (Public Master Page) — Impeccable Audit (Skill Workflow)

**Route**: `/[slug]` (public master profile)
**File**: `src/components/public/PublicMasterPage.tsx` (1127 lines)
**Date**: 2026-06-01
**Methodology**: impeccable critique (split assessment) → audit → animate → overdrive → polish → layout → optimize

---

## 1. critique (Split Assessment)

### Assessment A: LLM Design Review (sub-agent)

**AI Slop Verdict**: HEAVY — unmistakably AI-generated

| # | Pattern | Lines | Severity |
|---|---------|-------|----------|
| 1 | **Ad-hoc theme token computation** — 6 inline style variables mixing hex/RGBA/template-literal/isDark ternaries | 445-451 | **P0** |
| 2 | **`ThemedBlobBackground`** — 4 decorative blobs, zero functional value | 139-148 | High |
| 3 | **13+ `transition-all`** — every interactive element | 215, 486, 518, 539, 639, 668, 679, 799, 887, 917, 963, 998, 1092 | **P0** |
| 4 | **Two near-identical spring constants** — 7% stiffness difference, imperceptible | 22-23 | Medium |
| 5 | `active:scale-[0.95]` on 10+ locations — should be shared utility class | Throughout | Medium |
| 6 | `animate-pulse` on LIVE badge — AI crutch for "looks real-time" | 237 | Low |
| 7 | **`.catch(() => {})` silent swallowing** — network errors vanish | 373, 375 | **P0** |
| 8 | Glassmorphism scatter: 3 different blur levels, none earned | 539, 892, 1092 | Low |

**Heuristic Score**: 19/40 — Poor

| H | Score | Key Evidence |
|---|-------|-------------|
| 1. Visibility | 2 | No loading states for services. Pulse decorative, not data-driven |
| 2. Match | 3 | Good Ukrainian. "LIVE" English badge breaks consistency |
| 3. Control | 2 | No back-to-top, no jump-to-services |
| 4. Consistency | 2 | Mixed `animate`/`whileInView`; `isDark` ternary duplicates logic |
| 5. Prevention | 2 | No visible validation; `.catch(() => {})` conceals failures |
| 6. Recognition | 3 | Good icon+label combos. Helpful inline data |
| 7. Efficiency | 1 | No keyboard shortcuts, no filter/sort on services |
| 8. Aesthetic | 1 | 11+ content blocks competing; decorative blobs; pulse badge |
| 9. Recovery | 2 | Errors silently caught; no user-facing error states |
| 10. Help | 1 | Only one tooltip (verified badge) |

**Cognitive Load**: 3/8 PASS — HIGH (5 FAIL — critical)
- **FAIL**: Single focus (14 content blocks before core action)
- **FAIL**: Visual hierarchy (services below deals, shop, portfolio)
- **FAIL**: One thing at a time (evaluate deals + shop + products + reviews simultaneously)
- **FAIL**: Minimal choices (8+ services per category)
- **FAIL**: Progressive disclosure (everything visible at once)

### Assessment B: Automated Detection (npx impeccable detect --json --gpt)

```json
[]
```
No anti-patterns detected by the CLI scanner.

### Combined Impact Matrix

| ID | Issue | P | Fix |
|----|-------|---|-----|
| P2-I1 | **JS theme tokens** — 6 inline variables mixed formats, ad-hoc `isDark` ternaries | **P0** | Move to CSS custom properties on `[data-theme]`. Remove every `isDark` ternary |
| P2-I2 | **`.catch(() => {})` silent error swallowing** (lines 373, 375) | **P0** | Log errors, surface contextually |
| P2-I3 | **13+ `transition-all`** causing layout thrashing | **P0** | Replace with `transition-colors/opacity/transform` per element |
| P2-I4 | No loading/error/empty states for dynamic sections | P1 | Add error boundaries per section |
| P2-I5 | Inconsistent animation choreography (animate vs whileInView, 2 springs) | P1 | Single spring, systematic stagger |
| P2-I6 | `scrollbar-hide` on FlashDealsStrip | P2 | Maintain scroll affordance |
| P2-I7 | Language inconsistency: "LIVE" badge in Ukrainian page | P2 | Use "ЗАРАЗ" |

---

## 2. audit

| Dimension | Score (0-4) | Notes |
|-----------|-------------|-------|
| **Accessibility** | 2/4 | `type="button"` ✓. Share has `aria-label`. Schedule uses color-only for today indicator. Contrast varies by theme. |
| **Performance** | 2/4 | 1127-line component. 13+ `transition-all`. Multiple `setInterval` (useCountdown). RPC calls. Inline styles prevent CSS caching. |
| **Browser Support** | 3/4 | Uses `backdrop-blur`, `color-mix`, `radial-gradient`. Modern but wide support. |
| **Responsive** | 3/4 | `max-w-lg` on mobile. Schedule 7-col may overflow <360px. Floating CTA well-placed. |
| **Code Quality** | 2/4 | Inline styles everywhere. 5 animation patterns. Component should be split. |

**Total: 12/20 — Needs work**

---

## 3. animate

**Score: 3/10 — Major overhaul needed**

20+ `transition-all` violations (largest count). Layout property animation on service cards. No `prefers-reduced-motion` on ~30 elements. Image scale via `group-hover:scale-110` through `transition-all`.

---

## 4. overdrive

### Direction A: Dynamic Island Booking FAB
Floating CTA transforms into Dynamic Island as user scrolls. Shows selected service + price. Scroll-linked animation with `useScroll` + `useTransform`.

### Direction B: Scroll-Triggered Section Reveal
Each section reveals with distinct animation: header zooms, schedule slides, services stagger, products fade. `whileInView` with varying margins.

### Direction C: Express Repeat Booking
"Повторити запис" button if client has history. Pre-fills BookingFlow with same services.

---

## 5. polish

### Token Drift — Critical

| Location | Value | Impact |
|----------|-------|--------|
| Lines 445-451 | 7 JS theme variables (hex, rgba, template-literal mix) | **Critical** — entire theming in JS |
| Lines 22-23 | 2 spring constants (280/24, 300/24) | Medium |
| Line 1094 | `theme.accent}73` hex-opacity inline | Low |
| Lines 750-755 | `rgba(255,255,255,0.5)` inline | Low |

**Primary concern**: JS theme tokens force ~30 child elements to recompute styles on every render.

---

## 6. layout

**Score: 7/10**. Well-organized bento layout. Clear section hierarchy. `max-w-lg` constrains tightly. Floating CTA well-positioned (never overlaps content).

---

## 7. optimize

**Score: 4/10 — Major work needed**

| Issue | Impact | Fix |
|-------|--------|-----|
| 13+ `transition-all` | Style recalc per interaction | Scope all |
| JS theme tokens recomputed every render | 7 inline vars per render | CSS custom properties |
| `useCountdown` 1s `setInterval` per flash deal | 1+ timers, re-render every second | Single shared interval |
| `master.services.filter(...)` in render | Full scan per category per render | Pre-compute Map |

---

## Summary

| Dimension | Score | Rating |
|-----------|-------|--------|
| critique (heuristics) | 19/40 | **Poor** |
| audit (5-dim) | 12/20 | Needs work |
| animate | 3/10 | **Major overhaul** |
| polish | — | **7 JS token drifts (Critical)** |
| layout | 7/10 | Good |
| optimize | 4/10 | Needs work |

### Priority Actions

| Order | Action | Severity | Effort |
|-------|--------|----------|--------|
| 1 | **Move 7 JS theme variables to CSS custom properties** | **P0** | 30min |
| 2 | **Fix `.catch(() => {})` silent error swallowing** | **P0** | 10min |
| 3 | **Scope all 13+ `transition-all` to specific properties** | **P0** | 30min |
| 4 | Fix service card `transition-all duration-300` group-hover | P1 | 10min |
| 5 | Standardize animation triggers (animate vs whileInView) | P1 | 20min |
| 6 | Pre-compute service category Map for O(1) lookup | P2 | 15min |
| 7 | Add `prefers-reduced-motion` to all ~30 animated elements | P1 | 20min |
