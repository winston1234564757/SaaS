# Wave 2 — Batch 3: Dashboard Widgets Core (20 files)
**8 instruments: critique A+B + audit + animate + overdrive + polish + layout + optimize**
**Date: 2026-06-02 | Sub-agent: ses_17af6f04effeUc4LuvN6AcoW6r**

## Scores

| File | Score | P0 | P1 | P2 | P3 |
|------|-------|----|----|----|----|
| ActivityWidget.tsx | 30/40 | 0 | 0 | 3 | 1 |
| AdaptiveContextStrip.tsx | 38/40 | 0 | 0 | 0 | 2 |
| CancellationRateWidget.tsx | 30/40 | 0 | 0 | 3 | 0 |
| ChannelHealthWidget.tsx | 29/40 | 0 | 0 | 3 | 1 |
| ClientAlertsWidget.tsx | 32/40 | 0 | 0 | 2 | 1 |
| EarningsPulseWidget.tsx | 29/40 | 0 | 1 | 1 | 1 |
| FreeSlotsWidget.tsx | 33/40 | 0 | 0 | 2 | 1 |
| FrostMetricsStrip.tsx | 38/40 | 0 | 0 | 1 | 2 |
| InsightsRow.tsx | 20/40 | 1 | 0 | 2 | 0 |
| MarketingWidget.tsx | 14/40 | 1 | 2 | 1 | 0 |
| MonthlyCalendarWidget.tsx | 28/40 | 1 | 1 | 2 | 0 |
| NextFreeDaysWidget.tsx | 36/40 | 0 | 0 | 0 | 2 |
| PeakHoursWidget.tsx | 22/40 | 1 | 1 | 2 | 0 |
| QuickActionsWidget.tsx | 36/40 | 0 | 0 | 0 | 2 |
| ReferralBoostWidget.tsx | 36/40 | 0 | 0 | 2 | 1 |
| RevenueWidget.tsx | 12/40 | 1 | 1 | 1 | 1 |
| ScheduleWidget.tsx | 34/40 | 0 | 0 | 0 | 1 |
| StatsMosaicWidget.tsx | 34/40 | 0 | 0 | 2 | 1 |
| TopServicesWidget.tsx | 34/40 | 0 | 0 | 1 | 1 |
| WeeklyChartWidget.tsx | 26/40 | 1 | 1 | 2 | 2 |

**Assessment B**: detect clean (all `[]`)

## P0 Issues (7 total)
1. InsightsRow:101 — `<div onClick>` with cursor:pointer (div→button)
2. MarketingWidget:15 — `from-sage/5 to-primary/5` theme-coupled gradient (breaks non-Blossom)
3. MonthlyCalendarWidget:119 — `<div onClick>` DarkBookingRow (div→button)
4. PeakHoursWidget: — Heatmap cells mouse-only with `<div>` (no keyboard)
5. RevenueWidget:37 — Hardcoded `+12%` stub data shipped to production
6. WeeklyChartWidget:177 — `<div onClick>` bars (div→button)

## P1 Issues (6 total)
- EarningsPulseWidget: No loading state (shows `0 ₴` while loading)
- MarketingWidget: No loading state, shadow-primary/20 theme-coupled
- MonthlyCalendarWidget: Day card buttons lack aria-label
- PeakHoursWidget: Tooltip not keyboard accessible
- RevenueWidget: Zero CSS variable usage
- WeeklyChartWidget: Bar tooltip hover-only, not keyboard accessible

## Worst Files
1. **RevenueWidget (12/40)**: Fake stub data, no CSS vars, redundant with StatsMosaicWidget
2. **MarketingWidget (14/40)**: Theme-coupled gradient, no loading state, broken on Studio/Frost
3. **PeakHoursWidget (22/40)**: Mouse-only heatmap violates WCAG
4. **InsightsRow (20/40)**: div→button violation

## Best Files
- **AdaptiveContextStrip (38/40)**: Pure CSS vars, clean architecture
- **FrostMetricsStrip (38/40)**: RAF animation, proper ARIA
- **NextFreeDaysWidget (36/40)**: Clean, efficient

## Systemic
- 5 files have div→button P0 violations
- 16/20 use CSS vars (good), 2 are Tailwind-only (bad)
- Missing error states in 4+ widgets (ChannelHealth, ClientAlerts, Activity, CancellationRate)
- Missing loading skeletons in 2 widgets (EarningsPulse, MarketingWidget)


---

--- 
## 📸 Візуальний E2E Аудит & Порівняння Тем (Visual Registry & Carousel)
> Цей розділ автоматично синхронізовано з E2E тестами та скріншотами Playwright за допомогою інтерактивних каруселей.

### 📍 Зона: 03-dashboard (Dashboard)

#### 🖼️ Екран: Dashboard Overview Desktop Desktop

````carousel
![🌸 Blossom Theme: Dashboard Overview Desktop Desktop](../screenshots/blossom/03-dashboard/dashboard-overview-desktop-desktop.png)
<!-- slide -->
![❄️ Frost Theme: Dashboard Overview Desktop Desktop](../screenshots/frost/03-dashboard/dashboard-overview-desktop-desktop.png)
<!-- slide -->
![🌲 Studio Theme: Dashboard Overview Desktop Desktop](../screenshots/studio/03-dashboard/dashboard-overview-desktop-desktop.png)
````

