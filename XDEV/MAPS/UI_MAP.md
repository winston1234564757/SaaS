# 🗺️ BookIT UI Intelligence Map

This document serves as a comprehensive inventory of every visual element in the BookIT SaaS platform. It is designed to guide the upcoming design overhaul, ensuring architectural consistency and premium UX across all surfaces.

---

## 📂 Stage 1: Core App Structure & Master Dashboard

### 🏠 Main Layouts & Providers
*   **Root Layout** (`src/app/layout.tsx`): The master wrapper for the entire application. Handles fonts (Inter, Playfair Display), metadata, and global providers (Supabase, TanStack Query, Toast, PWA).
*   **Master Dashboard Layout** (`src/app/(master)/layout.tsx`): The shell for the master-facing interface. Includes navigation, mobile header, and master-specific context.
*   **Client "My" Layout** (`src/app/my/layout.tsx`): The shell for client-facing account pages.
*   **Public Profile Layout** (`src/app/[slug]/layout.tsx`): The wrapper for public-facing master shops and portfolios.

---

### 📊 Master Dashboard Pages (The Core SaaS)
All pages are located under `src/app/(master)/dashboard/`.

1.  **Main Overview** (`page.tsx`): The master's command center. Displays stats, today's schedule, and quick actions.
2.  **Bookings Manager** (`bookings/page.tsx`): Full CRM view of all appointments. Supports searching, filtering, and CSV exports.
3.  **Analytics Hub** (`analytics/page.tsx`): Deep dive into revenue, client retention, and service performance.
4.  **Service Management** (`services/page.tsx`, `services/new/page.tsx`, `services/[id]/page.tsx`): CRUD interface for creating and organizing services/categories via `ServiceEditor`.
5.  **Product Shop Manager** (`products/page.tsx`, `products/new/page.tsx`, `products/[id]/page.tsx`): Inventory and order management for physical/digital products via `ProductEditor`.
6.  **Client CRM** (`clients/page.tsx`): Comprehensive database of clients with history and notes.
7.  **Marketing & Stories** (`marketing/page.tsx`, `marketing/new/page.tsx`, `marketing/[id]/page.tsx`): Access to Story Generator and broadcast messaging.
8.  **Loyalty System** (`loyalty/page.tsx`): Configuration of points, cashback, and referral rewards.
9.  **Revenue & Billing** (`revenue/page.tsx` & `billing/page.tsx`): Financial tracking, subscription management, and Monobank integration.
10. **Settings & Profile** (`settings/page.tsx`): Master profile details, schedule configuration, and location picking.
11. **Studio / Team** (`studio/page.tsx`): Team management and multi-master studio settings.
12. **Flash Deals** (`flash/page.tsx`): Management of limited-time discounted slots.
13. **Reviews** (`reviews/page.tsx`): Management and publishing of client feedback.
14. **Portfolio Manager** (`portfolio/page.tsx`, `portfolio/[id]/page.tsx`): Visual gallery of master's work, photos upload, client consent and tag bindings.

---

### 🔑 Authentication & Entry
*   **Login Page** (`src/app/(auth)/login/page.tsx`): SMS-based OTP entry.
*   **Registration** (`src/app/(auth)/register/page.tsx`): Initial onboarding entry.
*   **Master Onboarding** (`src/app/onboarding/page.tsx`): Multi-step wizard for new master setup.

---

### 🌍 Public & Client Facing Pages
*   **Public Shop/Profile** (`src/app/[slug]/page.tsx`): The "link-in-bio" booking page for masters.
*   **Portfolio** (`src/app/[slug]/portfolio/page.tsx`): Visual gallery of master's work.
*   **Explore** (`src/app/explore/page.tsx`): Marketplace view for discovering masters.
*   **Client Dashboard** (`src/app/my/bookings/page.tsx`): Client's view of their own upcoming/past appointments.
*   **Loyalty Widget** (`src/app/my/loyalty/page.tsx`): Client's personal reward balance.

---

## 🧩 Stage 2: Components & Design System

### 🧪 UI Atoms (Smallest Units)
Located in `src/components/ui/`. These are the building blocks of the entire UI.

*   **Button** (`Button.tsx`): The primary interaction element. Supports multiple variants (primary, accent, outline, ghost).
*   **Input** (`Input.tsx`): Styled text fields with focus states and error handling.
*   **Badge** (`Badge.tsx`): Status indicators (e.g., "Confirmed", "Paid", "Starter").
*   **BentoCard** (`BentoCard.tsx`): The container for dashboard widgets, featuring Mica/glassmorphism styles.
*   **Card** (`Card.tsx`): Generic container for content grouping.
*   **Tooltip / AnchoredTooltip** (`Tooltip.tsx`): Contextual help and info bubbles.
*   **DropdownMenu** (`DropdownMenu.tsx`): Context menus for actions (e.g., booking management).
*   **Skeleton** (`skeleton.tsx`): Loading state placeholders.
*   **PullToRefresh** (`PullToRefresh.tsx`): Mobile-first refresh gesture handler.

