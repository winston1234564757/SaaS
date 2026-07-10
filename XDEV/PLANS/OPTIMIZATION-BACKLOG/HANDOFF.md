# OPTIMIZATION-BACKLOG — HANDOFF (2026-07-10)

> Читай після `mempalace_status` + `SYSTEM_MAP`. Далі: `TRANSITION_PROMPT.md`.
> Беклог і брифи: `TRACKER.md`, `BRIEFS/OPT-*.md`. Калібрування й знайдені баги: `README.md`.

---

## Стан: 7/18 ✅ · 1 ↩️ · 10 лишилось

| ID | Задача | Ст | Commit |
|----|--------|----|--------|
| `OPT-RND-01` | Sheet blur → на статичний overlay | ✅ | `7d66e4c4` |
| `OPT-RND-02` | MasterContext `useCallback` + `userRef` | ✅ | `7d66e4c4` |
| `OPT-RND-03` | ReviewsPage прибрано `layout` | ✅ | `6691b151` |
| `OPT-DB-06` | `useReviews` `.limit(300)` | ✅ | `6691b151` |
| `OPT-ASSET-01` | lazy BookingDetailsModal + ImageCropper | ✅ | `45a887a1` |
| `OPT-DB-07` | 2 необмежені запити обмежено | ✅ | `7caa2aee` |
| `OPT-RND-05` | 3 бари → `scaleX/scaleY` | ✅ | `fa2123ea` |
| `OPT-ASSET-03` | recharts defer | ↩️ скасовано | — |

**⚠️ 6 комітів НЕ запушено** (`main ahead 6`). Запушити або свідомо лишити локально.

---

## Головне, що змінило картину (не повторювати помилок статичного аудиту)

Аудит писався зі статичного читання. Жива перевірка **тричі** спростувала або звузила його. Наступна сесія має так само **перевіряти передумову перед виконанням**, а не виконувати беклог наосліп.

- **`OPT-ASSET-03` ↩️ скасовано.** `RevenueLineChart` на **дефолтному** табі «Огляд», рендериться одразу при mount → `dynamic()` підтягнув би чанк негайно, виграш **нуль**, зате skeleton-спалах + ризик CLS. recharts і так поза початковим бандлом (`AnalyticsPage` вже `dynamic`).
- **`OPT-DB-07` звужено 5 → 2.** `useProductTransactions` і `SystemLogsViewer` **вже** мали `.limit(50)`. `expenses.actions.ts getExpenses` — **мертвий код** (нуль консумерів).
- **`OPT-RND-05` звужено 6 → 3.** Поодинокі бари — одноразові entrance-анімації на крихітних ізольованих поверхнях; `fixing-motion-performance` rule 2 їх **прямо дозволяє**. Чіпати наосліп = ризик заради нуля.

Так само `OPT-RND-03`: віртуалізацію свідомо **не** робили — список виявився 2-колонковим masonry змінної висоти, а не fixed-row як `ClientsPage`. `.limit(300)` + прибраний `layout` знімають знахідку без ризику.

---

## Знайдено попутно (поза скоупом perf) — потребує рішення founder

### 1. `--color-error` не існує → 32 місця без червоного
`globals.css` має сирий `--error` (per-theme) і `--color-destructive: var(--error)`, але **`--color-error` не визначений ніде**. У Tailwind v4 утиліти генеруються з `--color-*`, тож `text-error` / `bg-error` / `border-error` **не існують**. Наслідок: негативні дельти й помилкові стани рендеряться без кольору.
SYSTEM_MAP підтверджує цей клас (M-ANL-04 полагодив **одне** місце). Лишилось **32**.
Фікс: `text-error`→`text-destructive`, `bg-error/N`→`bg-destructive/N`. **Візуальна зміна** — окрема BUGFIX-задача + founder-око.

### 2. `${month}-31` — ДОВЕДЕНО на живій БД
`expenses.actions.ts:133` і мертва гілка `useExpenses.ts:38`:
```
SELECT '2026-02-31'::date;  -- ERROR: date/time field value out of range
SELECT '2026-04-31'::date;  -- ERROR
SELECT '2026-01-31'::date;  -- ок
```
Ламається для будь-якого місяця коротшого за 31 день (**5 з 12**). Зараз **недосяжно**: `useExpenses()` завжди без `month`, `getExpenses` без консумерів. Міна на майбутнє.
Правильно: `lt('expense_date', <1-ше число НАСТУПНОГО місяця>)`.

### 3. Hydration mismatch на `/dashboard` — ПРЕ-ІСНУЮЧИЙ
Перевірено **контрольованим A/B**: відкат `DashboardLayout` до pre-`ASSET-01` дає ті самі 2 console-помилки. **Не** регресія від lazy-gate. Не полювати на неї як на наслідок ASSET-01.
Третій issue у dev-оверлеї — `RefererNotAllowedMapError` (Google Maps на localhost), середовищне.

---

## Own-eyes рig — робочий рецепт (перевірено)

