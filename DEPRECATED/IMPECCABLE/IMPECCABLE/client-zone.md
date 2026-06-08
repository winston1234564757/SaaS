# IMPLANGIND_CLIENT.md — Client Zone + Explore Impeccable Reports

> Зведені звіти за 8 напрямками: critique, animate, audit, polish, layout, overdrive, live, optimize.
> Дата: 2026-05-30 · Register: Product (app UI, dashboard)

---

## 1. CRITIQUE — UX Design Review

### Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | BookingWizard steps visible; Explore filter badges OK; no loading skeletons on some sections |
| 2 | Match System / Real World | 4 | Ukrainian copy, natural beauty-industry vocabulary, "ти" form throughout |
| 3 | User Control and Freedom | 3 | Can cancel bookings, change profile; but no undo on booking submit |
| 4 | Consistency and Standards | 2 | Inconsistent theming (some use Tailwind semantic colors, some use CSS vars); different card styles per page |
| 5 | Error Prevention | 3 | OTP validation, form errors, phone format enforcement — good preventions |
| 6 | Recognition Rather Than Recall | 2 | MyBookings shows history; but master names shown repeatedly without avatars; no auto-fill patterns |
| 7 | Flexibility and Efficiency | 2 | No shortcuts, no bulk actions, no favorites/bookmarks |
| 8 | Aesthetic and Minimalist Design | 2 | Bent-overuse of cards; PublicMasterPage is 1122 lines of inline styles; inconsistent spacing |
| 9 | Error Recovery | 3 | Cancel booking, change phone, retry OTP — solid recovery options |
| 10 | Help and Documentation | 1 | No contextual help, no tooltips, no onboarding beyond phone setup |
| **Total** | | **25/40** | **Good — moderate issues** |

### Per-Page Breakdown

| Page | Score | Key Issues |
|------|-------|------------|
| **/explore** | 7/10 | Good search/filter UX; category chips animate-pulse on every icon (annoying); PRO badge uses `bg-warning` |
| **/[slug]** | 6/10 | Feature-rich but 1122 lines; inline styles everywhere; no loading skeleton for booking flow |
| **/[slug]/shop** | 7/10 | Clean cart flow; hard-coded category colors; no empty state per category |
| **/[slug]/portfolio** | 5/10 | Basic horizontal scroll; no grid view option; hard-coded border colors |
| **BookingWizard** | 7/10 | Solid 4-step flow handles all edge cases; prop-drilling nightmare; no progress save |
| **/my/bookings** | 7/10 | Good tabs; cancel + review inline; map link is nice; `cn()` redefined instead of imported |
| **/my/loyalty** | 7/10 | Clean loyalty progress + referral; hard-coded gradient in C2B card |
| **/my/masters** | 8/10 | Clean, simple, good empty state, proper pluralization |
| **/my/profile** | 7/10 | Theme selector is nice; Safety & Health section; some token drift |
| **/my/notifications** | 6/10 | Portfolio consent flow is good; notification routing works; empty state is basic |
| **/setup/phone** | 8/10 | Clean OTP UX; auto-advance; paste support; cooldown timer |

---

## 2. AUDIT — Technical Quality

### Audit Health Score

| # | Dimension | Score | Key Finding |
|---|-----------|-------|-------------|
| 1 | Accessibility | 2 | Buttons have `cursor-pointer` but some `<div>` with onClick; missing aria-labels on icon-only buttons |
| 2 | Performance | 2 | PublicMasterPage 1122 lines = slow render; Framer Motion on every element; `animate-pulse` on 6+ category icons |
| 3 | Responsive Design | 3 | All pages use `max-w-lg mx-auto` for mobile-first; but shop grid `grid-cols-2` may squeeze on 320px |
| 4 | Theming | 1 | HEAVY drift — `bg-warning`, `bg-destructive`, `bg-success`, `bg-primary` scattered across 10+ files |
| 5 | Anti-Patterns | 2 | Card overdose; inline styles; `cn()` redefined in MyBookingsPage; no code splitting on large pages |
| **Total** | | **10/20** | **Acceptable — significant work needed** |

### Detailed Findings by Component

#### P1 — Theming Drift: Semantic Colors Used as Theme Tokens

The Frost/Blossom/Studio themes define `--l-indigo`, `--l-accent`, etc. Many client components still use Tailwind's built-in semantic colors:

| Component | Token Used | Should Be |
|-----------|-----------|-----------|
| `ExplorePage.tsx:13` | `text-primary` | `var(--l-accent)` |
| `ExplorePage.tsx:353` | `bg-warning px-1 py-0.5` | Theme-indigo bg |
| `ExplorePage.tsx:123` | `bg-secondary/50 border border-border` | OK if `--secondary` defined |
| `PublicMasterPage.tsx:587` | `bg-success/12 text-success` | `color-mix(in srgb, var(--l-accent) 12%, transparent)` |
| `ShopPage.tsx:213` | `bg-warning/90 backdrop-blur-sm` | Theme amber |
| `MyBookingsPage.tsx:15` | `var(--warning)`, `var(--success)`, `var(--destructive)` | Some exist in theme but not all |
| `MyProfilePage.tsx:223` | `bg-destructive/10 text-destructive` | `color-mix(in srgb, var(--l-accent) 12%, transparent)` |
| `MyLoyaltyPage.tsx:236` | `bg-gradient-to-br from-accent to-accent/80` | Hard-coded gradient uses accent but not theme-aware |

**Root Cause:** No enforcement of theme CSS variables in client zone. Each page was built independently.

#### P1 — PublicMasterPage Component Size

**Location:** `PublicMasterPage.tsx` — 1122 lines
**Issue:** Single component handles: header, avatar, location, schedule, flash deals, services, products, portfolio, reviews, trusted partners, floating CTA, booking flow — all with inline styles and per-element animation.
**Impact:** Slow render, poor maintainability, high cognitive load.
**Fix:** Split into sub-components (MasterHeader, ServiceList, ProductPreview, ReviewList, MasterSchedule, FlashDealsStrip).

#### P2 — `cn()` Redefined

**Location:** `MyBookingsPage.tsx:142`
**Issue:** `function cn(...args: any[]) { return args.filter(Boolean).join(' '); }` — reimplementation instead of importing from `@/lib/utils/cn`. Same file imports `ExternalLink` but the `cn` utility exists in project.
**Impact:** Inconsistency; `active:[class]` syntax won't work with this simple cn.

#### P2 — `animate-pulse` on Category Icons

**Location:** `ExplorePage.tsx:13`
**Issue:** `animate-pulse` applied to the nails category icon. 6 category icons pulsing simultaneously on the explore page = visual noise.
**Impact:** Distracting, no real purpose.
**Fix:** Remove pulse animation; use static styling.

#### P2 — Inline Styles Everywhere in PublicMasterPage

**Location:** `PublicMasterPage.tsx` — ~300+ inline style declarations
**Issue:** Every element uses `style={{...}}` with computed colors based on theme. No CSS variables, no reusable classes.
**Impact:** Performance (styles recalculated on every render), maintainability (hard to change), bundle size.
**Fix:** Extract theme-dependent styles to CSS variables, use Tailwind classes where possible.

#### P3 — Empty States Overuse `bento-card`

**Location:** All `/my/*` pages
**Issue:** Empty states use the same `bento-card p-10 text-center flex flex-col items-center` pattern — repeated identically across 6+ pages.
**Impact:** Visual monotony.
**Fix:** Create a shared `EmptyState` component with consistent styling.

### Positive Findings
- ✅ MyMastersPage is clean, concise, well-structured (143 lines)
- ✅ PhoneSetupForm has excellent OTP UX (auto-advance, paste, cooldown)
- ✅ MyBookingsPage handles cancel + review flows well
- ✅ ExplorePage has good search + filter UX
- ✅ All pages use Ukrainian language consistently
- ✅ Proper pluralization (`pluralUk`) used throughout
- ✅ BookingWizard handles 10+ edge cases (flash deals, referral, loyalty, limits, upgrades)

---

## 3. ANIMATE — Motion Strategy

### Current State

