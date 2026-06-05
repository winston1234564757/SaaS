# 05 — Notification System Domain Map

## 1. Domain Overview

Централізована система сповіщень з каскадним принципом доставки: In-App + Push (паралельно) → Telegram → SMS (critical only). NotificationOrchestrator — єдина точка відправки.

### Key Files
- `src/lib/notifications/NotificationOrchestrator.ts` — Central dispatcher
- `src/lib/notifications/constants/notifMap.ts` — 21 event types, templates
- `src/lib/notifications.ts` — Facade (backward compat functions)
- `src/lib/push.ts` — VAPID Web Push
- `src/lib/telegram.ts` — Telegram Bot API
- `src/lib/turbosms.ts` — TurboSMS provider
- `src/components/public/PostBookingAuth.tsx` — Channels step (client)
- `src/components/client/ChannelBanner.tsx` — Persistent banner
- `src/components/master/onboarding/steps/StepChannels.tsx` — Master channel setup

### DB Tables
- `notifications` — In-app notifications
- `push_subscriptions` — VAPID subscriptions
- `notification_logs` — Delivery log (migration 136)
- `profiles.telegram_chat_id` — Client TG chat
- `master_profiles.telegram_chat_id` — Master TG chat

---

## 2. State Machine

### 2.1 NotificationOrchestrator Cascade

```
NotificationOrchestrator.send({
  eventType, recipientId, recipientRole, masterId?, relatedBookingId?, data
}):

  → load recipient profile (phone, telegram_chat_id, push_subscriptions)
  → load template from notifMap[eventType]

  → PARALLEL:
    → sendInApp(recipientId, template, data)
      → INSERT into notifications
      → log: { event_type, channel: 'in_app', status }

    → sendPush(recipientId, template, data)
      → query push_subscriptions for user
      → webpush.sendAll(subscriptions, payload)
        → success → log: 'success'
        → 410/404 → delete subscription, log: 'failed_removed'
        → other error → log: 'failed'

  → IF push failed OR no subscriptions:
    → sendTelegram(recipientId, template, data)
      → get telegram_chat_id from profiles/master_profiles
      → bot.sendMessage(chatId, text, replyMarkup?)
        → success → log: 'success'
        → error → log: 'failed'

  → IF TG failed OR no chat_id:
    → AND isCritical === true
    → AND recipient has phone
      → sendSMS(recipient.phone, template, data)
        → turbosms.send(smsText, phone)
          → success → log: 'success'
          → error → log: 'failed'
```

### 2.2 Channel States per Recipient

| Channel | Available | Not Available |
|---|---|---|
| In-App | Always (logged in) | Guest |
| Push | Subscribed | Not subscribed / blocked / PWA unsupported |
| Telegram | Has telegram_chat_id | Not connected |
| SMS | Has phone number | No phone, or isCritical=false |

### 2.3 notifMap Events (21 types)

**Booking Events (5):**
| Event | isCritical | SMS | Recipient |
|---|---|---|---|
| `booking_created` | ✅ | ✅ | Master + Client |
| `booking_confirmed` | ✅ | ✅ | Client |
| `booking_cancelled` | ✅ | ✅ | Master / Client |
| `booking_completed` | ❌ | ❌ | Client |
| `unhandled_booking` | ❌ | ❌ | Master |

**Reminders (4):**
| Event | isCritical | SMS | Recipient |
|---|---|---|---|
| `reminder_24h` | ❌ | ❌ | Client |
| `reminder_2h` | ✅ | ✅ | Client + Master |
| `reminder_30m` | ❌ | ❌ | Client |
| `master_day_briefing` | ❌ | ❌ | Master |

**Social/Retention (3):**
| Event | isCritical | SMS | Recipient |
|---|---|---|---|
| `new_review` | ❌ | ❌ | Master |
| `rebooking_reminder` | ❌ | ❌ | Client |
| `portfolio_consent_request` | ❌ | ❌ | Client |

**Shop/Products (4):**
| Event | isCritical | SMS | Recipient |
|---|---|---|---|
| `order_new` | ❌ | ❌ | Master |
| `order_shipped` | ❌ | ❌ | Client |
| `order_completed` | ❌ | ❌ | Client |
| `stock_alert` | ❌ | ❌ | Master |

**Billing (5):**
| Event | isCritical | SMS | Recipient |
|---|---|---|---|
| `subscription_paid` | ❌ | ❌ | Master |
| `subscription_expiring` | ❌ | ❌ | Master |
| `subscription_failed` | ✅ | ✅ | Master |
| `subscription_downgraded` | ❌ | ❌ | Master |
| `subscription_expired` | ❌ | ❌ | Master |

### 2.4 ChannelBanner States

```
[CHECK] → server checks telegram_chat_id + push_subscription count
  → BOTH_ACTIVE → don't render banner
  → MISSING_TG → render: "Підключіть Telegram" + button
  → MISSING_PUSH → render: "Увімкніть Push" + button
  → MISSING_BOTH → render: TG + Push buttons
  → DISMISSED → (session only via cookie) → hidden
  → CONNECTED → (banner auto-hides on next check)
```

### 2.5 Push Subscription States

```
[IDLE] → check Notification.permission
  → GRANTED → subscribe via VAPID → save endpoint
  → DENIED → show hint: "Увімкніть у налаштуваннях"
  → DEFAULT → prompt user → subscribe
  → UNSUPPORTED → hide push UI
  → PWA_HINT → show PWA install prompt
  → SUBSCRIBING → loading state
  → SUBSCRIBED → endpoint saved
  → REMOVED → 410/404 → cleanup
```

