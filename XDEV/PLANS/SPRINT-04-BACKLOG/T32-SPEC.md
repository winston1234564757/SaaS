# T32 — Smart Slots: Авто Flash Deal при скасуванні

**Автор:** Claude (grill-with-docs → spec-driven-workflow)  
**Дата:** 2026-06-15  
**Статус:** Approved  
**Версія:** 1.0

---

## 1. Context

Лендинг BookIT обіцяє: *"Флеш-акції при скасуванні — і вікно закривається за 10 хвилин."*

Наразі цього не існує: `cancelBooking()` просто ставить `status='cancelled'` і надсилає нотифікацію клієнту. Жодної автоматики немає — майстер вручну має зайти у Flash Deals і створити акцію.

Також знайдено попутний баг: `createFlashDeal()` викликає `get_eligible_flash_deal_clients` з лише `{ p_master_id }`, але RPC з migration 053/054 вимагає ще `p_slot_timestamp`. Функція, мабуть, повертає неправильні результати або падає тихо. Це фіксується в T32.

**Мета:** Коли запис скасовується і майстер увімкнув авто-режим — система сама створює Flash Deal на вільний слот і розсилає сповіщення.

---

## 2. Functional Requirements

**FR-1** Система MUST надати два нових поля в `master_profiles`:
- `auto_flash_on_cancel BOOLEAN NOT NULL DEFAULT false`
- `auto_flash_discount_pct INT NOT NULL DEFAULT 20`

**FR-2** Після успішного `cancelBooking()` система MUST перевіряти `auto_flash_on_cancel` майстра.

**FR-3** Якщо `auto_flash_on_cancel = true`, система MUST автоматично створити Flash Deal зі:
- `slot_date` та `slot_time` = дата/час скасованого запису
- `service_id` та `service_name` = перша послуга зі скасованого запису
- `original_price` = `service_price` першої послуги зі `booking_services`
- `discount_pct` = `master_profiles.auto_flash_discount_pct`
- `expires_in_hours` = 2 (фіксовано)

**FR-4** Якщо `auto_flash_on_cancel = true`, система MUST після створення Flash Deal розіслати сповіщення eligible-клієнтам через існуючу логіку `createFlashDealInternal`.

**FR-5** Якщо майстер на Starter і ліміт 5 флеш/міс вичерпано — автотригер MUST NOT спрацювати (тихо, без помилки для майстра).

**FR-6** Авто-тригер MUST NOT спрацьовувати якщо скасований запис не має жодної послуги (`booking_services` порожній).

**FR-7** Авто-тригер MUST NOT спрацьовувати якщо скасований запис містить `product-only` (тільки товари, `service_id IS NULL`).

**FR-8** `createFlashDeal` (server action) MUST виправити виклик RPC: передавати `{ p_master_id, p_slot_timestamp }`.

**FR-9** Система MUST надати UI-toggle "Авто Flash Deal при скасуванні" на сторінці `FlashDealPage`.

**FR-10** Система MUST надати UI-select % знижки (варіанти: 10, 15, 20, 25, 30) на FlashDealPage поряд з toggle.

**FR-11** Toggle і select SHOULD зберігатись через server action `updateAutoFlashSettings`.

---

## 3. Non-Functional Requirements

**NFR-1 Performance:** Авто-тригер MUST виконуватись асинхронно (`.catch()` pattern) — не блокувати відповідь `cancelBooking`. Максимальна затримка відповіді `cancelBooking`: +0ms.

**NFR-2 Atomicity:** Flash Deal MUST NOT створюватись якщо скасування `bookings` UPDATE не вдалось.

**NFR-3 Silent failure:** Якщо авто-тригер падає (помилка DB, мережа) — помилка логується (`console.error`), але НЕ повертається як помилка `cancelBooking`. Майстер не бачить помилки.

**NFR-4 Security:** `createFlashDealInternal` MUST використовувати тільки `createAdminClient()`. Жодного `supabase.auth.getUser()` всередині (викликається з уже-авторизованого контексту).

**NFR-5 Multi-service:** При скасуванні з кількома послугами — Flash Deal створюється тільки для ПЕРШОЇ послуги в масиві.

---

## 4. Acceptance Criteria

**AC-1 (FR-2, FR-3):** Дано майстер з `auto_flash_on_cancel=true`, discount_pct=20; коли майстер скасовує запис → у таблиці `flash_deals` з'являється новий запис зі `slot_date` та `slot_time` скасованого запису, `discount_pct=20`, `status='active'`.

**AC-2 (FR-1, FR-9, FR-10):** Дано FlashDealPage; коли майстер вмикає toggle і вибирає 25% → `master_profiles.auto_flash_on_cancel=true` та `auto_flash_discount_pct=25`.

**AC-3 (FR-5):** Дано Starter майстер з 5 flash deals у поточному місяці та `auto_flash_on_cancel=true`; коли скасовує запис → Flash Deal НЕ створюється, `cancelBooking` повертає `{ error: null }`.

**AC-4 (FR-6):** Дано запис без `booking_services`; коли скасовується → Flash Deal НЕ створюється.

**AC-5 (FR-8):** Дано `createFlashDeal` з коректними params; коли викликається → RPC отримує `{ p_master_id, p_slot_timestamp }` (перевірити в тестах через mock або логи).

**AC-6 (FR-4):** Дано 3 eligible клієнти; коли авто-тригер спрацьовує → в `notifications` з'являються 3 записи типу `flash_deal`.

**AC-7 (NFR-1):** Дано помилка в авто-тригері; коли `cancelBooking` викликається → функція повертає `{ error: null }` (скасування успішне, тригер не заважає).

---

## 5. Edge Cases

