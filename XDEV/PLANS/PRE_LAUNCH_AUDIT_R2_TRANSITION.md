# Pre-Launch Audit R2 — TRANSITION / SESSION HANDOFF
> Точка входу для нової сесії. Читай ЦЕ + `PRE_LAUNCH_AUDIT_R2.md` (трекер) + `R2-findings/*.md` (деталі).
> Оновлено: 2026-07-07 (День 3 — code-фікс-батч ЗАКРИТО) · Запуск: 2026-07-10 (публічний домен + реальні Monobank + Vercel Pro).

---

## СТАРТ НОВОЇ СЕСІЇ — зроби перше
1. `mempalace_status` (IRON RULE -1). MemPalace живий, боргу на запис НЕМА — обидва P0 задокументовані drawer'ами (`bookit/fixes` IDOR + `bookit/problems` link-phone).
2. Прочитати `PRE_LAUNCH_AUDIT_R2.md` (трекер, повний стан) + цей файл.
3. НЕ перезапускати вже зроблене (див. «ЗРОБЛЕНО»).

## Контекст за 30 секунд
R1-аудит (2026-06-20) застарів — 372 коміти. Запустили R2: повний re-run 15 аудитів, triage-first, мультиагент. **День 1 (4 P0-аудити) + День 2 (4 P1/P2-аудити) завершено. Знайдено й закрито 2 P0 на проді.** Лишилось: 4 аудити (#5/#6/#12/#15) + фікс-батч 11×P1 (День 3) + регресія/launch-checklist (День 4).

---

## ✅ ЗРОБЛЕНО (не чіпати)

### 2 P0 — ОБИДВА ЗАКРИТО Й ВЕРИФІКОВАНО НА ПРОДІ
1. **IDOR-кластер (День 1):** 21 `SECURITY DEFINER` RPC приймали owner-id аргумент без `auth.uid()`-гарду й без REVOKE → anon (публічний ключ) вивантажував клієнтську базу. Фікс двоетапний (REVOKE anon/PUBLIC + `auth.uid()`-guard) через Supabase Management API. Верифіковано матрицею ролей. Repo: `supabase/migrations/20260706120000_security_idor_analytics_guard.sql`.
2. **Account-takeover (День 2, Backend#8):** `/api/auth/telegram/link-phone` видавав magiclink-токен логіну за телефоном із тіла запиту (initData доводить лише хто TG-юзер, не власника телефону). Осиротілий (0 викликачів). **Видалено, закомічено (`d7039cab`), змерджено в `main` (`79ddf717`), задеплоєно. Верифіковано: `POST .../api/auth/telegram/link-phone` → 404.**

### Аудити Дня 1-2 — 8/12 готово (звіти в `R2-findings/`)
| # | Аудит | P0 | P1 | P2 | P3 |
|---|-------|----|----|----|----|
| 1 | Security | 5→FIXED | 1 | 4 | 3 |
| 7 | Database | 0 | 1→FIXED | 4 | 6 |
| 9 | Auth | 0 | 0 | 2 | 4 |
| 10 | Billing | 0 | 3 | 3 | 3 |
| 8 | Backend/API | 1→FIXED | 2 | 4 | 7 |
| 2 | A11y | 0 | 3 | 9 | 9 |
| 11 | Notifications | 0 | 3 | 8 | 10 |
| 13 | Mobile | 0 | 3 | 5 | 8 |

### Інфраструктура
- `TELEGRAM_WEBHOOK_SECRET` — додано в Vercel + webhook перереєстровано + прод-редеплой зроблено (активний).
- C2B-trial = **21 день** (founder підтвердив 2026-07-07; код правильний, тест застарів → оновити в День 3).
- Baseline: `tsc` 0 ✅ · `build` OK ✅ · `npm test` 4 впало/1004 (застарілі реферальні тести, не регресія).

---

## 📋 ЩО ЛИШИЛОСЯ

### Твоя ручна дія (не код)
1. **`git push origin main`** — локальний main на **103 коміти попереду origin** (origin = бекап, деплой іде через `vercel --prod`). Пуш відправить усі 103 за раз. Founder ще не давав команду пушити — спитати.

### ✅ День 3 code-фікс-батч — ЗРОБЛЕНО (2026-07-07, tsc 0 + build чистий, НЕ закомічено/НЕ задеплоєно)
Дрovers: `bookit/fixes` 84ff8299 (billing) + 9ea66dd2 (security/shop/notif/a11y).
1. **client_id spoof (P1)** — `createBooking.ts`: `resolvedClientId=null` на старті online-гілки; лише authed client→user.id. Закрито /my/bookings-підробку + C2C/barter злив.
2. **Billing recurring (3×P1)** — міграція `20260707130000` (атомарний claim RPC + `charging_at`/`pending_invoice_id`) + `expire-subscriptions` (pending defer, не paid) + `mono-webhook` (`settleRecurringCharge` для `recurring_*`). ⚠️ **Не launch-critical: рекурент не спрацює ~30 днів** (next_charge_at=+30д). ⚠️ **Deploy order: міграція ПЕРЕД кодом.**
3. **Shop qty+stock (P2+P3)** — обидва order-шляхи: qty≥1 валідація + `decrement_product_stock_atomic` RPC + rollback; N+1 stock_alert прибрано.
4. **Notifications (2×P1+2×P2)** — `after()` на detached-notify (products/bookings); flash enum міграція `20260707131000` (`in_app`); `notifications.ts` void→await; TG-URL→env.
5. **A11y/Mobile** — `pb-safe` @utility; 4 дровери z-[80]; Sheet dvh; checkout-дровер повний modal-retrofit (role/trap/Escape/scroll-lock/z над навбаром); toast+success/error aria-live; ClientCombobox Enter.

**Далі в сесії — ЗРОБЛЕНО (продовження, tsc 0 + build 58/58 + vitest 1004/1004):**
6. **SMS-guardrails (P2)** — міграція `20260707132000` (`notification_sms_log` + `check_notification_sms_budget`, per-recipient 6/добу + global 400/добу, advisory-lock як OTP-лімітер 019). Гейт у `sendTurboSMS` (гардить orchestrator+broadcast+rebooking; OTP окремий шлях; fail-open). Broadcast: TG-успіх тепер suppress'ить SMS.
7. **PWA icon-route (блокер)** — `icons/[size]/route.tsx` `parseInt(sizeStr)` на `icon-192.png`→NaN→404 (усі 3 manifest-іконки зламані). FIX: `parseInt(sizeStr.replace(/[^0-9]/g,''))`.
8. **Механічна a11y (частково)** — button type ×17 (усі motion.button у P2-списку + 2 ролі TelegramWelcome); тач-таргети money-path pills py-1.5→py-2 (ShopPage FilterChip, ProductsPage статус-фільтр).
9. **4 застарілі тести → green baseline 1004/1004** — partners ×2 (мок createAdminClient + partner_invite_token), referrals C2C (мок c2c_referral_code ключ), referrals C2B (21д не 30д). ⚠️ Зловив ВЛАСНУ регресію: `after()` в stock-тесті кидав «outside request scope» → замокав `next/server after`. Інакше проскочило б у Day-4.
10. **SEO-аудит (інлайн, агент впав)** — `R2-findings/05-seo.md` (0 P0/P1, 2 P2, 4 P3). Домен-переїзд БЕЗПЕЧНИЙ (усе env-driven). Фікс 2 launch-дефектів: root OG (`opengraph-image.tsx` замість битого `/og-default.png` → share-картки головної) + apple-іконка (`icon-180.png` 404 → прибрано, file-convention покриває).

**Залишок (не зроблено):**
- 🔒 **Крон reminders/briefing daily→hourly** — Vercel Hobby (відхиляє sub-daily крон навіть на деплої). Разом із `check-uncompleted` після Pro.
- **Аудити — ВСІ 15 R2 ЗАКРИТО:** SEO(#5) ✅+фікси · Performance(#6) ✅+фікси `06-performance.md` · Testing(#15) ✅ `15-testing.md` · PWA(#12) ✅ фікс інлайн.
- **Performance безпечні фікси (ця сесія):** revalidatePath('/','layout')→скоуплено (createBooking→dashboard/my-bookings; my/profile→/my); shop-page waterfall→Promise.all; [slug] drop unused `photos` column.
- **Performance 2×P1 НЕ чіпано (за 3 дні):** #1 fully-dynamic [slug] (~11 запитів/візит; фікс=архітектура Suspense-острів; деградація не поломка; ТОП post-launch перф) · #3 broadcast serial loop (timeout >40-50 отримувачів; Pro-фіча revenue-критична, потребує тесту).
- **SEO-залишок (P2/P3 із 05-seo.md)** — AI-crawler rules у robots (GEO); JSON-LD url хардкод (page.tsx:446, збігається з launch-доменом); canonical на explore/landing/legal. Усе hardening.
- **Механічна a11y-залишок** — Lucide style ×57 (finding: «not a user-facing break», чиста конвенція); checkout qty-степпери size-7→44px (**потребує own-eyes** — зсув layout чекауту); NP combobox-ARIA; wizard inter-step focus; wip-тем календарі (нереачабельні).
- **repo-parity** — back-port IDOR guard-тіл + `schema_migrations` desync (вкл. `decrement_product_stock_atomic` відсутній у репо) ДО `supabase db push`.
- **4 застарілі тести** — partners/referrals + C2B trial=21д.

**✅ DEPLOYED (2026-07-07):** мерж `hotfix/r2-prelaunch-fixes`→main (`108e9961`, `--no-ff`). 3 міграції застосовано в прод через Management API ПЕРЕД деплоєм і верифіковано (billing_cols=2, claim_rpc=1, sms_rpc=1, enum_in_app=1, sms_table=1). `vercel --prod` → READY (`dpl_3e7FSeYcsezVvu8rNc7pa8199dPc`), build 2m. Прод-smoke ✅: PWA `/icons/icon-{192,512,512-maskable}.png` тепер 200 (були 404), `/opengraph-image` 200, manifest/robots/sitemap/apple-icon 200.
- ⚠️ `bookit-five-psi.vercel.app` віддає 404 — цей аліас відчеплений від проєкту (деплой живий на `bookit-winston1234564757s-projects.vercel.app`). На запуск = переїзд на `bookit.com.ua`: зааліасити домен + `NEXT_PUBLIC_SITE_URL=https://bookit.com.ua` коли DNS готовий.
- ⚠️ НЕ запушено в origin (main +104 локально). Крон досі на Hobby (заблокований).

---

### (архів) Первісний план Дня 3 — порядок за ризиком:

**Крони (Backend#8 + Notifications#11, той самий баг — найкритичніший):**
- Reminders-крон розклад daily (`0 7 * * *`), а код під hourly-вікна → нагадування 24h/2h/30m промахують ~95% бронювань, `master_day_briefing` не спрацьовує ніколи. Прив'язано до Vercel Pro (той самий хвіст `check-uncompleted 0 * * * *`). Полагодити розклад ПІСЛЯ апгрейду на Pro.

**Billing (10-billing.md):**
- pending трактується як paid (`MonoProvider.ts:117` + `expire-subscriptions:236`, `succeeded = status !== 'failure'`).
- рекурентний webhook не реконсілиться (orderId `recurring_*` vs webhook приймає лише `bookit_*`).
- SKIP LOCKED lock звільняється до charge → ризик подвійного 700₴.

**Notifications (11-notifications.md):**
- detached-проміси в serverless (нове shop-замовлення → майстер `products/actions.ts:435` та ін.) губляться; `after()` лише в 3 місцях.
- flash-deal in-app тихо падає на enum-неспівпадінні, а stats пише `in_app_sent: true`.

**Backend (08-backend-api.md):**
- client_id spoof на анонімних бронюваннях → підробка власності + злив реферального балансу жертви.

**A11y (02-a11y.md) + Mobile (13-mobile.md) — перетини:**
- checkout-дровер магазину без dialog role / focus trap / Escape / scroll lock (launch-critical оплата).
- нуль `aria-live` на весь застосунок (тости/підтвердження/помилки німі для скрінрідерів).
- ClientCombobox вибирає лише `onMouseDown` → Enter не працює.
- зламаний z-index bottom-sheet каскаду (нав-бар майстра `z-[75]` перекриває «Зберегти»; клієнтський нав клікабельний поверх чекауту).
- undefined `pb-safe`/`pb-safe-bottom` utility → safe-area на нав-барі не працює.

**Дрібне-але-вчасне:**
- хардкод `bookit-five-psi.vercel.app` у Telegram-боті (Notifications#11) — за 3 дні до переїзду на публічний домен.
- 4 застарілі тести оновити (partners/referrals: admin-client + токени; C2B trial=21д — код правильний, тест хоче 30).
- repo-parity: back-port guard-тіл IDOR у source-міграції кожної функції + `schema_migrations` desync 9+ файлів ДО будь-якого `supabase db push`.

### Аудити ще НЕ запускались (День 2-3) — 4 штуки
Запустити 4 паралельні агенти (як День 1-2): **#5 SEO, #6 Performance, #12 PWA, #15 Testing gap.**
- #12 PWA: `public/icons/` не існує, manifest посилається на неіснуючі PNG (P3, блок А1).
- Скіли основної сесії ще не ганялись: **#14 code-review+simplify** (дельта), **#3 impeccable** (design по групах сторінок), **#4 humanizer** (copy).

⚠️ **Урок Дня 2:** агенти падали на session-limit. Якщо агент впав — `SendMessage` на його agentId «continue where you left off» відновлює з ТРАНСКРИПТУ (не з нуля). Спрацювало 4/4.

### День 4 — регресія + launch checklist
tsc→build→test→e2e зелене · deploy preview + own-eyes smoke (реєстрація→onboarding→бронювання→PostBookingAuth→оплата test→магазин→нотифікації) · прод-верифікація robots/sitemap/OG/manifest/JSON-LD/Lighthouse · Monobank тестова транзакція.

---

## Ключові факти для нової сесії
- Прод Supabase ref: `sqlrxsopllgztvgrerqk` · Management API токен: `bookit/.env.local` `SUPABASE_ACCESS_TOKEN`.
- Management API виклик: `POST https://api.supabase.com/v1/projects/{ref}/database/query` з User-Agent браузера (інакше Cloudflare 1010). SELECT + guarded DDL.
- Прод-домен: `bookit-five-psi.vercel.app` (bookit.com.ua ще не зроутений). Деплой: `cd bookit && npx vercel --prod --yes`.
- Роутинг-гард: `src/middleware.ts` (НЕ proxy.ts — застаріла нотатка).
- Git: main на 103 коміти попереду origin; hotfix-гілки мерджити `--no-ff` у main.

---

## PALACE CLEANUP — відкладено на post-launch (стан 2026-07-07)
З ~30 143 дроверів ~20 000 — bulk-import сирих транскриптів (`claude_imports` 9872 + `sessions` 10136 + `wing_sessions` 513), ~85% шум, джерела на диску не існують. Суть продубльована в курованих drawers + git. Founder: чистити ПІСЛЯ запуску.
**Як докінчити:** `mcp__mempalace__mempalace_delete_by_source` (per source_file, exact; вингового bulk-delete нема). НЕ direct-SQL по `chroma.sqlite3` (HNSW+FTS+embeddings легко зкорумпувати). Перелічити джерела read-only через `sqlite3 ...?mode=ro`, цикл delete_by_source, після кожного вінгу контрольний `mempalace_search`. Лишити `bookit`-вінг недоторканим.
