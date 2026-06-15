# Client Zone — Повний UX/UI Редизайн (З НУЛЯ)

> **Статус:** Active · Sprint-04 · Deploys 14–22  
> **Оновлено:** 2026-06-15  
> **Правило:** Все з нуля. Existing code = лише schema reference. Жодного "redo" чи "refresh".

---

## Scope — 9 Deploys

| # | Сторінка | Головний компонент | Нова логіка |
|---|----------|-------------------|-------------|
| 1 | `/explore` | `ExplorePage.tsx` | Frost theme, 3 view modes, новий layout |
| 2 | `/my/bookings` | `MyBookingsPage.tsx` | Відгук BottomSheet + "Записатись знову" |
| 3 | `/my/profile` | `MyProfilePage.tsx` | Avatar upload + instagram_url + telegram_handle |
| 4 | `/my/masters` | `MyMastersPage.tsx` | Новий дизайн |
| 5 | `/my/loyalty` | `MyLoyaltyPage.tsx` | Новий дизайн |
| 6 | `/my/notifications` | `ClientNotificationsPage.tsx` | Новий дизайн |
| 7 | `/my/support/chat` | `SupportChatPage` | Новий chat UI |
| 8 | `/my/setup/phone` | `PhoneSetupForm` | Новий onboarding UI |
| 9 | Desktop pass | всі 8 сторінок | 2-col / side panels / wide grid |

---

## Залізні Правила Цього Редизайну

```
RULE A: Жодної сторінки "на основі існуючої" — все пишеться наново
RULE B: Existing code читаємо ТІЛЬКИ для з'ясування data schema (що fetch, які actions)
RULE C: Кожна сторінка = окремий deploy (не merge декількох)
RULE D: Brainstorm ОБОВ'ЯЗКОВО перед QA Gate (не пропускати)
RULE E: /explore залишається у власному layout (PublicNavbar), але Frost тема
RULE F: Всі /my/* — data-theme="frost", vaul BottomSheet для модалок
```

---

## Обов'язковий Ланцюжок (кожна сторінка)

### PHASE 0 — BRAINSTORM (через скіл — обов'язково)
```
SKILL: ui-ux-pro-max
Prompt: "Brainstorm UX for [page] from scratch.
         User value, pain points, 3-5 concepts, anti-goals, new features."
→ Отримуємо: UX concepts + варіанти + user journey
→ Обираємо вектор → фіксуємо key moments + нові фічі
```

### PHASE 1 — QA GATE + SHAPE
```
→ SKILL: impeccable → команда: shape [page]
   (Design brief: scope, content, states, constraints, anti-goals)
→ Clarify 3-5 питань якщо потрібно
→ User approval → GATE OK
```

### PHASE 2 — GENERATE
```
→ SKILL: design-taste-frontend → UI з нуля
```

### PHASE 3 — CRITIQUE & REFINE
```
→ /impeccable critique   — Nielsen heuristics (ціль ≥32/40)
→ /impeccable layout     — spacing, rhythm, hierarchy
→ /impeccable bolder     — підсилити (якщо bland/safe)
→ /impeccable colorize   — якщо кольоровий баланс слабкий
```

### PHASE 4 — MOTION
```
→ emil-design-eng        — Framer Motion
→ /impeccable animate    — entrance + state animations
```

### PHASE 5 — QA & SHIP
```
→ /impeccable audit      — a11y, perf, responsive, anti-patterns
→ /impeccable polish     — фінальний pass
→ /impeccable harden     — edge cases, empty states, errors
→ humanizer              — ВЕСЬ UI text (залізне правило)
→ User QA → final approval
→ npx tsc --noEmit + npm run build
→ deploy + sprint pipeline
```

---

## Impeccable — Повний API

**Skill файл:** `bookit/.claude/skills/impeccable/SKILL.md`  
**Reference docs:** `bookit/.claude/skills/impeccable/reference/` (20 файлів)

### BUILD

| Команда | Опис | Коли |
|---------|------|------|
| `/impeccable shape [feature]` | Design brief перед кодом | ПЕРШИЙ КРОК кожної сторінки |
| `/impeccable craft [feature]` | End-to-end: shape → implement → test | Нова фіча повний цикл |
| `/impeccable teach` | PRODUCT.md + DESIGN.md ініціалізація | Один раз на проект |
| `/impeccable document` | DESIGN.md з існуючого коду | Після teach або при оновленні |
| `/impeccable extract [target]` | Повторний патерн → design system | Коли патерн з'явився 3+ рази |

### EVALUATE

| Команда | Опис | Scoring |
|---------|------|---------|
| `/impeccable critique [target]` | Nielsen's 10 heuristics review | 0-40 (ціль ≥32) |
| `/impeccable audit [target]` | a11y + perf + responsive + theming + anti-patterns | 0-20 |

