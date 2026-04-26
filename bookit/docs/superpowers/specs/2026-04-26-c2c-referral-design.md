# C2C Referral Program — Design Spec
**Date:** 2026-04-26  
**Status:** Approved  

---

## Суть

Клієнт ділиться посиланням на конкретного майстра з подругою. Подруга отримує знижку на перший візит. Реферер накопичує реферальний баланс і сам вирішує скільки використати при наступному бронюванні.

---

## Бізнес-логіка

### Умови програми
- Майстер сам увімкнює програму і встановлює один відсоток знижки (`c2c_discount_pct`)
- Цей самий відсоток застосовується і до подруги, і нараховується рефереру за кожен завершений візит
- Максимум знижки при застосуванні балансу: **80%** (захист маржі майстра)

### Хто отримує знижку (подруга)
Знижка застосовується тільки якщо:
1. Майстер має `c2c_enabled = true`
2. Клієнт з таким `referral_code` існує в `client_profiles`
3. Подруга — **новий клієнт** до цього майстра (жодного бронювання раніше)
4. Реферер ≠ сама подруга
5. Немає вже активного реферала від цього реферера для цієї подруги до цього майстра

### Реферальний баланс (реферер)
- Баланс **per-master** — прив'язаний до пари `(referrer_id, master_id)`
- Нараховується коли `bookings.status → 'completed'` (DB тригер)
- Формула: `active_referrals_completed × c2c_discount_pct`
- При бронюванні клієнт **сам обирає** скільки % використати (від 0 до балансу, але не більше 80%)
- Кожне використання списує відповідну кількість з балансу

### Edge cases
- Майстер вимикає програму → нові посилання не дають знижку, але вже видані обіцянки (`status='pending'`) залишаються дійсними
- Майстер вимикає програму → накопичені бонуси реферерів залишаються і можуть бути використані
- Кілька подруг — накопичення балансу, використання по одному бронюванню за раз

---

## DB Layer (міграція 099)

### Розширення `master_profiles`
```sql
c2c_enabled      BOOLEAN  NOT NULL DEFAULT false
c2c_discount_pct INTEGER  NOT NULL DEFAULT 10 CHECK (c2c_discount_pct BETWEEN 1 AND 50)
```

### Нова таблиця `c2c_referrals`
```sql
CREATE TABLE c2c_referrals (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id     UUID        NOT NULL REFERENCES client_profiles(id) ON DELETE CASCADE,
  referred_id     UUID        REFERENCES client_profiles(id) ON DELETE SET NULL,  -- NULL до реєстрації
  master_id       UUID        NOT NULL REFERENCES master_profiles(id) ON DELETE CASCADE,
  booking_id      UUID        UNIQUE REFERENCES bookings(id) ON DELETE SET NULL,
  discount_pct    INTEGER     NOT NULL,   -- snapshot на момент запрошення
  status          TEXT        NOT NULL DEFAULT 'pending'
                              CHECK (status IN ('pending', 'completed', 'expired')),
  bonus_discount_used INTEGER NOT NULL DEFAULT 0,  -- скільки % вже знято з балансу реферера
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_c2c_referrals_referrer ON c2c_referrals(referrer_id, master_id);
CREATE INDEX idx_c2c_referrals_status   ON c2c_referrals(status) WHERE status = 'completed';

-- RLS
ALTER TABLE c2c_referrals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "c2c_referrals: owner select"
  ON c2c_referrals FOR SELECT
  USING (auth.uid() = referrer_id OR auth.uid() = referred_id);

GRANT ALL ON c2c_referrals TO service_role;
```

### DB тригер: completion
При `bookings.status → 'completed'` → оновлює `c2c_referrals.status = 'completed'` де `booking_id = NEW.id`.

### RPC: get_c2c_balance
```sql
-- Повертає накопичений баланс реферера для конкретного майстра
CREATE OR REPLACE FUNCTION get_c2c_balance(p_referrer_id UUID, p_master_id UUID)
RETURNS INTEGER AS $$
  SELECT COALESCE(
    COUNT(*) FILTER (WHERE status = 'completed') * 
    (SELECT c2c_discount_pct FROM master_profiles WHERE id = p_master_id),
    0
  )
  FROM c2c_referrals
  WHERE referrer_id = p_referrer_id AND master_id = p_master_id;
$$ LANGUAGE sql SECURITY DEFINER;
```

---

## Сторона майстра (`/dashboard/loyalty`)

