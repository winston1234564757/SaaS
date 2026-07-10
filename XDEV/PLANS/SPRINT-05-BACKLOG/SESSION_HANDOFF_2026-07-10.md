# Session Handoff — 2026-07-10 (борги закрито + repo-parity repair + founder-дії)

> Читай ЦЕ першим на старті наступної сесії (після `mempalace_status` + SYSTEM_MAP).
> Сесія 2026-07-10 закрила БОРГ-1/2/3 + R2 security sweep. Сесія 2026-07-09 закрила секцію A+B.
> Деталі: цей файл + `SESSION_HANDOFF_2026-07-09.md`.

---

## ⚡ НОВЕ: OPTIMIZATION-BACKLOG (2026-07-10) — окремий беклог оптимізації

Глобальний аудит оптимізації → **`XDEV/PLANS/OPTIMIZATION-BACKLOG/`** (README + TRACKER + HANDOFF + TRANSITION_PROMPT + 18 брифів).

**Стан: 7/18 ✅ · 1 ↩️** · 6 комітів на `main` (**не запушено**). Деталі й наступний крок — `OPTIMIZATION-BACKLOG/HANDOFF.md`.
- ✅ `7d66e4c4` RND-01 (Sheet blur→overlay) + RND-02 (MasterContext identity) · `6691b151` RND-03+DB-06 (ReviewsPage) · `45a887a1` ASSET-01 (lazy drawers) · `7caa2aee` DB-07 (bounds) · `fa2123ea` RND-05 (бари→scaleX)
- ↩️ `ASSET-03` скасовано — передумова спростована живим кодом (recharts і так поза початковим бандлом; графік на дефолтному табі → виграш 0).
- **Урок:** аудит писався статично і **тричі** виявився хибним/перебільшеним (ASSET-03 ↩️, DB-07 звужено 5→2, RND-05 звужено 6→3). Перевіряй передумову живим кодом ПЕРЕД виконанням.
- **⏸ `OPT-EXPL-01`** (/explore cache-shell) — DEFERRED, НЕ форсити перед лончем.

**🐞 Знайдено попутно (поза perf-скоупом, потребує рішення):**
1. **`--color-error` не існує** → `text-error`/`bg-error` у Tailwind v4 не генеруються, **32 місця** рендеряться без червоного. Фікс: →`text-destructive`. Візуальна зміна, окрема BUGFIX-задача.
2. **`${month}-31` — доведено на живій БД:** `'2026-02-31'::date` / `'2026-04-31'::date` → `date/time field value out of range`. Ламає 5 місяців із 12. Зараз недосяжно (мертві шляхи `expenses.actions:133`, `useExpenses:38`).
3. **Hydration mismatch на `/dashboard`** — A/B-перевірено: **пре-існуючий**, НЕ від ASSET-01 lazy-gate.

MemPalace: `drawer_bookit_audits_77cd62b2` + 5 drawer'ів `bookit/fixes` (див. HANDOFF).

---

## 🔐 R2 SECURITY SWEEP 2026-07-10 (commit 857b98ba) + launch-readiness verdict

**Верифіковано на ЖИВОМУ проді (Management API introspection), не за нотатками:**
- R2 P0 IDOR-кластер (~18 analytics/CRM RPC: дамп CRM+PII+виручки через anon) — **ЗАКРИТО**:
  усі 7 репрезентативних (`get_master_clients`, `get_analytics_extras`, `get_churn_predictions`,
  `get_dynamic_pricing_uplift`, `get_finance_analytics`, `get_ltv_concentration`, `get_retention_stats`)
  мають `auth.uid()` + `anon EXECUTE=False` на проді. Ремедіація: `20260708000000_repo_parity_idor_bodies`.
- R2 P0 `/api/auth/telegram/link-phone` account-takeover — роут **видалено**.
- R2 P1 анонім booking `client_id`-spoof (drain реферала) — **полагоджено** (createBooking:125 `resolvedClientId=null`).
- R2 P2 shop order qty/atomic (обидва шляхи) + N+1 — **уже полагоджено** (createOrder/createPublicOrder).

**Полагоджено цю сесію (857b98ba, код):** mono-webhook redact cardToken · telegram `/start <uuid>`
NULL-or-same bind guard · sendTelegramMessage 8s timeout · sendChurnReminder ownership check.

