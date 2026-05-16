# TASK.md — Поточні завдання BookIT

> Оновлено: 2026-05-16

---

## ✅ ЗАВЕРШЕНО — NotificationOrchestrator Refactor (v7.0)

**Всі 4 фази виконані та задеплоєні в продакшн.**

### Фаза 1 — Інфраструктура
- ✅ Міграція `136_notification_logs.sql` — таблиця логів + `products.stock_alert_threshold`
- ✅ `notifMap.ts` — 21 тип події, UA-шаблони, `isCritical`, SMS-захист

### Фаза 2 — Orchestrator + notifications.ts
- ✅ `NotificationOrchestrator.ts` — централізований диспетчер
- ✅ Каскад: In-App + Push → TG → SMS (critical only)
- ✅ `notifications.ts` — тонкий фасад, backward compat, нові функції (billing, stock, orders)

### Фаза 3 — Cron + продуктові дії
- ✅ `cron/reminders` — 3 суворих вікна + morning briefing → Orchestrator
- ✅ `cron/check-uncompleted` — per-master buffer, ідемпотентність 55 хв
- ✅ `cron/reset-monthly` — downgrade + expiring warning
- ✅ `cron/expire-subscriptions` — free month / paid / dunning → notifyMasterBilling
- ✅ `products/actions.ts` — stock alert threshold + order notifications
- ✅ `mono-webhook` — subscription_paid notification

### Фаза 4 — Adoption Mechanics (90% TG + Push)
- ✅ `PostBookingAuth.tsx` — крок `channels` після SMS OTP
- ✅ `ChannelBanner.tsx` + `/my/layout.tsx` — persistent banner у клієнтській зоні
- ✅ `StepChannels.tsx` + `OnboardingWizard.tsx` — крок CHANNELS в онбордингу майстра
- ⏳ Dashboard "Channel Health" widget — % клієнтів без каналів (TODO)

---

## 🔜 НАСТУПНІ ЗАВДАННЯ

### [HIGH] Dashboard Channel Health Widget
- Віджет у `/dashboard` або `/dashboard/clients`
- Показує: % клієнтів без TG / без Push
- CTA: "Як покращити?" → пояснення + посилання на marketing hub

### [MEDIUM] Cron vercel.json перевірка
- Після оновлення до Vercel Pro перевірити: `check-uncompleted` → `0 * * * *`
- Файл: `bookit/vercel.json`

### [LOW] Broadcast — канальний вибір
- `notifyClientBroadcast()` наразі має власну логіку вибору каналів
- Розглянути рефакторинг під Orchestrator (не критично, broadcast — спеціальний кейс)

---

## 📎 Корисні посилання

- `XDEV/MAPS/NOTIFICATION_MAP.md` — повна карта системи сповіщень
- `XDEV/MAPS/SYSTEM_MAP.md` — архітектурний індекс
- `src/lib/notifications/NotificationOrchestrator.ts` — центральний диспетчер
- `src/lib/notifications/constants/notifMap.ts` — реєстр подій
