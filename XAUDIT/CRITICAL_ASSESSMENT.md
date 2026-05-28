# BookIT — Критична оцінка проекту

> Дата: 2026-05-21
> Аналіз: 64,904 рядки продакшн-коду + 6,232 рядки тестів + 134 SQL міграції + вся документація

---

## Зміст

1. [Загальний огляд](#1-загальний-огляд)
2. [Геніальні рішення](#2-геніальні-рішення)
3. [Жахливі речі](#3-жахливі-речі)
4. [Проблеми безпеки](#4-проблеми-безпеки)
5. [Проблеми архітектури](#5-проблеми-архітектури)
6. [Проблеми бізнес-логіки](#6-проблеми-бізнес-логіки)
7. [Проблеми UI/коду](#7-проблеми-uikоду)
8. [Якість тестування](#8-якість-тестування)
9. [Метрики](#9-метрики)
10. [Рекомендації](#10-рекомендації)

---

## 1. Загальний огляд

**BookIT** — преміальний SaaS для б'юті-індустрії (Україна). Next.js 16 + React 19 + Supabase + Tailwind CSS v4 + Framer Motion v12.

**Три зони:**
- B2B Master (`/dashboard/**`, `/onboarding/**`)
- B2C Client (`/my/**`)
- Public (`/[slug]`, `/explore`, `/studio/[slug]`)

**Ключові системи:**
- Notification Cascade v7 (In-App → Push → Telegram → SMS)
- Smart Slots Engine (Fluid Anchor алгоритм)
- Dynamic Pricing (±30% floor, +50% ceiling)
- Monobank billing (ECDSA P-256 + SHA-256)
- Referral system (B2B Alliance, C2C, C2B Barter, Cartel)
- URL Action Bus
- 3 теми (Blossom/Studio/Frost)

---

## 2. Геніальні рішення

### 2.1 Архітектура

| № | Рішення | Чому геніально |
|---|---|---|
| 1 | **Notification Cascade v7** — єдиний `NotificationOrchestrator.send()` як dispatch point. Cascade: In-App+Push (паралельно) → Telegram (push fallback) → SMS (critical + no free channel). 21 event type в `notifMap.ts` з per-channel шаблонами. | Модульність, graceful degradation, єдина точка змін |
| 2 | **URL Action Bus** — `useUrlActionBus<T>(actionType, handler)` з Zod validation + auto URL cleanup. Deep linking через `?_action=<type>` без base64. Generator: `buildActionUrl<T>()`. | Асинхронна командна шина через URL, без додаткових серверів |
| 3 | **URL-driven navigation + useRealtimeNotifications** — поєднання nuqs + Server-Sent Events через Supabase Realtime | Чистий реактивний UX |
| 4 | **3-Phase Registration Pattern**: Upsert master_profiles → applyReferralRewards → Pro upgrade. `ignoreDuplicates: true` гарантує FK safety. | Жодного race condition при реєстрації |
| 5 | **Ambient Background System** — blobs (`@keyframes`), grain (`body::after` SVG), vignette (`body::before`). Все CSS, нуль JS. | Продуктивність, атмосферність |

### 2.2 Безпека

| № | Рішення | Чому геніально |
|---|---|---|
| 6 | **SMS OTP** — `timingSafeEqual` з `node:crypto`, атомарне rate limiting через `pg_advisory_xact_lock`, dual rate limit (phone + IP), 10-хвилинний expiry, fail-closed | Зразкова OTP безпека |
| 7 | **Monobank webhook** — ECDSA P-256 + SHA-256, public key cache з 24h TTL + примусовий refresh при фейлі, replay protection 15 хвилин | Криптографічно правильна реалізація |
| 8 | **Auth callback open redirect protection** — екстракція тільки `pathname+search`, відкидання зовнішніх URL. Cookie-based role confirmation. Allowlist для `intended_plan` (pro/studio тільки) | Захист від forgery |
| 9 | **Idempotency всюди** — `billing_events` unique index `(payment_id, provider)`, `referral_grants` UNIQUE(referee_id), booking claim via `is('client_id', null)` atomic guard | Грає роль retry-безпеки |
| 10 | **Cron auth** — всі 5 cron routes перевіряють `Authorization: Bearer {CRON_SECRET}`. `FOR UPDATE SKIP LOCKED` запобігає double-charging | Надійний cron захист |
| 11 | **RLS стратегія** — всі таблиці з RLS, `billing_events` та `master_subscriptions` з `FOR ALL USING (false)` — тільки service_role. `bookings` INSERT policy блокує чужий `client_id` | Хороша defense-in-depth (якби не bypass) |

### 2.3 Бізнес-логіка

| № | Рішення | Чому геніально |
|---|---|---|
| 12 | **Pricing Engine** — всі ціни в копійках (int). Чисті pure functions без I/O. `r2()` виправляє FP errors. `Math.max(MIN_KOPECKS, ...)`. Discount stacking з cap 40% | Жодного floating-point money |
| 13 | **Smart Slots Engine** — Fluid Anchor алгоритм. Buffer integration в collision detection. Safety buffer 30min для today's slots через `toZonedTime`. `isOverlapping`: `s1 < e2 && e1 > s2` | Математично правильний |
| 14 | **Атомарне стеження запасів** — `gte('stock_qty', cp.quantity)` в UPDATE. Якщо stock вичерпано — zero rows matched | Жодного overselling |
| 15 | **Starter Booking Limit** — month boundary в timezone майстра, виключає cancelled | Чесний ліміт |
| 16 | **C2C Self-Referral Prevention** — перевірка і clientId, і phone (для anonymous) | Повний захист |
| 17 | **Checkpoint Lifetime Discount** — migration 135: тільки збільшується, ніколи не зменшується. Billing: `max(computed, stored)` | Справедливість discount |
| 18 | **Discount Banking** — коли discount >= 100%, залишок banking в `discount_reserve` | Жодної втраченої знижки |
| 19 | **Barter Override** — повністю заміняє всі інші знижки або нічого | Чиста логіка |

### 2.4 UI / Frontend

| № | Рішення | Чому геніально |
|---|---|---|
| 20 | **Тритемна CSS-архітектура** — Blossom/Studio/Frost через CSS custom properties на `[data-theme]`. Нульовий JS overhead. | Продуктивність, гнучкість |
| 21 | **Pure CSS animations** — ambient blobs, grain, vignette, shimmer skeletons, ticker strip, accent-breathe. Все `@keyframes`. | Немає JS animation overhead |
| 22 | **AnimatePresence `mode="popLayout"`** — нуль instances `mode="wait"`. BookingWizard, BentoCard, Button — правильні spring/while-tap | Жодного zero-height flash |
| 23 | **Desktop/Mobile adaptive modals** — `MicaModal` (desktop) vs `BottomSheet` (vaul, mobile). iOS handle + `pb-32` | Правильний mobile-first UX |
| 24 | **Bento Grid desktop dashboard** — `lg:grid-cols-4` asymmetric: Identity(col-span-2 row-span-2), Intelligence(col-span-2), Action(col-span-1), Metrics(col-span-2) | Інформаційна ієрархія |
| 25 | **TanStack Query hook library** — 23 hooks з proper staleTimes (30s-10min). `placeholderData: keepPreviousData` у всіх schedule/analytics | Жодного blank flash |

### 2.5 DevOps / Інфраструктура

| № | Рішення | Чому геніально |
|---|---|---|
| 26 | **E2E Infrastructure** — 6 ізольованих акаунтів, global setup через Supabase Admin API, human emulation (`humanType`, `think`, `scrollAndFocus`), production safety guard | Enterprise-grade e2e |
| 27 | **Комплексне SQL-тестування** — `referral_system_test.sql` з 9 тестами, включаючи idempotency та checkpoint | DB logic verified |
| 28 | **PWA з SW v4** — `sw.js`, manifest, dynamic icons route, offline fallback | Production-ready PWA |

---

## 3. Жахливі речі

### 🚨 (CRITICAL) Проблеми, що потребують негайного втручання

#### 3.1 `createAdminClient()` використовується 153+ рази — RLS марний

**Файли:** `src/lib/supabase/admin.ts`, десятки Server Actions, API routes

`createAdminClient()` з `service_role` key повністю bypass-ить **всі RLS поліси**. Використовується в:

- **Server Actions** (user-facing):
  - `src/app/(master)/dashboard/bookings/actions.ts`
  - `src/app/(master)/dashboard/clients/actions.ts`
  - `src/app/(master)/dashboard/products/actions.ts`
  - `src/app/(master)/dashboard/portfolio/actions.ts`
  - `src/app/(master)/dashboard/flash/actions.ts`
  - `src/app/(master)/dashboard/actions.ts`

- **Public pages:**
  - `src/app/[slug]/data.ts` — публічний профіль майстра

- **Booking creation:**
  - `src/lib/actions/createBooking.ts` — кожна DB операція через admin

- **Auth flows:**
  - `verify-sms`, `send-sms`, `telegram webhook`, `telegram auth`

**Чому це жахливо:**
- Будь-який баг в authorization gate Server Action відкриває всю БД
- RLS — defense-in-depth. Bypass знищує цей захист
- CLAUDE.md каже: "Admin operations → `createAdminClient()` тільки — ніколи inline". Реальність зворотна

**Приклад з `createBooking.ts`:**
```ts
const supabase = await createClient();      // ← тільки для auth.getUser()
const admin = createAdminClient();           // ← все через admin
```

#### 3.2 Pricing divergence: `createBooking.ts` vs `computeBookingPrice.ts`

**Файли:**
- `src/lib/actions/createBooking.ts` (рядки 440-477)
- `src/lib/actions/computeBookingPrice.ts` (рядки 132-180)

Однаковий вхід → різний вихід:

| Аспект | `createBooking.ts` | `computeBookingPrice.ts` |
|---|---|---|
| Dynamic markup/discount | Роздільні | Єдиний modifier |
| База для знижок | `originalTotal` | `subTotal` (adjusted) |
| Механізм cap | 40% окремо, markup після | Все в один pool |
| Flash deal base | `originalTotal * %` | `subTotal * %` |

**Приклад:** 1000 грн послуги + 200 грн товари, peak +20%, flash 10%:

```
createBooking.ts:      1280 грн
computeBookingPrice.ts: 1260 грн  ← 20 грн різниця
```

**Impact:** Будь-який UI, що використовує `computeBookingPrice`, показує неправильну ціну. Клієнт бачить одну ціну, майстру нараховується інша.

#### 3.3 `proxy.ts` не існує — architecture debt

**Документація (CLAUDE.md):**
> `src/proxy.ts` — `export async function proxy(request: NextRequest)` — заміняє `middleware.ts`. Файл `src/middleware.ts` re-exports `proxy`.

**Реальність:**
- `src/proxy.ts` **не існує**
- Вся логіка в `src/middleware.ts` (153 рядки)
- `SYSTEM_MAP.md` теж згадує proxy.ts (рядок 229)

**Impact:** Документація і код — паралельні всесвіти. Рефакторинг middleware буде зламаний.

#### 3.4 `notifyClientBroadcast` bypass-ить NotificationOrchestrator

**Файл:** `src/lib/notifications.ts` (рядки 313-379)

380 рядків дубльованої логіки dispatch (in-app insert, push, telegram, SMS) з власним fetch та error handling. **Пряме порушення** CLAUDE.md: "NotificationOrchestrator — єдина точка dispatch".

**Impact:**
- Якщо каскад зміниться (наприклад, додасться новий канал), broadcast треба змінювати окремо
- Різна обробка помилок в broadcast та orchestrator

### 🔴 (HIGH) Серйозні проблеми

#### 3.5 Flash deal base amount divergence

| Файл | Формула |
|---|---|
| `createBooking.ts:450` | `originalTotal * flashDealDiscountPct / 100` |
| `computeBookingPrice.ts:144` | `subTotal * Number(deal.discount_pct) / 100` |

Якщо dynamic pricing змінює ціну — flash deal має різний base.

#### 3.6 Barter + Trial accounting inflation

**Файл:** `createBooking.ts:474-486`

Коли barter override активний:
- `dynamicExtraKopecks` обчислюється (рядок 484)
- Але dynamic pricing ігнорується в final price (рядок 477)

Trial trigger `fn_dp_trial_earned_on_complete` читає `dynamic_extra_kopecks` — inflate trial counter. Майстер не заробив extra через dynamic pricing, але trigger думає що заробив.

#### 3.7 Early Bird daysAhead — timezone mismatch

**Файл:** `src/lib/utils/dynamicPricing.ts:56-58`

```ts
const todayYMD = new Date(now.getFullYear(), now.getMonth(), now.getDate());
```

- `now.getFullYear()` — server local timezone (UTC в Vercel)
- `slotDateTime` — timezone майстра (Europe/Kyiv UTC+3)

**Біля півночі (23:00-02:00 UTC):**
- Kyiv 2026-05-21 02:00 = UTC 2026-05-20 23:00
- `todayYMD` = 2026-05-20 (UTC, WRONG)
- `daysAhead` = 2 (should be 1)
- Early bird активується на день раніше

#### 3.8 `MonoProvider` — dead code

**Файли:** `src/lib/billing/MonoProvider.ts`, `src/app/api/billing/test-charge/route.ts`

Клас implements `PaymentProvider`, але використовується **тільки** test-charge route. Production billing (`createMonoInvoice`) викликає Monobank API напряму.

| Параметр | `MonoProvider` | Production (actions) |
|---|---|---|
| walletId | `bookit_master_{uid}` | `bookit_{uid}` |
| type | Відсутній | `subscription` |
| validity | Відсутній | Присутній |
| paymentType | Відсутній | Присутній |
| basketOrder | Відсутній | Присутній |

**Impact:** Абстракція вводить в оману. Test-charge тестує не той шлях, що в production.

#### 3.9 76 `console.log` — інформаційний leak

**Найгірші порушники:**
- `api/billing/mono-webhook/route.ts`: **27 logs** — bytes підпису, pubkey, X-Sign, raw body, cardToken prefix
- `api/auth/*` routes: phone numbers, user IDs, OTP flow status
- `api/cron/*` routes: processed counts, subscription IDs

В Vercel production logs це доступно. Не OTP/паролі, але assists attacker.

#### 3.10 Plaintext card tokens в БД

**Таблиця:** `master_subscriptions.token`

- RLS з нульовими полісами (implicit deny) — тільки service_role
- Але без encryption-at-rest
- Якщо admin client скомпрометовано — всі токени відкриті

#### 3.11 Telegram `sendMessage` без timeout

**Файл:** `src/lib/telegram.ts:20-45`

```ts
const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {...});
```

Немає `AbortController`. Якщо Telegram API зависне — каскад сповіщень зупиниться назавжди.

#### 3.12 WayForPay secret — dead secret

`WAYFORPAY_MERCHANT_SECRET` в `.env.local`, `.env.prod`, але:
- Немає WayForPay provider в `src/lib/billing/`
- Немає WayForPay webhook route
- Таблиця `payments` має `wayfopay_order_ref` — legacy

Stale secret = ризик.

#### 3.13 Referral code case sensitivity

**Файл:** `src/lib/actions/referrals.ts:122, 217-218`

```ts
.eq('referral_code', refCode)  // PostgreSQL case-sensitive
```
Код генерується через `generateSecureToken(6)` (uppercase + digits). Користувач вводить lowercase → silent fail. Ні `ilike`, ні нормалізації.

#### 3.14 Loyalty — permanent discount

**Файл:** `createBooking.ts:304-313`

```ts
const qualifyingRule = (loyaltyRules ?? []).find(r =>
    r.reward_type === 'percent_discount' && totalVisitsWithThisOne >= r.target_visits
);
```

Один раз досяг `target_visits` → знижка **на кожне бронювання назавжди**. Немає "one-time" flag, немає cooldown. При `target_visits: 5` клієнт з 20 візитами отримує знижку на кожне бронювання вічно.

#### 3.15 `GRANT ALL TO anon` в міграції 003

```sql
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
```

- RLS пом'якшує, але будь-яка таблиця без RLS — публічна
- `ALTER DEFAULT PRIVILEGES` — нові таблиці теж публічні
- Якщо RLS вимкнено на міграції — миттєва експозиція

### 🟡 (MEDIUM) Помірні проблеми

#### 3.16 43 `any` type violations + 22 ad-hoc interfaces

**Приклади `any`:**
- `FlashDealPage.tsx`: `activeServices: any[]`, `availableSlots: any[] | null`
- `DynamicPricingPage.tsx`: 7+ `(v: any)` onChange handlers
- `LoyaltyPage.tsx`: `(data ?? []).map((p: any) =>`
- `ShopPage.tsx`: `workingHours?: any; schedule?: any[]`
- `BookingDetailsModal.tsx`: `(s: any)`, `(p: any)`
- `BentoBottomNav.tsx`: `NavItem`, `BentoTile` — `any` props

**Ad-hoc interfaces (мають бути в `database.ts`):**
- `VerticalTimeline.tsx`: `BreakWindow` — існує в database.ts!
- `ShopPage.tsx`: `CartItem` — є `OrderItem`
- `MyBookingsPage.tsx`: `OrderProduct`, `BookingService`
- `BroadcastEditor.tsx`, `MarketingTabs.tsx`, `BroadcastsTab.tsx`: `Product`

#### 3.17 No-Emoji Policy violations

- `BookingWizard.tsx:261`: `🔒` lock icon (має бути Lucide `Lock`)
- `LandingPageContent.tsx`: український прапор `🇺🇦`

#### 3.18 `fmtDate` — timezone-dependent

**Файл:** `src/lib/notifications/constants/notifMap.ts:17-20`

```ts
function fmtDate(date: string): string {
  const d = new Date(date + 'T00:00:00');
  return `${d.getDate()} ${UA_MONTHS[d.getMonth()]}`;
}
```

`new Date('2026-05-16T00:00:00')` парсить в local timezone. В Node.js на Vercel — UTC. Якщо сервер в UTC, а майстер в UTC+3, дата може зміститися на день.

#### 3.19 Phone normalization — неочікувані формати

**Файл:** `src/lib/validations/booking.ts:17-38`

- `0991234567` (10 digits) → `+380991234567` ✅
- `380991234567` (12 digits) → `+380991234567` ✅
- `080991234567` (12 digits, starts with 0) → `+080991234567` ❌ (regex fail, неясна помилка)

#### 3.20 `computeEndTime` — silent truncation at 23:59

**Файл:** `src/lib/utils/bookingEngine.ts:89`

```ts
const endMin = Math.min(h * 60 + m + durationMinutes, 23 * 60 + 59);
```

23:00 + 120min → capped at 23:59. Втрачає 61 хвилину. UI не попереджає.

#### 3.21 `scoreSlots` tiebreaking non-deterministic

`topScore - 1` threshold + нестабільний `.sort()`. При багатьох tied slots вибір 3 suggested — implementation-dependent.

#### 3.22 Telegram webhook — silent error swallow

```ts
try {
  ...
} catch (error) {
  return NextResponse.json({ ok: true });
}
```

Повертає `{ ok: true }` на всі помилки. Telegram не retry-ить, але помилки тихо губляться.

### 🟢 (LOW) Дрібні проблеми

#### 3.23 `ensureTelegramClientIdentity` — завжди client_profiles

Створює `client_profiles` навіть для master role. Має створювати `master_profiles` для master role.

#### 3.24 Stale docs

- `UI_MAP.md`: "Handles fonts (Inter, Playfair Display)" → реальність: Geist + Cormorant
- `SYSTEM_MAP.md`: згадує proxy.ts (не існує)
- `CLAUDE.md`: згадує proxy.ts (не існує)

#### 3.25 `database.ts` — missing fields

`MasterProfile` пропускає:
- `lifetime_discount`
- `discount_reserve`
- `c2c_enabled`
- `c2c_discount_pct`

Весь billing код звертається через RPC, TypeScript не ловить помилки.

#### 3.26 Orphaned таблиці

- `referral_links` (migration 057) — superseded by profile-based codes
- `referral_bounties_pending` (завжди 0, kept for compat)

#### 3.27 `processRegistrationReferral` — dead code

Legacy функція, ніде не викликається. Створює confusion.

#### 3.28 `subscription_downgraded` — немає SMS шляху

`sms: null`, але downgrade — billing подія, яка може потребувати критичного SMS.

#### 3.29 C2C Settings UI missing

Master має `c2c_enabled` DB поле, але немає перемикача в `SettingsPage.tsx`.

#### 3.30 Marketing page — B2B Alliance не згадано

"Earn Pro for free" — сильна competitive advantage, але не описана на landing page.

---

## 4. Проблеми безпеки

### 4.1 Матриця

| ID | Проблема | Severity | Status |
|---|---|---|---|
| S-01 | 153+ `createAdminClient()` usages bypass RLS | **CRITICAL** | Open |
| S-02 | Plaintext card tokens в DB | **HIGH** | Open |
| S-03 | 76 `console.log` з payment/signature даними | **HIGH** | Open |
| S-04 | WayForPay secret — dead secret | **HIGH** | Open |
| S-05 | Telegram sendMessage без timeout | **HIGH** | Open |
| S-06 | `GRANT ALL TO anon` | **MEDIUM** | Open |
| S-07 | CSP `unsafe-inline` + `unsafe-eval` | **MEDIUM** | Required by Next.js |
| S-08 | Telegram webhook — no auth (by design) | **MEDIUM** | By design |
| S-09 | Referral code case sensitivity → silent fail | **MEDIUM** | Open |
| S-10 | Barter + trial accounting inflation | **HIGH** | Open |
| S-11 | Webhook replay protection incomplete (recurring) | **MEDIUM** | Open |
| S-12 | `fn_increment_booking_counter` без `SECURITY DEFINER` | **LOW** | Open |
| S-13 | `ensureTelegramClientIdentity` створює client_profiles для masters | **LOW** | Open |
| S-14 | Subscription webhook race condition (cron + webhook) | **LOW** | Brief window, data consistent |

### 4.2 Що працює добре

| Аспект | Статус |
|---|---|
| SMS OTP — timingSafeEqual + atomic rate limiting | ✅ Зразково |
| Monobank webhook — ECDSA verify + key rotation | ✅ Зразково |
| Auth callback — open redirect protection | ✅ Зразково |
| Cron auth — Bearer CRON_SECRET на всіх | ✅ |
| RLS design — all tables enabled, billing tables explicit deny | ✅ |
| SMS rate limiting — dual per-phone + per-IP | ✅ |
| Booking claim — atomic `is('client_id', null)` | ✅ |
| DB triggers — SECURITY DEFINER (більшість) | ✅ |
| Push subscribe — auth via SSR client | ✅ |

---

## 5. Проблеми архітектури

### 5.1 Матриця

| ID | Проблема | Severity | Статус |
|---|---|---|---|
| A-01 | `proxy.ts` не існує | **CRITICAL** | Open |
| A-02 | `notifyClientBroadcast` bypass-ить Orchestrator | **HIGH** | Open |
| A-03 | `MonoProvider` — dead code | **HIGH** | Open |
| A-04 | Pricing divergence (createBooking vs computeBookingPrice) | **CRITICAL** | Open |
| A-05 | `processRegistrationReferral` — dead code | **LOW** | Open |
| A-06 | TanStack Query staleTimes — немає централізованого config | **LOW** | Розкидано по hooks |
| A-07 | `database.ts` missing billing/referral fields | **MEDIUM** | Open |
| A-08 | C2C settings UI — відсутня | **MEDIUM** | Open |
| A-09 | Billing webhook + cron race на recurring | **LOW** | Brief window |

### 5.2 Документація vs реальність

| Що сказано | Де | Реальність |
|---|---|---|
| `src/proxy.ts` exports `proxy` | CLAUDE.md, SYSTEM_MAP.md | Файл не існує |
| Admin client — тільки для admin ops | CLAUDE.md | 153+ usages, default |
| "Inter, Playfair Display" | UI_MAP.md | Geist + Cormorant |
| `MonoProvider` — billing provider | Код | Dead code, production bypass |
| Orchestrator — single dispatch | CLAUDE.md | broadcast bypass-ить |

---

## 6. Проблеми бізнес-логіки

### 6.1 Матриця

| ID | Проблема | Severity | Локація |
|---|---|---|---|
| B-01 | Pricing divergence (1280 vs 1260) | **CRITICAL** | createBooking.ts / computeBookingPrice.ts |
| B-02 | Flash deal base divergence | **HIGH** | createBooking.ts:450 / computeBookingPrice.ts:144 |
| B-03 | Barter + trial accounting inflation | **HIGH** | createBooking.ts:474-486 |
| B-04 | Early bird timezone mismatch | **HIGH** | dynamicPricing.ts:56-58 |
| B-05 | Loyalty — permanent discount (no one-time) | **MEDIUM** | createBooking.ts:304-313 |
| B-06 | Referral code case sensitivity | **MEDIUM** | referrals.ts:122 |
| B-07 | Phone normalization edge case | **LOW** | validations/booking.ts:17-38 |
| B-08 | computeEndTime truncation at 23:59 | **LOW** | bookingEngine.ts:89 |
| B-09 | scoreSlots tiebreaking non-deterministic | **LOW** | smartSlots.ts:260-272 |
| B-10 | fmtDate timezone-dependent | **MEDIUM** | notifMap.ts:17-20 |
| B-11 | Last minute `hoursAhead > 0` (exact time excluded) | **LOW** | dynamicPricing.ts:68 |
| B-12 | `send-story` auth via admin + Bearer token | **MEDIUM** | api/marketing/send-story/route.ts |
| B-13 | `partners.ts` insert partial failure risk | **LOW** | partners.ts:68-73 |

### 6.2 Що працює коректно

| Логіка | Статус |
|---|---|
| Slot collision detection | ✅ Математично правильний |
| Safety buffer для today's slots | ✅ Timezone-aware |
| Phone normalization (3 formats) | ✅ Multi-format |
| Starter booking limit | ✅ Timezone-aware, excluding cancelled |
| Stock overselling prevention | ✅ Atomic gte UPDATE |
| C2C self-referral prevention | ✅ ID + phone check |
| Dynamic pricing clamping (-30% / +50%) | ✅ Tested |
| Early bird vs last minute mutual exclusivity | ✅ else-if |
| Barter override (complete discount replacement) | ✅ Correct in both functions |

---

## 7. Проблеми UI/коду

### 7.1 Матриця

| ID | Проблема | Severity | Локація |
|---|---|---|---|
| U-01 | 43 `any` types | **MEDIUM** | FlashDealPage, DynamicPricingPage, LoyaltyPage, та ін. |
| U-02 | 22 ad-hoc interfaces duplicating database.ts | **MEDIUM** | VerticalTimeline, MyBookingsPage, та ін. |
| U-03 | No-Emoji Policy violation: `🔒` | **LOW** | BookingWizard.tsx:261 |
| U-04 | Landing page flag emoji | **LOW** | LandingPageContent.tsx |
| U-05 | BookingWizard 430 рядків — high complexity | **MEDIUM** | BookingWizard.tsx |
| U-06 | `master_day_briefing` inline pluralUk | **LOW** | notifMap.ts:307 |
| U-07 | `subscription_paid` expiresAt raw (без форматування) | **LOW** | notifMap.ts |
| U-08 | `reply_markup` type `unknown` | **LOW** | telegram.ts |

### 7.2 Стильові порушення CLAUDE.md

| Правило | Порушення | Де |
|---|---|---|
| No-Emoji Policy | `🔒`, `🇺🇦` | BookingWizard, LandingPageContent |
| `pluralUk` завжди | `count === 1 ? 'запис' : 'записів'` | notifMap.ts |
| `any` заборонено | 43 `any` | FlashDealPage та ін. |
| database.ts — єдине джерело типів | 22 ad-hoc interfaces | VerticalTimeline та ін. |

---

## 8. Якість тестування

### 8.1 Unit-тести

| Файл | Рядків | Тестів | Оцінка |
|---|---|---|---|
| `src/lib/billing/billing.test.ts` | 45 | 3 | 🟡 Тільки криптографія, не тестує MonoProvider |
| `src/lib/billing/pricing.test.ts` | 179 | 24 | 🟢 Відмінно, всі гілки |
| `src/lib/notifications/__tests__/NotificationOrchestrator.test.ts` | 46 | 1 | 🔴 1 тест на 161 рядок логіки |
| `src/lib/utils/broadcastUtils.test.ts` | 115 | 18 | 🟢 Добре |
| `src/lib/utils/dynamicPricing.test.ts` | 144 | 17 | 🟢 Добре |
| `src/lib/utils/smartSlots.test.ts` | 379 | 24 | 🟢 Відмінно |

### 8.2 E2E тести

| Метрика | Значення |
|---|---|
| Spec-файлів | 30 |
| Рядків e2e | 4,247 |
| Page Objects | 20 (855 рядків) |
| Браузери | Chrome, Safari, Mobile Safari, Mobile Chrome |
| Час виконання | 15 min global timeout |
| Human emulation | `humanType`, `think`, `scrollAndFocus` |

### 8.3 Прогалини

| Що не тестується | Severity |
|---|---|
| `createBooking.ts` server action | 🔴 Critical |
| `computeBookingPrice.ts` (цінова divergence не виявлена) | 🔴 Critical |
| `NotificationOrchestrator` (SMS, push, fallback, errors) | 🔴 Critical |
| `MonoProvider.ts` (production billing flow) | 🔴 High |
| React компоненти (RTL/jsdom) | 🟡 Medium |
| API routes (webhooks, cron) | 🟡 Medium |
| Visual regression (3 теми) | 🟡 Medium |

### 8.4 Загальна статистика

| Метрика | Значення |
|---|---|
| Продакшн-код | 64,904 рядків |
| Тестовий код | 6,232 рядків |
| **Ratio** | **9.6%** |
| Coverage config | **Відсутній** |
| Vitest config | **Відсутній** |

---

## 9. Метрики

### 9.1 Загальні

| Метрика | Значення |
|---|---|
| Продакшн-код (src/) | 64,904 рядків |
| Unit-тести | 908 рядків / 6 файлів |
| E2E тести | 4,247 рядків / 30 spec |
| SQL міграції | 134 |
| Компоненти | ~120+ |
| Page Objects | 20 |
| TanStack Query hooks | 23 |
| Runtime залежності | 54 |
| Dev залежності | 18 |

### 9.2 Якісні

| Метрика | Значення | Оцінка |
|---|---|---|
| `createAdminClient` usages | 153+ | 🔴 Critical |
| `any` types | 43 | 🟡 Погано |
| `console.log` | 76 | 🟡 Багато |
| `mode="wait"` instances | 0 | 🟢 Ідеально |
| RLS-enabled tables | ~30 | 🟢 Добре |
| No-Emoji violations | 2 | 🟢 Добре |
| Тест/код ratio | 9.6% | 🔴 Критично |
| Ad-hoc interfaces | 22 | 🟡 Погано |
| Dead code files | 2+ | 🟡 |
| Stale documentation | 3+ | 🟡 |

### 9.3 За розділами

| Розділ | 🟢 Геніально | 🔴/🟡 Проблем |
|---|---|---|
| Архітектура | 5 | 4 |
| Безпека | 6 | 14 |
| Бізнес-логіка | 10 | 13 |
| UI/Frontend | 6 | 8 |
| Тестування | 2 | 5 |
| Інфраструктура | 3 | 1 |

---

## 10. Рекомендації

### P0 — Негайно

| # | Дія | Чому |
|---|---|---|
| 1 | Переписати всі user-facing Server Actions на `createClient()` замість `createAdminClient()` | RLS bypass — найкритичніша вразливість. 153+ usages |
| 2 | Усунути divergence `createBooking.ts` / `computeBookingPrice.ts` — створити спільну pure функцію `resolveDiscounts()` | Показує неправильні ціни клієнтам |
| 3 | Додати `vitest.config.ts` з `@vitest/coverage-v8` та `npm run test:coverage` | Не знаємо, що не тестується. Coverage = 0 |

### P1 — Високий пріоритет

| # | Дія | Чому |
|---|---|---|
| 4 | Створити `src/proxy.ts`, винести логіку з `middleware.ts` | Architectural debt. Документація vs код |
| 5 | `notifyClientBroadcast` → через NotificationOrchestrator | Single dispatch point |
| 6 | `dynamicPricing.ts` — виправити daysAhead: використати `toZonedTime(getNow(), masterTimezone)` | Early bird працює неправильно |
| 7 | `createBooking.ts` — `dynamic_extra_kopecks = 0` при barter override | Trial accounting inflation |
| 8 | Розширити `NotificationOrchestrator.test.ts` — додати тести для push, SMS, fallback, errors | 1 тест на 161 рядок логіки |
| 9 | Додати unit-тести для `createBooking.ts` | Ключова бізнес-логіка без тестів |

### P2 — Середній пріоритет

| # | Дія | Чому |
|---|---|---|
| 10 | Clean `console.log` з `mono-webhook/route.ts` — development-only | Інформаційний leak |
| 11 | Додати `AbortController` timeout в `sendTelegramMessage` | Каскад може зависнути |
| 12 | Замінити `🔒` → Lucide `Lock` в BookingWizard | No-Emoji Policy |
| 13 | Виправити referral code — `UPPER(refCode)` + `ilike` або нормалізація | Silent fail |
| 14 | Оновити `database.ts` — додати `lifetime_discount`, `discount_reserve`, `c2c_enabled` | TypeScript coverage |
| 15 | Замінити 43 `any` types на proper types | Type safety erosion |
| 16 | Видалити дублюючі e2e specs (`auth.spec.ts`, `booking-flow.spec.ts`, `broadcasts.spec.ts`) | Дублювання |
| 17 | Видалити/оновити WayForPay secret | Dead secret |

### P3 — Низький пріоритет

| # | Дія | Чому |
|---|---|---|
| 18 | Оновити UI_MAP.md (Inter→Geist, Playfair→Cormorant) | Stale docs |
| 19 | Оновити SYSTEM_MAP.md (proxy.ts статус) | Stale docs |
| 20 | Видалити `processRegistrationReferral` (dead code) | Confusion |
| 21 | Видалити `referral_links` table/cleanup migration | Orphaned table |
| 22 | Видалити `referral_bounties_pending` з DB | Always 0 |
| 23 | `fn_increment_booking_counter` — додати `SECURITY DEFINER` | Trigger security |
| 24 | Рефакторинг `BookingWizard.tsx` (430 рядків) | High complexity |
| 25 | Додати React component tests (RTL + jsdom) | UI без тестів |
| 26 | Додати C2C toggle в SettingsPage | Missing UI |
| 27 | Додати B2B Alliance на landing page | Missing marketing |

---

*Generated: 2026-05-21 | BookIT v8.2.0*
