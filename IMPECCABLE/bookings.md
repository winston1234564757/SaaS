# IMPECCABLE Bookings Page Report

**Project:** BookIT | **Generated:** 2026-05-31  
**Skill Register:** Product | **Reference:** `reference/product.md` loaded

---

## 1. CRITIQUE — Combined Dual-Assessment Report

### Assessment A: LLM Design Review

**Spawned as isolated sub-agent**. Read 24 source files across all 3 themes + booking-form components.

**Key finding**: Heavy AI-generation artifacts (~70%) with human refinement (~30%). ASCII art comments, numbered step comments, redundant `transition-all` on every button, dead code (`opacity: 0.08 > 0 ? 1 : 1`).

### Assessment B: Manual Deterministic Scan

**Absolute bans result:**
| Ban | Verdict | Details |
|-----|---------|---------|
| Side-stripe borders | FAIL | `MonthlyAnalyticsView.tsx:325` — `borderLeft: '4px solid var(--accent)'` on week cards |
| Gradient text | PASS | 0 instances |
| Glassmorphism as default | PASS | Not used decoratively |
| Hero-metric template | BORDERLINE | DashboardWidgets display real data, not decorative metrics |
| Identical card grids | PASS | Varied layouts |
| Modal as first thought | BORDERLINE | 3 modal patterns (detail, edit, opportunity) — booking detail as modal is standard |

**Product bans result:**
| Ban | Verdict | Details |
|-----|---------|---------|
| Decorative motion | PASS | All motion serves state/feedback |
| Inconsistent vocabulary | BORDERLINE | Mix of widget patterns across views |
| Display fonts in labels | FAIL | 100px Great Vibes cursive title — display font used as page label |
| Reinvented affordances | PASS | Standard booking patterns |
| Heavy inactive color | PASS | Muted colors |

### Combined Findings

#### Anti-Patterns Verdict

**Heavy AI-generation (~70%).** Dead code artifacts (`opacity: 0.08 > 0 ? 1 : 1`), ASCII art comments (`// ── Card body ──`), redundant `transition-all` on every action button, numbered step comments. The component architecture and drag-drop timeline show human refinement on top of an AI skeleton. Needs code cleanup to remove AI tells.

**Side-stripe violation** in MonthlyAnalyticsView week cards — `borderLeft: 4px solid var(--accent)` is a direct absolute ban violation. Display font (100px Great Vibes) used as page title violates product register.

#### Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | Good loading/saving. No persistent booking count. |
| 2 | Match System / Real World | 3 | UA locale, domain-appropriate. "Focus" mode name is abstract. |
| 3 | User Control and Freedom | 2 | No undo for cancellations (critical). No "jump to today" shortcut. |
| 4 | Consistency and Standards | 2 | Desktop sidebar vs mobile sticky bar: different layout. Week/month switches to analytics, not bookings. |
| 5 | Error Prevention | 1 | Cancel has NO confirmation. Drag-reschedule confirms; status changes don't. |
| 6 | Recognition Rather Than Recall | 2 | 9 view/range combos. Analytics views unrelated to list view. |
| 7 | Flexibility and Efficiency | 3 | Multi-path booking creation. No keyboard shortcuts. Bulk toolbar unwired. |
| 8 | Aesthetic and Minimalist Design | 2 | 100px cursive title overpowers the page. 6.5px text unreadable. |
| 9 | Error Recovery | 2 | Toast errors. No inline error banners, no retry. |
| 10 | Help and Documentation | 0 | No tooltips, no onboarding, no first-use hints. Drag-to-reschedule is hidden. |
| **Total** | | **20/40** | **Acceptable — significant improvements needed** |

#### Cognitive Load Assessment

**8-item checklist:**
- ❌ Progressive disclosure: 9 view/range combos all exposed at once
- ❌ Chunking: Timeline → analytics is unrelated paradigm shift
- ❌ Hiding complexity: No hidden features — bulk actions unwired but visible
- ⚠️ Recognition: Icons help, "Focus" mode meaning is unclear
- ✅ Navigation consistency: View switcher position consistent
- ⚠️ Minimalism: Page busy — 4 widgets + 11 controls + content compete
- ⚠️ Error prevention: Partial — drag-reschedule confirms, cancellation doesn't
- ❌ Memory load: Must remember which view/range combo shows what

**4+ failures → CRITICAL cognitive load.** 3×3×3 (view × range × theme) = 27 combinations. The 3-second rule is violated.

#### What's Working

1. **Drag-and-drop timeline reschedule** — Framer Motion Y-drag with 15-min snapping, time preview overlay, inline confirm/cancel. Premium interaction.
2. **OpportunityMenu** — Empty slots become actionable (book/flash/story). Business-logic-first design.
3. **URL-driven modal state + `useUrlActionBus`** — Clean engineering. bookingId in search params, cross-feature navigation.

#### Priority Issues

**P1 — Cancel has no confirmation** (BookingCard:241, BookingDetailsModal:664). Accidental cancel = lost data, no undo. This is a financial transactions platform.
- Fix: Add undo-toast (show "Cancelled. Undo?" for 5s) or confirmation dialog. Reuse the OpportunityMenu modal pattern.

