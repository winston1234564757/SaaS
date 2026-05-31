# Analytics — Full Audit

> **Date:** 2026-05-31 | **Scope:** 5 files — 1 route page (25 lines), 1 loading (20 lines), 1 dynamic loader (21 lines), 1 component (991 lines), 1 hook (451 lines)
> **Commands:** audit ✅ | critique ✅ | animate ✅ | polish ✅ | layout ✅ | overdrive ✅ | live ⚠️ (no browser) | optimize ✅

---

## A — Audit (8-block)

### 1. Heuristics (29/40)

| # | Principle | Score | Evidence |
|---|---|---|---|
| 1 | Visibility of system status | 3/4 | Skeleton loading states for every section. Error state with retry button. Refresh spinner via `isFetching`. -1: No success feedback after CSV export |
| 2 | Match system to real world | 4/4 | Full Ukrainian. Familiar business concepts (виручка, записи, середній чек). Revenue forecast with plain-language explanation |
| 3 | User control & freedom | 3/4 | Free date range navigation. Client bottom sheet. -1: Chart bars are `<div>` with onClick (no keyboard access, missing roles) |
| 4 | Consistency & standards | 1/4 | **12/12 buttons miss `type="button"` (100%).** **13 div→button violations** (chart bars). **8 hardcoded hex colors.** **7 emoji violations.** `var(--btn-primary-bg)` outlier token |
| 5 | Error prevention | 3/4 | React Query handles errors globally. -1: No confirmation on CSV export |
| 6 | Recognition vs recall | 3/4 | Icons + labels on all sections. Chart tooltip on hover. -1: Chart bars lack `aria-label` |
| 7 | Flexibility & efficiency | 3/4 | CSV export, date range presets, refresh button. -1: No chart image export, no shareable links |
| 8 | Aesthetic & minimalist | 2/4 | 7 emoji degrade professional feel. 8 hardcoded hex makes theme switching imperfect. Layout otherwise clean |
| 9 | Error diagnosis & recovery | 4/4 | Full error state with retry. Error propagation from React Query to UI |
| 10 | Help & documentation | 3/4 | Empty state with 3-step action guide. Onboarding tour (2 steps). -1: Emoji in tour tooltip titles |

### 2. Cognition (13/20)

| Factor | Score | Notes |
|---|---|---|
| Information Architecture | 4/5 | Date range → Summary → Retention → Revenue chart → Day distribution → Forecast → Services → Products → Export. Logical B2B analytics flow |
| Data Density | 3/5 | 10+ data sections. Rich but potentially overwhelming for casual users |
| Scannability | 3/5 | Summary cards with big numbers = quick scan. Charts require deliberate reading |
| Visual Hierarchy | 3/5 | Header → Summary → bento grid. Forecast gets large display. OK but could be tighter |
| Chunking | 3/5 | Each chart/metric in its own bento-card. Some sections (3-col bento mini) densely packed |
| Consistency | 3/5 | Two different chart bar patterns (DowChart vs MonthBarChart) with slightly diverging styles |
| Learning Curve | 3/5 | Standard analytics layout. Date range picker is intuitive. Forecast formula explanation helps |
| Memory Load | 3/5 | All data on one scrollable page. No hidden drill-downs except client sheet |

### 3. Code Quality (12/20)

