# Wave 2 — Batch 5: Bookings + Flash Deal (13 files)
**8 instruments: critique A+B + audit + animate + overdrive + polish + layout + optimize**
**Date: 2026-06-02 | Sub-agent: ses_17af4fd84ffesaHj1We7754D3N**

## Scores

| File | Score | P0 | P1 | P2 | P3 |
|------|-------|----|----|----|----|
| BookingsPage.tsx | 34/40 | 0 | 0 | 4 | 2 |
| BookingCard.tsx | 32/40 | 0 | 0 | 3 | 1 |
| BookingDetailsModal.tsx | 28/40 | 0 | 4 | 2 | 1 |
| ManualBookingForm.tsx | 36/40 | 0 | 0 | 0 | 2 |
| BookingActionsDropdown.tsx | 33/40 | 0 | 1 | 1 | 1 |
| BulkActionToolbar.tsx | 35/40 | 0 | 0 | 0 | 2 |
| DashboardWidgets.tsx | 36/40 | 0 | 0 | 0 | 2 |
| MonthlyAnalyticsView.tsx | 25/40 | 0 | 3 | 4 | 0 |
| OpportunityMenu.tsx | 32/40 | 0 | 1 | 2 | 0 |
| PeriodAnalyticsView.tsx | 28/40 | 0 | 2 | 3 | 0 |
| SmartQueue.tsx | 34/40 | 0 | 0 | 0 | 2 |
| VerticalTimeline.tsx | 26/40 | 0 | 3 | 3 | 1 |
| FlashDealPage.tsx | 29/40 | 0 | 1 | 5 | 1 |

**Assessment B**: detect clean (all `[]`)

## P0 Issues: 0

## P1 Issues (14 total)
1. BookingDetailsModal:110-131 — `as any[]` on 3 supabase queries
2. BookingDetailsModal:338 — 699 lines, should split
3. BookingActionsDropdown:124 — Dropdown trigger (MoreVertical) no aria-label
4. MonthlyAnalyticsView:203 — Day cells no aria-label
5. MonthlyAnalyticsView:360 — Mini bars no aria-label
6. MonthlyAnalyticsView:372 — Week row buttons no aria-label
7. OpportunityMenu:24 — Backdrop missing aria-hidden
8. PeriodAnalyticsView:116 — Avatar initials no aria-label
9. PeriodAnalyticsView:81 — Color-only occupancy coding (colorblind inaccessible)
10. VerticalTimeline:105 — Drag-and-drop mouse-only, no keyboard alternative
11. VerticalTimeline:439 — onMouseEnter/Leave should use CSS :hover
12. VerticalTimeline:474 — Now indicator pure visual, no aria-live
13. FlashDealPage:1 — 604 lines, too long
14. BookingCard:136 — Conflicting `transition-all transition-colors`

## Worst Files
- **MonthlyAnalyticsView (25/40)**: 3 P1 a11y, heavy inline styles
- **VerticalTimeline (26/40)**: Mouse-only drag, no keyboard support
- **BookingDetailsModal (28/40)**: 699 lines, 3 `as any[]` casts

## Best Files
- **ManualBookingForm (36/40)**: Clean thin wrapper
- **DashboardWidgets (36/40)**: Simple effective stat cards
- **BulkActionToolbar (35/40)**: Focused and clean


---

--- 
## 📸 Візуальний E2E Аудит & Порівняння Тем (Visual Registry & Carousel)
> Цей розділ автоматично синхронізовано з E2E тестами та скріншотами Playwright за допомогою інтерактивних каруселей.

### 📍 Зона: 04-bookings (Bookings)

#### 🖼️ Екран: Bookings Create Form Open Desktop

````carousel
![🌸 Blossom Theme: Bookings Create Form Open Desktop](../screenshots/blossom/04-bookings/bookings-create-form-open-desktop.png)
<!-- slide -->
![❄️ Frost Theme: Bookings Create Form Open Desktop](../screenshots/frost/04-bookings/bookings-create-form-open-desktop.png)
<!-- slide -->
![🌲 Studio Theme: Bookings Create Form Open Desktop](../screenshots/studio/04-bookings/bookings-create-form-open-desktop.png)
````

*Швидкі посилання на оригінали:* [🌸 Blossom](../screenshots/blossom/04-bookings/bookings-create-form-open-desktop.png) | [❄️ Frost](../screenshots/frost/04-bookings/bookings-create-form-open-desktop.png) | [🌲 Studio](../screenshots/studio/04-bookings/bookings-create-form-open-desktop.png)

#### 🖼️ Екран: Bookings Day Desktop Desktop

