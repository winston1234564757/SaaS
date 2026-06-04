# 📋 TRACKER.md — Live Status (71 items)

> Live джерело правди про прогрес виконання [MTRP-2026-06-02](../MTRP-2026-06-02.md).
> **Updated:** 2026-06-04 (S04) · **Active phase:** Phase 0→1 · **Progress:** 8 closed (P0.3·P0.5·P0.6·P0.8·P0.10·P0.11·P1.13·P3.11) · 2 deferred · 3 blocked
> Легенда: ⏳ TODO · 🔄 IN PROGRESS · ✅ DONE · 🔒 BLOCKED · ⚠️ CORRECTED · ➖ DEFERRED

---

## 🗺️ Progress by Phase

```
Phase 0  HOT FIXES        [████████] ~93%  ← dead-code ✅ · P0.5 ✅(204) · P0.6 ✅(72) · P0.8 ✅(3) · P0.1 🔒
Phase 1  SECURITY & A11Y  [░░░░░░░░]   0%  ← P0.9 next (~7 a→button) → P0.1 security
Phase 2  LIMITED DRY      [░░░░░░░░]   0%
Phase 3  TESTS & TYPES ⭐ [░░░░░░░░]   0%  ← user priority
Phase 4  POLISH           [░░░░░░░░]   0%
```

---

## ⚠️ Plan Corrections & New Findings

> Розбіжності план↔реальний код, знайдені під час VERIFY. **Читати перед виконанням відповідних items.**

