# NOTIFICATION_MAP — Система сповіщень BookIT

> Оновлено: 2026-05-27 · Статус: NotificationOrchestrator v7.0 (Фази 1–4 завершено)

Цей документ визначає повну архітектуру сповіщень: канали, каскад, реєстр подій, механіки підключення та логіку Orchestrator.

---

## 🛰️ Канали зв'язку

| Канал | Реалізація | Де зберігається | Тип |
|---|---|---|---|
| **In-App** | INSERT у `notifications` (DB-тригер або Orchestrator) | `notifications` таблиця | Безкоштовний, завжди |
| **Push** | `src/lib/push.ts` → `sendPush`, `broadcastPush` | `push_subscriptions` | Безкоштовний, основний |
| **Telegram** | `src/lib/telegram.ts` → `sendTelegramMessage` | `profiles.telegram_chat_id` (клієнт) / `master_profiles.telegram_chat_id` (майстер) | Безкоштовний |
| **SMS** | `src/lib/turbosms.ts` | `profiles.phone` (E.164) | **Платний** — тільки critical |

---

## 🏗️ Архітектура — NotificationOrchestrator

### Центральний диспетчер
`src/lib/notifications/NotificationOrchestrator.ts` — **єдина точка** відправки всіх сповіщень у системі.
Ніякий cron-роут, дія або компонент не відправляє канали напряму — тільки через `NotificationOrchestrator.send()`.

### Параметри виклику
```typescript
NotificationOrchestrator.send({
  eventType: NotifEventType,      // 21 тип події
  recipientId: string,            // UUID юзера (profiles.id)
  recipientRole: 'master' | 'client',
  masterId?: string,              // для master_profiles.telegram_chat_id
  relatedBookingId?: string,
  data: NotifData,                // шаблонні змінні (clientName, date, tier, тощо)
})
```

### Реєстр шаблонів — notifMap
`src/lib/notifications/constants/notifMap.ts`
- 21 тип події (`NotifEventType`)
- Для кожного: `isCritical`, `inApp`, `push`, `telegram`, `sms`
- `sms: null` — фізично не може каскадуватись у SMS (некритичні події)
- `isCritical: true` + `sms: {...}` — SMS дозволений як крайній fallback

### Каскад відправки

```
In-App (завжди, паралельно з Push)
     ↓
Push (паралельно з In-App)
     ↓ якщо push не доставлено або немає підписок
Telegram
     ↓ якщо немає telegram_chat_id АБО TG не відправлено
     і тільки якщо isCritical === true і є phone
SMS (TurboSMS) ← ПЛАТНИЙ, крайній резерв
```

**Ключові правила:**
- In-App + Push завжди запускаються паралельно
- TG надсилається якщо Push не доставив (або немає підписок)
- SMS тільки якщо: нема жодного безкоштовного каналу **І** `isCritical === true` **І** є номер телефону
- Після кожної відправки — запис у `notification_logs` (fire-and-forget)
- Прострочені push-підписки (410/404) видаляються автоматично

---

## 📋 Реєстр подій (21 тип)

### Бронювання

| Тип події | Отримувач | Тригер | Critical | SMS |
|---|---|---|---|---|
| `booking_created` | Майстер + Клієнт | `createBooking.ts` | ✅ | ✅ |
| `booking_confirmed` | Клієнт | `bookings/actions.ts` → підтвердження | ✅ | ✅ |
| `booking_cancelled` | Майстер / Клієнт | `bookings/actions.ts` / `my/bookings/actions.ts` | ✅ | ✅ |
| `booking_completed` | Клієнт | `bookings/actions.ts` → статус completed | ❌ | ❌ |
| `unhandled_booking` | Майстер | `cron/check-uncompleted` (щогодини) | ❌ | ❌ |

### Нагадування

| Тип події | Отримувач | Тригер | Critical | SMS |
|---|---|---|---|---|
| `reminder_24h` | Клієнт | `cron/reminders` (вікно ±29 хв) | ❌ | ❌ |
| `reminder_2h` | Клієнт + Майстер | `cron/reminders` (вікно ±29 хв) | ✅ клієнт | ✅ клієнт |
| `reminder_30m` | Клієнт | `cron/reminders` (вікно ±14 хв) | ❌ | ❌ |
| `master_day_briefing` | Майстер | `cron/reminders` о 08:00 Kyiv | ❌ | ❌ |

### Соціальні / Retention

| Тип події | Отримувач | Тригер | Critical | SMS |
|---|---|---|---|---|
| `new_review` | Майстер | `my/bookings/actions.ts` → submitReview | ❌ | ❌ |
| `rebooking_reminder` | Клієнт | `cron/rebooking` (Smart Retention) | ❌ | ❌ |
| `portfolio_consent_request` | Клієнт | `portfolio/actions.ts` | ❌ | ❌ |

### Магазин / Товари

| Тип події | Отримувач | Тригер | Critical | SMS |
|---|---|---|---|---|
| `order_new` | Майстер | `products/actions.ts` → createOrder | ❌ | ❌ |
| `order_shipped` | Клієнт | `products/actions.ts` → updateOrderStatus | ❌ | ❌ |
| `order_completed` | Клієнт | `products/actions.ts` → updateOrderStatus | ❌ | ❌ |
| `stock_alert` | Майстер | `products/actions.ts` → stock ≤ threshold | ❌ | ❌ |

### Білінг / Підписки