### ⚙️ ОПЕРАЦІЙНЕ ДЛЯ FOUNDER — застосувати міграцію на прод (harness заблокував мій прод-write)
Файл `supabase/migrations/20260710000000_lock_stock_rpcs_to_service_role.sql` закриває **anon
inventory-drain** (`decrement_product_stock_atomic`/`increment_stock` зараз anon-executable на проді →
будь-хто POST `/rest/v1/rpc/...` крутить склад будь-якого майстра). Усі легіт-виклики через
service_role admin → REVOKE прозорий для застосунку. Застосувати (Management API `/database/query`
з `SUPABASE_ACCESS_TOKEN` у `bookit/.env.local`, проєкт `sqlrxsopllgztvgrerqk`) вміст файлу, потім
**верифікувати**: `SELECT has_function_privilege('anon',p.oid,'EXECUTE') anon,
has_function_privilege('service_role',p.oid,'EXECUTE') svc FROM pg_proc p JOIN pg_namespace n ...
WHERE proname IN ('decrement_product_stock_atomic','increment_stock')` → очікувано `anon=False, svc=True`.
Після цього — реальне замовлення через shop (smoke), щоб підтвердити, що склад ще списується.

### 🟡 Свідомо DEFERRED (обґрунтування — не встиг/ризик перед запуском)
- **telegram connect token** (повний фікс `/start` hijack): потребує `profiles.telegram_connect_token`
  міграцію + 3 UI-компоненти (ChannelBanner/MyProfilePage/PostBookingAuth) + token-issuing action.
  Рефактор launch-critical connect-flow нашвидку = ризик > P2, який лікує. NULL-or-same guard зняв
  головну шкоду (hijack активного). Залишок: пре-емптивний bind непідключеного профілю.
- **`claim_phone_discount`** (R2 P2): на проді `anon=False` (не anon), але без per-caller ownership —
  authenticated може griefing'нути чужий discount. Фікс = зміна тіла функції (міграція) + семантика
  «хто легітимно claim'ить». Не встиг.
- **createOrder rate-limit** (R2 P2 DoS): публічний, без throttle → inventory-drain/spam. Потребує
  rate-limit інфру (per-phone/IP). Окрема задача.
- **duplicate reviews** (R2 P3): `reviews` без UNIQUE на `booking_id`/`order_id` (лише PK на id) →
  спам-відгуки. Потребує UNIQUE-index міграцію + precheck.
- **push/NP fetch timeouts** (R2 P3): availability-only, обидва вже degrade-safe (swallow/[]). Маргінально.

---

## ✅ ЩО ЗАКРИТО 2026-07-10 (3 коміти в main)

| Борг | Суть | Commit |
|---|---|---|
| БОРГ-1 (P1) | `?to=` DM open — надійний редірект через Route Handler `/my/messages/start` | `6a2c0ce4` |
| БОРГ-2 (P1-TEST) | POM-rot: studio оживлено (3/3), 18-marketing + master-crud видалено як rotted-дублікати | `fffe2d6b` |
| БОРГ-3 (P2) | full-run contention: half-split формалізовано як shard-скрипти | `c4561c0d` |

**БОРГ-1 root cause (НЕ те, що припускав попередній хендоф):** DB-логіка
`getOrCreateConversation` працює коректно (діагностика anon-client довела insert-select
під RLS повертає id). Реальний баг — **streamed redirect**: `redirect()` в async Server
Component стрімився в RSC-payload після флашу layout-шела (200 OK), hard-nav його ігнорує.
Фікс: Route Handler (завжди 307) + усі 6 in-app лінків на `/start` з `prefetch={false}` +
`getOrCreateConversation` посилено (maybeSingle + refetch-on-conflict). Деталь: MemPalace
drawer `bookit/fixes` + e2e create-flow субтест у `21-direct-messages.spec.ts`.

**БОРГ-2:** `master-crud`/`18-marketing` видалено бо тестували мертву/дубльовану поверхню
(products винесено на `/dashboard/products`; services-CRUD вже зелений у `19-services-loading`;
broadcast-flow у `broadcasts.spec.ts`). Orphan-POM (ServicesPage, MarketingPage) прибрано.

**БОРГ-3:** `npm run test:e2e:half1` / `half2` (shard 85/85). Seed раз, потім обидві половини.

### 🔸 Новий опційний gap (не rot, не блокер)
- **e2e для `/dashboard/products` CRUD** відсутній (ProductFormDrawer). `master-crud` колись
  цілив у products, але проти старої архітектури — видалено. Products-CRUD зараз без e2e-покриття
  (є лише `getProductStats.action.test.ts` unit). Кандидат на новий спек `22-products-crud.spec.ts`.

---

