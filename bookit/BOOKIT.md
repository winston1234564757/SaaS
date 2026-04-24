# Bookit — Еталонна Технічна Документація

> **Ukrainian SaaS для онлайн-запису у б'юті-індустрії**
> "Твій розумний link in bio, який заробляє гроші"
> *Оновлено: 17.04.2026 · Версія: 4.0 (26+ ітерації)*

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
| **Starter** | 0₴ | 30 записів/місяць, 2 flash-акції/місяць, вотермарка, 9 фото, dynamic pricing trial до 1000 UAH |
| **Pro** | 700₴/місяць | Необмежено записів, повна аналітика, CRM, CSV, Telegram, без вотермарки, dynamic pricing |
| **Studio** | 299₴/майстер/місяць | Мультимайстер, спільний бренд, invite-flow, all Pro per master |

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
│   │   ├── client.ts                  — singleton browser client (pwaDummyLock, resetFetchController, autoRefreshToken:false)
│   │   ├── server.ts                  — SSR client (cookies)
│   │   ├── context.tsx                — MasterProvider / MasterContext (user, profile, masterProfile, isLoading)
│   │   └── hooks/                     — useBookings, useServices, useNotifications, useTimeOff, useWizardSchedule, etc.
│   ├── providers/
│   │   └── QueryProvider.tsx          — TanStack Query client + useSessionWakeup + useDeepSleepWakeup
│   ├── hooks/
│   │   ├── useSessionWakeup.ts        — visibility change → resetFetchController → invalidateQueries
│   │   └── useDeepSleepWakeup.ts      — JS freeze detection → onlineManager + invalidateQueries
│   ├── telegram.ts                    — sendTelegramMessage, buildBookingMessage, escHtml
│   ├── push.ts                        — broadcastPush(subscriptions[], payload)
│   ├── utils/
│   │   ├── dates.ts                   — formatDate, formatDateFull, timeAgo, formatDurationFull, ...
│   │   ├── pluralUk.ts                — pluralUk(n, one, few, many) — ЄДИНИЙ plural helper (не ternary!)
│   │   ├── dynamicPricing.ts          — calculateDynamicPrice, stackRules (DISCOUNT_FLOOR=-30, MARKUP_CEIL=50)
│   │   ├── smartSlots.ts              — generateAvailableSlots, scoreSlots, buildSlotRenderItems
│   │   └── cn.ts                      — clsx + tailwind-merge
│   └── constants/                     — categories, themes
└── types/database.ts                  — авто-генеровані типи Supabase
```

---

## 5. Схема Бази Даних

### Identity

| Таблиця | Ключові колонки | Мета |
|---------|----------------|------|
| `profiles` | `id` (FK auth.users), `full_name`, `phone`, `role`, `telegram_chat_id` | Базовий профіль всіх користувачів |
| `master_profiles` | `id`, `slug`, `subscription_tier`, `pricing_rules` (jsonb), `working_hours` (jsonb), `telegram_chat_id`, `dynamic_pricing_extra_earned` | Бізнес-профіль майстра |
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
| `schedule_exceptions` | `master_id`, `date`, `type` ('vacation'/'blocked') | Старі заблоковані дати (legacy) |
| `master_time_off` | `master_id`, `date`, `type` ('vacation'/'day_off'/'short_day'), `end_time` | Вихідні, відпустки, короткі дні (migration 051) |

> `working_hours` jsonb в `master_profiles` — основний розклад: `{ mon: { start: "09:00", end: "18:00", enabled: true }, ... }`. `master_time_off` є headless override для конкретних дат — підтримується в SmartSlots та BookingWizard.

### Bookings

| Таблиця | Ключові колонки | Мета |
|---------|----------------|------|
| `bookings` | `master_id`, `client_id`, `service_id`, `status`, `slot_date`, `slot_time`, `total_duration`, `total_price`, `source`, `dynamic_pricing_label`, `dynamic_extra_kopecks` | Основна таблиця записів |
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
| `notifications` | `recipient_id` (= profiles.id), `type`, `title`, `body`, `is_read`, `related_booking_id`, `related_master_id` | In-app сповіщення (DB-тригери при INSERT/UPDATE bookings) |
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

### Supabase Browser Client — PWA Wakeup Architecture

**Проблема:** після переходу між вкладками (будь-який інтервал) — нескінченні скелетони.

**Причина:** `_recoverAndRefresh()` (Supabase) тримає `lockAcquired=true` і викликає `_notifyAllSubscribers`. Якщо `onAuthStateChange` callback викликав `await fetchProfile()` → `getSession()` → `_acquireLock` → **циклічний deadlock**.

**Рішення:**
```typescript
// context.tsx: НІКОЛИ await fetchProfile() всередині onAuthStateChange callback
// setTimeout(0) переносить в наступний macrotask — ПІСЛЯ lockAcquired=false
setTimeout(() => { if (mountedRef.current) fetchProfile(u.id); }, 0);
```

**Додаткові заходи в `client.ts`:**
- `pwaDummyLock` — обходить Web Locks API (не блокує `_acquireLock`)
- `autoRefreshToken: false` — вимикає фоновий timer refresh (усуває timer-triggered deadlock)
- `resetFetchController()` — global `AbortController` kill switch для in-flight запитів
- Custom fetch: timeout 8s (auth) / 10s (інші) + глобальний abort signal

**Wakeup hooks:**
- `useSessionWakeup` — visibility change → `resetFetchController` → 500ms → `invalidateQueries`
- `useDeepSleepWakeup` — JS freeze detection (setInterval drift) → `onlineManager` + `invalidateQueries`

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
formatDate(date)                    // "21 берез."
formatDateFull(date)                // "21 березня 2026"
formatDayFull(date)                 // "субота, 21 березня"
timeAgo(date)                       // "3 год. тому"
formatDurationFull(mins)            // "1 год. 30 хв."

// src/lib/utils/pluralUk.ts — ЄДИНИЙ plural helper:
pluralUk(n, 'запис', 'записи', 'записів')  // "1 запис / 2 записи / 5 записів"
```

