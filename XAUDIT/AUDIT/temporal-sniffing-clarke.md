# Pre-Release Audit & Fix Plan — BookIT

Launch: **повний публічний, завтра**. Scope of this session: **глибокий аудит + план виправлень** (без правок коду).

## Context

Завтра BookIT виходить у повний публічний запуск. Потрібен системний pre-release аудит: відповідність код ↔ текст, цілісність кожної фічі, відсутність соромних дефектів. Користувач дав три рамки:
1. Джерело правди — **живий код**, а не мапи/звіти.
2. `XAUDIT/REACT_DOCTOR_REPORT.md` **ігнорувати** (застарів; усе вже виправлено, звіт не оновлений). Його health-score 2/100 і "23 Server Actions без auth()" — переважно false positives (auth робиться через `getUser()`-хелпери на кшталт `getMasterId()`, а не через літеральний `auth()`).
3. RELEASE-roadmap (`STATUS.md`, `PAGE_RELEASE_ROADMAP.md`) — це трекер **ручної посторінкової перевірки** користувача, а НЕ показник готовності коду. "3/13" = скільки сторінок він особисто прокликав, фічі збудовані.
4. Studio-тариф має світитись **"в розробці"** — отже НЕ має бути self-serve купованим.

Канонічні ціни (підтверджено MemPalace + кодом): Starter 0₴ · Pro 700₴ (`70000` коп.) · Studio 299₴/майстер (`29900` коп.).

---

## Частина 1 — Перевірені знахідки (high-confidence, з file:line)

### P0 — блокери повного публічного запуску

**P0-1. Studio купується за реальні гроші, але "в розробці" + неправильна цінова модель.**
- `src/components/master/billing/BillingPage.tsx:51-65` — картка Studio у `PLANS`, ціна '299'.
- `BillingPage.tsx:109-126` — `handleUpgrade('studio')` → `createMonoInvoice('studio')` → `window.location.href = invoiceUrl` (живий checkout Monobank).
- `src/app/(master)/dashboard/billing/actions.ts:25-28` — `studio: { priceKopecks: 29900 }` → знімає **рівно 299₴ FLAT**, а не 299₴ × N майстрів.
- `src/app/(master)/dashboard/studio/page.tsx:47` — сам модуль каже **"Модуль Studio готується"**.
- `src/lib/billing/pricing.ts` — немає жодної логіки per-master (299×N); увесь калькулятор рахує лише Pro (700₴).
- **Наслідок:** майстер може заплатити 299₴ за тариф, який (а) не побудований, (б) за невірною ціною (flat замість per-master). Для публічного запуску — неприпустимо.
- **Рекомендований фікс (узгоджується з "в розробці"):** гейтнути Studio у `BillingPage` — кнопку купівлі замінити на не-checkout ("Скоро" / "Обговорити", disabled) і зробити, щоб `createMonoInvoice` відхиляв `'studio'`. Альтернатива (НЕ на завтра): реалізувати повний per-master білінг.

### P0-RISK — високий ризик, **підтвердити в живому коді на етапі виконання**
(MemPalace підсвітив; потребують прогону/трасування, бо тихо ламають критичні шляхи)

**P0R-1. Батч нагадувань падає на `NULL end_time`.** Якщо в записі `end_time IS NULL`, увесь батч `/api/cron/reminders` може тихо впасти → клієнти не отримають нагадування. Трасувати `src/app/api/cron/reminders/route.ts` + перевірити guard на null.

**P0R-2. Реферальний код тихо ігнорується.** `localStorage['bookit_ref']` шлеться у booking payload; якщо код невалідний/прострочений — мовчазне ігнорування, клієнт не знає, що знижка не застосувалась. Трасувати `createBooking.ts` + UI повідомлення.

**P0R-3. Платіжний домен.** `actions.ts:14` APP_URL fallback = `https://bookit-five-psi.vercel.app`, а SMS-копія (`notifMap.ts:538`) = `bookit.com.ua`. Якщо `NEXT_PUBLIC_SITE_URL` не виставлено на бойовий домен — Mono `redirectUrl`/`webHookUrl` ведуть на preview-URL → оплати/вебхуки ламаються. Перевірити прод-env перед запуском.