*Швидкі посилання на оригінали:* [🌸 Blossom](../screenshots/blossom/03-dashboard/dashboard-overview-desktop-desktop.png) | [❄️ Frost](../screenshots/frost/03-dashboard/dashboard-overview-desktop-desktop.png) | [🌲 Studio](../screenshots/studio/03-dashboard/dashboard-overview-desktop-desktop.png)

#### 🖼️ Екран: Dashboard Overview Mobile Mobile

````carousel
![🌸 Blossom Theme: Dashboard Overview Mobile Mobile](../screenshots/blossom/03-dashboard/dashboard-overview-mobile-mobile.png)
<!-- slide -->
![❄️ Frost Theme: Dashboard Overview Mobile Mobile](../screenshots/frost/03-dashboard/dashboard-overview-mobile-mobile.png)
<!-- slide -->
![🌲 Studio Theme: Dashboard Overview Mobile Mobile](../screenshots/studio/03-dashboard/dashboard-overview-mobile-mobile.png)
````

*Швидкі посилання на оригінали:* [🌸 Blossom](../screenshots/blossom/03-dashboard/dashboard-overview-mobile-mobile.png) | [❄️ Frost](../screenshots/frost/03-dashboard/dashboard-overview-mobile-mobile.png) | [🌲 Studio](../screenshots/studio/03-dashboard/dashboard-overview-mobile-mobile.png)

#### 🖼️ Екран: Dashboard Widgets Desktop Desktop

````carousel
![🌸 Blossom Theme: Dashboard Widgets Desktop Desktop](../screenshots/blossom/03-dashboard/dashboard-widgets-desktop-desktop.png)
<!-- slide -->
![❄️ Frost Theme: Dashboard Widgets Desktop Desktop](../screenshots/frost/03-dashboard/dashboard-widgets-desktop-desktop.png)
<!-- slide -->
![🌲 Studio Theme: Dashboard Widgets Desktop Desktop](../screenshots/studio/03-dashboard/dashboard-widgets-desktop-desktop.png)
````

*Швидкі посилання на оригінали:* [🌸 Blossom](../screenshots/blossom/03-dashboard/dashboard-widgets-desktop-desktop.png) | [❄️ Frost](../screenshots/frost/03-dashboard/dashboard-widgets-desktop-desktop.png) | [🌲 Studio](../screenshots/studio/03-dashboard/dashboard-widgets-desktop-desktop.png)

#### 🖼️ Екран: Dashboard Widgets Mobile Mobile

````carousel
![🌸 Blossom Theme: Dashboard Widgets Mobile Mobile](../screenshots/blossom/03-dashboard/dashboard-widgets-mobile-mobile.png)
<!-- slide -->
![❄️ Frost Theme: Dashboard Widgets Mobile Mobile](../screenshots/frost/03-dashboard/dashboard-widgets-mobile-mobile.png)
<!-- slide -->
![🌲 Studio Theme: Dashboard Widgets Mobile Mobile](../screenshots/studio/03-dashboard/dashboard-widgets-mobile-mobile.png)
````

*Швидкі посилання на оригінали:* [🌸 Blossom](../screenshots/blossom/03-dashboard/dashboard-widgets-mobile-mobile.png) | [❄️ Frost](../screenshots/frost/03-dashboard/dashboard-widgets-mobile-mobile.png) | [🌲 Studio](../screenshots/studio/03-dashboard/dashboard-widgets-mobile-mobile.png)

#### 🖼️ Екран: Topbar Activity Dropdown Desktop

````carousel
![🌸 Blossom Theme: Topbar Activity Dropdown Desktop](../screenshots/blossom/03-dashboard/topbar-activity-dropdown-desktop.png)
<!-- slide -->
![❄️ Frost Theme: Topbar Activity Dropdown Desktop](../screenshots/frost/03-dashboard/topbar-activity-dropdown-desktop.png)
<!-- slide -->
![🌲 Studio Theme: Topbar Activity Dropdown Desktop](../screenshots/studio/03-dashboard/topbar-activity-dropdown-desktop.png)
````

*Швидкі посилання на оригінали:* [🌸 Blossom](../screenshots/blossom/03-dashboard/topbar-activity-dropdown-desktop.png) | [❄️ Frost](../screenshots/frost/03-dashboard/topbar-activity-dropdown-desktop.png) | [🌲 Studio](../screenshots/studio/03-dashboard/topbar-activity-dropdown-desktop.png)

#### 🖼️ Екран: Topbar Growth Dropdown Desktop

````carousel
![🌲 Studio Theme: Topbar Growth Dropdown Desktop](../screenshots/studio/03-dashboard/topbar-growth-dropdown-desktop.png)
````

*Швидкі посилання на оригінали:* [🌲 Studio](../screenshots/studio/03-dashboard/topbar-growth-dropdown-desktop.png)

