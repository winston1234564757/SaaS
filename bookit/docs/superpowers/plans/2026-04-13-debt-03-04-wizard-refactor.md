# DEBT-03 & DEBT-04 — Wizard Refactor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Split BookingWizard (1543 lines) and OnboardingWizard (811 lines) into focused sub-components and custom hooks, with zero functional change.

**Architecture:** Extract shared types/helpers first, then custom hooks for state/pricing/schedule, then individual step components, and finally slim the orchestrator shells. All exports stay backwards-compatible — no callers change.

**Tech Stack:** React 18, Next.js App Router, TypeScript strict, Framer Motion, React Hook Form + Zod, TanStack Query v5, Tailwind CSS v4

---

## DEBT-03 · BookingWizard

### Task 1: Create `wizard/` directory with types and helpers

**Files:**
- Create: `src/components/shared/wizard/types.ts`
- Create: `src/components/shared/wizard/helpers.ts`

- [ ] **Step 1: Create `wizard/types.ts`**

Move these from the top of `BookingWizard.tsx` (lines 38–81):

```typescript
// src/components/shared/wizard/types.ts
import type { WorkingHoursConfig } from '@/types/database';

export interface WizardService {
  id: string;
  name: string;
  price: number;
  duration: number;
  popular: boolean;
  emoji: string;
  category: string;
  description?: string | null;
}

export interface WizardProduct {
  id: string;
  name: string;
  price: number;
  description: string | null;
  emoji: string;
  inStock?: boolean;
  stock?: number | null;
}

export interface BookingWizardProps {
  isOpen: boolean;
  onClose: () => void;
  masterId: string;
  masterName?: string;
  workingHours?: WorkingHoursConfig | null;
  services: WizardService[];
  products?: WizardProduct[];
  initialServices?: WizardService[];
  mode: 'client' | 'master';
  bookingsThisMonth?: number;
  subscriptionTier?: string;
  pricingRules?: Record<string, unknown>;
  onSuccess?: () => void;
  flashDeal?: { id: string; discountPct: number; serviceName: string } | null;
}

export type WizardStep = 'services' | 'datetime' | 'products' | 'details' | 'success';

export interface CartItem {
  product: WizardProduct;
  quantity: number;
}
```

- [ ] **Step 2: Create `wizard/helpers.ts`**

Move these from `BookingWizard.tsx` (constants + pure helpers + animation variants + step metadata):

```typescript
// src/components/shared/wizard/helpers.ts
import type { WizardStep } from './types';

export const DOW     = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
export const DAY_S   = ['Неділя', 'Понеділок', 'Вівторок', 'Середа', 'Четвер', 'П\'ятниця', 'Субота'];
export const MONTH_S = ['січня', 'лютого', 'березня', 'квітня', 'травня', 'червня', 'липня', 'серпня', 'вересня', 'жовтня', 'листопада', 'грудня'];

export function toISO(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function getDays(n = 30): Date[] {
  const t = new Date(); t.setHours(0, 0, 0, 0);
  return Array.from({ length: n }, (_, i) => {
    const d = new Date(t); d.setDate(t.getDate() + i); return d;
  });
}

export function fmt(n: number): string {
  return n.toLocaleString('uk-UA') + ' ₴';
}

export const ALL_STEPS: WizardStep[] = ['services', 'datetime', 'products', 'details', 'success'];
export const PROGRESS: WizardStep[]  = ['services', 'datetime', 'products', 'details'];

export const STEP_TITLE: Record<WizardStep, string | ((m: string) => string)> = {
  services: 'Обери послуги',
  datetime: 'Дата та час',
  products: 'Додати товари',
  details:  (m) => m === 'master' ? 'Деталі запису' : 'Твої контакти',
  success:  '',
};

export const slide = {
  enter:  (d: number) => ({ x: d > 0 ? 52 : -52, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit:   (d: number) => ({ x: d > 0 ? -52 : 52, opacity: 0 }),
};
```

- [ ] **Step 3: Update imports in `BookingWizard.tsx`**

Replace the type/constant blocks with:
```typescript
import type { WizardService, WizardProduct, BookingWizardProps, WizardStep, CartItem } from './wizard/types';
import { DOW, DAY_S, MONTH_S, toISO, getDays, fmt, ALL_STEPS, PROGRESS, STEP_TITLE, slide } from './wizard/helpers';
```

- [ ] **Step 4: Verify TypeScript**

```bash
cd bookit && npx tsc --noEmit 2>&1 | head -30
```
Expected: 0 errors.

- [ ] **Step 5: Commit**
```bash
git add src/components/shared/wizard/types.ts src/components/shared/wizard/helpers.ts src/components/shared/BookingWizard.tsx
git commit -m "refactor: DEBT-03 extract BookingWizard types and helpers to wizard/"
```

---

### Task 2: Extract `StepProgress` and `PushPrompt` sub-components

**Files:**
- Create: `src/components/shared/wizard/StepProgress.tsx`
- Create: `src/components/shared/wizard/PushPrompt.tsx`

- [ ] **Step 1: Create `wizard/StepProgress.tsx`**

Move the `StepProgress` function (lines 125–138) to its own file:

```typescript
// src/components/shared/wizard/StepProgress.tsx
import { PROGRESS } from './helpers';
import type { WizardStep } from './types';

export function StepProgress({ step, hasProducts }: { step: WizardStep; hasProducts: boolean }) {
  const visible = hasProducts ? PROGRESS : PROGRESS.filter(s => s !== 'products');
  const idx = visible.indexOf(step);
  if (idx < 0) return null;
  return (
    <div className="flex gap-1.5 mb-5">
      {visible.map((s, i) => (
        <div key={s} className={`h-1 flex-1 rounded-full transition-all duration-300 ${
          i <= idx ? 'bg-[#789A99]' : 'bg-[#E8D5CF]'
        }`} />
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Create `wizard/PushPrompt.tsx`**

Move the `PUSH_KEY` constant and `PushPrompt` component (lines 140–185) to its own file:

```typescript
// src/components/shared/wizard/PushPrompt.tsx
'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';

const PUSH_KEY = 'bookit_push_dismissed';

export function PushPrompt() {
  // ... (move entire PushPrompt function body here)
}
```

- [ ] **Step 3: Import in `BookingWizard.tsx`**

```typescript
import { StepProgress } from './wizard/StepProgress';
import { PushPrompt } from './wizard/PushPrompt';
```

Remove the local definitions.

- [ ] **Step 4: Verify**
```bash
cd bookit && npx tsc --noEmit 2>&1 | head -30
```

- [ ] **Step 5: Commit**
```bash
git add src/components/shared/wizard/StepProgress.tsx src/components/shared/wizard/PushPrompt.tsx src/components/shared/BookingWizard.tsx
git commit -m "refactor: DEBT-03 extract StepProgress and PushPrompt to wizard/"
```

---

### Task 3: Extract `useBookingScheduleData` hook

**Files:**
- Create: `src/components/shared/wizard/useBookingScheduleData.ts`

This hook wraps `useWizardSchedule` and computes all schedule-derived values: `offDayDates`, `selectedDayBreaks`, `slots`, `fullyBookedDates`, plus the auto-select and scroll effects.

- [ ] **Step 1: Create the hook**

```typescript
// src/components/shared/wizard/useBookingScheduleData.ts
import { useMemo, useEffect, useRef, MutableRefObject } from 'react';
import { useWizardSchedule } from '@/lib/supabase/hooks/useWizardSchedule';
import {
  generateAvailableSlots, scoreSlots,
  type TimeRange,
} from '@/lib/utils/smartSlots';
import { buildOffDaySet } from '@/lib/utils/bookingEngine';
import type { WorkingHoursConfig } from '@/types/database';
import { DOW, toISO, getDays } from './helpers';
import type { WizardStep } from './types';