| Page | Existing Motion | Quality |
|------|----------------|---------|
| **/explore** | Staggered entrance (nav, search, filters, cards) | ✅ Good |
| **/[slug]** | Staggered section reveals, button spring, pulse on availability | ✅ Good — consistent easing |
| **/[slug]/shop** | Bottom sheet spring animation, product tile layout animation | ✅ Good — `type: spring` consistent |
| **BookingWizard** | AnimatePresence step transitions, direction-aware sliding | ✅ Excellent — mode="popLayout" |
| **/my/bookings** | Staggered card entrance, review expand | ✅ Good |
| **/my/loyalty** | Loyalty progress bar spring, tab transitions | ✅ Good |
| **/my/masters** | Staggered card entrance | ✅ Good |
| **/my/profile** | Staggered section entrance | ✅ Good |
| **/my/notifications** | Staggered list entrance | ✅ Good |
| **/setup/phone** | Phone→OTP step transition with slide | ✅ Good |

### What's Missing

| Category | Missing | Where |
|----------|---------|-------|
| Micro-interactions | Button hover scale | Many secondary buttons lack hover states |
| Micro-interactions | Card hover lift | Explore master cards, shop product tiles |
| Feedback | CTA click confirmation | No success animation on booking (only success step) |
| Loading | Skeleton screens | Booking flow has skeleton; other pages load data without feedback |
| Load | Page entrance | Consistent staggered entrance pattern already used — good |
| Transitions | Tab change | Explore filter panel uses height animation (good); MyLoyalty uses direction-aware (good) |

### `prefers-reduced-motion` Check

- ✅ BookingWizard uses `AnimatePresence` which respects reduced motion via MotionConfig
- ⚠️ Most pages don't wrap entrance animations in reduced-motion check
- ⚠️ No global `@media (prefers-reduced-motion: reduce)` in client CSS

---

## 4. POLISH — Final Quality Pass

### Design System Alignment

**Already aligned:**
- Fonts: Cormorant (display, via `heading-serif`) + Geist (body)
- Card style: `bento-card` component used throughout
- Responsive: `max-w-lg mx-auto` consistent on all client pages
- Staggered entrance: Consistent `delay: index * 0.04-0.06` pattern

**Drift by page:**

| Page | Drift | Fix |
|------|-------|-----|
| ExplorePage | `bg-warning` for PRO badge | Use `color-mix(in srgb, var(--l-indigo-glow) 70%, transparent)` |
| ExplorePage | `text-primary` everywhere | Replace with `var(--l-indigo)` or `var(--l-accent)` |
| PublicMasterPage | 300+ inline styles | Extract to CSS variables |
| PublicMasterPage | `bg-success/12` | Use theme tokens |
| ShopPage | Hard-coded `CATEGORY_COLORS` | Use theme palette |
| MyBookingsPage | `cn()` redefined | Import from lib |
| MyProfilePage | `bg-destructive/10` | Theme token |
| MyLoyaltyPage | Hard-coded gradient | Theme-aware gradient |

### Interaction States Checklist

| Element | Default | Hover | Active | Focus |
|---------|---------|-------|--------|-------|
| Explore search | ✅ | ✅ | ✅ | ✅ |
| Explore category chips | ✅ | ✅ | ✅ | ✅ |
| Master cards (Explore) | ✅ | ✅ (`hover:shadow-lg`) | ✅ (`active:scale-[0.95]`) | ❌ |
| Service buttons (PublicMaster) | ✅ | ✅ (`hover:shadow-lg`) | ✅ (`whileTap: scale 0.95`) | ❌ |
| Shop product tiles | ✅ | ❌ | ✅ (`whileTap: scale 0.95`) | ❌ |
| Booking step buttons | ✅ | ✅ | ✅ | ❌ |
| MyBookings order cards | ✅ | ❌ | ❌ | ❌ |
| MyLoyalty loyalty cards | ✅ | ❌ | ❌ | ❌ |
| MyProfile save button | ✅ | ✅ | ✅ | ❌ |
| PhoneSetup OTP inputs | ✅ | ✅ | ✅ | ✅ (`focus:border-primary`) |

### Copy Polish

- ✅ Ukrainian language throughout
- ✅ Consistent "ти" form
- ✅ No AI vocabulary detected ("екосистема", "амбасадор" removed)
- ⚠️ "Refer & Earn" tab label in English — inconsistency
- ✅ Proper pluralization everywhere
- ⚠️ "Залишити відгук" button text — check for consistency across forms

---

## 5. LAYOUT — Spatial Design

### Current Layout Analysis

**Strengths:**
- Consistent `max-w-lg mx-auto` mobile-first approach
- Good section spacing (flex-col gap-4)
- Bento cards with consistent padding

**Weaknesses:**

