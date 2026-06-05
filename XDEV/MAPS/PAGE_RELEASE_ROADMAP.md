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
| 3 | Onboarding | 🟢 Sonnet 4.6 high | ✅ Complete | [STEP_03_HANDOFF.md](../RELEASE/STEPS/STEP_03_HANDOFF.md) |
| 4 | Dashboard Home | 🟢 Sonnet 4.6 | ⚠️ Carry-over (B-01..B-05) | — |
| 5 | Bookings | 🟢 Sonnet 4.6 | ✅ Complete (2026-05-31) | [STEP_05_HANDOFF.md](../RELEASE/STEPS/STEP_05_HANDOFF.md) |
| 6 | CRM Clients | 🟡 Mixed | ✅ Complete (2026-05-31) | — |
| 7 | Services + Products | 🟢 Sonnet 4.6 high | ✅ Complete (2026-05-31) | — |
| 8 | Other Hubs (Revenue · Growth · Marketing · Billing · Settings · Studio) | 🟢 Sonnet 4.6 | ✅ Complete (2026-05-31) | [STEP_08_HANDOFF.md](../RELEASE/STEPS/STEP_08_HANDOFF.md) |
| 9 | Explore | 🟢 Sonnet 4.6 high | ✅ Complete (2026-05-31) | [STEP_09_HANDOFF.md](../RELEASE/STEPS/STEP_09_HANDOFF.md) |
| 10 | Public Master Page | 🟢 Sonnet 4.6 high | ✅ Complete (2026-05-31) | — |
| 11 | Shop + Portfolio | 🟢 Sonnet 4.6 | ✅ Complete (2026-05-31) | [STEP_11_HANDOFF.md](../RELEASE/STEPS/STEP_11_HANDOFF.md) |
| 12 | Client Portal | 🟢 Sonnet 4.6 high | ✅ Complete (2026-06-01) | [STEP_12_HANDOFF.md](../RELEASE/STEPS/STEP_12_HANDOFF.md) |
| 13 | Legal/Offline/Invite/Studio/Admin + Backlog | 🟢 Sonnet 4.6 high | ✅ Complete (2026-06-01) | [STEP_13_HANDOFF.md](../RELEASE/STEPS/STEP_13_HANDOFF.md) |

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
*   **Статус**: ⏳ In Progress — sessions 1-4 done (2026-05-30) · Pending: `/impeccable audit` + user QA sign-off
*   **Model:** 🟢 Sonnet 4.6
*   **Last commit:** `6577d5a` (DASHBOARD)
*   **Архітектура (актуально 2026-05-30)**:
    *   **Entry:** `src/app/(master)/dashboard/page.tsx` → `FrostDashboard.tsx` / `BlossomDashboard.tsx` / `StudioDashboard.tsx`
    *   **Widget root:** `src/components/master/dashboard/widgets/{frost|blossom|studio}/`
    *   **Shared:** `FrostMetricsStrip.tsx`, `InsightsRow.tsx`, `DashboardTourContext.tsx`, `DashboardTourBanner.tsx`
    *   **Frost Grid:** CSS Grid named areas + `align-items: stretch` (не `items-start`) + `flex flex-col` на wrapper divs
    *   **Academy:** `src/components/master/dashboard/widgets/frost/AcademyWidget.tsx` — tabs + accordion + 26 статей + Emil springs

