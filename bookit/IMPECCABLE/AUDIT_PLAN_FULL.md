# MASTER AUDIT PLAN — Full Coverage

> **Scope:** Every route, component, UI atom, modal, sheet, tooltip, input, selector in BookIT.
> **Method:** 8-block IMPECCABLE format per unit (Heuristics, Cognition, Code Quality, A11y, Animations, Systemics, Findings, Score).
> **Source:** SYSTEM_MAP.md (544 lines) + 15 RELEASE maps.
> **Audits done so far:** 20 reports covering ~30 routes + landing page + client zone (combined).

---

## STATUS: 20 DONE · 47 TO DO

---

## ✅ PHASE Z — Already Audited (20 reports)

These are DONE. Do NOT re-audit unless explicit request:

### Master Dashboard (19 routes in 16 reports)

| Report | Routes | Score | Status |
|--------|--------|-------|--------|
| `landing.md` | `/` (14 sections, GSAP+Framer) | **71 A** | ✅ |
| `dashboard.md` | `/dashboard` (FrostDashboard, widgets, tour) | — | ✅ |
| `bookings.md` | `/dashboard/bookings` | — | ✅ |
| `revenue.md` | `/dashboard/revenue` (Flash, Smart Pricing) | — | ✅ |
| `marketing.md` | `/dashboard/marketing` (Story, Broadcasts) | — | ✅ |
| `billing.md` | `/dashboard/billing` (Monobank, tiers) | — | ✅ |
| `onboarding.md` | `/dashboard/onboarding` (5-step wizard) | — | ✅ |
| `settings.md` | `/dashboard/settings` (11 widgets, Vacation, Location) | — | ✅ |
| `growth.md` | `/dashboard/growth` (Loyalty, Referral, Partners) | — | ✅ |
| `clients.md` | `/dashboard/clients` (CRM, ClientDetailSheet, Segments) | — | ✅ |
| `portfolio.md` | `/dashboard/portfolio` (CRUD, PhotoUploader) | — | ✅ |
| `products.md` | `/dashboard/products` (CRUD, Orders, Restock) | — | ✅ |
| `services.md` | `/dashboard/services` (CRUD, Zod, 100% type benchmark) | **69 B+** | ✅ |
| `studio.md` | `/dashboard/studio` (coming soon, waitlist) | **63 B** | ✅ |
| `documents.md` | `/dashboard/documents` (legal hub, bento grid) | **62 B** | ✅ |
| `support.md` | `/dashboard/support` (FAQ, chat widget, Realtime) | **63 B** | ✅ |
| `academy.md` | `/dashboard/academy` (26 articles, Emil springs) | **64 B** | ✅ |
| `analytics.md` | `/dashboard/analytics` (charts, CSV, forecast) | **54 C** | ✅ |
| `admin.md` | `/admin` + 6 subpages (overview, masters, alliances, moderation, support, logs) | — | ✅ |

### Client Zone + Public + Auth (combined report)

| Report | Routes Covered | Status |
|--------|---------------|--------|
| `client-zone.md` | `/explore`, `/[slug]`, `/[slug]/shop`, `/[slug]/portfolio`, BookingWizard, `/my/*`, `/setup/phone`, PostBookingAuth, auth flows | ✅ **Partial audit** (1 combined report, not per-page 8-block) |

---

## 🔴 PHASE R — Remaining Dashboard Pages (3 audits)

These are routes in SYSTEM_MAP that exist in code but have NO dedicated audit.

| # | Route | File | Lines | Priority |
|---|-------|------|-------|----------|
| R1 | `/dashboard/reviews` | `ReviewsPage.tsx` + route | 246 | **HIGH** — substantial UI, 4 hardcoded colors, filter pills, AnimatePresence |
| R2 | `/dashboard/marketing/[id]` | `BroadcastDetailPage.tsx` + route | 123 | MED — delivery results, legend bar, 6 hardcoded colors |
| R3 | `/dashboard/changelog` | `changelog/page.tsx` | — | LOW — simple page |

**Add if requested:**
| — | `/dashboard/more` | `more/page.tsx` | — | SKIPPED (dead route, no UX access) |

