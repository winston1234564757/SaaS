# STEP 01 — Головний Лендинг (`/`)

> **Створено:** 2026-05-27
> **Оновлено:** 2026-05-28
> **Модель:** 🟢 **Sonnet 4.6 high**
> **Статус:** ⏳ **In progress**
> **Estimated effort:** залишається ~2-3 год (emoji → a11y → tests)
> **Source of truth (scope):** [../../MAPS/PAGE_RELEASE_ROADMAP.md](../../MAPS/PAGE_RELEASE_ROADMAP.md)

---

## 🎯 Scope

### Pages / routes
- `/` — публічна головна сторінка (Server Component)
- `/register`, `/login` — переходи з CTA кнопок

### Actual key files (verified 2026-05-28)

**Entry points:**
- `src/app/page.tsx` — root Server Component
- `src/components/landing/RootPageClient.tsx` — TMA guard + session redirect
- `src/components/landing/LandingPageContent.tsx` — orchestrator: GSAP setup + SECTIONS map

**Pre-stack sections (normal flow):**
- `src/components/landing/LandingHero.tsx` — 3D Frost mockup hero
- `src/components/landing/LandingTrustBar.tsx` — 5 stats bar
- `src/components/landing/LandingMarquee.tsx` — infinite ticker

**GSAP Card-Rise Stack (`overlap: true`):**
- `src/components/landing/LandingAgitation.tsx` — 4× PainItem (01–04)
- `src/components/landing/LandingMagic.tsx` — 3× FeatureCard
- `src/components/landing/LandingBentoFeatures.tsx` — Smart Slots grid + CountUp
- `src/components/landing/LandingIntegrations.tsx` — TG/Push/SMS mockups
- `src/components/landing/LandingClientFlow.tsx` — 3× StepCard
- `src/components/landing/LandingComparison.tsx` — before/after table
- `src/components/landing/LandingEconomy.tsx` — ROI calculator (3 sliders)
- `src/components/landing/LandingPricing.tsx` — Starter/Pro/Studio cards
- `src/components/landing/LandingFooterCTA.tsx` — dark CTA section

**Excluded from overlap (transparent bg):**
- `src/components/landing/LandingProcess.tsx` — sticky left 3 steps
- `src/components/landing/LandingFAQ.tsx` — accordion

**Pending integration (file exists, NOT in page yet):**
- `src/components/landing/LandingTestimonials.tsx` — planned between Economy and Pricing

**Shared utilities:**
- `src/components/landing/LandingScrollProgress.tsx` — thin fixed progress bar
- `src/components/landing/LandingSplitHeading.tsx` — word-by-word animated headings

### Server Actions
- Лендінг статичний, server actions не використовуються

### DB tables
- Не змінюємо БД на цьому кроці

---

## 🚦 7 Quality Gate Dimensions

### 1. Aesthetics & Themes

#### Status: ⏳ Частково зроблено

- [x] `--l-*` CSS tokens у globals.css — Frost palette встановлено (2026-05-27)
- [x] `--l-indigo: #4338CA` — eyebrows + accents; `--l-indigo-glow: #6366F1` — decorative
- [x] WCAG AAA 7.08:1 контраст для основних текстів (підтверджено mcp__a11y)
- [x] `--l-muted: #475569` — AA 6.79:1
- [x] `border-radius: 1.5rem` на wrapper-ах rising-секцій (card-rise)
- [ ] Адаптивність — mobile 375px перевірка всіх секцій
- [ ] Dark sections (BentoFeatures, FooterCTA): перевірити contrast на dark bg
- [ ] Body font: Geist Sans (НЕ Inter); Display: Cormorant Garamond — перевірити скрізь

### 2. No-Emoji Policy

#### Status: ⏳ Не перевірено

- [ ] Grep `[\u{1F000}-\u{1FFFF}]|[\u{2600}-\u{27BF}]` у `src/components/landing/**`
- [ ] Footer `🇺🇦` — допустимо (прапор України як культурний символ, не UI-emoji)
- [ ] Будь-які emoji в тексті секцій → Lucide або прибрати

### 3. Motion & Transitions

#### Status: ✅ Основне завершено (2026-05-28)

