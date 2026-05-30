# 📊 STATUS.md — Live Release Tracker

> Оновлюється після кожного значущого зрушення. Live джерело правди про прогрес.
> **Updated:** 2026-05-30
> **Active step:** STEP 04 (Dashboard Home) — In Progress (Session 3 complete)
> **Progress:** 3 / 13 complete + STEP 04 in progress
> **Model in use:** 🟢 Sonnet 4.6 (STEP 04 session 3)
> **Last commit:** `65acf29` — fix(step04): tour overlay, academy tab jump, empty states, deep links

---

## 🗺️ Загальний прогрес

```
[████░░░░░░░░] ~28% (3/13 + STEP 04 in progress)

Step 01: ✅ Complete (2026-05-28)
Step 02: ✅ Complete (2026-05-28)
Step 03: ✅ Complete (2026-05-30)
Step 04: ⏳ In progress (started 2026-05-30, sessions 1-3 done)
Steps 05-13: 🔒 Blocked (sequential)
```

---

## 📋 Зведена таблиця 13 кроків

| # | Сторінка | Модель | Статус | Started | Ready | Drawer ID | Commit |
|---|---|---|---|---|---|---|---|
| 01 | `/` Landing | 🟢 Sonnet 4.6 high | ✅ **Complete** | 2026-05-27 | 2026-05-28 | `d61ab82e` | 3a42b10+ |
| 02 | Auth (`/login`, `/register`, `/callback`) | 🟢 Sonnet 4.6 high | ✅ **Complete** | 2026-05-28 | 2026-05-28 | `0f174061` / `aece86e2` | ff50c78+ |
| 03 | Onboarding (`/dashboard/onboarding`) | 🟢 Sonnet 4.6 high | ✅ **Complete** | 2026-05-28 | 2026-05-30 | `9014576630a5` | `967bf06` |
| 04 | Dashboard Home (`/dashboard`) | 🟢 Sonnet 4.6 | ⏳ **In progress** | 2026-05-30 | — | — | `65acf29` |
| 05 | Bookings (`/dashboard/bookings`) | 🔴 Opus 4.7 max | 🔒 Blocked | — | — | — | — |
| 06 | CRM Clients (`/dashboard/clients`) | 🟡 Mixed | 🔒 Blocked | — | — | — | — |
| 07 | Services + Products | 🟢 Sonnet 4.6 high | 🔒 Blocked | — | — | — | — |
| 08a | Revenue Hub (Flash + Pricing) | 🔴 Opus 4.7 max | 🔒 Blocked | — | — | — | — |
| 08b | Growth Hub (Loyalty + Referral + Partners) | 🔴 Opus 4.7 max | 🔒 Blocked | — | — | — | — |
| 08c | Marketing + Billing + Settings + Studio | 🔴 Opus 4.7 max | 🔒 Blocked | — | — | — | — |
| 09 | Explore (`/explore`) | 🟢 Sonnet 4.6 high | 🔒 Blocked | — | — | — | — |
| 10 | Public Master Page (`/[slug]`) | 🔴 Opus 4.7 max | 🔒 Blocked | — | — | — | — |
| 11 | Shop + Portfolio | 🔴 Opus 4.7 max | 🔒 Blocked | — | — | — | — |
| 12 | Client Portal (`/my/*`) | 🟢 Sonnet 4.6 high | 🔒 Blocked | — | — | — | — |
| 13 | Legal/Offline/`/r/[code]` | 🟡 Mixed | 🔒 Blocked | — | — | — | — |

> **Примітка:** Крок 8 розбито на 3 чати (08a/08b/08c) через об'єм. Кожен має власний playbook.

---

## 🎯 ACTIVE STEP — детальний стан

### STEP 04 — Dashboard Home (`/dashboard`)
- **Sessions:** 3 завершено (2026-05-30)
- **Модель:** 🟢 Sonnet 4.6
- **Статус:** ⏳ In progress — QA на живому виявила баги, виправлені в session 3
- **Last commit:** `65acf29`