---

### 🧩 Functional Components (Dashboard Blocks)
Complex reusable blocks that visualize business logic. Located in `src/components/master/dashboard/`.

*   **BentoGrid** (`BentoGrid.tsx`): The flexible layout system for dashboard widgets.
*   **TodaySchedule** (`TodaySchedule.tsx`): High-density timeline of appointments for the current day.
*   **StatsStrip** (`StatsStrip.tsx`): Horizontal bar showing key metrics (Revenue, New Clients, Growth).
*   **QuickActions** (`QuickActions.tsx`): One-tap shortcuts for "New Booking", "Flash Sale", etc.
*   **WeeklyOverview** (`WeeklyOverview.tsx`): Visual chart or summary of the week's performance.
*   **ProfileStrengthWidget** (`ProfileStrengthWidget.tsx`): Gamified progress bar for profile completion.
*   **NotificationsBell** (`NotificationsBell.tsx`): In-app notification center with real-time updates.
*   **ClientWidgets** (`ClientWidgets.tsx`): Bento-grid widgets for CRM analytics (Retention, LTV, Referrals, Cleanup Wizard).
*   **WelcomeBanner / Hints** (`WelcomeBanner.tsx`): Onboarding guidance for masters.

---

### 🎨 Icons & Assets
*   **Icon Library**: Primarily uses **Lucide React**.
*   **Custom Icons**: Located in `src/components/icons/` (e.g., `GoogleIcon.tsx`).
*   **Backgrounds**: `BlobBackground.tsx` (`src/components/shared/`) provides the dynamic, organic background aesthetics.
*   **Loaders**: `BeautyLoader.tsx` (`src/components/shared/`) - a premium, branded loading animation.

---

## 🪟 Stage 3: Modals, Drawers & Flows

### 🗄️ Generic UI Containers
Essential for mobile-first interaction patterns.

*   **BottomSheet** (`src/components/ui/BottomSheet.tsx`): Based on `vaul`. The primary container for mobile interactions.
*   **DashboardDrawer** (`src/components/ui/DashboardDrawer.tsx`): A specialized drawer for the master dashboard, typically containing sub-forms or settings.
*   **PopUpModal** (`src/components/ui/PopUpModal.tsx`): Centered modal for critical alerts, confirmations, or quick inputs.
*   **HubDrawer** (`src/components/shared/HubDrawer.tsx`): A versatile drawer used for "Growth Hub" or "Revenue Hub" details.

---

### 🌊 Complex User Flows
These are multi-step interactions that represent the core "Business Value" of the app.

1.  **Booking Wizard** (`src/components/shared/BookingWizard.tsx`)
    *   *Purpose*: The unified 4-step booking flow (Services → Date/Time → Products → Details → Success).
    *   *UI Structure*: A sophisticated `BottomSheet` implementation with step-based animation (Framer Motion).
    *   *Sub-components*: `ServiceSelector`, `DateTimePicker`, `ProductCart`, `ClientDetails`, `BookingSuccess`.

2.  **Master Onboarding** (`src/components/master/onboarding/OnboardingWizard.tsx`)
    *   *Purpose*: Guided setup for new masters.
    *   *UI Structure*: Full-screen multi-step flow with progress tracking.
    *   *Steps*: Basic Info, Schedule, Services, Profit Predictor, Success.

3.  **Story Generator** (`src/components/master/marketing/StoryGenerator.tsx`)
    *   *Purpose*: High-end visual content creator for Instagram/Telegram stories.
    *   *UI Structure*: Canvas-based editor with real-time preview, palette selection, and JPEG export capabilities.

4.  **Broadcast Manager** (`src/components/master/marketing/BroadcastEditor.tsx`)
    *   *Purpose*: CRM-powered messaging to clients.
    *   *UI Structure*: Rich text editor with recipient filtering, preview, and status tracking.

---

### 🪟 Feature-Specific Drawers
Triggered by specific actions in the dashboard.

*   **Flash Deal Drawer** (`src/components/master/dashboard/FlashDealDrawer.tsx`): Quick setup for discounted slots.
*   **Pricing Drawer** (`src/components/master/dashboard/PricingDrawer.tsx`): Configuration for peak hours and dynamic pricing rules.
*   **Client Detail Sheet** (`src/components/master/clients/ClientDetailSheet.tsx`): Deep view of a single client's profile and history.
*   **Booking Details Modal** (`src/components/master/bookings/BookingDetailsModal.tsx`): Full view/edit interface for a single appointment.
*   **Period Analytics View** (`src/components/master/bookings/PeriodAnalyticsView.tsx`): Bento-grid analytics dashboard for Week/Month booking views.

---

> [!NOTE]
> This map is a living document. Every file listed here is a candidate for the design overhaul. Ensure that any style updates maintain the "Premium SaaS" standards documented in `XDEV/UX_STANDARDS.md`.


