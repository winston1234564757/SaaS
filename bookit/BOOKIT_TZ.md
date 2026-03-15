# BOOKIT — Технічне завдання (Technical Specification)

> **Версія:** 1.0
> **Дата:** 07.03.2026
> **Статус:** MVP Phase 1

---

## ЗМІСТ

1. [Огляд проекту](#1-огляд-проекту)
2. [Технічний стек](#2-технічний-стек)
3. [Архітектура проекту](#3-архітектура-проекту)
4. [База даних (Supabase Schema)](#4-база-даних)
5. [Автентифікація та ролі](#5-автентифікація-та-ролі)
6. [Маршрутизація (Routes)](#6-маршрутизація)
7. [Дизайн-система](#7-дизайн-система)
8. [Екрани та компоненти — Майстер](#8-екрани-майстра)
9. [Екрани та компоненти — Клієнт](#9-екрани-клієнта)
10. [Екрани — Публічна сторінка](#10-публічна-сторінка)
11. [Бізнес-логіка](#11-бізнес-логіка)
12. [Реферальна система](#12-реферальна-система)
13. [Нотифікації та тригери](#13-нотифікації)
14. [PWA конфігурація](#14-pwa)
15. [Платіжна інтеграція](#15-платежі)
16. [API Endpoints](#16-api-endpoints)
17. [MVP Scope та пріоритети](#17-mvp-scope)

---

## 1. ОГЛЯД ПРОЕКТУ

### Що це
**Bookit** — Ukrainian SaaS-платформа для онлайн-запису клієнтів у б'юті-індустрії.

### Позиціонування
"Твій розумний link in bio, який заробляє гроші"

### Ключовий диференціатор
Інтегровані продукти + послуги в одному чеку. Жоден український конкурент цього не робить.

### Growth Engine
Двосторонній viral loop: майстер → клієнти → нові майстри. Кожен клієнт може запросити своїх інших майстрів на платформу.

### Цільова аудиторія (MVP)
Соло б'юті-майстри: нігті, волосся, брови/вії, макіяж, барбери.

### Монетизація

| Тариф | Ціна | Що включено |
|-------|------|-------------|
| **Starter** | 0 ₴ | До 30 записів/міс, базова публічна сторінка, водяний знак Bookit |
| **Pro** | 349 ₴/міс | Необмежено записів, аналітика, власний брендинг, автоповідомлення, CRM-тригери |
| **Studio** | 199 ₴/майстер/міс | Мін. 2 майстри, зведена аналітика, мультилокації (Phase 2) |
| **Комісія** | 3-5% | З кожного проданого товару/абонементу через платформу |

---

## 2. ТЕХНІЧНИЙ СТЕК

### Frontend
- **Framework:** Next.js 14+ (App Router)
- **Мова:** TypeScript (strict mode)
- **Стилі:** Tailwind CSS 4+
- **Анімації:** Framer Motion
- **Стан:** Zustand (глобальний) + React Query / TanStack Query (серверний стан)
- **Форми:** React Hook Form + Zod (валідація)
- **Іконки:** Lucide React
- **Drag & Drop:** @dnd-kit/core

### Backend
- **БД + Auth + Storage + Realtime:** Supabase
- **ORM:** Supabase JS Client (не Prisma — нативна інтеграція)
- **API:** Next.js API Routes (Route Handlers) + Supabase Edge Functions (для webhook/cron)
- **Черги/Cron:** Supabase pg_cron для автоматичних тригерів

### Інфраструктура
- **Хостинг:** Vercel
- **CDN/Images:** Supabase Storage + Next.js Image Optimization
- **Домен:** bookit.com.ua
- **PWA:** next-pwa
- **Платежі:** WayForPay API
- **SMS/Telegram:** Telegram Bot API для нотифікацій

### Ключові принципи
- **Mobile First** — все проектується спочатку під мобільний екран
- **Server Components за замовчуванням** — `"use client"` тільки де потрібна інтерактивність
- **Optimistic Updates** — UI оновлюється миттєво, сервер синхронізується у фоні
- **Edge-first** — максимум логіки на Edge для швидкості

---

## 3. АРХІТЕКТУРА ПРОЕКТУ

### Структура директорій

```
bookit/
├── public/
│   ├── manifest.json          # PWA manifest
│   ├── sw.js                  # Service Worker
│   ├── icons/                 # PWA icons
│   └── fonts/                 # Inter / Geist
│
├── src/
│   ├── app/                   # Next.js App Router
│   │   ├── (auth)/            # Route group: auth pages
│   │   │   ├── login/
│   │   │   ├── register/
│   │   │   └── layout.tsx
│   │   │
│   │   ├── (master)/          # Route group: master dashboard
│   │   │   ├── dashboard/
│   │   │   │   └── page.tsx   # Головний dashboard
│   │   │   ├── bookings/
│   │   │   │   └── page.tsx   # Управління записами
│   │   │   ├── services/
│   │   │   │   └── page.tsx   # Каталог послуг
│   │   │   ├── products/
│   │   │   │   └── page.tsx   # Каталог товарів
│   │   │   ├── clients/
│   │   │   │   └── page.tsx   # CRM / Клієнтська база
│   │   │   ├── analytics/
│   │   │   │   └── page.tsx   # Аналітика (Pro)
│   │   │   ├── settings/
│   │   │   │   └── page.tsx   # Налаштування
│   │   │   └── layout.tsx     # Dashboard layout з sidebar
│   │   │
│   │   ├── (client)/          # Route group: client app
│   │   │   ├── my/
│   │   │   │   ├── bookings/  # Мої записи
│   │   │   │   ├── masters/   # Мої майстри
│   │   │   │   ├── loyalty/   # Програми лояльності
│   │   │   │   └── profile/   # Профіль клієнта
│   │   │   └── layout.tsx
│   │   │
│   │   ├── [slug]/            # Публічна сторінка майстра
│   │   │   └── page.tsx       # bookit.com.ua/anna.nails
│   │   │
│   │   ├── invite/
│   │   │   └── [code]/        # Реферальне посилання
│   │   │       └── page.tsx
│   │   │
│   │   ├── api/               # API Route Handlers
│   │   │   ├── bookings/
│   │   │   ├── payments/
│   │   │   │   └── webhook/   # WayForPay callback
│   │   │   ├── notifications/
│   │   │   └── upload/
│   │   │
│   │   ├── layout.tsx         # Root layout
│   │   ├── page.tsx           # Landing page
│   │   └── globals.css
│   │
│   ├── components/
│   │   ├── ui/                # Базові UI компоненти (design system)
│   │   │   ├── Button.tsx
│   │   │   ├── Card.tsx       # Bento Card з Mica effect
│   │   │   ├── Input.tsx
│   │   │   ├── BottomSheet.tsx
│   │   │   ├── DynamicIsland.tsx
│   │   │   ├── Calendar.tsx
│   │   │   ├── TimeSlotPicker.tsx
│   │   │   ├── Toggle.tsx
│   │   │   ├── Badge.tsx
│   │   │   ├── Sparkline.tsx
│   │   │   └── MoodThemeProvider.tsx
│   │   │
│   │   ├── master/            # Компоненти для майстра
│   │   │   ├── BookingCard.tsx
│   │   │   ├── WeeklyOverview.tsx
│   │   │   ├── ServiceEditor.tsx
│   │   │   ├── ProductEditor.tsx
│   │   │   ├── ClientCard.tsx
│   │   │   ├── SmartSlotSuggestion.tsx
│   │   │   ├── OnboardingBlock.tsx
│   │   │   └── RevenueWidget.tsx
│   │   │
│   │   ├── client/            # Компоненти для клієнта
│   │   │   ├── BookingTimeline.tsx
│   │   │   ├── MasterCard.tsx
│   │   │   ├── LoyaltyProgress.tsx
│   │   │   └── InviteMasterCTA.tsx
│   │   │
│   │   ├── public/            # Компоненти публічної сторінки
│   │   │   ├── MasterProfile.tsx
│   │   │   ├── ServiceGrid.tsx
│   │   │   ├── ProductCarousel.tsx
│   │   │   ├── BookingFlow.tsx
│   │   │   ├── CheckoutCard.tsx
│   │   │   └── DynamicIslandCTA.tsx
│   │   │
│   │   └── shared/            # Спільні компоненти
│   │       ├── Navigation.tsx
│   │       ├── FloatingSidebar.tsx
│   │       ├── NotificationBell.tsx
│   │       ├── ShareSheet.tsx
│   │       └── EmptyState.tsx
│   │
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts      # Browser client
│   │   │   ├── server.ts      # Server client
│   │   │   ├── admin.ts       # Admin/service role client
│   │   │   └── middleware.ts   # Auth middleware
│   │   │
│   │   ├── wayfopay/
│   │   │   └── client.ts      # WayForPay integration
│   │   │
│   │   ├── telegram/
│   │   │   └── bot.ts         # Telegram Bot API
│   │   │
│   │   ├── utils/
│   │   │   ├── dates.ts       # date-fns helpers
│   │   │   ├── slug.ts        # Transliteration UA→EN
│   │   │   ├── currency.ts    # Formatting ₴
│   │   │   └── smartSlots.ts  # Smart Slot Suggestions algorithm
│   │   │
│   │   └── constants/
│   │       ├── themes.ts      # Mood Themes definitions
│   │       └── categories.ts  # Service categories
│   │
│   ├── hooks/
│   │   ├── useBookings.ts
│   │   ├── useServices.ts
│   │   ├── useClients.ts
│   │   ├── useAnalytics.ts
│   │   ├── useRealtime.ts     # Supabase Realtime subscriptions
│   │   └── useSwipeActions.ts
│   │
│   ├── stores/
│   │   ├── authStore.ts       # Zustand: auth state
│   │   ├── bookingStore.ts    # Zustand: active booking flow
│   │   └── uiStore.ts        # Zustand: UI state (sheets, modals)
│   │
│   └── types/
│       ├── database.ts        # Auto-generated Supabase types
│       ├── booking.ts
│       ├── service.ts
│       ├── product.ts
│       └── user.ts
│
├── supabase/
│   ├── migrations/            # SQL migrations
│   ├── functions/             # Edge Functions
│   │   ├── send-notification/ # Telegram/push notifications
│   │   ├── cron-reminders/    # Scheduled reminders
│   │   └── wayfopay-webhook/  # Payment processing
│   └── seed.sql               # Dev seed data
│
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
├── package.json
└── .env.local
```

---

## 4. БАЗА ДАНИХ

### Supabase PostgreSQL Schema

```sql
-- ============================================
-- ENUMS
-- ============================================

CREATE TYPE user_role AS ENUM ('master', 'client', 'admin');
CREATE TYPE booking_status AS ENUM ('pending', 'confirmed', 'completed', 'cancelled', 'no_show');
CREATE TYPE subscription_tier AS ENUM ('starter', 'pro', 'studio');
CREATE TYPE day_of_week AS ENUM ('mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun');
CREATE TYPE notification_channel AS ENUM ('push', 'telegram', 'sms');
CREATE TYPE referral_status AS ENUM ('pending', 'registered', 'activated');

-- ============================================
-- USERS & PROFILES
-- ============================================

-- Основна таблиця профілів (розширює Supabase Auth)
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role user_role NOT NULL DEFAULT 'client',
    full_name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    avatar_url TEXT,
    telegram_chat_id TEXT,                -- Для Telegram нотифікацій
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Профіль майстра (додаткові поля)
CREATE TABLE master_profiles (
    id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
    slug TEXT UNIQUE NOT NULL,            -- bookit.com.ua/[slug]
    business_name TEXT,                   -- Назва бізнесу (опціонально)
    bio TEXT,                             -- Короткий опис (до 300 символів)
    categories TEXT[] DEFAULT '{}',       -- ['nails', 'brows', 'hair', ...]
    mood_theme TEXT DEFAULT 'default',    -- Тема публічної сторінки
    accent_color TEXT DEFAULT '#006FFD',  -- Кастомний колір акценту
    subscription_tier subscription_tier DEFAULT 'starter',
    subscription_expires_at TIMESTAMPTZ,
    bookings_this_month INT DEFAULT 0,
    commission_rate DECIMAL(3,2) DEFAULT 0.05, -- 5% комісія з товарів
    rating DECIMAL(2,1) DEFAULT 0.0,
    rating_count INT DEFAULT 0,
    is_published BOOLEAN DEFAULT false,   -- Публічна сторінка активна?
    address TEXT,
    city TEXT,
    latitude DECIMAL(10,7),
    longitude DECIMAL(10,7),
    instagram_url TEXT,
    telegram_url TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Клієнтський профіль (додаткові поля)
CREATE TABLE client_profiles (
    id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
    referral_code TEXT UNIQUE,            -- Унікальний реферальний код клієнта
    ambassador_level INT DEFAULT 0,       -- 0=звичайний, 1=активний, 2=амбасадор
    total_bookings INT DEFAULT 0,
    total_masters_invited INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- ПОСЛУГИ ТА ТОВАРИ
-- ============================================

-- Категорії послуг майстра
CREATE TABLE service_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    master_id UUID NOT NULL REFERENCES master_profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,                   -- "Манікюр", "Педикюр", "Дизайн"
    sort_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Послуги
CREATE TABLE services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    master_id UUID NOT NULL REFERENCES master_profiles(id) ON DELETE CASCADE,
    category_id UUID REFERENCES service_categories(id) ON DELETE SET NULL,
    name TEXT NOT NULL,                   -- "Класичний манікюр"
    description TEXT,
    duration_minutes INT NOT NULL,        -- Тривалість у хвилинах
    buffer_minutes INT DEFAULT 0,         -- Час на підготовку після послуги
    price DECIMAL(10,2) NOT NULL,         -- Ціна в гривнях
    price_max DECIMAL(10,2),              -- Макс. ціна (якщо діапазон: "від 500 до 800")
    image_url TEXT,
    is_active BOOLEAN DEFAULT true,
    is_popular BOOLEAN DEFAULT false,     -- Показувати більшою карткою
    sort_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Товари (продукти)
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    master_id UUID NOT NULL REFERENCES master_profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,                   -- "Олія для кутикули"
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    image_url TEXT,
    stock_quantity INT DEFAULT 0,         -- Залишок на складі
    is_active BOOLEAN DEFAULT true,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Зв'язок товарів з послугами (рекомендації)
CREATE TABLE product_service_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
    is_auto_suggest BOOLEAN DEFAULT true, -- Автоматично пропонувати при бронюванні
    UNIQUE(product_id, service_id)
);

-- ============================================
-- РОЗКЛАД РОБОТИ
-- ============================================

-- Шаблон розкладу (тижневий)
CREATE TABLE schedule_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    master_id UUID NOT NULL REFERENCES master_profiles(id) ON DELETE CASCADE,
    day_of_week day_of_week NOT NULL,
    start_time TIME NOT NULL,             -- "09:00"
    end_time TIME NOT NULL,               -- "18:00"
    break_start TIME,                     -- "13:00" (обідня перерва)
    break_end TIME,                       -- "14:00"
    is_working BOOLEAN DEFAULT true,
    UNIQUE(master_id, day_of_week)
);

-- Виключення з розкладу (вихідні, свята, зміни)
CREATE TABLE schedule_exceptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    master_id UUID NOT NULL REFERENCES master_profiles(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    is_day_off BOOLEAN DEFAULT true,      -- true = вихідний, false = змінений графік
    start_time TIME,                      -- Якщо is_day_off=false — новий час
    end_time TIME,
    reason TEXT,                          -- "Свято" / "Відпустка"
    UNIQUE(master_id, date)
);

-- ============================================
-- БРОНЮВАННЯ
-- ============================================

-- Основна таблиця записів
CREATE TABLE bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    master_id UUID NOT NULL REFERENCES master_profiles(id) ON DELETE CASCADE,
    client_id UUID REFERENCES client_profiles(id) ON DELETE SET NULL,

    -- Дані клієнта (якщо без реєстрації)
    client_name TEXT NOT NULL,
    client_phone TEXT NOT NULL,
    client_email TEXT,

    -- Час запису
    date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,               -- Автоматично: start_time + сума duration всіх послуг + buffers

    -- Статус
    status booking_status DEFAULT 'pending',
    status_changed_at TIMESTAMPTZ,

    -- Фінанси
    total_services_price DECIMAL(10,2) DEFAULT 0,
    total_products_price DECIMAL(10,2) DEFAULT 0,
    total_price DECIMAL(10,2) DEFAULT 0,
    deposit_amount DECIMAL(10,2) DEFAULT 0,
    deposit_paid BOOLEAN DEFAULT false,
    commission_amount DECIMAL(10,2) DEFAULT 0,  -- Комісія Bookit з товарів

    -- Метадані
    notes TEXT,                           -- Коментар клієнта
    master_notes TEXT,                    -- Приватні нотатки майстра
    source TEXT DEFAULT 'public_page',    -- 'public_page', 'direct_link', 'referral', 'manual'
    cancellation_reason TEXT,

    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Послуги в бронюванні (many-to-many)
CREATE TABLE booking_services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    service_id UUID NOT NULL REFERENCES services(id) ON DELETE SET NULL,
    service_name TEXT NOT NULL,            -- Збережена копія назви на момент бронювання
    service_price DECIMAL(10,2) NOT NULL,  -- Збережена копія ціни
    duration_minutes INT NOT NULL
);

-- Товари в бронюванні
CREATE TABLE booking_products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE SET NULL,
    product_name TEXT NOT NULL,            -- Збережена копія
    product_price DECIMAL(10,2) NOT NULL,  -- Збережена копія
    quantity INT DEFAULT 1
);

-- ============================================
-- CRM & ВІДНОСИНИ
-- ============================================

-- Зв'язок клієнт ↔ майстер
CREATE TABLE client_master_relations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES client_profiles(id) ON DELETE CASCADE,
    master_id UUID NOT NULL REFERENCES master_profiles(id) ON DELETE CASCADE,
    total_visits INT DEFAULT 0,
    total_spent DECIMAL(10,2) DEFAULT 0,
    average_check DECIMAL(10,2) DEFAULT 0,
    last_visit_at TIMESTAMPTZ,
    favorite_service_id UUID REFERENCES services(id) ON DELETE SET NULL,
    is_vip BOOLEAN DEFAULT false,          -- Мітка VIP від майстра
    client_tag TEXT,                        -- Кастомна мітка ("Алергія на гель", "Завжди спізнюється")
    loyalty_points INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(client_id, master_id)
);

-- ============================================
-- РЕФЕРАЛЬНА СИСТЕМА
-- ============================================

-- Запрошення майстра від клієнта
CREATE TABLE referrals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    inviter_client_id UUID NOT NULL REFERENCES client_profiles(id) ON DELETE CASCADE,
    invite_code TEXT UNIQUE NOT NULL,       -- Унікальний код запрошення
    invite_link TEXT NOT NULL,              -- bookit.com.ua/invite/[code]
    invited_master_id UUID REFERENCES master_profiles(id), -- NULL поки не зареєструвався
    status referral_status DEFAULT 'pending',
    message TEXT,                           -- Персоналізоване повідомлення
    waiting_clients_count INT DEFAULT 1,    -- Скільки клієнтів чекають цього майстра
    registered_at TIMESTAMPTZ,
    activated_at TIMESTAMPTZ,              -- Коли майстер прийняв першого клієнта
    created_at TIMESTAMPTZ DEFAULT now()
);

-- "Boosted Start" бонуси для запрошених майстрів
CREATE TABLE referral_bonuses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    master_id UUID NOT NULL REFERENCES master_profiles(id) ON DELETE CASCADE,
    referral_id UUID NOT NULL REFERENCES referrals(id) ON DELETE CASCADE,
    bonus_type TEXT NOT NULL,              -- 'extended_limit', 'premium_theme', 'pre_loaded_clients'
    bonus_value TEXT,                      -- '50' (записів), 'theme_rose_gold', тощо
    expires_at TIMESTAMPTZ,               -- Для тимчасових бонусів
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- ПРОГРАМИ ЛОЯЛЬНОСТІ
-- ============================================

CREATE TABLE loyalty_programs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    master_id UUID NOT NULL REFERENCES master_profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,                    -- "Кожен 10-й манікюр зі знижкою"
    target_visits INT NOT NULL,            -- Кількість візитів для винагороди
    reward_type TEXT NOT NULL,             -- 'discount_percent', 'discount_fixed', 'free_service'
    reward_value DECIMAL(10,2),            -- 20 (%), 200 (₴), або NULL для free
    reward_service_id UUID REFERENCES services(id), -- Для free_service
    applicable_services UUID[],            -- Для яких послуг рахується
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- НОТИФІКАЦІЇ
-- ============================================

CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipient_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    type TEXT NOT NULL,                    -- 'booking_new', 'booking_confirmed', 'reminder_24h', 'reminder_1h', 'reactivation', 'referral_registered'
    channel notification_channel DEFAULT 'push',
    related_booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
    related_master_id UUID REFERENCES master_profiles(id),
    is_read BOOLEAN DEFAULT false,
    sent_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Шаблони автоповідомлень майстра
CREATE TABLE notification_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    master_id UUID NOT NULL REFERENCES master_profiles(id) ON DELETE CASCADE,
    trigger_type TEXT NOT NULL,            -- 'reminder_24h', 'reminder_1h', 'reactivation_30d', 'after_visit'
    channel notification_channel DEFAULT 'telegram',
    message_template TEXT NOT NULL,        -- "Привіт, {client_name}! Нагадуємо про запис..."
    is_active BOOLEAN DEFAULT true,
    delay_days INT DEFAULT 0,             -- Для reactivation: через скільки днів
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- ВІДГУКИ
-- ============================================

CREATE TABLE reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES client_profiles(id) ON DELETE CASCADE,
    master_id UUID NOT NULL REFERENCES master_profiles(id) ON DELETE CASCADE,
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    is_published BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- ПЛАТЕЖІ
-- ============================================

CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
    master_id UUID NOT NULL REFERENCES master_profiles(id),
    amount DECIMAL(10,2) NOT NULL,
    type TEXT NOT NULL,                    -- 'deposit', 'product_sale', 'subscription'
    status TEXT DEFAULT 'pending',         -- 'pending', 'success', 'failed', 'refunded'
    wayfopay_order_ref TEXT,              -- ID транзакції WayForPay
    wayfopay_response JSONB,             -- Повна відповідь WayForPay
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Підписки
CREATE TABLE subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    master_id UUID NOT NULL REFERENCES master_profiles(id) ON DELETE CASCADE,
    tier subscription_tier NOT NULL,
    starts_at TIMESTAMPTZ NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    is_auto_renew BOOLEAN DEFAULT true,
    payment_id UUID REFERENCES payments(id),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX idx_bookings_master_date ON bookings(master_id, date);
CREATE INDEX idx_bookings_client ON bookings(client_id);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_services_master ON services(master_id);
CREATE INDEX idx_products_master ON products(master_id);
CREATE INDEX idx_client_master_relations ON client_master_relations(client_id, master_id);
CREATE INDEX idx_master_slug ON master_profiles(slug);
CREATE INDEX idx_referrals_code ON referrals(invite_code);
CREATE INDEX idx_notifications_recipient ON notifications(recipient_id, is_read);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE master_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_master_relations ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Приклади RLS Policies:

-- Profiles: кожен бачить свій профіль
CREATE POLICY "Users can view own profile"
    ON profiles FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
    ON profiles FOR UPDATE USING (auth.uid() = id);

-- Master profiles: публічні для всіх (для публічної сторінки), редагування — тільки власник
CREATE POLICY "Public master profiles"
    ON master_profiles FOR SELECT USING (is_published = true OR auth.uid() = id);

CREATE POLICY "Masters can update own profile"
    ON master_profiles FOR UPDATE USING (auth.uid() = id);

-- Services: публічні для всіх активних, редагування — тільки майстер
CREATE POLICY "Public active services"
    ON services FOR SELECT USING (
        is_active = true OR master_id = auth.uid()
    );

CREATE POLICY "Masters manage own services"
    ON services FOR ALL USING (master_id = auth.uid());

-- Bookings: майстер бачить свої записи, клієнт бачить свої
CREATE POLICY "Master sees own bookings"
    ON bookings FOR SELECT USING (master_id = auth.uid());

CREATE POLICY "Client sees own bookings"
    ON bookings FOR SELECT USING (client_id = auth.uid());

CREATE POLICY "Clients can create bookings"
    ON bookings FOR INSERT WITH CHECK (true); -- Публічне створення

-- Notifications: тільки свої
CREATE POLICY "Users see own notifications"
    ON notifications FOR SELECT USING (recipient_id = auth.uid());
```

---

## 5. АВТЕНТИФІКАЦІЯ ТА РОЛІ

### Потоки автентифікації

#### Реєстрація майстра (3 кроки)
1. **Auth:** Supabase Auth → Google OAuth або Email/Password
2. **Profile creation:** INSERT into `profiles` (role='master') + INSERT into `master_profiles`
3. **Onboarding:** Заповнення slug, categories, bio → перехід на dashboard

#### Реєстрація клієнта (мінімальна, під час першого запису)
1. Клієнт записується → вводить ім'я + телефон (без реєстрації)
2. Після запису — пропозиція: "Створи профіль для зручності"
3. Якщо погоджується → Google OAuth або телефон (OTP через Supabase)
4. Profile creation: INSERT into `profiles` (role='client') + INSERT into `client_profiles`

#### Визначення ролі після логіну
```typescript
// middleware.ts
const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

if (profile.role === 'master') redirect('/dashboard');
if (profile.role === 'client') redirect('/my/bookings');
```

### Захист маршрутів

| Маршрут | Доступ |
|---------|--------|
| `/` | Публічний (landing) |
| `/[slug]` | Публічний (сторінка майстра) |
| `/invite/[code]` | Публічний (реферальне посилання) |
| `/register`, `/login` | Тільки неавторизовані |
| `/dashboard/**` | Тільки `role=master` |
| `/my/**` | Тільки `role=client` |
| `/api/**` | Залежить від endpoint (деталі в секції API) |

---

## 6. МАРШРУТИЗАЦІЯ

### Повна карта маршрутів

```
ПУБЛІЧНІ:
  /                              → Landing page
  /[slug]                        → Публічна сторінка майстра
  /[slug]/book                   → Прямий лінк на бронювання (optional)
  /invite/[code]                 → Реферальний лендінг

AUTH:
  /login                         → Логін (master/client)
  /register                      → Реєстрація майстра (3 кроки)
  /register/client               → Реєстрація клієнта

MASTER DASHBOARD:
  /dashboard                     → Головний dashboard (Сьогодні)
  /dashboard/bookings            → Всі записи (календар + список)
  /dashboard/bookings/[id]       → Деталі запису
  /dashboard/services            → Каталог послуг
  /dashboard/products            → Каталог товарів
  /dashboard/clients             → CRM / Клієнтська база
  /dashboard/clients/[id]        → Профіль клієнта (історія, метрики)
  /dashboard/analytics           → Аналітика (Pro)
  /dashboard/settings            → Налаштування
  /dashboard/settings/profile    → Профіль бізнесу
  /dashboard/settings/schedule   → Графік роботи
  /dashboard/settings/theme      → Mood Theme публічної сторінки
  /dashboard/settings/notifications → Автоповідомлення
  /dashboard/settings/subscription → Підписка та оплата
  /dashboard/settings/integrations → Telegram-бот, Instagram

CLIENT APP:
  /my/bookings                   → Мої записи (таймлайн)
  /my/masters                    → Мої майстри (список)
  /my/loyalty                    → Програми лояльності
  /my/profile                    → Профіль клієнта
  /my/invite                     → Запросити майстра (генерація посилань)
  /my/notifications              → Центр нотифікацій
```

---

## 7. ДИЗАЙН-СИСТЕМА

### Філософія
Максимальна легкість, тактильність інтерфейсу та модульність. Синтез Windows 11 (Mica material) та iOS 26 (Future Minimal).

### Кольори

```typescript
// lib/constants/themes.ts

export const colors = {
    // Core
    primary: '#006FFD',           // Ukrainian Electric Blue — основний акцент
    primaryLight: '#E8F1FF',
    primaryDark: '#0055CC',

    // Neutral
    background: '#F8F9FB',        // Світлий фон з теплим відтінком
    surface: 'rgba(255, 255, 255, 0.72)', // Mica-ефект: напівпрозорий білий
    surfaceHover: 'rgba(255, 255, 255, 0.85)',
    border: 'rgba(255, 255, 255, 0.5)',   // Тонка внутрішня рамка

    // Text
    textPrimary: '#1A1A2E',
    textSecondary: '#6B7280',
    textTertiary: '#9CA3AF',

    // Status
    success: '#10B981',           // Підтверджений запис
    warning: '#F59E0B',           // Очікує підтвердження
    error: '#EF4444',             // Скасований
    info: '#3B82F6',

    // Gradient Blobs (фонові)
    blobMint: 'rgba(167, 243, 208, 0.3)',
    blobLavender: 'rgba(196, 181, 253, 0.3)',
    blobBlue: 'rgba(147, 197, 253, 0.3)',
};
```

### Mood Themes (для публічних сторінок)

```typescript
export const moodThemes = {
    default: {
        name: 'Clean Blue',
        accent: '#006FFD',
        background: '#F8F9FB',
        cardBg: 'rgba(255, 255, 255, 0.72)',
        textPrimary: '#1A1A2E',
        gradient: ['#E8F1FF', '#F0F4FF'],
    },
    nudeMinimal: {
        name: 'Nude & Minimal',
        accent: '#C9A96E',
        background: '#FAF7F2',
        cardBg: 'rgba(255, 252, 247, 0.72)',
        textPrimary: '#3D3024',
        gradient: ['#F5EDE0', '#FFF8EF'],
    },
    boldGlam: {
        name: 'Bold Glam',
        accent: '#E91E8C',
        background: '#FFF5FA',
        cardBg: 'rgba(255, 245, 250, 0.72)',
        textPrimary: '#2D1A24',
        gradient: ['#FFE0F0', '#FFF0F7'],
    },
    organicEarthy: {
        name: 'Organic & Earthy',
        accent: '#7C9A5E',
        background: '#F7F9F4',
        cardBg: 'rgba(247, 249, 244, 0.72)',
        textPrimary: '#2D3A1F',
        gradient: ['#E8F0DE', '#F2F7EC'],
    },
    darkLuxe: {
        name: 'Dark Luxe',
        accent: '#D4AF37',
        background: '#1A1A2E',
        cardBg: 'rgba(30, 30, 50, 0.72)',
        textPrimary: '#F0E6D2',
        gradient: ['#232340', '#1A1A2E'],
    },
    roseGold: {
        name: 'Rose Gold',          // EXCLUSIVE: тільки через реферал (Boosted Start)
        accent: '#B76E79',
        background: '#FFF5F5',
        cardBg: 'rgba(255, 245, 245, 0.72)',
        textPrimary: '#3D2024',
        gradient: ['#FFE8E8', '#FFF0F0'],
        isExclusive: true,
    },
};
```

### Типографіка

```typescript
export const typography = {
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",

    // Scale
    displayLarge: { size: '2rem', weight: 700, lineHeight: 1.2, letterSpacing: '-0.02em' },  // 32px — великі цифри аналітики
    displayMedium: { size: '1.5rem', weight: 700, lineHeight: 1.3, letterSpacing: '-0.01em' }, // 24px — заголовки секцій
    headingLarge: { size: '1.25rem', weight: 600, lineHeight: 1.4 },  // 20px
    headingMedium: { size: '1.125rem', weight: 600, lineHeight: 1.4 }, // 18px
    bodyLarge: { size: '1rem', weight: 400, lineHeight: 1.5 },        // 16px — основний текст
    bodyMedium: { size: '0.875rem', weight: 400, lineHeight: 1.5 },   // 14px
    bodySmall: { size: '0.75rem', weight: 400, lineHeight: 1.4 },     // 12px
    label: { size: '0.75rem', weight: 500, lineHeight: 1.3, letterSpacing: '0.04em', textTransform: 'uppercase' },
};
```

### Spacing & Sizing

```typescript
export const spacing = {
    bentoGap: '12px',             // Відстань між Bento-блоками
    cardPadding: '20px',          // Внутрішній padding карток
    cardRadius: '24px',           // Радіус закруглення карток
    buttonRadius: '16px',         // Радіус кнопок
    inputRadius: '12px',          // Радіус полів вводу
    sidebarWidth: '280px',        // Ширина sidebar (desktop)
    bottomNavHeight: '72px',      // Висота нижньої навігації (mobile)
    maxContentWidth: '480px',     // Максимальна ширина контенту на публічній сторінці (mobile-first)
};
```

### Ефекти

```css
/* Mica Material — напівпрозора картка */
.bento-card {
    background: rgba(255, 255, 255, 0.72);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border: 0.5px solid rgba(255, 255, 255, 0.5);
    border-radius: 24px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
    transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.bento-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
}

/* Film Grain — м'яка текстура фону */
.grain-overlay {
    position: fixed;
    inset: 0;
    pointer-events: none;
    opacity: 0.03;
    background-image: url('/textures/grain.png');
    background-size: 200px;
    z-index: 0;
}

/* Gradient Blobs */
.blob-container {
    position: fixed;
    inset: 0;
    overflow: hidden;
    z-index: -1;
}

.blob {
    position: absolute;
    border-radius: 50%;
    filter: blur(80px);
    animation: float 20s ease-in-out infinite;
}

/* Button press — тактильне натискання */
.button-tactile:active {
    transform: scale(0.97);
    transition: transform 0.1s ease;
}

/* Elastic bounce — пружність */
@keyframes elasticBounce {
    0% { transform: scale(1); }
    30% { transform: scale(0.95); }
    50% { transform: scale(1.02); }
    100% { transform: scale(1); }
}

/* Floating Sidebar */
.floating-sidebar {
    position: fixed;
    left: 16px;
    top: 16px;
    bottom: 16px;
    width: 260px;
    background: rgba(255, 255, 255, 0.72);
    backdrop-filter: blur(24px);
    border: 0.5px solid rgba(255, 255, 255, 0.5);
    border-radius: 24px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.06);
    z-index: 40;
}
```

### Анімації (Framer Motion)

```typescript
// Стандартні анімації для компонентів

export const animations = {
    // Картка появляється
    cardEnter: {
        initial: { opacity: 0, y: 20, scale: 0.95 },
        animate: { opacity: 1, y: 0, scale: 1 },
        transition: { type: 'spring', stiffness: 300, damping: 24 },
    },

    // Bottom Sheet
    bottomSheet: {
        initial: { y: '100%' },
        animate: { y: 0 },
        exit: { y: '100%' },
        transition: { type: 'spring', stiffness: 300, damping: 30 },
    },

    // Dynamic Island expand
    dynamicIsland: {
        initial: { width: '160px', height: '48px', borderRadius: '24px' },
        expanded: { width: '100%', height: 'auto', borderRadius: '24px' },
        transition: { type: 'spring', stiffness: 200, damping: 20 },
    },

    // Tap feedback
    tapScale: {
        whileTap: { scale: 0.97 },
        transition: { type: 'spring', stiffness: 400, damping: 17 },
    },

    // Staggered children (для Bento grid)
    stagger: {
        animate: { transition: { staggerChildren: 0.05 } },
    },

    // Swipe actions on booking card
    swipe: {
        dragConstraints: { left: -120, right: 120 },
        dragElastic: 0.2,
    },
};
```

### Status System (візуальна система станів)

```typescript
export const bookingStatusConfig = {
    pending: {
        color: '#F59E0B',
        bgColor: 'rgba(245, 158, 11, 0.1)',
        icon: 'Clock',
        label: 'Очікує',
        pulse: false,
    },
    confirmed: {
        color: '#10B981',
        bgColor: 'rgba(16, 185, 129, 0.1)',
        icon: 'CheckCircle',
        label: 'Підтверджено',
        pulse: true,       // Зелений pulse для підтверджених
    },
    completed: {
        color: '#6B7280',
        bgColor: 'rgba(107, 114, 128, 0.1)',
        icon: 'CheckCheck',
        label: 'Завершено',
        pulse: false,
    },
    cancelled: {
        color: '#EF4444',
        bgColor: 'rgba(239, 68, 68, 0.1)',
        icon: 'XCircle',
        label: 'Скасовано',
        pulse: false,
        strikethrough: true,  // Перекреслений текст
    },
    no_show: {
        color: '#8B5CF6',
        bgColor: 'rgba(139, 92, 246, 0.1)',
        icon: 'UserX',
        label: 'Не прийшов',
        pulse: false,
    },
};
```

---

## 8. ЕКРАНИ МАЙСТРА — ДЕТАЛЬНА СПЕЦИФІКАЦІЯ

### 8.1 Landing Page (`/`)

**Мета:** Конвертувати відвідувача в зареєстрованого майстра за 30 секунд.

**Структура (Mobile First, один скрол):**
- **Hero:** Фраза "Твоя booking-сторінка за 2 хвилини", під нею — інтерактивний демо публічної сторінки (реальний Bento-лейаут, можна скролити). CTA кнопка: "Створити безкоштовно"
- **Social Proof:** "Вже 500+ майстрів у Bookit" + логотипи/аватарки реальних майстрів
- **3 переваги:** іконка + 1 речення кожна: "Запис за 15 секунд", "Продаж товарів прямо на сторінці", "Клієнти повертаються автоматично"
- **Pricing:** 3 тарифи в Bento-картках
- **Footer CTA:** Повтор кнопки "Створити безкоштовно"

**Технічні деталі:**
- Server Component (статична сторінка, ISR)
- Анімації при скролі через Framer Motion `useInView`
- Демо — реальний компонент `PublicPage` з mock-даними

### 8.2 Реєстрація майстра (`/register`)

**3 кроки, кожен — окремий стан одного компонента (не окремі сторінки):**

**Крок 1 — Ідентифікація:**
- Кнопка "Продовжити з Google" (Supabase Google OAuth)
- АБО: поля ім'я + email + пароль
- Progress bar: 1/3

**Крок 2 — Спеціалізація:**
- Візуальні картки-чіпси категорій: Нігті, Волосся, Брови/Вії, Макіяж, Масаж, Барбер, Інше
- Multi-select (тап = toggle)
- Progress bar: 2/3

**Крок 3 — Slug:**
- Поле з prefix `bookit.com.ua/`
- Автогенерація з імені (транслітерація: "Анна Коваленко" → "anna.kovalenko")
- Real-time перевірка доступності (debounced query до `master_profiles`)
- Прев'ю посилання
- Кнопка "Готово" → створення всіх записів у БД → redirect на `/dashboard`
- Progress bar: 3/3

**Технічні деталі:**
```typescript
// lib/utils/slug.ts
export function transliterate(text: string): string {
    const map: Record<string, string> = {
        'а': 'a', 'б': 'b', 'в': 'v', 'г': 'h', 'ґ': 'g',
        'д': 'd', 'е': 'e', 'є': 'ye', 'ж': 'zh', 'з': 'z',
        'и': 'y', 'і': 'i', 'ї': 'yi', 'й': 'y', 'к': 'k',
        'л': 'l', 'м': 'm', 'н': 'n', 'о': 'o', 'п': 'p',
        'р': 'r', 'с': 's', 'т': 't', 'у': 'u', 'ф': 'f',
        'х': 'kh', 'ц': 'ts', 'ч': 'ch', 'ш': 'sh', 'щ': 'shch',
        'ь': '', 'ю': 'yu', 'я': 'ya',
    };
    return text
        .toLowerCase()
        .split('')
        .map(char => map[char] || char)
        .join('')
        .replace(/[^a-z0-9]/g, '.')
        .replace(/\.+/g, '.')
        .replace(/^\.+|\.+$/g, '');
}
```

### 8.3 Onboarding Dashboard (порожній стан)

**Коли:** `master_profiles.is_published = false` і немає послуг.

**3 інтерактивних Bento-блоки:**

1. **"Додай першу послугу"** → Bottom Sheet:
   - Поле: Назва послуги (text, required)
   - Слайдер: Тривалість (30 / 45 / 60 / 90 / 120 хв) — дискретний
   - Поле: Ціна (number, required, format: "₴")
   - Кнопка "Зберегти"

2. **"Налаштуй графік"** → Bottom Sheet:
   - 7 toggle-рядків (Пн–Нд), кожен: toggle + час початку + час завершення
   - Дефолт: Пн-Пт увімкнені, 09:00-18:00
   - Кнопка "Зберегти"

3. **"Заповни профіль"** → Bottom Sheet:
   - Аватар (upload, crop circle)
   - Поле: Коротке bio (textarea, max 300 chars, placeholder)
   - Вибір Mood Theme: горизонтальний скрол кольорових карток-мініатюр
   - Кнопка "Зберегти"

**Промо-банер внизу:** "Твоя сторінка готова! Поділися:" + кнопка "Копіювати посилання" + "Поділитися в Stories" (генерує картку-картинку через Canvas API або SVG).

**Умова переходу в робочий режим:** коли є хоча б 1 послуга + налаштований графік → `is_published = true`.

### 8.4 Робочий Dashboard (`/dashboard`)

**Layout (Mobile):**
- Top: статус-бар з ім'ям, аватаром, кнопкою нотифікацій (бейдж)
- Content: вертикальний скрол Bento-блоків
- Bottom: навігація (5 табів: Головна, Записи, Послуги, Клієнти, Більше)

**Layout (Desktop):**
- Left: Floating Sidebar з навігацією
- Center: основний контент (Bento-сітка)
- Sidebar відсутній на мобільному — замінюється Bottom Nav

**Bento-блоки (порядок зверху вниз на mobile):**

**Блок 1 — "Сьогодні" (великий, full-width):**
- Показує поточний/наступний запис великою карткою
- Картка містить: час (великий), ім'я клієнта, послуга, статус (кольоровий бейдж)
- Swipe left → "Скасувати/Перенести" (red zone)
- Swipe right → "Клієнт прийшов" (green zone)
- Між записами: Smart Slot Suggestion ("Вікно 14:00-15:30 — зробити доступним?")
- Якщо записів на сьогодні немає: "Сьогодні вільний день" + ілюстрація

**Блок 2 — "Тижневий огляд" (full-width):**
- 7 колонок (Пн-Нд), кожна — вертикальна timeline-смужка
- Заповнені слоти — кольорові блоки (висота пропорційна тривалості)
- Порожні слоти — прозорі
- Сьогоднішній день виділений
- Тап на день → розгортається детальний розклад (Bottom Sheet)

**Блок 3 — "Очікують підтвердження" (half-width):**
- Бейдж з кількістю
- Список імен + послуг
- Тап → перехід на `/dashboard/bookings` з фільтром `status=pending`

**Блок 4 — "Дохід за тиждень" (half-width):**
- Велика цифра (суммма)
- Sparkline графік (7 точок, останні 7 днів)
- Порівняння з минулим тижнем: "+12%" зеленим або "-5%" червоним

**Блок 5 — "Швидкі дії" (full-width):**
- Горизонтальний скрол кнопок: "Додати послугу", "Блокувати час", "Поділитися сторінкою"

### 8.5 Управління записами (`/dashboard/bookings`)

**Два режими перегляду (toggle зверху): Календар / Список**

**Режим "Календар":**
- Тижневий вигляд (7 днів, горизонтальний скрол)
- Кожен день — вертикальна timeline з годинниковими мітками (8:00-21:00)
- Записи — кольорові блоки на timeline
- Тап на запис → Bottom Sheet з деталями
- Тап на порожній слот → "Створити запис вручну"

**Режим "Список":**
- Фільтри зверху: Всі / Очікують / Підтверджені / Завершені / Скасовані
- Кожен запис — картка: дата, час, клієнт, послуга, статус, сума
- Пошук по імені клієнта

**Картка запису (Bottom Sheet при тапі):**
```
┌──────────────────────────────────────┐
│ 👤 Оксана Петренко                  │
│ ⭐ Постійний клієнт • 12 візитів     │
│                                      │
│ 📅 15 лютого, 14:00 - 15:30         │
│                                      │
│ ✂️ Класичний манікюр      500 ₴      │
│ 🛒 Олія для кутикули      180 ₴      │
│ ─────────────────────────────────    │
│ Разом:                    680 ₴      │
│                                      │
│ 💬 "Хочу нюдовий колір"             │
│                                      │
│  [Підтвердити]  [Інший час]          │
│                                      │
└──────────────────────────────────────┘
```

### 8.6 Каталог послуг (`/dashboard/services`)

**Layout:**
- Табы зверху: Послуги / Товари
- Кнопка "+" (FAB) для додавання

**Послуги:**
- Групування по категоріях (drag & drop для зміни порядку категорій)
- Кожна послуга — картка: фото (опціонально), назва, ціна, тривалість, toggle "Активна"
- Drag & drop для зміни порядку (це порядок на публічній сторінці)
- Тап → ServiceEditor (Bottom Sheet):
  - Назва (text)
  - Опис (textarea, optional)
  - Категорія (select/create)
  - Тривалість (слайдер + manual input)
  - Буферний час (слайдер: 0/5/10/15/30 хв)
  - Ціна / Ціновий діапазон (toggle: "Фіксована" / "Від-до")
  - Фото (upload)
  - Toggle "Популярна" (більша картка на сторінці)
  - Кнопка "Зберегти" / "Видалити"

**Товари (аналогічно):**
- Список товарів з фото, назвою, ціною, залишком
- Тап → ProductEditor (Bottom Sheet):
  - Назва, опис, ціна, фото (обов'язкове)
  - Залишок (number)
  - Toggle "Пропонувати з послугою" → якщо ON, з'являється multi-select пов'язаних послуг
  - Кнопка "Зберегти" / "Видалити"

### 8.7 CRM — Клієнтська база (`/dashboard/clients`)

**Фільтри зверху (горизонтальний скрол чіпсів):**
- Всі | Нові (1 візит) | Постійні (3+ візити) | Зниклі (30+ днів) | VIP

**Сортування:** За останнім візитом / За витратами / Алфавітно

**Картка клієнта в списку:**
```
┌───────────────────────────────────┐
│ 👤 Оксана      Постійна • VIP 🌟  │
│ 12 візитів • Ø 650₴ • Нігті      │
│ Останній візит: 3 дні тому        │
└───────────────────────────────────┘
```

**Детальний профіль клієнта (`/dashboard/clients/[id]`):**
- Фото, ім'я, телефон, email
- Метрики: всього візитів, загальна сума, середній чек, улюблена послуга
- Мітки: VIP (toggle), кастомний тег (text input: "Алергія на гель")
- Історія візитів: таймлайн всіх записів
- Кнопки: "Написати" (Telegram deep link), "Записати" (ручне створення запису)
- Програма лояльності: прогрес (5/10 візитів)

### 8.8 Аналітика (`/dashboard/analytics`) — Pro Only

**Якщо Starter:** блюр + CTA "Перейди на Pro для аналітики"

**3 секції:**

**"Скільки я заробила?":**
- Велика цифра: дохід за обраний період
- Перемикач: День / Тиждень / Місяць
- Розбивка: послуги vs товари (горизонтальний stacked bar)
- Графік: дохід по днях (area chart)

**"Хто приносить гроші?":**
- Топ-5 клієнтів (список з аватаром + сумою)
- Топ-5 послуг (список з прогрес-баром)

**"Що далі?":**
- Прогноз на наступний тиждень (на основі підтверджених записів)
- "У тебе записано 12 клієнтів на наступний тиждень → очікуваний дохід ~8 400 ₴"
- Рекомендація: "5 клієнтів не записувались 30+ днів — надішли нагадування"

### 8.9 Налаштування (`/dashboard/settings`)

**Секції (Bento-картки):**

1. **Профіль бізнесу:** ім'я, bio, аватар, адреса, Instagram/Telegram лінки
2. **Графік роботи:** таблиця Пн-Нд з часом, виключення (календар)
3. **Тема сторінки:** вибір Mood Theme + preview + кастомний колір акценту (color picker)
4. **Автоповідомлення:** toggle для кожного тригера + редагування шаблону повідомлення
5. **Підписка:** поточний тариф, дата наступної оплати, кнопка "Змінити тариф", кнопка "Оплатити" (WayForPay)
6. **Інтеграції:** підключення Telegram-бота (інструкція + deep link)

---

## 9. ЕКРАНИ КЛІЄНТА

### 9.1 Профіль клієнта / Реєстрація

**Контекст створення:** після першого запису пропонується: "Створи профіль — всі записи в одному місці."

**Реєстрація:**
- Google OAuth (один тап)
- АБО: номер телефону → OTP (Supabase Phone Auth)
- Дані: ім'я, телефон (автозаповнення з запису)
- Генерація `referral_code`

### 9.2 Мої записи (`/my/bookings`)

**Вертикальний таймлайн:**
- Зверху: активні/майбутні записи (великі картки)
- Кожна картка: дата, час, майстер (фото + ім'я), послуга, статус
- Дії на картці: "Скасувати", "Перенести", "Додати в календар"
- Нижче: минулі записи (компактні картки)
- На кожному минулому записі: "Записатися знову" (один тап → публічна сторінка з обраною послугою) + "Залишити відгук"

### 9.3 Мої майстри (`/my/masters`)

**Список у стилі контактів телефону:**
- Аватар, ім'я, спеціалізація
- Мітка "Остання візит: 5 днів тому"
- Тап → публічна сторінка майстра
- Кнопка "Записатися" прямо в списку

**Кнопка "Запроси майстра" (prominent, фіксована внизу):**
- Тап → `/my/invite` (деталі в секції Реферальна система)

### 9.4 Програми лояльності (`/my/loyalty`)

**Список активних програм від різних майстрів:**
```
┌───────────────────────────────────┐
│ 💅 Анна — Манікюр                 │
│ ████████░░ 8/10 візитів           │
│ Ще 2 — і знижка 20%!             │
└───────────────────────────────────┘
```

### 9.5 Центр нотифікацій (`/my/notifications`)

**Список всіх повідомлень, згрупований по даті:**
- Нагадування про записи
- Підтвердження/скасування
- "Нова майстриня в Bookit! Запишись першою"
- Реактивація: "Давно не була у Марії — запишись?"

---

## 10. ПУБЛІЧНА СТОРІНКА

### 10.1 Сторінка майстра (`/[slug]`)

**Це серце продукту. Mobile First, максимально оптимізована.**

**SEO:**
```typescript
// [slug]/page.tsx
export async function generateMetadata({ params }): Promise<Metadata> {
    const master = await getMasterBySlug(params.slug);
    return {
        title: `${master.full_name} — Запис онлайн | Bookit`,
        description: master.bio,
        openGraph: {
            images: [master.avatar_url],
        },
    };
}
```

**Структура сторінки:**

**Header:**
- Аватар (круглий, великий)
- Ім'я майстра
- Теги спеціалізацій (чіпси)
- Рейтинг (зірки + кількість відгуків)
- Bio (2-3 рядки)
- Іконки: Instagram, Telegram (посилання)
- Адреса (якщо є, з іконкою локації)

**Services Grid (Bento):**
- Послуги як Bento-картки різного розміру
- `is_popular = true` → більша картка (2x ширина)
- Кожна картка: назва, ціна (або "від X₴"), тривалість, фото (якщо є)
- Категорії як секції-розділювачі
- Тап на картку → розгортається (Framer Motion `layoutId`) → деталі + "Записатися"

**Products Section:**
- Заголовок "Товари"
- Горизонтальний скрол карток
- Кожна: фото, назва, ціна, кнопка "+"
- Можна додати в кошик окремо від запису

**Reviews Section:**
- Останні 3-5 відгуків
- Зірки + текст + ім'я клієнта
- "Показати всі" → Bottom Sheet з повним списком

**Dynamic Island CTA (фіксований внизу):**
```typescript
// components/public/DynamicIslandCTA.tsx
// Кнопка "Записатися" яка розгортається в міні-календар

<motion.div
    layout
    className="fixed bottom-6 left-1/2 -translate-x-1/2"
    animate={isExpanded ? 'expanded' : 'collapsed'}
    variants={{
        collapsed: {
            width: '200px',
            height: '56px',
            borderRadius: '28px',
        },
        expanded: {
            width: 'calc(100% - 32px)',
            height: 'auto',
            borderRadius: '24px',
        },
    }}
>
    {!isExpanded ? (
        <button onClick={() => setIsExpanded(true)}>
            Записатися
        </button>
    ) : (
        <BookingFlow
            master={master}
            onClose={() => setIsExpanded(false)}
        />
    )}
</motion.div>
```

### 10.2 Booking Flow (всередині Dynamic Island)

**4 кроки, без переходів на інші сторінки:**

**Крок 1 — Вибір послуг:**
- Список послуг з чекбоксами
- Внизу: загальний час + сума (живе оновлення)
- Кнопка "Далі"

**Крок 2 — Вибір дати та часу:**
- Календар (горизонтальний скрол днів, 14 днів вперед)
- Недоступні дні — напівпрозорі
- Обрав дату → з'являються часові слоти (вертикальний список)
- Smart Suggestion: один слот підсвічений як "Рекомендований"
- Кнопка "Далі"

**Крок 3 — Рекомендації товарів (опціонально):**
- "Додати до візиту?" — горизонтальний скрол 2-4 товарів
- Тільки товари пов'язані з обраними послугами (`product_service_links`)
- Кнопка "Далі" або "Пропустити"

**Крок 4 — Підтвердження:**
- Фінальна картка-чек:
  ```
  ┌──────────────────────────────────────┐
  │ ✂️ Класичний манікюр        500 ₴    │
  │ 💅 Дизайн                   300 ₴    │
  │ 🛒 Олія для кутикули        180 ₴    │
  │ ──────────────────────────────────── │
  │ 📅 15 лютого, 14:00                  │
  │ ⏱ ~1 год 30 хв                      │
  │ ──────────────────────────────────── │
  │ Разом:                      980 ₴    │
  │                                      │
  │ 👤 Ім'я: [____________]              │
  │ 📱 Телефон: [__________]             │
  │                                      │
  │      [Підтвердити запис]             │
  └──────────────────────────────────────┘
  ```
- Якщо клієнт залогінений → поля автозаповнені
- Кнопка "Підтвердити запис" → створення `booking` + `booking_services` + `booking_products`

**Після підтвердження:**
- Анімація success (конфеті або check animation)
- "Записано! Чекаємо тебе о 14:00, 15 лютого"
- Кнопки: "Додати в календар" (.ics генерація), "Нагадати мені"
- Якщо не залогінений: "Створи профіль — всі записи в одному місці" → реєстрація клієнта

---

## 11. БІЗНЕС-ЛОГІКА

### 11.1 Розрахунок доступних слотів

```typescript
// lib/utils/smartSlots.ts

interface TimeSlot {
    start: string;  // "14:00"
    end: string;    // "15:30"
    isRecommended: boolean;
}

export async function getAvailableSlots(
    masterId: string,
    date: Date,
    totalDurationMinutes: number,
    totalBufferMinutes: number
): Promise<TimeSlot[]> {
    // 1. Отримати шаблон розкладу для цього дня тижня
    const template = await getScheduleTemplate(masterId, getDayOfWeek(date));
    if (!template || !template.is_working) return [];

    // 2. Перевірити виключення
    const exception = await getScheduleException(masterId, date);
    if (exception?.is_day_off) return [];

    const workStart = exception?.start_time || template.start_time;
    const workEnd = exception?.end_time || template.end_time;

    // 3. Отримати існуючі записи на цей день
    const bookings = await getBookingsForDate(masterId, date);

    // 4. Згенерувати слоти з кроком 30 хвилин
    const slots: TimeSlot[] = [];
    let current = parseTime(workStart);
    const end = parseTime(workEnd);

    while (current + totalDurationMinutes + totalBufferMinutes <= end) {
        // Перевірити чи слот не перетинається з існуючими записами та перервою
        const isAvailable = !hasConflict(current, totalDurationMinutes + totalBufferMinutes, bookings, template);

        if (isAvailable) {
            slots.push({
                start: formatTime(current),
                end: formatTime(current + totalDurationMinutes),
                isRecommended: false,
            });
        }
        current += 30; // Крок 30 хвилин
    }

    // 5. Smart Recommendation: позначити оптимальний слот
    // Алгоритм: обрати слот який мінімізує "дірки" в розкладі
    if (slots.length > 0) {
        const bestSlotIndex = findOptimalSlot(slots, bookings, workStart, workEnd);
        slots[bestSlotIndex].isRecommended = true;
    }

    return slots;
}
```

### 11.2 Ліміт записів (Starter)

```typescript
// Перевірка при створенні запису
async function checkBookingLimit(masterId: string): Promise<boolean> {
    const master = await getMasterProfile(masterId);

    if (master.subscription_tier !== 'starter') return true;

    // Перевірити бонус Boosted Start
    const bonus = await getReferralBonus(masterId, 'extended_limit');
    const limit = bonus?.is_active ? parseInt(bonus.bonus_value) : 30;

    return master.bookings_this_month < limit;
}

// Інкремент лічильника (Supabase trigger або API)
// При створенні booking → bookings_this_month += 1
// Щомісячний cron → bookings_this_month = 0
```

### 11.3 Комісія з товарів

```typescript
// При завершенні запису (status → completed)
async function calculateCommission(bookingId: string) {
    const booking = await getBookingWithProducts(bookingId);
    const master = await getMasterProfile(booking.master_id);

    const productTotal = booking.booking_products.reduce(
        (sum, p) => sum + p.product_price * p.quantity, 0
    );

    const commission = productTotal * master.commission_rate;

    await updateBooking(bookingId, {
        total_products_price: productTotal,
        commission_amount: commission,
    });
}
```

### 11.4 Автооновлення CRM-метрик

```sql
-- Supabase Database Function (trigger after booking completed)
CREATE OR REPLACE FUNCTION update_client_master_metrics()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
        INSERT INTO client_master_relations (client_id, master_id, total_visits, total_spent, last_visit_at)
        VALUES (NEW.client_id, NEW.master_id, 1, NEW.total_price, now())
        ON CONFLICT (client_id, master_id)
        DO UPDATE SET
            total_visits = client_master_relations.total_visits + 1,
            total_spent = client_master_relations.total_spent + NEW.total_price,
            average_check = (client_master_relations.total_spent + NEW.total_price) / (client_master_relations.total_visits + 1),
            last_visit_at = now(),
            updated_at = now();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_crm_metrics
AFTER UPDATE ON bookings
FOR EACH ROW
EXECUTE FUNCTION update_client_master_metrics();
```

---

## 12. РЕФЕРАЛЬНА СИСТЕМА

### 12.1 Генерація реферального посилання (клієнт)

**Екран `/my/invite`:**
- Заголовок: "Запроси свого майстра в Bookit"
- Пояснення: "Всі записи будуть в одному місці"
- Поле для імені майстра (опціонально, для персоналізації)
- Кнопка "Створити запрошення" → генерує `invite_code` → посилання `bookit.com.ua/invite/[code]`
- Кнопки: "Копіювати", "Поділитися" (Web Share API)
- Генерує повідомлення: "Привіт! Я записуюсь через Bookit і це дуже зручно. Створи свою сторінку — і я зможу записуватися до тебе! bookit.com.ua/invite/[code]"

### 12.2 Реферальний лендінг (`/invite/[code]`)

**Персоналізована сторінка:**
- "Оксана та ще 3 клієнти вже чекають на тебе в Bookit"
- Аватарки клієнтів які чекають (з `referrals` таблиці)
- Пояснення переваг: "Безкоштовно, за 2 хвилини, клієнти вже є"
- Блок "Boosted Start — твій особливий старт":
  - "Клієнти вже в базі" ✓
  - "50 записів/міс замість 30 на 3 місяці" ✓
  - "Ексклюзивна тема Rose Gold" ✓
- CTA: "Створити сторінку"
- Тап → реєстрація (3 кроки) → автоматичне застосування бонусів

### 12.3 Після реєстрації через реферал

1. Створити `master_profile` з бонусами
2. Додати всіх чекаючих клієнтів в `client_master_relations`
3. Надіслати нотифікацію кожному клієнту: "Марія тепер у Bookit! Запишись першою" + VIP-доступ 24 години
4. Оновити `referrals.status = 'registered'`
5. Інкремент `client_profiles.total_masters_invited`
6. Перевірити ambassador level:
   - 1 invited → ambassador_level = 0
   - 3 invited → ambassador_level = 1 ("Активний")
   - 5 invited → ambassador_level = 2 ("Амбасадор")

---

## 13. НОТИФІКАЦІЇ

### 13.1 Типи нотифікацій

| Тип | Отримувач | Тригер | Канал |
|-----|-----------|--------|-------|
| Новий запис | Майстер | Клієнт створив запис | Push + Telegram |
| Підтвердження | Клієнт | Майстер підтвердив | Push + Telegram |
| Пропозиція часу | Клієнт | Майстер запропонував інший час | Push + Telegram |
| Нагадування 24г | Клієнт | 24 години до запису | Push + Telegram |
| Нагадування 1г | Клієнт | 1 година до запису | Push |
| Скасування | Обидва | Одна сторона скасувала | Push + Telegram |
| Реактивація | Клієнт | 30 днів без запису (Pro) | Telegram |
| Після візиту | Клієнт | 2 години після завершення | Push (відгук) |
| Реферал зареєстровано | Клієнт | Запрошений майстер створив профіль | Push |
| VIP доступ | Клієнт | Новий майстер з реферала — 24г ексклюзив | Push |

### 13.2 Telegram Bot

**Функціонал:**
- Одностороння комунікація (бот → клієнт/майстер)
- Клієнт/майстер підключає бота: `/start [user_id]` → зберігає `telegram_chat_id`
- Шаблони повідомлень з підстановкою: `{client_name}`, `{service_name}`, `{date}`, `{time}`, `{master_name}`

```typescript
// lib/telegram/bot.ts
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

export async function sendTelegramMessage(
    chatId: string,
    template: string,
    variables: Record<string, string>
) {
    let message = template;
    for (const [key, value] of Object.entries(variables)) {
        message = message.replace(`{${key}}`, value);
    }

    await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            chat_id: chatId,
            text: message,
            parse_mode: 'HTML',
        }),
    });
}
```

### 13.3 Cron Jobs (Supabase pg_cron)

```sql
-- Нагадування за 24 години
SELECT cron.schedule(
    'reminder-24h',
    '0 * * * *',  -- Кожну годину
    $$
    SELECT send_reminders('24h');
    $$
);

-- Нагадування за 1 годину
SELECT cron.schedule(
    'reminder-1h',
    '*/15 * * * *',  -- Кожні 15 хвилин
    $$
    SELECT send_reminders('1h');
    $$
);

-- Реактивація (щоденно о 10:00)
SELECT cron.schedule(
    'reactivation',
    '0 10 * * *',
    $$
    SELECT send_reactivation_messages();
    $$
);

-- Скидання лічильника записів (1-го числа кожного місяця)
SELECT cron.schedule(
    'reset-monthly-counters',
    '0 0 1 * *',
    $$
    UPDATE master_profiles SET bookings_this_month = 0;
    $$
);
```

---

## 14. PWA КОНФІГУРАЦІЯ

### manifest.json
```json
{
    "name": "Bookit — Онлайн запис",
    "short_name": "Bookit",
    "description": "Запис до майстрів краси онлайн",
    "start_url": "/",
    "display": "standalone",
    "background_color": "#F8F9FB",
    "theme_color": "#006FFD",
    "orientation": "portrait",
    "icons": [
        { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
        { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png" },
        { "src": "/icons/icon-maskable-512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
    ]
}
```

### Service Worker стратегія
- **Публічні сторінки:** Cache First (швидкий повторний доступ)
- **Dashboard:** Network First (актуальні дані)
- **Статика (CSS/JS/Images):** Stale While Revalidate
- **API запити:** Network Only

### Push Notifications
- Web Push API через Supabase Edge Function
- Запит дозволу після першого запису (не при реєстрації)

---

## 15. ПЛАТІЖНА ІНТЕГРАЦІЯ (WayForPay)

### 15.1 Підписки

```typescript
// lib/wayfopay/client.ts

interface WayForPayRequest {
    merchantAccount: string;
    merchantDomainName: string;
    orderReference: string;
    orderDate: number;
    amount: number;
    currency: 'UAH';
    productName: string[];
    productCount: number[];
    productPrice: number[];
    merchantSignature: string;
    returnUrl: string;
    serviceUrl: string; // Webhook URL
}

export async function createSubscriptionPayment(
    masterId: string,
    tier: 'pro' | 'studio',
    mastersCount?: number
): Promise<WayForPayRequest> {
    const prices = {
        pro: 349,
        studio: (mastersCount || 2) * 199,
    };

    const orderRef = `sub_${masterId}_${Date.now()}`;

    return {
        merchantAccount: process.env.WAYFOPAY_MERCHANT!,
        merchantDomainName: 'bookit.com.ua',
        orderReference: orderRef,
        orderDate: Math.floor(Date.now() / 1000),
        amount: prices[tier],
        currency: 'UAH',
        productName: [`Bookit ${tier.charAt(0).toUpperCase() + tier.slice(1)} — 1 місяць`],
        productCount: [1],
        productPrice: [prices[tier]],
        merchantSignature: generateSignature(orderRef, prices[tier]),
        returnUrl: `${process.env.NEXT_PUBLIC_URL}/dashboard/settings/subscription?status=success`,
        serviceUrl: `${process.env.NEXT_PUBLIC_URL}/api/payments/webhook`,
    };
}
```

### 15.2 Webhook обробка

```typescript
// app/api/payments/webhook/route.ts
export async function POST(req: Request) {
    const body = await req.json();

    // 1. Верифікація підпису WayForPay
    if (!verifySignature(body)) {
        return Response.json({ error: 'Invalid signature' }, { status: 400 });
    }

    // 2. Обробка за типом
    if (body.transactionStatus === 'Approved') {
        const orderRef = body.orderReference;

        if (orderRef.startsWith('sub_')) {
            // Підписка
            const masterId = orderRef.split('_')[1];
            await activateSubscription(masterId, body);
        } else if (orderRef.startsWith('dep_')) {
            // Депозит за запис
            const bookingId = orderRef.split('_')[1];
            await confirmDeposit(bookingId, body);
        }
    }

    // 3. Відповідь WayForPay
    return Response.json({
        orderReference: body.orderReference,
        status: 'accept',
        time: Math.floor(Date.now() / 1000),
        signature: generateResponseSignature(body.orderReference),
    });
}
```

---

## 16. API ENDPOINTS

### Bookings API

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/bookings` | Master | Список записів (фільтри: date, status) |
| GET | `/api/bookings/[id]` | Master/Client | Деталі запису |
| POST | `/api/bookings` | Public | Створити запис |
| PATCH | `/api/bookings/[id]` | Master | Оновити статус |
| DELETE | `/api/bookings/[id]` | Master/Client | Скасувати запис |
| GET | `/api/bookings/slots` | Public | Доступні слоти (query: masterId, date, duration) |

### Services API

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/services?masterId=X` | Public | Послуги майстра |
| POST | `/api/services` | Master | Створити послугу |
| PATCH | `/api/services/[id]` | Master | Оновити послугу |
| DELETE | `/api/services/[id]` | Master | Видалити послугу |
| PATCH | `/api/services/reorder` | Master | Змінити порядок |

### Products API

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/products?masterId=X` | Public | Товари майстра |
| POST | `/api/products` | Master | Створити товар |
| PATCH | `/api/products/[id]` | Master | Оновити товар |
| DELETE | `/api/products/[id]` | Master | Видалити товар |

### Clients API

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/clients` | Master | Клієнтська база (фільтри) |
| GET | `/api/clients/[id]` | Master | Профіль клієнта |
| PATCH | `/api/clients/[id]` | Master | Оновити мітки/VIP |

### Referrals API

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/referrals` | Client | Створити запрошення |
| GET | `/api/referrals/[code]` | Public | Інфо про запрошення |
| POST | `/api/referrals/[code]/register` | Auth | Реєстрація через реферал |

### Analytics API

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/analytics/revenue` | Master (Pro) | Дохід за період |
| GET | `/api/analytics/top-clients` | Master (Pro) | Топ клієнтів |
| GET | `/api/analytics/top-services` | Master (Pro) | Топ послуг |
| GET | `/api/analytics/forecast` | Master (Pro) | Прогноз |

### Payments API

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/payments/subscribe` | Master | Ініціювати оплату підписки |
| POST | `/api/payments/webhook` | WayForPay | Webhook обробка |

### Upload API

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/upload` | Auth | Завантаження зображень (avatar, services, products) |

---

## 17. MVP SCOPE ТА ПРІОРИТЕТИ

### Phase 1 — MVP (8-10 тижнів)

**MUST HAVE:**
- [ ] Landing page
- [ ] Реєстрація майстра (3 кроки)
- [ ] Onboarding dashboard
- [ ] Робочий dashboard (блоки "Сьогодні", "Тижневий огляд")
- [ ] Каталог послуг (CRUD)
- [ ] Каталог товарів (CRUD)
- [ ] Налаштування графіку роботи
- [ ] Публічна сторінка майстра з Mood Themes
- [ ] Booking Flow (4 кроки з Dynamic Island)
- [ ] Integrated Checkout (послуги + товари)
- [ ] Push-нотифікації (новий запис, підтвердження, скасування)
- [ ] Профіль клієнта (базовий)
- [ ] PWA (installable)
- [ ] Responsive: mobile + desktop

**SHOULD HAVE:**
- [ ] CRM з фільтрами (Нові/Постійні/Зниклі)
- [ ] Telegram-бот для нотифікацій
- [ ] Нагадування 24г/1г
- [ ] Відгуки та рейтинг
- [ ] "Поділитися в Stories" (генерація картки)
- [ ] WayForPay інтеграція (підписки)

**COULD HAVE:**
- [ ] Аналітика (Pro)
- [ ] Реферальна система (клієнт запрошує майстра)
- [ ] Boosted Start бонуси
- [ ] Програми лояльності
- [ ] Smart Slot Suggestions
- [ ] Реактивація (автоповідомлення зниклим)
- [ ] Ambassador levels

### Phase 2 — Growth (після MVP)
- Studio тариф (мультимайстер)
- Зведена аналітика для студій
- Розширені інтеграції
- Пошук майстрів (каталог/marketplace)
- Абонементи для клієнтів
- Депозити при бронюванні
- Розширені Mood Themes (кастомний CSS)
- Локалізація (EN)

---

## ДОДАТОК: Чеклист перед кожним деплоєм

- [ ] Всі RLS policies активні
- [ ] Ліміти Starter перевірені
- [ ] WayForPay webhook працює
- [ ] PWA manifest валідний
- [ ] SEO мета-теги на публічних сторінках
- [ ] Mobile responsive на всіх екранах
- [ ] Lighthouse score > 90 (Performance, Accessibility)
- [ ] Grain overlay не лагає на бюджетних пристроях
- [ ] Всі анімації мають `will-change` та `transform` (GPU)
- [ ] Error boundaries на всіх клієнтських компонентах

---

*Документ створено: 07.03.2026*
*Проект: Bookit — Ukrainian SaaS для онлайн-запису*
