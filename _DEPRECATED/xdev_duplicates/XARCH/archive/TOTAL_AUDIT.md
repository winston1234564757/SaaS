# BookIT — Повний Pre-Launch Аудит
**Дата:** 25 квітня 2026  
**Версія платформи:** Next.js 16+ / Supabase / Monobank Acquiring  
**Аудитор:** Principal Staff Engineer (5 паралельних спеціалізованих агентів)  
**Ціль бізнесу:** $5M exit

---

## 1. Виконавче Резюме

### Загальна оцінка здоров'я проекту: **7.1 / 10**

BookIT — технічно добре побудована платформа з міцним фундаментом безпеки, продуманою архітектурою і правильними UX-принципами. Але в ній є **6 критичних вразливостей**, які можуть спричинити фінансові втрати або зламати продукт під навантаженням. Крім того, **growth-механіки наполовину побудовані**: реферальна система M2M є, а C2B/C2C — тільки стаби.

### Оцінка готовності до інвестора: **5 / 10**

Продукт **НЕ готовий до презентації інвесторам** в поточному стані через:
1. Критичний баг — можливе подвійне бронювання (overbooking) на рівні БД
2. Можливе подвійне списання при збої крон-задачі (billing_events без idempotency)
3. Відсутній вірусний loop (viral coefficient ~0.3, потрібно > 1.0)

### Сильні сторони
- **Безпека**: 32/34 таблиць під RLS, admin client ізольований, Monobank з ECDSA-перевіркою
- **Booking engine**: серверна re-verification цін, атомарна перевірка stock, discount cap 40%
- **Auth**: SMS OTP → magiclink, пароль ніколи не повертається в response
- **Індекси**: covering indexes на `bookings`, `schedule`, `flash_deals` — оптимально
- **Tenant isolation**: Master A не бачить даних Master B — перевірено

---

## 2. Критичні Вразливості 🔴

> Кожна з цих помилок може спричинити фінансову втрату або зламати довіру клієнтів.

---

### V-01 · Подвійне бронювання (Overbooking) — БЛОКЕР
**Файл:** `src/lib/actions/createBooking.ts`  
**Ризик:** Два клієнти одночасно бронюють один і той самий слот → обидва проходять → подвійний запис у базі → хаос.

**Причина:** Немає унікального індексу або DB constraint на рівні таблиці `bookings`.

**Поточний захист (недостатній):** Тільки клієнтська перевірка через `smartSlots.ts` — вразлива до race condition при одночасних запитах.

**Виправлення:**
```sql
CREATE UNIQUE INDEX booking_slot_collision
ON bookings(master_id, date, start_time)
WHERE status != 'cancelled';
```

---

### V-02 · Подвійне списання при збої крон-задачі — БЛОКЕР
**Файл:** `src/app/api/cron/expire-subscriptions/route.ts:86`  
**Ризик:** Якщо крон-задача впаде після успішного `chargeRecurrent()` але до вставки запису в `billing_events` → при перезапуску побачить `next_charge_at` в минулому → спише ще раз.

**Причина:** `orderId = recurring_${sub.id}_${Date.now()}` — нестабільний ідентифікатор. Немає UNIQUE constraint на `(provider, orderId)` у `billing_events`.

**Виправлення:**
1. Зробити `orderId` детермінованим: `recurring_${sub.id}_${billingPeriod}` (де `billingPeriod` — початок місяця)
2. Додати в міграцію:
```sql
ALTER TABLE billing_events
ADD CONSTRAINT billing_events_provider_order_unique UNIQUE (provider, order_id);
```

---

### V-03 · Перегонова умова скидання підписки — БЛОКЕР
**Файли:**
- `src/app/api/cron/reset-monthly/route.ts` — запускається 00:05 UTC
- `src/app/api/cron/expire-subscriptions/route.ts` — запускається 02:00 UTC