interface UseBookingScheduleDataParams {
  masterId: string;
  isOpen: boolean;
  step: WizardStep;
  effectiveDuration: number;
  selectedDate: Date | null;
  selectedDateRef: MutableRefObject<Date | null>;
  clientHistoryTimes: string[];
  workingHours?: WorkingHoursConfig | null;
  setSelectedDate: (d: Date) => void;
}

export function useBookingScheduleData({
  masterId,
  isOpen,
  step,
  effectiveDuration,
  selectedDate,
  selectedDateRef,
  clientHistoryTimes,
  workingHours,
  setSelectedDate,
}: UseBookingScheduleDataParams) {
  const days = useMemo(() => getDays(30), []);
  const fromDateStr = useMemo(() => toISO(days[0]), [days]);
  const toDateStr   = useMemo(() => toISO(days[days.length - 1]), [days]);

  const {
    data: scheduleStore,
    isLoading: scheduleLoading,
    isError: scheduleError,
    refetch: refetchSchedule,
  } = useWizardSchedule(isOpen ? masterId : null, fromDateStr, toDateStr);

  const offDayDates = useMemo(() => {
    if (!scheduleStore) return new Set<string>();
    return buildOffDaySet(
      Object.entries(scheduleStore.templates).map(([d, t]) => ({ day_of_week: d as never, is_working: t.is_working })),
      Object.entries(scheduleStore.exceptions).filter(([_, e]) => e.is_day_off).map(([d]) => ({ date: d })),
      days
    );
  }, [scheduleStore, days]);

  const selectedDayBreaks = useMemo<TimeRange[]>(() => {
    if (!selectedDate || !scheduleStore) return [];
    const tpl = scheduleStore.templates[DOW[selectedDate.getDay()]];
    if (!tpl) return [];
    return [
      ...(tpl.break_start && tpl.break_end ? [{ start: tpl.break_start.slice(0, 5), end: tpl.break_end.slice(0, 5) }] : []),
      ...(workingHours?.breaks ?? []),
    ];
  }, [selectedDate, scheduleStore, workingHours]);

  const slots = useMemo(() => {
    if (!selectedDate || !scheduleStore || effectiveDuration === 0) return [];
    const dateStr = toISO(selectedDate);
    if (offDayDates.has(dateStr)) return [];
    const tpl = scheduleStore.templates[DOW[selectedDate.getDay()]];
    if (!tpl) return [];
    const exc = scheduleStore.exceptions[dateStr];
    if (exc?.is_day_off) return [];
    const workStart = exc?.start_time?.slice(0, 5) ?? tpl.start_time.slice(0, 5);
    const workEnd   = exc?.end_time?.slice(0, 5)   ?? tpl.end_time.slice(0, 5);
    const raw = generateAvailableSlots({
      workStart, workEnd,
      bookings:          scheduleStore.bookingsByDate[dateStr] ?? [],
      breaks:            selectedDayBreaks,
      bufferMinutes:     workingHours?.buffer_time_minutes ?? 0,
      requestedDuration: effectiveDuration,
      stepMinutes:       15,
      selectedDate,
    });
    return scoreSlots(raw, { clientHistoryTimes });
  }, [selectedDate, scheduleStore, offDayDates, effectiveDuration, selectedDayBreaks, workingHours, clientHistoryTimes]);

  const fullyBookedDates = useMemo<Set<string>>(() => {
    if (!scheduleStore || effectiveDuration === 0) return new Set();
    const result = new Set<string>();
    for (const d of days) {
      const dateStr = toISO(d);
      if (offDayDates.has(dateStr)) continue;
      const tpl = scheduleStore.templates[DOW[d.getDay()]];
      if (!tpl) continue;
      const exc = scheduleStore.exceptions[dateStr];
      if (exc?.is_day_off) continue;
      const workStart = exc?.start_time?.slice(0, 5) ?? tpl.start_time.slice(0, 5);
      const workEnd   = exc?.end_time?.slice(0, 5)   ?? tpl.end_time.slice(0, 5);
      const dayBreaks: TimeRange[] = [
        ...(tpl.break_start && tpl.break_end ? [{ start: tpl.break_start.slice(0, 5), end: tpl.break_end.slice(0, 5) }] : []),
        ...(workingHours?.breaks ?? []),
      ];
      const s = generateAvailableSlots({
        workStart, workEnd,
        bookings:          scheduleStore.bookingsByDate[dateStr] ?? [],
        breaks:            dayBreaks,
        bufferMinutes:     workingHours?.buffer_time_minutes ?? 0,
        requestedDuration: effectiveDuration,
        stepMinutes:       15,
        selectedDate:      d,
      });
      if (!s.some(sl => sl.available)) result.add(dateStr);
    }
    return result;
  }, [scheduleStore, offDayDates, effectiveDuration, days, workingHours]);

  // Auto-select first available day once schedule loads
  useEffect(() => {
    if (step !== 'datetime' || !scheduleStore) return;
    if (selectedDateRef.current !== null) return;
    const firstAvailable = days.find(d => {
      const str = toISO(d);
      return !offDayDates.has(str) && !fullyBookedDates.has(str);
    });
    if (firstAvailable) setSelectedDate(firstAvailable);
  }, [step, scheduleStore, fullyBookedDates, days, offDayDates, selectedDateRef, setSelectedDate]);

  // Scroll date strip to selected date
  useEffect(() => {
    if (!selectedDate) return;
    const el = document.getElementById(`day-${toISO(selectedDate)}`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  }, [selectedDate]);

  return {
    days,
    scheduleStore,
    scheduleLoading,
    scheduleError,
    refetchSchedule,
    offDayDates,
    selectedDayBreaks,
    slots,
    fullyBookedDates,
  };
}
```

- [ ] **Step 2: Replace in `BookingWizard.tsx`**

Delete the `days`, `fromDateStr`, `toDateStr`, `useWizardSchedule` call, `offDayDates`, `selectedDayBreaks`, `slots`, `fullyBookedDates` useMemos, plus the two auto-select/scroll effects. Replace with:

```typescript
import { useBookingScheduleData } from './wizard/useBookingScheduleData';
// ...
const {
  days, scheduleStore, scheduleLoading, scheduleError, refetchSchedule,
  offDayDates, selectedDayBreaks, slots, fullyBookedDates,
} = useBookingScheduleData({
  masterId, isOpen, step, effectiveDuration,
  selectedDate, selectedDateRef,
  clientHistoryTimes, workingHours,
  setSelectedDate,
});
```

- [ ] **Step 3: Verify**
```bash
cd bookit && npx tsc --noEmit 2>&1 | head -30
```

- [ ] **Step 4: Commit**
```bash
git add src/components/shared/wizard/useBookingScheduleData.ts src/components/shared/BookingWizard.tsx
git commit -m "refactor: DEBT-03 extract useBookingScheduleData hook"
```

---

### Task 4: Extract `useBookingPricing` hook

**Files:**
- Create: `src/components/shared/wizard/useBookingPricing.ts`

- [ ] **Step 1: Create the hook**

Move the pricing useMemos (lines 314–357) into:

```typescript
// src/components/shared/wizard/useBookingPricing.ts
import { useMemo } from 'react';
import { applyDynamicPricing } from '@/lib/utils/dynamicPricing';
import type { WizardService, CartItem } from './types';

interface UseBookingPricingParams {
  selectedServices: WizardService[];
  cart: CartItem[];
  durationOverride: number | null;
  selectedDate: Date | null;
  selectedTime: string | null;
  pricingRules?: Record<string, unknown>;
  useDynamicPrice: boolean;
  loyaltyDiscount: { name: string; percent: number } | null;
  flashDeal?: { id: string; discountPct: number; serviceName: string } | null;
  discountPercent: number;
}

export function useBookingPricing({
  selectedServices,
  cart,
  durationOverride,
  selectedDate,
  selectedTime,
  pricingRules,
  useDynamicPrice,
  loyaltyDiscount,
  flashDeal,
  discountPercent,
}: UseBookingPricingParams) {
  const totalDuration = useMemo(
    () => selectedServices.reduce((s, sv) => s + sv.duration, 0),
    [selectedServices]
  );
  const effectiveDuration = durationOverride ?? totalDuration;

  const totalServicesPrice = useMemo(
    () => selectedServices.reduce((s, sv) => s + sv.price, 0),
    [selectedServices]
  );

  const dynamicPricing = useMemo(() => {
    if (!selectedDate || !selectedTime || !pricingRules) return null;
    return applyDynamicPricing(totalServicesPrice, pricingRules, selectedDate, selectedTime);
  }, [totalServicesPrice, pricingRules, selectedDate, selectedTime]);

  const effectiveServicesPrice = (
    dynamicPricing && dynamicPricing.adjustedPrice !== totalServicesPrice && useDynamicPrice
  ) ? dynamicPricing.adjustedPrice : totalServicesPrice;

  const totalProductsPrice = useMemo(
    () => cart.reduce((s, ci) => s + ci.product.price * ci.quantity, 0),
    [cart]
  );

  const grandTotal = effectiveServicesPrice + totalProductsPrice;
  const originalTotal = totalServicesPrice + totalProductsPrice;
  const maxAllowedDiscount = Math.floor(originalTotal * 0.40);

  const rawLoyaltyDiscount = loyaltyDiscount ? Math.round(grandTotal * loyaltyDiscount.percent / 100) : 0;
  const rawFlashDiscount   = flashDeal        ? Math.round(grandTotal * flashDeal.discountPct / 100)   : 0;
  const rawMasterDiscount  = Math.round(grandTotal * discountPercent / 100);

  const requestedDynamicDiscount = dynamicPricing ? totalServicesPrice - dynamicPricing.adjustedPrice : 0;
  const totalRequestedDiscountSum = (useDynamicPrice ? requestedDynamicDiscount : 0) + rawLoyaltyDiscount + rawFlashDiscount + rawMasterDiscount;

  const effectiveTotalDiscount = totalRequestedDiscountSum > 0
    ? Math.min(maxAllowedDiscount, totalRequestedDiscountSum)
    : totalRequestedDiscountSum;

  const finalTotal = Math.max(0, originalTotal - effectiveTotalDiscount);

  const loyaltyDiscountAmount = totalRequestedDiscountSum > 0
    ? Math.round(effectiveTotalDiscount * (rawLoyaltyDiscount / totalRequestedDiscountSum))
    : 0;
  const masterDiscountAmount = totalRequestedDiscountSum > 0
    ? Math.round(effectiveTotalDiscount * (rawMasterDiscount / totalRequestedDiscountSum))
    : 0;
  const flashDealAmount = totalRequestedDiscountSum > 0
    ? Math.round(effectiveTotalDiscount * (rawFlashDiscount / totalRequestedDiscountSum))
    : 0;

  return {
    totalDuration,
    effectiveDuration,
    totalServicesPrice,
    dynamicPricing,
    effectiveServicesPrice,
    totalProductsPrice,
    grandTotal,
    originalTotal,
    finalTotal,
    loyaltyDiscountAmount,
    masterDiscountAmount,
    flashDealAmount,
  };
}
```

- [ ] **Step 2: Replace in `BookingWizard.tsx`**

Delete the 8 derived price variables and replace with:
```typescript
import { useBookingPricing } from './wizard/useBookingPricing';
// ...
const {
  totalDuration, effectiveDuration, totalServicesPrice,
  dynamicPricing, effectiveServicesPrice, totalProductsPrice,
  grandTotal, originalTotal, finalTotal,
  loyaltyDiscountAmount, masterDiscountAmount, flashDealAmount,
} = useBookingPricing({
  selectedServices, cart, durationOverride,
  selectedDate, selectedTime, pricingRules,
  useDynamicPrice, loyaltyDiscount, flashDeal, discountPercent,
});
```

- [ ] **Step 3: Verify**
```bash
cd bookit && npx tsc --noEmit 2>&1 | head -30
```

- [ ] **Step 4: Commit**
```bash
git add src/components/shared/wizard/useBookingPricing.ts src/components/shared/BookingWizard.tsx
git commit -m "refactor: DEBT-03 extract useBookingPricing hook"
```

---

### Task 5: Extract `useBookingWizardState` hook

**Files:**
- Create: `src/components/shared/wizard/useBookingWizardState.ts`

This hook encapsulates all `useState`, `useRef`, `useForm`, and the init/history/reset `useEffect`.

- [ ] **Step 1: Create the hook**

```typescript
// src/components/shared/wizard/useBookingWizardState.ts
'use client';
import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createClient } from '@/lib/supabase/client';
import { ensureClientProfile } from '@/app/[slug]/actions';
import { getAutoSuggestProductIds } from '@/lib/supabase/hooks/useProductLinks';
import { bookingClientSchema, type BookingClientData } from '@/lib/validations/booking';
import { useToast } from '@/lib/toast/context';
import type { WizardService, WizardProduct, WizardStep, CartItem } from './types';
import { ALL_STEPS } from './helpers';