**ЗАБОРОНЕНО:** хардкод масиви місяців/днів (`['Січень','Лютий',...]`), ternary плюралізація (`n === 1 ? 'запис' : 'записи'`), або `pluralize()` — тільки `pluralUk()`.

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
| Статичні файли `/_next/static/` | **Cache First** | Кеш → мережа (fallback) |
| Зображення та іконки | **Cache First** | `/icons/`, `/images/`, `destination === 'image'` |
| Page navigations (`mode === 'navigate'`) | **Bypass SW** | Browser handles directly (уникає зависань при freeze SW в фоні) |
| API routes `/api/` | **Network Only** | Bypass SW |
| RSC / Next.js data (`_rsc`, `/_next/data/`) | **Network Only** | Bypass SW |
| Cross-origin (Supabase REST/Auth) | **Bypass SW** | Browser handles directly |
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

---

## 12. Журнал Ітерацій (25–28)

### Bugfix: Flash Deal fast-track booking flow & date locale fixes (2026-04-23)

- **Date fix** — `FlashDealCard` деструктурування `[d, mon]` → `[mon, d]`: `split('-').slice(1)` повертає `[MM, DD]`, попередній порядок давав `months[DD]` = `undefined`
- **service_id** — додано до `SELECT` запиту `flash_deals` у `[slug]/page.tsx` та до `FlashDeal` інтерфейсу
- **Fast-track flow** — `BookingFlow` знаходить відповідний сервіс (by `serviceId`, fallback `serviceName`), передає `initialStep='details'` + `initialServices=[flashService]` у `BookingWizard`
- **Pre-fill date/time** — `useBookingWizardState` приймає `initialDate`, `initialTime`, `isFlashFastTrack`; на відкритті wizard: `selectedDate = new Date(slotDate + 'T12:00:00')`, `selectedTime = slotTime`, `go(initialStep)`
- **Back lock** — `goBack()` при `isFlashFastTrack && step === 'details'` закриває wizard замість повернення на datetime (захист від випадкового зміни параметрів акції)

### Ітерація 32 — Bugfixes: Story Generator Export, Time Travel prevention, Fluid Anchor slot logic (2026-04-23)

- **Export fix** — `crossOrigin="anonymous"` на `<img>` аватара всередині canvas; toast.success "Сторі збережено!" / toast.error з реальним повідомленням замість silent fail
- **Time Travel prevention** — якщо `selectedDate === today`, `computeSlots` фільтрує слоти де `startMin <= nowMin`; `todayNowMin` передається з `useAvailableSlots` через `new Date()`
- **Fluid Anchor алгоритм** — `computeSlots` переписаний: замість фіксованого кроку (`t += step`) — цикл `while` що при зіткненні з перервою/бронюванням робить `t = obstacle.end` (snap). Усуває "мертві зони" типу 14:30–15:40 після перерви 13:00–14:30

### Ітерація 31 — Premium SMM Hub: Adaptive Story Generator with Variant B Logic (2026-04-23)

