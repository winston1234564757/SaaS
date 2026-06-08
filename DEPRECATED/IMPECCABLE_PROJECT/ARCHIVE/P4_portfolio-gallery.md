# P4: `/[slug]/portfolio` — Impeccable Audit (Skill Workflow)

**Route**: `/[slug]/portfolio` (portfolio preview section on public master page)
**Files**: `PublicPortfolioGallery.tsx` (104 lines) + `PortfolioBookingButton.tsx` (93 lines)
**Register**: Product (app UI, public profile)
**Date**: 2026-06-01
**Methodology**: critique (split assessment) → audit → animate → overdrive → polish → layout → optimize

---

## critique — Combined Report

### Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3/4 | Photo count + review count visible. No loading skeleton for strip itself. |
| 2 | Match System / Real World | 4/4 | Portfolio = standard concept. Scissors icon for beauty, star for reviews. Ukrainian. |
| 3 | User Control and Freedom | 3/4 | Horizontal scroll natural. No "back" affordance from card tap (browser back only). |
| 4 | Consistency and Standards | **2/4** | 3 inline styles with raw hardcoded rgba colors — no design tokens. `transition-colors active:scale` is a logical bug. |
| 5 | Error Prevention | 4/4 | Simple navigation, no destructive actions. |
| 6 | Recognition Rather Than Recall | 4/4 | All info visible on surface. |
| 7 | Flexibility and Efficiency of Use | 3/4 | "See all" shortcut works. No keyboard arrow navigation for scroll strip. |
| 8 | Aesthetic and Minimalist Design | 3/4 | Clean layout. Dashed border color arbitrary, not from palette. |
| 9 | Error Recovery | N/A | Not applicable (no user input). |
| 10 | Help and Documentation | N/A | Not applicable. |
| **Total** | | **26/32** | **Acceptable to Good** |

### Anti-Patterns Verdict

**LLM Assessment (sub-agent)**: MODERATE SLOP — 5 violations

| Violation | File:Line | Type |
|-----------|-----------|------|
| `style={{ background: '#FFE8DC' }}` hardcoded hex, no token | BookingButton.tsx:68 | **P0** |
| `transition-colors active:scale-[0.97]` — `transition-colors` does NOT affect `transform`, press animation broken | Gallery.tsx:93 | **P1 (bug)** |
| No `prefers-reduced-motion` on framer-motion initial/animate | Gallery.tsx:44-46 | P1 |
| `style={{ boxShadow: '0 2px 16px rgba(44,26,20,0.08)' }}` raw rgba, not token | Gallery.tsx:52 | P1 |
| `style={{ border: '2px dashed rgba(120,154,153,0.4)' }}` raw rgba, not token | Gallery.tsx:94 | P1 |

**Deterministic scan**: `npx impeccable detect --json --gpt` → `[]` — no patterns detected by CLI scanner.

### Overall Impression

Structurally solid component with correct semantics (no `div onClick` violations). Two-item preview + "See all" dashed card creates good curiosity gap. Horizontal scroll with snap is well-implemented mobile-first pattern. The main issue is inconsistent token usage (inline styles with hardcoded values that break the 3-theme system). The secondary issue is a functional bug: the press animation literally doesn't work because `transition-colors` doesn't cover `transform`.

### What's Working

1. **Correct semantic elements** — `<section>`, `<button type="button">`, `<Link>` used properly throughout. No accessibility violations from element choice.
2. **Responsive scroll pattern** — Edge-to-edge horizontal scroll with `snap-x snap-mandatory`, negative margin bleed, and hidden scrollbar is clean mobile-first implementation.
3. **Smart progressive disclosure** — Two-item preview + dashed "See all" card creates natural curiosity gap. Dynamic import with skeleton for BookingFlow is robust.

### Priority Issues

