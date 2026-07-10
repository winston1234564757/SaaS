# OPT-ASSET-03 — RevenueLineChart: recharts статично в OverviewTab

**Тип:** MOTION
**Пріоритет:** P2
**Статус:** ↩️ СКАСОВАНО — передумова спростована живим кодом
**Спеціаліст-скіли:** `react-best-practices`

---

## Поточний стан
`src/components/master/analytics/charts/RevenueLineChart.tsx:4-7` статично імпортує recharts (`ComposedChart, Area, Line, XAxis, ...`). Компонент статично імпортується з `sections/OverviewTab.tsx:10`, тож уся recharts вантажиться щойно відкрито Analytics — до того, як графік у в'юпорті.

Пом'якшення вже є: `AnalyticsPage` code-split (`AnalyticsClientLoader.tsx:10` `dynamic()`), admin-варіант (`AdminOverviewChartsWrapper.tsx:5`) теж dynamic. Тож recharts не в початковому app-бандлі → це Medium (defer within analytics), не High. Recharts лише у 2 файлах.

## Ціль
Відкласти recharts усередині Analytics: `RevenueLineChart` через `next/dynamic` (`ssr:false`, з lightweight-плейсхолдером) — щоб він не входив у чанк OverviewTab до потреби.

## Файли, які чіпаю
- `src/components/master/analytics/sections/OverviewTab.tsx:10` — `dynamic()` для `RevenueLineChart`.
- (`RevenueLineChart.tsx` лишається; змінюється лише спосіб імпорту.)

## Ризики / що може зламатись
- `ssr:false` + графік як герой Overview — узгодити плейсхолдер (skeleton тієї ж висоти, без CLS).
- `isAnimationActive=false` для headless уже стоїть — не чіпати (потрібне для e2e/скріншотів).

## Acceptance criteria
- [ ] TSC: 0 | Build: clean
- [ ] recharts не в початковому чанку OverviewTab (перевірити build-output).
- [ ] Overview рендериться з плейсхолдером → графіком, без CLS.

## Відкриті питання до тебе
1. Немає.

---

## [Заповнюється після DONE] — ↩️ СКАСОВАНО

**Чому не робимо (перевірено живим кодом 2026-07-10):**
1. `RevenueLineChart` рендериться на рядку 94 зі 165 у **дефолтному** табі «Огляд» — тобто монтується одразу при відкритті Analytics, вище/біля фолду. `dynamic()` підтягнув би чанк негайно → **виграш по бандлу нульовий**.
2. recharts **уже поза початковим app-бандлом**: `AnalyticsPage` завантажується через `dynamic()` (`AnalyticsClientLoader.tsx:10`), admin-варіант теж.
3. Натомість зміна додала б skeleton-спалах на герой-графіку дефолтного табу + ризик CLS (компонент вищий за свій `h-[240px]` chart-бокс, точну висоту плейсхолдера не вгадати).

Реальний defer вимагав би viewport-gated ленивого завантаження (IntersectionObserver), але графік і так у в'юпорті на mount → сенсу нема. **Чистий мінус, закрито як ↩️.**

**Побічна знахідка (окремо):** `RevenueLineChart.tsx:59` використовує `text-error`, який у Tailwind v4 не існує (`--color-error` не визначений). Див. `../README.md §Знайдено поза скоупом`.
