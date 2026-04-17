# Implementation Plan: Dashboard Hubs & Bento Refactor

Refactor the Master Dashboard settings navigation into two consolidated high-level hubs: **Revenue Hub** and **Growth Hub**, using a mobile-first Bento Grid design and URL-driven drawers.

## User Review Required

> [!IMPORTANT]
> **Consolidation**: 5 separate pages will be removed from the sidebar and merged into 2 hubs. Users will now find these features under "Revenue" and "Growth".
> **Navigation Change**: Closing a drawer (e.g., Flash Deals) will be handled by the browser's "Back" button or a UI close button that updates the URL.

## Proposed Changes

### [Component] Navigation Refactor

#### [MODIFY] [FloatingSidebar.tsx](file:///c:/Users/Vitossik/SaaS/bookit/src/components/shared/FloatingSidebar.tsx)
- Add "Revenue" and "Growth" items.
- Remove "Flash", "Pricing", "Loyalty", "Referral", "Partners".

#### [MODIFY] [BottomNav.tsx](file:///c:/Users/Vitossik/SaaS/bookit/src/components/shared/BottomNav.tsx)
- Similar updates for the mobile navigation and "More" drawer.

---

### [Component] Revenue Hub

#### [NEW] [revenue/page.tsx](file:///c:/Users/Vitossik/SaaS/bookit/src/app/%28master%29/dashboard/revenue/page.tsx)
- Server component fetching data for both Flash Deals and Pricing.
- Renders a Bento Grid with two cards.

#### [NEW] [RevenueHubClient.tsx](file:///c:/Users/Vitossik/SaaS/bookit/src/components/master/revenue/RevenueHubClient.tsx)
- Client-side logic for managing the `?drawer=` search parameter.
- Renders the responsive drawer wrapper.

---

### [Component] Growth Hub

#### [NEW] [growth/page.tsx](file:///c:/Users/Vitossik/SaaS/bookit/src/app/%28master%29/dashboard/growth/page.tsx)
- Server component fetching data for Loyalty, Referral, and Partners.
- Renders a Bento Grid with three cards.

#### [NEW] [GrowthHubClient.tsx](file:///c:/Users/Vitossik/SaaS/bookit/src/components/master/growth/GrowthHubClient.tsx)
- Client-side logic for managing the `?drawer=` search parameter.

---

### [Component] UI & Shared Logic

#### [NEW] [HubDrawer.tsx](file:///c:/Users/Vitossik/SaaS/bookit/src/components/shared/HubDrawer.tsx)
- A responsive wrapper component.
- Uses `DashboardDrawer` (side slide-over) for desktop (`lg+`).
- Uses `BottomSheet` (bottom slide-up) for mobile (`<lg`).

#### [NEW] [BentoCard.tsx](file:///c:/Users/Vitossik/SaaS/bookit/src/components/ui/BentoCard.tsx)
- Reusable card component for the hub pages.
- Displays stats, icons, and handles the `onClick` to update the URL.

## Open Questions

### 1. Libraries (nuqs / vaul)
> [!IMPORTANT]
> The `nuqs` (URL state) and `vaul` (drawer) libraries are NOT currently installed.
> Should I install them, or should I stick to standard Next.js hooks and the custom `DashboardDrawer`/`BottomSheet` already in the project?

### 2. Navigation Icons
Which icons should I use for the new hubs in the sidebar and bottom nav?
- **Revenue Hub**: Suggesting `CreditCard`, `DollarSign`, or `Zap`.
- **Growth Hub**: Suggesting `TrendingUp`, `Users`, or `BarChart2`.

### 3. Bento Card Content
Should the Bento cards on the hub pages show only basic stats (e.g., "Active Deals: 2"), or would you like more detailed previews (e.g., a mini-list of active deals) directly in the card?

## Verification Plan

### Automated Tests
- Run Playwright E2E tests for the consolidated features to ensure they still work within drawers.
- Test URL parameter synchronization.

### Manual Verification
- Open Flash Deals via the Revenue Hub card.
- Verify that pressing "Back" in the browser closes the drawer.
- Verify responsive behavior: Side drawer on desktop, Bottom sheet on mobile.
- Check that all stats (Active Deals, Savings, etc.) are correctly displayed on the Bento cards.
