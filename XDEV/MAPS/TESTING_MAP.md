# 🧪 Testing & Stabilization Map — BookIT

Цей документ є єдиним реєстром автотестів (Playwright E2E та Vitest Unit) у проекті, описує сідери тестових даних та надає інструкції для локального запуску, дебагу та стабілізації тестів.

---

## ⚙️ Тестове середовище та Команди

Всі тестові команди запускаються з директорії `bookit/`:

```bash
cd bookit

# Запуск Vitest (Unit-тести)
npm run test           # Одноразовий запуск
npm run test:watch     # Режим розробки з відстеженням змін

# Запуск Playwright (E2E-тести)
npm run test:e2e       # Повний запуск: Сід даних + E2E тести
npm run test:e2e:only  # Тільки E2E тести (без повторного сіду даних)
npm run test:e2e:ui    # Запуск Playwright в інтерактивному UI-режимі (рекомендовано для дебагу)

# Запуск окремого файлу
npx vitest run src/lib/billing/pricing.test.ts
npx playwright test e2e/tests/08-booking-complete.spec.ts
```

---

## 🗄️ Сідери та Тестові дані (Data Seeding)

E2E-тести критично залежать від передзаповненої БД.
*   **Скрипт сіду**: `scripts/seed-e2e-data.ts` (запускається через `npm run test:e2e:seed`).
*   **Дія скрипту**:
    1. Очищує таблиці `bookings`, `orders`, `profiles`, `master_profiles`, `client_master_relations`.
    2. Створює тестових майстрів (напр., з різними темами Blossom, Studio, Frost).
    3. Генерує тестові послуги, товари та налаштування годин роботи.
    4. Записує тестових клієнтів з історією візитів та реферальним деревом.
*   **Virtual SMS OTP**: Для проходження SMS-верифікації у тестах використовується віртуальний номер та тестовий OTP код, прописаний у моках (код `123456`).

---

## 🎯 Vitest Unit Tests (Реєстр модульних тестів)

Юніт-тести перевіряють ізольовану бізнес-логіку без рендерингу UI та звернення до живої бази даних.

