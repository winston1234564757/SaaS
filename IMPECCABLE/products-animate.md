# Animation Audit: Products + Orders

> **Date:** 2026-05-31 | **Reference:** impeccable/animate.md
> **Register:** Product (motion conveys state, 150-250ms, no page-load choreography)

---

## Current Animation Inventory

| Component | Animation | Type | Duration | Easing | Quality |
|---|---|---|---|---|---|
| ProductsPage tab switch | `AnimatePresence mode="popLayout"` | Layout | 150ms | `duration: 0.15` | ✅ Correct pattern |
| FAB button | Spring pop-in, `whileTap` scale | Entrance + Feedback | 200ms delay | `stiffness:400, damping:22` | ✅ Premium feel |
| ProductCard | `layout`, `initial={{opacity:0,y:8}}` | List entry | Auto | Default spring | ✅ Standard |
| OrderCard expand | `AnimatePresence` + spring height | Expand/Collapse | 200ms | `stiffness:260, damping:28` | ⚠️ No mode |
| RestockDrawer open | Spring slide-up | Sheet entry | ~250ms | `stiffness:380, damping:32` | ✅ Smooth |
| ProductFormDrawer open | Spring slide-up | Sheet entry | ~250ms | `stiffness:380, damping:32` | ✅ Smooth |
| Delete modal | `scale:0.9→1`, `opacity:0→1` | Modal entry | Auto | Default spring | ⚠️ Basic |
| Drag & drop | `@hello-pangea/dnd` | Reorder | Auto | Library default | ✅ Native feel |
| Loading skeleton | `animate-pulse` (CSS) | Loading | 1.5s | CSS pulse | ⚠️ CSS, not Framer |
| active:scale buttons | `active:scale-[0.95]` | Feedback | Per frame | Instant | ✅ Consistent |

---

## Gaps

1. **No success feedback** after save/delete/restock — missing animation opportunity
2. **Delete modal** has no spring — uses default Framer spring instead of a named SPRING constant
3. **3 different spring configs** across 4 components — no shared SPRING constant
4. **Loading skeleton** uses CSS `animate-pulse` instead of Framer Motion
5. **No `prefers-reduced-motion`** check anywhere
6. **ProductCard drag handle** (GripVertical) has no drag-start animation — no lift effect

## Recommendations

1. Add shared `SPRING` constants file:
   ```ts
   export const SPRING = {
     SNAPPY: { type: 'spring' as const, stiffness: 400, damping: 22 },
     GENTLE: { type: 'spring' as const, stiffness: 260, damping: 28 },
     SHEET:  { type: 'spring' as const, stiffness: 380, damping: 32 },
   } as const;
   ```
2. Add success toast with spring entrance + auto-dismiss
3. Replace CSS `animate-pulse` with Framer skeleton for consistency
4. Add lift effect on drag start (`boxShadow + scale(1.02)`)
5. Add `prefers-reduced-motion` media query in globals.css
6. ProductFormDrawer outer AnimatePresence (line 175) should add `mode="popLayout"`

---

## Score: 6/10 — Solid foundation, missing celebration moments and shared constants.
