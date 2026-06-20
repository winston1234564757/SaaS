# T30 — Розхідники: UX/UI реалізація — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Full UX/UI for the consumables system — 5 modules wired to T29 backend.

**Architecture (Approach A):**  
- `MaterialsReviewSheet` intercepts "Завершити" when booking has consumables — vaul BottomSheet with qty editing  
- `ConsumablesTab` in ProductsPage — filters `product_type='consumable'`  
- `ExpensesTab` in Revenue Hub — Pro-only CRUD for `master_expenses`  
- `WaterfallChart` gets 6th bar for operational_expenses  
- `FinancesTab` gets 5th KPI card + passes `operationalExpenses` to chart

**Tech Stack:** Next.js 16, TypeScript strict, Tailwind v4, vaul Drawer, TanStack Query v5, Framer Motion (spring as const), nuqs

## Global Constraints

- All monetary values in kopecks (INT), display /100 using `formatPrice`
- No emoji in UI. No `any`. No `onClick` on `<div>`
- All `<button>` elements: `type="button"`, `aria-label` if icon-only
- vaul Drawer (not bare Framer Motion) for all bottom sheets
- `// humanized` marker on any `.ts/.tsx` file with Ukrainian UI strings
- `transition={{ type: 'spring' as const, ... }}` — always cast
- `useMasterContext()` for masterId — never pass as prop chain
- All amounts in kopecks. Never floats in DB.

---

## File Map

| Action | File | Responsibility |
|--------|------|----------------|
| **Create** | `src/components/master/products/ConsumableCard.tsx` | Consumable list item with unit badge + restock/edit actions |
| **Create** | `src/components/master/bookings/MaterialsReviewSheet.tsx` | vaul sheet: review/edit qty per consumable before completing booking |
| **Create** | `src/components/master/revenue/ExpensesTab.tsx` | Pro-only CRUD UI for master_expenses (Revenue Hub tab) |
| **Modify** | `src/components/master/products/ProductEditor.tsx` | Add `unit` state + unit selector inside consumable settings block |
| **Modify** | `src/components/master/products/ProductsPage.tsx` | Add 3rd tab 'consumables' + ConsumableCard list |
| **Modify** | `src/components/master/services/ServiceEditor.tsx` | Read-only linked consumables section in edit mode |
| **Modify** | `src/components/master/bookings/BookingCard.tsx` | Intercept handleComplete → open MaterialsReviewSheet when consumables > 0 |
| **Modify** | `src/components/master/bookings/BookingActionsDropdown.tsx` | Same intercept for dropdown "Завершити" |
| **Modify** | `src/components/master/bookings/BookingDetailsModal.tsx` | Add consumables display section before Notes |
| **Modify** | `src/components/master/revenue/RevenueHubClient.tsx` | Add 'expenses' tab + dynamic-import ExpensesTab |
| **Modify** | `src/components/master/analytics/charts/WaterfallChart.tsx` | Add `operationalExpenses` prop + 6th bar |
| **Modify** | `src/components/master/analytics/sections/tabs/FinancesTab.tsx` | Add 5th KPI card + pass operationalExpenses to WaterfallChart |

---

## Task 1: ConsumableCard.tsx

**Files:**
- Create: `src/components/master/products/ConsumableCard.tsx`

**Interfaces:**
- Consumes: `Product` from `@/types/database` (has `unit: 'pcs'|'ml'|'g'`, `stock_qty`, `name`, `is_active`)
- Produces: `ConsumableCard({ product, onEdit, onRestock })`

- [ ] **Step 1: Create ConsumableCard.tsx**

```tsx
'use client';

// humanized
import { Package2, Droplets, FlaskConical } from 'lucide-react';
import type { Product } from '@/types/database';

const UNIT_LABEL: Record<'pcs' | 'ml' | 'g', string> = { pcs: 'шт', ml: 'мл', g: 'г' };
const UNIT_ICON = { pcs: Package2, ml: Droplets, g: FlaskConical } as const;

interface ConsumableCardProps {
  product: Product;
  onEdit: (p: Product) => void;
  onRestock: (p: Product) => void;
}

export function ConsumableCard({ product, onEdit, onRestock }: ConsumableCardProps) {
  const unit = product.unit ?? 'pcs';
  const Icon = UNIT_ICON[unit];
  const isLow = product.stock_qty <= (unit === 'pcs' ? 3 : 10);

  return (
    <div className="bento-card p-4 flex items-center gap-4">
      <div className="size-11 rounded-xl bg-secondary/40 border border-border flex items-center justify-center shrink-0">
        <Icon size={18} className="text-muted-foreground" />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground truncate">{product.name}</p>
        <p className={`text-xs mt-0.5 font-medium ${isLow ? 'text-destructive' : 'text-muted-foreground/70'}`}>
          {product.stock_qty} {UNIT_LABEL[unit]}
          {isLow && ' — критично мало'}
        </p>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <button
          type="button"
          aria-label="Поповнити запас"
          onClick={() => onRestock(product)}
          className="px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-xs font-semibold hover:bg-primary/20 transition-colors active:scale-95"
        >
          +
        </button>
        <button
          type="button"
          aria-label="Редагувати розхідник"
          onClick={() => onEdit(product)}
          className="px-3 py-1.5 rounded-lg bg-secondary/60 text-muted-foreground text-xs font-semibold hover:bg-secondary/80 transition-colors active:scale-95"
        >
          Ред.
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify — no TSC errors on this file**

Run: `cd bookit && npx tsc --noEmit 2>&1 | head -20`  
Expected: zero errors related to ConsumableCard.tsx

---

## Task 2: MaterialsReviewSheet.tsx

**Files:**
- Create: `src/components/master/bookings/MaterialsReviewSheet.tsx`

**Interfaces:**
- Consumes: `useConsumablesForBooking(bookingId)` → `ConsumableForBooking[]` (has `product_id, name, unit, total_qty`)
- Produces: `MaterialsReviewSheet({ bookingId, open, onConfirm, onClose })`
  - `onConfirm(consumables: { product_id: string; qty_used: number }[]) => void`

- [ ] **Step 1: Create MaterialsReviewSheet.tsx**

```tsx
'use client';

