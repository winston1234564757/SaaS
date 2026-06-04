# 📋 TRACKER.md — Live Status (71 items)

> Live джерело правди про прогрес виконання [MTRP-2026-06-02](../MTRP-2026-06-02.md).
> **Updated:** 2026-06-04 · **Active phase:** Phase 0 · **Progress:** 4 / 71 closed (P0.3 ✅, P0.10 🔄, P0.11 🔄, + corrections)
> Легенда: ⏳ TODO · 🔄 IN PROGRESS · ✅ DONE · 🔒 BLOCKED · ⚠️ CORRECTED · ➖ DEFERRED

---

## 🗺️ Progress by Phase

```
Phase 0  HOT FIXES        [███░░░░░] ~40%  ← active (dead code зроблено, a11y+security лишилось)
Phase 1  SECURITY & A11Y  [░░░░░░░░]   0%
Phase 2  LIMITED DRY      [░░░░░░░░]   0%
Phase 3  TESTS & TYPES ⭐ [░░░░░░░░]   0%  ← user priority
Phase 4  POLISH           [░░░░░░░░]   0%
```

---

## ⚠️ Plan Corrections & New Findings

> Розбіжності план↔реальний код, знайдені під час VERIFY. **Читати перед виконанням відповідних items.**

| # | Item | План казав | Реальність (verified 2026-06-04) | Дія |
|---|---|---|---|---|
| C-01 | P0.10 | «11 root widgets, 0 importers, видалити всі» | Лише **5** мертві (WeeklyChart, MonthlyCalendar, PeakHours, NextFreeDays, CancellationRate). | ✅ видалено 5 |
| C-02 | P0.10 | `ScheduleWidget` (root) — мертвий | **ЖИВИЙ**: import у `SettingsPage.tsx` + `BentoGrid.tsx` | ⚠️ лишено |
| C-03 | P0.10 | `InsightsRow/QuickActions/FreeSlots/TopServices/ChannelHealth` (root) — мертві | Живі лише через dev-сторінку `(public)/auth/blocks-test/page.tsx` | 🔒 → N-01 |
| C-04 | P0.11 / P0.6 | Суперечність: P0.11 «видалити ScheduleDrawer», P0.6 «додати aria-label» | 0 importers → справді мертвий | ✅ видалено |
| N-01 | NEW | — | `(public)/auth/blocks-test/page.tsx` — dev-харнес у проді, єдиний споживач 5 root-widgets. Публічний роут. | 🔒 рішення: видалити сторінку+5 віджетів разом |

---

## 5. Phase 0 — HOT FIXES

| Item | Title | Scope / §план | Effort | Status | Нотатка |
|---|---|---|---|---|---|
| **P0.3** | old_BookingsPage.tsx 0-byte stub | root · §5.3 | 5m | ✅ **DONE** | Видалено 2026-06-04, commit `dead-code` |
| **P0.11** | ~3,500 рядків dead code | §5.11 | 30m | 🔄 **IN PROGRESS** | Файли видалено (9). Лишилось: trim експортів — див. під-таблицю ↓ |
| **P0.10** | root-level dead widgets | §5.10 | 30m | 🔄 **IN PROGRESS** | 5/11 видалено (див. C-01..C-03). ScheduleWidget лишено. 5 чекають N-01 |
| **P0.5** | 209 кнопок без `type="button"` | §5.5 | 1h | ⏳ TODO | Bulk Edit Protocol. Технічні — без humanizer |
| **P0.6** | 30+ icon-only без `aria-label` | §5.6 | 3h | ⏳ TODO | UA-лейбли (технічні). Список файлів у §5.6 |
| **P0.1** | linkBookingToClient booking hijack | `[slug]/actions.ts` · §5.1 | 4h | 🔒 **BLOCKED** | Потрібно рішення Q1 (phone-match/magic-link/OTP) + міграція `139_*`. Прочитати поточний код перед фіксом |

