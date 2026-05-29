# 📊 STATUS.md — Live Release Tracker

> Оновлюється після кожного значущого зрушення. Live джерело правди про прогрес.
> **Updated:** 2026-05-29
> **Active step:** STEP 03 (Onboarding) — rendering bugs resolved, in QA
> **Progress:** 2 / 13 complete (STEP 01 ✅; STEP 02 ✅)
> **Model in use:** 🟢 Sonnet 4.6 high
> **Last commit:** `967bf06` — pushed to GitHub → Vercel deploy triggered

---

## 🗺️ Загальний прогрес

```
[██░░░░░░░░░░] ~15% (2/13)

Step 01: ✅ Complete (2026-05-28)
Step 02: ✅ Complete (2026-05-28)
Step 03: ⏳ In progress
Steps 04-13: 🔒 Blocked (sequential)
```

---

## 📋 Зведена таблиця 13 кроків

| # | Сторінка | Модель | Статус | Started | Ready | Drawer ID | Commit |
|---|---|---|---|---|---|---|---|
| 01 | `/` Landing | 🟢 Sonnet 4.6 high | ✅ **Complete** | 2026-05-27 | 2026-05-28 | `d61ab82e` | 3a42b10+ |
| 02 | Auth (`/login`, `/register`, `/callback`) | 🟢 Sonnet 4.6 high | ✅ **Complete** | 2026-05-28 | 2026-05-28 | `0f174061` / `aece86e2` | ff50c78+ |
| 03 | Onboarding (`/dashboard/onboarding`) | 🟢 Sonnet 4.6 high | 🔄 **In QA** | 2026-05-28 | — | `9014576630a5` | `967bf06` |
| 04 | Dashboard Home (`/dashboard`) | 🔴 Opus 4.7 max | 🔒 Blocked | — | — | — | — |
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

### STEP 03 — Onboarding Wizard (`/dashboard/onboarding`)
- **Playbook:** [STEPS/STEP_03_HANDOFF.md](./STEPS/STEP_03_HANDOFF.md)
- **Модель:** 🟢 Sonnet 4.6 high
- **Статус:** 🔄 In QA — всі баги виправлені, задеплоєно на Vercel
- **Scope summary:** 5-step wizard v2 (PROFILE→SERVICES→SCHEDULE→PREVIEW→SUCCESS)

#### Зроблено в чаті 3 (2026-05-29)
| Задача | Статус | Файли |
|---|---|---|
| 1. Баг: multi-category services (per-cat state) | ✅ Done | `OnboardingWizard.tsx`, `StepServices.tsx`, `types/onboarding.ts` |
| 2. Preview redesign (glassmorphism card, slug edit) | ✅ Done | `StepPreview.tsx`, `onboarding/actions.ts` |
| 3. Slug editing в StepPreview | ✅ Done | `StepPreview.tsx`, `onboarding/actions.ts` |
| 4. **Rendering fix: Blossom bleed** → root layout x-pathname forces Frost | ✅ Done | `src/app/layout.tsx` |
| 5. **Rendering fix: CSS style tag** → `html,body{bg:#EFF2FF!important}` | ✅ Done | `src/app/(master)/layout.tsx` |
| 6. **Rendering fix: streaming gap** → `loading.tsx` Frost skeleton | ✅ Done | `dashboard/onboarding/loading.tsx` |
| 7. **Persistence fix: RLS silent failure** → admin client in actions | ✅ Done | `dashboard/onboarding/actions.ts` |
| 8. **Race condition fix** → removed `router.refresh()` in PhoneOtpForm | ✅ Done | `PhoneOtpForm.tsx` |
| 9. **Sterile env** → BlobBackground removed, SupportWidget removed | ✅ Done | `onboarding/page.tsx`, `(master)/layout.tsx` |
| 10. Commit 967bf06 → pushed → Vercel deploy | ✅ Done | 64 files changed |

#### 7 Quality Gate progress (for STEP 03)
| Вимір | Стан |
|---|---|
| 1. Aesthetics & Themes | ✅ Frost enforced at SSR level (x-pathname + style tag + hardcoded #EFF2FF); loading skeleton matches wizard colors |
| 2. No-Emoji Policy | ✅ Lucide icons скрізь, emoji відсутні |
| 3. Motion & Transitions | ✅ popLayout + spring as const; Framer AnimatePresence wizard transitions |
| 4. Errors & Validation | ✅ slug regex + server error states; persistStep logs errors |
| 5. A11y & Performance | ✅ TSC 0 errors, Build clean (967bf06); admin client bypass for guaranteed DB writes |
| 6. Core Features | ✅ Per-category save, slug edit, schedule preview; step persistence via admin client |
| 7. Tests Verification | ⏳ Очікується QA на Vercel після deploy |

#### HANDOFF for STEP 03
- **Prior step closed:** STEP 01 — Landing Page (`/`)
- **Commit hash:** 3a42b10+
- **Drawer:** `d61ab82e`
- **Open issues:** Testimonials not integrated by user choice
- **Carry-over to STEP 03:** none
- **Next chat focus:** STEP 03 — Onboarding Wizard (`/onboarding`). Model: **Opus 4.7 max** (9-step wizard state machine, draft persistence, profit calculator, TMA link)

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

## 📝 Активні issues (cross-step)

| # | Issue | Виявлено в кроці | Блокує | Status |
|---|---|---|---|---|
| 1 | Vercel Pro upgrade pending — впливає на cron `check-uncompleted` | (з MEMORY.md) | STEP 04, STEP 05 | 🔒 External |
| 2 | Studio WeeklyChart: BarTooltip click → day detail | Theme Polish Sprint (closed) | STEP 04 (carry-over) | ⏳ Pending |
| 3 | Frost WeeklyChart: tooltip `rounded-[4px]` | Theme Polish Sprint (closed) | STEP 04 (carry-over) | ⏳ Pending |
| 4 | Blossom: global font/contrast widget headers | Theme Polish Sprint (closed) | STEP 04 (carry-over) | ⏳ Pending |
| 5 | `/impeccable audit` → health score check (baseline 22/40) | STEP 03 | STEP 04 | ⏳ Pending |

### Key architectural decisions (2026-05-29)
- **Admin client for onboarding writes**: `saveOnboardingProgress` uses `createAdminClient()` to bypass RLS. Supabase anon client `.update()` returns `{error:null}` with 0 rows when RLS blocks — silent failure. Pattern to apply to ALL critical user-facing writes.
- **Frost enforcement 3-layer strategy**: (1) root layout `x-pathname` → SSR html data-theme; (2) master layout `<style>!important` → CSS beats JS inline style; (3) wizard useEffect → iOS rubber-band fallback. Belt-suspenders-belt.
- **loading.tsx for streaming**: Any route with slow Server Component data fetches should have a matching `loading.tsx` with correct theme colors to prevent blank page flicker.

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
- [../MAPS/PAGE_RELEASE_ROADMAP.md](../MAPS/PAGE_RELEASE_ROADMAP.md) — sourсе of truth для scope

---

*Останнє оновлення цього файлу: 2026-05-29 — Onboarding rendering fixes deployed (967bf06)*
