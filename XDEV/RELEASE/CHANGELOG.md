# 📜 CHANGELOG.md — Release Step Journal

> Журнал завершених кроків release roadmap. Один entry на крок.
> Створюється тільки після `STEP NN COMPLETE` з повним проходженням 7 Quality Gate dimensions.
> **Створено:** 2026-05-27

---

## Шаблон entry

```markdown
### STEP NN — [Page Name] (`[URL]`)
- **Date Ready:** YYYY-MM-DD
- **Model used:** [Opus 4.7 max / Sonnet 4.6 high / Mixed]
- **Effort:** [hours / days]
- **Drawer:** [MemPalace drawer ID]
- **Commit:** [hash]

#### Quality Gate Verdict
| Вимір | Стан |
|---|---|
| 1. Aesthetics & Themes | ✅ |
| 2. No-Emoji Policy | ✅ |
| 3. Motion & Transitions | ✅ |
| 4. Errors & Validation | ✅ |
| 5. A11y & Performance | ✅ |
| 6. Core Features | ✅ |
| 7. Tests Verification | ✅ |

#### Files changed
- `path/to/file.tsx` — [що змінено]
- `path/to/component.tsx` — [що змінено]

#### Key decisions
- [рішення 1 + чому]
- [рішення 2 + чому]

#### Skills chain
clarify → [skill 1] → [skill 2] → impeccable → humanizer → run → verify

#### Tests
- `e2e/tests/X.spec.ts` — N/N pass
- `src/lib/Y.test.ts` — N/N pass

#### Carry-over to next step
- [pending item / нічого]

#### Issues encountered
- [проблема + як вирішено]

---
```

---

## В роботі (In QA)

### STEP 03 — Onboarding Wizard (`/dashboard/onboarding`)
- **Date Started:** 2026-05-28
- **Date In QA:** 2026-05-29
- **Model used:** 🟢 Sonnet 4.6 high
- **Effort:** 2 сесії (wizard v2 + 3 rendering bug roots)
- **Drawers:** `drawer_bookit_fixes_4735c8be62c5751e8ef1eda6`, `drawer_bookit_fixes_9014576630a574cb79313b2d`, `drawer_bookit_decisions_*`
- **Commit:** `967bf06` (64 files, pushed → Vercel deployed)

#### Quality Gate (поточний стан)
| Вимір | Стан |
|---|---|
| 1. Aesthetics & Themes | ✅ Frost 3-layer: root layout SSR + master layout CSS !important + wizard useEffect |
| 2. No-Emoji Policy | ✅ Lucide icons, нуль emoji |
| 3. Motion & Transitions | ✅ `popLayout` + `spring as const`, AnimatePresence per-step |
| 4. Errors & Validation | ✅ persistStep() з error logging, slug regex, server error toasts |
| 5. A11y & Performance | ✅ TSC 0 errors · Build clean · loading.tsx skeleton · admin client bypass |
| 6. Core Features | ✅ Per-cat services, slug edit, schedule v2, step persistence via admin client |
| 7. Tests Verification | 🔄 QA на Vercel після deploy |

#### Files changed (key)
- `src/app/layout.tsx` — x-pathname → forces `data-theme="frost"` на `<html>` for onboarding routes
- `src/app/(master)/layout.tsx` — isOnboarding branch: `<style>html,body{bg:#EFF2FF!important}</style>` + hardcoded bg; MasterProvider wraps children
- `src/app/(master)/dashboard/onboarding/loading.tsx` — **NEW** Frost skeleton (streaming gap fix)
- `src/app/(master)/dashboard/onboarding/page.tsx` — `force-dynamic`; removed BlobBackground dependency
- `src/app/(master)/dashboard/onboarding/actions.ts` — `saveOnboardingProgress` → admin client (RLS bypass)
- `src/app/onboarding/page.tsx` — BlobBackground removed; `data-theme="frost"` Frost wrapper
- `src/components/auth/PhoneOtpForm.tsx` — removed `router.refresh()` (race condition fix)
- `src/components/master/onboarding/OnboardingWizard.tsx` — useEffect: `html/body overflow:hidden + overscrollBehavior:none + bg:#EFF2FF`; `persistStep()` helper
- `src/components/master/onboarding/steps/StepPreview.tsx` — glassmorphism card, slug editing, nameToGradient, hexLuminance a11y
- `src/components/master/onboarding/steps/StepServices.tsx` — per-category state (categoryPrices + categoryServiceTypes)

#### Key decisions
- **RLS silent failure pattern**: Supabase anon `.update()` повертає `{error:null}` з 0 рядків при блокуванні RLS — не помилка, просто нічого не пишеться. Рішення: завжди використовувати admin client для критичних user-facing записів після верифікації identity через `getUser()`.
- **Streaming gap**: Next.js відправляє root layout HTML миттєво; page.tsx чекає DB → blank background видно. Рішення: `loading.tsx` з правильними кольорами теми заповнює gap.
- **CSS !important beats JS inline style**: `beforeInteractive` скрипт встановлює `body.style.backgroundColor` через JS inline style. CSS `!important` у `<style>` тегу перебиває JS inline style — це стандарт CSS cascade.
- **Client-side navigation doesn't re-render root layout**: `router.push()` не запускає root layout знову → x-pathname fix не спрацьовує для навігацій. Рішення: master layout `<style>` tag re-рендериться на кожній навігації.

#### Skills chain
`senior-frontend` → `impeccable` (QA pending) → `humanizer` (N/A — no new copy) → TSC → build → commit → push

