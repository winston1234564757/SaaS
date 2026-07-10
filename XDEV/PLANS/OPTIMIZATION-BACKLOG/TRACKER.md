# OPTIMIZATION-BACKLOG — TRACKER

> Аудит оптимізації · 2026-07-10 · 18 задач (5 P0 · 6 P1 · 7 P2-кластери)
> Статуси: `⬜` не почато · `🔄` в роботі · `✅` готово · `↩️` скасовано · `⏸` відкладено
> Всі `file:line` верифіковані проти дерева на 2026-07-10.

**Прогрес:** 9/19 ✅ · 1 ↩️ (ASSET-03 скасовано — передумова спростована)
> ✅ RND-01, RND-02, RND-03, DB-06, ASSET-01, DB-07, RND-05, ASSET-02, ASSET-02b · ↩️ ASSET-03
> ⚠️ ASSET-02b містить 2 міграції — застосовані лише локально, **apply на прод за founder**

---

## ФАЗА DB — Запити до бази / дані

| ID | Задача | P | Ст | Спеціаліст-скіли | Модель | Commit |
|----|--------|---|----|------------------|--------|--------|
| `OPT-DB-01` | `useOrders` full-scan orders + УСІХ bookings без date-window/limit | P0 | ⬜ | `sql-query-optimization` `database-optimizer` | **Opus** | — |
| `OPT-DB-02` | `get_master_clients` RPC без пагінації + refetch на кожен keystroke у marketing/actions | P0 | ⬜ | `supabase-postgres-best-practices` `senior-backend` | **Opus** | — |
| `OPT-DB-03` | Analytics eager `get_analytics_extras{all}` (~14 fn) + дубль-обчислення у табах (кеш keyed на scope) | P0 | ⬜ | `database-optimizer` `tanstack-query` | **Opus** | — |
| `OPT-DB-04` | `useDashboardStats` тягне 5000 рядків для set-diff у JS (число нових клієнтів б'ється на межі) | P1 | ⬜ | `sql-query-optimization` | **Sonnet** | — |
| `OPT-DB-05` | `get_finance_analytics` 8 окремих скан-проходів bookings+join | P1 | ⬜ | `supabase-postgres-best-practices` | **Opus** | — |
| `OPT-DB-06` | `useReviews` unbounded + дубль-запит `reviews-pending` (підмножина) | P1 | ✅ | `tanstack-query` | **Sonnet** | `6691b151` |
| `OPT-DB-07` | Кластер over-fetch: `select('*')`/no-bound × 5 (expenses, product_transactions, ModerationHub, SystemLogs) | P2 | ✅ | `database-optimizer` | **Sonnet** | `7caa2aee` |
| `OPT-DB-08` | Кластер N+1/waterfall: loyalty per-master RPC, broadcast nested-await, 3 sequential-then-await хуки | P2 | ⬜ | `senior-backend` | **Sonnet** | — |

## ФАЗА RND — Рендер / Анімації

| ID | Задача | P | Ст | Спеціаліст-скіли | Модель | Commit |
|----|--------|---|----|------------------|--------|--------|
| `OPT-RND-01` | `ui/Sheet.tsx` `backdrop-blur-3xl` під scale-анімацією — джанк у КОЖНІЙ модалці | P0 | ✅ | `fixing-motion-performance` | **Opus** | `7d66e4c4` |
| `OPT-RND-02` | `context.tsx` MasterContext value міняє identity щорендер (refresh/fetchProfile без useCallback) | P0 | ✅ | `react-best-practices` `senior-frontend` | **Opus** | `7d66e4c4` |
| `OPT-RND-03` | `ReviewsPage` `layout` на необмеженому списку під popLayout — thrash на фільтрі | P1 | ✅ | `fixing-motion-performance` | **Sonnet** | `6691b151` |
| `OPT-RND-04` | Відсутня віртуалізація: `MastersDirectory` (admin), `ChatMessageList` (вся історія motion-nodes) | P1 | ⬜ | `senior-frontend` | **Sonnet** | — |
| `OPT-RND-05` | Кластер: 6 progress-барів анімують `width/height` замість `scaleX/scaleY` (зроблено 3 — де є множник) | P2 | ✅ | `fixing-motion-performance` | **Sonnet** | `fa2123ea` |
| `OPT-RND-06` | Кластер: `height:0→auto` акордеони × 5 (layout-triggering) | P2 | ⬜ | `fixing-motion-performance` | **Sonnet** | — |

## ФАЗА ASSET — Бандл / Асети

| ID | Задача | P | Ст | Спеціаліст-скіли | Модель | Commit |
|----|--------|---|----|------------------|--------|--------|
| `OPT-ASSET-01` | Lazy-load важких drawer'ів: BookingDetailsModal (eager у DashboardLayout), ClientDetailSheet ×4, ImageCropper | P1 | ✅ | `react-best-practices` | **Sonnet** | `45a887a1` |
| `OPT-ASSET-02` | Кластер: публічні raw `<img>` → `next/image` з `sizes` (зроблено 5 з 9; 2 QR + SVG скасовано; чат → `OPT-ASSET-02b`) | P2 | ✅ | `senior-frontend` | **Opus** | `aa1a8ab9` |
| `OPT-ASSET-02b` | Вкладення чату → `next/image` (розміри+blur у БД, fallback для legacy). **Попутно полагоджено пре-існуючий баг: аплоад вкладень у DM ніколи не працював** | P2 | ✅ | `senior-frontend` `create-migration` | **Opus** | `66f06fb6` |
| `OPT-ASSET-03` | `RevenueLineChart` recharts статично в OverviewTab → defer within analytics | P2 | ↩️ | `react-best-practices` | **Sonnet** | — |

## ФАЗА CARRY — Перенесене зі старого аудиту (верифіковано)

| ID | Задача | P | Ст | Спеціаліст-скіли | Модель | Commit |
|----|--------|---|----|------------------|--------|--------|
| `OPT-EXPL-01` | `/explore` глибша cache-shell стратегія (клас P0-PERF-1). data-cache вже є; лишається Suspense-island/cacheComponents | P1 | ⏸ | `nextjs` `senior-frontend` | **Opus** | — |

> **⏸ OPT-EXPL-01 — не форсити перед лончем.** За `SESSION_HANDOFF_2026-07-10`: degradation ≠ bug; потребує `cacheComponents` + власний Task Gate + тести. Відкладено до after-launch.

---

## Джерело знахідок

Кожна задача має бриф у `BRIEFS/OPT-*.md` з точними `file:line`, гіпотезою фіксу, ризиками й acceptance.
Виключення (вже полагоджене / N/A) — див. `README.md §Виключено`.
