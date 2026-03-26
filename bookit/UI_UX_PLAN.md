# UI_UX_PLAN.md — Bookit Frontend Audit & Implementation Plan

> Аналіз 8 беклог-пунктів + глибокий frontend аудит.
> **ФАЗА 1 — документування.** Код не пишеться.

---

## 🎯 Наданий беклог (технічно розписаний)

---

### 1.1 — «Ваш профіль ідеальний» → кнопка замість X

**Файл:** `src/components/master/dashboard/ProfileStrengthWidget.tsx`

**Поточний стан:**
- При `strength === 100` → celebration animation (confetti overlay, scale bounce, 2800ms)
- Після анімації показується success banner з X-кнопкою dismiss (`onClick: setCelebrated(true)`)
- `localStorage.setItem('bookit_strength_celebrated', 'true')` зберігає стан
- X кнопка є єдиним способом dismiss

**Фікс:**
```tsx
// Замінити X-dismiss на primary CTA кнопку:
// Перед:
<button onClick={handleDismiss} className="...">
  <X className="w-4 h-4" />
</button>

// Після: кнопка замість іконки
<motion.button
  onClick={handleDismiss}
  whileTap={{ scale: 0.96 }}
  className="mt-3 w-full bg-[#789A99] hover:bg-[#5C7E7D]
             text-white text-sm font-medium rounded-2xl py-2.5 px-4
             transition-colors"
>
  Вперед, до роботи →
</motion.button>
```

**Що зберігається:** `localStorage.setItem('bookit_strength_celebrated', 'true')` — без змін.

---

### 1.2 — Верхні 3 блоки (Записи, Виручка, Клієнти) — однакова висота

**Файл:** `src/components/master/dashboard/StatsStrip.tsx`

**Поточний стан:**
```tsx
<div className="grid grid-cols-3 gap-3">
  {stats.map((s, i) => (
    <div className="bento-card p-4"> {/* висота = контент */}
```
Висота кожного блоку визначається контентом → при різному тексті (довгий підпис виручки vs короткий) → різна висота.

**Фікс:**
```tsx
// 1. Додати items-stretch до grid:
<div className="grid grid-cols-3 gap-3 items-stretch">

// 2. Кожна картка — flex col з justify-between:
<div className="bento-card p-4 flex flex-col justify-between min-h-[96px]">
  {/* іконка + значення */}
  <div>
    <div className="icon-wrapper" />
    <p className="text-xl font-bold">{value}</p>
  </div>
  {/* label + sublabel — завжди внизу */}
  <div>
    <p className="text-xs text-[#A8928D]">{label}</p>
    <p className="text-xs text-[#A8928D]">{sub}</p>
  </div>
</div>

// 3. Синхронізувати skeleton — теж min-h-[96px]
```

**Tailwind класи:** `items-stretch`, `min-h-[96px]`, `flex flex-col justify-between`

---

### 1.3 — Блок «Записи» — 3-рівневий toggle + calendar + stats view

**Файл:** `src/components/master/dashboard/TodaySchedule.tsx`

**Поточний стан:** 3 text-tabs (Сьогодні | Завтра | Тиждень), рядковий список записів. Вже є `view: 'today' | 'tomorrow' | 'week'`.

**Архітектура після фіксу:**

```
┌─────────────────────────────────────┐
│ [Сьогодні] [Завтра] [Тиждень]  ← date picker (існуючий, без змін)
│ ────────────────────────────────── │
│ [≡ Список] [📅 Календар] [📊 Стат] ← новий 3-рівневий toggle
│                                     │
│  [ вміст залежно від viewMode ]     │
└─────────────────────────────────────┘
```

**Новий стан:**
```tsx
const [viewMode, setViewMode] = useState<'list' | 'calendar' | 'stats'>('list');
```

**ViewMode toggle компонент:**
```tsx
// Sliding pill toggle (як сегментований контрол):
<div className="flex bg-[#F5E8E3]/60 rounded-2xl p-0.5 gap-0.5 mx-4 mt-3">
  {(['list', 'calendar', 'stats'] as const).map((mode) => (
    <button
      key={mode}
      onClick={() => setViewMode(mode)}
      className="relative flex-1 flex items-center justify-center gap-1.5
                 py-1.5 text-xs font-medium rounded-xl transition-colors z-10"
    >
      {viewMode === mode && (
        <motion.div
          layoutId="viewModePill"
          className="absolute inset-0 bg-white rounded-xl shadow-sm"
        />
      )}
      <span className="relative z-10">
        {mode === 'list' ? '≡ Список' : mode === 'calendar' ? '📅 Календар' : '📊 Статистика'}
      </span>
    </button>
  ))}
</div>
```