````carousel
![🌸 Blossom Theme: Bookings Day Desktop Desktop](../screenshots/blossom/04-bookings/bookings-day-desktop-desktop.png)
<!-- slide -->
![❄️ Frost Theme: Bookings Day Desktop Desktop](../screenshots/frost/04-bookings/bookings-day-desktop-desktop.png)
<!-- slide -->
![🌲 Studio Theme: Bookings Day Desktop Desktop](../screenshots/studio/04-bookings/bookings-day-desktop-desktop.png)
````

*Швидкі посилання на оригінали:* [🌸 Blossom](../screenshots/blossom/04-bookings/bookings-day-desktop-desktop.png) | [❄️ Frost](../screenshots/frost/04-bookings/bookings-day-desktop-desktop.png) | [🌲 Studio](../screenshots/studio/04-bookings/bookings-day-desktop-desktop.png)

#### 🖼️ Екран: Bookings Day Mobile Mobile

````carousel
![🌸 Blossom Theme: Bookings Day Mobile Mobile](../screenshots/blossom/04-bookings/bookings-day-mobile-mobile.png)
<!-- slide -->
![❄️ Frost Theme: Bookings Day Mobile Mobile](../screenshots/frost/04-bookings/bookings-day-mobile-mobile.png)
<!-- slide -->
![🌲 Studio Theme: Bookings Day Mobile Mobile](../screenshots/studio/04-bookings/bookings-day-mobile-mobile.png)
````

*Швидкі посилання на оригінали:* [🌸 Blossom](../screenshots/blossom/04-bookings/bookings-day-mobile-mobile.png) | [❄️ Frost](../screenshots/frost/04-bookings/bookings-day-mobile-mobile.png) | [🌲 Studio](../screenshots/studio/04-bookings/bookings-day-mobile-mobile.png)

### 📍 Зона: 09-revenue (Revenue)

#### 🖼️ Екран: Revenue Dynamic Pricing Desktop

````carousel
![🌸 Blossom Theme: Revenue Dynamic Pricing Desktop](../screenshots/blossom/09-revenue/revenue-dynamic-pricing-desktop.png)
<!-- slide -->
![❄️ Frost Theme: Revenue Dynamic Pricing Desktop](../screenshots/frost/09-revenue/revenue-dynamic-pricing-desktop.png)
<!-- slide -->
![🌲 Studio Theme: Revenue Dynamic Pricing Desktop](../screenshots/studio/09-revenue/revenue-dynamic-pricing-desktop.png)
````

*Швидкі посилання на оригінали:* [🌸 Blossom](../screenshots/blossom/09-revenue/revenue-dynamic-pricing-desktop.png) | [❄️ Frost](../screenshots/frost/09-revenue/revenue-dynamic-pricing-desktop.png) | [🌲 Studio](../screenshots/studio/09-revenue/revenue-dynamic-pricing-desktop.png)

#### 🖼️ Екран: Revenue Flash Deals Desktop

````carousel
![🌸 Blossom Theme: Revenue Flash Deals Desktop](../screenshots/blossom/09-revenue/revenue-flash-deals-desktop.png)
<!-- slide -->
![❄️ Frost Theme: Revenue Flash Deals Desktop](../screenshots/frost/09-revenue/revenue-flash-deals-desktop.png)
<!-- slide -->
![🌲 Studio Theme: Revenue Flash Deals Desktop](../screenshots/studio/09-revenue/revenue-flash-deals-desktop.png)
````

*Швидкі посилання на оригінали:* [🌸 Blossom](../screenshots/blossom/09-revenue/revenue-flash-deals-desktop.png) | [❄️ Frost](../screenshots/frost/09-revenue/revenue-flash-deals-desktop.png) | [🌲 Studio](../screenshots/studio/09-revenue/revenue-flash-deals-desktop.png)

#### 🖼️ Екран: Revenue Mobile Mobile

````carousel
![🌸 Blossom Theme: Revenue Mobile Mobile](../screenshots/blossom/09-revenue/revenue-mobile-mobile.png)
<!-- slide -->
![❄️ Frost Theme: Revenue Mobile Mobile](../screenshots/frost/09-revenue/revenue-mobile-mobile.png)
<!-- slide -->
![🌲 Studio Theme: Revenue Mobile Mobile](../screenshots/studio/09-revenue/revenue-mobile-mobile.png)
````

*Швидкі посилання на оригінали:* [🌸 Blossom](../screenshots/blossom/09-revenue/revenue-mobile-mobile.png) | [❄️ Frost](../screenshots/frost/09-revenue/revenue-mobile-mobile.png) | [🌲 Studio](../screenshots/studio/09-revenue/revenue-mobile-mobile.png)

