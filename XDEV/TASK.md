# TASK.md — Поточні задачі

> Оновлюється після кожного завершеного кроку.
> **Updated:** 2026-06-02

---

## 📋 Стратегічні плани

> Поза поточним спринтом — див. [XDEV/PLANS/](./PLANS/README.md):
> - **[MTRP-2026-06-02](./PLANS/MTRP-2026-06-02.md)** — Master Technical Remediation Plan (71 items, 5 phases) — 🔄 **IN PROGRESS**
>   - **Хаб виконання:** [XDEV/PLANS/MTRP/](./PLANS/MTRP/MAP.md) (MAP=де зупинився · TRACKER=статуси · WORKFLOW · AUDIT_LOG)
>   - **Phase 0:** dead-code ✅ + P0.5 ✅ · далі P0.6 (aria-label) → P0.1 (security)

---

## STEP 14-15 — ✅ COMPLETE (2026-06-05)

**MTRP Phase 4 DONE + Phase 2 P2.11**
- **Scope:** A11y tail (Phase 4 всі items) + WCAG AA contrast
- **TSC:** 0 | **Items closed:** 37→42/71

### Що зроблено (S14 — Phase 4 complete)
- **P3.3** — 9 SVGs: 7 `aria-hidden="true"` (decorative) + 2 `role="img" aria-label` (charts)
- **P3.4** — BottomSheet drag handle `role="presentation"`
- **P3.5** — `outline-none` → `focus:ring-2 focus:ring-primary/20` (11 files); skip: Vaul/Radix containers, bg-transparent composed inputs
- **P3.6** — `aria-pressed` на tab toggles: AnalyticsPage · ModerationHub (3) · AcademyPage · SystemLogsViewer (2)
- **P3.7** — StepServices: `role="tab"` + `id` + `aria-controls="services-panel"`; `role="tabpanel"` + `aria-labelledby`
- **P3.8** — Hidden file inputs `aria-hidden="true" tabIndex={-1}` (11 files: ProfileHero, ImageUploader, ProductFormDrawer, ProductEditor, PortfolioPhotoUploader, StepProfile, StepBasic, StoryGenerator, SupportWidget, AdminSupportConsole, SupportChatPage)

### Що зроблено (S15 — P2.11 WCAG AA contrast)
- **P2.11** — 25 files: `/30→/60`, `/40→/70`, `/50→/70` на readable text labels
  - Analytics tabs: VacationTab · ReviewsTab · NoShowTab · LeadTimeTab · StockTab
  - Analytics sections: ServicePairing · LtvConcentration · GrowthLists · FlashDealsCard · DynamicPricingUplift · GoalProgress
  - Booking: BookingDetailsModal (×3 labels) · BookingsPage (×3: 2 section labels + date header)
  - Clients: SegmentBuilder (×4 labels) · SegmentConfigWidget · ClientWidgets (×3)
  - Profile: ProfileHero · MyProfilePage
  - Skip: decorative icons, `placeholder:` text, `isOff`/disabled state classes, line-through prices

### Закриті items
**Phase 4 ✅ COMPLETE:** P3.3 · P3.4 · P3.5 · P3.6 · P3.7 · P3.8
**Phase 2:** P2.11

---

## STEP 13 — ✅ COMPLETE (2026-06-01)

**Final Sprint — Legal · Offline · Invite · Studio · Admin · Backlog B/C/D**
- **Scope:** Security P0 + Admin A11y P1 + Public pages P3 + Backlog Polish
- **TSC:** 0 | **build:** clean
- **Drawer:** `774ccb6b5e3b9700582e81ce`

### Що зроблено (13a — Security + Admin A11y)
- **SECURITY P0:** `resolveSupportTicketAction()` — missing admin role check → added profile role guard
- **25× type="button":** MastersDirectory (4) · ModerationHub (7) · AdminSupportConsole (3) · SystemLogsViewer (3) · AllianceMap (3)

### Що зроблено (13b — Public Pages)
- **offline/page.tsx:** `type="button"` + `aria-label` + `aria-hidden` on emoji
- **invite/[code]/page.tsx:** emoji ✨📅💎 → Lucide icons (Sparkles, CalendarCheck, Gem)