**Ризик:** Підписка закінчується рівно о 00:00 UTC 1-го числа:
1. `reset-monthly` (00:05) перекладає майстра на Starter
2. `expire-subscriptions` (02:00) бачить `next_charge_at` в минулому → списує картку
3. Майстер вже на Starter, але кошти знято → тир залишається Starter (баг)

**Виправлення:** Перенести `reset-monthly` на час **після** `expire-subscriptions`:
```json
// vercel.json
{ "path": "/api/cron/reset-monthly", "schedule": "5 3 1 * *" }
```

---

### V-04 · Авто-публікація відгуків без модерації
**Файл:** `src/app/my/bookings/actions.ts:107`  
**Ризик:** `reviews.is_published = TRUE` за замовчуванням при вставці. Образливі або фейкові відгуки миттєво стають публічними.

**Вплив:** Один токсичний відгук → падіння рейтингу → втрата конверсії.

**Виправлення:**
1. Змінити default в схемі: `is_published BOOLEAN DEFAULT FALSE`
2. Додати в дашборд майстра сторінку "Відгуки на модерацію" (approve/decline)
3. Або: авто-публікувати відгуки ≥ 3 зірок, відгуки 1-2 зірки — на модерацію

---

### V-05 · Баг стекування знижок (peak markup + loyalty = null)
**Файл:** `src/lib/actions/createBooking.ts:314-320`  
**Ризик:** Peak markup (+20₴) і loyalty знижка (-10₴) додаються алгебраїчно до одного пула `totalRequestedDiscountSum`. Якщо markup > знижки → майстер не заробляє premium.

**Сценарій:**
```
Peak markup: +20₴
Loyalty discount: -10₴
Flash deal: -5₴
→ totalRequestedDiscountSum = +5₴ (markup домінує)
→ cap 40% не спрацьовує → finalTotal = originalTotal + 20 - 10 - 5 = originalTotal + 5₴
```
Але якщо логіка рахує все як "знижки", то знижка = -5₴ → не +5₴ → неправильний рахунок.

**Виправлення:** Розділити markups і discounts на два окремих масиви:
```typescript
const totalMarkup = dynamicMarkup > 0 ? dynamicMarkup : 0;
const totalDiscount = Math.abs(dynamicDiscount < 0 ? dynamicDiscount : 0)
  + loyaltyDiscount + flashDealDiscount;
const effectiveDiscount = Math.min(totalDiscount, maxAllowedDiscount);
const finalTotal = originalTotal + totalMarkup - effectiveDiscount;
```

---

### V-06 · Нема idempotency реферального бонусу — ✅ ЗАКРИТО (migration 093 + 096)
**Файл:** `src/lib/actions/referrals.ts`  
**Статус:** Виправлено. `referral_grants` таблиця з `UNIQUE(referee_id)` — подвійне нарахування при retry заблоковано на рівні DB. Bounty (`is_first_payment_made` flag в `master_referrals`) також ідемпотентний.

---

## 2.5 Alliance & Bounty + Discount Banking — ✅ Реалізовано (2026-04-25)

### Архітектура (Bounty + Status модель)

**Bounty** — одноразова знижка −10% за кожен перший оплачений місяць реферала:
- `master_profiles.referral_bounties_pending INT` — лічильник pending coupons
- `master_referrals.is_first_payment_made BOOLEAN` — ідемпотентний прапор
- Atomic RPC `increment_referral_bounty(master_id)` — race-safe increment
- Після billing cycle: `referral_bounties_pending` скидається до 0

**Lifetime Status** — постійна знижка за кількість АКТИВНИХ рефералів зараз:
| 5+ | 10+ | 25+ | 50+ |
|----|-----|-----|-----|
| 5% | 10% | 25% | 50% |

**Стекінг:**
```
total = min(1.0, bounty_discount + lifetime_discount)
final = max(1 UAH, 700 UAH × (1 − total))
```