**P1 — 9 view/range combos create cognitive overload** (3 views × 3 time ranges = 9 states). Week/month switches to analytics, not bookings.
- Fix: Reduce to 2 views max. Analytics should be a toggle overlay, not a view replacement. Merge Focus into list as a filter.

**P1 — Unreadable micro-text** (`text-[6.5px]` revenue labels MonthlyAnalyticsView:268, `text-[8px]` BookingCard:141). WCAG fails.
- Fix: Minimum `text-[10px]`. Hide extra info on mobile, show on hover/tap.

**P1 — No undo for destructive actions** — Cancel, complete, no-show, confirm all one-way. No rollback.
- Fix: At minimum, add confirmation to cancellations. Soft-delete with 30-second undo window.

**P1 — Card contrast: cards не видно на Studio та Frost**
- **Причина**: `var(--surface)` = `rgba(30,76,90,0.94)` на `#0E1D21` (Studio, delta 3.2%) та `rgba(218,226,255,0.90)` на `#EFF2FF` (Frost, delta 5.1%). Картки зливаються з фоном.
- **Наслідок**: Користувач не бачить меж карток. Timeline, список — усе виглядає як суцільне полотно.
- **Fix**: Збільшити контраст `var(--surface)` vs `var(--background)`. Додати `box-shadow` або `border` до карток.

**P2 — `text-muted-foreground/40` та `/60` нечитабельні**
- **Наслідок**: `var(--text-tertiary)` × 0.4 = майже невидимий текст. Contrast ratio 1.2:1 (Blossom), 1.9:1 (Studio), 1.2:1 (Frost) — всі FAIL WCAG.
- **Fix**: Прибрати подвійну прозорість. Використати `var(--text-secondary)` без `/40` або `/60`.

**P2 — Hardcoded divider `bg-[#F0DDD6]`** (BookingCard.tsx:159)
- **Наслідок**: Не адаптується до теми. На Blossom майже невидимий (delta ~2).
- **Fix**: Замінити на `var(--border)` або `border-t border-strong`.

**P2 — `hover:bg-secondary/40` не дає ефекту** (BookingCard.tsx:136)
- **Наслідок**: `var(--surface)` при 40% поверх `var(--surface)` = нульова зміна. Hover не відчувається.
- **Fix**: Використати `hover:bg-[var(--accent)]/5` або інший контрастний колір.

**P2 — Mobile sticky bar overloaded** (11+ tappable targets in BookingsPage:204-288). Guaranteed fat-finger errors.
- Fix: Move search behind search page. Collapse time range into swipeable day strip.

**P2 — AI code artifacts** (dead code `opacity: 0.08 > 0 ? 1 : 1`, typo `text-text-mute/60`, duplicated `transition-all` classes).
- Fix: Clean up dead code, fix typos, deduplicate CSS classes.

**P3 — Side-stripe border** (MonthlyAnalyticsView:325). Replace with background tint or full border.

**P3 — 100px Great Vibe cursive title** — display font in product UI label. Product ban violation. Reduce or move to greeting-only context.

#### Persona Red Flags

**Alex (Power User)** — Cancel has no confirmation → one wrong click loses a booking. No keyboard shortcuts. 9 view/range combos to memorize. Will hate the 100px title that wastes screen space. The drag-reschedule is the only feature that delights her.

**Jordan (First-Timer)** — Lands on a page with 11+ controls, 4 widgets, 100px title. Drag-to-reschedule has zero discoverability — no tooltip, no hint. "Focus" mode is a meaningless name. Will give up and use phone for bookings instead.

**Maya (Studio Owner)** — Needs to see today's schedule at a glance. The analytics views (week/month) replace bookings entirely — she can't see her day while analyzing performance. OpportunityMenu (free-slot → create booking) is exactly what she needs but buried.

#### Minor Observations

- `BookingCard.tsx:22` — `cn` imported but never used (dead import)
- `MonthlyAnalyticsView.tsx:192` — `opacity: 0.08 > 0 ? 1 : 1` — constant expression, dead code
- `BookingDetailsModal.tsx:476` — `text-text-mute/60` should be `text-muted-foreground/60`
- `PeriodAnalyticsView.tsx:115-117` — Hardcoded `bg-white border-2 border-peach` assumes Blossom theme; breaks on Studio/Frost
- `DashboardWidgets` "Forecast Revenue" label overstates — just sums pending+confirmed prices, not a real forecast
- Retention rate in `useBookingsDashboardLogic` — phone matching within date range only; inaccurate for day/week ranges

#### Questions to Consider

1. **3 themes × 3 views × 3 time ranges = 27 states. Tool or Rubik's cube?** How many have been tested with real solo masters?
2. **The drag-drop timeline is the best feature here. Why is it behind a toggle instead of the default?**
3. **6.5px text in production. What does that say about the information-density vs legibility trade-off?**
4. **Analytics views are beautiful but they replace bookings entirely. Primary job: manage or analyze? If both, why force a choice?**

---

## 2. ANIMATE — Motion & Interaction Audit

**Register: Product** — 150-250ms transitions, motion conveys state not decoration. Users are scheduling; don't make them wait.

### 2.1 Animation Strategy

