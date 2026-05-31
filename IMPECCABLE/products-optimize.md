# Performance Audit: Products + Orders

> **Date:** 2026-05-31 | **Reference:** impeccable/optimize

---

## Bundle Analysis

| Concern | Status | Notes |
|---|---|---|
| Recharts lazy load? | N/A | Products doesn't use Recharts |
| Framer Motion bundle | ⚠️ Heavy import | All 6 components import `motion` + `AnimatePresence`. Framer Motion is ~30KB gzipped |
| `@hello-pangea/dnd` | ⚠️ Heavy | Drag-and-drop library adds ~15KB. Only used for product reorder (nice-to-have vs cost) |
| `lucide-react` tree-shaking | ✅ | Individual icon imports — tree-shakeable |
| `@tanstack/react-query` | ✅ | Already used, properly scoped |

## Render Performance

| Component | Re-render risk | Notes |
|---|---|---|
| ProductsPage | Medium | `orderFilter` state change re-renders entire product list. `useProducts` hook triggers cascade |
| ProductCard | Low | Memoizable but not wrapped in `React.memo` |
| ProductEditor | High | `setName`, `setPriceStr` on every keystroke re-render entire 556-line tree. No input debounce |
| ProductFormDrawer | Medium | Similar issue — state updates per keystroke, but component is smaller (446 lines) |
| OrderCard | Low | Local state only (`expanded` toggle) |

## Optimization Recommendations

| Sev | Issue | File | Fix |
|---|---|---|---|
| P2 | ProductEditor re-renders entire tree on each keystroke | ProductEditor.tsx | Move input fields into memoized sub-components or use `useDeferredValue` |
| P2 | No `React.memo` on ProductCard | ProductCard.tsx | Wrap in `React.memo` — card content changes infrequently |
| P3 | Framer Motion imported by every component | All 6 files | Consider tree-shaking audit or lazy-load motion components |
| P3 | `@hello-pangea/dnd` cost for reorder-only feature | ProductsPage.tsx | Evaluate: is drag-reorder worth 15KB? Alternative: up/down arrow buttons |

## Loading Performance

| Metric | Status | Notes |
|---|---|---|
| Server components used? | ✅ | Route pages are Server Components |
| Suspense boundaries? | ⚠️ | ProductsPage has skeleton, but no `<Suspense>` wrapper |
| Image optimization? | ✅ | `next/image` with `fill` + proper sizing |
| Font loading? | ✅ | Geist + Cormorant preloaded in root layout |

## Verdict: 7/10 — No critical perf issues. Editor re-render on keystroke is the main concern.
