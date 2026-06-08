# 🎯 Session Prompt — New Chat Start

> Копіювати ВЕСЬ цей файл у перше повідомлення нового чату.

---

## КОНТЕКСТ ПРОЕКТУ

BookIT — український SaaS для б'юті-майстрів (Next.js 16+ App Router, TypeScript strict, Supabase PostgreSQL, Tailwind v4, TanStack Query v5, Framer Motion, Zustand, Lucide React, Monobank payments).

Три теми: Blossom (Taupe Light Air), Studio (Teal Brutal Dark), Frost (Ice Lavender).

---

## МЕТА ПОТОЧНОЇ СЕСІЇ

IMPECCABLE аудит усіх UI-поверхонь BookIT. 20 аудитів вже виконано, 53 залишилось.

**Файл плану:** `bookit/IMPECCABLE/AUDIT_PLAN_FULL.md`
**Файл покриття:** `bookit/IMPECCABLE/AUDIT_COVERAGE_MAP.md`
**Існуючі звіти:** `../IMPECCABLE/*.md` (20 файлів)

---

## ⚡ SESSION START PROTOCOL (перший хід, без винятків)

```
КРОК 1 → mempalace_status (tool call, не просто згадати)
КРОК 2 → Read XDEV/MAPS/SYSTEM_MAP.md offset: останні 50 рядків
КРОК 3 → Відповідь: "STARTUP OK: Palace [N] drawers | SYSTEM_MAP current | Ready"
```

Без STARTUP OK — жодного читання файлів і жодного коду.

---

## ⚡ ПОТОЧНИЙ СТАН АУДИТІВ

### ✅ DONE (20 звітів)

| Report | Scope | Score |
|--------|-------|-------|
| `dashboard.md` | `/dashboard` | — |
| `bookings.md` | `/dashboard/bookings` | — |
| `revenue.md` | `/dashboard/revenue` | — |
| `marketing.md` | `/dashboard/marketing` | — |
| `billing.md` | `/dashboard/billing` | — |
| `onboarding.md` | `/dashboard/onboarding` | — |
| `settings.md` | `/dashboard/settings` | — |
| `growth.md` | `/dashboard/growth` | — |
| `clients.md` | `/dashboard/clients` | — |
| `portfolio.md` | `/dashboard/portfolio` | — |
| `products.md` | `/dashboard/products` | — |
| `services.md` | `/dashboard/services` | **69 B+** |
| `studio.md` | `/dashboard/studio` | **63 B** |
| `documents.md` | `/dashboard/documents` | **62 B** |
| `support.md` | `/dashboard/support` | **63 B** |
| `academy.md` | `/dashboard/academy` | **64 B** |
| `analytics.md` | `/dashboard/analytics` | **54 C** |
| `admin.md` | `/admin` + 6 subpages | — |
| `landing.md` | `/` (14 sections) | **71 A** |
| `client-zone.md` | `/[slug]`, `/explore`, `/my/*`, `/shop`, BookingWizard, auth flows (COMBINED report) | — |

### 🔴 REMAINING (53 аудити)

**Phase R — Remaining Dashboard (3):**
- R1: `/dashboard/reviews` (ReviewsPage, 246 lines) — HIGH
- R2: `/dashboard/marketing/[id]` (BroadcastDetailPage, 123 lines) — MED
- R3: `/dashboard/changelog` — LOW

**Phase P — Public Pages (11):**
- P1: `/explore` — ExplorePage.tsx
- P2: `/[slug]` — PublicMasterPage.tsx (1122 lines)
- P3: `/[slug]/shop` — ShopPage.tsx
- P4: `/[slug]/portfolio` — PublicPortfolioGallery.tsx
- P5: `/[slug]/portfolio/[id]` — portfolio detail
- P6: `/studio/[slug]` — StudioPublicPage.tsx
- P7: `/studio/join`
- P8: `/invite/[code]`
- P9: `/legal` + `/legal/[slug]`
- P10: `/offline`
- P11: `/r/[code]`

**Phase A — Auth (3):**
- A1: `/login` + `/register`
- A2: `/auth/callback`
- A3: Auth components (ClientAuthSheet, NavLoginSheet, PostBookingAuth, TelegramProvider)

**Phase C — Client Zone deep audits (6):**
- C1: `/my/bookings` — MyBookingsPage
- C2: `/my/loyalty` — MyLoyaltyPage
- C3: `/my/masters` — MyMastersPage
- C4: `/my/profile` — MyProfilePage
- C5: `/my/notifications` — ClientNotificationsPage
- C6: `/my/setup/phone` — PhoneSetupForm

**Phase U — UI Atoms (9):**
- U1: Button.tsx
- U2: Input.tsx
- U3: Badge.tsx
- U4: BentoCard.tsx
- U5: Card.tsx
- U6: Tooltip.tsx / AnchoredTooltip.tsx
- U7: DropdownMenu.tsx
- U8: Skeleton.tsx
- U9: PullToRefresh.tsx

**Phase M — Modals/Sheets (6):**
- M1: BottomSheet.tsx (vaul)
- M2: DashboardDrawer.tsx
- M3: PopUpModal.tsx
- M4: HubDrawer.tsx
- M5: MicaModal
- M6: Feature drawers (FlashDealDrawer, PricingDrawer, RestockDrawer)

**Phase W — Complex Widgets (12):**
- W1: BookingWizard (10 sub-components)
- W2: StoryGenerator
- W3: BroadcastEditor
- W4: BroadcastHistory
- W5: NotificationsBell
- W6: ChannelBanner
- W7: PhoneSetupForm
- W8: ExplorePage
- W9: ShopPage
- W10: StudioPublicPage
- W11: PublicPortfolioGallery + PortfolioBookingButton
- W12: Shared (SmartBackButton, PushSubscribeCard, BlobBackground, BeautyLoader, ServiceWorkerRegistration, InstallBanner)

