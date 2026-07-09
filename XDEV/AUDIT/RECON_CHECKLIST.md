# AUDIT RECON CHECKLIST — звірка аудиту 2026-06-15 проти живого коду

> **Мета:** аудит (`XDEV/AUDIT/*`) датований 2026-06-15 (pre-launch). Відтоді пройшли IRP-security, Sprint-05 (83/86), переписування `/explore` (C-EXPL-01). Багато P0/P1 закрито, але аудит НЕ оновлено. Ця сесія: пройти КОЖНУ знахідку → перевірити наживо → позначити `✅FIXED` / `🟡PARTIAL` / `🔴OPEN` / `➖N/A(файл зник)` → в кінці видати чистий список «що реально ще відкрито».
>
> **Метод:** для кожного рядка є команда перевірки. `➖` = файл переписано/видалено (напр. `ExplorePage.tsx` → `explore/*` після C-EXPL-01). Статуси нижче — ПЕРЕДЗАПОВНЕНІ цією сесією (2026-07-08); `TO-VERIFY` = наступна сесія підтверджує.
>
> **Скіл:** цей прохід — READ/verify, не код. Правки (якщо знайдуться живі баги) — окремими задачами з власним Task Gate. Спочатку звірка → потім рішення що чинити.

---

## ✅ ЗВІРКА ВИКОНАНА 2026-07-08 (сесія «все не закрите + День 4»)

**SECURITY:**
- **SEC-P1-1** ✅ **FIXED** — `PublicNavbar` + `PublicMobileHeader` переведено `getSession()`→`getUser()` (цю сесію). Решта getSession — by-design: `(master)/layout.tsx`+`my/layout.tsx` = getUser-primary + getSession лише timeout-fallback (cold-start) + роль з БД; `services/page.tsx` = свідомий perf-вибір, запит гардиться RLS + JWT-підпис на DB-шарі (злив неможливий); клієнтські (`MyBottomNav`/`StoryGenerator`/`TelegramProvider`) + `middleware.ts` = доречні. Не чіпано.
- **SEC-P1-2** ✅ **FIXED** — `billing/mono-webhook/route.ts` юзає канонічний `createAdminClient` з `@/lib/supabase/admin` (не inline).
- **SEC-P1-3** ➖ **N/A** — `send-story/route.ts` файл видалено.
- **SEC-P1-4** ✅ **N/A** — TURBOSMS_TOKEN guard (send-sms:141) живий і коректний, не dead-код.

**CODE QUALITY:**
- **CQ-P0-1** ✅ **FIXED (хибна тривога)** — усі 28 admin `<button>` МАЮТЬ `type=` на наст. рядку (multiline-grep). Рядковий grep обманувся багаторядковим JSX.
- **CQ-P0-2** 🟡 **PARTIAL** — admin тепер має 20 `aria-` атрибутів у 5 файлах (було «нуль»); повний aria-current/aria-label аудит — залишок, НЕ блокер.
- **CQ-P0-3** 🟡 — `transition-all` ×2 ще в `components/public/ExplorePage.tsx` (файл /explore-роуту НЕ переписано C-EXPL-01; переписаний був інший `explore/*`). Дрібне.
- **CQ-P1-4** ✅ **FIXED** — усі 8 TanStack-хуків мають `staleTime`.
- **CQ-P2-4** 🟡 **≈N/A** — GSAP лише в `LandingPageContent.tsx` (landing-only, code-split у роут-чанк, не глобальний bloat).
- **CQ-P2-5 / A8** ✅ **FIXED** — settings desktop (M-SET 10-col).

