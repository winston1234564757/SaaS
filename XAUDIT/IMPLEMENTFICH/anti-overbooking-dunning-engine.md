# [IMPLEMENTFICH] Anti-Overbooking + Dunning Engine

## Статус
💎 **Зроблено — НЕ виведено в маркетинг**

## Де реалізовано

### Anti-Overbooking (Smart Slots)
```typescript
// src/lib/utils/smartSlots.ts:
generateAvailableSlots() — генерує ТІЛЬКИ вільні слоти
// Враховує: existing bookings + master_time_off + working_hours
// Multi-service: перевіряє consecutive slots для декількох послуг

// Fluid Anchor алгоритм: snap при зіткненні з перервою
// Запобігає "мертвим зонам" у 15-30 хвилин між записами
```

### Billing Dunning Engine
```typescript
// /api/cron/expire-subscriptions — кожен день 0 2 * * *
// FOR UPDATE SKIP LOCKED — race-safe batch (не дублює списання)
// failed_attempts++ → після 3 → past_due → downgrade

// src/lib/billing/PaymentProvider.ts:
chargeRecurrent() — повторне списання з Token Vault
```

### Token Vault (рекурентні платежі)
```sql
master_subscriptions.token -- recToken від Monobank (зашифрований)
master_subscriptions.failed_attempts -- лічильник збоїв
master_subscriptions.next_charge_at  -- коли наступне списання
```

## Де НЕ згадується
- ❌ Лендінг — немає слова про захист від double-booking
- ❌ Pricing — не згадано dunning / smart retry
- ❌ Dashboard — не показується статус dunning

## Маркетингова цінність
🚀 **Enterprise reliability** — Захист від подвійного запису та автоматична обробка збоїв платежів — це те, що зазвичай є лише у корпоративних системах.

## Рекомендація
1. На лендінг: "Нуль подвійних записів — математичний гарантований захист"
2. Trust signal: показати "99.X% uptime, 0 double-bookings" якщо є дані