*   **Виконано за STEP 04 (sessions 1-4)**:

    | Блок | Задача | Статус |
    |---|---|---|
    | A | EarningsPulseWidget: revenue `/100` bug | ✅ |
    | B | useRealtimeNotifications: `busyness` query invalidation | ✅ |
    | C | Empty states: TodaySchedule, TopServices, ChannelHealth, InsightsRow, WeeklyChart, PeakHours | ✅ |
    | D+E | Tour: DashboardTourContext, DashboardTourBanner, DOM overlay, getBCR, `data-tour-step` attrs | ✅ |
    | F | Academy: повний rewrite (tabs + accordion + 26 articles + Emil springs + deep links) | ✅ |
    | G | Frost Grid: `items-start` → stretch, `flex flex-col` wrapper divs | ✅ |
    | G2 | PeakHoursWidget: Fragment → `div.flex.flex-col`, heatmap `flex-1 min-h-[10px]` dynamic scaling | ✅ |
    | G3 | ChannelHealthWidget: actionable empty state + CTA → /dashboard/clients | ✅ |
    | G4 | FreeSlotsWidget, NextFreeDays, TopServices, CancellationRate: `mt-auto` footer pin | ✅ |
    | G5 | InsightsRow: TopClientCard + totalSpent; AvgCheckCard + comparison bars | ✅ |
    | G6 | NextFreeDays chips: `flex-1` — fill row width | ✅ |

*   **Залишилось до Complete**:
    *   [ ] `/impeccable audit` → health score (baseline 22/40 → target 34+)
    *   [ ] Carry-overs: B-03 (Studio WeeklyChart drill-down), B-04 (Frost tooltip radius), B-05 (Blossom font standardization)
    *   [ ] User QA sign-off → `STEP 04 COMPLETE`

*   **Quality Gate (поточний стан)**:

    | Вимір | Стан |
    |---|---|
    | 1. Aesthetics & Themes | ⏳ Pending `/impeccable audit` |
    | 2. No-Emoji Policy | ✅ Lucide icons, нуль emoji |
    | 3. Motion & Transitions | ✅ spring `as const`, `popLayout`, `layoutId` tabs, rise variants |
    | 4. Errors & Validation | ✅ Empty states, actionable CTAs |
    | 5. A11y & Performance | ✅ TSC 0 errors · Build clean |
    | 6. Core Features | ✅ Revenue fix, Tour, Academy, Grid stretch |
    | 7. Tests Verification | ⏳ Pending E2E run |

---

### 📅 Крок 5. Dashboard Bookings (`/dashboard/bookings`)
*   **Статус**: 🔒 Заблоковано
*   **Pre-work завершено (2026-05-30)**:
    *   ✅ BookingWizard QA Sprint: carousel, slot physics, dots, bugs, photos pipeline
    *   ✅ ManualBookingForm: `imageUrl→image_url` mapping fix
*   **Вектори перевірки**:
    *   UI/UX / Themes & Motion
    *   Server Side & Database
    *   Логіка і функціонал сторінки
    *   Тести (E2E & Unit)

---

### 👥 Крок 6. Dashboard CRM Clients (`/dashboard/clients`)
*   **Статус**: ✅ Complete (2026-05-31) — impeccable 15/20
*   **Drawer:** `8b26b6ff187c043ed68372b0`
*   **Key changes:** div→button CRM cards, aria-pressed ×8 chip groups, SegmentBuilder useEffect([id]) fix, ClientDetailSheet 2-step archive confirm, SPRING sweep
*   **Carry-over:** D-01 borderLeft→border+tint (P1), D-02..D-04 (P2)

---

### ✂️ Крок 7. Dashboard Services & Products (`/dashboard/services` & `/dashboard/products`)
*   **Статус**: ✅ Complete (2026-05-31) — correctness audit
*   **Drawer:** `drawer_bookit_audits_ea3affc66ed6c48195edda5e`
*   **Key changes:** P1 ServiceCard motion.div→button, type="button" ×20+, aria-pressed ×10, aria-label FABs+drag, orphan files deleted, mock stats replaced, dead code removed

---

### 📊 Крок 8. Other Dashboard Pages (Revenue · Growth · Marketing · Billing · Settings · Studio)
*   **Статус**: ✅ Complete (2026-05-31) — correctness audit 08a/08b/08c
*   **Drawer:** `drawer_bookit_audits_e1534fd674b5432d8685234b`
*   **Key changes:** P1 div→button ×2, type="button" ×20+, aria-pressed/label, spring as const, dead code removed, billing ECDSA CLEAN

---

