# BOOKIT — Технічне завдання v2.0

> **Версія:** 2.0
> **Дата оновлення:** 13.03.2026
> **Статус:** Active Development — Post-MVP
> **Попередня версія:** BOOKIT_TZ.md (v1.0, 07.03.2026)

---

## ЗМІСТ

1. [Огляд та позиціонування](#1-огляд)
2. [Технічний стек — поточний](#2-стек)
3. [Архітектура проєкту — поточна](#3-архітектура)
4. [База даних — поточний стан](#4-база-даних)
5. [Що реалізовано (детально)](#5-реалізовано)
6. [Виправлені проблеми та рефакторинги](#6-виправлено)
7. [Поточні обмеження та технічний борг](#7-борг)
8. [Плани — Епік 2.0: Монетизація](#8-епік-2)
9. [Плани — Епік 3.0: Реферальна система](#9-епік-3)
10. [Плани — Епік 4.0: Studio та мультимайстер](#10-епік-4)
11. [Плани — Епік 5.0: AI-функції](#11-епік-5)
12. [Правила розробки](#12-правила)

---

## 1. ОГЛЯД

### Продукт
**Bookit** — Ukrainian SaaS-платформа для онлайн-запису клієнтів у б'юті-індустрії.

### Слоган
> "Твій розумний link in bio, який заробляє гроші"

### Ключовий диференціатор
**Гібридний кошик:** послуги + товари в одному чеку. Жоден український конкурент (Booksy, Fresha, локальні) цього не робить. Клієнт записується на манікюр і одночасно замовляє улюблений гель-лак — майстер отримує і оплату за роботу, і продаж товару.

### Цільова аудиторія
Соло б'юті-майстри: нігті, волосся, брови/вії, макіяж, барбери. Географія: Україна.

### Монетизація

| Тариф | Ціна | Ліміти |
|-------|------|--------|
| **Starter** | 0 ₴ | До 30 записів/міс, водяний знак Bookit |
| **Pro** | 349 ₴/міс | Необмежено записів, повна аналітика, Telegram-нотифікації, CRM |
| **Studio** | 199 ₴/майстер/міс | Мін. 2 майстри, зведена аналітика (Phase 2) |
| **Комісія** | 3–5% | З кожного проданого товару через платформу |

---

## 2. СТЕК

### Поточний (фактичний)

| Шар | Технологія | Примітка |
|-----|-----------|----------|
| Framework | Next.js 15 (App Router) | Turbopack у dev |
| Мова | TypeScript (strict) | |
| Стилі | Tailwind CSS + shadcn/ui | Дефолтні shadcn токени, без кастомного дизайну |
| Анімації | Framer Motion | AnimatePresence, motion.div |
| Серверний стан | TanStack Query v5 | useQuery + useMutation + optimistic updates |
| Auth + DB | Supabase (PostgreSQL) | RLS на всіх таблицях |
| Storage | Supabase Storage | Bucket `images`, публічний |
| Нотифікації | Telegram Bot API | Server Action → sendTelegramMessage |
| Email | (заплановано Resend) | Поки базова реалізація |
| Тести | Playwright E2E | 24+ тести, POM-патерн |
| Хостинг | Vercel | |
| PWA | next-pwa + sw.js | manifest.json, Service Worker |

### Відмінності від TZ v1.0
- **Zustand не використовується** → замінений на TanStack Query + React state
- **React Hook Form / Zod не використовуються** → ручна валідація у формах
- **@dnd-kit не використовується** → сортування через кнопки ↑↓
- **pg_cron не активний** → тригери через SQL, cron через Vercel Cron (заплановано)

---

## 3. АРХІТЕКТУРА

### Реальна структура проєкту

```
bookit/
├── public/
│   ├── manifest.json          ✅ PWA manifest
│   ├── sw.js                  ✅ Service Worker
│   └── icons/                 ✅ PWA icons (512x512, maskable)
│
├── src/
│   ├── app/
│   │   ├── (auth)/            ✅ login, register (email + Google OAuth)
│   │   ├── (master)/
│   │   │   └── dashboard/
│   │   │       ├── page.tsx           ✅ Overview bento-grid
│   │   │       ├── bookings/          ✅ CRUD записів
│   │   │       ├── services/          ✅ Послуги + Товари (одна сторінка)
│   │   │       ├── clients/           ✅ CRM клієнтів
│   │   │       ├── analytics/         ✅ KPI + графіки (Pro-gated)
│   │   │       ├── settings/          ✅ Профіль + upload + slug
│   │   │       ├── billing/           ⚠️ UI є, WayForPay не підключений
│   │   │       ├── onboarding/        ✅ 2-крокова реєстрація
│   │   │       ├── portfolio/         ⚠️ Структура є, логіка мінімальна
│   │   │       └── reviews/           ⚠️ Структура є, логіка мінімальна
│   │   │
│   │   ├── my/                        ✅ Клієнтський кабінет
│   │   │   ├── bookings/              ✅ Мої записи + скасування + відгук
│   │   │   ├── masters/               ⚠️ Структура є
│   │   │   ├── loyalty/               ⚠️ Структура є
│   │   │   └── profile/               ✅ Профіль клієнта
│   │   │
│   │   ├── [slug]/                    ✅ Публічна сторінка майстра
│   │   ├── explore/                   ✅ Каталог майстрів
│   │   ├── invite/[code]/             ⚠️ Структура є, реферальна логіка не активна
│   │   └── api/                       ⚠️ Мінімальні route handlers
│   │
│   ├── components/
│   │   ├── ui/                ✅ Button, BottomSheet, shadcn-компоненти
│   │   ├── master/
│   │   │   ├── analytics/     ✅ AnalyticsPage (ssr:false через ClientLoader)
│   │   │   ├── bookings/      ✅ BookingsPage, BookingDetailSheet
│   │   │   ├── clients/       ✅ ClientsPage, ClientDetailSheet
│   │   │   ├── services/      ✅ ServiceForm, ProductForm, ImageUploader
│   │   │   ├── settings/      ✅ SettingsPage (logo upload, slug, соцмережі)
│   │   │   └── dashboard/     ✅ DashboardPage (bento, sparkline)
│   │   ├── client/            ✅ MyBookingsPage
│   │   └── public/            ✅ PublicMasterPage, BookingFlow (5-кроків)
│   │
│   └── lib/
│       └── supabase/
│           ├── client.ts      ✅
│           ├── server.ts      ✅
│           ├── admin.ts       ✅
│           ├── context.tsx    ✅ MasterContext
│           └── hooks/
│               ├── useServices.ts     ✅ + description, imageUrl
│               ├── useProducts.ts     ✅ + description, imageUrl, addProductAsync
│               ├── useBookings.ts     ✅
│               ├── useClients.ts      ✅
│               └── useProductLinks.ts ✅ НОВИЙ — крос-сейл зв'язки
│
├── supabase/migrations/
│   ├── 001_initial_schema.sql         ✅ Вся основна схема
│   ├── 002_add_emoji_category.sql     ✅ emoji, stock_unlimited
│   ├── 002_portfolio.sql              ✅ portfolio таблиця
│   ├── 003_auth_trigger_and_grants.sql ✅ Auth тригер
│   ├── 003_avatar_emoji.sql           ✅ avatar_emoji
│   ├── 004_reviews_client_name.sql    ✅ Reviews + client_name
│   ├── 005_client_booking_link_policy.sql ✅ RLS
│   ├── 006_client_master_select_policy.sql ✅ RLS
│   ├── 007_media_fields.sql           ✅ Storage bucket + policies
│   └── 008_inventory_trigger.sql      ✅ Складський облік тригер
│
└── e2e/                               ✅ Playwright тести (24+)
    ├── pages/ (POM)
    └── tests/
```

### Ключові архітектурні принципи (фактичні)

1. **Server vs Client розподіл:**
   - `page.tsx` — Server Component: fetch даних, redirect, передача `isPro` пропом
   - `*Page.tsx`, `*Form.tsx` — Client Components: useState, TanStack Query
   - Аналітика: `page.tsx` (server) → `AnalyticsClientLoader` (client) → `AnalyticsPage` (dynamic, ssr:false)

2. **Data fetching:** TanStack Query для всього що потребує реактивності. Server Components для статичного першого рендеру.

3. **Оптимістичні апдейти:** реалізовані в `useProducts` (toggleProduct), `useServices` (reorderServices).

4. **RLS скрізь:** всі таблиці мають Row Level Security. `get_my_tenant_id()` прив'язує дані до майстра.

---

## 4. БАЗА ДАНИХ

### Поточна схема (після всіх міграцій)

#### Ключові таблиці та їх стан

| Таблиця | Статус | Примітки |
|---------|--------|----------|
| `profiles` | ✅ Активна | role, full_name, telegram_chat_id |
| `master_profiles` | ✅ Активна | slug, subscription_tier, avatar_emoji |
| `client_profiles` | ✅ Активна | referral_code, ambassador_level |
| `services` | ✅ Активна | + emoji, category, description, image_url |
| `products` | ✅ Активна | + emoji, stock_unlimited, description, image_url |
| `product_service_links` | ✅ Активна | крос-сейл зв'язки |
| `service_categories` | ✅ Є в схемі | UI не реалізовано |
| `schedule_templates` | ✅ Активна | Розклад роботи |
| `schedule_exceptions` | ✅ Активна | Вихідні, зміни графіку |
| `bookings` | ✅ Активна | total_services/products/price |
| `booking_services` | ✅ Активна | snapshot назви і ціни |
| `booking_products` | ✅ Активна | без RLS (anon INSERT) |
| `clients` | ✅ Активна | CRM-таблиця майстра (спрощена) |
| `reviews` | ✅ Активна | rating, comment |
| `memberships` | ✅ Активна | Абонементи |
| `client_memberships` | ✅ Активна | |
| `product_sales` | ✅ Активна | |
| `portfolio` | ✅ Є в схемі | UI мінімальний |
| `referrals` | ✅ Є в схемі | Логіка не активна |

#### SQL-тригери

| Тригер | Файл | Що робить |
|--------|------|-----------|
| `update_client_stats` | `update_client_stats_trigger.sql` | Оновлює total_visits/total_spent при `completed` |
| `trg_decrement_product_stock` | `008_inventory_trigger.sql` | Списує stock_quantity при `completed` (SECURITY DEFINER) |
| Auth trigger | `003_auth_trigger_and_grants.sql` | Створює profiles row після реєстрації |

---

## 5. РЕАЛІЗОВАНО

### 5.1 Авторизація та онбординг ✅
- Email/password реєстрація та вхід
- Google OAuth (виправлено redirect bug)
- Middleware з розподілом ролей: `master` → `/dashboard`, `client` → `/my/bookings`
- Режим "майстер як клієнт" через cookie `view_mode`
- 2-кроковий онбординг майстра: профіль → розклад (RPC `create_tenant_with_profile`)

### 5.2 Dashboard майстра ✅
- **Overview:** bento-grid, SVG sparkline виручки, швидкі дії
- **Записи:** список з фільтром по статусу, зміна статусу (pending/confirmed/completed/cancelled/no_show), нотатки майстра, деталі запису в боттомшиті
- **Послуги та товари:** єдина сторінка з табами, повний CRUD, emoji-picker, drag-reorder (↑↓), toggle активності
- **Клієнти:** список з пошуком, деталі в боттомшиті (статистика, теги, нотатки, VIP), фільтр за активністю
- **Аналітика (Pro-gated):** KPI цього місяця, барний графік виручки 6 місяців, топ-5 послуг, топ-10 товарів за виручкою
- **Налаштування:** фото профілю (Supabase Storage), обкладинка, ім'я, slug, bio, Instagram/Telegram, розклад роботи
- **Відгуки:** перегляд відгуків клієнтів
- **Абонементи:** CRUD тарифів + видача клієнтам

### 5.3 Публічна сторінка майстра ✅
- Server Component (SSR + SEO)
- Інформація майстра: аватар, ім'я, опис, рейтинг, соцмережі
- Список послуг з фільтрацією по категоріях
- Карусель товарів
- Sticky CTA "Записатися"
- Відгуки клієнтів

### 5.4 BookingFlow — 5-кроковий флоу ✅
Динамічний: якщо є товари → 5 кроків, якщо немає → 4 кроки.

| Крок | Що відбувається |
|------|----------------|
| 1. Послуги | Вибір однієї або кількох послуг, підрахунок суми |
| 2. Дата/час | Слоти генеруються на основі розкладу + вже зайнятих записів |
| 3. Товари | Крос-сейл: відфільтровані за `product_service_links`, кошик з кількістю |
| 4. Клієнт | Ім'я, телефон, email (опц.), коментар; автозаповнення якщо авторизований |
| 5. Підтвердження | Резюме з підсумками: послуги / товари / до сплати |
| ✅ Успіх | Telegram-нотифікація майстру (з переліком товарів), email клієнту |

### 5.5 Клієнтський кабінет ✅
- Мої записи: статус-бейджи, скасування з причиною (за 24 год), повторний запис
- Відгук після завершеного візиту (1–5 зірок + текст)
- Профіль клієнта: ім'я, телефон

### 5.6 Каталог майстрів `/explore` ✅
- Список опублікованих майстрів
- Пошук, фільтр по категоріях
- Server Component (SEO)

### 5.7 Медіа (Епік 1.1) ✅
- `ImageUploader` — завантаження фото для послуг і товарів
- Supabase Storage bucket `images` (публічний)
- RLS policies: master може завантажувати тільки у свою папку `{folder}/{masterId}/...`
- Поля `description` і `image_url` в `services` і `products` (були в схемі, тепер маплюються в хуках)

### 5.8 Крос-сейл (Епік 1.1) ✅
- `product_service_links` UI в `ProductForm`: режим "Всі послуги" або "Обрані послуги"
- `useProductLinks` хук: CRUD зв'язків
- `getAutoSuggestProductIds` — BookingFlow фільтрує товари на кроці 3 за зв'язками

### 5.9 Складський облік (Епік 1.1) ✅
- SQL-тригер `trg_decrement_product_stock` (SECURITY DEFINER)
- Спрацьовує при `bookings UPDATE → status = 'completed'`
- Списує `stock_quantity` для не-unlimited товарів
- Захист `GREATEST(0, ...)` від від'ємного залишку

### 5.10 E2E тести (Playwright) ✅
- **24+ тести** у 4 spec-файлах
- Auth flows (реєстрація, логін, Google OAuth)
- Dashboard CRUD
- Public page + BookingFlow (5 тестів)
- Page Object Model (POM) патерн

---

## 6. ВИПРАВЛЕНО

### 6.1 Google OAuth redirect bug
**Проблема:** при вході через Google кидало на landing page, з другої спроби — в систему.
**Рішення:** виправлено `app/auth/callback/route.ts` — сесія встановлюється до редіректу.

### 6.2 Синхронізація даних з Supabase
**Проблема:** дані на дашборді були хардкодом, нові записи не зберігались в БД.
**Рішення:** повний перехід на TanStack Query + Supabase у всіх CRUD-хуках.

### 6.3 RLS та `get_my_tenant_id()`
**Проблема:** порожні дані у деяких таблицях через відсутні RLS-policies.
**Рішення:** додано міграції 005, 006 з правильними policy для клієнтів і `client_master_select`.

### 6.4 TypeScript Promise.all з Supabase
**Проблема:** `PostgrestFilterBuilder` не assignable до `Promise<unknown>` — помилка при `Promise.all([...inserts])`.
**Рішення:** sequential `await` замість `Promise.all` для Supabase INSERT.

### 6.5 Hydration error в Analytics
**Проблема:** `isPro` рахувався всередині клієнтського компонента → сервер і браузер отримували різні значення → React hydration mismatch.
**Рішення:**
- `isPro` визначається в `page.tsx` (Server Component) і передається пропом
- `AnalyticsPage` завантажується через `AnalyticsClientLoader` з `dynamic({ ssr: false })`
- Жодного мерехтіння, жодних помилок гідрації

### 6.6 Storage RLS policies
**Проблема:** `CREATE POLICY IF NOT EXISTS` — неіснуючий PostgreSQL синтаксис. Міграція падала, policies не створювались, upload блокувався RLS.
**Рішення:** замінено на `DROP POLICY IF EXISTS` + `CREATE POLICY`.

### 6.7 Timezone
**Проблема:** `toISOString().split('T')[0]` давав неправильну дату в UTC+2.
**Рішення:** глобальний `toLocalDateStr()` хелпер для всіх date операцій.

---

## 7. ТЕХНІЧНИЙ БОРГ

| Проблема | Пріоритет | Де |
|----------|-----------|-----|
| Немає Zod-валідації у формах | Середній | ServiceForm, ProductForm, BookingFlow |
| `any` у Supabase query results | Низький | hooks/*.ts |
| Немає React Hook Form | Низький | всі форми |
| `service_categories` UI не реалізовано | Середній | ServiceForm використовує plain text |
| Email нагадування (Resend + cron) | Високий | немає жодної реалізації |
| WayForPay інтеграція | Критичний | тільки UI на billing page |
| Реферальна система | Середній | таблиці є, логіка не активна |
| Portfolio UI | Низький | мінімальна реалізація |
| invite/[code] логіка | Середній | структура є, бізнес-логіка відсутня |
| `my/masters`, `my/loyalty` | Низький | тільки структура сторінок |
| Smart Slot Suggestion | Критичний | алгоритм не реалізовано |
| Realtime підписки (Supabase) | Середній | нові записи без real-time у дашборді |

---

## 8. ЕПІК 2.0 — МОНЕТИЗАЦІЯ

### 8.1 WayForPay підписки

**Мета:** автоматичний billing для Pro і Studio тарифів.

**Що потрібно:**
- `app/api/payments/webhook/route.ts` — обробка WayForPay callbacks
- Server Action `createSubscription(tier)` — ініціювання платежу
- Оновлення `subscription_tier` і `subscription_expires_at` після успішного платежу
- Cron-завдання: перевірка `subscription_expires_at` щодня, downgrade до Starter якщо прострочено
- UI на `/dashboard/billing`: поточний план, кнопки переходу, дата наступного списання

**Файли:**
```
app/api/payments/webhook/route.ts    ← NEW
lib/wayfopay/client.ts               ← NEW
app/(master)/dashboard/billing/      ← UPDATE (додати реальну логіку)
supabase/migrations/009_billing.sql  ← NEW (billing_events таблиця)
```

### 8.2 Email нагадування (Resend + Vercel Cron)

**Мета:** автоматичні нагадування клієнтам за 24 год до візиту.

**Що потрібно:**
- `app/api/cron/reminders/route.ts` — Vercel Cron endpoint
- Шаблон email через Resend SDK
- `vercel.json` з cron-розкладом (`0 9 * * *`)

**Файли:**
```
app/api/cron/reminders/route.ts      ← NEW
lib/email.ts                         ← UPDATE (додати reminder template)
vercel.json                          ← NEW (cron config)
```

### 8.3 Ліміт Starter (30 записів/міс)

**Мета:** enforcement ліміту безплатного тарифу.

**Що потрібно:**
- Перевірка `bookings_this_month >= 30` в BookingFlow перед кроком підтвердження
- Cron оновлення `bookings_this_month = 0` першого числа кожного місяця
- UI-блокування з CTA "Перейти на Pro"

**Статус:** частково реалізовано (перевірка є, але cron скидання — ні).

---

## 9. ЕПІК 3.0 — РЕФЕРАЛЬНА СИСТЕМА

### Концепція
**Двосторонній viral loop:** клієнт запрошує свого майстра → майстер реєструється → клієнт отримує бонус → майстер отримує знижку на перший місяць Pro.

### Що потрібно

**Таблиці** (вже є в схемі):
- `referrals` — зв'язок referrer_id → referred_id, статус, бонус
- `client_profiles.referral_code` — унікальний код

**Логіка:**
1. Клієнт у `/my/bookings` бачить CTA "Запросити мого майстра"
2. Генерує посилання `bookit.com.ua/invite/[code]`
3. Майстер реєструється через посилання
4. Тригер записує в `referrals`, нараховує бонус клієнту
5. Клієнт бачить статус запрошень у `/my/loyalty`

**Файли:**
```
app/invite/[code]/page.tsx           ← UPDATE (реальна логіка)
app/my/loyalty/page.tsx              ← UPDATE
supabase/migrations/010_referrals_logic.sql ← NEW
```

---

## 10. ЕПІК 4.0 — STUDIO ТА МУЛЬТИМАЙСТЕР

### Концепція
Студія з кількома майстрами: спільний онлайн-запис, зведена аналітика, управління персоналом.

### Що потрібно
- Таблиця `studios` з FK до `master_profiles`
- Роль `studio_owner` > `master`
- Studio dashboard: зведений розклад всіх майстрів
- Зведена аналітика: виручка по майстрах, завантаженість
- Billing: Studio тариф (199 ₴ × N майстрів)

**Пріоритет:** Phase 2 (після стабілізації монетизації)

---

## 11. ЕПІК 5.0 — AI-ФУНКЦІЇ

### 11.1 Smart Slot Suggestion
**Мета:** AI пропонує "найкращий час" для запису на основі:
- Популярних часів у клієнта
- Завантаженості майстра
- Типу послуги

**Реалізація:** простий scoring алгоритм (не LLM), `lib/utils/smartSlots.ts`

### 11.2 Auto Client Tags
**Мета:** автоматичні теги клієнтів ("Постійний", "Давно не приходив", "VIP").

**Реалізація:** SQL-функція на основі `total_visits`, `last_visit_at`, `total_spent`.

### 11.3 Revenue Forecast
**Мета:** прогноз виручки на наступний місяць на основі bookings_this_month + тренду.

**Реалізація:** простий linear regression у клієнтському JS.

**Пріоритет:** Phase 3

---

## 12. ПРАВИЛА РОЗРОБКИ

### Архітектурні правила

```
✅ page.tsx                → Server Component (fetch, auth check, props down)
✅ *Page.tsx / *Form.tsx   → Client Component (useState, TanStack Query)
✅ hooks/use*.ts           → 'use client', TanStack Query
✅ app/[slug]/actions.ts   → 'use server', Server Actions

❌ toISOString().split('T')[0]  → замість: toLocalDateStr()
❌ CREATE POLICY IF NOT EXISTS  → замість: DROP POLICY IF EXISTS + CREATE POLICY
❌ Promise.all([supabase...])   → замість: sequential await
❌ isPro всередині компонента   → замість: проп з server page.tsx
❌ dynamic({ssr:false}) в Server Component → через Client wrapper
```

### Правила ціноутворення
- Ціни зберігаються в **гривнях** (DECIMAL 10,2) — не в копійках
- Відображення: `price.toLocaleString('uk-UA') + ' ₴'`
- ⚠️ `toLocaleString` може відрізнятись між Node.js і браузером для чисел > 999. Уникати в SSR-рендері, використовувати тільки після mount.

### Правила Storage
- Bucket: `images` (публічний)
- Path: `{folder}/{masterId}/{timestamp}-{uuid}.{ext}`
- Приклад: `services/abc123/1710000000-uuid4.jpg`
- Policy: master може писати тільки у свою папку (перевірка `[2]` в `foldername`)

### Git-конвенції
- Гілка: `main`
- Commit message: українською або англійською, без emoji
- Міграції: нумеровані (`009_`, `010_`), ідемпотентні

---

## СТАТУС ПРОЄКТУ

```
Phase 1 — MVP Core                  ████████████████████ 100% ✅
Phase 1.1 — Медіа + крос-сейл       ████████████████████ 100% ✅
Phase 2 — Монетизація (WayForPay)   ████░░░░░░░░░░░░░░░░  20% 🔄
Phase 2.1 — Email нагадування       ░░░░░░░░░░░░░░░░░░░░   0% 📋
Phase 3 — Реферальна система        ██░░░░░░░░░░░░░░░░░░  10% 📋
Phase 4 — Studio мультимайстер      ░░░░░░░░░░░░░░░░░░░░   0% 📋
Phase 5 — AI функції                ░░░░░░░░░░░░░░░░░░░░   0% 📋
```

**Поточний фокус:** Phase 2 — WayForPay підписки + Email нагадування.

---

*Документ оновлено: 13.03.2026*
*Наступне оновлення: після завершення Phase 2*
