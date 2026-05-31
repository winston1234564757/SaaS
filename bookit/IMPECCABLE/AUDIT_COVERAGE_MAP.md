# AUDIT COVERAGE MAP

> Master cross-reference: SYSTEM_MAP + 15 RELEASE maps vs audit reality.
> Created: 2026-05-31 | Source: MAPS cross-reference phase

---

## 1. ROUTE COVERAGE MATRIX

### Dashboard (master layout)

| Route | File | Source Map | Audited? | Score | Lines |
|-------|------|------------|----------|-------|-------|
| `/dashboard` | dashboard/page.tsx | SYSTEM_MAP | YES | ? | - |
| `/dashboard/bookings` | bookings/page.tsx | SYSTEM_MAP | YES | 61? | - |
| `/dashboard/bookings/[id]` | bookings/[id]/page.tsx | SYSTEM_MAP, UI_MAP | YES | 61? | - |
| `/dashboard/revenue` | revenue/page.tsx | SYSTEM_MAP | YES | 63? | - |
| `/dashboard/clients` | clients/page.tsx | SYSTEM_MAP, UI_MAP | YES | 67? | - |
| `/dashboard/services` | services/page.tsx | SYSTEM_MAP, UI_MAP | YES | 69 | - |
| `/dashboard/services/new` | services/new/page.tsx | UI_MAP | YES | part of services | - |
| `/dashboard/services/[id]` | services/[id]/page.tsx | UI_MAP | YES | part of services | - |
| `/dashboard/products` | products/page.tsx | SYSTEM_MAP | YES | 63? | - |
| `/dashboard/products/new` | products/new/page.tsx | UI_MAP | YES | part of products | - |
| `/dashboard/products/[id]` | products/[id]/page.tsx | UI_MAP | YES | part of products | - |
| `/dashboard/portfolio` | portfolio/page.tsx | SYSTEM_MAP, UI_MAP | YES | 67? | - |
| `/dashboard/portfolio/[id]` | portfolio/[id]/page.tsx | UI_MAP | YES | part of portfolio | - |
| `/dashboard/marketing` | marketing/page.tsx | SYSTEM_MAP, UI_MAP | YES | 63? | - |
| `/dashboard/marketing/new` | marketing/new/page.tsx | UI_MAP | YES | thin wrapper | - |
| `/dashboard/marketing/[id]` | — | UI_MAP | **NO (GAP 1)** | — | 123 |
| `/dashboard/academy` | academy/page.tsx | SYSTEM_MAP | YES | 64 | - |
| `/dashboard/analytics` | analytics/page.tsx | SYSTEM_MAP | YES | 54 | - |
| `/dashboard/settings` | settings/page.tsx | SYSTEM_MAP | YES | 66? | - |
| `/dashboard/settings/*` | settings/* | SYSTEM_MAP | YES | 66? | - |
| `/dashboard/billing` | billing/page.tsx | SYSTEM_MAP, BILLING_FLOW_MAP | YES | 61? | - |
| `/dashboard/onboarding` | onboarding/page.tsx | SYSTEM_MAP, ONBOARDING_FLOW_MAP | YES | 62? | - |
| `/dashboard/growth` | growth/page.tsx | SYSTEM_MAP | YES | 67? | - |
| `/dashboard/clients/import` | clients/import/page.tsx | UI_MAP | YES | part of clients | - |
| `/dashboard/admin` | admin/page.tsx | SYSTEM_MAP | YES | 67? | - |
| `/dashboard/more` | more/page.tsx | SYSTEM_MAP | SKIPPED | — | - |
| `/dashboard/reviews` | reviews/page.tsx | UI_MAP | **NO (GAP 2)** | — | 246 |
| `/dashboard/changelog` | changelog/page.tsx | DEEP_LINK_MAP | **NO (GAP 3)** | — | — |

### Redirect Gateways (intentionally skipped — no UX)

| Route | Destination | From Map | Decision |
|-------|-------------|----------|----------|
| `/dashboard/loyalty` | redirect to revenue?tab=loyalty | SYSTEM_MAP | skipped — gateway |
| `/dashboard/flash` | redirect to revenue?tab=flash_deals | SYSTEM_MAP | skipped — gateway |
| `/dashboard/pricing` | redirect to billing | SYSTEM_MAP | skipped — gateway |
| `/dashboard/referral` | redirect to growth?tab=referral | SYSTEM_MAP | skipped — gateway |
| `/dashboard/partners` | redirect to growth?tab=partners | UI_MAP | skipped — gateway |

### Client Zone (separate layout)

| Route | Source Map | Audited? | Notes |
|-------|-----------|----------|-------|
| `/client/*` | SYSTEM_MAP, CLIENT_ZONE_MAP | NO | Not in scope (client-facing) |
| Online booking flow | CLIENT_ZONE_MAP | NO | booking flow |
| Portfolio preview | CLIENT_ZONE_MAP, DEEP_LINK_MAP | NO | shared links |
| Master redirect | DEEP_LINK_MAP | NO | short links |

### Landing Page (separate)

| Route | Source Map | Audited? | Score |
|-------|-----------|----------|-------|
| `/` (landing) | SYSTEM_MAP | YES | **71 A** |

---

## 2. AUDIT SCORE SUMMARY

| Module | Score | Grade | type="button"% | Theme tokens% | Hardcoded colors |
|--------|-------|-------|----------------|---------------|------------------|
| **Landing Page** | 71 | A | 0% (0/11) | 100% (--l-*) | 0 |
| **Services** | 69 | B+ | **100% (24/24)** | high | 1 (rgba) |
| **Portfolio** | 67 | B | — | — | — |
| **Clients** | 67 | B | — | — | — |
| **Growth** | 67 | B | — | — | — |
| **Admin** | 67 | B | — | — | — |
| **Settings** | 66 | B | — | — | — |
| **Academy** | 64 | B | 0% | — | — |
| **Products** | 63 | B | 69% (9/13) | — | — |
| **Revenue** | 63 | B | — | — | — |
| **Marketing** | 63 | B | — | — | — |
| **Studio** | 63 | B | — | — | 3 hardcoded |
| **Documents** | 62 | B | — | **0% (0 tokens)** | **6 hardcoded** |
| **Onboarding** | 62 | B | — | — | — |
| **Billing** | 61 | B | — | — | — |
| **Bookings** | 61? | B | — | — | — |
| **Support** | 63 | B | **0% (17 missing)** | **inconsistent** | 4+ in Widget |
| **Analytics** | 54 | C | 0% (13 div→btn) | — | — |
| **More** | — | SKIPPED | — | — | — |

---

## 3. MAP CROSS-REFERENCE FINDINGS

### 3.1 Map Health

| Map | Status | Notes |
|-----|--------|-------|
| `XDEV/MAPS/SYSTEM_MAP.md` (544 lines) | **Stale** | Links to `REFERRAL_MAP.md`, `UI_MAP.md`, `DEEP_LINK_MAP.md` — but these exist ONLY in `XDEV/RELEASE/MAPS/`, not in `XDEV/MAPS/`. All 15 RELEASE maps are unreferenced. |
| `XDEV/RELEASE/MAPS/UI_MAP.md` | Partially stale | Lists `/dashboard/reviews` (exists, unaudited), `/dashboard/more` (dead route), route params for services/products/portfolio |
| `XDEV/RELEASE/MAPS/DEEP_LINK_MAP.md` | Stale | References `/dashboard/changelog` — exists but not in SYSTEM_MAP. References `changelog/page.tsx` — confirmed exists. |
| `XDEV/RELEASE/MAPS/DATABASE_SECURITY_RLS_MAP.md` | Current | Perfect RLS coverage, row-level policies documented |
| `XDEV/RELEASE/MAPS/DESIGN_SYSTEM_TOKENS_MAP.md` | Current | 3 theme tokens fully documented |
| `XDEV/RELEASE/MAPS/BILLING_FLOW_MAP.md` | Current | Pricing tiers, RPC updates |
| `XDEV/RELEASE/MAPS/ONBOARDING_FLOW_MAP.md` | Current | 9 steps, 5 tours |
| `XDEV/RELEASE/MAPS/REFERRAL_MAP.md` | Current | Direct reward logic |
| `XDEV/RELEASE/MAPS/NOTIFICATION_MAP.md` | Current | cron mailers |
| `XDEV/RELEASE/MAPS/CLIENT_ZONE_MAP.md` | Current | 10+ routes |
| `XDEV/RELEASE/MAPS/BUTTON_ACTION_MAP.md` | Current | Standard actions |
| `XDEV/RELEASE/MAPS/MODALS_MAP.md` | Current | Dialogs + sheets |
| `XDEV/RELEASE/MAPS/SHOP_ORDER_FLOW_MAP.md` | Current | Booking shop order flow |
| `XDEV/RELEASE/MAPS/CRON_SCHEDULER_MAP.md` | Current | Daily/weekly cron |
| `XDEV/RELEASE/MAPS/TESTING_MAP.md` | Partially stale | Vitest + Playwright paths outdated |
| `XDEV/RELEASE/MAPS/PAGE_RELEASE_ROADMAP.md` | Current | Shop (blocked), Client Portal (blocked), Legal (blocked) |

### 3.2 Broken SYSTEM_MAP Links

The following relative links in SYSTEM_MAP.md point to non-existent paths:
- `XDEV/MAPS/REFERRAL_MAP.md` → should be `XDEV/RELEASE/MAPS/REFERRAL_MAP.md`
- `XDEV/MAPS/UI_MAP.md` → should be `XDEV/RELEASE/MAPS/UI_MAP.md`
- `XDEV/MAPS/DEEP_LINK_MAP.md` → should be `XDEV/RELEASE/MAPS/DEEP_LINK_MAP.md`

All 3 files exist in the RELEASE folder but SYSTEM_MAP.md doesn't link to them.

### 3.3 Routes Not in SYSTEM_MAP but Exist in Code

| Route | Exists in | Found in | Status |
|-------|-----------|----------|--------|
| `/dashboard/reviews` | reviews/page.tsx | UI_MAP only | **UNAUDITED** |
| `/dashboard/changelog` | changelog/page.tsx | DEEP_LINK_MAP only | **UNAUDITED** |

### 3.4 Routes in SYSTEM_MAP but Dead/Redirect

| Route | Status | Reason |
|-------|--------|--------|
| `/dashboard/more` | **Dead route** | Links exist in old main menu but no UX access point in current UI. Skip confirmed. |
| `/dashboard/loyalty` | Redirect only | Goes to revenue?tab=loyalty |
| `/dashboard/flash` | Redirect only | Goes to revenue?tab=flash_deals |
| `/dashboard/pricing` | Redirect only | Goes to billing |
| `/dashboard/referral` | Redirect only | Goes to growth?tab=referral |
| `/dashboard/partners` | Redirect only | Goes to growth?tab=partners |

---

## 4. COVERAGE GAPS — UNAUDITED ROUTES

### GAP 1: `/dashboard/marketing/[id]` — BroadcastDetailPage.tsx

| Property | Value |
|----------|-------|
| File | `src/components/master/marketing/BroadcastDetailPage.tsx` |
| Lines | 123 |
| Route wrapper | Exists (marketing/[id]/page.tsx imports it) |
| UI scope | Delivery results per client, legend bar, ChannelDot components, SummaryCell footer |
| Systemic colors | 4 hardcoded (#789A99, #5C9E7A, #4A9BE0, #D4935A, #C05B5B, #E8D5CC) |
| Accessibility | Only back button has aria-label |
| type="button" | 1 button with type="button" — Channels not buttons so OK |
| Priority for audit | Medium (small page, but unique UI) |

### GAP 2: `/dashboard/reviews` — ReviewsPage.tsx

| Property | Value |
|----------|-------|
| File | `src/components/master/reviews/ReviewsPage.tsx` |
| Lines | 246 |
| Imports | 12, uses useReviews hook, AnimatePresence, AnchoredTooltip, filter pills |
| UI scope | Stats cards (3-column grid), filter pills, review list with visibility toggle, AnimatePresence |
| Systemic colors | #789A99, #5C9E7A, #A8928D, #D4935A — 4 hardcoded |
| type="button" | Filter pills have button tags (with cursor-pointer) |
| Accessibility | tooltip with AnchoredTooltip |
| Priority for audit | **High** (substantial UI, systemic colors) |

### GAP 3: `/dashboard/changelog` — ChangelogPage

| Property | Value |
|----------|-------|
| File | `src/app/(master)/dashboard/changelog/page.tsx` |
| UI scope | Uses framer-motion, router, cn utility |
| Priority for audit | **Low** (likely simple page, informational) |

### MORE (skipped)

| Property | Value |
|----------|-------|
| File | `src/app/(master)/dashboard/more/page.tsx` |
| Status | Confirmed skipped — no UX access, dead route |

---

## 5. SYSTEMIC COLOR PALETTE (retention)

Confirmed across 7+ audited modules:

| Color | Appears in |
|-------|-----------|
| `#789A99` (sage) | Clients, Analytics, Reviews, Services (rgba), Studio, Documents, SupportWidget, marketing LegendItem |
| `#5C9E7A` (green) | Clients, Analytics, Reviews, BroadcastDetailPage, marketing LegendItem |
| `#D4935A` (amber) | Clients, Analytics, Reviews, marketing LegendItem, SummaryCell |
| `#4A9BE0` (blue) | BroadcastDetailPage (Telegram channel) |
| `#A8928D` (taupe) | Reviews (hidden count) |
| `#E8D5CC` (pinkish) | ChannelDot (X icon) |
| `#C05B5B` (red) | BroadcastDetailPage (dim summary) |

---

## 6. KEY RECOMMENDATIONS

### Fix SYSTEM_MAP
1. Repair 3 broken links: `UI_MAP.md`, `DEEP_LINK_MAP.md`, `REFERRAL_MAP.md` → point to `XDEV/RELEASE/MAPS/`
2. Add 15 RELEASE maps as sections or appendices
3. Add `/dashboard/reviews` route entry
4. Add `/dashboard/changelog` route entry
5. Remove or mark `/dashboard/more` as dead/archived

### Audit Prioritization
1. **Reviews** (246 lines, substantial UI, systemic colors — HIGH priority)
2. **BroadcastDetailPage** (123 lines, unique delivery UI — MEDIUM)
3. **Changelog** (simple page — LOW)

### Post-Audit
1. After auditing all 3 gaps → update coverage to 100%
2. Run npx tsc --noEmit after any changes
3. Update PROJECT_FILES.md with new scores
4. Save to MemPalace