### P0.11 — під-чеклист
| Файл / ціль | Status |
|---|---|
| `onboarding/steps/StepChannels.tsx` | ✅ deleted |
| `onboarding/steps/StepServicesPrompt.tsx` | ✅ deleted |
| `onboarding/steps/StepSchedulePrompt.tsx` | ✅ deleted |
| `settings/widgets/ScheduleDrawer.tsx` (235L) | ✅ deleted |
| `lib/supabase/hooks/useVacation.ts` | ✅ deleted |
| `bookings/dashboard/BulkActionToolbar.tsx` | ✅ deleted |
| `dashboard/ProfileStrengthWidget.tsx` | ✅ deleted |
| `scratch_test_new_portfolio.ts` (58L) | ✅ deleted |
| `supabase/tests/referral_system_test.sql` (353L) | ✅ deleted |
| `lib/utils/currency.ts` → remove `formatPrice` | ⏳ TODO (verify importers) |
| `lib/utils/dates.ts` → remove `formatTime`/`formatDayFull`/`pluralize` | ⏳ TODO (verify) |
| `lib/utils/broadcastUtils.ts` → remove 5 exports | ⏳ TODO (verify) |
| `lib/billing/pricing.ts` → remove `TierProgress`/`BillingInput` | ⏳ TODO (verify) |

### P0.10 — під-чеклист
| root widget | verified | Status |
|---|---|---|
| `WeeklyChartWidget.tsx` (244L) | 0 imp | ✅ deleted |
| `MonthlyCalendarWidget.tsx` (420L) | 0 imp | ✅ deleted |
| `PeakHoursWidget.tsx` (161L) | 0 imp | ✅ deleted |
| `NextFreeDaysWidget.tsx` (87L) | 0 imp | ✅ deleted |
| `CancellationRateWidget.tsx` (90L) | 0 imp | ✅ deleted |
| `ScheduleWidget.tsx` | **2 imp** | ⚠️ KEEP (alive) |
| `InsightsRow.tsx` | blocks-test | 🔒 N-01 |
| `QuickActionsWidget.tsx` | blocks-test | 🔒 N-01 |
| `FreeSlotsWidget.tsx` | blocks-test | 🔒 N-01 |
| `TopServicesWidget.tsx` | blocks-test | 🔒 N-01 |
| `ChannelHealthWidget.tsx` | blocks-test | 🔒 N-01 |

➖ **P0.4** secrets audit — DEFERRED (§5.4)

---

## 6. Phase 1 — SECURITY & A11Y

| Item | Title | §план | Effort | Status |
|---|---|---|---|---|
| **P0.2** | Admin client leak (18 forbidden zones) + ESLint | §5.2 | 8h | ⏳ TODO |
| **P0.7** | MicaModal → Radix Dialog (focus trap) | §5.7 | 6h | ⏳ TODO |
| **P0.8** | 9 `<div onClick>` → `<button>` | §5.8 | 4h | ⏳ TODO |
| **P0.9** | 11 `<a href onClick>` → `<button>` | §5.9 | 2h | ⏳ TODO |
| **P0.12** | Onboarding telemetry (keep both pages) | §5.12 | 4h | 🔒 user-decision (1 тиж телеметрії) |
| **P1.1** | Merge подвійний `useIsDesktop` | §6.1 | 1h | ⏳ TODO |
| **P1.3** | Heatmap roving tabindex (168 cells) | §6.3 | 3h | ⏳ TODO |
| **P1.4** | WeeklyChart `aria-pressed` (8 toggles) | §6.4 | 30m | ⏳ TODO |
| **P1.12** | `timingSafeEqual` для CRON_SECRET (5 routes) | §6.12 | 30m | ⏳ TODO |
| **P1.16** | Touch targets ≥44px (14+ файлів) | §6.16 | 3h | ⏳ TODO |

---

## 7. Phase 2 — LIMITED DRY

