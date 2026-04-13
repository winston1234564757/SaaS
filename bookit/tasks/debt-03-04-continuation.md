# DEBT-03 & DEBT-04 — Continuation Backlog
**Статус на 2026-04-13:** Tasks 1–2 виконані (commit cc1b9ee → 80f95d7). tsc --noEmit = 0 errors.
**Залишилось:** Tasks 3–15

---

## Що вже зроблено

| Task | Файли | Commit |
|------|-------|--------|
| 1 — Types + helpers | `wizard/types.ts`, `wizard/helpers.ts`, BookingWizard.tsx updated | cc1b9ee |
| 2 — StepProgress + PushPrompt | `wizard/StepProgress.tsx`, `wizard/PushPrompt.tsx`, BookingWizard.tsx updated | 80f95d7 |

---

## DEBT-03 — Залишок (Tasks 3–10)

---

### Task 3 — `useBookingScheduleData` hook

**Файли:**
- Створити: `src/components/shared/wizard/useBookingScheduleData.ts`
- Змінити: `src/components/shared/BookingWizard.tsx`

**Що перенести з BookingWizard.tsx:**
1. `const days = useMemo(() => getDays(30), []);`
2. `const fromDateStr = useMemo(() => toISO(days[0]), [days]);`
3. `const toDateStr = useMemo(() => toISO(days[days.length - 1]), [days]);`
4. Виклик `useWizardSchedule(isOpen ? masterId : null, fromDateStr, toDateStr)`
5. `const offDayDates = useMemo(...)` — buildOffDaySet
6. `const selectedDayBreaks = useMemo<TimeRange[]>(...)` — breaks для вибраного дня
7. `const slots = useMemo(...)` — scoreSlots для вибраного дня
8. `const fullyBookedDates = useMemo<Set<string>>(...)` — перевірка всіх 30 днів
9. `useEffect` авто-вибір першого доступного дня (з selectedDateRef guard)
10. `useEffect` scroll date strip (`el.scrollIntoView`)

**Перевірити:** `grep -n "export.*TimeRange" src/lib/utils/smartSlots.ts` — якщо не експортований, додати `export`.

**Сигнатура хука:**
```typescript
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

export function useBookingScheduleData(params): {
  days: Date[];
  scheduleStore: ScheduleStore | null | undefined;
  scheduleLoading: boolean;
  scheduleError: boolean;
  refetchSchedule: () => void;
  offDayDates: Set<string>;
  selectedDayBreaks: TimeRange[];
  slots: ScoredSlot[];
  fullyBookedDates: Set<string>;
}
```

**В BookingWizard.tsx замінити на:**
```typescript
import { useBookingScheduleData } from './wizard/useBookingScheduleData';

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

**Увага:** eslint-disable коментар на dep array авто-вибір ефекту — зберегти.

**Верифікація:** `cd bookit && npx tsc --noEmit 2>&1 | head -40` → 0 errors

**Коміт:** `refactor: DEBT-03 extract useBookingScheduleData hook`

---

### Task 4 — `useBookingPricing` hook

**Файли:**
- Створити: `src/components/shared/wizard/useBookingPricing.ts`
- Змінити: `src/components/shared/BookingWizard.tsx`

**Що перенести** (всі useMemo для цін, ~45 рядків):
1. `const totalDuration = useMemo(...)`
2. `const effectiveDuration = durationOverride ?? totalDuration`
3. `const totalServicesPrice = useMemo(...)`
4. `const dynamicPricing = useMemo(...)` — applyDynamicPricing
5. `const effectiveServicesPrice = ...`
6. `const totalProductsPrice = useMemo(...)`
7. `const grandTotal = ...`
8. `const rawLoyaltyDiscount`, `rawFlashDiscount`, `rawMasterDiscount`
9. `const requestedDynamicDiscount`, `totalRequestedDiscountSum`
10. `const effectiveTotalDiscount`, `finalTotal`
11. `const loyaltyDiscountAmount`, `masterDiscountAmount`, `flashDealAmount`

**Сигнатура:**
```typescript
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

// Returns:
{
  totalDuration: number;
  effectiveDuration: number;
  totalServicesPrice: number;
  dynamicPricing: ReturnType<typeof applyDynamicPricing> | null;
  effectiveServicesPrice: number;
  totalProductsPrice: number;
  grandTotal: number;
  originalTotal: number;
  finalTotal: number;
  loyaltyDiscountAmount: number;
  masterDiscountAmount: number;
  flashDealAmount: number;
}
```

**В BookingWizard.tsx замінити на:**
```typescript
import { useBookingPricing } from './wizard/useBookingPricing';

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

