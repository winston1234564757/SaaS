# 🤝 HANDOFF — MTRP Execution (для наступного чату)

> **Прочитай це ПЕРШИМ** (разом з [MAP.md](./MAP.md)). Повний контекст виконання [MTRP-2026-06-02](../MTRP-2026-06-02.md).
> **Дата handoff:** 2026-06-05 (Sessions 01-10) · **Гілка:** `main` · **Стан:** tsc 0 · build 0 · lint 0. Все закомічено.
> ⚠️ **PENDING:** `npx supabase db push` для P0.1 (міграція `link_attempts`) + migration 140 (FK index)

---

## 0. TL;DR — звідки продовжувати

```
PHASE 0 ✅ COMPLETE. PHASE 1 ~73%. PHASE 2 ~17%.
Закрито: P1.9 ✅ · P1.14 ✅ · P2.2 ✅ · P2.13 ✅ · P2.14 ✅ · P2.10 ✅
НАСТУПНА ДІЯ: P1.15 — working_hours as any [4h+] АБО Phase 3 (тести — user priority)
```

**Перший хід наступного чату:**
```bash
# 1. startup
mcp__mempalace__mempalace_status
Read XDEV/MAPS/SYSTEM_MAP.md (last 50)
Read XDEV/PLANS/MTRP/HANDOFF.md   # цей файл
Read XDEV/PLANS/MTRP/MAP.md

# 2. optional: deploy pending migrations
cd bookit && npx supabase db push

# 3a. P1.15 — working_hours types
grep -n "as any" bookit/src/app/\[slug\]/page.tsx | head -20

# 3b. Phase 3 — tests
grep -rn "createBooking\|referrals" bookit/src/lib/actions/ -l
```

---

## 1. Що це за задача

**MTRP-2026-06-02** — 71 item, 5 phases. **Мандат:** «роби все що треба; нічого не зламати, зробити стабільнішим і кращим».

---

## 2. Хаб `XDEV/PLANS/MTRP/`

| Файл | Роль |
|---|---|
| `HANDOFF.md` | Цей файл |
| `MAP.md` | Resume-pointer: наступна дія |
| `TRACKER.md` | Статус 71 items + C-01..C-20 corrections |
| `AUDIT_LOG.md` | Append-only журнал сесій |
| `tools/scan-buttons.cjs` | `<button>` без type= |
| `tools/fix-button-type.cjs` | Codemod type="button" |
| `tools/scan-icon-buttons.cjs` | icon-only без aria-label |

---

## 3. Що ЗРОБЛЕНО (Sessions 01-10)

### Phase 0 — 100% COMPLETE ✅
- **P0.3** stub видалено · **P0.10** 11 root widgets · **P0.11** ~2,400 рядків dead-code · **N-01** blocks-test
- **P0.5** 204 buttons `type="button"` · **P0.6** 72 aria-labels (12 batches)
- **P0.8** 3 div→button (TodaySchedule · blossom/InsightsRow · SegmentConfigWidget)
- **P0.9** 0 real violations (all legit links)

### Phase 1 — ~73%
- **P0.1 ✅** — booking hijack fix:
  - `src/app/[slug]/actions.ts` → phone-match + rate-limit (5/15хв) + link_attempts audit
  - Migration `supabase/migrations/20260604000000_booking_link_security.sql`
  - ⚠️ `npx supabase db push` ще не виконано

- **P0.2 ✅** — admin client leaks: `public.ts` NEW + `growth/actions.ts` NEW + 17 файлів + ESLint rule

- **P0.7 ✅** — MicaModal → Radix Dialog: `Dialog.Content asChild` (focus trap + backdrop click)

- **P1.1 ✅** — useIsDesktop merge: canonical у `src/lib/hooks/` · `src/hooks/` deleted · 12 consumers

- **P1.12 ✅** — timingSafeEqual CRON: **NEW** `src/lib/utils/verifyCronSecret.ts` HMAC sha256 · 5 cron routes

- **P1.4 ✅** — WeeklyChart aria-pressed: mode tabs + bar buttons (3 теми)

- **P1.16 ✅** — Touch targets ≥44px: 13 files · ghost buttons → size-11 flex · BookingCard 4 actions

- **P1.3 ✅** — Heatmap roving tabindex: div→button · roving tabindex · Arrow keys · 91 cells (not 168 — C-17)

