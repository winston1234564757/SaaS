# NOTIFICATION_MAP — Система сповіщень BookIT

> Оновлено: 2026-05-09 · Статус: Unified Cascade (v6.5)

Цей документ визначає архітектуру сповіщень у системі BookIT: канали, тригери, логіку каскадування та глибокі посилання (Deep Linking).

---

## 🛰️ Канали зв'язку

| Канал | Реалізація | База даних / Налаштування | Призначення |
|---|---|---|---|
| **Web Push** | `src/lib/push.ts` | `push_subscriptions` | Основний канал для PWA (клієнт та майстер) |
| **Telegram** | `src/lib/telegram.ts` | `profiles.telegram_chat_id` | Пріоритетний fallback для транзакційних повідомлень |
| **SMS** | `src/lib/turbosms.ts` | `profiles.phone` | Резервний fallback (платний) |
| **In-App** | Таблиця `notifications` | `useNotifications.ts` | Сповіщення всередині додатка (Дзвоник / Тости) |

---

## 🏗️ Архітектура (Оркестрація)

Головний оркестратор: `src/lib/notifications.ts`

### 1. Логіка каскадування (Пріоритет каналів)
Стандартний потік для транзакційних сповіщень:
1. **Push** (якщо є активні підписки).
2. **Telegram** (якщо Push не доставлено або підписок немає).
3. **SMS** (якщо обидва попередні канали недоступні).

*Примітка: In-App сповіщення створюються паралельно із зовнішніми каналами для забезпечення цілісності історії.*

---

## 🗺️ Карта сповіщень (Детальний реєстр)

### 1. Бронювання та Статуси

| Тип (`type`) | Отримувач | Подія (Тригер) | Логіка та Локація | Канали |
|---|---|---|---|---|
| `new_booking` | **Майстер** | Створення запису (Online/Manual) | `createBooking.ts` → `notifyMasterNewBooking` | In-App (Trigger), Push, TG, SMS |
| `new_booking` | **Клієнт** | Майстер підтвердив запис (`confirmed`) | `bookings/actions.ts` → `notifyClientOnStatusChange` | In-App, Push, TG, SMS |
| `booking_cancelled`| **Майстер** | Клієнт скасував запис | `my/bookings/actions.ts` → `cancelBooking` | In-App (Trigger), Push, TG |
| `booking_cancelled`| **Клієнт** | Майстер скасував запис (`cancelled`) | `bookings/actions.ts` → `notifyClientOnStatusChange` | In-App, Push, TG, SMS |
| `unhandled_booking`| **Майстер** | Є записи, що не завершені вчасно | `api/cron/check-uncompleted/route.ts` | In-App, TG |
| `reminders` | **Клієнт** | Нагадування за 24г до візиту | `api/cron/reminders/route.ts` | Push, SMS |

### 2. Маркетинг та Лояльність

| Тип (`type`) | Отримувач | Подія (Тригер) | Логіка та Локація | Канали |
|---|---|---|---|---|
| `broadcast` | **Клієнт** | Майстер запустив розсилку | `marketing/actions.ts` → `notifyClientBroadcast` | In-App, Push, TG, SMS |
| `rebooking_reminder`| **Клієнт** | Минув цикл візиту (Smart Retention) | `api/cron/rebooking/route.ts` | In-App, TG, SMS |
| `new_review` | **Майстер** | Клієнт залишив відгук | `my/bookings/actions.ts` → `submitReview` | In-App, Push, TG |
| `new_review` | **Клієнт** | Запис завершено (Запит на відгук) | `bookings/actions.ts` → `notifyClientReviewNudge` | In-App, Push, TG |
| `portfolio_consent_request`| **Клієнт** | Майстер відмітив клієнта у портфоліо | `portfolio/actions.ts` → `notifyClientPortfolioConsent` | In-App, Push, TG, SMS |

### 3. Студія та Команда

| Тип (`type`) | Отримувач | Подія (Тригер) | Логіка та Локація | Канали |
|---|---|---|---|---|
| `studio_invite` | **Майстер** | Власник студії надіслав запит | `studio/actions.ts` → `inviteMaster` | TG, SMS |

---

## ⚙️ Логіка роботи (Deep Dive)

### Транзакційний каскад
Для більшості сповіщень використовується **динамічний каскад** в `src/lib/notifications.ts`:
1. Перевіряється наявність активних `push_subscriptions`. Якщо Push доставлено — каскад зупиняється.
2. Якщо Push не доставлено, перевіряється `telegram_chat_id`. Якщо повідомлення в TG надіслано — каскад зупиняється.
3. Якщо попередні канали недоступні, надсилається **SMS** (TurboSMS).

### Автоматизація через БД (SQL Triggers)
Для In-App сповіщень майстра (нова бронь, скасування) використовуються тригери в PostgreSQL (`071_notifications.sql`). Це гарантує появу сповіщення в системі навіть якщо зовнішній API-виклик (TG/SMS) завершився помилкою.

---

## 🛠️ Технічні деталі

### Глибокі посилання (Deep Linking)
Усі канали зобов'язані підтримувати параметр `url` у пакеті даних:
- **Push**: поле `url` у JSON payload.
- **Telegram**: Inline-кнопка "Переглянути" або "Деталі".
- **SMS**: Пряме посилання (зазвичай скорочене через `/r/[code]`).

### Обробка неактивних підписок (Cleanup)
Якщо сервіс Push повертає статус `410 Gone` (підписка прострочена) або `404 Not Found`, відповідний запис у таблиці `push_subscriptions` має бути видалений негайно для економії ресурсів та точності статистики.

### Ідемпотентність (Захист від дублів)
- **Smart Rebooking**: RPC `get_rebooking_due_clients` фільтрує клієнтів так, щоб не надсилати нагадування частіше ніж раз на цикл.
- **Unhandled Nudge**: Система перевіряє таблицю `notifications` перед відправкою, щоб уникнути повторного сповіщення майстра протягом однієї години.

---

## 📋 Рекомендації щодо розвитку

1. **Уніфікація Cron-логіки**: Перенести логіку вибору каналів з API-роутів у центральний сервіс `notifications.ts`.
2. **Система шаблонів**: Винести тексти сповіщень у глобальні константи для зручного редагування та майбутньої локалізації.
3. **Розширений лог**: Додати відстеження статусів доставки (`delivered`, `read`, `clicked`) для всіх каналів у таблиці `broadcast_recipients`.

