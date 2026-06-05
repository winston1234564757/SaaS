# 03 — Master Dashboard Domain Map

## 1. Domain Overview

Dashboard — головний екран майстра. Editorial layout (Kinfolk + Aesop + Monocle) з асиметричною Bento-сіткою. Відображає стан бізнесу за 3 секунди: greeting, schedule, метрики, графіки та контекстні віджети.

### Key Files
- `src/app/(master)/dashboard/page.tsx` — Server component page
- `src/app/(master)/dashboard/actions.ts` — Server actions
- `src/components/master/DashboardLayout.tsx` — Shell: sidebar + bottom nav
- `src/components/master/dashboard/FrostDashboard.tsx` — Frost grid
- `src/components/master/dashboard/DashboardGreeting.tsx` — Greeting widget
- `src/components/master/dashboard/DashboardDrawers.tsx` — Drawer manager
- `src/components/master/dashboard/DashboardTourContext.tsx` — Tour engine
- `src/components/master/dashboard/DashboardTourBanner.tsx` — Tour overlay
- `src/components/master/dashboard/TodaySchedule.tsx` — Today's timeline
- `src/components/master/dashboard/widgets/` — All widgets
- `src/components/master/dashboard/widgets/frost/` — Frost-specific widgets

### Key Widgets
| Widget | File | Purpose |
|---|---|---|
| EarningsPulse | `EarningsPulseWidget.tsx` | Revenue today/week/month |
| TodaySchedule | `TodaySchedule.tsx` | Timeline of today's bookings |
| WeeklyChart | `WeeklyChartWidget.tsx` | Bar chart of week revenue |
| PeakHours | `PeakHoursWidget.tsx` | Heatmap of busy hours |
| CancellationRate | `CancellationRateWidget.tsx` | No-show / cancel stats |
| NextFreeDays | `NextFreeDaysWidget.tsx` | Future available slots |
| ChannelHealth | `ChannelHealthWidget.tsx` | Client channel adoption |
| TopServices | `TopServicesWidget.tsx` | Most booked services |
| InsightsRow | `InsightsRow.tsx` | AI tips + top client |
| MetricsStrip | `FrostMetricsStrip.tsx` | Ticker of key numbers |
| AdaptiveContextStrip | `AdaptiveContextStrip.tsx` | Context-aware tips (4 states) |

---

## 2. State Machine

### 2.1 Dashboard Grid States

```
[LOADING] → fetch dashboard stats
  → [READY] → render grid with all widgets populated
  → [PARTIAL] → some widgets loaded, some skeleton
  → [EMPTY] → no data (new master)
  → [ERROR] → fetch failed → retry toast
```

Each widget has independent states:

| Widget State | Description | UI |
|---|---|---|
| LOADING | Data fetching | Skeleton |
| READY | Data available | Full widget |
| EMPTY | No data | Empty state with CTA |
| ERROR | Fetch failed | Error state with retry |
| DISABLED | Feature not available for tier | Locked state |

### 2.2 AdaptiveContextStrip States

```
4 states based on business activity:
  → EMPTY — no bookings today → "Немає записів на сьогодні" + CTA
  → QUIET — 1-2 bookings → "Спокійний день"
  → MODERATE — 3-5 bookings → "Звичайний день"
  → BUSY — 6+ bookings → "Насичений день"
```

### 2.3 Dashboard Tour States

```
7 steps overlay:
  → STEP 0: Greeting (welcome highlight)
  → STEP 1: Schedule (today's timeline highlight)
  → STEP 2: Metrics (earnings strip highlight)
  → STEP 3: Chart (weekly chart highlight)
  → STEP 4: Clients (CRM entry point)
  → STEP 5: Academy (learning center)
  → STEP 6: Complete (tour finished)

  startTour() → show step 0 overlay
  nextStep() → animate to next highlight
  closeTour() → dismiss, save has_seen_tour=true
  restartTour() → from Academy → clear has_seen_tour
```

**States:**
- NOT_SEEN — first visit, auto-show tour
- IN_PROGRESS — step 0-6 active
- COMPLETED — all steps done, has_seen_tour=true
- DISMISSED — user closed early

### 2.4 FreeSlotsWidget → ManualBookingForm

```
FreeSlotsWidget shows next free slots
  → onSlotClick(time, serviceId)
    → FrostDashboard sets WizardSlot state
    → ManualBookingForm mounts with initialServiceId
    → creates booking for that slot
```

**States:**
- SLOTS_AVAILABLE — show slots list
- NO_SLOTS — "Всі слоти зайняті"
- CLICKED → booking form opens
- BOOKED → slot removed from list

### 2.5 Academy States

```
2 tabs:
  → FEATURES (Функції) — 6 sections, 12 articles
  → GOALS (Цілі) — 4 sections, 14 articles
  → Total: 26 articles in accordion
  → "Пройти тур знову" button (restart tour)

Each article:
  → COLLAPSED — accordion closed
  → EXPANDING — AnimatePresence spring open
  → EXPANDED — content visible
  → COLLAPSING — AnimatePresence spring close
```

---

## 3. Environment Matrix

| Environment | Dashboard Layout |
|---|---|
| Desktop (≥1024px) | Full grid: sidebar + topbar + bento grid |
| Tablet (768-1023px) | Grid reflows: 2 columns instead of 4 |
| Mobile (<768px) | Single column, bottom nav instead of sidebar |
| PWA | Same as mobile, standalone |