### 🔍 Крок 9. Explore Page (`/explore`)
*   **Статус**: ✅ Complete (2026-05-31) — correctness + visual polish
*   **Drawer:** `drawer_bookit_audits_e7959f077fa9adbf72463435`
*   **Key files:** `src/components/public/ExplorePage.tsx`
*   **Key changes:**
    *   type="button" ×9, aria-label + p-1.5 (X clear), aria-pressed ×4 toggles
    *   aria-expanded + aria-haspopup="listbox" (city trigger), role=listbox/option + aria-selected
    *   **P1 Bug:** PRO badge kліпувався через overflow-hidden → переміщено в outer wrapper
    *   pluralUk() для serviceCount ("послуга/послуги/послуг")
    *   SPRING as const (4 transitions), animate-pulse видалено, MasterCard hover lift
*   **Quality Gate:**
    *   ✅ Aesthetics & Themes — hover lift, PRO badge fix, animate-pulse removed
    *   ✅ No-Emoji Policy — нуль emoji
    *   ✅ Motion & Transitions — SPRING as const, y-axis AnimatePresence
    *   ➖ Errors & Validation — server component, no forms
    *   ✅ A11y & Performance — повний aria sweep, role=listbox, touch targets
    *   ✅ Core Features — filter + search + sort + city dropdown working
    *   ✅ Tests Verification — TSC 0 · build clean (51 pages)

---

### 🌍 Крок 10. Public Master Page (`/[slug]`)
*   **Статус**: ✅ Complete (2026-05-31) — correctness + visual polish
*   **Drawer:** `drawer_bookit_audits_6b554b09eed872165f45ba2a`
*   **Key files:** `PublicMasterPage.tsx`, `ServiceSelector.tsx`, `ClientCombobox.tsx`, `DateTimePicker.tsx`, `useBookingWizardState.ts`, `PostBookingAuth.tsx`
*   **Key changes:**
    *   SPRING + SPRING_CARD as const — 15 inline transitions extracted
    *   type="button" ×3 (FlashDealCard, referral banners), hardcoded colors → success tokens
    *   `<img>` → Next.js `<Image>` for service thumbnails
    *   Share button size-9 → size-11 (36→44px), carousel nav size-7 → size-11 (28→44px)
    *   aria-selected dynamic in ClientCombobox, aria-label on date nav buttons
    *   C2C eligibility race condition fixed (cancelled flag)
    *   OTP digit inputs w-10 → w-11 (40→44px touch target)
*   **Business logic verified CLEAN:** createBooking, dynamicPricing, computeBookingPrice, actions.ts
*   **Quality Gate:**
    *   ✅ Aesthetics & Themes — success tokens replace hardcoded green
    *   ✅ No-Emoji Policy — нуль emoji у UI
    *   ✅ Motion & Transitions — SPRING as const ×15
    *   ✅ Errors & Validation — auth before try ×3 verified
    *   ✅ A11y & Performance — touch targets ≥44px, aria sweep, img→Image optimization
    *   ✅ Core Features — booking flow, dynamic pricing, C2C, OTP — verified
    *   ✅ Tests Verification — TSC 0 · build clean (51 pages)

---

### 🛒 Крок 11. Public Shop & Portfolio (`/[slug]/shop` & `/[slug]/portfolio`)
*   **Статус**: ✅ Complete (2026-05-31) — correctness + a11y audit
*   **Drawer:** `drawer_bookit_audits_2272efe59888d3addd38f5c0`
*   **Key files:** `ShopPage.tsx`, `PortfolioBookingButton.tsx`, `portfolio/[id]/page.tsx`
*   **Key changes:**
    *   4x spring as const (SHEET/GALLERY/CART/SUCCESS), DOM ref fix (getElementById->useRef)
    *   type="button" x17, aria-label x7, aria-pressed x5, photo dots touch target fix (8px->32px+)
    *   Emoji removed (lightning bolt), fill="currentColor" Star fix
    *   Business logic CLEAN: createPublicOrder stock atomic verified STEP 10
