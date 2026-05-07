# 📋 CHAT SUMMARY — Slot Logic + Dashboard Redesign Session
> Файл для передачі контексту наступному AI-агенту.  
> Дата сесії: 2026-05-07. Проект: BookIT (`C:\Users\Vitossik\SaaS\bookit\`).

---

## 🔑 TL;DR для агента

Ця сесія мала дві окремі теми:
1. **Dashboard redesign fixes** — завершено, всі UI-правки залиті.
2. **Slot logic consistency** — НЕ вирішено. Три поверхні (Dashboard, StoryGenerator, BookingFlow) показують різну кількість слотів для того самого майстра, тієї самої послуги та сьогоднішнього дня. Детальний план у `XDEV/TASK.md`.

---

## 📦 ЧАСТИНА 1 — Dashboard Redesign (ЗАВЕРШЕНО)

### 1.1 Stripe на картках (DONE ✅)

**Проблема**: Кольорова смужка-акцент зліва на `SmallCard` (StatsMosaicWidget) і `BookingCard` (TodaySchedule) не доходила до кутів через `border-radius`.

**Рішення**: Видалено абсолютно позиційований `<div>` зі смужкою. Замість нього — `borderLeft: '3px solid color'` прямо на елементі картки. CSS `border-left` слідує за `border-radius` нативно.

**Файли**:
- `src/components/master/dashboard/widgets/StatsMosaicWidget.tsx` — `borderLeft` на `.bento-card` div
- `src/components/master/dashboard/TodaySchedule.tsx` — `borderLeft` додано до існуючого `style` на BookingCard

### 1.2 Stories-кнопка → auto-redirect на режим Вікна (DONE ✅)

**Проблема**: Кнопка "Сторіс" у FreeSlotsWidget вела на `/dashboard/marketing` без вибору режиму.

**Рішення**: Змінено `href` на `/dashboard/marketing?mode=free_slots`. Прокинуто `initialMode` prop через ланцюжок:

```
page.tsx (searchParams) → MarketingTabs → StoryGenerator
```

**Файли змінено**:
- `src/app/(master)/dashboard/marketing/page.tsx` — читає `searchParams.mode`, передає `initialMode` до `MarketingTabs`
- `src/components/master/marketing/MarketingTabs.tsx` — приймає і передає `initialMode` до `StoryGenerator`
- `src/components/master/marketing/StoryGenerator.tsx` — приймає `initialMode?: string`, ініціалізує `useState<Mode>` з нього:
  ```tsx
  const VALID_MODES = new Set<Mode>([...]);
  const startMode: Mode = (initialMode && VALID_MODES.has(initialMode as Mode))
    ? initialMode as Mode : 'announcement';
  const [mode, setMode] = useState<Mode>(startMode);
  ```

### 1.3 Calendar Animation (DONE ✅)

**Проблема**: Перемикання тиждень↔місяць спричиняло:
- миттєве зникнення всіх дат (blank state ~180ms)
- "стрибок" висоти контейнера

**Рішення**: Два незалежних механізми:
1. **Height animation** — `motion.div animate={{ height: calHeight }}` де `calHeight` вимірюється через `gridRef.current.scrollHeight`.
2. **Content crossfade** — CSS opacity transition: 55ms fade-out (3 фрейми, непомітно) → одночасна зміна дат → 280ms fade-in.

```tsx
// opacity transition замість AnimatePresence mode="wait"
<div ref={gridRef}
  style={{
    opacity: gridVisible ? 1 : 0,
    transition: gridVisible
      ? 'opacity 0.28s cubic-bezier(0.22, 1, 0.36, 1)'
      : 'opacity 0.04s linear',
  }}
>
```

**Toggle**: Замінено просту кнопку на segmented control з `layoutId="cal-view-pill"` для sliding pill ефекту.

**Фікс зрізаного першого ряду**: Додано `pt-2` до grid className (контейнер мав `overflow: hidden` для height animation, що зрізало верхній padding).

**Файл**: `src/components/master/dashboard/widgets/MonthlyCalendarWidget.tsx` — повний rewrite.

---

## 📦 ЧАСТИНА 2 — Slot Logic (НЕ ВИРІШЕНО ❌)

### 2.1 Архітектура (SLOTS_MAP.md)

Схема даних у `C:\Users\Vitossik\SaaS\XDEV\SLOTS_MAP.md`:

```
DB (Supabase)
  └─ useWizardSchedule → ScheduleStore
       ├─ useSlotsFromStore → generateAvailableSlots → UI (Dashboard, StoryGenerator)
       └─ useBookingScheduleData → generateAvailableSlots → UI (BookingFlow)
```

**Ключові файли**:
- `src/lib/utils/smartSlots.ts` — core engine, функція `generateAvailableSlots`
- `src/lib/supabase/hooks/useWizardSchedule.ts` — data fetcher (templates + exceptions + bookings + time_off)
- `src/lib/supabase/hooks/useSlotsFromStore.ts` — shared hook (новий, створено в цій сесії)
- `src/components/shared/wizard/useBookingScheduleData.ts` — booking flow hook

### 2.2 Що було зроблено (і не вирішило)

#### Крок 1: Витягнуто `useSlotsFromStore` як shared hook

**Контекст**: У `StoryGenerator.tsx` всередині файлу була вбудована функція `useSlotsFromStore`. `FreeSlotsWidget` мав власну, іншу логіку.

**Дія**: Видалено вбудовану функцію з обох компонентів, створено спільний файл:

```typescript
// src/lib/supabase/hooks/useSlotsFromStore.ts
export function useSlotsFromStore(
  date: string | null,
  durationMin: number,
  bufferMin: number,
  workingHours: Partial<WorkingHoursConfig> | null,
  store: ScheduleStore | undefined,
): string[] {
  return useMemo(() => {
    if (!date || !store || durationMin <= 0) return [];
    const dow = DOW_KEYS[new Date(date + 'T12:00:00').getDay()];
    const tpl = store.templates[dow];
    if (!tpl?.is_working) return [];
    const exc = store.exceptions[date];
    if (exc?.is_day_off) return [];
    const breaks: TimeRange[] = [
      ...(tpl.break_start && tpl.break_end
        ? [{ start: tpl.break_start.slice(0, 5), end: tpl.break_end.slice(0, 5) }]
        : []),
      ...(workingHours?.breaks ?? []),
    ];
    const workStart = exc?.start_time?.slice(0, 5) ?? tpl.start_time.slice(0, 5);
    const workEnd   = exc?.end_time?.slice(0, 5)   ?? tpl.end_time.slice(0, 5);
    const selectedDate = new Date(date + 'T12:00:00');
    return generateAvailableSlots({
      workStart, workEnd,
      bookings: store.bookingsByDate[date] ?? [],
      breaks, bufferMinutes: bufferMin,
      requestedDuration: durationMin, stepMinutes: 15, selectedDate,
    }).filter(s => s.available).map(s => s.time);
  }, [date, durationMin, bufferMin, workingHours, store]);
}
```

**Результат**: Логіка уніфікована між Dashboard і StoryGenerator. Але розходження залишилося.

#### Крок 2: Фікс UTC-дати в StoryGenerator

**Проблема**: `const todayStr = new Date().toISOString().slice(0, 10)` — UTC дата. Між 00:00–03:00 за Києвом дає вчорашній день замість сьогодні.

**Фікс**:
```typescript
// Замість:
const todayStr = new Date().toISOString().slice(0, 10);
// Стало:
const _now = getNow();
const todayStr = `${_now.getFullYear()}-${String(_now.getMonth() + 1).padStart(2, '0')}-${String(_now.getDate()).padStart(2, '0')}`;
```

**Результат**: Правильна timezone. Але розходження залишилося.

#### Крок 3: Уніфікація query range

**Проблема**:
- FreeSlotsWidget: `useWizardSchedule(masterId, today, today)` — лише сьогодні
- StoryGenerator: `useWizardSchedule(masterId, today, today+60)` — 60 днів
- BookingFlow: `useWizardSchedule(masterId, today, today+29)` — 30 днів

Три різні TanStack Query cache keys → три окремих fetch → потенційно різні стани даних у різний час.

**Фікс**: Уніфіковано на 30 днів скрізь:
```typescript
// FreeSlotsWidget — ПІСЛЯ ФІКСУ:
const future   = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
const futureStr = toISO(future);
useWizardSchedule(masterId, todayStr, futureStr); // [today, today+30]

// StoryGenerator — ПІСЛЯ ФІКСУ (було 60):
const _future = new Date(_now.getTime() + 30 * 24 * 60 * 60 * 1000);
useWizardSchedule(masterId, todayStr, futureStr); // [today, today+30]

// BookingFlow — без змін:
// getDays(30) → [today, today+29]
```

**Результат**: Ближче, але не ідентично. Cache key досі різний (`today+30` vs `today+29`). Розходження залишилося.

### 2.3 Невирішені причини розходження

#### Причина A: Cache key різниця (+1 день)

FreeSlotsWidget/StoryGenerator: `['wizard-schedule', masterId, todayStr, today+30]`
BookingFlow: `['wizard-schedule', masterId, todayStr, today+29]`

Різні ключі → два окремих HTTP-запити → різний timing → різні моменти отримання даних.

#### Причина B: Різні джерела `workingHours`

| Поверхня | Джерело `workingHours` |
|---|---|
| FreeSlotsWidget | `useMasterContext().masterProfile?.working_hours` (client state) |
| StoryGenerator | `useMasterContext().masterProfile?.working_hours` (client state) |
| BookingFlow | `master.workingHours` з `page.tsx` (server-fetched під час рендеру) |

Якщо майстер щойно змінив буфер або перерви, client-side context може бути stale. Server-fetched дані завжди актуальні.

#### Причина C: BookingFlow НЕ використовує `useSlotsFromStore`

`useBookingScheduleData.ts` має власну вбудовану логіку:
```typescript
const raw = generateAvailableSlots({
  workStart, workEnd,
  bookings:          scheduleStore.bookingsByDate[dateStr] ?? [],
  breaks:            selectedDayBreaks,
  bufferMinutes:     workingHours?.buffer_time_minutes ?? 0,
  requestedDuration: effectiveDuration,
  stepMinutes:       15,
  selectedDate:      selectedDate,
});
return scoreSlots(raw, { clientHistoryTimes });
```

`scoreSlots()` — сортує доступні слоти за score (час доби, частота бронювань клієнта). Порядок інший, але кількість має бути тою самою.

#### Причина D: Різна фільтрація services

**FreeSlotsWidget** (`useServices()` hook з `src/lib/supabase/hooks/useServices.ts`):
```typescript
.eq('is_archived', false)  // excludes archived
// maps: duration_minutes → duration
```

**StoryGenerator** (локальна `useServices(masterId)` функція в StoryGenerator.tsx):
```typescript
.eq('is_active', true)  // excludes inactive — але БЕЗ is_archived фільтра!
// повертає duration_minutes напряму (не маппить)
```

Якщо існує послуга яка `is_archived = true, is_active = true` — FreeSlotsWidget її приховає, StoryGenerator побачить. Різний `selectedSvc` → різна тривалість → різні слоти.

Також: `selectedSvc?.duration_minutes ?? 60` (StoryGenerator, fallback=60хв) vs `selectedService?.duration ?? 0` (FreeSlotsWidget, fallback=0 → пустий список). Якщо послуга не знайдена — результати кардинально різні.

### 2.4 Поточний стан файлів (після всіх змін в сесії)

| Поверхня | Хук | Query range | workingHours джерело | Scoring |
|---|---|---|---|---|
| FreeSlotsWidget | `useSlotsFromStore` | `[today, today+30]` | context | ні |
| StoryGenerator | `useSlotsFromStore` | `[today, today+30]` | context | ні |
| BookingFlow | вбудована логіка | `[today, today+29]` | server props | так (scoreSlots) |

---

## 🎯 ПЛАН ДЛЯ НАСТУПНОГО АГЕНТА

### Ціль
Для ОДНОГО майстра, ОДНІЄЇ послуги, СЬОГОДНІ — всі три поверхні мають показувати **ідентичні слоти** (кількість і часи).

### Рекомендований підхід: уніфікувати cache key

```typescript
// src/components/shared/wizard/helpers.ts — додати:
export function getScheduleDateRange(): { from: string; to: string } {
  const days = getDays(30);
  return { from: toISO(days[0]), to: toISO(days[days.length - 1]) };
}
```

Всі три компоненти викликають цю функцію → однаковий `from`/`to` → однаковий TanStack cache key `['wizard-schedule', masterId, from, to]` → **один HTTP-запит на всіх**.

### Рекомендований підхід: підключити BookingFlow до `useSlotsFromStore`

```typescript
// useBookingScheduleData.ts — замінити вбудований slots useMemo:

// OPTION A: useSlotsFromStore повертає string[], scoreSlots окремо
const rawTimes = useSlotsFromStore(dateStr, effectiveDuration, bufferMin, workingHours, scheduleStore);
// але scoreSlots потребує SlotInfo[], а не string[]...

// OPTION B: Розширити useSlotsFromStore підтримкою SlotInfo[] output
export function useSlotsFromStore(
  ...
  options?: { raw: true }
): SlotInfo[];
export function useSlotsFromStore(...): string[];

// OPTION C (найпростіше): Зберегти поточний useSlotsFromStore як є,
// але у useBookingScheduleData реплікувати ТУ САМУ логіку point-by-point
// (вже майже ідентично, але без scoreSlots це дає однакову кількість)
```

### Важливо перевірити

1. Локальна `useServices(masterId)` в StoryGenerator — замінити на загальний `useServices()` хук щоб уникнути різниці в фільтрації.
2. `workingHours` в FreeSlotsWidget — чи завжди context оновлений? Або краще server-fetch?
3. Після будь-якого фіксу — перевірити вручну: один майстер, одна послуга, сьогодні → три поверхні → ідентичні слоти.

---

## ⚠️ ВАЖЛИВІ ПРАВИЛА ДЛЯ АГЕНТА

1. **Читай `XDEV/AI_DEVELOPER.md`** перед роботою — залізне правило.
2. **Читай `XDEV/SLOTS_MAP.md`** для архітектури слотів.
3. **`getNow()`** замість `new Date()` скрізь де потрібен "поточний час".
4. **`INITIAL_SERVICES`** — fake IDs `s1-s7`. Може маскувати баги якщо real UUID не знайдений.
5. **`master_profiles.id = auth.users.id`** — PK в master_profiles є FK до auth.users.
6. **Buffer в `booking_slots.end_time` НЕ включений** — `end_time = start_time + service_duration` тільки.
7. **Vaul для drawers** — тільки `BottomSheet`, не голий framer-motion.
8. **Tailwind v4** — `@import "tailwindcss"` в globals.css, немає `tailwind.config.ts`.
9. **Lucide icons** — не передавати `style` prop, огортати `<span style={...}>`.
10. **NO OVERTHINKING** — вирішив підхід → одразу код. Дивись `memory/feedback_no_overthinking.md`.

---

## 🗂 КРИТИЧНІ ФАЙЛИ

```
src/
  lib/
    supabase/hooks/
      useWizardSchedule.ts         ← data fetcher (Supabase)
      useSlotsFromStore.ts         ← shared hook (НОВИЙ)
    utils/
      smartSlots.ts                ← core engine: generateAvailableSlots
      bookingEngine.ts             ← buildOffDaySet, computeEndTime
      now.ts                       ← getNow()
  components/
    shared/wizard/
      useBookingScheduleData.ts    ← ❗ потребує уніфікації
      helpers.ts                   ← getDays, toISO, DOW
    master/dashboard/widgets/
      FreeSlotsWidget.tsx          ← dashboard
      MonthlyCalendarWidget.tsx    ← calendar (rewrite)
      StatsMosaicWidget.tsx        ← stats bento
    master/marketing/
      StoryGenerator.tsx           ← story поверхня
    public/
      PublicMasterPage.tsx         ← передає masterId та workingHours до BookingWizard
  app/
    (master)/dashboard/marketing/
      page.tsx                     ← searchParams.mode → initialMode
    [slug]/
      page.tsx                     ← server-fetch master data
XDEV/
  TASK.md                          ← детальна задача зі статусом
  SLOTS_MAP.md                     ← архітектура слотів
  AI_DEVELOPER.md                  ← залізні правила
  SYSTEM_MAP.md                    ← технічний індекс
```
