# Session Handoff — 2026-07-10 (борги + repo-parity repair + founder-дії)

> Читай ЦЕ першим на старті наступної сесії (після `mempalace_status` + SYSTEM_MAP).
> Попередня сесія (2026-07-09) закрила ВЕСЬ actionable-беклог: секція A (A.1–A.4) +
> секція B аудит. Деталі закритого: `SESSION_HANDOFF_2026-07-09.md`.

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

### БОРГ-1 (P1). `getOrCreateConversation` `?to=` повертає null — можливий баг
- **Симптом:** `GET /my/messages?to=<masterId>` НЕ редіректить у чат (redirect у `page.tsx` не
  спрацьовує, бо `getOrCreateConversation` повертає `null`) навіть коли розмова існує/має створитись.
- **Файл:** `src/lib/actions/messages.ts:141` `getOrCreateConversation`. Гіпотези: (а)
  `.insert(...).select('id').single()` повертає null під RLS SELECT-after-insert; (б) existing-
  lookup `.single()` промахується + `INSERT` б'є `UNIQUE(client_id, master_id)` → error → null.
- **Дія:** відтворити (клієнт client.json, `?to=<E2E_MASTER_TIMETRAVEL_ID>`, чистий стан),
  залогувати обидві гілки, полагодити. Потім МОЖНА додати в `21-direct-messages.spec.ts`
  під-тест на реальний `?to=` create-flow (зараз спек іде через **засіджену** розмову
  `E2E_CONVERSATION_ID`, щоб обійти цей баг).
- **Пов'язане:** broadcast SEND усе ще НЕ вкритий зеленою e2e (`18-marketing` карантин) — після
  фіксу POM (борг-2) можна закрити.

### БОРГ-2 (P1-TEST). POM-rot: 3 dormant специ
Мій A.3 `master.json` аліас виявив, що ці специ **завжди скіпались** (гейт на `master.json`, якого
не було) і мають застарілі page-objects. Аліас відкочено → вони знову чисто скіпають. Щоб оживити:
або націлити на `master-crm.json` (як зроблено для broadcasts/16-mobile), або відновити аліас.
- `e2e/tests/master-crud.spec.ts` — Services/Products CRUD: click-timeout на «додати послугу/товар»
  + heading assertion `Послуги та товари`. Оновити `ServicesPage` POM (`e2e/pages/ServicesPage.ts`)
  проти живого `/dashboard/services`.
- `e2e/tests/studio.spec.ts` — coming-soon: `Команда майстрів` / `Записатися у Waitlist` не
  знайдено. Оновити `StudioPage` POM (`e2e/pages/StudioPage.ts`) проти живого `/dashboard/studio`.
- `e2e/tests/18-marketing-broadcasts.spec.ts` — **карантин** (`test.describe.skip`), stale дубль
  `broadcasts.spec.ts`. Дія: злити корисне в `broadcasts.spec.ts` і видалити (P1-TEST-6), АБО
  полагодити (recipient-count текст на edit-кроці + VIP-tag seed) — але дубль краще прибрати.

### БОРГ-3 (P2). Full-run 2-worker contention
- У ПОВНОМУ chromium-прогоні (`--project=chromium` без розбивки) ~кілька специв флейкають
  (напр. `13-dynamic-pricing` — проходить ІЗОЛЬОВАНО). Це задокументована contention (config
  коментар, `workers:2`), НЕ регресія. RUNBOOK радить half-split. Опційно: підняти діагностику
  або зафіксувати half-split як офіційний gate.

### repo-parity Half#2 REPAIR — потребує OK founder (незворотне на проді)
- **Аудит ЗАВЕРШЕНО** (`03b487e3`, `XDEV/AUDIT/REPO_PARITY.md §HALF#2 AUDIT`): 50 unregistered +
  35 orphans повністю перелічені; інтроспекція довела «applied-but-unregistered» → **`db push`
  зараз небезпечний**.
- **Дія (ЛИШЕ з явним OK founder):** підтвердити решту ~41 (`supabase migration list` або
  per-object через Management API) → `supabase migration repair --status applied <усі 50>` →
  `supabase migration list` чистий → тоді `db push` безпечний. Команда + список — у REPO_PARITY.md.
- НЕ launch-блокер (деплой = `vercel --prod` + Management API, не push).

### C. Дії founder (я не можу)
- Vercel Pro → крони reminders/briefing (daily→hourly, промахують ~95% на Hobby) + check-uncompleted.
- Monobank реальна тестова транзакція.
- Домен `bookit.com.ua`: аліас у Vercel-проєкт + `NEXT_PUBLIC_SITE_URL` (тоді canonical/JSON-LD/
  sitemap автоматично стануть на прод-домен — усе вже env-derived через `getBaseUrl`).

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