- **Variant B Slot Logic** — `useServices(masterId)` hook: вибирає активні послуги з `services` table (`id, name, duration_minutes, buffer_minutes, emoji`); auto-select першої послуги при завантаженні
- **Service Selector** — обов'язковий для режиму "Вікна": `<select>` з послугами (назва + тривалість); передає `durationMin` у `useAvailableSlots(date, masterId, durationMin)` → реальні слоти для конкретної послуги
- **Adaptive Grid System** — `getGridConfig(count)`: 1–3 слоти → 1 колонка, pillH=58, fontSize=20; 4–8 → 2 колонки, pillH=44, fontSize=15; 9+ → 3 колонки, pillH=36, fontSize=12
- **Vogue Aesthetics** — прибрані всі горизонтальні лінії; дата рендериться через `SERIF = Playfair Display`; підписи через `TRACKED_LABEL` (letterSpacing: 0.22em, uppercase, fontSize: 9px); Instagram link sticker (pill, boxShadow, "🔗 Записатися онлайн")
- **6 преміальних палітр** — Nude, Sage, Mono, Blush, Sky, Dark — кожна з bg/text/muted/pill/pillText/sticker токенами
- **Збережено**: canvasRef stability (ніколи не ремаунтується), scale wrapper trick (360×640 at 0.7 = 252×448), html-to-image pixelRatio:3 → 1080×1920 export, avatar CORS blob, avatar toggle
- **Файл змінено:** `src/components/master/marketing/StoryGenerator.tsx` (повний rewrite v3)

### Ітерація 30 — Onboarding Phase 4: Viral Loop Success Screen (2026-04-23)

- **`StepSuccess`** — повністю перероблений: святкова ConfettiParticles + Sparkles іконка + headline "Твоя студія онлайн!"
- **3 Copy-Paste шаблони** — Stories/Reels, Bio (профіль), Швидка відповідь (Direct/Viber) — кожен з `CopyButton` що анімує Check per-item (незалежні стани через окремий `useState` всередині компонента)
- **Web Share API** — кнопка "Поділитися посиланням" → `navigator.share({ title, text, url })`; fallback → clipboard copy якщо API недоступне
- **"Перейти в Dashboard"** — secondary CTA → `onComplete()` → `/dashboard`
- **Без breaking changes** — інтерфейс `StepSuccessProps` сумісний, `copied`/`onCopyLink` props збережені (ліниво ігноруються — link copy тепер всередині компонента)

### Ітерація 29 — Onboarding Phase 3: Live Preview — The Premium Mirror (2026-04-23)

- **`StepProfilePreview`** — новий крок між `PROFIT_PREDICTOR` і `SUCCESS`: форма для назви кабінету/студії (`businessName`) + реалтаймовий Phone Mockup що реагує на всі дані онбордингу
- **Phone Mockup**: scaled-down (220px) телефонна рамка з темним бортом `#2C1A14`, status bar, динамічно відображає аватар / ім'я / slug / 1–3 картки послуг (derived з `CATEGORY_TEMPLATES`) / Flash Deal badge (AnimatePresence) / рейтингові зірки / CTA-кнопку "Записатись"
- **`saveOnboardingBusinessName`** — нова server action → `master_profiles.business_name`
- **Flow**: PROFIT_PREDICTOR → PROFILE_PREVIEW → SUCCESS (було: PROFIT_PREDICTOR → SUCCESS)
- **`OnboardingData`** — додано `businessName?: string`; `Step` union + `STEP_ORDER` — додано `'PROFILE_PREVIEW'`
- **Файли змінено:** `types/onboarding.ts`, `onboarding/steps/types.ts`, `onboarding/actions.ts`, `OnboardingWizard.tsx`, `StepProfilePreview.tsx` (new)

### Ітерація 28 — Auth State Persistence (Onboarding) (2026-04-22)

- **Migration 080+081**: `profiles.onboarding_step TEXT` + `profiles.onboarding_data JSONB` — CHECK constraint, master-only partial index
- **`saveOnboardingProgress`**: нова server action — fire-and-forget tracker, без revalidatePath
- **`OnboardingPage`** (async SC): читає `onboarding_step`/`onboarding_data` з DB; `SUCCESS` → redirect `/dashboard`
- **`OnboardingWizard`**: `initialStep` + `initialData` props — гідрує всі useState з DB; `buildSnapshot()` + `persistProgress()` після кожного переходу (включно зі skip/back handlers); `handleComplete()` awaits фінальний save
- **Zero data loss**: юзер закрив браузер на `SCHEDULE_FORM` → повертається на `SCHEDULE_FORM` з заповненими полями, аватаром, спеціалізацією

### Ітерація 27 — Enterprise Architecture V2, Phase 1: Public Page Conversion (2026-04-17)

- **Native Map Deep Links** — `app/[slug]/page.tsx` (Server Component) читає `user-agent` через `await headers()`, обчислює `mapUrl` server-side: iOS → Apple Maps, Android → Google Maps app, desktop → web. Нуль client JS.
- **Availability Badge** — `useAvailability(workingHours)` hook в `PublicMasterPage`: real-time open/closed статус з `working_hours` JSONB, оновлення кожну хвилину, no SSR flash.
- **Файли змінено:** `src/app/[slug]/page.tsx`, `src/components/public/PublicMasterPage.tsx`
- **План збережено:** `docs/superpowers/plans/2026-04-17-enterprise-architecture-v2.md`

