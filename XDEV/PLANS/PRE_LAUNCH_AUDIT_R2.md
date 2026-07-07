# Pre-Launch Audit — Round 2 (повний re-run)
> Запуск: **2026-07-10** — публічний домен + реальні платежі Monobank + Vercel Pro.
> Причина R2: R1 (2026-06-20) застарів — 372 коміти / 382 файли змінено (DS-розкат 31 поверхня, Sprint-05: магазин+НП, C-DESK-01, динамічні ціни).
> Режим: **triage-first** — агенти збирають findings, фікси централізовано (P0→P1) у День 3.
> Створено: 2026-07-06

Повні findings по секціях: `XDEV/PLANS/R2-findings/*.md`

---

## Блок А — інфраструктурні хвости R1

| # | Хвіст | Статус |
|---|-------|--------|
| A1 | PWA іконки: `public/icons/` не існує, manifest посилається на 3 PNG | ⬜ |
| A2 | Міграції: звірка local ↔ prod (особливо `20260607000000_security_search_path_fix`) | 🔄 (DB-агент) |
| A3 | Vercel env — перевірено `vercel env ls production` | 🔄 див. нижче |
| A4 | Cron `check-uncompleted` `0 17 * * *` → `0 * * * *` після Vercel Pro | ⬜ (чекає Pro) |

### A3 — Vercel env findings (2026-07-06)
- ✅ Присутні: `NEXT_PUBLIC_SITE_URL`, `NOVAPOSHTA_API_KEY` (**server-only, не NEXT_PUBLIC_** ✅), `MONO_API_KEY`, `CRON_SECRET`, `SUPABASE_SERVICE_ROLE_KEY`, VAPID×3, `TELEGRAM_BOT_TOKEN`, `RESEND_API_KEY`, `TURBOSMS_TOKEN`.
- **[P1] `TELEGRAM_WEBHOOK_SECRET` ВІДСУТНІЙ** — код вебхука fail-closed (`if(!process.env.TELEGRAM_WEBHOOK_SECRET) return 403`). Без нього ВСІ вхідні Telegram-апдейти → 403, бот не приймає повідомлення. **Дія до запуску:** додати env + зареєструвати webhook у Telegram з тим самим `secret_token`.
- [info] `DEBUG_TOKEN` відсутній → debug-ендпоінт `/api/debug/fire-notifs` завжди 403 = безпечно вимкнений. Дія не потрібна (або додати, якщо треба доступ).
- [?] Присутні і `WAYFORPAY_*`, і `MONO_API_KEY` — білінг-агент має підтвердити, який еквайєр живий на проді.

---

## Progress Tracker R2

| # | Аудит | Пріоритет | Хто | Статус | P0 | P1 | P2 | P3 |
|---|-------|-----------|-----|--------|----|----|----|----|
| 1 | Security | P0 | security-reviewer | ✅ | 5→**FIXED** | 1 | 4 | 3 |
| 7 | Database | P0 | general-purpose | ✅ | 0 | 1→**FIXED** | 4 | 6 |
| 9 | Auth Flows | P0 | general-purpose | ✅ | 0 | 0 | 2 | 4 |
| 10 | Billing | P0 | general-purpose | ✅ | 0 | 3 | 3 | 3 |

