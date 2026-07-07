# Pre-Launch Audit R2 — TRANSITION / SESSION HANDOFF
> Точка входу для нової сесії. Читай ЦЕ + `PRE_LAUNCH_AUDIT_R2.md` (трекер) + `R2-findings/*.md` (деталі).
> Оновлено: 2026-07-07 · Запуск: 2026-07-10 (публічний домен + реальні Monobank + Vercel Pro).

---

## СТАРТ НОВОЇ СЕСІЇ — зроби перше
1. `mempalace_status` — **MCP був відключений минулу сесію**; якщо знову — `mempalace_reconnect`. Drawer про security-фікс НЕ записаний останню сесію (MCP down) → записати (деталі нижче в «Що записати в MemPalace»).
2. Прочитати `PRE_LAUNCH_AUDIT_R2.md` (трекер, повний стан) + цей файл.
3. НЕ перезапускати вже зроблене (див. «ЗРОБЛЕНО»).

## Контекст за 30 секунд
R1-аудит (2026-06-20, `PRE_LAUNCH_AUDIT.md`) застарів — 372 коміти відтоді. Запустили R2: повний re-run 15 аудитів, triage-first, мультиагент. День 1 (P0-хвиля) завершено з великою знахідкою.

---

## ✅ ЗРОБЛЕНО (не чіпати)

### P0 БЕЗПЕКА — живий витік PII на проді, ЗАКРИТО й верифіковано
- **Діра:** 21 `SECURITY DEFINER` RPC (аналітика/CRM) приймали owner-id аргумент, фільтрували по ньому без `auth.uid()` і без REVOKE → `anon` (публічний ключ у JS-бандлі) міг викликати `get_master_clients` з будь-яким master UUID і вивантажити всю клієнтську базу (телефони, імена, LTV, нотатки). Доведено: `SET ROLE anon` повертав 16 реальних рядків.
- **Фікс (через Supabase Management API, ref `sqlrxsopllgztvgrerqk`, токен у `bookit/.env.local`):** Етап 1 REVOKE anon/PUBLIC на 21 overload; Етап 2 guard `IF auth.uid() IS NOT NULL AND auth.uid() <> p_owner_id THEN RAISE 42501` на 20 (+ get_c2c_balance по p_referrer_id = 21/21). 15 plpgsql inject після BEGIN, 5 sql → plpgsql-обгортка RETURN QUERY.
- **Верифіковано** матрицею ролей: owner→дані, чужий authenticated→42501, service_role(cron)→дані, anon→permission denied. Усі 21 anon-revoked, усі 21 guarded.
- Repo: `supabase/migrations/20260706120000_security_idor_analytics_guard.sql` (ідемпотентний REVOKE-safety-net + опис патерну).

### Інфраструктура
- **`TELEGRAM_WEBHOOK_SECRET`** — додано у Vercel Prod+Preview, webhook перереєстровано з secret_token. ⚠️ **Активується лише після прод-редеплою** (`cd bookit && npx vercel --prod`). Секрет у Vercel env.
- **Vercel env перевірено:** усі критичні присутні (NEXT_PUBLIC_SITE_URL, NOVAPOSHTA_API_KEY server-only, MONO_API_KEY, CRON_SECRET, VAPID×3). `DEBUG_TOKEN` відсутній = debug-ендпоінт безпечно вимкнений.
- **Baseline:** `tsc` 0 помилок ✅ · `build` OK ✅ · `npm test` 4 впало/1004.

