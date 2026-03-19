# Bookit — Технічна документація

> **Ukrainian SaaS для онлайн-запису у б'юті-індустрії**
> "Твій розумний link in bio, який заробляє гроші"

---

## 1. КОНЦЕПЦІЯ

Bookit — це мобільний SaaS для майстрів краси (манікюр, брови, лешмейкінг, масаж тощо). Ключова цінність: майстер отримує особисту публічну сторінку (`bookit.com.ua/[slug]`) з онлайн-бронюванням, CRM, аналітикою та автоматичними нотифікаціями — без сайту, без адміністратора, без технічних знань.

**Позиціонування:** не просто посилання в bio — це розумний інструмент, що сам нагадує, сам аналізує, сам утримує клієнтів.

---

## 2. ТЕХНІЧНИЙ СТЕК

| Шар | Технологія |
|-----|------------|
| Framework | Next.js 16+ (App Router, Turbopack) |
| Мова | TypeScript (strict mode) |
| Стилі | Tailwind CSS v4 (`@import "tailwindcss"`, без tailwind.config.ts) |
| Анімації | Framer Motion |
| State | Zustand + TanStack Query |
| Forms | React Hook Form + Zod |
| Backend | Supabase (auth, PostgreSQL, storage, realtime) |
| Іконки | Lucide React |
| Платежі | WayForPay (підписки), Monobank (альтернатива) |
| Нотифікації | Web Push (VAPID), Telegram Bot API, TurboSMS |
| Деплой | Vercel (Next.js) + Supabase Cloud |

---

## 3. СХЕМА БАЗИ ДАНИХ

### 3.1 Таблиці

```sql
-- Базові профілі (для всіх ролей)
CREATE TABLE profiles (
  id          uuid PRIMARY KEY REFERENCES auth.users(id),
  full_name   text,
  phone       text UNIQUE,
  email       text,
  role        text CHECK (role IN ('master', 'client')) DEFAULT 'client',
  avatar_url  text,
  telegram_chat_id text,  -- для клієнтських нотифікацій
  created_at  timestamptz DEFAULT now()
);

-- Профілі майстрів (розширення profiles)
CREATE TABLE master_profiles (
  id                  uuid PRIMARY KEY REFERENCES profiles(id),
  slug                text UNIQUE NOT NULL,
  bio                 text,
  subscription_tier   text CHECK (subscription_tier IN ('starter','pro','studio')) DEFAULT 'starter',
  subscription_expires_at timestamptz,
  bookings_this_month int DEFAULT 0,
  commission_rate     numeric(4,3) DEFAULT 0.05,  -- % від продажів товарів
  pricing_rules       jsonb,                       -- dynamic pricing config
  telegram_chat_id    text,                        -- для нотифікацій майстра (окремо від profiles!)
  theme               text DEFAULT 'classic',      -- mood theme
  working_hours       jsonb,                       -- { mon: { start, end, enabled }, ... }
  created_at          timestamptz DEFAULT now()
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
  position    int DEFAULT 0,   -- порядок відображення
  is_active   bool DEFAULT true,
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

-- Записи (бронювання)
CREATE TABLE bookings (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  master_id             uuid REFERENCES master_profiles(id),
  client_id             uuid REFERENCES profiles(id),
  service_id            uuid REFERENCES services(id),
  status                text CHECK (status IN ('pending','confirmed','completed','cancelled')) DEFAULT 'pending',
  slot_date             date NOT NULL,
  slot_time             time NOT NULL,
  total_duration        int,           -- хвилин (multi-service)
  total_price           int,           -- копійки
  total_products_price  int DEFAULT 0,
  commission_amount     int DEFAULT 0,
  notes                 text,          -- нотатки клієнта
  source                text,          -- 'online' | 'manual'
  created_at            timestamptz DEFAULT now()
);

-- Товари в записі
CREATE TABLE booking_products (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id    uuid REFERENCES bookings(id),
  product_id    uuid REFERENCES products(id),
  quantity      int DEFAULT 1,
  product_price int NOT NULL    -- ціна на момент запису (копійки)
);

-- CRM-відносини клієнт↔майстер
CREATE TABLE client_master_relations (
  client_id     uuid REFERENCES profiles(id),
  master_id     uuid REFERENCES master_profiles(id),
  total_visits  int DEFAULT 0,
  total_spent   int DEFAULT 0,   -- копійки
  average_check int DEFAULT 0,
  last_visit_at timestamptz,
  is_vip        bool DEFAULT false,
  tags          text[],
  notes         text,
  PRIMARY KEY   (client_id, master_id)
);

-- Відгуки
CREATE TABLE reviews (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id  uuid REFERENCES bookings(id) UNIQUE,  -- 1 відгук на запис
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
  subscription text NOT NULL,   -- JSON PushSubscription
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
  discount_pct   int NOT NULL,   -- 10-50%
  expires_at     timestamptz NOT NULL,
  status         text CHECK (status IN ('active','expired','booked')) DEFAULT 'active',
  created_at     timestamptz DEFAULT now()
);

-- SMS OTP коди
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

-- Виключення в графіку (відпустки, особливі дні)
CREATE TABLE schedule_exceptions (
  id        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  master_id uuid REFERENCES master_profiles(id),
  date      date NOT NULL,
  type      text DEFAULT 'vacation'  -- 'vacation' | 'custom'
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
  client_id   uuid REFERENCES profiles(id),  -- хто запрошує
  invite_code text UNIQUE NOT NULL,
  master_id   uuid REFERENCES master_profiles(id),  -- запрошений майстер
  status      text DEFAULT 'pending',   -- 'pending' | 'registered'
  created_at  timestamptz DEFAULT now()
);

-- Інвайти для студій
CREATE TABLE studio_invites (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id  uuid REFERENCES master_profiles(id),
  token      text UNIQUE NOT NULL,
  email      text,
  status     text DEFAULT 'pending',  -- 'pending' | 'accepted'
  created_at timestamptz DEFAULT now()
);
```