---

## 🟠 PHASE P — Public Pages (11 audits)

Each public-facing page gets its own 8-block IMPECCABLE report.

| # | Route | Key Component | Lines (approx) |
|---|-------|--------------|----------------|
| P1 | `/explore` | `ExplorePage.tsx` | ~400 |
| P2 | `/[slug]` | `PublicMasterPage.tsx` | 1122 |
| P3 | `/[slug]/shop` | `ShopPage.tsx` | ~700 |
| P4 | `/[slug]/portfolio` | `PublicPortfolioGallery.tsx` | ~200 |
| P5 | `/[slug]/portfolio/[id]` | Portfolio detail (SSR) | ~100 |
| P6 | `/studio/[slug]` | `StudioPublicPage.tsx` | ~200 |
| P7 | `/studio/join` | Studio join page | ~100 |
| P8 | `/invite/[code]` | Referral landing | ~100 |
| P9 | `/legal` + `/legal/[slug]` | Legal pages (SSG, markdown) | ~100 |
| P10 | `/offline` | PWA offline page | ~50 |
| P11 | `/r/[code]` | Short link redirect + click tracking | ~50 |

**Note:** P1-P5 are already partially covered in `client-zone.md` — the new audits will be deeper, per-page 8-block reports.

---

## 🟡 PHASE A — Auth Pages (3 audits)

| # | Route | Key Component | Scope |
|---|-------|--------------|-------|
| A1 | `/login` + `/register` | `PhoneOtpForm.tsx`, role selection, Frost split-screen layout | Full auth entry |
| A2 | `/auth/callback` | OAuth callback, role intent, booking link | Server + client flow |
| A3 | Auth components | `ClientAuthSheet.tsx`, `NavLoginSheet.tsx`, `PostBookingAuth.tsx`, `TelegramProvider.tsx` | All shared auth widgets |

**Note:** A3 overlaps with client-zone.md — new audit will be deeper per-component.

---

## 🟢 PHASE C — Client Zone (6 audits)

| # | Route | Key Component | Score from client-zone.md |
|---|-------|--------------|--------------------------|
| C1 | `/my/bookings` | `MyBookingsPage.tsx` | 7/10 |
| C2 | `/my/loyalty` | `MyLoyaltyPage.tsx` | 7/10 |
| C3 | `/my/masters` | `MyMastersPage.tsx` | 8/10 |
| C4 | `/my/profile` | `MyProfilePage.tsx` | 7/10 |
| C5 | `/my/notifications` | `ClientNotificationsPage.tsx` | 6/10 |
| C6 | `/my/setup/phone` | `PhoneSetupForm.tsx` | 8/10 |

**Note:** Already audited in client-zone.md — these are deeper per-page 8-block re-audits.

---

## 🔵 PHASE U — UI Atoms (9 audits)

Every standalone UI component in `src/components/ui/` gets its own audit.

| # | Component | File | Key Checks |
|---|-----------|------|------------|
| U1 | Button | `Button.tsx` | Variants, theme tokens, type="button", aria, focus-visible, touch targets |
| U2 | Input | `Input.tsx` | Focus states, error handling, accessibility, theme vars |
| U3 | Badge | `Badge.tsx` | Status variants (confirmed, paid, starter), contrast |
| U4 | BentoCard | `BentoCard.tsx` | Glassmorphism, Mica effect, theme tokens |
| U5 | Card | `Card.tsx` | Generic container, theme consistency |
| U6 | Tooltip / AnchoredTooltip | `Tooltip.tsx` | Positioning, accessibility, ARIA patterns |
| U7 | DropdownMenu | `DropdownMenu.tsx` | Menu behavior, keyboard nav, z-index |
| U8 | Skeleton | `skeleton.tsx` | Loading states, theme-aware shimmer |
| U9 | PullToRefresh | `PullToRefresh.tsx` | Mobile gesture, touch handling |

---

## 🟣 PHASE M — Modals, Sheets, Drawers (6 audits)