### Що зроблено (13c — Backlog)
- **B-03** Studio WeeklyChart: date in tooltip + getWeekDates() + div→button on bars + type="button" on mode toggle
- **B-04** Frost: вже `rounded-[4px]` — нічого не змінено ✅
- **B-05** Blossom WeeklyChart: type="button" on mode toggle + div→button on bars
- **C-01** BookingCard: `borderLeft: 4px` → `border: 1px + background: color08` + remove `pl-1`
- **D-01** ClientsPage: same border fix on grid (line ~631) + list (line ~806)

### Відкладено
- B-01: Dashboard /impeccable audit (окрема сесія)
- B-02: Vercel QA — manual verification

---

## STEP 12 — ✅ COMPLETE (2026-06-01)

**Client Portal (`/my/*`)**
- **Scope:** Security + A11y P1 + Correctness P2 + Emoji P3
- **TSC:** 0 | **build:** clean (51 pages)
- **Drawers:** `0a433239dd2c899a3691ba79` (12a) · `3bec0459fbf4b9a44e1aa9d9` (12b)

### Що зроблено (12a — Security + A11y P1)
- **Auth guards:** `bookings/`, `loyalty/`, `masters/`, `profile/` page.tsx → `if (!user) redirect('/login')`
- **Critical:** `setup/phone/page.tsx` — не мав AUTH ВЗАГАЛІ → повний rewrite async + createClient + redirect
- **P1:** `ClientNotificationsPage.tsx` — `motion.div onClick` → `motion.button type="button"`
- **P1:** `MyProfilePage.tsx` — `aria-label="Назад до записів"` + encoding fix U+2019 → U+0027
- **P1:** `MyBookingsPage.tsx` — star buttons: `type="button"` + `aria-label` + `aria-pressed`
- **P1:** `ChannelBanner.tsx` — dismiss button: `aria-label="Закрити"`

### Що зроблено (12b — Correctness P2 + P3)
- **type="button":** 30+ кнопок у 8 компонентах
- **aria-pressed:** tab/filter кнопки (MyBookingsPage, MyLoyaltyPage)
- **htmlFor/id:** 5 полів форми (MyProfilePage)
- **spring as const:** 6 компонентів (MyBookingsPage, MyLoyaltyPage, MyMastersPage + completed reward)
- **aria-current="page":** nav Links (MyBottomNav)
- **Emoji cleanup:** SUGGESTIONS у SupportChatPage (🔔📅💳🔗 → текст)
- **PhoneSetupForm:** CLEAN — вже мав type="button" (agent false-positive)

### Bonus insights
- `edit_counter_guard.py`: блокує на 5 Edit/file/session; Write скидає лічильник
- Middleware audit: всі публічні маршрути доступні без auth ✅

---

## STEP 07 — ✅ COMPLETE (2026-05-31)

**Services + Products (`/dashboard/services`, `/dashboard/products`)**
- **Scope:** Correctness-only audit
- **TSC:** 0 | **build:** clean
- **Drawer:** `drawer_bookit_audits_ea3affc66ed6c48195edda5e`

### Що зроблено
- **Deleted:** `services/ProductCard.tsx`, `services/ProductForm.tsx` (orphaned — 0 imports)
- **P1 Fix:** `ServiceCard.tsx` — `motion.div onClick` → info section у `<button type="button">`
- **type="button":** усі action buttons у 7 файлах
- **aria-pressed:** toggle/tab buttons (ServiceCard, ServiceEditor ×2, ProductCard, ProductsPage TabBtn + order filters, ProductEditor ×2)
- **aria-label:** FABs (ServicesPage, ProductsPage), drag handles, expand button (OrderCard)
- **spring as const:** ServicesPage FAB, ProductsPage FAB_SPRING const
- **AnimatePresence:** x:±10 → y:4 у ProductsPage
- **OrderCard:** expand button + `aria-expanded`, status buttons `type="button"`, transition → spring
- **Hardcoded stats replaced:** ServiceEditor + ProductEditor → dashed placeholder
- **Dead code removed:** `StatBox` в ProductEditor, `useCallback` імпорт у ProductsPage

