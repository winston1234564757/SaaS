# Summary: Редизайн сторінки аналітики (Analytics) в BookIT

Цей документ містить систематизоване резюме обговорення з файлу [chat.md](file:///C:/Users/Vitossik/SaaS/chat.md) щодо комплексного редизайну та технічної перебудови сторінки аналітики CRM BookIT.

---

## 1. Поточний стан та аудити

### Impeccable UI/UX Audit
* **Оцінка:** 54/80 (C) — найглибша сторінка по даних, але найгірша по дисципліні дизайну.
* **Обсяг:** 5 файлів (1 route, 1 loading, 1 dynamic loader, 1 component на 991 рядок, 1 hook на 451 рядок).
* **Основні порушення:**
  * **P0:** 13 випадків використання `div` замість `button` на інтерактивних елементах графіків (`DowChart` та `MonthBarChart`).
  * **P1:** 12 кнопок без атрибута `type="button"`.
  * **P1:** Hardcoded hex-кольори (#789A99, #D4935A, #5C9E7A) замість CSS-змінних.
  * **P1:** 7 порушень політики No-Emoji (використання емодзі замість іконок Lucide).
  * **P1:** Графіки не мають `aria-label` / `aria-pressed`.
  * **P2:** Малі touch-targets (<44px) для навігації по датах.
  * **P3:** Монолітний 991-рядковий компонент, що містить inline-компоненти: `MonthBarChart`, `DowChart`, `ServiceRow`, `ProUpgradeCard`.

### Playwright Audit
* **Специфікація:** [audit.07-analytics.spec.ts](file:///C:/Users/Vitossik/SaaS/bookit/e2e/audit/audit.07-analytics.spec.ts) (5 тестів).
* **Покриття:** Завантаження графіків (desktop 1440x900), перемикання фільтрів/табів (Revenue, Top, Retention), робота Date range picker, mobile адаптація (375x812), A11y перевірки (`checkA11y`).
* **Особливість:** Знімки екрана зберігаються для трьох тем: **Blossom (Light)**, **Studio (Dark)** та **Frost (Ice)**.

### Спільний план інтеграції (Fix Report #4)
* **Проблема:** Тести змішують моделі валідації на сторінках, що залежать від тарифного плану (Plan-aware testing).
* **Рішення:**
  * Зафіксувати ліміти тарифів (Starter/Pro/Trial) для тестових акаунтів.
  * Розділити перевірки інтерфейсу (для Starter показувати заглушку-gate, для Pro — повний UI).
  * Стабілізувати завантаження даних (додати wait-хелпери, детермінований посів даних).
  * Винести важкі тести під тег `@analytics-heavy`.

---

## 2. Концепція дизайну: "Editorial Bento" (Варіант β)

Замість простого списку чи стандартних нудних дашбордів обрано преміальний асиметричний Bento Grid з інтеграцією наративних Stories.

### Структура сторінки (зверху вниз):
1. **Top Bar:** Елементи керування періодом (Date picker), кнопка «Сьогодні», оновлення та експорт.
2. **Hero Story:** Full-width картка зверху (висота ~h-56). Реалізується як **Dynamic Island** (morphing chip ↔ full story) з автоматичною ротацією (progress bar, 8s) або swipe-stack. Містить наративні інсайти:
   * *Приклад:* "+18% виручки vs минулий тиждень. Стрижка гарячий ніж очолила продажі. 2 VIP клієнти не повертались 50+ днів."
3. **KPI Ticker:** Горизонтальна стрічка інтерактивних pills (Revenue, Bookings, Active clients) замість класичних карток.
4. **Primary Bento (4 великі картки):**
   * 6-місячний графік виручки + прогноз (суміщений)
   * Теплова карта зайнятості (Occupancy heatmap: hour × day grid)
   * Когортна матриця утримання клієнтів (Cohort retention matrix: signup × return)
   * Картка аномалій (Anomaly alerts) з breathing-статусом
5. **Secondary Bento (Асиметрична сітка 2x3):**
   * LTV concentration / Win-back candidates
   * Service pairing (що найчастіше бронюють разом)
   * Goal Progress (кільце прогресу місячної цілі)
   * Dynamic pricing uplift (Smart Pricing ROI)
   * Flash deals performance (conversion lift)
   * Broadcast engagement (sent/opened/converted)
6. **Growth Lists (В одній картці з роздільником `divide-y`):**
   * Loyalty members
   * Referral funnel
7. **Drill-Down Tabs (Вкладки внизу сторінки для глибокого аналізу):**
   * *Reviews/NPS* (рейтинг та NPS)
   * *No-show / Cancellation rate*
   * *Booking lead time* (за скільки днів бронюють)
   * *Vacation impact* (втрачена виручка через відпустки)
   * *Source attribution* (джерела трафіку: Instagram, Telegram, direct)

---

## 3. Нова архітектура файлів (v2)

Монолітний файл `AnalyticsPage.tsx` розділяється на **27 фокусних файлів** (кожен ≤ 250 LOC). Графіки будуються на **чистому SVG** для збереження унікального editorial-стилю та уникнення шаблонного вигляду Recharts.

```text
src/components/master/analytics/
├── page.tsx                           # (Server Component, оркестратор верхнього рівня)
├── AnalyticsClientLoader.tsx          # (Client Loader з ssr:false)
├── AnalyticsPage.tsx                  # Тонкий оркестратор (~200 LOC, composition & fetch)
│
├── sections/                          # Секції Bento та вкладки
│   ├── HeroStory.tsx                  # Stories з авто-ротацією та морфінгом
│   ├── KpiTicker.tsx                  # Горизонтальний тікер
│   ├── RevenueChart.tsx               # Основний графік виручки
│   ├── OccupancyHeatmap.tsx           # Карта зайнятості
│   ├── CohortMatrix.tsx               # Матриця когорт
│   ├── AnomalyAlert.tsx               # Сповіщення про аномалії
│   ├── GoalProgress.tsx               # Кільце цілей
│   ├── BentoSecondary.tsx             # Асиметрична сітка (6 метрик)
│   ├── GrowthLists.tsx                # Списки Loyalty + Referral
│   ├── PeriodControls.tsx             # Керування датами
│   ├── TabsSwitcher.tsx               # Перемикач вкладок
│   └── tabs/                          # 5 Drill-down вкладок (lazy load)
│       ├── ReviewsTab.tsx
│       ├── NoShowTab.tsx
│       ├── LeadTimeTab.tsx
│       ├── VacationTab.tsx
│       └── SourceTab.tsx
│
├── primitives/                        # Перевикористовувані компоненти
│   ├── BentoCell.tsx                  # Обгортка комірки bento (tall|wide|square)
│   ├── StoryCard.tsx                  # Картка для сторіз з прогрес-баром
│   ├── KpiPill.tsx                    # Елемент тікера
│   ├── ListRow.tsx                    # Рядок списку з анімацією
│   ├── SkeletonCell.tsx               # Адаптивний скелетон
│   ├── EmptyCell.tsx                  # Красивий Empty State з дією
│   ├── ErrorCell.tsx                  # Помилка комірки з кнопкою повтору
│   ├── StatusDot.tsx                  # Breathing пульсуючий індикатор
│   └── Button.tsx                     # Кнопка з тактильним active:scale-[0.95]
│
└── charts/                            # Легкі кастомні SVG-графіки
    ├── RevenueLineChart.tsx           # SVG-графік виручки
    ├── HeatmapGrid.tsx                # SVG-сітка для теплової карти
    ├── CohortHeatmap.tsx              # SVG-матриця когорт
    ├── LtvHistogram.tsx               # SVG-гістограма розподілу LTV
    ├── ServicePairingMatrix.tsx       # Custom SVG pairing chart
    ├── ChannelDonut.tsx               # SVG пончик для джерел
    └── ForecastBarChart.tsx           # SVG-стовпчики прогнозу
```

### Принципи побудови інтерфейсу:
* **Анімації:** Використання Framer Motion з єдиним spring-конфігом: `stiffness: 100, damping: 20` для відчуття "важливості" та преміальності.
* **Perpetual motion:** Пульсації та дихання індикаторів ізолюються в окремих Client Components з `React.memo` та `useMotionValue` (без useState) для уникнення re-render cascade.
* **Skeleton matching:** Скелетони точно відповідають розмірам відповідних Bento-комірок.

---

## 4. Потік даних (Data Flow)

### 1 Mega-RPC замість 17 запитів
Для уникнення RLS-перевантаження, зайвих Auth-перевірок та затримок на мобільних пристроях, створюється **одна SQL-функція**, яка виконує агрегацію на рівні Postgres і повертає згрупований JSONB.

```sql
CREATE OR REPLACE FUNCTION get_analytics_extras(
  p_master_id  UUID,
  p_start_date DATE,
  p_end_date   DATE,
  p_is_pro     BOOLEAN,
  p_scope      TEXT DEFAULT 'all'
) RETURNS JSONB;
```

### Клієнтський хук: `useAnalyticsExtras`
Дані кешуються на 5 хвилин за допомогою TanStack Query.
```typescript
export function useAnalyticsExtras({ start, end, isPro, scope = 'all', enabled = true }) {
  return useQuery({
    queryKey: ['analytics-extras', masterId, start, end, isPro, scope],
    queryFn: async () => { ... },
    staleTime: 5 * 60_000,
    gcTime: 15 * 60_000,
  });
}
```

* **Drill-down вкладки** завантажуються **ліниво (lazy)** через окремі хуки при монтуванні відповідної вкладки (`useReviewsMetrics`, `useNoShowMetrics` тощо).
* **Ізоляція помилок:** Кожна bento-комірка огортається в `ErrorBoundary` та `Suspense`. Якщо одна метрика падає, решта інтерфейсу продовжує працювати, показуючи локальний `ErrorCell` з кнопкою ретраю.
* **Тарифи (Starter vs Pro):** Мега-RPC повертає `null` для Pro-метрик, якщо користувач на Starter-тарифі. Клієнтська комірка перевіряє це та рендерить вбудований `ProUpgradeCard`, наочно демонструючи цінність Pro-функцій.

---

## 5. Візуальна система (Visual System)

Візуальна мова аналітики адаптується під кожну з трьох тем BookIT, поєднуючи журнальну верстку (Kinfolk-style) із практичною читабельністю аналітичного хабу.

### 5.1. Тематичні токени та кастомні градієнти

Для уникнення шаблонного вигляду аналітики, колірні схеми графіків, теплових карт та Stories динамічно підлаштовуються під активну тему:

| Тема | Акцентний колір (`--accent`) | Градієнт теплової карти (Occupancy Heatmap) | Колір аномалій (Anomaly Status) | Story Accent |
| :--- | :--- | :--- | :--- | :--- |
| **Blossom** *(Light)* | `#B8732A` (amber) | `rgba(184, 115, 42, 0.1)` → `rgba(184, 115, 42, 0.8)` | `--error` (`#C04060`) | `#B8732A` |
| **Studio** *(Dark)* | `#D3A376` (gold) | `rgba(211, 163, 118, 0.1)` → `rgba(211, 163, 118, 0.9)` | `--error` (`#B04858`) | `#D3A376` |
| **Frost** *(Ice)* | `#0F172A` (slate) | `rgba(15, 23, 42, 0.05)` → `rgba(15, 23, 42, 0.8)` | `--error` (`#B91C1C`) | `#0F172A` |

* **Heatmap Grid:** Рендериться як чистий CSS-grid з напівпрозорими блоками. Стан «0% зайнятості» рендериться як `--background-deep` з мінімальною непрозорістю `opacity-20`, а «100% зайнятість» використовує максимальний акцентний градієнт.
* **Anomaly Breathing:** Breathing-індикатор статусу аномалії реалізується за допомогою CSS-анімації пульсації тіні, що не викликає re-render сторінки:
  ```css
  @keyframes breathing-alert {
    0%, 100% { transform: scale(1); opacity: 0.9; }
    50% { transform: scale(1.05); opacity: 1; box-shadow: 0 0 12px var(--error); }
  }
  ```

### 5.2. Типографічна ієрархія (Typography Scale)

Використовується комбінація акцентних дисплейних шрифтів та моноширинних числових маркерів для швидкого сканування даних:

1. **Великі числові метрики (Revenue, Bookings, Clients):**
   * Клас: `metric-value text-3xl font-semibold tracking-tight tabular-nums` (для вирівнювання чисел у колонках та запобігання візуальним стрибкам при зміні дат).
2. **Заголовки Bento-комірок:**
   * Клас: `heading-serif text-lg font-medium text-primary` на Blossom (Cormorant Garamond).
   - Для Studio / Frost: `font-geist text-md font-bold tracking-tight text-primary`.
3. **Наративні заголовки Stories (Hero):**
   - *Blossom:* `greeting-script text-4xl` (Great Vibes, елегантний курсив).
   - *Studio:* Cormorant Garamond Light, uppercase з великим міжлітерним інтервалом (`tracking-[0.18em]`).
   - *Frost:* `font-geist text-2xl font-bold tracking-tighter` (чистий технологічний SaaS).

### 5.3. Spacing System (Bento Gap Rhythm)

Сітка Bento Grid підпорядковується суворим відступам для збереження балансу між повітрям та щільністю даних:
* **Зовнішня сітка (Desktop):** `grid gap-6` (24px) для чіткого розділення великих зон.
* **Зовнішня сітка (Mobile):** `grid gap-4` (16px) для збереження корисного простору екрану.
* **Внутрішній Padding великих карток (Primary Bento):** `p-6` (24px) для вільного дихання складних чартів (Occupancy Heatmap, Revenue Line Chart).
* **Внутрішній Padding малих карток (Secondary Bento):** `p-4` (16px) для максимізації корисної площі таблиць та дрібних метрик.

### 5.4. Motion Tokens (Анімаційні переходи)

Всі мікро-взаємодії керуються єдиним набором фізики Framer Motion:

* **Spring Physics:** `const SPRING = { type: 'spring' as const, stiffness: 100, damping: 20 }` (повільний, преміальний та важкий рух).
* **Stagger Cascade:** Плавна поява Bento-комірок при завантаженні:
  ```typescript
  const containerVariants = {
    show: { transition: { staggerChildren: 0.05 } }
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: SPRING }
  };
  ```
* **Story Auto-Advance:** Стрічка Stories використовує лінійний таймер для верхнього індикатора прогресу: `animate={{ width: "100%" }} transition={{ duration: 8, ease: "linear" }}`. При кліку або свайпі стрічки відбувається миттєвий перехід на наступний слайд з анімацією `mode="popLayout"`.
* **Tab Indicator:** Ковзаючий маркер активного табу реалізовано за допомогою `layoutId="active-tab-indicator"`, що забезпечує безшовний перехід між табами при кліку.

### 5.5. Іконографіка (Lucide React)

Кожна з 12 MUST-метрик ідентифікується за допомогою строго визначеної іконки Lucide (загорнутої в `<span>` для уникнення використання забороненого пропсу `style` на іконках):

1. **Revenue / Forecast:** `<span className="text-accent"><TrendingUp size={20} /></span>`
2. **Bookings (KPI Ticker):** `<span className="text-secondary"><Calendar size={20} /></span>`
3. **Active Clients:** `<span className="text-secondary"><Users size={20} /></span>`
4. **Occupancy Heatmap:** `<span className="text-primary"><Grid size={20} /></span>`
5. **Cohort Matrix:** `<span className="text-primary"><Layers size={20} /></span>`
6. **Anomaly Alerts:** `<span className="text-destructive"><AlertTriangle size={20} /></span>`
7. **Goal Progress:** `<span className="text-success"><Target size={20} /></span>`
8. **Dynamic Pricing Uplift:** `<span className="text-accent"><Zap size={20} /></span>`
9. **Flash Deals:** `<span className="text-warning"><Flame size={20} /></span>`
10. **Broadcast Engagement:** `<span className="text-info"><Send size={20} /></span>`
11. **Loyalty Members:** `<span className="text-success"><Award size={20} /></span>`
12. **Referral Funnel:** `<span className="text-accent"><UserPlus size={20} /></span>`

---

## 6. Специфікація компонентів (Component Specs)

Усі компоненти розподілені за принципом відповідальності (Presentation vs Data fetching), мають адаптивні стани та підтримують єдиний гайдлайн анімацій.

### 6.1. Hero & Navigation

#### HeroStory (Клієнтський, `src/components/master/analytics/sections/HeroStory.tsx`)
* **Тип:** `"use client"`
* **Props:** `initialStories: StoryItem[]`
* **UX & Логіка:**
  * **Morphing State:** У згорнутому стані це компактний інтерактивний "чип" у кутку сторінки (`h-12`, округлість `rounded-full`). На клік плавно розгортається (`layout` Framer Motion) у повнорозмірну журнальну картку (`h-56`, `rounded-3xl`, `w-full`).
  * **Auto-advance:** Автоматичне перемикання кожні 8 секунд. Зверху рендериться індикатор прогресу (тонкі лінії `h-1` за кількістю слайдів). Активний слайд анімує заповнення від 0% до 100%.
  * **Swipe-stack:** Підтримує свайпи ліворуч/праворуч для ручного перемикання з анімацією `mode="popLayout"`.
  * **Starter vs Pro:** Відображає загальні бізнес-інсайти для Starter, але глибокі (LTV, аномалії, розумне ціноутворення) маркуються як Pro-інсайти з кнопкою швидкого переходу на Pro.

#### KpiTicker (Клієнтський, `src/components/master/analytics/sections/KpiTicker.tsx`)
* **Тип:** `"use client"`
* **Props:** `summary: { revenue: number, bookings: number, activeClients: number, deltas: Record<string, number> }`
* **UX & Логіка:**
  * Горизонтальна стрічка, що скролиться на мобільних пристроях (`overflow-x-auto scrollbar-hide`).
  * Складається з `KpiPill` примітивів (`active:scale-[0.95] duration-100`). Кожен пігулкоподібний елемент показує назву метрики, її поточне значення (`metric-value`) та дельту в % зі стрілочкою вгору/вниз (`TrendingUp` або `TrendingDown`).

---

### 6.2. Primary Bento Cards (4 великі картки)

#### RevenueChart (Клієнтський, `src/components/master/analytics/sections/RevenueChart.tsx`)
* **Тип:** `"use client"`
* **Props:** `chartData: RevenuePoint[], isPro: boolean`
* **UX & Логіка:**
  * Кастомний SVG-графік без використання важких бібліотек. Лінія малюється через `<path d={linePath} />`.
  * **Forecast Line:** Якщо користувач Pro, графік продовжує лінію прогнозу пунктиром (`strokeDasharray="4 4"`) на наступний місяць, розрахованим через лінійну регресію на сервері.
  * **Interactive Tooltip:** При наведенні курсору (або тачу) рендериться вертикальний маркер та спливаюче вікно з сумою виручки.
  * **Starter vs Pro:** Starter бачить тільки фактичну лінію за 3 місяці без прогнозу та порівняння YoY.

#### OccupancyHeatmap (Клієнтський, `src/components/master/analytics/sections/OccupancyHeatmap.tsx`)
* **Тип:** `"use client"`
* **Props:** `heatmapData: HeatmapCell[], isPro: boolean`
* **UX & Логіка:**
  * Сітка 7x24 (дні тижня × години роботи).
  * Кожна комірка має колірну інтенсивність відповідно до відсотка зайнятості (див. градієнти у розділі 5.1).
  * **Tooltip Matrix:** Зона за межами екрану не обрізається. Tooltip позиціонується абсолютно за допомогою `useRef` матриці та `getBoundingClientRect()`, щоб запобігти виходу за межі Bento-комірки.
  * **Starter vs Pro:** Starter бачить розмиту (blurred) сітку з накладеним оверлеєм `ProUpgradeCard`.

#### CohortMatrix (Клієнтський, `src/components/master/analytics/sections/CohortMatrix.tsx`)
* **Тип:** `"use client"`
* **Props:** `cohorts: CohortRow[], isPro: boolean`
* **UX & Логіка:**
  * Матриця retention клієнтів за місяцями реєстрації. Кожна комірка містить відсоток повернення клієнтів у місяці N після першого візиту.
  * Плавний колірний градієнт від акцентного кольору (100% повернення) до кольору фону комірки (0% повернення).
  * **Starter vs Pro:** Повністю Pro-only картка. На Starter-тарифі рендериться `ProUpgradeCard` із заголовком «Когортний аналіз повернення клієнтів» та описом цінності для довгострокового retention.

#### AnomalyAlert (Клієнтський, `src/components/master/analytics/sections/AnomalyAlert.tsx`)
* **Тип:** `"use client"`
* **Props:** `alerts: AnomalyItem[], isPro: boolean`
* **UX & Логіка:**
  * Показує список автоматичних сповіщень про відхилення показників від норми (наприклад, раптове падіння бронювань на певний день або критично низький LTV групи постійних клієнтів).
  * Поруч із критичними алертами пульсує червоний/оранжевий `StatusDot` (анімований через CSS keyframes).
  * Кожен алерт містить кнопку швидкої дії (Quick Action) — наприклад, «Запустити розсилку» або «Відкрити календар».
  * **Starter vs Pro:** На Starter показується лише 1 ознайомчий алерт, решта заблоковані.

---

### 6.3. Secondary Bento Cards (Асиметрична сітка 2x3)

#### LtvConcentration (Клієнтський, `src/components/master/analytics/sections/LtvConcentration.tsx`)
* **UX & Логіка:** Гістограма розподілу LTV клієнтів (поділ на децилі). Відображає відсоток виручки, який приносять топ-20% VIP-клієнтів. Також виводить список "Win-back candidates" (клієнти з високим LTV, які не приходили >60 днів) з кнопкою швидкого зв'язку в один клік.
* **Starter vs Pro:** Pro-only. На Starter показується статичний приклад розподілу LTV з поясненням принципу Парето 80/20.

#### ServicePairing (Клієнтський, `src/components/master/analytics/sections/ServicePairing.tsx`)
* **UX & Логіка:** Візуалізація зв'язків послуг (які послуги найчастіше бронюють разом в одному замовленні). Рендериться у вигляді топ-5 зв'язок зі смугами відсоткового співвідношення. Допомагає створювати cross-sell пропозиції.
* **Starter vs Pro:** Pro-only.

#### GoalProgress (Клієнтський, `src/components/master/analytics/sections/GoalProgress.tsx`)
* **UX & Логіка:** Standalone круговий індикатор (animated SVG ring) виконання місячного плану виручки. При натисканні відкривається inline-форма для зміни місячної цілі.
* **Starter vs Pro:** Доступно для всіх тарифів.

#### DynamicPricingUplift (Клієнтський, `src/components/master/analytics/sections/DynamicPricingUplift.tsx`)
* **UX & Логіка:** Показує фінансовий ефект від Smart Pricing (динамічного ціноутворення). Відображає сумарний додатковий дохід (uplift) у гривнях, зароблений завдяки автоматичному підвищенню цін у години пік.
* **Starter vs Pro:** Доступно для всіх, хто підключив модуль Smart Pricing.

#### FlashDealsCard (Клієнтський, `src/components/master/analytics/sections/FlashDealsCard.tsx`)
* **UX & Логіка:** Метрика ефективності гарячих пропозицій. Показує відсоток конверсії створених Flash-акцій у реальні бронювання та загальну залучену виручку.
* **Starter vs Pro:** Доступно для всіх.

#### BroadcastEngagement (Клієнтський, `src/components/master/analytics/sections/BroadcastEngagement.tsx`)
* **UX & Логіка:** Аналітика розсилок (SMS/Telegram/Push). Показує воронку: надіслано → доставлено → клікнуто → заброньовано.
* **Starter vs Pro:** Доступно для всіх.

---

### 6.4. Drill-Down Tabs (Вкладки детального аналізу)

#### ReviewsTab (Клієнтський, `src/components/master/analytics/sections/tabs/ReviewsTab.tsx`)
* **UX & Логіка:** Глибокий аналіз відгуків. NPS (Net Promoter Score) метр, графік розподілу зірок та список останніх відгуків клієнтів з можливістю швидкої відповіді.

#### NoShowTab (Клієнтський, `src/components/master/analytics/sections/tabs/NoShowTab.tsx`)
* **UX & Логіка:** Аналіз неявок (`no_show`) та скасувань. Графік тренду скасувань за днями/годинами та список проблемних клієнтів для внесення до чорного списку.

#### LeadTimeTab (Клієнтський, `src/components/master/analytics/sections/tabs/LeadTimeTab.tsx`)
* **UX & Логіка:** Гістограма розподілу часу попереднього бронювання. Допомагає зрозуміти, за скільки днів/годин клієнти зазвичай створюють записи.

#### VacationTab (Клієнтський, `src/components/master/analytics/sections/tabs/VacationTab.tsx`)
* **UX & Логіка:** Метрика «Втрачена вигода». Розраховує потенційну виручку, яку майстер міг отримати у дні відпусток чи лікарняних (на основі середнього чеку за аналогічні дні тижня).

#### SourceTab (Клієнтський, `src/components/master/analytics/sections/tabs/SourceTab.tsx`)
* **UX & Логіка:** Круговий графік атрибуції джерел запису (Instagram-посилання, Telegram-бот, сайт-візитка, прямий запис майстром).

---

## 7. Accessibility, i18n, Error & Empty States

### 7.1. Accessibility (A11y) — Стандарти доступності
* **Prefers-Reduced-Motion:** Усі CSS-анімації пульсації (`breathing-alert`, `pulse-confirmed`) та Framer Motion переходи автоматично вимикаються або спрощуються до миттєвого opacity-ефекту за допомогою медіа-запиту:
  ```css
  @media (prefers-reduced-motion: reduce) {
    * {
      animation-delay: -1ms !important;
      animation-duration: 1ms !important;
      animation-iteration-count: 1 !important;
      background-attachment: initial !important;
      scroll-behavior: auto !important;
      transition-duration: 0s !important;
      transition-delay: 0s !important;
    }
  }
  ```
* **Keyboard Navigation:**
  * Усі клікабельні Bento-комірки, Stories та елементи навігації мають `tabIndex={0}`.
  * Підтримується повна навігація клавішами `Tab` та `Shift + Tab`.
  * Дії вибору активуються через клавіші `Enter` та `Space` (наприклад, перемикання Stories слайдів, вибір дати або відкриття детальних табів).
  * Фокусний стан чітко підкреслюється токеном `:focus-visible { outline: 2px solid var(--accent); outline-offset: 4px; }`.
* **Screen Readers (Aria):**
  * SVG-графіки мають `role="img"` та детальний опис через `aria-label` (наприклад, `aria-label="Графік виручки за 6 місяців. Тенденція висхідна."`).
  * Інтерактивні стовпчики теплової карти та точки лінійного графіка отримують динамічні `aria-label` (наприклад, `aria-label="Понеділок, 14:00. Зайнятість 80%"`).
  * Для кнопок без тексту (наприклад, закриття stories або оновлення) обов'язковий атрибут `aria-label="Закрити"`.

### 7.2. Локалізація (i18n)
* **Pluralization:** Для правильного відмінювання українських слів використовується виключно вбудований хелпер `pluralUk` з `@/lib/utils/pluralUk`. Наприклад:
  * `pluralUk(bookings, 'запис', 'записи', 'записів')`
  * `pluralUk(clients, 'клієнт', 'клієнти', 'клієнтів')`
  * `pluralUk(reviews, 'відгук', 'відгуки', 'відгуків')`
* **Форматування дат:** Робота з періодами здійснюється за допомогою `date-fns/locale/uk`. Назви місяців у графіках та легендах виводяться у правильному відмінку (наприклад, *"15 червня"*, а не *"15 червень"*) та починаються з великої літери у заголовках.
* **Валюта:** Усі фінансові розрахунки відбуваються в **копійках** (integers) для уникнення проблем з плаваючою точкою (float). Форматування на клієнті додає пробіл-роздільник тисяч та знак гривні (наприклад, `156 400 ₴`).

### 7.3. Error, Empty & Loading States

#### Loading State (Skeleton Cells)
* Замість загальних кругових спінерів використовуються адаптивні скелетони `SkeletonCell`, які за розміром (`variant: tall | wide | square`) точно дублюють bento-карти.
* Вони мають плавний шиммер-ефект `skeleton-shimmer` (реалізований через CSS-градієнт), яскравість якого підлаштовується під темну тему Studio (менша непрозорість) та світлі теми.

#### Empty States (Порожні стани)
* Якщо для обраного періоду або метрики немає даних, рендериться компонент `EmptyCell`.
* Порожній стан містить:
  1. Лаконічну SVG-ілюстрацію (наприклад, пустий календар або графік без ліній) у тонах теми.
  2. Текст-підказку, яка пояснює причину порожнечі та дає пораду (наприклад, *"У цьому місяці ще не було записів"*).
  3. Actionable CTA (Call-To-Action) кнопку, яка спонукає користувача виконати дію для наповнення даними (наприклад, *"Запросити першого клієнта"* або *"Налаштувати графік роботи"*).

#### Error Isolation (Локалізація помилок)
* Кожна Bento-комірка огортається у власний `ErrorBoundary`.
* У разі помилки в одній метриці (наприклад, збій при розрахунку когортного аналізу на сервері), решта дашборду продовжує працювати без збоїв.
* Замість зламаного блоку користувач бачить компонент `ErrorCell`, який лаконічно повідомляє про збій і містить кнопку *"Спробувати знову"*, що викликає локальний `refetch()` конкретного запиту через TanStack Query.


