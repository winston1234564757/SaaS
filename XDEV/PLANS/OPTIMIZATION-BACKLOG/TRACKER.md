# OPTIMIZATION-BACKLOG — TRACKER

> Аудит оптимізації · 2026-07-10 · 18 задач (5 P0 · 6 P1 · 7 P2-кластери)
> Статуси: `⬜` не почато · `🔄` в роботі · `✅` готово · `↩️` скасовано · `⏸` відкладено
> Всі `file:line` верифіковані проти дерева на 2026-07-10.

## ✅ БЕКЛОГ ЗАКРИТО (2026-07-12) — 13/19 ✅ · 5 ↩️ · 1 ⏸

> ✅ RND-01, RND-02, RND-03, DB-06, ASSET-01, DB-07, RND-05, ASSET-02, ASSET-02b, DB-08, RND-04, DB-03, DB-04
> ↩️ ASSET-03, RND-06, DB-01, DB-02, DB-05 (+ RND-04 ч.2) — **передумови спростовані живим кодом і замірами прода**
> ⏸ EXPL-01 — after-launch, не форсити перед лончем
> ✅ Усі міграції **застосовано на прод** (Management API, версії в реєстрі, стан перевірено запитами ПІСЛЯ apply)

**🔴 Головний підсумок беклогу: із 19 задач аудиту 6 виявились неіснуючими або перебільшеними.** Аудит писався зі статичного читання коду. Він добре знаходить, ЩО СТАНЕТЬСЯ при великому N, і нічого не каже про те, ЧИ ІСНУЄ велике N. Фаза DB закрилась не кодом, а `count(*)` на проді: жодна з п'яти задач не тримала свій пріоритет на живих даних. Але той самий замір знайшов **два справжні баги**, яких у беклозі не було — обидва про коректність, не про швидкість.

---

## ФАЗА DB — Запити до бази / дані

| ID | Задача | P | Ст | Спеціаліст-скіли | Модель | Commit |
|----|--------|---|----|------------------|--------|--------|
| `OPT-DB-01` | ~~`useOrders` full-scan orders + УСІХ bookings~~ → ↩️ **замір прода: 5 замовлень + 13 бронювань із товарами.** «Вся історія» = 18 рядків. Обсягу нема | P0 | ↩️ | — | — | — |
| `OPT-DB-02` | ~~`get_master_clients` без пагінації + refetch на кожен keystroke~~ → ↩️ **дебаунс 300мс ВЖЕ Є** (`BroadcastEditor.tsx:145-153`) + React Query staleTime 30с. Клієнтів max **5** на майстра | P0 | ↩️ | — | — | — |
| `OPT-DB-03` | Analytics eager `get_analytics_extras{all}` — **перф-частина ↩️** (прогрітий `all` = 18мс, lazy per-tab дав би ~6мс). **Але знайдено баг:** `scope IN ('all','finances','stock')` рахував finances І stock для ОБОХ scope | P0 | ✅ | `database-optimizer` | **Opus** | `51555a37` |
| `OPT-DB-04` | `useDashboardStats` — `.limit(5000)` **без `ORDER BY`** → число нових клієнтів МОВЧКИ хибне за межею. Set-diff → SQL (`get_week_new_client_phones`). **Фікс коректності, не перфу** | P1 | ✅ | `sql-query-optimization` `create-migration` | **Opus** | `51555a37` |
| `OPT-DB-05` | ~~`get_finance_analytics` 8 скан-проходів~~ → ↩️ **замір: 7.8мс на 283 бронюваннях.** Переписувати робочий RPC у CTE = ризик зламати цифри заради мілісекунд | P1 | ↩️ | — | — | — |
| `OPT-DB-06` | `useReviews` unbounded + дубль-запит `reviews-pending` (підмножина) | P1 | ✅ | `tanstack-query` | **Sonnet** | `6691b151` |
| `OPT-DB-07` | Кластер over-fetch: `select('*')`/no-bound × 5 (expenses, product_transactions, ModerationHub, SystemLogs) | P2 | ✅ | `database-optimizer` | **Sonnet** | `7caa2aee` |
| `OPT-DB-08` | Кластер N+1/waterfall: loyalty per-master RPC → 1 select (**без міграції** — RLS owner-select на `c2c_bonus_uses` робить RPC зайвим), broadcast nested-await → inner-join, 3 хуки → `Promise.all`. Бонус: waterfall самої loyalty-сторінки | P2 | ✅ | `senior-backend` | **Sonnet** | `b5345ece` |

## ФАЗА RND — Рендер / Анімації

| ID | Задача | P | Ст | Спеціаліст-скіли | Модель | Commit |
|----|--------|---|----|------------------|--------|--------|
| `OPT-RND-01` | `ui/Sheet.tsx` `backdrop-blur-3xl` під scale-анімацією — джанк у КОЖНІЙ модалці | P0 | ✅ | `fixing-motion-performance` | **Opus** | `7d66e4c4` |
| `OPT-RND-02` | `context.tsx` MasterContext value міняє identity щорендер (refresh/fetchProfile без useCallback) | P0 | ✅ | `react-best-practices` `senior-frontend` | **Opus** | `7d66e4c4` |
| `OPT-RND-03` | `ReviewsPage` `layout` на необмеженому списку під popLayout — thrash на фільтрі | P1 | ✅ | `fixing-motion-performance` | **Sonnet** | `6691b151` |
| `OPT-RND-04` | Відсутня віртуалізація. **Розбито надвоє.** ч.1 `MastersDirectory` (admin) — ✅ spacer-row + `useWindowVirtualizer`. ч.2 `ChatMessageList` — ↩️ **скасовано за замірами прода** (найдовша DM-розмова = 1 повідомлення, тікет = 9; розмов >100 нема). Деталі + тригер повернення — `HANDOFF §OPT-RND-04 ч.2` | P1 | ✅ | `senior-frontend` | **Sonnet** | `34864d2c` (ч.1) |
| `OPT-RND-05` | Кластер: 6 progress-барів анімують `width/height` замість `scaleX/scaleY` (зроблено 3 — де є множник) | P2 | ✅ | `fixing-motion-performance` | **Sonnet** | `fa2123ea` |
| `OPT-RND-06` | Кластер: `height:0→auto` акордеони × 6 — ↩️ **скасовано**: усі поодинокі user-toggle (Rule 2 дозволяє); grid-rows НЕ compositor; проєкт уже відкинув grid-rows | P2 | ↩️ | `fixing-motion-performance` | **Opus** | — |

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