| # | Item | План казав | Реальність (verified 2026-06-04) | Дія |
|---|---|---|---|---|
| C-01 | P0.10 | «11 root widgets, 0 importers, видалити всі» | Лише **5** мертві | ✅ видалено 5 (S01) |
| C-02 | P0.10 | `ScheduleWidget` (root) — мертвий | **ЖИВИЙ**: `SettingsPage.tsx` + `BentoGrid.tsx` | ⚠️ лишено |
| C-03 | P0.10 | 5 root widgets мертві | Живі лише через dev-сторінку `blocks-test` | ✅ resolved (N-01) |
| C-04 | P0.11/P0.6 | «видалити ScheduleDrawer» vs «aria-label» | 0 importers → справді мертвий | ✅ видалено (S01) |
| N-01 | NEW | — | `blocks-test/page.tsx` — dev-харнес у проді, споживач 6 root-widgets | ✅ RESOLVED — видалено |
| C-05 | P0.11 | `broadcastUtils.ts` — «видалити 5 експортів» | ЖИВИЙ: юзає `marketing/actions.ts` + тести | ⚠️ KEPT |
| C-06 | P0.11 | `pricing.ts` BillingInput/TierProgress | Internal param + public return type (ReferralPage+тести) | ⚠️ KEPT |
| C-07 | P0.5 | ⚠️ я спершу хибно закрив (grep false-negative) | AST-парсер `tools/scan-buttons.cjs` → **204** без type (з 595). Flat ripgrep multiline ненадійний для `<button>` зі стрілками `=>` | 🔄 REOPENED |
| C-08 | P0.11 | `dates.ts pluralize` — «видалити» | Юзає `FlashDealPage`; `pluralUk` інша сигнатура | 🔒 → P3.2 |
| C-09 | P0.9 | `StatsMosaicWidget.tsx` — «11 `<a href onClick>` violations» | `StatsMosaicWidget` видалено в S02 dead-code. Реальних `<a onClick>` — ~7, не 11 | ⚠️ CORRECTED |
| C-10 | P0.8 | «9 `<div onClick>` violations» | frost/studio InsightsRow, blossom/WeeklyChart, MonthlyCalendar вже `<button>` — виправлено раніше. **Лишилось 3 реальних:** `TodaySchedule.tsx:121`, `blossom/InsightsRow.tsx:89`, `SegmentConfigWidget.tsx:45`. stopPropagation-дівки (#2,#3) — P3 (не interactive) | ✅ DONE S04 |
| C-11 | P0.6 | Сканер: «~247 кандидатів, реально ~120» | Свіжий скан 2026-06-04: **210 кандидатів** (icons=[] = false-positives, Loader2 = loading states). 42 done → ~168 сканер-залишок → реально ~70-80 icon-only. Більше ніж план оцінював | ⚠️ CORRECTED — more scope |
| C-12 | P0.2 | `auth/callback/route.ts`, `r/[code]/route.ts` — у таблиці violations | Це **route handlers** (API zone) — admin client законний. Виключити з violations. Реальних non-API порушень ~12, не 18 | ⚠️ CORRECTED — ~12 not 18 |

> **Урок 1 (WORKFLOW):** видалення **роуту** лишає stale `.next/types` → tsc/build падають → `rm -rf .next && npm run build`.
> **Урок 2 (WORKFLOW):** для детекції `<button>` атрибутів — НЕ ripgrep, а `tools/scan-buttons.cjs` (brace-aware AST). Grep дає false-negatives.

---

## 5. Phase 0 — HOT FIXES

| Item | Title | Scope / §план | Effort | Status | Нотатка |
|---|---|---|---|---|---|
| **P0.3** | old_BookingsPage.tsx stub | root · §5.3 | 5m | ✅ **DONE** | Видалено S01 |
| **P0.10** | root-level dead widgets | §5.10 | 30m | ✅ **DONE** | 11 видалено (S01:5 + S02:6/N-01). ScheduleWidget лишено — живий (C-02) |
| **P0.11** | dead code (~2,400 рядків) | §5.11 | 30m | ✅ **DONE** | 9 файлів + 3 dead-експорти. broadcastUtils/pricing KEPT (C-05/C-06). pluralize→P3.2 |
| **P0.5** | кнопки без `type="button"` (204) | §5.5 | done | ✅ **DONE** | 204 типізовано: 192 codemod + 7 ClientAuthSheet + 3 primitives + 2 NO-onClick manual. Re-scan: **0 missing** |
| **P0.6** | icon-only без `aria-label` | §5.6 | done | ✅ **DONE** | 72 buttons across ~35 files (batches 1-12, S01-S04). Scanner 180 залишок = false-positives |
| **P0.8** | 3 `<div onClick>` → `<button>` (C-10) | §5.8 | done | ✅ **DONE** | TodaySchedule:121 · blossom/InsightsRow:89 · SegmentConfigWidget:45 · S04 |
| **P0.1** | linkBookingToClient booking hijack | `[slug]/actions.ts` · §5.1 | 4h | 🔒 **BLOCKED** | Рішення Q1 = phone-match + `link_attempts` + rate-limit. Міграція `139_*`. |

➖ **P0.4** secrets audit — DEFERRED (§5.4)

### P0.11 — під-чеклист (done S01/S02)
9 файлів видалено · `currency.formatPrice` ✅ · `dates.formatTime/formatDayFull` ✅ · `dates.pluralize` 🔒P3.2 · `broadcastUtils` ⚠️KEPT · `pricing` ⚠️KEPT

### P0.10 — під-чеклист (done)
11 dead-віджетів + `blocks-test` route видалено. `ScheduleWidget` (root) ⚠️ KEEP — живий (2 importers).

---

## 6. Phase 1 — SECURITY & A11Y

| Item | Title | §план | Effort | Status |
|---|---|---|---|---|
| **P0.2** | Admin client leak (~12 forbidden zones) + ESLint | §5.2 | 8h | ⏳ TODO |
| **P0.7** | MicaModal → Radix Dialog (focus trap) | §5.7 | 6h | ⏳ TODO |
| **P0.9** | ~7 `<a href onClick>` (C-09: StatsMosaicWidget gone) | §5.9 | done | ✅ **DONE** | 0 реальних порушень — всі `<a href onClick>` легітимні (Telegram deep-links, tel:, legal pages). План мав застарілі номери рядків. |
| **P0.12** | Onboarding telemetry (keep both pages) | §5.12 | 4h | 🔒 user-decision |
| **P1.1** | Merge подвійний `useIsDesktop` | §6.1 | 1h | ⏳ TODO |
| **P1.3** | Heatmap roving tabindex (168 cells) | §6.3 | 3h | ⏳ TODO |
| **P1.4** | WeeklyChart `aria-pressed` (8 toggles) | §6.4 | 30m | ⏳ TODO |
| **P1.12** | `timingSafeEqual` для CRON_SECRET (5 routes) | §6.12 | 30m | ⏳ TODO |
| **P1.16** | Touch targets ≥44px (14+ файлів) | §6.16 | 3h | ⏳ TODO |

---

## 7. Phase 2 — LIMITED DRY

| Item | Title | §план | Effort | Status |
|---|---|---|---|---|
| **P1.5** | Tour system: 2 паралельні → документувати | §6.5 | 3h | ⏳ TODO |
| **P1.6** | Mojibake у 4+ міграціях | §6.6 | 1h | ⏳ TODO |
| **P1.7** | Дубль нумерації міграцій (137×2) | §6.7 | 5m | ⏳ TODO |
| **P1.8** | StoryGenerator empty-deps → хуки | §6.8 | 3h | ⏳ TODO |
| **P1.9** | PublicMasterPage C2C → useQuery | §6.9 | 1h | ⏳ TODO |
| **P1.13** | Remove `formatPrice` dup | §6.13 | — | ✅ done (= P0.11) |
| **P1.14** | `useDashboardStore` → `useShallow` | §6.14 | 30m | ⏳ TODO |
| **P1.15** | Типи замість `working_hours as any` | §6.15 | 4h+ | ⏳ TODO |
| **P2.2** | Видалити 6 unused npm deps (~440KB) | §7.2 | 30m | ⏳ TODO (verify кожен) |
| **P2.13** | `<th scope="col">` (5 файлів) | §7.13 | 5m | ⏳ TODO |
| **P2.14** | FK index `c2c_referrals.master_id` | §7.14 | 1h | ⏳ TODO (міграція `141_*`) |
| ➖ **P1.2** | Widget dedup ×3 теми | §6.2 | — | ➖ DEFERRED (user) |

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
| **P3.2** | `pluralize`→`pluralUk` (FlashDealPage) + del pluralize | §8.2 | 30m | ⏳ TODO (unblocks C-08) |
| **P3.3** | Decorative `<svg aria-hidden>` | §8.3 | 1h | ⏳ TODO |
| **P3.4** | BottomSheet drag handle `role` | §8.4 | 15m | ⏳ TODO |
| **P3.5** | `outline-none` → `focus:ring` | §8.5 | 30m | ⏳ TODO |
| **P3.6** | admin/loyalty tabs `aria-pressed` | §8.6 | 2h | ⏳ TODO |
| **P3.7** | StepServices tabs `aria-controls` | §8.7 | 30m | ⏳ TODO |
| **P3.8** | File inputs trigger label | §8.8 | 15m | ⏳ TODO |
| **P3.10** | Видалити unused `WAYFORPAY_*` env | §8.10 | 5m | ⏳ TODO |
| ✅ **P3.11** | 0 down migrations — N/A | §8.11 | — | ✅ no-fix |

> **Cross-refs:** P1.6↔P3.1 (mojibake) · P1.13↔P0.11 · P2.8↔P1.5 · P2.9↔P0.6 · P1.17-26/P2.16-21 — посилання.

---

## 📈 Підрахунок

| Severity | Total | ✅/no-fix | 🔄 | 🔒/➖ | ⏳ |
|---|---|---|---|---|---|
| P0 | 13 | 6 | 0 | 3 (P0.1, P0.4, P0.12) | 4 |
| P1 | 26 | 1 | 0 | 1 (P1.2) | 24 |
| P2 | 21 | 0 | 0 | 0 | 21 |
| P3 | 11 | 1 | 0 | 0 | 10 |

**Закрито повністю:** P0.3, P0.5, P0.6, P0.8, P0.10, P0.11, P1.13, P3.11 (+ N-01)
**Dead code видалено:** ~2,400 рядків / 22 файли · **a11y:** 72 aria-labels + 3 div→button

---

*Updated: 2026-06-04 S04 — P0.6 ✅ + P0.8 ✅ · Next: P0.9 (~7 a→button) → P0.1 security*
