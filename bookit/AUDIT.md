# AUDIT.md — Bookit SaaS (Ітерація 2)

> Архітектурний аудит проведено після повного виправлення 26 проблем ітерації 1.
> Стан кодової бази: Next.js 16.2.0, Supabase, TypeScript strict, build чистий.

---

## 🟢 Сильні архітектурні рішення

1. **Atomic RPC rate-limit** — `check_and_log_sms_send` і `check_and_log_sms_attempt` з `pg_advisory_xact_lock` (027, 019) — race-safe TOCTOU-захист для SMS.
2. **Webhook signature verification** — Ed25519 (Monobank) з 24h TTL pubkey cache і key rotation retry; HMAC-MD5 (WayForPay) — криптографічна перевірка платежів.
3. **Magiclink auth flow** — `verify-sms` → `generateLink({ type: 'magiclink' })` → token. Пароль ніколи не повертається у response.
4. **escHtml()** у всіх Telegram message builders — HTML-ін'єкція унеможливлена для flash і rebooking повідомлень.
5. **Єдиний формат CRON_SECRET** — `Authorization: Bearer` на всіх cron endpoints після стандартизації.
6. **Optimistic updates + rollback** — `useServices`, `useProducts`: `onMutate` + `onError` pattern для reorder і toggle.
7. **MasterProvider hydration без flash** — `initialUser/Profile/MasterProfile` з Server Layout → `isLoading: false` на mount.
8. **SmartSlots Engine** — повна перевірка конфліктів, буферів, перерв, multi-service consecutive slots.
9. **safeQuery/safeMutation wrapper** — консистентний error format + RLS-класифікація помилок.
10. **flatUidToUuid** централізовано у `lib/utils/uuid.ts` — дедупліковано між webhook endpoints.
11. **Realtime замість polling** — `useDashboardStats`, `useWeeklyOverview`: `postgres_changes` subscription замість `refetchInterval`.
12. **Bounded rebooking cron** — антиджоїн по candidateIds замість unbounded `SELECT * FROM rebooking_reminders`.

---

## 🔴 Критичні загрози

### 1. IDOR у `saveOnboardingSchedule` та `saveOnboardingService`
- **Файл**: `src/app/(master)/dashboard/onboarding/actions.ts:68, 113`
- **Опис**: Обидві функції приймають `masterId: string` як параметр від клієнта і передають напряму у `.eq('id', masterId)` без порівняння з `auth.getUser().id`. Зловмисник може перезаписати розклад або послуги чужого майстра, підставивши чужий UUID.
- **Фікс**: Видалити `masterId` з параметрів, отримувати через `const { data: { user } } = await createClient().auth.getUser()`

### 2. `payments` і `referrals` — таблиці без RLS
- **Файл**: `supabase/migrations/001_initial_schema.sql`
- **Опис**: Жодна з таблиць не має `ENABLE ROW LEVEL SECURITY`. Будь-який авторизований користувач може зробити `supabase.from('payments').select('*')` і отримати всі транзакції всіх майстрів — суми, статуси, реквізити. Аналогічно для `referrals` — повний enum всіх реферальних кодів.
- **Фікс**: Нова міграція `034_rls_payments_referrals.sql` — `ENABLE RLS` + `SELECT policy: master_id = auth.uid()` для обох таблиць

### 3. `getUser()` у `queryFn` — `useBookingById.ts`
- **Файл**: `src/lib/supabase/hooks/useBookingById.ts:78`
- **Опис**: `await supabase.auth.getUser()` у `queryFn` блокує виконання до завершення token refresh — причина infinite spinners при холодному старті. Supabase browser client автоматично прикріплює актуальний токен до кожного запиту. Патерн прямо заборонений у CLAUDE.md.
- **Фікс**: Видалити `getUser()` з `queryFn`; якщо потрібен `masterId` — отримати з `useMasterContext()`

### 4. Broadcast `invalidateQueries` без `masterId`
- **Файли**: `src/lib/supabase/hooks/useBookingById.ts:102-105`, `useBookings.ts:127-129`
- **Опис**: `invalidateQueries({ queryKey: ['bookings'] })` без `masterId` інвалідує кеш ВСІХ майстрів у многомайстровому Studio контексті. При switch між master accounts — викликає каскадний refetch і потенційне змішування даних між інстансами.
- **Фікс**: `invalidateQueries({ queryKey: ['bookings', masterId] })` — додати masterId до всіх `invalidateQueries` у цих двох файлах

### 5. `increment_booking_counter()` — мертвий тригер після DROP COLUMN
- **Файл**: `supabase/migrations/001_initial_schema.sql` (trigger `increment_booking_counter` on `bookings`)
- **Опис**: Міграція 030 видалила колонку `bookings_this_month`, але тригер `increment_booking_counter` залишився. При кожному `INSERT INTO bookings` він намагається оновити неіснуючу колонку — runtime error `column "bookings_this_month" of relation "master_profiles" does not exist`. Кожне нове бронювання падає з помилкою на рівні DB.
- **Фікс**: Нова міграція `035_drop_booking_counter_trigger.sql`:
  ```sql
  DROP TRIGGER IF EXISTS increment_booking_counter ON bookings;
  DROP FUNCTION IF EXISTS increment_booking_counter();
  ```