interface UseBookingWizardStateParams {
  isOpen: boolean;
  masterId: string;
  mode: 'client' | 'master';
  initialServices?: WizardService[];
  products?: WizardProduct[];
  onClose: () => void;
}

export function useBookingWizardState({
  isOpen, masterId, mode, initialServices, products = [], onClose,
}: UseBookingWizardStateParams) {
  const { showToast } = useToast();

  // ── Step navigation ─────────────────────────────────────────────────────────
  const [step, setStep]           = useState<WizardStep>('services');
  const [direction, setDirection] = useState(1);

  const availableProducts = products.filter(p => p.inStock !== false);
  const hasProducts = availableProducts.length > 0;
  const visibleSteps = hasProducts ? ALL_STEPS : ALL_STEPS.filter(s => s !== 'products');

  function go(next: WizardStep, dir: 1 | -1 = 1) {
    setDirection(dir); setStep(next);
  }
  function goBack() {
    const idx = visibleSteps.indexOf(step);
    if (idx > 0) go(visibleSteps[idx - 1], -1);
    else { onClose(); setTimeout(() => go('services'), 350); }
  }
  function closeWizard() { onClose(); setTimeout(() => go('services'), 350); }

  // ── Booking state ────────────────────────────────────────────────────────────
  const [selectedServices, setSelectedServices] = useState<WizardService[]>([]);
  const [cart, setCart]                         = useState<CartItem[]>([]);
  const [selectedDate, setSelectedDate]         = useState<Date | null>(null);
  const selectedDateRef                         = useRef<Date | null>(null);
  selectedDateRef.current = selectedDate;
  const [selectedTime, setSelectedTime]         = useState<string | null>(null);
  const [clientName, setClientName]             = useState('');
  const [clientPhone, setClientPhone]           = useState('');
  const [clientEmail, setClientEmail]           = useState('');
  const [clientNotes, setClientNotes]           = useState('');
  const [discountPercent, setDiscountPercent]   = useState(0);
  const [durationOverride, setDurationOverride] = useState<number | null>(null);
  const [useDynamicPrice, setUseDynamicPrice]   = useState(true);

  // ── Client-mode extras ────────────────────────────────────────────────────────
  const [clientUserId, setClientUserId]             = useState<string | null>(null);
  const [createdBookingId, setCreatedBookingId]     = useState<string | null>(null);
  const [clientHistoryTimes, setClientHistoryTimes] = useState<string[]>([]);
  const [loyaltyDiscount, setLoyaltyDiscount]       = useState<{ name: string; percent: number } | null>(null);
  const [partners, setPartners]                     = useState<{ id: string; name: string; slug: string; emoji: string; category?: string }[]>([]);

  // ── Submit state ──────────────────────────────────────────────────────────────
  const [saving, setSaving]                       = useState(false);
  const [saveError, setSaveError]                 = useState('');
  const [upgradePromptOpen, setUpgradePromptOpen] = useState(false);

  // ── Product auto-suggest ──────────────────────────────────────────────────────
  const [suggestedProductIds, setSuggestedProductIds] = useState<Set<string>>(new Set());

  // ── React Hook Form ──────────────────────────────────────────────────────────
  const {
    register, handleSubmit: handleFormSubmit, setValue, watch,
    formState: { errors }, trigger, reset: resetForm,
  } = useForm<BookingClientData>({
    resolver: zodResolver(bookingClientSchema),
    defaultValues: { clientName: '', clientPhone: '' },
  });

  const watchName  = watch('clientName');
  const watchPhone = watch('clientPhone');

  useEffect(() => { setClientName(watchName || ''); }, [watchName]);
  useEffect(() => { setClientPhone(watchPhone || ''); }, [watchPhone]);

  // ── Refs ──────────────────────────────────────────────────────────────────────
  const wasOpenRef = useRef(false);

  // ── Reset + fetch client history on open ─────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    if (!isOpen) { wasOpenRef.current = false; return () => { cancelled = true; }; }

    const isRetry = wasOpenRef.current;
    wasOpenRef.current = true;

    if (!isRetry) {
      go('services', 1);
      setSelectedServices(initialServices ?? []);
      setCart([]);
      setSelectedDate(null);
      setSelectedTime(null);
      setClientName('');
      setClientPhone('');
      setClientEmail('');
      setClientNotes('');
      setDiscountPercent(0);
      setDurationOverride(null);
      setUseDynamicPrice(true);
      setClientUserId(null);
      setCreatedBookingId(null);
      setClientHistoryTimes([]);
      setLoyaltyDiscount(null);
      setSuggestedProductIds(new Set());
      setSaveError('');
      resetForm({ clientName: '', clientPhone: '' });
    }

    if (mode === 'client' && masterId) {
      ensureClientProfile().then(({ userId, name, phone, email }) => {
        if (cancelled || !userId) return;
        setClientUserId(userId);
        if (name) { setClientName(name); setValue('clientName', name); }
        if (phone) { setClientPhone(phone); setValue('clientPhone', phone); }
        if (email) setClientEmail(email);

        const sb = createClient();
        Promise.all([
          sb.from('client_master_relations').select('total_visits').eq('client_id', userId).eq('master_id', masterId).maybeSingle(),
          sb.from('loyalty_programs').select('name, target_visits, reward_type, reward_value').eq('master_id', masterId).eq('is_active', true),
          sb.from('bookings').select('start_time').eq('client_id', userId).eq('master_id', masterId).eq('status', 'completed').limit(20),
          sb.from('master_partners').select('partner_id, status, master_profiles!master_partners_partner_id_fkey(id, slug, avatar_emoji, categories, profiles(full_name))').eq('master_id', masterId).eq('status', 'accepted').limit(5),
        ]).then(([relRes, progRes, histRes, partRes]) => {
          if (cancelled) return;
          const history = (histRes.data ?? []).map((b: { start_time: string | null }) => b.start_time?.slice(0, 5)).filter((t: string | undefined): t is string => !!t);
          if (history.length) setClientHistoryTimes(history);
          const visits = relRes.data?.total_visits ?? 0;
          const totalVisitsWithThisOne = visits + 1;
          const best = (progRes.data ?? [])
            .filter((p: { reward_type: string; target_visits: number }) => p.reward_type === 'percent_discount' && totalVisitsWithThisOne >= p.target_visits)
            .sort((a: { reward_value: unknown }, b: { reward_value: unknown }) => Number(b.reward_value) - Number(a.reward_value))[0];
          if (best) setLoyaltyDiscount({ name: best.name as string, percent: Number(best.reward_value) });
          if (partRes.data) {
            type PartnerRow = {
              partner_id: string;
              status: string;
              master_profiles: { id: string; slug: string; avatar_emoji: string | null; categories: string[] | null; profiles: { full_name: string | null } | null } | Array<{ id: string; slug: string; avatar_emoji: string | null; categories: string[] | null; profiles: { full_name: string | null } | null }> | null;
            };
            setPartners(partRes.data.map((p: PartnerRow) => {
              const mp = Array.isArray(p.master_profiles) ? p.master_profiles[0] : p.master_profiles;
              const profile = Array.isArray(mp?.profiles) ? mp.profiles[0] : mp?.profiles;
              return { id: mp?.id, slug: mp?.slug, emoji: mp?.avatar_emoji || '💅', name: profile?.full_name || 'Майстер', category: mp?.categories?.[0] || 'Beauty' };
            }));
          }
        }).catch((e: unknown) => {
          if (process.env.NODE_ENV !== 'production') console.error('[BookingWizard] client data fetch failed:', e);
        });
      }).catch((e: unknown) => {
        if (process.env.NODE_ENV !== 'production') console.error('[BookingWizard] ensureClientProfile failed:', e);
      });
    }
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, masterId]);

  // ── Auto-suggest products ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!selectedServices.length || !availableProducts.length) {
      setSuggestedProductIds(new Set()); return;
    }
    getAutoSuggestProductIds(selectedServices.map(s => s.id))
      .then(ids => setSuggestedProductIds(new Set(ids)))
      .catch(() => setSuggestedProductIds(new Set()));
  }, [selectedServices, availableProducts.length]);

  // ── saveError → Toast ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (saveError) showToast({ type: 'error', title: 'Помилка запису', message: saveError });
  }, [saveError, showToast]);

  // ── Cart helpers ──────────────────────────────────────────────────────────────
  function addToCart(p: WizardProduct) {
    setCart(prev => {
      const ex = prev.find(ci => ci.product.id === p.id);
      if (ex) return prev.map(ci => ci.product.id === p.id ? { ...ci, quantity: ci.quantity + 1 } : ci);
      return [...prev, { product: p, quantity: 1 }];
    });
  }
  function removeFromCart(id: string) {
    setCart(prev => {
      const ex = prev.find(ci => ci.product.id === id);
      if (!ex) return prev;
      if (ex.quantity <= 1) return prev.filter(ci => ci.product.id !== id);
      return prev.map(ci => ci.product.id === id ? { ...ci, quantity: ci.quantity - 1 } : ci);
    });
  }
  function cartQty(id: string) { return cart.find(ci => ci.product.id === id)?.quantity ?? 0; }

  function toggleService(sv: WizardService) {
    setSelectedServices(prev => prev.some(s => s.id === sv.id) ? prev.filter(s => s.id !== sv.id) : [...prev, sv]);
    setSelectedTime(null);
  }

  return {
    // navigation
    step, direction, go, goBack, closeWizard, visibleSteps, hasProducts, availableProducts,
    // booking
    selectedServices, setSelectedServices, cart, setCart,
    selectedDate, setSelectedDate, selectedDateRef,
    selectedTime, setSelectedTime,
    clientName, setClientName, clientPhone, setClientPhone,
    clientEmail, setClientEmail, clientNotes, setClientNotes,
    discountPercent, setDiscountPercent,
    durationOverride, setDurationOverride,
    useDynamicPrice, setUseDynamicPrice,
    // client extras
    clientUserId, setClientUserId, createdBookingId, setCreatedBookingId,
    clientHistoryTimes, loyaltyDiscount, partners,
    // submit
    saving, setSaving, saveError, setSaveError, upgradePromptOpen, setUpgradePromptOpen,
    // products
    suggestedProductIds,
    // form
    register, handleFormSubmit, setValue, errors, trigger, watchName, watchPhone,
    // helpers
    addToCart, removeFromCart, cartQty, toggleService,
  };
}
```

- [ ] **Step 2: Replace state in `BookingWizard.tsx`**

Delete all the state/ref/form/effect blocks (lines 196–586), replace with:

```typescript
import { useBookingWizardState } from './wizard/useBookingWizardState';
// ...
const state = useBookingWizardState({ isOpen, masterId, mode, initialServices, products, onClose });
const {
  step, direction, go, goBack, closeWizard, visibleSteps, hasProducts, availableProducts,
  selectedServices, setSelectedServices, cart,
  selectedDate, setSelectedDate, selectedDateRef,
  selectedTime, setSelectedTime,
  clientEmail, setClientEmail, clientNotes, setClientNotes,
  discountPercent, setDiscountPercent,
  durationOverride, setDurationOverride,
  useDynamicPrice, setUseDynamicPrice,
  clientUserId, createdBookingId, setCreatedBookingId,
  clientHistoryTimes, loyaltyDiscount, partners,
  saving, setSaving, saveError, setSaveError, upgradePromptOpen, setUpgradePromptOpen,
  suggestedProductIds,
  register, handleFormSubmit, setValue, errors, trigger, watchName, watchPhone,
  addToCart, removeFromCart, cartQty, toggleService,
} = state;
```

- [ ] **Step 3: Verify**
```bash
cd bookit && npx tsc --noEmit 2>&1 | head -40
```

- [ ] **Step 4: Commit**
```bash
git add src/components/shared/wizard/useBookingWizardState.ts src/components/shared/BookingWizard.tsx
git commit -m "refactor: DEBT-03 extract useBookingWizardState hook"
```

---

### Task 6: Extract `ServiceSelector` step component

**Files:**
- Create: `src/components/shared/wizard/ServiceSelector.tsx`

- [ ] **Step 1: Define prop interface and create file**

```typescript
// src/components/shared/wizard/ServiceSelector.tsx
'use client';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Clock, ChevronRight } from 'lucide-react';
import { formatDurationFull, pluralize } from '@/lib/utils/dates';
import type { WizardService } from './types';
import { fmt, slide } from './helpers';