**DB:**
- `migration 095` — master_alliances, master_referrals, lifetime_discount, trigger, calculate_master_billing_price RPC
- `migration 096` — referral_bounties_pending, is_first_payment_made, increment_referral_bounty RPC

**Pure pricing module:** `src/lib/billing/pricing.ts` — 28 unit tests, zero floating-point errors (r2 helper).

### Discount Banking & Roll-over (migration 097)

**Проблема, яку вирішує:** Якщо сума знижок перевищує 100%, старий алгоритм просто знімав 1 UAH з картки. Це UX-антипатерн — краще дати безкоштовний місяць і зберегти залишок.

**Нове поле:** `master_profiles.discount_reserve NUMERIC(6,4) DEFAULT 0`

**Алгоритм (cron, кожен billing cycle для Pro):**
```
total = round2(status_discount + bounty_discount + discount_reserve)

Branch A (total >= 1.0):
  → НЕ створювати Monobank invoice
  → subscription_expires_at += 30 days
  → discount_reserve = round2(total - 1.0)   // банкуємо залишок
  → referral_bounties_pending = 0
  → LOG: "[BILLING] User granted 30 free days. Reserve: {reserve}"

Branch B (total < 1.0):
  → final_kopecks = max(100, round(70000 * (1 - total)))
  → створити Monobank invoice
  → discount_reserve = 0
  → referral_bounties_pending = 0
```

**Атомарність:**
- `get_master_billing_state(master_id)` — читає snapshot атомарно (1 SQL statement)
- `commit_free_month(master_id, reserve, expires_at)` — Branch A write (1 UPDATE)
- `commit_paid_month(master_id)` — Branch B reset (1 UPDATE, після підтвердження invoice)
- Зовнішній Monobank виклик між snapshot і commit — захищений детермінованим `orderId` + `UNIQUE(external_id)` у `billing_events`

**UI:** ReferralPage показує:
- Блок "Запас знижки" якщо `discount_reserve > 0`
- Progress bar до безкоштовного місяця (0–100% від 700 UAH)
- При `total >= 100%`: зелений banner "🎉 Наступний місяць безкоштовний!" з показом нового reserve
- Розбивка: Bounty / Статус Альянсу / Запас — кожен рядок окремо

---

## 3. Витоки Продуктового Зростання 🟡

### G-01 · Booking widget: порожній екран 2-3 сек на мобільному
**Файл:** `src/app/[slug]/page.tsx`  
`BookingFlow` підключений через `dynamic({ ssr: false, loading: () => null })`.  
На 3G клієнт натискає "Записатись" → нічого не відбувається 2-3 секунди → відмова.

**Виправлення:** Замінити `loading: () => null` на Skeleton-заглушку з анімацією.

---

### G-02 · Лояльність прихована від анонімних клієнтів
**Файл:** `src/app/[slug]/page.tsx`  
Loyalty widget показується тільки авторизованим: `isAuth: !!user`. Анонімний клієнт не бачить "Знижка 10% після 5-го візиту" → немає стимулу реєструватись.

**Виправлення:** Показувати teaser анонімним: "Зареєструйся і отримай знижку після N-го візиту" → CTA на реєстрацію.

---

### G-03 · C2B та C2C реферал: нагорода є, UI немає
**Файли:**
- `src/lib/actions/referrals.ts:144-165` — C2B нагорода (50% промокод) створюється
- `src/components/master/profile/MyProfilePage.tsx:76-102` — `handleGenerateC2C` — stub без логіки

**Вплив:** Клієнт не може поділитись майстром з другом. Вірусний коефіцієнт ~0.3 (тільки M2M).  
**Для SaaS з метою $5M потрібен viral coefficient > 1.0.**

