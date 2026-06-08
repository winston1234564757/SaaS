# Audit Plan — Map Coverage & Priorities

> SYSTEM_MAP v8.3.0 (2026-05-30) vs IMPECCABLE audits done (2026-05-31)
> Register: Product — audit only, no code changes

---

## Coverage Matrix

### [Done] — 17 reports complete

| Audit File | Pages | Heuristics | Audit Health | Date |
|---|---|---|---|---|---|
| `dashboard.md` | `/dashboard` (FrostDashboard, widgets, tour) | 21/40 | 12/20 | 2026-05-30 |
| `bookings.md` | `/dashboard/bookings` (Timeline, Bento Analytics) | 22/40 | 11/20 | 2026-05-31 |
| `revenue.md` | `/dashboard/revenue` (Flash Deals, Dynamic Pricing) | 25/40 | 14/20 | 2026-05-31 |
| `marketing.md` | `/dashboard/marketing` (Story Generator, Broadcasts) | 22/40 | 6/20 | 2026-05-31 |
| `client-zone.md` | Client Zone + Explore (public pages, booking, auth, `/my/*`, shop) | ? | ? | 2026-05-30 |
| `billing.md` | `/dashboard/billing` (Subscriptions, Monobank, cancel) | 29/40 | 14/20 | 2026-05-31 |
| `onboarding.md` | `/dashboard/onboarding` (5-step wizard: Profile→Services→Schedule→Preview→Success) | 25/40 | 14/20 | 2026-05-31 |
| `settings.md` | `/dashboard/settings` (SettingsPage + 11 widgets + VacationManager + LocationPicker) | 22/40 | 14/20 | 2026-05-31 |
| `growth.md` | `/dashboard/growth` (GrowthHubClient + LoyaltyPage + ReferralPage + PartnersPage) | 17/40 | 14/20 | 2026-05-31 |
| `clients.md` | `/dashboard/clients` (ClientsPage + ClientDetailSheet + ClientWidgets + SegmentBuilder) | 24/40 | 13/20 | 2026-05-31 |
| `portfolio.md` | `/dashboard/portfolio` (PortfolioPage + ItemCard + Editor + PhotoUploader + ItemPage) | 24/40 | 14/20 | 2026-05-31 |
| `admin.md` | `/admin` (6 pages: overview, support, masters, moderation, alliances, logs) | 22/40 | 14/20 | 2026-05-31 |
| `products.md` | `/dashboard/products` (shop: CRUD + orders + restock) | 30/40 | 17/20 | 2026-05-31 |
| `academy.md` | `/dashboard/academy` (knowledge hub, 26 articles, Emil springs) | 33/40 | 16/20 | 2026-05-31 |
| `analytics.md` | `/dashboard/analytics` (pro analytics, charts, CSV, forecast) | 29/40 | 12/20 | 2026-05-31 |
| `landing.md` | `/` (landing, 14 sections, GSAP+Framer, premium) | 36/40 | 17/20 | 2026-05-31 |
| `services.md` | `/dashboard/services` (CRUD, Zod, 100% type, benchmark) | 34/40 | 19/20 | 2026-05-31 |
| `studio.md` | `/dashboard/studio` (coming soon, waitlist, invite) | 30/40 | 17/20 | 2026-05-31 |
| `documents.md` | `/dashboard/documents` (legal hub, bento grid) | 30/40 | 15/20 | 2026-05-31 |
| `support.md` | `/dashboard/support` (FAQ, chat widget, Realtime) | 32/40 | 14/20 | 2026-05-31 |

### [Not Done] — B2B Master Zone (10 pages missing)

| Priority | Route | Complexity | Key Components | Risk |
|---|---|---|---|---|
| ~~**HIGH**~~ | ~~`/dashboard/clients`~~ | ~~High~~ | ✅ Done (24/40 Heuristics) | CRM — most-used tool after dashboard |
| ~~**MED**~~ | ~~`/dashboard/academy`~~ | ~~Medium~~ | ✅ Done (33/40 Heuristics, 16/20 Code Quality, 64/80) | User education — content-heavy |
| **MED** | `/dashboard/portfolio` | High | `PortfolioPage.tsx`, `PortfolioItemPage.tsx`, `PortfolioPhotoUploader.tsx` | Storage, drag-reorder, consent flow |
| ~~**LOW**~~ | ~~`/dashboard/analytics`~~ | ~~Medium~~ | ✅ Done (29/40 H, 12/20 CQ, 54/80) | Pro feature — data charts |
| ~~**MED**~~ | ~~`/dashboard/products`~~ | ~~Medium~~ | ✅ Done (30/40 Heuristics, 17/20 Code Quality) | E-commerce sub-system |
| ~~**LOW**~~ | ~~`/dashboard/services`~~ | ~~Low~~ | ✅ Done (34/40 H, 19/20 CQ, 69/80) — benchmark module | Simple CRUD |
| **LOW** | `/dashboard/analytics` | Medium | `AnalyticsPage.tsx` (revenue, top services, retention cohorts, CSV) | Pro feature — data charts |
| ~~**LOW**~~ | ~~`/dashboard/studio`~~ | ~~Low~~ | ✅ Done (30/40 H, 17/20 CQ, 63/80) | Niche feature |
| ~~**LOW**~~ | ~~`/dashboard/documents`~~ | ~~Low~~ | ✅ Done (30/40 H, 15/20 CQ, 62/80) — worst theming compliance | Static content |
| ~~**LOW**~~ | ~~`/dashboard/support`~~ | ~~Low~~ | ✅ Done (32/40 H, 14/20 CQ, 63/80) — best FAQ, worst theme inconsistency | Ticketing UI |
| **LOW** | `/dashboard/more` | Low | `MorePage.tsx` | Links only |
| — | Redirect gateways (×4) | — | `/flash`, `/pricing`, `/loyalty`, `/referral`, `/partners` | Redirect-only — skip audit |

