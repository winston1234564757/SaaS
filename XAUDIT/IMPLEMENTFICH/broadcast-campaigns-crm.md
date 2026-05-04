# [IMPLEMENTFICH] Broadcast Campaigns — Pro Розсилки з Аналітикою

## Статус
💎 **ГОТОВО ДО ВИКОРИСТАННЯ — Є, але лендінг не описує**

## Що є?

`src/components/master/marketing/BroadcastEditor.tsx` — **37 KB (!)** 
`src/components/master/marketing/BroadcastHistory.tsx` — **9.5 KB**
`src/components/master/marketing/BroadcastDetailSheet.tsx` — **5.7 KB**
`src/app/api/marketing/` — API endpoint
`src/app/(master)/dashboard/marketing/actions.ts` — **17.8 KB server actions**

### Можливості BroadcastEditor (37KB)
- Сегментація клієнтів: Всі / VIP / Активні / Дрімають / Під ризиком
- Канали: Push / Telegram / SMS (TurboSMS fallback)
- Кастомне повідомлення
- Шаблони повідомлень
- Preview перед відправкою

### BroadcastHistory
- Список минулих розсилок
- Деталізований звіт per-recipient

### BroadcastDetailSheet (Conversion Tracking!)
- `clicked_at` — коли клієнт клікнув посилання (short link)
- `booked_at` — чи відбувся запис після кліку
- `discount_used_at` — чи використав знижку
- **Конверсія per-broadcast** — % хто записався після розсилки

## Де доступно?
`/dashboard/marketing` → вкладка "Розсилки" (BroadcastsTab)
Також кнопка "Розсилка" прямо з CRM-сторінки

## API
`/api/marketing/` — захищений endpoint для відправки

## Маркетингова проблема
Лендінг: НІДЕ не згадує broadcast campaigns.

**Конкуренти беруть окрему плату за Email/SMS Marketing. У BookIT — вбудовано в Pro.**

## Рекомендація
Окремий блок "Smart Broadcasts" на лендінгу: "Сегментуй базу → надсилай → бачи хто записався"
