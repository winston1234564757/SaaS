# 🧪 Testing & Stabilization Map — BookIT

Цей документ є єдиним реєстром автотестів (Playwright E2E та Vitest Unit) у проекті, описує сідери тестових даних та надає інструкції для локального запуску, дебагу та стабілізації тестів.

> **Оновлено:** 2026-07-08 (TEST-M5 anti-drift). Стан: **unit 1013/1013 ✅** (47 файлів) · **e2e останній повний chromium: 123 passed / 2 env-flake / 42 skipped** (після TEST-M6). Реєстри нижче звірені з живим `find *.test.ts` + `e2e/tests/`.

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

*   **Скрипт сіду**: `scripts/seed-e2e-data.ts` (частина `npm run test:e2e`).
*   **Стратегія — SCOPED wipe (НЕ глобальний!)**: скрипт видаляє та перестворює **ТІЛЬКИ акаунти `e2e_*@test.com`** та їхні пов'язані рядки. Жодних global-wipe таблиць `profiles`/`master_profiles`/`bookings`. Захист: `assertE2EEmail` (regex `^e2e_.+@test\.com$`) відмовляє сідити будь-який не-тестовий email.
*   **Тестові акаунти**: TimeTravelMaster (детерміністична машина часу), CrmMaster (+100 guest-bookings для CRM/аналітики), AuthMaster, ReferralMaster (детерміністичний реферальний фікстур), StudioAdmin, AuditMaster — кожен зі своїм ізольованим клієнтом, послугами та розкладом.
*   **🔒 SEC-01 hard-guard (2026-07-08)**: сідер **АБОРТИТЬ**, якщо `NEXT_PUBLIC_SUPABASE_URL` містить прод-реф (`sqlrxsopllgztvgrerqk`) — **навіть з `E2E_ALLOW_REMOTE=true`**. Логіка: `src/lib/testing/e2eSeedGuard.ts` (`findProdRef`/`isProdSupabaseUrl`); перевірка стоїть ПЕРЕД `ALLOW_REMOTE`-байпасом у `assertSafeEnvironment`. Локальний запуск вимагає `.env.test` націленого на **локальний** Supabase (`npx supabase start`, `E2E_ALLOW_REMOTE=false`) або на **dedicated** e2e-проект — ніколи не прод. Unit: `src/lib/testing/e2eSeedGuard.test.ts` (5 тестів).
*   **Virtual SMS OTP**: для проходження SMS-верифікації використовується віртуальний номер та тестовий OTP код у моках (`123456`).
*   **Runtime IDs**: `seed-e2e-data.ts` пише UUID майстрів / слаги / реферальні коди у `.env.test.runtime`, який `playwright.config.ts` підвантажує другим.

---

## 🎯 Vitest Unit Tests (Реєстр модульних тестів)

Юніт-тести перевіряють ізольовану бізнес-логіку без рендерингу UI та звернення до живої бази даних. **47 файлів, 1013 тестів.** Ключові суїти документовано; повний реєстр — нижче.

| Тестовий файл | Компонент / Функція | Опис перевірок |
|---|---|---|
| `src/lib/billing/pricing.test.ts` | `lib/billing/pricing.ts` | Розрахунок вартості підписок, накладання реферальних знижок, stackable discount logic. |
| `src/lib/billing/billing.test.ts` | `lib/billing/MonoProvider.ts` | Верифікація підпису вебхуку Monobank через Ed25519 (включно з ротацією ключів). |
| `src/lib/billing/syncReferralAndBounty.test.ts` | `lib/billing` referral/bounty sync | Синхронізація реферальних резервів і винагород. |
| `src/lib/utils/smartSlots.test.ts` | `lib/utils/smartSlots.ts` | Fluid Anchor алгоритм генерації слотів, обхід перерв/відпусток, запобігання накладанням. |
| `src/lib/utils/dynamicPricing.test.ts` | `lib/utils/dynamicPricing.ts` | Динамічне ціноутворення: markup на пікові години, discount floor на пусті вікна. |
| `src/lib/utils/broadcastUtils.test.ts` | `lib/utils/broadcastUtils.ts` | Персоналізація тексту розсилок, валідація тегів та фільтрів. |
| `src/lib/actions/__tests__/createBooking.action.test.ts` · `createBooking.test.ts` | `lib/actions/createBooking` | Створення запису: валідація, лояльність, dynamic price, розхідники. |
| `src/lib/actions/__tests__/referrals.test.ts` · `referrals.action.test.ts` | `lib/actions/referrals` | C2C/C2B/B2B реферальна механіка, FK-порядок транзакцій. |
| `src/lib/actions/__tests__/mono-webhook.test.ts` | Monobank webhook | Обробка вебхуку оплати, ідемпотентність. |
| `src/lib/notifications/__tests__/NotificationOrchestrator.test.ts` · `constants/notifMap.test.ts` | NotificationOrchestrator | Каскад TG→Push→SMS, notifMap, critical-only. |