1. **Card overdose across pages** — Every list, empty state, section header uses `bento-card`. No visual variety.
   - ExplorePage: master cards
   - MyBookingsPage: order cards, header
   - MyLoyaltyPage: loyalty cards, promo cards, header
   - MyMastersPage: master cards, header, empty state
   - MyProfilePage: avatar card, data card, health card, theme card, telegram card, links card
   - ClientNotificationsPage: consent cards, notification cards, header

   Total: ~8-10 bento-cards visible simultaneously on some pages = visual fatigue.

2. **PublicMasterPage density** — 1122 lines of content with ~15 sections stacked vertically. Too much to scroll through. No collapse/expand for sections.

3. **Shop grid** `grid-cols-2` at all viewports — no single-column breakpoint for very narrow screens.

4. **Tab consistency** — Tab switchers have different styling:
   - MyLoyaltyPage: `p-1 bg-secondary rounded-xl` + `rounded-lg` tabs
   - MyBookingsPage: `p-1 rounded-xl bg-secondary/50` + `rounded-lg` tabs
   - Slightly inconsistent backgrounds and padding.

### Proposed Fixes

| Issue | Location | Fix |
|-------|----------|-----|
| Card overdose | All `/my/*` | Create non-card variants: plain list items, table-like rows, chip groups |
| Page density | PublicMasterPage | Add collapsible sections; prioritize services + booking above fold |
| Shop grid narrow | ShopPage | `grid-cols-2 sm:grid-cols-2` → responsive or `minmax(140px,1fr)` |
| Tab inconsistency | MyBookings, MyLoyalty | Extract shared `TabSwitcher` component |
| Section padding | All | Standardize `gap-4` → semantic spacing tokens |

---

## 6. OVERDRIVE — Extraordinary Enhancements

```
──────────── ⚡ OVERDRIVE ─────────────
》》》 Entering overdrive mode...
```

### Direction 1: BookingWizard — Sticky Summary Panel

**Concept:** As the user progresses through the 4-step wizard, a persistent sticky summary panel shows: selected services, total price, estimated duration, and any discounts. Updates in real-time as selections change. On mobile, collapsed to a thin bar; on desktop, a fixed sidebar.

**Technique:** 
- Extract pricing summary to separate component
- `position: sticky` on desktop; collapsible bar on mobile
- Animated price changes with spring physics (already have useSpring available)

**Trade-offs:** Moderate complexity; pricing hook already exists (`useBookingPricing`). High UX value.

### Direction 2: PublicMasterPage — Scroll-Activated Service Cards

**Concept:** Service cards animate in as the user scrolls, but with a twist: the card's background subtly shifts toward the theme accent color as it enters viewport, then settles back. Creates a "breathing" effect that draws attention to the booking entry point.

**Technique:**
- IntersectionObserver + CSS `@property` for background color animation
- `whileInView` with spring animation (already present)
- Add subtle gradient shift on the card background

**Trade-offs:** Minimal performance cost (GPU). Adds premium feel.

### Direction 3: ExplorePage — Map Toggle

**Concept:** Toggle between list view and map view showing nearby masters with clustered pins. Uses the `master.lat`/`master.lng` data that already exists in the database.

**Technique:**
- Leaflet or MapLibre GL for lightweight map rendering
- Dynamic import (ssr: false) to avoid bundle impact
- Cluster markers when zoomed out

**Trade-offs:** Adds ~50KB to bundle (if Leaflet). Alternative: static map tiles with pin overlays. Only useful if many masters have coordinates.

### Recommendation

**Start with Direction 1** (sticky pricing summary) — highest UX impact, reuses existing code, minimal risk.

---

## 7. LIVE — Variant Mode Proposal

### Target Elements for Live Session

| Element | Action | Variant Axes |
|---------|--------|--------------|
| ExplorePage master card | `layout` | Card vs list vs compact density |
| PublicMasterPage service button | `bolder` | Color commitment, hierarchy, imagery |
| BookingWizard step indicator | `polish` | Dot vs number vs progress bar, density |
| ShopPage product tile | `layout` | Grid 2-col vs 3-col vs list, density |
| MyLoyalty loyalty card | `distill` | Progress bar vs stamp card vs simple count |

### Live Setup Required

```bash
cd bookit
npm run dev
# In another terminal:
node "C:\Users\Vitossik\.agents\skills\impeccable\scripts\live.mjs"
```