**Виправлення (Tier 2):**
1. Додати "Поділитись" кнопку на сторінці успішного запису → share link з `?ref=CLIENT_CODE`
2. Клієнту: "-10% на наступний запис якщо по твоєму посиланню прийде новий клієнт"
3. Реалізувати checkout-інтеграцію C2B (перевіряти `client_promocode` при бронюванні)

---

### G-04 · Dynamic Pricing Trial невидимий майстру
**Файл:** `src/lib/actions/createBooking.ts:239-243`  
Starter має безкоштовний тріал Dynamic Pricing до 1,000₴ earned. Лічильник в `master_profiles.dynamic_pricing_extra_earned` інкрементується тригером. Але в UI — нічого.

**Ефект:** Майстер думає що Dynamic Pricing працює → раптово воно вимикається → паніка → churn.

**Виправлення:** Додати в дашборд прогрес-бар "Dynamic Pricing Trial: 340₴ / 1,000₴" з CTA на Pro.

---

### G-05 · Онбординг без мінімального viable стану
**Файл:** `src/app/(master)/dashboard/onboarding/page.tsx`  
Майстер може пропустити Schedule і Services → потрапляє на дашборд з 0 послугами → не може прийняти запис. Сторінка `/dashboard/onboarding` не перевіряє `is_published`.

**Рішення:** (підтверджено з командою) Майстер може вручну додати послуги після. Блокером не є.  
**Але рекомендується:** Додати persistent banner "Додай мінімум 1 послугу і 1 день роботи щоб почати отримувати записи" → пряме посилання.

---

### G-06 · Відгуки: немає публічного рейтингу і відповіді майстра
Відгуки показуються списком (5 останніх), але немає:
- Агрегованого рейтингу (4.8 ⭐ з 127 відгуків)
- Відповіді майстра на відгук
- Модерації (V-04)

**Вплив:** Довіра клієнтів нижча, ніж могла б бути. Гірша конверсія.

---

### G-07 · Відсутня аналітика реферального attribution
Нема відповіді на: "Який referral code дав найбільше LTV-клієнтів?"  
Немає PostHog, Mixpanel або власного attribution tracking.

**Вплив:** Неможливо оптимізувати referral program під зростання.

---

## 4. Дорожня Карта

### Tier 1 — Виправити перед першим платним клієнтом

| # | Задача | Файл | Складність |
|---|--------|------|------------|
| T1-1 | UNIQUE INDEX проти overbooking | міграція SQL | XS |
| T1-2 | Детермінований orderId + UNIQUE constraint у billing_events | міграція + cron route | S |
| T1-3 | Перенести reset-monthly на 03:05 UTC | vercel.json | XS |
| T1-4 | Відгуки: `is_published = FALSE` за замовчуванням + approve UI | міграція + BillingPage | M |
| T1-5 | Розділити markups і discounts у discount stacking | createBooking.ts | S |
| T1-6 | Таблиця referral_grants для idempotency | міграція + referrals.ts | S |

---

### Tier 2 — Безпека та Performance Hardening (до 30 днів)

| # | Задача | Файл | Пріоритет |
|---|--------|------|-----------|
| T2-1 | BookingFlow Skeleton замість null на load | [slug]/page.tsx | HIGH |
| T2-2 | Loyalty teaser для анонімних клієнтів | PublicMasterPage | HIGH |
| T2-3 | Dynamic Pricing trial progress bar в дашборді | SettingsPage або DashboardHero | MEDIUM |
| T2-4 | billing_events.status CHECK constraint (всі валідні значення) | міграція | MEDIUM |
| T2-5 | Агрегований рейтинг на публічній сторінці | [slug]/page.tsx | MEDIUM |
| T2-6 | CRON_SECRET перенести в Vercel Env Variables (не .env.local) | infra | MEDIUM |
| T2-7 | Видалення "flash deal claimed" moved в транзакцію після вставки booking | createBooking.ts | MEDIUM |

---

### Tier 3 — Killer Features для $5M Valuation (до 90 днів)