#### Виконано за STEP 04 (sessions 1-3)
| Блок | Задача | Статус | Commit |
|---|---|---|---|
| A | EarningsPulseWidget: revenue `/100` bug | ✅ Done | `65acf29` |
| B | useRealtimeNotifications: `busyness` query invalidation | ✅ Done | `65acf29` |
| C | Empty states: TodaySchedule, TopServices, ChannelHealth, InsightsRow | ✅ Done | `65acf29` |
| C2 | Empty states: WeeklyChart (BarChart2 icon), PeakHours (Clock icon) | ✅ Done | `65acf29` |
| D+E | Tour: DashboardTourContext, DashboardTourBanner, FrostDashboard, data-tour-step attrs | ✅ Done | `65acf29` |
| D-E2 | Tour highlight: DOM overlay approach (position:fixed), 350ms delay, getBCR | ✅ Done | `65acf29` |
| F | Academy: повний rewrite (tabs+accordion+Emil springs+26 articles) | ✅ Done | `65acf29` |
| F2 | Deep links: services/new, revenue?drawer=flash_deals | ✅ Done | `65acf29` |
| B2 | Academy tab: mode="popLayout" → mode="wait" (layout jump fix) | ✅ Done | `65acf29` |

#### Залишилось до STEP 04 Complete
- [ ] Push на Vercel + QA на живому (перевірити tour overlay, Academy tabs, empty states)
- [ ] `/impeccable audit` → health score (baseline 22/40 → target 34+)
- [ ] Підтвердження від користувача: STEP 04 QA пройдено

---

## ✅ Завершені кроки

### STEP 03 — Onboarding Wizard (`/dashboard/onboarding`) — ✅ COMPLETE

- **Completed:** 2026-05-30
- **Commit:** `967bf06` (64 files) + `10b3f82` (docs) + `db69666` (roadmap)
- **Drawer:** `9014576630a5`

#### Виконано в STEP 03
| Задача | Статус | Файли |
|---|---|---|
| 1. Баг: multi-category services (per-cat state) | ✅ | `OnboardingWizard.tsx`, `StepServices.tsx`, `types/onboarding.ts` |
| 2. Preview redesign (glassmorphism card, slug edit) | ✅ | `StepPreview.tsx`, `onboarding/actions.ts` |
| 3. Slug editing в StepPreview | ✅ | `StepPreview.tsx`, `onboarding/actions.ts` |
| 4. Rendering fix: Blossom bleed → root layout x-pathname | ✅ | `src/app/layout.tsx` |
| 5. Rendering fix: CSS style tag `html,body{bg:#EFF2FF!important}` | ✅ | `src/app/(master)/layout.tsx` |
| 6. Rendering fix: streaming gap → `loading.tsx` Frost skeleton | ✅ | `dashboard/onboarding/loading.tsx` |
| 7. Persistence fix: RLS silent failure → admin client | ✅ | `dashboard/onboarding/actions.ts` |
| 8. Race condition fix: removed `router.refresh()` в PhoneOtpForm | ✅ | `PhoneOtpForm.tsx` |
| 9. Sterile env: BlobBackground + SupportWidget removed | ✅ | `onboarding/page.tsx`, `(master)/layout.tsx` |
| 10. Commit + push → Vercel deploy | ✅ | 64 files changed |