### Theme Variants
| Theme | Grid Style | Widget Files |
|---|---|---|
| Blossom | Warm taupe | `blossom/*` widgets |
| Studio | Dark teal | `studio/*` widgets |
| Frost | Lavender slate | `frost/*` widgets (primary) |

### Plan Tier Variants
| Tier | Features Available |
|---|---|
| Starter | Basic widgets only (greeting, schedule, earnings) |
| Pro | Full grid: all widgets + analytics |
| Studio | Same as Pro + team widgets |

---

## 4. Load & Concurrency Vectors

| Vector | Risk |
|---|---|
| All widgets fetch simultaneously | 8+ concurrent queries |
| Realtime subscription + widget fetches | Double data flow |
| Tour overlay + widget animations | Layout shift z-index issues |
| Dashboard refresh on visibility change | (useSessionWakeup → invalidateQueries) |
| First paint: load widgets progressively | Skeleton flash |

---

## 5. Data Variations

| Widget | Empty State | Loading State | Error State |
|---|---|---|---|
| TodaySchedule | "Немає записів сьогодні" | Skeleton list | "Не вдалося завантажити розклад" |
| WeeklyChart | "Немає даних за тиждень" | Skeleton bar chart | "Помилка завантаження графіку" |
| PeakHours | "Немає даних про завантаженість" | Skeleton heatmap | — |
| EarningsPulse | "0 ₴" + subtitle | Pulse skeleton | "Помилка розрахунку" |
| TopServices | "Ще немає послуг" + CTA | Skeleton list | — |
| CancellationRate | "0% скасувань" | Skeleton | — |
| NextFreeDays | "Немає вільних слотів" | Skeleton | — |
| ChannelHealth | "0 клієнтів підключено" + CTA | Skeleton | — |
| InsightsRow | "Підказки з'являться тут" | Skeleton | — |

### Boundary Values
| Variable | Min | Max | Edge |
|---|---|---|---|
| Revenue | 0 | 9,999,999+ | Formatting, overflow |
| Booking count | 0 | 50+/day | Scroll overflow |
| Cancellation rate | 0% | 100% | Division by zero |
| Chart bars | 0 | 28 (4 weeks) | Empty week boundaries |
| Tour steps | 0 | 7 | Already seen |
| Academy articles | 0 | 26 | Accordion open all |

---

## 6. Test Vectors

### Unit Tests
- [ ] Tour step calculation (has_seen_tour → show/hide)
- [ ] Adaptive context strip state (booking count → 4 states)
- [ ] Empty state detection per widget (data.length === 0)
- [ ] Revenue formatting (0, 1000, 1000000 → string)
- [ ] Cancellation rate % (0/total → 0%, N/total → N%)
- [ ] Free slots calculation logic
- [ ] Academy article filter (tab + section filtering)

### E2E Tests
- [ ] Dashboard loads with all widgets visible
- [ ] Tour overlay: step 0 → step 6 → complete
- [ ] Tour: close early → doesn't auto-show
- [ ] Tour: restart from Academy → shows again
- [ ] Empty states for new master (no bookings)
- [ ] Create booking from FreeSlotsWidget
- [ ] Schedule widget: click booking → detail
- [ ] Academy: expand all 26 articles → collapse
- [ ] Academy: switch tabs (Функції/Цілі)
- [ ] Theme switch (settings) → dashboard updates
- [ ] Mobile: bottom nav renders correctly
- [ ] Desktop: sidebar navigation works

### Security Tests
- [ ] Dashboard accessible only for master role
- [ ] Client accessing /dashboard → redirect
- [ ] Guest accessing /dashboard → redirect /login

---

## 7. File Inventory

### Page & Layout
- `src/app/(master)/dashboard/page.tsx`
- `src/app/(master)/dashboard/actions.ts`
- `src/app/(master)/layout.tsx`
- `src/components/master/DashboardLayout.tsx`

### Dashboard Core
- `src/components/master/dashboard/FrostDashboard.tsx`
- `src/components/master/dashboard/DashboardGreeting.tsx`
- `src/components/master/dashboard/DashboardDrawers.tsx`
- `src/components/master/dashboard/TodaySchedule.tsx`
- `src/components/master/dashboard/DashboardTourContext.tsx`
- `src/components/master/dashboard/DashboardTourBanner.tsx`

### Widgets
- `src/components/master/dashboard/widgets/EarningsPulseWidget.tsx`
- `src/components/master/dashboard/widgets/AdaptiveContextStrip.tsx`
- `src/components/master/dashboard/widgets/FrostMetricsStrip.tsx`
- `src/components/master/dashboard/widgets/frost/WeeklyChartWidget.tsx`
- `src/components/master/dashboard/widgets/frost/PeakHoursWidget.tsx`
- `src/components/master/dashboard/widgets/frost/CancellationRateWidget.tsx`
- `src/components/master/dashboard/widgets/frost/NextFreeDaysWidget.tsx`
- `src/components/master/dashboard/widgets/frost/InsightsRow.tsx`
- `src/components/master/dashboard/widgets/frost/ChannelHealthWidget.tsx`
- `src/components/master/dashboard/widgets/frost/TopServicesWidget.tsx`

### Hooks
- `src/lib/hooks/useTour.ts`
- `src/lib/hooks/useSessionWakeup.ts`
- `src/lib/hooks/useDeepSleepWakeup.ts`

### DB Tables
- `profiles.has_seen_tour` — Tour completion flag
- `bookings` — Schedule data
- `bookings` (stats) — Analytics data
- `client_master_relations` — CRM stats
