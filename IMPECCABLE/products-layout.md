# Layout Audit: Products + Orders

> **Date:** 2026-05-31 | **Reference:** impeccable/layout.md
> **Register:** Product (predictable grids, consistent densities)

---

## Squint Test

| Check | Verdict | Notes |
|---|---|---|
| Primary action visible? | ✅ | FAB button, tab toggle, editor save button |
| Secondary actions distinguishable? | ⚠️ Partial | Restock/Edit icons same size/color — no visual priority |
| Clear content groupings? | ✅ | Cards clearly separated. Editor 12-col grid (8+4) well-balanced |
| Rhythm through varied spacing? | ⚠️ Partial | Consistent `gap-4`/`gap-6` but `pb-24` on desktop leaves excessive space |

## Spacing System

| Scale | Usage | Notes |
|---|---|---|
| `gap-2` (8px) | Tight groupings | Chips, button groups, inline elements |
| `gap-3` (12px) | Card internals | ProductCard info rows |
| `gap-4` (16px) | Section separation | Product list items, form fields |
| `gap-6` (24px) | Major sections | Between header and list, editor columns |
| `p-4` (16px) | Card padding | ProductCard, OrderCard |
| `p-5` (20px) | Header card padding | ProductsPage header |
| `p-6` (24px) | Section card padding | Editor cards |
| `pb-24` (96px) | Bottom clearance | Mobile nav bar — excessive on desktop |

## Layout Issues

| Sev | Issue | File | Fix |
|---|---|---|---|
| P2 | `pb-24` leaves 96px gap on desktop | ProductsPage.tsx | `pb-24 md:pb-6` |
| P2 | StatChips all `flex-1` — low stock not visually distinct | ProductsPage.tsx:103-105 | `flex-[1.5]` for low-stock chip or different treatment |
| P3 | Order filter bar hides overflow-x — scroll not discoverable | ProductsPage.tsx:189 | Add fade edge gradient or peek chip |
| P3 | ProductEditor photo grid uneven with varying counts | ProductEditor.tsx:334 | CSS Grid `grid-cols-5` instead of flex-wrap |
| P3 | RestockDrawer centered stepper — large gap on wide screens | RestockDrawer.tsx:74 | `max-w-xs mx-auto` on stepper container |

## Bottom Padding Strategy

Current: `pb-24` (96px) on both ProductsPage and ProductEditor — clears mobile nav bar but wastes space on desktop.

Recommendation:
```tsx
// ProductsPage.tsx + ProductEditor.tsx
className="flex flex-col gap-4 pb-24 md:pb-8"
```

## Score: 4/5 — Clean foundation. Bottom padding and stat chip priority are the main gaps.