### 3.2 Ключові тригери

```sql
-- Автооновлення CRM-метрик при завершенні запису
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

CREATE TRIGGER trigger_update_crm_metrics
AFTER UPDATE ON bookings
FOR EACH ROW EXECUTE FUNCTION update_client_master_metrics();
```

---

## 4. АУТЕНТИФІКАЦІЯ

### 4.1 SMS OTP Flow

```
Клієнт вводить номер → POST /api/auth/send-sms
  → TurboSMS надсилає 4-значний код
  → Код зберігається в sms_otps (TTL 10 хв)

Клієнт вводить код → POST /api/auth/verify-sms
  → Перевірка rate-limit (≤5 спроб/10 хв з sms_verify_attempts)
  → Перевірка коду з sms_otps (created_at > now() - 10 min)
  → generateLink({ type: 'magiclink', email: virtualEmail })
  → Повертає { email, token, isNew }  ← БЕЗ пароля

Клієнт → supabase.auth.verifyOtp({ email, token, type: 'magiclink' })
  → Сесія встановлена
```

**Важливо:** `virtualEmail = phone.replace('+','') + '@sms.bookit.com.ua'`. Ніколи не повертати пароль або SERVICE_ROLE_KEY в HTTP-відповіді.

### 4.2 Реєстрація майстра

```
POST /register (3 кроки форми)
  → supabase.auth.signUp({ email, password })
  → INSERT profiles { id, full_name, phone, role: 'master' }
  → INSERT master_profiles { id, slug }
    (якщо master_profiles fail → DELETE profiles → rollback)
  → Redirect /dashboard
```

**Referral code:** генерується через `crypto.getRandomValues()` (не `Math.random()`).

### 4.3 Google OAuth

```
/auth/google → Supabase OAuth → /auth/callback
  → Перевірка: чи існує profiles для user.id
  → Якщо ні → INSERT profiles + master_profiles (для майстрів)
  → Redirect за роллю: /dashboard (master) або /my (client)
```

### 4.4 Middleware захист маршрутів

