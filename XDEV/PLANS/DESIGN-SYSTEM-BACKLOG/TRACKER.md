# DESIGN-SYSTEM TRACKER — конвергенція на дизайн-мову

> Джерело задач: [DESIGN_SYSTEM_ROLLOUT.md](file:///C:/Users/Vitos/SaaS/XDEV/PLANS/DESIGN_SYSTEM_ROLLOUT.md) · Спека: [DESIGN_LANGUAGE.md](file:///C:/Users/Vitos/SaaS/XDEV/DESIGN_LANGUAGE.md) · Еталон: C-CLI-01
> Прогрес: **25/30 ✅** · Фундамент ✅ · Активна тема: Frost · **P1 ЗАКРИТА** · **P3 6/7** · **P2 клієнт-зона ✅** · **Analytics ✅** · **Settings ✅** · **Bookings-list ✅** · **Clients ✅** · **Marketing ✅** (контраст+eyebrow conform-серія) (02 BookingWizard — founder-сесія)
> ▶ **NEXT: Billing** (`master/billing/*`), далі: Revenue-таби (flash/pricing) · P5 лендинг (LAND-01). Борг: **DS-BOOK-DASH** (темні Command-Center views ~87 occ, dark-context care). ⚠️ `DS-MODAL-01`+`DS-CLIENT-02` (BookingWizard) — окрема сесія з founder

Легенда: ⬜ не почато · 🔧 в роботі · ✅ здано+founder QA · ↩️ скасовано · тір за WORKFLOW (0 дрібний / 1 середній / 2 повний редизайн).

---

## Фундамент — ✅ DONE (C-CLI-01, 03.07)

| # | Що | Статус |
|---|----|--------|
| F1 | Токени `--cover-bg` / `.editorial-cover` (globals.css) | ✅ |
| F2 | Примітиви `EditorialCover` + `Section` | ✅ |
| F3 | `Button` / `Badge` під мову · `BentoCard` видалено | ✅ |
| F4 | `Sheet` `srTitle` | ✅ |
| F5 | Еталон: картка клієнта + запису (Досьє, variant cover/inline) | ✅ |
| F6 | `DESIGN_LANGUAGE.md` + impeccable `DESIGN.md` | ✅ |

---

## Фаза P1 — Дашборд-віджети майстра (найвищий пріоритет, біль 6/10)

`FrostDashboard` + `widgets/frost/*`. Хендрольні bento без домінанти → `EditorialCover` герой дня + `Section` тіло. **Кожен віджет — власна ієрархія, не рівна сітка.**

| ID | Поверхня | Файл | Тір | Статус |
|----|----------|------|-----|--------|
| DS-DASH-01 | Shell + «Герой дня» (greeting/hero-зона) | `widgets/frost/GreetingWidget.tsx` + `FrostMetricsStrip.tsx` | 2 | ✅ |
| DS-DASH-02 | Тижневий графік | `widgets/frost/WeeklyChartWidget.tsx` | 2 | ✅ |
| DS-DASH-03 | Години пік | `widgets/frost/PeakHoursWidget.tsx` | 1 | ✅ |
| DS-DASH-04 | Рейт скасувань | `widgets/frost/CancellationRateWidget.tsx` | 1 | ✅ |
| DS-DASH-05 | Найближчі вільні дні | `widgets/frost/NextFreeDaysWidget.tsx` | 1 | ✅ |
| DS-DASH-06 | Інсайти-рядок | `widgets/frost/InsightsRow.tsx` | 1 | ✅ |
| DS-DASH-07 | Здоров'я каналів | `widgets/frost/ChannelHealthWidget.tsx` | 1 | ✅ |
| DS-DASH-08 | Топ послуги | `widgets/frost/TopServicesWidget.tsx` | 1 | ✅ |
| DS-DASH-09 | Пульс доходу | `widgets/EarningsPulseWidget.tsx` | 1 | ✅ |
| DS-DASH-10 | Адаптивна смуга контексту | `widgets/AdaptiveContextStrip.tsx` | 1 | ✅ |

> +опційно за потреби (не окремі задачі поки): `MonthlyCalendarWidget`, `FrostMetricsStrip`, `QuickActionsWidget`, `StockWidget`. Дрібні (Тір 1) віджети можна батчити 2–3 за сесію, важкі (Тір 2) — окремо.

---

## Фаза P3 — Модалки та шторки (2-й пріоритет: висока важіль-віддача, реюз C-CLI-01)

Усі споживачі `Sheet` → hero через `EditorialCover` + тіло через `Section` (як картка клієнта).

| ID | Поверхня | Файл | Тір | Статус |
|----|----------|------|-----|--------|
| DS-MODAL-01 | Ручний запис | `ManualBookingForm.tsx` | 2 | ⏸️ відкладено |
| DS-MODAL-02 | Огляд розхідників при завершенні | `MaterialsReviewSheet.tsx` | 1 | ✅ |
| DS-MODAL-03 | Деталь відгуку | `ReviewDetailSheet.tsx` | 1 | ✅ |
| DS-MODAL-04 | Деталь флеш-акції | `FlashDealDetailSheet.tsx` | 1 | ✅ |
| DS-MODAL-05 | Деталь розсилки | `BroadcastDetailSheet.tsx` | 1 | ✅ |
| DS-MODAL-06 | Нова розмова | `NewConversationSheet.tsx` | 1 | ✅ конформний |
| DS-MODAL-07 | Деталь-шіт аналітики | `OverviewDetailSheet.tsx` | 1 | ✅ |

> **DS-MODAL-01 ⏸️:** `ManualBookingForm` = 92-рядковий врапер над shared `BookingWizard` (448 рядків + 14 sub-компонентів). Редизайн = переписати revenue-critical 6-крок booking flow, спільний із клієнт-зоною = фактично `DS-CLIENT-02`. НЕ автономно — окрема присвячена сесія з founder-in-loop. Об'єднати з DS-CLIENT-02.
> **DS-MODAL-06 ✅ конформний:** уже на kit `Sheet` + коректні токени (`text-sub`, без банів, без emoji, kit-компоновка). Косметичний ретрофіт заборонено законом → залишено як є, верифіковано.

---

## Фаза P2 — Клієнтська зона (публіка + запис)

Перевести на Frost-токени + кіт. Легасі-персик подекуди. Booking-крок = editorial.

| ID | Поверхня | Файл | Тір | Статус |
|----|----------|------|-----|--------|
| DS-CLIENT-01 | Публічна сторінка майстра | `public/PublicMasterPage.tsx` | 2 | ✅ |
| DS-CLIENT-02 | Майстер запису (6 кроків) | `shared/BookingWizard.tsx` | 2 | ⬜ |
| DS-CLIENT-03 | Мої записи | `app/my/bookings/*` | 2 | ✅ |
| DS-CLIENT-04 | Мій профіль | `app/my/profile/*` | 1 | ✅ |
| DS-CLIENT-05 | Explore (пошук майстрів) | `public/ExplorePage.tsx` + `explore/*` | 2 | ✅ |
| DS-ANL-RESIDUAL | Analytics residual + purge (post M-ANL) | `analytics/sections/*` + `charts/*` + `primitives/*` | 2 | ✅ |
| DS-SET-CONFORM | Settings контраст + eyebrows sentence-case | `master/settings/*` (13 файлів) | 2 | ✅ |
| DS-BOOK-LIST | Bookings список контраст+eyebrow+emoji | `BookingsPage` · `BookingCard` · `DashboardWidgets` | 2 | ✅ |
| DS-BOOK-DASH | Bookings Command-Center dark views | `dashboard/*` + `BookingDetailsModal` (dark, ~87 occ) | 2 | ⬜ |
| DS-CLI-CONFORM | Clients контраст + eyebrows sentence-case | `ClientsPage`/`ClientGridCard`/`ClientListRow`/`ClientWidgets`/`SegmentBuilder` | 2 | ✅ |
| DS-MKT-CONFORM | Marketing контраст + eyebrows + калібр-тони | `MarketingTabs`/`StoryGenerator`/story steps/`BroadcastEditor`/`BroadcastHistory` (11 файлів) | 2 | ✅ |

> **DS-CLIENT-01 ✅ (04.07, commits ef60dadd + 93072d42):** ч.1 header-герой (центрований bento → темна асиметрична `EditorialCover` = `PublicMasterHero`) + Services + Reviews (featured-крафт). ч.2 графік роботи (сьогодні-домінанта, токени, контраст-фікс) + shop-банер (градієнт/blob → чистий bento-CTA) + товари (N карток → hairline-рядки, metric-value). Фідбек «крафт світлих блоків» застосовано наскрізь. **Не чіпав (окремі компоненти / функц-прийнятні):** банери рефералів, FlashDealsStrip, PublicPortfolioGallery, TrustedPartnersBlock, floating CTA — опортуністична міграція коли чіпаємо ці файли.
> `/my/messages` (месенджер) уже конвергентний (M-CHAT-01) — опортуністична міграція примітивів, не окрема задача.

---

## Фаза P5 — Лендинг узгодження

`landing/*` уже Frost, але власна `--l-*` система. Звірити токени/рамп із мовою (dark-блоки BentoFeatures/FooterCTA вже темні).

| ID | Поверхня | Файл | Тір | Статус |
|----|----------|------|-----|--------|
| DS-LAND-01 | Узгодження токенів/рампу лендингу | `components/landing/*` + `globals.css .landing-page` | 1 | ⬜ |

---

## Фаза P4 — Кнопки/картки-хендроли (опортуністично, наскрізна)

Хендрольні `<button className>` та `bento-card p-5` → `Button`/`Section`. **НЕ big-bang** — по-екранно в межах P1–P3. Трекається як одна ongoing-задача.

| ID | Поверхня | Обсяг | Статус |
|----|----------|-------|--------|
| DS-BTN-01 | Хендрол-кнопки/картки повз кіт | Прибирати в межах кожної DS-задачі P1–P3 + окремі догрібання | 🔧 ongoing |

---

## Конвергентні цим спринтом — опортуністична міграція примітивів

Зроблено під Законом темного блоку ДО кіт-примітивів. Не переробляти — переводити на `EditorialCover`/`Section`/`Button` **коли й так чіпаємо екран**:

Analytics 7/7 (M-ANL) · Billing (M-BILL) · Settings (M-SET) · Reviews (M-REVW) · Growth/Loyalty (M-GROW) · Marketing story (M-MKT) · Explore (C-EXPL) · MyBottomNav (C-NAV) · Messenger (M-CHAT).

---

## Поза розкатом

Теми Blossom / Studio (Frost-only активна) · адмін-зона (низький пріоритет).

---

## Рекомендований порядок виконання

**P1 (дашборд)** → **P3 (модалки)** → **P2 (клієнт-зона)** → **P5 (лендинг)**. P4 — паралельно всередині кожної. Обґрунтування: біль founder × охоплення × реюз еталону. Порядок можна коригувати опортуністично (чіпаєш екран — конвертуй).