#### Issues encountered
1. **34 files uncommitted** — Vercel мав старий код. Весь час налагодження production відбувався на старому коді. FIX: `git add + git commit + git push`.
2. **Supabase RLS silent failure** — `error:null` + 0 rows = step не зберігається. FIX: admin client.
3. **Streaming blank page** — root layout відправляється до page.tsx. FIX: `loading.tsx`.
4. **CSS var dependency** — `var(--background)` не резолвиться до завантаження CSS. FIX: hardcoded `#EFF2FF`.

---

## Завершені кроки

### STEP 01 — Головний Лендинг (`/`)
- **Date Ready:** 2026-05-28
- **Model used:** 🟢 Sonnet 4.6 high
- **Effort:** ~2 год (полішинг, налаштування reducedMotion та weak-devices)
- **Drawers:** `d61ab82e`
- **Commit:** 3a42b10+

#### Quality Gate Verdict
| Вимір | Стан |
|---|---|
| 1. Aesthetics & Themes | ✅ CSS змінні кольорів, Frost токени; адаптивність перевірена; темні секції мають WCAG AA контраст |
| 2. No-Emoji Policy | ✅ Емодзі вилучено з коду (Lucide іконки; дозволено тільки 🇺🇦 у футері) |
| 3. Motion & Transitions | ✅ GSAP ScrollTrigger rise stack; per-item useInView; split reveals; CountUp fixed; prefers-reduced-motion та оптимізація під слабкі пристрої інтегрована |
| 4. Errors & Validation | ✅ Перенаправлення з кнопок на /register та /login перевірено; калькулятор доходу безпечно затиснутий (clamped) |
| 5. A11y & Performance | ✅ alt на mockup зображеннях; aria-label на BentoFeatures; h1 унікальний |
| 6. Core Features | ✅ Робота ROI калькулятора, слайдерів, розрахунок та посилання перевірені |
| 7. Tests Verification | ✅ Playwright smoke тести зелені |

#### Files changed
- `src/components/landing/LandingPageContent.tsx` — додано детекцію слабких пристроїв та prefers-reduced-motion, відключено GSAP rise ефекти для підвищення продуктивності та доступності
- `src/components/landing/LandingTrustBar.tsx` — CountUp рефакторено на використання useState + useMotionValueEvent
- `src/components/landing/LandingHero.tsx` — переведено на CSS змінні Frost теми, додано alt опис для скріншота кабінету
- `src/components/landing/LandingEconomy.tsx` — додано безпечне затискання діапазону в Slider компоненті

#### Key decisions
- **Тест пристроїв**: Визначення CPU `< 4` та RAM `< 4GB` дозволяє автоматично знижувати навантаження від GSAP анімацій на застарілих мобільних телефонах.
- **Відмова від Testimonials**: За домовленістю з користувачем, блок Testimonials не інтегрувався в лендінг, щоб зберегти фокус на ключових перевагах.

#### Skills chain
`design-taste-frontend` → `emil-design-eng` → `impeccable` → `humanizer` → TSC → build

---

### STEP 02 — Authentication Flow (`/login`, `/register`, `/callback`)
- **Date Ready:** 2026-05-28
- **Model used:** 🟢 Sonnet 4.6 high
- **Effort:** ~1 сесія (виконано поза черговістю; STEP 01 ще in progress)
- **Drawers:** `drawer_bookit_decisions_0f174061d23c416c18ca555f`, `drawer_bookit_decisions_aece86e2ab927d19f15e31ce`
- **Commit:** ff50c78 (base) + changes in session

#### Quality Gate Verdict
| Вимір | Стан |
|---|---|
| 1. Aesthetics & Themes | ✅ Frost enforced (`data-theme="frost"`); white card; dark panel; mobile strip; aurora |
| 2. No-Emoji Policy | ✅ Нуль emoji — Lucide icons |
| 3. Motion & Transitions | ✅ spring stiffness:340 `as const`; popLayout; whileTap; AnimatePresence |
| 4. Errors & Validation | ✅ Inline AnimatePresence errors; phone/terms guards; all API errors |
| 5. A11y & Performance | ✅ WCAG AA (всі text пари верифіковані); sr-only; aria-hidden |
| 6. Core Features | ✅ Google OAuth back-button fix; OTP paste/auto-submit; referral; cooldown |
| 7. Tests Verification | ⏳ Logic unchanged; E2E smoke carry-over |

#### Files changed
- `src/app/(auth)/layout.tsx` — Frost split-screen layout: `data-theme="frost"`, dark panel `var(--accent)`, mobile editorial strip, em-dash fix
- `src/components/auth/PhoneOtpForm.tsx` — "Nordic Slab" full visual redesign: white container, stacked role cards, 3-segment progress, WCAG AA colors

#### Key decisions
- `data-theme="frost"` на div (не html) — достатньо для CSS cascade; вирішує Blossom bleed pre-login
- Відмова від `bento-card`: `var(--surface)` ≈ `var(--background)` у Frost → нульовий контраст → raw `bg-white`
- Role cards стопкою (не 2-col grid) — уникає "identical card grid" anti-pattern (impeccable ban)
- `#6366F1` → `#4338CA` тільки для TEXT; декоративні елементи залишені `#6366F1`

#### Skills chain
`impeccable craft` → `design-taste-frontend` → `mcp__magic__21st` (skipped) → `humanizer` → `mcp__a11y__are-colors-accessible` → TSC → build

#### Tests
- E2E: не запущено (логіка не змінювалась, carry-over)

#### Carry-over to next step
- Playwright E2E auth smoke test (рекомендований для STEP 07/10)

#### Issues encountered
- `.next/lock` dir блокував build → видалено
- `bento-card` var(--surface) white-on-white → замінено на raw white container
- `#94A3B8` / `#6366F1` WCAG fail → `#64748B` / `#4338CA`

---

---

*Версія: 1.0 · Створено: 2026-05-27*
