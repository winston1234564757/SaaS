# Wave 2 — Batch 4: Dashboard Widgets Theme Variants (37 files)
**8 instruments: critique A+B + audit + animate + overdrive + polish + layout + optimize**
**Date: 2026-06-02 | Sub-agent: ses_17af50644ffe2lhUkD6XAn18CY**

## Scores by Theme

| Theme | Min | Max | Avg | P0 | P1 | P2 | P3 |
|-------|-----|-----|-----|----|----|----|----|
| **Blossom** (11 files) | 18 | 38 | 31.8 | 2 | 3 | 0 | 2 |
| **Frost** (12 files) | 25 | 37 | 33.1 | 0 | 2 | 3 | 1 |
| **Studio** (12 files) | 15 | 38 | 28.5 | 1 | 5 | 1 | 1 |
| **Shared** (2 files) | 28 | 32 | 30.0 | 0 | 0 | 0 | 1 |

**Assessment B**: detect clean (all `[]`)

## P0 Issues (4 total)
1. **blossom/InsightsRow.tsx:88** — `<div onClick>` div→button
2. **blossom/PeakHoursWidget.tsx:136** — `<div role='button'>` instead of `<button>`
3. **studio/PeakHoursWidget.tsx:136** — Same as above
4. **studio/MonthlyCalendarWidget.tsx:100** — `<div onClick>` booking rows

## P1 Issues (14 total) — Key ones:
- studio/QuickActionsWidget: 3 hardcoded rgba values
- studio/FreeSlotsWidget: 2 hardcoded accent gold rgba
- studio/GreetingWidget: 2 hardcoded rgba (success green, highlight)
- studio/WeeklyChartWidget: Hardcoded dark rgba tooltip bg
- blossom/PeakHoursWidget: 2 hardcoded rgba (brown, gold)
- blossom/QuickActionsWidget: 3 hardcoded rgba white overlays
- frost/GreetingWidget: Hardcoded rgba highlight
- frost/MonthlyCalendarWidget: Hardcoded rgba border

## Key Finding: Frost is the best theme
- **Frost**: 0 P0, only 2 P1 — consistently uses `color-mix(in srgb, ...)`, proper `<button>` elements
- **Blossom**: 2 P0, 3 P1 — middle ground
- **Studio**: 1 P0, 5 P1 — worst for hardcoded colors (6 instances)

## CTA Route Inconsistency
- Frost uses `/dashboard/revenue?drawer=flash_deals` for flash deal CTAs
- Blossom and Studio use `/dashboard/flash`
- Either Frost has a new drawer-based route or this is stale

## Theme Wrapper Gap
- Frost ScheduleWidget missing `frost-schedule` CSS class wrapper (Blossom/Studio have theirs)


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