| ID | P | What | Why | Fix |
|----|---|------|-----|-----|
| P4-I1 | **P0** | `#FFE8DC` hardcoded hex on booking button (BookingButton.tsx:68) | Breaks theming for Blossom/Studio/Frost. Light peach clashes on dark themes. | Use `bg-[var(--booking-accent)]` or add Tailwind token |
| P4-I2 | **P1** | `transition-colors active:scale` — scale animation non-functional (Gallery.tsx:93) | The press animation doesn't work — `transition-colors` only affects color properties | Change to `transition-transform active:scale-[0.97]` |
| P4-I3 | **P1** | No `prefers-reduced-motion` on framer-motion (Gallery.tsx:44-46) | Violates WCAG 2.3.3 — animations ignore system accessibility setting | Wrap with `useReducedMotion()` from framer-motion |
| P4-I4 | **P1** | Raw rgba shadow + border inline (Gallery.tsx:52,94) | Not theme-aware; looks mismatched on Blossom vs Frost | Map to `shadow-sm`, `border-dashed border-primary/30` |
| P4-I5 | **P2** | `return null` empty state (Gallery.tsx:24) | User sees no portfolio section at all — might think profile is broken | Show `<p>Портфоліо поки порожнє</p>` |
| P4-I6 | **P3** | Booking button `py-2.5` = 36px < 44px (BookingButton.tsx:67) | Fails WCAG 2.5.5 minimum touch target on mobile | Change to `py-3` |

### Persona Red Flags

**Olena (First-time client browsing for a master)**:
- Sees "Портфоліо" section → empty (P2) → thinks master has no work → leaves
- Taps portfolio card → wants to see more → only 2 show, must tap "Всі роботи" (acceptable)

**Dmytro (Power user, tab-navigates everything)**:
- Tries arrow keys to scroll portfolio → nothing happens (P3 — no keyboard nav)
- Tab-navigates to booking button → "Записатись" — correct `<button type="button">`, works

### Minor Observations

- `sizes="176px"` on line 57 — correct for w-44 card. Good.
- Photo count badge (line 63-67) — displays as `[10]` for single digits. For 100+, would be `[100]`. Fine but consider truncation.
- `masterSlug` / `items` — well-typed interface as `PublicPortfolioItemPreview`. Clean separation.

### Questions to Consider

- "What if the preview showed 3 items instead of 2 for a bento 2×2 grid feel?"
- "Does the booking button need a warm tone (`#FFE8DC`) at all, or should it use the standard `bg-primary`?"

---

## audit — Technical Quality

| # | Dimension | Score | Key Finding |
|---|-----------|-------|-------------|
| 1 | Accessibility | 3/4 | `<section>` semantic ✓. `type="button"` ✓. Touch target < 44px (P3). No keyboard nav. |
| 2 | Performance | 4/4 | Lightweight. Dynamic import + skeleton for BookingFlow. No `transition-all`. Efficient. |
| 3 | Theming | **2/4** | 3 inline hardcoded values. `#FFE8DC` not in any theme. rgba values break on dark. |
| 4 | Responsive | 4/4 | Horizontal scroll with snap. w-44 (176px) cards scale well. Edge bleed pattern correct. |
| 5 | Anti-Patterns | 3/4 | Clean structure. Broken `transition-colors active:scale` is the only anti-pattern tell. |
| **Total** | | **16/20** | **Good** |

### Executive Summary

**16/20** — Good. The main gap is Theming (2/4). Fix the 3 inline style blocks and this climbs to 18+.

### Detailed Findings

- **[P0]** Hardcoded `#FFE8DC` — theming, BookingButton.tsx:68
- **[P1]** Broken `transition-colors` — anti-pattern, Gallery.tsx:93
- **[P1]** No `prefers-reduced-motion` — accessibility, Gallery.tsx:44-46
- **[P1]** Inline rgba shadow + border — theming, Gallery.tsx:52,94
- **[P2]** Empty state `return null` — accessibility, Gallery.tsx:24
- **[P3]** Touch target 36px < 44px — responsive, BookingButton.tsx:67

### Positive Findings

- No `transition-all` anywhere
- Dynamic import with skeleton loading pattern
- No `any` types — clean TypeScript interface

---

## animate — Motion Analysis

