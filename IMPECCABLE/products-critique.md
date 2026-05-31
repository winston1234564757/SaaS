# Critique: Products + Orders (Shop Module)

> **Date:** 2026-05-31 | **Files:** 11 total
> **Assessments:** A (LLM Design Review) ✅ | B (Automated Detection — npx impeccable detect) ✅ — 0 findings, clean

---

## Design Health Score: 28/40

| # | Heuristic | Score | Key Issue |
|---|---|---|---|
| 1 | Visibility of System Status | 3 | Loading/saving shown, but zero success feedback after save/delete/restock |
| 2 | Match System / Real World | 4 | Ukrainian labels, familiar retail metaphors |
| 3 | User Control and Freedom | 3 | Back button, cancel in delete, but no undo after save/restock |
| 4 | Consistency and Standards | 3 | Consistent cards/colors, but dual editors have UI drift |
| 5 | Error Prevention | 3 | Client validation catches bad input, but no phone format validation |
| 6 | Recognition Rather Than Recall | 3 | Icons + labels mostly, but restock icon is unlabeled |
| 7 | Flexibility and Efficiency | 2 | Drag-to-reorder, but no search, no bulk, no keyboard shortcuts |
| 8 | Aesthetic and Minimalist Design | 3 | Clean layout, but typographic overload (9px-20px, 8 sizes) |
| 9 | Error Recovery | 3 | Inline errors in Ukrainian, but no toast, no retry action |
| 10 | Help and Documentation | 1 | No tooltips, no onboarding, no contextual help |

**Anti-Patterns Verdict:** MODERATE (3/7 flags). Glassmorphism on `.bento-card`/`.widget-card` is the strongest AI slop signal. The product-icon system and three-theme architecture differentiate it. The dual-editor drift is the top real-world problem, not AI slop.

---

## What's Working
- **Drag-and-drop reorder** with `@hello-pangea/dnd` — power-user feature rarely seen in beauty SaaS
- **Two distinct empty states** (products + orders) with contextual CTA
- **Delete confirmation modal** with backdrop blur and clear copy

## Priority Issues

| Sev | Issue | File | Fix |
|---|---|---|---|
| P1 | Dual editors with feature drift | ProductEditor vs ProductFormDrawer | Unify into shared form component |
| P1 | Zero success feedback after actions | Editor, RestockDrawer | Add toast system after save/delete/restock |
| P2 | Restock action hidden + tiny | ProductCard | Add label or move to card expansion |
| P2 | No product search/filter | ProductsPage | Add search input + category filter chips |
| P3 | Typographic fragmentation (9-20px) | Multiple | Consolidate to 4-step scale |

## Persona Red Flags

**Sasha (Solo Master, mobile-first):** Restock button is 32px — fails 44px touch target. Micro-text at 9-10px illegible on phone. No search — scrolls through 30 products.

**Olena (Boutique Owner, desktop power user):** No keyboard shortcuts. No bulk edit. No CSV export for inventory. Forced to manually tap each product to edit stock.

---

## Combined: 28/40 Heuristics. 0 P0, 2 P1, 2 P2, 1 P3.
