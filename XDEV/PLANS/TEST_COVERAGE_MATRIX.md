# BookIT — Test Coverage Matrix & Program

> Створено: 2026-07-07 · Тригер: краш клієнтського логіну (realtime channel topic collision, commit d7971dad).
> Мета: не «100% line coverage» (оманлива метрика), а **закрити класи ризиків** у 17 доменах.
> Джерела: `XDEV/DOMAIN_MAPS/01..17` (Test Vectors) + фактичний інвентар тестів (`find *.test.ts` + `e2e/`).

---

## 0. Чому цей документ існує

61 unit-файлів + 55 e2e-специфікацій — і детермінований краш на найголовнішому флоу (вхід клієнта) дійшов до продакшну. Причина не в кількості тестів, а в **непокритому класі**: рантайм-lifecycle (монтування хуків, WebSocket-канали, console-помилки). Матриця нижче явно виділяє цей клас окремою колонкою (**RT**), якої досі не існувало ніде.

### Легенда покриття
- ✅ — є реальний тест, що перевіряє суть вектора
- 🟡 — часткове / дотичне покриття (напр. audit-spec рендерить сторінку, але не перевіряє логіку)
- ❌ — вектор із доменної мапи без жодного тесту
- `—` — незастосовно (напр. RT для чисто серверного cron)

### Колонки (6 площин)
| Код | Площина | Що ловить |
|---|---|---|
| **U** | Unit | Ізольована бізнес-логіка (функції, розрахунки, валідація) |
| **I** | Integration | Server action / route ↔ реальна БД / RPC |
| **E** | E2E-happy | Основний користувацький флоу в браузері |
| **RT** | Runtime-guard | Сторінка монтується без throw / console.error у **реальному** флоу (не fake-session) |
| **S** | Security | RLS, крос-tenant ізоляція, IDOR, підписи, rate-limit |
| **L** | Load/Concurrency | Гонки, ідемпотентність, атомарність (гроші, слоти, склад) |

---

## 1. Матриця 17 × 6

| # | Домен | U | I | E | RT | S | L | Найгостріша діра |
|---|---|:--:|:--:|:--:|:--:|:--:|:--:|---|
| 1 | Auth & Identity | 🟡 | 🟡 | ✅ | ❌ | 🟡 | ❌ | RT: **реальний логін не тестується** (fake session) — тут стався краш |
| 2 | Booking Wizard | ✅ | 🟡 | ✅ | ❌ | 🟡 | ❌ | L: double-booking / Starter-limit гонка не тестована |
| 3 | Master Dashboard | 🟡 | ❌ | 🟡 | ❌ | 🟡 | ❌ | RT: 8+ віджетів монтуються — той самий клас, що краш |
| 4 | Client CRM | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | S: крос-master ізоляція не виконується як тест; U: сегменти без unit |
| 5 | Notifications | ✅ | 🟡 | ✅ | ❌ | ❌ | ❌ | S: RLS notification_logs; L: mass-broadcast каскад |
| 6 | Referral (4 типи) | ✅ | ✅ | ✅ | ❌ | 🟡 | ❌ | L: подвійний C2C-бонус / B2B FK-гонка (регресила раніше) |
| 7 | Billing | ✅ | 🟡 | 🟡 | ❌ | ✅ | ❌ | E: реальний checkout/dunning не e2e; лише audit-рендер |
| 8 | Public Client Zone | 🟡 | ❌ | ✅ | ❌ | ❌ | ❌ | I: SSR/OG/JSON-LD без тестів; S: unpublished master доступ |
| 9 | Client Portal | ❌ | ❌ | 🟡 | ❌ | ❌ | ❌ | **RT: тут був краш**; жодного unit; крос-client ізоляція |
| 10 | Marketing Hub | ✅ | 🟡 | ✅ | ❌ | ❌ | ❌ | L: phone-discount гонка; S: крос-master broadcasts |
| 11 | Shop & Inventory | 🟡 | ❌ | ✅ | ❌ | ❌ | ❌ | **L: stock race (increment_stock_rpc) — гроші, не тестовано** |
| 12 | Portfolio Consent | ❌ | ❌ | 🟡 | ❌ | ❌ | ❌ | S: legal consent RLS (клієнт бачить лише свої); Starter-ліміт |
| 13 | Background Cron | 🟡 | ❌ | 🟡 | — | 🟡 | ❌ | I: dunning (3 fail→free month→downgrade) без інтеграц. тесту |
| 14 | **Database Security** | ❌ | ❌ | 🟡 | — | ❌ | ❌ | **S: вся RLS-матриця НЕ виконується як тести** (мульти-tenant) |
| 15 | Landing Page | ❌ | 🟡 | ✅ | ❌ | — | ❌ | U: ROI-калькулятор без unit; L: GSAP perf на слабких |
| 16 | Onboarding v2 | ❌ | ❌ | 🟡 | ❌ | ❌ | ❌ | I: admin-client persistence (клас бага 2026-05-29) без тесту |
| 17 | Deep Links / ActionBus | ✅ | 🟡 | ❌ | ❌ | ❌ | ❌ | S: IDOR — bookingId/clientPhone крізь RLS; E: deep-actions не e2e |

