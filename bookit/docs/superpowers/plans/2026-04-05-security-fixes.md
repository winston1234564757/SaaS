# BookIT Security Fixes — P0+P1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Виправити 13 критичних та high-рівневих вразливостей з аудиту 2026-04-05 (DEEP_AUDIT_REPORT.md).

**Architecture:** Кожна задача торкається або DB міграції, або Server Action/API Route — без змін у клієнтських компонентах. Усі міграції ідемпотентні (IF NOT EXISTS, CREATE OR REPLACE). Порядок виконання важливий: спочатку міграції, потім код.

**Tech Stack:** Next.js 16 App Router, Supabase (PostgreSQL), TypeScript strict, Zod, Ruflo MCP (делегування складних задач).

**Аудит-файл:** `bookit/DEEP_AUDIT_REPORT.md`

---

## Subsystem Map (незалежні блоки, можна виконувати паралельно після Task 1)

| Блок | Задачі | IDs з аудиту |
|------|--------|--------------|
| A. Double-booking | Tasks 1–2 | BL-01, CR-01 |
| B. Price manipulation | Tasks 3–5 | BL-02, BL-05, BL-04 |
| C. Flash deal race | Tasks 6–7 | BL-03, BL-06 |
| D. Webhook idempotency | Tasks 8–9 | CR-03, CR-04 |
| E. Auth phantom states | Tasks 10–11 | PS-01 |
| F. DB cleanup & loyalty | Tasks 12–14 | DB-01, DB-02, DB-04 |

---

## Task 1: Migration 058 — btree_gist + bookings overlap constraint

**Аудит:** CR-01 (CRITICAL) — No DB-level double-booking prevention

**Files:**
- Create: `bookit/supabase/migrations/058_booking_overlap_constraint.sql`

- [ ] **Step 1: Create the migration file**

```sql
-- 058: Booking overlap exclusion constraint
-- Prevents two bookings for the same master overlapping in time
-- Requires btree_gist extension for non-equality operators in EXCLUDE

CREATE EXTENSION IF NOT EXISTS btree_gist;

-- Existing bookings: add constraint only if it does not exist yet
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'no_overlapping_bookings'
  ) THEN
    ALTER TABLE bookings
      ADD CONSTRAINT no_overlapping_bookings
      EXCLUDE USING gist (
        master_id WITH =,
        tsrange(
          (date + start_time)::timestamp,
          (date + end_time)::timestamp,
          '[)'
        ) WITH &&
      )
      WHERE (status IN ('pending', 'confirmed'));
  END IF;
END;
$$;
```

- [ ] **Step 2: Apply the migration**

```bash
cd bookit && npx supabase db push
```

Expected: `Applied migration 058_booking_overlap_constraint.sql`

- [ ] **Step 3: Verify constraint exists**

```bash
npx supabase db execute "SELECT conname FROM pg_constraint WHERE conname = 'no_overlapping_bookings';"
```

Expected: one row returned

- [ ] **Step 4: Commit**

```bash
git add bookit/supabase/migrations/058_booking_overlap_constraint.sql
git commit -m "міграція: btree_gist + обмеження перекриття слотів бронювань"
```

---

## Task 2: createBooking.ts — server-side slot check before INSERT

**Аудит:** BL-01 (CRITICAL) — No server-side slot check

**Files:**
- Modify: `bookit/src/lib/actions/createBooking.ts:227–235`

- [ ] **Step 1: Add slot conflict check after endTime computation**

Знайти рядок 227 (`const endTime = computeEndTime(...)`) і додати відразу після нього (перед коментарем `// 8. Insert booking`):