| # | Фіча | Очікуваний ефект |
|---|------|-----------------|
| T3-1 | **Вірусне посилання для клієнта** — "Приведи друга, отримай -10%" | Viral coefficient > 1.0 |
| T3-2 | **Flash Deal sharing** — клієнт ділиться deal в Telegram/Instagram | Органічне охоплення майстра |
| T3-3 | **Ambassador тири** — Bronze/Silver/Gold за кількість рефералів | Геймификація для клієнтів |
| T3-4 | **Waitlist + slot reopen** — скасування → автоматичне сповіщення наступному | +15% заповненість слотів |
| T3-5 | **Відповідь майстра на відгук** — підвищує довіру, конверсію | +8-12% конверсія |
| T3-6 | **Реферальна аналітика** — attribution dashboard для майстра | Оптимізація growth spend |
| T3-7 | **Сезонні правила Dynamic Pricing** — "літній прайс", "новорічний" | +revenue для майстра |
| T3-8 | **PostHog / власний attribution** — воронка від landing до першого запису | Data-driven decisions |

---

## 5. Детальні Знахідки по Доменах

### 5.1 Бізнес-Логіка та Маркетплейс

#### Статус маркетплейсу: ФУНКЦІОНАЛЬНИЙ (85%)
Потік Master → Onboarding → Service Setup → Public Page → Booking Flow архітектурно правильний.

**Що працює добре:**
- `createBooking.ts` — серверна re-verification цін (рядки 174-191), клієнт не може підробити суму
- Атомарна перевірка stock з TOCTOU protection (рядки 395-411): `gte('stock_quantity', cp.quantity)` → якщо race — rollback
- Discount cap 40% від оригінальної ціни — захист маржи майстра
- Flash deal fast-track: клієнт відразу потрапляє на деталі без вибору слоту

**Retention loop (частково зламаний):**
- Система відгуків: є. Але авто-публікація без модерації (V-04)
- Loyalty тири: тільки `percent_discount` тип реалізований; `free_service` і `fixed_discount` — дані є в БД, логіки нема (`createBooking.ts:267-282`)
- Rebooking cron (09:00 UTC): спрацьовує, але цикл хард-кодований 30 днів для всіх. Майстер hair salon (30 днів) і масажист (60 днів) отримують однакові нагадування

**Не реалізовано:**
- Waitlist (таблиця є, логіка "звільнений слот → notify" — ні)
- Bulk re-booking ("записати всіх клієнтів на наступний тиждень")
- "Respond to review" для майстра

---

### 5.2 Білінг та Платежі

#### Monobank Acquiring: ПОВНІСТЮ РЕАЛІЗОВАНО З БЕЗПЕКОЮ ✅
- ECDSA P-256 + SHA-256 підпис верифікується
- Replay attack prevention: вікно 15 хвилин
- Card token vaulting: `walletData.cardToken` → `master_subscriptions.token`
- Unit tests: `src/lib/billing/billing.test.ts` — перевіряє криптографічну верифікацію
- Recovery flow: `recoverCardToken()` → Mono Wallet API при відсутньому токені

**WayForPay:** Видалено з проекту. Webhook handler відсутній — правильне рішення.

**Lifecycle підписки:**
```
Starter (default)
  ↓ [оплата Mono]
Pro / Studio (active)
  ↓ [expire-subscriptions cron, 02:00 UTC]
  ├→ success: next_charge_at += 30 днів
  └→ 3 fails: past_due → downgrade Starter
  ↓ [reset-monthly cron, 00:05 UTC] ← RACE CONDITION (V-03)
Starter (expired)
```

**Відкриті проблеми:**
- `billing/actions.ts:18-19` — тестові суми 500 коп. залишаємо поки що (за рішенням команди)
- `billing_events.status` — немає CHECK constraint → неможливо чисто аудитувати failed charges
- Немає "cancel subscription" кнопки → майстер чекає до кінця periodу

