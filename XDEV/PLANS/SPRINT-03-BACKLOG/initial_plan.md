# Sprint-03 Backlog Plan — 16 Tasks

## Context
New backlog with 16 tasks covering bugs, UX fixes, desktop layout adaptation, and feature polish.
Workflow: **one task = one iteration → `vercel --prod` → user QA → next task**.
This plan also defines the HANDOFF structure for new sessions.

---

## Priority Groups

### Group A — Critical Bugs & Quick Wins (do first)
| # | Task | Skill | Est. | Key Files |
|---|------|-------|------|-----------|
| T15 | Default theme = Frost for all new users | `code-reviewer` | XS | `src/components/shared/ThemeProvider.tsx` or `master_profiles` default |
| T1 | Bookings: date off-by-1 + arrow bugs + load% colors + mobile UI | `code-reviewer` | M | `BookingsPage.tsx`, `PeriodAnalyticsView.tsx` |
| T10 | Clients: important pills overlapping text | `code-reviewer` | XS | `ClientWidgets.tsx`, `ClientGridCard.tsx` |
| T4 | Studio billing: remove block + fix button + phone from profile + submit bug | `code-reviewer` + `humanizer` | M | `BillingPage.tsx`, `billing/actions.ts` |

### Group B — Mobile UX
| # | Task | Skill | Est. | Key Files |
|---|------|-------|------|-----------|
| T3 | Profile settings: horizontal scroll on mobile | `code-reviewer` | XS | Profile settings component |
| T2 | Dashboard mobile stats layout + PC peak hours font + referral text | `impeccable` + `humanizer` | S | `TodaySchedule.tsx`, `PeakHoursWidget.tsx`, `ReferralBoostWidget.tsx` |
| T5 | Story constructor: animated arrow on first interaction (mobile) | `impeccable` | S | `StoryGenerator.tsx` (showScrollHint already exists — verify/polish) |
| T8 | Navbar: profile rightmost + notifs to system + FAB support button | `design-taste-frontend` + `impeccable` | M | `BottomNav.tsx`, `NotificationsBell.tsx` |

### Group C — Desktop Layouts
| # | Task | Skill | Est. | Key Files |
|---|------|-------|------|-----------|
| T6c | **ПЕРША** — Analytics: date nav redesign + section slider (30% visible) | `design-taste-frontend` + `impeccable` | L | `AnalyticsPage.tsx`, `PeriodControls.tsx` |
| T6a | Desktop top header: billing, reviews, growth | `design-taste-frontend` | M | `DashboardTopBar.tsx`, page components |
| T6b | Desktop top header: revenue, marketing, products, services | `design-taste-frontend` | M | Page components |
| T7 | Profile settings desktop: empty space + schedule expand animation | `impeccable` | S | Settings profile page component |

### Group D — Features
| # | Task | Skill | Est. | Key Files |
|---|------|-------|------|-----------|
| T9 | Portfolio → story constructor with pre-selected work type + item | `code-reviewer` | S | Portfolio component, `StoryGenerator.tsx` |
| T12 | /my/loyalty: two DB codes + bidirectional C2B bonus + unique invite pages | `code-reviewer` + `create-migration` | L | `my/loyalty/page.tsx`, `invite/[code]/page.tsx`, `referrals.ts` |
| T13 | Onboarding schedule: add Configure + Continue buttons on initial state | `impeccable` | S | `StepSchedule.tsx` |
| T14 | Onboarding preview: make link editing block more prominent | `impeccable` | S | `StepPreview.tsx` |
| T11 | Flash actions: full audit + notification test | `code-reviewer` + `react-doctor` | L | `flash/actions.ts`, `FlashDeals` component |
| T16 | Tour: spotlight/highlight elements properly | `design-taste-frontend` + `emil-design-eng` | L | `DashboardTourContext.tsx`, `DashboardTourBanner.tsx` |

> **T6 is split into T6a / T6b / T6c** — 3 iterations (7 pages total is too large for one deploy)

