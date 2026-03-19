# Bookit — Технічна документація

> **Ukrainian SaaS для онлайн-запису у б'юті-індустрії**
> "Твій розумний link in bio, який заробляє гроші"
> *Оновлено: 20.03.2026*

---

## 1. КОНЦЕПЦІЯ

Bookit — мобільний SaaS для майстрів краси (манікюр, брови, лешмейкінг, масаж тощо). Ключова цінність: майстер отримує особисту публічну сторінку (`bookit.com.ua/[slug]`) з онлайн-бронюванням, CRM, аналітикою та автоматичними нотифікаціями — без сайту, без адміністратора, без технічних знань.

**Позиціонування:** не просто посилання в bio — розумний інструмент, що сам нагадує, сам аналізує, сам утримує клієнтів.

---

## 2. ТЕХНІЧНИЙ СТЕК

| Шар | Технологія |
|-----|------------|
| Framework | Next.js 16.1.6 (App Router, Turbopack) |
| Мова | TypeScript (strict mode) |
| Стилі | Tailwind CSS v4 (`@import "tailwindcss"`, без tailwind.config.ts) |
| Анімації | Framer Motion |
| State | Zustand + TanStack Query |
| Forms | React Hook Form + Zod |
| Backend | Supabase (auth, PostgreSQL, storage, realtime) |
| Іконки | Lucide React |
| Платежі | WayForPay (HMAC-MD5), Monobank (Ed25519) |
| Нотифікації | Web Push (VAPID / web-push), Telegram Bot API, TurboSMS |
| Деплой | Vercel + Supabase Cloud |

---

## 3. СТРУКТУРА ПРОЄКТУ

```
src/
├── app/
│   ├── (auth)/login, register/        — вхід / реєстрація
│   ├── (master)/dashboard/            — панель майстра (захищена)
│   │   ├── page.tsx                   — головна
│   │   ├── bookings/                  — записи
│   │   ├── services/                  — послуги + товари
│   │   ├── clients/                   — CRM
│   │   ├── analytics/                 — аналітика (Pro)
│   │   ├── flash/                     — flash-акції
│   │   ├── pricing/                   — динамічне ціноутворення
│   │   ├── billing/                   — підписки та оплата
│   │   ├── settings/                  — налаштування + VacationManager
│   │   ├── reviews/                   — відгуки
│   │   ├── portfolio/                 — портфоліо
│   │   ├── referral/                  — реферальна програма
│   │   ├── loyalty/                   — програма лояльності
│   │   └── studio/                    — Studio-тариф (мультимайстер)
│   ├── [slug]/                        — публічна сторінка майстра
│   ├── my/                            — зона клієнта
│   │   ├── bookings/                  — мої записи
│   │   ├── profile/                   — мій профіль
│   │   ├── masters/                   — мої майстри
│   │   └── loyalty/                   — моя лояльність
│   ├── explore/                       — каталог майстрів
│   ├── invite/[code]/                 — реферальний лендінг
│   ├── studio/join/                   — приєднання до студії
│   ├── onboarding/                    — онбординг
│   ├── offline/                       — PWA offline page
│   ├── auth/callback/                 — OAuth callback
│   └── api/
│       ├── auth/send-sms, verify-sms, link-booking/
│       ├── billing/webhook, mono-webhook/
│       ├── cron/reminders, reset-monthly, rebooking/
│       └── push/subscribe/
├── components/
│   ├── auth/                          — LoginForm, PhoneOtpForm, RegisterForm
│   ├── master/                        — всі компоненти дашборду
│   ├── public/                        — BookingFlow, PublicMasterPage, ExplorePage
│   ├── client/                        — MyBookingsPage, MyProfilePage, etc.
│   ├── landing/                       — Hero, Features, Pricing, FooterCTA
│   ├── shared/                        — BlobBackground, BottomNav, InstallBanner
│   └── ui/                            — Button, Card, Input, Badge, BottomSheet
├── lib/
│   ├── supabase/admin.ts              — ЄДИНИЙ admin client
│   ├── supabase/client.ts, server.ts, context.tsx
│   ├── supabase/hooks/                — useBookings, useServices, useNotifications, etc.
│   ├── telegram.ts                    — sendTelegramMessage, buildBookingMessage
│   ├── push.ts                        — broadcastPush
│   ├── email.ts
│   ├── utils/                         — cn, currency, dates, dynamicPricing, smartSlots
│   └── constants/                     — categories, themes
├── types/database.ts
└── proxy.ts                           — захист маршрутів (Next.js 16)
```

