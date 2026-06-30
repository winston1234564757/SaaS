# SYSTEM_MAP — Bookit Architectural Index

> Оновлено: 2026-06-30 · Джерело: живий код (v9.0.0) · Останній код-коміт: `2c48474f` (M-ANL-01: таб «Огляд» editorial-redesign — Закон темного блоку; OverviewBriefing/OverviewTab/SectionHeading/FeaturedServices|Products|Clients/OverviewDetailSheet/AnalyticsActivation/ClientSheetById + декомпозиція useAnalytics→useAnalyticsMarketing; RevenueLineChart→recharts [isAnimationActive=false для headless]; мертвий ServiceRow видалено) · попередній: `e8837dba` (M-MKT-04 фінал: повний a11y-аудит читабельності story-canvas через a11y MCP — авто-тема accent/pill/badge у ВСІХ режимах, плашка 0.62 [worst-case verified], аватар+ім'я sans+чіп на фото, рукописний+плашка, Champagne+градієнти+стокові ВИДАЛЕНО, нудж власних фото) · попередні: `2d98b3c4` (ітерація-2: образи-пресети + авто-колір + link-zone + Sheet-модалка) · `7b2e72d8` (покроковий story-едітор: рерайт шелла в 5-крок візард + pinned прев'ю + useStoryEditor/storySteps + 5 панелей-кроків + текст/градієнт/сток шаблони; M-MKT-03 +4 палітри; reuse StoryCanvas/storyExport/useStoryData) · попередній: `31557c87` (M-GROW-02 мердж партнерів+альянсів → нова `master_connections` bilateral [kind partner/alliance + role], міграція `20260628000008` additive, 7 споживачів перенацілено, UI PartnersPage один список, латентний RLS-баг публічної сторінки пофікшено `mc_public_read`) · попередній: `3cf3deea` (M-GROW-01 лояльність panel: RPC `get_loyalty_overview`+`get_loyalty_impact`, redemption-tracking, OverviewCard+ProgramProgress)
> 
> **⚡ Sprint-05 Status (ACTIVE):** 50/84 ✅ · 3 ↩️ (M-DASH-11 + M-MKT-01/02 поглинуто M-MKT-04) · **Фаза 3: Revenue 6/17 · Growth 2/2 · Marketing 4/6 +2↩️ · Reviews 2/2 · Analytics 1/7 (Огляд ✅, розбито на 7 табів-задач M-ANL-01..07)** | Next: `M-ANL-02` — таб «Джерела» редизайн (`ANALYTICS_TABS_REDESIGN.md` §4) | Трекер: `XDEV/PLANS/SPRINT-05-BACKLOG/TRACKER.md`
> **⏳ Борг M-GROW-02:** drop `master_partners`+`master_alliances` окремою міграцією після ~тижня verify (дані в `master_connections`, старі інертні).
> **⏮ Sprint-04:** закрито на 29/37 (commit `1b1bfb8b`, T30 — Розхідники UX/UI) | Skills: TOP 50 configured (settings.json v9.0.0)
> **🎯 Launch:** 2026-06-22 (минув) | Sprint-05 у роботі
> **🔍 Global Audit:** `XDEV/AUDIT/` — 5 files: 00_OVERVIEW · 01_CODE_QUALITY · 02_SECURITY · 03_PERFORMANCE_TESTING · 04_ARCHITECTURE · 05_UX_FEATURES | 7 P0 blockers found (2 security critical)
> 
> **LOCAL Skills (bookit/.claude/skills/):**
> adversarial-reviewer · create-migration · diagnose · focused-fix · git-guardrails-claude-code · grill-me · grill-with-docs · handoff · improve-codebase-architecture · mark-as-read-on-close · react-doctor · self-improving-agent · ship-gate · spec-driven-workflow · tdd · tdd-guide · to-prd · triage · write-a-skill
>
> **MCP Servers (auto-use configured):**
> mempalace (27k drawers) · supabase · tailwind · a11y · universal-icons · context7 · magic (21st.dev) · playwright · ide

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
- `src/app/layout.tsx` — Root layout; reads `x-pathname` header → forces `data-theme="frost"` on `<html>` for `/dashboard/onboarding` and `/onboarding` paths → inline `beforeInteractive` script sets `body.bg=#EFF2FF` server-side. **Frost-only (T01 2026-06-12):** `client_theme` cookie normalized — missing or `'default'` (Blossom wip) → `'frost'`; `client_profiles` has NO theme column (cookie-only)
- `src/components/master/DashboardLayout.tsx` — shell: sidebar nav + `BentoBottomNav` (Mosaic Command Center); `ThemeApplier` client component sets `data-theme` per `mood_theme`

### Routes → Компоненти → Server Actions

