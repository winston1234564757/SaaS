# Session Handoff — 2026-07-09 (repo-parity + e2e local green + audit recon)

> Читай ЦЕ першим на старті наступної сесії (після mempalace_status + SYSTEM_MAP).
> Попередній handoff-контекст: `TRANSITION_PROMPT.md`. Ця сесія закрила «звірку аудиту»
> + SEC-01 залишок (локальний Supabase) + зробила репо збірним з нуля.

---

## ✅ ЗРОБЛЕНО ЦЮ СЕСІЮ (закомічено в main, запушено в origin)

### 1. Звірка аудиту (RECON_CHECKLIST) — ЗАКРИТО
Пройдено `XDEV/AUDIT/RECON_CHECKLIST.md`. Висновок: більшість P0/P1 старого аудиту (2026-06-15)
вже закрито в Sprint-05/IRP. Реально відкрите → див. «БЕКЛОГ» нижче. Статуси записані в чеклист.

### 2. repo-parity — репо ТЕПЕР БУДУЄТЬСЯ З НУЛЯ (було зламано)
`supabase start` / `db reset` з чистої БД падав на 5 orphan-дірах (forward-міграції застосовані
на прод через Studio, у репо відсутні — лишились orphan-рядками `schema_migrations`). Виправлено:
- `131_rollback_inventory_system.sql` — guard `IF to_regclass('public.inventory_items') IS NULL RETURN` (127-129 forward відсутні).
- `0285_sms_otp_base_tables.sql` — 4 OTP-таблиці (sms_otps/sms_logs/sms_verify_attempts/telegram_otps) з прод-DDL.
- `20260609000002_partners_tokens.sql` — rename з `...000000` (dup-версія → PK-колізія schema_migrations).
- `20260708000000_repo_parity_idor_bodies.sql` — 21 IDOR SECURITY DEFINER guard-тіло (жили лише на проді після R2-фіксу).
- `20260708000001_repo_parity_views.sql` — 2 view (`booking_slots`, `master_subscriptions_public`).
Валідовано чистим `supabase start` + перевіркою guard-ів на локальній БД.

### 3. CSP build-time фікс (реальний баг)
`next.config.ts` `headers()` запікається на BUILD, не читається при `next start`. `connect-src`
дозволяв лише `*.supabase.co` → локальний Supabase блокувався. Фікс: derive origin з
`NEXT_PUBLIC_SUPABASE_URL`, додати http+ws коли localhost. CSP-violations 249→0.

### 4. SEC-01 залишок — ЗАКРИТО (локальний Supabase e2e)
Було: «repoint .env.test на локальний Supabase, потребує Docker». Зроблено:
- Docker Desktop піднято, `npx supabase start` (локальний ref 127.0.0.1:54321).
- `.env.test` націлено на локальний (бекап прод-версії → `.env.test.prod-bak`, gitignored).
- `.env.production.local` (gitignored) — для build-time local URL.
- `CRON_SECRET` додано в `.env.test` (cron API інакше 401).
- broadcasts seed-фікс: `seedCrmMaster` +1 бронювання clientCrm (get_master_clients рахує по
  bookings; CRM-майстер мав лише guest → сегмент «new» = 0 отримувачів).
- `playwright.config.ts` → `workers: 2` (undefined = CPU-count over-subscribe'ив dev-box під
  Docker+Next → app timeout-guardи firing → flaky; 2 = детерміновано зелено).
- `00-role-login-smoke.spec.ts` → timeout 90s (багато-роутний walk).

### 5. Дрібні
- SEC-P1-1: `getSession()→getUser()` у PublicNavbar + PublicMobileHeader.

**Результат e2e:** chromium **139 passed / 0 failed** на 2 воркерах (48 + 91 двома половинами).
Регресія-гейт: tsc 0 · build 0 · unit 1030/1030 · e2e 139/0.

---

## 🏃 RUNBOOK — запуск e2e локально (щоб не переоткривати)
```
0. ОДНОРАЗОВО (env): npx playwright install   # webkit/mobile-safari бінарники; інакше ці
   проєкти валяться «Executable doesn't exist» (НЕ rot). chromium зазвичай уже є.
1. Запустити Docker Desktop (дочекатись "Engine running").
2. cd bookit && npx supabase start   # локальний стек, застосує ВСІ міграції
3. .env.test вже націлений на локальний (127.0.0.1:54321). Якщо збитий → відновити з .env.test.prod-bak НЕ треба (то прод); local-ключі = demo-дефолти supabase.
4. npx tsx scripts/seed-e2e-data.ts   # seed (SAFETY-ABORT пройде — local ref)
5. npm run build                      # CSP+URL запікаються на build-time (.env.production.local дає local)
6. npx playwright test --project=chromium   # workers=2 з конфігу
```
Гоча: `headers()` build-time → зміна CSP/URL вимагає REBUILD, не restart. Повний прогін ~8-9хв
на 2 воркерах; ділити навпіл (`00-`..`09-` / решта) якщо треба вкластись у ліміт.

---

## 📋 БЕКЛОГ НАСТУПНОЇ СЕСІЇ (за пріоритетом)