**calendar view — `<BookingMiniCalendar />`:**
```tsx
// Новий компонент (в окремому файлі або внутрі TodaySchedule):
// grid grid-cols-7 — 7 колонок (Пн-Нд)
// Для кожного дня місяця: number + dot-індикатор (кількість записів)
// Dot: якщо 0 — нема, 1 — маленький •, 2+ — більший ••
// Кліп по поточному місяцю
// При тапі на день → setSelectedDate(date) → фільтрує список записів нижче

// Дані: отримати з useWeeklyOverview або передати окремо
// Кольори: день = сьогодні → bg-[#789A99] text-white; вибраний → ring-2 ring-[#789A99]
```

**stats view — `<BookingStatsPanel />`:**
```tsx
// Компактна статистика (4 карточки 2×2 grid):
// • Записів сьогодні / за тиждень
// • Виручка сьогодні / за тиждень
// • Найпопулярніша послуга (назва + кількість)
// • Заповненість % (записи / доступні слоти × 100)
// Дані беремо з useDashboardStats (вже є)
```

**Tailwind:** `grid grid-cols-7`, `motion.div` з `layoutId="viewModePill"` (Framer Motion shared layout)

---

### 1.4 — Touch tooltips на графіках (мобільна версія)

**Файли:**
- `src/components/master/dashboard/WeeklyOverview.tsx`
- `src/components/master/analytics/AnalyticsPage.tsx`

**Проблема:** Radix UI `<Tooltip>` прив'язаний до `hover` events (`mouseenter`/`mouseleave`). На мобільних пристроях `hover` не спрацьовує, тому tooltips недоступні на touch.

**Патерн фіксу (touch-toggle):**

```tsx
// State для активного бару:
const [activeBar, setActiveBar] = useState<number | null>(null);

// Dismiss при кліку поза баром:
useEffect(() => {
  const dismiss = () => setActiveBar(null);
  document.addEventListener('click', dismiss);
  return () => document.removeEventListener('click', dismiss);
}, []);

// На кожному барі — комбо mouse+touch:
<div
  className="relative flex-1 flex flex-col items-center justify-end h-full cursor-pointer"
  onClick={(e) => { e.stopPropagation(); setActiveBar(activeBar === i ? null : i); }}
  onMouseEnter={() => setActiveBar(i)}
  onMouseLeave={() => setActiveBar(null)}
>
  {/* Tooltip — conditional render (не Radix) */}
  <AnimatePresence>
    {activeBar === i && (
      <motion.div
        initial={{ opacity: 0, y: 4, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 4, scale: 0.95 }}
        transition={{ duration: 0.15 }}
        onClick={(e) => e.stopPropagation()}
        className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2
                   bg-white/90 backdrop-blur-xl rounded-2xl px-3 py-2
                   shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-white/70
                   whitespace-nowrap z-20 pointer-events-none"
      >
        <p className="text-xs font-semibold text-[#2C1A14]">{day.label}</p>
        <p className="text-xs text-[#6B5750]">{day.bookings} записів</p>
        <p className="text-xs text-[#789A99] font-medium">{day.revenue} ₴</p>
        {/* Arrow */}
        <div className="absolute top-full left-1/2 -translate-x-1/2
                        border-4 border-transparent border-t-white/90" />
      </motion.div>
    )}
  </AnimatePresence>
  {/* Bar */}
  <motion.div className="w-full rounded-t-xl" style={{ height: barH }} />
</div>
```

**WeeklyOverview.tsx:** замінити `<Tooltip>` обгортки на цей патерн.

**AnalyticsPage.tsx — два місця:**
1. **BarChart (місячна виручка)** — tooltips відсутні взагалі. Додати той самий touch-toggle патерн з даними: `month`, `bookings`, `revenue`.
2. **DowChart (день тижня)** — є Radix `<Tooltip>`. Замінити на touch-toggle. Дані: `day`, `pct%`, `revenue`.

