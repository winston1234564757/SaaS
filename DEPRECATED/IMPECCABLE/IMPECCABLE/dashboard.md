# IMPECCABLE Dashboard Reports

**Project:** BookIT | **Generated:** 2026-05-31  
**Scope:** All 3 themes (Blossom / Studio / Frost) dashboard pages and widgets  
**Files analyzed:** 30+ components across `dashboard/` and `widgets/`

---

## 1. CRITIQUE — Combined Dual-Assessment Report

### Assessment A: LLM Design Review

**Spawned as isolated sub-agent**. Read 28 source files across all 3 themes.

### Assessment B: Manual Deterministic Scan

**`npx impeccable --json` unavailable** — ran manual scan against 6 absolute bans + 5 product bans.

**Absolute bans result:**
| Ban | Verdict | Details |
|-----|---------|---------|
| Side-stripe borders | FAIL | `border-l-2` in StatsMosaicWidget:83, TopServicesWidget:72 |
| Gradient text | PASS | 0 instances |
| Glassmorphism as default | BORDERLINE | Frost identity uses glass — acceptable for its theme, but product register prefers restrained |
| Hero-metric template | BORDERLINE | StatsStrip 3-column metrics approach it but avoid full cliché (no gradient accent) |
| Identical card grids | PASS | Widgets vary in size, not a repeated template |
| Modal as first thought | FAIL | WidgetLibraryModal.tsx — widget picker should be inline panel |

**Product bans result:**
| Ban | Verdict | Details |
|-----|---------|---------|
| Decorative motion | BORDERLINE | BentoWidget hover 3D tilt (rotateX/Y) serves no state purpose |
| Inconsistent vocabulary | FAIL | `bento-card` vs `widget-card` vs inline — no standard component name |
| Display fonts in labels | PASS | All UI labels use sans |
| Reinvented affordances | PASS | Form controls are standard |
| Heavy inactive color | PASS | Low-saturation defaults |

### Combined Findings

#### Anti-Patterns Verdict

