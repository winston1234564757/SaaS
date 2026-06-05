# 📋 TRACKER.md — Live Status (71 items)

> Live джерело правди про прогрес виконання [MTRP-2026-06-02](../MTRP-2026-06-02.md).
> **Updated:** 2026-06-05 (S08) · **Active phase:** Phase 1→2 · **Progress:** 21 closed · 2 deferred · 2 blocked
> Легенда: ⏳ TODO · 🔄 IN PROGRESS · ✅ DONE · 🔒 BLOCKED · ⚠️ CORRECTED · ➖ DEFERRED

---

## 🗺️ Progress by Phase

```
Phase 0  HOT FIXES        [████████] 100%  ← all done ✅
Phase 1  SECURITY & A11Y  [██████░░]  ~63%  ← P0.1 ✅ · P0.2 ✅ · P0.7 ✅ · P1.1 ✅ · P1.4 ✅ · P1.12 ✅ · P1.16 ✅ · P1.3 ✅ · P1.5 ✅ · P1.6 ✅ · P1.7 ✅ · P1.8 next
Phase 2  LIMITED DRY      [░░░░░░░░]   0%
Phase 3  TESTS & TYPES ⭐ [░░░░░░░░]   0%  ← user priority
Phase 4  POLISH           [░░░░░░░░]   0%
```

---

## ⚠️ Plan Corrections & New Findings

| # | Item | План казав | Реальність (verified 2026-06-05) | Дія |
|---|---|---|---|---|
| C-01 | P0.10 | «11 root widgets, 0 importers, видалити всі» | Лише **5** мертві | ✅ видалено 5 (S01) |
| C-02 | P0.10 | `ScheduleWidget` (root) — мертвий | **ЖИВИЙ**: `SettingsPage.tsx` + `BentoGrid.tsx` | ⚠️ лишено |
| C-03 | P0.10 | 5 root widgets мертві | Живі лише через dev-сторінку `blocks-test` | ✅ resolved (N-01) |
| C-04 | P0.11/P0.6 | «видалити ScheduleDrawer» vs «aria-label» | 0 importers → справді мертвий | ✅ видалено (S01) |
| N-01 | NEW | — | `blocks-test/page.tsx` — dev-харнес у проді, споживач 6 root-widgets | ✅ RESOLVED — видалено |
| C-05 | P0.11 | `broadcastUtils.ts` — «видалити 5 експортів» | ЖИВИЙ: юзає `marketing/actions.ts` + тести | ⚠️ KEPT |
| C-06 | P0.11 | `pricing.ts` BillingInput/TierProgress | Internal param + public return type (ReferralPage+тести) | ⚠️ KEPT |
| C-07 | P0.5 | ⚠️ я спершу хибно закрив (grep false-negative) | AST-парсер `tools/scan-buttons.cjs` → **204** без type (з 595). Flat ripgrep multiline ненадійний | 🔄 REOPENED → ✅ DONE |
| C-08 | P0.11 | `dates.ts pluralize` — «видалити» | Юзає `FlashDealPage`; `pluralUk` інша сигнатура | 🔒 → P3.2 |
| C-09 | P0.9 | `StatsMosaicWidget.tsx` — «11 `<a href onClick>` violations» | `StatsMosaicWidget` видалено в S02. Реальних `<a onClick>` — 0, не 11 | ✅ DONE — no real violations |
| C-10 | P0.8 | «9 `<div onClick>` violations» | 3 реальних залишилось (решта вже fixed). | ✅ DONE S04 |
| C-11 | P0.6 | Сканер: «~247 кандидатів, реально ~120» | 210 кандидатів → 72 реальних icon-only → решта false-positives | ✅ DONE S04 |
| C-12 | P0.2 | `auth/callback/route.ts`, `r/[code]/route.ts` — violations | Route handlers (API zone) — законно. Реальних ~12 non-API | ⚠️ CORRECTED — ~12 not 18 |
| C-13 | P1.16 | Root MonthlyCalendarWidget.tsx (L273,288) | Файл не існує — план-помилка | ⚠️ CORRECTED |
| C-14 | P1.16 | Studio/Frost close buttons мали size-* | Були без жодного size-класу (ghost buttons) → size-11 + flex added | ✅ fixed |
| C-15 | P1.16 | AnalyticsPage L457 = size-8 | Реально size-9 (все одно виправлено) | ⚠️ CORRECTED |
| C-16 | P1.16 | WidgetLibraryModal=size-8, VacationManager=size-8 | Були size-10 та size-6 відповідно | ⚠️ CORRECTED |
| C-17 | P1.3 | Plan said 168 cells (24h×7d) | Реально 91 cells: HOURS=[8..20] = 13h × 7d | ⚠️ CORRECTED |
| C-18 | P1.6 | «Mojibake у 4+ міграціях» (cp1251 garble) | Файли вже UTF-8, `═══` = Unicode box-drawing U+2550 (навмисний арт) | ✅ FALSE ALARM — no fix needed |

