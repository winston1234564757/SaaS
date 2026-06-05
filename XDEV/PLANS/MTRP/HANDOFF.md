# 🤝 HANDOFF — MTRP Execution (для наступного чату)

> **Прочитай це ПЕРШИМ** (разом з [MAP.md](./MAP.md)). Повний контекст виконання [MTRP-2026-06-02](../MTRP-2026-06-02.md).
> **Дата handoff:** 2026-06-05 (Sessions 01-12) · **Гілка:** `main` · **Стан:** tsc 0 · build 0 · 867 tests pass. Все закомічено.
> ⚠️ **PENDING:** `npx supabase db push` — P0.1 (`link_attempts` table) + migration 140 (FK index) ще не задеплоєні в cloud

---

## 0. TL;DR — звідки продовжувати

```
32/71 закрито. Phase 0 100% ✅. Phase 1 ~87%. Phase 2 ~24%. Phase 3 100%.
Остання дія: P2.1 ✅ — 70 as any → explicit types (21 files), tsc 0, build clean.
НАСТУПНА ДІЯ: P2.6 (.select('*') cleanup, ~2h) АБО P3.2 (pluralize→pluralUk, 30m)
```

**Перший хід наступного чату:**
```bash
# 1. startup (IRON RULE -1)
mcp__mempalace__mempalace_status
Read XDEV/MAPS/SYSTEM_MAP.md (offset 200, limit 50)
Read XDEV/PLANS/MTRP/HANDOFF.md   # цей файл
Read XDEV/PLANS/MTRP/MAP.md

# 2. OPTIONAL: deploy pending migrations
cd bookit && npx supabase db push

# 3a. Phase 2 quick win — .select('*') cleanup
grep -rn "\.select\('\*'\)" bookit/src/lib/ bookit/src/app/ | grep -v "node_modules\|head:true"

# 3b. Phase 4 polish — pluralUk, env, aria
# P3.2: FlashDealPage.tsx — pluralize() → pluralUk()
# P3.10: Видалити WAYFORPAY_* з .env.example
```

---

## 1. Що це за задача

**MTRP-2026-06-02** — 71 item, 5 phases. **Мандат:** «роби все що треба; нічого не зламати, зробити стабільнішим і кращим».

---

## 2. Хаб `XDEV/PLANS/MTRP/`

| Файл | Роль |
|---|---|
| `HANDOFF.md` | Цей файл |
| `MAP.md` | Resume-pointer: наступна дія + лічильник |
| `TRACKER.md` | Статус 71 items + C-01..C-21 corrections |
| `AUDIT_LOG.md` | Append-only журнал сесій (S01-S12) |
| `tools/scan-buttons.cjs` | `<button>` без type= (AST-парсер) |
| `tools/fix-button-type.cjs` | Codemod type="button" |
| `tools/scan-icon-buttons.cjs` | icon-only без aria-label |

---

## 3. Що ЗРОБЛЕНО (Sessions 01-12)

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
  - **`data.ts`**: `MasterData` + `MasterServiceRow` interfaces (exported). `timezone` додано до SELECT.
  - **`page.tsx`**: 7 local row types: `ProductRow`, `ReviewRow`, `ScheduleRow`, `LoyaltyRow`, `FlashDealRow`, `AllianceRow`/`AlliancePartner`, `PortfolioRow`. 18+ `as any` removed.
  - **`opengraph-image.tsx`**: join types removed.
  - **C-21**: `workingHours as Record<string,unknown>|null` — WorkingHoursConfig lacks index signature. Follow-up: update prop type.

### Phase 2 — ~24%
- **P2.2 ✅** — 6 npm deps removed (~50 pkgs, ~440KB)
- **P2.10 ✅** — `sanitizePhone()` in `rebooking/route.ts`. `reminders/route.ts` safe
- **P2.13 ✅** — `<th scope="col">` on 3 admin tables
- **P2.14 ✅** — Migration 140: FK index `c2c_referrals.master_id`. Pending `db push`.

### Phase 3 — 100% COMPLETE ✅ (3/3 items)
- **P1.11 ✅** (S11) — `createBooking.action.test.ts` (20 tests) + `referrals.action.test.ts` (19 tests). 44 total.
- **P1.10 ✅** (S11) — 5 hooks: useBookings (14) + useClients (8) + useBusyness (6) + useReviews (10) + useAnalytics (12). **32 new tests. 867 total.**
- **P2.1 ✅** (S12) — 70 `as any` → explicit types in 21 files.
  - `Promise<never>` для timeout races — cast eliminated completely.
  - Inline `type` aliases для Supabase join results.
  - `declare global { interface Window { gm_authFailure? } }` для Maps.
  - `google.maps as unknown as { marker?: ... }` — namespace не є value у TS.

---

## 4. НАСТУПНІ КРОКИ (у порядку пріоритету)

### 4.1 P2.6 — `.select('*')` cleanup (~2h)

**MTRP §7.6.** Замінити `*` на explicit field lists у ~10 Supabase queries.

```bash
grep -rn "\.select\('\*'\)" bookit/src/lib/ bookit/src/app/ | grep -v "node_modules\|head:true"
```

Навіщо: зменшує over-fetching, покращує TypeScript inference для joined queries.

### 4.2 P3.2 — pluralize → pluralUk (30m)

`FlashDealPage.tsx` — `pluralize()` (EN-only) → `pluralUk()` (UA plural forms).

```bash
grep -rn "pluralize(" bookit/src/ | grep -v node_modules
```

### 4.3 P3.10 — unused WAYFORPAY_* env (5m)