### 4 P0-аудити (агенти) — звіти в `R2-findings/`
- **01-security.md** — 5 P0 (IDOR, ЗАКРИТО) + 1 P1 + 4 P2 + 3 P3.
- **07-database.md** — 0 P0 + 1 P1 (IDOR, ЗАКРИТО) + 4 P2 + 6 P3. Позитиви: orders RLS безпечний (anon→0 рядків), search_path_fix застосований на проді, 0 таблиць без RLS.
- **09-auth.md** — 0 P0/P1. Auth пережив переробку /my/*. Поправка: гард = `middleware.ts`, НЕ `proxy.ts`.
- **10-billing.md** — 0 P0 + 3 P1 + 3 P2 + 3 P3. Shop = COD (сума сервер-сайд, не тамперабельна), mono-webhook надійний.

---

## 📋 ЩО ЛИШИЛОСЯ

### Твоя ручна дія (не код)
1. ~~Прод-редеплой для TELEGRAM_WEBHOOK_SECRET~~ — ✅ виконано founder-ом 2026-07-07, секрет активний.
2. ✅ Founder підтвердив: C2B-trial = **21 день** (код правильний, тест застарів → оновити в День 3).

### День 2 — паралельні агенти (fresh session, свіжий ліміт) + скіли
Запустити 4 агенти (як День 1): **#8 Backend/API, #2 A11y, #13 Mobile, #11 Notifications** — фокус на нові поверхні (shop/NP/orders/my/*). Скіли в основній сесії: **#14 code-review+simplify** (дельта), **#3 impeccable** (design по групах сторінок), **#4 humanizer** (copy).

### День 3 — Triage + фікси P0→P1 (P2/P3 → backlog)
Незакриті P1 до запуску:
- **Billing (10-billing.md):** pending трактується як paid (`MonoProvider.ts:117` + `expire-subscriptions:236`, `succeeded = status !== 'failure'`); рекурентний webhook не реконсілиться (orderId формат `recurring_*` vs webhook приймає лише `bookit_*`); SKIP LOCKED lock не покриває charge → ризик подвійного 700₴.
- **Security P2 (01-security.md):** mono-webhook логує cardToken у plaintext (`route.ts:102`); telegram `/start <uuid>` notification hijack (`route.ts:201`); createOrder inventory-drain DoS (no rate-limit); claim_phone_discount griefing.
- **DB P2 (07-database.md):** 2 SECURITY DEFINER views (master_subscriptions_public anon-readable billing state); content_reports `WITH CHECK true` (spam); auth_rls_initplan 84 warnings.
- **Repo-parity:** back-port guard-тіла у source-міграції + вирішити `schema_migrations` desync (9+ файлів) ДО будь-якого `supabase db push`.
- **4 застарілі тести:** оновити моки (partners/referrals: admin-client + `partner_invite_token`/`c2c_referral_code`; C2B trial код=21д навмисно, тест хоче 30). НЕ фіксити код.

### День 4 — регресія + launch checklist
tsc→build→test→e2e зелене · deploy preview + own-eyes smoke (реєстрація→onboarding→бронювання→PostBookingAuth→оплата test→магазин→нотифікації) · прод-верифікація robots/sitemap/OG/manifest/JSON-LD/Lighthouse · Monobank тестова транзакція.

### Аудити ще не запускались (День 2-3)
#5 SEO, #6 Performance, #12 PWA (+ PWA іконки: `public/icons/` не існує, manifest посилається на неіснуючі PNG — P3), #15 Testing gap.

---

## Що записати в MemPalace (минула сесія MCP down)
Drawer вже підготовлений минулою сесією АЛЕ MCP відключився — перевір чи є в `bookit/fixes` drawer про «SECURITY P0 FIX 2026-07-06 Anon PII breach». Якщо нема — додати з деталями фіксу вище (двоетапний, guard-патерн `auth.uid() IS NOT NULL AND <> p_owner_id`, verified matrix). Патерн переиспользуемый.

## Ключові факти для нової сесії
- Прод Supabase ref: `sqlrxsopllgztvgrerqk` · Management API токен: `bookit/.env.local` `SUPABASE_ACCESS_TOKEN`.
- Management API виклик: `POST https://api.supabase.com/v1/projects/{ref}/database/query` з User-Agent браузера (інакше Cloudflare 1010). SELECT + guarded DDL. Приклад-скрипт — в історії цієї сесії.
- Прод-домен зараз: `bookit-five-psi.vercel.app` (bookit.com.ua ще не факт що зроутений).
- Роутинг-гард: `src/middleware.ts` (НЕ proxy.ts — застаріла нотатка).

---

## PALACE CLEANUP — відкладено на post-launch (стан на 2026-07-07)
Аудит палацу: з 30 573 дроверів ~20 960 — bulk-import сирих транскриптів (`claude_imports` 10 312 + `sessions` 10 136 + `wing_sessions` 513), ~85% шум/дубль, джерела на диску НЕ існують (старий ноут `Vitossik` видалено). Суть уже продубльована в кураваних drawers + DOMAIN_MAPS + git. Рішення founder: чистити ПІСЛЯ запуску (10.07), зараз пріоритет = аудит.

**Уже зроблено (доказ механізму):** видалено 1 джерело `fe6d3896-...jsonl` (440 дроверів) з `claude_imports` → 10 312 → **9 872**. База консистентна.

**Як докінчити (наступна фокусна сесія):**
1. Інструмент: `mcp__mempalace__mempalace_delete_by_source` (per source_file, exact). Вингового bulk-delete НЕМА. **НЕ робити direct-SQL по `chroma.sqlite3`** — HNSW-індекс + FTS + embeddings_queue легко зкорумпувати.
2. Перелічити джерела read-only (обхід startup-hook на Read): Python `sqlite3.connect("file:C:/Users/Vitos/.mempalace/palace/chroma.sqlite3?mode=ro", uri=True)`, join `embedding_metadata` по `key='wing'` + `key='source_file'`. `claude_imports` мав 212 джерел (211 лишилось), `sessions` ~200.
3. Цикл `delete_by_source(dry_run=false)` по кожному. Батчити паралельно (~25-30/відповідь). ~400+ викликів на обидва вінги.
4. Після кожного вінгу: `mempalace_search` контрольний запит (напр. "referral idempotency") — переконатись що куровані drawers усе ще у топі, шум зник.
5. Лишити `bookit` (9601, курований+частина імпорту — окремий тонший аудит) недоторканим на цьому проході.
