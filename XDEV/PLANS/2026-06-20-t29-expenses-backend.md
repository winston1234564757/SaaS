# T29 — Розхідники: Migrations + Backend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add `unit` system to products, create `master_expenses` table, two new RPCs, and extend server actions so that consumables are properly tracked with units and deducted on booking completion.

**Architecture:** 3 Supabase migrations → TypeScript types update → extend existing server actions (products + bookings) → new expenses.actions.ts → 3 new client hooks. No new pages or UI — that's T30.

**Tech Stack:** PostgreSQL (Supabase), Next.js 15 Server Actions (`'use server'`), TypeScript strict, TanStack Query v5, `@/lib/supabase/admin` (admin client), `@/lib/supabase/server` (user client)

## Global Constraints

- Admin client: ONLY from `@/lib/supabase/admin` — never inline `createClient()` for writes
- All monetary values in kopecks (INT), never floats — display divides by 100
- RLS: every new table must have `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` + policy
- `revalidatePath` after every mutation that affects dashboard pages
- No `any` — use proper TypeScript types
- Migrations numbered: `20260621000001_`, `20260621000002_`, `20260621000003_`
- Run `npx tsc --noEmit` + `npm run build` after all changes — 0 errors required

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `supabase/migrations/20260621000001_products_unit.sql` | Create | Add `unit` column to products |
| `supabase/migrations/20260621000002_product_links_qty_numeric.sql` | Create | Change product_service_links.quantity to NUMERIC(10,2) |
| `supabase/migrations/20260621000003_master_expenses.sql` | Create | New table + RLS + index |
| `src/types/database.ts` | Modify | Add `unit` to Product, new MasterExpense + ReviewedConsumable interfaces, extend FinanceAnalytics |
| `src/app/(master)/dashboard/products/actions.ts` | Modify | Add `unit` to ProductPayload, createProduct, updateProduct |
| `src/app/(master)/dashboard/revenue/expenses.actions.ts` | Create | CRUD for master_expenses |
| `src/app/(master)/dashboard/bookings/actions.ts` | Modify | Extend completeBooking with reviewedConsumables |
| `src/lib/supabase/hooks/useProducts.ts` | Modify | Add `unit` to PRODUCT_SELECT |
| `src/lib/supabase/hooks/useExpenses.ts` | Create | React Query hook for master_expenses |
| `src/lib/supabase/hooks/useConsumablesForBooking.ts` | Create | Hook calling get_consumables_for_booking RPC |

---

### Task 1: Migration — `products.unit` column

**Files:**
- Create: `bookit/supabase/migrations/20260621000001_products_unit.sql`

**Interfaces:**
- Produces: `products.unit TEXT NOT NULL DEFAULT 'pcs'` available in DB

- [ ] **Step 1: Create migration file**

```sql
-- 20260621000001_products_unit.sql
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS unit TEXT NOT NULL DEFAULT 'pcs'
  CHECK (unit IN ('pcs', 'ml', 'g'));

COMMENT ON COLUMN public.products.unit IS 'Unit of measurement for consumables: pcs=штуки, ml=мілілітри, g=грами';
```

- [ ] **Step 2: Apply locally**

```bash
cd bookit
npx supabase db push
```

Expected output: `Applying migration 20260621000001_products_unit.sql`

- [ ] **Step 3: Verify column exists**

```bash
npx supabase db execute "SELECT column_name, data_type, column_default FROM information_schema.columns WHERE table_name='products' AND column_name='unit';"
```

Expected: row with `column_name=unit, data_type=text, column_default='pcs'`

- [ ] **Step 4: Commit**

```bash
git add bookit/supabase/migrations/20260621000001_products_unit.sql
git commit -m "feat(db): add products.unit column (pcs/ml/g) for consumable measurement"
```

---

### Task 2: Migration — `product_service_links.quantity` → NUMERIC(10,2)

**Files:**
- Create: `bookit/supabase/migrations/20260621000002_product_links_qty_numeric.sql`

**Interfaces:**
- Produces: `product_service_links.quantity NUMERIC(10,2)` — allows 50.5 ml per service

- [ ] **Step 1: Create migration file**

```sql
-- 20260621000002_product_links_qty_numeric.sql
ALTER TABLE public.product_service_links
  ALTER COLUMN quantity TYPE NUMERIC(10,2)
  USING quantity::NUMERIC(10,2);

COMMENT ON COLUMN public.product_service_links.quantity IS 'Amount of consumable used per service session. Unit from products.unit (pcs/ml/g). Supports decimals.';
```