**Верифікація:** `npx tsc --noEmit` → 0 errors

**Коміт:** `refactor: DEBT-03 extract useBookingPricing hook`

---

### Task 5 — `useBookingWizardState` hook

**Файли:**
- Створити: `src/components/shared/wizard/useBookingWizardState.ts`
- Змінити: `src/components/shared/BookingWizard.tsx`

**Що перенести** — весь state блок компонента:
- `useState` для: step, direction, selectedServices, cart, selectedDate, selectedTime, clientName, clientPhone, clientEmail, clientNotes, discountPercent, durationOverride, useDynamicPrice, clientUserId, createdBookingId, clientHistoryTimes, loyaltyDiscount, partners, saving, saveError, upgradePromptOpen, suggestedProductIds
- `useRef`: selectedDateRef (синхронізований з selectedDate), wasOpenRef
- `useForm` (react-hook-form + zod resolver bookingClientSchema)
- `useEffect` синхронізація watchName/watchPhone → setState
- `useEffect` ініціалізація при відкритті (isOpen, masterId) — великий ефект з fetchClient history + loyalty + partners
- `useEffect` auto-suggest products
- `useEffect` saveError → showToast
- Хелпери: `go()`, `goBack()`, `closeWizard()`, `addToCart()`, `removeFromCart()`, `cartQty()`, `toggleService()`
- Розраховані: `availableProducts`, `hasProducts`, `visibleSteps`

**Параметри хука:**
```typescript
interface UseBookingWizardStateParams {
  isOpen: boolean;
  masterId: string;
  mode: 'client' | 'master';
  initialServices?: WizardService[];
  products?: WizardProduct[];
  onClose: () => void;
}
```