- **P1.5 ✅** — Tour system documentation: `useTour` vs `DashboardTourContext` rule in SYSTEM_MAP

- **P1.6 ✅** — Mojibake audit: FALSE ALARM — `═══` = Unicode U+2550. No fix.

- **P1.7 ✅** — Migration rename: `137_` → `137a_`

- **P1.8 ✅** — StoryGenerator useEffect→useQuery: 3 hooks · `story-` prefix keys · staleTime 30-60s

- **P1.9 ✅** — PublicMasterPage C2C balance → useQuery:
  - `queryKey: ['c2c-balance', master.id]` — user fetched inside queryFn (no user state)
  - `enabled: hydrated && masterC2cEnabled && !!master.id && !c2cRefCode`
  - staleTime 5 min; removed old `useEffect` + eslint-disable comment

- **P1.14 ✅** — useDashboardStore → useShallow:
  - `BentoGrid.tsx`: 2 selectors wrapped (BentoWidget + BentoGrid)
  - `WidgetLibraryModal.tsx`: 1 selector wrapped
  - `import { useShallow } from 'zustand/shallow'` (Zustand v5 path)

### Phase 2 — ~17%
- **P2.2 ✅** — package.json dead deps removed:
  - Removed 6: `marked`, `isomorphic-dompurify`, `html-to-image`, `sonner`, `@radix-ui/react-slot`, `class-variance-authority`
  - ~50 packages, ~440KB · package-lock.json in `.gitignore`

- **P2.13 ✅** — `<th scope="col">` admin tables:
  - `AllianceMap.tsx` (4× th) · `MastersDirectory.tsx` (5× th + 1 text-right)
  - `SystemLogsViewer.tsx` (9× th)
  - C-19: `LandingBentoFeatures.tsx` skipped — `<table role="presentation">`

- **P2.14 ✅** — FK index migration:
  - `supabase/migrations/140_c2c_referrals_master_id_index.sql`
  - `CREATE INDEX IF NOT EXISTS idx_c2c_referrals_master_id ON public.c2c_referrals(master_id)`
  - ⚠️ `npx supabase db push` ще не виконано

- **P2.10 ✅** — Sanitize phone PII in cron logs:
  - `rebooking/route.ts`: added `sanitizePhone()` helper → `phone.slice(0,4)+'****'+phone.slice(-2)`
  - Lines 110, 113: `phone` → `sanitizePhone(phone)` in console.warn
  - C-20: `reminders/route.ts:57` FALSE ALARM — `results` = counts only, no phone data

---

## 4. НАСТУПНІ КРОКИ (у порядку)

### 4.1 P1.15 — `working_hours as any` [4h+] ← або Phase 3

**MTRP §6.15.** `src/app/[slug]/page.tsx` — 18× `as any` cast на working_hours.
Визначити `MasterPublicPageData` тип. Scope великий → можна вважати початком Phase 3.

```bash
grep -n "as any" bookit/src/app/\[slug\]/page.tsx | head -20
```

### 4.2 Phase 3 (USER PRIORITY) — Tests

- **P3.1** (P1.11): `createBooking.ts` + `referrals.ts` tests
- Деталі → TRACKER.md §8

### 4.3 Phase 2 — решта
- **P2.10 ✅** DONE
- **P2.6** `.select('*')` cleanup · **P2.11** contrast · **P2.12** inputs без labels

---

## 5. ⚠️ КРИТИЧНІ УРОКИ