---

### 1.5 — «Швидкі дії» → 6 елементів

**Файл:** `src/components/master/dashboard/QuickActions.tsx`

**Поточний стан:** `grid grid-cols-3 gap-2` — 3 кнопки в одному рядку.

**Фікс — 6 кнопок, 2 рядки:**
```tsx
// Grid не змінюється — автоматично 2 рядки при 6 дітях:
<div className="grid grid-cols-3 gap-2">
  {actions.map(...)} {/* 6 елементів */}
</div>
```

**Порядок кнопок (2 рядки × 3):**
```
[➕ Новий запис]  [✂️ Послуги]   [👥 Клієнти]
[📊 Аналітика]   [📅 Записи]   [⚙️ Налаштування]
```

**Нові 3 кнопки:**
```tsx
{ icon: Scissors,    label: 'Послуги',       href: '/dashboard/services',  color: '#6B5750' },
{ icon: Users,       label: 'Клієнти',        href: '/dashboard/clients',   color: '#6B5750' },
{ icon: CalendarDays,label: 'Записи',         href: '/dashboard/bookings',  color: '#6B5750' },
```

**Стиль нових кнопок** (аналогічний існуючим secondary):
```tsx
className="w-11 h-11 rounded-2xl bg-white/70 border border-[#E8D5CF]/60
           flex items-center justify-center shadow-sm"
```

---

### 1.6 — Розділ «Ще» → окрема bento-сторінка

**Нові файли:**
```
src/app/(master)/dashboard/more/page.tsx     (server wrapper)
src/components/master/more/MorePage.tsx      (client component)
```

**Зміни у FloatingSidebar.tsx:**
```tsx
// Прибрати з nav items:
// - /dashboard/flash    (Zap)
// - /dashboard/pricing  (TrendingUp)
// - /dashboard/loyalty  (Gift)
// - /dashboard/referral (Share2)
// - /dashboard/studio   (Building2)
// - /dashboard/billing  (CreditCard)

// Додати один пункт:
{ href: '/dashboard/more', icon: MoreHorizontal, label: 'Ще' }
```

**MorePage.tsx — Bento Grid (нестандартний):**

```tsx
// Mobile: 6 колонок, нестандартні span-и
<div
  className="grid gap-3"
  style={{ gridTemplateColumns: 'repeat(6, 1fr)' }}
>
  {/* Флеш-акції — великий блок (4/6 ширини, 2 рядки висоти) */}
  <Link href="/dashboard/flash"
    className="bento-card p-5 col-span-4 row-span-2 flex flex-col justify-between">
    <div className="w-11 h-11 rounded-2xl bg-[#D4935A]/12 flex items-center justify-center">
      <Zap className="w-5 h-5 text-[#D4935A]" />
    </div>
    <div>
      <p className="heading-serif text-base">Флеш-акції</p>
      <p className="text-xs text-[#A8928D] mt-0.5">Швидкі знижки для заповнення розкладу</p>
    </div>
    {/* Preview: активні deals count badge */}
  </Link>

  {/* Ціноутворення — середній (2/6 ширини, 2 рядки) */}
  <Link href="/dashboard/pricing"
    className="bento-card p-4 col-span-2 row-span-2 flex flex-col justify-between">
    <TrendingUp className="w-5 h-5 text-[#789A99]" />
    <div>
      <p className="font-semibold text-sm">Ціноутворення</p>
      <p className="text-[10px] text-[#A8928D]">Динамічні ціни</p>
    </div>
  </Link>

  {/* Лояльність — напівширокий (3/6) */}
  <Link href="/dashboard/loyalty" className="bento-card p-4 col-span-3">
    <Gift className="w-5 h-5 text-[#789A99] mb-2" />
    <p className="font-semibold text-sm">Лояльність</p>
  </Link>

  {/* Відгуки — напівширокий (3/6) */}
  <Link href="/dashboard/reviews" className="bento-card p-4 col-span-3">
    <MessageSquare className="w-5 h-5 text-[#5C9E7A] mb-2" />
    <p className="font-semibold text-sm">Відгуки</p>
  </Link>

  {/* Реферал — вертикальний (2/6, 2 рядки) */}
  <Link href="/dashboard/referral" className="bento-card p-4 col-span-2 row-span-2 flex flex-col justify-between">
    <Share2 className="w-5 h-5 text-[#789A99]" />
    <div>
      <p className="font-semibold text-sm">Реферал</p>
      <p className="text-[10px] text-[#A8928D]">Запроси друга</p>
    </div>
  </Link>

  {/* Студія — широкий з badge "Скоро" (4/6) */}
  <Link href="/dashboard/studio" className="bento-card p-4 col-span-4 flex items-center gap-3">
    <div className="w-10 h-10 rounded-2xl bg-[#789A99]/12 flex items-center justify-center">
      <Building2 className="w-5 h-5 text-[#789A99]" />
    </div>
    <div>
      <p className="font-semibold text-sm">Студія</p>
      <p className="text-[10px] text-[#A8928D]">Команда майстрів</p>
    </div>
    <span className="ml-auto text-[10px] bg-[#789A99]/12 text-[#789A99]
                     rounded-full px-2 py-0.5 font-medium">Скоро</span>
  </Link>

  {/* Тариф — повний рядок (6/6) з поточним планом */}
  <Link href="/dashboard/billing" className="bento-card p-4 col-span-6 flex items-center gap-3">
    <CreditCard className="w-5 h-5 text-[#6B5750]" />
    <div className="flex-1">
      <p className="font-semibold text-sm">Тарифний план</p>
      <p className="text-xs text-[#A8928D]">Поточний: {tier}</p>
    </div>
    <ChevronRight className="w-4 h-4 text-[#A8928D]" />
  </Link>
</div>
```