---

## 4. МАРШРУТИЗАЦІЯ ТА ЗАХИСТ

### 4.1 Proxy (Next.js 16)

**Файл:** `src/proxy.ts`
**Функція:** `export async function proxy(request: NextRequest)`

> **Next.js 16** змінив конвенцію: `middleware.ts` → `proxy.ts`, функція `proxy` (не `middleware`).
> Файл `src/middleware.ts` — **ЗАСТАРІЛИЙ**, Next.js його ігнорує.

Логіка захисту:
```typescript
// /dashboard — тільки masters
if (pathname.startsWith('/dashboard') && role !== 'master')
  → redirect('/my/bookings')

// /my — тільки clients (майстри з cookie view_mode=client можуть зайти)
if (pathname.startsWith('/my') && role === 'master' && !viewMode)
  → redirect('/dashboard')

// guest-only сторінки — редирект якщо вже авторизований
if (pathname === '/' || '/login' || '/register')
  → redirect('/dashboard') або redirect('/my/bookings')

// анонімний доступ до захищених — редирект на логін
if (!user && (pathname startsWith /dashboard | /my | /onboarding))
  → redirect('/login')
```

### 4.2 Маршрути

| Шлях | Тип | Захист |
|------|-----|--------|
| `/` | Server | Guest only (редирект якщо авторизований) |
| `/[slug]` | Server | Public |
| `/explore` | Server | Public |
| `/login`, `/register` | Client | Guest only |
| `/invite/[code]` | Server | Public |
| `/onboarding` | Client | Auth |
| `/dashboard/**` | Server+Client | Master only |
| `/my/**` | Client | Auth (client or master+cookie) |
| `/studio/join` | Client | Auth |

---

## 5. АУТЕНТИФІКАЦІЯ

### 5.1 SMS OTP Flow (основний)

```
POST /api/auth/send-sms
  ← phone (380XXXXXXXXX)
  → rate-limit: 3 SMS/15 хв (по phone) + 10 req/год (по IP)
  → 4-значний код через crypto.getRandomValues()
  → збереження в sms_otps (TTL 10 хв)
  → TurboSMS API

POST /api/auth/verify-sms
  ← phone, code
  → rate-limit: 10 спроб/15 хв (sms_verify_attempts)
  → перевірка created_at > now() - 10 min
  → admin.generateLink({ type: 'magiclink', email: virtualEmail })
  → { email, token, isNew }  ← НІКОЛИ не повертати пароль!

Client → supabase.auth.verifyOtp({ email, token, type: 'magiclink' })
  → Сесія встановлена
```

`virtualEmail = phone.replace('+','') + '@bookit.app'`

### 5.2 Реєстрація майстра

```
POST /register
  → supabase.auth.signUp({ email, password })
  → INSERT profiles { id, full_name, phone, role: 'master' }
  → INSERT master_profiles { id, slug }
    (якщо master_profiles fail → DELETE profiles → rollback)
  → Redirect /dashboard
```

Referral/invite code: генерується через `crypto.getRandomValues()`.

### 5.3 Google OAuth

```
/auth/google → Supabase OAuth → /auth/callback
  → Якщо новий user → INSERT profiles + master_profiles
  → Redirect: /dashboard (master) або /my/bookings (client)
```

---

## 6. СХЕМА БАЗИ ДАНИХ