---

## STEP 08 — ✅ COMPLETE (2026-05-31)

**Revenue · Growth · Marketing · Billing · Settings · Studio**
- **Scope:** Correctness-only audit (08a / 08b / 08c)
- **TSC:** 0 | **build:** clean
- **Drawer:** `drawer_bookit_audits_e1534fd674b5432d8685234b`

### Що зроблено
- **P1 div→button:** `DynamicPricingPage.tsx:300` (PricingRuleCard + `aria-pressed`), `StoryGenerator.tsx:1266` (`motion.div` → `motion.button`) + encoding fix curly quotes
- **type="button":** 20+ кнопок у 10 файлах (RevenueHubClient, FlashDealPage, GrowthHubClient, LoyaltyPage ×11, ReferralPage ×4, PartnersPage ×3, MarketingTabs, BroadcastsTab, SettingsPage)
- **aria-pressed:** tab switchers (Revenue, Growth, Marketing), toggle switches (LoyaltyPage ×2, PartnersPage)
- **aria-label:** icon-only кнопки (FlashDealPage cancel, LoyaltyPage Pencil + Trash2, PartnersPage delete)
- **spring as const:** BillingPage.tsx:299
- **Dead code removed:** `BusynessWidget` у SettingsPage (69 рядків)
- **Billing webhook:** ECDSA P-256 — аудит CLEAN (без змін)
- **Studio:** static waitlist page — CLEAN

---

## STEP 09 — ✅ COMPLETE (2026-05-31)

**Explore (`/explore`)**
- **Scope:** Correctness + visual polish audit
- **TSC:** 0 | **build:** clean (51 pages)
- **Drawer:** `drawer_bookit_audits_e7959f077fa9adbf72463435`

### Що зроблено
- **type="button":** 9 кнопок (X clear, filters toggle, "Всі", category chips, city trigger, dropdown options ×2, sort options, reset)
- **aria-label:** X clear button (`"Очистити пошук"`) + `p-1.5` touch target
- **aria-pressed:** filters toggle, "Всі" category, category chips, sort options
- **aria-expanded + aria-haspopup="listbox":** city dropdown trigger
- **role="listbox" + role="option" + aria-selected:** city dropdown container + options
- **P1 Bug Fix:** PRO badge всередині `overflow-hidden` → кліпувався; виправлено через outer wrapper без overflow
- **pluralUk():** замість hardcoded "послуг" → правильні відмінки (послуга/послуги/послуг)
- **SPRING as const:** `const SPRING = { type: 'spring', stiffness: 280, damping: 24 } as const` + 4 transitions
- **animate-pulse видалено:** з nails іконки (постійна пульсація у каталозі — відволікає)
- **MasterCard hover lift:** `hover:-translate-y-0.5` додано

---

## STEP 10 — ✅ COMPLETE (2026-05-31)

**Public Master Page (`/[slug]`)**
- **Scope:** Correctness + visual polish audit (6 файлів, ~8,000 рядків)
- **TSC:** 0 | **build:** clean (51 pages)
- **Drawer:** `drawer_bookit_audits_6b554b09eed872165f45ba2a`

### Що зроблено
- **SPRING as const:** `SPRING` + `SPRING_CARD` — 15 inline transitions у `PublicMasterPage.tsx`
- **type="button":** FlashDealCard button, referral "Забрати", referrer "Записатись"
- **Hardcoded color:** `style={{ color: '#2C1A14' }}` → `className="text-foreground"`
- **Referrer balance banner:** `rgba(92, 158, 122, ...)` → CSS tokens `bg-success/8`, `text-success`, `bg-success`
- **`<img>` → `<Image>`:** service thumbnail → Next.js `Image width={48} height={48}`
- **Share button:** `size-9` (36px) → `size-11` (44px)
- **ServiceSelector:** carousel nav `size-7` (28px) → `size-11` (44px) × 2
- **ClientCombobox:** `aria-selected={false}` hardcoded → `aria-selected={c.client_name === watchName}`
- **DateTimePicker:** `aria-label` на date nav buttons + `spring as const` на toggle
- **useBookingWizardState:** C2C race condition fixed — `cancelled` flag на eligibility check
- **PostBookingAuth:** OTP input `w-10` (40px) → `w-11` (44px)
- **Business logic:** createBooking, dynamicPricing, computeBookingPrice — verified clean, не змінювались

