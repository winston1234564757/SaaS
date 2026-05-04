# Матриця Когерентності BookIT — Аудит v1.1 (Виправлений)

> Дата: 2026-05-05  
> Версія: 1.1 — виправлено помилки першого запуску  
> Метод: Сліпий аудит через Graphify + прямий аналіз коду + верифікація на prod (`bookit-five-psi.vercel.app`)  
> Охоплення: 464 файли · 505,158 слів · 2630 nodes (Graphify)  
> Аудитор: Antigravity (Principal Systems Analyst)

---

## Виправлення v1.1

Після перевірки prod-сайту та повного читання `createBooking.ts` виявлено дві помилки першого запуску:

| Файл | Що було | Що правда |
|---|---|---|
| `PLANFICH/c2c-settings-ui-missing.md` | "C2C UI відсутній" | C2C UI є в `/dashboard/growth?drawer=loyalty` (LoyaltyPage.tsx рядки 406–500) |
| `PLANFICH/booking-limit-starter-not-enforced.md` | "Ліміт не реалізований" | Ліміт є в `createBooking.ts` рядок 186: `if ((count ?? 0) >= 30)` |

**Причина помилок:** grep по `settings/` замість `growth/loyalty/`, та пошук неправильних ключових слів.

---

## Архітектура Growth Hub (важливо для аудиту)

Весь функціонал "Growth" зосереджений у **трьох drawer-based компонентах**, доступних через `/dashboard/growth`:

| URL | Компонент | Вміст |
|---|---|---|
| `?drawer=loyalty` | `LoyaltyPage.tsx` | Програми лояльності + **C2C "Запроси подругу"** |
| `?drawer=referral` | `ReferralPage.tsx` | B2B рефералка (майстер запрошує майстра → Pro бонус) |
| `?drawer=partners` | `PartnersPage.tsx` | Cartel: Partner мережа + Alliance visibility |

---

## Зведена таблиця (v1.1)

| Категорія | Кількість файлів | Критичних 🔴 | Середніх 🟠 | Мінорних 🟡 |
|---|---|---|---|---|
| 📁 PLANFICH (Обіцяно, не зроблено) | **4 актуальних** | 2 | 0 | 2 |
| 💎 IMPLEMENTFICH (Зроблено, не маркетизовано) | **8** | 0 | 0 | 8 |
| 🔧 TECH_DEBT (Напівфабрикати / борги) | **4 актуальних** | 0 | 1 | 3 |

---

## 📁 PLANFICH — Актуальні знахідки

### 🔴 #1 — Studio Dashboard: Waitlist заглушка
**Файл:** `PLANFICH/studio-management-dashboard.md`  
`/dashboard/studio` = "Модуль Studio готується" + WaitlistButton.  
Тариф Studio (299₴/майстер/місяць) рекламується, Management UI відсутній. Billing flow відсутній.

### 🔴 #2 — Studio: Відсутня єдина база клієнтів та ролі
**Файл:** `PLANFICH/studio-unified-client-base-roles.md`  
Обіцяно "Розділення прав (owner/admin/master)" та "Єдина база клієнтів" — немає ні в DB, ні в UI.

### 🟡 #3 — Loyalty: "Кешбек" vs реальна знижкова система
**Файл:** `PLANFICH/loyalty-cashback-mismatch.md`  
Лендінг показує "380 балів = 76 ₴", реальність — tier-знижка на N-й візит. Маркетингова дезінформація.

### 🟡 #4 — Studio Billing Flow
**Файл:** `PLANFICH/studio-billing-flow.md`  
Billing реалізований лише для Pro. Studio per-seat (299₴ × N майстрів) відсутній.

---

## 💎 IMPLEMENTFICH — ТОП-3 Приховані Діаманти

### 💎 #1 — C2C "Запроси подругу" — Вірусний механізм (у Growth Hub)
**Файл:** `IMPLEMENTFICH/c2c-referral-friend-invite.md`

**Де є:** `/dashboard/growth?drawer=loyalty` (внизу Loyalty drawer) + `PostBookingAuth.tsx`  
Повна механіка: friend discount + referrer bonus + RPC. **Ніде не згадується на лендінгу.**

### 💎 #2 — Partners Cartel — Крос-трафік між майстрами (у Growth Hub)
**Файл:** `IMPLEMENTFICH/partners-cartel-network.md`

**Де є:** `/dashboard/growth?drawer=partners` + `TrustedPartnersBlock` на публічній сторінці  
`master_alliances` DB + `PartnersPage.tsx` (11.6 KB). **Ніде в Pricing не вказано.**

### 💎 #3 — Broadcast Conversion Tracking — Enterprise аналітика
**Файл:** `IMPLEMENTFICH/broadcast-short-links-conversion.md`

Short links → clicked_at → booked_at → discount_used_at per-recipient per-channel.  
**Більшість SaaS конкурентів не мають такого рівня трекінгу.**

---

## 🔧 TECH_DEBT — Актуальні знахідки

### 🟠 #1 — Studio Dashboard = Waitlist (Backend є, Frontend немає)
**Файл:** `TECH_DEBT/studio-dashboard-waitlist-placeholder.md`  
Майстер може приєднатись (join flow є), власник не може управляти командою.

### 🟡 #2 — Booking Limit 30 vs 50 в BOOKIT.md
**Файл:** `TECH_DEBT/booking-limit-not-enforced.md`  
Код = 30, BOOKIT.md = 50. Розсинхрон документації (не коду). Потребує бізнес-рішення.

### 🟡 #3 — Loyalty "Кешбек" назва не відповідає реалізації
**Файл:** `TECH_DEBT/loyalty-cashback-naming-mismatch.md`  
"Кешбек/бали" на лендінгу ≠ tier-знижка в коді.

### 🟡 #4 — Waitlists: Клієнтський flow відсутній
**Файл:** `TECH_DEBT/waitlists-client-flow-missing.md`  
`waitlists` таблиця є тільки для внутрішніх feature-waitlist, а не для клієнтів що хочуть записатись у чергу на зайнятий слот.

---

## Пріоритетний план дій

### Негайно (маркетинг → монетизація)
1. ✅ Додати C2C "Запроси подругу" на лендінг
2. ✅ Додати Partners Cartel в Pricing (Pro feature)
3. ✅ Додати Broadcast Conversion Tracking в лендінг

### Короткостроково (Studio MVP)
4. ⬜ Studio Dashboard: список команди + invite button
5. ⬜ Studio Billing: per-seat через Monobank

### Бізнес-аналіз
6. 🤔 Booking Limit: 30 (код) чи змінити? → глибокий аналіз unit economics

### Copywriting фікси
7. ✅ "Кешбек" → "Знижки за лояльність" на лендінгу
8. ✅ `BOOKIT.md`: оновити 50 → 30 (або навпаки після рішення)