### 6.1 Таблиці

```sql
-- Базові профілі
CREATE TABLE profiles (
  id               uuid PRIMARY KEY REFERENCES auth.users(id),
  full_name        text,
  phone            text UNIQUE,
  email            text,
  role             text CHECK (role IN ('master','client')) DEFAULT 'client',
  avatar_url       text,
  telegram_chat_id text,   -- клієнтський Telegram (для нагадувань)
  created_at       timestamptz DEFAULT now()
);

-- Профілі майстрів
CREATE TABLE master_profiles (
  id                      uuid PRIMARY KEY REFERENCES profiles(id),
  slug                    text UNIQUE NOT NULL,
  bio                     text,
  subscription_tier       text CHECK (subscription_tier IN ('starter','pro','studio')) DEFAULT 'starter',
  subscription_expires_at timestamptz,
  bookings_this_month     int DEFAULT 0,
  commission_rate         numeric(4,3) DEFAULT 0.05,
  pricing_rules           jsonb,           -- dynamic pricing
  telegram_chat_id        text,            -- бізнес Telegram майстра (для нових записів)
  theme                   text DEFAULT 'classic',
  working_hours           jsonb,           -- { mon: { start, end, enabled }, ... }
  created_at              timestamptz DEFAULT now()
);

-- Послуги
CREATE TABLE services (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  master_id   uuid REFERENCES master_profiles(id),
  name        text NOT NULL,
  description text,
  duration    int NOT NULL,    -- хвилини
  price       int NOT NULL,    -- копійки
  category    text,
  position    int DEFAULT 0,
  is_active   bool DEFAULT true,
  image_url   text,
  created_at  timestamptz DEFAULT now()
);

-- Товари
CREATE TABLE products (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  master_id   uuid REFERENCES master_profiles(id),
  name        text NOT NULL,
  description text,
  price       int NOT NULL,    -- копійки
  stock       int,
  image_url   text,
  is_active   bool DEFAULT true,
  created_at  timestamptz DEFAULT now()
);

-- Записи
CREATE TABLE bookings (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  master_id            uuid REFERENCES master_profiles(id),
  client_id            uuid REFERENCES profiles(id),
  service_id           uuid REFERENCES services(id),
  status               text CHECK (status IN ('pending','confirmed','completed','cancelled')) DEFAULT 'pending',
  slot_date            date NOT NULL,
  slot_time            time NOT NULL,
  total_duration       int,       -- хвилин (multi-service)
  total_price          int,       -- копійки
  total_products_price int DEFAULT 0,
  commission_amount    int DEFAULT 0,
  notes                text,
  source               text,      -- 'online' | 'manual'
  created_at           timestamptz DEFAULT now()
);

-- Товари в записі
CREATE TABLE booking_products (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id    uuid REFERENCES bookings(id),
  product_id    uuid REFERENCES products(id),
  quantity      int DEFAULT 1,
  product_price int NOT NULL    -- ціна на момент запису
);

-- CRM-відносини клієнт↔майстер
CREATE TABLE client_master_relations (
  client_id     uuid REFERENCES profiles(id),
  master_id     uuid REFERENCES master_profiles(id),
  total_visits  int DEFAULT 0,
  total_spent   int DEFAULT 0,
  average_check int DEFAULT 0,
  last_visit_at timestamptz,
  is_vip        bool DEFAULT false,
  tags          text[],
  notes         text,
  PRIMARY KEY   (client_id, master_id)
);

-- Відгуки (1 відгук на запис)
CREATE TABLE reviews (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id  uuid REFERENCES bookings(id) UNIQUE,
  master_id   uuid REFERENCES master_profiles(id),
  client_id   uuid REFERENCES profiles(id),
  rating      int CHECK (rating BETWEEN 1 AND 5),
  comment     text,
  created_at  timestamptz DEFAULT now()
);

-- Web Push підписки
CREATE TABLE push_subscriptions (
  id           bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id      uuid REFERENCES profiles(id),
  endpoint     text UNIQUE NOT NULL,
  subscription text NOT NULL,    -- JSON PushSubscription
  created_at   timestamptz DEFAULT now()
);

-- Flash-акції
CREATE TABLE flash_deals (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  master_id      uuid REFERENCES master_profiles(id),
  service_name   text NOT NULL,
  slot_date      date NOT NULL,
  slot_time      time NOT NULL,
  original_price int NOT NULL,   -- копійки
  discount_pct   int NOT NULL,
  expires_at     timestamptz NOT NULL,
  status         text CHECK (status IN ('active','expired','booked')) DEFAULT 'active',
  created_at     timestamptz DEFAULT now()
);

-- SMS OTP
CREATE TABLE sms_otps (
  id         bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  phone      text NOT NULL,
  code       text NOT NULL,
  used       bool DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Rate-limiting OTP верифікацій (migration 016)
CREATE TABLE sms_verify_attempts (
  id         bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  phone      text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Виключення в графіку (відпустки)
CREATE TABLE schedule_exceptions (
  id        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  master_id uuid REFERENCES master_profiles(id),
  date      date NOT NULL,
  type      text DEFAULT 'vacation'
);

-- Нотифікації
CREATE TABLE notifications (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid REFERENCES profiles(id),
  type       text,
  title      text,
  body       text,
  is_read    bool DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Реферальна система
CREATE TABLE referrals (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id   uuid REFERENCES profiles(id),
  invite_code text UNIQUE NOT NULL,
  master_id   uuid REFERENCES master_profiles(id),
  status      text DEFAULT 'pending',  -- 'pending' | 'registered'
  created_at  timestamptz DEFAULT now()
);

-- Студійні інвайти
CREATE TABLE studio_invites (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id  uuid REFERENCES master_profiles(id),
  token      text UNIQUE NOT NULL,
  email      text,
  status     text DEFAULT 'pending',
  created_at timestamptz DEFAULT now()
);

-- Портфоліо
CREATE TABLE portfolio_items (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  master_id  uuid REFERENCES master_profiles(id),
  image_url  text NOT NULL,
  caption    text,
  position   int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);
```