**PERFORMANCE + TESTING:**
- **P0-PERF-1** 🔴 **OPEN → арх-задача** — /explore досі force-dynamic + force-no-store + limit(120) nested-join. `cacheComponents` НЕ ввімкнено → `'use cache'` недоступний; фікс = cache-shell + Suspense-острів (той самий клас, що fully-dynamic `[slug]`). Робити з власним Task Gate + тестами, НЕ форсити перед запуском (деградація, не баг).
- **P0-TEST-1/2/3** 🔴 **OPEN** — нема E2E для /my/messages, /explore (лише smoke), нема coverage-config у vitest.
- **e2e seed guard** ⛔ — `.env.test` вказує на прод-ref → SAFETY-ABORT (за задумом). e2e green вимагає локального Supabase АБО авторизованого prod-seed override (SEC-01 interim). Рішення founder.
- **webkit/mobile flakiness** 🔴 OPEN — окрема задача стабілізації.

**Регресія baseline (День-4):** tsc ✅ 0 · build ✅ 0 · npm test ✅ 1030/1030 · e2e ⛔ (guard, див. вище).

**UX/FEATURES A-блок:** A2/A3/A4/A8/A10 ✅ FIXED (підтверджено); A1/A9/A11-13 — низ, не блокери.

---

## Домен 1 — SECURITY (`AUDIT/02_SECURITY.md`)

| ID | Знахідка | Файл | Перевірка | Статус |
|----|----------|------|-----------|--------|
| SEC-P0-1 | fire-notifs нульова auth | `src/app/api/debug/fire-notifs/route.ts` | вже прочитано | ✅ **FIXED** (404 на prod `VERCEL_ENV==='production'` + `DEBUG_TOKEN` guard, рядки 62-68) |
| SEC-P0-2 | telegram webhook без секрету | `src/app/api/telegram/webhook/route.ts:46` | вже прочитано | ✅ **FIXED** (`x-telegram-bot-api-secret-token` vs `TELEGRAM_WEBHOOK_SECRET`→403, рядки 47-49) |
| SEC-P1-1 | `getSession()` замість `getUser()` ×4 | `PublicNavbar`, `PublicMobileHeader`, `StoryGenerator`, `MyBottomNav` | `grep -rn "auth.getSession" src/components/public src/components/marketing` | TO-VERIFY |
| SEC-P1-2 | inline admin client | `src/app/api/webhooks/mono-webhook/route.ts:59` | `grep -n "createClient\|createAdminClient" src/app/api/webhooks/mono-webhook/route.ts` | TO-VERIFY |
| SEC-P1-3 | admin client для JWT auth | `src/app/api/send-story/route.ts:15` | `grep -n "createClient\|createAdminClient\|getUser" src/app/api/send-story/route.ts` | TO-VERIFY |
| SEC-P1-4 | dead `TURBOSMS_TOKEN` check | `src/app/api/auth/send-sms/route.ts:141` | read рядок ~141 | TO-VERIFY |
| SEC-P2-1 | body size limit на webhooks | `mono-webhook`, `telegram/webhook` | grep `bodyParser\|Content-Length` | TO-VERIFY (P2) |
| SEC-P2-2 | push subscribe без валідації | `src/app/api/push/subscribe/route.ts` | read | TO-VERIFY (P2) |
| SEC-P2-3 | немає rate-limit send-sms | `src/app/api/auth/send-sms/route.ts` | grep `rate\|limit\|Upstash` | TO-VERIFY (P2) |

---

## Домен 2 — CODE QUALITY (`AUDIT/01_CODE_QUALITY.md`)