| Item | Title | §план | Effort | Status |
|---|---|---|---|---|
| **P1.5** | Tour system: 2 паралельні → задокументувати | §6.5 | 3h | ⏳ TODO |
| **P1.6** | Mojibake у 4+ міграціях | §6.6 | 1h | ⏳ TODO |
| **P1.7** | Дубль нумерації міграцій (137×2) | §6.7 | 5m | ⏳ TODO |
| **P1.8** | StoryGenerator empty-deps → хуки | §6.8 | 3h | ⏳ TODO |
| **P1.9** | PublicMasterPage C2C → useQuery | §6.9 | 1h | ⏳ TODO |
| **P1.13** | Remove `formatPrice` dup | §6.13 | 5m | ⏳ TODO (= частина P0.11) |
| **P1.14** | `useDashboardStore` → `useShallow` | §6.14 | 30m | ⏳ TODO |
| **P1.15** | Типи замість `working_hours as any` | §6.15 | 4h+ | ⏳ TODO (start P2.1) |
| **P2.2** | Видалити 6 unused npm deps (~440KB) | §7.2 | 30m | ⏳ TODO |
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
| **P2.4** | `@tanstack/react-virtual` для довгих списків | §7.4 | 6h | ⏳ TODO |
| **P2.5** | `React.memo` для list-карток | §7.5 | 4h | ⏳ TODO |
| **P2.6** | `.select('*')` cleanup (10 місць) | §7.6 | 2h | ⏳ TODO |
| **P2.7** | Modal/Sheet consolidation | §7.7 | 6h | ⏳ TODO |
| **P2.10** | Sanitize phone у cron логах | §7.10 | 30m | ⏳ TODO |
| **P2.11** | Контраст `text-muted/30-50` → WCAG AA | §7.11 | 4h | ⏳ TODO |
| **P2.12** | 79 inputs без labels | §7.12 | 6h | ⏳ TODO |
| **P2.15** | `useBookings` refetch cascade (6 keys) | §7.15 | 2h | ⏳ TODO |
| **P3.2** | `pluralize` → `pluralUk` (FlashDealPage) | §8.2 | 30m | ⏳ TODO |
| **P3.3** | Decorative `<svg aria-hidden>` | §8.3 | 1h | ⏳ TODO |
| **P3.4** | BottomSheet drag handle `role` | §8.4 | 15m | ⏳ TODO |
| **P3.5** | `outline-none` → `focus:ring` | §8.5 | 30m | ⏳ TODO |
| **P3.6** | admin/loyalty tabs `aria-pressed` | §8.6 | 2h | ⏳ TODO |
| **P3.7** | StepServices tabs `aria-controls` | §8.7 | 30m | ⏳ TODO |
| **P3.8** | File inputs trigger label | §8.8 | 15m | ⏳ TODO |
| **P3.10** | Видалити unused `WAYFORPAY_*` env | §8.10 | 5m | ⏳ TODO |
| ✅ **P3.11** | 0 down migrations — N/A (Supabase convention) | §8.11 | — | ✅ no-fix |

> **Cross-refs (не окремі items):** P1.6↔P3.1 (mojibake), P1.13↔P0.11 (formatPrice), P2.8↔P1.5 (tour docs), P2.9↔P0.6 (BottomSheet a11y), P1.17-26 / P2.16-21 — посилання на вже перелічені.

---

## 📈 Підрахунок

| Severity | Total | ✅/no-fix | 🔄 | 🔒/➖ | ⏳ |
|---|---|---|---|---|---|
| P0 | 13 | 1 | 2 | 3 (P0.1, P0.4, P0.12) | 7 |
| P1 | 26 | 0 | 0 | 1 (P1.2) | 25 |
| P2 | 21 | 0 | 0 | 0 | 21 |
| P3 | 11 | 1 | 0 | 0 | 10 |

---

*Updated: 2026-06-04 — Phase 0 dead-code batch · Next: P0.11 export-trim + P0.5 type=button*
