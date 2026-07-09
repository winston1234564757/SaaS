# OPT-DB-03 — Analytics eager mega-RPC + дубль-обчислення у табах

**Тип:** DATA
**Пріоритет:** P0
**Статус:** DRAFT
**Спеціаліст-скіли:** `database-optimizer` `tanstack-query`

---

## Поточний стан
`src/components/master/analytics/AnalyticsPage.tsx:114-136` на mount (Pro) паралельно піднімає: `useAnalytics` (5 запитів), `useAnalyticsExtras({scope:'all'})`, `useAnalyticsMarketing` (4 запити), `MorningBriefing` (3 запити).

`useAnalyticsExtras.ts` (`get_analytics_extras`, агрегатор `...idor_bodies.sql:80-138`) зі `scope:'all'` виконує **~14 під-функцій** наперед (`get_finance_analytics`, `get_stock_forecast`, `get_churn_predictions`, `get_cohort_retention`, `get_cross_sell_matrix`, `get_idle_slots_cost`, `get_occupancy_heatmap`, `get_ltv_concentration`, ...) — хоча таби lazy й більшість ніколи не відкривають.

Дубль: `FinancesTab.tsx:68,71` викликає `useAnalyticsExtras({scope:'finances'})` двічі (поточний + попередній період); `StockTab.tsx:60` — `{scope:'stock'}`. Оскільки `scope` входить у React Query key (`useAnalyticsExtras.ts:173`), ці виклики **не** влучають у кеш від `scope:'all'` → важкі RPC виконуються 2-4× за сесію.

## Ціль
Один із двох напрямів (обрати в питанні нижче):
- **A.** Прибрати неоткриті секції з дефолтного `'all'` payload — рахувати per-tab лениво тільки коли таб відкрито.
- **B.** Зробити щоб per-tab хуки перевикористовували кеш `'all'` (не key на `scope`, а `select` з об'єднаного результату) — тоді `'all'` лишається, але дублів нема.

## Файли, які чіпаю
- `src/lib/hooks/useAnalyticsExtras.ts:173,179` — ключ кешу / вибір scope.
- `src/components/master/analytics/AnalyticsPage.tsx:114-136` — дефолтний payload.
- `src/components/master/analytics/sections/FinancesTab.tsx:68,71`, `StockTab.tsx:60` — узгодити з новою схемою.
- Можливо агрегатор `get_analytics_extras` (`...idor_bodies.sql:80-138`), якщо ділимо scope.

## [DATA] Схема пайплайну
page mount → `get_analytics_extras(scope)` → N під-функцій сканують bookings+join → об'єднаний JSON → таби рендерять секції. Рветься двічі: (1) `'all'` рахує зайве наперед; (2) per-tab виклики не шарять кеш через scope-key. RLS/owner-guard у тілі RPC — зберегти.

## Ризики / що може зламатись
- `previousWindow` у FinancesTab (2-й виклик) потрібен для Δ-порівняння — при варіанті B треба, щоб об'єднаний кеш містив і попередній період, або лишити 2-й виклик тільки для prev.
- Зміна форми payload зачепить усі 7 табів — регресія по кожному.
- Порядок mount / Pro-gate: не зламати empty-state (skeleton без цифр).

## Acceptance criteria
- [ ] TSC: 0 | Build: clean
- [ ] Важкі під-функції (finance/stock) виконуються ≤1× на період, не 2-4×.
- [ ] Неоткриті таби не тягнуть свої RPC на mount (варіант A) АБО шарять кеш (варіант B).
- [ ] Усі 7 табів рендеряться коректно; Δ-порівняння у FinancesTab лишається.

## Відкриті питання до тебе
1. Варіант A (lazy per-tab, менший mount) чи B (єдиний `'all'` + shared cache)? A простіший і легший на вхід; B зберігає поточний instant-switch між табами.