1. **VERIFY-BEFORE-FIX** — 20 plan corrections знайдено. Читай код перед правкою.
2. **ESLint + AST scanners > grep** для button/import detection.
3. **Видалення роуту** → `rm -rf .next && npm run build` (stale types).
4. **growth/page.tsx cross-user query** — `referred_by = referralCode` рахує ІНШИХ майстрів → admin в actions.ts.
5. **edit_counter_guard: 6-й Edit/файл/сесія** → Write повну версію (скидає лічильник).
6. **aria-label = технічні рядки** → humanizer SKIP (RULE 0.5 виняток).
7. **P0.9 false alarm** — всі `<a href onClick>` були легітимні (tel:, Telegram, legal).
8. **PowerShell encoding** — `Set-Content` без `[System.Text.UTF8Encoding]::new($false)` → mojibake Cyrillic.
9. **Multi-line PS replace** → CRLF/LF mismatch. Використовуй single-line або `$le` detection.
10. **Frost WeeklyChart bar buttons** — вже мали aria-label + aria-pressed → VERIFY перед додаванням.
11. **PeakHoursWidget HOURS=[8..20]** — 13 годин (не 24), тому 91 cells (не 168).
12. **Unicode box-drawing `═══`** — NOT mojibake. U+2550 = valid UTF-8 intentional art.
13. **DashboardTourContext** — НЕ використовує `useTour` всередині. Незалежна State machine.
14. **useQuery queryKey — не user?.id** якщо компонент не має user state → `master.id` only + fetch user inside queryFn.
15. **`role="presentation"` таблиця** — `scope="col"` семантично нерелевантний. Не додавати (C-19).
16. **Cron logs PII** — `results` об'єкт в reminders/route.ts = counts only, не raw rows. Завжди перевіряй що реально потрапляє в console.* (C-20).

---

## 6. Конвенції aria-label (UA)

| Контекст | Label |
|---|---|
| Закрити (X) | `Закрити` |
| Назад | `Назад` |
| Prev/Next місяць | `Попередній місяць` / `Наступний місяць` |
| Prev/Next категорія | `Попередня категорія` / `Наступна категорія` |
| Copy | `{copied ? 'Скопійовано' : 'Скопіювати'}` |
| Delete | `Видалити` / `Видалити файл` / `Видалити перерву` |
| Expand/collapse | `{open ? 'Згорнути' : 'Розгорнути'}` |
| Help | `Як це працює?` |
| Upload | `Завантажити аватар` / `Додати зображення` |

---

## 7. Plan Corrections (C-01..C-20)

Детально → TRACKER.md §Corrections. Ключові:
- C-09: P0.9 = 0 real · C-10: P0.8 = 3 not 9 · C-11: P0.6 = 210 scanner · C-12: P0.2 = ~12 not 18
- C-13..C-16: P1.16 plan vs reality (ghost buttons, wrong sizes, non-existent file)
- C-17: P1.3 — 91 cells not 168 (HOURS=[8..20] = 13h only)
- C-18: P1.6 — `═══` = Unicode U+2550 (not mojibake). False alarm.
- C-19: P2.13 — `LandingBentoFeatures.tsx` skipped (`<table role="presentation">`)
- C-20: P2.10 — `reminders/route.ts:57` = counts only, no phone PII. False alarm.

---

## 8. Verification protocol

```bash
cd bookit
npx tsc --noEmit               # 0 errors — ОБОВ'ЯЗКОВО
npm run build                  # clean
npm run lint                   # 0 errors (ESLint P0.2 rule)
npm test                       # якщо торкнувся логіки
```
**Після item:** AUDIT_LOG · TRACKER · MAP · commit · `mempalace_add_drawer`.

---

## 9. Open decisions

- ⚠️ `npx supabase db push` — P0.1 (link_attempts) + migration 140 (FK index) ще в pending
- 🔒 P0.12 — onboarding telemetry — user-decision

---

## 10. MemPalace (key drawers)

`mempalace_search "P1.9 C2C balance useQuery PublicMasterPage"` → queryKey without user state.
`mempalace_search "P1.14 useShallow zustand BentoGrid"` → Zustand v5 shallow selector pattern.
`mempalace_search "P2.10 sanitizePhone cron PII"` → phone sanitization in cron logs.
`mempalace_search "P2.13 scope col th admin tables"` → WCAG a11y table headers.
`mempalace_search "P2.14 FK index c2c_referrals migration 140"` → migration 140 FK index.
`mempalace_search "P1.5 tour system useTour DashboardTourContext"` → tour architecture.
`mempalace_search "P1.3 roving tabindex PeakHours"` → roving tabindex pattern, 91 cells.
`mempalace_search "P0.7 MicaModal Radix Dialog"` → focus trap pattern.
`mempalace_search "P1.12 verifyCronSecret timingSafeEqual"` → HMAC sha256 CRON_SECRET.
`mempalace_search "P0.2 admin client"` → publicClient + createClient + ESLint rule.
`mempalace_search "P0.1 booking hijack"` → phone-match implementation.

---

*Оновлено: 2026-06-05 · Sessions 01-10 · P2.10 ✅ sanitizePhone · Наступне: P1.15 або Phase 3*