---

## 3. Environment Matrix

| Environment | Push Support | TG Support | SMS Cost |
|---|---|---|---|
| Desktop Chrome | ✅ VAPID | Web TG? | Paid |
| Mobile Chrome | ✅ VAPID | Deep link | Paid |
| Mobile Safari | ✅ (PWAs) | Deep link | Paid |
| Firefox | ✅ VAPID | — | Paid |
| PWA standalone | ✅ | Deep link | Paid |
| TMA | ❌ | ✅ Native | Paid |
| iOS (non-PWA) | ❌ | Deep link | Paid |
| Offline | ❌ | ❌ | ❌ |

---

## 4. Load & Concurrency Vectors

| Vector | Risk | Mitigation |
|---|---|---|
| Mass broadcast (1000 clients) | 1000 push + TG calls | Queue? Parallel batch |
| Cron reminder (all masters) | Thousands of events | Parallel per master |
| Subscription webhook burst | Multiple concurrent | Idempotency UNIQUE billing_events |
| Push 410 storm | Many expired subs | Sequential cleanup |
| SMS cost explosion | Critical SMS limit | isCritical guard only 5 events |

---

## 5. Data Variations

| Variation | Behavior |
|---|---|
| No push subscriptions | Skip push, fallback to TG |
| No telegram_chat_id | Skip TG, fallback to SMS (if crit) |
| No phone | Skip SMS, final fallback |
| All channels missing | Send nothing, log "all skipped" |
| Push subscription expired 410 | Auto-delete, move to TG |
| TG bot blocked by user | Telegram API error → move to SMS |
| SMS provider down | SMS fails → log error, no further fallback |
| Remote push endpoint changed | 404 → delete, move to TG |
| Recipient deleted account | All channels fail → log |
| notification_logs table full | Fire-and-forget may lag |

### Template Variables
| Variable | Source | Example |
|---|---|---|
| `{client_name}` | profiles.full_name | "Олена" |
| `{master_name}` | master_profiles.business_name | "Студія краси" |
| `{date}` | booking.slot_date | "5 червня" |
| `{time}` | booking.slot_time | "14:30" |
| `{service_name}` | booking_services.name | "Стрижка" |
| `{tier}` | subscription plan | "Pro" |
| `{expires_at}` | subscription.end_date | "1 липня" |

---

## 6. Test Vectors

### Unit Tests
- [ ] Cascade logic: push → TG → SMS (critical)
- [ ] Cascade logic: push → TG → stop (non-critical)
- [ ] Cascade logic: push success → stop (no TG/SMS)
- [ ] SMS guard: isCritical=false → no SMS call
- [ ] Push 410 cleanup → subscription deleted
- [ ] Template rendering: {client_name} replaced
- [ ] Template rendering: missing variable → leave as-is or empty
- [ ] Log format: all channels logged correctly
- [ ] notifMap: every event has required fields

### Integration Tests
- [ ] Orchestrator.send(booking_created) → In-App + Push
- [ ] Orchestrator.send(booking_cancelled) → In-App + Push + TG (if no push)
- [ ] Orchestrator.send(subscription_failed) → In-App + Push + TG + SMS
- [ ] Orchestrator.send(reminder_24h) → In-App + Push only (no SMS)
- [ ] Orchestrator.send() with invalid recipient → graceful error
- [ ] log insert → read from notification_logs
- [ ] Push subscribe → subscription stored
- [ ] Push unsubscribe → subscription deleted

### E2E Tests
- [ ] Booking created → master gets notification
- [ ] Booking created → client gets notification
- [ ] Master confirms booking → client gets confirmation
- [ ] Master cancels booking → client gets cancellation
- [ ] Client cancels booking → master gets cancellation
- [ ] Reminder cron triggers → notification sent
- [ ] ChannelBanner appears when TG not connected
- [ ] ChannelBanner disappears when both channels connected
- [ ] PostBookingAuth: channels step → connect TG
- [ ] PostBookingAuth: channels step → connect Push
- [ ] Notification click → navigate to correct page

### Security Tests
- [ ] notification_logs RLS: master reads own logs only
- [ ] notification_logs RLS: client can't read logs
- [ ] Push subscription: only own subscription CRUD
- [ ] Telegram: verify chat_id ownership

---

## 7. File Inventory

### Core
- `src/lib/notifications/NotificationOrchestrator.ts`
- `src/lib/notifications/constants/notifMap.ts`
- `src/lib/notifications.ts`
- `src/lib/push.ts`
- `src/lib/telegram.ts`
- `src/lib/turbosms.ts`

### UI Components
- `src/components/public/PostBookingAuth.tsx`
- `src/components/client/ChannelBanner.tsx`
- `src/components/master/onboarding/steps/StepChannels.tsx`
- `src/components/shared/PushSubscribeCard.tsx`
- `src/components/shared/wizard/PushPrompt.tsx`

### Cron
- `src/app/api/cron/reminders/route.ts`
- `src/app/api/cron/rebooking/route.ts`
- `src/app/api/cron/check-uncompleted/route.ts`

### DB Migrations
- `136_notification_logs.sql`
- `009_push_subscriptions.sql`
- `017_master_telegram_chat_id.sql`
- `014_notifications.sql`
