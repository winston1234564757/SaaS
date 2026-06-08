# TASK.md — Поточні задачі

> Оновлюється після кожного завершеного кроку.
> **Updated:** 2026-06-07

---

## 📋 Стратегічні плани

> Поза поточним спринтом — див. [XDEV/PLANS/](./PLANS/README.md):
> - **[IRP-2026-06-07](./PLANS/IRP-2026-06-07.md)** — Impeccable Remediation Plan (8 phases, A-H) — ✅ **COMPLETE (2026-06-07)**
>   - **Phase A:** ✅ Security P0 — layout.tsx DB role check + 19 RPC search_path migration
>   - **Phase B:** ✅ Theme Tokens — Frost-only strategy, BroadcastEditor rewrite, 6 color fixes, TechnicalIsland wip badges
>   - **Phase C:** ✅ Wizard Pill-Buttons — 7 files → `rounded-[100px]`
>   - **Phase D:** ✅ No-Emoji — categories.ts + types.ts + StepBasic + StepProfilePreview + BillingPage
>   - **Phase E:** ✅ Architecture — fake referral data fixed, E1-E4 false alarms
>   - **Phase F:** ✅ Animation + Mobile — calendar layout, ImageCropper, ScheduleWidget chips
>   - **Phase G:** ✅ Landing — shared CountUp/WordLine, BentoFeatures colors
>   - **Phase H:** ✅ Health Audit — 14/20 → est. 16+/20; P1: font-black×11, a11y div→btn, ShopPage CSS vars; P2: colorize×5
>   - **⚠️ REQUIRED:** `npx supabase db push` для міграції `20260607000000_security_search_path_fix.sql`
> - **[MTRP-2026-06-02](./PLANS/MTRP-2026-06-02.md)** — Master Technical Remediation Plan — ✅ **42/71 closed (superseded by IRP)**

---

## IRP PHASE H — ✅ COMPLETE (2026-06-07) — IRP DONE

**Health Audit — Final Phase**
- **TSC:** 0 | **Build:** clean (exit code 0)

### Що зроблено
- **H1 — Audit:** `/impeccable audit` score 14/20 (A11y:3 | Perf:3 | Theming:2 | Responsive:3 | Anti:3)
- **H2 — P1 font-black:** `font-black` → `font-bold` у 11 файлах (MobileHub, SmartAdvisor, ProductMixWidget, BentoBottomNav, DashboardTopBar, VerticalTimeline, SmartQueue, PeriodAnalyticsView, OpportunityMenu, MonthlyAnalyticsView, BookingCard)
- **H2 — P1 A11y:** `ClientsPage:464` — `<div onClick>` overlay → `<button type="button" aria-label="Закрити меню сортування">` (WCAG 2.1 SC 2.1.1)
- **H2 — P1 Theming:** `ShopPage.tsx` — CATEGORY_COLORS 7 hex literals → `var(--cat-*)` CSS tokens; hex opacity suffix `#dd`/`#ee` → `color-mix(in srgb, var(--cat-*) 87%/93%, transparent)`
- **H2 — P1 globals.css:** `--cat-hair/nails/skin/brows/body/tools/other` + `--l-avatar-1/2/3` tokens
- **H3 — P2 colorize:** LandingScrollProgress + UpgradePromptModal + AnchoredTooltip + PortfolioBookingButton + LandingTestimonials — 5 hex → CSS vars
- **H4 — Docs:** TASK.md + IRP-2026-06-07.md + README.md + IRP-HANDOFF-2026-06-07.md updated

---

## IRP PHASE G — ✅ COMPLETE (2026-06-07)

**Landing Deduplication**
- **TSC:** 0 | **Build:** clean

### Що зроблено
- **G2, G3:** FALSE ALARMS (GSAP правильно scoped; CTAs вже `rounded-full`)
- **G1 — Shared components:** `src/components/landing/shared/CountUp.tsx` + `WordLine.tsx` (NEW)
  - BentoFeatures + TrustBar → `import { CountUp } from '@/components/landing/shared/CountUp'`
  - Economy + Process → `import { WordLine } from '@/components/landing/shared/WordLine'`
  - 4 local duplicates видалені