### Ітерація 25 — iOS Native App Dashboard Redesign (2026-04-14)

- **DashboardHero** — темний хедер `#2C1A14`, stat chips (дохід/записи/клієнти), `NotificationsBell dark prop`
- **ScheduleWidget** — 14-денна горизонтальна смуга дат, iOS-картки бронювань
- **QuickActions** — масивна темна CTA-кнопка + 5-клітинна squircle-сітка швидких дій + revenue rows
- **Dashboard Layout** — 2-col бенто `md:grid-cols-[1fr_360px]` (ScheduleWidget у правій колонці)
- **NotificationsBell** — тип-специфічні іконки, `dark?: boolean` prop

### Ітерація 26 — Dashboard Marketing Hubs + Performance Fix (WIP, 2026-04-17)

**Мета:** Вирішити 4–5s блокування main thread на мобільних при відкритті drawers.

**Архітектурне рішення:**
1. **Ізоляція URL-стану** — `DashboardDrawers` і `RevenueDrawers` — єдині компоненти що слухають `?drawer=` параметр. Зміна URL → тільки ці компоненти ре-рендеряться.
2. **Animation First** — `<HubDrawer>` shell відкривається миттєво (`<100ms`). Важкий контент (`FlashDealForm`, `PricingForm`) монтується через `next/dynamic` + затримку після анімації.
3. **React 18 Transitions** — `startTransition` при кліку на bento-картку → URL update не блокує CSS transform анімацію.
4. **HubDrawer** — адаптивна обгортка: `DashboardDrawer` (side, lg+) або `BottomSheet` (bottom, <lg).

**Нові компоненти:**
- `src/components/master/dashboard/DashboardDrawers.tsx` — ізольований URL-listener для dashboard
- `src/components/master/revenue/RevenueDrawers.tsx` — ізольований URL-listener для Revenue Hub
- `src/components/shared/HubDrawer.tsx` — адаптивна обгортка (вже існувала, рефакторинг)

---

## 12. Agent Sync Changelog

[2026-04-24] - Claude Code: **Billing Engine V2 — Dunning Cron (Phase 2)**. `expire-subscriptions/route.ts` повністю переписано: `export const runtime = 'nodejs'`, `CRON_SECRET` Bearer-auth guard. Використовує RPC `get_pending_subscriptions_for_billing(50)` (FOR UPDATE SKIP LOCKED) для race-condition-safe вибірки батчу. `Promise.allSettled` — паралельна обробка без блокування; кожен виклик `provider.chargeRecurrent()` загорнуто в `withTimeout(8000ms)` — зависання API не крашить весь cron. Dunning flow: **Success** → `master_subscriptions.status='active'`, `failed_attempts=0`, `next_charge_at=+30d`, sync `master_profiles.subscription_expires_at`, `billing_events` INSERT status='success'. **Failure** → `failed_attempts++`; якщо >= 3 → `status='past_due'`, downgrade `master_profiles.subscription_tier='starter'`, `billing_events` INSERT status='failure'. Idempotency key: `recurring_{subscription_id}_{timestamp}`. `vercel.json`: додано cron `0 2 * * *` для `/api/cron/expire-subscriptions`. TypeScript: 0 помилок.

[2026-04-24] - Claude Code: **Billing Engine V2 — Recurring Billing Infrastructure (Phase 1)**. Migration 086: `master_subscriptions` розширено трьома колонками — `status TEXT CHECK ('active','past_due','canceled') DEFAULT 'active'`, `failed_attempts INT DEFAULT 0`, `next_charge_at TIMESTAMPTZ`; partial index `WHERE status='active'` для швидкого cron-запиту. RPC `get_pending_subscriptions_for_billing(batch_size INT)` — `SECURITY DEFINER`, `FOR UPDATE SKIP LOCKED` для race-condition-safe вибірки батчу; REVOKE PUBLIC / GRANT service_role. `PaymentProvider.ts` інтерфейс: нові типи `RecurrentChargeOptions` / `RecurrentChargeResult` + метод `chargeRecurrent()`. `mono-webhook/route.ts`: **видалено soft-mode bypass** — `MONO_ENFORCE_SIG` env var та `console.warn proceeding` повністю прибрані; Ed25519 верифікація строга — 403 при будь-якому збої підпису; `master_subscriptions` upsert тепер включає `status='active'`, `failed_attempts=0`, `next_charge_at=expiresAt`. `wfp-webhook/route.ts`: аналогічно — `next_charge_at` та `status` записуються при першому recToken. TypeScript: 0 помилок.

