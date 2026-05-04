# [IMPLEMENTFICH] Smart Rebooking Engine (Cron + AI-timing)

## Статус
💎 **Повністю зроблено — НЕ виведено в маркетинг**

## Де реалізовано

### Cron (`/api/cron/rebooking`)
```typescript
// Щоденно: 0 10 * * *
// Алгоритм:
// 1. get_rebooking_due_clients() RPC — знаходить клієнтів
//    у яких минув retention_cycle_days після останнього візиту
// 2. Відправляє Push + Telegram з Inline кнопкою "Записатись →"
// 3. Дедуплікація через rebooking_reminders таблицю (sent_at)
```

### RPC (міграція 078)
```sql
get_rebooking_due_clients(
  p_master_id, p_current_date
)
-- Повертає клієнтів яким час повертатись
-- Враховує: retention_cycle_days (per-master), last_visit_at
```

### CRM Налаштування
```typescript
// master_profiles.retention_cycle_days — per-master цикл
// Визначає коли надіслати "нагадування повернутись"
// Default: 30 днів
```

### Deep Linking
Кожен rebooking push містить пряме посилання на бронювання.

## Де НЕ згадується
- ❌ Лендінг — жодного слова
- ❌ Pricing — не вказано як Pro-фіча
- ❌ BOOKIT.md Marketing — не видно серед stable features

## Маркетингова цінність
🚀 **"Autopilot" для утримання клієнтів** — Система сама нагадує клієнтам що час повертатись. Це напряму впливає на Retention Rate майстра без жодних зусиль з його боку.

## Рекомендація
1. На лендінг: "Автоматичне повернення клієнтів — система нагадує за вас"
2. В Dashboard Analytics: показати "Повернених через rebooking: X"
3. У Pricing як Pro-exclusive feature