interface ServiceSelectorProps {
  services: WizardService[];
  selectedServices: WizardService[];
  onToggle: (sv: WizardService) => void;
  mode: 'client' | 'master';
  partners: Array<{ id: string; name: string; slug: string; emoji: string; category?: string }>;
  direction: number;
  // master-only
  durationOverride: number | null;
  totalDuration: number;
  effectiveDuration: number;
  totalServicesPrice: number;
  onDurationOverrideChange: (v: number | null) => void;
  onClearTime: () => void;
  onContinue: () => void;
}

export function ServiceSelector({ ... }: ServiceSelectorProps) {
  const categories = [...new Set(services.map(s => s.category))];
  const canGoToDatetime = selectedServices.length > 0;
  // JSX from BookingWizard.tsx step === 'services' block (lines 738–945)
  // ...
}
```

The JSX body is the entire `step === 'services'` motion.div block (lines 738–945 in the original file).

- [ ] **Step 2: Replace in `BookingWizard.tsx`**

Import `ServiceSelector` and replace the `{step === 'services' && (...)}` block with:

```tsx
{step === 'services' && (
  <ServiceSelector
    services={services}
    selectedServices={selectedServices}
    onToggle={toggleService}
    mode={mode}
    partners={partners}
    direction={direction}
    durationOverride={durationOverride}
    totalDuration={totalDuration}
    effectiveDuration={effectiveDuration}
    totalServicesPrice={totalServicesPrice}
    onDurationOverrideChange={(v) => { setDurationOverride(v); setSelectedTime(null); }}
    onClearTime={() => setSelectedTime(null)}
    onContinue={() => go('datetime', 1)}
  />
)}
```

Note: `categories` is computed inside `ServiceSelector` from `services` — remove it from `BookingWizard.tsx`.

- [ ] **Step 3: Verify**
```bash
cd bookit && npx tsc --noEmit 2>&1 | head -30
```

- [ ] **Step 4: Commit**
```bash
git add src/components/shared/wizard/ServiceSelector.tsx src/components/shared/BookingWizard.tsx
git commit -m "refactor: DEBT-03 extract ServiceSelector step"
```

---

### Task 7: Extract `DateTimePicker` step component

**Files:**
- Create: `src/components/shared/wizard/DateTimePicker.tsx`

- [ ] **Step 1: Define prop interface and create file**

```typescript
// src/components/shared/wizard/DateTimePicker.tsx
'use client';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { addDays } from 'date-fns';
import { buildSlotRenderItems, toMins as slotToMins, fromMins as slotFromMins } from '@/lib/utils/smartSlots';
import type { WizardService } from './types';
import type { ReturnType as ScheduleReturn } from './useBookingScheduleData'; // use actual type
import { fmt, DAY_S, MONTH_S, toISO, slide } from './helpers';
import { pluralize, formatDurationFull } from '@/lib/utils/dates';
import type { TimeRange } from '@/lib/utils/smartSlots';