```typescript
  // 7.5 Server-side slot availability guard (CR-01 / BL-01)
  // The DB EXCLUDE constraint is the last line of defense — this check gives
  // a user-friendly error before hitting the DB constraint violation.
  const { count: slotConflicts } = await admin
    .from('bookings')
    .select('id', { count: 'exact', head: true })
    .eq('master_id', p.masterId)
    .eq('date', p.date)
    .in('status', ['pending', 'confirmed'])
    .lt('start_time', endTime)
    .gt('end_time', p.startTime);

  if ((slotConflicts ?? 0) > 0) {
    return { bookingId: null, error: 'Цей слот вже зайнятий. Оберіть інший час.' };
  }
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd bookit && npx tsc --noEmit
```

Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add bookit/src/lib/actions/createBooking.ts
git commit -m "createBooking: серверна перевірка доступності слоту перед INSERT"
```

---

## Task 3: createBooking.ts — server-side loyalty discount re-verification

**Аудит:** BL-02 (CRITICAL) — Loyalty discount trusted from client

**Files:**
- Modify: `bookit/src/lib/actions/createBooking.ts:205–207`

- [ ] **Step 1: Replace client-trusted discount with server-recomputed value**

Замінити блок (рядки 205–207):
```typescript
  const discountAmount = p.discountPercent > 0
    ? Math.round(grandTotal * p.discountPercent / 100)
    : 0;
```

На:
```typescript
  // BL-02: For online bookings, NEVER trust client-supplied discountPercent.
  // Re-query DB to find the applicable loyalty discount for this client.
  // For manual bookings, the master is authenticated and trusted.
  let effectiveDiscountPct = p.source === 'manual' ? p.discountPercent : 0;

  if (p.source === 'online' && p.clientId) {
    const { data: relation } = await admin
      .from('client_master_relations')
      .select('total_visits')
      .eq('client_id', p.clientId)
      .eq('master_id', p.masterId)
      .maybeSingle();

    if (relation) {
      const { data: programs } = await admin
        .from('loyalty_programs')
        .select('reward_value, target_visits')
        .eq('master_id', p.masterId)
        .eq('reward_type', 'percent_discount')
        .eq('is_active', true)
        .lte('target_visits', relation.total_visits)
        .order('reward_value', { ascending: false })
        .limit(1);

      if (programs && programs.length > 0) {
        // Cap at 50% to guard against uncapped loyalty_programs.reward_value (DB-03)
        effectiveDiscountPct = Math.min(Number(programs[0].reward_value), 50);
      }
    }
  }

  const discountAmount = effectiveDiscountPct > 0
    ? Math.round(grandTotal * effectiveDiscountPct / 100)
    : 0;
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd bookit && npx tsc --noEmit
```

Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add bookit/src/lib/actions/createBooking.ts
git commit -m "createBooking: серверна верифікація знижки лояльності (не довіряємо клієнту)"
```

---

## Task 4: createBooking.ts — aggregate discount cap 50%

**Аудит:** BL-05 (HIGH) — Unbounded discount stacking

**Files:**
- Modify: `bookit/src/lib/actions/createBooking.ts:225`

- [ ] **Step 1: Replace finalTotal with capped aggregate discount**

Замінити рядок 225:
```typescript
  const finalTotal = Math.max(0, grandTotal - discountAmount - flashDealAmount);
```

На:
```typescript
  // BL-05: Cap aggregate discount (loyalty + flash deal) at 50% of grandTotal.
  // Dynamic pricing is a separate mechanism and is not included in this cap.
  const MAX_COMBINED_DISCOUNT_PCT = 50;
  const maxDiscountAmount = Math.round(grandTotal * MAX_COMBINED_DISCOUNT_PCT / 100);
  const cappedDiscount = Math.min(discountAmount + flashDealAmount, maxDiscountAmount);
  const finalTotal = Math.max(0, grandTotal - cappedDiscount);
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd bookit && npx tsc --noEmit
```

Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add bookit/src/lib/actions/createBooking.ts
git commit -m "createBooking: обмеження сумарної знижки до 50% від вартості"
```

---

## Task 5: pricing/actions.ts — Zod validation for PricingRules

**Аудит:** BL-04 (HIGH) — Pricing rules saved without schema validation

**Files:**
- Modify: `bookit/src/app/(master)/dashboard/pricing/actions.ts`

- [ ] **Step 1: Add Zod schema and validation before DB save**

Замінити весь файл `src/app/(master)/dashboard/pricing/actions.ts`:

```typescript
'use server';