| # | Component | File | Type |
|---|-----------|------|------|
| M1 | BottomSheet | `BottomSheet.tsx` | Vaul-based, mobile-first |
| M2 | DashboardDrawer | `DashboardDrawer.tsx` | Radix Dialog, desktop |
| M3 | PopUpModal | `PopUpModal.tsx` | Adaptive (Dialog→BottomSheet fallback) |
| M4 | HubDrawer | `HubDrawer.tsx` | PopUpModal-based |
| M5 | MicaModal | (BookingWizard) | Desktop glass modal |
| M6 | Feature drawers | `FlashDealDrawer.tsx`, `PricingDrawer.tsx`, `RestockDrawer.tsx` | Domain-specific |

---

## ⚪ PHASE W — Complex Widgets (12 audits)

| # | Component | File | Parent Module |
|---|-----------|------|---------------|
| W1 | BookingWizard | `BookingWizard.tsx` + 10 sub-components | Public / Shared |
| W2 | StoryGenerator | `StoryGenerator.tsx` | Marketing |
| W3 | BroadcastEditor | `BroadcastEditor.tsx` | Marketing |
| W4 | BroadcastHistory | `BroadcastHistory.tsx` | Marketing |
| W5 | NotificationsBell | `NotificationsBell.tsx` | Dashboard |
| W6 | ChannelBanner | `ChannelBanner.tsx` | Client Zone |
| W7 | PhoneSetupForm | `PhoneSetupForm.tsx` | Client Zone |
| W8 | ExplorePage | `ExplorePage.tsx` | Public |
| W9 | ShopPage | `ShopPage.tsx` | Public |
| W10 | StudioPublicPage | `StudioPublicPage.tsx` | Public |
| W11 | PublicPortfolioGallery | `PublicPortfolioGallery.tsx` + `PortfolioBookingButton.tsx` | Public |
| W12 | Shared utilities | `SmartBackButton.tsx`, `PushSubscribeCard.tsx`, `BlobBackground.tsx`, `BeautyLoader.tsx`, `ServiceWorkerRegistration.tsx`, `InstallBanner.tsx` | Shared |

---

## 🟤 PHASE S — Systemic & Backend Maps Verification (3 audits)

These are not UI audits but document verification — confirm that the 15 RELEASE maps are in sync with actual code.

| # | Map | Scope |
|---|-----|-------|
| S1 | `NOTIFICATION_MAP.md` | Verify 21 event types, cascades, adoption mechanics against code |
| S2 | `REFERRAL_MAP.md` | Verify B2B, C2C, C2B, Cartel mechanics, check C2C switch missing in Settings |
| S3 | `SYSTEM_MAP.md` | Fix 3 broken links, add reviews/changelog routes, mark dead routes |

---

## 🎯 SUMMARY TOTALS

| Phase | Description | Count | Status |
|-------|-------------|-------|--------|
| Z | Already audited | 20 reports | ✅ Done |
| R | Remaining dashboard | 3 | 🔴 Pending |
| P | Public pages | 11 | 🟠 Pending |
| A | Auth pages | 3 | 🟡 Pending |
| C | Client zone (deep) | 6 | 🟢 Pending |
| U | UI atoms | 9 | 🔵 Pending |
| M | Modals/Sheets/Drawers | 6 | 🟣 Pending |
| W | Complex widgets | 12 | ⚪ Pending |
| S | Systemic maps | 3 | 🟤 Pending |
| **Total pending** | | **53** | |

### Quick Priority Order
1. **R1** (Reviews) — substantial UI, already exists, quick win
2. **R2** (BroadcastDetail) — small, quick win
3. **U1-U4** (Button, Input, Badge, BentoCard) — foundational, everything depends on them
4. **M1-M3** (BottomSheet, DashboardDrawer, PopUpModal) — core interaction containers
5. **P1-P3** (Explore, PublicMasterPage, ShopPage) — high-traffic public pages
6. **C1-C6** (Client zone) — post-booking experience
7. **A1-A3** (Auth) — entry point
8. **W1-W12** — widget depth audits
9. **S1-S3** — documentation sync

---

*Created: 2026-05-31 · Source: SYSTEM_MAP.md + 15 RELEASE maps + 20 existing IMPECCABLE reports*