---

### 1.7 — Редизайн Flash / Pricing / Loyalty

#### 1.7a — Flash Deals (`src/components/master/flash/FlashDealPage.tsx`)

**Проблема:** Використовує стандартні Tailwind amber кольори (`bg-amber-*`, `text-amber-*`) що виходять за дизайн-систему.

**Заміни:**
```
bg-amber-100        → bg-[#D4935A]/12
text-amber-600      → text-[#D4935A]
bg-amber-50         → bg-[#D4935A]/8
bg-amber-500        → bg-[#D4935A]
hover:bg-amber-600  → hover:bg-[#C07840]
border-amber-200    → border-[#D4935A]/20
text-amber-700      → text-[#B07030]
```

**Структурні зміни:**
- Форма-контейнер: `bg-white rounded-2xl border border-[#E8D5CF]/60` → `.bento-card`
- Список активних deals: `bg-amber-50` → `.bento-card p-4`
- Кнопки expiry (4h/8h/2h): залишити поточний стиль, змінити active state: `bg-[#D4935A] text-white` замість `bg-amber-500`

#### 1.7b — Dynamic Pricing (`src/components/master/pricing/DynamicPricingPage.tsx`)

**Проблема:** Info banner використовує `bg-blue-50 border-blue-100`.

**Заміна:**
```tsx
// Перед:
<div className="bg-blue-50 rounded-2xl border border-blue-100 p-4 flex gap-3">
  <Info className="text-blue-500" />
  <p className="text-blue-700 text-sm">...</p>
</div>

// Після:
<div className="bg-[#789A99]/8 rounded-2xl border border-[#789A99]/20 p-4 flex gap-3">
  <Info className="text-[#789A99] w-4 h-4 flex-shrink-0 mt-0.5" />
  <p className="text-[#6B5750] text-sm">...</p>
</div>
```

**Все інше** (Peak/Quiet/Early bird/Last minute sections) — відповідає дизайн-системі, не чіпаємо.

#### 1.7c — Loyalty (`src/components/master/loyalty/LoyaltyPage.tsx`)

**Проблема:** Form має агресивний бордер `border-2 border-[#789A99]/30`.

**Фікс:**
```tsx
// Форма (контейнер при активному редагуванні):
// Перед:
className="bento-card p-5 border-2 border-[#789A99]/30"

// Після:
className="bento-card p-5 ring-1 ring-[#789A99]/25 ring-inset"
```