### Зведення по колонках
| Площина | Покрито (✅) | Частково (🟡) | Дір (❌) |
|---|:--:|:--:|:--:|
| U Unit | 6 | 5 | 6 |
| I Integration | 1 | 8 | 8 |
| E E2E-happy | 9 | 5 | 1 |
| **RT Runtime-guard** | **0** | **0** | **15** ⟵ |
| **S Security** | **1** | **6** | **8** ⟵ |
| **L Load/Concurrency** | **0** | **0** | **16** ⟵ |

**Три колонки-провали: RT (0/15), L (0/16), S (1/15).** Саме тут живуть найдорожчі баги: краши логіну, крос-tenant витік даних, подвійне списання/бронювання.

---

## 2. Ранжування дір за важелем (impact × ймовірність)

| Ранг | Діра | Домени | Чому вгорі |
|---|---|---|---|
| **P0** | RT: реальний логін + монтування нав/віджетів | 1,3,9 | Вже стрельнуло. Детермінований краш у проді. Дешево ловиться. |
| **P0** | S: крос-tenant RLS не виконується | 4,5,10,12,14,17 | Мульти-tenant SaaS. Витік даних клієнта = юридична + репутаційна катастрофа. |
| **P1** | L: атомарність грошей/слотів/складу | 2,6,11 | Подвійне бронювання / подвійний бонус / овер-селл = прямі фінансові втрати. Мітигації в коді Є, але **не перевірені**. |
| **P1** | I: dunning + admin-client persistence | 13,16 | Клас багів, що вже регресив (onboarding 2026-05-29; flash 2026-06-28). |
| **P2** | U: сегменти CRM, ROI, onboarding-mapping | 4,15,16 | Чиста логіка без тестів — дешево догнати. |
| **P2** | E: реальний checkout, deep-link actions | 7,17 | Ключові конверсійні флоу лише «рендеряться», не проганяються. |
| **P3** | Maps drift | всі | Мапи брешуть (`proxy.ts`→насправді `middleware.ts`; TESTING_MAP: 5 файлів замість 61). |

---

## 3. Програма (мілстоуни)

### Milestone 0 — Runtime-guard harness (P0, ~1 день) — РЕГРЕС НА СЬОГОДНІШНІЙ КРАШ
Повністю специфіковано, готове до виконання:
1. `e2e/support/consoleGuard.ts` — Playwright-фікстура: збирає `page.on('console'|'pageerror')`, фейлить тест на будь-якому error/uncaught.
2. `e2e/tests/00-role-login-smoke.spec.ts` — **реальний** OTP-логін клієнта (`/my`) і майстра (`/dashboard`), кожен × mobile+desktop viewport (щоб обидва нав-сурфейси змонтувались), assert: 0 console errors, ключовий елемент видимий.
3. Unit на 6 realtime-хуків (`useUnreadDMCount`, `useDMChat`, `useLiveChat`, `useRealtimeNotifications`, `ClientRealtimeSync`, `InboxNavButton`): 2 одночасні інстанси → без throw, топіки унікальні.
4. Підключити `consoleGuard` до наявних 19 `audit.*` специфікацій (одна зміна фікстури — вся площина RT для dashboard/public отримує covered-статус).