[2026-04-23] - Claude Code: **Onboarding Phase 4 — Viral Loop Success Screen & Web Share API**. `StepSuccess` rewritten: ConfettiParticles + Sparkles hero, 3 copy-paste template cards (Stories, Bio, Direct) with per-item check animation, Web Share API button with clipboard fallback, secondary "Dashboard" CTA. Each template's `CopyButton` has independent `useState` — no shared copied state. TypeScript: 0 помилок.

[2026-04-23] - Claude Code: **Premium SMM Hub — Adaptive Story Generator v3 (Variant B)**. Full rewrite of `StoryGenerator.tsx`: `useServices()` hook + mandatory service selector in free_slots mode, `useAvailableSlots(date, masterId, durationMin)` now uses actual service duration. Adaptive grid (1-3/4-8/9+). Vogue aesthetics: Playfair Display serif dates, tracked uppercase labels (0.22em), zero horizontal lines, Instagram link sticker pill. 6 palettes with unified token system. Canvas ref stability preserved. TypeScript: 0 помилок.

[2026-04-23] - Claude Code: **Onboarding Phase 3 — Live Preview (Premium Mirror)**. New `StepProfilePreview` step inserted between PROFIT_PREDICTOR and SUCCESS. Phone mockup (220px frame, dark border) reactively shows avatar, business name, slug, up to 3 service cards derived from `CATEGORY_TEMPLATES`, animated Flash Deal badge, star rating row, and CTA. `businessName` input saves to `master_profiles.business_name` via new `saveOnboardingBusinessName` server action. `OnboardingData` + `Step` union extended. TypeScript: 0 помилок.

[2026-04-23] - Claude Code: **Onboarding Phase 1: Smart Service Defaults**. Replaced manual service entry with an intelligent template generator. Added `CATEGORY_TEMPLATES` in `onboardingTemplates.ts`. Updated `StepServicesForm` to render a category grid and 3 auto-calculating service cards (Express, Standard, Premium) based on a base price. Selected services are now batched and saved via `saveOnboardingServices` to the `services` table, and state persistence tracks the user's category/price/selection choices.

[2026-04-23] - Antigravity: **Auth State Persistence (Onboarding)**. Verified implementation of master onboarding state persistence. Ensured `080_onboarding_persistence.sql` adds `onboarding_step` and `onboarding_data` to `profiles`. Confirmed `actions.ts` provides `saveOnboardingProgress` and `OnboardingWizard` successfully hydrates `initialStep` and `initialData` from the server, committing progress asynchronously on each step to prevent data loss.

[2026-04-22] - Claude Code: **E2E Suite 17 — Retention & Loyalty Engine**. `e2e/tests/17-retention-loyalty-engine.spec.ts`: 4 сценарії. Part 1 UI: (A) unauth public page → LoyaltyWidget marketing teaser з першим тиром; (B) client з 20 completed bookings → "Ви досягли максимального рівня!". Part 2 Cron API: (C) completed booking 30д тому, немає майбутніх → notification inserted, console evidence; (D) completed booking 30д тому + future pending → notification skipped (anti-spam), console evidence "Anti-Spam filter BLOCKED". Кожен тест: try/finally cleanup (bookings + notifications + retention_cycle_days restore). Skip guards на відсутні env vars. TypeScript: 0 помилок.

[2026-04-22] - Claude Code: **Fix: Rebooking Cron date arithmetic (migration 079)**. Root cause: `p_today - cycle * INTERVAL '1 day'` → `DATE - INTERVAL = TIMESTAMP`; порівняння `DATE = TIMESTAMP` давало 0 результатів. Правильно: `p_today - mc.cycle` → `DATE - INTEGER = DATE`. `MAX(b.date)` тепер без `.::date` cast (колонка вже є `date`). `has_future` CTE: `date > p_today` — коректний `date > date`. Migration 079 застосовано (`CREATE OR REPLACE FUNCTION`).

[2026-04-22] - Claude Code: **Retention Engine Phase 3 — Smart Rebooking Cron**. Migration 078: SQL RPC `get_rebooking_due_clients(p_today date)` — єдиний запит з 4 CTEs: `master_cycles` (retention_cycle_days на майстра), `last_visits` (GROUP BY master_id+client_id MAX date), `due` (last_date = today - cycle), фільтр `has_future` (anti-spam: клієнти з future pending/confirmed) + `already_notified` (idempotency: не слати двічі в той самий день). `api/cron/rebooking/route.ts` переписано — `CRON_SECRET` guard, виклик RPC, batch-fetch client `telegram_chat_id` + master slug, паралельний `Promise.allSettled` Telegram → клієнту, batch insert в `notifications` (type=`rebooking_reminder`). Migration застосовано. TypeScript: 0 помилок.