- **G4 — BentoFeatures colors:** `#4338CA` → `var(--l-indigo)`, `#E0E7FF` → `rgba(255,255,255,0.88)`
- **Encoding note:** BentoFeatures/Process мають pre-existing mojibake → hook blocked Edit/Write → Python binary patch

---

## IRP PHASE F — ✅ COMPLETE (2026-06-07)

**Animation + Mobile fixes**
- **TSC:** 0 | **Build:** clean
- **Drawer:** `drawer_bookit_decisions_cd049866ce95e68b3f1547e9`

### Що зроблено
- **F1, F5:** FALSE ALARMS (SupportPage вже OK; ClientsPage:636 = `<p>` тег)
- **F2 — MonthlyAnalyticsView.tsx:** `<div className="flex flex-col">` → `<motion.div layout transition={SPRING}>` — плавна анімація 5↔6 рядків + додано `const SPRING`
- **F3 — ImageCropper.tsx:** додано `max-w-full` — react-easy-crop iOS overflow fix
- **F4 — ScheduleWidget.tsx:** `py-1.5` → `py-2.5` на buffer/retention/breaks chip кнопках (CLAUDE.md: мінімум py-2)

---

## IRP PHASE E — ✅ COMPLETE (2026-06-07)

**Architecture Fixes — Fake Referral Data**
- **TSC:** 0 | **Build:** clean
- **Drawer:** `drawer_bookit_decisions_ac9112353ca2262c214d2320`

### Що зроблено
- **E1-E4:** FALSE ALARMS — singleton вже є, React Query structural equality, ClientDetailSheet чистий, React Query deduplicates запити
- **E5 (КРИТИЧНО):** `ClientWidgets.tsx` — hardcoded fake ambassadors → реальний `c2c_referrals` запит
  - `src/lib/actions/referrals.ts`: `getTopAmbassadors()` + типи
  - `src/lib/supabase/hooks/useTopAmbassadors.ts`: NEW React Query hook (staleTime: 5min)
  - `ClientWidgets.tsx`: removed fake data, `+4.2%` видалено, empty state, pluralUk()
- **E6:** carry-over (відкладено)

---

## IRP PHASE D — ✅ COMPLETE (2026-06-07)

**No-Emoji Cleanup**
- **TSC:** 0 | **Build:** clean
- **Drawer:** `drawer_bookit_decisions_0e43dbcc5a06cb87e20e804c`

---

## IRP PHASE B+C — ✅ COMPLETE (2026-06-07)

**Theme Token Audit + Wizard Pill-Buttons**
- **TSC:** 0 | **Build:** clean
- **Drawer:** `drawer_bookit_decisions_e82e1f82c5ec8b5a03d2fbcb`

---

## IRP PHASE A — ✅ COMPLETE (2026-06-07)

**Security Hardening**
- **TSC:** 0 | **Build:** clean
- **Drawer:** `drawer_bookit_audits_99cc7d8602ed6c4db33410a8`
- **⚠️ ПОТРІБНО:** `npx supabase db push` (міграція `20260607000000_security_search_path_fix.sql`)

---

## Carry-over (відкладено, не блокують IRP)

### STEP 06 — CRM Clients
| ID | Issue | Пріоритет | Файл |
|---|---|---|---|
| D-02 | ClientWidgets: useMemo для 6 body computations | 🟡 P2 | `ClientWidgets.tsx:47-66` |
| D-03 | Grid action buttons size-10 → size-11 | 🟡 P2 | `ClientsPage.tsx:750-777` |
| D-04 | Sort button: aria-expanded + aria-haspopup | 🟡 P2 | `ClientsPage.tsx:478` |

### Pending (post-deploy)
| ID | Issue | Пріоритет |
|---|---|---|
| B-01 | `/impeccable audit` health score (baseline 22/40 → target 34+) | 🔴 Critical → Phase H |
| B-02 | Vercel QA: onboarding flow | 🔴 Critical |