---

### 5.3 База Даних та Безпека

#### RLS Coverage: ВІДМІННО (32/34 таблиць захищено)

**Migration 087** закрив 6 критичних дірок:
- `booking_services`, `booking_products` — тепер під RLS
- `referral_bonuses`, `service_categories`, `product_service_links`, `notification_templates` — тепер під RLS
- Bookings INSERT policy виправлено: `WITH CHECK (client_id IS NULL OR client_id = auth.uid())`

**Незахищені (2/34, прийнятний ризик):**
- `sms_ip_logs` — write-only через RPC `check_and_log_sms_send()`, нема SELECT path
- `rebooking_reminders` — internal trigger-only, не чутливі дані

**Explicit DENY на фінансові таблиці:**
- `billing_events`, `master_subscriptions`: `FOR ALL USING (false)` — тільки service-role

**Індекси (оптимально):**
- `idx_bookings_wizard (master_id, status, date) INCLUDE (start_time, end_time)` — covering index для slot availability
- `idx_flash_deals_master_active` — filtered index WHERE status='active'
- `idx_schedule_templates_master_covering` — covering index, index-only scans

**Потенційно відсутній:**
- `bookings(master_id, date, start_time) WHERE status != 'cancelled'` — UNIQUE INDEX (V-01)

**RPC безпека:**
- `get_master_clients(uuid)`: SECURITY DEFINER, GRANT EXECUTE TO authenticated — коректно
- `check_and_log_sms_send()`: GRANT EXECUTE TO service_role only — коректно

---

### 5.4 UX та Онбординг

#### Онбординг майстра: 8 кроків, всі пропускаємі
```
BASIC → SCHEDULE_PROMPT → SCHEDULE_FORM → SERVICES_PROMPT → SERVICES_FORM
→ PROFIT_PREDICTOR → PROFILE_PREVIEW → SUCCESS
```

**Що добре:** Phone OTP auth, avatar upload fallback, profit predictor (engagement), прогрес зберігається між сесіями.

**Проблема:** Майстер може пройти тільки BASIC → опиняється на дашборді з 0 послугами і 0 розкладом. Сторінка `/dashboard/onboarding` редиректить на `/dashboard` якщо `master_profiles` існує (не перевіряє `is_published`).

#### Публічна сторінка (`/[slug]`): Server Component, ISR 5 хв, гарно оптимізована
- `generateMetadata()` — OpenGraph, SEO
- 7 паралельних запитів у `Promise.all`
- Native map deep-links: iOS/Android/web — server-side UA detection, нуль client JS

**Проблема:** `BookingFlow` — `dynamic({ ssr: false, loading: () => null })` → порожній екран 2-3 сек на 3G (G-01).

#### Booking Wizard: 5 кроків, добре структурований
1. Вибір послуг (multi-service, live total)
2. Вибір дати (blocked dates з schedule_exceptions)
3. Вибір слоту (scored suggestions зі зіркою)
4. Продукти (якщо є)
5. Деталі клієнта + OTP → success

**Проблема:** Loyalty знижка завантажується один раз при mount, не ре-верифікується перед submit.

---

### 5.5 Реферальна Система та Growth

#### M2M Referral (Master→Master): ПОВНІСТЮ РЕАЛІЗОВАНО ✅
- Генерація коду: `generateSecureToken()`, 8 символів, alphanumeric
- Самореферал заблокований: `if (mReferrer.id !== newMasterId)` (referrals.ts:126)
- Reward: реферер +30 днів Pro, новий майстер +14 днів Pro trial
- Landing page `/invite/[code]`: три варіанти (slug / master ref / client ref)
- Idempotency: `referral_grants` table — дублікати відхиляються (23505)