---

## 🟡 Технічний борг

### 1. `Math.random()` для Toast IDs
- **Файл**: `src/lib/toast/context.tsx:94`
- `const id = Math.random().toString(36).slice(2)` — 32 біти ентропії, можливі колізії при паралельних toast. Порушує security guideline проєкту: `crypto.getRandomValues()` скрізь.
- **Фікс**: `const id = crypto.randomUUID()`

### 2. `any` типи у `useAnalytics`, `usePortfolio`, `useBookingById`
- `useAnalytics.ts:120,135,241,295` — `(mainRes.data ?? []) as any[]`, `trendRes.data as any[]` тощо
- `usePortfolio.ts:16` — `function rowToPhoto(p: any)`
- `useBookingById.ts:26` — `function rowToBooking(row: any)`
- **Фікс**: Оголосити `interface AnalyticsBookingRow`, `PhotoRow`, `BookingRow` за зразком `ServiceRow`/`ProductRow` у useServices/useProducts

### 3. `qc` у dependency arrays realtime hooks
- **Файли**: `useDashboardStats.ts:45`, `useWeeklyOverview.ts:50`, `useNotifications.ts:71`
- `useEffect(..., [masterId, qc])` — `qc` від `useQueryClient()` не гарантовано стабільний між рендерами → може спричиняти зайвий re-subscribe каналу при кожному рендері MasterProvider.
- **Фікс**: `[masterId]` — прибрати `qc` з dependency array

### 4. Відсутні DB ENUM: `payments`, `loyalty_programs`, `notification_templates`
- `payments.status` — `TEXT` (замість `ENUM 'pending'|'completed'|'failed'|'refunded'`)
- `payments.type` — `TEXT` (замість `ENUM 'wayforpay'|'monobank'|'cash'`)
- `loyalty_programs.reward_type` — `TEXT`
- `notification_templates.trigger_type` — `TEXT`
- Допускають будь-який рядок — ризик невалідних значень у prod.
- **Фікс**: Нова міграція `036_payment_enums.sql` — `CREATE TYPE payment_status AS ENUM ...` + `ALTER COLUMN ... TYPE`

### 5. Відсутні CHECK constraints
- `master_profiles.commission_rate` — може бути від'ємним або > 100
- `master_profiles.rating` — може виходити за межі 0.0–5.0
- `client_master_relations.loyalty_points` — може бути від'ємним
- `products.stock_quantity` — може бути від'ємним
- **Фікс**: Нова міграція `037_check_constraints.sql`

### 6. Відсутні індекси (нова хвиля)
- `schedule_templates(master_id, day_of_week)` — hot path у SmartSlots при кожному запиті слотів
- `schedule_exceptions(master_id, date)` — hot path у SmartSlots
- `booking_services(booking_id)` — JOIN при кожному read бронювання
- `booking_products(booking_id)` — JOIN при кожному read бронювання
- `reviews(master_id)` — для ReviewsPage і рейтингу
- `flash_deals(master_id, expires_at)` — активні deal lookup на публічній сторінці
- `studios(invite_token)` — пошук при `joinStudio`
- **Фікс**: Нова міграція `038_missing_indexes_2.sql`

### 7. `update_master_rating()` — O(n) trigger
- **Файл**: `supabase/migrations/004_*.sql`
- Після кожного нового review тригер виконує `SELECT AVG(rating) FROM reviews WHERE master_id = ...` по всій таблиці. При 1000+ відгуків — повна scan на кожен INSERT/UPDATE у `reviews`.
- **Фікс**: Нова міграція `039_incremental_rating.sql` — incremental update без scan:
  ```sql
  NEW_rating := (OLD.rating * OLD.rating_count + review_rating) / (OLD.rating_count + 1);
  NEW_rating_count := OLD.rating_count + 1;
  ```

### 8. `cron/reminders` — необмежений паралелізм
- **Файл**: `src/app/api/cron/reminders/route.ts`
- `Promise.allSettled(bookings.map(sendReminder))` — при 1000+ нагадувань запускає всі SMS/push запити паралельно → TurboSMS API rate limit (429) або Vercel function timeout (10s).
- **Фікс**: Батч по 50 з sequential chunks:
  ```typescript
  for (let i = 0; i < bookings.length; i += 50) {
    await Promise.allSettled(bookings.slice(i, i + 50).map(sendReminder));
  }
  ```

### 9. `studio_invite_token` без UNIQUE constraint
- **Файл**: `supabase/migrations/011_*.sql`
- Колонка `invite_token` не має `UNIQUE` — теоретично дві студії можуть отримати однаковий токен, і будь-хто за посиланням потрапить у першу з них.
- **Фікс**: Нова міграція `040_studio_token_unique.sql`:
  ```sql
  ALTER TABLE studios ADD CONSTRAINT studios_invite_token_unique UNIQUE (invite_token);
  ```