| Factor | Score | Notes |
|---|---|---|
| TypeScript usage | 5/5 | Rich interfaces in useAnalytics.ts: AnalyticsData, BentoData, TopService, TopClient, RetentionData |
| Component Architecture | 4/5 | 8 components, clear separation. -1: ClientSheetById fetches inline (should be in hook) |
| Code Duplication | 3/5 | DowChart and MonthBarChart share identical activeBar + useEffect click-outside pattern. Tooltip div structure duplicated |
| Data Architecture | 4/5 | useAnalytics hook cleanly separates data from UI. React Query caching with staleTime, parallel Promise.all |
| Theme Discipline | 2/5 | **8 hardcoded hex values:** summary card colors (#789A99, #D4935A, #5C9E7A), retention (#D4935A, #789A99, #5C9E7A), revenue breakdown (#789A99, #D4935A99, #5C9E7A99). Plus `var(--btn-primary-bg)` outlier custom token |
| A11y (type/role) | 1/5 | 12/12 buttons no type, **13 div→button violations** (chart bars clickable divs), 0 aria-labels on chart bars |
| Emoji discipline | 2/5 | 7 emoji violations: 2 in tooltip titles, 4 in empty state guide, 1 in forecast celebration |
| Animation code | 3/5 | Single SPRING config shared everywhere. Simpler than Academy's 5 named springs. Chart delay staggering works |

### 4. Accessibility

| Metric | Count | Notes |
|---|---|---|
| `type="button"` | **0/12 (0%)** | Match admin's worst. All preset, nav, refresh, export, service, and client buttons fail |
| `div → button` | **13 violations (P0)** | 7 DowChart bars + 6 MonthBarChart bars all use `<div>` with `onClick` + `onMouseEnter` + `onMouseLeave` |
| `aria-label` | 0 | Chart bars, icon buttons all lack labels |
| `aria-pressed` | 0 | Chart bars should have `aria-pressed`, Dow bars should be interactive |
| `role` | 0 | Chart bars no `role="button"`, tab bar no `role="tablist"` |
| Touch targets | ⚠️ | Date range nav buttons 32px (py-2 = 8px, text-xs ~12px, 8+12+8=28). Below 44px ❌ |
| Emoji | **7 violations** | Line 443 (💰), 552 (🔗), 559 (⚡), 566 (✍️), 601 (📊), 887 (🎉) |
| Focus rings | ❌ | No visible focus indicators |

### 5. Animations

| Aspect | Score | Notes |
|---|---|---|
| Single SPRING config | 3/5 | `{ type: 'spring', stiffness: 300, damping: 30 }` shared everywhere. Works but no nuance |
| Chart bar entrance | 4/5 | `initial={{ height: 0 }}` → `animate={{ height: h }}` with per-bar delay. Good |
| Tooltip tooltip | 4/5 | AnimatePresence with opacity+y. Correct exit animation |
| Section entrance | 3/5 | opacity+y per section. No stagger between sections |
| ProUpgradeCard | 3/5 | opacity+y with blob decorative blurs. Occult blob a bit AI-slop adjacent |
| Refresh spinner | 3/5 | `animate-spin` on RefreshCw during fetch |
| `prefers-reduced-motion` | ❌ | Missing |

### 6. Systemics (Cross-zone)

| Pattern | Analytics | vs Products (best) | vs Academy |
|---|---|---|---|
| `type="button"` | 0% (0/12) | Tied worst with admin (0%) | Academy 0% — consistent fail across all modules |
| div→button | **13 violations** | Worst — Products had 0, Academy 0 | Worst ever |
| Hardcoded hex | **8 values** | Worst — Products 0, Academy 0 | Worst ever |
| Emoji violations | **7** | Worst — Products 1, Academy 0 | Worst ever |
| `var(--btn-primary-bg)` | 2 uses | Same outlier as Products | Consistent bad pattern |
| CSS variables | Partial | Products all `var(--*)` | Worse |
| Loading skeletons | ✅ Per-section | Products has them | Match |
| React Query | ✅ `useAnalytics` hook | Products uses | Match |
| Empty states | ✅ 3-step action guide | Products has | Better detail |
| Onboarding tour | ✅ 2-step tour | Unique to Analytics | — |
| CSV export | ✅ | Unique to Analytics | — |
| Error state | ✅ With retry | Products has | Match |
| Content architecture | Hook-separated (451 lines) | Product is data arrays | Best pattern — data in hook |

### 7. Findings

**P0:** 13 div→button violations (chart bars) — screen readers can't interact, keyboard users can't tab to them

**P1:** 12/12 buttons miss `type="button"` | 8 hardcoded hex colors [#789A99, #D4935A, #5C9E7A] repeated in summary + retention + breakdown | 7 emoji violations | Chart bars lack `aria-label`/`aria-pressed`

**P2:** `var(--btn-primary-bg)` custom token outlier (2 uses) | Duplicated activeBar + click-outside pattern between DowChart and MonthBarChart | Single SPRING config lacks nuance (Academy has 5 named springs) | No `prefers-reduced-motion` | No focus-visible rings

**P3:** No chart image export | No shareable analytics deep links | ClientSheetById fetches data inline instead of via hook

### 8. Summary

| Dimension | Score |
|---|---|
| Heuristics | 29/40 |
| Cognition | 13/20 |
| Code Quality | 12/20 |
| **Total** | **54/80 (C)** |

**Richest data page, worst discipline score.** The content (revenue forecast, retention cohorts, top services/products, day-of-week analysis, CSV export) is genuinely useful — the best analytical depth in the project. But 13 div→button violations, 8 hardcoded hex colors, 7 emoji, and 0% button type compliance make this the least disciplined module audited so far. The hardcoded hex (#789A99, #D4935A, #5C9E7A) are the same retention colors flagged in the Clients audit — a cross-zone systemic issue.

**vs Products (63/80):** Analytics scores 9 points lower. Products had 0 hardcoded hex, 0 emoji (bar 1), and 0 div→button violations. Analytics sacrifices theme discipline for data richness.

---

## B — Critique

**Design Health Score: 26/40 (Nielsen)**

| # | Heuristic | Score | Key Issue |
|---|---|---|---|
| 1 | Visibility of System Status | 3 | No export feedback |
| 2 | Match System / Real World | 4 | Ukrainian, known metrics |
| 3 | User Control and Freedom | 3 | No keyboard chart nav |
| 4 | Consistency and Standards | 1 | Worst: 12 buttons no type, 13 div click |
| 5 | Error Prevention | 3 | Missing export confirmation |
| 6 | Recognition Rather Than Recall | 3 | Chart bars unlabeled |
| 7 | Flexibility and Efficiency | 3 | No chart export |
| 8 | Aesthetic and Minimalist Design | 2 | 7 emoji, 8 hardcoded hex |
| 9 | Error Recovery | 4 | Retry available |
| 10 | Help and Documentation | 3 | Emoji in tour titles |

**Anti-Patterns Verdict:** MODERATE (3/7 flags). Blob decoration in ProUpgradeCard (borderline glassmorphism), tooltip backdrop-filter blur, emoji overload.

**Persona Red Flags:**
- **Sasha (mobile-first):** Chart bars have tiny touch targets, div→button means screen reader can't reach them
- **Olena (desktop boutique):** Can't export charts as images. Hardcoded hex breaks theme switch

---

## C — Animate

**Score: 5/10**

| Component | Animation | Quality |
|---|---|---|
| Chart bar entrance (Month) | height spring, per-bar delay | 4/5 |
| Chart bar entrance (Dow) | height spring, per-bar delay | 4/5 |
| Tooltip tooltips | AnimatePresence, opacity+y | 4/5 |
| Section entrance | opacity+y, no stagger | 3/5 |
| ProUpgradeCard | opacity+y, blob decoration | 3/5 — blobs feel AI-ish |
| Refresh icon | animate-spin | 3/5 |
| Forecast chart | height spring with dashed border | 4/5 — nice detail |

**Gaps:** Single SPRING config shared everywhere (no nuance vs Academy's 5 springs) | No entrance stagger between sections | No `prefers-reduced-motion` | Blob decoration on Pro card is borderline AI slop

---

## D — Polish

**Score: 12/22 checks pass**

| Check | Status |
|---|---|
| Theme tokens used | ⚠️ Partial — 8 hardcoded hex |
| Hardcoded hex | ❌ 8 values |
| Emoji violations | ❌ 7 |
| IA matches neighbors | ✅ bento-card pattern |
| Typography consistent | ⚠️ 7 micro sizes (9px-24px) |
| Forms labeled | ✅ No forms |
| Touch targets ≥ 44px | ❌ All nav buttons fail |
| Contrast WCAG AA | ⚠️ Hardcoded hex may contrast poorly in dark themes |
| Focus rings | ❌ Missing |
| `prefers-reduced-motion` | ❌ Missing |
| Button patterns consistent | ❌ btn-primary-bg vs normal buttons |
| Empty states | ✅ |

**Actionable:** P1 — Replace 8 hardcoded hex with CSS variables | P1 — Remove 7 emoji | P0 — Fix 13 div→button | P2 — Add focus-visible rings

---

## E — Layout

**Score: 3/5**

| Check | Verdict |
|---|---|
| Primary action visible | ✅ Date range bar at top, clear |
| Secondary actions distinct | ❌ Refresh and export are same rounded-full pattern |
| Clear groupings | ✅ Bento-card per section |
| Rhythm | ⚠️ 3-col mini at bottom for avg check/hours/source feels cramped |
| Data density | ⚠️ 10 sections is a lot of vertical scroll |

**Issues:** P2 — 3-col grid (avg check, hours, source) below 44px each — too cramped on mobile | P2 — Forecast section is 200 lines of code for one insight | P3 — Revenue split + best day in 2-col grid works on desktop, tight on mobile

---

## F — Overdrive

**6 proposals:**

1. **Chart Image Export** — download individual charts as PNG (html2canvas) or embed in CSV/PDF
2. **Shareable Analytics Deep Links** — `?preset=month&offset=-1` anyone can link to
3. **Month-over-Month Comparison Overlay** — overlay previous period as dashed line on revenue chart
4. **Anomaly Detection** — flag months where revenue deviates >2σ from trend
5. **Goal Tracking** — set monthly revenue target, show progress bar, alert when on track/missing
6. **Service Profitability Waterfall** — revenue - COGS/time = profit per service, not just gross revenue

**Focus:** Chart export + Goals (Items 1+5) — biggest business value for boutique owners.

---

## G — Live

**SKIPPED** — requires browser automation.

---

## H — Optimize

**Score: 6/10**

| Concern | Verdict |
|---|---|
| 5 parallel DB queries | P2 — Promise.all for 5 separate queries. Acceptable for analytics page. Could consolidate |
| ClientSheetById inline fetch | P2 — fires effect on every client click. Should use React Query with cache |
| dynamic ssr:false | ✅ Explicitly eliminates hydration mismatches. Clear comment |
| React Query staleTime 2min | ✅ Prevents refetch on remount |
| 991-line component | P3 — should split into smaller files. MonthBarChart, DowChart, ServiceRow, ProUpgradeCard are defined inline |
| exportAnalyticsCsv | P3 — fetches all bookings again (duplicated with useAnalytics). Should reuse cached data |
| Framer Motion | 30KB+ gzipped — acceptable for animation-heavy page |
| Server component route | ✅ Minimal server work, passes isPro as prop |

---

## Summary

| Section | Score |
|---|---|
| Audit (8-block) | 54/80 C |
| Critique (Nielsen) | 26/40 |
| Animate | 5/10 |
| Polish | 12/22 checks pass |
| Layout | 3/5 |
| Overdrive | 6 proposals |
| Live | skipped (no browser) |
| Optimize | 6/10 |

**Top fixes:** P0 — 13 div→button on chart bars | P1 — 8 hardcoded hex to CSS variables | P1 — 7 emoji → text/icons | P1 — type="button" on 12 buttons | P2 — Split 991-line component | P2 — aria-label on chart bars

**vs benchmark:** Academy (64/80) is 10 points higher — cleaner, zero hex, zero emoji. Products (63/80) is 9 points higher — zero hex, zero div→button. Analytics has best data depth but worst discipline.

**Progress:** 20/25 done. Remaining: Landing Page, Services, Studio, Documents, Support, More.