| Тип події | Отримувач | Тригер | Critical | SMS |
|---|---|---|---|---|
| `subscription_paid` | Майстер | mono-webhook, expire-subscriptions cron | ❌ | ❌ |
| `subscription_expiring` | Майстер | `cron/reset-monthly` (за 2–4 дні) | ❌ | ❌ |
| `subscription_failed` | Майстер | `cron/expire-subscriptions` → charge fail | ✅ | ✅ |
| `subscription_downgraded` | Майстер | reset-monthly / dunning (3 провали) | ❌ | ❌ |

---

## 🔌 Adoption Mechanics — Фаза 4

Ціль: **90%** майстрів та клієнтів підключають TG + Push.

### Клієнт

**1. PostBookingAuth channels step** (`src/components/public/PostBookingAuth.tsx`)
- Після успішної SMS OTP-верифікації → новий крок `'channels'` (до редиректу в `/my/bookings`)
- Показує: TG bot deep-link (`?start=userId`) + Push subscribe inline
- CTA: "Продовжити →" / "Налаштую пізніше →" + маленький "пропустити"
- Google OAuth flow → не перехоплюється (обробляється баннером нижче)

**2. Persistent ChannelBanner** (`src/components/client/ChannelBanner.tsx` + `src/app/my/layout.tsx`)
- Server layout тягне `profiles.telegram_chat_id` + кількість `push_subscriptions`
- Якщо хоча б один канал відсутній → показує persistent top-banner у клієнтській зоні
- Banner: TG deep-link кнопка + Push кнопка, закривається X (сесійно)
- Зникає сам (server-side) щойно обидва канали підключені

### Майстер

**3. Onboarding CHANNELS step** (`src/components/master/onboarding/steps/StepChannels.tsx`)
- **Увага:** У v2-онбордингу цей крок вимкнений (`CHANNELS: 'SUCCESS'` mapping) для спрощення реєстрації.
- *Історична логіка:* Для TG: `generateTelegramConnectToken()` → one-time token → `https://t.me/{bot}?start={token}`.
- *Історична логіка:* Для Push: стандартний VAPID subscribe flow.
- Прогрес-бар наразі складається з 5 кроків без CHANNELS.

**4. Dashboard Channel Health (TODO)**
- Віджет у дашборді: % клієнтів без TG / Push підключеного
- CTA для поліпшення adoption

---

## ⚙️ Технічні деталі

### notification_logs (міграція 136)
```sql
notification_logs (
  id UUID PK,
  event_type TEXT,
  channel TEXT,     -- 'in_app' | 'push' | 'telegram' | 'sms'
  status TEXT,      -- 'success' | 'failed' | 'skipped'
  error_text TEXT,
  recipient_id UUID → profiles(id),
  master_id UUID → master_profiles(id),
  created_at TIMESTAMPTZ
)
```
- RLS: `master_read_own_logs` (майстер читає свої логи)
- Fire-and-forget — не блокує Orchestrator

### products.stock_alert_threshold (міграція 136)
```sql
ALTER TABLE products ADD COLUMN stock_alert_threshold INT DEFAULT 3;
```
- Alert надсилається коли `newStock <= threshold AND newStock >= 0` після кожного продажу
- Порогове значення per-product (налаштовується через dashboard)

### Cron-маршрути (оновлено)

| Route | Розклад | Що робить |
|---|---|---|
| `cron/reminders` | `0 * * * *` | 3 вікна (24h/2h/30m) + morning briefing 08:00 Kyiv → Orchestrator |
| `cron/check-uncompleted` | `0 * * * *` | Читає `buffer_minutes` per master, ідемпотентність 55 хв → Orchestrator |
| `cron/reset-monthly` | `5 0 1 * *` | Downgrade прострочених + попередження за 2–4 дні |
| `cron/expire-subscriptions` | `0 2 * * *` | Рекурентне списання, free month, dunning |

### Ідемпотентність
- **Push cleanup**: Orchestrator видаляє підписки з 410/404 відповіддю
- **Unhandled nudge**: пропускає майстрів, яких нотифікували < 55 хв тому
- **billing_events**: `external_id UNIQUE` — захист від дублів вебхуків

### Thin wrapper — notifications.ts
`src/lib/notifications.ts` — зворотньосумісний фасад над Orchestrator:
- `notifyMasterNewBooking`, `notifyClientOnStatusChange`, `notifyMasterBookingCancelled`
- `notifyClientPortfolioConsent(params)` — тепер потребує `masterId`
- `notifyMasterNewReview`, `notifyMasterNewOrder`, `notifyClientOrderStatus`
- `notifyMasterStockAlert(masterId, productName, stockCount)`
- `notifyMasterBilling(masterId, event, tier?, expiresAt?)`
- `notifyClientBroadcast()` — залишено без змін (власний channel-selection per campaign)

---

## 📁 Файлова структура

```
src/lib/notifications/
  ├── NotificationOrchestrator.ts   ← центральний диспетчер
  └── constants/
      └── notifMap.ts               ← 21 тип події, шаблони, isCritical

src/lib/notifications.ts            ← тонкий фасад (backward compat)
src/lib/push.ts                     ← sendPush, broadcastPush
src/lib/telegram.ts                 ← sendTelegramMessage
src/lib/turbosms.ts                 ← SMS (платний)

src/components/public/PostBookingAuth.tsx     ← channels step (клієнт)
src/components/client/ChannelBanner.tsx       ← persistent banner (клієнт)
src/components/master/onboarding/steps/
  └── StepChannels.tsx                        ← onboarding step (майстер)
```
