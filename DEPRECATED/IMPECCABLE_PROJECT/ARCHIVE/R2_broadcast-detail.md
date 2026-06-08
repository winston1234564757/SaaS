# R2: `/dashboard/broadcast/[id]` — Impeccable Audit (Skill Workflow)

**Route**: `/dashboard/broadcast/[id]`
**File**: `src/components/master/marketing/BroadcastDetailPage.tsx` (123 lines)
**Date**: 2026-06-01
**Methodology**: impeccable critique (split assessment) → audit → animate → overdrive → polish → layout → optimize

---

## 1. critique (Split Assessment)

### Assessment A: LLM Design Review (sub-agent)

**AI Slop Verdict**: HIGH confidence — unmistakably AI-generated

| # | Pattern | Lines | Severity |
|---|---------|-------|----------|
| 1 | `transition-all` + `transition-colors` on same element (duplicate, LLM merge artifact) | 25 | High |
| 2 | 6 inline hex values (`#789A99`, `#5C9E7A`, `#4A9BE0`, `#D4935A`, `#E8D5CC`, `#C05B5B`, `#2C1A14`) | 39-42, 100, 119 | High |
| 3 | Generic empty state "Немає даних про доставку" — no illustration, no CTA | 55-57 | Medium |
| 4 | No error state — destructures only `data, isLoading`, `error` ignored | 14 | **Critical** |
| 5 | Generic spinner + "Завантаження..." — no skeleton | 47-51 | Low |
| 6 | Same Bell icon for In-app and Push (different colors only) | 39-40 | Medium |
| 7 | Missing `prefers-reduced-motion` on loader + button | 49, 25 | Medium |

**Heuristic Score**: 17/40 — Poor

| H | Score | Key Evidence |
|---|-------|-------------|
| 1. Visibility | 2 | Loading spinner exists. **No error state at all** |
| 2. Match | 3 | Natural Ukrainian, clear channel names |
| 3. Control | 3 | Back button present |
| 4. Consistency | 2 | 6 inline hex colors bypassing theme; duplicate transitions |
| 5. Prevention | 1 | No guardrails. Silent failure on fetch error = blank page |
| 6. Recognition | 2 | Color↔channel mapping demands memory; dots lack visible labels |
| 7. Efficiency | 1 | No search, sort, or filter on client list |
| 8. Aesthetic | 3 | Clean layout but fixed footer splits attention |
| 9. Recovery | 0 | **Zero error handling** — network failure shows nothing |
| 10. Help | 0 | No context, no help, no explanations |

**Cognitive Load**: 5/8 FAIL — HIGH (critical)
- **FAIL**: Grouping (all clients flat, no sections)
- **FAIL**: Working memory (4 color↔channel mappings must be remembered)
- **FAIL**: Progressive disclosure (no drill-down per client)
- PASS: Single focus, Chunking, Visual hierarchy, Minimal choices

### Assessment B: Automated Detection (npx impeccable detect --json --gpt)

```json
[]
```
No anti-patterns detected by the CLI scanner.

### Combined Impact Matrix

| ID | Issue | P | Fix |
|----|-------|---|-----|
| R2-I1 | **No error state** — `error` from hook not destructured, network failure = blank page | **P0** | Destructure `error`, render error banner with retry CTA |
| R2-I2 | 6 inline hex colors bypass theme system | P1 | Map to CSS custom properties |
| R2-I3 | Duplicate `transition-all` + `transition-colors` on same element | P1 | Remove `transition-all`, keep `transition-colors` |
| R2-I4 | Same Bell icon for In-app and Push (confusing) | P1 | Use distinct icons |
| R2-I5 | Channel dots (`<div>`) lack ARIA labels | P1 | Add `aria-label={ok ? 'Доставлено' : 'Не доставлено'}` |
| R2-I6 | Empty state is dead end — no retry/refresh | P2 | Add retry suggestion |
| R2-I7 | No sort/filter/group on client list | P2 | Add filter tabs (All/Delivered/Partial/None) |