### [Done] — Admin Zone (6 pages)

| Audit File | Route | Complexity | Key Findings |
|---|---|---|---|
| `admin.md` | `/admin` + all 6 sub-routes | Medium (overall) | 22/40 H, 14/20 C, 12/20 Q = 48/80. P0: 85% buttons miss `type="button"`, zero CSS variables, zero `aria-*` attributes. Strong visual shell, worst accessibility + theme profile across all zones. |

### [Not Done] — Landing Page (1 page, 14 sections)

| Priority | Route | Complexity | Key Components | Risk |
|---|---|---|---|---|
| **MED** | `/` | **Very High** | 14 sections, GSAP ScrollStack, Framer Motion, LandingHero..FooterCTA | Marketing site — public face, SEO |

---

## Recommended Audit Order

Based on business impact + UI complexity:

### Phase 1 — Critical Business Flows (3 audits)
```
✅ /dashboard/billing      — payment flow, subscription tiers, Monobank checkout
✅ Dashboard Onboarding    — 5-step wizard = first user experience
✅ /dashboard/settings     — schedule, vacation = booking engine integrity
```

### Phase 2 — High-Impact B2B (3 audits)
```
✅ /dashboard/clients      — CRM, tags, VIP, retention — daily driver
✅ /dashboard/growth       — loyalty, referrals, partners — revenue growth levers
✅ /dashboard/portfolio    — photo upload, consent, drag-reorder — complex UI
```

### Phase 3 — Admin Zone (6 audits, all done)
```
✅ /admin                  — overview + charts
✅ /admin/support          — real-time chat console
✅ /admin/masters          — directory + impersonation
✅ /admin/moderation       — reviews + portfolio moderation
✅ /admin/alliances        — Framer Motion graph + table
✅ /admin/logs             — notification + OTP log viewer
```

### Phase 4 — Complete
```
9.  ✅ /dashboard/academy    — content-rich, Emil animations (64/80)
10. ✅ /dashboard/products   — e-commerce CRUD (63/80)
11. ✅ /dashboard/analytics  — charts, CSV export (54/80)
12. ✅ Landing Page          — 14 sections, GSAP+Framer (71/80) — BEST
```

### Phase 5 — Low Priority (4 audits)
```
15. /dashboard/services    — simple CRUD
16. /dashboard/studio      — simple invite flow
17. /dashboard/documents   — static content
18. /dashboard/support     — ticketing
19. /dashboard/more        — links
```

---

## Running Total

| Status | Count |
|---|---|---|
| ✅ Done | 24 |
| 🟡 Phase 1 (Critical) | 0 ← all complete |
| 🟠 Phase 2 (High-Impact) | 0 ← all complete |
| 🔵 Phase 3 (Admin) | 0 ← all complete (6 reports added) |
| 🟣 Phase 4 (Complete) | 0 ← all done |
| ⚪ Phase 5 (Low) | 1 |
| **Total remaining** | **1** |

---

## Assessment by Page Complexity

| Complexity | Count | Pages |
|---|---|---|---|
| Very High | 1 | Landing Page (14 sections, GSAP, Framer) |
| High | 5 | billing, clients, onboarding, portfolio, admin/support |
| Medium | 7 | growth, academy, products, analytics, admin, admin/masters, admin/moderation |
| Low | 7 | services, studio, documents, support, more, admin/alliances, admin/logs |

---

## Systemic Issues to Watch For

Carried forward from completed audits — likely present in unaudited pages:

1. **`var(--surface) ≈ var(--background)` contrast** — affects every card/surface in Studio/Frost
2. **`div→button`** — repeated `onClick` + `cursor-pointer` on `<div>` pattern
3. **Hardcoded hex colors** — present in Marketing (88), may appear in Growth, Portfolio, Academy
4. **Emoji violations** — present in Marketing (15), likely in Academy, Portfolio
5. **Missing Sales tab** in Revenue — spec says 3 tabs, code has 2
6. **`var(--btn-primary-bg)` custom token outlier** — may have spread to new pages
7. **`type="button"` missing on most buttons** — Settings audit found 40/41 buttons without `type="button"`, expected in other pages
8. **`aria-label` gap on icon-only buttons** — Settings audit found only 1 `aria-label` across all widgets

---

*Created: 2026-05-31 · Source: SYSTEM_MAP.md + IMPECCABLE/*.md*
