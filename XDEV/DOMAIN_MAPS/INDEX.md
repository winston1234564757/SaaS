# DOMAIN_MAPS — Master Index

> Створено: 2026-06-05 · Призначення: поглиблені мапи кожного функціонального домену BookIT для
> написання детальних тестів (unit, integration, E2E, load, security, cross-environment).
> Кожна мапа описує: всі стани, переходи, environments, load conditions, data variations, edge cases.

---

## Список доменів

| # | Домен | Файл | Сутність |
|---|-------|------|----------|
| 1 | Auth & Identity | `01_AUTH.md` | SMS OTP, Google OAuth, TMA, PostBookingAuth, Sessions, Routing Guards |
| 2 | Booking Wizard | `02_BOOKING_WIZARD.md` | Multi-step flow, Smart Slots, Dynamic Pricing, Price computation, Creation |
| 3 | Master Dashboard | `03_MASTER_DASHBOARD.md` | All widgets, Grid layout, Tour overlay, Academy, Empty/Loading/Error states |
| 4 | Client CRM | `04_CLIENT_CRM.md` | Client list, DetailSheet, Segments, Notes, Health/Medical, Retention |
| 5 | Notification System | `05_NOTIFICATIONS.md` | Orchestrator, 21 events, 4 channels, Cascade, Adoption, Logging |
| 6 | Referral System | `06_REFERRAL_SYSTEM.md` | B2B Alliance/Bounty, C2C, C2B Barter, Cartel, Discount stacking |
| 7 | Billing & Subscriptions | `07_BILLING.md` | Plans, Monobank checkout, Webhook Ed25519, Dunning, Discounts |
| 8 | Public Client Zone | `08_PUBLIC_CLIENT_ZONE.md` | Master page SSR, Portfolio gallery, Shop, Explore, Studio |
| 9 | Client Portal | `09_CLIENT_PORTAL.md` | My bookings, Profile, Loyalty, Masters, Notifications, ChannelBanner |
| 10 | Marketing Hub | `10_MARKETING.md` | Story Generator, Broadcasts, Short links, Phone discounts |
| 11 | Shop & Inventory | `11_SHOP_INVENTORY.md` | Orders, Stock control, Alerts, Nova Poshta, Cross-sell |
| 12 | Portfolio Consent | `12_PORTFOLIO_CONSENT.md` | CRUD, Consent flow, Photos, SEO, Tier limits |
| 13 | Background Cron | `13_CRON_BACKGROUND.md` | Reminders, Rebooking, Expire subscriptions, Reset monthly, Check uncompleted |
| 14 | Database Security | `14_DATABASE_SECURITY.md` | RLS matrix, RPC security, Webhook, Cron, SMS OTP rate-limit |
| 15 | Landing Page | `15_LANDING_PAGE.md` | 14 sections, GSAP ScrollTrigger, ROI Calculator, Pricing cards |
| 16 | Onboarding v2 | `16_ONBOARDING_V2.md` | 5 steps, Persistence, Recovery, 3-layer theme, Race conditions |
| 17 | Deep Links & URL Action Bus | `17_DEEP_LINKS.md` | All actions, consumers, Short links, Notification URLs |

---

## Format кожної мапи

Кожен файл мапи містить:

### 1. Domain Overview
- Domain name, purpose, key files
- All environment/role/theme combinations

### 2. State Machine
- All possible states per entity
- All transitions (valid + invalid)
- Edge cases and boundary values

### 3. Environment Matrix
- Desktop / Mobile / Tablet
- Authenticated / Guest / Admin
- Online / Offline / Degraded
- 3 themes (Blossom / Studio / Frost)
- 3 subscription tiers (Starter / Pro / Studio)
- 2 roles per entity (master / client)

### 4. Load & Concurrency Vectors
- Single user happy path
- Concurrent operations
- Race conditions
- Retry / Idempotency
- Rate limits

### 5. Data Variations
- Empty states
- Boundary values (min/max)
- Invalid/corrupted data
- Missing relations/foreign keys
- Time-sensitive data (timezone, DST, midnight)

### 6. Test Vectors
- Unit test candidates
- Integration test candidates
- E2E test candidates
- Security test candidates
- Performance/load test candidates

### 7. File Inventory
- Full list of files involved
- Database tables and RPCs
- API routes and cron handlers

---

## Як використовувати

1. Знайди домен за номером з таблиці вище
2. Прочитай мапу повністю — це foundation для написання тестів
3. Використовуй розділ "Test Vectors" для планування тестових сценаріїв
4. Використовуй "Environment Matrix" для кросс-середовищного тестування
5. Використовуй "File Inventory" для ідентифікації точок входу

---

## Узгодження з існуючими мапами

Ці мапи є надбудовою над `XDEV/MAPS/*`. Вони не замінюють, а доповнюють існуючі мапи,
додаючи глибину для тестування: стани, переходи, середовища, варіації, edge cases.

Посилання на релевантні MAP файли:
- SYSTEM_MAP.md → архітектура, роути, компоненти, таблиці
- UI_MAP.md → UI-елементи, компоненти, atoms
- NOTIFICATION_MAP.md → NotificationOrchestrator, події, канали
- BILLING_FLOW_MAP.md → Monobank, Dunning, Discount stacking
- REFERRAL_MAP.md → Referral mechanics (4 типи)
- CLIENT_ZONE_MAP.md → Client zone /my/*
- DEEP_LINK_MAP.md → URL параметри, Short links
- CRON_SCHEDULER_MAP.md → Cron jobs
- ONBOARDING_FLOW_MAP.md → Onboarding steps
- SHOP_ORDER_FLOW_MAP.md → Shop lifecycle
- MODALS_MAP.md → Modals, Drawers, BottomSheets
- DATABASE_SECURITY_RLS_MAP.md → RLS, Security definer
- BUTTON_ACTION_MAP.md → Button actions, navigation
- DESIGN_SYSTEM_TOKENS_MAP.md → CSS tokens, themes
- PAGE_RELEASE_ROADMAP.md → Quality gates per page
- TESTING_MAP.md → Existing tests, seed data, flaky tests

---

*BookIT Domain Maps v1.0 — 2026-06-05*