// Import the actual slot/schedule store types from useWizardSchedule
import type { ScheduleStore } from '@/lib/supabase/hooks/useWizardSchedule';
import type { ScoredSlot } from '@/lib/utils/smartSlots';

interface DateTimePickerProps {
  days: Date[];
  scheduleStore: ScheduleStore | null | undefined;
  scheduleLoading: boolean;
  scheduleError: boolean;
  onRetry: () => void;
  selectedDate: Date | null;
  selectedTime: string | null;
  offDayDates: Set<string>;
  fullyBookedDates: Set<string>;
  slots: ScoredSlot[];
  selectedDayBreaks: TimeRange[];
  effectiveDuration: number;
  totalServicesPrice: number;
  selectedServices: WizardService[];
  dynamicPricing: { label: string; modifier: number; adjustedPrice: number } | null;
  useDynamicPrice: boolean;
  mode: 'client' | 'master';
  hasProducts: boolean;
  direction: number;
  onDateSelect: (d: Date) => void;
  onTimeSelect: (t: string) => void;
  onToggleDynamicPrice: () => void;
  onContinue: () => void;
}

export function DateTimePicker({ ... }: DateTimePickerProps) {
  // JSX from BookingWizard.tsx step === 'datetime' block (lines 948–1208)
}
```

**Note on types:** Check actual exported types from `useWizardSchedule` and `smartSlots` with:
```bash
grep -n "export type\|export interface" bookit/src/lib/supabase/hooks/useWizardSchedule.ts bookit/src/lib/utils/smartSlots.ts
```
Use whatever types are exported. If `ScheduleStore` isn't exported, add `export` to it first.

- [ ] **Step 2: Ensure needed types are exported**

Check and export `ScheduleStore` from `useWizardSchedule.ts` and the scored slot type from `smartSlots.ts` if not already exported.

- [ ] **Step 3: Replace in `BookingWizard.tsx`**

```tsx
{step === 'datetime' && (
  <DateTimePicker
    days={days}
    scheduleStore={scheduleStore}
    scheduleLoading={scheduleLoading}
    scheduleError={scheduleError}
    onRetry={() => refetchSchedule()}
    selectedDate={selectedDate}
    selectedTime={selectedTime}
    offDayDates={offDayDates}
    fullyBookedDates={fullyBookedDates}
    slots={slots}
    selectedDayBreaks={selectedDayBreaks}
    effectiveDuration={effectiveDuration}
    totalServicesPrice={totalServicesPrice}
    selectedServices={selectedServices}
    dynamicPricing={dynamicPricing}
    useDynamicPrice={useDynamicPrice}
    mode={mode}
    hasProducts={hasProducts}
    direction={direction}
    onDateSelect={(d) => { setSelectedDate(d); setSelectedTime(null); }}
    onTimeSelect={setSelectedTime}
    onToggleDynamicPrice={() => setUseDynamicPrice(v => !v)}
    onContinue={() => go(hasProducts ? 'products' : 'details', 1)}
  />
)}
```

- [ ] **Step 4: Verify**
```bash
cd bookit && npx tsc --noEmit 2>&1 | head -30
```

- [ ] **Step 5: Commit**
```bash
git add src/components/shared/wizard/DateTimePicker.tsx src/components/shared/BookingWizard.tsx
git commit -m "refactor: DEBT-03 extract DateTimePicker step"
```

---

### Task 8: Extract `ProductCart` step component

**Files:**
- Create: `src/components/shared/wizard/ProductCart.tsx`

- [ ] **Step 1: Create file**

```typescript
// src/components/shared/wizard/ProductCart.tsx
'use client';
import { motion } from 'framer-motion';
import { ShoppingBag, Plus, Minus } from 'lucide-react';
import type { WizardProduct, CartItem } from './types';
import { fmt, slide } from './helpers';