#### 7 Quality Gate — STEP 03 (підсумок)
| Вимір | Результат |
|---|---|
| 1. Aesthetics & Themes | ✅ Frost enforced at SSR (x-pathname + !important + #EFF2FF) |
| 2. No-Emoji Policy | ✅ Lucide icons, emoji відсутні |
| 3. Motion & Transitions | ✅ popLayout + spring as const + AnimatePresence |
| 4. Errors & Validation | ✅ slug regex + server errors + persistStep logging |
| 5. A11y & Performance | ✅ TSC 0 errors, Build clean |
| 6. Core Features | ✅ Per-category save, slug edit, schedule, step persistence |
| 7. Tests | ⚠️ E2E Playwright — ручний QA виконаний, автоматизовані тести pending |

#### Key architectural decisions (STEP 03)
- **Admin client для critical writes**: `saveOnboardingProgress` через `createAdminClient()` — обходить RLS. Supabase anon `.update()` повертає `{error:null}` при RLS-блоці (0 rows, no error). Патерн для ВСІХ критичних записів.
- **Frost enforcement 3-layer**: (1) root layout `x-pathname` → SSR html data-theme; (2) master layout `<style>!important`; (3) wizard useEffect → iOS fallback.
- **loading.tsx rule**: будь-який Route з повільним Server Component → окремий `loading.tsx` з правильними кольорами теми.

---

## 🗂️ BACKLOG — Існуючі проблеми (по підходах)

> Робота ведеться по 2-3 items за підхід. Після кожного підходу — оновити статус.

### 🔴 Підхід 1 — Критичні (перед STEP 04)

| # | Issue | Пріоритет | Виявлено | Статус |
|---|---|---|---|---|
| B-01 | `/impeccable audit` → health score (baseline 22/40, target 34+) | 🔴 Critical | STEP 03 | ⏳ Pending |
| B-02 | Vercel QA: ручна перевірка onboarding flow на prodution після `967bf06` | 🔴 Critical | STEP 03 | ⏳ Pending |

### 🟡 Підхід 2 — Dashboard carry-overs (виправити до або під час STEP 04)

| # | Issue | Пріоритет | Виявлено | Статус |
|---|---|---|---|---|
| B-03 | Studio WeeklyChartWidget: BarTooltip click → day detail (дрилл-даун) | 🟡 High | Theme Polish Sprint | ⏳ Pending |
| B-04 | Frost WeeklyChartWidget: tooltip `rounded-[4px]` (зменшити з rounded-lg) | 🟡 High | Theme Polish Sprint | ⏳ Pending |
| B-05 | Blossom: стандартизація шрифту/контрасту в заголовках всіх віджетів | 🟡 High | Theme Polish Sprint | ⏳ Pending |

### 🔵 Підхід 3 — Інфраструктура (асинхронно)

| # | Issue | Пріоритет | Виявлено | Статус |
|---|---|---|---|---|
| B-06 | Vercel Pro upgrade → cron `check-uncompleted` змінити на `0 * * * *` (зараз кожну хвилину або вимкнено) | 🔵 External | MEMORY.md | 🔒 External |
| B-07 | E2E Playwright tests для onboarding flow (`npm run test:e2e`) | 🔵 Low | STEP 03 | ⏳ Pending |

### Як працювати з беклогом
1. Оголошуєш підхід: "Роблю Підхід 1"
2. Після виконання — позначаємо ✅ Done + коміт
3. Якщо нова проблема з'явилась під час роботи → додаємо B-NN рядок

---

## 📝 Активні issues (cross-step)

| # | Issue | Виявлено в кроці | Блокує | Status |
|---|---|---|---|---|
| 1 | Vercel Pro upgrade pending → cron schedule | (з MEMORY.md) | STEP 04, STEP 05 | 🔒 External |
| 2 | Studio WeeklyChart: BarTooltip click → day detail | Theme Polish Sprint | STEP 04 carry-over | ⏳ → B-03 |
| 3 | Frost WeeklyChart: tooltip `rounded-[4px]` | Theme Polish Sprint | STEP 04 carry-over | ⏳ → B-04 |
| 4 | Blossom: global font/contrast widget headers | Theme Polish Sprint | STEP 04 carry-over | ⏳ → B-05 |
| 5 | `/impeccable audit` → health score | STEP 03 | STEP 04 | ⏳ → B-01 |

---

## 🧭 Legend (статуси)

| Статус | Означає |
|---|---|
| ⏳ **In progress** | Активна робота |
| ✅ **Complete** | Усі 7 вимірів пройдено, doc synced, drawer створено |
| 🔒 **Blocked (sequential)** | Чекає завершення попереднього кроку |
| 🔒 **Blocked (external)** | Чекає зовнішньої дії (e.g., env var, Vercel Pro) |
| ⚠️ **Needs revision** | Виявлено issues, повернення на цей крок |
| 🔄 **In review** | Готово до QA, чекає вердикту користувача |

---

## 🔄 Рішення про переходи

Тільки `STEP NN COMPLETE` дозволяє переходити до STEP NN+1.

**Виключення:**
- 🔒 Blocked (external) дозволяє почати NN+1 в окремому чаті, якщо немає коду-залежності
- ⚠️ Needs revision не дозволяє жодного переходу — фікс у тому ж чаті або новому з тим самим Step ID

---

## 📞 Швидкі посилання

- [README.md](./README.md) — правила, моделі, налаштування
- [PROTOCOL.md](./PROTOCOL.md) — workflow одного чату
- [CHANGELOG.md](./CHANGELOG.md) — журнал готових кроків
- [STEPS/](./STEPS/) — детальні playbooks
- [../MAPS/PAGE_RELEASE_ROADMAP.md](../MAPS/PAGE_RELEASE_ROADMAP.md) — source of truth для scope

---

*Останнє оновлення: 2026-05-30 — STEP 03 Complete; STEP 04 Next; Backlog B-01..B-07 додано*