### 10. TypeScript `Booking` type — відсутні поля
- `database.ts` — `Booking` не має `next_visit_suggestion: string | null` (додано у міграції 012)
- `database.ts` — `Booking` не має `flash_deal_id` (міграція 024 додала `booking_id` у `flash_deals`, але зворотний зв'язок відсутній)
- **Фікс**: Додати поля до `Booking` interface у `src/types/database.ts`

### 11. `staleTime: 5 * 60_000` у `useAnalytics`
- **Файл**: `src/lib/supabase/hooks/useAnalytics.ts`
- 5 хвилин — задовго: нові бронювання не відображатимуться в аналітиці до 5 хв. При наявності realtime підписки на bookings — різкий контраст.
- **Фікс**: `staleTime: 2 * 60_000`

---

## 🛠 Action Items

| # | Файл / Міграція | Дія | Пріоритет |
|---|---|---|---|
| 1 | `onboarding/actions.ts:68,113` | Видалити `masterId` з params → `auth.getUser()` | 🔴 КРИТИЧНО |
| 2 | `034_rls_payments_referrals.sql` | ENABLE RLS + SELECT/INSERT policies на `payments`, `referrals` | 🔴 КРИТИЧНО |
| 3 | `useBookingById.ts:78` | Видалити `getUser()` з `queryFn` | 🔴 КРИТИЧНО |
| 4 | `useBookingById.ts:102-105`, `useBookings.ts:127-129` | Додати `masterId` до `invalidateQueries` queryKey | 🔴 КРИТИЧНО |
| 5 | `035_drop_booking_counter_trigger.sql` | `DROP TRIGGER/FUNCTION increment_booking_counter` | 🔴 КРИТИЧНО |
| 6 | `toast/context.tsx:94` | `Math.random()` → `crypto.randomUUID()` | 🟡 ВАЖЛИВО |
| 7 | `useAnalytics.ts`, `usePortfolio.ts`, `useBookingById.ts` | `any` → typed row interfaces | 🟡 ВАЖЛИВО |
| 8 | `useDashboardStats.ts`, `useWeeklyOverview.ts`, `useNotifications.ts` | `[masterId, qc]` → `[masterId]` | 🟡 ВАЖЛИВО |
| 9 | `036_payment_enums.sql` | ENUM для `payments.status`, `payments.type`, `loyalty_programs.reward_type` | 🟡 ВАЖЛИВО |
| 10 | `037_check_constraints.sql` | CHECK для `commission_rate`, `rating`, `loyalty_points`, `stock_quantity` | 🟡 ВАЖЛИВО |
| 11 | `038_missing_indexes_2.sql` | 7 нових індексів (schedule_templates, schedule_exceptions, booking_services тощо) | 🟡 ВАЖЛИВО |
| 12 | `039_incremental_rating.sql` | `update_master_rating()` incremental замість `AVG()` scan | 🟡 ВАЖЛИВО |
| 13 | `cron/reminders/route.ts` | Батч по 50, sequential chunks | 🟡 ВАЖЛИВО |
| 14 | `040_studio_token_unique.sql` | UNIQUE constraint на `studios.invite_token` | 🟡 СЕРЕДНЄ |
| 15 | `src/types/database.ts` | Додати `next_visit_suggestion: string \| null` до `Booking` | 🟡 СЕРЕДНЄ |
| 16 | `useAnalytics.ts` | `staleTime: 5*60k` → `2*60k` | 🔵 НИЗЬКЕ |

---

## 💡 5 Кілер-фіч для розвитку

### 1. Smart Waitlist Engine з авто-підбором
Коли слот скасовується — система аналізує чергу очікування, враховує LTV клієнта, частоту відвідувань і переваги часу та автоматично пропонує слот через Push + Telegram найвигіднішому кандидату. Майстер не витрачає час на ручний пошук. Монетизація: Pro+.

### 2. Revenue Forecasting на базі Claude API
ML-модель аналізує історію бронювань, сезонність і поточні flash deals → прогнозує дохід майстра на наступний місяць. Майстер бачить у dashboard: "Очікуваний дохід: 18 400 ₴ (+12% до минулого місяця)". Відкриває преміум-сегмент фінансового планування.

### 3. Автоматичний A/B тест цін
Flash Deals + Dynamic Pricing + аналітика → система сама тестує різні знижки у різний час тижня і звітує що конвертує краще. Майстер налаштовує один раз — система оптимізує автоматично. Нульова конкуренція серед поточних booking-платформ.

### 4. Client Lifecycle Score
Інтегральний показник (`LTV × recency × frequency × sentiment`) видимий прямо у картці клієнта. Автоматично визначає: VIP, ризик відтоку, кандидати для upsell. Майстер одразу бачить кому написати першим після відпустки.

### 5. Публічний REST API для партнерів
Відкритий API з JWT для B2B інтеграцій: CRM мережевих студій, бухгалтерські сервіси (FLP/Checkbox). Студія отримує webhook при кожному бронюванні → автоматичне виставлення рахунків без ручного введення. Відкриває Enterprise сегмент без зміни core продукту.
