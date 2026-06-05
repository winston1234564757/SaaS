# Wave 2 — Batch 2: Dashboard Components (10 files)
**8 instruments: critique A+B + audit + animate + overdrive + polish + layout + optimize**
**Date: 2026-06-02 | Sub-agent: ses_17af6f8b7ffebk07foGNsi1lYh**

## Scores

| File | Score | P0 | P1 | P2 | P3 |
|------|-------|----|----|----|----|
| DashboardTourBanner.tsx | 32/40 | 0 | 0 | 2 | 1 |
| DashboardTourContext.tsx | 37/40 | 0 | 0 | 0 | 1 |
| TodaySchedule.tsx | 28/40 | 0 | 2 | 5 | 1 |
| WeeklyOverview.tsx | 28/40 | 0 | 2 | 3 | 1 |
| StatsStrip.tsx | 32/40 | 0 | 0 | 2 | 2 |
| ProfileStrengthWidget.tsx | 30/40 | 0 | 1 | 2 | 2 |
| QuickActions.tsx | 28/40 | 0 | 1 | 2 | 3 |
| QuickActionsWithHint.tsx | 34/40 | 0 | 1 | 0 | 0 |
| SharePageCard.tsx | 26/40 | 0 | 3 | 1 | 1 |
| ShareCardWithHint.tsx | 36/40 | 0 | 0 | 0 | 0 |

**Assessment B**: detect clean (all `[]`)

## P1 Issues (10 total)
1. TodaySchedule:121 — `<div onClick>` BookingRow div→button violation
2. TodaySchedule:122 — No keyboard nav on booking rows
3. WeeklyOverview:111 — Chart bars `<div onClick>` div→button violation
4. WeeklyOverview:111-168 — No aria-label on chart bars
5. ProfileStrengthWidget:226 — `<motion.div>` wrapping `<Link>` (nested interactive)
6. QuickActions:83-93 — `<motion.div>` wrapping `<Link>` (×6 instances)
7. QuickActionsWithHint:10 — Tour step mismatch (step 2 vs 4)
8. SharePageCard:88 — Modal backdrop `<div onClick>` div→button
9. SharePageCard:91-141 — QR modal missing role="dialog"
10. SharePageCard:81-143 — Modal not dismissible via Escape

## Systemic
- 6 files violate div→button IRON rule
- Inconsistent theming: some components use Tailwind semantic classes, others use CSS vars
- Touch targets below 44px in 4 files (py-2.5 = ~22px, py-3 = ~36px)
- SharePageCard QR modal is the single worst component (no dialog role, no escape, broken backdrop)


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