[2026-04-22] - Claude Code: **Loyalty — Single Source of Truth Fix**. Замінено `client_master_relations.total_visits` (stale лічильник) на прямий aggregate COUNT з `bookings`: `status = 'completed'`, `client_id = user.id`, `master_id = master.id`. `relationRes.count` → `currentVisits`. Tier-логіка повністю сумісна з новим значенням. TypeScript: 0 помилок.

[2026-04-22] - Claude Code: **Loyalty Tier System + Bulletproof Auth**. Переписано з punch-card на tier/status модель. `page.tsx`: `loyalty_programs` тепер завантажуються ВСІ активні, відсортовані по `target_visits ASC` (не `maybeSingle`); `loyalty` shape змінено на `{ tiers[], currentVisits, isAuth }`. `LoyaltyWidget.tsx` повністю переписано — три стани: (1) unauth-тизер з першим тиром ("Знижка X% на всі візити, починаючи з N-го"); (2) прогрес до `nextTier` з current-tier badge якщо вже є знижка; (3) `maxReached` = Crown icon + повна progress bar + "Ви досягли максимального рівня! Ваша постійна знижка: X%." `currentTier` — останній тир де `targetVisits <= currentVisits`; `nextTier` — перший де `targetVisits > currentVisits`. Gracefully handles 1, 2, або 5 активних tier-ів. TypeScript: 0 помилок.

[2026-04-22] - Claude Code: **LoyaltyWidget Data Binding**. `app/[slug]/page.tsx`: `supabase.auth.getUser()` визначає поточного клієнта; два нових запити додано до `Promise.all` — `loyalty_programs` (active, maybeSingle) та `client_master_relations` (total_visits, тільки якщо auth). Якщо активна програма відсутня — `loyalty: null`, віджет не рендериться. `Master` interface: нове поле `loyalty?: { targetVisits, rewardType, rewardValue, currentVisits, isAuth } | null`. `PublicMasterPage.tsx`: хардкод `-20% / 3/5` замінено умовним рендером `{master.loyalty && <LoyaltyWidget ... />}` з динамічним `rewardText` (percent_discount → `-N%`, fixed_discount → `-N ₴`, free_service → `Подарунок`). TypeScript: 0 помилок.

[2026-04-21] - Claude Code: **Dynamic Retention Thresholds (Task 4)**. Migration 077: `master_profiles` отримала колонку `retention_cycle_days INT NOT NULL DEFAULT 30`. RPC `get_master_clients` перероблено — CTE `WITH cycle(n) AS (SELECT retention_cycle_days FROM master_profiles WHERE id = p_master_id)` зчитує N майстра один раз; статуси: active (<N), sleeping (N–2N), at_risk (2N–3N), lost (≥3N). `src/types/database.ts`: поле `retention_cycle_days?: number | null` в `MasterProfile`. `context.tsx`: `retention_cycle_days` включено до SELECT-рядка. `SettingsPage.tsx`: стан `retentionCycleDays`, dirty-detection, збереження (через `handleSave` → `.update({ retention_cycle_days })`), скидання в `handleCancel`; UI-секція "CRM / Утримання клієнтів" з preset-кнопками [14, 21, 30, 45, 60, 90] дн. та live-preview "Під ризиком від N*2 дн. · Втрачений від N*3 дн.". Migration застосовано (`supabase db push`). TypeScript: 0 помилок.

[2026-04-22] - Claude Code: **Retention Engine Phase 1 — Churn Dashboard**. Migration 076: `get_master_clients` RPC розширено полем `retention_status TEXT` — обчислюється в SQL через `CURRENT_DATE - MAX(b.date)`: active (<30d), sleeping (30–59d), at_risk (60–89d), lost (≥90d). `useClients.ts`: додано `RetentionStatus` тип + поле в `ClientRow`. `ClientsPage.tsx`: (1) Retention filter strip — 5 pill-кнопок (Всі / Активні / Дрімають / Під ризиком / Втрачені) з лічильниками; (2) Кольоровий badge на кожній картці (список + grid); (3) Stats grid 4 колонки з "Під загрозою" лічильником; (4) `isChurned()` видалено — замінено прямою перевіркою `retention_status`. `ClientDetailSheet.tsx`: "churn reminder" тепер тригериться на `at_risk || lost`. Migration застосовано через `supabase db push`.