### P1 — важливі, швидкі (псують враження на повному запуску)

**P1-1. Бренд: розбіжність регістру.** "Bookit" вживається **87× у 60 файлах** консистентно (увесь лендінг, navbar, `layout.tsx` metadata-шаблон, OG). "BookIT" живе лише в доках/пам'яті. 2 проскакують як **"BookIt"** (велика I) — не збігаються ні з чим:
- `src/lib/telegram.ts:96` — `🔥 Новий запис from BookIt`
- `src/app/api/auth/send-sms/route.ts:124` — `Код підтвердження BookIt: ${otp}`
- **Декомпозиція:** (а) визначити канонічний регістр; (б) виправити 2 "BookIt"; (в) за потреби — масове вирівнювання. **Потрібне рішення користувача** (див. нижче).

**P1-2. No-Emoji policy — порушення в UI-тексті** (емодзі в самому інтерфейсі, не в месенджер-копії):
- `onboarding/steps/StepProfilePreview.tsx:291` — `Твоя сторінка готова 🎉`
- `onboarding/steps/StepSchedulePrompt.tsx:38` — `🎉` (text-5xl як головний візуал)
- `master/studio/StudioJoinPage.tsx:56` — `Ви у команді! 🎉`
- `master/billing/BillingPage.tsx:169` — `Оплата успішна! 🎉`
- `master/analytics/AnalyticsPage.tsx:887` — `🎉`
- `master/marketing/StoryGenerator.tsx:1278,1453`, `app/invite/[code]/page.tsx:113` — `✨`
- **Окремо (не чіпати без рішення):** `✨🔥🎉` у `notifMap.ts`, `telegram.ts`, `BroadcastEditor.tsx` — це **копія повідомлень** (TG/SMS/розсилки), не UI. Ймовірно навмисно. Підтвердити з користувачем.
- **Не порушення (це дані):** `categories.ts`, `onboardingTemplates.ts` emoji-поля, `avatar_emoji` — категорії/аватари.

**P1-3. A11y: `onClick` на не-кнопкових елементах** (per CLAUDE.md IRON = P1 блокер):
- `master/clients/ClientsPage.tsx` — 5 місць
- `master/pricing/DynamicPricingPage.tsx` — 1
- `master/dashboard/TodaySchedule.tsx` — 1
- Фікс: `<div onClick>` → `<button type="button">` + `aria-label`/`aria-pressed`, touch-target ≥44px.

**P1-4. Landing CTA "Обговорити Studio" веде на `/register`** (`LandingPricing.tsx:185` — усі плани роблять `router.push('/register')`). Текст обіцяє "обговорити" (sales-контакт), а дія — реєстрація. Якщо Studio "в розробці", картка лендінгу має це відображати (бейдж/інший CTA), щоб не продавати неготовий тариф.

### P2 — гігієна (не блокує, але "ідеально")

**P2-1. `console.*` — 290 викликів у 73 файлах.** Більшість — серверні (route handlers, Server Actions, cron) → ОК, ідуть у Vercel-логи. Дії: (а) прибрати client-component логи; (б) переконатися, що НЕ логуються чутливі дані — OTP (`send-sms/route.ts` 10 логів), card token (`mono-webhook/route.ts` 37 логів), Mono reference/amount (`createMonoInvoice` — прийнятно).

**P2-2. Артефакти:** `bookit/broken_files.txt` — порожній (1 рядок), прибрати. У git status видалені `XSCRENN/*.png` — підтвердити навмисність.

---

## Частина 2 — Рішення, потрібні від користувача (до фіксів)