- [ ] **Step 2: Apply**

```bash
npx supabase db push
```

Expected: `Applying migration 20260621000002_product_links_qty_numeric.sql`

- [ ] **Step 3: Verify**

```bash
npx supabase db execute "SELECT column_name, data_type, numeric_precision, numeric_scale FROM information_schema.columns WHERE table_name='product_service_links' AND column_name='quantity';"
```

Expected: `numeric_precision=10, numeric_scale=2`

- [ ] **Step 4: Commit**

```bash
git add bookit/supabase/migrations/20260621000002_product_links_qty_numeric.sql
git commit -m "feat(db): product_service_links.quantity → NUMERIC(10,2) for ml/g support"
```

---

### Task 3: Migration — `master_expenses` table

**Files:**
- Create: `bookit/supabase/migrations/20260621000003_master_expenses.sql`

**Interfaces:**
- Produces: `master_expenses` table with RLS policy; `MasterExpense` shape: `{ id, master_id, category, name, amount_kopecks, expense_date, note, created_at }`

- [ ] **Step 1: Create migration file**

```sql
-- 20260621000003_master_expenses.sql
CREATE TABLE IF NOT EXISTS public.master_expenses (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  master_id        UUID NOT NULL REFERENCES public.master_profiles(id) ON DELETE CASCADE,
  category         TEXT NOT NULL CHECK (category IN (
                     'rent', 'utilities', 'advertising',
                     'education', 'tools', 'other')),
  name             TEXT NOT NULL,
  amount_kopecks   INT NOT NULL CHECK (amount_kopecks > 0),
  expense_date     DATE NOT NULL,
  note             TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.master_expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "master_expenses_own_access" ON public.master_expenses
  FOR ALL
  USING (
    master_id = (
      SELECT master_id FROM public.profiles WHERE id = auth.uid()
    )
  );

CREATE INDEX IF NOT EXISTS idx_master_expenses_master_date
  ON public.master_expenses(master_id, expense_date DESC);

COMMENT ON TABLE public.master_expenses IS 'Operational business expenses entered manually by masters (rent, ads, education, etc.)';
```

- [ ] **Step 2: Apply**

```bash
npx supabase db push
```

Expected: `Applying migration 20260621000003_master_expenses.sql`

- [ ] **Step 3: Verify table + RLS**

```bash
npx supabase db execute "SELECT tablename, rowsecurity FROM pg_tables WHERE tablename='master_expenses';"
```

Expected: `rowsecurity=true`

- [ ] **Step 4: Commit**

```bash
git add bookit/supabase/migrations/20260621000003_master_expenses.sql
git commit -m "feat(db): add master_expenses table with RLS for operational cost tracking"
```

---

### Task 4: TypeScript types update

**Files:**
- Modify: `bookit/src/types/database.ts`

**Interfaces:**
- Consumes: DB schema from Tasks 1–3
- Produces:
  - `Product.unit: 'pcs' | 'ml' | 'g'`
  - `interface MasterExpense { id, master_id, category, name, amount_kopecks, expense_date, note, created_at }`
  - `type ExpenseCategory = 'rent' | 'utilities' | 'advertising' | 'education' | 'tools' | 'other'`
  - `interface ReviewedConsumable { product_id: string; qty_used: number }`
  - `FinanceAnalytics.operational_expenses_total: number`

- [ ] **Step 1: Add `unit` to Product interface**

Find the `Product` interface (line ~278). Add `unit` after `product_type`:

```typescript
export interface Product {
  id: string;
  master_id: string;
  icon_name: ProductIconName;
  name: string;
  description: string | null;
  category: ProductCategory;
  product_type: 'retail' | 'consumable';
  unit: 'pcs' | 'ml' | 'g';              // ← ADD THIS
  price_kopecks: number;
  cost_kopecks: number | null;
  photos: string[];
  stock_qty: number;
  stock_alert_threshold: number | null;
  is_active: boolean;
  is_archived: boolean;
  recommend_always: boolean;
  auto_deduct: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
  product_service_links?: { service_id: string; quantity: number }[];
}
```

- [ ] **Step 2: Add `ExpenseCategory` type + `MasterExpense` interface**

Add after the `ProductTransaction` interface:

```typescript
export type ExpenseCategory =
  | 'rent'
  | 'utilities'
  | 'advertising'
  | 'education'
  | 'tools'
  | 'other';

export interface MasterExpense {
  id: string;
  master_id: string;
  category: ExpenseCategory;
  name: string;
  amount_kopecks: number;
  expense_date: string;   // DATE returned as 'YYYY-MM-DD' string
  note: string | null;
  created_at: string;
}
```

- [ ] **Step 3: Add `ReviewedConsumable` interface**

```typescript
export interface ReviewedConsumable {
  product_id: string;
  qty_used: number;  // NUMERIC from DB → number in TS; may be decimal (e.g. 50.5)
}
```

- [ ] **Step 4: Extend `FinanceAnalytics` in `useAnalyticsExtras.ts`**

File: `bookit/src/lib/supabase/hooks/useAnalyticsExtras.ts`

Find `FinanceAnalytics` interface (~line 100) and add `operational_expenses_total`:

```typescript
export interface FinanceAnalytics {
  services_revenue: number;
  products_revenue: number;
  materials_cost: number;
  discount_amount: number;
  operational_expenses_total: number;  // ← ADD
  net_profit: number;
  services: FinanceServiceItem[];
  products: FinanceProductItem[];
}
```

- [ ] **Step 5: Run type check**

```bash
cd bookit && npx tsc --noEmit
```

Expected: 0 errors

- [ ] **Step 6: Commit**

```bash
git add bookit/src/types/database.ts bookit/src/lib/supabase/hooks/useAnalyticsExtras.ts
git commit -m "feat(types): add Product.unit, MasterExpense, ReviewedConsumable, FinanceAnalytics.operational_expenses_total"
```

---

### Task 5: Extend `products/actions.ts` with `unit`

**Files:**
- Modify: `bookit/src/app/(master)/dashboard/products/actions.ts`

**Interfaces:**
- Consumes: `Product.unit` from Task 4
- Produces: `ProductPayload.unit?: 'pcs' | 'ml' | 'g'` accepted and persisted

- [ ] **Step 1: Add `unit` to `ProductPayload` interface**

Find `ProductPayload` interface (~line 22). Add `unit` field:

```typescript
export interface ProductPayload {
  icon_name?:        ProductIconName;
  name:              string;
  description?:      string | null;
  category:          ProductCategory;
  product_type?:     'retail' | 'consumable';
  unit?:             'pcs' | 'ml' | 'g';   // ← ADD
  price_kopecks:     number;
  cost_kopecks?:     number | null;
  photos?:           string[];
  stock_qty?:        number;
  is_active?:        boolean;
  recommend_always?: boolean;
  auto_deduct?:      boolean;
  sort_order?:       number;
}
```

- [ ] **Step 2: Add `unit` to `createProduct` insert**

Find `.insert({` block in `createProduct` (~line 66). Add `unit`:

```typescript
const { data, error } = await createAdminClient()
  .from('products')
  .insert({
    master_id:        masterId,
    icon_name:        payload.icon_name ?? 'package',
    name:             payload.name.trim(),
    description:      payload.description ?? null,
    category:         payload.category,
    product_type:     payload.product_type ?? 'retail',
    unit:             payload.unit ?? 'pcs',            // ← ADD
    price_kopecks:    payload.price_kopecks,
    cost_kopecks:     payload.cost_kopecks ?? null,
    photos:           payload.photos ?? [],
    stock_qty:        payload.stock_qty ?? 0,
    is_active:        payload.is_active ?? true,
    recommend_always: payload.recommend_always ?? true,
    auto_deduct:      payload.auto_deduct ?? true,
    sort_order:       payload.sort_order ?? 0,
  })
```

- [ ] **Step 3: Add `unit` to `updateProduct`**

Find `updateProduct` (~line 110). The function does conditional update — add `unit` to the update object when present:

```typescript
export async function updateProduct(
  id: string,
  payload: Partial<ProductPayload>,
): Promise<{ error: string | null }> {
  const masterId = await getMasterId();
  if (!masterId) return { error: 'Не авторизований' };

  try {
    const updateData: Record<string, unknown> = {};
    if (payload.name !== undefined)             updateData.name = payload.name.trim();
    if (payload.description !== undefined)      updateData.description = payload.description;
    if (payload.category !== undefined)         updateData.category = payload.category;
    if (payload.product_type !== undefined)     updateData.product_type = payload.product_type;
    if (payload.unit !== undefined)             updateData.unit = payload.unit;  // ← ADD
    if (payload.price_kopecks !== undefined)    updateData.price_kopecks = payload.price_kopecks;
    if (payload.cost_kopecks !== undefined)     updateData.cost_kopecks = payload.cost_kopecks;
    if (payload.photos !== undefined)           updateData.photos = payload.photos;
    if (payload.is_active !== undefined)        updateData.is_active = payload.is_active;
    if (payload.recommend_always !== undefined) updateData.recommend_always = payload.recommend_always;
    if (payload.auto_deduct !== undefined)      updateData.auto_deduct = payload.auto_deduct;
    if (payload.icon_name !== undefined)        updateData.icon_name = payload.icon_name;
    if (payload.sort_order !== undefined)       updateData.sort_order = payload.sort_order;
```

> Note: Read the full existing `updateProduct` function first to match exact pattern — add `unit` line only.

- [ ] **Step 4: Type check**

```bash
npx tsc --noEmit
```

Expected: 0 errors

- [ ] **Step 5: Commit**

```bash
git add bookit/src/app/(master)/dashboard/products/actions.ts
git commit -m "feat(products): add unit field to ProductPayload + createProduct + updateProduct"
```

---

### Task 6: Create `revenue/expenses.actions.ts`

**Files:**
- Create: `bookit/src/app/(master)/dashboard/revenue/expenses.actions.ts`

**Interfaces:**
- Consumes: `MasterExpense`, `ExpenseCategory` from Task 4
- Produces:
  - `createExpense(payload: ExpensePayload): Promise<{ id: string | null; error: string | null }>`
  - `updateExpense(id: string, payload: Partial<ExpensePayload>): Promise<{ error: string | null }>`
  - `deleteExpense(id: string): Promise<{ error: string | null }>`
  - `getExpenses(month?: string): Promise<MasterExpense[]>`

- [ ] **Step 1: Create the file**

```typescript
'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import type { MasterExpense, ExpenseCategory } from '@/types/database';

export interface ExpensePayload {
  category:       ExpenseCategory;
  name:           string;
  amount_kopecks: number;
  expense_date:   string;   // 'YYYY-MM-DD'
  note?:          string | null;
}

async function getMasterOwnerId(): Promise<{ userId: string; masterId: string } | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase
    .from('profiles')
    .select('master_id')
    .eq('id', user.id)
    .single();
  if (!profile?.master_id) return null;
  return { userId: user.id, masterId: profile.master_id };
}

export async function createExpense(
  payload: ExpensePayload,
): Promise<{ id: string | null; error: string | null }> {
  const owner = await getMasterOwnerId();
  if (!owner) return { id: null, error: 'Не авторизований' };

  try {
    if (!payload.name.trim()) return { id: null, error: 'Назва обов\'язкова' };
    if (payload.amount_kopecks <= 0) return { id: null, error: 'Сума має бути більше 0' };

    const { data, error } = await createAdminClient()
      .from('master_expenses')
      .insert({
        master_id:      owner.masterId,
        category:       payload.category,
        name:           payload.name.trim(),
        amount_kopecks: payload.amount_kopecks,
        expense_date:   payload.expense_date,
        note:           payload.note ?? null,
      })
      .select('id')
      .single();

    if (error) throw error;
    revalidatePath('/dashboard/revenue');
    revalidatePath('/dashboard/analytics');
    return { id: data.id, error: null };
  } catch (err: unknown) {
    console.error('[createExpense]', err);
    return { id: null, error: 'Не вдалося додати витрату' };
  }
}

export async function updateExpense(
  id: string,
  payload: Partial<ExpensePayload>,
): Promise<{ error: string | null }> {
  const owner = await getMasterOwnerId();
  if (!owner) return { error: 'Не авторизований' };

  try {
    const updateData: Record<string, unknown> = {};
    if (payload.category !== undefined)       updateData.category = payload.category;
    if (payload.name !== undefined)           updateData.name = payload.name.trim();
    if (payload.amount_kopecks !== undefined) updateData.amount_kopecks = payload.amount_kopecks;
    if (payload.expense_date !== undefined)   updateData.expense_date = payload.expense_date;
    if (payload.note !== undefined)           updateData.note = payload.note;

    const { error } = await createAdminClient()
      .from('master_expenses')
      .update(updateData)
      .eq('id', id)
      .eq('master_id', owner.masterId);

    if (error) throw error;
    revalidatePath('/dashboard/revenue');
    revalidatePath('/dashboard/analytics');
    return { error: null };
  } catch (err: unknown) {
    console.error('[updateExpense]', err);
    return { error: 'Не вдалося оновити витрату' };
  }
}

export async function deleteExpense(
  id: string,
): Promise<{ error: string | null }> {
  const owner = await getMasterOwnerId();
  if (!owner) return { error: 'Не авторизований' };

  try {
    const { error } = await createAdminClient()
      .from('master_expenses')
      .delete()
      .eq('id', id)
      .eq('master_id', owner.masterId);

    if (error) throw error;
    revalidatePath('/dashboard/revenue');
    revalidatePath('/dashboard/analytics');
    return { error: null };
  } catch (err: unknown) {
    console.error('[deleteExpense]', err);
    return { error: 'Не вдалося видалити витрату' };
  }
}

export async function getExpenses(
  month?: string,   // 'YYYY-MM' — if provided, filter by month
): Promise<MasterExpense[]> {
  const owner = await getMasterOwnerId();
  if (!owner) return [];

  try {
    let query = createAdminClient()
      .from('master_expenses')
      .select('*')
      .eq('master_id', owner.masterId)
      .order('expense_date', { ascending: false });

    if (month) {
      // month = 'YYYY-MM', filter expense_date BETWEEN first and last day of month
      query = query
        .gte('expense_date', `${month}-01`)
        .lte('expense_date', `${month}-31`);
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data ?? []) as MasterExpense[];
  } catch (err: unknown) {
    console.error('[getExpenses]', err);
    return [];
  }
}
```