[2026-04-21] - Claude Code: **Data Normalization Fix** — Location pipeline fully normalized. `LocationPicker.tsx`: змінено сигнатуру `onChange(coords, city, streetAddress)` — `parseAddressComponents()` повертає окремо `city` (locality) та `streetAddress` (route + street_number); `geocodeLatLng()` closure використовується і при кліку на карті, і при dragend маркера (reverse geocode в обох випадках). `SettingsPage.tsx`: видалено ручний input "Місто" — `city` тепер встановлюється виключно з Google Places API; `LocationPicker.address` prop отримує `[city, address].join(', ')` для відображення. Output layer (`page.tsx` → `locationQuery = [city, address].join(', ')`) вже коректний — без дублювань.

[2026-04-21] - Claude Code: **Task 1** — LocationPicker (`settings/LocationPicker.tsx`): додано `buildShortAddress()` — парсить `address_components` Google Places/Geocoder API і повертає короткий рядок "Місто, Вулиця, Номер будинку" замість повної verbose адреси. Оновлено `fields` autocomplete + зворотне геокодування при кліку на карті. **Task 2** — PublicMasterPage (`public/PublicMasterPage.tsx`): redesign хедера у стилі "High-end Cozy Minimalism" — об'єднано Top Bar + Profile Card в єдину картку з centered layout, великим аватаром з тінню, `heading-serif` заголовком, Working Hours/Status badge, спеціалізацією, рейтингом, локацією та нативною кнопкою Share (absolute top-right). Видалено `ExternalLink`.

[2026-04-21] - Antigravity: Removed legacy manual address text input from SettingsPage UI and positioned LocationPicker (Google Places Autocomplete) alongside Floor and Cabinet inputs for a unified, premium look.

[2026-04-21] - Antigravity: Smart Address Rendering - Updated rendering logic for the location text in `app/[slug]/page.tsx` to conditionally exclude the city name if it is already present in the address string, preventing redundant outputs like "Березівка, Березівка, вулиця Миру, 16".

[2026-04-22] - Antigravity: **Retention Engine Phase 2 — Loyalty Widget UI**. Created `LoyaltyWidget.tsx` component with two visual states (Unauthenticated/Marketing and Authenticated/Progress) using High-end Cozy Minimalism design standards. Mounted the widget in `PublicMasterPage.tsx` below the location card with temporary mock props (`isAuth={true}`, `currentVisits={3}`, `targetVisits={5}`).

[2026-04-22] - Claude Code: **Pre-flight Phone Validation for OTP (SMS Cost-saving)**. `PhoneOtpForm.tsx`: додано `mode?: 'login' | 'register'` prop (default `'login'`). В `handleSendSms` перед відправкою SMS — server action `checkPhoneExists(phone)` → Admin Client query `profiles.phone`. Rule A (register + exists) → "Користувач з таким номером вже зареєстрований. Увійдіть в акаунт." — SMS не відправляється. Rule B (login + not exists) → "Користувача з таким номером не знайдено. Зареєструйтеся." — SMS не відправляється. `RegisterForm.tsx` → `mode="register"`, `LoginForm.tsx` → `mode="login"`. Якщо server check повертає помилку — пропускаємо pre-flight і відправляємо SMS (graceful fallback). TypeScript: 0 помилок.

[2026-04-22] - Claude Code: **Smart Client Autocomplete in ManualBookingForm**. Новий компонент `ClientCombobox.tsx` (`wizard/`) — пошуковий combobox що використовує `useClients()` (кешований RPC `get_master_clients`): фільтрація за ім'ям та телефоном, dropdown до 7 результатів з VIP-бейджем, fallback "Новий клієнт: [текст]" для нових. `ClientDetails.tsx`: в режимі `master` замість plain text input рендериться `ClientCombobox`; при виборі клієнта з дропдауну — `setValue('clientName')` + `setValue('clientPhone')` + `setSelectedClientId(client_id)`. `useBookingWizardState.ts`: додано стан `selectedClientId` + скидання при reset. `BookingWizard.tsx`: `clientId` в payload тепер = `selectedClientId` для manual bookings (якщо клієнт без акаунту — `null`, але name+phone все одно заповнені). TypeScript: 0 помилок.

[2026-04-23] - Claude Code: **Onboarding Phase 2: Profit Predictor & Flash Deals Upsell**. Новий крок `PROFIT_PREDICTOR` між `SERVICES_FORM` і `SUCCESS`. `StepProfitPredictor.tsx`: інтерактивний слайдер 1-15 (пусті вікна/тиждень), `monthlyLoss = slots × basePrice × 4`, анімований лічильник (RAF ease-out cubic), progress bar втрат vs Flash Deals. Flash Deals картка: золотий градієнт, toggle (spring анімація), для starter → Lock icon + "2 флеш-акції/місяць" + лінк на Pro; для Pro (referred або оплачений) → Crown icon + "необмежені Flash Deals включено". `OnboardingWizard.tsx`: `isPro = subscription_tier !== 'starter'`, нові state `emptySlots` (default 4) + `flashDealsEnabled` (default true), `handleSaveProfitPredictor` → `saveOnboardingProgress('SUCCESS')`. `OnboardingData` + `types.ts` оновлено. TypeScript: 0 помилок.

