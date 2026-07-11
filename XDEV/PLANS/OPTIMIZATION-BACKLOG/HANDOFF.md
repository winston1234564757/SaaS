# OPTIMIZATION-BACKLOG — HANDOFF (2026-07-10)

> Читай після `mempalace_status` + `SYSTEM_MAP`. Далі: `TRANSITION_PROMPT.md`.
> Беклог і брифи: `TRACKER.md`, `BRIEFS/OPT-*.md`. Калібрування й знайдені баги: `README.md`.

---

## Стан: 9/19 ✅ · 1 🔄 (RND-04 наполовину) · 2 ↩️ · 7 лишилось

> ⚠️ **Чекає на founder:** (1) apply двох міграцій `ASSET-02b` на прод; (2) `.env.production.local` → перейменовано в `.env.e2e-build.bak`, `npm run build` знову чесний прод-білд (`0098b30e`).

| ID | Задача | Ст | Commit |
|----|--------|----|--------|
| `OPT-RND-01` | Sheet blur → на статичний overlay | ✅ | `7d66e4c4` |
| `OPT-RND-02` | MasterContext `useCallback` + `userRef` | ✅ | `7d66e4c4` |
| `OPT-RND-03` | ReviewsPage прибрано `layout` | ✅ | `6691b151` |
| `OPT-DB-06` | `useReviews` `.limit(300)` | ✅ | `6691b151` |
| `OPT-ASSET-01` | lazy BookingDetailsModal + ImageCropper | ✅ | `45a887a1` |
| `OPT-DB-07` | 2 необмежені запити обмежено | ✅ | `7caa2aee` |
| `OPT-RND-05` | 3 бари → `scaleX/scaleY` | ✅ | `fa2123ea` |
| `OPT-ASSET-02` | 5 raw `<img>` → `next/image` (з 9; 3 ↩️) | ✅ | `aa1a8ab9` |
| `OPT-ASSET-02b` | вкладення чату + **фікс аплоаду DM** | ✅ | `66f06fb6` |
| — | `npm run build` знову прод (+ `build:e2e`) | ✅ | `0098b30e` |
| `OPT-RND-04` ч.1 | віртуалізація `MastersDirectory` (spacer-row) | ✅ | `34864d2c` |
| `OPT-RND-04` ч.2 | віртуалізація `ChatMessageList` | ⬜ | — |
| `OPT-ASSET-03` | recharts defer | ↩️ скасовано | — |

**⚠️ Коміти НЕ запушено** (`main ahead`) — свідоме рішення founder (2026-07-11). Запушити або лишити локально.

### `OPT-RND-04` ч.1 — як зроблено (2026-07-11)
Референс `ClientsPage` віртуалізує **div-картки** абсолютним `translateY`. У `MastersDirectory` — нативна `<table>`, де абсолютне позиціювання `<tr>` ламає auto-width колонок. Тому **spacer-row технік**: рядки лишаються в потоці, вікно зверху/знизу добивається порожніми `<tr>` зі spacer-висотою. Розмітка/класи/дизайн/Sheet — **без змін**.

Дві пастки, на які наступив і які варто знати для ч.2:
- **`scrollMargin` — від верху `<tbody>`, не `<table>`.** Віртуалізовані рядки починаються після `<thead>`; міряти від таблиці = постійний зсув на висоту шапки.
- **`useLayoutEffect` на mount тут НЕ працює.** `<tbody>` схований за `loading`-гейтом, тож на момент ефекту його ще нема в DOM → `scrollMargin` лишився б `0` і позиціювання зламалося б. Потрібен **callback-ref**, який форсить ререндер саме коли `<tbody>` монтується (і перемонтовується, коли фільтр дає 0 рядків і назад). `ClientsPage` цієї проблеми не має лише тому, що його контейнер рендериться завжди.

✅ **Верифіковано:** `tsc` 0 + `build` clean + рев'ю діфа + **жива поведінка перевірена founder'ом у dev** (2026-07-11). Агент рігу не піднімав — own-eyes зроблено на стороні founder. Борг верифікації закритий, ч.1 закрита.

---

## Головне, що змінило картину (не повторювати помилок статичного аудиту)

Аудит писався зі статичного читання. Жива перевірка **п'ять разів** спростувала або звузила його. Наступна сесія має так само **перевіряти передумову перед виконанням**, а не виконувати беклог наосліп.

- **`OPT-RND-06` ↩️ скасовано.** Усі 6 `height:0→auto` акордеонів — поодинокі user-toggle на малих ізольованих поверхнях (Rule 2 їх дозволяє); «per-node множник» AllianceMap **хибний** (`initial={false}`, defaults-open, один `motion.div` на toggle, не N). Головне: `grid-rows 0fr→1fr` із брифу **НЕ compositor-friendly** — grid-трек це layout, reflow такий самий, як у `height:auto`, виграш лише маргінальний main-thread. Плюс проєкт **уже** відкидав grid-rows на користь `scrollHeight`+`height`. Ризик регресії розкриття (overflow/margin/тіні) заради нуля. Деталі: `BRIEFS/OPT-RND-06.md`.