1. **Канонічний регістр бренду.** Рекомендація: прийняти **"Bookit"** як канон (87 живих вживань: лендінг/navbar/metadata) і виправити лише 2 "BookIt" + синхронізувати доки. Якщо правильний бренд — "BookIT", це масовий rename 87 місць + дизайн-рев'ю (великий обсяг, навряд на завтра).
2. **Гейтинг Studio.** Рекомендація: (а) приховати/вимкнути купівлю Studio у `BillingPage` + відхиляти `createMonoInvoice('studio')` (швидко, узгоджено з "в розробці"). Альтернатива (б): добудувати per-master білінг (великий обсяг).
3. **Емодзі в копії повідомлень** (TG/SMS/розсилки) — лишаємо чи прибираємо? (UI-емодзі прибираємо в будь-якому разі.)

---

## Частина 3 — Систематична верифікація "кожної фічі" (методологія виконання)

Аудит вище — це high-confidence знахідки з цільових зрізів. Повне "протестувати все" виконується так:

**A. Пайплайн (RULE 3):** `npx tsc --noEmit` → `npm run build` → `npm test` (vitest) → `npm run test:e2e`.
- E2E вже покриває критичні шляхи (30+ специфікацій у `bookit/e2e/tests/`): auth-contract/guards, time-travel, referral-engine, crm, loyalty, notifications, booking-complete, master-settings/bookings/clients, flash-deals, dynamic-pricing, client-journey, analytics, mobile-smoke, retention, broadcasts, services-loading, stabilization. Прогнати повністю, зафіксувати падіння.
- Unit-тести наразі мінімальні (`smartSlots.test.ts`, `billing.test.ts`) — критична логіка слотів/підпису Mono покрита.

**B. Per-route smoke-матриця** (public / auth / dashboard / client / admin — повний список маршрутів є в `XDEV/MAPS/SYSTEM_MAP.md`). Для кожного маршруту чек: рендериться · ключова дія працює · empty/error-стани · 0 emoji в UI · 0 `div onClick` · копія через `/humanizer` · мобільний вигляд · 3 теми (Blossom/Studio/Frost).

**C. Authz-рев'ю admin-client.** Кожна Server Action, що `createAdminClient()` робить UPDATE/DELETE by id, має звіряти ownership (`master_id = auth.user.id`), а не лише факт логіну. Цільові файли: `dashboard/products/actions.ts`, `dashboard/bookings/actions.ts`, `dashboard/clients/actions.ts`, `lib/actions/referrals.ts`, `lib/actions/partners.ts`, `dashboard/flash/actions.ts`. (RLS-hardening вже був у міграції 087 — звірити, що покриває всі шляхи.)

**D. Завершення code↔text sweep** по всіх маршрутах: бренд, ціни/ліміти тарифів, заявлені фічі vs реалізація, контактні дані, support-email, легальні тексти (`legal/[slug]`).

---

## Частина 4 — Послідовність виправлень (після узгодження)