[2026-04-23] - Claude Code: **Onboarding: Auto-generated Smart Defaults & Calculator**. `onboardingTemplates.ts`: розширено до 19 категорій у 5 груп (Нігті / Волосся / Обличчя / Тіло / Тату+Пірс) — реалістичні назви для українського ринку з express/standard/premium тірами та коректними `priceMult`. Додано `CATEGORY_GROUPS` для групованого рендерингу. `types.ts`: `SPECIALIZATIONS` розширено до 20 елементів з полем `group`; нові типи `SpecializationItem` / `SpecializationGroup`; новий `SPECIALIZATION_GROUPS` (6 груп). `StepBasic.tsx`: спеціалізація тепер з горизонтальними group-tabs (Нігті/Волосся/Обличчя/Тіло/Тату+Пірс/Інше) — відфільтрована 4-col grid; плавна анімація при перемиканні групи; активна група автоматично визначається з поточного `specialization`. `StepServicesForm.tsx`: категорії перегруповані з section-заголовками, 3-col grid у кожній групі; base price input з підказкою; tier cards показуються лише при `basePriceNum > 0` з пружинною анімацією; badge Базовий/Стандарт/Преміум з color coding; форматування часу `год/хв`. TypeScript: 0 помилок.

[2026-04-22] - Claude Code: **BookingsPage Parity & ClientDetailSheet Status Badges**. `BookingCard.tsx`: додано `completeBooking` + `updateBookingStatus('no_show')` actions; Quick Actions розширено — `pending` тепер показує [Підтвердити, Завершити, Скасувати], `confirmed` — [Завершити, Не прийшов, Скасувати]; `isAnyPending` guard блокує всі кнопки під час запиту. `ClientDetailSheet.tsx`: `STATUS_CONFIG` розширено полем `bg` (rgba кольори); статус-бейдж у "Останні записи" оновлено до pill-стилю (`px-1.5 py-0.5 rounded-full` + background) — відповідає дизайн-системі. TypeScript: 0 помилок.

---

[2026-04-24] - Claude Code: **Billing Engine V2 — PaymentProvider Interface + Token Vault + Test-Charge**.

### Нові таблиці
- **`master_subscriptions`** (migration 084): token vault для рекурентних платежів. Поля: `id, master_id, provider, token, plan_id, expires_at, created_at, updated_at`. UNIQUE на `(master_id, provider)`. RLS увімкнено без жодної policy → доступ тільки через `service_role` (admin client).
- **`billing_events` v2** (migration 085): додані колонки `external_id TEXT` (UNIQUE per provider, partial index WHERE NOT NULL), `amount INT`, `status TEXT`, `payload JSONB`. Зворотньо сумісно з migration 075.

### Архітектура `src/lib/billing/`
| Файл | Відповідальність |
|---|---|
| `PaymentProvider.ts` | Abstract interface: `createCheckout()`, `verifyWebhookSignature()` |
| `MonoProvider.ts` | Monobank: invoice create (з `saveCardData`), Ed25519 sig verify + key rotation |
| `WfpProvider.ts` | WayForPay: checkout URL build (з `recToken: 'y'`), HMAC-MD5 sig verify |

### Ендпоінти
- **`POST /api/billing/test-charge`** — Authenticated master → 5 UAH checkout URL. Body: `{ provider, planId? }`. Повертає `{ checkoutUrl, orderId }`.
- **`POST /api/billing/mono-webhook`** — Ed25519 verify (403 при fail) → idempotency insert → extend subscription → upsert recToken до `master_subscriptions`.
- **`POST /api/billing/wfp-webhook`** — HMAC-MD5 verify (403 при fail) → idempotency insert → extend subscription → upsert recToken до `master_subscriptions`.

### Unit тести
`src/lib/billing/billing.test.ts` — 6 тестів: WFP HMAC-MD5 (3 cases) + Monobank Ed25519 (3 cases).

---

## Чеклист Перед Деплоєм

- [ ] `src/proxy.ts` — `export function proxy` (не middleware!)
- [ ] Всі RLS policies активні в Supabase
- [ ] Всі міграції до 072 застосовані (`npx supabase db push`)
- [ ] Ліміти Starter: 30 записів/місяць, 2 flash-акції/місяць, 9 фото, dynamic pricing trial до 1000 UAH
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
- [ ] Drawers: `?drawer=` URL param ізольований у `*Drawers.tsx` компонентах — не в dashboard grid