// humanized
import { useState, useEffect } from 'react';
import { Drawer } from 'vaul';
import { Package2, Droplets, FlaskConical } from 'lucide-react';
import { useConsumablesForBooking } from '@/lib/supabase/hooks/useConsumablesForBooking';

const UNIT_LABEL: Record<'pcs' | 'ml' | 'g', string> = { pcs: 'шт', ml: 'мл', g: 'г' };
const UNIT_ICON = { pcs: Package2, ml: Droplets, g: FlaskConical } as const;

interface MaterialsReviewSheetProps {
  bookingId: string;
  open: boolean;
  onConfirm: (consumables: { product_id: string; qty_used: number }[]) => void;
  onClose: () => void;
}

export function MaterialsReviewSheet({ bookingId, open, onConfirm, onClose }: MaterialsReviewSheetProps) {
  const { data: consumables = [], isLoading } = useConsumablesForBooking(open ? bookingId : null);
  const [qtyMap, setQtyMap] = useState<Record<string, string>>({});

  useEffect(() => {
    if (consumables.length > 0) {
      const init: Record<string, string> = {};
      consumables.forEach(c => { init[c.product_id] = String(c.total_qty); });
      setQtyMap(init);
    }
  }, [consumables]);

  function handleConfirm() {
    const reviewed = consumables.map(c => ({
      product_id: c.product_id,
      qty_used: Number(qtyMap[c.product_id] ?? c.total_qty),
    }));
    onConfirm(reviewed);
  }

  return (
    <Drawer.Root open={open} onOpenChange={v => !v && onClose()} shouldScaleBackground>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40" />
        <Drawer.Content className="fixed bottom-0 left-0 right-0 z-50 flex flex-col bg-surface rounded-t-[28px] shadow-2xl max-h-[80vh]">
          <div className="mx-auto mt-3 mb-2 w-12 h-1.5 rounded-full bg-border/60 shrink-0" />

          <div className="px-5 overflow-y-auto pb-safe">
            <Drawer.Title className="text-base font-bold text-foreground mt-1 mb-0.5">
              Розхідники сеансу
            </Drawer.Title>
            <p className="text-xs text-muted-foreground/70 mb-4">
              Скоригуйте фактичну витрату матеріалів
            </p>

            {isLoading ? (
              <div className="h-24 bg-secondary/30 rounded-2xl animate-pulse mb-4" />
            ) : consumables.length === 0 ? (
              <p className="text-sm text-muted-foreground/60 text-center py-8 mb-4">
                Немає прив&apos;язаних матеріалів
              </p>
            ) : (
              <div className="flex flex-col gap-3 mb-5">
                {consumables.map(c => {
                  const Icon = UNIT_ICON[c.unit];
                  return (
                    <div key={c.product_id} className="flex items-center gap-3 p-3 rounded-xl bg-secondary/30 border border-border/40">
                      <Icon size={16} className="text-muted-foreground/60 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate">{c.name}</p>
                        <p className="text-[10px] text-muted-foreground/50">Норма: {c.total_qty} {UNIT_LABEL[c.unit]}</p>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <input
                          type="number"
                          min={0}
                          step={c.unit === 'pcs' ? 1 : 0.1}
                          value={qtyMap[c.product_id] ?? String(c.total_qty)}
                          onChange={e => setQtyMap(prev => ({ ...prev, [c.product_id]: e.target.value }))}
                          aria-label={`Фактична витрата ${c.name}`}
                          className="w-20 px-2 py-1.5 rounded-lg border border-border bg-background text-sm text-right font-semibold outline-none focus:border-primary"
                        />
                        <span className="text-xs text-muted-foreground/60 w-5 shrink-0">{UNIT_LABEL[c.unit]}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="flex gap-3 pb-6">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 h-12 rounded-xl border border-border text-sm font-semibold text-muted-foreground hover:bg-secondary/60 transition-colors active:scale-[0.97]"
              >
                Пропустити
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                className="flex-1 h-12 rounded-xl bg-accent text-accent-foreground text-sm font-semibold hover:bg-accent/90 transition-colors active:scale-[0.97]"
              >
                Завершити запис
              </button>
            </div>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
```

- [ ] **Step 2: TSC check**

Run: `cd bookit && npx tsc --noEmit 2>&1 | head -20`  
Expected: zero errors

---

## Task 3: BookingCard.tsx — intercept "Завершити"

**Files:**
- Modify: `src/components/master/bookings/BookingCard.tsx:1-272`

**What changes:**
1. Import `useState` (already imported via useTransition — add useState)
2. Import `useConsumablesForBooking`, `MaterialsReviewSheet`
3. Add `reviewSheetOpen` state
4. `useConsumablesForBooking(booking.status === 'confirmed' ? booking.id : null)` — conditional
5. Replace `handleComplete` body: if consumables > 0, open sheet; else call directly
6. Add `<MaterialsReviewSheet>` below the motion.div

- [ ] **Step 1: Edit BookingCard.tsx — imports**

Old:
```tsx
import { useTransition } from 'react';
```
New:
```tsx
import { useTransition, useState } from 'react';
```

- [ ] **Step 2: Add imports after existing imports**

After `import { cn } from '@/lib/utils/cn';` add:
```tsx
import { useConsumablesForBooking } from '@/lib/supabase/hooks/useConsumablesForBooking';
import { MaterialsReviewSheet } from './MaterialsReviewSheet';
```

- [ ] **Step 3: Add state + hook inside BookingCard (after `const isAnyPending` line)**

After:
```tsx
  const isAnyPending = isPendingConfirm || isPendingCancel || isPendingComplete || isPendingNoShow;
```
Add:
```tsx
  const [reviewSheetOpen, setReviewSheetOpen] = useState(false);
  const { data: consumables = [] } = useConsumablesForBooking(
    booking.status === 'confirmed' ? booking.id : null
  );
```

- [ ] **Step 4: Replace handleComplete**

Old:
```tsx
  const handleComplete = () =>
    startComplete(async () => {
      const { error } = await completeBooking(booking.id);
      if (error) {
        showToast({ type: 'error', title: 'Помилка', message: parseError(error) });
      } else {
        showToast({ type: 'success', title: 'Запис завершено' });
        await invalidateAll();
      }
    });
```
New:
```tsx
  const handleComplete = () => {
    if (consumables.length > 0) {
      setReviewSheetOpen(true);
      return;
    }
    startComplete(async () => {
      const { error } = await completeBooking(booking.id);
      if (error) {
        showToast({ type: 'error', title: 'Помилка', message: parseError(error) });
      } else {
        showToast({ type: 'success', title: 'Запис завершено' });
        await invalidateAll();
      }
    });
  };

  const handleCompleteWithConsumables = (reviewed: { product_id: string; qty_used: number }[]) => {
    setReviewSheetOpen(false);
    startComplete(async () => {
      const { error } = await completeBooking(booking.id, reviewed);
      if (error) {
        showToast({ type: 'error', title: 'Помилка', message: parseError(error) });
      } else {
        showToast({ type: 'success', title: 'Запис завершено' });
        await invalidateAll();
      }
    });
  };
```

- [ ] **Step 5: Add MaterialsReviewSheet before closing `</motion.div>`**

Before the final `);` of the motion.div return (after `</motion.div>` closing tag), add:
```tsx
      <MaterialsReviewSheet
        bookingId={booking.id}
        open={reviewSheetOpen}
        onConfirm={handleCompleteWithConsumables}
        onClose={() => setReviewSheetOpen(false)}
      />
```

Exact anchor — replace:
```tsx
    </motion.div>
  );
}
```
With:
```tsx
    </motion.div>

    <MaterialsReviewSheet
      bookingId={booking.id}
      open={reviewSheetOpen}
      onConfirm={handleCompleteWithConsumables}
      onClose={() => setReviewSheetOpen(false)}
    />
  );
}
```

- [ ] **Step 6: TSC check**

Run: `cd bookit && npx tsc --noEmit 2>&1 | head -30`  
Expected: zero errors

---

## Task 4: BookingActionsDropdown.tsx — intercept "Завершити"

**Files:**
- Modify: `src/components/master/bookings/BookingActionsDropdown.tsx`

- [ ] **Step 1: Add useState import**

Old:
```tsx
import { useTransition } from 'react';
```
New:
```tsx
import { useTransition, useState } from 'react';
```

- [ ] **Step 2: Add imports**

After `import { invalidateBookingQueries } from '@/lib/utils/invalidateBookingQueries';` add:
```tsx
import { useConsumablesForBooking } from '@/lib/supabase/hooks/useConsumablesForBooking';
import { MaterialsReviewSheet } from './MaterialsReviewSheet';
```

- [ ] **Step 3: Add state + hook inside component (after `const [isPending, startTransition] = useTransition();`)**

After:
```tsx
  const [isPending, startTransition] = useTransition();
```
Add:
```tsx
  const [reviewSheetOpen, setReviewSheetOpen] = useState(false);
  const { data: consumables = [] } = useConsumablesForBooking(
    canComplete ? id : null
  );
```

- [ ] **Step 4: Replace "Завершити" onClick**

Old:
```tsx
            onClick: () => run(() => completeBooking(id), 'Запис завершено'),
```
New:
```tsx
            onClick: () => {
              if (consumables.length > 0) {
                setReviewSheetOpen(true);
              } else {
                run(() => completeBooking(id), 'Запис завершено');
              }
            },
```

- [ ] **Step 5: Add handler + Sheet after the `return (` block**

The component returns `<DropdownMenu ... />`. Replace the return:

Old:
```tsx
  return (
    <DropdownMenu
      trigger={
        isPending ? (
          <Loader2 size={16} className="animate-spin text-primary" />
        ) : (
          <MoreVertical size={16} />
        )
      }
      items={items}
      align="right"
      disabled={isPending}
    />
  );
}
```
New:
```tsx
  const handleCompleteWithConsumables = (reviewed: { product_id: string; qty_used: number }[]) => {
    setReviewSheetOpen(false);
    run(() => completeBooking(id, reviewed), 'Запис завершено');
  };

  return (
    <>
      <DropdownMenu
        trigger={
          isPending ? (
            <Loader2 size={16} className="animate-spin text-primary" />
          ) : (
            <MoreVertical size={16} />
          )
        }
        items={items}
        align="right"
        disabled={isPending}
      />

      <MaterialsReviewSheet
        bookingId={id}
        open={reviewSheetOpen}
        onConfirm={handleCompleteWithConsumables}
        onClose={() => setReviewSheetOpen(false)}
      />
    </>
  );
}
```

- [ ] **Step 6: TSC check**

Run: `cd bookit && npx tsc --noEmit 2>&1 | head -30`  
Expected: zero errors

---

## Task 5: ProductEditor.tsx — unit selector

**Files:**
- Modify: `src/components/master/products/ProductEditor.tsx`

**What changes:**
1. Add `unit` state (type `'pcs' | 'ml' | 'g'`)
2. Initialize from `product.unit` in useEffect
3. Include `unit` in handleSave payload
4. Add unit selector UI inside consumable settings block

- [ ] **Step 1: Add unit state after productType state**

After:
```tsx
  const [productType, setProductType] = useState<'retail' | 'consumable'>('retail');
  const [autoDeduct, setAutoDeduct] = useState(true);
```
Add:
```tsx
  const [unit, setUnit] = useState<'pcs' | 'ml' | 'g'>('pcs');
```

- [ ] **Step 2: Initialize unit in useEffect**

After:
```tsx
      setProductType(product.product_type ?? 'retail');
      setAutoDeduct(product.auto_deduct !== false);
```
Add:
```tsx
      setUnit(product.unit ?? 'pcs');
```

- [ ] **Step 3: Add unit to payload in handleSave**

Find the payload object (has `product_type: productType`), add after it:
```tsx
        unit,
```

The payload in handleSave looks like:
```tsx
      const payload: ProductPayload = {
        ...
        product_type: productType,
        icon_name: iconName,
        auto_deduct: autoDeduct,
      };
```
Becomes:
```tsx
      const payload: ProductPayload = {
        ...
        product_type: productType,
        unit,
        icon_name: iconName,
        auto_deduct: autoDeduct,
      };
```

- [ ] **Step 4: Add unit selector inside consumable settings block**

After the `auto_deduct` toggle button (after the closing `</button>` of the autoDeduct toggle), add:

```tsx
                  {/* Unit selector */}
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-primary/70 mb-2">Одиниця виміру</p>
                    <div className="flex gap-2">
                      {([['pcs', 'шт'], ['ml', 'мл'], ['g', 'г']] as const).map(([val, label]) => (
                        <button
                          key={val}
                          type="button"
                          aria-pressed={unit === val}
                          onClick={() => setUnit(val)}
                          className={`flex-1 py-2.5 rounded-xl border text-xs font-bold transition-all active:scale-[0.95] cursor-pointer ${
                            unit === val
                              ? 'bg-primary text-primary-foreground border-transparent shadow-md shadow-primary/10'
                              : 'bg-secondary/40 border-border text-muted-foreground hover:bg-secondary/80'
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
```

Find the exact anchor — the autoDeduct toggle button ends with:
```tsx
                    </div>
                  </button>
```
And then the consumable block closes with `</div>`. Add the unit selector block between the button and the closing div.

- [ ] **Step 5: TSC check**

Run: `cd bookit && npx tsc --noEmit 2>&1 | head -30`  
Expected: zero errors

---

## Task 6: ProductsPage.tsx — consumables tab

**Files:**
- Modify: `src/components/master/products/ProductsPage.tsx`

**What changes:**
1. Import `ConsumableCard`
2. Extend tab type to `'products' | 'orders' | 'consumables'`
3. Add TabBtn for consumables in sidebar
4. Add ConsumableCard list content for consumables tab

- [ ] **Step 1: Add ConsumableCard import**

After `import { OrderCard } from './OrderCard';` add:
```tsx
import { ConsumableCard } from './ConsumableCard';
```

Also add icon — after `import { Plus, Package, ShoppingBag } from 'lucide-react';`:
```tsx
import { Plus, Package, ShoppingBag, FlaskConical } from 'lucide-react';
```

- [ ] **Step 2: Extend tab type**

Old:
```tsx
  const tab = (searchParams.get('tab') as 'products' | 'orders') || 'products';
```
New:
```tsx
  const tab = (searchParams.get('tab') as 'products' | 'orders' | 'consumables') || 'products';
```

- [ ] **Step 3: Add consumables stats**

After:
```tsx
  const lowStock = products.filter(p => p.is_active && p.stock_qty <= 3).length;
```
Add:
```tsx
  const consumables = products.filter(p => p.product_type === 'consumable');
  const lowConsumables = consumables.filter(p => p.stock_qty <= (p.unit === 'pcs' ? 3 : 10)).length;
```

- [ ] **Step 4: Add consumables tab stats + TabBtn**

In the stats section (the `if tab === 'products'` block), add an else-if branch. Find:
```tsx
          ) : (
```
And add before the fallback `else` of the ternary. Since it's a ternary `tab === 'products' ? (...) : (...)`, change to:

Replace:
```tsx
          <div className="flex gap-2">
            {tab === 'products' ? (
              <>
                <StatChip label="Активних" value={activeCount} />
                <StatChip label="Всього" value={products.length} />
                {lowStock > 0 && <StatChip label="Мало на складі" value={lowStock} warn />}
              </>
            ) : (
              <>
                <StatChip label="Сьогодні" value={todayOrdersCount} />
                <StatChip label="Виручка (Shop)" value={`${Math.round(shopRevenue)} грн`} />
                <StatChip label="Всього" value={totalOrders} />
              </>
            )}
          </div>
```
With:
```tsx
          <div className="flex gap-2">
            {tab === 'products' ? (
              <>
                <StatChip label="Активних" value={activeCount} />
                <StatChip label="Всього" value={products.length} />
                {lowStock > 0 && <StatChip label="Мало на складі" value={lowStock} warn />}
              </>
            ) : tab === 'consumables' ? (
              <>
                <StatChip label="Матеріали" value={consumables.length} />
                {lowConsumables > 0 && <StatChip label="Мало" value={lowConsumables} warn />}
              </>
            ) : (
              <>
                <StatChip label="Сьогодні" value={todayOrdersCount} />
                <StatChip label="Виручка (Shop)" value={`${Math.round(shopRevenue)} грн`} />
                <StatChip label="Всього" value={totalOrders} />
              </>
            )}
          </div>
```

- [ ] **Step 5: Add TabBtn for consumables**

After:
```tsx
            <TabBtn active={tab === 'orders'} onClick={() => setParam('tab', 'orders')}>
              <ShoppingBag size={14} />
              Замовлення
              {newOrders > 0 && (
                <span className="ml-1 size-4 rounded-full bg-warning text-white text-[9px] font-bold flex items-center justify-center">
                  {newOrders > 9 ? '9+' : newOrders}
                </span>
              )}
            </TabBtn>
```
Add:
```tsx
            <TabBtn active={tab === 'consumables'} onClick={() => setParam('tab', 'consumables')}>
              <FlaskConical size={14} /> Розхідники
            </TabBtn>
```

- [ ] **Step 6: Add consumables content in right panel**

The right panel has `{tab === 'products' ? (...) : (...)}`. Find the AnimatePresence block and add the third branch. The pattern:

After the existing `{tab === 'products' && (...)}` and `{tab === 'orders' && (...)}` blocks (or wherever the AnimatePresence content is), add:

```tsx
              {tab === 'consumables' && (
                <motion.div
                  key="consumables"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ type: 'spring' as const, duration: 0.3, bounce: 0 }}
                  className="flex flex-col gap-3"
                >
                  {consumables.length === 0 ? (
                    <div className="bento-card p-8 text-center text-muted-foreground/60 text-sm">
                      Додайте перший розхідник — оберіть &quot;Розхідник&quot; при створенні товару
                    </div>
                  ) : (
                    consumables.map(p => (
                      <ConsumableCard
                        key={p.id}
                        product={p}
                        onEdit={openEdit}
                        onRestock={openRestock}
                      />
                    ))
                  )}
                </motion.div>
              )}
```

**Note:** The exact insertion point depends on the AnimatePresence structure. Look for `{tab === 'orders' && (` and add the consumables block after the closing `)}`.

- [ ] **Step 7: TSC check**

Run: `cd bookit && npx tsc --noEmit 2>&1 | head -30`  
Expected: zero errors

---

## Task 7: ServiceEditor.tsx — linked consumables section

**Files:**
- Modify: `src/components/master/services/ServiceEditor.tsx`

**What changes:**  
Add a read-only section at the bottom of the form (edit mode only) showing which consumables are linked to this service. Uses a direct Supabase query — no new hook needed.

- [ ] **Step 1: Add imports**

After `import { useState, useEffect } from 'react';` change to:
```tsx
import { useState, useEffect, useCallback } from 'react';
```

After `import { useMasterContext } from '@/lib/supabase/context';` add:
```tsx
import { createClient } from '@/lib/supabase/client';
import { FlaskConical } from 'lucide-react';
```

- [ ] **Step 2: Add linked consumables state + fetch inside component**

After `const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);` add:
```tsx
  const [linkedConsumables, setLinkedConsumables] = useState<
    { product_id: string; name: string; unit: 'pcs' | 'ml' | 'g'; quantity: number }[]
  >([]);

  const UNIT_LABEL: Record<'pcs' | 'ml' | 'g', string> = { pcs: 'шт', ml: 'мл', g: 'г' };

  const fetchLinkedConsumables = useCallback(async () => {
    if (!id) return;
    const supabase = createClient();
    const { data } = await supabase
      .from('product_service_links')
      .select('quantity, products!inner(id, name, unit, product_type)')
      .eq('service_id', id)
      .eq('products.product_type', 'consumable');
    if (data) {
      setLinkedConsumables(data.map((row: { quantity: number; products: { id: string; name: string; unit: 'pcs' | 'ml' | 'g' } }) => ({
        product_id: row.products.id,
        name: row.products.name,
        unit: row.products.unit,
        quantity: Number(row.quantity),
      })));
    }
  }, [id]);

  useEffect(() => {
    fetchLinkedConsumables();
  }, [fetchLinkedConsumables]);
```

- [ ] **Step 3: Add UI block before the delete confirm section**

Find the delete confirm section (or `{showDeleteConfirm && (` block). Add before it:

```tsx
      {/* Linked consumables — read-only */}
      {id && linkedConsumables.length > 0 && (
        <div className="widget-card p-5 flex flex-col gap-4 border border-border rounded-[24px] bg-card">
          <div className="flex items-center gap-2">
            <FlaskConical size={16} className="text-muted-foreground" />
            <p className="text-sm font-semibold text-foreground">Розхідники послуги</p>
          </div>
          <p className="text-xs text-muted-foreground/60 -mt-2">
            Списуються зі складу при завершенні запису
          </p>
          <div className="flex flex-col gap-2">
            {linkedConsumables.map(c => (
              <div key={c.product_id} className="flex items-center justify-between gap-3 p-3 rounded-xl bg-secondary/30 border border-border/40">
                <p className="text-sm font-medium text-foreground truncate">{c.name}</p>
                <span className="text-xs font-bold text-muted-foreground shrink-0">
                  {c.quantity} {UNIT_LABEL[c.unit]}
                </span>
              </div>
            ))}
          </div>
          <p className="text-[10px] text-muted-foreground/50">
            Редагувати прив&apos;язку можна через сторінку товару в Магазині
          </p>
        </div>
      )}
```

- [ ] **Step 4: TSC check**

Run: `cd bookit && npx tsc --noEmit 2>&1 | head -30`  
Expected: zero errors

---

## Task 8: ExpensesTab.tsx (CREATE)

**Files:**
- Create: `src/components/master/revenue/ExpensesTab.tsx`

**Interfaces:**
- Consumes: `useExpenses(masterId, month?)` → `{ expenses, isLoading, createExpense, updateExpense, deleteExpense, isCreating, isDeleting }`
- Consumes: `ExpenseCategory` from `@/types/database`
- Props: `{ isPro: boolean }`

- [ ] **Step 1: Create ExpensesTab.tsx**

```tsx
'use client';

// humanized
import { useState } from 'react';
import { Drawer } from 'vaul';
import { Plus, ReceiptText, Trash2, Pencil, TrendingUp } from 'lucide-react';
import { useMasterContext } from '@/lib/supabase/context';
import { useExpenses } from '@/lib/supabase/hooks/useExpenses';
import { formatPrice } from '@/lib/utils/currency';
import type { ExpenseCategory, MasterExpense } from '@/types/database';

const CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  rent: 'Оренда',
  tools: 'Інструменти',
  advertising: 'Реклама',
  other: 'Інше',
};

const CATEGORIES: ExpenseCategory[] = ['rent', 'tools', 'advertising', 'other'];

interface ExpensesTabProps {
  isPro: boolean;
}

interface ExpenseForm {
  category: ExpenseCategory;
  name: string;
  amountStr: string;
  expense_date: string;
  note: string;
}

function emptyForm(): ExpenseForm {
  return {
    category: 'other',
    name: '',
    amountStr: '',
    expense_date: new Date().toISOString().split('T')[0],
    note: '',
  };
}

export function ExpensesTab({ isPro }: ExpensesTabProps) {
  const { masterProfile } = useMasterContext();
  const masterId = masterProfile?.id ?? '';
  const { expenses, isLoading, createExpense, updateExpense, deleteExpense, isCreating } = useExpenses(masterId);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ExpenseForm>(emptyForm());

  if (!isPro) {
    return (
      <div className="p-6 rounded-2xl bg-secondary/20 border border-border/5 text-center flex flex-col items-center justify-center min-h-[300px]">
        <TrendingUp className="size-12 text-primary mb-4" />
        <h3 className="text-lg font-semibold text-foreground mb-2">Облік витрат доступний в Pro</h3>
        <p className="text-sm text-muted-foreground/60 max-w-sm">
          Підключіть тариф Pro, щоб вести облік оренди, інструментів та реклами.
        </p>
      </div>
    );
  }

  const totalExpenses = expenses.reduce((s, e) => s + e.amount_kopecks, 0);

  function openCreate() {
    setEditingId(null);
    setForm(emptyForm());
    setDrawerOpen(true);
  }

  function openEdit(expense: MasterExpense) {
    setEditingId(expense.id);
    setForm({
      category: expense.category,
      name: expense.name,
      amountStr: String(expense.amount_kopecks / 100),
      expense_date: expense.expense_date,
      note: expense.note ?? '',
    });
    setDrawerOpen(true);
  }

  async function handleSave() {
    const amount = parseFloat(form.amountStr);
    if (!form.name.trim() || isNaN(amount) || amount <= 0) return;
    const payload = {
      category: form.category,
      name: form.name.trim(),
      amount_kopecks: Math.round(amount * 100),
      expense_date: form.expense_date,
      note: form.note.trim() || null,
    };
    if (editingId) {
      await updateExpense({ id: editingId, ...payload });
    } else {
      await createExpense(payload);
    }
    setDrawerOpen(false);
  }

  return (
    <>
      <div className="bento-card p-5 flex flex-col gap-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-foreground uppercase tracking-wider">Операційні витрати</h2>
            <p className="text-xs text-muted-foreground/60 mt-0.5">
              Оренда, інструменти, реклама
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-[10px] text-muted-foreground/60 uppercase tracking-wider">Всього</p>
              <p className="text-lg font-bold text-destructive">-{formatPrice(Math.round(totalExpenses / 100))}</p>
            </div>
            <button
              type="button"
              aria-label="Додати витрату"
              onClick={openCreate}
              className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center hover:bg-primary/20 transition-colors active:scale-95"
            >
              <Plus size={18} />
            </button>
          </div>
        </div>

        {/* List */}
        {isLoading ? (
          <div className="flex flex-col gap-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-14 bg-secondary/30 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : expenses.length === 0 ? (
          <div className="py-10 text-center">
            <ReceiptText className="size-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground/60">Витрат ще немає</p>
            <p className="text-xs text-muted-foreground/40 mt-1">Додайте оренду, інструменти або рекламу</p>
          </div>
        ) : (
          <div className="flex flex-col divide-y divide-border/10">
            {expenses.map(expense => (
              <div key={expense.id} className="flex items-center gap-3 py-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">{expense.name}</p>
                  <p className="text-[10px] text-muted-foreground/60 mt-0.5">
                    {CATEGORY_LABELS[expense.category]} · {expense.expense_date}
                  </p>
                </div>
                <p className="text-sm font-bold text-destructive shrink-0">
                  -{formatPrice(Math.round(expense.amount_kopecks / 100))}
                </p>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    aria-label="Редагувати витрату"
                    onClick={() => openEdit(expense)}
                    className="size-8 rounded-lg bg-secondary/60 text-muted-foreground flex items-center justify-center hover:bg-secondary/80 transition-colors active:scale-95"
                  >
                    <Pencil size={13} />
                  </button>
                  <button
                    type="button"
                    aria-label="Видалити витрату"
                    onClick={() => deleteExpense(expense.id)}
                    className="size-8 rounded-lg bg-destructive/10 text-destructive flex items-center justify-center hover:bg-destructive/20 transition-colors active:scale-95"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add/Edit Drawer */}
      <Drawer.Root open={drawerOpen} onOpenChange={v => !v && setDrawerOpen(false)} shouldScaleBackground>
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40" />
          <Drawer.Content className="fixed bottom-0 left-0 right-0 z-50 bg-surface rounded-t-[28px] shadow-2xl max-h-[90vh] flex flex-col">
            <div className="mx-auto mt-3 mb-2 w-12 h-1.5 rounded-full bg-border/60 shrink-0" />
            <div className="px-5 overflow-y-auto pb-safe">
              <Drawer.Title className="text-base font-bold text-foreground mt-1 mb-4">
                {editingId ? 'Редагувати витрату' : 'Нова витрата'}
              </Drawer.Title>

              <div className="flex flex-col gap-4 mb-5">
                {/* Category */}
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 mb-2 block">Категорія</label>
                  <div className="grid grid-cols-2 gap-2">
                    {CATEGORIES.map(cat => (
                      <button
                        key={cat}
                        type="button"
                        aria-pressed={form.category === cat}
                        onClick={() => setForm(f => ({ ...f, category: cat }))}
                        className={`py-2.5 rounded-xl border text-xs font-semibold transition-all active:scale-[0.95] cursor-pointer ${
                          form.category === cat
                            ? 'bg-primary text-primary-foreground border-transparent'
                            : 'bg-secondary/40 border-border text-muted-foreground hover:bg-secondary/80'
                        }`}
                      >
                        {CATEGORY_LABELS[cat]}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Name */}
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 mb-2 block">Назва</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="Наприклад: Оренда за червень"
                    aria-label="Назва витрати"
                    className="w-full px-4 py-3 rounded-xl border border-border bg-background text-sm font-medium outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
                  />
                </div>

                {/* Amount + Date */}
                <div className="flex gap-3">
                  <div className="flex-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 mb-2 block">Сума (₴)</label>
                    <input
                      type="number"
                      min={0}
                      step={0.01}
                      value={form.amountStr}
                      onChange={e => setForm(f => ({ ...f, amountStr: e.target.value }))}
                      placeholder="0"
                      aria-label="Сума витрати в гривнях"
                      className="w-full px-4 py-3 rounded-xl border border-border bg-background text-sm font-bold outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 mb-2 block">Дата</label>
                    <input
                      type="date"
                      value={form.expense_date}
                      onChange={e => setForm(f => ({ ...f, expense_date: e.target.value }))}
                      aria-label="Дата витрати"
                      className="w-full px-4 py-3 rounded-xl border border-border bg-background text-sm font-medium outline-none focus:border-primary"
                    />
                  </div>
                </div>

                {/* Note */}
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 mb-2 block">Примітка (необов&apos;язково)</label>
                  <input
                    type="text"
                    value={form.note}
                    onChange={e => setForm(f => ({ ...f, note: e.target.value }))}
                    placeholder="Будь-яка деталь..."
                    aria-label="Примітка до витрати"
                    className="w-full px-4 py-3 rounded-xl border border-border bg-background text-sm font-medium outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div className="flex gap-3 pb-6">
                <button
                  type="button"
                  onClick={() => setDrawerOpen(false)}
                  className="flex-1 h-12 rounded-xl border border-border text-sm font-semibold text-muted-foreground hover:bg-secondary/60 transition-colors active:scale-[0.97]"
                >
                  Скасувати
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={isCreating}
                  className="flex-1 h-12 rounded-xl bg-accent text-accent-foreground text-sm font-semibold hover:bg-accent/90 transition-colors active:scale-[0.97] disabled:opacity-50"
                >
                  {editingId ? 'Зберегти' : 'Додати'}
                </button>
              </div>
            </div>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>
    </>
  );
}
```

- [ ] **Step 2: TSC check**

Run: `cd bookit && npx tsc --noEmit 2>&1 | head -30`  
Expected: zero errors

---

## Task 9: RevenueHubClient.tsx — add "Фінанси" tab

**Files:**
- Modify: `src/components/master/revenue/RevenueHubClient.tsx`

- [ ] **Step 1: Add ReceiptText to lucide imports**

Old:
```tsx
import { Wallet, Zap, BadgePercent } from 'lucide-react';
```
New:
```tsx
import { Wallet, Zap, BadgePercent, ReceiptText } from 'lucide-react';
```

- [ ] **Step 2: Add dynamic import for ExpensesTab**

After `const DynamicPricingPage = dynamic(...)` add:
```tsx
const ExpensesTab = dynamic(() => import('./ExpensesTab').then(m => ({ default: m.ExpensesTab })), {
  loading: () => <div className="p-8 text-center text-muted-foreground/60 animate-pulse">Завантажуємо...</div>,
  ssr: false,
});
```

- [ ] **Step 3: Add 'expenses' to tabs array**

Old:
```tsx
  const tabs = [
    { id: 'flash_deals', label: 'Флеш-акції', icon: Zap },
    { id: 'dynamic_pricing', label: 'Смарт-ціни', icon: BadgePercent },
  ];
```
New:
```tsx
  const tabs = [
    { id: 'flash_deals', label: 'Флеш-акції', icon: Zap },
    { id: 'dynamic_pricing', label: 'Смарт-ціни', icon: BadgePercent },
    { id: 'expenses', label: 'Фінанси', icon: ReceiptText },
  ];
```

- [ ] **Step 4: Add expenses tab content**

After the `{activeTab === 'dynamic_pricing' && (...)}` block add:
```tsx
              {activeTab === 'expenses' && (
                <motion.div
                  key="expenses"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ type: 'spring' as const, duration: 0.3, bounce: 0 }}
                >
                  <Suspense fallback={
                    <div className="flex flex-col gap-4 p-4 animate-pulse">
                      <div className="h-20 bg-secondary/40 border border-border rounded-[28px]" />
                      <div className="h-40 bg-secondary/40 border border-border rounded-[28px]" />
                    </div>
                  }>
                    <ExpensesTab isPro={pricingData.isPro} />
                  </Suspense>
                </motion.div>
              )}
```

- [ ] **Step 5: TSC check**

Run: `cd bookit && npx tsc --noEmit 2>&1 | head -30`  
Expected: zero errors

---

## Task 10: WaterfallChart.tsx — 6th bar "Операційні витрати"

**Files:**
- Modify: `src/components/master/analytics/charts/WaterfallChart.tsx`

- [ ] **Step 1: Add operationalExpenses to interface + destructuring**

Old:
```tsx
interface WaterfallChartProps {
  servicesRevenue: number; // копійки
  productsRevenue: number; // копійки
  materialsCost: number;   // копійки
  discountAmount: number;  // копійки
  netProfit: number;       // копійки
}

export function WaterfallChart({
  servicesRevenue,
  productsRevenue,
  materialsCost,
  discountAmount,
  netProfit,
}: WaterfallChartProps) {
```
New:
```tsx
interface WaterfallChartProps {
  servicesRevenue: number;      // копійки
  productsRevenue: number;      // копійки
  materialsCost: number;        // копійки
  discountAmount: number;       // копійки
  operationalExpenses: number;  // копійки
  netProfit: number;            // копійки
}

export function WaterfallChart({
  servicesRevenue,
  productsRevenue,
  materialsCost,
  discountAmount,
  operationalExpenses,
  netProfit,
}: WaterfallChartProps) {
```

- [ ] **Step 2: Add opex conversion + step**

After `const disc = Math.round(discountAmount / 100);` add:
```tsx
  const opex = Math.round(operationalExpenses / 100);
```

In the `steps` array, add a new item between disc and netProfit:

Old:
```tsx
  const steps = [
    { label: 'Загальний вал', value: totalGross, type: 'lead', color: 'var(--success)' },
    { label: 'No-Show втрати', value: -noShowLoss, type: 'decrease', color: 'var(--error)' },
    { label: 'Собівартість', value: -mat, type: 'decrease', color: '#D4935A' },
    { label: 'Знижки / акції', value: -disc, type: 'decrease', color: '#E0B4B2' },
    { label: 'Чистий прибуток', value: Math.round(netProfit / 100), type: 'total', color: 'var(--accent)' },
  ];
```
New:
```tsx
  const steps = [
    { label: 'Загальний вал', value: totalGross, type: 'lead', color: 'var(--success)' },
    { label: 'No-Show втрати', value: -noShowLoss, type: 'decrease', color: 'var(--error)' },
    { label: 'Собівартість', value: -mat, type: 'decrease', color: '#D4935A' },
    { label: 'Знижки / акції', value: -disc, type: 'decrease', color: '#E0B4B2' },
    { label: 'Операційні витрати', value: -opex, type: 'decrease', color: '#A78BFA' },
    { label: 'Чистий прибуток', value: Math.round(netProfit / 100), type: 'total', color: 'var(--accent)' },
  ];
```

- [ ] **Step 3: TSC check**

Run: `cd bookit && npx tsc --noEmit 2>&1 | head -20`  
Expected: zero errors

---

## Task 11: FinancesTab.tsx — 5th KPI + pass operationalExpenses

**Files:**
- Modify: `src/components/master/analytics/sections/tabs/FinancesTab.tsx`

- [ ] **Step 1: Change KPI grid to 5-column desktop**

Old:
```tsx
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
```
New:
```tsx
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
```

- [ ] **Step 2: Add 5th KPI card after "Чистий прибуток"**

After the "Чистий прибуток" bento-card, add:
```tsx
          <div className="bento-card p-4 flex flex-col justify-between">
            <p className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-wider">Операційні витрати</p>
            <p className="text-lg font-bold text-destructive mt-2">-{formatPrice(Math.round(displayFin.operational_expenses_total / 100))}</p>
          </div>
```

- [ ] **Step 3: Pass operationalExpenses to WaterfallChart**

Old:
```tsx
            <WaterfallChart
              servicesRevenue={displayFin.services_revenue}
              productsRevenue={displayFin.products_revenue}
              materialsCost={displayFin.materials_cost}
              discountAmount={displayFin.discount_amount}
              netProfit={displayFin.net_profit}
            />
```
New:
```tsx
            <WaterfallChart
              servicesRevenue={displayFin.services_revenue}
              productsRevenue={displayFin.products_revenue}
              materialsCost={displayFin.materials_cost}
              discountAmount={displayFin.discount_amount}
              operationalExpenses={displayFin.operational_expenses_total}
              netProfit={displayFin.net_profit}
            />
```

- [ ] **Step 4: TSC check**

Run: `cd bookit && npx tsc --noEmit 2>&1 | head -20`  
Expected: zero errors

---

## Task 12: BookingDetailsModal.tsx — consumables section

**Files:**
- Modify: `src/components/master/bookings/BookingDetailsModal.tsx`

**Injection point:** Before `{/* Notes */}` section (line ~585)

- [ ] **Step 1: Add import after existing imports**

After the last import line, add:
```tsx
import { useConsumablesForBooking } from '@/lib/supabase/hooks/useConsumablesForBooking';
```

Also add `FlaskConical` to lucide imports (find the existing lucide import block and add `FlaskConical`).

- [ ] **Step 2: Add hook inside component (after displayBooking is defined)**

After `const canAct = displayBooking && ['pending', 'confirmed'].includes(displayBooking.status);` add:
```tsx
  const { data: bookingConsumables = [] } = useConsumablesForBooking(
    displayBooking?.status === 'confirmed' ? (bookingId ?? null) : null
  );
  const UNIT_LABEL_MODAL: Record<'pcs' | 'ml' | 'g', string> = { pcs: 'шт', ml: 'мл', g: 'г' };
```

- [ ] **Step 3: Inject consumables block before Notes section**

Find the unique anchor:
```tsx
          {/* Notes */}
          <div className="flex flex-col gap-3">
```

Add before it:
```tsx
          {/* Consumables */}
          {bookingConsumables.length > 0 && (
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <FlaskConical size={14} className="text-muted-foreground/60" />
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground/60">Матеріали сеансу</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {bookingConsumables.map(c => (
                  <div key={c.product_id} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-secondary/40 border border-border/40">
                    <span className="text-xs font-medium text-foreground">{c.name}</span>
                    <span className="text-[10px] text-muted-foreground/60">{c.total_qty} {UNIT_LABEL_MODAL[c.unit]}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

```

- [ ] **Step 4: TSC check**

Run: `cd bookit && npx tsc --noEmit 2>&1 | head -30`  
Expected: zero errors

---

## Task 13: Final build verification

- [ ] **Step 1: Full TSC**

Run: `cd bookit && npx tsc --noEmit`  
Expected: 0 errors

- [ ] **Step 2: Full build**

Run: `cd bookit && npm run build`  
Expected: exit code 0, no TypeScript errors in build output

- [ ] **Step 3: Manual smoke test checklist**
  - [ ] ProductsPage: 3 tabs visible (Товари / Замовлення / Розхідники)
  - [ ] ProductEditor with type=consumable: unit selector (шт / мл / г) appears, saves correctly
  - [ ] BookingCard "Завершити": if booking has consumable services → MaterialsReviewSheet opens; if not → completes directly
  - [ ] BookingActionsDropdown "Завершити": same intercept
  - [ ] BookingDetailsModal: consumables chips shown for confirmed bookings with linked consumables
  - [ ] ServiceEditor (edit mode): linked consumables section at bottom (only if links exist)
  - [ ] Revenue Hub: 3 tabs (Флеш-акції / Смарт-ціни / Фінанси); Фінанси shows ExpensesTab
  - [ ] ExpensesTab: add expense → appears in list; edit → form pre-filled; delete → removed
  - [ ] WaterfallChart: 6 bars visible including "Операційні витрати" (purple)
  - [ ] FinancesTab: 5 KPI cards including operational_expenses_total

---

## Execution Notes

- **Edit vs Write:** ProductEditor.tsx, ServiceEditor.tsx, and BookingDetailsModal.tsx are large files — use Edit with exact old_string anchors. If ≥ 5 changes in one file, Write the full file instead.
- **Humanizer guard:** Any .ts/.tsx file with Ukrainian UI strings needs `// humanized` as first line (already included in all new files above).
- **TSC runs:** Run after every 2-3 edits — edit_guard_hook.py blocks after 8 edits without TSC.
- **vaul version:** The project uses `vaul` — import `Drawer` from `'vaul'`, use `Drawer.Root`, `Drawer.Portal`, `Drawer.Overlay`, `Drawer.Content`, `Drawer.Title`.
- **useExpenses hook:** Located at `src/lib/supabase/hooks/useExpenses.ts` — call as `useExpenses(masterId)` (no month param for all-time in this UI).

---

*Plan: T30 — Розхідники UX/UI · Created: 2026-06-20 · Sprint-04 · 12 files · 13 tasks*
