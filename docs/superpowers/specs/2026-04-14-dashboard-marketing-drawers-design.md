# Dashboard Marketing Drawers — Design Spec
**Date:** 2026-04-14  
**Status:** Approved

## Overview

Додати на дашборд швидкий доступ до двох маркетингових інструментів — флеш-акцій та динамічного ціноутворення — через Drawer/Sheet прямо з QuickActions картки, без переходу на окремі сторінки.

---

## QuickActions Layout Change

`src/components/master/dashboard/QuickActions.tsx` розширюється:

```
┌─────────────────────────────┐
│ Швидкі дії                  │
│                             │
│  [Маркетинг]                │  ← новий підрозділ зверху
│  [⚡ Флеш-акція] [📈 Ціни]  │  ← 2 кнопки в ряд
│  ─────────────────────────  │  ← дільник
│  [+] [📊] [⚙️]              │  ← існуючі 6 кнопок
│  [✂] [👥] [📅]              │
└─────────────────────────────┘
```

- Підзаголовок "Маркетинг" — `text-[10px] font-semibold uppercase tracking-widest text-[#A8928D]`
- Флеш-акція: іконка `Zap`, колір фону `#D4935A` (warning)
- Ціноутворення: іконка `TrendingUp`, колір фону `#789A99` (sage/accent)
- Дільник: `border-t border-white/40 my-3`

---

## New Components

### 1. `DashboardDrawer` — `src/components/ui/DashboardDrawer.tsx`

Shared reusable Sheet wrapper:
- `AnimatePresence` + `motion.div` slide-in з правого боку
- `w-full md:max-w-[560px]`, повна висота (`h-full`), `overflow-y-auto`
- Fixed overlay backdrop (`bg-black/40 backdrop-blur-sm`)
- Кнопка X (top-right) + клік по оверлею → `onClose`
- Props: `isOpen`, `onClose`, `title`, `children`

### 2. `FlashDealDrawer` — `src/components/master/dashboard/FlashDealDrawer.tsx`

Wrapper навколо існуючого `FlashDealPage`:
- `useFlashDeals()` — активні акції (без initialData, client-side fetch)
- `useFlashDealsCount()` — нова функція в `useFlashDeals.ts`, count за поточний місяць
- `tier` → `useMasterContext().masterProfile?.subscription_tier ?? 'starter'`
- Скелетон поки `isLoading`

### 3. `PricingDrawer` — `src/components/master/dashboard/PricingDrawer.tsx`

Wrapper навколо існуючого `DynamicPricingPage`:
- `pricing_rules` + `subscription_tier` + `dynamic_pricing_extra_earned` → з `useMasterContext().masterProfile`
- Client-side tier routing (дзеркалить логіку `PricingPage`):
  - Starter + exhausted → `PricingUpgradeGate` (exhausted)
  - Starter → `PricingUpgradeGate` (trial) + `DynamicPricingPage`
  - Pro/Studio → `DynamicPricingPage`

---

## Data Flow

```
QuickActions
  ├── flashOpen state → FlashDealDrawer (in DashboardDrawer)
  │     ├── useFlashDeals() → activeDeals
  │     ├── useFlashDealsCount() → usedThisMonth  [NEW]
  │     ├── useMasterContext() → tier
  │     └── <FlashDealPage> (reused as-is)
  │
  └── pricingOpen state → PricingDrawer (in DashboardDrawer)
        ├── useMasterContext() → pricing_rules, tier, extra_earned
        ├── tier check (client-side)
        └── <DynamicPricingPage> or <PricingUpgradeGate> (reused as-is)
```

---

## `useFlashDeals.ts` — Зміна

Додати `useFlashDealsCount()`:
```ts
export function useFlashDealsCount() {
  const { masterProfile } = useMasterContext();
  const masterId = masterProfile?.id;
  return useQuery<number>({
    queryKey: ['flash-deals-count', masterId],
    queryFn: async () => {
      const supabase = createClient();
      const monthStart = new Date();
      monthStart.setDate(1); monthStart.setHours(0,0,0,0);
      const { count } = await supabase
        .from('flash_deals')
        .select('id', { count: 'exact', head: true })
        .eq('master_id', masterId!)
        .gte('created_at', monthStart.toISOString());
      return count ?? 0;
    },
    enabled: !!masterId,
    staleTime: 60_000,
  });
}
```

---

## Files Changed

| Файл | Дія |
|------|-----|
| `src/components/master/dashboard/QuickActions.tsx` | Додати секцію Маркетинг зверху + стан для drawer |
| `src/components/ui/DashboardDrawer.tsx` | Новий компонент |
| `src/components/master/dashboard/FlashDealDrawer.tsx` | Новий компонент |
| `src/components/master/dashboard/PricingDrawer.tsx` | Новий компонент |
| `src/lib/supabase/hooks/useFlashDeals.ts` | Додати `useFlashDealsCount()` |

`dashboard/page.tsx` — не змінюється.

---

## Out of Scope

- Нові DB міграції — не потрібні
- Зміни в існуючих `FlashDealPage` / `DynamicPricingPage` — не потрібні
- Tour/onboarding для нових кнопок — окрема задача