- [ ] **Step 2: Type check**

```bash
npx tsc --noEmit
```

Expected: 0 errors

- [ ] **Step 3: Commit**

```bash
git add bookit/src/app/(master)/dashboard/revenue/expenses.actions.ts
git commit -m "feat(expenses): createExpense/updateExpense/deleteExpense/getExpenses server actions"
```

---

### Task 7: Extend `completeBooking` with consumable deduction

**Files:**
- Modify: `bookit/src/app/(master)/dashboard/bookings/actions.ts`

**Interfaces:**
- Consumes: `ReviewedConsumable { product_id: string; qty_used: number }` from Task 4
- Produces: `completeBooking(bookingId: string, reviewedConsumables?: ReviewedConsumable[]): Promise<{ error: string | null }>`

- [ ] **Step 1: Add import at top of file**

Find the imports at top of `bookings/actions.ts`. Add:

```typescript
import type { ReviewedConsumable } from '@/types/database';
```

- [ ] **Step 2: Extend `completeBooking` signature and add deduction logic**

Find `completeBooking` (~line 273). Replace signature and add consumable deduction block BEFORE the booking status update:

```typescript
export async function completeBooking(
  bookingId: string,
  reviewedConsumables?: ReviewedConsumable[],
): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Не авторизовано' };

  try {
    const admin = createAdminClient();

    const { data: booking } = await admin
      .from('bookings')
      .select('master_id, client_id, date, start_time, booking_services(service_name), master_profiles(profiles(full_name))')
      .eq('id', bookingId)
      .single();

    if (!booking) return { error: 'Запис не знайдено' };
    if (booking.master_id !== user.id) return { error: 'Немає доступу' };

    // ── Deduct consumables ──────────────────────────────────────────────────────
    if (reviewedConsumables && reviewedConsumables.length > 0) {
      for (const item of reviewedConsumables) {
        if (item.qty_used <= 0) continue;

        // Fetch current stock
        const { data: product } = await admin
          .from('products')
          .select('stock_qty, cost_kopecks')
          .eq('id', item.product_id)
          .single();

        if (!product) continue;

        const newQty = Math.max(0, product.stock_qty - item.qty_used);

        // Update stock
        await admin
          .from('products')
          .update({ stock_qty: newQty })
          .eq('id', item.product_id);

        // Log transaction
        await admin
          .from('product_transactions')
          .insert({
            product_id: item.product_id,
            type:       'sale',
            qty_delta:  -item.qty_used,
            note:       `Списано при завершенні запису ${bookingId}`,
          });
      }
    }
    // ── End consumable deduction ────────────────────────────────────────────────

    const { error } = await admin
      .from('bookings')
      .update({ status: 'completed', status_changed_at: new Date().toISOString() })
      .eq('id', bookingId);

    if (error) throw error;

    revalidatePath('/dashboard/bookings');
    revalidatePath('/my/bookings');
    revalidatePath('/dashboard/products');  // ← ADD: refresh product stock in UI

    // ... rest of notification logic stays unchanged
```