**P0 IDOR-кластер (Security#1 + DB#7 той самий root) — ЗАКРИТО на проді (див. секцію вище).**
Ключові позитиви від агентів: orders RLS безпечний (anon→0 рядків, PII клієнтів захищено) · mono-webhook надійний (ECDSA+replay+idempotency) · shop-замовлення = COD, сума рахується сервером (не тамперабельна) · NP-ключ server-only · auth пережив переробку /my/* (0 P0/P1) · search_path_fix застосований на проді · XSS чистий.

Незакриті P1 (День 3 fix-батч):
- ~~Vercel: `TELEGRAM_WEBHOOK_SECRET`~~ — ✅ закрито (env + редеплой 2026-07-07).
- Billing: pending трактується як paid (`MonoProvider.ts:117`+`expire-subscriptions:236`) · рекурентний вебхук не реконсілиться (orderId формат) · SKIP LOCKED-лок не покриває charge → ризик подвійного 700₴.
| 8 | Backend/API | P1 | agent (День 2) | ✅ | **1** | 2 | 4 | 7 |
| 2 | Accessibility | P1 | agent (День 2) | ✅ | 0 | 3 | 9 | 9 |
| 14 | Code Quality | P1 | сесія: code-review+simplify (День 2) | ⬜ | | | | |
| 3 | Design/Visual | P2 | сесія: impeccable (День 2) | ⬜ | | | | |
| 4 | UX Copy | P2 | сесія: humanizer (День 2) | ⬜ | | | | |
| 13 | Mobile | P2 | agent (День 2) | ✅ | 0 | 3 | 5 | 8 |
| 11 | Notifications | P2 | agent (День 2) | ✅ | 0 | 3 | 8 | 10 |
| 5 | SEO | P3 | agent (День 3) | ⬜ | | | | |
| 6 | Performance | P3 | agent (День 3) | ⬜ | | | | |
| 12 | PWA | P3 | agent (День 3) | ⬜ | | | | |
| 15 | Testing | P3 | agent (День 3) | ⬜ | | | | |

## Baseline (День 1)

| Перевірка | Результат |
|-----------|-----------|
| `npx tsc --noEmit` | ✅ 0 помилок |
| `npm run build` | ✅ успішно (exit 0) |
| `npm test` | ⚠️ 4 впало / 1004 — усі реферальні, вердикт нижче |
| `npm run test:e2e` | ⬜ seed сідить прод (`e2e_*@test.com` ізольовані) — безпечно, ще не запускав |

### Вердикт по 4 впалих тестах (не блокери запуску)
Категорія: **застарілі тести, не регресія коду.**
- `partners.test.ts` ×2 (`getPartnerInviteLink`): мок не мокає `createAdminClient` → `admin.from` на undefined; тест ще очікує старий контракт (лінк з `referral_code` через anon), а код після M-GROW-02 генерує `partner_invite_token` через admin. **Тест застарів.**
- `referrals.action.test.ts` C2C (`getOrCreateReferralLink`): очікує фіксований `ref=CLI001`, код генерує токен (`ref=3WWC84`). **Тест застарів.**
- `referrals.action.test.ts` C2B trial: код видає **21 день** (`referrals.ts:178 trialDays = isMasterRef ? 14 : 21`), тест очікує **30**. ✅ **Founder підтвердив (2026-07-07): канонічна C2B-trial = 21 день.** Код правильний, тест застарів — оновити тест у День 3.
- **Дія:** оновити 4 тести під новий контракт (День 3, P2 test-debt). Червоний suite маскує майбутні регресії реферал-коду.

---

## 🔴 P0 #2 — ACCOUNT TAKEOVER через /api/auth/telegram/link-phone (2026-07-07, День 2)

**Статус: ✅✅ ЗАКРИТО Й ВЕРИФІКОВАНО НА ПРОДІ (2026-07-07).** Осиротілий роут (0 фронтенд-викликачів) видалено, `npm run build` exit 0, коміт `d7039cab` на гілці `hotfix/p0-telegram-link-phone`, задеплоєно (`vercel --prod`, deployment `dpl_FZcmRwEi2PL415D7cWJYLSQBVPun` READY). **Верифікація:** `POST https://bookit-five-psi.vercel.app/api/auth/telegram/link-phone` → **404**. `ensureTelegramClientIdentity` збережено (вживає webhook-роут). ⚠️ Гілку hotfix ще НЕ змерджено в `main`.

- **Файл:** `src/app/api/auth/telegram/link-phone/route.ts`.
- **Діра:** роут валідує `initData` (доводить лише що викликач — *якийсь* TG-юзер), але `phone` бере з тіла запиту (рядок 9) без жодної прив'язки до TG-акаунта. Потім `admin.auth.admin.generateLink({type:'magiclink', email: generateVirtualEmail(e164Phone)})` (64-67) видає OTP-токен логіну для акаунта ЦЬОГО телефону і повертає його викликачу (`token: linkData.properties.email_otp`, рядок 79).
- **Експлойт:** будь-хто з валідним `initData` власного TG-акаунта (тривіально — відкрити міні-апку) → `POST {initData: свій, phone: жертви}` → токен логіну як жертва. Телефони майстрів публічні → захоплення акаунта БУДЬ-ЯКОГО майстра/клієнта.
- **Рекомендація:** роут осиротілий (0 викликачів) → **видалити файл** (найбезпечніше, нічого не ламає) АБО, якщо потрібен пізніше, переписати: phone брати ТІЛЬКИ з верифікованого SMS-OTP, ніколи не з тіла запиту при видачі логін-токена. Видалення = code change до прод-роуту → потребує redeploy.
- **Верифікація зробленого фіксу (коли видалимо):** `curl -X POST .../api/auth/telegram/link-phone` на проді → 404.

---

## ✅ P0 BREACH — ЗАКРИТО Й ВЕРИФІКОВАНО НА ПРОДІ (2026-07-06)

**Статус: ВИПРАВЛЕНО.** Матриця ролей на `get_master_clients` (прод): OWNER→16 рядків · чужий authenticated→`42501 access denied` · service_role(cron)→16 рядків · anon→`permission denied`.

Двоетапний фікс, застосований через Supabase Management API:
- **Етап 1 — `REVOKE EXECUTE FROM PUBLIC, anon`** на 21 overload (20 функцій + claim_phone_discount). Вбиває інтернет-вектор (публічний anon-ключ). `authenticated`/`service_role` зберегли явні гранти → застосунок і крони працюють.
- **Етап 2 — ownership-guard** `IF auth.uid() IS NOT NULL AND auth.uid() <> p_master_id THEN RAISE 42501` на 20 функцій (15 plpgsql інжекція після BEGIN; 5 sql → обгортка в plpgsql з RETURN QUERY, сигнатури RETURNS ідентичні). Guard безпечний для всіх ролей: cron/service_role (null uid) проходить, свій майстер проходить, чужий залогінений — блок. Закриває крос-майстровий authenticated-вектор.
- Верифікація повноти: усі 21 overload — anon revoked ✅; усі 20 — auth.uid guard присутній ✅.

**Залишок — статус (оновлено 2026-07-07):**
- `get_c2c_balance(p_referrer_id, p_master_id)` — ✅ **ЗАКРИТО** (founder ОК). Guard по `p_referrer_id`, anon revoked. Верифіковано: owner→OK, attacker→42501, service_role→OK. Жоден викликач не anon (wizard/PublicMasterPage лише для залогінених, createBooking через admin). IDOR-кластер тепер 21/21.
- `claim_phone_discount` — anon відкликано ✅, auth.uid guard НЕ додано (клієнт-викликач, немає app-caller). Residual: залогінений може «спалити» чужий discount. P2 → Day-3.
- **Repo parity:** ✅ міграційний файл `supabase/migrations/20260706120000_security_idor_analytics_guard.sql` створено (ідемпотентний REVOKE-safety-net + документація guard-патерну). Guard-тіла живуть на проді (застосовано через API); back-port у source-міграції кожної функції — Day-3 repo-parity пас. ⚠️ Реєстр `schema_migrations` desync на 9+ файлів — вирішити ДО будь-якого `supabase db push`.
- **`TELEGRAM_WEBHOOK_SECRET`** — ✅ додано у Vercel Production+Preview, webhook перереєстровано з `secret_token` (url `bookit-five-psi.vercel.app`, ok:True). ✅ **Прод-редеплой виконано founder-ом 2026-07-07 — секрет активний.**

---

## 🔴 P0 BREACH — початкове підтвердження (історія, 2026-07-06)

**Анонімний витік PII усієї платформи.** ~18 аналітичних/CRM RPC — `SECURITY DEFINER`, фільтр по аргументу `p_master_id` (НЕ `auth.uid()`), `anon` має EXECUTE (Postgres default PUBLIC, нема REVOKE). Доказ: `has_function_privilege('anon', oid, 'EXECUTE')=true` на проді + тіла з `master_id = p_master_id`.

Експлойт: будь-хто з публічним `NEXT_PUBLIC_SUPABASE_ANON_KEY` (у JS-бандлі) + будь-який master UUID (є в кожному публічному payload сторінки/магазину) → `POST /rest/v1/rpc/<fn>`.

Точно підтверджені експлуатовні (запит до pg_proc на проді):
- **`get_master_clients(p_master_id)`** — вся клієнтська база будь-якого майстра: імена, телефони, LTV, VIP, приватні нотатки. НАЙГІРШЕ.
- **`get_churn_predictions(p_master_id)`**, **`get_ltv_concentration(...)`**, **`get_retention_stats(...)`** — клієнтські імена+телефони+LTV.
- **`get_analytics_extras(p_master_id)`** — виручка/маржа/фінанси + churn/winback з PII (agent-read, regex не зловив aliased-фільтр).
- **`get_dynamic_pricing_uplift(p_master_id)`** — виручка (початковий лід, M-REV-05 регресія).
- Також anon-EXECUTE, але фільтрують по `auth.uid()` (БЕЗПЕЧНІ, anon→порожньо): `get_pricing_rule_stats`, `get_pricing_rules_overview`.

**Fix:** rewrite → `WHERE master_id = auth.uid()` (drop p_master_id) + `REVOKE EXECUTE FROM anon` + `GRANT TO authenticated`. Референси: міграції `20260628000003`, `20260628000007`. Примітка: `authenticated=X` теж → будь-який залогінений юзер (клієнт/конкурент) може читати чужі дані до фіксу — тому auth.uid()-фільтр обов'язковий, не лише revoke anon.

## Triage (заповнюється День 3)

| Severity | К-сть | Рішення |
|----------|-------|---------|
| P0 | — | фікс до запуску, блокує |
| P1 | — | фікс до запуску |
| P2 | — | backlog post-launch (рішення founder) |
| P3 | — | backlog post-launch |