---

## Per-Task Detail

### T15 — Default Theme = Frost
**What:** Every new master and client should default to Frost theme.
**Where to look:** How theme is assigned at registration/first login. Check `master_profiles` default value for theme column. May be a DB default or code-level assignment.
**Skill:** `code-reviewer`
**Size:** XS — likely a 1-line DB default change + `create-migration`

---

### T1 — Bookings Page Bugs
**What (5 sub-issues):**
1. **Date off-by-1** — clicking June 10 shows June 9. Root cause: `.split('T')[0]` on ISO string uses local timezone. Fix: use UTC date formatting throughout `BookingsPage.tsx` navigate() ~line 166.
2. **Arrow navigation in day mode** — jumps 2 days back / doesn't go forward. Fix: validate month boundaries after `setDate()`.
3. **Load % colors inverted** — `PeriodAnalyticsView.tsx` ~line 87: >80=red, 50-80=orange, <50=green. Should be: high% = green (busy = good), low% = red (empty = bad), ~50% = blue.
4. **Mobile day cards** — remove border or standardize to project card style.
5. **Mobile control panel** — remove white background and search icon from view/range panel.
**Skill:** `code-reviewer`
**Files:** `BookingsPage.tsx`, `PeriodAnalyticsView.tsx`

---

### T10 — Clients Pills Overflow
**What:** "Important" client filter pills/sliders overlapping text on Clients page.
**Skill:** `code-reviewer`
**Files:** `ClientWidgets.tsx`, `ClientGridCard.tsx`

---

### T4 — Studio Billing Page
**What (4 sub-issues):**
1. Remove "Коли вигідніше" comparison block (lines 393-412 in BillingPage.tsx)
2. Change button text → humanizer: describe co-creation "моїми руками"
3. Phone field: bind from master profile (not TG/email) — add phone to beta form
4. Fix `submitBetaRequest()` server action bug — currently only spins, never saves
**Skill:** `code-reviewer` + `humanizer`
**Files:** `BillingPage.tsx`, `billing/actions.ts`

---

### T3 — Profile Settings Mobile Scroll
**What:** Horizontal overflow caused by styling/theme block on mobile.
**Skill:** `code-reviewer`
**Note:** Need to find profile settings component path first (not explored yet).

---

### T2 — Dashboard Fixes
**What (3 sub-issues):**
1. Mobile stats/bookings block in statistics mode — fonts too large, overlap. Fix layout in `TodaySchedule.tsx`.
2. PC peak hours block — increase font size for hour/day labels. Fix in `PeakHoursWidget.tsx` (frost path).
3. Referral block text → humanizer: emphasize "можна заробити на повну оплату Pro тарифу"
**Skill:** `impeccable` + `humanizer`
**Files:** `TodaySchedule.tsx`, `PeakHoursWidget.tsx`, `ReferralBoostWidget.tsx`

---

### T5 — Story Constructor Arrow
**What:** `showScrollHint` with `ChevronDown` already exists in `StoryGenerator.tsx` — fires after 4s on first interaction. User says preview isn't on screen on mobile. Verify the animation is visible and animated (not static icon). Polish if needed.
**Skill:** `impeccable`
**File:** `StoryGenerator.tsx`

---

### T8 — Navbar Restructure (Mobile)
**What (3 sub-issues):**
1. Profile/settings → rightmost nav item. NOTE: the middle button is "Твій кабінет" (opens personal cabinet), NOT "Ще". Don't confuse these.
2. Notifications → move to "system" section in expanded drawer; show sticky badge near FAB when there are unread
3. FAB button: fixed above navbar center — "Центр підтримки BookIT" (quick contact + reviews)
**Skill:** `design-taste-frontend` + `impeccable`
**Files:** `BottomNav.tsx`, `NotificationsBell.tsx`, `DashboardLayout.tsx`

---