- [ ] **Step 3: Type check**

```bash
npx tsc --noEmit
```

Expected: 0 errors

- [ ] **Step 4: Commit**

```bash
git add bookit/src/app/(master)/dashboard/bookings/actions.ts
git commit -m "feat(bookings): completeBooking accepts reviewedConsumables for stock deduction"
```

---

### Task 8: Update `useProducts.ts` — add `unit` to SELECT

**Files:**
- Modify: `bookit/src/lib/supabase/hooks/useProducts.ts`

**Interfaces:**
- Produces: all `Product` objects returned by hook include `unit` field

- [ ] **Step 1: Add `unit` to `PRODUCT_SELECT` string**

Find `PRODUCT_SELECT` constant (~line 14):

```typescript
const PRODUCT_SELECT =
  'id, master_id, icon_name, name, description, category, product_type, unit, ' +  // ← add unit
  'price_kopecks, cost_kopecks, photos, stock_qty, stock_alert_threshold, ' +
  'is_active, is_archived, recommend_always, auto_deduct, sort_order, ' +
  'created_at, updated_at, product_service_links(service_id, quantity)';
```

- [ ] **Step 2: Type check**

```bash
npx tsc --noEmit
```

Expected: 0 errors

- [ ] **Step 3: Commit**

```bash
git add bookit/src/lib/supabase/hooks/useProducts.ts
git commit -m "feat(hooks): add unit to useProducts PRODUCT_SELECT"
```

---

### Task 9: Create `useExpenses.ts` hook

**Files:**
- Create: `bookit/src/lib/supabase/hooks/useExpenses.ts`

**Interfaces:**
- Consumes: `MasterExpense`, `ExpenseCategory` from Task 4; `createExpense`, `updateExpense`, `deleteExpense` from Task 6
- Produces:
  - `useExpenses(month?: string): { expenses, isLoading, createExpense, updateExpense, deleteExpense }`

- [ ] **Step 1: Create the hook**

```typescript
'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '../client';
import { useMasterContext } from '../context';
import type { MasterExpense } from '@/types/database';
import {
  createExpense as createExpenseAction,
  updateExpense as updateExpenseAction,
  deleteExpense as deleteExpenseAction,
  type ExpensePayload,
} from '@/app/(master)/dashboard/revenue/expenses.actions';

export type { ExpensePayload };

const KEY = (masterId: string | undefined, month?: string) =>
  ['expenses', masterId, month ?? 'all'] as const;

export function useExpenses(month?: string) {
  const { masterProfile } = useMasterContext();
  const masterId = masterProfile?.id;
  const qc = useQueryClient();
  const key = KEY(masterId, month);

  const query = useQuery<MasterExpense[]>({
    queryKey: key,
    queryFn: async () => {
      let q = createClient()
        .from('master_expenses')
        .select('*')
        .order('expense_date', { ascending: false });

      if (month) {
        q = q
          .gte('expense_date', `${month}-01`)
          .lte('expense_date', `${month}-31`);
      }

      const { data, error } = await q;
      if (error) throw new Error(error.message);
      return (data ?? []) as MasterExpense[];
    },
    enabled: !!masterId,
    staleTime: 30_000,
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ['expenses', masterId] });

  const createMutation = useMutation({
    mutationFn: (payload: ExpensePayload) => createExpenseAction(payload),
    onSuccess: (result) => {
      if (!result.error) invalidate();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<ExpensePayload> }) =>
      updateExpenseAction(id, payload),
    onSuccess: (result) => {
      if (!result.error) invalidate();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteExpenseAction(id),
    onSuccess: (result) => {
      if (!result.error) invalidate();
    },
  });

  return {
    expenses:      query.data ?? [],
    isLoading:     query.isPending,
    createExpense: createMutation.mutateAsync,
    updateExpense: updateMutation.mutateAsync,
    deleteExpense: deleteMutation.mutateAsync,
    isCreating:    createMutation.isPending,
    isDeleting:    deleteMutation.isPending,
  };
}
```

- [ ] **Step 2: Type check**