**Phase S — Systemic Maps (3):**
- S1: NOTIFICATION_MAP.md sync
- S2: REFERRAL_MAP.md sync + C2C switch
- S3: SYSTEM_MAP.md fix broken links

---

## 📋 ФОРМАТ АУДИТУ (8-block IMPECCABLE)

Кожен аудит = 1 файл `IMPECCABLE/[name].md` з 8 блоками:

```
1. HEURISTICS (X/40) — 10 принципів Nielsen, по 4 бали
2. COGNITION (X/20) — IA, data density, cognitive load, task flow
3. CODE QUALITY (X/20) — anti-patterns, dead code, imports, theming
4. ACCESSIBILITY (X/20) — type="button", aria-*, touch targets, focus-visible
5. ANIMATIONS (X/20) — spring as const, mode="popLayout", prefers-reduced-motion
6. SYSTEMICS — systemic palette violations (#789A99, #5C9E7A, #D4935A)
7. FINDINGS — P1/P2/P3 violations
8. SUMMARY — total score + grade (A≥80, B≥60, C≥40, D<40)
```

**Підкоманди (запускати послідовно в одній сесії):**
- `critique` — UX дизайн-рев'ю
- `audit` — технічний аудит коду
- `animate` — оцінка анімацій та мікро-взаємодій
- `polish` — пропозиції покращень
- `layout` — аналіз сітки, адаптивності, відступів
- `overdrive` — виявлення P1/P2/P3 порушень
- `live` — ⚠️ пропустити (немає browser automation)
- `optimize` — план оптимізації

---

## ⚡ TASK GATE (перед кожною задачею)

```
1. mempalace_search "[тема]" — пошук релевантних drawers
2. Задати 3-5 запитань (scope, approach, constraints)
3. Оголосити "SKILL: [name]" → skill tool
4. Humanizer для UI-тексту (показати список рядків → humanizer tool → OK)
5. Отримати OK від користувача
6. Тільки тоді → Read файли → Write код/аудит
```

Відповідь перед кодом: `GATE OK: search✓ | QA✓ | Skill: [name] | Humanizer: ✓`

---

## ⛔ ЗАЛІЗНІ ПРАВИЛА (скорочено)

### Encoding Guard (перед кожним Edit/Write з кирилицею)
```powershell
# Batch перевірка
foreach ($f in @("file1.tsx","file2.tsx")) {
  $h = ([IO.File]::ReadAllBytes($f) | % { $_.ToString("X2") }) -join ""
  if ($h -match "E28099|E2809C") { "DIRTY: $f" }
}
# Якщо DIRTY → виправити:
$c = [IO.File]::ReadAllText($path, [Text.Encoding]::UTF8)
$c = $c -replace [char]0x2019,"'" -replace [char]0x201C,'"' -replace [char]0x201D,'"'
[IO.File]::WriteAllText($path, $c, [Text.Encoding]::UTF8)
```

### Humanizer (перед будь-яким UI-текстом)
1. Виписати ВСІ рядки що побачить користувач
2. Запустити `/humanizer` skill
3. Після підтвердження — записати у файл

### Accessibility (при кожному `onClick`)
- `<div onClick>` → `<button type="button">`
- type="button" на кожному <button>
- pill/chip: py-2 мінімум (≥44px touch target)
- chart bar / heatmap: aria-label + aria-pressed
- toggle: aria-pressed={isActive}
- icon-only: aria-label="..."

### Framer Motion
- `mode='wait'` → `mode='popLayout'`
- `spring` → завжди `as const`
- Emoji → тільки Lucide React

### Bulk Edit Protocol (3+ файлів)
```
Round 1: Encoding check → Read ТІЛЬКИ файли для зміни
Round 2: Write/Edit ВСІ паралельно
Round 3: tsc + build
Max 4 rounds.
```
- ≥5 змін у файлі → Write, не Edit
- files_changed = files_read

### Post-Change Protocol
```
1. npx tsc --noEmit (у bookit/)
2. npm run build (у bookit/)
3. mempalace_add_drawer (зберегти рішення)
4. SYSTEM_MAP.md update (якщо нові роути/компоненти)
5. Changelog update (якщо B2B-видима зміна)
```

### No-Emoji Policy
Жодних емодзі в UI. Тільки Lucide React icons.

### Font Rules
Body: Geist Sans (НЕ Inter). Headings: Cormorant Garamond (НЕ Playfair Display). Заборонені ваги: font-black, font-light, font-thin.

### Anti-Patterns
- `pluralUk(n, one, few, many)` з `@/lib/utils/pluralUk.ts` — ніяких ad-hoc
- Тільки `createAdminClient()` з `@/lib/supabase/admin` — ніякого SERVICE_ROLE_KEY inline
- Всі помилки через `parseError(err)` з `src/lib/utils/errors.ts`
- `as const` на всіх `type: 'spring'`

---

## 🧠 MemPalace

- **Старт сесії:** `mempalace_status` → Read SYSTEM_MAP
- **Перед рішенням:** `mempalace_search "query"`
- **Після важливого фіксу:** `mempalace_add_drawer`

---

## CLI Команди (з bookit/)

```bash
npm run dev          # Dev server (Turbopack)
npm run build        # Production build
npm run lint         # ESLint
npx tsc --noEmit     # TypeScript check
npm test             # Vitest unit tests
npm run test:e2e     # Seed DB + Playwright E2E

npx vitest run src/lib/billing/pricing.test.ts
npx playwright test e2e/tests/08-booking-complete.spec.ts
npx supabase db push # migrations to Supabase Cloud
```
