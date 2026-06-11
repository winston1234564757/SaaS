# P4 — Desktop Layout Adaptations (9 сторінок)

> Трекер: [00_TRACKER.md](./00_TRACKER.md)  
> Трек: P4 (виконати після P1/P2/P3)

---

## Загальні правила для всіх desktop адаптацій

- **Breakpoint:** `lg:` (1024px+) для двоколонкових layouts
- **Grid:** `lg:grid-cols-2` або `lg:grid-cols-3` залежно від контенту
- **Sidebar:** DashboardLayout надає sidebar — сторінки мають використовувати весь доступний контент-простір
- **No navbar duplication:** якщо є власний navbar всередині компонента → видалити (DashboardLayout вже має nav)
- **Таби:** на desktop — горизонтальний ряд зліва або sticky sidebar tabs; не pills з overflow
- **Скіл:** `design-taste-frontend` + `impeccable` для кожної сторінки

---

## D-01 — `/dashboard/billing`
**Складність:** Low  
**Файл:** `BillingPage.tsx`

- Поточна проблема: вузький single-column контент на широкому екрані
- Рішення: 2-column layout — поточний план ліворуч, порівняльна таблиця праворуч
- Або: centered max-width container (max-w-3xl) якщо порівняльна таблиця не потрібна

---

## D-02 — `/dashboard/reviews`
**Складність:** Low  
**Файл:** шукати `ReviewsPage.tsx` або вкладка у `AnalyticsPage.tsx`

- Список відгуків → grid на desktop (`lg:grid-cols-2`)
- Рейтинг summary зверху (full-width)
- Кожна картка відгуку → compact horizontal layout

---

## D-03 — `/dashboard/growth` (3 таби: Лояльність, Реферали, Партнери)
**Складність:** Medium  
**Файл:** `GrowthHubClient.tsx`

- Таби: на desktop → вертикальна ліва панель (sticky) замість горизонтальних pills
- Кожен таб:
  - **Лояльність**: stats + timeline → 2-column
  - **Реферали**: referral link block + stats → 2-column  
  - **Партнери**: partner cards → grid 3-column

---

## D-04 — `/dashboard/revenue` (2 таби: Флеш-акції, Смарт-ціни)
**Складність:** Medium  
**Файл:** `RevenueHubClient.tsx`

- На desktop: таби горизонтально, контент розширений
- **Флеш-акції**: список акцій → `lg:grid-cols-2`
- **Смарт-ціни**: налаштування цін → form-based, max-width + centered

---

## D-05 — `/dashboard/marketing` (2 таби: Сторіс, Розсилки)
**Складність:** Medium  
**Файл:** `MarketingTabs.tsx`, `StoryGenerator.tsx`, `BroadcastsTab.tsx`

- Таби горизонтально, sticky
- **Сторіс**: `StoryGenerator` — canvas preview праворуч (40%), параметри ліворуч (60%) на desktop
- **Розсилки**: список зліва, preview/edit справа (split view)

---

## D-06 — `/dashboard/products`
**Складність:** Low  
**Файл:** `ProductsPage.tsx`

- Список товарів → `lg:grid-cols-3` (замість single-column або 2-column mobile)
- Compact product card на desktop
- Статистика (total stock, revenue) → summary row зверху

---

## D-07 — `/dashboard/services`
**Складність:** Low  
**Файл:** `ServicesPage.tsx`

- Послуги по категоріях → accordion або tabs по категоріям на desktop
- В межах категорії: `lg:grid-cols-2` для карток послуг
- Drag-reorder має працювати на desktop (DnD Kit)

---

## D-08 — `/dashboard/analytics` ⭐ НАЙСКЛАДНІШИЙ
**Складність:** High  
**Файл:** `AnalyticsPage.tsx` + вкладки (`FinancesTab.tsx`, `StockTab.tsx`, etc.)

### Навігація по датам — кардинальна зміна
**Поточна:** pills/buttons для вибору periodу (тиждень/місяць/рік)  
**Потрібна:** великий горизонтальний slider (30% видимого екрану), як у маркетплейсах одягу

Підхід:
```tsx
// Горизонтальний scroll-snap slider для вибору дат
<div className="overflow-x-auto snap-x snap-mandatory scroll-smooth">
  {periods.map(period => (
    <button className="snap-center min-w-[30vw] ..." key={period.id}>
      {period.label}
    </button>
  ))}
</div>
```

### Розділи — з pills → великий slider
**Поточні:** pills навігація по табах  
**Потрібні:** великий горизонтальний slider (маркетплейс-стиль) для переключення розділів

### Layout
- Desktop: sidebar з аналітичним summary (статичний), контент area праворуч
- Кожна вкладка: responsive grid (`lg:grid-cols-3` для метрик, full-width для charts)

---

## D-09 — `/dashboard/portfolio` (impeccable audit)
**Складність:** Medium  
**Файл:** `PortfolioPage.tsx`, `PortfolioItemCard.tsx`

- Grid: `lg:grid-cols-4` для карток портфоліо (замість 2-3 mobile)
- Drag-reorder підтримка на desktop
- `impeccable` audit: card-in-card, ієрархія, contrast, shadows

---

## Порядок виконання P4
1. D-06 (Products — Low) → D-07 (Services — Low)
2. D-01 (Billing — Low) → D-02 (Reviews — Low)
3. D-03 (Growth — Medium) → D-04 (Revenue — Medium) → D-05 (Marketing — Medium)
4. D-09 (Portfolio — Medium, impeccable)
5. D-08 (Analytics — High, останній)

---

## Загальний QA для всіх desktop layouts
1. Відкрити кожну сторінку при ширині 1280px — немає overflow, немає порожніх місць
2. Перевірити що sidebar DashboardLayout не конфліктує
3. Перевірити responsive: 768px → 1024px transition плавна
4. `npx tsc --noEmit` після кожної сторінки
