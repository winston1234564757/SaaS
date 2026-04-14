# Dashboard Marketing Drawers — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Додати у QuickActions секцію "Маркетинг" з двома кнопками (Флеш-акція + Ціноутворення), кожна з яких відкриває правобічний Drawer з повним існуючим компонентом.

**Architecture:** Shared `DashboardDrawer` wrapper (Framer Motion slide-in) + два спеціалізованих drawer-компоненти, які client-side завантажують дані через існуючі hooks. QuickActions отримує нову "Маркетинг" секцію зверху. Жодних змін у FlashDealPage та DynamicPricingPage — reuse as-is.

**Tech Stack:** React, Framer Motion, TanStack Query v5, useMasterContext, Tailwind CSS v4

---

## File Map

| Файл | Дія |
|------|-----|
| `src/lib/supabase/hooks/useFlashDeals.ts` | Додати `useFlashDealsCount()` |
| `src/components/ui/DashboardDrawer.tsx` | Створити (shared drawer wrapper) |
| `src/components/master/dashboard/FlashDealDrawer.tsx` | Створити |
| `src/components/master/dashboard/PricingDrawer.tsx` | Створити |
| `src/components/master/dashboard/QuickActions.tsx` | Розширити: секція Маркетинг зверху |

---

### Task 1: Додати `useFlashDealsCount` в `useFlashDeals.ts`

**Files:**
- Modify: `src/lib/supabase/hooks/useFlashDeals.ts`

- [ ] **Крок 1: Додати `useFlashDealsCount` в кінець файлу**

Відкрити `src/lib/supabase/hooks/useFlashDeals.ts` і додати після `useFlashDealsInvalidate`:

```ts
export function useFlashDealsCount() {
  const { masterProfile } = useMasterContext();
  const masterId = masterProfile?.id;

  return useQuery<number>({
    queryKey: ['flash-deals-count', masterId],
    queryFn: async () => {
      const supabase = createClient();
      const monthStart = new Date();
      monthStart.setDate(1);
      monthStart.setHours(0, 0, 0, 0);
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

- [ ] **Крок 2: Перевірити TypeScript**

```bash
cd bookit && npx tsc --noEmit 2>&1 | head -20
```
Очікувано: без помилок.

- [ ] **Крок 3: Commit**

```bash
git add bookit/src/lib/supabase/hooks/useFlashDeals.ts
git commit -m "feat: add useFlashDealsCount hook for monthly flash deal usage"
```

---

### Task 2: Створити `DashboardDrawer` — shared wrapper

**Files:**
- Create: `src/components/ui/DashboardDrawer.tsx`

- [ ] **Крок 1: Створити файл**

```tsx
'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export function DashboardDrawer({ isOpen, onClose, title, children }: Props) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            key="drawer"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed inset-y-0 right-0 z-50 w-full md:max-w-[560px] bg-[#FFE8DC] shadow-2xl overflow-y-auto"
          >
            <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-4 bg-[#FFE8DC]/90 backdrop-blur-md border-b border-white/40">
              <h2 className="heading-serif text-lg text-[#2C1A14]">{title}</h2>
              <button
                onClick={onClose}
                className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-white/50 transition-colors"
              >
                <X size={18} className="text-[#6B5750]" />
              </button>
            </div>
            {children}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
```

- [ ] **Крок 2: Перевірити TypeScript**

```bash
cd bookit && npx tsc --noEmit 2>&1 | head -20
```
Очікувано: без помилок.

- [ ] **Крок 3: Commit**

```bash
git add bookit/src/components/ui/DashboardDrawer.tsx
git commit -m "feat: add DashboardDrawer shared slide-in wrapper"
```

---

### Task 3: Створити `FlashDealDrawer`

**Files:**
- Create: `src/components/master/dashboard/FlashDealDrawer.tsx`

- [ ] **Крок 1: Створити файл**

```tsx
'use client';

import { DashboardDrawer } from '@/components/ui/DashboardDrawer';
import { FlashDealPage } from '@/components/master/flash/FlashDealPage';
import { useFlashDeals, useFlashDealsCount } from '@/lib/supabase/hooks/useFlashDeals';
import { useMasterContext } from '@/lib/supabase/context';
import { Loader2 } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export function FlashDealDrawer({ isOpen, onClose }: Props) {
  const { masterProfile } = useMasterContext();
  const tier = masterProfile?.subscription_tier ?? 'starter';

  const { data: activeDeals = [], isLoading: dealsLoading } = useFlashDeals();
  const { data: usedThisMonth = 0, isLoading: countLoading } = useFlashDealsCount();
  const isLoading = dealsLoading || countLoading;

  return (
    <DashboardDrawer isOpen={isOpen} onClose={onClose} title="Флеш-акції">
      {isLoading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 size={28} className="animate-spin text-[#789A99]" />
        </div>
      ) : (
        <FlashDealPage
          activeDeals={activeDeals}
          tier={tier}
          usedThisMonth={usedThisMonth}
        />
      )}
    </DashboardDrawer>
  );
}
```

- [ ] **Крок 2: Перевірити TypeScript**

```bash
cd bookit && npx tsc --noEmit 2>&1 | head -20
```
Очікувано: без помилок.

- [ ] **Крок 3: Commit**

```bash
git add bookit/src/components/master/dashboard/FlashDealDrawer.tsx
git commit -m "feat: add FlashDealDrawer — wraps FlashDealPage in dashboard drawer"
```

---

### Task 4: Створити `PricingDrawer`

**Files:**
- Create: `src/components/master/dashboard/PricingDrawer.tsx`

- [ ] **Крок 1: Створити файл**

```tsx
'use client';