**Повертає:** всі state значення + setters + хелпери (великий return об'єкт).

**Увага:**
- Великий `useEffect([isOpen, masterId])` — зберегти `// eslint-disable-next-line react-hooks/exhaustive-deps` коментар
- `showToast` виклик потрібен всередині хука — імпортувати `useToast` з `@/lib/toast/context`
- `ensureClientProfile` — імпорт з `@/app/[slug]/actions`
- `getAutoSuggestProductIds` — імпорт з `@/lib/supabase/hooks/useProductLinks`
- Файл повинен мати `'use client'` на початку (використовує useState/useEffect)

**В BookingWizard.tsx замінити на:**
```typescript
import { useBookingWizardState } from './wizard/useBookingWizardState';

const {
  step, direction, go, goBack, closeWizard, visibleSteps, hasProducts, availableProducts,
  selectedServices, cart,
  selectedDate, setSelectedDate, selectedDateRef,
  selectedTime, setSelectedTime,
  clientName, clientPhone,
  clientEmail, setClientEmail, clientNotes, setClientNotes,
  discountPercent, setDiscountPercent,
  durationOverride, setDurationOverride,
  useDynamicPrice, setUseDynamicPrice,
  clientUserId, createdBookingId, setCreatedBookingId,
  clientHistoryTimes, loyaltyDiscount, partners,
  saving, setSaving, saveError, setSaveError, upgradePromptOpen, setUpgradePromptOpen,
  suggestedProductIds,
  register, errors, trigger, watchName, watchPhone, setValue,
  addToCart, removeFromCart, cartQty, toggleService,
} = useBookingWizardState({ isOpen, masterId, mode, initialServices, products, onClose });
```

**Верифікація:** `npx tsc --noEmit` → 0 errors

**Коміт:** `refactor: DEBT-03 extract useBookingWizardState hook`

---

### Task 6 — `ServiceSelector` step component

**Файли:**
- Створити: `src/components/shared/wizard/ServiceSelector.tsx`
- Змінити: `src/components/shared/BookingWizard.tsx`

**Що перенести:** весь JSX блок `{step === 'services' && (<motion.div ...>...</motion.div>)}`

**Props:**
```typescript
interface ServiceSelectorProps {
  services: WizardService[];
  selectedServices: WizardService[];
  onToggle: (sv: WizardService) => void;
  mode: 'client' | 'master';
  partners: Array<{ id: string; name: string; slug: string; emoji: string; category?: string }>;
  direction: number;
  durationOverride: number | null;
  totalDuration: number;
  effectiveDuration: number;
  totalServicesPrice: number;
  onDurationOverrideChange: (v: number | null) => void;
  onClearTime: () => void;
  onContinue: () => void;
}
```

`categories` обраховується всередині компонента з `services`.
`canGoToDatetime` = `selectedServices.length > 0` — теж всередині.

**Замінити в BookingWizard.tsx на:**
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

Видалити `const categories` і `const sortedProducts` (sortedProducts → у ProductCart, Task 8).

**Коміт:** `refactor: DEBT-03 extract ServiceSelector step`

---

### Task 7 — `DateTimePicker` step component

**Файли:**
- Створити: `src/components/shared/wizard/DateTimePicker.tsx`
- Змінити: `src/components/shared/BookingWizard.tsx`
- Можливо змінити: `src/lib/supabase/hooks/useWizardSchedule.ts` (додати export ScheduleStore)
- Можливо змінити: `src/lib/utils/smartSlots.ts` (додати export для scored slot type)

**Що перенести:** весь JSX блок `{step === 'datetime' && ...}`

**Props:**
```typescript
interface DateTimePickerProps {
  days: Date[];
  scheduleStore: ScheduleStore | undefined | null;
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
```

**Перевірити типи перед написанням:**
```bash
grep -n "export.*ScheduleStore\|export.*ScoredSlot\|export.*ScoreSlot" src/lib/supabase/hooks/useWizardSchedule.ts src/lib/utils/smartSlots.ts
```

Якщо не знайдені — додати `export` до відповідних interface/type.

**Замінити в BookingWizard.tsx на:**
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

**Коміт:** `refactor: DEBT-03 extract DateTimePicker step`

---

### Task 8 — `ProductCart` step component

**Файли:**
- Створити: `src/components/shared/wizard/ProductCart.tsx`
- Змінити: `src/components/shared/BookingWizard.tsx`

**Що перенести:** JSX блок `{step === 'products' && ...}`

**Props:**
```typescript
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
```

`sortedProducts` обраховується всередині:
```typescript
const sortedProducts = suggestedProductIds.size
  ? [...availableProducts.filter(p => suggestedProductIds.has(p.id)), ...availableProducts.filter(p => !suggestedProductIds.has(p.id))]
  : availableProducts;
```

**Замінити в BookingWizard.tsx на:**
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

**Коміт:** `refactor: DEBT-03 extract ProductCart step`

---

### Task 9 — `ClientDetails` step component

**Файли:**
- Створити: `src/components/shared/wizard/ClientDetails.tsx`
- Змінити: `src/components/shared/BookingWizard.tsx`

**Що перенести:** JSX блок `{step === 'details' && ...}` (включно з price summary)

**Props:**
```typescript
import type { UseFormRegister, FieldErrors } from 'react-hook-form';
import type { BookingClientData } from '@/lib/validations/booking';

interface ClientDetailsProps {
  selectedDate: Date | null;
  selectedTime: string | null;
  selectedServices: WizardService[];
  mode: 'client' | 'master';
  clientUserId: string | null;
  register: UseFormRegister<BookingClientData>;
  errors: FieldErrors<BookingClientData>;
  watchPhone: string;
  setValue: (field: keyof BookingClientData, value: string, opts?: { shouldValidate?: boolean }) => void;
  clientNotes: string;
  setClientNotes: (v: string) => void;
  discountPercent: number;
  setDiscountPercent: (v: number) => void;
  masterDiscountAmount: number;
  dynamicPricing: { label: string; modifier: number; adjustedPrice: number } | null;
  useDynamicPrice: boolean;
  loyaltyDiscount: { name: string; percent: number } | null;
  loyaltyDiscountAmount: number;
  flashDeal?: { id: string; discountPct: number; serviceName: string } | null;
  flashDealAmount: number;
  totalServicesPrice: number;
  totalProductsPrice: number;
  finalTotal: number;
  canSubmit: boolean;
  saving: boolean;
  onSubmit: () => void;
  direction: number;
}
```

**Замінити в BookingWizard.tsx:**
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

**Коміт:** `refactor: DEBT-03 extract ClientDetails step`

---

### Task 10 — `BookingSuccess` + slim BookingWizard shell

**Файли:**
- Створити: `src/components/shared/wizard/BookingSuccess.tsx`
- Змінити: `src/components/shared/BookingWizard.tsx`

**Props:**
```typescript
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
```

**Після цього кроку BookingWizard.tsx має бути:**
- ≤ 200 рядків
- Містить тільки: imports, `handleSubmit` async функцію, `canSubmit`/`isAtLimit` derived flags, shell JSX (backdrop + panel + header + AnimatePresence + step routing)
- Перевірка: `wc -l src/components/shared/BookingWizard.tsx`

**Коміт:** `refactor: DEBT-03 complete — BookingWizard split into 8 focused modules`

---

## DEBT-04 — OnboardingWizard (Tasks 11–15)

---

### Task 11 — Onboarding shared types + ConfettiParticles

**Файли:**
- Створити: `src/components/master/onboarding/steps/types.ts`
- Створити: `src/components/master/onboarding/steps/ConfettiParticles.tsx`
- Змінити: `src/components/master/onboarding/OnboardingWizard.tsx`

**`steps/types.ts` — перенести з OnboardingWizard.tsx:**
```typescript
export type Step = 'BASIC' | 'SCHEDULE_PROMPT' | 'SCHEDULE_FORM' | 'SERVICES_PROMPT' | 'SERVICES_FORM' | 'SUCCESS';
export const STEP_ORDER: Step[] = ['BASIC','SCHEDULE_PROMPT','SCHEDULE_FORM','SERVICES_PROMPT','SERVICES_FORM','SUCCESS'];
export type DayKey = 'mon'|'tue'|'wed'|'thu'|'fri'|'sat'|'sun';
export type DaySchedule = { is_working: boolean; start_time: string; end_time: string };
export const DAYS_ORDER = ['mon','tue','wed','thu','fri','sat','sun'] as const;
export const DAYS_UA: Record<string, string> = { mon:'Пн',tue:'Вт',wed:'Ср',thu:'Чт',fri:'Пт',sat:'Сб',sun:'Нд' };
export const SPECIALIZATIONS = [
  { emoji: '💅', label: 'Манікюр' }, { emoji: '✂️', label: 'Стрижки' },
  { emoji: '💆', label: 'Масаж' },   { emoji: '👁️', label: 'Lash' },
  { emoji: '🌸', label: 'Брови' },   { emoji: '💄', label: 'Макіяж' },
  { emoji: '💎', label: 'Нарощення' },{ emoji: '✨', label: 'Інше' },
];
export const BUFFER_PRESETS = [0, 5, 10, 15, 20, 30];
export const DURATION_PRESETS = [30, 45, 60, 90, 120];
export const DEFAULT_SCHEDULE = Object.fromEntries(
  DAYS_ORDER.map(d => [d, { is_working: !['sat','sun'].includes(d), start_time:'09:00', end_time:'18:00' }])
) as Record<DayKey, DaySchedule>;
export const TEMPLATE_SCHEDULE = Object.fromEntries(
  DAYS_ORDER.map(d => [d, { is_working: !['sat','sun'].includes(d), start_time:'10:00', end_time:'19:00' }])
) as Record<DayKey, DaySchedule>;
export const inputCls = 'w-full px-4 py-3 rounded-2xl bg-white/70 border border-white/80 text-sm text-[#2C1A14] placeholder-[#A8928D] outline-none focus:bg-white focus:border-[#789A99] focus:ring-2 focus:ring-[#789A99]/20 transition-all';
```

**`steps/ConfettiParticles.tsx`** — перенести `CONFETTI_COLORS` константу і `ConfettiParticles` функцію точно.

**Коміт:** `refactor: DEBT-04 extract onboarding shared types + ConfettiParticles`

---

### Task 12 — `StepBasic`

**Файли:**
- Створити: `src/components/master/onboarding/steps/StepBasic.tsx`
- Змінити: `src/components/master/onboarding/OnboardingWizard.tsx`

**Props:**
```typescript
interface StepBasicProps {
  direction: number;
  slideVariants: object;
  transition: object;
  avatarPreview: string;
  specialization: string;
  fullName: string;
  phone: string;
  hasPhone: boolean;
  saving: boolean;
  onAvatarChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSpecializationChange: (emoji: string) => void;
  onFullNameChange: (v: string) => void;
  onPhoneChange: (v: string) => void;
  onSave: () => void;
}
```

`fileInputRef` і `firstInputRef` + useEffect фокус переносяться всередину `StepBasic`.

**Замінити в OnboardingWizard.tsx:**
```tsx
{step === 'BASIC' && (
  <StepBasic
    direction={direction} slideVariants={slideVariants} transition={transition}
    avatarPreview={avatarPreview} specialization={specialization}
    fullName={fullName} phone={phone} hasPhone={hasPhone} saving={saving}
    onAvatarChange={handleAvatarChange}
    onSpecializationChange={setSpecialization}
    onFullNameChange={setFullName}
    onPhoneChange={setPhone}
    onSave={handleSaveProfile}
  />
)}
```

Видалити `fileInputRef`, `firstInputRef`, BASIC `useEffect` з OnboardingWizard.tsx.

**Коміт:** `refactor: DEBT-04 extract StepBasic`

---

### Task 13 — `StepSchedulePrompt` + `StepScheduleForm`

**Файли:**
- Створити: `src/components/master/onboarding/steps/StepSchedulePrompt.tsx`
- Створити: `src/components/master/onboarding/steps/StepScheduleForm.tsx`
- Змінити: `src/components/master/onboarding/OnboardingWizard.tsx`

**StepSchedulePrompt props:**
```typescript
interface StepSchedulePromptProps {
  direction: number; slideVariants: object; transition: object;
  onSetupSchedule: () => void; onSkip: () => void;
}
```

**StepScheduleForm props:**
```typescript
interface StepScheduleFormProps {
  direction: number; slideVariants: object; transition: object;
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
```

**Коміт:** `refactor: DEBT-04 extract StepSchedulePrompt + StepScheduleForm`

---

### Task 14 — `StepServicesPrompt` + `StepServicesForm`

**Файли:**
- Створити: `src/components/master/onboarding/steps/StepServicesPrompt.tsx`
- Створити: `src/components/master/onboarding/steps/StepServicesForm.tsx`
- Змінити: `src/components/master/onboarding/OnboardingWizard.tsx`

**StepServicesPrompt props:**
```typescript
interface StepServicesPromptProps {
  direction: number; slideVariants: object; transition: object;
  onAddService: () => void; onSkip: () => void;
}
```

**StepServicesForm props:**
```typescript
interface StepServicesFormProps {
  direction: number; slideVariants: object; transition: object;
  serviceName: string; servicePrice: string; serviceDuration: number;
  saving: boolean;
  onServiceNameChange: (v: string) => void;
  onServicePriceChange: (v: string) => void;
  onServiceDurationChange: (min: number) => void;
  onSave: () => void; onBack: () => void;
}
```

**Коміт:** `refactor: DEBT-04 extract StepServicesPrompt + StepServicesForm`

---

### Task 15 — `StepSuccess` + slim OnboardingWizard + update backlog

**Файли:**
- Створити: `src/components/master/onboarding/steps/StepSuccess.tsx`
- Змінити: `src/components/master/onboarding/OnboardingWizard.tsx`
- Змінити: `bookit/tasks/backlog.md`

**StepSuccess props:**
```typescript
interface StepSuccessProps {
  direction: number; slideVariants: object; transition: object;
  savedSlug: string; copied: boolean;
  onCopyLink: () => void; onComplete: () => void;
}
```

**Після цього кроку OnboardingWizard.tsx має бути ≤ 200 рядків.**

Перевірка: `wc -l src/components/master/onboarding/OnboardingWizard.tsx`

**В backlog.md додати до таблиці ✅ ЗАВЕРШЕНО:**
```markdown
| DEBT-03: BookingWizard монолит → 8 модулів wizard/ | — | ✅ |
| DEBT-04: OnboardingWizard → 6 step компонентів | — | ✅ |
```

**Фінальна верифікація:**
```bash
npx tsc --noEmit
wc -l src/components/shared/BookingWizard.tsx
wc -l src/components/master/onboarding/OnboardingWizard.tsx
```

**Коміт:** `refactor: DEBT-04 complete — OnboardingWizard split into 6 focused steps`

---

## Нотатки для виконавця

- Всі задачі — **чистий рефакторинг**, нульові функціональні зміни
- Після кожної задачі: `npx tsc --noEmit` → 0 помилок
- Якщо тип не експортований з бібліотечного файлу — додати `export` без зміни логіки
- Зберігати всі `eslint-disable` коментарі (вони навмисні)
- `BookingWizardProps` вже має re-export у BookingWizard.tsx (Task 1) — нічого не ламати
- Найскладніша задача — Task 5 (useBookingWizardState): великий ефект з fetching, скопіювати точно
