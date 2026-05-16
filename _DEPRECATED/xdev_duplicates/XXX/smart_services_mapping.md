# Server Actions Mapping: Smart Services

## 1. Retention Engine Logic
- **[MODIFY] `src/app/(master)/dashboard/bookings/actions.ts`**:
  - В методі `completeBooking`:
    - Після успішного оновлення статусу до `completed`:
    - Перевірити `rebooking_days` для основної послуги.
    - Якщо `rebooking_days > 0`, створити запис у `retention_logs`:
      ```typescript
      due_date = now() + rebooking_days
      ```
- **[NEW] `src/app/api/cron/retention-reminders/route.ts`**:
  - Щоденний запуск.
  - Виклик RPC `get_due_retention_clients(72/48/24)`.
  - Відправка Telegram/Push повідомлень: "Майстер [Name] чекає на вас! Пора оновити [Service Name]".
  - Оновлення `retention_logs.reminder_XXh_sent_at`.

## 2. Sequential Booking Logic
- **[MODIFY] `src/lib/actions/createBooking.ts`**:
  - При створенні запису для `sequential` послуги:
    - Якщо це перший крок, він стає `parent_booking_id` для наступних.
    - Якщо передано масив дат для курсу — створювати N записів з відповідними `sequence_number`.
  - У списанні матеріалів (Inventory integration):
    - Фетчити `service_recipes` з урахуванням `step_number` (якщо вказано в рецепті).

## 3. Rescheduling System
- **[NEW] `src/lib/actions/reschedule.ts`**:
  - `requestReschedule(bookingId, newTime, note)`:
    - Створює запис у `reschedule_requests`.
    - Надсилає Push/Telegram майстру: "Клієнт просить перенести запис".
  - `handleRescheduleRequest(requestId, action: 'approve' | 'reject', reason?)`:
    - Якщо `approve`:
      - Оновлює `bookings` новими даними.
      - Встановлює статус `reschedule_requests` -> `approved`.
      - Сповіщає клієнта: "Майстер підтвердив перенесення! ✅".
    - Якщо `reject`:
      - Статус -> `rejected`.
      - Сповіщає клієнта: "На жаль, майстер не може перенести на цей час. ❌".

## 4. Notifications Integration
- **[MODIFY] `src/lib/notifications.ts`**:
  - Додати типи нотифікацій: `reschedule_request`, `reschedule_approved`, `retention_reminder`.
  - Забезпечити Deep Linking на картку запису або вікно перенесення.
