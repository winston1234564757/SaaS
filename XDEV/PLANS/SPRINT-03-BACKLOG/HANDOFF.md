# Sprint-03 HANDOFF

**Sprint:** Sprint-03 Backlog (16 tasks → 18 iterations)
**Started:** 2026-06-09
**Status:** 1/18 DONE
**Last deploy:** —
**Next task:** T1 — Bookings page bugs (iter 2)

---

## Task Tracker

| Iter | ID | Name | Status | Skill | Vercel |
|------|----|------|--------|-------|--------|
| 1 | T15 | Default theme = Frost (masters + clients) | ✅ DONE | code-reviewer | pending |
| 2 | T1 | Bookings: date off-by-1 + arrows + load% colors + mobile UI | ⬜ TODO | code-reviewer | — |
| 3 | T10 | Clients: important pills overlap text | ⬜ TODO | code-reviewer | — |
| 4 | T4 | Studio billing: block removal + form fix + phone + submit bug | ⬜ TODO | code-reviewer + humanizer | — |
| 5 | T3 | Profile settings: mobile horizontal scroll | ⬜ TODO | code-reviewer | — |
| 6 | T2 | Dashboard: mobile stats + PC peak hours + referral text | ⬜ TODO | impeccable + humanizer | — |
| 7 | T5 | Story constructor: animated arrow scroll hint (mobile) | ⬜ TODO | impeccable | — |
| 8 | T8 | Navbar: profile rightmost + FAB + notifs to system | ⬜ TODO | design-taste-frontend + impeccable | — |
| 9 | T6c | Analytics desktop: date nav redesign + section slider | ⬜ TODO | design-taste-frontend + impeccable | — |
| 10 | T6a | Desktop layout: billing + reviews + growth | ⬜ TODO | design-taste-frontend | — |
| 11 | T6b | Desktop layout: revenue + marketing + products + services | ⬜ TODO | design-taste-frontend | — |
| 12 | T7 | Profile settings desktop: empty space + schedule animation | ⬜ TODO | impeccable | — |
| 13 | T9 | Portfolio → story constructor pre-selected work | ⬜ TODO | code-reviewer | — |
| 14 | T12 | Loyalty: two DB codes (C2C+C2B) + bidirectional bonus + invite pages | ⬜ TODO | code-reviewer + create-migration | — |
| 15 | T13 | Onboarding schedule: Configure + Continue buttons | ⬜ TODO | impeccable | — |
| 16 | T14 | Onboarding preview: link block more prominent | ⬜ TODO | impeccable | — |
| 17 | T11 | Flash actions: full audit + notification test | ⬜ TODO | code-reviewer + react-doctor | — |
| 18 | T16 | Tour: spotlight/highlight elements | ⬜ TODO | design-taste-frontend + emil-design-eng | — |

---

## T1 — Bookings Page Bugs (next)

**Files:**
- `src/components/master/bookings/BookingsPage.tsx`
- `src/components/master/bookings/PeriodAnalyticsView.tsx` (load % colors at ~line 87)

**5 sub-issues:**
1. Date off-by-1: `.split('T')[0]` timezone bug in navigate() ~line 166 — use UTC
2. Day mode arrows: jumps 2 days / can't go forward — setDate() month boundary bug
3. Load % colors inverted: >80=red, 50-80=orange, <50=green. Fix: high% = green (busy=good), low% = red, ~50% = blue
4. Mobile day cards: remove border or standardize to project style
5. Mobile control panel: remove white background + search icon from view/range panel

---

## T15 — Done Notes

**What was changed:**
- `DashboardLayout.tsx` ThemeApplier: `?? ''` → `?? 'frost'` (Pro/Studio fallback)
- `DashboardView.tsx`: `?? 'default'` → `?? 'frost'` (Layout selection fallback)
- `my/layout.tsx` outer div: added `data-theme="frost"` (client area)

**Why:** `register/actions.ts` already sets `mood_theme:'frost'` at registration. These fixes cover existing accounts + edge cases where mood_theme is NULL.

---

## Context for Next Session

Sprint-03 started 2026-06-09. Workflow: one task → code → tsc → build → vercel --prod → user QA → next task. Read this file first to know where we are.

Key architecture notes:
- Theme applied via `data-theme` attribute on `<html>` (ThemeApplier in DashboardLayout)
- Starter tier always gets Frost (locked in ThemeApplier)
- Pro/Studio get their stored `mood_theme` or Frost fallback
- Client area (/my/) now also gets Frost via `data-theme="frost"` on layout wrapper
