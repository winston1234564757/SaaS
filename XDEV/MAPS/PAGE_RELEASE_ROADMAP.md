# 🗺️ Page Release & Visual Polish Roadmap — BookIT

Цей документ визначає покроковий маршрут приведення кожної сторінки BookIT до ідеального стану та критерії готовності до релізу (Quality Gate).

> **Суворе правило розробки**: Ми працюємо над сторінками суто послідовно. Тільки після того, як поточна сторінка пройшла всі виміри перевірки і затверджена — ми маємо право перейти до полішингу наступної сторінки.
>
> **Один чат = один крок.** Operational hub цієї задачі: [`../RELEASE/`](../RELEASE/README.md). Цей файл — джерело правди для **scope** кожного кроку. STATUS / PROTOCOL / CHANGELOG / per-step playbooks — у папці `RELEASE/`.

---

## 🧠 Quick Index — Модель + Статус

| # | Сторінка | Модель | Статус | Playbook |
|---|---|---|---|---|
| 1 | `/` Landing | 🟢 Sonnet 4.6 high | ✅ Complete | [STEP_01_landing.md](../RELEASE/STEPS/STEP_01_landing.md) |
| 2 | Auth | 🟢 Sonnet 4.6 high | ✅ Complete | [STEP_02_auth.md](../RELEASE/STEPS/STEP_02_auth.md) |
| 3 | Onboarding | 🟢 Sonnet 4.6 high | 🔄 In QA | [STEP_03_HANDOFF.md](../RELEASE/STEPS/STEP_03_HANDOFF.md) |
| 4 | Dashboard Home | 🔴 Opus 4.7 max | 🔒 Blocked | — |
| 5 | Bookings | 🔴 Opus 4.7 max | 🔒 Blocked | — |
| 6 | CRM Clients | 🟡 Mixed | 🔒 Blocked | — |
| 7 | Services + Products | 🟢 Sonnet 4.6 high | 🔒 Blocked | — |
| 8 | Other Hubs (3 чати) | 🔴 Opus 4.7 max | 🔒 Blocked | — |
| 9 | Explore | 🟢 Sonnet 4.6 high | 🔒 Blocked | — |
| 10 | Public Master Page | 🔴 Opus 4.7 max | 🔒 Blocked | — |
| 11 | Shop + Portfolio | 🔴 Opus 4.7 max | 🔒 Blocked | — |
| 12 | Client Portal | 🟢 Sonnet 4.6 high | 🔒 Blocked | — |
| 13 | Legal/Offline/Referral | 🟡 Mixed | 🔒 Blocked | — |

> **Live tracker** з drawer IDs, commit hashes та handoff нотатками — у [../RELEASE/STATUS.md](../RELEASE/STATUS.md).

---

## 🚦 7 Вимірів Якості (Quality Gate Checkpoints)

Кожна сторінка перед релізом перевіряється за такими загальними критеріями:
1.  **Aesthetics & Themes**: Повна відповідність сітці, адаптивність під мобільні екрани, бездоганний вигляд у 3-х темах (Blossom, Studio, Frost). Наявність SVG-шуму (grain), м'якої віньєтки та фонових градієнтів.
2.  **No-Emoji Policy**: Абсолютна відсутність емодзі в інтерфейсі (заміна на Lucide React іконки з відповідними кольоровими акцентами).
3.  **Motion & Transitions**: Spring-анімації з низьким bounce, `mode="popLayout"` для AnimatePresence, плавні таб-індикатори з `layoutId`.
4.  **Errors & Validation**: Валідація форм через Zod, відсутність технічних повідомлень у toast (переведення через `parseError`), автозбереження нотаток/форм з індикатором стану.
5.  **A11y & Performance**: Семантичний HTML5, контрастність кольорів за WCAG AA, атрибути `aria-invalid`, `aria-describedby` для помилок форм, відсутність Layout Shifts (CLS).
6.  **Core Features & Functionality**: Повна та глибока перевірка всієї ключової бізнес-логіки та інтерактивних модулів на сторінці (калькулятори, транзакції, нарахування бонусів, OTP-авторизація).
7.  **Tests Verification**: Проходження юніт-тестів Vitest та Playwright E2E тестів сторінки.

---

## 📍 Етапи розробки та Посторінкові Вектори