---

## STEP 11 — ✅ COMPLETE (2026-05-31)

**Shop + Portfolio (`/[slug]/shop`, `/[slug]/portfolio`)**
- **Scope:** Correctness + visual polish audit (3 файлів модифіковано)
- **TSC:** 0 | **build:** clean | **A11y:** WCAG AA ✓
- **Drawer:** `drawer_bookit_audits_2272efe59888d3addd38f5c0`

### Що зроблено
- **4× Framer spring `as const`:** `SHEET_SPRING`, `GALLERY_SPRING`, `CART_SPRING`, `SUCCESS_SPRING` — витягнуто на рівень модуля
- **DOM ref fix:** `document.getElementById('day-slider')` → `useRef<HTMLDivElement>` + `sliderRef.current?.scrollBy()`
- **Mid-file import:** `import { useRef }` на рядку 450 → переміщено у top-level React import
- **Emoji:** `⚡ Залишилось` → `Залишилось` (No-Emoji Policy)
- **17× `type="button"`:** sticky cart, close buttons, photo nav, photo dots, thumbnails, qty steppers, motion.button, CartDrawer close, scroll arrows, day picker, submit, FilterChip, DeliveryBtn
- **7× `aria-label`:** Закрити ×2, Попереднє/Наступне фото, Прокрутити назад/вперед, Зменшити/Збільшити кількість
- **5× `aria-pressed`:** FilterChip, DeliveryBtn, photo dots, thumbnails, day picker
- **Touch target:** photo dots `size-2` (8px) → `<button className="p-3 -m-3"><span /></button>`
- **`fill="currentColor"`:** Star іконки у `portfolio/[id]/page.tsx` (видалено redundant `fill="#D4935A"`)
- **`type="button"`:** PortfolioBookingButton trigger

---

## Активна задача → STEP 12

---

## STEP 06 — ✅ COMPLETE (2026-05-31)

**CRM Clients (`/dashboard/clients`)**
- **impeccable:** 15/20 Good
- **TSC:** 0 | **build:** clean (51/51) | **E2E:** Test 34 ✅
- **Drawers:** `6d33b7985ead20002063c32a` · `8b26b6ff187c043ed68372b0`

---

## Carry-over (відкладено, не блокують STEP 07)

### STEP 06 — CRM Clients
| ID | Issue | Пріоритет | Файл |
|---|---|---|---|
| D-01 | ClientsPage cards: `borderLeft` 3px → full border + bg tint | 🟠 P1 | `ClientsPage.tsx:631,806` |
| D-02 | ClientWidgets: useMemo для 6 body computations | 🟡 P2 | `ClientWidgets.tsx:47-66` |
| D-03 | Grid action buttons size-10 → size-11 | 🟡 P2 | `ClientsPage.tsx:750-777` |
| D-04 | Sort button: aria-expanded + aria-haspopup | 🟡 P2 | `ClientsPage.tsx:478` |

### STEP 05 — Dashboard Bookings
| ID | Issue | Пріоритет |
|---|---|---|
| C-01 | BookingCard: `borderLeft` 4px side-stripe → replace with full border + bg tint | 🟠 P1 Polish |
| C-02 | BookingDetailsModal: `text-[9px]` status badge → `text-[11px]` | 🟢 P3 |

### STEP 04 — Dashboard Home
| ID | Issue | Пріоритет |
|---|---|---|
| B-01 | `/impeccable audit` health score (baseline 22/40 → target 34+) | 🔴 Critical |
| B-02 | Vercel QA: onboarding flow `967bf06` | 🔴 Critical |
| B-03 | Studio WeeklyChart: BarTooltip click → day detail | 🟡 High |
| B-04 | Frost WeeklyChart: tooltip `rounded-[4px]` | 🟡 High |
| B-05 | Blossom: font/contrast widget headers | 🟡 High |
