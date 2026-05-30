# SYSTEM_MAP — Bookit Architectural Index

> Оновлено: 2026-05-30 · Джерело: живий код (v8.3.0 "STEP 04 — Dashboard tour overlay, Academy v2, empty states, deep links fixed") · Commit: `65acf29`

---

## 🗺️ Maps & Indexes
- [SYSTEM_MAP.md](file:///c:/Users/Vitossik/SaaS/XDEV/MAPS/SYSTEM_MAP.md) — Architectural Index
- [REFERRAL_MAP.md](file:///c:/Users/Vitossik/SaaS/XDEV/MAPS/REFERRAL_MAP.md) — Referral Mechanics Map
- [UI_MAP.md](file:///c:/Users/Vitossik/SaaS/XDEV/MAPS/UI_MAP.md) — UI/UX Map
- [DEEP_LINK_MAP.md](file:///c:/Users/Vitossik/SaaS/XDEV/MAPS/DEEP_LINK_MAP.md) — Deep Linking Map

---

## [B2B / Master Zone] — `(master)/dashboard/...`

### Layout & Auth Guard
- `src/app/(master)/layout.tsx` — Server Component, server-side auth check; ініціює `MasterProvider`; **isOnboarding branch (2026-05-29)**: `<style>html,body{bg:#EFF2FF!important}</style>` + clean Frost div (no DashboardLayout chrome); MasterProvider wraps children
- `src/app/layout.tsx` — Root layout; reads `x-pathname` header → forces `data-theme="frost"` on `<html>` for `/dashboard/onboarding` and `/onboarding` paths → inline `beforeInteractive` script sets `body.bg=#EFF2FF` server-side
- `src/components/master/DashboardLayout.tsx` — shell: sidebar nav + `BentoBottomNav` (Mosaic Command Center); `ThemeApplier` client component sets `data-theme` per `mood_theme`

### Routes → Компоненти → Server Actions

| Route | Відповідальність | Page | Actions | Key Component |
|---|---|---|---|---|
| `/dashboard` | Editorial dashboard: greeting, schedule, weekly chart, monthly calendar, sidebar widgets, adaptive strip, tour | `dashboard/page.tsx` | `dashboard/actions.ts` | `FrostDashboard.tsx`, `DashboardGreeting.tsx`, `DashboardDrawers.tsx`, `DashboardTourBanner.tsx` (DOM overlay highlight, position:fixed, z-48), `DashboardTourContext.tsx` (startTour/closeTour/steps 0-7), `TodaySchedule.tsx`, `widgets/EarningsPulseWidget.tsx`, `widgets/AdaptiveContextStrip.tsx` (4 states: empty/quiet/moderate/busy), `widgets/FrostMetricsStrip.tsx` (ticker, touch-drag), `widgets/frost/WeeklyChartWidget.tsx`, `widgets/frost/PeakHoursWidget.tsx`, `widgets/frost/CancellationRateWidget.tsx`, `widgets/frost/NextFreeDaysWidget.tsx`, `widgets/frost/InsightsRow.tsx`, `widgets/frost/ChannelHealthWidget.tsx`, `widgets/frost/TopServicesWidget.tsx` |
| `/dashboard/bookings` | Command Center: Day (Timeline) / Week+Month (Bento Analytics) switching | `bookings/page.tsx` | `bookings/actions.ts` | `BookingsPage.tsx`, `BookingCard.tsx`, `PeriodAnalyticsView.tsx` |
| `/dashboard/clients` | CRM: клієнти, теги, VIP, нотатки, retention, LTV, реферали | `clients/page.tsx` | `clients/actions.ts` | `master/clients/ClientsPage.tsx`, `ClientDetailSheet.tsx`, `ClientWidgets.tsx` |
| `/dashboard/services` | CRUD послуг та товарів (reorder, активація) | `services/page.tsx` | — | `master/services/ServicesPage.tsx` |
| `/dashboard/analytics` | Аналітика Pro: виручка, топ-послуги, retention-когорти, CSV | `analytics/page.tsx` | — | `master/analytics/AnalyticsPage.tsx` |
| `/dashboard/flash` | Redirect Gateway to `/dashboard/revenue?tab=flash_deals` | `flash/page.tsx` | — | Redirect Gateway |
| `/dashboard/pricing` | Redirect Gateway to `/dashboard/revenue?tab=dynamic_pricing` | `pricing/page.tsx` | — | Redirect Gateway |
| `/dashboard/billing` | Підписки Monobank: tier, оплата, checkout | `billing/page.tsx` | `billing/actions.ts` | `master/billing/BillingPage.tsx` |
| `/dashboard/settings` | Розклад, відпустки, Telegram, локація, тема | `settings/page.tsx` | `settings/actions.ts` | `master/settings/SettingsPage.tsx`, `VacationManager.tsx`, `LocationPicker.tsx` |
| `/dashboard/loyalty` | Redirect Gateway to `/dashboard/growth?tab=loyalty` | `loyalty/page.tsx` | — | Redirect Gateway |
| `/dashboard/referral` | Redirect Gateway to `/dashboard/growth?tab=referral` | `referral/page.tsx` | — | Redirect Gateway |
| `/dashboard/studio` | Studio-режим: запрошення майстрів | `studio/page.tsx` | `studio/actions.ts` | `master/studio/StudioPage.tsx` |
| `/dashboard/partners` | Redirect Gateway to `/dashboard/growth?tab=partners` | `partners/page.tsx` | — | Redirect Gateway |
| `/dashboard/revenue` | Revenue Hub: вкладки "Флеш-акції" та "Смарт-ціни" (inline) | `revenue/page.tsx` | — | `master/revenue/RevenueHubClient.tsx` |
| `/dashboard/marketing` | Marketing Hub: Story Generator + Broadcast розсилки (in-app/Push/Telegram/SMS) | `marketing/page.tsx` | `marketing/actions.ts` | `master/marketing/StoryGenerator.tsx`, `BroadcastEditor.tsx`, `BroadcastHistory.tsx` |
| `/dashboard/marketing/new` | Нова розсилка — окрема сторінка (No-Modals policy) | `marketing/new/page.tsx` | — | `master/marketing/BroadcastEditorPage.tsx` → `BroadcastEditor.tsx` |
| `/dashboard/marketing/[id]` | Деталі розсилки по клієнтах (per-client delivery results) | `marketing/[id]/page.tsx` | — | `master/marketing/BroadcastDetailPage.tsx` |
| `/dashboard/growth` | Growth Hub: вкладки "Лояльність", "Реферали" та "Партнери" (inline) | `growth/page.tsx` | — | `master/growth/GrowthHubClient.tsx` |
| `/dashboard/portfolio` | Портфоліо: CRUD кейсів, фото (drag-reorder), consent клієнта, прив'язка до послуг/відгуків | `portfolio/page.tsx` | `portfolio/actions.ts` | `master/portfolio/PortfolioPage.tsx`, `PortfolioItemPage.tsx`, `PortfolioItemCard.tsx`, `PortfolioPhotoUploader.tsx` |
| `/dashboard/portfolio/[id]` | Редагування кейсу портфоліо (No-Modals policy). Ліміт Starter = 5 публічних; захист на 3 рівнях. | `portfolio/[id]/page.tsx` | `portfolio/actions.ts` | `master/portfolio/PortfolioItemPage.tsx` |
| `/dashboard/products` | Товари: CRUD (for_sale), стоки, замовлення | `products/page.tsx` | `products/actions.ts` | `master/products/ProductsPage.tsx` |

| `/dashboard/documents` | Юридичні документи майстра | `documents/page.tsx` | — | `master/documents/DocumentsPage.tsx` |
| `/dashboard/support` | Підтримка | `support/page.tsx` | — | `master/support/SupportPage.tsx` |
| `/dashboard/more` | Додаткові посилання: юридика, акаунт | `more/page.tsx` | — | `master/more/MorePage.tsx` |
| `/dashboard/academy` | BookIT Академія: 2 tabs (Функції/Цілі), 6+4 sections, 26 articles accordion, Emil springs, deep links, "Пройти тур знову" | `academy/page.tsx` | — | `master/academy/AcademyPage.tsx` (hardcode content, AnimatePresence mode="wait", layoutId tab pill, SPRING_* consts) |

### Frost Dashboard Grid Architecture (updated 2026-05-30)
- **File**: `src/components/master/dashboard/FrostDashboard.tsx` — `FrostDesktop` + `FrostMobile`
- **Grid pattern**: CSS Grid rows with `align-items: stretch` (default) — NO `items-start`. All rows equal height per pair.
- **Widget fill chain**: tour-step wrapper `flex flex-col` → widget root `bento-card flex flex-col flex-1` → footer `mt-auto`
- **PeakHoursWidget**: heatmap cells `flex-1 min-h-[10px]` — dynamically scales to fill card height (matches WeeklyChart row)
- **ChannelHealthWidget**: empty state (0 clients) → icon + title + subtitle + CTA `/dashboard/clients`
- **Row layout (desktop)**:
  - `3fr 2fr`: AdaptiveContextStrip + EarningsPulseWidget
  - `3fr 2fr`: ScheduleWidget + FreeSlotsWidget
  - `55fr 45fr`: WeeklyChartWidget + PeakHoursWidget
  - Full: MonthlyCalendarWidget
  - `1/2 1/2`: TopServicesWidget + CancellationRateWidget
  - `1/3 1/3 1/3`: InsightsRow + NextFreeDaysWidget + ChannelHealthWidget
- **FreeSlotsWidget slot-click → ManualBookingForm** (2026-05-30): `onSlotClick?(time,serviceId)` prop; slot `<span>`→`<button>`; `FrostDashboard` owns `WizardSlot|null` state; `ManualBookingForm` got `initialServiceId?` → `useMemo`→`initialServices`; `todayISO()` uses local date (not UTC `.toISOString()`)

### Onboarding Wizard (v2 — 5-step, 2026-05-29)
- **Primary route**: `src/app/(master)/dashboard/onboarding/` — всередині master layout з `isOnboarding` guard; чистий Frost environment (без nav/sidebar)
- **Legacy route**: `src/app/onboarding/page.tsx` — окремий layout; тепер `data-theme="frost"` wrapper (BlobBackground видалено 2026-05-29)
- `(master)/layout.tsx` → `isOnboarding = pathname.startsWith('/dashboard/onboarding')` → повертає чистий div `data-theme="frost"` без DashboardLayout і без SupportWidget
- **Нові кроки (v2)**: `PROFILE → SERVICES → SCHEDULE → PREVIEW → SUCCESS`
- **Legacy step mapping** (всередині `OnboardingWizard`): BASIC→PROFILE, SCHEDULE_PROMPT/FORM→SCHEDULE, SERVICES_PROMPT/FORM→SERVICES, PROFIT_PREDICTOR/PROFILE_PREVIEW→PREVIEW, CHANNELS→SUCCESS
- `OnboardingProgress.tsx` — 5-dot named progress bar (animated connectors, active dot scales 1.25×)
- **Step components**: `StepProfile.tsx` (1), `StepServices.tsx` (2, per-category), `StepSchedule.tsx` (3, per-day rows), `StepPreview.tsx` (4, glassmorphism card + slug edit), `StepSuccess.tsx` (5)
- `StepSchedule`: one-tap "Пн–Сб 10–19" chip → save+advance; "Свій графік" → per-day rows з часом + "до всіх"
- **Frost theme at SSR level (2026-05-29)**: `src/app/layout.tsx` reads `x-pathname` header → if path starts with `/dashboard/onboarding` or `/onboarding` → forces `theme='frost'` on `<html data-theme>` server-side → inline `beforeInteractive` script sets `body.bg='#EFF2FF'` before JS loads. Fixes Blossom background visible during hydration gap on PC.
- **Scroll/theme isolation (2026-05-29)**: `OnboardingWizard` useEffect → `html/body overflow:hidden`, `overscrollBehavior:none`, `backgroundColor:#EFF2FF` — запобігає iOS rubber-band overscroll з Blossom тлом
- **Race condition fix (2026-05-29)**: Видалено `router.refresh()` перед `router.push()` у PhoneOtpForm.tsx — запобігає рейс між refresh RSC і push navigation
- **Persistence (2026-05-29)**: `saveOnboardingProgress()` тепер використовує `createAdminClient()` (bypass RLS) після верифікації через `getUser()`. Supabase RLS silent failure: anon-client UPDATE повертає `{error:null}` з 0 рядків при блокуванні — крок ніколи не зберігався. Admin client гарантує запис. Import: `@/lib/supabase/admin`.
- `persistStep()` helper (з error logging) → `saveOnboardingProgress()` server action → `profiles.onboarding_step` + `profiles.onboarding_data`
- `checkAndUpdateSlug(slug)` server action → uniqueness check + `master_profiles.slug` update (StepPreview inline editing)
- **OnboardingData v2**: `categoryPrices: Record<catId, string>` + `categoryServiceTypes: Record<catId, Record<tier, bool>>` (per-category)
- a11y: CTA button text `#0f172a` on `#789A99` accent = 5.85:1 (WCAG AA pass)
---

## [Platform Admin Zone] — `admin/...`

### Layout & Theme Guard
- `src/app/admin/layout.tsx` — Server Component; перевіряє адміністративну роль (`role === 'admin'`); ініціює `AdminThemeApplier` для форсування теми **Frost (Ice Lavender)**
- `src/components/admin/AdminThemeApplier.tsx` — клієнтський компонент для накладання CSS змінних теми Frost

### Routes → Компоненти → Server Actions

| Route | Відповідальність | Page | Actions | Key Component |
|---|---|---|---|---|
| `/admin` | Панель огляду: фінансові та операційні метрики BookIT, Bento Grid метрик та Recharts графіки | `admin/page.tsx` | — | `AdminOverviewCharts.tsx` |
| `/admin/masters` | CRM майстрів: пошук, фільтрація, зміна тарифних планів та тригер "Увійти як майстер" (impersonation) | `admin/masters/page.tsx` | — | `MastersDirectory.tsx` |
| `/admin/alliances` | B2B Альянси: візуальний граф партнерських мереж на Framer Motion та списки рефералів | `admin/alliances/page.tsx` | — | `AllianceMap.tsx` |
| `/admin/moderation` | Модераційний хаб: перевірка скарг на контент (відгуки, портфоліо), блокування та налаштування лімітів | `admin/moderation/page.tsx` | — | `ModerationHub.tsx` |
| `/admin/support` | Пульт техпідтримки: спліт-скрін реального часу з чатами користувачів, чергою тікетів та Realtime оновленнями | `admin/support/page.tsx` | `support.ts` | `AdminSupportConsole.tsx` |
| `/admin/logs` | Системні логи: діагностика статусів сповіщень, лог помилок каналів та активних SMS OTP | `admin/logs/page.tsx` | — | `SystemLogsViewer.tsx` |

---

## [Marketing / Landing Page] — `/`

- Route: `src/app/page.tsx` → `src/components/landing/RootPageClient.tsx` (TMA guard) → `src/components/landing/LandingPageContent.tsx`
- Theme: independent `.landing-page` CSS class in `globals.css` — `--l-*` custom properties — **Frost palette** (updated 2026-05-27)
- Palette: `--l-bg #EFF2FF` · `--l-bg-alt #E6EAFF` · `--l-accent #0F172A` · `--l-indigo #4338CA` (WCAG AAA 7.08:1, all text) · `--l-indigo-glow #6366F1` (decorative/large text only) · `--l-muted #475569` (AA 6.79:1) · `--l-surface #FFFFFF`
- Default theme for new registrations: `mood_theme: 'frost'` set in `register/actions.ts` Phase1+Phase3 upserts
- **Dependencies (landing-specific):** `gsap@^3.15.0` + `gsap/ScrollTrigger` for card-rise scroll stack; `framer-motion` for per-section animations

### Landing Sections — 14 active (`src/components/landing/`)

**Pre-stack (normal scroll flow):**
| # | Component | Bg | Notes |
|---|---|---|---|
| 1 | `LandingHero.tsx` | `#EFF2FF` | Frost 3D mockup hero — `perspective(1400px)` + `rotateX` scroll 12°→0°; `FrostDashboardMockup` inline component |
| 2 | `LandingTrustBar.tsx` | transparent | 5 stats: 500+ майстрів · ₴12M · 4.9★ · 50+ міст · 98% |
| 3 | `LandingMarquee.tsx` | transparent | Infinite ticker of tool/integration names |

**GSAP Card-Rise Stack** (`overlap: true` → 30vh rise; `overlap: false` → transparent bg, excluded):
| # | Component | Bg | overlap | Notes |
|---|---|---|---|---|
| 4 | `LandingAgitation.tsx` | `#FFFFFF` | ✓ | Sticky left "Звикла до хаосу?", 4 `PainItem` sub-components — word-by-word h3 + sentence body animations |
| 5 | `LandingMagic.tsx` | `var(--l-bg)` | ✓ | 3 `FeatureCard` sub-components alternating direction (24/7, +27%, ×3 stats) |
| 6 | `LandingBentoFeatures.tsx` | `#0F172A` | ✓ | Dark — Smart Slots week×time grid; `CountUp` (useState+useMotionValueEvent fix) |
| 7 | `LandingIntegrations.tsx` | `#FFFFFF` | ✓ | Notification channel previews (TG/Push/SMS mockups), channels table |
| 8 | `LandingClientFlow.tsx` | `var(--l-bg)` | ✓ | 3 `StepCard` sub-components — 3-col grid with detail chips |
| 9 | `LandingComparison.tsx` | `#FFFFFF` | ✓ | Before/after 5 rows with X/Check icons |
| 10 | `LandingProcess.tsx` | `var(--l-bg)` | ✗ | Master onboarding 3 `StepItem` sub-components, sticky left col, pulse badge — excluded: transparent bg |
| 11 | `LandingEconomy.tsx` | `var(--l-bg-alt)` | ✓ | Interactive ROI calculator: 3 sliders → `formatCurrency` projections |
| 12 | `LandingPricing.tsx` | `var(--l-bg-alt)` | ✓ | Starter / Pro (accent `#0F172A`, shadow `rgba(99,102,241,0.28)`) / Studio |
| 13 | `LandingFAQ.tsx` | `var(--l-bg)` | ✗ | Sticky 2-col, AnimatePresence height accordion — excluded: transparent bg |
| 14 | `LandingFooterCTA.tsx` | `#0F172A` | ✓ | Dark — Frost indigo glows, NO film grain (parallax container GPU rule) |

> ⚠️ `LandingTestimonials.tsx` — file exists (untracked), **NOT yet integrated** into `LandingPageContent.tsx`. Planned between Economy (#11) and Pricing (#12).

**Shared utility components (`src/components/landing/`):**
- `LandingScrollProgress.tsx` — thin indigo progress bar pinned at top (`position: fixed, z-index: 100`)
- `LandingSplitHeading.tsx` — animated heading utility: word-by-word mask reveal per line; props: `text`, `stagger`, `lineDelay`, `as` (h1/h2/h3/h4)

### GSAP Scroll Stack Architecture (`LandingPageContent.tsx`)

```
overflowX: 'clip' on <main>  →  clips horizontally without creating scroll container

SECTIONS array → each entry: { Component, id, overlap: boolean }
isRising = overlap:true AND prev.overlap:true

Rising sections (6): Magic, BentoFeatures, Integrations, ClientFlow, Comparison, Pricing
  → wrapper: marginTop:'-30vh', borderRadius:'1.5rem 1.5rem 0 0', overflow:'clip', boxShadow
  → gsap.set(y:'30vh') counteracts margin-top visually on load
  → scrollTrigger: trigger=prev.id, start:'bottom bottom', end:'+=30vh', pin:true, scrub:1

Excluded (overlap:false): Process (sticky left col), FAQ (AnimatePresence)
  → normal scroll, no pin, no rise
```

**Cleanup:** `gsap.context()` → `ctx.revert()` on unmount. `ScrollTrigger.refresh()` called after all triggers registered. `invalidateOnRefresh: true` on each trigger.

### Per-Section Animation Patterns

All numbered sections (Agitation, Process, ClientFlow) and feature rows (Magic) use:
- **Card entrance**: `initial={{ opacity:0, y:32, scale:0.97 }}` → `duration:0.65, ease:[0.22,1,0.36,1]`
- **Word-by-word h3**: inline `overflow:hidden` + `motion.span y:'110%'→0`, `delay: 0.08 + wi*0.065`
- **Sentence body**: `splitSentences()` via lookbehind `/(?<=[.?!]) /`; `y:'115%', opacity:0→1`, `delay: 0.08 + si*0.16`
- **Simultaneous start**: both title and body start at base `delay:0.08`
- **Per-item refs**: each sub-component (PainItem, StepItem, StepCard, FeatureCard) has own `useInView(ref, { once:true, margin:'-60px' })`

### Design Rules (Landing-specific)
- **Eyebrows**: always `color: 'var(--l-indigo)'` = `#4338CA` — NEVER `var(--l-accent)`
- **Forest green purged**: no `rgba(30,69,53,...)` anywhere — replaced with `rgba(99,102,241,...)`
- **spring** `{ type:'spring', stiffness:240, damping:26 } as const` — always a `const`, never inline
- **Hooks in `.map()`**: FORBIDDEN — always extract a named sub-component with its own `useInView` ref
- **`ringColor`** is NOT a valid `React.CSSProperties` key — use `outline`/`border` instead
- **Film grain on parallax containers**: FORBIDDEN — GPU continuous repaint on scroll
- **overflow:hidden on GSAP wrappers**: safe (no internal sticky in overlap:true sections); use `overflow:'clip'` if uncertain
- **CountUp**: always `useState` + `useMotionValueEvent(sv,'change',v=>setText(...))` — never MotionValue-as-child (invisible on mobile)

---

## [B2C / Client Zone] — Public & Client Area

### Публічна Сторінка Майстра
- Route: `src/app/[slug]/page.tsx` — Server Component, SSR, SEO
- Actions: `src/app/[slug]/actions.ts` (server-side data fetch)
- Key component: `src/components/public/PublicMasterPage.tsx` (~40KB, головний рендер сторінки)
- **Public Profile**: `/[slug]` (Next.js SSR + ISR).
- **Dynamic OG Images**: `/[slug]/opengraph-image.tsx` (Edge Runtime). Premium design with Master Avatar + Category Emojis.
- **Shared Data Layer**: `src/app/[slug]/data.ts` — єдине джерело даних для Page, Metadata та OG (через `React.cache`).
- **Structured Data**: JSON-LD implementation for `ProfessionalService` and `AggregateRating`.
- **Bento Bottom Nav**: Асиметрична мозаїчна сітка (3/5 Hero, 2/5 Side, 5/5 Wide).
- **Blossom Atmosphere**: Теплі коричневі та персикові тони з Glassmorphism (`backdrop-blur-3xl`).
- **Studio Theme**: Темний режим для майстрів (Deep Teal & Gold).
- **Command Center**: Центрована навігація для 15+ функціональних зон без UI-шуму.
- **Vaul Engine (Standard)**: Всі модалки та шторки на мобілці використовують `@/components/ui/BottomSheet`.
- Booking Entry Point: `src/components/shared/BookingWizard.tsx`
- Кроки: послуги → товари → дата → слот → підтвердження → SMS OTP (guest)
- Server Action: `src/lib/actions/createBooking.ts`
- Ціноутворення: `src/lib/actions/computeBookingPrice.ts`
- Auth після букінгу: `src/components/public/PostBookingAuth.tsx` — кроки: `choose → phone → otp → channels`; **channels** (Фаза 4): TG deep-link + Push subscribe до редиректу в `/my/bookings`; отримує `masterId`, `masterC2cEnabled`, `masterC2cDiscountPct`; рендерить loyalty card / C2C teaser / BookIT fallback
- Phone discount lookup: `getActivePhoneDiscount` (debounced, 400ms) → показується в ClientDetails до підтвердження

### Short Link Redirect
- Route: `src/app/r/[code]/route.ts` — redirect + click tracking (`broadcast_links.clicks++`)
- Формат: `bookit.com.ua/r/[6-char-code]` → `target_url` (з `?serviceId=` для pre-selection)

### Booking URL (Studio path)
- Route: `src/app/studio/[slug]/page.tsx` — окрема точка входу для Studio-сторінки
- `src/components/public/StudioPublicPage.tsx`

### Explore (Каталог Майстрів)
- Route: `src/app/explore/page.tsx`
- Component: `src/components/public/ExplorePage.tsx` (~16KB)

### Client Area `/my/`
- Layout: `src/app/my/layout.tsx` — fetches `profiles.telegram_chat_id` + `push_subscriptions` count; рендерить `ChannelBanner` якщо хоч один канал відсутній (Фаза 4)
- `src/components/client/ChannelBanner.tsx` — persistent top-banner: TG deep-link + Push; закривається X (сесійно); зникає server-side коли обидва канали підключені
- `src/app/my/bookings/` → `MyBookingsPage.tsx` + `my/bookings/actions.ts`
- `src/app/my/profile/` → профіль клієнта
- `src/app/my/masters/` → мої майстри
- `src/app/my/loyalty/` → прогрес лояльності
- `src/app/my/notifications/` → `ClientNotificationsPage.tsx` — in-app нотифікації + pending portfolio consent requests
- `src/app/my/portfolio-consent/actions.ts` → `approvePortfolioConsent`, `declinePortfolioConsent`

### Публічний Магазин
- `src/app/[slug]/shop/page.tsx` — SSR, revalidate 60s; fetches products + active orders for auth client; Pro/Studio only
- `src/components/public/ShopPage.tsx` — клієнтський компонент: каталог товарів, кошик, checkout форма (pickup / Nova Poshta), `createOrder` server action
- Order flow: `createOrder` → INSERT `orders` + `order_items` → decrement stock (`increment_stock_rpc`) → master отримує сповіщення
- На сторінці майстра: Shop Banner (до послуг) + Products preview strip (до 3 товарів + "Всі товари")
- `master_profiles.ships_nova_poshta BOOLEAN` — контролює чи пропонується доставка Нова Пошта

### Публічне Портфоліо
- `src/app/[slug]/portfolio/page.tsx` — SSR grid усіх опублікованих робіт майстра, revalidate 300s
- `src/app/[slug]/portfolio/[id]/page.tsx` — SSR детальна сторінка: фото, відгуки, клієнт, inline BookingFlow (PortfolioBookingButton)
- `src/components/public/portfolio/PublicPortfolioGallery.tsx` — горизонтальний strip: 2 items + "Всі роботи" (на сторінці майстра, після Shop Banner)
- `src/components/public/portfolio/PortfolioBookingButton.tsx` — client component: кнопка + inline BookingFlow з pre-selected послугою

### Auth Flow
- `src/app/(auth)/layout.tsx` — split-screen Frost layout: 45% dark brand panel (#0F172A + aurora blobs) + 55% form panel; mobile single-column (updated 2026-05-28)
- `src/components/auth/PhoneOtpForm.tsx` — 3-step flow (role_select→phone→otp); "Nordic Slab" redesign: white container on lavender, stacked role cards (dark slab selected / dashed outline unselected), 3-segment progress line, spring stiffness:340; WCAG AA compliant; no bento-card (updated 2026-05-28)
- `src/app/(auth)/` — login/register
- `src/app/auth/callback/` — OAuth callback
- SMS OTP: `src/app/api/auth/send-sms/`, `verify-sms/`, `link-booking/`
- SMS OTP form: `src/components/public/ClientAuthSheet.tsx` + `NavLoginSheet.tsx`
- Telegram Mini App: `src/components/providers/TelegramProvider.tsx` + `src/components/telegram/TelegramWelcome.tsx`
- TMA API: `src/app/api/auth/telegram/route.ts`, `src/app/api/auth/telegram/link-phone/route.ts`, `src/app/api/telegram/webhook/route.ts`
- TMA identity sync: `link-phone` must recover drifted identities where `auth.users` exists but `profiles` is missing; webhook contact path must use E.164 to match `profiles.phone`

### Invite / Join
- `src/app/invite/[code]/` — реферальний лендінг
- `src/app/studio/join/` — прийняти запрошення в студію

### Legal
- `src/app/(public)/legal/[slug]/page.tsx` — SSG, читає `src/content/legal/*.md`
- Компонент: `src/components/shared/LegalFooterLinks.tsx`
- Константи: `src/lib/constants/legal.ts`

---

## [Core Logic & State]

### Supabase Clients
| Файл | Призначення |
|---|---|
| `src/lib/supabase/client.ts` | Singleton browser client; `pwaDummyLock`, `autoRefreshToken:false`, custom fetch timeout |
| `src/lib/supabase/server.ts` | SSR client (cookies) — Server Components & Actions |
| `src/lib/supabase/admin.ts` | ЄДИНА точка `service_role_key` — тільки API routes + cron |
| `src/lib/supabase/context.tsx` | `MasterProvider` / `MasterContext` — user, profile, masterProfile, isLoading |
| `src/lib/supabase/safeQuery.ts` | `safeQuery` / `safeMutation` wrapper — уніформна обробка помилок |

### TanStack Query Hooks (`src/lib/supabase/hooks/`)
| Hook | staleTime | Дані |
|---|---|---|
| `useBookings.ts` | 2 хв | Список записів майстра |
| `useBookingById.ts` | — | Один запис (для DrawerDetail) |
| `useDashboardStats.ts` | 1 хв | Статистика дашборду |
| `useAnalytics.ts` | 5 хв | Аналітика (виручка, топ, retention) |
| `useServices.ts` | 10 хв | Послуги + категорії |
| `useProducts.ts` | 10 хв | Товари |
| `useOrders.ts` | — | Замовлення товарів |
| `useClients.ts` | — | CRM-клієнти через RPC `get_master_clients` |
| `useNotifications.ts` | 30 с | In-app нотифікації |
| `useRealtimeNotifications.ts` | — | Supabase Realtime підписка на `notifications` |
| `useFlashDeals.ts` | — | Flash-акції |
| `useReviews.ts` | — | Відгуки |
| `usePortfolioItems.ts` | 0 | Portfolio items майстра (з photos + review_ids, refetch on mount) |
| `useBroadcasts.ts` | — | Broadcasts list, preview recipients, clients picker, delivery results |
| `useTimeOff.ts` | — | Відпустки / вихідні |
| `useVacation.ts` | — | Schedule exceptions |
| `useWizardSchedule.ts` | — | 30-денний розклад для BookingWizard |
| `useWeeklyOverview.ts` | — | Тижневий огляд |
| `useClientNote.ts` | — | Нотатки клієнтів |
| `useProductLinks.ts` | — | product_service_links |
| `useOrders.ts` | — | Замовлення товарів майстра (orders + order_items) |
| `useDateRange.ts` | — | Аналітика за діапазоном дат |
| `useBusyness.ts` | 1 хв | Завантаженість майстра (today, week, month) |
| `useSlotsFromStore.ts` | — | Розрахунок слотів на клієнті на основі кешованого розкладу |

### Session / PWA Hooks (`src/lib/hooks/`)
- `useSessionWakeup.ts` — visibility change → `resetFetchController` → `invalidateQueries` (усуває нескінченні скелетони після переключення вкладок)
- `useDeepSleepWakeup.ts` — JS freeze detection → `onlineManager` + `invalidateQueries`
- `useTour.ts` — онбординг-тур (has_seen_tour)
- `useLiveChat.ts` — real-time чат підтримки через Supabase Realtime з можливістю надсилання тексту та медіа-вкладень
- Provider: `src/lib/providers/QueryProvider.tsx`

### Slot Engine
- `src/lib/utils/smartSlots.ts` — `generateAvailableSlots`, `scoreSlots`, `buildSlotRenderItems`; Fluid Anchor алгоритм (snap при зіткненні з перервою)
- `src/lib/utils/dynamicPricing.ts` — `calculateDynamicPrice(basePrice, rules, slotDateTime)` → ціна в копійках; `DISCOUNT_FLOOR=-30%`, `MARKUP_CEIL=+50%`
- `src/lib/actions/computeBookingPrice.ts` — фінальний розрахунок ціни бронювання
- `src/lib/actions/createBooking.ts` — повна логіка створення запису (26KB)

### Notifications — NotificationOrchestrator (v7.0)
> Детальна карта: `XDEV/MAPS/NOTIFICATION_MAP.md`

**Архітектура (Фази 1–4 завершено):**
- `src/lib/notifications/NotificationOrchestrator.ts` — **єдина точка відправки** всіх сповіщень; ніхто не відправляє канали напряму
- `src/lib/notifications/constants/notifMap.ts` — реєстр 21 типу подій; шаблони UA; `isCritical` + `sms: null` захист від небажаних SMS
- `src/lib/notifications.ts` — тонкий фасад, зворотньосумісний; `notifyMasterBilling`, `notifyMasterStockAlert`, `notifyClientOrderStatus` — нові функції

**Каскад:** `In-App + Push (паралельно) → Telegram → SMS (тільки critical)`

**Критичні події** (SMS дозволений): `booking_created`, `booking_confirmed`, `booking_cancelled`, `reminder_2h`, `subscription_failed`

**Некритичні** (SMS фізично заблоковано через `sms: null`): всі нагадування, shop, stock, billing paid/expiring/downgraded

**Канальні драйвери:**
- `src/lib/push.ts` — `sendPush`, `broadcastPush`; авто-cleanup 410/404 підписок
- `src/lib/telegram.ts` — `sendTelegramMessage` (підтримує `replyMarkup`)
- `src/lib/turbosms.ts` — SMS fallback (TurboSMS)

**Логування:** `notification_logs` таблиця — event_type, channel, status (success/failed/skipped), error_text; RLS: майстер читає свої

**Adoption Mechanics (Фаза 4):**
- `PostBookingAuth.tsx` — крок `channels` після SMS OTP (TG + Push до редиректу)
- `ChannelBanner.tsx` — persistent banner у `/my/` поки немає обох каналів
- `StepChannels.tsx` — крок CHANNELS в онбордингу майстра (TG token + Push)

### Billing (`src/lib/billing/`)
| Файл | Відповідальність |
|---|---|
| `PaymentProvider.ts` | Abstract interface: `createCheckout`, `verifyWebhookSignature`, `chargeRecurrent` |
| `MonoProvider.ts` | Monobank: invoice create (з `saveCardData`), Ed25519 sig verify + key rotation |
| `pricing.ts` | Pure функції: bounty/lifetime discount stacking, tier pricing (unit-tested) |
| `pricing.test.ts` | Vitest suite (27 тестів, no floating-point помилок) |
| `billing.test.ts` | Ed25519 webhook verification (6 тестів) |

### URL Action Bus (`src/lib/actions/UrlActionBus.ts`)
- Pattern: Command Bus via Search Params — будь-яке посилання (ззовні чи всередині) відкриває складний UI-flow
- Параметри: `?_action=<type>` + індивідуальні payload params (без base64)
- `useUrlActionBus<T>(actionType, handler)` — hook для consumer-компонентів; Zod-валідація + авто-cleanup URL через `window.history.replaceState`
- `buildActionUrl<T>(path, action, payload)` — helper для генерації deep-link URLs
- Registered actions: `booking:create`, `booking:reschedule`, `client:open`, `marketing:broadcast`, `ui:open_drawer`, `flash:create`, `product:edit`
- Active consumers: `PublicMasterPage` (`booking:create`), `BroadcastsTab` (`marketing:broadcast`)

### Routing Guard
- `src/proxy.ts` — `export async function proxy(request: NextRequest)` — замінює `middleware.ts` (Next.js 16)
- Правила: `/dashboard` → master only; `/my` → auth; `/login|/register` → guest only

### Dashboard Ambient System (`src/app/layout.tsx` + `globals.css`)
- **Body background**: `radial-gradient` теплі шари поверх `--background`. Studio: teal bloom from top.
- **Ambient blobs**: `.ambient-blob-1/2/3` — `position:absolute` всередині `blob-container`, `filter:blur(80-100px)`, CSS `@keyframes` blob-1/2/3 (60s/72s/52s loops). НЕ JS.
- **Grain overlay**: `body::after` — SVG fractalNoise, `opacity: 0.52` з `mix-blend-mode: overlay`. Studio: `opacity: 0.36`.
- **Vignette**: `body::before` — `radial-gradient(ellipse 130% 110% at 50% 50%, transparent 48%, rgba(...) 100%)`. Studio: `rgba(0,0,0,0.30)`.
- CSS custom props: `--blob-1/2/3` (тематичні). Blossom: `rgba(100,78,55,0.22)`. Studio: `rgba(26,61,69,0.80)`.

### Utilities (`src/lib/utils/`)
| Файл | Експорти |
|---|---|
| `dates.ts` | `formatDate`, `formatDateFull`, `formatDayFull`, `timeAgo`, `formatDurationFull` |
| `pluralUk.ts` | `pluralUk(n, one, few, many)` — єдиний plural helper |
| `smartSlots.ts` | `generateAvailableSlots`, `scoreSlots`, `buildSlotRenderItems` |
| `dynamicPricing.ts` | `calculateDynamicPrice`, `stackRules` |
| `phone.ts` | E.164 нормалізація |
| `slug.ts` | slug генерація |
| `now.ts` | `getNow()` — debug clock override через cookie |
| `cn.ts` | `clsx` + `tailwind-merge` |
| `broadcastUtils.ts` | `matchesTagFilters`, `personalizeMessage`, `buildTargetUrl` (`?serviceId=`), `generateShortCode` |
| `bookingEngine.ts` | `computeBookingTotals`, `computeEndTime`, `buildBookedTimeSet`, `buildOffDaySet` |
| `currency.ts` | `formatCurrency`, `formatPrice` |
| `errors.ts` | `parseError(err)` — all error parsing (ZodError, Error, custom) |
| `token.ts` | `generateSecureToken`, `sha256Hex` |
| `url.ts` | `getBaseUrl()` |
| `uuid.ts` | `flatUidToUuid(flat)` |
| `occupancy.ts` | `computeOccupancy` |

### Validations
- `src/lib/validations/booking.ts` — Zod schema для BookingWizard

### API Routes (`src/app/api/`)
| Route | Метод | Призначення | Auth |
|---|---|---|---|
| `/api/auth/send-sms` | POST | OTP відправка (rate-limit: 3/15хв phone, 10/год IP) | Public |
| `/api/auth/verify-sms` | POST | OTP перевірка → magiclink token | Public |
| `/api/auth/link-booking` | POST | Прив'язка pending booking після SMS auth | Anon+token |
| `/api/billing/mono-webhook` | POST | Monobank Ed25519 verify → extend subscription + upsert recToken | Ed25519 |
| `/api/billing/test-charge` | POST | 5 UAH тестова оплата → checkout URL | Master auth |
| `/api/billing/paid` | POST | Redirect після оплати | Public |
| `/api/cron/reminders` | GET | 3 суворих вікна (24h/2h/30m) + morning briefing 08:00 Kyiv → Orchestrator (`0 * * * *`) | CRON_SECRET |
| `/api/cron/rebooking` | GET | Smart rebooking push клієнтам (`0 10 * * *`) | CRON_SECRET |
| `/api/cron/reset-monthly` | GET | Downgrade прострочених + попередження за 2–4 дні → `notifyMasterBilling` (`5 0 1 * *`) | CRON_SECRET |
| `/api/cron/expire-subscriptions` | GET | Dunning: charge recurrent, free month, dunning → `notifyMasterBilling` (`0 2 * * *`) | CRON_SECRET |
| `/api/cron/check-uncompleted` | GET | Per-master buffer_minutes, ідемпотентність 55 хв → Orchestrator (`0 * * * *`) | CRON_SECRET |
| `/api/push/subscribe` | POST/DELETE | CRUD Web Push підписок | Auth |
| `/api/notify` | — | (порожня директорія) | — |
| `/api/telegram` | — | Telegram webhook (внутрішній) | — |
| `/api/flash` | — | Flash deal API | — |

---

## [Database Layer] — Supabase PostgreSQL

### Identity
| Таблиця | Призначення |
|---|---|
| `profiles` | Всі юзери: `full_name`, `phone` (E.164), `role`, `telegram_chat_id` (клієнт), `onboarding_step`, `onboarding_data`, `health_notes`, `medical_notes` |
| `master_profiles` | Бізнес-профіль: `slug`, `subscription_tier`, `working_hours` (jsonb), `pricing_rules` (jsonb), `categories` (text[]), `business_name`, `telegram_chat_id` (бізнес), `theme`, `retention_cycle_days`, `lifetime_discount` |
| `client_master_relations` | CRM: `total_visits`, `total_spent`, `average_check`, `last_visit_at`, `is_vip`, `tags[]`, `health_notes`, `medical_notes`, `is_archived` |
| **Identity Note** | Пріоритет відображення імені: `business_name` (якщо є) → `full_name`. Застосовується в `Explore`, `PublicMasterPage`, `Sidebar`. |

### Catalog
| Таблиця | Призначення |
|---|---|
| `services` | Послуги: `duration` (хв), `price` (копійки), `category`, `position`, `is_active`, `icon_name` |
| `service_categories` | Кастомні категорії послуг |
| `products` | Товари: `price`, `stock`, `is_active`, `stock_alert_threshold INT DEFAULT 3`, `icon_name`, `product_type` |
| `product_service_links` | Рекомендовані товари до послуги |

### Schedule
| Таблиця | Призначення |
|---|---|
| `schedule_templates` | Шаблон робочих годин (резерв, legacy) |
| `schedule_exceptions` | Заблоковані дати (legacy) |
| `master_time_off` | Відпустки / вихідні / короткі дні (активний override, міграція 051) |

### Bookings
| Таблиця | Призначення |
|---|---|
| `bookings` | Записи: `slot_date`, `slot_time`, `total_duration`, `total_price`, `status`, `source`, `dynamic_pricing_label` |
| `booking_services` | Деталі послуг у multi-service |
| `booking_products` | Товари в записі (ціна на момент запису) |
| `orders` | Замовлення товарів з магазину: `master_id`, `client_name`, `phone`, `delivery_type` (pickup/nova_poshta), `delivery_address`, `status`, `total_kopecks` |
| `order_items` | Рядки замовлення: `product_id`, `quantity`, `price_kopecks` |

### Marketing
| Таблиця | Призначення |
|---|---|
| `loyalty_programs` | Програми лояльності майстра (tier model) |
| `flash_deals` | Flash-акції з TTL (`status`: active/expired/booked) |
| `referrals` | C2C реферальні запрошення |
| `master_alliances` | B2B граф: хто кого запросив (незмінний) |
| `master_referrals` | Білінговий трекер реферала (`status`, `is_first_payment_made`) |
| `waitlists` | Листи очікування на слот |
| `broadcasts` | Broadcast-кампанія: `master_id`, `message`, `discount_percent`, `target_tags[]`, `service_id`, `product_id`, `channels[]`, `status` |
| `broadcast_recipients` | Per-recipient трекінг: `broadcast_id`, `client_id`, `phone`, `push_sent`, `telegram_sent`, `sms_sent`, `clicked_at`, `booked_at`, `discount_used_at` |
| `broadcast_links` | Short links: `code` (6-char), `target_url`, `recipient_id`, `clicks` → `bookit.com.ua/r/[code]` |
| `phone_discounts` | Phone-bound одноразова знижка: `phone`, `master_id`, `discount_percent`, `service_id` (nullable), `broadcast_id`, `expires_at`, `used_at` |

### Payments
| Таблиця | Призначення |
|---|---|
| `payments` | Транзакції (provider: 'monobank') |
| `master_subscriptions` | Рекурентна підписка: `token` (vault), `status`, `failed_attempts`, `next_charge_at` |
| `billing_events` | Idempotency лог: `external_id` UNIQUE, `status`, `payload` |

### Studio
| Таблиця | Призначення |
|---|---|
| `studios` | Студія: `owner_id`, `name`, `slug`, `invite_token` |
| `studio_members` | Учасники студії |

### Portfolio & Reviews
| Таблиця | Призначення |
|---|---|
| `portfolio_items` | Кейси/роботи: `title`, `description`, `service_id` FK, `tagged_client_id` FK, `consent_status` (pending/approved/declined), `is_published`, `display_order` |
| `portfolio_item_photos` | Фото кейсу (до 5): `storage_path`, `url`, `display_order`; bucket `portfolios`, path `{master_id}/items/{item_id}/{file}` |
| `portfolio_item_reviews` | Many-to-many: `portfolio_item_id` + `review_id` (composite PK) |
| `reviews` | Відгуки 1–5 (UNIQUE per booking) |

### Notifications
| Таблиця | Призначення |
|---|---|
| `notifications` | In-app: `type`, `is_read`, `related_booking_id` — DB-тригер або Orchestrator INSERT |
| `push_subscriptions` | VAPID Web Push підписки; `user_id` FK |
| `notification_logs` | Лог відправок: `event_type`, `channel`, `status` (success/failed/skipped), `error_text`, `recipient_id`, `master_id` — міграція 136 |

### Platform Admin & Support
| Таблиця / Bucket | Призначення |
|---|---|
| `support_tickets` | Тікети підтримки: `user_id` FK, `type` (feedback/bug/idea/chat), `status` (open/active/resolved), `created_at`, `updated_at` |
| `support_messages` | Повідомлення підтримки: `ticket_id` FK, `sender_id` FK, `message`, `attachment_url` (скріншоти) |
| `content_reports` | Скарги на контент: `reporter_id` FK, `target_type` (review/portfolio_item), `target_id` UUID, `reason`, `status` (pending/resolved) |
| `support_attachments` | Storage Bucket для скріншотів техпідтримки (max 10MB, mime: image/*) |

### Security
| Таблиця | Призначення |
|---|---|
| `sms_otps` | OTP коди (TTL 10 хв, `used` flag) |
| `sms_verify_attempts` | Rate-limit верифікацій (10/15 хв) |
| `sms_ip_logs` | Rate-limit по IP (10/год) |

### Retention
| Таблиця | Призначення |
|---|---|
| `rebooking_reminders` | Дедуплікація rebooking push (`sent_at`) |
| `retention_cycle_days` | Custom retention window per master |

### Ключові RPC функції
| RPC | Призначення |
|---|---|
| `get_master_clients` | CRM-дані + retention_status + VIP + health_notes + medical_notes (міграції 068, 118, 20260516000000) |
| `get_rebooking_due_clients` | Smart rebooking trigger — міграція 078 |
| `check_and_log_sms_attempt` | Atomic advisory lock OTP rate-limit |
| `get_pending_subscriptions_for_billing` | FOR UPDATE SKIP LOCKED — race-safe cron batch |
| `increment_referral_bounty` | Atomic bounty increment |
| `get_master_referral_history` | Швидке отримання історії рефералів без waterfall на клієнті (міграція 20260524124500) |
| `get_retention_status` | Retention dashboard — міграція 076 |

### Міграції
140+ міграцій застосовано в продакшн.
Місце: `supabase/migrations/*.sql`

Останні ключові:
- `114_portfolio_items.sql` — `portfolio_items`, `portfolio_item_photos`, `portfolio_item_reviews` + RLS
- `115_recreate_portfolios_bucket.sql` — bucket `portfolios` (10MB, public) + storage policies
- `116–119` — broadcasts, broadcast_recipients, broadcast_links, phone_discounts
- `126_segment_config.sql` — `segment_config jsonb` на `master_profiles` (Custom CRM Segments)
- `136_notification_logs.sql` — `notification_logs` таблиця + `products.stock_alert_threshold INT DEFAULT 3`
- `137_client_health_notes.sql` / `20260516000000_client_health_system_update.sql` — Unified client health & medical notes
- `137_product_type_and_emoji.sql` — `icon_name`, `product_type` columns on `products`
- `138_service_icon_name.sql` — `icon_name` column on `services` with category-based backfill
- `20260524124500_get_master_referral_history.sql` — `get_master_referral_history` RPC function