### 🏁 Крок 1. Головний Лендинг (`/`)
*   **Статус**: ✅ Завершено — 2026-05-28
*   **Playbook**: [STEP_01_landing.md](../RELEASE/STEPS/STEP_01_landing.md)
*   **Архітектура (актуально 2026-05-28)**:
    *   **Entry:** `src/app/page.tsx` → `RootPageClient.tsx` (TMA guard) → `LandingPageContent.tsx`
    *   **Pre-stack:** LandingHero, LandingTrustBar, LandingMarquee
    *   **GSAP card-rise stack (11 секцій, 30vh overlap, scrub:1):** Agitation → Magic → BentoFeatures → Integrations → ClientFlow → Comparison → [Process excluded] → Economy → Pricing → [FAQ excluded] → FooterCTA
    *   **Excluded from overlap (transparent bg):** LandingProcess (sticky left col), LandingFAQ (accordion)
    *   **Pending integration:** LandingTestimonials.tsx (файл існує, не в page; за згодою з користувачем не інтегровано)
*   **Виміри якості**:
    *   ✅ **Motion & Transitions** — GSAP ScrollTrigger stack, per-item `useInView` animations, word/sentence reveals, CountUp fix, spring animations, prefers-reduced-motion & weak device optimizations
    *   ✅ **Aesthetics & Themes** — `--l-*` CSS tokens встановлено; mobile 375px + dark sections verified; CSS theme variables integrated
    *   ✅ **No-Emoji Policy** — пройшов аудит; нуль emoji (крім 🇺🇦 у футері)
    *   ✅ **Errors & Validation** — CTA redirects verified, ROI Calculator safety clamping added
    *   ✅ **A11y & Performance** — `<main>`, `aria-label` on Bento, alt attributes on mockup images, WCAG AA contrast checked
    *   ✅ **Core Features** — ROI Calculator, navigation links, mobile overflow verified
    *   ✅ **Tests** — Playwright smoke green

---

### 🔑 Крок 2. Authentication Flow (`/login`, `/register`, `/auth/callback`)
*   **Статус**: ✅ Завершено — 2026-05-28 (out-of-order)
*   **Playbook**: [STEP_02_auth.md](../RELEASE/STEPS/STEP_02_auth.md)
*   **Key files:**
    *   `src/app/(auth)/layout.tsx` — Frost split-screen; `data-theme="frost"` fix; dark brand panel; mobile strip
    *   `src/components/auth/PhoneOtpForm.tsx` — "Nordic Slab": white container, stacked role cards, 3-segment progress, WCAG AA
*   **Виміри якості**:
    *   ✅ **Aesthetics & Themes** — Frost enforced; white card на `#EFF2FF`; aurora blobs; mobile editorial strip
    *   ✅ **No-Emoji Policy** — нуль emoji; Lucide icons
    *   ✅ **Motion & Transitions** — spring `as const`; `mode="popLayout"`; whileTap; scaleX progress
    *   ✅ **Errors & Validation** — AnimatePresence inline errors; phone/terms guards; all API errors
    *   ✅ **A11y & Performance** — WCAG AA verified (`#64748B`, `#4338CA`); sr-only; aria-hidden
    *   ✅ **Core Features** — Google OAuth back-button fix; OTP paste/auto-submit; referral; cooldown
    *   ⏳ **Tests** — carry-over (logic unchanged)

---

### 📦 Крок 3. Onboarding Wizard (`/dashboard/onboarding`)
*   **Статус**: 🔄 In QA — задеплоєно Vercel (`967bf06`, 2026-05-29)
*   **Playbook**: [STEP_03_HANDOFF.md](../RELEASE/STEPS/STEP_03_HANDOFF.md)
*   **Архітектура (актуально 2026-05-29)**:
    *   **Primary route**: `src/app/(master)/dashboard/onboarding/` — у master layout з `isOnboarding` guard; clean Frost environment (без nav/sidebar)
    *   **Legacy route**: `src/app/onboarding/` — окремий layout; `data-theme="frost"` wrapper (BlobBackground видалено)
    *   **5 кроки**: `PROFILE → SERVICES → SCHEDULE → PREVIEW → SUCCESS`
    *   **Persistence**: `saveOnboardingProgress()` → admin client (bypass RLS) → `profiles.onboarding_step` + `profiles.onboarding_data`
    *   **Streaming**: `loading.tsx` — Frost skeleton під час DB fetch
    *   **Theme**: 3-layer enforcement (root layout x-pathname + master layout `<style>!important` + wizard useEffect)