- **`OPT-ASSET-02` звужено 9 → 5.** Два «зображення» виявились QR із `api.qrserver.com`, що **вже** мають `width/height` (CLS=0) і важать 1–2 KB; один із них через `next/image` **зламався б** (`crossOrigin` не пробрасується → tainted canvas → `toDataURL()` кидає `SecurityError` → нема завантаження QR). Третє — локальний SVG, який `next/image` не оптимізує без `dangerouslyAllowSVG`. Чат винесено в `ASSET-02b` (тягне міграцію).

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

### 4. 🔴 `.env.production.local` — забутий e2e-оверрайд ламає ЛОКАЛЬНИЙ `npm run build`
Файл існує з **2026-07-08**, перший рядок у ньому: `# TEMP e2e override — local Supabase. Remove after e2e`. Його не прибрали.

Next вантажить env у порядку `.env.production.local` → `.env.local`, тож **перший перемагає**. Наслідок: **будь-який `npm run build` на цій машині збирається проти локального Supabase**, а не проду — і CSP, і `remotePatterns` (обидва build-time) беруть локальні значення.

Доказ (той самий комміт, різні env):
```
з файлом:  Environments: .env.production.local, .env.local  → dangerouslyAllowLocalIP: true,  4 remotePatterns
без файлу: Environments: .env.local                          → dangerouslyAllowLocalIP: false, 3 remotePatterns  ✅
```
Він **gitignored** (`bookit/.gitignore:41`), тож на Vercel його немає — прод-збірка чиста. Але локальний «pre-deploy build check» **не перевіряє прод-конфіг**, і це тихо знецінює будь-яку build-time перевірку (CSP теж).

**Рішення founder:** видалити файл (він сам себе позначив як тимчасовий) чи лишити для e2e. Якщо лишати — e2e-рецепт має явно про нього казати, а pre-deploy перевірку робити з тимчасово прибраним файлом.

### 4b. ✅ ВИРІШЕНО — `.env.production.local`
Перейменовано в `.env.e2e-build.bak` (Next такої назви не вантажить). Додано `scripts/build-e2e.mjs` + `npm run build:e2e`, який **явно** вантажить `.env.test` і відмовляється будувати, якщо URL не локальний. Перевірено: `build` → `allowLocalIP=false, 0 локальних патернів`; `build:e2e` → `true, 1`. Коміт `0098b30e`.
**Перед e2e тепер обовʼязково `npm run build:e2e`** — playwright `webServer` це `npm run start`, і на прод-білді він піде в **ПРОД-БД**.

### 4c. 🔴 ПОЛАГОДЖЕНО — вкладення в DM-чаті ніколи не завантажувались
Бакет `support_attachments` спільний для тікетів і DM. Його політики (міграція `20260529000000`) роблять `(regexp_split_to_array(name,'/'))[1]::uuid`, припускаючи, що перший сегмент шляху — id тікета. `DirectChatPage` вантажить у `dm/<conv_id>/…`, тож перший сегмент — літерал `dm`, а `'dm'::uuid` кидає `22P02` → INSERT відхиляється.

Клієнт **ковтав** помилку storage і все одно писав рядок повідомлення, тож у чаті висіла бита картинка на неіснуючий обʼєкт. Raw `<img>` мовчить; `next/image` проявив це як 400 — власне тому баг і знайшовся.

Фікс (міграція `20260710000001` + `DirectChatPage`): support-політики стали cast-safe через `is_uuid_text()`, додано `Insert/Select/Delete DM attachments` скоуповані на учасників розмови (`is_dm_participant`, SECURITY DEFINER), аплоад більше не ковтає помилку (toast). **Apply на прод за founder.**

### 4d. ⚠️ CHECK-констрейнт із NULL — пастка, яку легко не помітити
```sql
-- ХИБНО: для w=100, h=NULL дає `false OR NULL` = NULL, а CHECK з NULL ПРОПУСКАЄ рядок
CHECK ((w IS NULL AND h IS NULL) OR (w > 0 AND h > 0))
-- ПРАВИЛЬНО:
CHECK ((w IS NULL) = (h IS NULL) AND (w IS NULL OR (w > 0 AND h > 0)))
```
Доведено на живій БД (`20260710000000`). Половинчастий рядок пройшов би валідацію, яку констрейнт мав ловити.