### Milestone 1 — Latent realtime-міни (P0-suffix, ~2 год)
`useLiveChat`, `useDMChat`, `AdminSupportConsole` → унікальний топік через `useId` + тест. (Жовті рядки з drawer-фіксу.)

### Milestone 2 — RLS/Security виконувані тести (P0, ~3-4 дні)
Тест-utils: два master-клієнти + два client-клієнти (anon-key сесії). Прогнати RLS-матрицю з `14_DATABASE_SECURITY.md §2` як реальні assert-и: master A ≠ master B дані, client A ≠ client B, IDOR bookingId/clientPhone (домен 17), consent RLS (12), notification_logs (5). + P0-фікс: `check_and_log_sms_send` `SET search_path = public`.

### Milestone 3 — Load/Concurrency (P1, ~3 дні)
Інтеграц. тести гонок проти реальної БД: паралельний booking на останній слот (2), паралельний order на останню одиницю складу через `increment_stock_rpc` (11), подвійний C2C-бонус (6), Starter-limit 39→40→41 (2), cron SKIP LOCKED подвійне списання (7/13).

### Milestone 4 — Integration + Unit добір (P1-P2, ~3 дні)
Dunning-ланцюг (13), onboarding admin-persistence (16), createOrder atomic (11), CRM-сегменти unit (4), ROI unit (15), deep-link actions e2e (17), реальний checkout mock (7).

### Milestone 5 — Anti-drift (P3, ~0.5 дня)
Скрипт `scripts/verify-testing-map.ts`: звіряє `TESTING_MAP.md` реєстр із `find *.test.ts` + `e2e/`, фейлить CI при розсинхроні. Виправити `proxy.ts`→`middleware.ts` у мапах.

---

## 3a. Лог виконання (2026-07-07)

| Крок | Статус | Коміт | Примітка |
|---|---|---|---|
| Крашфікс `useUnreadDMCount` | ✅ | `d7971dad` | tsc clean |
| **M0** console-guard + real-login smoke + hook unit | ✅ | `06a4be24` | unit 3/3; e2e компілюється, прогін — `npm run test:e2e` |
| **M1** latent realtime (useLiveChat/useDMChat/AdminSupportConsole) | ✅ | `437a7ec0` | unit 6/6; tsc clean |
| **M2** RLS cross-tenant suite | ✅ | `c92a48af` | **8/8 verified green проти живої БД** (read-only probe) |
| M3 Load/Concurrency | ⬜ | — | наступне |
| M4 Integration + Unit добір | ⬜ | — | |
| M5 Anti-drift | ⬜ | — | |

RLS-колонка (S): найгостріший страх — крос-tenant витік — **спростовано доказом** для bookings/CRM/broadcasts/payments/notification_logs. Master↔master і anon-lockout тримаються. Решта матриці S (consent RLS домену 12, IDOR deep-links 17) — ще попереду.

## 3b. 🔴 КРИТИЧНА ЗНАХІДКА — `.env.test` вказує на ПРОДАКШН

`bookit/.env.test` (закоммічений у репо) містить:
- `NEXT_PUBLIC_SUPABASE_URL=https://sqlrxsopllgztvgrerqk.supabase.co` — **той самий ref, що в SYSTEM_MAP значиться як прод** (міграція застосована 2026-07-06).
- `SUPABASE_SERVICE_ROLE_KEY=...` — **service-role ключ ПРОДА в git**.
- `E2E_ALLOW_REMOTE=true`.

Наслідки:
1. `npm run test:e2e` виконує `scripts/seed-e2e-data.ts`, який **wipe+recreate `e2e_*@test.com` акаунти прямо в проді**. Захист лише регексом email — одна помилка в патерні = видалення реальних даних.
2. Service-role ключ прода лежить у версійному контролі (кожен з доступом до репо = повний bypass RLS прода).

Рекомендація (рішення за founder — не чіпаю без відмашки): окремий Supabase-проєкт для e2e; ротація прод service-role ключа; `.env.test` у `.gitignore`. Це вища пріоритетність за решту тест-програми.

## 4. Принцип, а не разова акція
Кожен новий домен/фіча закривається по всіх 6 колонках або має явний запис «L незастосовно, бо…». RT і S — обовʼязкові для будь-якої сторінки з auth. Матриця живе разом із кодом і перевіряється Milestone-5 скриптом.