**Порожній стан — додати ілюстрацію:**
```tsx
// Перед: просто текст
// Після:
<div className="bento-card p-8 flex flex-col items-center text-center gap-3">
  <div className="w-16 h-16 rounded-full bg-[#789A99]/10 flex items-center justify-center">
    <Gift className="w-8 h-8 text-[#789A99]" strokeWidth={1.5} />
  </div>
  <p className="font-semibold text-[#2C1A14]">Програм лояльності поки немає</p>
  <p className="text-sm text-[#A8928D]">Створіть першу програму і клієнти повертатимуться знову</p>
</div>
```

---

### 1.8 — Стабілізація онбординг-підказок

**Проблема:** Підказки з'являються після кожного жорсткого перезавантаження сторінки.

**Root cause — дві незалежні системи підказок:**

1. **`WelcomeHints`** (`src/components/master/dashboard/WelcomeHints.tsx`) — 2 підказки після онбордингу (`bookit_hints_pending`)
2. **`DashboardTourContext`** (`src/components/master/dashboard/DashboardTourContext.tsx`) — 3 кроки dashboard tour (`dashboardTourComplete`)

#### Фікс 1 — WelcomeHints

**Проблема:** `bookit_hints_pending` = 'true' залишається в LS якщо user перезавантажує між першим і другим hint.

```tsx
// src/components/master/dashboard/WelcomeHints.tsx
export function WelcomeHints() {
  const [hints, setHints] = useState<Hint[]>([]);

  useEffect(() => {
    if (localStorage.getItem('bookit_hints_pending') !== 'true') return;

    // ✅ Одразу прибираємо з LS — будь-який наступний refresh не перезапустить
    localStorage.removeItem('bookit_hints_pending');

    // Подальший стан зберігаємо ТІЛЬКИ в useState
    const t = setTimeout(() => setHints(HINTS), 1200);
    return () => clearTimeout(t);
  }, []);

  // ... решта логіки без змін
}
```

#### Фікс 2 — DashboardTourContext

**Проблема:** Якщо user робить hard refresh поки tour в прогресі (tourStep = 0 або 1 і ще не натиснув X), LS_KEY не встановлено → tour перезапускається.

```tsx
// src/components/master/dashboard/DashboardTourContext.tsx
const LS_KEY = 'dashboardTourComplete';

useEffect(() => {
  if (localStorage.getItem(LS_KEY) === 'true') return;

  // ✅ Встановити 'in-progress' одразу при mount
  // Це запобігає повторному запуску при hard refresh
  if (!localStorage.getItem(LS_KEY)) {
    localStorage.setItem(LS_KEY, 'in-progress');
  }

  const t = setTimeout(() => setTourStep(0), 1000);
  return () => clearTimeout(t);
}, []);

// closeTour (X кнопка або "Завершити"):
function closeTour() {
  setTourStep(-1);
  localStorage.setItem(LS_KEY, 'true'); // overwrite 'in-progress'
}
```

---

## 🔍 Додаткові UI/UX проблеми (аудит frontend)

### 🔴 Критично

**A. Touch-недоступні tooltips на графіках**
- `WeeklyOverview.tsx` — Radix `<Tooltip>` hover-only (вже в п. 1.4)
- `AnalyticsPage.tsx` — DowChart: Radix Tooltip; BarChart (місячний): взагалі немає tooltip
- **Наслідок:** 90%+ користувачів на мобільних не бачать дані при натисканні на графік


---

### 🟡 Важливо

**C. Inconsistent `.bento-card` usage**
Деякі контейнери у Flash і Pricing використовують ручний `bg-white rounded-2xl border border-[#E8D5CF]/60` замість `.bento-card`. Результат: відсутній `backdrop-blur`, інший shadow, border товщина відрізняється.

| Файл | Проблемне місце |
|---|---|
| `FlashDealPage.tsx` | Форма-контейнер, список deals |
| `DynamicPricingPage.tsx` | Info banner |

**D. StatsStrip skeleton ≠ StatsStrip**
При завантаженні skeleton показує 3 картки без `items-stretch` і `min-h` → після завантаження висота стрибає. Skeleton і реальний компонент мають бути ідентичної структури.

**E. AnalyticsPage BarChart без tooltip**
Місячний графік виручки (`monthStats`) не має жодного hover/touch feedback. Користувач натискає на бар — нічого. Потрібен той самий touch-toggle патерн (п. 1.4).

