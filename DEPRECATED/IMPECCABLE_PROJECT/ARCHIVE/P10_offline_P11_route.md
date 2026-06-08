# P10: `/offline` — Impeccable Audit (Skill Workflow)

**Route**: `/offline` (PWA offline fallback)
**Files**: `page.tsx` (21 lines)
**Total**: 21 lines
**Register**: Product (public — PWA)
**Date**: 2026-06-01
**Methodology**: critique → audit → animate → overdrive → polish → layout → optimize

---

## critique

**Score**: 36/40 — Excellent. Clean simple page.

### Issues

| ID | P | What | Fix |
|----|---|------|-----|
| P10-I1 | **P1** | 📵 emoji (no mobile phones sign) instead of connectivity icon | Replace with `WifiOff` from lucide-react |
| P10-I2 | **P2** | Missing `role="status"` for screen reader announcement | Add `role="status"` |

### What's Working

- `button type="button"` + `aria-label` — correct a11y
- `min-h-dvh` — respects dynamic viewport
- Concise 21 lines

---

## audit — 18/20

All tokens used. Button properly labeled. Only issue: wrong emoji.

## animate — N/A (no motion)

## overdrive — Direction: Animated reconnection check
Auto-retry with exponential backoff using `navigator.onLine` event listener. Show "З'єднання відновлено!" when back online.

## polish — 1 drift (wrong emoji)

## layout — 8/10

Clean centered layout with icon + text + CTA.

## optimize — 10/10

Zero dependencies. No images. Minimal DOM.

---

# P11: `/r/[code]` — Impeccable Audit (Skill Workflow)

**Route**: `/r/[code]` (short link redirect)
**Files**: `route.ts` (41 lines)
**Total**: 41 lines
**Register**: Product (public — utility)
**Date**: 2026-06-01

---

## critique

**Score**: 24/40 — Acceptable. Race condition in 41-line route handler.

### Issues

| ID | P | What | Why | Fix |
|----|---|------|-----|-----|
| P11-I1 | **P1** | Race condition: `clicks: link.clicks + 1` | Read-modify-write loses concurrent clicks | Use RPC `increment_click` or `clicks: supabase.raw('clicks + 1')` |
| P11-I2 | **P1** | Blanket `catch` swallows all errors | DB outage → silent redirect to `/` | Check error code for `42P01` (undefined_table) |
| P11-I3 | **P2** | `process.env.NEXT_PUBLIC_SITE_URL!` non-null | Missing env → `TypeError: Invalid URL` crash | Add `|| 'http://localhost:3000'` |
| P11-I4 | **P3** | `as LinkRow` type assertion | Lazy typing | Use `.returns<LinkRow>()` |

### What's Working

- `.is('clicked_at', null)` guard — correct idempotency for recipient tracking
- `Promise.all` for parallel independent updates — correct
- `createAdminClient()` RLS bypass is intentional
- Empty redirect to `/` as fallback — reasonable user-facing outcome

---

## audit — 12/20

| Dimension | Score | Key Finding |
|-----------|-------|-------------|
| Correctness | **2/4** | Race condition on click counter |
| Security | 3/4 | Parameterized query OK |
| Robustness | **2/4** | Blanket catch, missing env fallback |
| Anti-Patterns | **2/4** | 4 classic LLM slop in 41 lines |

## animate — N/A (Route handler, no UI)

## overdrive — Direction: Atomic click tracking
Replace read-modify-write with `admin.rpc('increment_broadcast_click', { p_link_id, p_recipient_id })` — single atomic DB operation.

## polish — 3 drifts (race condition, blanket catch, missing env fallback)

## layout — N/A (no UI)

## optimize — 6/10

- 2 DB queries + 2 updates — acceptable
- Race condition is correctness issue, not performance

---

## Combined Summary

| Cmd | P10 (/offline) | P11 (/r/[code]) |
|-----|----------------|------------------|
| critique | **36/40** Excellent | **24/40** Acceptable |
| audit | 18/20 | 12/20 |
| animate | N/A | N/A |
| overdrive | Reconnection check | Atomic RPC |
| polish | 1 drift | 3 drifts |
| layout | 8/10 | N/A |
| optimize | 10/10 | 6/10 |
