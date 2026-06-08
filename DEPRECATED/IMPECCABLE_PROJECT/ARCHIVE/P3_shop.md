# P3: `/[slug]/shop` — Impeccable Audit (Skill Workflow)

**Route**: `/[slug]/shop`
**File**: `src/components/public/ShopPage.tsx` (870 lines)
**Date**: 2026-06-01
**Methodology**: impeccable critique (split assessment) → audit → animate → overdrive → polish → layout → optimize

---

## 1. critique (Split Assessment)

### Assessment A: LLM Design Review (sub-agent)

**AI Slop Verdict**: HIGH — 5 distinct patterns, 2 functional bugs

| # | Pattern | Lines | Severity |
|---|---------|-------|----------|
| 1 | **24× `transition-all`** — every animatable property repaints on any change; 4 inputs trigger on keystroke | 84,143,198,283,334,342,367,386,428,438,465,475,483,600,638,648,712,733,747,758,774,814,831,849 | **P0** |
| 2 | **Double scale: `whileTap` + `active:scale` conflict** on ProductTile AND AddToCart CTA | 198-199, 448-449 | **P0 (Bug)** |
| 3 | **Gallery drag constraints use 100px** instead of container width — broken on all devices | 297 | **P0 (Bug)** |
| 4 | **Framer Motion `animate.x` + `drag="x"` compete** — Motion overwrites drag gesture | 294, 296 | **P1** |
| 5 | 7 inline hex `CATEGORY_COLORS` | 182-185 | P2 |
| 6 | 4 near-identical spring constants (360/34, 300/30, 380/32, 300/20) | 28-31 | P2 |

**Heuristic Score**: 24/40

| H | Score | Key Evidence |
|---|-------|-------------|
| 1. Visibility | 3 | Cart badge ✓, spinner on submit ✓, stock indicators ✓. No order ref after success |
| 2. Match | 4 | Ukrainian locale, Nova Poshta, natural CTA |
| 3. Control | 3 | Close ✓, remove ✓, back ✓. No undo order |
| 4. Consistency | 3 | Consistent buttons. **Two animation engines fighting** |
| 5. Prevention | 2 | Phone format ✓, stock limits ✓. No submit confirmation, no field-level validation |
| 6. Recognition | 3 | Category colors ✓, cart badges ✓ |
| 7. Efficiency | 1 | No search, no sort, no favorites |
| 8. Aesthetic | 2 | Clean layout. **24 transition-all noise, double animation conflict** |
| 9. Recovery | 2 | Single error banner. No inline field guidance |
| 10. Help | 1 | No tooltips, no onboarding |

**Cognitive Load**: 7/8 PASS — 1 FAIL
- **FAIL**: Pickup date selector — no default, hidden horizontal scroll

### Assessment B: Automated Detection (npx impeccable detect --json --gpt)

```json
[]
```
No anti-patterns detected by the CLI scanner.

### Combined Impact Matrix

| ID | Issue | P | Fix |
|----|-------|---|-----|
| P3-I1 | **Gallery drag constraints use 100px** instead of container `offsetWidth` — broken | **P0** | Use container ref's `offsetWidth` |
| P3-I2 | **Double scale: `whileTap` + `active:scale`** — produces jank/stutter | **P0** | Remove `active:scale`, keep `whileTap` |
| P3-I3 | **24× `transition-all`** causing unnecessary repaints | **P0** | Scope to `transition-colors/opacity/transform/shadow` |
| P3-I4 | **Framer Motion `animate.x` + `drag="x"` compete** | P1 | Use `drag="x"` only with spring transition |
| P3-I5 | No empty state when category filter yields 0 results | P1 | Add `if (filtered.length === 0)` fallback |
| P3-I6 | 4 near-identical spring constants | P2 | Consolidate to 2 tokens |
| P3-I7 | Inline hex `CATEGORY_COLORS` (7 values) | P2 | Move to CSS vars |
| P3-I8 | No order reference on success screen | P2 | Add order number |

---

## 2. audit

| Dimension | Score (0-4) | Notes |
|-----------|-------------|-------|
| **Accessibility** | 3/4 | `type="button"` ✓. `aria-label` ✓. `aria-pressed` ✓. No `aria-live` for cart updates. Photo gallery no keyboard nav. |
| **Performance** | 3/4 | `<Image>` with `priority` ✓. 24× `transition-all`. framer-motion drag on gallery. Spring animations well-parameterized. |
| **Browser Support** | 4/4 | Standard CSS. `backdrop-blur`. `aspect-[4/3]`. |
| **Responsive** | 3/4 | `grid-cols-2` works on mobile. `max-w-lg` good. Sheets `max-h-[92dvh]` well-behaved. |
| **Code Quality** | 3/4 | Well-factored (7 sub-components). `CATEGORY_COLORS` data smell. Double animation bug. |

