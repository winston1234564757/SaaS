# C5: `/my/notifications` — Impeccable Audit (Skill Workflow)

**Route**: `/my/notifications` (client notifications)
**Files**: `ClientNotificationsPage.tsx` (212 lines), `page.tsx` (68 lines)
**Total**: 280 lines
**Register**: Product (client zone)
**Date**: 2026-06-01
**Methodology**: critique (split assessment) → audit → animate → overdrive → polish → layout → optimize

---

## critique — Combined Report

### Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | **2/4** | No loading. No feedback after approve/decline. Read state invisible. |
| 2 | Match System / Real World | 4/4 | Ukrainian labels clear. No metaphor breakage. |
| 3 | User Control and Freedom | 3/4 | No undo on consent actions. Browser back works. |
| 4 | Consistency and Standards | **2/4** | Broadcast dual click targets. No standard nav affordance. |
| 5 | Error Prevention | **2/4** | `parseBroadcastBody` fragile. No error boundary on async. |
| 6 | Recognition Rather Than Recall | **2/4** | Icon→type maps opposite meanings under same icon. |
| 7 | Flexibility and Efficiency | 3/4 | No search, filter, pagination. Acceptable for scope. |
| 8 | Aesthetic and Minimalist Design | 3/4 | Clean bento. Broadcast dual targets add complexity. |
| 9 | Error Recovery | **3/4** | Async approve/decline has zero error handling. Silent failure. |
| 10 | Help and Documentation | 4/4 | Self-explanatory. |
| **Total** | | **24/40** | **Acceptable** |

### Anti-Patterns Verdict

**LLM Assessment (sub-agent)**: MODERATE — 2 P0 issues

| Violation | Line | Severity |
|-----------|------|----------|
| No error handling on approve/decline — silent failure, data loss | 55-67 | **P0** |
| `parseBroadcastBody` fragile format coupling | 41-48 | **P0** |
| Dual click targets on broadcast (row + button) | 165-173, 188-196 | P1 |
| Read/unread opacity 55% vs 80% too subtle | 174 | P1 |
| 14-condition routing duplicate | 170, 174 | P1 |
| `any` types on server data ×2 | page.tsx:42, 56 | P2 |
| Client-side filter instead of DB `neq()` | 152 | P2 |

**Deterministic scan**: `npx impeccable detect` → `[]`

### Overall Impression

**Lowest score in Phase C: 24/40.** The page has real architectural issues: zero error handling on the only async actions (approve/decline consent), a fragile broadcast body parser, and the read/unread state is effectively invisible. The dual click targets on broadcast cards are confusing. Server-side patterns (admin client RLS bypass, marking all read before client sees them) are architectural choices that need documentation. The consent card visual hierarchy is good.

### What's Working

1. **Empty state** (lines 78-86) — Centered layout, muted icon, clear heading. Good first-user experience.
2. **Staggered entry animation** (lines 97, 164) — `delay: i * 0.05` subtle cascade. Fast enough to feel responsive.
3. **Consent card hierarchy** — Cover image → gradient overlay → title → icon + name → action buttons. Each layer has clear weight. `X`/`Check` icons provide semantic affordance.
4. **Section labels** ("Потребує відповіді", "Решта") — Written content creates clear grouping.

### Priority Issues

| ID | P | What | Why | Fix |
|----|---|------|-----|-----|
| C5-I1 | **P0** | No error handling on approve/decline (lines 55-67) | Server action fails → user sees card removed, but nothing happened (data loss) | Add try/catch + toast or revert resolvedIds |
| C5-I2 | **P0** | `parseBroadcastBody` fragile (lines 41-48) | Malformed broadcast shows raw text or missing link. Admin must enforce exact \n+http format | Robust parser or structured broadcast format |
| C5-I3 | **P1** | Dual click targets on broadcast (lines 165-196) | Entire row AND "Перейти" button do same thing with `stopPropagation` hack | One nav path: row navigates, button removed or vice versa |
| C5-I4 | **P1** | Read/unread 55% vs 80% opacity (line 174) | Effectively invisible differentiation | Use distinct background or left border indicator |
| C5-I5 | **P1** | 14-condition routing duplicated (lines 170, 174) | Maintenance nightmare, typo-prone. Violates DRY. | Extract to `isBookingType()` Set lookup |

---

## audit — Technical Quality