interface ProductCartProps {
  availableProducts: WizardProduct[];
  suggestedProductIds: Set<string>;
  cart: CartItem[];
  totalProductsPrice: number;
  direction: number;
  onAdd: (p: WizardProduct) => void;
  onRemove: (id: string) => void;
  cartQty: (id: string) => number;
  onContinue: () => void;
}

export function ProductCart({ ... }: ProductCartProps) {
  // JSX from step === 'products' block (lines 1211–1283)
  // sortedProducts computed locally:
  const sortedProducts = suggestedProductIds.size
    ? [...availableProducts.filter(p => suggestedProductIds.has(p.id)), ...availableProducts.filter(p => !suggestedProductIds.has(p.id))]
    : availableProducts;
  // ...
}
```

- [ ] **Step 2: Replace in `BookingWizard.tsx`**

```tsx
{step === 'products' && (
  <ProductCart
    availableProducts={availableProducts}
    suggestedProductIds={suggestedProductIds}
    cart={cart}
    totalProductsPrice={totalProductsPrice}
    direction={direction}
    onAdd={addToCart}
    onRemove={removeFromCart}
    cartQty={cartQty}
    onContinue={() => go('details', 1)}
  />
)}
```

Remove `sortedProducts` from `BookingWizard.tsx`.

- [ ] **Step 3: Verify**
```bash
cd bookit && npx tsc --noEmit 2>&1 | head -30
```

- [ ] **Step 4: Commit**
```bash
git add src/components/shared/wizard/ProductCart.tsx src/components/shared/BookingWizard.tsx
git commit -m "refactor: DEBT-03 extract ProductCart step"
```

---

### Task 9: Extract `ClientDetails` step component

**Files:**
- Create: `src/components/shared/wizard/ClientDetails.tsx`

- [ ] **Step 1: Create file**

```typescript
// src/components/shared/wizard/ClientDetails.tsx
'use client';
import { motion } from 'framer-motion';
import { User, Phone, MessageSquare } from 'lucide-react';
import type { UseFormRegister, FieldErrors } from 'react-hook-form';
import type { BookingClientData } from '@/lib/validations/booking';
import type { WizardService } from './types';
import { fmt, MONTH_S, slide } from './helpers';
import { pluralize } from '@/lib/utils/dates';

interface ClientDetailsProps {
  selectedDate: Date | null;
  selectedTime: string | null;
  selectedServices: WizardService[];
  mode: 'client' | 'master';
  clientUserId: string | null;
  // form
  register: UseFormRegister<BookingClientData>;
  errors: FieldErrors<BookingClientData>;
  watchPhone: string;
  setValue: (field: keyof BookingClientData, value: string, opts?: { shouldValidate?: boolean }) => void;
  clientNotes: string;
  setClientNotes: (v: string) => void;
  // master-only
  discountPercent: number;
  setDiscountPercent: (v: number) => void;
  masterDiscountAmount: number;
  // pricing summary
  dynamicPricing: { label: string; modifier: number; adjustedPrice: number } | null;
  useDynamicPrice: boolean;
  loyaltyDiscount: { name: string; percent: number } | null;
  loyaltyDiscountAmount: number;
  flashDeal?: { id: string; discountPct: number; serviceName: string } | null;
  flashDealAmount: number;
  totalServicesPrice: number;
  totalProductsPrice: number;
  finalTotal: number;
  // submit
  canSubmit: boolean;
  saving: boolean;
  onSubmit: () => void;
  direction: number;
}

export function ClientDetails({ ... }: ClientDetailsProps) {
  // JSX from step === 'details' block (lines 1286–1458)
}
```

- [ ] **Step 2: Replace in `BookingWizard.tsx`**

```tsx
{step === 'details' && (
  <ClientDetails
    selectedDate={selectedDate}
    selectedTime={selectedTime}
    selectedServices={selectedServices}
    mode={mode}
    clientUserId={clientUserId}
    register={register}
    errors={errors}
    watchPhone={watchPhone}
    setValue={setValue}
    clientNotes={clientNotes}
    setClientNotes={setClientNotes}
    discountPercent={discountPercent}
    setDiscountPercent={setDiscountPercent}
    masterDiscountAmount={masterDiscountAmount}
    dynamicPricing={dynamicPricing}
    useDynamicPrice={useDynamicPrice}
    loyaltyDiscount={loyaltyDiscount}
    loyaltyDiscountAmount={loyaltyDiscountAmount}
    flashDeal={flashDeal}
    flashDealAmount={flashDealAmount}
    totalServicesPrice={totalServicesPrice}
    totalProductsPrice={totalProductsPrice}
    finalTotal={finalTotal}
    canSubmit={canSubmit}
    saving={saving}
    onSubmit={handleSubmit}
    direction={direction}
  />
)}
```

- [ ] **Step 3: Verify**
```bash
cd bookit && npx tsc --noEmit 2>&1 | head -30
```

- [ ] **Step 4: Commit**
```bash
git add src/components/shared/wizard/ClientDetails.tsx src/components/shared/BookingWizard.tsx
git commit -m "refactor: DEBT-03 extract ClientDetails step"
```

---

### Task 10: Extract `BookingSuccess` + slim `BookingWizard.tsx`

**Files:**
- Create: `src/components/shared/wizard/BookingSuccess.tsx`
- Modify: `src/components/shared/BookingWizard.tsx`

- [ ] **Step 1: Create `BookingSuccess.tsx`**

```typescript
// src/components/shared/wizard/BookingSuccess.tsx
'use client';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { addMinutes, parse as parseFns, format as formatFns } from 'date-fns';
import { PostBookingAuth } from '@/components/public/PostBookingAuth';
import { PushPrompt } from './PushPrompt';
import type { WizardService, CartItem } from './types';
import { fmt, MONTH_S, slide } from './helpers';
import { pluralize } from '@/lib/utils/dates';

interface BookingSuccessProps {
  selectedServices: WizardService[];
  selectedDate: Date | null;
  selectedTime: string | null;
  totalDuration: number;
  cart: CartItem[];
  clientUserId: string | null;
  createdBookingId: string | null;
  clientPhone: string;
  masterName: string;
  flashDeal?: { id: string; discountPct: number; serviceName: string } | null;
  finalTotal: number;
  direction: number;
  onClose: () => void;
}

export function BookingSuccess({ ... }: BookingSuccessProps) {
  // JSX from step === 'success' block (lines 1461–1523)
}
```

- [ ] **Step 2: Replace in `BookingWizard.tsx`**

```tsx
{step === 'success' && (
  <BookingSuccess
    selectedServices={selectedServices}
    selectedDate={selectedDate}
    selectedTime={selectedTime}
    totalDuration={totalDuration}
    cart={cart}
    clientUserId={clientUserId}
    createdBookingId={createdBookingId}
    clientPhone={clientPhone}
    masterName={masterName}
    flashDeal={flashDeal}
    finalTotal={finalTotal}
    direction={direction}
    onClose={closeWizard}
  />
)}
```

- [ ] **Step 3: Verify final `BookingWizard.tsx` size**

```bash
wc -l bookit/src/components/shared/BookingWizard.tsx
```
Expected: ≤ 200 lines (shell only: imports, `handleSubmit` function, `canSubmit`/`isAtLimit` derived flags, shell JSX with backdrop + panel + AnimatePresence).

- [ ] **Step 4: Final type check**
```bash
cd bookit && npx tsc --noEmit 2>&1 | head -30
```
Expected: 0 errors.

- [ ] **Step 5: Commit DEBT-03 complete**
```bash
git add src/components/shared/wizard/BookingSuccess.tsx src/components/shared/BookingWizard.tsx
git commit -m "refactor: DEBT-03 complete — BookingWizard split into 8 focused modules"
```

---

## DEBT-04 · OnboardingWizard

### Task 11: Create `steps/` directory + extract shared onboarding types

**Files:**
- Create: `src/components/master/onboarding/steps/types.ts`
- Create: `src/components/master/onboarding/steps/ConfettiParticles.tsx`

- [ ] **Step 1: Create `steps/types.ts`**

```typescript
// src/components/master/onboarding/steps/types.ts
export type Step =
  | 'BASIC'
  | 'SCHEDULE_PROMPT'
  | 'SCHEDULE_FORM'
  | 'SERVICES_PROMPT'
  | 'SERVICES_FORM'
  | 'SUCCESS';