---

## 2. audit

| Dimension | Score (0-4) | Notes |
|-----------|-------------|-------|
| **Accessibility** | 2/4 | Buttons have `type="button"` ✓. Channel dots are `<div>` with no ARIA. Same icon for different meanings. Color-only channel identification. |
| **Performance** | 3/4 | Lightweight (123 lines). `.filter()` calls recompute on every render. No virtualization needed. |
| **Browser Support** | 4/4 | Simple layout, standard CSS. Fixed positioning with standard bottom bar. |
| **Responsive** | 3/4 | Single column works on all sizes. Fixed footer may overlap on devices with home indicator. |
| **Code Quality** | 2/4 | 7 inline hex colors. 3 sub-components with duplicated styling. Duplicate transition class. No error boundaries. |

**Total: 14/20 — Needs work**

---

## 3. animate

**Score: 4/10**

- Back button: `transition-colors active:scale-95 transition-all` — **duplicate, conflicting** (Bug)
- No entry animation for list items
- No `prefers-reduced-motion`
- Loader uses `animate-spin` correctly but no reduced-motion fallback

---

## 4. overdrive

### Direction A: Heatmap Delivery Matrix
Clients as rows, channels as columns. Color-intensity cells (green=delivered, amber=pending, red=failed). Sorted by success rate.

### Direction B: Timeline Per-Client View
Expandable rows showing chronological delivery attempts. Failed channels get inline retry button.

### Direction C: Broadcast Performance Dashboard
Aggregated stats at top: reach rate, channel breakdown. Searchable client list with badges. Export CSV.

---

## 5. polish

### Token Drift — 7 inline hex values (P1)

| Location | Value | Expected Token |
|----------|-------|----------------|
| Lines 39, 69 | `#789A99` | `--color-channel-app` |
| Lines 40, 70 | `#5C9E7A` | `--color-channel-push` |
| Lines 41, 71 | `#4A9BE0` | `--color-channel-telegram` |
| Lines 42, 72 | `#D4935A` | `--color-channel-sms` |
| Line 100 | `#E8D5CC` | `--color-channel-failed` |
| Lines 119 | `#C05B5B`, `#2C1A14` | `--color-dim-text`, `--color-foreground` |

---

## 6. layout

**Score: 7/10**. Clean single-column readout. Fixed footer is the strongest element. Same icon for app/push is the biggest visual issue. Good rhythm.

---

## 7. optimize

**Score: 5/10**

| Issue | Impact | Fix |
|-------|--------|-----|
| `.filter()` calls in JSX (lines 84-87) | 4× full array scan per render | `useMemo` for each metric |
| No `React.memo` on sub-components | ChannelDot, SummaryCell re-render on every parent render | Wrap in `React.memo` |
| `broadcasts?.find(...)` on every render | Linear search per render | Pass broadcast data as prop or memoize |

---

## Summary

| Dimension | Score | Rating |
|-----------|-------|--------|
| critique (heuristics) | 17/40 | **Poor** |
| audit (5-dim) | 14/20 | Needs work |
| animate | 4/10 | Needs work |
| polish | — | 7 token drifts (P1) |
| layout | 7/10 | Good |
| optimize | 5/10 | Needs work |

### Priority Actions

| Order | Action | Severity | Effort |
|-------|--------|----------|--------|
| 1 | **Add error state for failed query (P0)** | **P0** | 10min |
| 2 | Replace 7 inline hex colors with CSS custom properties | P1 | 15min |
| 3 | Fix duplicate Bell icon — use distinct icon for in-app vs push | P1 | 5min |
| 4 | Add ARIA labels to ChannelDot component | P1 | 10min |
| 5 | Fix duplicate `transition-all transition-colors` on back button | P1 | 2min |
| 6 | Add next-step suggestion to empty state | P2 | 5min |
