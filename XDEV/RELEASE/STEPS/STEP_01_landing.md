# STEP 01 — Головний Лендинг (`/`)

> **Створено:** 2026-05-27
> **Модель:** 🟢 **Sonnet 4.6 high** (лінійна робота: емодзі-заміна, animation polish, aria-label)
> **Статус:** ⏳ **In progress** (waiting first chat)
> **Estimated effort:** 2-4 години
> **Source of truth (scope):** [../../MAPS/PAGE_RELEASE_ROADMAP.md#1-головний-лендинг](../../MAPS/PAGE_RELEASE_ROADMAP.md)

---

## 🎯 Scope

### Pages / routes
- `/` — публічна головна сторінка (Server Component)
- `/register`, `/login` — переходи з CTA

### Key files (очікувані, перевірити Glob)
- `src/app/page.tsx` (root page)
- `src/components/landing/` — компоненти лендінгу
- `src/components/landing/Hero/`
- `src/components/landing/DemoMockup/`
- `src/components/landing/Header.tsx`
- `src/components/landing/SocialProof.tsx`
- `src/components/landing/ProfitCalculator/` (калькулятор прибутку)
- `src/components/landing/Footer.tsx`

### Server Actions
- *Лендінг — статичний, server actions малоймовірні*

### DB tables / RPCs
- *Не змінюємо БД на цьому кроці*

### TanStack Query hooks
- `useSession` (для `RootPageClient` redirect авторизованих)

---

## 🚦 7 Quality Gate Dimensions

### 1. Aesthetics & Themes

#### Перевірки з PAGE_RELEASE_ROADMAP:
- [ ] `.ambient-blob-1/2/3` + grain overlay сумісні з Blossom темою
- [ ] Видалити hardcoded кольори (`#FFE8DC`, `#D4935A` у `DemoMockup`) → замінити на `var(--background)`, `var(--accent)`, `var(--success)`
- [ ] Усі картки `border-radius: 24px` (`rounded-3xl` або `rounded-xl`)
- [ ] Адаптивність `Header` + `DemoMockup` на mobile

#### Розширені перевірки:
- [ ] Перевірити Studio темy (dark teal) — ambient blobs не "пересвічують"
- [ ] Перевірити Frost темy (ice lavender) — текст має достатній контраст на світлому фоні
- [ ] Body font: Geist Sans (НЕ Inter); Display: Cormorant Garamond (НЕ Playfair)
- [ ] Жодних inline `rgba(255,255,255,N)` — замінити на `color-mix(in srgb, var(--accent-on) N%, transparent)`

### 2. No-Emoji Policy

#### Перевірки з PAGE_RELEASE_ROADMAP:
- [ ] Social proof chip (`['💅', '✂️', '👁️', '💄']`) → Lucide іконки або міні-аватари
- [ ] DemoMockup аватар майстра `💅` → Lucide іконка (e.g., `<Sparkles>`)
- [ ] DemoMockup бонуси `🎁` → Lucide іконка (e.g., `<Gift>`)

#### Розширені:
- [ ] Grep `[\u{1F000}-\u{1FFFF}]|[\u{2600}-\u{27BF}]` у `src/components/landing/**`
- [ ] Якщо у JSON/string є emoji — видалити або винести у DB як `icon_name`

### 3. Motion & Transitions

#### Перевірки з PAGE_RELEASE_ROADMAP:
- [ ] Spring-ефект появи Hero елементів (`bounce: 0-0.12`, ≤ 300ms)
- [ ] `active:scale-[0.97] transition-transform` на "Спробувати безкоштовно" CTA
- [ ] `active:scale-[0.97]` на "Записатися" в DemoMockup

#### Розширені:
- [ ] Якщо є AnimatePresence — `mode="popLayout"` (RULE 4)
- [ ] Variants ПОЗА компонентом, `as const` у `type: 'spring'`
- [ ] Перевірити hover-стани на CTA (НЕ `opacity-80` — це виглядає як disabled)
- [ ] `@media (hover: hover)` guard для hover-only animations

### 4. Errors & Validation

#### Перевірки з PAGE_RELEASE_ROADMAP:
- [ ] CTA "Спробувати безкоштовно" → коректний redirect на `/register`
- [ ] CTA "Увійти" → коректний redirect на `/login`

#### Розширені:
- [ ] Калькулятор прибутку: валідація input (мінімум 1 клієнт/день, не більше N)
- [ ] Невалідні значення — graceful fallback (показуємо 0 або останнє валідне)

### 5. A11y & Performance

#### Перевірки з PAGE_RELEASE_ROADMAP:
- [ ] `aria-label` для іконок зірочок (`Star`) у блоці рейтингу
- [ ] Loader (`RootPageClient`) має ту саму висоту що головна сторінка (нуль CLS)

#### Розширені:
- [ ] Semantic HTML: `<main>`, `<section>`, `<nav>`, `<button>` (не `<div onClick>`)
- [ ] WCAG AA contrast: CTA текст vs фон → `mcp__a11y__get-color-contrast`
- [ ] `<h1>` тільки один на сторінці (SEO + a11y)
- [ ] `alt` атрибути на всіх `<img>` / `<Image>`
- [ ] `prefers-reduced-motion` respect для animations

### 6. Core Features

#### Калькулятор прибутку майстра:
- [ ] Слайдер "кількість клієнтів на день" — диапазон 1-N
- [ ] Слайдер "середня вартість послуги" — диапазон у грн
- [ ] Прогнозований дохід / місяць та рік — миттєвий перерахунок
- [ ] Форматування валюти: `formatCurrency` з `src/lib/utils/currency.ts`
- [ ] Перерахунок без CLS (значення міняються, layout стабільний)

#### Кнопки та переходи:
- [ ] Header navigation (всі links працюють)
- [ ] Demo widget відкривається коректно
- [ ] Footer links відкриваються (legal сторінки)

### 7. Tests Verification

#### E2E (Playwright):
- [ ] `e2e/tests/smoke.spec.ts` — Landing page рендериться
- [ ] `e2e/tests/14-client-journey.spec.ts` — client clicks "Записатися"

#### Manual:
- [ ] Blossom theme — desktop 1440px + mobile 375px
- [ ] Studio theme — desktop 1440px + mobile 375px
- [ ] Frost theme — desktop 1440px + mobile 375px
- [ ] Lighthouse: Performance > 90, A11y > 95, SEO > 95

---

## ❓ QA-GATE Questions (для початку чату)

1. **Scope:** Працюємо над усією сторінкою одразу, чи поетапно (Hero → Calculator → Footer)?
2. **Themes priority:** Полірувати всі 3 теми одночасно, чи спершу Blossom (default), потім перевірити Studio/Frost?
3. **Емодзі заміна:** На які Lucide іконки замінювати — за категоріями послуг (`Sparkles`, `Scissors`, `Eye`, `Brush`) чи однорідні аватари?
4. **Калькулятор:** Він уже існує і працює (тільки косметика), чи треба переробити з нуля?
5. **Tests:** Запускати E2E локально після кожної зміни чи накопичити і запустити в кінці?

---

## 🛠️ Skills Chain (для цього кроку)

```
clarify (5 Q вище)
  ↓
mempalace_search "landing page hero calculator emoji replacement"
  ↓
senior-frontend (component-level changes)   [PRIMARY]
  ↓
emil-design-eng                              [if motion polish needed]
  ↓
impeccable (audit після генерації)
  ↓
mcp__universal-icons__search_icons           [для пошуку Lucide замін]
  ↓
mcp__a11y__get-color-contrast                [CTA + Star контраст]
  ↓
humanizer (для всього видимого тексту)
  ↓
run + verify (3 теми × 2 viewports)
  ↓
code-reviewer (pre-commit)
  ↓
mempalace_add_drawer
```

---

## 📋 Pre-Coding Checklist

- [ ] SESSION_START completed (`STARTUP OK: Palace N drawers | SYSTEM_MAP current | Active Step: 01 | Model: Sonnet 4.6 high`)
- [ ] mempalace_search "landing emoji lucide replacement BookIT" done
- [ ] 5 QA questions asked + answered (user)
- [ ] Skill declared: `SKILL: senior-frontend` (або `design-taste-frontend` залежно від scope)
- [ ] Humanizer list compiled:
  - Hero headline
  - Subheadline
  - CTA "Спробувати безкоштовно"
  - CTA "Увійти"
  - Social proof labels
  - Calculator labels (клієнтів на день, середня ціна, дохід/місяць, дохід/рік)
  - Footer links texts
- [ ] User explicit approval received
- [ ] GATE OK reply written

---

## 🧪 Test Commands

```bash
cd bookit

# Smoke test
npx playwright test e2e/tests/smoke.spec.ts --reporter=list

# Client journey
npx playwright test e2e/tests/14-client-journey.spec.ts --reporter=list

# Manual verify
npm run dev
# Open http://localhost:3000 in 3 themes (toggle via /dashboard/settings → master)
# Public landing → toggle theme via... (note: landing зазвичай показується у Blossom default)
```

---

## 📤 Documentation Updates (Close-out checklist)

Обов'язково після `STEP 01 COMPLETE`:

- [ ] **STATUS.md** — Step 01 статус → ✅, дата ready, drawer ID, commit hash
- [ ] **CHANGELOG.md** — entry за шаблоном
- [ ] **../../MAPS/SYSTEM_MAP.md** — оновити якщо додано нові утиліти/компоненти
- [ ] **../../MAPS/PAGE_RELEASE_ROADMAP.md** — статус Кроку 1 → ✅
- [ ] **bookit/src/app/(master)/dashboard/changelog/page.tsx** — *Не релевантно: landing — B2C-зміна*
- [ ] **MemPalace drawer** — `mempalace_add_drawer` з:
  - title: "Landing Quality Gate Complete — 2026-MM-DD"
  - wing: "bookit"
  - room: "architecture"
  - content: список Lucide replacements (emoji map), token migrations, animation tuning, тести green
- [ ] **Git commit:**
  ```bash
  git commit -m "feat(landing): quality gate complete — emoji→Lucide, theme tokens, a11y

  - Replaced 6 emoji with Lucide icons (Sparkles, Gift, Star, ...)
  - Migrated hardcoded colors to CSS theme tokens
  - Added aria-label to rating stars
  - Tactile feedback (active:scale-[0.97]) on CTAs
  - Calculator works smoothly without CLS in 3 themes
  - E2E smoke + client-journey green

  Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
  ```

---

## 🔮 Handoff Note (для STEP 02)

*Заповнюється при close-out:*

- **Prior step closed:** YYYY-MM-DD
- **Commit hash:** TBD
- **Drawer:** TBD
- **Open issues from STEP 01:** [TBD]
- **Carry-over to STEP 02:** Очікувано — нічого. STEP 02 (Auth) — окрема feature.
- **Next chat focus:** STEP 02 — Auth Flow (`/login`, `/register`, `/callback`) — SMS OTP rate-limit + virtual email + parseError локалізація. **Модель: Opus 4.7 max** (security-critical).

---

## 📚 Контекстні файли (швидкі посилання)

- [PAGE_RELEASE_ROADMAP.md — Step 1 section](../../MAPS/PAGE_RELEASE_ROADMAP.md)
- [SYSTEM_MAP.md — Landing routes](../../MAPS/SYSTEM_MAP.md)
- [UX_STANDARDS.md — No-Emoji Policy](../../UX_STANDARDS.md)
- [AI_DEVELOPER.md — 3 theme palette](../../AI_DEVELOPER.md)
- [globals.css](../../../bookit/src/app/globals.css) — джерело правди CSS токенів

---

*Створено: 2026-05-27 · Версія: 1.0*