### 6.2 Важливо: два різних telegram_chat_id

| Таблиця | Поле | Призначення |
|---------|------|-------------|
| `profiles` | `telegram_chat_id` | Telegram клієнта (нагадування про записи) |
| `master_profiles` | `telegram_chat_id` | Telegram майстра (нові записи, скасування) |

Налаштування в `/dashboard/settings` зберігають в `master_profiles`, НЕ в `profiles`.

### 6.3 Тригер CRM-метрик

```sql
CREATE OR REPLACE FUNCTION update_client_master_metrics()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    INSERT INTO client_master_relations (client_id, master_id, total_visits, total_spent, last_visit_at)
    VALUES (NEW.client_id, NEW.master_id, 1, NEW.total_price, now())
    ON CONFLICT (client_id, master_id) DO UPDATE SET
      total_visits  = client_master_relations.total_visits + 1,
      total_spent   = client_master_relations.total_spent + NEW.total_price,
      average_check = (client_master_relations.total_spent + NEW.total_price) / (client_master_relations.total_visits + 1),
      last_visit_at = now(),
      updated_at    = now();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

### 6.4 Міграції

| Файл | Зміст |
|------|-------|
| 001–003 | Початкова схема, auth trigger, grants |
| 004–006 | Reviews, booking policies, CRM policies |
| 007–009 | Media fields, inventory trigger, push_subscriptions |
| 010–011 | Referrals, studios |
| 012–013 | Killer features, trigger security fix |
| 014–015 | Portfolio, avatar emoji |
| 016 | `sms_verify_attempts` table + `sms_otps.created_at` |
| 017 | `master_profiles.telegram_chat_id` |

---

## 7. SUPABASE ADMIN CLIENT

```typescript
// ЗАВЖДИ так:
import { createAdminClient } from '@/lib/supabase/admin';
const admin = createAdminClient();

