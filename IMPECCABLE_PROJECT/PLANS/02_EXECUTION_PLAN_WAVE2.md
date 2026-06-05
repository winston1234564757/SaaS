# EXECUTION PLAN — Wave 2: Master + Admin + Landing

> План розширення: ~298 нових файлів через 8 інструментів impeccable
> Старт: 2026-06-01

---

## Scope

| Зона | Компоненти | Routes/Pages | Разом |
|------|-----------|-------------|-------|
| Master Core | ~20 | ~10 | 30 |
| Master Widgets | 55 | — | 55 |
| Master Bookings | 7 | 5 | 12 |
| Master Clients | 4 | 3 | 7 |
| Master Products | 6 | 5 | 11 |
| Master Services | 5 | 4 | 9 |
| Master Settings | 18 | 3 | 21 |
| Master Portfolio | 5 | 4 | 9 |
| Master Onboarding | 15 | 3 | 18 |
| Master Other | ~25 | ~25 | 50 |
| Admin Zone | 9 | 7 | 16 |
| Landing Page | 20 | 1 | 21 |
| Root/Layout | 1 | 2 | 3 |
| **Total** | **~190** | **~74** | **~264** |

*(Файли <10 рядків пропускаються як тривіальні)*

---

## Batches

### Batch 1 — Master Core Layout (8 files)
DashboardLayout, DashboardTopBar, FrostDashboard, BlossomDashboard, StudioDashboard, BentoGrid, DashboardView, DashboardGreeting

### Batch 2 — Master Dashboard Components (10 files)
DashboardTourBanner, DashboardTourContext, TodaySchedule, WeeklyOverview, StatsStrip, ProfileStrengthWidget, QuickActions, QuickActionsWithHint, SharePageCard, ShareCardWithHint

### Batch 3 — Master Widgets Core (20 files)
All widgets in dashboard/widgets/

### Batch 4 — Master Widgets Theme (35 files)
blossom/ 11 + frost/ 12 + studio/ 12

### Batch 5 — Bookings + Flash (10 files)
BookingsPage, BookingCard, BookingDetailsModal, ManualBookingForm, BulkActionToolbar, DashboardWidgets, MonthlyAnalyticsView, OpportunityMenu, PeriodAnalyticsView, SmartQueue, VerticalTimeline, FlashDealPage

### Batch 6 — Clients (4 files)
ClientsPage, ClientDetailSheet, ClientWidgets, SegmentBuilder

### Batch 7 — Products + Marketing extras (8 files)
ProductsPage, ProductCard, ProductEditor, ProductFormDrawer, OrderCard, RestockDrawer + BroadcastDetailSheet, BroadcastsTab, MarketingTabs

### Batch 8 — Services + Portfolio (10 files)
ServicesPage, ServiceCard, ServiceEditor, ImageUploader + PortfolioPage, PortfolioItemCard, PortfolioItemEditor, PortfolioItemPage, PortfolioPhotoUploader

### Batch 9 — Settings (12 files)
SettingsPage, VacationManager, LocationPicker + widgets (8 key files)

### Batch 10 — Onboarding (15 files)
OnboardingWizard, OnboardingProgress, PublicPagePreview + steps (12 files)

### Batch 11 — Other Master Pages (15 files)
BillingPage, AnalyticsPage, AcademyPage, DocumentsPage, SupportPage, MorePage, PartnersPage, ReferralPage, LoyaltyPage, GrowthHubClient, RevenueHubClient, DynamicPricingPage, PricingUpgradeGate, StudioJoinPage, WaitlistButton

### Batch 12 — Admin Zone (12 files)
AdminOverviewCharts, AdminSupportConsole, AdminThemeApplier, AllianceMap, ImpersonationBanner, MastersDirectory, ModerationHub, SystemLogsViewer + app routes

### Batch 13 — Landing Page (20 files)
All landing components + RootPageClient + app/page.tsx + app/layout.tsx

---

## Stats

| Batch | Files | Agent | Status |
|-------|-------|-------|--------|
| 1 | 8 | ses_17af700feffe... | ✅ W2_B1_master-core.md |
| 2 | 10 | ses_17af6f8b7ffe... | ✅ W2_B2_dashboard-components.md |
| 3 | 20 | ses_17af6f04effe... | ✅ W2_B3_widgets-core.md |
| 4 | 37 | ses_17af50644ffe... | ✅ W2_B4_widgets-theme.md |
| 5 | 13 | ses_17af4fd84ffe... | ✅ W2_B5_bookings-flash.md |
| 6 | 4 | ses_17af32ecdffe... | ✅ W2_B6_clients.md |
| 7 | 10 | ses_17af0c980ffe... | ✅ W2_B7_products-marketing.md |
| 8 | 10 | ses_17af32412ffe... | ✅ W2_B8_services-portfolio.md |
| 9 | 12 | ses_17af31bfdffe... | ✅ W2_B9_settings.md |
| 10 | 15 | ses_17af0bbd2ffe... | ✅ W2_B10_onboarding.md |
| 11 | 7 | ses_17af0b0c2ffe... | ✅ W2_B11_other-master.md |
| 12 | 7 | ses_17af0a562ffe... | ✅ W2_B12_admin.md |
| 13 | 22 | ses_17af09631ffe... | ✅ W2_B13_landing-root.md |