| ID | Знахідка | Файл | Перевірка | Статус |
|----|----------|------|-----------|--------|
| CQ-P0-1 | admin кнопки без `type="button"` | `src/components/admin/*` (6 файлів) | `grep -rn "<button" src/components/admin \| grep -v 'type='` | TO-VERIFY |
| CQ-P0-2 | admin нуль ARIA | `src/components/admin/*` | `grep -rc "aria-" src/components/admin` | TO-VERIFY |
| CQ-P0-3 | `transition-all` ×8 в ExplorePage | `ExplorePage.tsx` | ➖ **файл переписано** C-EXPL-01→`components/public/explore/*`; перевір там `grep -rn "transition-all" src/components/public/explore` | TO-VERIFY (➖ старий шлях) |
| CQ-P1-1 | `parseError()` не юзається ~30% | `src/lib/utils/errors.ts` (source) + admin silent catch | `grep -rn "catch" src/components/admin \| grep -v parseError` | TO-VERIFY |
| CQ-P1-2 | skeleton непослідовний | — | огляд | TO-VERIFY (низ) |
| CQ-P1-3 | compact chips <44px | — | — | TO-VERIFY (низ) |
| CQ-P1-4 | 9 TanStack хуків без `staleTime` | `useClients`,`useDashboardStats`,`useWeeklyOverview`,`useBusyness`,`useVacationImpact`,`useNoShowMetrics`,`useSourceAttribution`,`useLeadTimeDistribution`(+1) | `grep -Ln "staleTime" src/lib/supabase/hooks/use{Clients,DashboardStats,WeeklyOverview,Busyness}.ts` | TO-VERIFY |
| CQ-P1-5 | дублікати номерів E2E spec | `e2e/tests/` | ℹ️ дублі 04-/08-/09- реальні й НАВМИСНІ (різні домени) — імовірно `N/A` | 🟡 PARTIAL/N/A |
| CQ-P1-6 | photo upload 3 реалізації | — | grep uploader компоненти | TO-VERIFY |
| CQ-P2-4 | GSAP у prod bundle +80KB | `package.json:35` | SYSTEM_MAP каже gsap=landing-only dep; `grep -rn "from 'gsap'" src \| grep -v landing` | TO-VERIFY (ймовірно 🟡) |
| CQ-P2-5 | settings desktop не розроблений | `dashboard/settings` | ✅ **DONE** M-SET (10-col editorial grid, `SettingsPage.tsx`) | ✅ **FIXED** |

---

## Домен 3 — PERFORMANCE + TESTING (`AUDIT/03_PERFORMANCE_TESTING.md`)

| ID | Знахідка | Файл | Перевірка | Статус |
|----|----------|------|-----------|--------|
| P0-PERF-1 | `/explore` force-dynamic, нуль кешу | `src/app/explore/page.tsx:6` | `grep -n "force-dynamic\|revalidate\|dynamic" src/app/explore/page.tsx` | 🔴 **TO-VERIFY (пріоритет)** — C-EXPL-01 переписав UI, але кеш-стратегію треба звірити |
| P0-PERF-2 | explore mega-query nested joins | data-шар explore | read `src/app/explore/page.tsx` + actions | TO-VERIFY |
| P0-PERF-3 | GSAP +80KB (дубль CQ-P2-4) | `package.json` | див. CQ-P2-4 | TO-VERIFY |
| P1-PERF-5 | 120 master nodes у DOM | explore | чи є віртуалізація/пагінація в `explore/IntentGrid` | TO-VERIFY |
| P1-PERF-6 | важкі drawers не lazy | — | grep `dynamic(() =>` для drawers | TO-VERIFY |
| **P0-TEST-1** | **нуль E2E для `/my/messages`** | — | у списку 36 специфікацій НЕМАЄ messages-spec | 🔴 **OPEN** (підтверджено) |
| **P0-TEST-2** | **`/explore` тільки smoke** | — | немає explore category/sort/search spec | 🔴 **OPEN** (підтверджено) |
| P0-TEST-3 | немає coverage config у vitest | `vitest.config.ts` | вже прочитано — include `src/**/*.test.ts`, coverage-блоку НЕМАЄ | 🔴 **OPEN** |
| P1-TEST-4 | `/my/bookings` (клієнт) без spec | — | є `10-master-bookings` (майстер); клієнт /my/bookings? | 🟡 TO-VERIFY |
| P1-TEST-5 | feature-gate тести без плану | — | — | TO-VERIFY |
| P2-TEST-9 | webkit/mobile flakiness | — | цю сесію: webkit(19)+mobile(8) валяться цілими проєктами (не стабілізовані) | 🔴 **OPEN** (підтверджено 2026-07-08) |

---

## Домен 4 — UX + FEATURES (`AUDIT/05_UX_FEATURES.md`)

