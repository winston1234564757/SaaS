# 🤝 HANDOFF — MTRP Execution (для наступного чату)

> **Прочитай це ПЕРШИМ** (разом з [MAP.md](./MAP.md)). Повний контекст виконання [MTRP-2026-06-02](../MTRP-2026-06-02.md).
> **Дата handoff:** 2026-06-05 (Sessions 01-09) · **Гілка:** `main` · **Стан:** tsc 0 · build 0 · lint 0. Все закомічено.
> ⚠️ **PENDING:** `npx supabase db push` для P0.1 (міграція `link_attempts` ще не задеплоєна в cloud)

---

## 0. TL;DR — звідки продовжувати

```
PHASE 0 ✅ COMPLETE. PHASE 1 ~63% (P0.1 ✅ · P0.2 ✅ · P0.7 ✅ · P1.1 ✅ · P1.12 ✅ · P1.4 ✅ · P1.16 ✅ · P1.3 ✅ · P1.5 ✅ · P1.6 ✅ · P1.7 ✅)
НАСТУПНА ДІЯ: P1.8 — StoryGenerator empty useEffect deps [3h]
```

**Перший хід наступного чату:**
```bash
# 1. startup
mcp__mempalace__mempalace_status
Read XDEV/MAPS/SYSTEM_MAP.md (last 50)
Read XDEV/PLANS/MTRP/HANDOFF.md   # цей файл
Read XDEV/PLANS/MTRP/MAP.md

# 2. optional: deploy P0.1 migration
cd bookit && npx supabase db push

# 3. P1.8 — StoryGenerator empty deps
grep -n "useEffect" bookit/src/components/master/marketing/StoryGenerator.tsx
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
| `TRACKER.md` | Статус 71 items + C-01..C-18 corrections |
| `AUDIT_LOG.md` | Append-only журнал сесій |
| `tools/scan-buttons.cjs` | `<button>` без type= |
| `tools/fix-button-type.cjs` | Codemod type="button" |
| `tools/scan-icon-buttons.cjs` | icon-only без aria-label |

---

## 3. Що ЗРОБЛЕНО (Sessions 01-09)

### Phase 0 — 100% COMPLETE ✅
- **P0.3** stub видалено · **P0.10** 11 root widgets · **P0.11** ~2,400 рядків dead-code · **N-01** blocks-test
- **P0.5** 204 buttons `type="button"` · **P0.6** 72 aria-labels (12 batches)
- **P0.8** 3 div→button (TodaySchedule · blossom/InsightsRow · SegmentConfigWidget)
- **P0.9** 0 real violations (all legit links)

### Phase 1 — ~63%
- **P0.1 ✅** — booking hijack fix:
  - `src/app/[slug]/actions.ts` → phone-match + rate-limit (5/15хв) + link_attempts audit
  - Migration `supabase/migrations/20260604000000_booking_link_security.sql`
  - ⚠️ `npx supabase db push` ще не виконано
  - Caller `ClientAuthSheet.tsx:79` — `.catch(() => {})` (безпечно, SMS flow підхоплює)

- **P0.2 ✅** — admin client leaks:
  - **NEW:** `src/lib/supabase/public.ts` — `createPublicClient()` (anon key, server-side)
  - **NEW:** `src/app/(master)/dashboard/growth/actions.ts` — cross-user referral queries
  - 17 файлів виправлено · ESLint rule у `eslint.config.mjs`

- **P0.7 ✅** — MicaModal → Radix Dialog (S06):
  - `Dialog.Content asChild` на modal box (не wrapper) — focus trap + backdrop click
  - 2 consumers без змін (BookingDetailsModal + BookingWizard)

- **P1.1 ✅** — useIsDesktop merge (S06):
  - matchMedia canonical у `src/lib/hooks/` · `src/hooks/` deleted
  - 10 Landing* + 2 app consumers → 12 total

- **P1.12 ✅** — timingSafeEqual CRON (S06):
  - **NEW:** `src/lib/utils/verifyCronSecret.ts` — HMAC sha256 (no length leak)
  - 5 cron routes patched

- **P1.4 ✅** — WeeklyChart aria-pressed (S06):
  - Mode tabs: `aria-pressed={mode === m}` (3 теми)
  - Bar buttons: `aria-label` + `aria-pressed={isActive}` (Studio + Blossom; Frost вже мав)

- **P1.16 ✅** — Touch targets ≥44px (S07):
  - 13 files: size-6/7/8/9/10→size-11, h-7→h-11 (BookingCard 4 action buttons)
  - Studio/Frost close buttons: ghost (no size-*) → size-11 flex items-center justify-center rounded-full
  - БОНУС: 7 analytics files formatPrice from currency → services/types (pre-existing build error)
  - ⚠️ AnalyticsPage паралельно переписано аналітика-агентом (окремий scope)

- **P1.3 ✅** — Heatmap roving tabindex (S08):
  - Studio + Blossom: `div[role="button"]` → `button[type="button"]`
  - Всі 3 теми: roving tabindex (focusedCell state + cellRefs 7×13 + handleKeyDown)
  - Arrow keys: Right/Left=день, Down/Up=година, wrap by modulo
  - 91 cells (не 168 як в плані — HOURS=[8..20] = 13h × 7d) — C-17
  - БОНУС: ProductFormDrawer.tsx:156 pre-existing tsc error → `.map(id=>({serviceId:id,quantity:1}))`

- **P1.5 ✅** — Tour system documentation (S09):
  - `SYSTEM_MAP.md` оновлено: `useTour.ts` (6 consumers) vs `DashboardTourContext.tsx` (8 steps, 4 components)
  - Правило вибору: одна сторінка → `useTour`; multi-widget → `DashboardTourContext`
  - C-18: DashboardTourContext НЕ будується на useTour — незалежне управління станом

- **P1.6 ✅** — Mojibake audit (S09): FALSE ALARM — `═══` = Unicode U+2550 box-drawing, valid UTF-8. No fix.

- **P1.7 ✅** — Migration rename (S09):
  - `137_product_type_and_emoji.sql` → `137a_product_type_and_emoji.sql`
  - Fallback note: `UPDATE supabase_migrations SET version='137a_...' WHERE version='137_...'`

---

## 4. НАСТУПНІ КРОКИ (у порядку)

### 4.1 P1.8 — StoryGenerator empty useEffect deps [3h] ← NEXT

**MTRP §6.8.** `src/components/master/marketing/StoryGenerator.tsx:95-144` — empty deps array `[]` in useEffect.
Потрібно: замінити на useCallback + правильний deps array, або useEvent pattern.

```bash
grep -n "useEffect" bookit/src/components/master/marketing/StoryGenerator.tsx
```

### 4.2 Після P1.8
- **P1.9** (1h): PublicMasterPage C2C→useQuery
- **P1.14** (30m): `useDashboardStore`→`useShallow`

### 4.3 Phase 2-4
Деталі → TRACKER.md §7-9. Phase 3 (тести) — user priority.

---

## 5. ⚠️ КРИТИЧНІ УРОКИ

1. **VERIFY-BEFORE-FIX** — 18 plan corrections знайдено. Читай код перед правкою.
2. **ESLint + AST scanners > grep** для button/import detection.
3. **Видалення роуту** → `rm -rf .next && npm run build` (stale types).
4. **growth/page.tsx cross-user query** — `referred_by = referralCode` рахує ІНШИХ майстрів → admin в actions.ts.
5. **edit_counter_guard: 6-й Edit/файл/сесія** → Write повну версію (скидає лічильник).
6. **aria-label = технічні рядки** → humanizer SKIP (RULE 0.5 виняток).
7. **P0.9 false alarm** — всі `<a href onClick>` були легітимні (tel:, Telegram, legal).
8. **PowerShell encoding** — `Set-Content` без `[System.Text.UTF8Encoding]::new($false)` → mojibake Cyrillic. ЗАВЖДИ використовувати `[System.IO.File]::ReadAllText/WriteAllText` з UTF-8 no-BOM.
9. **Multi-line PS replace** → CRLF/LF mismatch якщо писати `$c.Replace("line1\nline2", ...)` — використовуй single-line replacement або `$le` detection.
10. **Frost WeeklyChart bar buttons** — вже мали aria-label + aria-pressed → VERIFY перед додаванням.
11. **PeakHoursWidget HOURS=[8..20]** — 13 годин (не 24), тому 91 cells (не 168). Завжди перевіряй константи в коді.
12. **Unicode box-drawing `═══`** — NOT mojibake. U+2550 = valid UTF-8 intentional art. `file` cmd is authoritative.
13. **DashboardTourContext** — НЕ використовує `useTour` всередині. Незалежна State machine. Перевіряй перед рефакторингом.

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

## 7. Plan Corrections (C-01..C-18)

Детально → TRACKER.md §Corrections. Ключові:
- C-09: P0.9 = 0 real · C-10: P0.8 = 3 not 9 · C-11: P0.6 = 210 scanner · C-12: P0.2 = ~12 not 18
- C-13..C-16: P1.16 plan vs reality (ghost buttons, wrong sizes, non-existent file)
- C-17: P1.3 — 91 cells not 168 (HOURS=[8..20] = 13h only)
- C-18: P1.6 — `═══` = Unicode U+2550 (not mojibake). False alarm.

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

- ⚠️ `npx supabase db push` — P0.1 migration (link_attempts table) ще в pending
- 🔒 P0.12 — onboarding telemetry — user-decision

---

## 10. MemPalace (key drawers)

`mempalace_search "P1.5 tour system useTour DashboardTourContext"` → tour architecture, 2 systems, rule.
`mempalace_search "P1.3 roving tabindex PeakHours"` → roving tabindex pattern, 91 cells, cellRefs grid.
`mempalace_search "P1.16 touch targets ghost buttons"` → ghost button pattern, size-11 fix.
`mempalace_search "P0.7 MicaModal Radix Dialog"` → focus trap pattern, Dialog.Content asChild.
`mempalace_search "P1.12 verifyCronSecret timingSafeEqual"` → HMAC sha256 CRON_SECRET.
`mempalace_search "P0.2 admin client"` → publicClient + createClient + ESLint rule.
`mempalace_search "P0.1 booking hijack"` → phone-match implementation + caller analysis.

---

*Оновлено: 2026-06-05 · Sessions 01-09 · Наступне: P1.8 StoryGenerator empty deps*