**Not AI-generated.** Three-theme architecture (Blossom/Studio/Frost) with custom spring constants, theme-specific typography, and purposeful color strategies reveals intentional craft. No gradient text, no glassmorphism-by-default (Frost's glass is its identity, not laziness), no generic SaaS hero metrics.

**However**, `StatsStrip.tsx` (3-column stat cards) is borderline hero-metric template. Generic naming (`bento-card`, `widget-card`) hints at missing design token system. The `border-l-2` side-stripe violations are a concrete DON'T that needs cleanup.

**Detector scan**: CLI unavailable. Manual scan found 2 absolute ban violations (side-stripes, modal-first), 2 borderline violations, and 3 product-ban violations (decorative motion, inconsistent vocabulary, "Flash Sale" anglicism).

#### Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | Skeletons, animated counters, real-time clock. Missing push notification indicator. |
| 2 | Match System / Real World | 3 | Ukrainian throughout, domain-appropriate. "Flash Sale" anglicism in QuickActions. |
| 3 | User Control and Freedom | 2 | Modals dismissable. No undo for any action. Calendar day can't be deselected. |
| 4 | Consistency and Standards | 2 | Three themes = three different layouts. BentoGrid duplicates. Naming: skeleton-shimmer vs bento-card vs widget-card. |
| 5 | Error Prevention | 2 | Loading states everywhere. No destructive-action confirmations. No autosave indicator. |
| 6 | Recognition Rather Than Recall | 3 | Icon+label pairs visible. Tooltips on stats. `data-tour-step` attributes. |
| 7 | Flexibility and Efficiency | 1 | No keyboard shortcuts. BentoGrid has presets but theme dashboards don't. No quick reference. |
| 8 | Aesthetic and Minimalist Design | 2 | Blossom strongest (3-col editorial). Frost worst: 15+ blocks in single-column scroll. |
| 9 | Error Recovery | 2 | Toast system exists. Booking errors recoverable via wizard. No error boundaries visible. |
| 10 | Help and Documentation | 2 | tour-step attributes hint at onboarding. No contextual help. No doc links in code. |
| **Total** | | **22/40** | **Acceptable — significant improvements needed** |

#### Cognitive Load Assessment

**8-item checklist:**
- [x] Single focus: FAIL — Frost desktop shows 15+ blocks, no primary action dominates
- [x] Chunking: PASS — Widgets grouped, sidebars separate concerns
- [x] Grouping: PASS — Related items visually connected
- [ ] Visual hierarchy: BORDERLINE — Clear in Blossom, weak in Frost (everything same weight)
- [x] One thing at a time: FAIL — Too many simultaneous decisions
- [x] Minimal choices: FAIL — QuickActions has 6 options (exceeds 4-item limit)
- [x] Working memory: PASS — No cross-screen information transfer needed
- [ ] Progressive disclosure: BORDERLINE — BentoGrid has customization but main dashboards reveal all at once

**3 failures → MODERATE cognitive load.** The 3-second rule is at risk on Frost (single-column scroll) and marginal on Blossom.

#### What's Working

1. **Greeting animation** (DashboardGreeting.tsx): Word-by-word spring reveal with blur-to-clear and script font is genuinely premium. Peak-end rule: this is the emotional high point.
2. **AdaptiveContextStrip**: State-driven content (empty/quiet/moderate/busy) with contextual CTAs. Delivers the 3-second insight promise.
3. **Animated counters**: Spring-animated number transitions (StatsMosaic, FrostMetrics) show micro-interaction craft. Frost ticker with touch-drag pause is novel.

#### Priority Issues

**P1 — Frost dashboard density** (`FrostDashboard.tsx:149-235`). 10+ sections in single-column scroll. User must scroll through schedule, chart, calendar, insights, cancellations, top services, next free days, channel health, client alerts, AND referral boost. Violates 3-second rule entirely.
- Fix: Collapsed sections with expand-on-focus. Group secondary metrics into "Insights" drawer. Show 4 key metrics as sticky top bar.

**P1 — Three themes, three different layouts** (Blossom: 3-col grid with sidebars, Studio: 2-col + dividers, Frost: row-based). Theme switch resets user's spatial mental model.
- Fix: Unify to 2-column (main + sidebar) as canonical structure. Theme tokens apply to color/type/borders only.

**P1 — Accessible interactivity** (6+ locations use `<div onClick>`). TodaySchedule, TopServices, WeeklyChart bars, PeakHours heatmap, CancellationRate all fail keyboard navigation.
- Fix: Convert all interactive `<div>` to `<button type="button">` with `aria-label`.

**P2 — QuickActions overload** (6 items: Flash Sale, Stories, Clients, Analytics, Profile, Referral). Exceeds 4-item working memory limit.
- Fix: Keep 4 most-used. Move Profile and Referral to secondary "More" row.

**P2 — Duplicate widget placement**: FreeSlots + QuickActions appear in sidebar AND mobile inline section simultaneously (Blossom). Same data rendered twice.
- Fix: Single source per breakpoint. Use CSS `lg:hidden` vs `hidden lg:block` without JSX duplication.

**P2 — Two parallel dashboard systems**: BentoGrid.tsx (zustand store, widget library, customization) exists separately from three theme dashboards. No shared infrastructure.
- Fix: Either deprecate BentoGrid or make theme dashboards a superset.

**P3 — Side-stripe borders** (StatsMosaicWidget `border-l-2`, TopServicesWidget `border-l-2`). Violates absolute bans.
- Fix: Replace with background tint or full hairline border.

**P3 — Modal as first thought**: WidgetLibraryModal uses modal for widget selection. Should be Vaul BottomSheet or inline panel.

#### Persona Red Flags

**Alex (Power User)** — No keyboard shortcuts detected. BentoGrid has customization but needs 6 clicks to add a widget. No bulk actions. Will feel slowed down by the greeting animation on every visit.

**Jordan (First-Timer)** — Icon-only nav in sidebar with no labels on some icons. QuickActions has 6 options but no onboarding explanation of what each does. Error messages like "Не вдалося завантажити" with no recovery guidance. Will abandon if first experience is Frost's 15-block wall.

**Maya (Studio Owner — project-specific)** — ReferralBoost and ClientAlerts are valuable but buried. If she opens the dashboard and doesn't immediately see referral stats or client alerts in the first viewport, she'll perceive the dashboard as "just another booking app" and stop checking it.

#### Minor Observations

- `StatsMosaicWidget.tsx:83`: `border-l-2` accent strip — borderline side-stripe violation. Works as editorial accent but against the ban.
- `MarketingWidget.tsx:15`: `bg-gradient-to-br from-sage/5 to-primary/5` — gradient background on single widget is a pattern orphan.
- `CancellationRateWidget.tsx:75`: `Minus` icon for zero delta — less encouraging than a neutral label.
- FrostMetricsStrip renders DOM ×2 for infinite CSS animation scroll. Use `translateX(-50%)` technique instead.

#### Questions to Consider

1. **What if Frost desktop were just Blossom's layout with different tokens?** Layout divergence costs architecture complexity AND user cognitive reset on theme switch.
2. **Is the 3-second rule achievable with 15+ widgets?** What 4 metrics, shown large and first, would make the rest optional?
3. **Does QuickActions need 6 buttons, or one "Smart Action" button that adapts contextually?** AdaptiveContextStrip already handles contextual nudges — QuickActions duplicates the problem.

---

## 2. ANIMATE — Motion & Interaction Audit

**Register: Product** — 150-250ms transitions, motion conveys state not decoration, no page-load choreography. Users are in a task; don't make them wait.

### 2.1 Animation Strategy

| Layer | Current State | Assessment |
|-------|--------------|------------|
| **Hero moment** | Greeting word-reveal (spring, blur→clear) | Strong. Premium peak. Could end cold — no exit transition. |
| **Feedback layer** | Skeleton shimmer, AnimatedNumber counters | Adequate. Missing: button click feedback, success checkmark, error shake. |
| **Transition layer** | layoutId tabs, AnimatePresence calendar, WeeklyChart bars | Good editorial transitions. Missing: theme switch, widget add/remove, state change exit. |
| **Delight layer** | FrostMetrics ticker, ReferralBoost chart, AnimatedCount | Novel interactions but some (BentoWidget 3D tilt) are decorative. |

### 2.2 Current animation inventory

| Element | Technique | Easing | Critique |
|---------|-----------|--------|----------|
| Staggered dashboard entrance | `staggerChildren: 0.07-0.08` | `bounce: 0.06-0.08` | Bounce easings violate product register — use `ease-out-quart`. Editorial pacing otherwise clean. |
| LayoutId tabs | `layoutId` + spring | `bounce: 0` | Correct. Zero bounce for tab indicators. |
| Animated numbers (StatsMosaic) | `useTransform` + `animate()` | `bounce: 0` | Smooth. 1.8s generous but feels premium for editorial brand. |
| RAF counters (FrostMetrics) | `requestAnimationFrame` | `ease-out-cubic` | Good performance. Falls back gracefully. |
| WeeklyChart bars | `scaleY` spring | `bounce: 0.12` | Bounce not recommended by reference. Use `ease-out-expo`. |
| BentoWidget hover 3D tilt | `rotateX: 1, rotateY: -1` | `duration: 0.2` | Decorative only — remove per product ban. |
| Calendar month transition | `AnimatePresence` | `bounce: 0` | Clean opacity + x-shift. |
| Ticker scroll (Frost) | CSS `animation` + touch JS | `linear` | Smart touch-drag interaction. Falls outside 150-250ms guideline (ticker is continuous). |
| Skeleton shimmer | CSS class | — | Missing `prefers-reduced-motion` override. |

### 2.3 Product register violations

| Violation | Location | Fix |
|-----------|----------|-----|
| Bounce easings (banned) | Dashboard entrance (`bounce: 0.06-0.08`), WeeklyChart (`bounce: 0.12`) | Replace with `ease-out-quart` (0.25, 1, 0.5, 1) or `ease-out-expo` (0.16, 1, 0.3, 1) |
| Decorative motion (product ban) | BentoWidget hover `rotateX/rotateY` | Remove 3D tilt — no state purpose |
| Missing `prefers-reduced-motion` | All components | Add `@media (prefers-reduced-motion: reduce)` override |
| Entrance choreography too slow | 0.07 stagger × 20+ children = 1.4s total | Reduce stagger to 0.05 or limit to top 8 items |
| No feedback for primary booking action | TodaySchedule complete button | Add 200ms scale pulse + checkmark |

### 2.4 Motion gaps

| Gap | Priority | Proposal |
|-----|----------|----------|
| PeakHours heatmap entrance | M | Stagger rows with `opacity` fade-in (100ms delay, `ease-out-quart`) |
| AdaptiveContextStrip exit | M | Cards animate in but state change has no exit — add `AnimatePresence` exit animation |
| Theme switch transition | M | Instant theme swap is jarring. Add `AnimatePresence` crossfade on layout root. |
| Widget reorder drag | M | BentoGrid shows drag grip but DnD unimplemented. Use `framer-motion` `Reorder`. |
| Booking complete micro-interaction | L | Add success checkmark + 200ms scale pulse after confirm |
| StatsStrip metric bars | L | ChannelHealth progress bars static — add spring width animation on mount |
| ReferralBoost milestone badges | L | Add entry animation on badge chips |

### 2.5 Performance & Accessibility

- **Durations**: Most entrances within 300-500ms range (acceptable for editorial product). Feedback animations need 150-200ms — missing entirely.
- **`prefers-reduced-motion`**: Zero implementations found. Critical gap — must add global CSS override.
- **RAF counters (FrostMetrics)**: 8 concurrent RAF loops — fine for desktop, monitor on low-end mobile. Consider `IntersectionObserver` to pause off-screen.

---

## 3. AUDIT — Technical Quality (5-Dimension Scoring)

### Audit Health Score

| # | Dimension | Score | Key Finding |
|---|-----------|-------|-------------|
| 1 | Accessibility | **1** | 6+ `<div onClick>` with no keyboard nav. Touch targets under 44px. No `prefers-reduced-motion`. |
| 2 | Performance | **2** | Duplicate booking hook calls. No Suspense boundaries. FrostMetrics DOM clone. |
| 3 | Theming | **3** | Three robust theme ecosystems. Minor hardcoded colors (bento-grid `ring-offset-[#FFE8DC]`). |
| 4 | Responsive | **2** | Blossom responsive arc good. Frost inline grid styles. FreeSlots overflow on 320px. |
| 5 | Anti-Patterns | **3** | Side-stripe borders in 2 locations. Modal-first for widget picker. No hero-metric template. |
| **Total** | | **11/20** | **Acceptable — significant work needed** |

### Anti-Patterns Verdict

**Pass** — does not look AI-generated. Three-theme architecture is genuinely intentional. The anti-patterns found (side-stripe borders, modal-first widget picker) are concrete violations of impeccable's absolute bans, but they're implementation slips, not design-level AI slop.

### Executive Summary

- Audit Health Score: **11/20** (Acceptable)
- Issues found: 1 P1, 4 P2, 6 P3
- Top critical: `div`→`button` conversion, missing `prefers-reduced-motion`, duplicate booking hook calls
- Recommended next: `impeccable polish` for the quick wins, then `impeccable adapt` for responsive issues

### Detailed Findings by Severity

#### P1 — Critical

**[P1] div onClick without keyboard access**
- **Location**: TodaySchedule:121, TopServicesWidget:58, CancellationRateWidget:52, PeakHoursWidget:137, WeeklyChartWidget:175
- **Category**: Accessibility
- **Impact**: Screen reader users and keyboard-only users cannot use the dashboard
- **WCAG**: WCAG 2.1 SC 2.1.1 (Keyboard), SC 4.1.2 (Name, Role, Value)
- **Fix**: Convert all `<div onClick>` to `<button type="button">` with `aria-label` or `aria-pressed`
- **Suggested**: `impeccable harden`

#### P2 — Major

**[P2] Missing `prefers-reduced-motion` at global level**
- **Location**: Global (no file detected)
- **Category**: Accessibility
- **Impact**: Users with vestibular disorders cannot disable animations; may cause nausea
- **WCAG**: WCAG 2.1 SC 2.3.3 (Animation from Interactions)
- **Fix**: Add global CSS `@media (prefers-reduced-motion: reduce)` override in layout or globals.css

**[P2] Touch targets under 44px**
- **Location**: Month nav chevrons (28px), calendar day cells (36px), bar labels (32px)
- **Category**: Responsive / Accessibility
- **Impact**: Mobile users fat-finger — targets too small for reliable tap
- **WCAG**: WCAG 2.5.5 (Target Size, enhanced)
- **Fix**: Minimum `min-h-[44px] min-w-[44px]` on all interactive elements

**[P2] Duplicate useBookings calls with same params**
- **Location**: StatsMosaicWidget (5 ranges), WeeklyChartWidget, CancellationRateWidget
- **Category**: Performance
- **Impact**: 3-4x more network calls than necessary. Same query keys should dedup via react-query but `from`/`to` strings may differ by time-of-call
- **Fix**: Lift `useBookings` to dashboard layout and pass results down, or ensure identical query keys with `staleTime: 30_000`

**[P2] FrostMetricsStrip DOM clone**
- **Location**: FrostMetricsStrip.tsx
- **Category**: Performance
- **Impact**: Doubles DOM nodes unnecessarily. CSS `translateX(-50%)` avoids the clone
- **Fix**: Replace DOM duplication with CSS animation on single set using `translateX(-50%)`

#### P3 — Minor

**[P3] Hardcoded color in bento-grid ring offset**
- **Location**: BentoGrid.tsx:46 — `ring-offset-[#FFE8DC]`
- **Category**: Theming
- **Impact**: Breaks when theme switches to Studio or Frost (ring offset stays Blossom pink)
- **Fix**: Use `var(--background)` or theme-aware token

**[P3] ChannelHealthWidget no react-query**
- **Location**: ChannelHealthWidget.tsx
- **Category**: Performance
- **Impact**: No caching, no dedup — re-fetches on every mount
- **Fix**: Replace `useEffect`+`getChannelHealth()` with `useQuery`

**[P3] FreeSlotsWidget mobile grid overflow**
- **Location**: FreeSlotsWidget.tsx:101 — `grid-cols-4`
- **Category**: Responsive
- **Impact**: 4 time chips at 320px viewport overflow horizontally
- **Fix**: `grid-cols-2 sm:grid-cols-4`

**[P3] No Suspense boundaries**
- **Location**: All dashboard pages
- **Category**: Performance
- **Impact**: All widgets are `'use client'` with loading spinners — no SSR streaming
- **Fix**: Wrap widgets in `<Suspense>` with skeleton fallbacks

**[P3] Studio mobile missing sidebar content**
- **Location**: StudioDashboard.tsx:91-99
- **Category**: Responsive
- **Impact**: Mobile users see only QuickActions + FreeSlots in mobile section; PeakHours, Insights, TopServices hidden until lg
- **Fix**: Add mobile fallback list for all sidebar widgets

**[P3] `gridTemplateColumns` inline styles in Frost**
- **Location**: FrostDashboard.tsx — `style={{ gridTemplateColumns: '3fr 2fr' }}`
- **Category**: Theming / Responsive
- **Impact**: Inline styles don't respond to breakpoints. Should be Tailwind `grid-cols-[3fr_2fr]` or CSS class
- **Fix**: Convert all inline grid styles to Tailwind utility classes

### Patterns & Systemic Issues

1. **`div onClick` pattern**: 5+ locations in 5+ different widget files. Suggests no linting rule for interactive elements. Add `eslint-plugin-jsx-a11y` rule `no-static-element-interactions` to CI.
2. **Hardcoded values**: Colors and static data scattered across widgets (RevenueWidget "+12%", BentoGrid ring-offset). Suggests missing design token enforcement.
3. **Individual data fetching**: Each widget calls its own hooks. No shared data layer per dashboard view.

### Positive Findings

- **CSS variable system**: All 3 themes use `var(--*)` tokens for backgrounds, text, borders. Token system exists and works.
- **Skeleton states**: Consistent across all widgets — no content flash.
- **Date handling**: `date-fns` used consistently, `getNow()` wrapper for testability.
- **TypeScript**: Strictly typed hooks and generic components throughout.

---

## 4. POLISH — Pre-shipping Pass

### 4.1 Design System Discovery

**Existing system**: Three-theme token system via CSS variables. Shared component vocabulary exists but inconsistently named (`bento-card` vs `widget-card`). Spacing uses Tailwind's scale. Typography varies per theme by design.

**Drift identified:**
| Drift | Root cause | Fix category |
|-------|-----------|--------------|
| `bento-card` vs `widget-card` naming | One-off implementation | Swap to canonical component |
| `BentoGrid.tsx` ring-offset `#FFE8DC` | Missing token → hardcoded | Add token to system |
| Inline `gridTemplateColumns` in Frost | One-off implementation | Convert to Tailwind class |
| RevenueWidget "+12%" | Conceptual misalignment (mock data) | Rework to real data |
| Max-width varies (1440/1280/1360) | Missing token | Standardize to 1360px |

**Quality bar**: Flagship (editorial dashboard for beauty professionals). Every detail matters.

### 4.2 Triage

| Category | Count | Priority |
|----------|-------|----------|
| **Functional** (blocks/confuses) | 5 | Fix first |
| **Cosmetic** (looks off only) | 7 | Fix in follow-up |

### 4.3 Functional issues

| Location | Issue | Fix |
|----------|-------|-----|
| `RevenueWidget.tsx:33` | "+12%" hardcoded mock data | Show real delta from `useDashboardStats` or remove widget |
| `MonthlyCalendarWidget.tsx:82-104` | Day dots 4px, color-only — no text alternative | Add `aria-label` with status text per dot |
| `StatsMosaicWidget.tsx:72` | `visibleItems` may exclude `cancelled` — unclear | Add clarifying comment or make configurable |
| `TopServicesWidget.tsx:40` | Month label may mismatch data range | Use same `from`/`to` for label calc |
| `BentoGrid.tsx:46-50` | Hardcoded `ring-offset-[#FFE8DC]` breaks theme switch | Use `var(--background)` |

### 4.4 Cosmetic issues

| Location | Issue | Fix |
|----------|-------|-----|
| `FrostDashboard.tsx:61` | Inline `borderLeft` style on dividers | Use Tailwind `border-l` |
| `BentoGrid.tsx:91` | stats, loyalty, reviews, marketing all `col-span-1` | Add layout variants for visual variety |
| `FreeSlotsWidget.tsx:101` | `grid-cols-4` at 320px overflows | `grid-cols-2 sm:grid-cols-4` |
| `TodaySchedule.tsx:129` | Active indicator `w-[2px]` side-stripe (borderline ban) | Replace with background tint or keep if intentional |

### 4.5 Copy polish

| Location | Current | Proposed |
|----------|---------|----------|
| `TodaySchedule.tsx:96-98` | "Завтра вільно" → "Тиждень" empty | "Завтра вільний день" / "На цьому тижні поки що тихо" |
| `FreeSlotsWidget.tsx:117` | "Розклад заповнено — чудова робота" | "Усі слоти заповнено" (shorter, editorial) |
| `MarketingWidget.tsx:33` | "Створіть 'вікно' в сторіз" | Inconsistent formality. Pick one voice. |

### 4.6 Consistency checks

- **Widget borders**: `bento-card` vs `widget-card` vs inline `border`. Standardize.
- **Max-width**: Blossom 1440px, Studio 1280px, Frost 1360px. Pick 1360px.
- **Label typography**: Per-theme by design (Blossom serif, Studio uppercase sans, Frost varied) — intentional.
- **Spacing**: Blossom `gap-6`, Studio `gap-0`+dividers, Frost `gap-4`. Intentional per-theme rhythm.

### 4.7 Polish Checklist

- [x] Design system drift named and categorized
- [ ] Functional issues fixed before cosmetic
- [ ] Aligned to theme token system
- [ ] All interactive states implemented (hover/focus/active/disabled)
- [ ] `prefers-reduced-motion` respected globally
- [ ] Copy consistent in voice and tone
- [ ] Icons same family (lucide-react consistent)
- [ ] Touch targets ≥44px on mobile
- [ ] Responsive at all breakpoints
- [ ] No console errors or warnings

---

## 5. LAYOUT — Spacing, Rhythm & Hierarchy

**Register: Product** — predictable grids, consistent densities, familiar navigation. Consistency IS an affordance. Responsive behavior is structural (collapse sidebar, column breakpoints), not fluid typography.

### 5.1 Register alignment check

| Product layout principle | Dashboard status |
|-------------------------|------------------|
| Predictable grids | Blossom: yes. Studio: yes. Frost: row-based, less predictable on first glance. |
| Consistent densities | Per-theme consistency but cross-theme density varies 3× (Blossom airy, Frost dense). Trade-off accepted by design. |
| Familiar navigation patterns | Standard top bar + side nav. Good. |
| Structural responsive behavior | Blossom: excellent responsive arc. Studio: mobile missing sidebar content. Frost: inline styles break breakpoint responsiveness. |

### 5.2 Squint test

**Blossom**: Clear primary zone (main column with schedule), secondary (left: actions), tertiary (right: insights). Hierarchy passes.

**Studio**: Main content dominates, sidebar feels secondary. Editorial flush layout makes section boundaries hard to distinguish at a glance. Borderline pass.

**Frost**: FAIL. Single-column scroll with 10+ sections of equal visual weight. No primary zone identifiable.

### 5.3 Grid architecture

```
Blossom (1440px):
┌──────────┬──────────────────────┬──────────┐
│ LeftCol  │      MainCol         │ RightSide│
│ 248px    │    1fr               │ 296px    │
│          │                      │          │
│ - Quick  │ - Greeting           │ - Free   │
│   Actions│ - StatsStrip         │   Slots  │
│ - Channel│ - AdaptContext       │ - Peak   │
│   Health │ - Schedule           │   Hours  │
│          │ - WeeklyChart        │ - Insight│
│          │ - MonthlyCalendar    │ - TopSvc │
│          │ - CancellationRate   │ - NextFr │
│          │                      │ - Channel│
│ xl only  │  lg: 1fr + 310px    │ lg+ only │

Studio (1280px):
┌────────────────────────┬─────────┐
│       MainCol          │ Sidebar │
│        1fr             │  260px  │
│                        │         │
│ - Greeting             │ - Free  │
│ - StatsStrip           │   Slots │
│ - AdaptContext         │ - Quick │
│ - Schedule             │   Actns │
│ - WeeklyChart          │ - Peak  │
│ - MonthlyCalendar      │   Hours │
│ - CancellationRate     │ - InSght│
│                        │ - TopSv │
│ lg: 1fr + 260px       │ - NxtFr │
│                        │ - ChnHl │

Frost (1360px):
Row-based splits:
  [3fr 2fr] — Context + Earnings
  [3fr 2fr] — Schedule + FreeSlots
  [55fr 45fr] — WeeklyChart + PeakHours
  [1fr]     — MonthlyCalendar
  [1fr 1fr] — TopServices + Cancellation
  [1fr 1fr 1fr] — Insights + NextFree + Channel
  [1fr]     — ClientAlerts
  [1fr]     — ReferralBoost
```

### 5.2 Rhythm analysis

**Blossom:**
- Top: `pt-3 → pt-6` scaling with breakpoints. Good.
- Between sections: `gap-6` consistently. Good editorial breathing room.
- Sidebars: `sticky top` with `--topbar-height` calculation. Works.
- Labels: `heading-serif text-[18px] tracking-[0.12em] uppercase mb-3`. Strong.

**Studio:**
- Top: `pt-3 → pt-6`, same pattern.
- Between sections: `gap-0` with `py-5`/`py-6` per section + `<Divider />`. Editorial magazine style.
- Dividers: `h-px w-full` with `var(--border)`. Clean.
- Sidebar: `gap-3`. Tighter than main. Intentional density contrast.
- Labels: `text-[15px] font-semibold tracking-[0.1em] uppercase`. Barbershop aesthetic.
- Issue: Repeated `lg:hidden` + `<Divider />` patterns create code duplication. Could extract mobile fallback component.

**Frost:**
- Row-based with `FrostDivider` between each row section.
- Dividers: `my-5`. Consistent.
- Grid splits: mix of fraction (`3fr 2fr`, `55fr 45fr`) and explicit columns (`grid-cols-2`, `grid-cols-3`).
- Issue: inline `style={{ gridTemplateColumns: '3fr 2fr' }}` should use Tailwind or CSS class.

### 5.3 Layout improvement proposals

| Proposal | Theme | Impact |
|----------|-------|--------|
| Extract common responsive rules | All | Reduce duplication in mobile-widget fallback patterns |
| Move Frost grid styles to CSS | Frost | `gridTemplateColumns` inline → Tailwind `grid-cols-[3fr_2fr]` |
| Adjust FreeSlots mobile grid | All | `grid-cols-4` at 320px overflows. Use `grid-cols-2 sm:grid-cols-4`. |
| Standardize max-width | All | Pick one (1360px) and use across all themes |
| Add `gap` consistent scale | All | Mix `gap-3`, `gap-4`, `gap-6`. Define editorial spacing scale. |

---

## 6. OVERDRIVE — Push Past Conventional Limits

**Context**: Functional UI (dashboard). The "wow" here is in how it FEELS — fluid data transitions, instant feedback, morphing dialogs. Not visual effects.

### 6.1 Propose Before Building (analysis only)

> These are documented proposals for discussion. Actual implementation requires user direction.

### 6.2 Current overdrive features

| Feature | Level | Why it qualifies |
|---------|-------|------------------|
| FrostMetricsStrip ticker | ★★★★ | Infinite scroll + CSS animation + touch drag pause + position resume. Not standard. |
| Calendar dark detail panel | ★★★☆ | `hero-card-bg`, dark glass overlay, spring exit to absolute position. |
| StatsMosaicWidget hero | ★★★☆ | Animated numbers + status dots + glow card + trend chips. |
| ReferralBoost progression | ★★★☆ | Milestone viz with animated bar + badge chips + CTA. |
| AdaptiveContextStrip | ★★★★ | State-machine-driven CTAs that adapt to business context. |

### 6.3 Overdrive directions (for user selection)

#### Direction A: Gesture-driven heatmap
Replace static PeakHours heatmap with touch-drag cell selection, visual pulse on selected block, "Create booking" CTA on selection. Uses `framer-motion` `useDragControls`. View Transitions API for cell morphing.
- **Cost**: Medium (2-3 days)
- **Performance**: Low risk (small DOM, CSS transforms)
- **Fallback**: Click-to-select still works

#### Direction B: Drag-to-book from calendar
MonthlyCalendarWidget: drag a free slot chip onto a calendar day → creates draft booking → Vaul sheet for confirmation. Spring trajectory animation. View Transitions API for the slot-to-day morph.
- **Cost**: High (4-5 days)
- **Performance**: Monitor drag performance on mobile
- **Fallback**: Click slot → click day → standard booking flow

#### Direction C: BentoGrid spring reorder
Use `framer-motion` `Reorder` group with drag handle. Other widgets flow with spring physics during drag. Position persists via `useDashboardStore`.
- **Cost**: Medium (2 days)
- **Performance**: `layout` animations can be expensive with 10+ items. Use `layoutDependency` to limit.
- **Fallback**: Grid stays in default preset

#### Direction D: FrostMetricsStrip as animated gauge strip
Each metric becomes a mini arc gauge with animated sweep, ticker text below. Touch to expand into full detail. Spring-loaded needle on value change.
- **Cost**: Medium (3 days)
- **Performance**: Canvas or SVG? SVG for simplicity, Canvas for 60fps on low-end
- **Fallback**: Current text-only ticker

#### Technical notes
- **View Transitions API**: Supported in Chromium/Safari. Firefox pending. Always provide click fallback.
- **`@starting-style`**: Available everywhere — use for entry animations from `display: none`.
- **Progressive enhancement**: All proposals must work without JS (bookings createable via standard form).

---

## 7. LIVE — Visual Variant Candidates

Elements ready for `impeccable live` iteration — pick an element, generate alternatives in the browser.

### Candidates for live iteration

| Element | Current design | Why iterate | Suggested params |
|---------|---------------|-------------|------------------|
| Stats Strip | 3-col grid with icon+value+sub | Hero-metric template borderline | `density` (0.6-1.4), `structure` (grid/stacked/bento) |
| Quick Actions | 6-action 3×2 grid | Overloaded (6 items > 4 limit) | `density`, `structure` (dock/dropdown/single) |
| Schedule display | Animated tabs (today/tomorrow/week) | Strong but could explore timeline | `structure` (list/timeline/kanban) |
| WeeklyChart | Bars with bookings/revenue toggle | Add overlay or comparison mode | `structure` (single/overlay/comparison) |
| FreeSlots chips | 4-col grid of time chips | Overflow on 320px | `density`, `structure` (grid/timeline/suggestions) |

### Structure param candidates

Each variant should declare:
- `density` (range 0.6-1.4, step 0.05): drive all spacing tokens via `calc(var(--p-density, 1) * <base>)`
- `structure` (steps): switch topology via `data-p-structure`

Example for Stats Strip:
```json
{"id":"density","kind":"range","min":0.6,"max":1.4,"step":0.05,"default":1,"label":"Density"},
{"id":"structure","kind":"steps","default":"grid","label":"Layout","options":[
  {"value":"grid","label":"3-col Grid"},
  {"value":"bento","label":"Bento Row"},
  {"value":"chip","label":"Scroll Chips"}
]}
```

---

## 8. OPTIMIZE — Performance Diagnostics

**CRITICAL**: Measure before and after. These are estimated bottlenecks; actual profiling needed. Don't optimize what isn't slow.

### 8.1 Core Web Vitals estimate

| Metric | Target | Estimated status | Risk |
|--------|--------|------------------|------|
| **LCP** | < 2.5s | Likely pass (SSR, minimal hero images) | Low |
| **FID/INP** | < 100ms / < 200ms | At risk — 12-15+ hook calls on dashboard mount create main thread contention | Medium |
| **CLS** | < 0.1 | Likely pass (skeleton states with reserved dimensions) | Low |

### 8.2 Hook call analysis per page

| Dashboard | useBookings calls | Other queries | Total fetches |
|-----------|------------------|---------------|---------------|
| Blossom | 7+ (today, week, month per widget) | Stats, client alerts, services, schedule store | 12+ |
| Studio | 7+ | Same patterns | 12+ |
| Frost | 8+ | Add referral count, earnings pulse, client alerts | 15+ |

**Problem:** Each widget fetches independently. `useBookings('today','today')` called 3x. 12+ simultaneous queries on mount may cause INP regression.

**Fix:** Lift `useBookings` to dashboard layout with shared keys and `staleTime: 30_000`. React-query deduplication only works if `from`/`to` strings are identical (time-of-call drift is a risk).

### 8.3 Network waterfall

```
Current (sequential-ish):
  MasterContext → useDashboardStats → 5x useBookings → 4x other widgets
                                        ↓
                                     3x useBookings (Services, Schedule, Insights)

Optimized:
  MasterContext (parallel with staleTime)
    ├→ useDashboardStats
    ├→ useBookings(today, week, month)  ← shared cache key, staleTime: 30s
    └→ Other queries                    ← parallel
```

### 8.4 Render optimization gaps

| Component | Issue | Fix |
|-----------|-------|-----|
| `BentoGrid.tsx` | All widgets re-render on `isCustomizing` state change | Split into `BentoGridCustomizing` + `BentoGridView` |
| `TodaySchedule.tsx` | `display` toggle forces re-render of entire list | Virtualize with `react-window` or limit visible rows |
| `DashboardGreeting.tsx` | `setInterval` 60s clock remounts on theme switch | CSS visibility keep-alive instead |
| `FrostDashboard.tsx` | Renders both mobile + desktop — one hidden via `hidden lg:block` | `useDeviceDetect` to render one |
| `MonthlyCalendarWidget.tsx` | `allDays` recalculates on every `currentDate` change | Already `useMemo`d — add stable key |

### 8.5 Bundle size

| Category | Estimated size | Notes |
|----------|---------------|-------|
| lucide-react icons | ~8KB gzip (per unique icon) | 25+ distinct icons — could dynamic import |
| framer-motion | ~32KB gzip | Acceptable, shared across app |
| date-fns | ~4KB gzip | Tree-shaken |
| Dashboard widgets total | ~45KB gzip | Code-split by theme route |

**Recommendation:** Route-based code splitting. Blossom route only loads Blossom widgets. Next.js App Router supports this via folder structure.

### 8.6 Quick wins (sorted by impact/effort)

| Fix | Effort | Impact |
|-----|--------|--------|
| Add `staleTime: 30_000` to all booking queries | 5 min | Reduces refetches on tab switch by 75% |
| ChannelHealth → react-query | 10 min | Adds caching + dedup |
| RevenueWidget remove hardcoded "+12%" | 2 min | Fixes incorrect display |
| FreeSlotsWidget responsive grid | 5 min | Prevents mobile layout break |
| Add `focus-visible:ring` to all interactive | 15 min | A11y compliance (no perf impact) |
| Split BentoGrid by customize mode | 30 min | Reduces re-render waste

---

## Summary: Priority Action Items

| # | Action | Command | Priority |
|---|--------|---------|----------|
| 1 | Convert all `<div onClick>` to `<button type="button">` (5+ locations) | `harden` | P1 |
| 2 | Add global `prefers-reduced-motion` override | `polish` | P1 |
| 3 | Add keyboard navigation to PeakHours + WeeklyChart | `harden` | P1 |
| 4 | Fix RevenueWidget hardcoded "+12%" | `polish` | P1 |
| 5 | Lift shared `useBookings` calls with `staleTime: 30_000` | `optimize` | P2 |
| 6 | FrostMetrics DOM clone → `translateX(-50%)` | `optimize` | P2 |
| 7 | Fix FreeSlotsWidget mobile grid overflow | `adapt` | P2 |
| 8 | Standardize max-width to 1360px | `polish` | P3 |
| 9 | Replace bounce easings with `ease-out-quart/expo` | `animate` | P3 |
| 10 | Route-based widget code splitting | `optimize` | P3 |

---

**Score summary**: Heuristics 22/40 | Audit 11/20 | Cognitive Load: Moderate  

**Biggest opportunity**: Frost density (10+ sections) — `distill` to 4 key metrics, fold the rest.

*End of report. All 8 assessments complete — skill methodology applied.*