// НІКОЛИ не inline:
// const admin = createClient(URL, SERVICE_ROLE_KEY)  ← ЗАБОРОНЕНО
```

Використовується скрізь де потрібен bypass RLS: server actions, API webhooks, cron routes.

---

## 8. ДИЗАЙН-СИСТЕМА

### Кольори

| Назва | Hex | Використання |
|-------|-----|-------------|
| Peach | `#FFD2C2` | Основний фон |
| Sage | `#789A99` | Акцент, кнопки |
| Text Primary | `#2C1A14` | Заголовки |
| Text Secondary | `#6B5750` | Підписи |
| Text Tertiary | `#A8928D` | Плейсхолдери |
| Surface | `rgba(255,255,255,0.68)` | Mica-ефект карток |
| Success | `#5C9E7A` | |
| Warning | `#D4935A` | |
| Error | `#C05B5B` | |

### Типографіка

- **Body:** Inter (cyrillic)
- **Display:** Playfair Display (cyrillic)
- CSS-класи: `.display-xl`, `.display-lg`, `.display-md`, `.heading-serif`, `.font-display`

### Компоненти

- Card radius: 24px | Button radius: 16px | Input radius: 12px
- `.bento-card` — backdrop-blur, border, shadow
- Blob background — peach + sage + cream, `z-index: -1`
- Grain overlay — `position: fixed`, `z-index: 9999`, `opacity: 0.03`
- Всі анімації — `will-change: transform` (GPU)

### Tailwind CSS v4

```css
@import "tailwindcss";   /* globals.css — НЕ @tailwind base/components/utilities */
```

Немає `tailwind.config.ts` — лише CSS-конфіг через `@theme {}`.

### Mood Themes

`classic` | `dark` | `rose-gold` | `mint` — зберігається в `master_profiles.theme`.

---

## 9. БІЗНЕС-ЛОГІКА

### Тарифи

| Функція | Starter (0₴) | Pro (349₴/міс) | Studio (199₴×N/міс) |
|---------|:---:|:---:|:---:|
| Записи на місяць | 30 | ∞ | ∞ |
| Аналітика | — | ✓ | ✓ |
| CRM повний | — | ✓ | ✓ |
| CSV-експорт | — | ✓ | ✓ |
| Flash-акції | 2/міс | ∞ | ∞ |
| Реактивація клієнтів | — | ✓ | ✓ |
| Без вотермарки | — | ✓ | ✓ |
| Мультимайстер | — | — | ✓ |

### Ліміт записів (Starter: 30/міс)

`bookings_this_month` скидається cron-джобом `reset-monthly` (1-го числа, 00:05 UTC).
При спробі нового запису — перевірка в BookingFlow → locked state + CTA "Перейти на Pro".

### Multi-service бронювання

- Клієнт обирає кілька послуг (checkboxes)
- `totalDuration` = сума, перевірка consecutive slots
- `total_price` в копійках

### Динамічне ціноутворення

```typescript
interface PricingRules {
  peakHours:  { start: string; end: string; multiplier: number }[];
  lastMinute: { hoursThreshold: number; discount: number };
  earlyBird:  { daysThreshold: number; discount: number };
}
```

Зберігається в `master_profiles.pricing_rules` (jsonb). Редагується на `/dashboard/pricing`.

### Комісія з продажів товарів

При `status → 'completed'`:
```typescript
const productTotal = booking_products.reduce((s, p) => s + p.product_price * p.quantity, 0);
const commission = productTotal * master.commission_rate; // default 5%
```

### Відпустки / Заблоковані дати

Таблиця `schedule_exceptions` — майстер блокує дати через VacationManager.
BookingFlow завантажує `blockedDates` і disabled їх у date strip.

---

## 10. НОТИФІКАЦІЇ

### Типи та канали