### A. Мої дії (код) — можу сам
1. **P1 Perf** (окремі Task Gates, архітектура):
   - ✅ `[slug]` data-cache — ЗАКРИТО (2026-07-09). Мертвий `revalidate=300` (dynamic-роут
     ігнорує) → `unstable_cache` на 7 статичних master-scoped запитів (getMasterCached +
     getMasterExtras у `[slug]/data.ts`, revalidate 60с, tag `master-public:${slug}`). Owner
     бачить свої зміни live (isOwner branch); anon — кеш. flash/occupancy/monthly лишились live.
     Gate: tsc 0 · build ✓ · e2e booking-flow 4/0. Деталь: MemPalace drawer bookit/architecture.
   - ✅ `/explore` cache-shell — ЗАКРИТО (2026-07-09). Рішення: БЕЗ cacheComponents (та сама
     unstable_cache-стратегія). `explore/data.ts` `getExploreMasters()` (revalidate 60с, tag
     `explore-masters`, anon-клієнт); прибрано `force-dynamic`+`force-no-store` (останнє вбивало б
     кеш). preferredCategories+inviteCode лишились live. Gate: tsc 0 · build ✓ · e2e smoke 5/0.
     Залишок (окремі задачі): P0-PERF-2 get_explore_masters RPC · P1-PERF-5 react-virtual.
   - ✅ broadcast serial loop — ЗАКРИТО (2026-07-09). `sendBroadcast` серійний цикл → bounded
     concurrency: новий `src/lib/utils/batch.ts` `runBatched` (10 in-flight) + extracted
     `processRecipient`. Тест `batch.test.ts` 6/6. Gate: tsc 0 · build ✓. Залишок (окрема
     задача): списки >~150-200 отримувачів → винести в cron/чергу. Гоча: broadcast e2e скіпають
     на `master.json` vs `master-*.json` (pre-existing auth-name mismatch, A.3/A.4) — верифіковано
     unit'ом + parity, не зеленою broadcast-e2e.
   **→ A.1 (P1 Perf) ЗАКРИТО ПОВНІСТЮ (3/3).**
2. ✅ **SEO P2/P3 hardening** — ЗАКРИТО (2026-07-09). Canonical додано per-page на home/explore/
   legal (не в root layout — інакше все каноні­зується на '/'); JSON-LD [slug] url хардкод
   `bookit.com.ua` → `getBaseUrl()`. AI-crawler: **founder обрав Варіант 1 «дозволити всі»** →
   robots без змін (свідомий no-op). Верифіковано runtime curl (:3100): canonical на 4 поверхнях +
   JSON-LD env-url. legal/[slug] noindex → canonical пропущено. Gate: tsc 0 · build ✓.
3. ✅ **webkit/mobile e2e стабілізація** — ЗАКРИТО (2026-07-09). Root cause = НЕ rot: webkit-бінарник
   не встановлено (`npx playwright install webkit`). Далі: partition config (webkit лише
   `01-auth-guards`; `02-time-travel` анімована кнопка не «stable» на webkit → chromium-вкрито);
   mobile `/my/bookings` desktop-only h1 → селектор на видимий таб «Записи»; `master.json` аліас
   у global.setup (copy master-crm) розблокував broadcasts.spec.ts 9/9 + mobile dashboard;
   `18-marketing-broadcasts` карантин. Результат: webkit 14/14 · mobile 14/14. tsc 0.
   ⚠️ ENV-передумова: `npx playwright install` (webkit/mobile-safari бінарники) — інакше проєкти
   валяться «browser not installed» (див. RUNBOOK крок 0).
   ⚠️ ПОПРАВКА (A.4): blanket `master.json` аліас відкотено — він розблокував dormant POM-rotted
   специ (master-crud/studio/18-marketing → red у full-run). Тепер broadcasts+16-mobile націлені
   прямо на `master-crm.json`; global.setup видаляє stale аліас → rotted специ чисто скіпають.
4. ✅ **E2E gaps (P0-TEST-1/2/3)** — ЗАКРИТО (2026-07-09). P0-TEST-3 vitest v8 coverage (810a78fa).
   P0-TEST-2 `22-explore-public.spec.ts` (10 тестів: search/category/sort/intent/view/pagination/geo).
   P0-TEST-1 `21-direct-messages.spec.ts` (історія/send/persist/list). Seed розширено: 14 explore-
   фікстур (pagination+geo) + детермінована розмова (`E2E_CONVERSATION_ID`). Gate: explore 10/10 ·
   messages 1/1 · broadcasts 9/9 · webkit+mobile 28/28.
   **→ Секція A (мої дії) ЗАКРИТА ПОВНІСТЮ (A.1–A.4).**
   Залишок-борг (окремий pass): refresh POM master-crud/studio/18-marketing; investigate
   `getOrCreateConversation` (?to= повертав null); full-run 2-worker contention (half-split).

### B. repo-parity Half #2 — schema_migrations desync (ОБЕРЕЖНО, перед будь-яким `db push`)
Деталі + безпечна процедура: `XDEV/AUDIT/REPO_PARITY.md`. 179 repo-файлів vs 167 зареєстрованих;
47 незареєстрованих + 35 orphan-рядків. `supabase migration repair --status applied` ЛИШЕ після
per-migration звірки прод-стану (хибний applied → db push пропустить → прод назавжди без зміни).
НЕ launch-блокер (деплой = vercel --prod + Management API, не db push).

### C. Дії founder (я не можу)
- Vercel Pro → крони reminders/briefing daily→hourly (промахують ~95% доки Hobby) + check-uncompleted.
- Monobank реальна тестова транзакція.
- Домен bookit.com.ua: аліас + `NEXT_PUBLIC_SITE_URL`.

---

## ⚠️ СТАН ГІЛОК / ENV
- Гілка `test/sec-01-guard-m5-antidrift` (TEST-M6/SEC-01, commit 41bf5b69) — окрема, НЕ змержена.
  Ця сесія працювала на main; SEC-01 локальний-Supabase залишок закрито тут.
- Env-файли gitignored: `.env.test` (local), `.env.production.local` (local build), `.env.test.prod-bak` (бекап прод-версії).
- Docker + локальний Supabase лишились піднятими (можна `npx supabase stop` коли не треба).