1. **P0-1 Studio gating** (після рішення #2) — `BillingPage.tsx` + `billing/actions.ts` guard. Humanizer для нового CTA-тексту.
2. **P0R-1/2/3** — підтвердити в коді → фікс null-guard нагадувань, видимий стан реферального коду, пін прод-домену в env.
3. **P1-2 emoji в UI** — видалити/замінити Lucide-іконкою (перелік вище).
4. **P1-3 a11y** — `div onClick` → `button` (7 місць).
5. **P1-1 бренд** — за рішенням #1 (мінімум: 2 "BookIt").
6. **P1-4 landing Studio CTA** — узгодити з гейтингом.
7. **P2** — прибрати client console, артефакти.
- Кожна зміна UI-копії: спочатку `/humanizer`, потім у файл. Cyrillic-файли: encoding pre-check (RULE 0). Bulk Edit Protocol (RULE 5): Read → Write all → tsc.

---

## Частина 5 — Верифікація (як підтвердити готовність)

- `npx tsc --noEmit` = 0 помилок; `npm run build` = успіх.
- `npm run test:e2e` = усі специфікації зелені (особливо booking-complete, notifications, billing-залежні).
- Ручний smoke money-path на прев'ю-деплої: публічна сторінка майстра → wizard → слот → підтвердження → нотифікація (TG/SMS/push) приходить.
- Mono: тестовий інвойс Pro (700₴) створюється, redirect/webhook ведуть на бойовий домен; Studio — НЕ купується.
- Grep-перевірки після фіксів: 0 emoji в UI-JSX, 0 `div/span/p onClick`, 0 stray "BookIt".
- Оновити `XDEV/MAPS/SYSTEM_MAP.md` + `mempalace_add_drawer` з ключовими рішеннями (RULE 3).

---

## Примітки

- Plan-агента Phase 2 свідомо пропущено: задача — аудит (аналіз), а не складна архітектурна імплементація; усі знахідки перевірені особисто на живому коді.
- Studio-**тема** (темний dashboard-вигляд, `StudioDashboard.tsx`, `widgets/studio/*`) — повністю готова й не плутати зі Studio-**тарифом** (команда/299₴), який "в розробці".

---

# Доповнення (2026-05-31): перевірка 4 підсистем — продукти / діплінки / сповіщення / рефералки

Зупинено на вимогу користувача; нижче — те, що встиг перевірити (продукти — особисто в коді; діплінки/сповіщення/рефералки — через Explore-агентів, потребують фінального підтвердження прогоном).

## ПРОДУКТИ — чому не показуються на публічних сторінках (діагноз)

На публіці товари існують лише як банер "Магазин" на `PublicMasterPage` → лінк на `/[slug]/shop`. Інлайн-списку товарів на головній публічній сторінці немає. Три причини:

1. **`stock_qty > 0` фільтр (точно в коді) — головний підозрюваний.**
   - `src/app/[slug]/page.tsx:154-155` — `.eq('is_active',true).gt('stock_qty',0)`
   - `src/app/[slug]/shop/page.tsx:66-67` — те саме
   - `createProduct` дефолтить `stock_qty ?? 0` (`products/actions.ts:74`); DB default теж 0 (міграція 102:21)
   - → товар без явно заданого залишку (типово для "рекомендованих" б'юті-товарів) невидимий на публіці, але видимий у дашборді (`useProducts` фільтрує лише `is_archived`, без stock).
   - Невідповідність: хук `usePublicProducts` (useProducts.ts:96-98) НЕ має stock-фільтра — розбіжність із серверними запитами.
   - **Фікс (потрібен вибір):** не ховати out-of-stock (показувати з бейджем "немає"), бо `recommend_always` дефолт true; АБО зробити stock обов'язковим у редакторі. Правильно — розділити "видимість" і "можна купити".

2. **Pro/Studio-гейт магазину.** `/[slug]/shop` для Starter → екран "Магазин недоступний" (`shop/page.tsx:46-58`); банер на головній теж лише pro/studio + products.length>0 (`PublicMasterPage.tsx:787`). Якщо тест-майстер на Starter — товарів не буде за дизайном. Підтвердити тариф тест-майстра. Бонус: UI-емодзі `🔒` (`shop/page.tsx:49`) — порушення No-Emoji.

3. **ПІДОЗРА — перевірити на живій БД (міграція 131).** 117 додала `is_archived` на products + RLS `products_public_read`(is_active AND is_archived=false AND master published). 127/129 перейменували products→inventory_items (+ERP). **131 (rollback): ДРОПнула `is_archived` (рядок 24) і перейменувала inventory_items→products назад (рядок 33).** Якщо `is_archived` не повернули пізніше — код `deleteProduct`(actions.ts:150)/`useProducts`(31)/`usePublicProducts`(97) звертається до неіснуючої колонки → runtime-помилка, і RLS 117 могла зламатись. Те, що дашборд показує товари, натякає, що колонка існує — але ПІДТВЕРДИТИ через Supabase MCP: чи є `products.is_archived` і чи ціла `products_public_read`.

## ДІПЛІНКИ — переважно OK, але домен = launch-блокер
- **WORKING:** dashboard-редіректи (`/dashboard/flash|pricing|loyalty|referral|partners`→hub, drawer/tab споживаються у RevenueHubClient/GrowthHubClient); `/r/[code]` (invalid→редірект `/`); `/invite/[code]` (invalid→generic картка); `middleware.ts` (публічні діплінки НЕ блокуються; матчер виключає `/[slug]`, `/r`, `/invite`, `/studio`); Telegram bot-name з env.
- **BROKEN/RISKY — захардкоджений домен (критично для SEO/OG/TG на повному запуску):**
  - `layout.tsx:41` — `metadataBase` хардкод vercel.app → всі OG/canonical неправильні.
  - `[slug]/page.tsx:382` — JSON-LD `url` хардкод `bookit.com.ua`.
  - `api/telegram/webhook/route.ts:139` — `web_app.url` хардкод vercel.app.
  - `opengraph-image.tsx:164` — текст `bookit.app/[slug]`.
  - ~25 хардкодів `bookit.com.ua` (ReferralBoostWidget:74, StepSuccess:115-116, SharePageCard, AdaptiveContextStrip:106).
  - **`NEXT_PUBLIC_APP_URL`=`http://localhost:3000` у prod-env** — крихко (врятовано `?? bookit.com.ua` фолбеками).
  - Платіжні фолбеки на `bookit-five-psi.vercel.app` (`billing/actions.ts:14`, `billing/paid`, `expire-subscriptions:17`).
  - → Перед запуском: зафіксувати бойовий домен, виставити `NEXT_PUBLIC_SITE_URL`/`NEXT_PUBLIC_APP_URL`, прибрати хардкоди.

## СПОВІЩЕННЯ — працює, code-змін не треба
- NotificationOrchestrator каскад: In-App+Push (паралельно) → Telegram (якщо push не дійшов) → SMS (лише critical і якщо безкоштовні канали не доставили) — коректний.
- 23 типи в notifMap; critical-SMS лише 6 типів (cost-guard є). Усі 5 cron під `CRON_SECRET`. Батчі через `Promise.allSettled`+try/catch → одиничний фейл не валить батч.
- **NULL end_time/start_time — НЕ баг** (раніше підозрюваний P0R-1 знятий): є guard `?? '00:00'` (`check-uncompleted:62`), `?? ''` (`reminders:113`); схема non-null.
- Realtime (`useRealtimeNotifications`, `useLiveChat`) — cleanup є (removeChannel). Push 410 → видалення expired. Telegram/TurboSMS — токени з env, таймаут 8с, помилки логуються.
- Pre-launch (не код): валідність TELEGRAM_BOT_TOKEN/TURBOSMS_TOKEN, що Vercel cron реально тригериться.

## РЕФЕРАЛКИ — C2B готово; C2C має silent-fail (HIGH)
- C2B/B2B ("залізна машина"): codegen з retry, auth/callback фазовий (FK-safe, ідемпотентний), нагороди/bounty — OK; FK 23503 не відтворюється (Phase 1 master перед Phase 2 grant).
- Capture: `RefCapture.tsx` (cookie `bookit_ref` 30д, regex `^[a-zA-Z0-9]{3,16}$`) + `PublicMasterPage:352` (localStorage) — консистентно.
- **HIGH — C2C silent-fail (`createBooking.ts:340-391`):** якщо реф-код невалідний/прострочений/умови не виконані (self, вже бронював, вже є реферал) → бронювання УСПІШНЕ, помилки НЕ повертається, знижка тихо=0, клієнт не знає. Фікс: повертати помилку/тост при наданому, але невалідному коді.
- **Перевірити тригери на БД:** `fn_master_referral_trial_to_active` (інакше activeReferralCount=0) і `fn_c2c_bounty_on_first_payment`.

## Пріоритети (доповнення)
- **P0 — продукти не показуються:** прибрати/пом'якшити `stock_qty>0` фільтр (розділити видимість vs купівлю) + ПІДТВЕРДИТИ на живій БД `products.is_archived` та `products_public_read` (підозра на міграцію 131).
- **P0 (повний публічний) — домен:** metadataBase/JSON-LD/Telegram-webapp хардкоди + prod-env `NEXT_PUBLIC_APP_URL=localhost`.
- **P1:** C2C silent-fail реф-коду; UI-емодзі `🔒` на shop.
- **Перевірити на БД (Supabase MCP):** `products.is_archived`, `products_public_read`, `fn_master_referral_trial_to_active`, `fn_c2c_bounty_on_first_payment`.