> **Урок 1:** видалення роуту → `rm -rf .next && npm run build` (stale types).
> **Урок 2:** `<button>` атрибути → `tools/scan-buttons.cjs` (AST), не ripgrep.
> **Урок 3 (P0.1):** phone-match verification — порівнювати last 10 digits (нормалізація E.164 варіюється).
> **Урок 4 (P1.6):** `═══` в SQL-файлах = box-drawing Unicode (U+2550), не mojibake. `file` команда = UTF-8.

---

## 5. Phase 0 — HOT FIXES ✅ COMPLETE

| Item | Title | Scope / §план | Effort | Status | Нотатка |
|---|---|---|---|---|---|
| **P0.3** | old_BookingsPage.tsx stub | root · §5.3 | 5m | ✅ **DONE** | Видалено S01 |
| **P0.10** | root-level dead widgets | §5.10 | 30m | ✅ **DONE** | 11 видалено. ScheduleWidget лишено — живий (C-02) |
| **P0.11** | dead code (~2,400 рядків) | §5.11 | 30m | ✅ **DONE** | 9 файлів + 3 dead-експорти. broadcastUtils/pricing KEPT |
| **P0.5** | кнопки без `type="button"` (204) | §5.5 | done | ✅ **DONE** | 204 типізовано. Re-scan: 0 missing |
| **P0.6** | icon-only без `aria-label` | §5.6 | done | ✅ **DONE** | 72 buttons, ~35 files, 12 batches |
| **P0.8** | 3 `<div onClick>` → `<button>` | §5.8 | done | ✅ **DONE** | TodaySchedule · blossom/InsightsRow · SegmentConfigWidget |
| **P0.9** | `<a href onClick>` → `<button>` | §5.9 | done | ✅ **DONE** | 0 real violations — all legit links (tel:, TG, legal) |

➖ **P0.4** secrets audit — DEFERRED (§5.4)

---

## 6. Phase 1 — SECURITY & A11Y

| Item | Title | §план | Effort | Status | Нотатка |
|---|---|---|---|---|---|
| **P0.1** | linkBookingToClient booking hijack | §5.1 | done | ✅ **DONE** | phone-match + link_attempts audit + rate-limit (5/15хв). Migration `20260604000000_booking_link_security.sql`. ⚠️ `npx supabase db push` потрібен |
| **P0.2** | Admin client leak (~12 zones) + ESLint | §5.2 | done | ✅ **DONE** | 17 files fixed: publicClient (public pages) + createClient (dashboard/client pages) + growth/actions.ts (cross-user). New: src/lib/supabase/public.ts + ESLint rule in eslint.config.mjs. tsc 0 + lint 0. |
| **P0.7** | MicaModal → Radix Dialog (focus trap) | §5.7 | done | ✅ **DONE** | Dialog.Content asChild on modal box (not wrapper) — focus trap + backdrop click. tsc 0 · build clean. |
| **P0.12** | Onboarding telemetry (keep both pages) | §5.12 | 4h | 🔒 user-decision |  |
| **P1.1** | Merge подвійний `useIsDesktop` | §6.1 | done | ✅ **DONE** | matchMedia canonical у src/lib/hooks/. src/hooks/ deleted. 10 Landing* + 2 app consumers — 12 total. tsc 0. |
| **P1.3** | Heatmap roving tabindex (91 cells) | §6.3 | done | ✅ **DONE** | div→button (Studio+Blossom) + roving tabindex. 91 cells (not 168 — HOURS=[8..20] = 13h×7d). Arrow keys wrap. tsc 0. |
| **P1.4** | WeeklyChart `aria-pressed` (8 toggles) | §6.4 | done | ✅ **DONE** | mode tab aria-pressed (3 themes) + bar aria-label+aria-pressed (Studio+Blossom). tsc 0. |
| **P1.12** | `timingSafeEqual` для CRON_SECRET (5 routes) | §6.12 | done | ✅ **DONE** | New: verifyCronSecret.ts (HMAC sha256). 5 routes patched. tsc 0. |
| **P1.16** | Touch targets ≥44px | §6.16 | done | ✅ **DONE** | 13 files: size-6/7/8/9/10→size-11, h-7→h-11. Studio/Frost ghost close buttons fixed. tsc 0. |

---

## 7. Phase 2 — LIMITED DRY

