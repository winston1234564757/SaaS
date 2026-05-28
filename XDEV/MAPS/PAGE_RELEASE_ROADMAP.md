# 🗺️ Page Release & Visual Polish Roadmap — BookIT

Цей документ визначає покроковий маршрут приведення кожної сторінки BookIT до ідеального стану та критерії готовності до релізу (Quality Gate).

> **Суворе правило розробки**: Ми працюємо над сторінками суто послідовно. Тільки після того, як поточна сторінка пройшла всі виміри перевірки і затверджена — ми маємо право перейти до полішингу наступної сторінки.
>
> **Один чат = один крок.** Operational hub цієї задачі: [`../RELEASE/`](../RELEASE/README.md). Цей файл — джерело правди для **scope** кожного кроку. STATUS / PROTOCOL / CHANGELOG / per-step playbooks — у папці `RELEASE/`.

---

## 🧠 Quick Index — Модель + Статус

| # | Сторінка | Модель | Статус | Playbook |
|---|---|---|---|---|
| 1 | `/` Landing | 🟢 Sonnet 4.6 high | ⏳ In progress | [STEP_01_landing.md](../RELEASE/STEPS/STEP_01_landing.md) |
| 2 | Auth | 🔴 Opus 4.7 max | 🔒 Blocked | — |
| 3 | Onboarding | 🔴 Opus 4.7 max | 🔒 Blocked | — |
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
*   **Статус**: ⏳ В роботі — оновлено 2026-05-28
*   **Playbook**: [STEP_01_landing.md](../RELEASE/STEPS/STEP_01_landing.md)
*   **Архітектура (актуально 2026-05-28)**:
    *   **Entry:** `src/app/page.tsx` → `RootPageClient.tsx` (TMA guard) → `LandingPageContent.tsx`
    *   **Pre-stack:** LandingHero, LandingTrustBar, LandingMarquee
    *   **GSAP card-rise stack (11 секцій, 30vh overlap, scrub:1):** Agitation → Magic → BentoFeatures → Integrations → ClientFlow → Comparison → [Process excluded] → Economy → Pricing → [FAQ excluded] → FooterCTA
    *   **Excluded from overlap (transparent bg):** LandingProcess (sticky left col), LandingFAQ (accordion)
    *   **Pending integration:** LandingTestimonials.tsx (файл існує, не в page)
*   **Виміри якості**:
    *   ✅ **Motion & Transitions** — GSAP ScrollTrigger stack, per-item `useInView`, word/sentence reveals, CountUp fix, spring animations
    *   ⏳ **Aesthetics & Themes** — `--l-*` CSS tokens встановлено; mobile 375px + dark sections — pending
    *   ⏳ **No-Emoji Policy** — не перевірено
    *   ⏳ **Errors & Validation** — CTA redirects, ROI Calculator
    *   ⏳ **A11y & Performance** — `<main>`, `aria-label` на Bento ✓; Lighthouse pending
    *   ⏳ **Core Features** — ROI Calculator, nav links, mobile overflow
    *   ⏳ **Tests** — Playwright smoke + client journey

---

### 🔑 Крок 2. Authentication Flow (`/auth/login`, `/auth/register`, `/auth/callback`)
*   **Статус**: 🔒 Заблоковано
*   **Вектори перевірки**:
    *   UI/UX / Themes & Motion
    *   Server Side & Database
    *   Логіка і функціонал сторінки
    *   Тести (E2E & Unit)

---

### 📦 Крок 3. Onboarding Wizard (`/onboarding`)
*   **Статус**: 🔒 Заблоковано
*   **Вектори перевірки**:
    *   UI/UX / Themes & Motion
    *   Server Side & Database
    *   Логіка і функціонал сторінки
    *   Тести (E2E & Unit)

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