### 5. Пре-існуючі eslint-`error` у двох файлах (не регресія)
На `HEAD` до змін: `invite/[code]/page.tsx:8` — `no-restricted-imports` (`createAdminClient` у page.tsx, а не в `actions.ts`/`api/`); `ServiceSelector.tsx:385` — `react/no-unescaped-entities`. Обидва підтверджені `git stash` + повторним lint.

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
- 🔴 **`next/image` + локальний Supabase.** Next 16 має SSRF-гард приватних IP: він відхиляє `127.0.0.1` **після** успішного матчу `remotePatterns` і кидає **той самий текст** (`"url" parameter is not allowed`), що й провал whitelist. Тобто помилка бреше. Потрібні **обидва** гейти в `next.config.ts`: локальний `remotePattern` **і** `dangerouslyAllowLocalIP: isLocalSupabase`. Доказ у логах dev: `upstream image ... resolved to private ip ["127.0.0.1"]`. Уже зроблено в `aa1a8ab9`.
- 🔴 **Сід не має зображень.** `scripts/seed-e2e-data.ts:260` ставить `avatar_url: null`, послуги без `image_url`. Перевірка `next/image` на голому сіді покаже самі fallback-іконки й **нічого не доведе**. Заливати реальний файл у локальний storage (`public/landing/dashboard.png` = 1.19 MB — добрий зразок) і привʼязувати до `services.image_url` / `profiles.avatar_url`.
- 🔴 **Порт 3000 може тримати чужий/застарілий dev.** Він відповідатиме на `curl` (200), а спека мовчки битиме **не в твій сервер зі старим конфігом**. Перевіряти власником порту: `Get-NetTCPConnection -LocalPort 3000 -State Listen` → `Get-Process`. `TaskStop` вбиває шелл, але **не** дочірній `next dev` — гасити за PID.
- `npm run dev | head -N` (будь-який пайп, що закриває стрім) **вбиває dev-сервер**. Не пайпити фоновий сервер.
- `playwright.config.ts` має `webServer: npm run start` + `reuseExistingServer: true` на `E2E_BASE_URL`. Якщо `.next` зібрано без `.env.production.local`, `npm run start` піде **в ПРОД-БД**. Перед e2e — перезібрати з оверрайдом (див. §Знайдено попутно #4).
- `.next/dev/types/routes.d.ts` від убитого dev-сервера ламає `npx tsc --noEmit` сотнею синтаксичних помилок. Лікується `rm -rf .next`.
- 🔴 **`21-direct-messages` падає на `main` і без жодних змін.** `.env.test.runtime` має застарілий `E2E_CONVERSATION_ID` (`cce57727…`), а в локальній БД розмова інша. `npm run test:e2e:seed` при повторі падає на `booking_slot_collision` і **не переписує** runtime-файл. Перевірено A/B (`git stash` → той самий фейл). **Не приймати за регресію.**
- **Прод-білд `.next` + `npm run start` = ПРОД-БД.** Перед e2e завжди `npm run build:e2e`.
- Прямий `DELETE FROM storage.objects` заборонено тригером (`protect_delete`). Чистити через Storage API (`.storage.from(b).remove([...])`).
- `testDir: './e2e/tests'` — спек у `e2e/inspect/` **не бачиться**. Класти тимчасові спеки в `e2e/tests/`.
- У спеці: `test.use({ storageState: 'playwright/.auth/master-crm.json' })`. `globalSetup` сам перелогінює всі акаунти.
- **`.env.local` → ПРОД.** `next build` не читає `.env.test` (лише NODE_ENV=test). Для прод-білда під тест потрібен env-swap (`.env.test.prod-bak` натякає на це) — **не робив, ризик для прод-env**. Тому e2e ганяв через **dev**-сервер.
- **Dev-only false positive:** React у dev юзає `eval()`, CSP (build-time) блокує `unsafe-eval` → `consoleGuard`-специ падають. На прод-білді проходять. Не приймати за регресію.
- **Сід-дані:** occupancy 0% і нуль активних акцій → бари `RND-05` не рендеряться. Baseline може вийти порожнім.

---

## Що лишилось

### Фаза 1 (фронтенд, верифіковне локально)
- **`OPT-ASSET-02`** (P2) — 9× raw `<img>` → `next/image` з `sizes`. **Найкращий наступний крок:** реальний CLS/payload-виграш, рig готовий. Кожен випадок потребує перевірки `width/height` vs `fill` + `sizes`. **НЕ чіпати** blob/data-URL прев'ю (`StepBasic:89`, `StepProfile:96`, `StoryCanvas`, crop, `AdminSupportConsole:395`).
- **`OPT-RND-04` ч.2** (P1) — віртуалізація `ChatMessageList`. **ч.1 (`MastersDirectory`) зроблено** — `34864d2c`. Чат лишається **ризиковим**: reverse-scroll, stick-to-bottom, групування повідомлень (`prev/next/isNewDay` рахується inline у map → винести в мемо-derived масив), конфлікт з `AnimatePresence popLayout`. Розглянути `content-visibility: auto` як низькоризикову альтернативу повній віртуалізації.
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