| Item | Title | §план | Effort | Status | Нотатка |
|---|---|---|---|---|---|
| **P1.5** | Tour system: 2 паралельні → документувати | §6.5 | done | ✅ **DONE** | Задокументовано в SYSTEM_MAP.md. useTour (generic, 6 pages) vs DashboardTourContext (8-step context, 4 consumers). Правило вибору додано. |
| **P1.6** | Mojibake у 4+ міграціях | §6.6 | — | ✅ **FALSE ALARM** | Файли вже UTF-8. `═══` = U+2550 box-drawing art (C-18). Жодних змін не потрібно. |
| **P1.7** | Дубль нумерації міграцій (137×2) | §6.7 | done | ✅ **DONE** | `137_product_type_and_emoji.sql` → `137a_product_type_and_emoji.sql`. Примітка в файлі. |
| **P1.8** | StoryGenerator empty-deps → хуки | §6.8 | 3h | ⏳ TODO |  |
| **P1.9** | PublicMasterPage C2C → useQuery | §6.9 | 1h | ⏳ TODO |  |
| **P1.13** | Remove `formatPrice` dup | §6.13 | — | ✅ done (= P0.11) |  |
| **P1.14** | `useDashboardStore` → `useShallow` | §6.14 | 30m | ⏳ TODO |  |
| **P1.15** | Типи замість `working_hours as any` | §6.15 | 4h+ | ⏳ TODO |  |
| **P2.2** | Видалити 6 unused npm deps (~440KB) | §7.2 | 30m | ⏳ TODO |  |
| **P2.13** | `<th scope="col">` (5 файлів) | §7.13 | 5m | ⏳ TODO |  |
| **P2.14** | FK index `c2c_referrals.master_id` | §7.14 | 1h | ⏳ TODO |  |
| ➖ **P1.2** | Widget dedup ×3 теми | §6.2 | — | ➖ DEFERRED (user) |  |

---

## 8. Phase 3 — TESTS & TYPES ⭐ (user priority)

| Item | Title | §план | Effort | Status |
|---|---|---|---|---|
| **P1.11** | Тести createBooking.ts (20+) + referrals.ts (15+) | §6.11 | 20h | ⏳ TODO |
| **P1.10** | Тести top-5 hooks | §6.10 | 8h | ⏳ TODO |
| **P2.1** | 100+ `as any` → типи + `src/types/database.ts` | §7.1 | 12h | ⏳ TODO |

---

## 9. Phase 4 — POLISH

| Item | Title | §план | Effort | Status |
|---|---|---|---|---|
| **P2.3** | Split top-5 файлів >500 рядків | §7.3 | 16h | ⏳ TODO |
| **P2.4** | `@tanstack/react-virtual` довгі списки | §7.4 | 6h | ⏳ TODO |
| **P2.5** | `React.memo` list-картки | §7.5 | 4h | ⏳ TODO |
| **P2.6** | `.select('*')` cleanup (10) | §7.6 | 2h | ⏳ TODO |
| **P2.7** | Modal/Sheet consolidation | §7.7 | 6h | ⏳ TODO |
| **P2.10** | Sanitize phone у cron логах | §7.10 | 30m | ⏳ TODO |
| **P2.11** | Контраст `text-muted/30-50` → WCAG AA | §7.11 | 4h | ⏳ TODO |
| **P2.12** | 79 inputs без labels | §7.12 | 6h | ⏳ TODO |
| **P2.15** | `useBookings` refetch cascade (6 keys) | §7.15 | 2h | ⏳ TODO |
| **P3.2** | `pluralize`→`pluralUk` (FlashDealPage) | §8.2 | 30m | ⏳ TODO |
| **P3.3** | Decorative `<svg aria-hidden>` | §8.3 | 1h | ⏳ TODO |
| **P3.4** | BottomSheet drag handle `role` | §8.4 | 15m | ⏳ TODO |
| **P3.5** | `outline-none` → `focus:ring` | §8.5 | 30m | ⏳ TODO |
| **P3.6** | admin/loyalty tabs `aria-pressed` | §8.6 | 2h | ⏳ TODO |
| **P3.7** | StepServices tabs `aria-controls` | §8.7 | 30m | ⏳ TODO |
| **P3.8** | File inputs trigger label | §8.8 | 15m | ⏳ TODO |
| **P3.10** | Видалити unused `WAYFORPAY_*` env | §8.10 | 5m | ⏳ TODO |
| ✅ **P3.11** | 0 down migrations — N/A | §8.11 | — | ✅ no-fix |

---

## 📈 Підрахунок

| Severity | Total | ✅/no-fix | 🔒/➖ | ⏳ |
|---|---|---|---|---|
| P0 | 13 | 7 | 2 (P0.4, P0.12) | 4 |
| P1 | 26 | 9 | 1 (P1.2) | 16 |
| P2 | 21 | 0 | 0 | 21 |
| P3 | 11 | 1 | 0 | 10 |

**Закрито повністю:** P0.1, P0.2, P0.3, P0.5, P0.6, P0.7, P0.8, P0.9, P0.10, P0.11, P1.1, P1.3, P1.4, P1.5, P1.6, P1.7, P1.12, P1.13, P1.16, P3.11 (+ N-01)
**Dead code видалено:** ~2,400 рядків / 22 файли
**A11y fixed:** 72 aria-labels + 5 div→button (TodaySchedule · InsightsRow · SegmentConfig · PeakHours×2)
**Security:** P0.1 booking hijack fixed (phone-match + audit table)

---

*Updated: 2026-06-05 S08 — P1.3 ✅ · P1.5 ✅ · P1.6 ✅ (false alarm) · P1.7 ✅ · Next: P1.8 StoryGenerator*
