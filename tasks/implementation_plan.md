                                                                         
  Поточний стан    
                                                                             ┌─────────────────────────┬──────────────────────────────────────────┐
  │        Компонент        │                  Статус                  │     ├─────────────────────────┼──────────────────────────────────────────┤   
  │ master_subscriptions    │ ✅ таблиця є, але немає status,          │   
  │                         │ failed_attempts, next_charge_at          │   
  ├─────────────────────────┼──────────────────────────────────────────┤   
  │ billing_events          │ ✅ є                                     │
  ├─────────────────────────┼──────────────────────────────────────────┤
  │ expire-subscriptions    │ ✅ є, але тільки downgrade — не заряджає │
  │ cron                    │                                          │
  ├─────────────────────────┼──────────────────────────────────────────┤
  │ MonoProvider /          │ ✅ checkout є, chargeRecurrent — нема    │
  │ WfpProvider             │                                          │
  ├─────────────────────────┼──────────────────────────────────────────┤
  │ Моно підпис             │ ⚠️  soft mode (bypass)                    │
  ├─────────────────────────┼──────────────────────────────────────────┤
  │ vercel.json             │ ✅ є, 3 крони                            │
  └─────────────────────────┴──────────────────────────────────────────┘

  ---
  Архітектура рекурентного білінгу

  ┌─────────────────────────────────────────────────────┐
  │                  ПЕРШИЙ ПЛАТІЖ                       │
  │  Checkout → Payment → Webhook →                     │
  │  master_profiles.subscription_tier = 'pro'          │
  │  master_subscriptions.token = recToken              │
  │  master_subscriptions.next_charge_at = now+30d      │
  └─────────────────────────────────────────────────────┘
                           ↓ щодня
  ┌─────────────────────────────────────────────────────┐
  │              CRON: charge-subscriptions              │
  │  Знаходить: next_charge_at <= now + 1d              │
  │  Для кожного master:                                │
  │    → chargeRecurrent(token, amount)                 │
  │    → SUCCESS: next_charge_at += 30d                 │
  │    → FAIL: failed_attempts++                        │
  │      attempt 1: retry tomorrow                      │
  │      attempt 2: retry + Telegram WARNING            │
  │      attempt 3+: downgrade to starter               │
  └─────────────────────────────────────────────────────┘

  ---
  Файловий план

  Файл: supabase/migrations/086_subscriptions_v2.sql
  Дія: Додати status, failed_attempts, next_charge_at, wallet_id до
    master_subscriptions
  ────────────────────────────────────────
  Файл: src/lib/billing/PaymentProvider.ts
  Дія: Додати chargeRecurrent() до інтерфейсу
  ────────────────────────────────────────
  Файл: src/lib/billing/MonoProvider.ts
  Дія: Реалізувати chargeRecurrent() + фікс signature
  ────────────────────────────────────────
  Файл: src/lib/billing/WfpProvider.ts
  Дія: Реалізувати chargeRecurrent()
  ────────────────────────────────────────
  Файл: src/lib/billing/chargeSubscription.ts
  Дія: Бізнес-логіка одного charge циклу (витягується в окрему функцію)
  ────────────────────────────────────────
  Файл: src/app/api/billing/mono-webhook/route.ts
  Дія: Зберігати wallet_id + next_charge_at при першому платежі
  ────────────────────────────────────────
  Файл: src/app/api/billing/wfp-webhook/route.ts
  Дія: Те саме
  ────────────────────────────────────────
  Файл: src/app/api/cron/charge-subscriptions/route.ts
  Дія: Новий cron: щоденний auto-charge
  ────────────────────────────────────────
  Файл: src/app/api/cron/expire-subscriptions/route.ts
  Дія: Апдейт: не downgrade якщо є active recToken
  ────────────────────────────────────────
  Файл: vercel.json
  Дія: Додати новий cron charge-subscriptions 02:30 UTC

  ---
  Деталі по задачах

  Задача 1 — Migration 086

  ALTER TABLE master_subscriptions
    ADD COLUMN status          TEXT        NOT NULL DEFAULT 'active'
                               CHECK (status IN ('active', 'failed',
  'cancelled')),
    ADD COLUMN failed_attempts INT         NOT NULL DEFAULT 0,
    ADD COLUMN next_charge_at  TIMESTAMPTZ,
    ADD COLUMN wallet_id       TEXT;        -- Monobank walletId для прямих   charge

  ---
  Задача 2 — PaymentProvider.ts interface

  export interface RecurrentChargeOptions {
    token: string;
    walletId?: string;      // Monobank тільки
    masterId: string;
    planId: PlanId;
    amountKopecks: number;
    orderId: string;
  }

  export interface RecurrentChargeResult {
    success: boolean;
    transactionId?: string;
    failReason?: string;
  }

  // Додати до PaymentProvider interface:
  chargeRecurrent(opts: RecurrentChargeOptions):
  Promise<RecurrentChargeResult>;

  ---
  Задача 3 — MonoProvider.chargeRecurrent()

  Monobank direct wallet charge endpoint:
  POST https://api.monobank.ua/api/merchant/wallet/payment
  X-Token: MONO_API_KEY
  {
    "cardToken": recToken,
    "initiationKind": "merchant",
    "amount": 500,
    "ccy": 980,
    "merchantPaymInfo": { "reference": orderId, "destination": "..." },
    "webHookUrl": "..."
  }

  Response: { "invoiceId": "...", "status": "processing" | "success" |
  "failure", "failureReason": "..." }

  ---
  Задача 4 — WfpProvider.chargeRecurrent()

  WFP direct charge:
  POST https://api.wayforpay.com/api
  {
    "transactionType": "CHARGE",
    "merchantAccount": MERCHANT,
    "merchantSignature": hmacMd5(...),
    "orderReference": orderId,
    "amount": 5,
    "currency": "UAH",
    "recToken": token,
    ...
  }

  Response: { "transactionStatus": "Approved" | "Declined", "reason": "..."   }

  ---
  Задача 5 — chargeSubscription.ts — core logic

  export async function chargeSubscription(
    sub: MasterSubscriptionRow,
  ): Promise<'success' | 'failed' | 'downgraded'>

  Алгоритм:
  1. Генерує orderId = bookit_{plan}_{uid32}_{ts}
  2. Викликає provider.chargeRecurrent()
  3. SUCCESS → billing_events INSERT + master_subscriptions.next_charge_at
  += 30d, failed_attempts = 0 + master_profiles.subscription_expires_at +=
  30d
  4. FAIL → failed_attempts++
    - failed_attempts < 3 → next_charge_at = tomorrow, Telegram WARNING
  майстру
    - failed_attempts >= 3 → status = 'failed', downgrade to starter,
  Telegram CRITICAL

  ---
  Задача 6 — charge-subscriptions cron

  // Знаходить підписки де next_charge_at <= now + 2h (вікно 2 год, щоб не
  пропустити)
  // AND status = 'active'
  // Паралельно заряджає всі (Promise.allSettled)
  // Логує results

  ---
  Задача 7 — Webhook update: зберігати next_charge_at та wallet_id

  При першому успішному платежі (recToken присутній):
  next_charge_at: new Date(Date.now() + 30 * 24 * 60 * 60 *
  1000).toISOString(),
  wallet_id: `bookit_master_${userId.replace(/-/g, '')}`,  // Mono

  ---
  Задача 8 — Fix Mono signature

  Проблема: node:crypto бандлиться некоректно в Next.js навіть з runtime =
  'nodejs'.

  Рішення: виділити verification в окремий edge-free helper, або
  використати crypto без node: префіксу:

  // Замінити:
  import { createPublicKey, verify as cryptoVerify } from 'node:crypto';
  // На:
  const { createPublicKey, verify: cryptoVerify } = await import('crypto');
  Dynamic import гарантує що бандлер не намагається статично
  проаналізувати.

  ---
  Задача 9 — vercel.json cron

  {
    "path": "/api/cron/charge-subscriptions",
    "schedule": "30 2 * * *"
  }

  02:30 UTC щодня. Не конфліктує з expire-subscriptions.

  ---
  Задача 10 — Telegram notifications

  Нові шаблони в src/lib/telegram.ts:
  - buildChargeSuccessMessage(master, plan, amount) — "✅ Підписку Pro
  продовжено"
  - buildChargeFailedMessage(master, attemptsLeft) — "⚠️  Не вдалось списати   оплату"
  - buildSubscriptionDowngradedMessage(master) — "❌ Підписку знижено до
  Starter"

  ---
  Порядок виконання

  1. Migration 086           — 10 хв
  2. PaymentProvider types   — 5 хв
  3. MonoProvider.charge     — 20 хв
  4. WfpProvider.charge      — 15 хв
  5. chargeSubscription.ts   — 20 хв
  6. Webhook updates         — 15 хв (зберігати next_charge_at + wallet_id)  7. charge-subscriptions    — 20 хв
  8. expire-subscriptions    — 5 хв (апдейт: не downgrade active subs)
  9. vercel.json             — 2 хв
  10. Telegram templates     — 10 хв
  11. Mono sig fix           — 15 хв

  Загалом: ~2.5 год

  ---
  Ризики

  ┌──────────────────────┬─────────────────────────────────────────────┐
  │        Ризик         │                  Мітігація                  │
  ├──────────────────────┼─────────────────────────────────────────────┤
  │ Double-charge        │ billing_events UNIQUE на (provider,         │
  │                      │ external_id) + idempotent orderId           │
  ├──────────────────────┼─────────────────────────────────────────────┤
  │ Race condition в     │ SELECT ... FOR UPDATE SKIP LOCKED в         │
  │ cron                 │ Supabase RPC                                │
  ├──────────────────────┼─────────────────────────────────────────────┤
  │ recToken протух      │ Catch 4xx → status = 'failed' → downgrade   │
  ├──────────────────────┼─────────────────────────────────────────────┤
  │ Cron timeout         │ Promise.allSettled з таймаутом 8s на кожен  │
  │                      │ charge                                      │
  ├──────────────────────┼─────────────────────────────────────────────┤
  │ Webhook retry від    │ Вже є idempotency в billing_events          │
  │ провайдера           │                                             │
  └──────────────────────┴─────────────────────────────────────────────┘