| Подія | Отримувач | Push | Telegram | SMS |
|-------|-----------|:----:|:--------:|:---:|
| Новий запис | Майстер | ✓ | ✓ | — |
| Підтвердження | Клієнт | ✓ | ✓ | — |
| Нагадування 24г | Клієнт | ✓ | ✓ | fallback |
| Нагадування 1г | Клієнт | ✓ | — | — |
| Скасування | Обидва | ✓ | ✓ | — |
| Реактивація 30 днів | Клієнт | — | ✓ | — |
| Flash-акція | Клієнти майстра | ✓ | ✓ | — |
| Після візиту (+2г) | Клієнт | ✓ | — | — |

### Telegram

- Бот: `/start [user_id]` → зберігає `telegram_chat_id`
- HTML-теги: `<b>`, `<i>`, `<a>` — всі user-supplied strings обов'язково через `escHtml()`
- `lib/telegram.ts`: `sendTelegramMessage()`, `buildBookingMessage()`, `buildCancellationMessage()`

### Web Push

- VAPID-ключі: `NEXT_PUBLIC_VAPID_KEY` + `VAPID_PRIVATE_KEY`
- `lib/push.ts`: `broadcastPush(subscriptions[], { title, body, url })`
- Підписки в `push_subscriptions` (upsert by endpoint)

### Cron Jobs

| Route | Розклад | Дія |
|-------|---------|-----|
| `/api/cron/reminders` | `0 7 * * *` (UTC) | Push/SMS нагадування на завтра |
| `/api/cron/reset-monthly` | `5 0 1 * *` | Скинути bookings_this_month, downgrade прострочені |
| `/api/cron/rebooking` | `0 10 * * *` | Нагадування повторного запису |

**Auth:** всі cron routes перевіряють `Authorization: Bearer {CRON_SECRET}` — завжди, без умов.

---

## 11. ПЛАТЕЖІ

### WayForPay

- Підпис: HMAC-MD5
- Webhook: `POST /api/billing/webhook` → `createAdminClient()` (не createClient!)
- `transactionStatus === 'Approved'` → оновити `subscription_tier` + `subscription_expires_at` (+31 день)
- orderRef формат: `sub_{masterId}_{timestamp}`

### Monobank

- Підпис: Ed25519, публічний ключ кешується в пам'яті процесу
- Webhook: `POST /api/billing/mono-webhook`
- reference формат: `bookit_{tier}_{uid32}_{timestamp}`
- Не подовжує якщо підписка ще активна (немає double-extend)

---

## 12. API ENDPOINTS

### Auth

| Method | Path | Опис |
|--------|------|------|
| POST | `/api/auth/send-sms` | Відправити OTP (rate-limit: 3/15хв phone, 10/год IP) |
| POST | `/api/auth/verify-sms` | Перевірити OTP → magiclink token |
| POST | `/api/auth/link-booking` | Прив'язати booking після auth |

### Push

| Method | Path | Опис |
|--------|------|------|
| POST | `/api/push/subscribe` | Зберегти push підписку |
| DELETE | `/api/push/subscribe` | Видалити push підписку |

### Billing

| Method | Path | Опис |
|--------|------|------|
| POST | `/api/billing/webhook` | WayForPay webhook |
| POST | `/api/billing/mono-webhook` | Monobank webhook |

### Cron (вимагають `Authorization: Bearer CRON_SECRET`)

| Method | Path |
|--------|------|
| GET | `/api/cron/reminders` |
| GET | `/api/cron/reset-monthly` |
| GET | `/api/cron/rebooking` |

---

## 13. РЕФЕРАЛЬНА СИСТЕМА

### Клієнт запрошує майстра (`/my/invite`)

1. Клієнт генерує `invite_code` → `bookit.com.ua/invite/[code]`
2. Шерить повідомлення через Web Share API

### Реферальний лендінг (`/invite/[code]`)

- Персоналізована сторінка з аватарами клієнтів, що чекають
- **Boosted Start:** 50 записів/міс на 3 місяці + тема Rose Gold

