# 📋 TRACKER.md — Live Status (71 items)

> Live джерело правди про прогрес виконання [MTRP-2026-06-02](../MTRP-2026-06-02.md).
> **Updated:** 2026-06-07 (S19) · **Active phase:** Phase 2 COMPLETE · **Progress:** 48 closed · 2 deferred · 1 blocked
> Легенда: ⏳ TODO · 🔄 IN PROGRESS · ✅ DONE · 🔒 BLOCKED · ⚠️ CORRECTED · ➖ DEFERRED

---

## 🗺️ Progress by Phase

```
Phase 0  HOT FIXES        [████████] 100%  ← all done ✅
Phase 1  SECURITY & A11Y  [███████░]  ~87%  ← done: P0.1·P0.2·P0.7·P1.1·P1.3·P1.4·P1.5·P1.6·P1.7·P1.8·P1.9·P1.12·P1.13·P1.14·P1.15·P1.16 | blocked: P0.12
Phase 2  LIMITED DRY      [████████]  ~95%  ← P2.1·P2.2·P2.3·P2.4·P2.5·P2.6·P2.7·P2.10·P2.11·P2.12·P2.13·P2.14·P2.15 ✅ | COMPLETE
Phase 3  TESTS & TYPES ⭐  [████████] 100%  ← P1.11 ✅ · P1.10 ✅ · P2.1 ✅ — COMPLETE
Phase 4  POLISH           [████████] 100%  ← P3.2·P3.3·P3.4·P3.5·P3.6·P3.7·P3.8·P3.10·P3.11 ALL DONE ✅
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
| C-19 | P2.13 | `LandingBentoFeatures.tsx` `<th>` без scope | `<table role="presentation">` — scope семантично нерелевантний | ⚠️ SKIP — no fix needed |
| C-20 | P2.10 | `reminders/route.ts:57` — phone PII у JSON.stringify | `results` містить тільки counts `{client,master,failed}`. `client_phone` вибирається з DB але не логується | ✅ FALSE ALARM — no fix needed |
| C-21 | P1.15 | `workingHours: data.working_hours` — тип `WorkingHoursConfig` | `WorkingHoursConfig` не має index signature → не assignable до `Record<string,unknown>`. Залишив cast | ⚠️ Cast OK — follow-up: оновити prop type у PublicMasterPage |
| C-22 | P2.11 | «/30-/50 opacity fails WCAG» | Decorative icons, placeholders, disabled states — скіп. Readable text labels: /30→/60, /40→/70, /50→/70-/80 | ✅ DONE S15 — 25 files |

> **Урок 1:** видалення роуту → `rm -rf .next && npm run build` (stale types).
> **Урок 2:** `<button>` атрибути → `tools/scan-buttons.cjs` (AST), не ripgrep.
> **Урок 3 (P0.1):** phone-match verification — порівнювати last 10 digits (нормалізація E.164 варіюється).
> **Урок 4 (P1.6):** `═══` в SQL-файлах = box-drawing Unicode (U+2550), не mojibake. `file` команда = UTF-8.
> **Урок 5 (P1.15):** `interface` без index signature не assignable до `Record<string,unknown>`. Потребує або cast, або `[key: string]: unknown` у типі.
> **Урок 6 (P2.11):** WCAG contrast — skip decorative icons/placeholders/disabled states; only fix readable text. replace_all safe for opacity patterns.

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
| **P0.2** | Admin client leak (~12 zones) + ESLint | §5.2 | done | ✅ **DONE** | 17 files fixed: publicClient + createClient + growth/actions.ts. New: `src/lib/supabase/public.ts` + ESLint rule. |
| **P0.7** | MicaModal → Radix Dialog (focus trap) | §5.7 | done | ✅ **DONE** | Dialog.Content asChild on modal box — focus trap + backdrop click. |
| **P0.12** | Onboarding telemetry (keep both pages) | §5.12 | 4h | 🔒 user-decision |  |
| **P1.1** | Merge подвійний `useIsDesktop` | §6.1 | done | ✅ **DONE** | matchMedia canonical у `src/lib/hooks/`. `src/hooks/` deleted. 12 consumers. |
| **P1.3** | Heatmap roving tabindex (91 cells) | §6.3 | done | ✅ **DONE** | div→button + roving tabindex + Arrow keys. 91 cells (HOURS=[8..20]). |
| **P1.4** | WeeklyChart `aria-pressed` (8 toggles) | §6.4 | done | ✅ **DONE** | mode tab + bar aria-label+aria-pressed (3 themes). |
| **P1.12** | `timingSafeEqual` для CRON_SECRET | §6.12 | done | ✅ **DONE** | NEW: `verifyCronSecret.ts` (HMAC sha256). 5 routes patched. |
| **P1.16** | Touch targets ≥44px | §6.16 | done | ✅ **DONE** | 13 files: size-6/7/8/9/10→size-11. Ghost close buttons fixed. |
| **P1.5** | Tour system documentation | §6.5 | done | ✅ **DONE** | Задокументовано в SYSTEM_MAP.md. useTour vs DashboardTourContext — правило вибору. |
| **P1.6** | Mojibake у 4+ міграціях | §6.6 | — | ✅ **FALSE ALARM** | `═══` = U+2550 box-drawing art (C-18). |
| **P1.7** | Дубль нумерації міграцій (137×2) | §6.7 | done | ✅ **DONE** | `137_` → `137a_`. |
| **P1.8** | StoryGenerator empty-deps → hooks | §6.8 | done | ✅ **DONE** | 3 inline hooks → useQuery (`story-services`, `story-flash-deals`, `story-star-reviews`). |
| **P1.9** | PublicMasterPage C2C → useQuery | §6.9 | done | ✅ **DONE** | `queryKey ['c2c-balance', master.id]`. User fetched inside queryFn. `enabled` guard. staleTime 5min. |
| **P1.14** | `useDashboardStore` → `useShallow` | §6.14 | done | ✅ **DONE** | `zustand/shallow` useShallow: BentoWidget + BentoGrid(5-val) + WidgetLibraryModal. |
| **P1.15** | Типи замість `as any` у `[slug]/page.tsx` | §6.15 | done | ✅ **DONE** | `MasterData`+`MasterServiceRow` у data.ts (+ timezone у SELECT). 7 row types у page.tsx. 0 `as any` залишилось. C-21: `workingHours as Record<string,unknown>` — WorkingHoursConfig lacks index signature. |
| **P1.13** | Remove `formatPrice` dup | §6.13 | — | ✅ done (= P0.11) |  |
| ➖ **P1.2** | Widget dedup ×3 теми | §6.2 | — | ➖ DEFERRED (user) |  |

---

## 7. Phase 2 — LIMITED DRY

| Item | Title | §план | Effort | Status | Нотатка |
|---|---|---|---|---|---|
| **P2.2** | Видалити 6 unused npm deps (~440KB) | §7.2 | done | ✅ **DONE** | marked+isomorphic-dompurify+html-to-image+sonner+@radix-ui/react-slot+class-variance-authority → 50 pkgs removed. |
| **P2.10** | Sanitize phone у cron логах | §7.10 | done | ✅ **DONE** | `sanitizePhone()` у rebooking/route.ts:110,113. reminders/route.ts — no PII in logs (C-20). |
| **P2.13** | `<th scope="col">` (5 файлів) | §7.13 | done | ✅ **DONE** | 3 admin tables (AllianceMap+MastersDir+SystemLogs). LandingBentoFeatures skipped — `role="presentation"` (C-19). |
| **P2.14** | FK index `c2c_referrals.master_id` | §7.14 | done | ✅ **DONE** | `140_c2c_referrals_master_id_index.sql`. ⚠️ Pending `npx supabase db push`. |
| **P2.6** | `.select('*')` cleanup (10 queries) | §7.6 | 2h | ✅ **DONE S13** | 9 queries: useBookings · useBookingById · useServices (insert) · support.ts · marketing×2 · [slug]/actions · [slug]/page · shop/page (schedule). MorningBriefing.tsx template literal → explicit string + TodayBookingRow type. |
| **P2.1** | 100+ `as any` → типи + `src/types/database.ts` | §7.1 | 12h | ✅ **DONE S12** | 70 occurrences in 21 files. Promise<never> pattern for races; inline interface types for Supabase joins; window type extension for gm_authFailure. tsc 0 · build clean. |
| **P2.11** | Контраст `text-muted/30-50` → WCAG AA | §7.11 | 4h | ✅ **DONE S15** | 25 files: /30→/60, /40→/70, /50→/70. Skip: decorative icons, placeholders, disabled/off states. tsc 0. |
| **P2.7** | Modal/Sheet consolidation | §7.7 | 6h | ✅ **DONE S17** | Sheet.tsx (adaptive/dialog/bottom); deleted MicaModal+PopUpModal+BottomSheet; migrated 13 PopUpModal + 2 MicaModal + 5 BottomSheet across all consumers. tsc 0 · build clean. |
| **P2.12** | 79 inputs без labels | §7.12 | 6h | ✅ **DONE S16** | aria-label додано на всі 79 inputs (30+ файлів). Verified: grep `<input` without aria-label → тільки base Input.tsx component (spread props). |
| **P2.15** | `useBookings` refetch cascade (6 keys) | §7.15 | 2h | ✅ DONE S15 | `invalidateBookingQueries.ts` — 6 keys, 7 sites patched |
| **P2.3** | Split top-5 файлів >500 рядків | §7.3 | 16h | ✅ **DONE S18** | StoryGenerator.tsx 1545L→617L; story/ subfolder: StoryCanvas.tsx(187L·React.memo) + storyTypes.ts(95L) + storyConstants.ts(90L) + useStoryData.ts(58L) + storyExport.ts(30L). canvasSharedProps→useMemo. tsc 0 · build clean. |
| **P2.4** | `@tanstack/react-virtual` довгі списки | §7.4 | 6h | ✅ **DONE S19** | `useWindowVirtualizer` (window-scroll) на ClientsPage list view; `measureElement` dynamic height (ResizeObserver); `scrollMargin` via `useLayoutEffect`+`useReducer` forceRerender. `clientsUtils.tsx` leaf module (RETENTION_CONFIG, getAutoTags, ClientIconStack, formatClientName, SmartSegment). tsc 0 · build clean. |
| **P2.5** | `React.memo` list-картки | §7.5 | 4h | ✅ **DONE S19** | `ClientListRow` + `ClientGridCard` — React.memo з локальним note state (editing/noteValue/saving); backward compat re-exports у ClientsPage.tsx для 5 consumers (ClientDetailSheet, ClientWidgets, AnalyticsPage, SegmentBuilder, SegmentConfigWidget). tsc 0 · build clean. |

---

## 8. Phase 3 — TESTS & TYPES ⭐ ✅ COMPLETE

| Item | Title | §план | Effort | Status |
|---|---|---|---|---|
| **P1.11** | Тести createBooking.ts (20+) + referrals.ts (15+) | §6.11 | 20h | ✅ **DONE S11** |
| **P1.10** | Тести top-5 hooks | §6.10 | 8h | ✅ **DONE S11** |
| **P2.1** | 100+ `as any` → типи + `src/types/database.ts` | §7.1 | 12h | ✅ **DONE S12** | 70 occurrences in 21 files. Promise<never> pattern for races; inline interface types for Supabase joins; window type extension for gm_authFailure. tsc 0 · build clean. |

---

## 9. Phase 4 — POLISH (a11y tail) ✅ COMPLETE

| Item | Title | §план | Effort | Status | Нотатка |
|---|---|---|---|---|---|
| **P3.2** | `pluralize`→`pluralUk` (FlashDealPage) | §8.2 | 30m | ✅ **DONE S13** | `pluralize` imported but never used — removed from import. No `pluralUk` needed. |
| **P3.3** | Decorative `<svg aria-hidden>` | §8.3 | 1h | ✅ **DONE S14** | 9 SVGs: 7 aria-hidden (decorative) + 2 role="img"+aria-label (charts). tsc 0. |
| **P3.4** | BottomSheet drag handle `role` | §8.4 | 15m | ✅ **DONE S14** | role="presentation" на drag handle span. |
| **P3.5** | `outline-none` → `focus:ring` | §8.5 | 30m | ✅ **DONE S14** | 11 files: focus:ring-2 focus:ring-primary/20. Skip: Vaul/Radix modal containers (intentional), bg-transparent composed inputs. |
| **P3.6** | admin/loyalty tabs `aria-pressed` | §8.6 | 2h | ✅ **DONE S14+S20** | 4 files: AnalyticsPage · ModerationHub (3 tabs) · AcademyPage · SystemLogsViewer (2 tabs). +S20: StoryGenerator MODES toggle buttons. FlashDealPage — no tab-toggle pattern (plan stale). |
| **P3.7** | StepServices tabs `aria-controls` | §8.7 | 30m | ✅ **DONE S14** | role="tab" + id + aria-controls="services-panel"; tabpanel + aria-labelledby. |
| **P3.8** | File inputs trigger label | §8.8 | 15m | ✅ **DONE S14** | 11 files: aria-hidden="true" + tabIndex={-1} на hidden file inputs. |
| **P3.10** | Видалити unused `WAYFORPAY_*` env | §8.10 | 5m | ✅ **DONE S13** | Removed from .env.local.tmp · .env.prod · .env.vercel. Not referenced in src/. |
| **P3.11** | 0 down migrations — N/A | §8.11 | — | ✅ no-fix |  |

---

## 📈 Підрахунок

| Severity | Total | ✅/done | 🔒/➖ | ⏳ |
|---|---|---|---|---|
| P0 | 13 | 10 | 2 (P0.4, P0.12) | 1 |
| P1 | 26 | 15 | 1 (P1.2) | 10 |
| P2 | 21 | 13 | 0 | 8 |
| P3 | 11 | 9 | 0 | 2 |

**Закрито повністю:** P0.1·P0.2·P0.3·P0.5·P0.6·P0.7·P0.8·P0.9·P0.10·P0.11·P1.1·P1.3·P1.4·P1.5·P1.6·P1.7·P1.8·P1.9·P1.10·P1.11·P1.12·P1.13·P1.14·P1.15·P1.16·P2.1·P2.2·P2.3·P2.4·P2.5·P2.6·P2.7·P2.10·P2.11·P2.12·P2.13·P2.14·P2.15·P3.2·P3.3·P3.4·P3.5·P3.6·P3.7·P3.8·P3.10·P3.11 + N-01 = **48 items**
**Dead code видалено:** ~2,400 рядків / 22 файли
**A11y fixed:** 72 aria-labels + 5 div→button + heatmap roving tabindex (91 cells) + touch targets 13 files + focus:ring 11 files + file input a11y 11 files + aria-pressed 4 files + tab pattern 1 file + SVG aria 9 files + WCAG contrast 25 files
**Security:** P0.1 booking hijack (phone-match + audit table) · P1.12 CRON HMAC sha256
**Types:** P1.15 MasterData interface — 18+ as any removed from [slug]/page.tsx · P2.1 ✅ — 70 `as any` → explicit types in 21 files
**Performance:** P2.4 useWindowVirtualizer (virtual scrolling, dynamic height) · P2.5 React.memo ClientListRow+ClientGridCard

---

*Updated: 2026-06-07 S19 — P2.4 ✅ useWindowVirtualizer+clientsUtils · P2.5 ✅ ClientListRow+ClientGridCard React.memo · 48/71 closed · Next: Phase 1 залишок (P0.12 blocked) або Phase 2 untracked*