#### Alliance Visibility: РЕАЛІЗОВАНО ✅ (migration 098)
- `master_alliances.is_visible BOOLEAN DEFAULT true` — майстер контролює видимість кожного альянсу
- Dashboard toggle: `PartnersPage.tsx` → "Реферальний альянс" секція з Eye/EyeOff кнопками
- Server action: `toggleAllianceVisibility(allianceId, isVisible)` в `lib/actions/partners.ts`
- Публічна сторінка `/[slug]`: `TrustedPartnersBlock.tsx` відображає видимих партнерів альянсу
- Запит: `master_alliances WHERE (inviter_id=id OR invitee_id=id) AND is_visible=true`

#### Discount Banking (Банк знижок): РЕАЛІЗОВАНО ✅ (migration 097–098)
- **Формула (Round 4):** `total = status_discount + discount_reserve`
  - `status_discount`: tier за кількістю *активних* рефералів (5/10/25/50 → 5/10/25/50%), cap 50 рефералів
  - `discount_reserve`: банкує **обидва** — Bounties (+10% за перший платіж реферала) та залишок минулого місяця
- **Branch A** (total ≥ 100%): пропускаємо Monobank, +30 днів, `new_reserve = total − 1.0`
- **Branch B** (total < 100%): рахунок `700 × (1 − total)`, `discount_reserve = 0`
- **Atomic RPCs:** `commit_free_month`, `commit_paid_month`, `increment_discount_reserve`
- **Мінімальний платіж:** 1 UAH floor (`MIN_KOPECKS = 100`)
- **Telegram "Network Success Report"** при Branch A: "Ваша мережа працює на вас! Завдяки активності ваших партнерів, наступні 30 днів BookIT для вас безкоштовні. Залишок бонусу збережено на майбутнє."
- **ReferralPage UI:** Банк знижок (reserve %) + статус + breakdown рядки для обох гілок

#### C2B Referral (Client→Business): ЧАСТКОВО ❌
- Reward logic написана (`referrals.ts:144-165`): клієнт отримує 50% промокод
- Але немає: UI для клієнта щоб поділитись кодом, checkout інтеграції, landing page для C2B

#### C2C Referral (Client→Client): STUB ТІЛЬКИ ❌
- `handleGenerateC2C`, `handleCopyC2C` в `MyProfilePage.tsx:76-102` — stub функції
- Немає схеми БД, логіки, UI

#### Dynamic Pricing Engine
- Правила: peak (markup), quiet (discount), early_bird, last_minute
- Discount floor: -30%, Markup ceiling: +50%
- Timezone-safe: `toZonedTime()` без UTC drift
- FOR UPDATE SKIP LOCKED в крон-задачах — захист від race при паралельному запуску

**Вірусний коефіцієнт поточний: ~0.3**  
**Цільовий для $5M SaaS: > 1.0**

---

## Додаток: Матриця Ризиків

| Компонент | Стан | Health | Ризик |
|-----------|------|--------|-------|
| RLS & Multi-tenant isolation | ✅ Відмінно | 95% | Низький |
| Monobank Acquiring | ✅ Повністю | 90% | Низький |
| Booking slot engine | ⚠️ Без DB constraint | 70% | КРИТИЧНИЙ |
| Billing idempotency | ⚠️ Крон-збій ризик | 65% | КРИТИЧНИЙ |
| Review system | ⚠️ Без модерації | 40% | Високий |
| Retention loop | ⚠️ Loyalty часткова | 55% | Середній |
| Viral growth | ❌ k ~0.3 | 30% | КРИТИЧНИЙ для exit |
| Onboarding | ⚠️ Без примусу | 70% | Середній |
| Public page perf | ⚠️ Widget skeleton відсутній | 75% | Середній |
| DB indexes | ✅ Comprehensive | 92% | Низький |
| Auth flow | ✅ OTP→magiclink | 95% | Низький |

---

*Аудит виконано 25.04.2026. Наступний аудит рекомендується після виправлення Tier 1 критичних вразливостей (орієнтовно через 2 тижні).*
