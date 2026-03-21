# Bookit — Еталонна Технічна Документація

> **Ukrainian SaaS для онлайн-запису у б'юті-індустрії**
> "Твій розумний link in bio, який заробляє гроші"
> *Оновлено: 21.03.2026 · Версія: 3.0 (22+ ітерації)*

---

## Зміст

1. [Візія та Позиціонування](#1-візія-та-позиціонування)
2. [Ключовий Функціонал — Для Майстра](#2-ключовий-функціонал--для-майстра)
3. [Ключовий Функціонал — Для Клієнта](#3-ключовий-функціонал--для-клієнта)
4. [Технічний Стек та Архітектура](#4-технічний-стек-та-архітектура)
5. [Схема Бази Даних](#5-схема-бази-даних)
6. [Стандарти Коду та Engineering Principles](#6-стандарти-коду-та-engineering-principles)
7. [API Endpoints](#7-api-endpoints)
8. [Маршрутизація та Захист](#8-маршрутизація-та-захист)
9. [Дизайн-система](#9-дизайн-система)
10. [PWA та Offline](#10-pwa-та-offline)
11. [Безпека та Аудит](#11-безпека-та-аудит)

---

## 1. Візія та Позиціонування

### Продукт

**Bookit** — мобільний SaaS для майстрів краси України (перукарі, майстри манікюру/педикюру, lash/brow-майстри, масажисти тощо). Кожен майстер отримує персональну публічну сторінку `bookit.com.ua/[slug]` з повноцінним онлайн-записом, CRM, аналітикою та автоматизацією — без власного сайту, без адміністратора, без технічних знань.

**Слоган:** "Твій розумний link in bio, який заробляє гроші"

### Ринок та Диференціатор

| Конкурент | Слабке місце | Bookit відповідь |
|-----------|-------------|-----------------|
| Просте посилання в bio | Не конвертує, нема запису | Повноцінний booking flow прямо зі сторінки |
| Universkin / Fresha | Дорого, зайво складно, не локалізовано | Freemium, UA ринок, mobile-first |
| Telegram-боти | Нема аналітики, нема CRM | Когортний аналіз, churn prediction, тегування |

**Унікальний стек функцій в одному продукті:**
- **Smart Slots Engine** — алгоритм вільних слотів з буфером, перервами, multi-service консективністю
- **Dynamic Pricing** — peak/quiet/early_bird/last_minute мультиплікатори на рівні кожного слота
- **Loyalty Engine** — N-візитів → нагорода прямо в booking flow
- **Flash Deals** — обмежені акції з розсилкою через Push + Telegram
- **Studio режим** — мультимайстер під одним брендом

### Монетизація

| Тариф | Ціна | Ключові обмеження |
|-------|------|--------------------|
| **Starter** | 0₴ | 30 записів/місяць, 2 flash-акції/місяць, вотермарка, 9 фото |
| **Pro** | 349₴/місяць | Необмежено записів, повна аналітика, CRM, CSV, без вотермарки |
| **Studio** | 199₴/майстер/місяць | Мультимайстер, спільний бренд, invite-flow |

---

## 2. Ключовий Функціонал — Для Майстра

### Booking Engine

**Smart Slots Algorithm** (`src/lib/utils/smartSlots.ts`):
- Генерує вільні часові слоти на основі `working_hours` майстра
- Враховує існуючі бронювання + їх `total_duration`
- Буфер після послуги (configurable, за замовчуванням 0 хв)
- Перерви: заблоковані проміжки всередині робочого дня
- **Multi-service**: перевірка consecutive slots — якщо замовлено 2 послуги (60 + 45 хв = 105 хв), алгоритм шукає безперервний блок без перетину

**Manual Booking FAB** (`src/components/master/bookings/`):
- Плаваюча кнопка "+" на сторінці записів
- Майстер вручну додає клієнта (phone lookup або new), послугу, дату/час, нотатку
- `source: 'manual'` — відображається badge у BookingCard

### Dynamic Pricing

Зберігається в `master_profiles.pricing_rules` (jsonb). Редагується через `/dashboard/pricing`.

```typescript
interface PricingRules {
  peakHours:   { start: string; end: string; multiplier: number }[];   // e.g. ×1.3 у 12–18
  quietHours:  { start: string; end: string; multiplier: number }[];   // e.g. ×0.85 рано вранці
  lastMinute:  { hoursThreshold: number; discount: number };           // -15% якщо < 3г до початку
  earlyBird:   { daysThreshold: number; discount: number };            // -10% якщо > 7 днів наперед
}
```

`src/lib/utils/dynamicPricing.ts`: `calculateDynamicPrice(basePrice, rules, slotDateTime)` → фінальна ціна в копійках.
На публічній сторінці показуються live-ціни з урахуванням мультиплікаторів.

### CRM

**Автоматичне тегування** клієнтів у `client_master_relations.tags`:

| Тег | Умова |
|-----|-------|
| Новий | 1 візит |
| Постійний | 3–9 візитів |
| VIP | ручно або top-10% за витратами |
| Великий чек | average_check > медіана ×1.5 |
| 💤 Спить | last_visit > 60 днів |
| ⚠️ Під ризиком | last_visit > 120 днів (churn prediction) |

**ClientDetailSheet** (`src/components/master/clients/ClientDetailSheet.tsx`):
- Статистика: кількість візитів, витрати, середній чек
- VIP-тогл
- Нотатки (save в `client_master_relations.notes`)
- Теги-чипи

**Тригер CRM-метрик** (PostgreSQL): при `status → 'completed'` автоматично оновлює `client_master_relations` — `total_visits`, `total_spent`, `average_check`, `last_visit_at`.

### Аналітика (Pro)

**AnalyticsPage** (`src/components/master/analytics/AnalyticsPage.tsx`):
- Виручка по місяцях (bar chart, date-fns locale uk)
- Топ послуги за кількістю та виручкою
- Топ продукти (якщо є товари)
- Топ клієнти за витратами
- Retention: new vs returning клієнти (когортний аналіз)
- **CSV-експорт** (Pro-only): всі записи за обраний діапазон дат
- staleTime: 5 хвилин (TanStack Query)

### Flash Deals

**FlashDealPage** (`src/components/master/flash/FlashDealPage.tsx`):
- Знижка 5–70%, TTL 2/4/8 годин
- При публікації: Push + Telegram-розсилка всім клієнтам з `completed` бронюваннями
- `flash_deals.status`: `active` → `expired` (по TTL) або `booked` (якщо забронювали)
- Ліміт: Starter 2/місяць, Pro/Studio без обмежень
- Server Action `cancelFlashDeal()` → `createAdminClient()` (RLS bypass)

### Програма Лояльності

**LoyaltyPage** (`src/components/master/dashboard/` + `/loyalty/`):
- Майстер налаштовує: N-й візит → тип нагороди (знижка % / фіксована сума / безкоштовна послуга)
- Прогрес показується клієнту в `/my/loyalty` та у BookingFlow
- Таблиця `loyalty_programs`: `master_id`, `visits_required`, `reward_type`, `reward_value`

### Портфоліо

- Фото з підписами (`portfolio_items`)
- Drag-to-reorder (оновлення `position`)
- Ліміт: Starter 9 фото, Pro/Studio необмежено
- Зображення в Supabase Storage, оптимізовані через Next.js `<Image>`

### Studio Режим

**StudioPage** (`src/components/master/studio/StudioPage.tsx`):
- Один майстер — Studio Owner — запрошує інших через токен
- `studio/join/[token]` — майстер приймає запрошення
- Всі майстри студії доступні під одним брендом (slug власника)
- Таблиці: `studios`, `studio_members`

### Сповіщення

**NotificationsBell** (`src/components/master/dashboard/NotificationsBell.tsx`):
- `useNotifications` hook: `lastSeen` в localStorage, realtime invalidation
- Лічильник непрочитаних → realtime оновлення через Supabase Realtime
- staleTime: 30 секунд

**Telegram Push при новому записі:**
- Майстер зв'язує бізнес-Telegram у налаштуваннях (`master_profiles.telegram_chat_id`)
- При кожному новому бронюванні → `buildBookingMessage()` → `sendTelegramMessage()`

### Реферальна Система

**ReferralPage** (`src/components/master/referral/ReferralPage.tsx`):
- Майстер генерує `invite_code` через `crypto.getRandomValues()`
- Шерить: `bookit.com.ua/invite/[code]`
- За кожного зареєстрованого через код: 30 днів Pro
- Ambassador levels: 3 запрошених → рівень 1, 5 → рівень 2

### Налаштування

**Settings** (`/dashboard/settings`):
- Робочі години: `working_hours` jsonb (по днях тижня, `{ start, end, enabled }`)
- **VacationManager** (`src/components/master/settings/VacationManager.tsx`): блокування дат через calendar picker → `schedule_exceptions`
- Telegram chat_id (зберігається в `master_profiles`, НЕ в `profiles`)
- Профіль та публікація сторінки

---

## 3. Ключовий Функціонал — Для Клієнта

### BookingFlow

**BookingWizard** (`src/components/shared/BookingWizard.tsx`):

```
Крок 1: Вибір послуг (single або multi-service checkboxes)
  → totalDuration = сума тривалостей
  → totalPrice з dynamic pricing (live-розрахунок)
Крок 2: Додавання товарів-кошик (якщо майстер має products)
Крок 3: Вибір дати (date strip, blocked dates з schedule_exceptions)
Крок 4: Вибір часу (Smart Slots генерація)
Крок 5: Підтвердження + нотатка
Крок 6: SMS OTP для гостей (якщо не авторизований)
```

- Якщо клієнт авторизований — одразу booking, без OTP
- Після OTP: `api/auth/link-booking` — прив'язати booking до щойно-авторизованого юзера
- Показ прогресу лояльності: "ще N візитів до нагороди"

### Публічна Сторінка Майстра

**PublicMasterPage** (`src/components/public/PublicMasterPage.tsx`):
- Послуги з live dynamic pricing (мультиплікатори залежно від поточного часу)
- Портфоліо фото (grid, lightbox)
- Відгуки з рейтингом
- Working hours badge (зараз відкрито / наступний прийом)
- Share buttons: Web Share API + QR-код (download)
- Flash-акції: якщо є активні — відображаються зверху з countdown таймером

### My Area (`/my/`)

**MyBookingsPage** (`src/components/client/MyBookingsPage.tsx`):
- Список майбутніх та минулих записів
- Скасування (з підтвердженням)
- Повторний запис (кнопка "Записатись знову")

**MyBottomNav** (`src/components/client/MyBottomNav.tsx`):
- Записи / Майстри / Лояльність / Профіль
- `env(safe-area-inset-bottom)` для iPhone notch

**MyLoyaltyPage** (`src/components/client/MyLoyaltyPage.tsx`):
- Прогрес по кожному майстру
- Активні нагороди та умови отримання

### Push-сповіщення та Нагадування

| Канал | Подія |
|-------|-------|
| Web Push | Нагадування за 24г та 1г до запису |
| Telegram | Нагадування за 24г (якщо є `profiles.telegram_chat_id`) |
| SMS (fallback) | Нагадування за 24г якщо нема Push-підписки |
| Push | Після візиту (+2г): запит відгуку |

### Cron Rebooking

`/api/cron/rebooking` (щодня 10:00 UTC):
- Знаходить `completed` записи N-X днів тому (де N = середній інтервал клієнта)
- Надсилає Push-нагадування: "Час знову до [ім'я майстра]?"
- Таблиця `rebooking_reminders` — щоб не дублювати

---

## 4. Технічний Стек та Архітектура

```
Frontend:   Next.js 16 (App Router, Turbopack) · TypeScript strict · Tailwind CSS v4
UX/Motion:  Framer Motion · Lucide React · Radix-based primitives
Forms:      React Hook Form + Zod (схеми валідації окремо від компонентів)
State:      TanStack Query v5 (staleTime per hook) · Zustand (локальний UI-стан)
Backend:    Supabase (PostgreSQL + RLS + Realtime + Storage + Edge Functions)
Auth:       SMS OTP → virtual email → Supabase magiclink token (пароль НІКОЛИ не в response)
Payments:   WayForPay (HMAC-MD5 підпис) · Monobank (Ed25519 підпис)
Push:       Web Push API (VAPID) · TurboSMS (SMS fallback)
Telegram:   Bot API (HTML parse_mode, escHtml() обов'язково)
Deploy:     Vercel (Edge Runtime) · Vercel Cron Jobs · Supabase Cloud
PWA:        Service Worker (Cache-First / Network-First / Network-Only per route type)
```

### Структура Проєкту

```
src/
├── proxy.ts                           — захист маршрутів (Next.js 16: proxy.ts + export function proxy)
├── app/
│   ├── (auth)/login, register/        — вхід / реєстрація
│   ├── (master)/
│   │   ├── layout.tsx                 — server-side auth check для майстра
│   │   └── dashboard/
│   │       ├── page.tsx               — головна (StatsStrip, TodaySchedule, NotificationsBell)
│   │       ├── bookings/              — список записів + пошук + CSV export (Pro)
│   │       ├── services/              — послуги + товари (CRUD, reorder)
│   │       ├── clients/               — CRM: ClientDetailSheet, теги, VIP
│   │       ├── analytics/             — аналітика Pro (charts, retention, когорти)
│   │       ├── flash/                 — flash-акції
│   │       ├── pricing/               — dynamic pricing rules
│   │       ├── billing/               — підписки (WayForPay + Monobank)
│   │       ├── settings/              — working hours, VacationManager, Telegram
│   │       ├── reviews/               — відгуки клієнтів
│   │       ├── portfolio/             — фото портфоліо (drag-reorder)
│   │       ├── referral/              — реферальна програма
│   │       ├── loyalty/               — програма лояльності
│   │       └── studio/                — Studio-тариф (мультимайстер)
│   ├── [slug]/page.tsx                — публічна сторінка майстра (Server Component)
│   ├── my/
│   │   ├── layout.tsx                 — client area layout + MyBottomNav
│   │   ├── bookings/                  — мої записи
│   │   ├── profile/                   — мій профіль (зміна телефону, аватар)
│   │   ├── masters/                   — мої майстри
│   │   └── loyalty/                   — моя лояльність
│   ├── explore/                       — каталог майстрів
│   ├── invite/[code]/                 — реферальний лендінг
│   ├── studio/join/                   — приєднання до студії за токеном
│   ├── onboarding/                    — онбординг нового майстра
│   ├── offline/                       — PWA offline page
│   ├── auth/callback/                 — OAuth callback
│   └── api/
│       ├── auth/send-sms/             — відправка OTP (rate-limit)
│       ├── auth/verify-sms/           — верифікація OTP → magiclink token
│       ├── auth/link-booking/         — прив'язка booking після SMS auth
│       ├── billing/webhook/           — WayForPay (HMAC-MD5)
│       ├── billing/mono-webhook/      — Monobank (Ed25519)
│       ├── cron/reminders/            — нагадування за 24г
│       ├── cron/reset-monthly/        — скидання лічильників
│       ├── cron/rebooking/            — smart rebooking suggestions
│       └── push/subscribe/            — CRUD push підписок
├── components/
│   ├── auth/                          — LoginForm, PhoneOtpForm, RegisterForm
│   ├── master/                        — всі компоненти дашборду майстра
│   ├── public/                        — BookingFlow, PublicMasterPage, ExplorePage
│   ├── client/                        — MyBookingsPage, MyLoyaltyPage, MyBottomNav
│   ├── landing/                       — Hero, Features, Pricing, FooterCTA
│   ├── shared/                        — BookingWizard, BlobBackground, InstallBanner
│   └── ui/                            — Button, Card, Input, Badge, BottomSheet
├── lib/
│   ├── supabase/
│   │   ├── admin.ts                   — ЄДИНИЙ admin client (service_role_key тут і тільки тут)
│   │   ├── client.ts                  — singleton browser client
│   │   ├── server.ts                  — SSR client (cookies)
│   │   ├── context.tsx                — SupabaseProvider
│   │   └── hooks/                     — useBookings, useServices, useNotifications, etc.
│   ├── telegram.ts                    — sendTelegramMessage, buildBookingMessage, escHtml
│   ├── push.ts                        — broadcastPush(subscriptions[], payload)
│   ├── utils/
│   │   ├── dates.ts                   — formatDate, formatDateFull, timeAgo, pluralize, ...
│   │   ├── dynamicPricing.ts          — calculateDynamicPrice
│   │   ├── smartSlots.ts              — generateSlots
│   │   └── cn.ts                      — clsx + tailwind-merge
│   └── constants/                     — categories, themes
├── types/database.ts                  — авто-генеровані типи Supabase
└── middleware.ts                      — ЗАСТАРІЛИЙ, Next.js 16 ігнорує (використовується proxy.ts)
```

---

## 5. Схема Бази Даних

### Identity

| Таблиця | Ключові колонки | Мета |
|---------|----------------|------|
| `profiles` | `id` (FK auth.users), `full_name`, `phone`, `role`, `telegram_chat_id` | Базовий профіль всіх користувачів |
| `master_profiles` | `id`, `slug`, `subscription_tier`, `pricing_rules` (jsonb), `working_hours` (jsonb), `telegram_chat_id` | Бізнес-профіль майстра |
| `client_master_relations` | `(client_id, master_id)` PK, `total_visits`, `total_spent`, `average_check`, `last_visit_at`, `is_vip`, `tags[]` | CRM-зв'язок клієнт↔майстер |

> **Важливо:** `profiles.telegram_chat_id` — клієнтський Telegram (нагадування). `master_profiles.telegram_chat_id` — бізнес Telegram майстра (нові записи). Сторінка налаштувань зберігає у `master_profiles`.

### Catalog

| Таблиця | Ключові колонки | Мета |
|---------|----------------|------|
| `services` | `master_id`, `name`, `duration` (хв), `price` (копійки), `category`, `position`, `is_active` | Послуги майстра |
| `products` | `master_id`, `name`, `price`, `stock`, `is_active` | Товари для продажу |
| `product_service_links` | `product_id`, `service_id` | Рекомендовані товари до послуги |
| `service_categories` | `master_id`, `name`, `position` | Категорії послуг (custom) |

### Schedule

| Таблиця | Ключові колонки | Мета |
|---------|----------------|------|
| `schedule_templates` | `master_id`, `day_of_week`, `start_time`, `end_time`, `is_enabled` | Шаблон робочих годин (резерв) |
| `schedule_exceptions` | `master_id`, `date`, `type` ('vacation'/'blocked') | Заблоковані дати (відпустки) |

> `working_hours` jsonb в `master_profiles` — основний спосіб зберігання розкладу: `{ mon: { start: "09:00", end: "18:00", enabled: true }, ... }`

### Bookings

| Таблиця | Ключові колонки | Мета |
|---------|----------------|------|
| `bookings` | `master_id`, `client_id`, `service_id`, `status`, `slot_date`, `slot_time`, `total_duration`, `total_price`, `source` | Основна таблиця записів |
| `booking_services` | `booking_id`, `service_id`, `duration`, `price` | Деталізація послуг у multi-service |
| `booking_products` | `booking_id`, `product_id`, `quantity`, `product_price` | Товари в записі (ціна на момент запису) |

### Marketing

| Таблиця | Ключові колонки | Мета |
|---------|----------------|------|
| `loyalty_programs` | `master_id`, `visits_required`, `reward_type`, `reward_value`, `is_active` | Програми лояльності майстра |
| `flash_deals` | `master_id`, `service_name`, `slot_date`, `slot_time`, `original_price`, `discount_pct`, `expires_at`, `status` | Flash-акції з TTL |
| `referrals` | `client_id`, `invite_code` UNIQUE, `master_id`, `status` | Реферальні запрошення |
| `referral_bonuses` | `referrer_id`, `referred_id`, `bonus_days`, `applied_at` | Нараховані бонуси |

### Studio

| Таблиця | Ключові колонки | Мета |
|---------|----------------|------|
| `studios` | `owner_id`, `name`, `slug`, `invite_token` | Студія (мультимайстер) |
| `studio_members` | `studio_id`, `master_id`, `joined_at` | Учасники студії |

### Portfolio & Reviews

| Таблиця | Ключові колонки | Мета |
|---------|----------------|------|
| `portfolio_items` | `master_id`, `image_url`, `caption`, `position` | Фото портфоліо з drag-reorder |
| `reviews` | `booking_id` UNIQUE, `master_id`, `client_id`, `rating` (1–5), `comment` | Відгуки (1 на запис) |

### Payments

| Таблиця | Ключові колонки | Мета |
|---------|----------------|------|
| `payments` | `master_id`, `amount`, `provider` ('wayforpay'/'monobank'), `status`, `order_ref` | Транзакції |
| `subscriptions` | `master_id`, `tier`, `expires_at`, `provider` | Активні підписки |

### Notifications

| Таблиця | Ключові колонки | Мета |
|---------|----------------|------|
| `notifications` | `user_id`, `type`, `title`, `body`, `is_read` | In-app сповіщення |
| `push_subscriptions` | `user_id`, `endpoint` UNIQUE, `subscription` (JSON) | Web Push підписки (VAPID) |

### Security

| Таблиця | Ключові колонки | Мета |
|---------|----------------|------|
| `sms_otps` | `phone`, `code`, `used`, `created_at` | SMS OTP коди (TTL 10 хв) |
| `sms_verify_attempts` | `phone`, `created_at` | Rate-limit верифікацій (10/15 хв) |
| `sms_ip_logs` | `ip`, `phone`, `created_at` | Rate-limit відправки (10/год по IP) |

### Rebooking

| Таблиця | Ключові колонки | Мета |
|---------|----------------|------|
| `rebooking_reminders` | `booking_id`, `sent_at` | Дедуплікація rebooking push-сповіщень |

---

## 6. Стандарти Коду та Engineering Principles

### Supabase Client Isolation

```typescript
// ЗАВЖДИ — єдиний singleton browser client:
import { createClient } from '@/lib/supabase/client';
// client.ts кешує після першого виклику, ніколи не re-creates

// ЗАВЖДИ — admin client тільки в API routes / server actions:
import { createAdminClient } from '@/lib/supabase/admin';
const admin = createAdminClient();

// НІКОЛИ — inline admin:
// const admin = createClient(process.env.URL!, process.env.SERVICE_ROLE_KEY!)  ← ЗАБОРОНЕНО
```

`src/lib/supabase/admin.ts` — єдине місце з `service_role_key`. Використовується скрізь де потрібен bypass RLS: server actions, API webhooks, cron routes.

### React Query Conventions

| Hook / Дані | staleTime |
|-------------|----------|
| Dashboard stats | 1 хвилина |
| Analytics | 5 хвилин |
| Services / Products | 10 хвилин |
| Notifications | 30 секунд |
| Bookings list | 2 хвилини |

- Placeholder data в кожному hook — запобігає flicker при гідратації
- Invalidation: конкретні `queryKey` масиви (`['bookings', masterId]`), ніколи `invalidateQueries()` без аргументів
- `safeQuery` / `safeMutation` wrapper — уніформна обробка помилок, запобігає silent failures

### Date & Locale

```typescript
// ЗАВЖДИ так:
import { format, formatDistanceToNow } from 'date-fns';
import { uk } from 'date-fns/locale';

// Утиліти в src/lib/utils/dates.ts:
formatDate(date)          // "21 берез."
formatDateFull(date)      // "21 березня 2026"
formatDayFull(date)       // "субота, 21 березня"
timeAgo(date)             // "3 год. тому"
pluralize(n, forms)       // "1 запис / 2 записи / 5 записів"
formatDurationFull(mins)  // "1 год. 30 хв."
```

**ЗАБОРОНЕНО:** хардкод масиви місяців/днів (`['Січень','Лютий',...]`), ternary плюралізація (`n === 1 ? 'запис' : 'записи'`).

### Security Rules

```
SMS OTP:    atomic RPC check_and_log_sms_attempt() з advisory lock → race-condition bypass неможливий
Webhooks:   WayForPay HMAC-MD5 + Monobank Ed25519 — перевірка підпису ОБОВ'ЯЗКОВА
Cron:       Authorization: Bearer {CRON_SECRET} — без виключень, на першому рядку хендлера
Telegram:   escHtml() на всіх user-supplied strings → захист від HTML injection
Codes:      crypto.getRandomValues() для referral/invite/OTP — Math.random() ЗАБОРОНЕНО
RLS:        всі таблиці захищені; тригери що пишуть в захищені таблиці → SECURITY DEFINER
```

### TypeScript Conventions

```typescript
// Strict mode — no any
// Supabase builder arrays БЕЗ анотації:
const ops = [
  supabase.from('bookings').update(...),
  supabase.from('client_master_relations').upsert(...),
];
await Promise.all(ops);  // НЕ Promise<unknown>[]

// Server Components за замовчуванням
// "use client" — тільки для компонентів з useState/useEffect/handlers
```

---

## 7. API Endpoints

### Auth

| Метод | Endpoint | Призначення | Auth |
|-------|----------|-------------|------|
| POST | `/api/auth/send-sms` | Відправити OTP (rate-limit: 3/15хв по phone, 10/год по IP) | Public |
| POST | `/api/auth/verify-sms` | Перевірити OTP → повертає `{ email, token, isNew }` (magiclink) | Public |
| POST | `/api/auth/link-booking` | Прив'язати pending booking після SMS auth | Anon+token |

**SMS OTP Flow:**
```
POST /api/auth/send-sms  ← { phone: "380XXXXXXXXX" }
  → rate-limit check (sms_ip_logs + sms_otps)
  → 4-значний код через crypto.getRandomValues()
  → INSERT sms_otps (TTL 10 хв)
  → TurboSMS API

POST /api/auth/verify-sms  ← { phone, code }
  → atomic check_and_log_sms_attempt() RPC
  → перевірка created_at > now() - interval '10 minutes'
  → admin.generateLink({ type: 'magiclink', email: virtualEmail })
  → { email, token, isNew }   ← НІКОЛИ пароль не повертається!

Client:
  → supabase.auth.verifyOtp({ email, token, type: 'magiclink' })
  → Сесія встановлена

virtualEmail = phone.replace('+','') + '@bookit.app'
```

### Push

| Метод | Endpoint | Призначення | Auth |
|-------|----------|-------------|------|
| POST | `/api/push/subscribe` | Зберегти Web Push підписку | Authenticated |
| DELETE | `/api/push/subscribe` | Видалити підписку | Authenticated |

### Billing

| Метод | Endpoint | Призначення | Верифікація |
|-------|----------|-------------|-------------|
| POST | `/api/billing/webhook` | WayForPay: `transactionStatus === 'Approved'` → продовжити підписку | HMAC-MD5 |
| POST | `/api/billing/mono-webhook` | Monobank: `status === 'success'` → продовжити підписку | Ed25519 |

**WayForPay:** `orderRef` формат `sub_{masterId}_{timestamp}`. Підписка +31 день.
**Monobank:** `reference` формат `bookit_{tier}_{uid32}_{timestamp}`. Pubkey кешується. Без double-extend.
Обидва використовують `createAdminClient()` (не anon client!).

### Cron (обов'язковий `Authorization: Bearer CRON_SECRET`)

| Метод | Endpoint | Розклад | Дія |
|-------|----------|---------|-----|
| GET | `/api/cron/reminders` | `0 7 * * *` UTC | Push + SMS нагадування на завтра |
| GET | `/api/cron/reset-monthly` | `5 0 1 * *` | Скинути `bookings_this_month`, downgrade прострочені підписки |
| GET | `/api/cron/rebooking` | `0 10 * * *` | Smart rebooking push для клієнтів |

---

## 8. Маршрутизація та Захист

### proxy.ts (Next.js 16)

> **Next.js 16** deprecated `middleware.ts` → замінено на `src/proxy.ts` з `export function proxy`.
> Файл `src/middleware.ts` — ЗАСТАРІЛИЙ, Next.js 16 його ігнорує.

**Файл:** `src/proxy.ts`
**Export:** `export async function proxy(request: NextRequest)`

```typescript
// /dashboard → тільки майстри
if (pathname.startsWith('/dashboard') && role !== 'master')
  → redirect('/my/bookings')

// /my → клієнти (майстри з cookie view_mode=client — дозволено)
if (pathname.startsWith('/my') && role === 'master' && !viewMode)
  → redirect('/dashboard')

// Guest-only сторінки → редирект якщо авторизований
if (['/login', '/register'].includes(pathname) && user)
  → redirect(role === 'master' ? '/dashboard' : '/my/bookings')

// Захищені маршрути для анонімних
if (!user && (pathname startsWith /dashboard|/my|/onboarding))
  → redirect('/login')
```

### Таблиця Маршрутів

| Шлях | Рендер | Захист |
|------|--------|--------|
| `/` | Server | Guest (редирект якщо auth) |
| `/[slug]` | Server | Public |
| `/explore` | Server | Public |
| `/login`, `/register` | Client | Guest only |
| `/invite/[code]` | Server | Public |
| `/onboarding` | Client | Auth |
| `/dashboard/**` | Server+Client | Master only |
| `/my/**` | Client | Auth (client або master+cookie) |
| `/studio/join` | Client | Auth |
| `/offline` | Static | Public (PWA fallback) |

---

## 9. Дизайн-система

### Палітра

| Токен | Hex | Використання |
|-------|-----|-------------|
| Background | `#FFE8DC` | Основний фон (персик/salmon) |
| Accent | `#789A99` | Кнопки, акценти, лінки (шавлія/sage teal) |
| Text Primary | `#2C1A14` | Заголовки, основний текст |
| Text Secondary | `#6B5750` | Підписи, допоміжний текст |
| Text Tertiary | `#A8928D` | Плейсхолдери, disabled |
| Surface | `rgba(255, 255, 255, 0.68)` | Mica-ефект карток (backdrop-blur) |
| Success | `#5C9E7A` | Підтверджено, оплачено |
| Warning | `#D4935A` | Pending, попередження |
| Error | `#C05B5B` | Помилки, скасовано |

### Типографіка

- **Body:** Inter з кириличним subset (`font-sans`)
- **Display/Heading:** Playfair Display з кириличним subset (`font-display`)

| CSS клас | Застосування |
|----------|-------------|
| `.display-xl` | Hero заголовки |
| `.display-lg` | Заголовки секцій |
| `.display-md` | Картки, модалки |
| `.heading-serif` | Акцентні підзаголовки |
| `.font-display` | Будь-який serif елемент |

### Компоненти

- **Card radius:** 24px | **Button radius:** 16px | **Input radius:** 12px
- **`.bento-card`** — `backdrop-blur`, Mica-ефект, `border: 1px solid rgba(255,255,255,0.4)`, `box-shadow`
- **Blob background** — peach + sage + cream градієнтні blobs, `z-index: -1`
- **Grain overlay** — `position: fixed`, `z-index: 9999`, `opacity: 0.03` — analog texture
- Всі анімації — `will-change: transform` (GPU layer)

### Tailwind CSS v4

```css
/* globals.css — НЕ @tailwind base/components/utilities */
@import "tailwindcss";

@theme {
  --color-peach: #FFE8DC;
  --color-sage: #789A99;
  /* ... */
}
```

Немає `tailwind.config.ts` — конфігурація виключно через `@theme {}` в CSS.

### Mood Themes

`classic` | `dark` | `rose-gold` | `mint` — зберігається в `master_profiles.theme`.
Застосовується через CSS data-attribute на `<html>` елементі.

### Mobile-First

- Safe-area insets: `env(safe-area-inset-bottom)` у `MyBottomNav`
- BottomSheet замість модалок на мобільних
- Touch targets мінімум 44×44px
- No hover-only interactions

---

## 10. PWA та Offline

### Web App Manifest

```json
{
  "name": "Bookit — Онлайн запис",
  "short_name": "Bookit",
  "display": "standalone",
  "background_color": "#FFE8DC",
  "theme_color": "#789A99",
  "orientation": "portrait",
  "shortcuts": [
    { "name": "Мої записи", "url": "/my/bookings" },
    { "name": "Панель", "url": "/dashboard" }
  ]
}
```

Іконки: `192×192` та `512×512` (PNG + maskable).

### Service Worker Стратегії

| Тип ресурсу | Стратегія | Деталі |
|------------|----------|--------|
| Статичні файли (JS, CSS, шрифти) | **Cache First** | Кеш → мережа (fallback) |
| Публічні сторінки (`/[slug]`, `/explore`) | **Cache First** | 24г TTL |
| Dashboard та `/my/` | **Network First** | Мережа → кеш (якщо offline) |
| API Supabase | **Network Only** | Ніколи не кешувати |
| Offline fallback | `/offline` | При повній відсутності мережі |

### Push Notifications

```javascript
// Service Worker:
self.addEventListener('push', (event) => {
  const { title, body, url, bookingId } = event.data.json();
  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon: '/icons/icon-192.png',
      data: { url, bookingId }
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(clients.openWindow(event.notification.data.url));
});
```

**VAPID ключі:** `NEXT_PUBLIC_VAPID_KEY` (public) + `VAPID_PRIVATE_KEY` (server).
Підписки зберігаються в `push_subscriptions` (upsert by endpoint).

---

## 11. Безпека та Аудит

### Закриті Вразливості

| # | Категорія | Вразливість | Виправлення |
|---|-----------|-------------|-------------|
| 1 | **CRITICAL** | OTP brute-force: необмежені спроби верифікації | `sms_verify_attempts` table, 10 спроб/15 хв, atomic advisory lock |
| 2 | **CRITICAL** | Витік service role key: `/api/auth/verify-sms` повертав пароль у відповіді | Magiclink token flow — пароль НІКОЛИ не в response |
| 3 | **CRITICAL** | Route protection bypass: `middleware.ts` ігнорувався Next.js 16 | `src/proxy.ts` + `export function proxy` |
| 4 | **HIGH** | Webhook spoofing WayForPay: без перевірки підпису | HMAC-MD5 верифікація обов'язкова |
| 5 | **HIGH** | Webhook spoofing Monobank: без перевірки підпису | Ed25519 верифікація через офіційний pubkey |
| 6 | **HIGH** | Admin client exposure: `createClient(url, serviceRoleKey)` у 10+ компонентах | Уніфіковано: `createAdminClient()` тільки з `@/lib/supabase/admin` |
| 7 | **HIGH** | WayForPay webhook тихо падав: anon client не мав RLS bypass | `createAdminClient()` у webhook |
| 8 | **HIGH** | Cron endpoints без auth: будь-хто міг тригерити | `Authorization: Bearer CRON_SECRET` — обов'язково, без виключень |
| 9 | **MEDIUM** | HTML injection в Telegram: user strings в HTML parse_mode | `escHtml()` на всіх user-supplied strings |
| 10 | **MEDIUM** | Слабкий генератор кодів: `Math.random()` для referral/invite | `crypto.getRandomValues()` |
| 11 | **MEDIUM** | Missing ownership check: `updateStatus` без `.eq('master_id', masterId)` | Додано `.eq('master_id', masterId!)` |
| 12 | **MEDIUM** | Review spoofing: `submitReview` приймав `master_id` від клієнта | `master_id` читається з БД за `booking_id` |
| 13 | **LOW** | Debug logs: `console.log` з OTP кодами та user ID в prod | Видалено всі sensitive console.log |

### Поточна Позиція Безпеки

```
Auth:       SMS OTP з atomic rate-limit (advisory lock в PostgreSQL)
Transport:  HTTPS only (Vercel + Supabase)
DB:         RLS на всіх таблицях; SECURITY DEFINER тригери
Webhooks:   Підписи верифікуються до будь-якої дії з БД
Cron:       Bearer token auth — без виключень
Telegram:   HTML escaping обов'язковий через escHtml()
Codes:      Тільки crypto.getRandomValues() — ніякого Math.random()
Admin:      Єдина точка входу admin.ts — service_role_key не розпорошений
```

---

## Чеклист Перед Деплоєм

- [ ] `src/proxy.ts` — `export function proxy` (не middleware!)
- [ ] Всі RLS policies активні в Supabase
- [ ] Міграції 016 (`sms_verify_attempts`) та 017 (`master_profiles.telegram_chat_id`) застосовані
- [ ] Ліміти Starter: 30 записів/місяць, 2 flash-акції/місяць, 9 фото портфоліо
- [ ] WayForPay + Monobank webhooks верифікують підпис
- [ ] `CRON_SECRET` в env, всі cron routes перевіряють `Authorization: Bearer`
- [ ] `VAPID_PRIVATE_KEY` + `NEXT_PUBLIC_VAPID_KEY` в env
- [ ] `createAdminClient()` скрізь де потрібен RLS bypass — нема inline admin
- [ ] Жодного `console.log` з OTP, user ID, або токенами
- [ ] PWA manifest валідний, іконки `192×192` та `512×512` присутні
- [ ] SEO мета-теги на `/[slug]` та `/explore`
- [ ] Lighthouse score > 90 (Performance, Accessibility)
- [ ] Service Worker зареєстрований та стратегії перевірені
- [ ] Error boundaries на всіх client компонентах з async операціями