### Після реєстрації через реферал

1. INSERT `client_master_relations` для всіх клієнтів, що чекають
2. Push-нотифікація кожному клієнту
3. `referrals.status = 'registered'`
4. Ambassador levels: 3 invited → level 1, 5 → level 2

---

## 14. FLASH-АКЦІЇ

- Майстер: послуга + слот + знижка 10–50% + TTL 2/4/8 год
- Розсилка: Push + Telegram → всі клієнти з `completed` бронюваннями у цього майстра
- Starter: 2 акції/міс. Pro/Studio: ∞
- Скасування: `status → 'expired'`
- Server action: `cancelFlashDeal()` → `createAdminClient()` (виправлено з inline `createAdmin`)

---

## 15. PWA

```json
{
  "name": "Bookit — Онлайн запис",
  "short_name": "Bookit",
  "display": "standalone",
  "background_color": "#FFD2C2",
  "theme_color": "#789A99",
  "orientation": "portrait"
}
```

| Ресурс | Стратегія |
|--------|-----------|
| Публічні сторінки | Cache First |
| Dashboard | Network First |
| Статика | Stale While Revalidate |
| API | Network Only |

---

## 16. БЕЗПЕКА

### Виправлені вразливості

| # | Вразливість | Статус |
|---|-------------|--------|
| 1 | Витік пароля в `/api/auth/verify-sms` (повертав SERVICE_ROLE_KEY) | ✅ Виправлено: magiclink token |
| 2 | Middleware не працював (`proxy.ts` → ігнорувався Next.js) | ✅ Виправлено: `src/proxy.ts` + `export function proxy` |
| 3 | WayForPay webhook тихо падав (`createClient()` без cookies) | ✅ Виправлено: `createAdminClient()` |
| 4 | Monobank webhook без верифікації підпису | ✅ Виправлено: Ed25519 |
| 5 | OTP brute-force (необмежені спроби) | ✅ Виправлено: `sms_verify_attempts`, 10 спроб/15 хв |
| 6 | Cron routes без обов'язкової auth | ✅ Виправлено: завжди перевіряємо CRON_SECRET |
| 7 | HTML-ін'єкція в Telegram | ✅ Виправлено: `escHtml()` |
| 8 | `submitReview` приймав `master_id` від клієнта | ✅ Виправлено: master_id з БД |
| 9 | `telegram_chat_id` зберігався в `profiles` (читалось з `master_profiles`) | ✅ Виправлено |
| 10 | `Math.random()` для referral/invite token | ✅ Виправлено: `crypto.getRandomValues()` |
| 11 | Дублювання admin client у 10+ файлах | ✅ Уніфіковано: `createAdminClient` |
| 12 | Debug console.log з OTP та user ID | ✅ Видалено |
| 13 | `cancelFlashDeal` використовував невизначений `createAdmin` | ✅ Виправлено |

---

## 17. ЧЕКЛИСТ ПЕРЕД ДЕПЛОЄМ

- [ ] Всі RLS policies активні
- [ ] `src/proxy.ts` — функція `proxy` (не middleware!)
- [ ] Ліміти Starter: 30 записів/міс, 2 flash-акції/міс
- [ ] WayForPay + Monobank webhooks верифікують підпис
- [ ] `CRON_SECRET` в env, всі cron routes перевіряють
- [ ] Міграції 016 (sms_verify_attempts) та 017 (master_profiles.telegram_chat_id) застосовані
- [ ] Жодного `console.log` з чутливими даними
- [ ] `createAdminClient()` скрізь (не inline)
- [ ] PWA manifest валідний, іконки `192×192` та `512×512` присутні
- [ ] SEO мета-теги на `/[slug]` та `/explore`
- [ ] Lighthouse score > 90 (Performance, Accessibility)
- [ ] Всі анімації мають `will-change: transform`
- [ ] Error boundaries на клієнтських компонентах