**Повний реєстр файлів (звірено з `find src -name '*.test.ts'`):**

- **billing**: `pricing.test.ts`, `billing.test.ts`, `syncReferralAndBounty.test.ts`
- **actions**: `__tests__/createBooking.action.test.ts`, `__tests__/createBooking.test.ts`, `__tests__/referrals.test.ts`, `__tests__/referrals.action.test.ts`, `__tests__/partners.test.ts`, `__tests__/flashDeal.test.ts`, `__tests__/mono-webhook.test.ts`, `__tests__/pricing.math.test.ts`, `__tests__/support.test.ts`, `__tests__/waitlist.test.ts`, `UrlActionBus.test.ts`
- **notifications**: `__tests__/NotificationOrchestrator.test.ts`, `constants/notifMap.test.ts`
- **supabase hooks**: `hooks/useBookings.test.ts`, `hooks/useServices.test.ts`, `hooks/__tests__/analytics.unit.test.ts`
- **utils**: `bookingEngine.test.ts`, `broadcastUtils.test.ts`, `cn.test.ts`, `currency.test.ts`, `dates.test.ts`, `dynamicPricing.test.ts`, `errors.test.ts`, `now.test.ts`, `occupancy.test.ts`, `phone.test.ts`, `pluralUk.test.ts`, `slug.test.ts`, `smartSlots.test.ts`, `token.test.ts`, `url.test.ts`, `uuid.test.ts`, `verifyCronSecret.test.ts`
- **telegram**: `telegram.test.ts`, `telegram/phone.test.ts`
- **validations**: `validations/booking.test.ts`
- **api routes**: `app/api/auth/send-sms/route.test.ts`, `app/api/auth/verify-sms/schema.test.ts`, `app/auth/callback/route.test.ts`
- **app actions/tests**: `app/(master)/dashboard/products/__tests__/getProductStats.action.test.ts`, `app/(master)/dashboard/bookings/__tests__/stock.action.test.ts`
- **marketing story**: `components/master/marketing/story/storyConstants.test.ts`, `storySteps.test.ts`, `storyTemplates.test.ts`
- **testing (SEC-01)**: `lib/testing/e2eSeedGuard.test.ts`

---

## 🎭 Playwright E2E Tests (Реєстр інтеграційних тестів)