```bash
# 1. Docker Desktop
Start-Process "C:\Program Files\Docker\Docker\Docker Desktop.exe"   # PowerShell

# 2. Локальний Supabase (якщо DB-контейнер exited → stop, потім start)
cd bookit && npx supabase stop && npx supabase start

# 3. Сід (ідемпотентний; при повторі падає на дублікатах — це ок, дані вже є)
npm run test:e2e:seed

# 4. Dev-сервер з test-env БЕЗ чіпання .env.local
#    Next НЕ перевизначає вже-встановлені process.env
set -a && source .env.test && set +a && npm run dev

# 5. Playwright
E2E_BASE_URL=http://localhost:3000 npx playwright test <spec> --project=chromium
```

**Пастки:**
- `testDir: './e2e/tests'` — спек у `e2e/inspect/` **не бачиться**. Класти тимчасові спеки в `e2e/tests/`.
- У спеці: `test.use({ storageState: 'playwright/.auth/master-crm.json' })`. `globalSetup` сам перелогінює всі акаунти.
- **`.env.local` → ПРОД.** `next build` не читає `.env.test` (лише NODE_ENV=test). Для прод-білда під тест потрібен env-swap (`.env.test.prod-bak` натякає на це) — **не робив, ризик для прод-env**. Тому e2e ганяв через **dev**-сервер.
- **Dev-only false positive:** React у dev юзає `eval()`, CSP (build-time) блокує `unsafe-eval` → `consoleGuard`-специ падають. На прод-білді проходять. Не приймати за регресію.
- **Сід-дані:** occupancy 0% і нуль активних акцій → бари `RND-05` не рендеряться. Baseline може вийти порожнім.

---

## Що лишилось

### Фаза 1 (фронтенд, верифіковне локально)
- **`OPT-ASSET-02`** (P2) — 9× raw `<img>` → `next/image` з `sizes`. **Найкращий наступний крок:** реальний CLS/payload-виграш, рig готовий. Кожен випадок потребує перевірки `width/height` vs `fill` + `sizes`. **НЕ чіпати** blob/data-URL прев'ю (`StepBasic:89`, `StepProfile:96`, `StoryCanvas`, crop, `AdminSupportConsole:395`).
- **`OPT-RND-04`** (P1) — віртуалізація `MastersDirectory` (admin, простіше) + `ChatMessageList` (**ризиково**: reverse-scroll, stick-to-bottom, групування повідомлень, конфлікт з `AnimatePresence popLayout`). Радив розбити на дві задачі; для чату розглянути `content-visibility: auto` як низькоризикову альтернативу.
- **`OPT-RND-06`** (P2) — акордеони `height:0→auto`. Цінність низька; варті лише «множинні» місця (`FlashDealPage` ×2, `AllianceMap` per-node). Поодинокі лишити.

### Фаза 2 (DB/RPC — потребує прод-apply founder)
`OPT-DB-01` (useOrders full-scan) · `OPT-DB-02` (get_master_clients пагінація + refetch-per-keystroke) · `OPT-DB-03` (analytics eager mega-RPC — **обрано варіант A: lazy per-tab**) · `OPT-DB-04` (5000-row set-diff → SQL `NOT EXISTS`) · `OPT-DB-05` (get_finance_analytics 8 сканів → CTE) · `OPT-DB-08` (N+1/waterfall кластер).

**Блокери Фази 2:** SQL-міграції застосовуються на прод через Management API, не `db push` (`AUDIT/REPO_PARITY.md`). Harness блокує мій прод-write → міграції пишу, **apply робить founder**. Локальна БД дозволяє перевірити SQL перед цим.

### Відкладено
- **`OPT-EXPL-01`** ⏸ — `/explore` cache-shell. Потребує `cacheComponents`. **Не форсити перед лончем.**

---

## Прийняті рішення (не перепитувати)

| Питання | Рішення |
|---|---|
| Формат беклогу | Нова папка + TRACKER + брифи (house-style Sprint-05) |
| TO-VERIFY зі старого аудиту | Верифікувати живим кодом, записувати лише підтверджене |
| Sheet blur | Варіант **C** — blur на статичний overlay, панель = чистий tint |
| ReviewsPage | Віртуалізація → **скоригована** на `.limit` + прибраний `layout` (masonry) |
| Analytics DB-03 | Варіант **A** — lazy per-tab (не shared cache) |
| Порядок | Фронтенд-блок першим, DB-міграції окремим блоком під founder-apply |
| `--color-error` | Окрема задача пізніше, не в perf-беклозі |

---

## Стан середовища на момент передачі
- **Supabase**: піднятий локально (`npx supabase stop` щоб згасити).
- **Dev-сервер**: зупинений.
- **Тимчасові спеки**: видалені (`e2e/tests/_opt-*.spec.ts`), скріншоти прибрані.
- **Git**: `main`, дерево чисте по коду, **ahead 6 (не запушено)**. Шум поза скоупом: `.claude/settings.local.json`, `image.png`, `playwright/.auth/setup-fail-client.png` (зачепив `globalSetup`).
- **MemPalace drawers**: `drawer_bookit_audits_77cd62b2` (створення беклогу) · `drawer_bookit_fixes_30efac18` (RND-01) · `drawer_bookit_fixes_2212f65f` (RND-02) · `drawer_bookit_fixes_b944dfaa` (RND-03/DB-06) · `drawer_bookit_fixes_0d5b05ea` (ASSET-01) · `drawer_bookit_fixes_eeb8d673` (RND-05 + DB-07 + ASSET-03 + баги).