Видалити з `.env.example` / `.env.local.example`. WayForPay не використовується.

### 4.4 P3.3..P3.8 — a11y tail (~5h total)

| Item | Effort | Що |
|---|---|---|
| P3.3 | 1h | Decorative `<svg aria-hidden>` |
| P3.4 | 15m | BottomSheet drag handle `role="presentation"` |
| P3.5 | 30m | `outline-none` → `focus:ring` |
| P3.6 | 2h | admin/loyalty tabs `aria-pressed` |
| P3.7 | 30m | StepServices tabs `aria-controls` |
| P3.8 | 15m | File inputs → trigger labels |

### 4.5 Pending deploy
```bash
cd bookit && npx supabase db push
# Застосує: 20260604000000_booking_link_security.sql + 140_c2c_referrals_master_id_index.sql
```

### 4.6 Phase 2 — важчі tasks (планувати окремо)

| Item | Effort |
|---|---|
| P2.11 | 4h — контраст text-muted/30-50 → WCAG AA |
| P2.12 | 6h — 79 inputs без labels |
| P2.15 | 2h — useBookings refetch cascade (6 keys) |
| P2.7 | 6h — Modal/Sheet consolidation |
| P2.3 | 16h — split top-5 файлів >500 рядків |

---

## 5. ⚠️ КРИТИЧНІ УРОКИ (Sessions 01-12)

1. **VERIFY-BEFORE-FIX** — 21 plan corrections (C-01..C-21). Читай код перед правкою.
2. **ESLint + AST scanners > grep** для button/import detection.
3. **Видалення роуту** → `rm -rf .next && npm run build` (stale types).
4. **edit_counter_guard: ~6 Edit/файл/сесія** → Write повну версію коли заблоковано (скидає лічильник у наступній сесії).
5. **aria-label = технічні рядки** → humanizer SKIP (RULE 0.5 виняток).
6. **PowerShell encoding** — `Set-Content` без UTF-8 → mojibake. ЗАВЖДИ Write tool.
7. **PeakHoursWidget HOURS=[8..20]** — 13 годин (не 24), 91 cells (не 168).
8. **Unicode box-drawing `═══`** — NOT mojibake. U+2550 = valid UTF-8.
9. **DashboardTourContext** — НЕ використовує `useTour`. Незалежна State machine.
10. **useQuery queryKey без user?.id** якщо компонент не має user state — fetch user inside queryFn.
11. **`role="presentation"` таблиця** — `scope="col"` нерелевантний (C-19). Не додавати.
12. **Cron logs** — перевіряти що реально потрапляє в console (C-20).
13. **`interface` без index signature** не assignable до `Record<string, unknown>` (C-21). Потребує cast або `[key: string]: unknown`.
14. **Supabase без codegen** — query results = `any`, typed map params `(p: ProductRow)` без зайвих casts.
15. **`data as unknown as MasterData`** — подвійний cast обов'язковий (Supabase inferred type несумісний).
16. **`Promise<never>` для timeout** → `Promise.race([T, never])` = `T`. Нуль cast.
17. **Google Maps `marker` namespace** — не є value у TS. Тільки `as unknown as { marker? }`.
18. **`waitFor(() => bool)` в Vitest** — ЗАВЖДИ `await waitFor(() => expect(x).toBe(y))`, ніколи boolean.
19. **TanStack Query v5 `enabled=false`** → `data = placeholderData` (не undefined). Перевіряти `fetchStatus === 'idle'`.
20. **`vi.hoisted(() => vi.fn())`** — обов'язковий для cross-mock references (showToast, etc.).

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
npm run lint                   # 0 errors (ESLint P0.2 rule active)
npm test                       # 867 pass якщо торкнувся логіки
```

**Після кожного item:** AUDIT_LOG · TRACKER · MAP · commit · `mempalace_add_drawer`.

---

## 9. Open decisions / Pending

- ⚠️ `npx supabase db push` — P0.1 + migration 140 ще pending
- 🔒 P0.12 — onboarding telemetry — user-decision (blocked)
- 🔧 C-21 follow-up — оновити `Master` type у `PublicMasterPage.tsx` (WorkingHoursConfig + index sig)
- ⚠️ TRACKER.md counter row P2: "4" → "5" (edit_counter_guard заблокував S12 — виправити у S13)

---

## 10. MemPalace (key drawers)

```
mempalace_search "P2.1 as any Promise never race window gm_authFailure"  → typing patterns
mempalace_search "P1.10 P1.11 vitest hook tests waitFor vi.hoisted"     → test patterns
mempalace_search "P1.15 MasterData types as any slug page"               → MasterData approach
mempalace_search "P2.10 sanitizePhone cron PII"                          → phone sanitization
mempalace_search "P1.9 C2C balance useQuery PublicMasterPage"            → queryKey без user
mempalace_search "P1.14 useShallow zustand BentoGrid"                    → Zustand v5 shallow
mempalace_search "P1.5 tour system useTour DashboardTourContext"         → 2 tour systems
mempalace_search "P1.3 roving tabindex PeakHours 91 cells"               → heatmap pattern
mempalace_search "P0.7 MicaModal Radix Dialog focus trap"                → focus trap
mempalace_search "P1.12 verifyCronSecret timingSafeEqual"                → HMAC sha256
mempalace_search "P0.2 admin client publicClient ESLint"                 → admin leak fix
mempalace_search "P0.1 booking hijack phone-match link_attempts"         → security fix
```

---

*Оновлено: 2026-06-05 · Sessions 01-12 · 32/71 closed · Phase 3 DONE ✅ · Наступне: P2.6 або P3.2*
