# Bookit

Ukrainian SaaS для онлайн-запису у б'юті-індустрії.
Детальна технічна документація — `BOOKIT.md`.

---

## Швидкий старт

```bash
npm install
cp .env.example .env.local   # заповнити всі змінні
npm run dev                   # http://localhost:3000
```

## Змінні середовища

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# App
NEXT_PUBLIC_APP_URL=https://bookit.com.ua

# Web Push (VAPID)
NEXT_PUBLIC_VAPID_KEY=
VAPID_PRIVATE_KEY=
VAPID_EMAIL=

# Telegram Bot
TELEGRAM_BOT_TOKEN=

# TurboSMS
TURBOSMS_TOKEN=
TURBOSMS_SENDER=
# Monobank
MONO_PUB_KEY_BASE64=

# Cron (секрет для /api/cron/* ендпоінтів)
CRON_SECRET=
```

## Міграції

```bash
# Застосувати нові міграції
npx supabase db push
```

> Усі міграції: `supabase/migrations/` (001 → 051+)

## Структура

```
src/
  app/
    (auth)/             — реєстрація / вхід
    (master)/dashboard/ — панель майстра
    my/                 — зона клієнта
    [slug]/             — публічна сторінка майстра
    explore/            — каталог майстрів
    api/                — API routes (auth, billing, cron, push)
  components/
    master/             — компоненти дашборду
    public/             — BookingFlow, PublicMasterPage, ExplorePage
    client/             — MyBookingsPage
    auth/               — PhoneOtpForm, RegisterForm
  lib/
    supabase/           — client.ts, server.ts, admin.ts, hooks/
    telegram.ts         — sendTelegramMessage, buildBookingMessage
    push.ts             — broadcastPush
    utils/              — dynamicPricing, cn, etc.
  proxy.ts              — захист /dashboard/** та /my/** (Next.js 16)
```

## Команди

```bash
npm run dev      # dev server (Turbopack)
npm run build    # production build
npm run lint     # ESLint
```