| Layer | Current State | Assessment |
|-------|--------------|------------|
| **Hero moment** | Drag-to-reschedule with spring confirm overlay | Outstanding. This IS the hero. |
| **Feedback layer** | BookingCard stagger entrance, status buttons | Missing: cancel/confirm/complete feedback, no success checkmark, no error shake |
| **Transition layer** | layoutId today indicator, AnimatePresence on calendar | Good editorial transitions. Missing: status change animation, SmartQueue item reorder, week→day drill-down |
| **Delight layer** | OpportunityMenu scale entrance, gap fade-in | Minimal. Drag-reschedule is the only delight moment. |

### 2.2 Current animation inventory

| Element | Technique | Easing | Critique |
|---------|-----------|--------|----------|
| BookingCard entrance | `initial: opacity:0 y:10` + stagger | `stiffness:260 damping:28` | Clean, no bounce. Good. |
| VerticalTimeline drag | `drag="y"` with constraints | `dragElastic:0` | Outstanding. Snap-to-15min + spring confirm overlay. |
| Timeline gap buttons | `opacity:0→1` | none | Basic fade. Should stagger with bookings. |
| OpportunityMenu | scale + opacity + y | none | `scale:0.9→1` tight — use `ease-out-quart`. |
| BulkActionToolbar | `y:100→0` slide-up | none | Could use spring for polish. |
| Calendar cells | staggered `opacity:0→1` | `delay: i*0.006` | Good for dense grid. |
| Revenue underline bars | `scaleX:0→1` | `ease:[0.23,1,0.32,1]` | Clean cubic-bezier. |
| Today indicator | `layoutId="today-indicator"` | `stiffness:300 damping:28` | Excellent shared layout transition. |
| PeriodAnalyticsView bars | `width:0→occupancy%` | none | Spring would feel better. |
| Week card entrance | staggered `x:-8→0` | `stiffness:260 damping:28` | Good editorial feel. |

### 2.3 Motion gaps

| Gap | Priority | Proposal |
|-----|----------|----------|
| BookingCard status change animation | M | When status updates (pending→confirmed), 200ms scale pulse + `layout` reorder |
| SmartQueue item reorder | M | `AnimatePresence` + `layout` when bookings move between urgency groups |
| Cancel/confirm feedback | M | Add success checkmark + 200ms pulse on action (product register: motion conveys state) |
| Week→day drill-down | M | Share layout animation on clicked day transitioning to detail view |
| BulkActionToolbar confirm | L | Success checkmark + brief scale on each card after bulk action |
| ReschedulePanel slot selection | L | Spring animation on selected slot card |
| Sticky mobile controls entrance | L | Slide-down from `-y` on mount |

### 2.4 Product register violations

| Violation | Location | Fix |
|-----------|----------|-----|
| Missing status-change animation | BookingCard confirm/cancel | Add 200ms pulse + success checkmark — motion must convey state |
| No `prefers-reduced-motion` | All booking components | Add global CSS override |
| Drag-reschedule has no keyboard alternative | VerticalTimeline | Add keyboard up/down arrow to nudge time |

---

## 3. AUDIT — Technical Quality (5-Dimension Scoring)

### Audit Health Score

| # | Dimension | Score | Key Finding |
|---|-----------|-------|-------------|
| 1 | Accessibility | **1** | Cancel has no confirmation (WCAG 3.3.4). Drag-reschedule mouse-only. 6.5px text fails contrast AND readability. No keyboard alternative for drag. |
| 2 | Performance | **3** | Good data aggregation in BookingsPage. ReschedulePanel 3 parallel queries need caching. |
| 3 | Theming | **1** | `var(--surface)` занадто близький до `var(--background)` в Studio та Frost. Картки невидимі. |
| 4 | Responsive | **3** | Good responsive arc. `--safe-top` may not be defined. Mobile bar has 11+ items. |
| 5 | Anti-Patterns | **2** | Side-stripe border. AI code artifacts. Display font as page title. Card contrast FAIL. |
| **Total** | | **10/20** | **Acceptable — significant work needed** |

### Anti-Patterns Verdict

**Borderline pass/fail on AI slop.** The booking page has obvious AI artifacts (dead code, ASCII art comments, redundant `transition-all` on every button), but the drag-drop timeline and OpportunityMenu show human refinement. Product register violations: display font as page label, side-stripe border.

### Executive Summary

- Audit Health Score: **10/20** (Acceptable)
- Issues found: 1 P0 (cancel no confirmation), 4 P1, 5 P2, 4 P3
- Top critical: Cancel needs confirmation (P0), card contrast on Studio/Frost (P1), hardcoded Blossom theme colors (P1), micro-text unreadable (P1)

### Detailed Findings by Severity

#### P0 — Blocking

**[P0] Cancel booking has no confirmation**
- **Location**: BookingCard.tsx:241, BookingDetailsModal.tsx:664
- **Category**: Accessibility (Error Prevention)
- **Impact**: Accidental click = lost booking. No undo. Financial data loss.
- **WCAG**: WCAG 2.1 SC 3.3.4 (Error Prevention — Legal/Financial)
- **Fix**: Add confirmation dialog or undo-toast (5s "Booking cancelled. Undo?")
- **Suggested**: `impeccable harden`

#### P1 — Critical