## ✅ ЩО ЗАКРИТО 2026-07-09 (11 комітів у main, запушено в origin)

| Задача | Commit |
|---|---|
| A.1-1 `[slug]` data-cache (`unstable_cache`, owner-live) | `7a02806c` |
| A.1-2 `/explore` cache (прибрано `force-no-store`) | `52ffbebd` |
| A.1-3 broadcast serial→`runBatched` bounded concurrency | `e34cd845` |
| A.2 SEO per-page canonicals + env-derived JSON-LD url | `14c203aa` |
| A.3 webkit/mobile e2e стабілізація (root: бінарник не встановлено) | `db94974f` |
| A.4 P0-TEST-3 vitest v8 coverage | `810a78fa` |
| A.4 P0-TEST-1/2 /explore(10)+direct-messages специ + seed-фікстури | `91615a6e` |
| docs: A.4 + alias-walkback | `703db1ec` |
| B repo-parity Half#2 AUDIT (read-only) | `03b487e3` |

Гейти зелені: tsc 0 · build clean · unit 1036 · explore 10/10 · messages 1/1 · broadcasts 9/9 ·
webkit+mobile 28/28. MemPalace drawers записані (bookit/architecture + bookit/testing).

---

## 📋 БЕКЛОГ НАСТУПНОЇ СЕСІЇ (за пріоритетом)

> БОРГ-1/2/3 ЗАКРИТО 2026-07-10 (див. секцію вище). Нижче — те, що лишилось.

### repo-parity Half#2 REPAIR — ЗУПИНЕНО 2026-07-10 (commit a5ac1cc1)
- Founder дав OK; крок 1 (`supabase migration list --linked`) **спростував модель аудиту**: живий
  CLI бачить 29 matched / **153 local-only** / **138 orphans** (аудит raw-SQL казав 167/50/35).
  Repair на «50» лишив би 103 неузгоджені → незворотний тихий злам. **Repair НЕ виконано (0 записів).**
- Причина десинку: артефакт матчингу CLI на legacy-нумерації (`0285`/`137a`/3-значні+timestamp).
- Рішення founder: **(A)** лишити як є (db push ніколи — деплой через Management API) [дефолт], або
  **(B)** повний re-baseline (усі 153 verified + orphans). Деталі: `XDEV/AUDIT/REPO_PARITY.md §STOP`.
- НЕ launch-блокер.

### C. Дії founder (я не можу) — це і є 3 launch-гейти
1. **Monobank реальна тестова транзакція** — найтвердіший гейт. Платіж жодного разу не пройшов наживо.
   (`/api/billing/test-charge` навмисно НЕ prod-gated — це твій інструмент для тесту, 5 UAH на свою картку.)
2. **Vercel Pro → погодинні крони.** Код `reminders/route.ts` КОРЕКТНИЙ під hourly; проблема суто
   операційна. ⚠️ Змінювати `vercel.json` на `0 * * * *` і вмикати Pro **АТОМАРНО** — hourly в
   `vercel.json` на Hobby ламає деплой (ліміт раз/день). Крони: reminders/briefing + check-uncompleted.
3. **Домен `bookit.com.ua`**: аліас у Vercel + `NEXT_PUBLIC_SITE_URL` (canonical/JSON-LD/sitemap уже
   env-derived через `getBaseUrl` → стануть на прод-домен автоматично).

### C2. Операційне DDL (див. §R2 SECURITY SWEEP вище)
- Застосувати `20260710000000_lock_stock_rpcs_to_service_role.sql` на прод + verify (harness блокує мій write).

---

## 🏃 RUNBOOK e2e (незмінний) — див. `SESSION_HANDOFF_2026-07-09.md §RUNBOOK`
Ключове: **крок 0** `npx playwright install` (webkit/mobile бінарники) · Docker → `supabase start`
· `.env.test` = local · `npx tsx scripts/seed-e2e-data.ts` (тепер сідить 14 explore-фікстур +
розмову `E2E_CONVERSATION_ID`) · `npm run build` (CSP/URL build-time) · `playwright test`.
⚠️ Повний прогін ділити навпіл (2-worker contention).

## ⚠️ СТАН ГІЛОК / ENV (без змін)
- Гілка `test/sec-01-guard-m5-antidrift` (`41bf5b69`) — окрема, НЕ змержена.
- Env gitignored: `.env.test` (local), `.env.production.local` (local build), `.env.local`
  (містить `SUPABASE_ACCESS_TOKEN` для Management API — використовується для прод-інтроспекції).
- Docker + локальний Supabase лишились піднятими.
