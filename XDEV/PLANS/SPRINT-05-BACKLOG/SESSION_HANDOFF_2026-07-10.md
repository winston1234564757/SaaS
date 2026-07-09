# Session Handoff — 2026-07-10 (борги закрито + repo-parity repair + founder-дії)

> Читай ЦЕ першим на старті наступної сесії (після `mempalace_status` + SYSTEM_MAP).
> Сесія 2026-07-10 закрила БОРГ-1/2/3 (3 коміти). Сесія 2026-07-09 закрила секцію A+B.
> Деталі: цей файл + `SESSION_HANDOFF_2026-07-09.md`.

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