**Critique scoring bands:**
- 36-40 → Excellent
- 32-35 → Needs work
- 28-31 → Needs work
- 24-27 → Needs work
- <24 → Needs work

### REFINE

| Команда | Опис | Коли |
|---------|------|------|
| `/impeccable polish [target]` | Фінальний pass перед ship | ОСТАННІЙ крок |
| `/impeccable bolder [target]` | Підсилити bland/generic/safe дизайн | Виглядає нудно |
| `/impeccable quieter [target]` | Приглушити aggressive/шумний | Занадто інтенсивно |
| `/impeccable distill [target]` | Залишити essence, прибрати зайве | Перевантажено |
| `/impeccable harden [target]` | Edge cases, i18n, errors, empty states | Перед release |
| `/impeccable onboard [target]` | First-run flows, empty states, activation | Нові юзери |

### ENHANCE

| Команда | Опис | Коли |
|---------|------|------|
| `/impeccable animate [target]` | Entrance + micro-interactions + state animations | Додати motion |
| `/impeccable colorize [target]` | Стратегічний колір до монохромного UI | Нейтральний/сірий дизайн |
| `/impeccable typeset [target]` | Typography hierarchy + fonts | Generic type |
| `/impeccable layout [target]` | Spacing, rhythm, visual hierarchy | Cramped / слабка ієрархія |
| `/impeccable delight [target]` | Personality + memorable moments | Функціональний але безрадісний |
| `/impeccable overdrive [target]` | Push past conventional limits | Хочемо сміливо/незвично |

### FIX

| Команда | Опис | Коли |
|---------|------|------|
| `/impeccable clarify [target]` | UX copy, labels, error messages | Текст незрозумілий |
| `/impeccable adapt [target]` | Mobile ↔ Desktop rethink | Context adaptation |
| `/impeccable optimize [target]` | UI performance diagnosis + fixes | Laggy, повільно |
| `/impeccable live` | Visual variant mode в браузері | Інтерактивне дослідження |

### Абсолютні Заборони (impeccable відмовляє)

```
1. Side-stripe borders   — border-left/right >1px як accent
2. Gradient text         — background-clip: text + gradient
3. Glassmorphism default — blur+glass декоративно без сенсу
4. Hero-metric template  — велике число + label + stats + gradient
5. Identical card grids  — icon+heading+text повторений нескінченно
6. Modal як перша думка  — спершу inline/progressive disclosure
```

---

## Design Skills — Decision Tree

```
Нова сторінка з нуля?
  → design-taste-frontend (PRIMARY генератор UI)

Brainstorm / plan перед кодом?
  → /impeccable shape [page]

Анімації / мікро-взаємодія?
  → emil-design-eng → /impeccable animate

Аудит/polish існуючого UI?
  → /impeccable critique → /impeccable audit → /impeccable polish

Складний UX-вибір, декілька варіантів?
  → ui-ux-pro-max (перед design-taste-frontend)

Весь UI text (кнопки, лейбли, заголовки, порожні стани)?
  → humanizer (ЗАЛІЗНЕ ПРАВИЛО — без винятків)

Є скріншот → потрібен код?
  → image-to-code

Потрібен mockup (не код)?
  → imagegen-frontend-mobile (mobile) / imagegen-frontend-web (web)
```

### Skill Catalog — Пріоритети

| Skill | Роль | Пріоритет |
|-------|------|-----------|
| `design-taste-frontend` | PRIMARY генератор UI | ★★★★★ |
| `impeccable` | Design QA cycle (23 команди) | ★★★★★ MANDATORY |
| `humanizer` | Весь UI text | ★★★★★ IRON RULE |
| `emil-design-eng` | Framer Motion animations | ★★★★ |
| `ui-ux-pro-max` | Complex UX decisions + variants | ★★★★ |
| `image-to-code` | Screenshot → React code | ★★★★ |
| `imagegen-frontend-mobile` | Mobile mockups | ★★★ |
| `imagegen-frontend-web` | Web mockups | ★★★ |

---

## Design Principles (всі 8 сторінок)