**Score**: 7/10 — Product register. Minimal, purposeful.

**Current motion**:
- Card mount: `initial={{ opacity:0, x:16 }}` → `animate={{ opacity:1, x:0 }}` with `delay: i*0.06` — clean stagger (✓) but no `prefers-reduced-motion` (✗)
- Card press: `active:scale-[0.97]` with `transition-colors` — broken (✗)
- "See all" press: same broken pattern (✗)
- Booking button: no animation (✓ — acceptable for product register)

**Recommendations**:
1. Wrap framer-motion in `useReducedMotion()` — respect accessibility
2. Fix `transition-colors` → `transition-transform`
3. No additional animation needed — product register, motion conveys state only

---

## overdrive — Push Limits

### Direction A: Bento Gallery Grid
Replace horizontal strip with 2×2 bento grid showing 3 items + "See all" as 4th cell. Better breathing room on tablet/desktop.

### Direction B: Cover Photo Carousel with Peek
Animate scroll so second card subtly peeks from edge. Spring physics on card reveal — adds discovery delight for zero content cost.

### Direction C: Service-Tagged Filter Pills
Add category pills above strip ("Нігті", "Волосся", "Все") that filter preview on master page. Links to full gallery with pre-applied filter.

---

## polish — Final Quality

**Design System Alignment**: 3 token drifts found.

| Location | Value | Expected | Status |
|----------|-------|----------|--------|
| BookingButton.tsx:68 | `#FFE8DC` | `--color-booking-accent` or `bg-primary` | Missing token |
| Gallery.tsx:52 | `rgba(44,26,20,0.08)` | `shadow-sm` | Drift |
| Gallery.tsx:94 | `rgba(120,154,153,0.4)` | `border-primary/30` | Drift |

**Copy**: All Ukrainian clean. "Портфоліо" (heading), "Всі роботи" (link), "Записатись" (CTA). Humanizer: no issues.

**Interactive states**: Booking button has no `:hover` or `:focus-visible`. Cards rely on `active:scale` only — missing hover state.

---

## layout — Spatial Design

**Score**: 8/10

```
┌──────────────────────────────────────────┐
│ Портфоліо                    Всі роботи →│
├──────────────────────────────────────────┤
│ ┌──────────┐ ┌──────────┐ ┌──────────┐   │
│ │ [COVER]  │ │ [COVER]  │ │ → Всі    │   │
│ │          │ │          │ │   роботи  │   │
│ │ Назва    │ │ Назва    │ │           │   │
│ │ Нігті ★  │ │ Волосся  │ │           │   │
│ └──────────┘ └──────────┘ └──────────┘   │
└──────────────────────────────────────────┘
```

Clean horizontal scroll with `gap-3`, w-44 cards, dashed "see all" affordance. Edge-to-edge `-mx-4 px-4` technique correct. `space-y-4` section spacing is appropriate for product register. `snap-x snap-mandatory` good UX.

---

## optimize — Performance

**Score**: 8/10 — No bottlenecks. Only optimization needed: scope mount animation's `prefers-reduced-motion`.

- `priority` on main hero image (Gallery doesn't have one — not applicable)
- Dynamic import with skeleton for BookingFlow ✓
- No `transition-all` ✓
- No layout thrashing ✓
- Images use `next/image` with `sizes` ✓

---

## Summary — All 7 Commands

| Command | Result |
|---------|--------|
| critique | 26/32 heuristics — Acceptable. 5 issues (1 P0, 4 P1) |
| audit | 16/20 — Good. Theming weakest (2/4) |
| animate | 7/10 — Clean stagger. Missing reduced-motion + broken press animation |
| overdrive | 3 directions: Bento grid, Peek carousel, Filter pills |
| polish | 3 token drifts. Missing hover states. Copy clean |
| layout | 8/10 — Clean horizontal scroll bento |
| optimize | 8/10 — Efficient, minor reduced-motion gap |

**Priority fix order**: P0 hex token → P1 broken transition → P1 reduced-motion → P1 inline rgba → P2 empty state → P3 touch target