| Route | Відповідальність | Page | Actions | Key Component |
|---|---|---|---|---|
| `/dashboard` | Editorial dashboard: greeting, schedule, weekly chart, monthly calendar, sidebar widgets, adaptive strip, tour | `dashboard/page.tsx` | `dashboard/actions.ts` | `FrostDashboard.tsx`, `DashboardGreeting.tsx`, `DashboardDrawers.tsx`, `ActivationTourBanner.tsx` (cross-page spotlight, progress bar, pathname-aware re-spotlight, z-48), `ActivationTourContext.tsx` (7-step activation tour, router.push between routes, fire-and-forget DB persist, backward compat seen_tours.dashboard_v2), `TodaySchedule.tsx`, `widgets/EarningsPulseWidget.tsx`, `widgets/AdaptiveContextStrip.tsx` (4 states: empty/quiet/moderate/busy), `widgets/FrostMetricsStrip.tsx` (ticker, touch-drag), `widgets/frost/WeeklyChartWidget.tsx`, `widgets/frost/PeakHoursWidget.tsx`, `widgets/frost/CancellationRateWidget.tsx`, `widgets/frost/NextFreeDaysWidget.tsx`, `widgets/frost/InsightsRow.tsx`, `widgets/frost/ChannelHealthWidget.tsx`, `widgets/frost/TopServicesWidget.tsx` |
| `/dashboard/bookings` | Command Center: Day (Timeline) / Week+Month (Bento Analytics) switching. MaterialsReviewSheet intercepts "Завершити" якщо є розхідники → qty review → completeBooking(id, reviewed) | `bookings/page.tsx` | `bookings/actions.ts` (completeBooking: stock deduction + product_transactions) | `BookingsPage.tsx`, `BookingCard.tsx`, `BookingActionsDropdown.tsx`, `BookingDetailsModal.tsx` (M-BOOK-05: adaptive Sheet, НЕ route; receipt-картка hero serif-дата+час tabular+source-чіп→пунктир→рядки→«Разом» serif 3xl; status-outcome блок для термінальних з `status_changed_at`+`cancellation_reason`; термінальні дії «Записати знову» через `UrlActionBus` booking:create+clientId / «Профіль клієнта»; статус-лейбл text-foreground через a11y-контраст), `MaterialsReviewSheet.tsx` (NEW T30), `dashboard/VerticalTimeline.tsx` (M-BOOK-02: спец-блок `TimelineBlock` зі статус-рейкою + Smart Design System — наповнення адаптується під висоту блока: sm 1 рядок / md-lg top-anchored / xl 1год+ rich-картка; герой now-line; drag-to-reschedule), `dashboard/DashboardWidgets.tsx` (M-BOOK-03: 4 метрики→кнопки→adaptive Sheet overlay з розбивкою; елементи→main-елемент клієнт/запис; `useBookingsDashboardLogic` +totalBooked/WorkingMinutes) |
| `/dashboard/clients` | CRM: клієнти, теги, VIP, нотатки, retention, LTV, реферали | `clients/page.tsx` | `clients/actions.ts` (+`saveClientTags`) | `master/clients/ClientsPage.tsx` (useWindowVirtualizer list), `ClientListRow.tsx` (React.memo), `ClientGridCard.tsx` (React.memo), `clientsUtils.tsx` (shared RETENTION_CONFIG/getAutoTags/getSmartAction/ClientIconStack), `ClientDetailSheet.tsx` (M-CLI-06 профіль-картка: спільний у 6 точках — clients/dashboard×3/StatsModals/analytics), `ClientIdentityHeader.tsx` + `ClientStatChips.tsx` (M-CLI-06 спільні під-компоненти, юзаються і в `BookingDetailsModal`), `ClientWidgets.tsx` |
| `/dashboard/services` | CRUD послуг та товарів (reorder, активація) | `services/page.tsx` | — | `master/services/ServicesPage.tsx` (M-SVC-02: grid/list view + localStorage; M-SVC-03: Eye-прев'ю на картці → `ServiceDetailSheet` mode="master"), `ServiceCard.tsx` (`onPreview`) |
| `/dashboard/analytics` | Аналітика Pro v2.2 (Editorial Bento, Закон темного блоку): таб «Огляд» editorial-redesign + Bento, MoM, PNG/SVG експорт; виручка, когорти, бізнес-здоров'я, фінанси, склад, розумна націнка, брифінг, CSV | `analytics/page.tsx` | — | `master/analytics/AnalyticsPage.tsx` (включає `MorningBriefing.tsx`, `BusinessHealthScoreWidget.tsx`, `SmartPricingOptimizer.tsx`; **Огляд M-ANL-01:** `sections/OverviewTab.tsx` (+`SectionHeading` спільний), `sections/OverviewBriefing.tsx` (темна editorial-обкладинка герой+by-numbers), `sections/FeaturedServices|Products|Clients.tsx` (герой+ранг-список), `sections/OverviewDetailSheet.tsx` (адаптивний Sheet деталей, payload hero/rows/note/cta), `sections/AnalyticsActivation.tsx` (empty-state), `ClientSheetById.tsx`; `charts/RevenueLineChart.tsx` (recharts ComposedChart, `isAnimationActive=false`); хуки `useAnalytics` + `useAnalyticsMarketing` (декомпозиція); та вкладки: `FinancesTab.tsx`, `StockTab.tsx`, `ReviewsTab.tsx`, `NoShowTab.tsx`, `LeadTimeTab.tsx`, `VacationTab.tsx`, `SourceTab.tsx` — **редизайн за M-ANL-02..07, бриф `ANALYTICS_TABS_REDESIGN.md`**) |
| `/dashboard/flash` | Redirect Gateway to `/dashboard/revenue?tab=flash_deals` | `flash/page.tsx` | — | Redirect Gateway |
| `/dashboard/pricing` | Redirect Gateway to `/dashboard/revenue?tab=dynamic_pricing` | `pricing/page.tsx` | — | Redirect Gateway |
| `/dashboard/billing` | Підписки Monobank: tier, оплата, checkout | `billing/page.tsx` | `billing/actions.ts` | `master/billing/BillingPage.tsx` |
| `/dashboard/settings` | Розклад, відпустки, Telegram, локація, тема | `settings/page.tsx` | `settings/actions.ts` | `master/settings/SettingsPage.tsx` — **10-col editorial grid** (lg:), 13 секцій, stagger fade-in, NavigationStrip pills; h-full на всіх блоках → рівні вертикальні відступи (gap-5 єдиний розрив); `ScheduleWidget` 3-col bottom row (buffer/breaks/weeklyStats); `StatsPulseWidget` 6 метрик (rating, views, bookings, conversion, repeatRate, ratingCount); Row5: Categories(3)+Identity(4)+ProductMix(3); Row6: RetentionCycle(3)+Vacations(3)+Segments(4); `VacationManager.tsx`, `LocationPicker.tsx` |
| `/dashboard/loyalty` | Redirect Gateway to `/dashboard/growth?tab=loyalty` | `loyalty/page.tsx` | — | Redirect Gateway |
| `/dashboard/referral` | Redirect Gateway to `/dashboard/growth?tab=referral` | `referral/page.tsx` | — | Redirect Gateway |
| `/dashboard/studio` | Studio coming-soon: preview features + beta CTA form | `studio/page.tsx` | `billing/actions.ts` (submitBetaRequest) | `master/studio/StudioBetaCard.tsx` (client: beta Sheet form, submitBetaRequest, sizes 1/2-5/5+), `master/studio/WaitlistButton.tsx` (unused — replaced) |
| `/dashboard/partners` | Redirect Gateway to `/dashboard/growth?tab=partners` | `partners/page.tsx` | — | Redirect Gateway |
| `/dashboard/revenue` | Revenue Hub: вкладки "Флеш-акції" та "Смарт-ціни" (inline) | `revenue/page.tsx` | `flash/actions.ts` (M-REV-02/03) | `master/revenue/RevenueHubClient.tsx`, `master/flash/FlashDealPage.tsx` (активна акція клікабельна→стата), `master/flash/FlashDealDetailSheet.tsx` (M-REV-03: тип Авто/Вручну, claimed, список по каналах). **Флеш-акції (M-REV-02/03):** авто-flash при скасуванні — таргетинг `get_eligible_flash_deal_clients` ТІЛЬКИ 1-арг (3-арг дропнуто); клієнт скасовує→авто обов'язково (`after()`), майстер→confirm `FlashOnCancelConfirmSheet` (глобальна в `DashboardLayout`, живиться zustand `lib/stores/flashOnCancelStore.ts`, 3 шляхи скасування пушать). Тип ручна/авто = `flash_deals.booking_id` (auto≠null). Доставка → `flash_deal_recipients` (in_app/push/telegram прапорці), спільний `notifyAndRecordFlashDeal`, `getFlashDealStats`/`useFlashDealStats`. Тогл Auto Flash: `master_profiles.auto_flash_on_cancel`/`auto_flash_discount_pct` — ОБОВ'ЯЗКОВО в select MasterContext(`context.tsx`)+SSR `(master)/layout.tsx` інакше тогл скидається |
| `/dashboard/marketing` | Marketing Hub: Story Generator (M-MKT-04 покроковий 5-крок візард) + Broadcast розсилки (in-app/Push/Telegram/SMS) | `marketing/page.tsx` | `marketing/actions.ts` | `master/marketing/StoryGenerator.tsx` (тонкий оркестратор), `BroadcastEditor.tsx`, `BroadcastHistory.tsx`. **Story-едітор (M-MKT-04 + ітерація-2):** кроки Тип→Контент→Вигляд→Стиль→Готово, live-прев'ю (mobile **знизу** під контролями / desktop sticky праворуч). Мозок = `story/useStoryEditor.ts` (стейт+преміум blur-gating+навігація+взаємовиключні фон-джерела), модель = `story/storySteps.ts`. UI: `story/StoryPreview.tsx`, `story/StepNav.tsx`, `story/steps/{StepType,StepContent,StepLook,StepStyle,StepExport}.tsx`. Reuse-фундамент (НЕ переписано): `story/storyExport.ts`, `story/useStoryData.ts`. `story/StoryCanvas.tsx` — адитивний градієнт-шар + **авто-адаптивний колір тексту** (`resolveTextTheme`: фото→світлий+тінь, градієнт/палітра→за luminance; фікс читабельності назви на темному фоні). **Стиль = образи-пресети** `STYLE_PRESETS` (5: minimal/elegant/bold/gloss/script, кожен {шрифт+treatment plain/plate/glass+weight+align+pos}) + розмір S/M/L (`TEXT_SCALES`) + елементи кадру (тогл аватар, тогл **showLinkZone** — пунктирна зона під IG-стікер, замінила запечену CTA; `showSticker`/`ctaText` дропнуто). **Контент:** текст-заготовки в `Sheet`-модалці «Обрати варіант» (`@/components/ui/Sheet` adaptive). Шаблони (`storyConstants.ts`): `TEXT_TEMPLATES` + `BG_GRADIENTS` (6) + `STOCK_PHOTOS` (порожній слот `public/story-bg/`, секція схована). «Рукописний» = `var(--font-great-vibes)` (latin+cyrillic). Палітр 10 (M-MKT-03). 36 unit-тестів. Експорт/TMA/преміум-гейтинг 1:1. Референси: `SCREENS/Stories/` |
| `/dashboard/marketing/new` | Нова розсилка — окрема сторінка (No-Modals policy) | `marketing/new/page.tsx` | — | `master/marketing/BroadcastEditorPage.tsx` → `BroadcastEditor.tsx` |
| `/dashboard/marketing/[id]` | Деталі розсилки по клієнтах (per-client delivery results) | `marketing/[id]/page.tsx` | — | `master/marketing/BroadcastDetailPage.tsx` |
| `/dashboard/growth` | Growth Hub: вкладки "Лояльність", "Реферали" та "Партнери" (inline) | `growth/page.tsx` | `loyalty/actions.ts` (C2C) | `master/growth/GrowthHubClient.tsx`, `master/loyalty/LoyaltyPage.tsx` (M-GROW-01: panel-редизайн — `OverviewCard` pipeline-тріада [у прогресі/готові/за крок] тап→`/clients?loyaltyMin/loyaltyExact` + impact-смуга ₴віддано/Nразів 30д forward-only; `ProgramProgress` двосегментна смуга reached/on_track per-програма; info-банер лише в empty). Стата: `useLoyaltyStats` → RPC `get_loyalty_overview`(pipeline all-time з `client_master_relations.total_visits`)+`get_loyalty_impact`(redemption 30д з `bookings.loyalty_label/loyalty_amount`), обидві SECURITY DEFINER auth.uid REVOKE anon. `createBooking` §8 пише loyalty redemption (forward-only). **Мережа (M-GROW-02):** `master/partners/PartnersPage.tsx` — один список «У твоїй мережі» origin-бейджі Партнер/Реферал (об'єднав партнерів+альянси). Дані = `master_connections` (bilateral master→other, `kind` partner/alliance, `role` inviter/invitee, `is_visible`); RLS `mc_owner_read`+`mc_public_read`(anon, is_visible+accepted)+`mc_admin`, write лише service_role. Пише `partners.ts`(partner)+`referrals.ts`(alliance). Читає getGrowthPageData/`[slug]page`(публ. trustedPartners тепер працює анонам)/`useBookingWizardState`/admin `AllianceMap`(role=inviter). Обʼєднала `master_partners`+`master_alliances` (інертні, drop відкладено). `master_referrals` (білінг) — окремо, НЕ зачеплено |
| `/dashboard/portfolio` | Портфоліо: CRUD кейсів, фото (tap-overlay + ←→ reorder), consent клієнта, прив'язка до послуг/відгуків | `portfolio/page.tsx` | `portfolio/actions.ts` | `master/portfolio/PortfolioPage.tsx`, `PortfolioItemPage.tsx`, `PortfolioItemCard.tsx`, `PortfolioPhotoUploader.tsx` | Shared: `components/shared/PhotoLightbox.tsx` |
| `/dashboard/portfolio/[id]` | Редагування кейсу портфоліо (No-Modals policy). Ліміт Starter = 5 публічних; захист на 3 рівнях. | `portfolio/[id]/page.tsx` | `portfolio/actions.ts` | `master/portfolio/PortfolioItemPage.tsx` |
| `/dashboard/products` | Товари: CRUD (for_sale), стоки, замовлення; Розхідники: 3-й таб ConsumablesTab з unit selector (pcs/ml/г) + low-stock warning | `products/page.tsx` | `products/actions.ts` (+ `unit` field) | `master/products/ProductsPage.tsx` (M-SHOP-02: grid/list view + `localStorage['products_view']` перемикач у сайдбарі), `ProductCard.tsx` (M-SHOP-02: marketplace-картка `view` проп grid/list — плитка фото-зверху aspect-[16/10] + glass-піл залишку top-right + footer-дії [Аналітика/Поповнити/Редагувати], тап→редактор; клон ServiceCard), `ConsumableCard.tsx`, `ProductEditor.tsx` (unit selector) |
| `/dashboard/revenue` (expenses) | Revenue Hub: 3 вкладки — Флеш-акції / Смарт-ціни / Фінанси (master_expenses Pro-gate CRUD + vaul Drawer) | `revenue/page.tsx` | `revenue/expenses.actions.ts` (createExpense/updateExpense/deleteExpense/getExpenses) | `master/revenue/RevenueHubClient.tsx`, `ExpensesTab.tsx` (NEW T30) |

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
- **Top zone redesign (2026-06-24, M-DASH-01)**: верхня зона = Greeting → MetricsStrip → AdaptiveContextStrip (Greeting/MetricsStrip без змін). `AdaptiveContextStrip.tsx` перебудовано: домінантна головна картка (`FitText` title, accent-CTA) + компактні вторинні; mobile `flex-col` (головна + до 2 стеком), desktop `lg:flex-row` (головна `flex-[1.4]` + 1 вторинна, 2-га `lg:hidden`) — щоб не зламати парність висоти з `EarningsPulseWidget` у рядку `3fr 2fr`. Релевантність: `useDashboardStats().todayPending > 0` → головна порада «N записів очікують», інакше стан `useBusyness`. `StockWidget.tsx` нормалізовано під Frost-токени (`bento-card` + `var(--*)`) і **перенесено вниз — передостаннім** (перед `ReferralBoostWidget`) на mobile+desktop. `custom`-stagger у `FrostDashboard.tsx` пересортовано. `data-tour-key="dash-2"` збережено.
- **Quick Actions tap (2026-06-24, M-DASH-02)**: `QuickActionsWidget.tsx` (mobile) + `FrostActionsBar` (desktop, inline у FrostDashboard) — pop-with-overshoot tap через framer-motion `whileTap` на КОНТЕНТІ плитки (не боксі, щоб дільники/hero-bg не рвались). `TAP_POP = spring{stiffness:520,damping:16,mass:0.8}` (release overshoot ~1.03), іконка `y:-2` через variants-пропагацію, `useReducedMotion()` gate, transform-only.
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
| `/admin/beta-requests` | Бета-заявки Studio: список заявок на Studio Beta (name, contact, studio_size) | `admin/beta-requests/page.tsx` | `billing/actions.ts#submitBetaRequest` | — |

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

### Landing Shared Utilities — `src/components/landing/shared/`

| File | Used By | Description |
|------|---------|-------------|
| `CountUp.tsx` | TrustBar, BentoFeatures | Spring-animated number counter (stiffness:70, damping:15, useInView once, margin:-60px) |
| `WordLine.tsx` | Economy, Process | Word-by-word reveal animation (y:110%→0, easeOut stagger: lineIndex×200ms + word×70ms) |

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
- `src/app/my/messages/` → `MessagesListPage.tsx` — список DM-розмов клієнта з майстрами (T-chat, migration 20260615000002)
- `src/app/my/messages/[id]/` → `DirectChatPage.tsx` — переписка з майстром; `useDMChat` (Supabase Realtime INSERT+UPDATE); read receipts; iOS visualViewport keyboard push-up; bucket `support_attachments` для вкладень
- `src/app/my/portfolio-consent/actions.ts` → `approvePortfolioConsent`, `declinePortfolioConsent`

### Публічний Магазин
- **`src/app/[slug]/shop/layout.tsx`** (M-SHOP-03) — `ShopCartProvider` обгортає каталог + сторінку товару → кошик спільний через навігацію (Next layout не ре-монтується)
- `src/app/[slug]/shop/page.tsx` — SSR, revalidate 60s; каталог; Pro/Studio only
- **`src/app/[slug]/shop/[productId]/page.tsx`** (M-SHOP-03, NEW) — SSR сторінка товару: fetch одного товару (active, by slug+master) + `generateMetadata` (title+OG-фото) + `notFound` + Pro-gate
- `src/components/public/ShopPage.tsx` — каталог: фільтр-чіпи + грід тайлів (тайл = `<Link>` на сторінку товару), кошик з `useShopCart()`, рендерить `ShopCartBar`
- **`src/components/public/ProductPage.tsx`** (M-SHOP-03, NEW) — клієнт сторінки товару: `ProductDetailView` + qty stepper + «в кошик» (пише в контекст) + back-link + `ShopCartBar`
- **`src/components/public/shop/ShopCartContext.tsx`** (M-SHOP-03, NEW) — кошик у context, persist `localStorage['bookit_cart_${slug}']`, hydration-safe (read у useEffect, `hydrated` флаг). API: items/count/total/addToCart/setQty/getQty/clear
- **`src/components/public/shop/ShopCartBar.tsx`** (M-SHOP-03, NEW) — sticky cart-кнопка + `CartDrawer` (checkout pickup/Nova Poshta) + `OrderSuccess` (fixed-overlay). Читає контекст; на каталозі І сторінці товару (активна одна за раз)
- **`src/components/public/shop/ProductDetailView.tsx`** (M-SHOP-03, presentational) — галерея (свайп/стрілки/крапки/thumbnails) + назва/ціна/залишок/опис (+master-нудж) + **секція «Відгуки»** (M-SHOP-03b: `useProductReviews` → RPC `get_product_reviews` derive `reviews.order_id → order_items.product_id`; avg+Stars+список+loading+empty). `mode` client/master, `actions`-слот. Спільний: публічна сторінка + майстер Eye-прев'ю (ProductsPage Sheet)
- **`src/lib/supabase/hooks/useProductReviews.ts`** (M-SHOP-03b) — TanStack хук над RPC `get_product_reviews(product_id)` (дзеркало `useServiceReviews`). Відгуки про товар = derive через order_items (збір — наявний order-review flow у ShopOrderCard→ReviewSheet→submitReview, is_published=false модерація). RPC SECURITY DEFINER, лише is_published+безпечні поля. Міграція `20260627000010`.
- Order flow: `createOrder` → INSERT `orders` + `order_items` → decrement stock (`increment_stock_rpc`) → master отримує сповіщення
- На сторінці майстра: Shop Banner (до послуг) + Products preview strip (до 3 товарів + "Всі товари")
- `master_profiles.ships_nova_poshta BOOLEAN` — контролює чи пропонується доставка Нова Пошта

### Публічне Портфоліо
- `src/app/[slug]/portfolio/page.tsx` — SSR grid усіх опублікованих робіт майстра, revalidate 300s
- `src/app/[slug]/portfolio/[id]/page.tsx` — SSR детальна сторінка: фото (via PortfolioPhotoViewer), відгуки, клієнт, inline BookingFlow (PortfolioBookingButton)
- `src/components/public/portfolio/PortfolioPhotoViewer.tsx` — Client Component: cover photo + thumbnail strip + PhotoLightbox inline
- `src/components/public/portfolio/PublicPortfolioGallery.tsx` — горизонтальний strip: 2 items + "Всі роботи" (на сторінці майстра, після Shop Banner)
- `src/components/public/portfolio/PortfolioBookingButton.tsx` — client component: кнопка + inline BookingFlow з pre-selected послугою
- `src/components/shared/PhotoLightbox.tsx` — shared full-screen lightbox (fixed z-[100], keyboard nav Esc/←→, safe-area); used by PortfolioPhotoUploader + PortfolioPhotoViewer + ProductFormDrawer
- `src/components/shared/PhotoUploader.tsx` — universal upload component (T22): render-prop pattern, entity routing, CropDrawer integration; entities: master-avatar, client-avatar, service
- `src/components/shared/CropDrawer.tsx` — reusable vaul crop bottom sheet (z-[200]/[210]); aspectRatio optional (undefined=free crop, 1=square)
- `src/components/shared/ScrollStrip.tsx` — **(G-PWA-02)** уніфікований горизонтальний скрол-стрип: drop-in заміна `overflow-x-auto scrollbar-hide`. Edge-fade маска + стрілки (крок=1 елемент) + крапки-індикатор по 1 на елемент (active = вибрана пілюля через aria-pressed/selected/current, інакше найближча до центру; вибір→центрування). Усі в'юпорти, prefers-reduced-motion, native swipe не хайджекається. Props: arrows/dots/snap/fade/wrapperClassName. Елементи — ПРЯМІ діти. Мігровано 10 стрипів (FreeSlotsWidget, ClientsPage×2, ShopPage, StepServices, KpiTicker, ProductsPage, DashboardTopBar, SegmentBuilder, SupportChatPage)
- `src/components/shared/GlassSafeArea.tsx` — **(G-PWA-01)** iOS liquid-glass scroll-edge для верхньої safe-area. Fixed-смуга `height: calc(env(safe-area-inset-top,0px)*0.8)`; scroll-driven `blur 0→14px` + `saturate(200%)` + градієнт-тінт `rgba(239,242,255, 0→0.30)`→`0→0.12` (ramp 52px, ease-out). Passive scroll + rAF, стилі прямо в ref (нуль re-render); p<0.01 скидає компонувальний шар; `prefers-reduced-motion`, `-webkit-` префікс, `pointer-events-none`, z-40. Потребує `viewportFit:'cover'`. Змонтовано: `my/layout.tsx` (клієнт) + `DashboardLayout.tsx` (майстер), scroll root=window, chat-гілки пропущені. Props: scrollTarget/maxBlur/maxOpacity/rampDistance/zIndex
- `src/lib/upload/uploadPhoto.ts` — single upload fn: 5 PhotoEntity types → 4 Supabase buckets (images, avatars, product-photos, portfolios); upsert only for avatars

### Auth Flow
- `src/app/(auth)/layout.tsx` — split-screen Frost layout: 45% dark brand panel (#0F172A + aurora blobs) + 55% form panel; mobile single-column (updated 2026-05-28). **Wrapped in `AuthViewportShell` (G-LOGIN-02, 2026-06-23).**
- `src/app/(auth)/_components/AuthViewportShell.tsx` — **NEW client shell (iOS keyboard fix).** `position: fixed` + `height = visualViewport.height` + `translateY(offsetTop)` on resize/scroll; `scrollIntoView` focused input on resize; toggles `.kb-open` (innerHeight−vv.height>120) → brand strip grows. KEY: iOS Safari `dvh` НЕ реагує на клавіатуру — тільки `visualViewport` на `position:fixed` працює.
- `src/app/(auth)/_components/AuthScrollMain.tsx` — `<main overflow-y-auto>` + child `my-auto` (центр коли влазить, скрол без flex-clip)
- `src/components/auth/PhoneOtpForm.tsx` — 3-step flow (role_select→phone→otp); "Nordic Slab" redesign: white container on lavender, stacked role cards (dark slab selected / dashed outline unselected), 3-segment progress line, spring stiffness:340; WCAG AA compliant; no bento-card (updated 2026-05-28). Phone input: каретка завжди після провідного `0` (`onFocus`/`onClick` → `setSelectionRange(end)`)
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
| `useTopAmbassadors.ts` | 5 хв | Топ C2C амбасадори майстра (via getTopAmbassadors server action) |
| `useSlotsFromStore.ts` | — | Розрахунок слотів на клієнті на основі кешованого розкладу |
| `useAnalyticsExtras.ts` | 5 хв | Мега-RPC аналітики (LTV, когорти, Smart Pricing, завантаженість) |
| `useReviewsMetrics.ts` | 10 хв | Метрики та останні відгуки для drill-down |
| `useNoShowMetrics.ts` | 10 хв | Статистика скасувань та неявок |
| `useLeadTimeDistribution.ts` | 10 хв | Розподіл часу попереднього запису клієнтів |
| `useVacationImpact.ts` | 10 хв | Аналіз втраченого доходу через відпустки |
| `useSourceAttribution.ts` | 10 хв | Статистика джерел залучення клієнтів |
| `useExpenses.ts` | — | master_expenses CRUD (NEW T29/T30): `useExpenses(month?)`, `createExpense`, `updateExpense({id, payload})`, `deleteExpense` — masterId from useMasterContext internally |
| `useConsumablesForBooking.ts` | — | Розхідники для запису (NEW T29/T30): `useConsumablesForBooking(bookingId \| null)` — null disables query; returns `{ product_id, name, unit, total_qty }[]` |
| `useClientTags.ts` | 1 хв | Персональні мітки клієнта (M-CLI-06): точковий select `client_master_relations.vibe_tags` по master_id+client_id (не через RPC); `useClientTags(clientId)` + `useClientTagsInvalidate()` |

### Design System Hooks (`src/lib/hooks/`) — NEW T31
- `useSmartTooltip.ts` — viewport-aware tooltip clamp: `useSmartTooltip(tooltipRef, rawLeft, safeArea=8) → number | null`. Replaces duplicated useLayoutEffect in WeeklyChartWidget + PeakHoursWidget.
- `useAdaptiveColor.ts` — WCAG luminance walk: `useAdaptiveColor(ref) → 'light' | 'dark'`. Walks DOM to first opaque background, computes relative luminance (threshold 0.179). Default: 'dark'.
- `FitText.tsx` (shared): `src/components/shared/FitText.tsx` — `<FitText text minSize maxSize maxLines className style />`. ResizeObserver + canvas.measureText() binary search. Applied in GreetingWidget (frost).

### Session / PWA Hooks (`src/lib/hooks/`)
- `useSessionWakeup.ts` — visibility change → `resetFetchController` → `invalidateQueries` (усуває нескінченні скелетони після переключення вкладок)
- `useDeepSleepWakeup.ts` — JS freeze detection → `onlineManager` + `invalidateQueries`
- `useTour.ts` — Generic per-page tour hook: step state + localStorage cache + optional DB persist via `markTourSeen`. 7 consumers: DashboardView (dashboard_v3) · AnalyticsPage · FlashDealPage · LoyaltyPage · DynamicPricingPage · ReferralPage · ReviewsPage.
- **Tour Architecture (2026-06-18 T23-impl v2)** — per-page tours via `useTour` + generic `TourBanner`:
  - **`TourBanner.tsx`** — `src/components/master/onboarding/`. Generic, props-driven. Props: `steps: TourStep[]`, `currentStep`, `onNext`, `onClose`. Spotlight via `data-tour-key` attr (NOT `data-tour-step` — that's used by legacy DashboardTour). ResizeObserver + scroll/resize listeners for continuous tracking. Navigator last step: `isNavigator:true` → 3 link cards, no CTA, no spotlight.
  - **`DashboardView.tsx`** — integrates `useTour('dashboard_v3', 5)` + renders `<TourBanner>`. 4 content steps + navigator. Keys: `dash-0`=FrostGreeting, `dash-1`=FreeSlotsWidget, `dash-2`=AdaptiveContextStrip, `dash-3`=QuickActionsWidget/FrostActionsBar. Both mobile+desktop wrappers tagged in `FrostDashboard.tsx`.
  - **`resetTourSeen(tourName)`** — new server action in `dashboard/actions.ts`. Deletes key from `seen_tours` JSONB. Used by Academy "Пройти тур знову" + `window.location.href='/dashboard'` for full-reload fresh SSR.
  - **`ActivationTourContext.tsx` / `ActivationTourBanner.tsx`** — RETIRED. Removed from `DashboardLayout`. Files kept for reference.
  - **Правило вибору:** одна сторінка → `useTour` + `TourBanner`. Cross-page → deprecated pattern.
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
| `haversine.ts` | `haversineKm(lat1,lng1,lat2,lng2): number` + `formatDistance(km): string` — straight-line distance for /explore geo filter |
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
| `flashDeal.ts` | `getMonthStart`, `calcDiscountedPrice`, `isFlashSlotMatch` — pure helpers для flash deals (T11) |
| `statusGlow.ts` | `statusGlow(hexColor)` — пастельний radial-glow тіла картки у кольорі статусу (~20%), спільний для карток клієнтів (`retentionGlow` делегує) і записів (`BookingCard`); M-CLI-05/M-BOOK-01 |

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
| `/api/settings/telegram-status` | GET | Polling endpoint: перевірка `master_profiles.telegram_chat_id` після підключення бота → `{ connected, chatId }` | Auth |
| `/api/notify` | — | (порожня директорія) | — |
| `/api/telegram` | — | Telegram webhook (внутрішній) | — |
| `/api/flash` | — | Flash deal API | — |

---

## [Database Layer] — Supabase PostgreSQL

### Identity
| Таблиця | Призначення |
|---|---|
| `profiles` | Всі юзери: `full_name`, `phone` (E.164), `role`, `telegram_chat_id` (клієнт), `onboarding_step`, `onboarding_data`, `health_notes`, `medical_notes` |
| `master_profiles` | Бізнес-профіль: `slug`, `subscription_tier`, `working_hours` (jsonb), `pricing_rules` (jsonb), `categories` (text[]), `business_name`, `telegram_chat_id` (бізнес), `theme`, `retention_cycle_days`, `lifetime_discount`, `auto_flash_on_cancel BOOLEAN`, `auto_flash_discount_pct INT (10–30%)` (T32 migration 141), `activation_tour_step smallint DEFAULT NULL` (T23-impl: 0–6=active step, NULL=not started/completed), `seen_tours JSONB` (ключі: `dashboard_v2`, `activation_v1`, per-page tour names) |
| `client_master_relations` | CRM: `total_visits`, `total_spent`, `average_check`, `last_visit_at`, `is_vip`, `vibe_tags text[]` (M-CLI-06 — персональні мітки майстра; ⚠ `tags[]` НЕ існує — був хибний запис у мапі), `client_tag text` (legacy, unused), `health_notes`, `medical_notes`, `is_archived` |
| **Identity Note** | Пріоритет відображення імені: `business_name` (якщо є) → `full_name`. Застосовується в `Explore`, `PublicMasterPage`, `Sidebar`. |

### Catalog
| Таблиця | Призначення |
|---|---|
| `services` | Послуги: `duration` (хв), `price` (копійки), `category`, `position`, `is_active`, `icon_name` |
| `service_categories` | Кастомні категорії послуг |
| `products` | Товари: `name`, `price_kopecks`, `cost_kopecks` (nullable), `stock_qty` (integer), `stock_alert_threshold` INT DEFAULT 3, `is_active`, `is_archived` (m'яке видалення), `recommend_always`, `auto_deduct` (boolean, consumable автосписання), `product_type` ('retail'\|'consumable'), `icon_name`, `sort_order` — міграція 139 |
| `product_service_links` | Рекомендовані товари до послуги: `product_id`, `service_id`, `quantity` INT DEFAULT 1 (скільки одиниць consumable на 1 сеанс) — міграція 139 |

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
| `conversations` | DM між клієнтом і майстром: `client_id` + `master_id` (UNIQUE pair), `last_message`, `client_unread`, `master_unread`. RLS: учасники тільки. Realtime увімкнено. |
| `direct_messages` | Повідомлення DM: `conversation_id` FK, `sender_id` FK, `message`, `attachment_url`, `read_at`. RLS via conversations. |
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
| `get_analytics_extras` | Об'єднаний мега-RPC аналітики (зайнятість, когорти, LTV, аномалії, ROI Smart Pricing та зв'язки послуг) — міграція 20260605000000 |
| `get_service_reviews` | Published-відгуки по послузі (M-SVC-03) через `reviews.booking_id → booking_services.service_id`; SECURITY DEFINER, public read (anon/authenticated), лише безпечні поля — міграція 20260626000000. Хук: `useServiceReviews.ts` |
| `get_pricing_rule_stats` | Per-rule стата динамічних цін (M-REV-04): кількість/₴(надбавка)/сер.%/остання дата/5 останніх записів. **Фільтр по `auth.uid()` — без IDOR** (не приймає master_id), матч по підрядку `dynamic_pricing_label` ('Пік'/'Тихий час'/'Рання бронь'/'Остання хвилина'), SECURITY DEFINER, authenticated-only — міграція 20260628000003. Action: `getPricingRuleStats` · UI: `PricingRuleStatsSheet.tsx` |
| `get_pricing_rules_overview` | Огляд усіх 4 правил за виклик (M-REV-05): Пік count+earned_kopecks, знижки count. `auth.uid()` без IDOR, all-time confirmed+completed — міграція 20260628000004. Action: `getPricingRulesOverview` · UI: `PricingRulesOverview.tsx` (вкладка Смарт-ціни) |
| `get_dynamic_pricing_uplift` | Аналітика динамічних цін за період. **M-REV-05 фікс:** `rule_counts` матч по ТИПУ (було по повному лейблу + markup-only), +`saved_slots` — міграція 20260628000005. UI: `DynamicPricingUplift.tsx` (аналітика) |

### Міграції
141+ міграцій застосовано в продакшн.
Місце: `supabase/migrations/*.sql`

Останні ключові:
- `114_portfolio_items.sql` — `portfolio_items`, `portfolio_item_photos`, `portfolio_item_reviews` + RLS
- `115_recreate_portfolios_bucket.sql` — bucket `portfolios` (10MB, public) + storage policies
- `116–119` — broadcasts, broadcast_recipients, broadcast_links, phone_discounts
- `126_segment_config.sql` — `segment_config jsonb` на `master_profiles` (Custom CRM Segments)
- `136_notification_logs.sql` — `notification_logs` таблиця + `products.stock_alert_threshold INT DEFAULT 3`
- `137_client_health_notes.sql` / `20260516000000_client_health_system_update.sql` — Unified client health & medical notes
- `137_product_type_and_emoji.sql` — `icon_name`, `product_type` columns on `products` (NOT applied to live DB — fixed by 139)
- `138_service_icon_name.sql` — `icon_name` column on `services`
- `139_products_full_fix.sql` — Повний фікс `products`: `product_type`, `icon_name`, `is_archived`, `cost_kopecks`, `auto_deduct`; `stock_qty` numeric→integer; `product_service_links.quantity`; partial index; оновлення тригера списання (consumable + auto_deduct only) with category-based backfill
- `20260524124500_get_master_referral_history.sql` — `get_master_referral_history` RPC function
- `20260605000000_analytics_system.sql` — Mega analytics functions and orchestrator `get_analytics_extras` RPC
- `20260607000000_security_search_path_fix.sql` — 19 RPC `SET search_path = public` fixes (⚠️ pending `npx supabase db push` або Dashboard SQL Editor)
- `20260614000000_auto_flash_on_cancel.sql` — `auto_flash_on_cancel BOOLEAN`, `auto_flash_discount_pct INT` на `master_profiles` (T32 migration 141)
- `20260618000000_activation_tour_step.sql` — `activation_tour_step smallint DEFAULT NULL` на `master_profiles` + sparse index; Activation Tour persistence (T23-impl 2026-06-18)
- `20260628000003_get_pricing_rule_stats.sql` — RPC `get_pricing_rule_stats` per-rule стата динамічних цін (auth.uid, без IDOR) — M-REV-04 follow-up
- `20260628000004_get_pricing_rules_overview.sql` — RPC `get_pricing_rules_overview` огляд усіх 4 правил (auth.uid) — M-REV-05 ч.1
- `20260628000005_dynamic_pricing_uplift_discounts.sql` — фікс `get_dynamic_pricing_uplift` (матч по типу + saved_slots) — M-REV-05 ч.2