import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

// Runtime schema matching PricingRules interface in dynamicPricing.ts
const dayEnum = z.enum(['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']);
const hoursRange = z.tuple([
  z.number().int().min(0).max(23),
  z.number().int().min(1).max(24),
]).refine(([s, e]) => e > s, 'Кінець має бути більше початку');

const pricingRulesSchema = z.object({
  peak: z.object({
    days: z.array(dayEnum).min(1).max(7),
    hours: hoursRange,
    markup_pct: z.number().min(1).max(50),
  }).optional(),
  quiet: z.object({
    days: z.array(dayEnum).min(1).max(7),
    hours: hoursRange,
    discount_pct: z.number().min(1).max(30),
  }).optional(),
  early_bird: z.object({
    days_ahead: z.number().int().min(1).max(30),
    discount_pct: z.number().min(1).max(30),
  }).optional(),
  last_minute: z.object({
    hours_ahead: z.number().int().min(1).max(72),
    discount_pct: z.number().min(1).max(30),
  }).optional(),
}).strict();

export async function savePricingRules(rules: unknown): Promise<{ error?: string }> {
  // BL-04: Validate at runtime — TypeScript types are compile-time only
  const parsed = pricingRulesSchema.safeParse(rules);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Невірні дані правил' };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthorized' };

  const { data: mp } = await createAdminClient()
    .from('master_profiles')
    .select('subscription_tier')
    .eq('id', user.id)
    .single();

  const tier = mp?.subscription_tier;
  const isPro = tier === 'pro' || tier === 'studio';
  const isStarter = tier === 'starter';
  if (!isPro && !isStarter) return { error: 'Динамічне ціноутворення недоступне на вашому тарифі.' };

  const { error: dbError } = await createAdminClient()
    .from('master_profiles')
    .update({ pricing_rules: parsed.data })
    .eq('id', user.id);

  if (dbError) return { error: dbError.message };
  return {};
}
```

- [ ] **Step 2: Update the call site to pass `rules` as `unknown`**

Файл: `src/app/(master)/dashboard/pricing/page.tsx` або компонент `DynamicPricingPage.tsx`.
Знайти виклик `savePricingRules(rules)` — сигнатура функції вже приймає `unknown`, тому компілятор не потребує змін на стороні виклику. Але потрібно переконатись що тип `PricingRules` імпортується правильно.

```bash
cd bookit && grep -rn "savePricingRules" src/
```

Переконатись що всі виклики просто передають об'єкт (не кастують до `PricingRules` перед передачею).

- [ ] **Step 3: Verify TypeScript compiles**

```bash
cd bookit && npx tsc --noEmit
```

Expected: no errors

- [ ] **Step 4: Commit**

```bash
git add bookit/src/app/(master)/dashboard/pricing/actions.ts
git commit -m "pricing/actions: Zod-валідація правил динамічного ціноутворення"
```

---

## Task 6: Migration 059 — fn_claim_flash_deal_atomic

**Аудит:** BL-03 (HIGH) — Flash deal double-claim race condition

**Files:**
- Create: `bookit/supabase/migrations/059_flash_deal_atomic_claim.sql`

- [ ] **Step 1: Create the migration**

```sql
-- 059: Atomic flash deal claiming to prevent double-claim race condition
-- Uses FOR UPDATE to lock the row before checking status