*   **Key files**:
    *   `src/app/(master)/dashboard/onboarding/page.tsx` — force-dynamic, Frost wrapper
    *   `src/app/(master)/dashboard/onboarding/loading.tsx` — **NEW** Frost skeleton
    *   `src/app/(master)/dashboard/onboarding/actions.ts` — admin client для step persistence
    *   `src/components/master/onboarding/OnboardingWizard.tsx` — 5-step state machine, persistStep helper
    *   `src/components/master/onboarding/steps/` — StepProfile, StepServices, StepSchedule, StepPreview, StepSuccess
*   **Виміри якості**:
    *   ✅ **Aesthetics & Themes** — Frost 3-layer enforcement; glassmorphism StepPreview card; Frost skeleton в loading
    *   ✅ **No-Emoji Policy** — нуль emoji; Lucide icons скрізь
    *   ✅ **Motion & Transitions** — `mode="popLayout"`; `spring as const`; slide variants (x:44, scale:0.97)
    *   ✅ **Errors & Validation** — persistStep() з error logging; slug regex; server error toasts; admin client гарантує запис
    *   ✅ **A11y & Performance** — TSC 0 errors; build clean; WCAG AA (hexLuminance для avatar text)
    *   ✅ **Core Features** — per-category services; slug editing; schedule v2; step persistence
    *   🔄 **Tests** — QA на Vercel після deploy (тести carry-over)

---

### 🏠 Крок 4. Dashboard Home (`/dashboard`)
*   **Статус**: 🔒 Заблоковано
*   **Вектори перевірки**:
    *   UI/UX / Themes & Motion
    *   Server Side & Database
    *   Логіка і функціонал сторінки
    *   Тести (E2E & Unit)

---

### 📅 Крок 5. Dashboard Bookings (`/dashboard/bookings`)
*   **Статус**: 🔒 Заблоковано
*   **Вектори перевірки**:
    *   UI/UX / Themes & Motion
    *   Server Side & Database
    *   Логіка і функціонал сторінки
    *   Тести (E2E & Unit)

---

### 👥 Крок 6. Dashboard CRM Clients (`/dashboard/clients`)
*   **Статус**: 🔒 Заблоковано
*   **Вектори перевірки**:
    *   UI/UX / Themes & Motion
    *   Server Side & Database
    *   Логіка і функціонал сторінки
    *   Тести (E2E & Unit)

---

### ✂️ Крок 7. Dashboard Services & Products (`/dashboard/services` & `/dashboard/products`)
*   **Статус**: 🔒 Заблоковано
*   **Вектори перевірки**:
    *   UI/UX / Themes & Motion
    *   Server Side & Database
    *   Логіка і функціонал сторінки
    *   Тести (E2E & Unit)

---

### 📊 Крок 8. Other Dashboard Pages (Analytics, Marketing, Loyalty, Billing, Settings, Studio)
*   **Статус**: 🔒 Заблоковано
*   **Вектори перевірки**:
    *   UI/UX / Themes & Motion
    *   Server Side & Database
    *   Логіка і функціонал сторінки
    *   Тести (E2E & Unit)

---

### 🔍 Крок 9. Explore Page (`/explore`)
*   **Статус**: 🔒 Заблоковано
*   **Вектори перевірки**:
    *   UI/UX / Themes & Motion
    *   Server Side & Database
    *   Логіка і функціонал сторінки
    *   Тести (E2E & Unit)

---

### 🌍 Крок 10. Public Master Page (`/[slug]`)
*   **Статус**: 🔒 Заблоковано
*   **Вектори перевірки**:
    *   UI/UX / Themes & Motion
    *   Server Side & Database
    *   Логіка і функціонал сторінки
    *   Тести (E2E & Unit)

---

### 🛒 Крок 11. Public Shop & Portfolio (`/[slug]/shop` & `/[slug]/portfolio`)
*   **Статус**: 🔒 Заблоковано
*   **Вектори перевірки**:
    *   UI/UX / Themes & Motion
    *   Server Side & Database
    *   Логіка і функціонал сторінки
    *   Тести (E2E & Unit)

---

### 📱 Крок 12. Client Portal (`/my/*`)
*   **Статус**: 🔒 Заблоковано
*   **Вектори перевірки**:
    *   UI/UX / Themes & Motion
    *   Server Side & Database
    *   Логіка і функціонал сторінки
    *   Тести (E2E & Unit)

---

### 📄 Крок 13. Системні та правові сторінки (`/legal`, `/offline`, `/r/[code]`)
*   **Статус**: 🔒 Заблоковано
*   **Вектори перевірки**:
    *   UI/UX / Themes & Motion
    *   Server Side & Database
    *   Логіка і функціонал сторінки
    *   Тести (E2E & Unit)
