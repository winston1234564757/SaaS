# 13 — Background Cron Domain Map

## 1. Domain Overview

5 фонових завдань (Cron Jobs) для нагадувань, утримання клієнтів, білінгових списань та очищення незавершених записів. Захищені Bearer token.

### Key Files
- `src/app/api/cron/reminders/route.ts` — Reminders
- `src/app/api/cron/rebooking/route.ts` — Retention
- `src/app/api/cron/reset-monthly/route.ts` — Plan downgrade
- `src/app/api/cron/expire-subscriptions/route.ts` — Recurring charges
- `src/app/api/cron/check-uncompleted/route.ts` — Stale bookings

### DB Tables
- `rebooking_reminders` — Dedup log (sent_at)
- `master_subscriptions` — next_charge_at, failed_attempts
- `billing_events` — external_id UNIQUE
- `master_time_off` — Schedule exceptions
- `bookings` — Status updates
- `profiles` — Master preferences (buffer_minutes)
- `notification_logs` — Delivery logs

### RPC
- `get_rebooking_due_clients()` — Retention candidates
- `get_pending_subscriptions_for_billing()` — FOR UPDATE SKIP LOCKED

---

## 2. State Machine

### 2.1 Cron: Reminders (`0 * * * *`)

```
[TRIGGER] → every hour
  → AUTH: check Bearer token
  → FETCH: bookings within 3 time windows:
    → 24h window: slot_time ± 29 min from 24h from now
    → 2h window: slot_time ± 29 min from 2h from now
    → 30m window: slot_time ± 14 min from 30m from now
  → FOR each window:
    → 24h: reminder_24h → Orchestrator (In-App + Push, no SMS)
    → 2h: reminder_2h → Orchestrator (In-App + Push + TG + SMS critical)
    → 30m: reminder_30m → Orchestrator (In-App + Push, no SMS)
  → IF time is 08:00 Kyiv:
    → morning briefing (master_day_briefing) → Orchestrator (In-App + Push)
```

**Edge Cases:**
- DST transition (duplicate/missing hour)
- Timezone offset (Kyiv UTC+2/+3, server UTC)
- Booking at exactly window boundary (±29 min tolerance)
- Booking already reminded (idempotency? window-based but check notif_logs?)
- Multiple bookings same client (one per window)
- Master has no bookings today → no briefing
- Master cancelled after fetch → still sends? stale data

### 2.2 Cron: Rebooking (`0 10 * * *`)

```
[TRIGGER] → daily 10:00 Kyiv
  → AUTH: check Bearer token
  → FETCH: get_rebooking_due_clients()
    → clients whose last_visit > retention_cycle_days ago
    → no rebooking_reminder sent in last N days
  → FOR each client:
    → check dedup in rebooking_reminders
    → send rebooking_reminder → Orchestrator (In-App + Push)
    → INSERT rebooking_reminders (client_id, master_id, sent_at)
```

**Edge Cases:**
- Client already booked (should be excluded from query)
- Multiple masters, same client (separate reminders)
- retention_cycle_days = NULL → use default 30
- retention_cycle_days = 0 → disabled
- Client unsubscribed from all channels → skip?
- Too many due clients → rate-limit?

### 2.3 Cron: Expire Subscriptions (`0 2 * * *`)

```
[TRIGGER] → daily 02:00
  → AUTH: check Bearer token
  → FETCH: get_pending_subscriptions_for_billing()
    → FOR UPDATE SKIP LOCKED (race-safe)
  → FOR each subscription:
    → chargeRecurrent(token, amount)
      → SUCCESS:
        → next_charge_at += 30 days
        → notifyMasterBilling(subscription_paid)
      → FAILURE:
        → failed_attempts++
        → IF failed_attempts ≥ 3:
          → grant free month (grace period)
          → next_charge_at += 30 days
          → notifyMasterBilling(subscription_failed) — SMS allowed
        → IF free month already used AND failed:
          → downgrade to Starter
          → notifyMasterBilling(subscription_downgraded)
```

**Edge Cases:**
- Token expired → card needs re-auth
- Insufficient funds → fail, start dunning
- Subscription already cancelled → skip
- Monobank API down → retry next cycle
- Zero-amount subscription (Starter) → never charge