**F. TodaySchedule week view — порожній стан**
При view='week' і 0 записів показується generic empty state без підказки "Хочеш додати перший запис?". Порівняно з today view (де є `EmptyScheduleWidget` зі статистикою вчора) — week view бідніший.

**G. Flash empty state**
При відсутності активних deals: просто `<Zap>` іконка і текст. Немає CTA кнопки "Створити першу акцію" яка б розгортала форму.

**H. QuickActions — немає skeleton**
6 кнопок завантажуються без placeholder. Після додавання 6 елементів варто додати `animate-pulse` skeleton (6 сірих прямокутників).

---

### 🔵 Покращення

**I. Неконсистентні вхідні анімації**
- `StatsStrip`: `delay: i * 0.07` (stagger effect) ✅
- `WeeklyOverview`: немає вхідної анімації ❌
- `QuickActions`: `whileTap` є, вхідна — немає ❌
- `TodaySchedule`: `AnimatePresence` для item list ✅

Рекомендація: уніфікувати через `motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}` з `delay: i * 0.05` для всіх bento cards.

**J. ProfileStrengthWidget completion steps**
Список кроків (місто, телефон, соцмережі, портфоліо, bio) — plain flex list. Можна додати:
- `motion.div` slide-in при появі
- `CheckCircle` іконка замість `Circle` при виконанні кроку

**K. WeeklyOverview — немає "сьогодні" label**
Поточний день виділений кольором `#789A99`, але без текстової позначки "Сьогодні" — неочевидно для нового користувача. Додати `text-[9px] font-semibold` badge або підкреслення.

**L. Відсутність `loading.tsx` для основного dashboard**
`src/app/(master)/dashboard/loading.tsx` — новий файл (є у git status як `??`), але чи покриває він всі стани завантаження?

---

## 📋 Суворий покроковий план виконання

> Правило: **1 крок за 1 раз**. Після кожного кроку — `npm run build`.

| Крок | Назва | Файли | Складність | Час |
|---|---|---|---|---|
| **1** | Стабілізація tour/hints | `WelcomeHints.tsx` + `DashboardTourContext.tsx` | S | 15хв |
| **2** | Кнопка у ProfileStrengthWidget | `ProfileStrengthWidget.tsx` | S | 10хв |
| **3** | StatsStrip `items-stretch` | `StatsStrip.tsx` | S | 10хв |
| **4** | QuickActions — 6 елементів | `QuickActions.tsx` | S | 15хв |
| **5** | Touch tooltips у WeeklyOverview | `WeeklyOverview.tsx` | M | 30хв |
| **6** | Touch tooltips у AnalyticsPage | `AnalyticsPage.tsx` (BarChart + DowChart) | M | 45хв |
| **7** | Pricing info banner redesign | `DynamicPricingPage.tsx` | S | 10хв |
| **8** | Loyalty form + empty state polish | `LoyaltyPage.tsx` | S | 20хв |
| **9** | Flash redesign (amber → design system) | `FlashDealPage.tsx` | M | 40хв |
| **10** | TodaySchedule — 3-рівневий toggle | `TodaySchedule.tsx` | L | 90хв |
| **11** | «Ще» bento-сторінка | `more/page.tsx` + `MorePage.tsx` + `FloatingSidebar.tsx` | L | 90хв |
| **BUILD** | Фінальна перевірка | `npm run build` | — | — |

**Пріоритети:**
- **Кроки 1–4** — швидкі S-задачі, починаємо з них (разом ~50хв)
- **Кроки 5–6** — критичні для мобільного UX
- **Кроки 7–9** — design system consistency
- **Кроки 10–11** — складні L-задачі, найбільший user impact

---

## Технічні обмеження

- **Mobile-first абсолютний пріоритет** — всі рішення перевіряються на 375px viewport
- **Не ламаємо state management** — TanStack Query queryKeys, Zustand stores, useDashboardStats — без змін
- **Framer Motion** — єдина бібліотека для анімацій (вже встановлена)
- **Radix UI Tooltip** у touch-пунктах замінюємо на custom conditional render (не видаляємо Radix — він є в інших місцях)
- **Tailwind v4** — без `tailwind.config.ts`, тільки CSS-first config
- **Lucide React** — єдина іконна бібліотека, ніяких нових іконних пакетів