import { DashboardDrawer } from '@/components/ui/DashboardDrawer';
import { DynamicPricingPage } from '@/components/master/pricing/DynamicPricingPage';
import { PricingUpgradeGate } from '@/components/master/pricing/PricingUpgradeGate';
import { useMasterContext } from '@/lib/supabase/context';
import type { PricingRules } from '@/lib/utils/dynamicPricing';

const TRIAL_LIMIT_KOP = 100_000;

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export function PricingDrawer({ isOpen, onClose }: Props) {
  const { masterProfile } = useMasterContext();
  const tier = masterProfile?.subscription_tier ?? 'starter';
  const extraEarned = (masterProfile?.dynamic_pricing_extra_earned as number | null) ?? 0;
  const pricingRules = (masterProfile?.pricing_rules ?? {}) as PricingRules;

  const isPro = tier === 'pro' || tier === 'studio';
  const isStarter = tier === 'starter';
  const trialExhausted = isStarter && extraEarned >= TRIAL_LIMIT_KOP;

  function renderContent() {
    if (isStarter && trialExhausted) {
      return (
        <PricingUpgradeGate
          trial={{ earned: extraEarned, limit: TRIAL_LIMIT_KOP, exhausted: true }}
          quietHoursInsight={null}
        />
      );
    }
    if (isStarter) {
      return (
        <div className="flex flex-col gap-4">
          <PricingUpgradeGate
            trial={{ earned: extraEarned, limit: TRIAL_LIMIT_KOP, exhausted: false }}
            quietHoursInsight={null}
          />
          <DynamicPricingPage initial={pricingRules} />
        </div>
      );
    }
    if (!isPro) {
      return <PricingUpgradeGate />;
    }
    return <DynamicPricingPage initial={pricingRules} />;
  }

  return (
    <DashboardDrawer isOpen={isOpen} onClose={onClose} title="Ціноутворення">
      <div className="p-6">
        {renderContent()}
      </div>
    </DashboardDrawer>
  );
}
```

- [ ] **Крок 2: Перевірити TypeScript**

```bash
cd bookit && npx tsc --noEmit 2>&1 | head -20
```
Очікувано: без помилок.

- [ ] **Крок 3: Commit**

```bash
git add bookit/src/components/master/dashboard/PricingDrawer.tsx
git commit -m "feat: add PricingDrawer — wraps DynamicPricingPage with client-side tier routing"
```

---

### Task 5: Розширити `QuickActions.tsx` — секція "Маркетинг" зверху

**Files:**
- Modify: `src/components/master/dashboard/QuickActions.tsx`

- [ ] **Крок 1: Додати імпорти**

На початку файлу, в існуючий рядок імпортів іконок додати `Zap` і `TrendingUp`:

```ts
import { Plus, BarChart2, Settings, Scissors, Users, CalendarDays, Zap, TrendingUp } from 'lucide-react';
```

Додати імпорти нових drawer-компонентів після існуючих:

```ts
import { FlashDealDrawer } from '@/components/master/dashboard/FlashDealDrawer';
import { PricingDrawer } from '@/components/master/dashboard/PricingDrawer';
```

- [ ] **Крок 2: Додати state для drawer-ів**

В тілі компонента `QuickActions`, поряд з існуючим `useState(false)` для `bookingOpen`:

```ts
const [flashOpen, setFlashOpen] = useState(false);
const [pricingOpen, setPricingOpen] = useState(false);
```

- [ ] **Крок 3: Додати секцію "Маркетинг" в JSX — зверху, перед існуючою сіткою**

Знайти `<div className="grid grid-cols-3 gap-2">` і вставити перед ним:

```tsx
{/* ── Маркетинг ── */}
<div className="mb-3">
  <p className="text-[10px] font-semibold uppercase tracking-widest text-[#A8928D] mb-2">
    Маркетинг
  </p>
  <div className="grid grid-cols-2 gap-2">
    <Tooltip
      content={<p className="text-[11px] text-[#2C1A14]">Запустити знижку на вільний слот</p>}
      position="top"
      delay={400}
    >
      <motion.button
        whileTap={{ scale: 0.94 }}
        onClick={() => setFlashOpen(true)}
        className="flex flex-col items-center gap-2 py-3 px-1 rounded-2xl transition-all hover:bg-white/50 w-full"
      >
        <div className="w-11 h-11 rounded-2xl flex items-center justify-center bg-[#D4935A] shadow-[0_4px_14px_rgba(212,147,90,0.38)]">
          <Zap size={18} className="text-white" />
        </div>
        <span className="text-[10px] font-medium text-[#6B5750] text-center leading-tight">
          Флеш-акція
        </span>
      </motion.button>
    </Tooltip>

    <Tooltip
      content={<p className="text-[11px] text-[#2C1A14]">Пікові години, тихий час, рання бронь</p>}
      position="top"
      delay={400}
    >
      <motion.button
        whileTap={{ scale: 0.94 }}
        onClick={() => setPricingOpen(true)}
        className="flex flex-col items-center gap-2 py-3 px-1 rounded-2xl transition-all hover:bg-white/50 w-full"
      >
        <div className="w-11 h-11 rounded-2xl flex items-center justify-center bg-[#789A99] shadow-[0_4px_14px_rgba(120,154,153,0.38)]">
          <TrendingUp size={18} className="text-white" />
        </div>
        <span className="text-[10px] font-medium text-[#6B5750] text-center leading-tight">
          Ціноутворення
        </span>
      </motion.button>
    </Tooltip>
  </div>