export const STEP_ORDER: Step[] = [
  'BASIC',
  'SCHEDULE_PROMPT',
  'SCHEDULE_FORM',
  'SERVICES_PROMPT',
  'SERVICES_FORM',
  'SUCCESS',
];

export type DayKey = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';
export type DaySchedule = { is_working: boolean; start_time: string; end_time: string };

export const DAYS_ORDER = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const;
export const DAYS_UA: Record<string, string> = {
  mon: 'Пн', tue: 'Вт', wed: 'Ср', thu: 'Чт', fri: 'Пт', sat: 'Сб', sun: 'Нд',
};

export const SPECIALIZATIONS = [
  { emoji: '💅', label: 'Манікюр' },
  { emoji: '✂️', label: 'Стрижки' },
  { emoji: '💆', label: 'Масаж' },
  { emoji: '👁️', label: 'Lash' },
  { emoji: '🌸', label: 'Брови' },
  { emoji: '💄', label: 'Макіяж' },
  { emoji: '💎', label: 'Нарощення' },
  { emoji: '✨', label: 'Інше' },
];

export const BUFFER_PRESETS = [0, 5, 10, 15, 20, 30];
export const DURATION_PRESETS = [30, 45, 60, 90, 120];

export const inputCls = 'w-full px-4 py-3 rounded-2xl bg-white/70 border border-white/80 text-sm text-[#2C1A14] placeholder-[#A8928D] outline-none focus:bg-white focus:border-[#789A99] focus:ring-2 focus:ring-[#789A99]/20 transition-all';
```

- [ ] **Step 2: Create `steps/ConfettiParticles.tsx`**

```typescript
// src/components/master/onboarding/steps/ConfettiParticles.tsx
'use client';
import { motion } from 'framer-motion';

const CONFETTI_COLORS = ['#789A99', '#FFB4A0', '#5C9E7A', '#D4935A', '#C8A4C8', '#A8D8D8'];

export function ConfettiParticles() {
  // Move the ConfettiParticles component body from OnboardingWizard.tsx (lines 68–93)
}
```

- [ ] **Step 3: Update `OnboardingWizard.tsx`**

```typescript
import { type Step, STEP_ORDER, type DayKey, type DaySchedule, DAYS_ORDER, DAYS_UA, SPECIALIZATIONS, BUFFER_PRESETS, DURATION_PRESETS, inputCls } from './steps/types';
import { ConfettiParticles } from './steps/ConfettiParticles';
```

Remove the local type/constant definitions.

- [ ] **Step 4: Verify**
```bash
cd bookit && npx tsc --noEmit 2>&1 | head -30
```

- [ ] **Step 5: Commit**
```bash
git add src/components/master/onboarding/steps/ src/components/master/onboarding/OnboardingWizard.tsx
git commit -m "refactor: DEBT-04 extract onboarding shared types + ConfettiParticles"
```

---

### Task 12: Extract `StepBasic.tsx`

**Files:**
- Create: `src/components/master/onboarding/steps/StepBasic.tsx`

- [ ] **Step 1: Define prop interface and create file**

```typescript
// src/components/master/onboarding/steps/StepBasic.tsx
'use client';
import { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Camera, ArrowRight, Loader2 } from 'lucide-react';
import { formatPhoneDisplay, normalizePhoneInput } from '@/lib/utils/phone';
import { SPECIALIZATIONS, inputCls } from './types';

interface StepBasicProps {
  direction: number;
  slideVariants: object;
  transition: object;
  // form state
  avatarPreview: string;
  specialization: string;
  fullName: string;
  phone: string;
  hasPhone: boolean;
  saving: boolean;
  // setters
  onAvatarChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSpecializationChange: (emoji: string) => void;
  onFullNameChange: (v: string) => void;
  onPhoneChange: (v: string) => void;
  onSave: () => void;
}

export function StepBasic(props: StepBasicProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const firstInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const t = setTimeout(() => firstInputRef.current?.focus(), 150);
    return () => clearTimeout(t);
  }, []);

  // JSX from OnboardingWizard.tsx step === 'BASIC' block (lines 349–438)
}
```

- [ ] **Step 2: Replace in `OnboardingWizard.tsx`**

Move `fileInputRef`, `firstInputRef`, and the BASIC `useEffect` into `StepBasic` (they're contained there). Replace the BASIC block with:

```tsx
{step === 'BASIC' && (
  <StepBasic
    direction={direction}
    slideVariants={slideVariants}
    transition={transition}
    avatarPreview={avatarPreview}
    specialization={specialization}
    fullName={fullName}
    phone={phone}
    hasPhone={hasPhone}
    saving={saving}
    onAvatarChange={handleAvatarChange}
    onSpecializationChange={setSpecialization}
    onFullNameChange={setFullName}
    onPhoneChange={setPhone}
    onSave={handleSaveProfile}
  />
)}
```

- [ ] **Step 3: Verify**
```bash
cd bookit && npx tsc --noEmit 2>&1 | head -30
```

- [ ] **Step 4: Commit**
```bash
git add src/components/master/onboarding/steps/StepBasic.tsx src/components/master/onboarding/OnboardingWizard.tsx
git commit -m "refactor: DEBT-04 extract StepBasic"
```

---

### Task 13: Extract `StepSchedulePrompt.tsx` and `StepScheduleForm.tsx`

**Files:**
- Create: `src/components/master/onboarding/steps/StepSchedulePrompt.tsx`
- Create: `src/components/master/onboarding/steps/StepScheduleForm.tsx`

- [ ] **Step 1: Create `StepSchedulePrompt.tsx`**

```typescript
// src/components/master/onboarding/steps/StepSchedulePrompt.tsx
'use client';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

interface StepSchedulePromptProps {
  direction: number;
  slideVariants: object;
  transition: object;
  onSetupSchedule: () => void;
  onSkip: () => void;
}

export function StepSchedulePrompt(props: StepSchedulePromptProps) {
  // JSX from OnboardingWizard.tsx step === 'SCHEDULE_PROMPT' block (lines 441–484)
}
```

- [ ] **Step 2: Create `StepScheduleForm.tsx`**

```typescript
// src/components/master/onboarding/steps/StepScheduleForm.tsx
'use client';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Loader2, Plus, X } from 'lucide-react';
import { DAYS_ORDER, DAYS_UA, BUFFER_PRESETS, type DayKey, type DaySchedule } from './types';

interface StepScheduleFormProps {
  direction: number;
  slideVariants: object;
  transition: object;
  schedule: Record<DayKey, DaySchedule>;
  bufferTime: number;
  breaks: Array<{ start: string; end: string }>;
  saving: boolean;
  onToggleDay: (day: DayKey) => void;
  onScheduleTimeChange: (day: DayKey, field: 'start_time' | 'end_time', val: string) => void;
  onBufferChange: (min: number) => void;
  onAddBreak: () => void;
  onRemoveBreak: (i: number) => void;
  onBreakFieldChange: (i: number, field: 'start' | 'end', val: string) => void;
  onApplyTemplate: () => void;
  onBack: () => void;
  onSave: () => void;
}