Розташовані в [e2e/tests/](file:///c:/Users/Vitos/SaaS/bookit/e2e/tests/). **36 spec-файлів.** Останній повний chromium-прогін (TEST-M6, 2026-07-08): **123 passed / 2 env-flake / 42 skipped**. «Env-flake» = проходять ізольовано, падають лише під `fullyParallel` проти віддаленої прод-БД (CI `retries:2` покриває; **SEC-01** усуне остаточно, перевівши e2e на локальну БД).

| Специфікація (Spec File) | Цільовий флоу | Примітки |
|---|---|---|
| `00-auth-contract.spec.ts` | SMS Auth контракт | Перевірка SMS OTP контракту та віртуальної пошти клієнта. |
| `00-role-login-smoke.spec.ts` | Логін по ролях | Smoke: майстер/клієнт/адмін логіняться у свою зону. |
| `01-auth-guards.spec.ts` | Роутинг та права (`middleware.ts`) | Захист `/dashboard` (тільки майстер) та `/my` (тільки клієнт), redirect-правила. |
| `02-time-travel-logic.spec.ts` | Слот-енджин | ⏱️ Час-залежний — debug-now cookie (`getNow()`). |
| `03-referral-engine.spec.ts` | Lifetime Alliance (B2B) | Реєстрація реферала, зарахування Reserve/Bounty. |
| `04-crm-logic.spec.ts` | CRM-дашборд | Розрахунок LTV, середнього чека, кількості візитів. |
| `04-master-crm-smoke.spec.ts` | CRM Smoke | Пошук, фільтрація, створення клієнтів з кабінету. |
| `05-loyalty-reviews.spec.ts` | Відгуки та бали | ⚠️ Env-flake ізольовано зелений. Star-селектор: «зірк» ≠ «5 зірок». |
| `06-referrals.spec.ts` | C2C Реферали | Клієнт ділиться посиланням, новий клієнт отримує знижку. |
| `07-notifications.spec.ts` | Notification Cascade | Запис `notification_logs`, пріоритет TG/SMS. |
| `08-booking-complete.spec.ts` | Запис клієнта | Повний цикл BookingWizard; крок «товари» опційний. |
| `08-notification-adoption.spec.ts` | Adoption UI | `ChannelBanner` у `/my/` при непідключеному TG/Push. |
| `09-master-settings.spec.ts` | Settings CRUD | Оновлення розкладу, блокування вихідних. |
| `09-settings-notifications.spec.ts` | Канали сповіщень | Тумблери In-App/Push/TG/SMS. |
| `10-master-bookings.spec.ts` | Ручний запис майстра | Feature-модель list/timeline/focus, wizard step-3, накладання часу. |
| `11-master-clients.spec.ts` | CRM клієнтів | Фільтрація за сегментами (VIP/Sleeping/At Risk). |
| `12-flash-deals.spec.ts` | Flash Deals | Створення флеш-акції, бронювання, авто-видалення. |
| `13-dynamic-pricing.spec.ts` | Dynamic Pricing | Зміна ціни у BookingWizard залежно від часу слоту. Badge-scoping через `data-testid`. |
| `14-client-journey.spec.ts` | Публічний профіль | Шлях від `/[slug]` до перегляду своїх записів; dual-tree `.first()`. |
| `15-analytics.spec.ts` | Аналітика кабінету | Weekly/Monthly дохід, CSV-експорт. |
| `16-mobile-smoke.spec.ts` | Mobile UI | Нижня Bento-панель, BottomSheet на мобілках. |
| `17-retention-loyalty-engine.spec.ts` | Rebooking cron | ⏱️ Час-залежний — debug-now cookie. |
| `18-marketing-broadcasts.spec.ts` | Broadcasts (сегменти) | Масова розсилка по сегментованій базі з тегами. |
| `19-services-loading.spec.ts` | Lazy Load / Skeleton | Відсутність мерехтіння при швидкому переході. |
| `20-stabilization-audit.spec.ts` | Accessibility & Perf | ARIA-атрибути, контрастність Premium UX. |
| `21-rls-security.spec.ts` | RLS Security | Ізоляція даних між майстрами/клієнтами на рівні RLS. |
| `auth.spec.ts` | Auth (legacy/загальний) | Загальний авторизаційний флоу. |
| `booking-flow.spec.ts` | Booking flow (smoke) | Наскрізний happy-path бронювання. |
| `broadcasts.spec.ts` | Broadcasts (happy-path) | ⚠️ Env-flake ізольовано зелений. Сегмент з отримувачами. |
| `master-crud.spec.ts` | Master CRUD | CRUD сутностей майстра. |
| `services-icons-visual.spec.ts` | Services icons (visual) | Візуальна перевірка іконок послуг. |
| `smoke.spec.ts` | Smoke | Базова доступність ключових сторінок. |
| `studio.spec.ts` | Studio | Studio-зона (coming-soon / beta). |
| `ux-premium.spec.ts` | Visual Regression | Порівняння скрінів Blossom/Studio/Frost з еталонами. |
| `zz-capture-visual.spec.ts` | Capture (visual) | Допоміжний захват скрінів (не gate). |
| `zz-capture-vercel.spec.ts` | Capture (Vercel) | Допоміжний захват проти деплою (не gate). |

---

## 🛠️ Інструкція зі стабілізації Flaky-тестів

1.  **Локальний запуск дебагу** (UI-режим):
    ```bash
    npx playwright test e2e/tests/12-flash-deals.spec.ts --ui
    ```
2.  **Аналіз трейсів**:
    ```bash
    npx playwright show-report
    ```
3.  **Запобігання Race Conditions**:
    *   **Заборонено**: фіксовані затримки `page.waitForTimeout(1000)`.
    *   **Правильно**: очікувати конкретний стан елемента: `await expect(page.locator('.toast')).toBeVisible()`.
4.  **Синхронізація часу**: тести з датами (`02-time-travel-logic`, `17-retention-loyalty-engine`) використовують debug-now cookie (`getNow()`), щоб уникнути нічних переходів та розбіжностей часових поясів (Kyiv TZ).
5.  **Env-flake (2 залишкові)**: `05-loyalty-reviews` + `broadcasts` проходять ізольовано, падають лише під `fullyParallel` проти віддаленої прод-БД. Корінь усуне **SEC-01** (локальна/dedicated БД замість прод).