### T6c — Analytics Desktop: date nav + section slider ⭐ ПЕРША В GROUP C
**What:**
1. Date navigation redesign (current pills/controls are bad UX on desktop)
2. Section tabs → large horizontal slider (30% of next section visible, like clothing marketplace)
**Skill:** `design-taste-frontend` + `impeccable`
**Files:** `AnalyticsPage.tsx`, `PeriodControls.tsx`

---

### T6a — Desktop Layout: billing + reviews + growth
**What:** Top header elements (search, filters, date pickers) need desktop-optimized layout. Resize, reposition for best CRM UX on each page.
**Skill:** `design-taste-frontend`

---

### T6b — Desktop Layout: revenue + marketing + products + services
**What:** Same pattern as T6a for remaining pages.
**Skill:** `design-taste-frontend`

---

### T7 — Profile Settings Desktop
**What:** Too much empty space between blocks + schedule expand makes adjacent blocks jump unnaturally.
**Skill:** `impeccable`

---

### T9 — Portfolio → Story Constructor Link
**What:** "Сторіс" button on portfolio page should navigate to story constructor with:
- Pre-selected type = "робота" (work)
- First work item pre-selected
- Minimum clicks required
**Approach:** URL params `?type=work&workId=[id]` or router state. StoryGenerator reads on mount.
**Skill:** `code-reviewer`
**Files:** Portfolio component, `StoryGenerator.tsx`

---

### T12 — Loyalty Referral Codes Differentiation
**What:** Client needs TWO separate DB codes:
1. `c2c_referral_code` — for inviting FRIENDS (C2C flow, friend gets discount)
2. `c2b_referral_code` — for master-originated invite (C2B flow)
- New migration: add columns to `client_profiles` (or `profiles`)
- `/my/loyalty` shows both codes with distinct sections + share links
- `/invite/[code]/` landing page unique design per type

**BONUS BUG (C2B one-sided):** Currently when a master refers a client (C2B), only the MASTER gets a bonus. The referred CLIENT gets nothing. Fix to be bidirectional: master gets bonus AND client gets bonus (e.g., first-booking discount or loyalty credit).

**Current state:** `getOrGenerateProfileReferralCode()` returns one code. Need to split.
**Skill:** `code-reviewer` + `create-migration`
**Files:** `my/loyalty/page.tsx`, `invite/[code]/page.tsx`, `referrals.ts`, `applyReferralRewards()`

---

### T13 — Onboarding Schedule Step
**What:** Without expanding "Свій графік" button, can't proceed. Need two buttons on initial state:
1. "Налаштувати" — expands schedule editor
2. "Продовжити" — skips (uses default schedule)
**Skill:** `impeccable`
**File:** `StepSchedule.tsx`

---

### T14 — Onboarding Preview Link
**What:** Link editing block looks secondary/unimportant. Make it visually prominent (weight, styling, hierarchy).
**Skill:** `impeccable`
**File:** `StepPreview.tsx`

---

### T11 — Flash Actions Full Audit
**What:** Complete review and analysis of flash deals system. `quick-actions.ts` was a DIFFERENT file entirely — investigate separately whether its deletion caused any regression.
Tasks:
- Audit `flash/actions.ts` end-to-end: createFlashDeal, cancelFlashDeal, notification dispatch (Push + TG), Starter limits
- Test notification flow: do eligible clients (48h window via RPC) actually receive Push/TG notifications?
- Review FlashDeals UI component for UX issues (badge visibility, multi-deal handling)
- Check deleted `quick-actions.ts` via `git show HEAD:path` to understand what it did
**Skill:** `code-reviewer` + `react-doctor`
**Files:** `flash/actions.ts`, `FlashDeals` component

---

### T16 — Tour Highlights
**What:** Tour uses `data-tour-step` attributes but doesn't visually spotlight/highlight elements. Need proper spotlight overlay:
- Dims everything except target element
- Border/glow around target
- Smooth transition between steps
**Skill:** `design-taste-frontend` + `emil-design-eng`
**Files:** `DashboardTourContext.tsx`, `DashboardTourBanner.tsx`