### 2.4 Cron: Reset Monthly (`5 0 1 * *`)

```
[TRIGGER] → 1st of month, 00:05
  → AUTH: check Bearer token
  → FETCH: subscriptions expiring in 2-4 days
    → notifyMasterBilling(subscription_expiring)
  → FETCH: subscriptions that already expired
    → downgrade to Starter
    → notifyMasterBilling(subscription_downgraded)
```

### 2.5 Cron: Check Uncompleted (`*/15 * * * *`)

```
[TRIGGER] → every 15 minutes
  → AUTH: check Bearer token
  → FETCH: pending/confirmed bookings past their slot_time + buffer_minutes
    → per-master buffer_minutes from master_profiles
  → FOR each:
    → check idempotency (last notification > 55 min ago)
    → notifyMaster(unhandled_booking)
    → OR auto-cancel? (configurable)
    → release slot
```

---

## 3. Environment Matrix

| Environment | Cron Behavior |
|---|---|
| Production | Real execution |
| Development | Mocked or manual trigger |
| CI/E2E | Disabled or stubbed |

### Auth Protection
All crons:
```typescript
const authHeader = req.headers.get('Authorization');
if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
  return new Response('Unauthorized', { status: 401 });
}
```

---

## 4. Load & Concurrency Vectors

| Vector | Risk | Mitigation |
|---|---|---|
| Cron overlap (long running) | Double execution | SKIP LOCKED, idempotency |
| 1000+ masters due for billing | API rate limits | Sequential processing |
| 10000+ clients due for rebooking | Notification flood | Batch processing? |
| Expire + Reset same day | Conflict | Different times (02:00 vs 00:05) |

---

## 5. Data Variations

| Variation | Effect |
|---|---|
| No bookings to remind | Cron runs, 0 actions |
| All subscriptions current | No charges needed |
| Skipped cron cycle (Vercel sleep) | Catch up next cycle? |
| retention_cycle_days = 0 | Disabled per master |
| buffer_minutes = NULL | Use system default |
| Multiple cron triggers same window | Idempotency protects |
| DST change (March/October) | ±1 hour shift |

---

## 6. Test Vectors

### Unit Tests
- [ ] Time window calculation: booking ± 29 min / ± 14 min
- [ ] DST: duplicate hour → correct window
- [ ] DST: missing hour → skip
- [ ] Morning briefing: 08:00 Kyiv check
- [ ] buffer_minutes: per-master override vs default
- [ ] Idempotency: 55 min dedup window
- [ ] retry logic: failed_attempts++
- [ ] Grace period: 3 failures → free month
- [ ] SKIP LOCKED: concurrent cron → no double charge

### Integration Tests
- [ ] Cron reminders: trigger → notifications created
- [ ] Cron rebooking: trigger → rebooking_reminder sent
- [ ] Cron rebooking: dedup check (same client within window)
- [ ] Cron expire-subscriptions: charge success → subscription renewed
- [ ] Cron expire-subscriptions: charge fail → failed_attempts++
- [ ] Cron expire-subscriptions: 3 fails → free month
- [ ] Cron expire-subscriptions: free month expired → downgrade
- [ ] Cron reset-monthly: warn 2-4 days before
- [ ] Cron reset-monthly: downgrade expired
- [ ] Cron check-uncompleted: auto-cancel stale

### Security Tests
- [ ] Missing Bearer → 401
- [ ] Wrong Bearer → 401
- [ ] Correct Bearer → 200

---

## 7. File Inventory

### Routes
- `src/app/api/cron/reminders/route.ts`
- `src/app/api/cron/rebooking/route.ts`
- `src/app/api/cron/reset-monthly/route.ts`
- `src/app/api/cron/expire-subscriptions/route.ts`
- `src/app/api/cron/check-uncompleted/route.ts`

### Notification Integration
- `src/lib/notifications/NotificationOrchestrator.ts`
- `src/lib/notifications.ts`

### DB
- `rebooking_reminders`
- `master_subscriptions`
- `billing_events`
- `notification_logs`

### Existing Tests
- `e2e/tests/07-notifications.spec.ts`
- `e2e/tests/17-retention-loyalty-engine.spec.ts`