| Параметр | Значення |
|----------|---------|
| Тема | Frost (`var(--frost-*)`, холодні лавандери, slate accent) |
| /explore тема | Зараз Blossom → редизайн у Frost (єдиний client-zone стиль) |
| Mobile-first | 375px base (Desktop pass = окремий deploy #9) |
| Emoji в UI | ЗАБОРОНЕНО (тільки Lucide icons) |
| Модалки | vaul `BottomSheet` ТІЛЬКИ |
| Framer Motion | `spring as const`, `mode='popLayout'` |
| Body font | Geist Sans |
| Display font | Cormorant Garamond |
| Card radius | 24px (`rounded-3xl`) |
| Button radius | 100px (pill, `rounded-full`) |
| Touch targets | Мін. 44px |
| Contrast | Мін. 4.5:1 WCAG AA |

---

## Нова Логіка

### `/my/bookings` — T20
- **Відгук:** `completed` статус → кнопка "Залишити відгук" → vaul BottomSheet (зірки 1-5 + textarea + submit) → `submitReview()` (action вже існує)
- **Записатись знову:** кнопка на картці (не text link!) → `router.push('/[slug]')` майстра

### `/my/profile` — T21
- **Avatar upload:** Supabase Storage bucket `client-avatars`, поле `avatar_url` у `updateClientProfile()`
- **Нова міграція:** `ALTER TABLE client_profiles ADD COLUMN instagram_url text, ADD COLUMN telegram_handle text`
- **UI:** avatar preview + поля форми для Instagram URL та Telegram handle

### Desktop Pass — T24
| Сторінка | Desktop layout |
|----------|----------------|
| `/explore` | 3-4 col grid + side filter panel |
| `/my/bookings` | max-width + side detail panel |
| `/my/masters` | 3-col grid |
| `/my/profile` | 2-col (form left, avatar right) |
| `/my/loyalty` | Wide card layout |
| `/my/notifications` | Max-width centered feed |
| `/my/support/chat` | Max-width chat window |
| `/my/setup/phone` | Max-width centered form |

---

## Schema Reference (НЕ копіювати UI)

| Файл | Що брати |
|------|----------|
| `src/components/public/ExplorePage.tsx` | Data shape: master_profiles + filters |
| `src/components/client/MyBookingsPage.tsx` | Booking/order data schema |
| `src/components/client/MyProfilePage.tsx` | Profile fields schema |
| `src/components/client/MyMastersPage.tsx` | Masters + visit history schema |
| `src/components/client/MyLoyaltyPage.tsx` | Loyalty + C2C referral schema |
| `src/components/client/ClientNotificationsPage.tsx` | Notifications + portfolio consent schema |
| `src/app/my/bookings/actions.ts` | `submitReview()`, `cancelBooking()` |
| `src/app/my/profile/actions.ts` | `updateClientProfile()` |

## Patterns для Reuse (тільки ці)

```typescript
// Modals
import BottomSheet from '@/components/ui/BottomSheet' // vaul — ТІЛЬКИ ЦЕ

// Utilities
import { pluralUk } from '@/lib/utils/pluralUk'       // ЗАВЖДИ для УКР множин
import { generateSecureToken } from '@/lib/utils/token' // ніколи randomUUID().slice()

// Animation
const SPRING = { type: 'spring', stiffness: 280, damping: 24 } as const

// Realtime (залишити без змін)
// ClientRealtimeSync.tsx — не трогати
// MyBottomNav.tsx — не трогати (T16 зроблено)
// useClientNotifications hook — не трогати
```

---

## MCP Tools для Design QA

```bash
mcp__a11y__get-color-contrast        # контраст тексту (мін. 4.5:1)
mcp__a11y__are-colors-accessible     # WCAG AA check
mcp__a11y__use-light-or-dark         # light чи dark text на фоні
mcp__universal-icons__search_icons   # пошук Lucide icons
mcp__universal-icons__get_icon       # отримати SVG icon
mcp__tailwind__convert_css_to_tailwind # CSS → Tailwind classes
mcp__tailwind__get_tailwind_colors   # кольорова палітра TW
```

---

## Verification (кожен deploy)

```bash
npx tsc --noEmit          # 0 errors — не deploy без цього
npm run build             # clean build — не deploy без цього

# Manual QA:
# 1. Відкрити сторінку на 375px (mobile)
# 2. Перевірити всі стани (empty, loading, error, populated)
# 3. Перевірити touch targets ≥44px
# 4. mcp__a11y__get-color-contrast для всіх text pairs

# Sprint Pipeline (АВТОМАТИЧНО після git commit):
# TRACKER.md → HANDOFF.md → TRANSITION_PROMPT.md → git commit docs → mempalace_add_drawer
```

---

## Sprint-04 Deploy Map

| Deploy # | Task ID | Сторінка | Статус |
|----------|---------|----------|--------|
| 14 | T-explore | `/explore` — з нуля | ✅ |
| 15 | T19 + T20 | `/my/bookings` — з нуля + логіка | ⬜ |
| 16 | T21 | `/my/profile` — з нуля + avatar/socials | ⬜ |
| 17 | T-masters | `/my/masters` — з нуля | ⬜ |
| 18 | T-loyalty | `/my/loyalty` — з нуля | ⬜ |
| 19 | T-notif | `/my/notifications` — з нуля | ⬜ |
| 20 | T-chat | `/my/support/chat` — з нуля | ⬜ |
| 21 | T-phone | `/my/setup/phone` — з нуля | ⬜ |
| 22 | T24 | Desktop pass (всі 8) | ⬜ |
