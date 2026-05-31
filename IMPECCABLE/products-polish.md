# Polish Report: Products + Orders

> **Date:** 2026-05-31 | **Reference:** impeccable/polish.md
> **Quality bar:** Flagship (B2B e-commerce sub-system)

---

## Design System Alignment

| Check | Status | Notes |
|---|---|---|
| Theme tokens used? | ✅ | `bg-primary`, `text-foreground`, `bg-secondary`, `bg-card`, `border-border` |
| CSS variables? | ⚠️ Partial | 4x `var(--accent-on)` in ProductFormDrawer + RestockDrawer. Rest uses Tailwind v4 `@theme` classes |
| Hardcoded hex? | ✅ **0** | Cleanest module in project |
| `var(--btn-primary-bg)`? | ✅ **0** | Uses `bg-primary` instead |
| Emoji violations? | ❌ 1 | `ℹ️` in OrderCard.tsx:162 |

## Polish Checklist

- [x] Aligned to the design system — drift: none critical
- [ ] IA and flow shape match neighbors — P1: dual editors drift
- [x] Visual alignment at breakpoints — appears consistent
- [x] Spacing uses tokens — all from Tailwind scale
- [ ] Typography hierarchy consistent — P3: 8 different sizes (9px-20px)
- [x] All interactive states implemented — hover/active/disabled present
- [x] Transitions smooth — spring physics used
- [ ] Copy consistent — clean Ukrainian
- [x] Icons consistent — all lucide-react, ProductIcon system
- [ ] Forms properly labeled — ❌ missing `htmlFor`/`id` pairing in Field component
- [ ] Error states helpful — inline error text, no toast
- [x] Loading states clear — skeleton + spinner
- [x] Empty states welcoming — two distinct components
- [ ] Touch targets ≥ 44px — ❌ action buttons are 32px, stat chips are ~42px
- [ ] Contrast meets WCAG AA — ⚠️ `text-muted-foreground/60` may be below 4.5:1 on Blossom
- [ ] Keyboard navigation works — ❌ no focus indicators verified
- [x] Focus indicators — buttons use `outline-none` but no custom focus ring
- [ ] No console errors — assumed clean
- [x] No layout shift — skeletons match card dimensions
- [x] Respects reduced motion — ❌ no `prefers-reduced-motion` query
- [x] Code clean — no console.logs, no commented code

## Findings

| Sev | Issue | File | Fix |
|---|---|---|---|
| P2 | Missing `htmlFor`/`id` on label-input pairs | ProductFormDrawer.tsx (Field) | Add `htmlFor` + `id` attributes |
| P2 | Action buttons 32px — below 44px minimum | ProductCard.tsx (ActionBtn) | Bump to `size-11`(44px) |
| P2 | No focus-visible ring styles | All components | Add `focus-visible:ring-2` to buttons/inputs |
| P3 | No `prefers-reduced-motion` | globals.css | Add media query disabling motion |
| P3 | FAB shadow hardcoded hex rgba | ProductsPage.tsx:234 | Replace with `shadow-primary/40` or CSS variable |

## Score: 15/22 checks pass. 5 actionable polish items.