**EC-1 Multi-service booking:** Запис з 3 послугами → Flash Deal для послуги з індексом [0].

**EC-2 service_id IS NULL:** `booking_services[0].service_id` = null (deleted service) → авто-тригер не спрацьовує (FR-7).

**EC-3 Slot у минулому:** Скасований запис на вчора → Flash Deal створюється з `slot_date` у минулому, `expires_at` = зараз + 2h. Клієнти побачать минулий слот. Окремий case для майбутнього спринту.

**EC-4 Майстер без profile:** `master_profiles` не знайдено → авто-тригер тихо пропускається.

**EC-5 Concurrent cancellations:** 2 скасування одночасно у Starter з 4/5 флеш → перший створює deal (5/5), другий пропускається. Race condition handled by count check before insert.

**EC-6 Нульова ціна послуги:** `service_price = 0` → Flash Deal зі `original_price=0`, знижка = 0₴. Логічно невалідно — не створювати (FR-3 implicit: `original_price > 0`).

---

## 6. API Contracts

### `createFlashDealInternal(masterId, params)` — нова shared функція

```typescript
interface CreateFlashDealInternalParams {
  serviceId:      string;
  serviceName:    string;
  slotDate:       string;   // YYYY-MM-DD
  slotTime:       string;   // HH:MM
  originalPrice:  number;   // ₴ (не копійки)
  discountPct:    number;   // 10 | 15 | 20 | 25 | 30
  expiresInHours: number;   // фіксовано 2 для авто-тригера
  slug:           string;   // для URL сповіщень
  masterName:     string;   // для тексту сповіщень
}

async function createFlashDealInternal(
  masterId: string,
  tier: SubscriptionTier,
  params: CreateFlashDealInternalParams
): Promise<{ error: string | null; sentTo: number }>
```

### `updateAutoFlashSettings(settings)` — новий server action

```typescript
interface AutoFlashSettings {
  autoFlashOnCancel:   boolean;
  autoFlashDiscountPct: number; // 10 | 15 | 20 | 25 | 30
}

async function updateAutoFlashSettings(
  settings: AutoFlashSettings
): Promise<{ error: string | null }>
```

### Виправлений виклик RPC в `createFlashDeal` / `createFlashDealInternal`

```typescript
// БУЛО (баг):
.rpc('get_eligible_flash_deal_clients', { p_master_id: masterId })

// СТАЛО:
const slotTimestamp = new Date(`${params.slotDate}T${params.slotTime}:00`).toISOString();
.rpc('get_eligible_flash_deal_clients', {
  p_master_id: masterId,
  p_slot_timestamp: slotTimestamp,
})
```

---

## 7. Data Models

### Нова міграція: `master_profiles` (2 нових поля)

| Поле | Тип | Constraint | Default |
|------|-----|-----------|---------|
| `auto_flash_on_cancel` | `BOOLEAN` | `NOT NULL` | `false` |
| `auto_flash_discount_pct` | `INT` | `NOT NULL, CHECK (IN (10,15,20,25,30))` | `20` |

### `flash_deals` — без змін (вже є всі потрібні поля)

| Поле | Тип | Заповнюється авто-тригером |
|------|-----|--------------------------|
| `master_id` | UUID | booking.master_id |
| `service_id` | UUID | booking_services[0].service_id |
| `service_name` | TEXT | booking_services[0].service_name |
| `slot_date` | DATE | booking.date |
| `slot_time` | TIME | booking.start_time |
| `original_price` | INT (копійки) | booking_services[0].service_price * 100 |
| `discount_pct` | INT | master_profiles.auto_flash_discount_pct |
| `expires_at` | TIMESTAMPTZ | NOW() + 2h |
| `status` | flash_deal_status | 'active' |

---

## 8. Files to Change

| Файл | Зміна |
|------|-------|
| `supabase/migrations/NNN_auto_flash_on_cancel.sql` | ALTER TABLE master_profiles + 2 нових поля |
| `src/app/(master)/dashboard/flash/actions.ts` | Рефакторинг: виділити `createFlashDealInternal`, виправити RPC виклик, `createFlashDeal` стає оберткою |
| `src/app/(master)/dashboard/bookings/actions.ts` | `cancelBooking`: розширити SELECT (+ `service_id, service_price` з booking_services), додати авто-тригер після UPDATE |
| `src/components/master/flash/FlashDealPage.tsx` | Додати toggle + select у верхню секцію |
| `src/app/(master)/dashboard/flash/actions.ts` | Додати `updateAutoFlashSettings` server action |

---

## 9. Out of Scope

**OS-1 Client-side cancellation:** Якщо клієнт скасовує запис через `/my/bookings` — авто-тригер НЕ спрацьовує (тільки майстер-скасування). Причина: клієнтський канал скасування потребує окремого audit.

**OS-2 Multi-service Flash Deals:** Один Flash Deal для кількох послуг одночасно. Причина: `flash_deals` зберігає один `service_id`.

**OS-3 Кастомний expiry для авто-тригера:** Фіксовано 2 години. Причина: UI ускладнення не пріоритетне.

**OS-4 Waitlist / prebooking:** Система черги клієнтів, що чекають на цього майстра. Це окрема фіча.

**OS-5 Скасування слотів у минулому:** Валідація `slot_date >= today` для авто-тригера. Залишаємо поза скопом (EC-3).

---

## Порядок реалізації

```
1. Міграція (ALTER TABLE master_profiles)
2. Рефакторинг flash/actions.ts → createFlashDealInternal + виправлення RPC
3. Розширення cancelBooking SELECT + авто-тригер
4. updateAutoFlashSettings server action
5. FlashDealPage UI (toggle + select)
6. tsc --noEmit + npm run build
```