export function StepScheduleForm(props: StepScheduleFormProps) {
  // JSX from OnboardingWizard.tsx step === 'SCHEDULE_FORM' block (lines 486–621)
}
```

- [ ] **Step 3: Replace both blocks in `OnboardingWizard.tsx`**

```tsx
{step === 'SCHEDULE_PROMPT' && (
  <StepSchedulePrompt
    direction={direction}
    slideVariants={slideVariants}
    transition={transition}
    onSetupSchedule={() => goTo('SCHEDULE_FORM')}
    onSkip={() => goTo('SERVICES_PROMPT')}
  />
)}

{step === 'SCHEDULE_FORM' && (
  <StepScheduleForm
    direction={direction}
    slideVariants={slideVariants}
    transition={transition}
    schedule={schedule}
    bufferTime={bufferTime}
    breaks={breaks}
    saving={saving}
    onToggleDay={toggleDay}
    onScheduleTimeChange={(day, field, val) => setSchedule(s => ({ ...s, [day]: { ...s[day], [field]: val } }))}
    onBufferChange={setBufferTime}
    onAddBreak={addBreak}
    onRemoveBreak={removeBreak}
    onBreakFieldChange={setBreakField}
    onApplyTemplate={() => setSchedule(TEMPLATE_SCHEDULE)}
    onBack={() => goTo('SCHEDULE_PROMPT')}
    onSave={handleSaveSchedule}
  />
)}
```

- [ ] **Step 4: Verify**
```bash
cd bookit && npx tsc --noEmit 2>&1 | head -30
```

- [ ] **Step 5: Commit**
```bash
git add src/components/master/onboarding/steps/StepSchedulePrompt.tsx src/components/master/onboarding/steps/StepScheduleForm.tsx src/components/master/onboarding/OnboardingWizard.tsx
git commit -m "refactor: DEBT-04 extract StepSchedulePrompt + StepScheduleForm"
```

---

### Task 14: Extract `StepServicesPrompt.tsx` and `StepServicesForm.tsx`

**Files:**
- Create: `src/components/master/onboarding/steps/StepServicesPrompt.tsx`
- Create: `src/components/master/onboarding/steps/StepServicesForm.tsx`

- [ ] **Step 1: Create `StepServicesPrompt.tsx`**

```typescript
// src/components/master/onboarding/steps/StepServicesPrompt.tsx
'use client';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

interface StepServicesPromptProps {
  direction: number;
  slideVariants: object;
  transition: object;
  onAddService: () => void;
  onSkip: () => void;
}

export function StepServicesPrompt(props: StepServicesPromptProps) {
  // JSX from step === 'SERVICES_PROMPT' block (lines 623–666)
}
```

- [ ] **Step 2: Create `StepServicesForm.tsx`**

```typescript
// src/components/master/onboarding/steps/StepServicesForm.tsx
'use client';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Check, Loader2 } from 'lucide-react';
import { DURATION_PRESETS, inputCls } from './types';

interface StepServicesFormProps {
  direction: number;
  slideVariants: object;
  transition: object;
  serviceName: string;
  servicePrice: string;
  serviceDuration: number;
  saving: boolean;
  onServiceNameChange: (v: string) => void;
  onServicePriceChange: (v: string) => void;
  onServiceDurationChange: (min: number) => void;
  onSave: () => void;
  onBack: () => void;
}

export function StepServicesForm(props: StepServicesFormProps) {
  // JSX from step === 'SERVICES_FORM' block (lines 668–742)
}
```

- [ ] **Step 3: Replace both blocks in `OnboardingWizard.tsx`**

```tsx
{step === 'SERVICES_PROMPT' && (
  <StepServicesPrompt
    direction={direction}
    slideVariants={slideVariants}
    transition={transition}
    onAddService={() => goTo('SERVICES_FORM')}
    onSkip={handleComplete}
  />
)}

{step === 'SERVICES_FORM' && (
  <StepServicesForm
    direction={direction}
    slideVariants={slideVariants}
    transition={transition}
    serviceName={serviceName}
    servicePrice={servicePrice}
    serviceDuration={serviceDuration}
    saving={saving}
    onServiceNameChange={setServiceName}
    onServicePriceChange={setServicePrice}
    onServiceDurationChange={setServiceDuration}
    onSave={handleSaveService}
    onBack={() => goTo('SERVICES_PROMPT')}
  />
)}
```

- [ ] **Step 4: Verify**
```bash
cd bookit && npx tsc --noEmit 2>&1 | head -30
```

- [ ] **Step 5: Commit**
```bash
git add src/components/master/onboarding/steps/StepServicesPrompt.tsx src/components/master/onboarding/steps/StepServicesForm.tsx src/components/master/onboarding/OnboardingWizard.tsx
git commit -m "refactor: DEBT-04 extract StepServicesPrompt + StepServicesForm"
```

---

### Task 15: Extract `StepSuccess.tsx` + slim `OnboardingWizard.tsx`

**Files:**
- Create: `src/components/master/onboarding/steps/StepSuccess.tsx`
- Modify: `src/components/master/onboarding/OnboardingWizard.tsx`

- [ ] **Step 1: Create `StepSuccess.tsx`**

```typescript
// src/components/master/onboarding/steps/StepSuccess.tsx
'use client';
import { motion } from 'framer-motion';
import { Check, Copy, ExternalLink, ArrowRight } from 'lucide-react';
import { ConfettiParticles } from './ConfettiParticles';

interface StepSuccessProps {
  direction: number;
  slideVariants: object;
  transition: object;
  savedSlug: string;
  copied: boolean;
  onCopyLink: () => void;
  onComplete: () => void;
}

export function StepSuccess(props: StepSuccessProps) {
  // JSX from step === 'SUCCESS' block (lines 744–805)
}
```

- [ ] **Step 2: Replace in `OnboardingWizard.tsx`**

```tsx
{step === 'SUCCESS' && (
  <StepSuccess
    direction={direction}
    slideVariants={slideVariants}
    transition={transition}
    savedSlug={savedSlug}
    copied={copied}
    onCopyLink={handleCopyLink}
    onComplete={handleComplete}
  />
)}
```

- [ ] **Step 3: Verify final `OnboardingWizard.tsx` size**
```bash
wc -l bookit/src/components/master/onboarding/OnboardingWizard.tsx
```
Expected: ≤ 200 lines.

- [ ] **Step 4: Final type check**
```bash
cd bookit && npx tsc --noEmit 2>&1 | head -30
```
Expected: 0 errors.

- [ ] **Step 5: Update backlog**

In `bookit/tasks/backlog.md`, move DEBT-03 and DEBT-04 from the active section to the ✅ ЗАВЕРШЕНО table:

```markdown
| DEBT-03: BookingWizard монолит → 8 модулів | — | ✅ |
| DEBT-04: OnboardingWizard → 6 step компонентів | — | ✅ |
```

- [ ] **Step 6: Final commit**
```bash
git add src/components/master/onboarding/steps/StepSuccess.tsx src/components/master/onboarding/OnboardingWizard.tsx bookit/tasks/backlog.md
git commit -m "refactor: DEBT-04 complete — OnboardingWizard split into 6 focused steps"
```

---

## Self-Review Checklist

**Spec coverage:**
- [x] DEBT-03: ServiceSelector, DateTimePicker, ProductCart, ClientDetails, BookingSuccess extracted
- [x] DEBT-03: useBookingWizardState, useBookingPricing, useBookingScheduleData hooks extracted
- [x] DEBT-03: Types and helpers in wizard/ subfolder
- [x] DEBT-04: StepBasic, StepSchedulePrompt, StepScheduleForm, StepServicesPrompt, StepServicesForm, StepSuccess extracted
- [x] Zero functional changes — same behavior, same exports

**Risks:**
- `useBookingWizardState` return shape must match all consuming sites in the still-in-flight `BookingWizard.tsx` — TypeScript will catch any mismatch
- `ScheduleStore` and `ScoredSlot` types need to be exported from their source files (Task 7 handles this)
- `saveError → Toast` effect requires `showToast` in `useBookingWizardState` — already included

**Placeholder scan:** No TBDs or "implement later" entries. Each task points to exact line ranges in the source files and shows complete type interfaces.