| Тестовий файл | Компонент / Функція | Кількість тестів | Опис перевірок |
|---|---|---|---|
| [pricing.test.ts](file:///c:/Users/Vitos/SaaS/bookit/src/lib/billing/pricing.test.ts) | `src/lib/billing/pricing.ts` | 27 | Розрахунок вартості підписок, накладання реферальних знижок, stackable discount logic. |
| [billing.test.ts](file:///c:/Users/Vitos/SaaS/bookit/src/lib/billing/billing.test.ts) | `src/lib/billing/MonoProvider.ts` | 6 | Верифікація підпису вебхуку Monobank через Ed25519 (включаючи ротацію ключів). |
| [smartSlots.test.ts](file:///c:/Users/Vitos/SaaS/bookit/src/lib/utils/smartSlots.test.ts) | `src/lib/utils/smartSlots.ts` | 15+ | Fluid Anchor алгоритм генерації слотів, обхід перерв/відпусток, запобігання накладанням. |
| [dynamicPricing.test.ts](file:///c:/Users/Vitos/SaaS/bookit/src/lib/utils/dynamicPricing.test.ts) | `src/lib/utils/dynamicPricing.ts` | 10+ | Динамічне ціноутворення: markup (+50%) на пікові години, discount floor (-30%) на пусті вікна. |
| [broadcastUtils.test.ts](file:///c:/Users/Vitos/SaaS/bookit/src/lib/utils/broadcastUtils.test.ts) | `src/lib/utils/broadcastUtils.ts` | 8+ | Персоналізація тексту розсилок (`{client_name}`), валідація тегів та фільтрів. |

---

## 🎭 Playwright E2E Tests (Реєстр інтеграційних тестів)

Розташовані в [e2e/tests/](file:///c:/Users/Vitos/SaaS/bookit/e2e/tests/). Забезпечують перевірку реального користувацького досвіду в браузері.

| Специфікація (Spec File) | Цільовий флоу | Статус стабільності | Перевірки |
|---|---|---|---|
| `00-auth-contract.spec.ts` | SMS Auth | ✅ Стабільний | Перевірка SMS OTP контракту та віртуальної пошти клієнта. |
| `01-auth-guards.spec.ts` | Роутинг та права | ✅ Стабільний | Захист шляхів `/dashboard` (тільки майстер) та `/my` (тільки клієнт). |
| `02-time-travel-logic.spec.ts` | Слот-енджин | ⚠️ Flaky | Об override системного часу (clock travel) для перевірки зсуву дат. |
| `03-referral-engine.spec.ts` | Lifetime Alliance | ✅ Стабільний | Реєстрація реферала B2B, зарахування Reserve/Bounty. |
| `04-crm-logic.spec.ts` | CRM-дашборд | ✅ Стабільний | Розрахунок LTV, середнього чека та кількості візитів клієнта. |
| `04-master-crm-smoke.spec.ts` | CRM Smoke | ✅ Стабільний | Пошук, фільтрація та створення клієнтів з кабінету. |
| `05-loyalty-reviews.spec.ts` | Відгуки та бали | ⚠️ Потребує рев'ю | Публікація відгуків, перерахунок рейтингу майстра. |
| `06-referrals.spec.ts` | C2C Реферали | ✅ Стабільний | Клієнт ділиться посиланням, новий клієнт отримує знижку. |
| `07-notifications.spec.ts` | Notification Cascade | ✅ Стабільний | Запис логів у `notification_logs`, пріоритет відправки Telegram/SMS. |
| `08-booking-complete.spec.ts` | Запис клієнта | ✅ Стабільний | Повний цикл BookingWizard з вибором послуг та SMS OTP. |
| `08-notification-adoption.spec.ts` | Adoption UI | ✅ Стабільний | Рендеринг `ChannelBanner` у `/my/`, якщо не підключений Telegram/Push. |
| `09-master-settings.spec.ts` | Settings CRUD | ✅ Стабільний | Оновлення розкладу роботи майстра, блокування вихідних днів. |
| `09-settings-notifications.spec.ts`| Канали сповіщень | ✅ Стабільний | Управління тумблерами In-App, Push, TG, SMS у налаштуваннях. |
| `10-master-bookings.spec.ts` | Ручний запис | ✅ Стабільний | Створення запису через кабінет майстра, перевірка накладання часу. |
| `11-master-clients.spec.ts` | CRM клієнтів | ✅ Стабільний | Фільтрація клієнтів за сегментами (VIP, Sleeping, At Risk). |
| `12-flash-deals.spec.ts` | Flash Deals | ⚠️ Flaky | Створення флеш-акції, бронювання слоту та його автоматичне видалення. |
| `13-dynamic-pricing.spec.ts` | Dynamic Pricing | ✅ Стабільний | Зміна ціни послуги у BookingWizard залежно від часу слоту. |
| `14-client-journey.spec.ts` | Публічний профіль | ✅ Стабільний | Повний шлях клієнта від перегляду `/[slug]` до перегляду своїх записів. |
| `15-analytics.spec.ts` | Аналітика кабінету | ✅ Стабільний | Візуалізація Weekly/Monthly доходів та експорт клієнтів у CSV. |
| `16-mobile-smoke.spec.ts` | Mobile UI | ✅ Стабільний | Перевірка нижньої панелі Bento та поведінки BottomSheet на мобілках. |
| `17-retention-loyalty-engine.spec.ts`| Rebooking cron | ⚠️ Flaky | Тригер авто-розсилки пропозицій rebooking клієнтам, що заснули. |
| `18-marketing-broadcasts.spec.ts` | Broadcasts | ✅ Стабільний | Масова розсилка повідомлень по сегментованій базі з тегами. |
| `19-services-loading.spec.ts` | Lazy Load / Skeleton | ✅ Стабільний | Перевірка відсутності мерехтіння інтерфейсу при швидкому переході. |
| `20-stabilization-audit.spec.ts` | Accessibility & Perf | ✅ Стабільний | Перевірка ARIA атрибутів та контрастності за стандартами Premium UX. |
| `ux-premium.spec.ts` | Visual Regression | ⚠️ Потребує рев'ю | Порівняння скріншотів Blossom/Studio/Frost з еталонними зображеннями. |

---

## 🛠️ Інструкція зі стабілізації Flaky-тестів

Деякі тести мають статус `flaky` (нестабільні) через асинхронні запити або зсуви часу (Time Travel).

1.  **Локальний запуск дебагу**:
    Запускайте тест у UI-режимі для покрокового відстеження виконання:
    ```bash
    npx playwright test e2e/tests/12-flash-deals.spec.ts --ui
    ```
2.  **Аналіз трейсів (Playwright Traces)**:
    Якщо тест впав на CI/локально, відкрийте останній трейс для перевірки стану DOM:
    ```bash
    npx playwright show-report
    ```
3.  **Запобігання Race Conditions**:
    *   **Заборонено**: Використовувати фіксовані затримки `page.waitForTimeout(1000)`.
    *   **Правильно**: Очікувати на конкретний стан елемента: `await expect(page.locator('.toast')).toBeVisible()`.
4.  **Синхронізація часу**:
    Тести, що працюють з датами (`02-time-travel-logic`, `17-retention-loyalty-engine`), повинні використовувати встановлений кукі debug-часу (`getNow()`), щоб уникнути нічних переходів та розбіжностей у часових поясах (Kyiv Timezone).