### Нова секція "Реферальна програма клієнтів"
- Toggle: "Дозволити клієнтам ділитися знижкою"
- При увімкненому: input/слайдер "Знижка %" (1–50, default 10)
- Підказка: "Подруга клієнта отримає X% на перший візит. Клієнт накопичить X% на свій наступний запис за кожну подругу що прийшла."
- Preview: `bookit.com.ua/[slug]?ref=...`
- Статистика: "Рефералів прийшло: N | Завершили візит: M"

### Server action
`saveMasterC2CSettings(enabled: boolean, discountPct: number)` → `master_profiles` update → `revalidatePath('/dashboard/loyalty')`

---

## Сторона клієнта

### Post-booking success (BookingWizard)
Якщо `master.c2c_enabled = true` — під кнопкою "Готово":
```
🎁 Поділись з подругою
   Вона отримає −X% на перший візит до [Майстра]
   А ти накопиш −X% на свій наступний запис
   [Поділитись]  [Скопіювати]
```
Посилання: `/{masterSlug}?ref={clientReferralCode}`

### Loyalty Tab — "Для подруг" (C2C під-вкладка)
- Посилання для шерингу (copy + Web Share API) — завантажується при відкритті
- Статистика: "Запрошено: N | Завершили: M | Баланс: K%"
- Список `c2c_referrals`: ім'я подруги або "Подруга", майстер, статус, нарахований бонус

### Loyalty Tab — "Запросити майстра" (C2B під-вкладка)
Існуючий Refer & Earn функціонал без змін.

---

## Booking Flow (подруга)

### `[slug]/page.tsx`
Читає `searchParams.ref` → перевіряє `client_profiles.referral_code` → передає `refCode` і `discountPct` в `PublicMasterPage` → далі в `BookingWizard`.

### BookingWizard
На кроці підтвердження: якщо `refCode` валідний → badge `🎁 Знижка −X% застосована`.  
Якщо не валідний або майстер вимкнув — badge відсутній, ціна звичайна, без помилки.

### `createBooking.ts` (server-side валідація)
1. `master_profiles.c2c_enabled = true`
2. `client_profiles` з `referral_code = refCode` існує
3. Подруга — новий клієнт (`bookings WHERE client_id AND master_id` → 0 рядків)
4. `referrer_id ≠ referred_id`
5. Немає `c2c_referrals` де `referrer_id + master_id + referred_id` вже є (якщо `referred_id` відомий)

Якщо всі перевірки ОК:
- `total_price = total_price × (1 − discount_pct/100)`
- `INSERT c2c_referrals(status='pending', discount_pct=snapshot)`

---

## Бонус для реферера при бронюванні

### BookingWizard (реферер бронює у того ж майстра)
- Завантажує `get_c2c_balance(clientId, masterId)`
- Якщо баланс > 0: показує "У вас є реферальний баланс: **K%**"
- Кнопки або слайдер: вибір скільки % використати (1–min(balance, 80))
- Обраний % відображається в badge на кроці підтвердження

### `createBooking.ts`
- Якщо клієнт вибрав `bonusToUse > 0`: застосовує до ціни
- Знімає з балансу: встановлює `bonus_discount_used` у відповідних `c2c_referrals` рядках (від найстаріших)
- Записує в `bookings.dynamic_pricing_label`: `"Реферальна програма −X%"` (або розширює існуюче поле)

### В деталях запису (BookingCard, майстер)
Badge: `🤝 Реферальна програма −X%`

---

## In-App нотифікація для реферера

При `c2c_referrals.status → 'completed'` (DB тригер) → INSERT в `notifications`:
```
type: 'c2c_referral_completed'
title: 'Подруга завершила візит!'
body: 'Твій реферальний баланс поповнено на X% у майстра [Ім'я]'
```

---

## Файли що зміняться

| Файл | Зміна |
|---|---|
| `supabase/migrations/099_c2c_referral.sql` | Нова міграція |
| `src/types/database.ts` | Нові типи |
| `src/app/(master)/dashboard/loyalty/page.tsx` | Секція налаштувань C2C |
| `src/app/(master)/dashboard/loyalty/actions.ts` | `saveMasterC2CSettings` |
| `src/app/[slug]/page.tsx` | Читає `searchParams.ref` |
| `src/components/public/PublicMasterPage.tsx` | Передає `refCode` в BookingFlow |
| `src/components/shared/BookingWizard.tsx` | Discount badge + referrer balance UI |
| `src/lib/actions/createBooking.ts` | C2C валідація + застосування знижки |
| `src/app/my/loyalty/page.tsx` | Завантажує C2C дані |
| `src/components/client/MyLoyaltyPage.tsx` | Два під-таби: C2C + C2B |
| `src/components/client/MyProfilePage.tsx` | Видалити старий C2C блок |