```bash
npx tsc --noEmit
```

Expected: 0 errors

- [ ] **Step 3: Commit**

```bash
git add bookit/src/lib/supabase/hooks/useExpenses.ts
git commit -m "feat(hooks): add useExpenses hook for master_expenses CRUD"
```

---

### Task 10: Create `useConsumablesForBooking.ts` hook

**Files:**
- Create: `bookit/src/lib/supabase/hooks/useConsumablesForBooking.ts`

**Interfaces:**
- Produces:
  - `interface ConsumableForBooking { product_id: string; name: string; unit: 'pcs' | 'ml' | 'g'; total_qty: number; cost_kopecks: number | null }`
  - `useConsumablesForBooking(bookingId: string | null): { consumables, isLoading }`

The hook fetches consumables by joining booking → booking_services → product_service_links → products. Client-side join (no RPC needed for hook — RPC is used server-side in completeBooking).

- [ ] **Step 1: Create the hook**

```typescript
'use client';

import { useQuery } from '@tanstack/react-query';
import { createClient } from '../client';

export interface ConsumableForBooking {
  product_id:    string;
  name:          string;
  unit:          'pcs' | 'ml' | 'g';
  total_qty:     number;
  cost_kopecks:  number | null;
}

export function useConsumablesForBooking(bookingId: string | null) {
  return useQuery<ConsumableForBooking[]>({
    queryKey: ['consumables-for-booking', bookingId],
    queryFn: async (): Promise<ConsumableForBooking[]> => {
      const supabase = createClient();

      // 1. Get service IDs for this booking
      const { data: bookingServices, error: bsErr } = await supabase
        .from('booking_services')
        .select('service_id')
        .eq('booking_id', bookingId!);

      if (bsErr) throw bsErr;
      const serviceIds = (bookingServices ?? [])
        .map(r => r.service_id)
        .filter(Boolean) as string[];

      if (serviceIds.length === 0) return [];

      // 2. Get product_service_links for those services, join products
      const { data: links, error: lErr } = await supabase
        .from('product_service_links')
        .select('quantity, products!inner(id, name, unit, cost_kopecks, product_type, is_archived)')
        .in('service_id', serviceIds)
        .eq('products.product_type', 'consumable')
        .eq('products.is_archived', false);

      if (lErr) throw lErr;

      // 3. Group by product_id, sum quantities
      const map = new Map<string, ConsumableForBooking>();
      for (const link of links ?? []) {
        const product = link.products as unknown as {
          id: string; name: string; unit: 'pcs' | 'ml' | 'g'; cost_kopecks: number | null;
        };
        const existing = map.get(product.id);
        if (existing) {
          existing.total_qty += Number(link.quantity);
        } else {
          map.set(product.id, {
            product_id:   product.id,
            name:         product.name,
            unit:         product.unit,
            total_qty:    Number(link.quantity),
            cost_kopecks: product.cost_kopecks,
          });
        }
      }

      return Array.from(map.values());
    },
    enabled: !!bookingId,
    staleTime: 60_000,
  });
}
```

- [ ] **Step 2: Type check**

```bash
npx tsc --noEmit
```

Expected: 0 errors

- [ ] **Step 3: Commit**

```bash
git add bookit/src/lib/supabase/hooks/useConsumablesForBooking.ts
git commit -m "feat(hooks): add useConsumablesForBooking for MaterialsReviewSheet data"
```

---

### Task 11: Update `get_analytics_extras` RPC + final type check + build

**Files:**
- Modify Supabase RPC via SQL (apply through Supabase Dashboard SQL Editor or CLI)

**Interfaces:**
- Produces: `FinanceAnalytics.operational_expenses_total` and real `materials_cost` from DB

> **Note:** This task modifies a Supabase RPC function. You need access to the Supabase Dashboard SQL Editor or the local Supabase instance. Apply SQL below.

- [ ] **Step 1: Get current RPC definition**

In Supabase Dashboard → SQL Editor, run:
```sql
SELECT pg_get_functiondef(oid) FROM pg_proc WHERE proname = 'get_analytics_extras';
```

Find the `'finances'` scope block.

- [ ] **Step 2: Replace finances scope in RPC**

Add/replace the `finances` scope branch to return real data:

```sql
-- In the get_analytics_extras function, replace/add the finances branch:
ELSIF p_scope = 'finances' THEN

  -- Real materials cost from product_transactions on consumable products
  SELECT COALESCE(SUM(ABS(pt.qty_delta) * COALESCE(p.cost_kopecks, 0)), 0)
  INTO v_materials_cost
  FROM product_transactions pt
  JOIN products p ON pt.product_id = p.id
  WHERE p.master_id = p_master_id
    AND p.product_type = 'consumable'
    AND pt.type = 'sale'
    AND pt.created_at::date BETWEEN p_start_date AND p_end_date;

  -- Operational expenses from master_expenses
  SELECT COALESCE(SUM(amount_kopecks), 0)
  INTO v_operational_expenses
  FROM master_expenses
  WHERE master_id = p_master_id
    AND expense_date BETWEEN p_start_date AND p_end_date;

  -- Return finances JSON
  RETURN jsonb_build_object(
    'finances', jsonb_build_object(
      'services_revenue',            v_services_revenue,
      'products_revenue',            v_products_revenue,
      'materials_cost',              v_materials_cost,
      'discount_amount',             v_discount_amount,
      'operational_expenses_total',  v_operational_expenses,
      'net_profit',                  v_services_revenue + v_products_revenue
                                     - v_materials_cost - v_discount_amount
                                     - v_operational_expenses,
      'services',                    v_services_json,
      'products',                    v_products_json
    )
  );
```

> If the RPC is complex, read the full function first and only replace the finances block. Keep all other scopes unchanged.

- [ ] **Step 3: Update FinancesTab fallback defaults**

File: `bookit/src/components/master/analytics/sections/tabs/FinancesTab.tsx`

Find the fallback `fin` object (~line 44). Add `operational_expenses_total`:

```typescript
const fin = data?.finances ?? {
  services_revenue: 0,
  products_revenue: 0,
  materials_cost: 0,
  discount_amount: 0,
  operational_expenses_total: 0,  // ← ADD
  net_profit: 0,
  services: [],
  products: [],
};
```

Also update the demo data fallback (~line 57):

```typescript
const displayFin = hasData ? fin : {
  services_revenue: 1540000,
  products_revenue: 320000,
  materials_cost: 410000,
  discount_amount: 50000,
  operational_expenses_total: 280000,  // ← ADD demo value
  net_profit: 1120000,                  // adjust: 1540000+320000-410000-50000-280000
  services: [ ... ],
  products: []
};
```

- [ ] **Step 4: Final TSC + build**

```bash
cd bookit
npx tsc --noEmit
npm run build
```

Expected: 0 errors, clean build

- [ ] **Step 5: Commit**

```bash
git add bookit/src/components/master/analytics/sections/tabs/FinancesTab.tsx
git commit -m "feat(analytics): FinancesTab uses operational_expenses_total from updated RPC"
```

- [ ] **Step 6: Final T29 commit**

```bash
git commit --allow-empty -m "feat(t29): Розхідники backend complete — unit system, master_expenses, completeBooking+deduction, useExpenses, useConsumablesForBooking"
```

---

## Verification Checklist

After all tasks complete:

- [ ] `npx tsc --noEmit` → 0 errors
- [ ] `npm run build` → clean (no warnings about missing types)
- [ ] In Supabase: `SELECT * FROM master_expenses LIMIT 0;` → table exists with correct columns
- [ ] In Supabase: `SELECT unit FROM products LIMIT 5;` → returns 'pcs' for existing rows
- [ ] In Supabase: `SELECT quantity FROM product_service_links LIMIT 1;` → type is numeric
- [ ] Create an expense via `createExpense({ category:'rent', name:'Test', amount_kopecks:100000, expense_date:'2026-06-20' })` → returns `{ id: '...', error: null }`
- [ ] `completeBooking('some-booking-id', [{ product_id: '...', qty_used: 50 }])` → `product_transactions` row inserted, `products.stock_qty` decremented
- [ ] `useConsumablesForBooking(bookingId)` → returns array with `unit` field populated

---

## Notes for T30 (UX/UI)

T30 will consume these from T29:
- `useExpenses()` → ExpensesList + ExpenseForm in Revenue Hub Фінанси tab
- `useConsumablesForBooking(bookingId)` → MaterialsReviewSheet component
- `completeBooking(id, reviewedConsumables)` → triggered from MaterialsReviewSheet confirm button
- `Product.unit` → shown in ConsumableCard + unit selector in ProductEditor
- `ExpensePayload` → typed form in ExpenseForm component
