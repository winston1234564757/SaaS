# [TECH_DEBT] Waitlists — Таблиця є, UI контексту немає (для клієнтів)

## Статус
🟡 **НАПІВФАБРИКАТ — DB є, клієнтський flow відсутній**

## Симптом

`waitlists` таблиця в Supabase — існує в DB schema.

`WaitlistButton.tsx` — існує, підключений до `joinWaitlist()` Server Action.

Але WaitlistButton використовується ТІЛЬКИ для внутрішніх потреб:
```tsx
// src/app/(master)/dashboard/studio/page.tsx — рядок 71:
<WaitlistButton featureSlug="studio" />
// Майстер підписується на waitlist для Studio модуля
```

## Чого немає

**Waitlist для клієнтів** — коли слот у майстра зайнятий, клієнт міг би підписатись і отримати сповіщення якщо слот звільниться.

Це класична фіча для booking-систем:
- Slot зайнятий → "Сповістити якщо звільниться" кнопка
- При скасуванні запису → push/telegram першому в waitlist

Таблиця `waitlists` є в DB, але:
- Немає Button "Стати у чергу" в `BookingWizard`
- Немає cron для обробки waitlist при скасуваннях
- Немає нотифікації при звільненні слоту

## Файли
- `src/components/master/studio/WaitlistButton.tsx` — тільки для Studio feature waitlist
- `src/lib/actions/waitlist.ts` — `joinWaitlist(featureSlug)` — тільки для features

## Рекомендація
Або реалізувати клієнтський Waitlist для слотів (висока цінність),
або перейменувати існуючий `waitlists` → `feature_waitlists` щоб уникнути плутанини.