**Total: 16/20 — Good**

---

## 3. animate

**Score: 4/10**

- SHEET_SPRING (360/34) for detail sheet — snappy, correct for sheets ✓
- GALLERY_SPRING (300/30) for photo drag — smooth ✓
- CART_SPRING (380/32) for cart — snappiest for utility drawer
- SUCCESS_SPRING (300/20) — bouncy, appropriate for celebration
- **24× `transition-all` violations** — worst after PublicMasterPage
- **Double scale bug**: `whileTap` + `active:scale` conflict
- **Gallery bug**: `animate.x` + `drag="x"` compete
- **Gallery bug**: drag constraints use 100px instead of container width
- No `prefers-reduced-motion`

---

## 4. overdrive

### Direction A: Photo-First Product Discovery
Full-width vertical scroll of category sections. Each section header is full-bleed photo. Products as horizontal-scroll rows.

### Direction B: Express Checkout with LocalStorage Identity
Save name/phone after first purchase. Pre-fill on return. "Купити знову" button.

### Direction C: Live Social Proof
"Зараз переглядають X людей" counter. Animate stock when simulated purchase occurs. Creates urgency.

---

## 5. polish

### Token Drift

| Location | Value | Impact |
|----------|-------|--------|
| Lines 182-185 | `CATEGORY_COLORS` — 7 hex values | High — duplicates data pattern |
| Lines 28-31 | 4× spring constants | Low |
| Lines 198-199 | Double scale animation | **Bug** |

### Bug Confirmation

**Two functional bugs found by sub-agent (confirmed by reading the code):**

1. **ProductTile double scale** (lines 198-199): `className="... active:scale-[0.95] ..."` + `whileTap={{ scale: 0.95 }}` — framer-motion AND Tailwind both manipulating `transform: scale()` simultaneously.

2. **Gallery drag constraints** (line 297): `dragConstraints={{ left: -(photos.length - 1) * 100, right: 0 }}` — assumes each slide is 100px wide regardless of viewport. On a 360px phone, constraint is wrong. Should use `ref.current.offsetWidth`.

---

## 6. layout

**Score: 9/10 — Best in codebase**

Excellent spacing consistency. All sections use the same `gap-*` scale. `pb-28` pattern for drawer/sheet content is well-calibrated. Clean 2-column grid.

---

## 7. optimize

**Score: 6/10**

| Issue | Impact | Fix |
|-------|--------|-----|
| 24× `transition-all` | Style recalc per interaction | Scope all |
| Drag constraints bug | Gallery broken on real devices | Use container ref |
| Double scale animation | Conflicting CSS + JS animations | Remove `active:scale` |
| `cart.reduce(...)` in render body (lines 56-57) | Recomputes on every render | `useMemo` for cartCount, cartTotal |
| `categories` Set computed every render (line 53) | Recomputes on every render | `useMemo` |

---

## Summary

| Dimension | Score | Rating |
|-----------|-------|--------|
| critique (heuristics) | 24/40 | Acceptable |
| audit (5-dim) | 16/20 | Good |
| animate | 4/10 | Needs work |
| polish | — | 2 bugs + 3 token items |
| layout | 9/10 | **Best in codebase** |
| optimize | 6/10 | Needs work |

### Priority Actions

| Order | Action | Severity | Effort |
|-------|--------|----------|--------|
| 1 | **Fix gallery drag constraints (100px → container width)** | **P0** | 5min |
| 2 | **Fix double scale animation on ProductTile + AddToCart CTA** | **P0** | 2min |
| 3 | **Fix Framer Motion `animate.x` + `drag="x"` competition** | **P0** | 10min |
| 4 | Scope all 24× `transition-all` to specific properties | P1 | 20min |
| 5 | Add empty state for category filter with 0 results | P1 | 5min |
| 6 | `useMemo` for cartCount and cartTotal | P2 | 5min |
| 7 | Move `CATEGORY_COLORS` to CSS custom properties | P2 | 10min |
| 8 | Standardize spring constants (4→2) | P2 | 5min |