**A — UX-баги:**
| ID | Знахідка | Перевірка/Нотатка | Статус |
|----|----------|-------------------|--------|
| A1 | `/explore` пошук без debounce | `grep -rn "debounce\|setTimeout" src/components/public/explore` (C-EXPL-01 має sticky-search) | 🟡 TO-VERIFY |
| A2 | `/my/setup/phone` redesign | ✅ C-PHONE-01 (`d95bb467`) | ✅ **FIXED** |
| A3 | `/my/messages` «Мої майстри» | ✅ C-MSG-02 `MastersRail.tsx` (`a7ed44ce`) | ✅ **FIXED** |
| A4 | MyBottomNav FAB | ✅ C-NAV-01 `NavSpeedDial.tsx` (`ea1551b6`) | ✅ **FIXED** |
| A9 | notification mark-as-read при відкритті | скіл `mark-as-read-on-close` існує; перевір поточну поведінку notifications | 🟡 TO-VERIFY |
| A5 | admin `type="button"` (=CQ-P0-1) | див. CQ-P0-1 | TO-VERIFY |
| A6 | admin hardcoded tokens (нуль CSS vars) | `grep -rn "bg-\[#\|text-\[#" src/components/admin` | TO-VERIFY |
| A7 | photo upload 3 impls (=CQ-P1-6) | див. CQ-P1-6 | TO-VERIFY |
| A8 | `/dashboard/settings` desktop (=CQ-P2-5) | ✅ M-SET | ✅ **FIXED** |
| A10 | expenses module відсутній | ✅ T28-T30 `ExpensesTab.tsx` (revenue/expenses) | ✅ **FIXED** |
| A11/A12/A13 | skeleton / silent fails / 44px chips | огляд | TO-VERIFY (низ) |

**B — A11Y:**
| ID | Знахідка | Перевірка | Статус |
|----|----------|-----------|--------|
| B1 | admin нуль ARIA (=CQ-P0-2) | див. CQ-P0-2 | TO-VERIFY |
| B2 | `transition-all` ExplorePage (=CQ-P0-3) | ➖ файл переписано | TO-VERIFY |
| B3 | `getCategoryIcon` switch у render | grep | TO-VERIFY (низ) |
| B4 | PeakHours/WeeklyChart без aria-label | dashboard a11y-робота була; `grep aria-label src/components/master/dashboard/widgets/frost` | 🟡 TO-VERIFY |
| B5 | `active:scale` 3 значення | grep | TO-VERIFY (низ) |
| B6 | admin sidebar без `aria-current` | grep | TO-VERIFY (низ) |

**C — Нові revenue-фічі (C1-C12): це РОАДМАП, НЕ audit-борг і НЕ блокери запуску.**
Calendar sync (C1), waiting list (C2), онлайн-передоплата (C3), TMA (C4 — частково є TMA guard), Instagram (C5), повторювані брон. (C6), відгуки з фото (C7), gift cards (C8), SMS-preview (C9), multi-master Studio (C10), scheduled campaigns (C11), AI-churn (C12). → окремий продуктовий беклог, не чіпати в цій звірці (лише зафіксувати, які вже частково є).

---

## Очікуваний вихід сесії

1. Пройти всі `TO-VERIFY` рядки (команди готові вгорі) → проставити статус.
2. Оновити `AUDIT/*.md` файли: позначити закриті знахідки `✅ RESOLVED (commit/Sprint-05)`, лишити реально відкриті.
3. Видати founder **чистий список «реально ще відкрито»** з пріоритетом. Поточна гіпотеза (передзвірка): відкриті ймовірно = **P0-TEST-1/2/3** (E2E /messages + /explore + coverage config), **P0-PERF-1** (explore кеш — треба звірити), **webkit/mobile flakiness**, частина admin a11y (ARIA/type=button/tokens). Решта P0 — закрито.
4. Для кожної реально-відкритої — рішення founder: фіксити зараз / у беклог / N/A.

**НЕ робити:** правки коду в цій сесії (це verify-прохід). Знайдені живі баги → окремі задачі з Task Gate.