**Файл:** `src/middleware.ts` (ОБОВ'ЯЗКОВО — Next.js ігнорує proxy.ts!)
**Функція:** `export function middleware(request: NextRequest)` (НЕ `proxy`)

Захищає:
- `/dashboard/**` — тільки майстри
- `/my/**` — тільки авторизовані клієнти

---

## 5. МАРШРУТИ ДОДАТКУ

| Шлях | Тип | Опис |
|------|-----|------|
| `/` | Server | Landing page |
| `/[slug]` | Server | Публічна сторінка майстра |
| `/explore` | Server | Каталог майстрів |
| `/login` | Client | Вхід |
| `/register` | Client | Реєстрація (3 кроки) |
| `/invite/[code]` | Server | Реферальний лендінг |
| `/dashboard` | Server | Головна панель майстра |
| `/dashboard/bookings` | Client | Записи (день/тиждень/місяць) |
| `/dashboard/services` | Client | Послуги CRUD + reorder |
| `/dashboard/products` | Client | Товари CRUD |
| `/dashboard/clients` | Client | CRM клієнтів |
| `/dashboard/analytics` | Client | Аналітика (Pro) |
| `/dashboard/flash` | Client | Flash-акції |
| `/dashboard/pricing` | Client | Динамічне ціноутворення |
| `/dashboard/settings` | Client | Налаштування + billing |
| `/my/bookings` | Client | Записи клієнта |
| `/my/invite` | Client | Реферальне запрошення |

---

## 6. ДИЗАЙН-СИСТЕМА

### 6.1 Кольори

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

### 6.2 Типографіка

- **Body:** Inter (cyrillic subset)
- **Display/Headings:** Playfair Display (cyrillic subset)
- CSS-класи: `.display-xl`, `.display-lg`, `.display-md`, `.heading-serif`, `.font-display`

### 6.3 Компоненти

- **Card radius:** 24px | **Button radius:** 16px | **Input radius:** 12px
- **Bento cards:** `.bento-card` (backdrop-blur, border, shadow, 24px radius)
- **Blob background:** peach + sage + cream blobs, `z-index: -1`
- **Grain overlay:** `position: fixed`, `z-index: 9999`, `opacity: 0.03`
- **Всі анімації:** `will-change: transform` для GPU-прискорення

### 6.4 Tailwind CSS v4

```css
/* globals.css — правильний синтаксис */
@import "tailwindcss";

/* Кастомні токени через @theme */
@theme {
  --color-peach: #FFD2C2;
  --color-sage: #789A99;
}
```

**Немає** `tailwind.config.ts` — тільки CSS-конфіг.

### 6.5 Mood Themes

Публічна сторінка майстра підтримує теми: `classic`, `dark`, `rose-gold`, `mint`.
Тема обирається в налаштуваннях і зберігається в `master_profiles.theme`.

---

## 7. БІЗНЕС-ЛОГІКА

### 7.1 Тарифи

| Функція | Starter (0₴) | Pro (349₴/міс) | Studio (199₴/майстер/міс) |
|---------|:---:|:---:|:---:|
| Записи на місяць | 30 | Безліміт | Безліміт |
| Аналітика | — | ✓ | ✓ |
| CRM + VIP | Базово | Повний | Повний |
| CSV-експорт | — | ✓ | ✓ |
| Flash-акції | 2/міс | Безліміт | Безліміт |
| Реактивація | — | ✓ | ✓ |
| Без вотермарки | — | ✓ | ✓ |
| Мультимайстер | — | — | ✓ |

### 7.2 Ліміт записів (Starter)

```typescript
// При створенні нового запису в BookingFlow
if (bookingsThisMonth >= 30 && tier === 'starter') {
  // Показати locked state з CTA "Перейти на Pro"
}
```

`bookings_this_month` скидається 1-го числа щомісяця cron-джобом.

### 7.3 Динамічне ціноутворення

```typescript
interface PricingRules {
  peakHours: { start: string; end: string; multiplier: number }[];
  lastMinute: { hoursThreshold: number; discount: number };
  earlyBird: { daysThreshold: number; discount: number };
}
```

Зберігається в `master_profiles.pricing_rules` (jsonb).
Редагується на `/dashboard/pricing` → `DynamicPricingPage`.

### 7.4 Комісія з продажів товарів

```typescript
// При status → 'completed'
const productTotal = booking_products.reduce((sum, p) => sum + p.product_price * p.quantity, 0);
const commission = productTotal * master.commission_rate;  // default 5%
```

### 7.5 Multi-service бронювання

- Клієнт може обрати кілька послуг в BookingFlow (checkboxes)
- `totalDuration` = сума тривалостей, перевірка consecutive slots
- `total_price` записується в копійках

### 7.6 Відпустки / Виключення графіку

- Таблиця `schedule_exceptions` — майстер може заблокувати окремі дати
- BookingFlow завантажує `blockedDates` при відкритті
- Заблоковані дати disabled в date strip

---

## 8. НОТИФІКАЦІЇ

### 8.1 Таблиця тригерів

| Тип | Отримувач | Тригер | Канали |
|-----|-----------|--------|--------|
| Новий запис | Майстер | Клієнт забронював | Push + Telegram |
| Підтвердження | Клієнт | Майстер підтвердив | Push + Telegram |
| Нагадування 24г | Клієнт | 24 год до запису | Push + Telegram |
| Нагадування 1г | Клієнт | 1 год до запису | Push |
| Скасування | Обидва | Одна сторона скасувала | Push + Telegram |
| Реактивація | Клієнт | 30 днів без запису (Pro) | Telegram |
| Після візиту | Клієнт | +2 год після завершення | Push (запит відгуку) |
| Flash-акція | Клієнти майстра | Майстер створив акцію | Push + Telegram |

### 8.2 Telegram Bot

- Бот: однобічна комунікація (бот → юзер)
- Підключення: `/start [user_id]` → зберігає `telegram_chat_id`
- **Увага:** `master_profiles.telegram_chat_id` — для нотифікацій майстру; `profiles.telegram_chat_id` — для нотифікацій клієнту. Це різні поля в різних таблицях!
- Усі рядки екрануються через `escHtml()` перед вставкою в HTML-шаблон

```typescript
// lib/telegram.ts
function escHtml(s: string): string {
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
```

### 8.3 Web Push

- VAPID-ключі в env (`NEXT_PUBLIC_VAPID_KEY`, `VAPID_PRIVATE_KEY`)
- Підписки зберігаються в `push_subscriptions`
- `broadcastPush()` в `lib/push.ts` — batch-відправка масиву підписників

### 8.4 Cron Jobs

| Джоб | Розклад | Дія |
|------|---------|-----|
| reminders-24h | `0 * * * *` | Нагадування за 24г |
| reminders-1h | `*/15 * * * *` | Нагадування за 1г |
| reactivation | `0 10 * * *` | Реактивація зниклих (Pro) |
| reset-monthly | `0 0 1 * *` | Скидання `bookings_this_month` |
| rebooking | `0 12 * * *` | Нагадування повторного запису |

**Безпека cron:** `CRON_SECRET` обов'язковий, перевіряється завжди:
```typescript
if (req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}
```

---

## 9. ПЛАТЕЖІ

### 9.1 WayForPay (основний)

```typescript
// Підписка
orderRef = `sub_${masterId}_${Date.now()}`
prices = { pro: 349, studio: mastersCount * 199 }

// Підпис (HMAC-MD5)
signature = HMAC_MD5(secretKey, merchantAccount + ';' + domain + ';' + orderRef + ';' + ... )
```

Webhook: `POST /api/billing/webhook`
- Перевірка підпису WayForPay
- `transactionStatus === 'Approved'` → оновити `subscription_tier` + `subscription_expires_at`
- **Використовувати `createAdminClient()`** — webhook не має cookies, `createClient()` не спрацює

### 9.2 Monobank (альтернатива)

Webhook: `POST /api/billing/mono-webhook`
- Ed25519 верифікація підпису через публічний ключ Monobank (кешується в пам'яті)
- `reference` формат: `bookit_pro_${masterId}` або `bookit_studio_${masterId}`

```typescript
async function verifyMonoSignature(rawBody: string, xSign: string): Promise<boolean> {
  const pubKey = crypto.createPublicKey({ key: Buffer.from(pubKeyBase64, 'base64'), format: 'der', type: 'spki' });
  return crypto.verify(null, Buffer.from(rawBody), pubKey, Buffer.from(xSign, 'base64'));
}
```

---

## 10. API ENDPOINTS

### Auth

| Method | Path | Опис |
|--------|------|------|
| POST | `/api/auth/send-sms` | Відправити OTP код |
| POST | `/api/auth/verify-sms` | Перевірити OTP → magiclink token |
| POST | `/api/auth/link-booking` | Прив'язати booking до юзера після auth |

### Push

| Method | Path | Опис |
|--------|------|------|
| POST | `/api/push/subscribe` | Зберегти push підписку |
| DELETE | `/api/push/subscribe` | Видалити push підписку |

### Billing

| Method | Path | Опис |
|--------|------|------|
| POST | `/api/billing/create-invoice` | Ініціювати платіж WayForPay |
| POST | `/api/billing/webhook` | Webhook WayForPay |
| POST | `/api/billing/mono-webhook` | Webhook Monobank |

### Cron

| Method | Path | Auth |
|--------|------|------|
| GET | `/api/cron/reminders` | CRON_SECRET |
| GET | `/api/cron/reset-monthly` | CRON_SECRET |
| GET | `/api/cron/rebooking` | CRON_SECRET |

### Upload

| Method | Path | Опис |
|--------|------|------|
| POST | `/api/upload` | Завантаження зображень (avatar, services, products) |

---

## 11. SUPABASE ADMIN CLIENT

**Завжди** використовувати singleton-імпорт:

```typescript
import { createAdminClient } from '@/lib/supabase/admin';
// ...
const admin = createAdminClient();
```

**Ніколи** не створювати inline:
```typescript
// ❌ НЕПРАВИЛЬНО — не робити так:
import { createClient as createAdmin } from '@supabase/supabase-js';
const admin = createAdmin(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
```

Admin client використовується в:
- Server Actions (`actions.ts`)
- API route handlers (webhook, cron)
- Будь-де де потрібен bypass RLS

---

## 12. РЕФЕРАЛЬНА СИСТЕМА

### 12.1 Клієнт запрошує майстра (`/my/invite`)

1. Клієнт генерує `invite_code` → посилання `bookit.com.ua/invite/[code]`
2. Повідомлення: "Привіт! Я записуюсь через Bookit... bookit.com.ua/invite/[code]"

### 12.2 Реферальний лендінг (`/invite/[code]`)

- Персоналізована сторінка: "Оксана та ще 3 клієнти вже чекають на тебе"
- Boosted Start бонуси при реєстрації:
  - 50 записів/міс (замість 30) на 3 місяці
  - Ексклюзивна тема Rose Gold

### 12.3 Після реєстрації через реферал

1. Додати клієнтів в `client_master_relations`
2. Нотифікація клієнтам: "Марія тепер у Bookit!"
3. `referrals.status = 'registered'`
4. Інкремент `client_profiles.total_masters_invited`
5. Ambassador levels: 1 invited → level 0, 3 → level 1, 5 → level 2

---

## 13. FLASH-АКЦІЇ

- Майстер створює акцію: послуга + слот + знижка (10-50%) + TTL (2/4/8 год)
- Автоматично розсилається push + Telegram всім клієнтам майстра, хто мав completed бронювання
- **Starter:** 2 акції/місяць. Pro/Studio: безліміт
- Скасування змінює `status → 'expired'`

---

## 14. PWA

### manifest.json

```json
{
  "name": "Bookit — Онлайн запис",
  "short_name": "Bookit",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#FFD2C2",
  "theme_color": "#789A99",
  "orientation": "portrait",
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png" },
    { "src": "/icons/icon-maskable-512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
  ]
}
```

### Service Worker стратегії

| Ресурс | Стратегія |
|--------|-----------|
| Публічні сторінки | Cache First |
| Dashboard | Network First |
| Статика (CSS/JS/img) | Stale While Revalidate |
| API запити | Network Only |

---

## 15. БЕЗПЕКА — ВИПРАВЛЕНІ ВРАЗЛИВОСТІ

### Критичні (виправлено)

1. **Витік пароля в SMS-відповіді** — `verify-sms` повертав останні 16 символів SERVICE_ROLE_KEY як пароль. Виправлено: `generateLink({ type: 'magiclink' })` → повертає одноразовий token.

2. **Middleware не працював** — `src/proxy.ts` з `export function proxy` ніколи не виконувався Next.js. Виправлено: `src/middleware.ts` з `export function middleware`.

3. **WayForPay webhook** — використовував `createClient()` (потрібні cookies), тихо падав. Виправлено: `createAdminClient()`.

4. **Monobank webhook без верифікації** — будь-хто міг активувати Pro безкоштовно POST-запитом. Виправлено: Ed25519 верифікація.

5. **OTP brute-force** — необмежена кількість спроб. Виправлено: таблиця `sms_verify_attempts`, ліміт 5 спроб / 10 хв.

6. **Cron ендпоінти без auth** — `if (cronSecret) { check }` пропускав auth якщо env не задано. Виправлено: завжди перевіряємо.

7. **HTML-ін'єкція в Telegram** — user-supplied strings без екранування в `<b>`, `<a>` тегах. Виправлено: `escHtml()`.

8. **Неавторизований відгук** — `submitReview` приймав `master_id` від клієнта. Виправлено: `master_id` береться з БД.

### Середні (виправлено)

- `telegram_chat_id` майстра зберігався в `profiles`, а читався з `master_profiles` → нотифікації не надходили. Виправлено: поле в `master_profiles`.
- `Math.random()` для генерації referral code та studio invite token → `crypto.getRandomValues()`.
- Дублювання admin client у 10+ файлах → єдиний `createAdminClient` імпорт.
- Debug console.log з OTP-кодами та user ID → видалено.

---

## 16. МІГРАЦІЇ

| Файл | Опис |
|------|------|
| `supabase/migrations/001_...` | Початкова схема |
| `supabase/migrations/016_sms_verify_attempts.sql` | Таблиця для rate-limiting OTP |
| `supabase/migrations/017_master_telegram_chat_id.sql` | Поле telegram_chat_id у master_profiles |

```sql
-- 016
CREATE TABLE IF NOT EXISTS sms_verify_attempts (
  id         bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  phone      text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE sms_otps ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();

-- 017
ALTER TABLE master_profiles ADD COLUMN IF NOT EXISTS telegram_chat_id TEXT;
```

---

## 17. ЧЕКЛИСТ ПЕРЕД ДЕПЛОЄМ

- [ ] Всі RLS policies активні
- [ ] Ліміти Starter перевірені (30 записів/міс, 2 flash-акції/міс)
- [ ] `src/middleware.ts` — функція `middleware` (не `proxy`)
- [ ] WayForPay + Monobank webhooks верифікують підпис
- [ ] `CRON_SECRET` заданий в env, всі cron routes перевіряють
- [ ] OTP rate-limiting активний (migration 016)
- [ ] `master_profiles.telegram_chat_id` існує (migration 017)
- [ ] Жодного `console.log` з чутливими даними
- [ ] `createAdminClient()` використовується скрізь (не inline)
- [ ] PWA manifest валідний
- [ ] SEO мета-теги на публічних сторінках (`/[slug]`, `/explore`)
- [ ] Mobile responsive на всіх екранах
- [ ] Lighthouse score > 90 (Performance, Accessibility)
- [ ] Grain overlay не лагає на бюджетних пристроях
- [ ] Всі анімації мають `will-change: transform`
- [ ] Error boundaries на всіх клієнтських компонентах
