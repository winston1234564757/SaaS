# P8: `/invite/[code]` — Impeccable Audit (Skill Workflow)

**Route**: `/invite/[code]` (referral landing)
**Files**: `page.tsx` (155 lines) — server component only
**Total**: 155 lines
**Register**: Brand (public — referral)
**Date**: 2026-06-01
**Methodology**: critique (split assessment) → audit → animate → overdrive → polish → layout → optimize

---

## critique — Combined Report

### Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3/4 | No loading (SC expected). No error state for invalid code. |
| 2 | Match System / Real World | 4/4 | Clean Ukrainian copy |
| 3 | User Control and Freedom | 3/4 | CTA + login link exit |
| 4 | Consistency and Standards | **1/4** | 7× `as any` casts. `bg-white/60` breaks dark mode. |
| 5 | Error Prevention | **2/4** | Type unsafety → schema change = silent runtime crash |
| 6 | Recognition Rather Than Recall | 4/4 | Clear inviter info + benefits |
| 7 | Flexibility and Efficiency | 4/4 | Simple linear flow |
| 8 | Aesthetic and Minimalist Design | 3/4 | Clean bento. Inviter name + bio + city + benefits. |
| 9 | Error Recovery | **2/4** | Invalid code → anonymous invite, no error message |
| 10 | Help and Documentation | 4/4 | N/A |
| **Total** | | **30/40** | **Good** |

### Anti-Patterns Verdict

**LLM Assessment**: MODERATE — 1 P0

| Violation | Line | Severity |
|-----------|------|----------|
| `bg-white/60` on benefit items — breaks dark mode | 120 | **P0** |
| `as any` ×7 systematic type escape | 47, 67-70, 136, 138 | P1 |
| Avatar emoji no `aria-label` | 87-92 | P1 |
| Hard-coded `rgba(255,210,194,0.55)` | 89 | P2 |
| 3 sequential Supabase queries | 15-40 | P2 |
| No error state for invalid code | render | P2 |

**Deterministic scan**: `[]`

### Overall Impression

Clean server component with a real dark mode blocker (`bg-white/60`). The 3-query sequential lookup is inefficient. Seven `as any` casts systematically disable type safety. The fallback chain (slug → master code → client code) is well-designed, but invalid codes silently render an anonymous invite instead of an error state.

### What's Working

1. **Clean server component** — no `useEffect`, no client state, straight to DB.
2. **Fallback chain** — 3 lookups cover slug, master code, client code. Anonymous fallback avoids 404.
3. **Minimal UI** — bento card, 3 benefits, single CTA. `BENEFITS` constant with lucide icons.

### Priority Issues

| ID | P | What | Why | Fix |
|----|---|------|-----|-----|
| P8-I1 | **P0** | `bg-white/60` on benefits (line 120) | Visible white box in dark mode | `bg-muted/60` or `bg-card/60` |
| P8-I2 | **P1** | 7× `as any` casts | Schema change → silent runtime error | Typed union return from `getInviter` |
| P8-I3 | **P1** | Avatar emoji no `aria-label` | Screen reader gets unlabeled emoji | `aria-label` or `role="img"` |
| P8-I4 | **P2** | 3 sequential Supabase queries | 3 round-trips per page load | Single RPC or `or()` filter |
| P8-I5 | **P2** | Hard-coded `rgba(255,210,194,0.55)` | Not theme-aware | `bg-primary/10` |
| P8-I6 | **P2** | Invalid code → anonymous invite, no error | Ambiguous: user thinks link is broken | Show "Запрошення не знайдено" |

---

## audit — Technical Quality

| # | Dimension | Score | Key Finding |
|---|-----------|-------|-------------|
| 1 | Accessibility | **2/4** | Emoji avatar no label. Otherwise semantic. |
| 2 | Performance | 3/4 | 3 sequential queries — should be parallel or batched |
| 3 | Theming | **2/4** | `bg-white/60` breaks dark mode. Hard-coded rgba. |
| 4 | Responsive | 4/4 | `max-w-sm`, centered. Mobile-first. |
| 5 | Anti-Patterns | **2/4** | 7× `as any`, 3 sequential queries, no error state |
| **Total** | | **13/20** | **Acceptable** |

---

## animate — Motion Analysis

**Score**: N/A (Server Component — no client-side animation)

---

## overdrive — Push Limits

### Direction A: Realtime Inviter Preview
Show the inviter's actual portfolio photos or studio gallery inside the invite card. Makes the referral feel personal and visual.

### Direction B: Optimized RPC Lookup
Replace 3 sequential queries with a single Postgres RPC that returns the first match. Reduces page load latency by 3×.

---

## polish — Final Quality

| Location | Value | Expected | Status |
|----------|-------|----------|--------|
| Line 120 | `bg-white/60` | `bg-muted/60` | **P0 dark mode** |
| Line 89 | `rgba(255,210,194,0.55)` | `bg-primary/10` | No token |
| Lines 47,67-70,136,138 | `as any` ×7 | Typed union | Type disabled |

### Copy
"X запрошує тебе!", "Зареєструватися безкоштовно", "Вже є акаунт? Увійти". Clean.

---

## layout — Spatial Design

**Score**: 8/10

```
┌──────────────────────────────────┐
│     Bookit.                      │ logo
│                                  │
│    ┌──── bento-card ──────────┐  │
│    │    [emoji avatar]        │  │
│    │  Name запрошує тебе!     │  │
│    │  bio text (line-clamp-3) │  │
│    │  city                    │  │
│    │                          │  │
│    │  ✨ Онлайн-запис 24/7    │  │
│    │  ✓ Нагадування           │  │
│    │  💎 Програма лояльності  │  │
│    │                          │  │
│    │  [Зареєструватися →]     │  │
│    │  Переглянути сторінку →  │  │
│    └──────────────────────────┘  │
│                                  │
│   Вже є акаунт? Увійти          │
└──────────────────────────────────┘
```

Clean centered layout. BlobBackground underneath. Benefits listed in clean vertical stack.

---

## optimize — Performance

**Score**: 6/10

- 3 sequential Supabase queries — main bottleneck
- Server component (SSR) — fast initial paint
- No client JS weight
- Images: none

---

## Summary — All 7 Commands

| Command | Result |
|---------|--------|
| critique | 30/40 — Good. 1 P0 (bg-white/60 dark mode) |
| audit | 13/20 — Acceptable. Theming 2/4, A11y 2/4. |
| animate | N/A — Server component |
| overdrive | 2 directions: Portfolio preview, RPC optimization |
| polish | 1 P0 drift (bg-white/60) + 6 drifts (as any, rgba) |
| layout | 8/10 — Clean bento card |
| optimize | 6/10 — 3 sequential queries |