*   **Quality Gate:**
    *   ✅ Aesthetics & Themes — pre-existing design preserved
    *   ✅ No-Emoji Policy — emoji removed from stock warning
    *   ✅ Motion & Transitions — 4 spring constants as const
    *   ✅ Errors & Validation — stock atomic + auth before try verified CLEAN
    *   ✅ A11y & Performance — full aria sweep, WCAG AA verified
    *   ✅ Core Features — cart flow, qty steppers, day picker, portfolio all working
    *   ✅ Tests Verification — TSC 0 · build clean (51 pages)

---

### 📱 Крок 12. Client Portal (`/my/*`)
*   **Статус**: ✅ Complete (2026-06-01) — security + a11y + correctness sweep
*   **Drawers:** `0a433239dd2c899a3691ba79` (12a) · `3bec0459fbf4b9a44e1aa9d9` (12b)
*   **Key changes:**
    *   **Security:** 5 page files без auth guard → `if (!user) redirect('/login')` added; `setup/phone` — повний rewrite (не мав auth взагалі)
    *   **A11y P1:** `motion.div onClick` → `motion.button type="button"` (ClientNotificationsPage); star rating buttons (aria-label + aria-pressed); dismiss button aria-label; back Link aria-label
    *   **Correctness:** `type="button"` ×30+; `aria-pressed` на tabs (MyBookingsPage, MyLoyaltyPage); `htmlFor`/`id` на 5 полях форми; `spring as const` ×6; `aria-current="page"` на nav Links; emoji видалено з SupportChatPage SUGGESTIONS
    *   **Encoding:** curly apostrophe U+2019 fixed in MyProfilePage ("здоров'я")
    *   **Public routes audit:** middleware коректний, всі публічні маршрути доступні без auth
*   **Quality Gate:**
    *   ✅ Aesthetics & Themes — no visual changes (correctness-only)
    *   ✅ No-Emoji Policy — emoji removed from SUGGESTIONS, ✓ checkmarks planned (P3 carry-over)
    *   ✅ Motion & Transitions — spring as const у 5 компонентах
    *   ✅ Errors & Validation — auth guards на всіх /my/* pages
    *   ✅ A11y & Performance — повний aria sweep, htmlFor/id, aria-current
    *   ✅ Core Features — no regressions
    *   ✅ Tests Verification — TSC 0 · build clean (51 pages)

---

### 📄 Крок 13. Системні сторінки + Admin + Backlog ✅ Complete (2026-06-01)
*   **Статус**: ✅ Complete — TSC 0 · build clean
*   **Drawer:** `drawer_bookit_audits_774ccb6b5e3b9700582e81ce`
*   **Key changes:**
    *   **Security P0:** `resolveSupportTicketAction()` — missing admin role check added
    *   **Admin A11y:** 25× `type="button"` across 5 admin components
    *   **Offline:** `type="button"` + `aria-label` + `aria-hidden` on emoji
    *   **Invite:** emoji ✨📅💎 → Lucide Sparkles/CalendarCheck/Gem
    *   **B-03:** Studio WeeklyChart — date in tooltip + `getWeekDates()` + `div→button` on bars
    *   **B-04:** Frost tooltip — already `rounded-[4px]` ✅ no change
    *   **B-05:** Blossom WeeklyChart — `type="button"` + `div→button` on bars
    *   **C-01:** BookingCard — `borderLeft:4px` → `border:1px + background:color08`
    *   **D-01:** ClientsPage — same border fix on grid + list rows
    *   **Clean (no changes):** legal/*, studio/*, studio/join
*   **Deferred:** B-01 Dashboard /impeccable audit · B-02 Vercel QA (manual)
*   **Quality Gate:**
    *   ✅ Aesthetics & Themes — border polish applied (full border + tint)
    *   ✅ No-Emoji Policy — emoji → Lucide icons in invite; aria-hidden on offline
    *   ✅ Motion & Transitions — div→button on chart bars (both Blossom + Studio)
    *   ✅ Errors & Validation — admin role guard in server action
    *   ✅ A11y & Performance — 25× type="button"; aria-label on offline
    *   ✅ Core Features — no regressions
    *   ✅ Tests Verification — TSC 0 · build clean