---

## HANDOFF Document Structure

After plan approval, create: `XDEV/PLANS/SPRINT-03-BACKLOG/HANDOFF.md`

### Format:
```markdown
# Sprint-03 HANDOFF

**Status:** T[N] IN PROGRESS / T[N] DONE (N/18)
**Last deploy:** [timestamp]
**Next task:** T[N+1] — [name]

## Task Tracker
| Iter | ID | Name | Status | Skill | Vercel |
|------|----|------|--------|-------|--------|
| 1 | T15 | Default Frost | ✅ DONE | code-reviewer | ✅ |
| 2 | T1  | Bookings bugs | 🔄 IN PROGRESS | code-reviewer | — |
...

## Context for Next Session
[What was done, what decisions were made, any gotchas discovered]
```

---

## Transition Prompt Template

```
Привіт. Продовжуємо Sprint-03 BookIT.

Читай спочатку:
1. XDEV/PLANS/SPRINT-03-BACKLOG/HANDOFF.md — стан трекера, що зроблено
2. XDEV/MAPS/SYSTEM_MAP.md — останні 40 рядків
3. mempalace_status → mempalace_search "[current task topic]"

Поточна задача: T[N] — [name]
Файли задачі: [list]
Скіл: [skill name]

Воркфлоу: одна задача → vercel --prod → юзер перевіряє → наступна.
GATE OK після mempalace_search + QA + skill declaration + humanizer check.
```

---

## Files to Create During Implementation

1. `XDEV/PLANS/SPRINT-03-BACKLOG/HANDOFF.md` — live tracker (create on iteration 1)
2. `XDEV/PLANS/SPRINT-03-BACKLOG/TRANSITION_PROMPT.md` — copy-paste для нових сесій
3. Updates to `XDEV/TASK.md` — active sprint after each iteration

---

## Post-Change Protocol (every iteration)
1. `npx tsc --noEmit` (in `bookit/`)
2. `npm run build`
3. `vercel --prod`
4. Update `HANDOFF.md` tracker (mark done + date + deploy URL)
5. `mempalace_add_drawer` — save key decisions/bugs fixed
6. Update `XDEV/TASK.md`

---

## Confirmed Execution Order (18 iterations)

| Iter | Task | Name | Group |
|------|------|------|-------|
| 1 | T15 | Default theme = Frost | A: Bugs |
| 2 | T1 | Bookings: date off-by-1 + arrows + colors + mobile UI | A: Bugs |
| 3 | T10 | Clients: important pills overflow | A: Bugs |
| 4 | T4 | Studio billing: remove block + fix form + phone + submit bug | A: Bugs |
| 5 | T3 | Profile settings: mobile horizontal scroll | B: Mobile |
| 6 | T2 | Dashboard: mobile stats + PC peak hours + referral text | B: Mobile |
| 7 | T5 | Story constructor: animated arrow scroll hint | B: Mobile |
| 8 | T8 | Navbar: profile rightmost + FAB + notifs to system | B: Mobile |
| 9 | T6c | Analytics desktop: date nav redesign + section slider | C: Desktop |
| 10 | T6a | Desktop layout: billing + reviews + growth | C: Desktop |
| 11 | T6b | Desktop layout: revenue + marketing + products + services | C: Desktop |
| 12 | T7 | Profile settings desktop: empty space + schedule animation | C: Desktop |
| 13 | T9 | Portfolio → story constructor pre-selected | D: Features |
| 14 | T12 | Loyalty: two DB codes + bidirectional C2B + unique invite pages | D: Features |
| 15 | T13 | Onboarding schedule: Configure + Continue buttons | D: Features |
| 16 | T14 | Onboarding preview: link block more prominent | D: Features |
| 17 | T11 | Flash actions: full audit + notification test | D: Features |
| 18 | T16 | Tour: spotlight/highlight elements | D: Features |
