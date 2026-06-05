# 🔒 Database Security & RLS Map — BookIT

Цей документ визначає політику безпеки бази даних Supabase PostgreSQL, опис механізмів Row Level Security (RLS), перелік Security Definer RPC-функцій, а також захист API та вебхуків.

---

## 🛡️ Row Level Security (RLS) Матриця

Усі таблиці бази даних в обов'язковому порядку мають увімкнений RLS. Прямий доступ до даних з боку клієнта (`authenticated` або `anon` ролі) суворо розмежований.

| Таблиця | RLS Статус | Доступ для `anon` | Доступ для `authenticated` (Клієнт) | Доступ для `authenticated` (Майстер) |
|---|---|---|---|---|
| `profiles` | ✅ Active | SELECT (тільки публічний аватар/ім'я) | SELECT/UPDATE (свій профіль) | SELECT (профілі своїх клієнтів) |
| `master_profiles` | ✅ Active | SELECT (публічні дані за `slug`) | SELECT (свої майстри) | SELECT/UPDATE (свій профіль) |
| `client_master_relations`| ✅ Active | Немає доступу | SELECT (свої релейшени) | SELECT/INSERT/UPDATE (свої клієнти) |
| `services` | ✅ Active | SELECT (публічні послуги) | SELECT (всі активні) | SELECT/INSERT/UPDATE/DELETE (свої) |
| `products` | ✅ Active | SELECT (публічні товари) | SELECT (всі активні) | SELECT/INSERT/UPDATE/DELETE (свої) |
| `bookings` | ✅ Active | INSERT (тільки через OTP токен) | SELECT (свої записи) | SELECT/INSERT/UPDATE (свої записи) |
| `orders` | ✅ Active | INSERT (тільки pickup/NP) | SELECT (свої замовлення) | SELECT/UPDATE (замовлення у свій магазин)|
| `notifications` | ✅ Active | Немає доступу | SELECT/UPDATE (свої ноти) | SELECT/UPDATE (свої ноти) |
| `push_subscriptions` | ✅ Active | Немає доступу | SELECT/INSERT/DELETE (свої) | SELECT/INSERT/DELETE (свої) |
| `notification_logs` | ✅ Active | Немає доступу | Немає доступу | SELECT (тільки лог розсилок свого кабінету)|
| `payments` | ✅ Active | Немає доступу | Немає доступу | SELECT (свої платежі за підписку) |
| `master_subscriptions` | ✅ Active | Немає доступу | Немає доступу | SELECT (своя підписка) |
| `master_alliances` | ✅ Active | Немає доступу | Немає доступу | SELECT (своя участь в альянсі B2B) |

---

## 🔐 Ключові Security Definer функції

Деякі складні операції або перевірки вимагають обходу (bypass) RLS політик. Вони реалізовані як `SECURITY DEFINER` функції в PostgreSQL і виконуються з правами суперкористувача. 

> [!CAUTION]
> Будь-яка зміна або створення `SECURITY DEFINER` функції вимагає ретельного аудиту безпеки для запобігання підвищенню привілеїв (Privilege Escalation).

1.  **`get_master_clients(p_master_id uuid)`**
    *   *Дія*: Повертає CRM-список клієнтів для майстра.
    *   *Безпека*: Має вказаний `SET search_path = public` для запобігання атакам через підміну шляху пошуку схем. Доступ обмежений роллю `authenticated`.
2.  **`check_and_log_sms_send(p_phone text, p_ip text, phone_max_sends int, ...)`**
    *   *Дія*: Перевіряє та фіксує ліміти відправки SMS OTP для номеру телефону та IP-адреси.
    *   *Безпека*: Використовує Advisory Locks для запобігання Race Condition (TOCTOU) атакам. **Увага:** Наразі у функції відсутній `SET search_path = public` (P0/P1 Security Risk).
3.  **`get_pending_subscriptions_for_billing()`**
    *   *Дія*: Вибірка підписок для білінгового крону.
    *   *Безпека*: Використовує `FOR UPDATE SKIP LOCKED`, що захищає від подвійного списання (Double Spend) при одночасному запуску декількох воркерів.
4.  **`sync_client_health_to_relations()`**
    *   *Дія*: Синхронізація медичних нотаток та алергій з профілю клієнта у всі його зв'язки з майстрами.
    *   *Безпека*: Тригер спрацьовує автоматично при оновленні полів `health_notes`, `medical_notes` в `profiles`.

---

## 🔒 Захист API-роутів та Webhooks

### 1. Monobank Webhook (`/api/billing/mono-webhook`)
*   **Захист**: Строга верифікація підпису **Ed25519** у заголовку `X-Mono-Signature`.
*   **Алгоритм**:
    *   Підпис генерується Monobank з використанням його приватного ключа.
    *   Додаток отримує публічний ключ Monobank та кешує його (з підтримкою автоматичної ротації).
    *   Будь-який збій верифікації повертає `403 Forbidden` — використання soft-mode категорично заборонено через фінансові ризики.

### 2. Cron Jobs (Каскади сповіщень та білінгу)
*   **Маршрути**: `/api/cron/reminders`, `/api/cron/rebooking`, `/api/cron/reset-monthly`, `/api/cron/expire-subscriptions`.
*   **Захист**: Кожен обробник крону перевіряє заголовок авторизації у першому ж рядку виконання:
    ```typescript
    const authHeader = req.headers.get('Authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return new Response('Unauthorized', { status: 401 });
    }
    ```

### 3. SMS OTP Auth Flow (Автентифікація)
*   **Захист від флуду (Rate Limiting)**:
    *   **По номеру телефону**: максимум 3 SMS за 15 хвилин.
    *   **По IP-адресі**: максимум 10 SMS за 1 годину.
*   **Virtual Email Formula**: Клієнти, що авторизуються по SMS OTP, отримують віртуальний email для інтеграції з Supabase Auth:
    ```typescript
    const virtualEmail = phone.replace('+', '') + '@bookit.app';
    ```
    Це запобігає конфлікту автентифікації та дозволяє використовувати стандартні механізми Supabase.