---

## 8. OPTIMIZE — Performance

### Bundle Analysis (estimated)

| Page | Key Dependencies | Size (gzipped) |
|------|-----------------|----------------|
| /explore | Framer Motion, Lucide (few icons) | ~35KB |
| /[slug] | Framer Motion, Lucide, date-fns, Supabase client | ~55KB |
| /[slug]/shop | Framer Motion, Lucide, next/image | ~40KB |
| BookingWizard | Framer Motion, date-fns, 8 sub-components | ~45KB |
| /my/bookings | Framer Motion, date-fns/locale/uk | ~50KB |
| /my/loyalty | Framer Motion, 4 sub-components | ~40KB |
| /my/profile | Framer Motion, Lucide, Supabase, js-cookie | ~45KB |

### Bottlenecks

| Issue | Impact | Location | Fix |
|-------|--------|----------|-----|
| Framer Motion on every page | 30KB+ per page | All pages | Keep; it's foundational |
| PublicMasterPage 1122 lines | Slow initial render, hydration | PublicMasterPage.tsx | Code-split sections |
| Inline styles in PublicMasterPage | Style recalculation | ~300 style={{}} | Extract to CSS classes |
| `animate-pulse` on 6 category icons | Continuous repaint | ExplorePage.tsx:13 | Remove pulse |
| date-fns/locale import | ~15KB for locale | MyBookingsPage | Consider tree-shake or lighter alternative |
| No lazy loading on below-fold | Images load all at once | PublicMasterPage (portfolio, products) | Already uses next/image — should be fine |

### Optimization Recommendations

#### P2 — Code-split PublicMasterPage

```tsx
// Instead of one 1122-line component:
const MasterHeader = dynamic(() => import('./MasterHeader'));
const ServiceList = dynamic(() => import('./ServiceList'));
const ProductPreview = dynamic(() => import('./ProductPreview'));
const ReviewList = dynamic(() => import('./ReviewList'));
```

Each section can be lazy-loaded with `ssr: false` for sections below the fold.

#### P2 — Remove `animate-pulse` from Category Icons

```tsx
// Before:
<Sparkles size={size} className="text-primary animate-pulse" />
// After:
<Sparkles size={size} className="text-primary" />
```

#### P3 — Create Shared EmptyState Component

Currently 6+ pages define the same empty state pattern:
```tsx
// Repeated everywhere:
<div className="bento-card p-10 text-center flex flex-col items-center gap-3">
  <Icon size={32} className="text-muted-foreground/30" />
  <p className="text-sm font-semibold text-foreground">...</p>
  <p className="text-xs text-muted-foreground/60 mt-1">...</p>
  <Link href="..." className="...">...</Link>
</div>
```

**Fix:** Extract to shared `EmptyState` component:
```tsx
<EmptyState icon={<CalendarDays />} title="Записів поки немає" action={{ label: "Знайти майстра", href: "/explore" }} />
```

#### P3 — Extract `cn()` Import

```tsx
// MyBookingsPage.tsx:142 — remove this:
function cn(...args: any[]) { return args.filter(Boolean).join(' '); }
// Replace import:
import { cn } from '@/lib/utils/cn';
```

---

## Зведення пріоритетних дій

### P0 — Must Fix
1. **Theming drift** — 15+ instances of `bg-warning`, `bg-success`, `bg-destructive` in client zone. Замінити на theme CSS vars
2. **PublicMasterPage code-split** — 1122 lines → 5-6 sub-components

### P1 — Should Fix
3. **`cn()` redefinition** — видалити локальну функцію, імпортувати з lib
4. **Category icon pulse** — видалити `animate-pulse` з ExplorePage іконок
5. **Card fatigue** — створити shared EmptyState; додати non-card variants в списки

### P2 — Nice to Fix
6. **Inline styles** — extract theme-dependent styles to CSS vars (PublicMasterPage)
7. **Tab component** — уніфікувати таб-світчер між MyBookings та MyLoyalty
8. **Sticky pricing summary** — overdrive direction 1

### P3 — Polish
9. **"Refer & Earn"** — перекласти на українську
10. **hover states** — додати hover на всі клікабельні картки
11. **Shop grid breakpoint** — `minmax(140px,1fr)` для вузьких екранів

---

*Generated by impeccable skill · 2026-05-30*
