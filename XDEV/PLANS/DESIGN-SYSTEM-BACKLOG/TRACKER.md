# DESIGN-SYSTEM TRACKER — конвергенція на дизайн-мову

> Джерело задач: [DESIGN_SYSTEM_ROLLOUT.md](file:///C:/Users/Vitos/SaaS/XDEV/PLANS/DESIGN_SYSTEM_ROLLOUT.md) · Спека: [DESIGN_LANGUAGE.md](file:///C:/Users/Vitos/SaaS/XDEV/DESIGN_LANGUAGE.md) · Еталон: C-CLI-01
> Прогрес: **6/23 ✅** · Фундамент ✅ · Активна тема: Frost
> ▶ **NEXT: `DS-DASH-07`** — Здоров'я каналів (`ChannelHealthWidget`, Тір 1)

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
| DS-DASH-07 | Здоров'я каналів | `widgets/frost/ChannelHealthWidget.tsx` | 1 | ⬜ ▶ NEXT |
| DS-DASH-08 | Топ послуги | `widgets/frost/TopServicesWidget.tsx` | 1 | ⬜ |
| DS-DASH-09 | Пульс доходу | `widgets/EarningsPulseWidget.tsx` | 1 | ⬜ |
| DS-DASH-10 | Адаптивна смуга контексту | `widgets/AdaptiveContextStrip.tsx` | 1 | ⬜ |

> +опційно за потреби (не окремі задачі поки): `MonthlyCalendarWidget`, `FrostMetricsStrip`, `QuickActionsWidget`, `StockWidget`. Дрібні (Тір 1) віджети можна батчити 2–3 за сесію, важкі (Тір 2) — окремо.

---

## Фаза P3 — Модалки та шторки (2-й пріоритет: висока важіль-віддача, реюз C-CLI-01)

Усі споживачі `Sheet` → hero через `EditorialCover` + тіло через `Section` (як картка клієнта).

| ID | Поверхня | Файл | Тір | Статус |
|----|----------|------|-----|--------|
| DS-MODAL-01 | Ручний запис | `ManualBookingForm.tsx` | 2 | ⬜ |
| DS-MODAL-02 | Огляд розхідників при завершенні | `MaterialsReviewSheet.tsx` | 1 | ⬜ |
| DS-MODAL-03 | Деталь відгуку | `ReviewDetailSheet.tsx` | 1 | ⬜ |
| DS-MODAL-04 | Деталь флеш-акції | `FlashDealDetailSheet.tsx` | 1 | ⬜ |
| DS-MODAL-05 | Деталь розсилки | `BroadcastDetailSheet.tsx` | 1 | ⬜ |
| DS-MODAL-06 | Нова розмова | `NewConversationSheet.tsx` | 1 | ⬜ |
| DS-MODAL-07 | Деталь-шіт аналітики | `OverviewDetailSheet.tsx` | 1 | ⬜ |

---

## Фаза P2 — Клієнтська зона (публіка + запис)

Перевести на Frost-токени + кіт. Легасі-персик подекуди. Booking-крок = editorial.

| ID | Поверхня | Файл | Тір | Статус |
|----|----------|------|-----|--------|
| DS-CLIENT-01 | Публічна сторінка майстра | `public/PublicMasterPage.tsx` | 2 | ⬜ |
| DS-CLIENT-02 | Майстер запису (6 кроків) | `shared/BookingWizard.tsx` | 2 | ⬜ |
| DS-CLIENT-03 | Мої записи | `app/my/bookings/*` | 2 | ⬜ |
| DS-CLIENT-04 | Мій профіль | `app/my/profile/*` | 1 | ⬜ |

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