| # | Dimension | Score | Key Finding |
|---|-----------|-------|-------------|
| 1 | Accessibility | 3/4 | buttons, aria. Consent card has image without alt text. |
| 2 | Performance | 3/4 | `limit(50)` fine. No images in notifications. |
| 3 | Theming | 3/4 | CSS variables used. 55%/80% opacity distinction invisible. |
| 4 | Responsive | 3/4 | Touch targets ≥44px. Consent card image `h-36` ok on mobile. |
| 5 | Anti-Patterns | **2/4** | Silent async, fragile parser, dual click targets. |
| **Total** | | **14/20** | **Acceptable** |

---

## animate — Motion Analysis

**Score**: 6/10

| Element | Current | Verdict |
|---------|---------|---------|
| Consent card stagger | `delay: i*0.05`, y: 8→0 | Clean. |
| Notification card stagger | `delay: i*0.03`, y: 6→0 | Clean. Faster stagger for denser feed. |
| Missing: exit animations | No AnimatePresence | Cards just vanish. |
| Read/unread animation | None | Missed opportunity to emphasize state change. |

---

## overdrive — Push Limits

```
──────────── ⚡ OVERDRIVE ─────────────
》》》 Entering overdrive mode...
```

### Direction A: Notification Sentiment
Color-code notification types: green for positive (booking confirmed, new review), red for negative (cancelled), amber for neutral (reminders, broadcasts). Visual scan at a glance.

### Direction B: Pull-to-Refresh
Add `PullToRefresh` component (already exists in codebase) for mobile pull-to-refresh notification feed. Currently user must navigate away and back to see new notifications.

### Direction C: Inline Toast for Approve/Decline
When user approves/declines consent, show a brief toast with undo option: "Підтверджено. Скасувати?" with 5s countdown. The current instant-card-removal pattern has no safety net.

---

## polish — Final Quality

### Design System Alignment

| Location | Value | Expected | Status |
|----------|-------|----------|--------|
| Lines 55-67 | No error handling | try/catch + toast | Missing |
| Lines 170, 174 | 14-condition inline | Set lookup | Duplication |
| Line 174 | 55%/80% opacity | ≥3:1 contrast | Invisible |
| page.tsx:13 | Admin client | Documented RLS bypass | Acceptable |

### Copy
All Ukrainian. "Сповіщення", "Поки порожньо", "Потребує відповіді", "Решта", "Відхилити", "Підтвердити". Humanizer: clean.

### Missing States
- Error state on approve/decline failure
- Loading state per action button
- Read/unread visual distinction
- Notification count badge

---

## layout — Spatial Design

**Score**: 7/10

```
┌──────────────────────────────────┐
│ Сповіщення                        │ header
├──────────────────────────────────┤
│ Потребує відповіді                │ section
│ ┌─ Consent Card ───────────────┐ │
│ │ [cover image]                │ │
│ │ [gradient overlay] Title     │ │
│ │ 📷 master_name               │ │
│ │ [Відхилити]  [Підтвердити]   │ │
│ └──────────────────────────────┘ │
├──────────────────────────────────┤
│ Решта                            │ section
│ ┌─ Notification ───────────────┐ │
│ │ [icon] Title                  │ │
│ │         Body text...          │ │
│ │         [Перейти]              │ │
│ │         2 хв тому             │ │
│ └──────────────────────────────┘ │
│ ┌─ Notification ───────────────┐ │
│ │ ...                           │ │
│ └──────────────────────────────┘ │
└──────────────────────────────────┘
```

Clean section separation. Consent card is visually dominant (image + gradient). Notification feed uses consistent card pattern.

---

## optimize — Performance

**Score**: 6/10

- `limit(50)` — reasonable. No pagination.
- `admin` client — full admin-bypass fetch, no RLS overhead
- Server marks all as read — single update query, efficient
- Client-side filter on type — slight render waste, should be server-side
- No heavy animations
- Image component with `sizes="512px"` — proper optimization

---

## Summary — All 7 Commands

| Command | Result |
|---------|--------|
| critique | **24/40** — Acceptable. Lowest C score. 2 P0 (async error handling, broadcast parser) |
| audit | 14/20 — Acceptable. Anti-Patterns 2/4. |
| animate | 6/10 — Clean stagger. No exit animations. |
| overdrive | 3 directions: Color-coded types, Pull-to-refresh, Undo toast |
| polish | 3 drifts: No error handling, invisible read state, dual targets |
| layout | 7/10 — Clean sections. Dense consent card. |
| optimize | 6/10 — Filter waste, no pagination. |

**Priority fix**: Approve/decline error handling → Broadcast parser → Dual click targets → Read state contrast → 14-condition Set extract