- [x] **GSAP ScrollTrigger card-rise** — `LandingPageContent.tsx`; 30vh overlap; scrub:1; cleanup via `ctx.revert()`
- [x] **Per-item `useInView`** — всі нумеровані блоки: PainItem (Agitation), StepItem (Process), StepCard (ClientFlow), FeatureCard (Magic)
- [x] **Word-by-word mask reveal** — `overflow:hidden` + `motion.span y:'110%'→0`, stagger `wi*0.065`
- [x] **Sentence-by-sentence body** — `splitSentences()` + `y:'115%', opacity:0→1`, stagger `si*0.16`
- [x] **Simultaneous title+body** — обидва стартують одночасно з `delay:0.08`
- [x] **CountUp fix** — `useState` + `useMotionValueEvent` (was invisible on mobile)
- [x] **Horizontal scroll fix** — `overflowX:'clip'` на `<main>` (doesn't create scroll container)
- [x] **clip-path on GSAP rise** — rising wrappers: `borderRadius+'overflow:clip'` без scroll container issue
- [x] **spring** `{ type:'spring', stiffness:240, damping:26 } as const` у всіх FM секціях
- [ ] `active:scale-[0.97]` на CTA кнопках (тактильний feedback)
- [ ] `@media (hover: hover)` guard для hover-only animations
- [ ] `LandingTestimonials.tsx` — інтегрувати між Economy і Pricing
- [ ] `prefers-reduced-motion` — GSAP `ScrollTrigger` + FM animations: graceful fallback
  > NOTE: поточний `MotionConfig reducedMotion="never"` — потребує розгляду

### 4. Errors & Validation

#### Status: ⏳ Не перевірено

- [ ] CTA "Спробувати безкоштовно" → `/register` redirect
- [ ] CTA "Увійти" → `/login` redirect
- [ ] ROI Calculator (LandingEconomy): мінімальні/максимальні значення слайдерів
- [ ] ROI Calculator: форматування через `formatCurrency` (не ручний `.toLocaleString`)
- [ ] Невалідні значення слайдерів — graceful fallback

### 5. A11y & Performance

#### Status: ⏳ Частково

- [x] `<main>` семантичний wrapper (in LandingPageContent.tsx)
- [x] `overflowX:'clip'` — нуль CLS від горизонтального скролу
- [x] `aria-label="Приклад розкладу Smart Slots"` на BentoFeatures grid (вже є)
- [ ] `<h1>` тільки один на сторінці — перевірити LandingSplitHeading `as` prop
- [ ] `alt` атрибути на всіх зображеннях
- [ ] WCAG AA contrast: темні секції (Bento `#0F172A`, FooterCTA `#0F172A`)
- [ ] `aria-label` / `aria-hidden` на Lucide іконках
- [ ] Lighthouse Performance > 90 (GSAP bundle size check)

### 6. Core Features

#### Status: ⏳ Не перевірено

- [ ] ROI Calculator — всі 3 слайдери рахують коректно
- [ ] ROI Calculator — перерахунок без CLS
- [ ] Header navigation (всі links)
- [ ] Footer legal links
- [ ] Mobile: TrustBar stats не обрізаються
- [ ] Mobile: Marquee ticker коректний overflow
- [ ] `LandingScrollProgress` — коректно відображає прогрес (0→100%)

### 7. Tests Verification

#### Status: ⏳ Не запущено

- [ ] `npx playwright test e2e/tests/smoke.spec.ts` — landing рендериться
- [ ] `npx playwright test e2e/tests/14-client-journey.spec.ts` — client journey
- [ ] Manual: desktop 1440px + mobile 375px (landing тільки один стиль — Frost)
- [ ] Lighthouse: Performance > 90, A11y > 95, SEO > 95

---

## ❓ QA-GATE Questions (для наступного чату)

1. **Scope:** Завершуємо лендінг повністю (emoji → a11y → tests) чи є пріоритет?
2. **Testimonials:** Інтегрувати `LandingTestimonials.tsx` між Economy і Pricing?
3. **reducedMotion:** `MotionConfig reducedMotion="never"` замінити на `"user"` + GSAP fallback?
4. **Lighthouse:** Запустити зараз і зафіксувати baseline before final polish?

---

## 🛠️ Skills Chain

```
clarify (4 Q вище)
  ↓
mempalace_search "landing emoji a11y testimonials"
  ↓
senior-frontend (emoji → Lucide, a11y attrs)   [PRIMARY]
  ↓
mcp__universal-icons__search_icons              [Lucide replacements]
  ↓
mcp__a11y__get-color-contrast                   [dark section contrast]
  ↓
humanizer (весь видимий текст)
  ↓
run + verify (desktop + mobile)
  ↓
code-reviewer (pre-commit)
  ↓
mempalace_add_drawer
```

---

## 📋 Pre-Coding Checklist

- [x] SESSION_START completed
- [x] GSAP scroll stack ✅
- [x] Per-item animations ✅
- [ ] Emoji policy checked
- [ ] A11y attributes added
- [ ] CTA tactile feedback (active:scale)
- [ ] Tests green
- [ ] Documentation updated

---

## 🧪 Test Commands

```bash
cd bookit

# Smoke
npx playwright test e2e/tests/smoke.spec.ts --reporter=list

# Client journey
npx playwright test e2e/tests/14-client-journey.spec.ts --reporter=list

# Type + build check
npx tsc --noEmit && npm run build

# Dev server
npm run dev
# http://localhost:3000 — landing у Frost стилі
```

---

## 📤 Documentation Updates (Close-out checklist)

Обов'язково після `STEP 01 COMPLETE`:

- [ ] **STATUS.md** — Step 01 статус → ✅, дата ready, drawer ID, commit hash
- [ ] **CHANGELOG.md** — entry за шаблоном
- [ ] **../../MAPS/SYSTEM_MAP.md** — ✅ оновлено (2026-05-28)
- [ ] **../../MAPS/PAGE_RELEASE_ROADMAP.md** — статус Кроку 1 → ✅
- [ ] **MemPalace drawer** — `mempalace_add_drawer` з landing quality gate summary
- [ ] **Git commit**

---

## 🔮 Handoff Note (для STEP 02)

*Заповнюється при close-out:*

- **Prior step closed:** TBD
- **Commit hash:** TBD
- **Drawer:** TBD
- **Open issues:** LandingTestimonials.tsx pending (може carry-over до STEP 02 або окремий MR)
- **Carry-over to STEP 02:** нічого критичного
- **Next chat focus:** STEP 02 — Auth Flow. **Модель: Opus 4.7 max** (security-critical)

---

## 📚 Контекстні файли

- [PAGE_RELEASE_ROADMAP.md](../../MAPS/PAGE_RELEASE_ROADMAP.md)
- [SYSTEM_MAP.md — Landing section](../../MAPS/SYSTEM_MAP.md)
- [UX_STANDARDS.md](../../UX_STANDARDS.md)
- [globals.css](../../../bookit/src/app/globals.css)

---

*Створено: 2026-05-27 · Оновлено: 2026-05-28 · Версія: 2.0*