</div>

{/* ── Дільник ── */}
<div className="border-t border-white/40 mb-3" />
```

- [ ] **Крок 4: Додати drawer-компоненти в return**

Знайти `<ManualBookingForm ... />` і додати після нього:

```tsx
<FlashDealDrawer isOpen={flashOpen} onClose={() => setFlashOpen(false)} />
<PricingDrawer isOpen={pricingOpen} onClose={() => setPricingOpen(false)} />
```

- [ ] **Крок 5: Перевірити TypeScript**

```bash
cd bookit && npx tsc --noEmit 2>&1 | head -20
```
Очікувано: без помилок.

- [ ] **Крок 6: Commit**

```bash
git add bookit/src/components/master/dashboard/QuickActions.tsx
git commit -m "feat: add Marketing section (Flash + Pricing) to QuickActions with drawers"
```

---

## Перевірка після імплементації

- [ ] Запустити dev-сервер: `cd bookit && npm run dev`
- [ ] Відкрити дашборд `/dashboard`
- [ ] Переконатись що секція "МАРКЕТИНГ" відображається зверху QuickActions картки
- [ ] Натиснути "Флеш-акція" → drawer відкривається справа з FlashDealPage
- [ ] Натиснути "Ціноутворення" → drawer відкривається з DynamicPricingPage або PricingUpgradeGate (залежно від тіру)
- [ ] Клік по backdrop → drawer закривається
- [ ] Кнопка X → drawer закривається
- [ ] На мобільному: drawer займає full width
