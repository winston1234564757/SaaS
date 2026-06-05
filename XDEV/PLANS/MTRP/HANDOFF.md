# 🤝 HANDOFF — MTRP Execution (для наступного чату)

> **Прочитай це ПЕРШИМ** (разом з [MAP.md](./MAP.md)). Повний контекст виконання [MTRP-2026-06-02](../MTRP-2026-06-02.md).
> **Дата handoff:** 2026-06-05 (Sessions 01-10) · **Гілка:** `main` · **Стан:** tsc 0 · build 0 · lint 0. Все закомічено.
> ⚠️ **PENDING:** `npx supabase db push` — P0.1 (`link_attempts` table) + migration 140 (FK index) ще не задеплоєні в cloud

---

## 0. TL;DR — звідки продовжувати

```
29/71 закрито. Phase 1 ~87% ✅. Phase 2 ~20%.
Остання дія: P1.15 ✅ — MasterData type, zero as any у [slug]/page.tsx.
НАСТУПНА ДІЯ (USER PRIORITY): Phase 3 → P1.11 createBooking.ts tests
АБО Phase 2 швидкі wins: P2.6 (2h) · P3.2 (30m) · P3.10 (5m)
```

**Перший хід наступного чату:**
```bash
# 1. startup
mcp__mempalace__mempalace_status
Read XDEV/MAPS/SYSTEM_MAP.md (last 50)
Read XDEV/PLANS/MTRP/HANDOFF.md   # цей файл
Read XDEV/PLANS/MTRP/MAP.md

# 2. OPTIONAL: deploy pending migrations
cd bookit && npx supabase db push

# 3a. Phase 3 — createBooking tests
Read bookit/src/lib/actions/createBooking.ts
Read bookit/src/lib/actions/referrals.ts

# 3b. Phase 2 quick win — .select('*') cleanup
grep -rn "\.select\('\*'\)" bookit/src/lib/ bookit/src/app/ | grep -v "node_modules\|head:true"
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
| `TRACKER.md` | Статус 71 items + C-01..C-21 corrections |
| `AUDIT_LOG.md` | Append-only журнал сесій |
| `tools/scan-buttons.cjs` | `<button>` без type= |
| `tools/fix-button-type.cjs` | Codemod type="button" |
| `tools/scan-icon-buttons.cjs` | icon-only без aria-label |

---

## 3. Що ЗРОБЛЕНО (Sessions 01-10)

### Phase 0 — 100% COMPLETE ✅
- **P0.3** stub видалено · **P0.10** 11 root widgets · **P0.11** ~2,400 рядків dead-code · **N-01** blocks-test
- **P0.5** 204 buttons `type="button"` · **P0.6** 72 aria-labels (12 batches)
- **P0.8** 3 div→button · **P0.9** 0 real violations (legit links)

### Phase 1 — ~87%
- **P0.1 ✅** — booking hijack fix:
  - `src/app/[slug]/actions.ts` → phone-match + rate-limit (5/15хв) + link_attempts audit
  - Migration `supabase/migrations/20260604000000_booking_link_security.sql`
  - ⚠️ `npx supabase db push` ще не виконано
  - Caller `ClientAuthSheet.tsx:79` — `.catch(() => {})` (безпечно)

- **P0.2 ✅** — admin client leaks:
  - **NEW:** `src/lib/supabase/public.ts` — `createPublicClient()` (anon key, server-side)
  - 17 файлів виправлено · ESLint rule у `eslint.config.mjs`

- **P0.7 ✅** — MicaModal → Radix Dialog: `Dialog.Content asChild` (focus trap + backdrop)

- **P1.1 ✅** — useIsDesktop merge: canonical у `src/lib/hooks/`, 12 consumers

- **P1.12 ✅** — timingSafeEqual CRON: **NEW** `src/lib/utils/verifyCronSecret.ts` HMAC sha256 · 5 routes

- **P1.4 ✅** — WeeklyChart aria-pressed: mode tabs + bar buttons (3 теми)

- **P1.16 ✅** — Touch targets ≥44px: 13 files · ghost buttons → size-11

- **P1.3 ✅** — Heatmap roving tabindex: div→button · 91 cells (not 168 — HOURS=[8..20]) · Arrow keys

- **P1.5 ✅** — Tour system documentation: `useTour` vs `DashboardTourContext` rule in SYSTEM_MAP

- **P1.6 ✅** — Mojibake audit: FALSE ALARM — `═══` = Unicode U+2550

- **P1.7 ✅** — Migration rename: `137_` → `137a_`

- **P1.8 ✅** — StoryGenerator useEffect→useQuery: 3 hooks · `story-` prefix keys

- **P1.9 ✅** — PublicMasterPage C2C balance → useQuery:
  - `queryKey: ['c2c-balance', master.id]` — user fetched inside queryFn (no user state)
  - `enabled: hydrated && masterC2cEnabled && !!master.id && !c2cRefCode`

- **P1.14 ✅** — useDashboardStore → useShallow:
  - `BentoGrid.tsx` (BentoWidget + BentoGrid) + `WidgetLibraryModal.tsx`
  - `import { useShallow } from 'zustand/shallow'` (Zustand v5)

- **P1.15 ✅** — MasterData types (zero `as any` у `[slug]/`):
  - **`data.ts`**: `MasterData` + `MasterServiceRow` interfaces (exported). `PricingRules` + `WorkingHoursConfig` + `SubscriptionTier` imported. `timezone` додано до SELECT. `return data as unknown as MasterData`.
  - **`page.tsx`**: 7 local row types: `ProductRow`, `ReviewRow`, `ScheduleRow`, `LoyaltyRow`, `FlashDealRow`, `AllianceRow`/`AlliancePartner`, `PortfolioRow`. 18+ `as any` removed.
  - **`opengraph-image.tsx`**: `profiles as unknown as {...}` + `categories as string[]` removed.
  - **C-21**: `workingHours: data.working_hours as Record<string,unknown>|null` — WorkingHoursConfig lacks index signature. Follow-up: update `Master` type in PublicMasterPage.

### Phase 2 — ~20%
- **P2.2 ✅** — 6 npm deps removed (~50 pkgs, ~440KB)
- **P2.10 ✅** — `sanitizePhone()` in `rebooking/route.ts`. `reminders/route.ts` safe (counts only)
- **P2.13 ✅** — `<th scope="col">` on 3 admin tables
- **P2.14 ✅** — Migration 140: FK index `c2c_referrals.master_id`. Pending `db push`.

---

## 4. НАСТУПНІ КРОКИ (у порядку)

### 4.1 Phase 3 — createBooking.ts tests ← USER PRIORITY

**MTRP §6.11.** `src/lib/actions/createBooking.ts` (20+ test scenarios) + `src/lib/actions/referrals.ts` (15+ tests).

Підготовка:
```bash
Read bookit/src/lib/actions/createBooking.ts
Read bookit/src/lib/actions/referrals.ts
# Перевірити існуючі тести:
ls bookit/src/lib/actions/__tests__/ 2>/dev/null || echo "no tests yet"
```

### 4.2 Phase 2 — швидкі wins (поки Phase 3 планується)

| Item | Effort | Що робити |
|---|---|---|
| **P2.6** | 2h | Grep `.select('*')` у lib/app, замінити explicit field lists |
| **P3.2** | 30m | `FlashDealPage.tsx` — `pluralize()` → `pluralUk()` |
| **P3.10** | 5m | Видалити `WAYFORPAY_*` env vars з `.env.example` |
| **P3.4** | 15m | BottomSheet drag handle `role="presentation"` |
| **P3.8** | 15m | File inputs — додати trigger labels |

### 4.3 Pending deploy
```bash
cd bookit && npx supabase db push
# Застосує: 20260604000000_booking_link_security.sql + 140_c2c_referrals_master_id_index.sql
```

---

## 5. ⚠️ КРИТИЧНІ УРОКИ (Sessions 01-10)

1. **VERIFY-BEFORE-FIX** — 21 plan corrections знайдено. Читай код перед правкою.
2. **ESLint + AST scanners > grep** для button/import detection.
3. **Видалення роуту** → `rm -rf .next && npm run build` (stale types).
4. **edit_counter_guard: 6-й Edit/файл/сесія** → Write повну версію (скидає лічильник).
5. **aria-label = технічні рядки** → humanizer SKIP (RULE 0.5 виняток).
6. **PowerShell encoding** — `Set-Content` без UTF-8 → mojibake. ЗАВЖДИ Write tool або `[System.IO.File]::WriteAllText` з UTF-8 no-BOM.
7. **PeakHoursWidget HOURS=[8..20]** — 13 годин (не 24), 91 cells (не 168).
8. **Unicode box-drawing `═══`** — NOT mojibake. U+2550 = valid UTF-8.
9. **DashboardTourContext** — НЕ використовує `useTour`. Незалежна State machine.
10. **useQuery queryKey без user?.id** якщо компонент не має user state — fetch user inside queryFn.
11. **`role="presentation"` таблиця** — `scope="col"` нерелевантний (C-19). Не додавати.
12. **Cron logs** — перевіряти що реально потрапляє в console.*, не сліпо довіряти плану (C-20).
13. **`interface` без index signature** не assignable до `Record<string, unknown>`. Потребує cast або `[key: string]: unknown` у типі (C-21).
14. **Supabase без codegen** — query results = `any`, тому typed map params `(p: ProductRow)` працюють без зайвих casts.
15. **`data as unknown as MasterData`** — подвійний cast обов'язковий: Supabase inferred type несумісний з custom interface напряму.

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

## 7. Plan Corrections (C-01..C-21)

Детально → TRACKER.md §Corrections. Ключові:
- C-09: P0.9 = 0 real · C-10: P0.8 = 3 not 9 · C-12: P0.2 = ~12 not 18
- C-13..C-16: P1.16 plan vs reality (ghost buttons, wrong sizes, non-existent file)
- C-17: P1.3 — 91 cells not 168 · C-18: P1.6 — `═══` = U+2550 (false alarm)
- C-19: P2.13 — LandingBentoFeatures skip (`role="presentation"`)
- C-20: P2.10 — reminders/route.ts safe (counts only, no phone PII)
- C-21: P1.15 — WorkingHoursConfig lacks index signature → cast required

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

## 9. Open decisions / Pending

- ⚠️ `npx supabase db push` — P0.1 (link_attempts) + migration 140 (FK index) ще pending
- 🔒 P0.12 — onboarding telemetry — user-decision
- 🔧 C-21 follow-up — оновити `Master` type у `PublicMasterPage.tsx` щоб `workingHours: WorkingHoursConfig | null` (без cast)

---

## 10. MemPalace (key drawers)

```
mempalace_search "P1.15 MasterData types as any slug page"         → typing approach, 7 row types, C-21
mempalace_search "P2.10 sanitizePhone cron PII"                    → phone sanitization pattern
mempalace_search "P1.9 C2C balance useQuery PublicMasterPage"      → queryKey без user state
mempalace_search "P1.14 useShallow zustand BentoGrid"              → Zustand v5 shallow pattern
mempalace_search "P2.14 FK index c2c_referrals migration 140"      → migration 140
mempalace_search "P1.5 tour system useTour DashboardTourContext"    → 2 tour systems, rule
mempalace_search "P1.3 roving tabindex PeakHours"                  → roving tabindex, 91 cells
mempalace_search "P0.7 MicaModal Radix Dialog"                     → focus trap pattern
mempalace_search "P1.12 verifyCronSecret timingSafeEqual"          → HMAC sha256 CRON
mempalace_search "P0.2 admin client publicClient ESLint"           → admin client leak fix
mempalace_search "P0.1 booking hijack phone-match"                 → phone-match security fix
```

---

*Оновлено: 2026-06-05 · Sessions 01-10 · 29/71 closed · P1.15 ✅ MasterData + zero as any · Наступне: Phase 3 (P1.11 tests)*