CREATE OR REPLACE FUNCTION fn_claim_flash_deal_atomic(
  p_deal_id    UUID,
  p_booking_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_rows_updated INT;
BEGIN
  UPDATE flash_deals
  SET    status     = 'claimed',
         booking_id = p_booking_id
  WHERE  id         = p_deal_id
    AND  status     = 'active'
    AND  expires_at > now();

  GET DIAGNOSTICS v_rows_updated = ROW_COUNT;
  RETURN v_rows_updated > 0;
END;
$$;

-- Only service_role can call this function (Server Actions use admin client)
REVOKE ALL ON FUNCTION fn_claim_flash_deal_atomic(UUID, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION fn_claim_flash_deal_atomic(UUID, UUID) TO service_role;
```

- [ ] **Step 2: Apply migration**

```bash
cd bookit && npx supabase db push
```

Expected: `Applied migration 059_flash_deal_atomic_claim.sql`

- [ ] **Step 3: Commit**

```bash
git add bookit/supabase/migrations/059_flash_deal_atomic_claim.sql
git commit -m "міграція: fn_claim_flash_deal_atomic — атомарне захоплення флеш-акції"
```

---

## Task 7: createBooking.ts + flash/actions.ts — use atomic claim + validate discountPct

**Аудит:** BL-03 (HIGH) + BL-06 (MEDIUM)

**Files:**
- Modify: `bookit/src/lib/actions/createBooking.ts:317–324`
- Modify: `bookit/src/app/(master)/dashboard/flash/actions.ts:12–25, 68–85`

- [ ] **Step 1: Replace flash deal claiming in createBooking.ts**

Замінити блок рядки 317–324:
```typescript
  // 11. Mark flash deal as claimed
  if (p.flashDealId && flashDealDiscountPct > 0) {
    await admin
      .from('flash_deals')
      .update({ status: 'claimed', claimed_by: p.clientId ?? null, booking_id: bookingId })
      .eq('id', p.flashDealId)
      .eq('status', 'active');
  }
```

На (атомарне захоплення з rollback):
```typescript
  // 11. Mark flash deal as claimed — atomic (BL-03: prevents double-claim race)
  if (p.flashDealId && flashDealDiscountPct > 0) {
    const { data: claimed, error: claimError } = await admin
      .rpc('fn_claim_flash_deal_atomic', {
        p_deal_id:    p.flashDealId,
        p_booking_id: bookingId,
      });

    if (claimError || !claimed) {
      // Another concurrent booking already claimed this deal — rollback our booking
      await admin.from('bookings').delete().eq('id', bookingId);
      return {
        bookingId: null,
        error: 'Флеш-акція вже використана. Спробуйте забронювати без знижки.',
      };
    }
  }
```

- [ ] **Step 2: Add Zod validation to flash/actions.ts**

Після наявних імпортів додати схему і замінити початок `createFlashDeal`:

```typescript
import { z } from 'zod';

const createFlashDealSchema = z.object({
  serviceId:      z.string().uuid(),
  slotDate:       z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Невірний формат дати'),
  slotTime:       z.string().regex(/^\d{2}:\d{2}$/, 'Невірний формат часу'),
  originalPrice:  z.number().positive().max(100_000),
  discountPct:    z.number().int().min(5).max(90),  // BL-06: cap at 90%
  expiresInHours: z.union([z.literal(2), z.literal(4), z.literal(8)]),
});

export async function createFlashDeal(
  params: unknown  // Was: CreateFlashDealParams — now unknown for runtime validation
): Promise<{ error: string | null; sentTo: number }> {
  // BL-06: Runtime validation
  const parsed = createFlashDealSchema.safeParse(params);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Невірні дані', sentTo: 0 };
  }
  const p = parsed.data;
  // ... решта функції використовує p замість params
```

Замінити всі `params.xxx` на `p.xxx` в тілі функції.

- [ ] **Step 3: Verify TypeScript compiles**

```bash
cd bookit && npx tsc --noEmit
```

Expected: no errors

- [ ] **Step 4: Commit**

```bash
git add bookit/src/lib/actions/createBooking.ts bookit/src/app/(master)/dashboard/flash/actions.ts
git commit -m "flash: атомарне захоплення + Zod-валідація discountPct"
```

---

## Task 8: Migration 060 — payments table для webhook idempotency

**Аудит:** CR-03, CR-04 (HIGH)

**Files:**
- Create: `bookit/supabase/migrations/060_payments_idempotency.sql`

- [ ] **Step 1: Create migration**

```sql
-- 060: Payments table for webhook idempotency
-- Prevents duplicate subscription extension on webhook retry

CREATE TABLE IF NOT EXISTS payments (
  id                 UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  provider           TEXT        NOT NULL CHECK (provider IN ('wayforpay', 'monobank')),
  external_reference TEXT        NOT NULL,
  master_id          UUID        NOT NULL REFERENCES master_profiles(id) ON DELETE CASCADE,
  tier               TEXT        NOT NULL CHECK (tier IN ('pro', 'studio')),
  processed_at       TIMESTAMPTZ DEFAULT now(),
  UNIQUE (provider, external_reference)
);

CREATE INDEX IF NOT EXISTS idx_payments_master_id ON payments(master_id);
CREATE INDEX IF NOT EXISTS idx_payments_ref       ON payments(provider, external_reference);

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "payments: service role full access"
  ON payments FOR ALL
  USING (auth.role() = 'service_role');
```

- [ ] **Step 2: Apply migration**

```bash
cd bookit && npx supabase db push
```

Expected: `Applied migration 060_payments_idempotency.sql`

- [ ] **Step 3: Commit**

```bash
git add bookit/supabase/migrations/060_payments_idempotency.sql
git commit -m "міграція: таблиця payments для ідемпотентності вебхуків"
```

---

## Task 9: webhook/route.ts + mono-webhook/route.ts — idempotency checks

**Аудит:** CR-03, CR-04 (HIGH)

**Files:**
- Modify: `bookit/src/app/api/billing/webhook/route.ts`
- Modify: `bookit/src/app/api/billing/mono-webhook/route.ts`

- [ ] **Step 1: Update WayForPay webhook (webhook/route.ts)**

Замінити блок обробки (рядки 35–55) на:

```typescript
  if (transactionStatus === 'Approved') {
    const parts = orderReference.split('_');
    const tier  = parts[1] as 'pro' | 'studio';
    const uid32 = parts[2];

    if ((tier === 'pro' || tier === 'studio') && uid32?.length === 32) {
      const userId = flatUidToUuid(uid32);
      const supabase = createAdminClient();

      // CR-03: Idempotency — skip if this webhook was already processed
      const { data: existing } = await supabase
        .from('payments')
        .select('id')
        .eq('provider', 'wayforpay')
        .eq('external_reference', orderReference)
        .maybeSingle();

      if (!existing) {
        // Record payment first (unique constraint prevents duplicates on concurrent requests)
        const { error: paymentError } = await supabase.from('payments').insert({
          provider:           'wayforpay',
          external_reference: orderReference,
          master_id:          userId,
          tier,
        });

        // Only extend subscription if payment was successfully recorded
        if (!paymentError) {
          const { error: updateError } = await supabase
            .from('master_profiles')
            .update({
              subscription_tier:       tier,
              subscription_expires_at: new Date(Date.now() + 31 * 24 * 60 * 60 * 1000).toISOString(),
            })
            .eq('id', userId);
          if (updateError) {
            console.error('[wayforpay-webhook] subscription update failed:', updateError.message, { userId, tier });
          }
        } else if (paymentError.code !== '23505') {
          // 23505 = unique_violation (concurrent webhook) — safe to ignore
          console.error('[wayforpay-webhook] payment insert failed:', paymentError.message);
        }
      }
    }
  }
```

- [ ] **Step 2: Update Monobank webhook (mono-webhook/route.ts)**

Замінити блок обробки (рядки 85–126) на:

```typescript
  if (status === 'success' && typeof reference === 'string') {
    const parts = reference.split('_');
    const tier  = parts[1] as 'pro' | 'studio';
    const uid32 = parts[2];

    if ((tier === 'pro' || tier === 'studio') && uid32?.length === 32) {
      const userId = flatUidToUuid(uid32);
      const admin = createAdminClient();

      // CR-04: Idempotency check
      const { data: existing } = await admin
        .from('payments')
        .select('id')
        .eq('provider', 'monobank')
        .eq('external_reference', reference)
        .maybeSingle();

      if (existing) {
        return NextResponse.json({ status: 'ok' });
      }

      // Record payment before updating subscription
      const { error: paymentError } = await admin.from('payments').insert({
        provider:           'monobank',
        external_reference: reference,
        master_id:          userId,
        tier,
      });

      if (paymentError && paymentError.code !== '23505') {
        console.error('[mono-webhook] payment insert failed:', paymentError.message, { userId });
        return NextResponse.json({ status: 'ok' });
      }

      if (!paymentError) {
        const { data: mp, error: selectError } = await admin
          .from('master_profiles')
          .select('subscription_expires_at')
          .eq('id', userId)
          .maybeSingle();

        if (selectError) {
          console.error('[mono-webhook] master_profiles select failed:', selectError.message, { userId });
          return NextResponse.json({ status: 'ok' });
        }
        if (!mp) {
          console.error('[mono-webhook] userId not found in master_profiles:', userId);
          return NextResponse.json({ status: 'ok' });
        }

        // CR-04: Atomic subscription extension (read-modify-write race prevented by payment insert uniqueness)
        const currentExpiry = mp.subscription_expires_at
          ? new Date(mp.subscription_expires_at)
          : new Date();
        if (currentExpiry < new Date()) currentExpiry.setTime(Date.now());
        currentExpiry.setDate(currentExpiry.getDate() + 31);

        const { error: updateError } = await admin
          .from('master_profiles')
          .update({
            subscription_tier:       tier,
            subscription_expires_at: currentExpiry.toISOString(),
          })
          .eq('id', userId);
        if (updateError) {
          console.error('[mono-webhook] subscription update failed:', updateError.message, { userId, tier });
        }
      }
    }
  }
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
cd bookit && npx tsc --noEmit
```

Expected: no errors

- [ ] **Step 4: Commit**

```bash
git add bookit/src/app/api/billing/webhook/route.ts bookit/src/app/api/billing/mono-webhook/route.ts
git commit -m "webhooks: ідемпотентність через таблицю payments (WayForPay + Monobank)"
```

---

## Task 10: Migration 061 — fn_claim_master_role (атомарна реєстрація)

**Аудит:** PS-01 (CRITICAL) — Orphaned auth user on partial failure

**Files:**
- Create: `bookit/supabase/migrations/061_fn_claim_master_role.sql`

- [ ] **Step 1: Create migration**

```sql
-- 061: Atomic master registration to prevent orphaned auth users
-- Wraps profiles + master_profiles insert in a single transaction

CREATE OR REPLACE FUNCTION fn_claim_master_role(
  p_user_id UUID,
  p_phone   TEXT,
  p_slug    TEXT
)
RETURNS TEXT  -- Returns 'ok' on success, error message on failure
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Both inserts happen in the same transaction — either both succeed or both fail
  INSERT INTO profiles (id, role, phone)
  VALUES (p_user_id, 'master', p_phone)
  ON CONFLICT (id) DO UPDATE
    SET role  = 'master',
        phone = EXCLUDED.phone;

  INSERT INTO master_profiles (id, slug, is_published)
  VALUES (p_user_id, p_slug, false)
  ON CONFLICT (id) DO NOTHING;  -- Don't overwrite if already exists (re-entry safe)

  RETURN 'ok';
EXCEPTION WHEN OTHERS THEN
  RETURN SQLERRM;
END;
$$;

REVOKE ALL ON FUNCTION fn_claim_master_role(UUID, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION fn_claim_master_role(UUID, TEXT, TEXT) TO service_role;
```

- [ ] **Step 2: Apply migration**

```bash
cd bookit && npx supabase db push
```

Expected: `Applied migration 061_fn_claim_master_role.sql`

- [ ] **Step 3: Commit**

```bash
git add bookit/supabase/migrations/061_fn_claim_master_role.sql
git commit -m "міграція: fn_claim_master_role — атомарна реєстрація майстра в транзакції"
```

---

## Task 11: register/actions.ts — use fn_claim_master_role DB function

**Аудит:** PS-01 (CRITICAL)

**Files:**
- Modify: `bookit/src/app/(auth)/register/actions.ts:31–70`

- [ ] **Step 1: Replace two-step insert with single RPC call in claimMasterRole**

Замінити тіло функції `claimMasterRole` (рядки 31–70):

```typescript
export async function claimMasterRole(
  phone: string,
): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Не авторизований' };

  const admin = createAdminClient();
  const slug  = generatePlaceholderSlug();

  // PS-01: Use DB transaction function — eliminates orphaned auth user risk.
  // If either profiles or master_profiles insert fails, both are rolled back atomically.
  const { data: result, error: rpcError } = await admin.rpc('fn_claim_master_role', {
    p_user_id: user.id,
    p_phone:   phone,
    p_slug:    slug,
  });

  if (rpcError || result !== 'ok') {
    console.error('[register] fn_claim_master_role failed:', rpcError?.message ?? result);
    return { error: 'Помилка ініціалізації профілю майстра. Спробуйте ще раз.' };
  }

  revalidatePath('/dashboard', 'layout');
  return { error: null };
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd bookit && npx tsc --noEmit
```

Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add bookit/src/app/(auth)/register/actions.ts
git commit -m "register: атомарна реєстрація майстра через DB-транзакцію (fn_claim_master_role)"
```

---

## Task 12: Migration 062 — loyalty_points increment trigger

**Аудит:** DB-02 (HIGH) — Loyalty points never increment on booking

**Files:**
- Create: `bookit/supabase/migrations/062_loyalty_points_on_complete.sql`

- [ ] **Step 1: Create migration**

```sql
-- 062: Increment loyalty_points when booking → completed
-- Extends existing update_client_master_metrics trigger to also add loyalty points
-- 1 loyalty point = 1 UAH spent (total_price is stored in UAH)

CREATE OR REPLACE FUNCTION update_client_master_metrics()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'completed' AND OLD.status != 'completed' AND NEW.client_id IS NOT NULL THEN
        INSERT INTO client_master_relations (
            client_id, master_id, total_visits, total_spent, last_visit_at, loyalty_points
        )
        VALUES (
            NEW.client_id,
            NEW.master_id,
            1,
            NEW.total_price,
            now(),
            NEW.total_price  -- DB-02: initial points = price paid
        )
        ON CONFLICT (client_id, master_id)
        DO UPDATE SET
            total_visits   = client_master_relations.total_visits + 1,
            total_spent    = client_master_relations.total_spent + NEW.total_price,
            average_check  = (client_master_relations.total_spent + NEW.total_price)
                             / (client_master_relations.total_visits + 1),
            last_visit_at  = now(),
            loyalty_points = client_master_relations.loyalty_points + NEW.total_price,  -- DB-02
            updated_at     = now();

        -- Increment master bookings_this_month
        UPDATE master_profiles
        SET bookings_this_month = bookings_this_month + 1
        WHERE id = NEW.master_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
-- Note: trigger trg_update_crm_metrics already exists from 001 — no need to recreate
```

- [ ] **Step 2: Apply migration**

```bash
cd bookit && npx supabase db push
```

Expected: `Applied migration 062_loyalty_points_on_complete.sql`

- [ ] **Step 3: Verify trigger was updated**

```bash
npx supabase db execute "SELECT prosrc FROM pg_proc WHERE proname = 'update_client_master_metrics';" | grep loyalty_points
```

Expected: рядок з `loyalty_points` знайдений

- [ ] **Step 4: Commit**

```bash
git add bookit/supabase/migrations/062_loyalty_points_on_complete.sql
git commit -m "міграція: нарахування loyalty_points при завершенні бронювання (DB-02)"
```

---

## Task 13: Migration 063 — drop orphaned referral tables

**Аудит:** DB-01 (HIGH) — Old referral tables orphaned since migration 001

**Files:**
- Create: `bookit/supabase/migrations/063_drop_orphaned_referral_tables.sql`

- [ ] **Step 1: Verify tables are unused before dropping**

```bash
cd bookit && grep -rn "from('referrals')\|from('referral_bonuses')" src/
```

Expected: нічого не знайдено — таблиці не використовуються у коді

- [ ] **Step 2: Create migration**

```sql
-- 063: Drop orphaned referral tables from migration 001
-- These were replaced by referral_links table (migration 057)
-- Verified unused: no frontend or backend code queries these tables

DROP TABLE IF EXISTS referral_bonuses CASCADE;
DROP TABLE IF EXISTS referrals          CASCADE;
```

- [ ] **Step 3: Apply migration**

```bash
cd bookit && npx supabase db push
```

Expected: `Applied migration 063_drop_orphaned_referral_tables.sql`

- [ ] **Step 4: Commit**

```bash
git add bookit/supabase/migrations/063_drop_orphaned_referral_tables.sql
git commit -m "міграція: видалення застарілих таблиць referrals і referral_bonuses (DB-01)"
```

---

## Task 14: types/database.ts — add missing columns

**Аудит:** DB-04 (MEDIUM) — 4 missing columns in TypeScript interfaces

**Files:**
- Modify: `bookit/src/types/database.ts:129–155, 168–182`

- [ ] **Step 1: Add missing fields to Booking interface**

Знайти `export interface Booking {` і додати перед `created_at`:

```typescript
  dynamic_pricing_label: string | null;     // migration 050
  dynamic_extra_kopecks: number;            // migration 050
  referral_code_used: string | null;        // migration 057
```

- [ ] **Step 2: Add missing field to ClientMasterRelation interface**

Знайти `export interface ClientMasterRelation {` і додати після `loyalty_points`:

```typescript
  has_referral_discount_active: boolean;    // migration 057
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
cd bookit && npx tsc --noEmit
```

Expected: no errors

- [ ] **Step 4: Commit**

```bash
git add bookit/src/types/database.ts
git commit -m "types: додати відсутні колонки до Booking та ClientMasterRelation (DB-04)"
```

---

## Self-Review Checklist

### Spec coverage
| Аудит ID | Задача | Статус |
|----------|--------|--------|
| CR-01 | Task 1 | ✅ |
| BL-01 | Task 2 | ✅ |
| BL-02 | Task 3 | ✅ |
| BL-05 | Task 4 | ✅ |
| BL-04 | Task 5 | ✅ |
| BL-03 | Task 6–7 | ✅ |
| BL-06 | Task 7 | ✅ |
| CR-03 | Task 8–9 | ✅ |
| CR-04 | Task 8–9 | ✅ |
| PS-01 | Task 10–11 | ✅ |
| DB-02 | Task 12 | ✅ |
| DB-01 | Task 13 | ✅ |
| DB-04 | Task 14 | ✅ |

### Залишені для наступного плану (P2/P3)
- TZ-01–05: Timezone fixes (low production risk on Vercel/UTC)
- PS-02: createMasterProfileAfterSignup rollback
- PS-03: Onboarding role check
- DB-03: Loyalty reward redemption UI
- DB-06: Studio system build-out
- CR-05: Cron HMAC auth
- DB-07: Trial trigger verification

### Порядок виконання (важливо!)
1. Task 1 (migration 058) — ПЕРШИМ, інші залежать від нього
2. Task 6 (migration 059) — перед Task 7
3. Task 8 (migration 060) — перед Task 9
4. Task 10 (migration 061) — перед Task 11
5. Tasks 2–5, 12–14 — незалежні між собою