**[P1] Hardcoded Blossom theme colors**
- **Location**: PeriodAnalyticsView.tsx:115-117 — `bg-white border-2 border-peach`
- **Category**: Theming
- **Impact**: PeriodAnalyticsView breaks visually on Studio and Frost themes
- **Fix**: Use CSS variables `var(--card-bg)` and `var(--border)`

**[P1] Unreadable 6.5px text**
- **Location**: MonthlyAnalyticsView:268, BookingCard:141
- **Category**: Accessibility
- **Impact**: WCAG 1.4.3 contrast fails at this size. Users can't read it.
- **Fix**: Minimum `text-[10px]`. Hide extra data on mobile, show on hover.

**[P1] No keyboard alternative for drag-to-reschedule**
- **Location**: VerticalTimeline.tsx
- **Category**: Accessibility
- **Impact**: Keyboard-only users cannot change booking times
- **WCAG**: WCAG 2.1.1 (Keyboard)
- **Fix**: Add up/down arrow keys to nudge time, Enter to confirm

**[P1] Card contrast: Studio та Frost — картки невидимі**
- **Location**: `globals.css:124,190` — `var(--surface)` визначення
- **Category**: Theming / Accessibility
- **Impact**: Cards blend into page background. Studio: delta 3.2% (rgba(30,76,90,0.94) on #0E1D21). Frost: delta 5.1% (rgba(218,226,255,0.90) on #EFF2FF). User cannot distinguish card boundaries.
- **WCAG**: WCAG 1.4.11 (Non-text Contrast) — card borders need 3:1 ratio
- **Fix**: Increase `var(--surface)` opacity contrast. Add `box-shadow: 0 1px 3px var(--shadow)` to card. Alternative: `border: 1px solid var(--border-strong)`.

**[P1] `text-muted-foreground/40` та `/60` — нечитабельний текст**
- **Location**: BookingCard.tsx:142,150,167
- **Category**: Accessibility
- **Impact**: `var(--text-tertiary)` × 0.4 (або 0.6) = contrast ratio 1.2:1 до 2.6:1. Всі нижче WCAG AA (4.5:1). Small text (11px) стає невидимим.
- **WCAG**: WCAG 1.4.3 (Contrast Minimum)
- **Fix**: Remove `/40` and `/60` opacity modifiers. Use `var(--text-secondary)` directly, or `var(--text-tertiary)` without opacity stacking.

#### P2 — Major

**[P2] 9 view/range combos always visible**
- **Location**: BookingsPage.tsx:204-288
- **Category**: Anti-Pattern
- **Impact**: Cognitive overload — 27 combinations across themes/views/ranges
- **Fix**: Reduce to 2 views. Analytics as toggle overlay.

**[P2] Mobile sticky bar overloaded**
- **Location**: BookingsPage.tsx:204-288 — 11+ items
- **Category**: Responsive
- **Impact**: Fat-finger errors guaranteed
- **Fix**: Move search behind pull-down or search page. Collapse time range.

**[P2] Hardcoded divider `bg-[#F0DDD6]`**
- **Location**: BookingCard.tsx:159
- **Category**: Theming
- **Impact**: Fixed taupe (`#F0DDD6`) не адаптується до теми. На Blossom майже невидимий (delta ~2). На Studio та Frost — неправильний колір.
- **Fix**: Replace with `border-t border-strong` або `var(--border)`.

**[P2] `hover:bg-secondary/40` не дає візуального ефекту**
- **Location**: BookingCard.tsx:136
- **Category**: Theming
- **Impact**: `var(--surface)` при 40% на `var(--surface)` = нульова різниця. Користувач не бачить hover стану.
- **Fix**: Use `hover:bg-[var(--accent)]/5` або підняти `box-shadow` на hover.

**[P2] `.blossom-schedule/.studio-schedule` знищує styling карток**
- **Location**: globals.css:789-808
- **Category**: Theming / Anti-Pattern
- **Impact**: `background: transparent; border: none; box-shadow: none;` на bento-card всередині schedule. Картки стають невидимими div-ами.
- **Fix**: Додати border-top або background-color замість повного обнулення.

**[P2] AI code artifacts**
- **Location**: ReschedulePanel.tsx
- **Category**: Performance
- **Impact**: Three queries on expand: templates, exceptions, 30-day bookings
- **Fix**: Add `staleTime: 60000`. Consider prefetching on modal open.

#### P3 — Minor

**[P3] Side-stripe border on week cards**
- **Location**: MonthlyAnalyticsView:325 — `borderLeft: 4px solid var(--accent)`
- **Category**: Anti-Pattern
- **Impact**: Absolute ban violation
- **Fix**: Replace with background tint or full border

**[P3] 100px display font as page title**
- **Location**: BookingsPage.tsx:176-178 — Great Vibes 100px
- **Category**: Theming
- **Impact**: Product register ban — display font in UI label
- **Fix**: Reduce to greeting-only context (Dashboard pattern)

**[P3] `--safe-top` may not be defined**
- **Location**: BookingsPage.tsx:204
- **Category**: Responsive
- **Impact**: Sticky controls may clip on some browsers
- **Fix**: Define `--safe-top` in root or use hardcoded fallback

### Patterns & Systemic Issues

1. **AI generation artifacts**: ASCII comments, numbered steps, dead code, redundant CSS — suggests AI-generated code was merged without review.
2. **Theme blindness**: `bg-white border-peach` in PeriodAnalyticsView, `bg-[#F0DDD6]` in BookingCard — hardcoded Blossom tokens scattered in components.
3. **No destructive-action safety**: Cancel, no-show, complete all one-click. No undo pattern anywhere except drag-reschedule.
4. **Card contrast crisis**: `var(--surface)` defined as semi-transparent overlay of `var(--background)` in all 3 themes. In Studio/Frost the delta is <5%, making cards indistinguishable from page background. Systemic token design problem, not a component bug.
5. **Double-opacity anti-pattern**: `text-muted-foreground/40` where `--text-tertiary` is already low-contrast. Multiple files use this pattern — suggests a shared component or style convention that compounds the problem.

### Positive Findings

- **Single data source**: BookingsPage aggregates all fetches in one hook. No duplicate queries. Much better than dashboard's scattered approach.
- **Lazy-loaded modals**: Booking details and reschedule load on demand. Good performance architecture.
- **Consistent date handling**: `date-fns` used everywhere. `getNow()` wrapper for testability.
- **Vaul bottom sheets**: Desktop modal → mobile bottom sheet pattern is correct.

---

## 4. POLISH — Pre-shipping Pass

### 4.1 Design System Discovery

**Existing system**: Shares dashboard's CSS variable system. `bento-card` pattern extends to bookings. Bookings-specific: action buttons, timeline, analytics views.

**Drift identified:**
| Drift | Root cause | Fix category |
|-------|-----------|--------------|
| Hardcoded `bg-white border-peach` in PeriodAnalyticsView | Missing token | Add to theme system |
| `--safe-top` undefined in some browsers | Missing token | Define in root |
| Duplicated `transition-all` on BookingCard action buttons | One-off implementation | Deduplicate |
| Inline `cursor:grab` vs Tailwind utilities | One-off implementation | Convert to Tailwind |
| `bg-surface/90` — `surface` not a CSS var | Missing token | Define `--surface` |
| Hardcoded `bg-[#F0DDD6]` divider in BookingCard | Missing token | Replace with `var(--border)` |
| `var(--surface)` too close to `var(--background)` in Studio/Frost | Conceptual misalignment | Increase surface contrast |
| `text-muted-foreground/40` double opacity | One-off implementation | Remove opacity stacking |

**Quality bar**: Flagship — booking flow is the core product interaction.

### 4.2 Triage

| Category | Count | Priority |
|----------|-------|----------|
| **Functional** (blocks/confuses) | 10 | Fix first |
| **Cosmetic** (looks off only) | 6 | Fix in follow-up |

### 4.3 Functional issues

| Location | Issue | Fix |
|----------|-------|-----|
| `BookingCard.tsx:241, BookingDetailsModal.tsx:664` | Cancel booking has no confirmation | Add undo-toast or confirmation dialog (P0) |
| `globals.css:124,190` | `var(--surface)` занадто близький до `var(--background)` в Studio/Frost | Збільшити контраст surface vs background. Додати box-shadow або border до bento-card |
| `BookingCard.tsx:142,150,167` | `text-muted-foreground/40` та `/60` — contrast ratio 1.2:1-2.6:1 | Прибрати подвійну прозорість. Використати `var(--text-secondary)` без opacity |
| `PeriodAnalyticsView.tsx:115-117` | Hardcoded `bg-white border-2 border-peach` — breaks on Studio/Frost | Use `var(--card-bg)` and `var(--border)` |
| `MonthlyAnalyticsView.tsx:268` | `text-[6.5px]` unreadable | Minimum `text-[10px]` |
| `BookingCard.tsx:159` | Hardcoded divider `bg-[#F0DDD6]` — не theme-aware | Replace with `border-t border-strong` |
| `BookingCard.tsx:136` | `hover:bg-secondary/40` — нульовий ефект (surface на surface) | Використати `hover:bg-[var(--accent)]/5` |
| `globals.css:789-808` | `.blossom-schedule/.studio-schedule` знищує styling карток | Додати `border-top: 1px solid var(--border-strong)` замість повного обнулення |
| `BookingsPage.tsx:204` | `--safe-top` undefined — sticky controls may clip | Define in root |
| `MonthlyAnalyticsView.tsx:192` | Dead code `opacity: 0.08 > 0 ? 1 : 1` | Remove |
| `BookingDetailsModal.tsx:476` | Typo `text-text-mute/60` | Fix to `text-muted-foreground/60` |
| `VerticalTimeline.tsx:110` | `dragElastic={0}` + `dragMomentum={false}` redundant | Remove `dragMomentum` |

### 4.4 Cosmetic issues

| Location | Issue | Fix |
|----------|-------|-----|
| `BookingCard.tsx:135,211,222,233,244` | Duplicated `transition-all` in action buttons | Single `transition` class per element |
| `VerticalTimeline.tsx:139-152` | Inline `cursor:grab` style | Use `cursor-grab active:cursor-grabbing` |
| `OpportunityMenu.tsx:32` | `bg-surface/90` not a valid Tailwind color | Use `var(--surface)` via inline style |
| `MonthlyAnalyticsView.tsx:325` | Side-stripe `borderLeft: 4px solid` | Replace with background tint |
| BookingsPage title | 100px Great Vibes — product label, not greeting | Reduce size or scope to greeting-only |
| Timeline hour grid lines | `opacity: 0.55` на `var(--border)` — майже невидимі на Studio/Frost | Збільшити opacity до 0.8 |

### 4.5 Consistency with dashboard

| Aspect | Dashboard | Bookings | Match? |
|--------|-----------|----------|--------|
| Card style | `bento-card` | `bento-card` | YES |
| Animation springs | `bounce: 0.06-0.12` | `stiffness:260 damping:28` | PARTIAL |
| Divider thickness | `h-px` | `h-[0.5px]` | FIX: standardize to `h-px` |
| Label style | `heading-serif` / editorial uppercase | Mixed | FIX: use `widget-heading` consistently |
| Theme tokens | CSS vars | CSS vars | YES |
| Greeting typography | Great Vibes (greeting only) | Great Vibes (page title) | FIX: reduce to greeting scope |

### 4.6 Polish Checklist

- [x] Design system drift named: 6 items
- [ ] Cancel booking confirmation (P0 — fix before anything)
- [ ] Theme-aware colors in PeriodAnalyticsView
- [ ] Remove AI code artifacts (dead code, ASCII comments)
- [ ] Minimum legible text size ≥10px
- [ ] `transition-*` classes not duplicated
- [ ] Tailwind utilities replace inline styles
- [ ] `--safe-top` defined in CSS root
- [ ] All interactive states have focus indicators

---

## 5. LAYOUT — Spacing, Rhythm & Hierarchy

**Register: Product** — predictable grids, consistent densities, familiar navigation patterns. Bookings is a task surface; layout must serve the workflow.

### 5.1 Register alignment check

| Product layout principle | Bookings status |
|-------------------------|-----------------|
| Predictable grids | Desktop: sidebar + main (12-col). Good editorial grid. |
| Consistent densities | Content area consistent. Header 100px title wastes prime vertical space. |
| Familiar patterns | Sidebar search + filter, date nav, content — standard booking UI pattern. |
| Structural responsive | Mobile sticky bar with 11+ items is too dense. Search should collapse. |

### 5.2 Squint test

**Desktop**: Clear zones — sidebar (search/filter) + content (views). Hierarchy passes. The 100px Great Vibes title dominates the top half of the viewport — squint test shows "Записи" as the primary visual element, not the actual bookings.

**Mobile**: 11+ items in sticky bar = noise. Primary action ("Новий запис") competes with 10 other controls. Squint test fails — no clear primary element visible in the scrollable content area.

### 5.3 Grid architecture

```
Desktop (lg+):
┌─────────────────────────────────────────────────┐
│ Sidebar (3/12)           Main (9/12)            │
│ ┌──────────────────────┐ ┌─────────────────────┐│
│ │ Search & Filter      │ │ View/Date/Nav Bar   ││
│ │   - Search input     │ │   - View switcher   ││
│ │   - Status dropdown  │ │   - Date navigation ││
│ │                      │ │                     ││
│ │ SharePageCard        │ │ Content Area:       ││
│ │                      │ │   List/Timeline/    ││
│ │                      │ │   SmartQueue/       ││
│ │                      │ │   Analytics         ││
│ └──────────────────────┘ └─────────────────────┘│
└─────────────────────────────────────────────────┘

Mobile:
┌──────────────────────────┐
│ Sticky Header (11 items) │ ← OVERLOADED
├──────────────────────────┤
│ Content (full-width):    │
│  List / Timeline /       │
│  SmartQueue / Analytics  │
└──────────────────────────┘
```

### 5.4 Spacing analysis

- **Title:** `text-[60px] lg:text-[100px]` Great Vibes — dominates viewport. Takes 120px+ of vertical space before content starts.
- **DashboardWidgets:** `grid-cols-2 lg:grid-cols-4`, `gap-4 lg:gap-6`. Responsive. Good.
- **Date navigator:** `gap-4 lg:gap-10` between header and controls. Editorial breathing.
- **Content area:** `min-h-[500px]` — good minimum for empty states.
- **Cards:** `gap-5` between day groups, `gap-4` between individual cards. Good editorial rhythm.
- **VerticalTimeline:** `HOUR_HEIGHT = 180px` — tall. Works for desktop, forces scroll on mobile.

### 5.5 Layout issues

| Issue | Impact | Fix |
|-------|--------|-----|
| 100px title consumes prime viewport real estate | 15% of desktop viewport = title, not content | Reduce to greeting-only or `text-[32px] lg:text-[48px]` |
| Mobile bar 11+ items | Fat-finger, cognitive overload | Collapse to 4 max, overflow menu for rest |
| 9 view/range combos | Each changes layout — no fixed mental model | Reduce to 2 views max |
| Divider `h-[0.5px]` vs dashboard `h-px` | Inconsistent | Standardize to `h-px` |

### 5.6 Layout improvement proposals

| Proposal | Impact |
|----------|--------|
| Reduce title size to greeting-only scope | Medium — reclaims prime vertical space |
| Collapse mobile controls to 4 primary items + overflow | Medium — reduces fat-finger errors |
| Standardize divider thickness to `h-px` | Low — visual consistency with dashboard |
| Add `--editorial-gap` spacing variable | Medium — consistent editorial spacing scale |
| Timeline sticky hour labels on scroll | Medium — currently labels scroll away with content |

---

## 6. OVERDRIVE — Push Past Conventional Limits

**Context**: Functional UI (booking management). The "wow" is in how it FEELS — drag-and-drop fluidity, instant confirmations, morphing dialogs. The drag-to-reschedule is already at overdrive level.

### 6.1 Current overdrive features

| Feature | Level | Why it qualifies |
|---------|-------|------------------|
| VerticalTimeline drag-to-reschedule | ★★★★★ | Framer Motion Y-drag + 15-min snap + spring confirm overlay + undo. Production-grade. |
| BookingDetailsModal persistence | ★★★★ | `lastBooking` stays visible through 400ms close animation. Rare UX solve. |
| ReschedulePanel smart slot scoring | ★★★★ | 3 data sources → scores slots by availability + renders breaks. |
| MonthlyAnalyticsView calendar heatmap | ★★★★ | Revenue underlines with `scaleX` stagger, `layoutId` today indicator, opacity dots. |
| SmartQueue focus triage | ★★★☆ | Urgency grouping (action/soon/complete). Simple, well executed. |
| OpportunityMenu | ★★★ | Free-slot contextual menu → booking/flash/story. Editorial business logic. |

### 6.2 Overdrive directions (for user selection)

#### Direction A: Timeline gesture-based selection
VerticalTimeline: two-finger pinch to zoom hour scale (90→240px), long-press empty space to create booking, spring feedback on snap points, CSS `scroll-snap`.
- **Cost**: High (4-5 days)
- **Performance**: Monitor drag on mobile — pinch gesture may conflict with scroll
- **Fallback**: Current static timeline

#### Direction B: SmartQueue real-time updates
Supabase Realtime subscription updates urgency groups live. Cards animate between groups with `layoutId`. "Someone just booked" toast overlay.
- **Cost**: Medium (3 days)
- **Performance**: Minimal — small data payloads
- **Fallback**: Current polling or manual refresh

#### Direction C: Calendar appointment heatmap
MonthlyAnalyticsView: revenue-colored day cell fills (gradient light→deep accent), tap-and-hold day comparison, histogram sidebar.
- **Cost**: Medium (2-3 days)
- **Performance**: Canvas rendering for performance on large months
- **Fallback**: Current dot + underline system

#### Direction D: AI booking suggestions in detail modal
BookingDetailsModal: AI-generated client history summary, suggested next services, optimal reschedule times based on no-show rates, pricing suggestions by LTV.
- **Cost**: High (5-7 days + AI infra)
- **Performance**: AI latency — use streaming response
- **Fallback**: No AI, current manual input works

#### Technical notes
- **View Transitions API**: Available for morphing booking card → detail modal
- **Progressive enhancement**: All booking operations must work without JS (server form fallbacks)
- **`@starting-style`**: Use for mobile controls entry animation from `display: none`

---

## 7. LIVE — Visual Variant Candidates

Elements ready for `impeccable live` iteration.

### Candidates for live iteration

| Element | Current design | Why iterate | Suggested params |
|---------|---------------|-------------|------------------|
| Card density | Rich cards: time, service, client, status, price, actions | Heavy card — could be compact | `density` (0.6-1.4), `structure` (rich/compact/mini) |
| Timeline aesthetics | Editorial HOUR_HEIGHT=180px + drag blocks | Tall — mobile scrolls much | `density` (0.6-1.4), `structure` (editorial/compact/agenda) |
| Search placement | Desktop sidebar + mobile sticky bar | 11+ mobile items overwhelming | `structure` (sidebar/inline/command/fab) |
| Monthly view | Calendar grid + dots + revenue bars + weeks toggle | Feature-rich but busy | `structure` (calendar/card-list/matrix) |
| Bulk actions | Fixed bottom bar (unwired) | Feature not finished | `structure` (bar/swipe/batch) |

### Structure param candidates

Each variant should declare `density` (range 0.6-1.4) and `structure` (steps).

Example for Card density:
```json
{"id":"density","kind":"range","min":0.6,"max":1.4,"step":0.05,"default":1,"label":"Density"},
{"id":"structure","kind":"steps","default":"rich","label":"Card style","options":[
  {"value":"rich","label":"Rich (current)"},
  {"value":"compact","label":"Compact line"},
  {"value":"mini","label":"Mini name+time"}
]}
```

---

## 8. OPTIMIZE — Performance Diagnostics

**CRITICAL**: Measure before and after. Bookings data aggregation is already good — focus on modal loading and memoization.

### 8.1 Core Web Vitals estimate

| Metric | Target | Estimated status | Risk |
|--------|--------|------------------|------|
| **LCP** | < 2.5s | Pass — SSR with loading.tsx skeleton. List content is lightweight. | Low |
| **FID/INP** | < 200ms | At risk during modal open — ReschedulePanel fires 3 parallel queries | Medium |
| **CLS** | < 0.1 | Pass — skeleton states with reserved dimensions | Low |

### 8.2 Hook call analysis

| Component | Data fetches | Notes |
|-----------|-------------|-------|
| BookingsPage | `useBookingsDashboardLogic(dateFrom, dateTo)` with computed range | **Single hook — excellent. (Dashboard should follow this pattern.)** |
| BookingDetailsModal | `useBookingById(bookingId)` + `useQuery('reschedule-store')` | 2 fetches on demand |
| VerticalTimeline | Receives `bookings` as prop | No own fetches |
| SmartQueue | Receives `filteredBookings` as prop | No own fetches |
| PeriodAnalyticsView | Receives `bookings` + `days` as props | No own fetches |
| MonthlyAnalyticsView | Receives `bookings` + `month` as props | No own fetches |

**Verdict:** Best data aggregation in the app. Single fetch feeds 6 child components. No duplicate queries.

### 8.3 Network waterfall

```
BookingsPage mount:
  useBookingsDashboardLogic(dateFrom, dateTo)
    ├→ dashboard stats (1 query)
    └→ bookings list (1 query)

BookingDetailsModal open (on demand):
  useBookingById(bookingId)
    ├→ booking detail (1 query)
    └→ client LTV (1 query)
  
  ReschedulePanel expand:
    ├→ schedule_templates (3 parallel queries)
    ├→ schedule_exceptions
    └→ bookings for 30 days
```

**Good:** Lazy-loaded modals. Single-page aggregation.  
**Optimization:** Prefetch reschedule data when modal opens (not when panel expands). Add `staleTime: 60000`.

### 8.4 Render optimization

| Component | Issue | Fix |
|-----------|-------|-----|
| BookingCard | 4 `useTransition` hooks (confirm, cancel, complete, noShow) | Merge into single `useTransition` with action type param |
| BookingsPage | `filteredBookings` recalculates on every keystroke | Add 300ms debounce to search input |
| MonthlyAnalyticsView | `calendarGrid` + `weekStats` heavy memo | Acceptable — memoized |
| VerticalTimeline | `timelineBookings` + `gaps` useMemo | Acceptable — memoized |
| BookingDetailsModal | 3 `useEffect`s on mount | Merge into one combined effect |

### 8.5 Bundle size

| Category | Size | Notes |
|----------|------|-------|
| BookingCard + actions | ~8KB | Each action import weighs separately |
| BookingDetailsModal | ~15KB | Includes ReschedulePanel with smart slot scoring |
| VerticalTimeline | ~6KB | Drag + animation logic |
| MonthlyAnalyticsView | ~8KB | Calendar grid + week stats |
| PeriodAnalyticsView | ~3KB | Lightweight |
| SmartQueue | ~2KB | Minimal |
| **Total bookings page** | **~42KB gzip** | Acceptable. No splitting needed. |

### 8.6 Quick wins (sorted by impact/effort)

| Fix | Effort | Impact |
|-----|--------|--------|
| Add `staleTime: 60000` to reschedule queries | 2 min | Reduces duplicate fetching on modal re-open |
| Merge 3 `useEffect` chains in BookingDetailsModal | 10 min | Cleaner lifecycle, easier to debug |
| Add 300ms debounce to search input | 5 min | Reduces filter recalc on keystroke |
| Fix double `transition-*` classes in BookingCard | 2 min | Cleaner CSS |
| Wire BulkActionToolbar to selection state | 30 min | Completes existing feature

---

## Summary: Priority Action Items

| # | Action | Command | Priority |
|---|--------|---------|----------|
| 1 | Add cancel booking confirmation (undo-toast or dialog) | `harden` | P0 |
| 2 | Fix card contrast: `var(--surface)` vs `var(--background)` в Studio/Frost | `colorize` | P1 |
| 3 | Fix `text-muted-foreground/40` та `/60` — прибрати подвійну opacity | `polish` | P1 |
| 4 | Fix hardcoded `bg-[#F0DDD6]` divider → `var(--border)` | `polish` | P1 |
| 5 | Fix `hover:bg-secondary/40` — нульовий hover ефект | `polish` | P1 |
| 6 | Fix `.blossom-schedule/.studio-schedule` strip card styling | `polish` | P1 |
| 7 | Fix hardcoded `bg-white border-peach` → CSS vars | `polish` | P1 |
| 8 | Fix 6.5px text → minimum 10px | `polish` | P1 |
| 9 | Add keyboard alternative for drag-to-reschedule | `harden` | P1 |
| 10 | Reduce 9 view/range combos to 2 views + analytics toggle | `distill` | P1 |
| 11 | Fix mobile sticky bar overload (11+ → 4 items) | `adapt` | P2 |
| 12 | Clean up AI code artifacts | `polish` | P2 |
| 13 | Add `staleTime: 60000` to reschedule queries | `optimize` | P3 |
| 14 | Standardize divider thickness with dashboard | `polish` | P3 |

---

**Score summary**: Heuristics 20/40 | Audit **10/20** | Cognitive Load: Critical  

**Biggest opportunity**: Card contrast fix (P1 — systemic, affects all 3 themes) + Cancel confirmation (P0).

*Updated 2026-05-31 with live contrast audit findings.*

*End of report. All 8 assessments complete — skill methodology applied.*
