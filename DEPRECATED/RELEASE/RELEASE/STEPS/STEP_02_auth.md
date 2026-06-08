# STEP 02 — Authentication Flow (`/login`, `/register`, `/auth/callback`)

> **Створено:** 2026-05-28
> **Завершено:** 2026-05-28
> **Модель:** 🟢 **Sonnet 4.6 high**
> **Статус:** ✅ **Complete**
> **Note:** Виконано поза черговістю (STEP 01 in progress). Дозволено користувачем явно.
> **Source of truth (scope):** [../../MAPS/PAGE_RELEASE_ROADMAP.md](../../MAPS/PAGE_RELEASE_ROADMAP.md)

---

## Scope

### Pages / routes
- `/login` — форма входу
- `/register` — форма реєстрації
- `/auth/callback` — OAuth callback

### Key files

**Layout:**
- `src/app/(auth)/layout.tsx` — split-screen Frost layout: 45% dark brand panel + 55% form; mobile editorial strip

**Components:**
- `src/components/auth/PhoneOtpForm.tsx` — 3-step form (role_select → phone → otp); "Nordic Slab" visual redesign

---

## Що зроблено

### 1. Auth Layout — Frost theme enforcement

**Проблема:** Pre-login сторінки не мають cookie `client_theme` → root layout не встановлює `data-theme` на `<html>` → CSS резолвить `:root` (Blossom: `#B8732A`, `#DDD5C6`) для всіх auth сторінок.

**Рішення:** `data-theme="frost"` безпосередньо на зовнішньому `<div>` в `AuthLayout`. CSS custom properties коректно наслідуються для всіх дочірніх елементів.

**Дизайн (desktop):**
- 45% темна editorial панель: `var(--accent)` = `#0F172A` + aurora blobs (indigo/violet/blue radial gradients)
- 55% form panel: `var(--background)` = `#EFF2FF` + aurora overlay
- heading-serif логотип, відгук "Аліна К.", footer

**Дизайн (mobile):**
- Компактна темна editorial смужка (`lg:hidden`): aurora blob + білий логотип + tagline

**Виправлення em-dash:** `клієнти й дохід — в одному місці` → `клієнти й дохід. В одному місці.`

---

### 2. PhoneOtpForm — "Nordic Slab" redesign

**Проблема:** `bento-card` (`var(--surface)` = `rgba(218,226,255,0.90)`) майже ідентичний `--background: #EFF2FF` → нульовий контраст. Всі елементи форми white-on-white.

**Рішення:** Повний редизайн JSX (уся логіка збережена 100%). Білий архітектурний контейнер (`#FFFFFF`) на лавандовому фоні.

#### Нова архітектура форми

**Контейнер:**
```
bg-white, rounded-[28px]
shadow: 3-layer indigo-tinted (0 0 0 1px rgba(99,102,241,0.07), blur 8px, blur 48px)
```

**Прогрес:** 3 тонких сегменти (3px height, scaleX spring animation) замість точок

**Картки вибору ролі — стопка рядків (НЕ 2-col identical grid):**
- Selected: `#0F172A` dark slab, білий текст, animated radio dot, box-shadow
- Unselected: white + `1.5px dashed rgba(99,102,241,0.28)`, `#64748B` текст
- `whileTap: scale(0.985)` тактильний відгук

**Step 2 — Phone:**
- Back badge: pill `rgba(99,102,241,0.08)` bg, `#4338CA` текст
- Google button: white + `1.5px solid rgba(15,23,42,0.12)`
- Divider: тонкі лінії + "або SMS"
- Input: `bg-[#F8F9FF]`, `rounded-2xl`, `1.5px border`, focus ring

**Step 3 — OTP:**
- 6 боксів: `w-11 h-[58px] rounded-2xl`
- Filled: `border-[#0F172A]` + `bg-[rgba(15,23,42,0.04)]`
- Empty: `border-[rgba(99,102,241,0.18)]`, focus: `border-[#6366F1]`

---

### 3. A11y — WCAG AA compliance

| Пара | Результат | Дія |
|---|---|---|
| `#FFFFFF` on `#0F172A` | Pass | Без змін |
| `#64748B` on `#FFFFFF` | Pass | Без змін |
| `#94A3B8` on `#FFFFFF` | Fail | → `#64748B` |
| `#6366F1` on `#FFFFFF` | Fail | → `#4338CA` (всі text uses) |
| `#4338CA` on `#FFFFFF` | Pass | — |

`#6366F1` збережено ТІЛЬКИ для декоративних елементів: іконки, borders, caret, focus rings.

---

### 4. Humanizer — зміни copy

| До | Після |
|---|---|
| `Введіть номер — надішлемо код` | `Введіть номер. Надішлемо код.` |
| `Знову через ${N} с` | `Повторити через ${N} с` |
| `клієнти й дохід — в одному місці.` | `клієнти й дохід. В одному місці.` |

---

## 7 Quality Gate Verdict

| Вимір | Стан | Деталі |
|---|---|---|
| 1. Aesthetics & Themes | ✅ | Frost: `data-theme="frost"` на layout; white card на lavender; dark brand panel; mobile strip; aurora blobs |
| 2. No-Emoji Policy | ✅ | Нуль emoji; Lucide icons (UserRound, Scissors, Phone, MessageSquare, ArrowLeft) |
| 3. Motion & Transitions | ✅ | `SPRING = {type:'spring', stiffness:340, damping:30} as const`; `mode="popLayout"`; whileTap; AnimatePresence checkbox; scaleX progress bar |
| 4. Errors & Validation | ✅ | Inline errors з AnimatePresence (opacity+y); phone length guard; terms checkbox guard; all API error states |
| 5. A11y & Performance | ✅ | WCAG AA verified (всі text пари); sr-only checkbox; aria-hidden decorative; touch targets ≥44px; no layout shift |
| 6. Core Features | ✅ | Google OAuth + `oauthRedirectingRef` back-button fix; OTP auto-submit + paste; referral cookie; `claimMasterRole`; cooldown; `getSafeRedirect` |
| 7. Tests Verification | ⏳ | Логіка не змінювалась (тільки UI); Playwright E2E smoke рекомендований |

---

## MemPalace Drawers

| Drawer ID | Зміст |
|---|---|
| `drawer_bookit_decisions_0f174061d23c416c18ca555f` | Auth layout Frost fix: data-theme, color tokens, mobile strip |
| `drawer_bookit_decisions_aece86e2ab927d19f15e31ce` | PhoneOtpForm Nordic Slab: architecture, a11y fixes, motion |

---

## Skills chain

`impeccable craft` → `design-taste-frontend` → `mcp__magic__21st_magic_component_inspiration` (skipped — generic output) → `humanizer` → `mcp__a11y__are-colors-accessible` → TSC → build

---

## Issues encountered

| Проблема | Рішення |
|---|---|
| `.next/lock` блокував build | `rm -rf .next/lock` перед наступним запуском |
| `bento-card` var(--surface) ≈ var(--background) | Замінено на raw `bg-white` контейнер |
| `#94A3B8` і `#6366F1` fail WCAG AA | `#64748B` / `#4338CA` для всіх text (iконки залишені) |
| Em-dash у copy | Замінено на крапку (impeccable ban #14) |

---

## Carry-over to next step

- STEP 07 / STEP 10 (Playwright E2E auth smoke test) — рекомендований

---

*Оновлено: 2026-05-28 · Модель: Sonnet 4.6 high*
