# Phase P — Public Pages (11 files)
**Instrument: critique (A+B) + audit + animate + overdrive + polish + layout + optimize**
**Date: 2026-06-01 | Real sub-agent: ses_17b8c0d06ffew6plQ1RP6iX2lk**

---

## Overview
- **Average critique score: 27.7/40**
- **Best file**: `StudioPublicPage.tsx` (33/40)
- **Worst file**: `invite/[code]/page.tsx` (20/40)
- **P0: 3 | P1: 6 | P2: ~20 | P3: ~4**

---

## P0 Issues (Blocking)

### P0-001: THEMING CRISIS — 6 files hardcoded Blossom colors
**Files**: PublicMasterPage.tsx, portfolio/[id]/page.tsx, invite/[code]/page.tsx, ShopPage.tsx, PublicPortfolioGallery.tsx, legal/page.tsx

Hardcoded Blossom-specific colors break Studio and Frost themes:
- `#6B5750`, `#A8928D`, `#FFE8DC`, `#2C1A14`, `rgba(255,210,194,0.55)`, `#F5E8E3`, `#789A99`, `#E8D0C8`

**Fix**: Every hardcoded color → CSS variable or Tailwind theme token.

### P0-002: OPEN REDIRECT — r/[code]/route.ts:40
`link.target_url` redirected to without any validation. An attacker who creates a broadcast_links row can redirect to phishing sites. Also crashes on relative URLs because `new URL()` requires absolute.

**Fix**: Validate against allowlist or ensure relative-path-only redirect.

### P0-003: TYPE SAFETY — invite/[code]/page.tsx
Pervasive `as any` casts (4+ instances) around Supabase join results. Schema changes silently propagate undefined.

**Fix**: Fix Supabase type generation or use proper type guards.

---

## P1 Issues (Major)

| ID | File | Issue |
|----|------|-------|
| P1-001 | PublicMasterPage.tsx | 1127-line monolith — decompose into page-level composition |
| P1-002 | PublicMasterPage.tsx | `isDark` manual branching instead of CSS variables |
| P1-003 | ShopPage.tsx | CATEGORY_COLORS hardcoded hex, not theme-aware |
| P1-004 | portfolio/[id]/page.tsx | Full-page bg + gradient hardcoded Blossom-only |
| P1-005 | offline/page.tsx | Emoji no aria-label; reload loop risk |
| P1-006 | invite/[code]/page.tsx | Hardcoded `bg-white/60`, `text-white` |

---

## Assessment B (detect)
No anti-patterns detected by CLI for any file.

---

## Per-File Audit Scores

| File | Score | A11y | Perf | Resp | Theme | Anti-P |
|------|-------|------|------|------|-------|--------|
| ExplorePage.tsx | 32/40 | 3 | 3 | 3 | 3 | 3 |
| PublicMasterPage.tsx | 22/40 | 2 | 2 | 3 | 1 | 2 |
| ShopPage.tsx | 26/40 | 2 | 3 | 3 | 2 | 2 |
| PublicPortfolioGallery.tsx | 30/40 | 3 | 4 | 3 | 2 | 3 |
| portfolio/[id]/page.tsx | 28/40 | 3 | 3 | 3 | 1 | 2 |
| StudioPublicPage.tsx | 33/40 | 3 | 4 | 3 | 3 | 3 |
| studio/join/page.tsx | 30/40 | 3 | 4 | 4 | 3 | 3 |
| invite/[code]/page.tsx | 20/40 | 2 | 3 | 3 | 1 | 2 |
| legal pages | 32/40 | 3 | 4 | 3 | 2 | 3 |
| offline/page.tsx | 28/40 | 2 | 4 | 4 | 2 | 2 |
| r/[code]/route.ts | 24/40 | 4 | 4 | 4 | 4 | 1 |

---

## Animate (instrument 4)
- **ExplorePage**: master cards need staggered entrance animation; loading → content transition
- **PublicMasterPage**: booking flow step transitions; schedule grid cell hover effects
- **ShopPage**: cart add/remove micro-animation; product card hover scale
- **StudioPublicPage**: accordion already animated (Safari issue noted)
- **invite/[code]**: entrance animation for profile card + CTA

## Overdrive (instrument 5)
- **PublicMasterPage**: View Transitions API for portfolio image → fullscreen navigation
- **ExplorePage**: no extraordinary moments needed — search/discovery is functional
- **r/[code]/route**: no UI — pure redirect

## Polish (instrument 6)
- Replace ALL hardcoded colors with theme tokens (P0)
- Fix open redirect with URL validation (P0)
- Replace `as any` with proper Supabase types (P0)
- Decompose PublicMasterPage 1127-line monolith (P1)
- Add loading skeletons to ExplorePage and ShopPage
- Fix touch targets to 44px minimum across all files
- Add `<span role="img" aria-label="">` to offline page emoji
- Fix `navigator.onLine` check before reload
- Extract shared formatPrice/formatDuration into shared utils
- Replace `var(--surface)` inline → `bg-secondary`, `var(--text-tertiary)` → `text-muted-foreground`
- Add legal pages layout wrapper with header/footer
- Fix `h-13` + `style={{ height }}` duplicate in invite page

## Layout (instrument 7)
- **ExplorePage**: good filter + card grid layout; maintain
- **PublicMasterPage**: extreme density — decompose into sections with breathing room
- **ShopPage**: cart layout could use sticky summary on desktop; mobile cart good
- **Legal pages**: missing layout wrapper — needs site chrome
- **offline page**: center vertically, add back-navigation button

## Optimize (instrument 8)
- Extract `getCategoryIcon` → constant map in ExplorePage
- Remove `eslint-disable` for dependency array in PublicMasterPage — fix deps properly
- Extract `formatPrice`/`formatDuration` into shared utility for DRY
- `NEXT_PUBLIC_SITE_URL!` → provide fallback value in r/[code]/route.ts
- Fix server timezone usage in studio/join and portfolio pages

---

## Top 3 Critical Issues
1. **P0-001**: Theming crisis across 6 files — hardcoded Blossom colors break Studio/Frost
2. **P0-002**: Open redirect vulnerability in `r/[code]/route.ts`
3. **P0-003**: Pervasive `as any` casts in `invite/[code]/page.tsx`

## Cross-Cutting Patterns
- 6 of 11 files hardcode Blossom-specific colors — theming is the #1 systemic issue
- Touch targets < 44px in ExplorePage and ShopPage filter chips
- Duplicated `formatPrice`/`formatDuration` in multiple public components
- `var(--X)` used via inline styles instead of Tailwind aliases (`bg-secondary`, `text-muted-foreground`)
- Server-side `new Date()` in time-sensitive queries risks TZ bugs


---

--- 
## 📸 Візуальний E2E Аудит & Порівняння Тем (Visual Registry & Carousel)
> Цей розділ автоматично синхронізовано з E2E тестами та скріншотами Playwright за допомогою інтерактивних каруселей.

### 📍 Зона: 16-public-profile (Public Profile)

#### 🖼️ Екран: Public Portfolio Desktop

````carousel
![🌸 Blossom Theme: Public Portfolio Desktop](../screenshots/blossom/16-public-profile/public-portfolio-desktop.png)
<!-- slide -->
![❄️ Frost Theme: Public Portfolio Desktop](../screenshots/frost/16-public-profile/public-portfolio-desktop.png)
<!-- slide -->
![🌲 Studio Theme: Public Portfolio Desktop](../screenshots/studio/16-public-profile/public-portfolio-desktop.png)
````

*Швидкі посилання на оригінали:* [🌸 Blossom](../screenshots/blossom/16-public-profile/public-portfolio-desktop.png) | [❄️ Frost](../screenshots/frost/16-public-profile/public-portfolio-desktop.png) | [🌲 Studio](../screenshots/studio/16-public-profile/public-portfolio-desktop.png)

#### 🖼️ Екран: Public Profile Desktop Desktop

````carousel
![🌸 Blossom Theme: Public Profile Desktop Desktop](../screenshots/blossom/16-public-profile/public-profile-desktop-desktop.png)
<!-- slide -->
![❄️ Frost Theme: Public Profile Desktop Desktop](../screenshots/frost/16-public-profile/public-profile-desktop-desktop.png)
<!-- slide -->
![🌲 Studio Theme: Public Profile Desktop Desktop](../screenshots/studio/16-public-profile/public-profile-desktop-desktop.png)
````

*Швидкі посилання на оригінали:* [🌸 Blossom](../screenshots/blossom/16-public-profile/public-profile-desktop-desktop.png) | [❄️ Frost](../screenshots/frost/16-public-profile/public-profile-desktop-desktop.png) | [🌲 Studio](../screenshots/studio/16-public-profile/public-profile-desktop-desktop.png)

#### 🖼️ Екран: Public Profile Mobile Mobile

````carousel
![🌸 Blossom Theme: Public Profile Mobile Mobile](../screenshots/blossom/16-public-profile/public-profile-mobile-mobile.png)
<!-- slide -->
![❄️ Frost Theme: Public Profile Mobile Mobile](../screenshots/frost/16-public-profile/public-profile-mobile-mobile.png)
<!-- slide -->
![🌲 Studio Theme: Public Profile Mobile Mobile](../screenshots/studio/16-public-profile/public-profile-mobile-mobile.png)
````

*Швидкі посилання на оригінали:* [🌸 Blossom](../screenshots/blossom/16-public-profile/public-profile-mobile-mobile.png) | [❄️ Frost](../screenshots/frost/16-public-profile/public-profile-mobile-mobile.png) | [🌲 Studio](../screenshots/studio/16-public-profile/public-profile-mobile-mobile.png)

#### 🖼️ Екран: Public Shop Desktop

````carousel
![🌸 Blossom Theme: Public Shop Desktop](../screenshots/blossom/16-public-profile/public-shop-desktop.png)
<!-- slide -->
![❄️ Frost Theme: Public Shop Desktop](../screenshots/frost/16-public-profile/public-shop-desktop.png)
<!-- slide -->
![🌲 Studio Theme: Public Shop Desktop](../screenshots/studio/16-public-profile/public-shop-desktop.png)
````

*Швидкі посилання на оригінали:* [🌸 Blossom](../screenshots/blossom/16-public-profile/public-shop-desktop.png) | [❄️ Frost](../screenshots/frost/16-public-profile/public-shop-desktop.png) | [🌲 Studio](../screenshots/studio/16-public-profile/public-shop-desktop.png)

### 📍 Зона: 17-explore (Explore)

#### 🖼️ Екран: Explore Desktop Desktop

````carousel
![🌸 Blossom Theme: Explore Desktop Desktop](../screenshots/blossom/17-explore/explore-desktop-desktop.png)
<!-- slide -->
![❄️ Frost Theme: Explore Desktop Desktop](../screenshots/frost/17-explore/explore-desktop-desktop.png)
<!-- slide -->
![🌲 Studio Theme: Explore Desktop Desktop](../screenshots/studio/17-explore/explore-desktop-desktop.png)
````

*Швидкі посилання на оригінали:* [🌸 Blossom](../screenshots/blossom/17-explore/explore-desktop-desktop.png) | [❄️ Frost](../screenshots/frost/17-explore/explore-desktop-desktop.png) | [🌲 Studio](../screenshots/studio/17-explore/explore-desktop-desktop.png)

#### 🖼️ Екран: Explore Master Card Desktop

````carousel
![🌸 Blossom Theme: Explore Master Card Desktop](../screenshots/blossom/17-explore/explore-master-card-desktop.png)
<!-- slide -->
![❄️ Frost Theme: Explore Master Card Desktop](../screenshots/frost/17-explore/explore-master-card-desktop.png)
<!-- slide -->
![🌲 Studio Theme: Explore Master Card Desktop](../screenshots/studio/17-explore/explore-master-card-desktop.png)
````

*Швидкі посилання на оригінали:* [🌸 Blossom](../screenshots/blossom/17-explore/explore-master-card-desktop.png) | [❄️ Frost](../screenshots/frost/17-explore/explore-master-card-desktop.png) | [🌲 Studio](../screenshots/studio/17-explore/explore-master-card-desktop.png)

#### 🖼️ Екран: Explore Mobile Mobile

````carousel
![🌸 Blossom Theme: Explore Mobile Mobile](../screenshots/blossom/17-explore/explore-mobile-mobile.png)
<!-- slide -->
![❄️ Frost Theme: Explore Mobile Mobile](../screenshots/frost/17-explore/explore-mobile-mobile.png)
<!-- slide -->
![🌲 Studio Theme: Explore Mobile Mobile](../screenshots/studio/17-explore/explore-mobile-mobile.png)
````

*Швидкі посилання на оригінали:* [🌸 Blossom](../screenshots/blossom/17-explore/explore-mobile-mobile.png) | [❄️ Frost](../screenshots/frost/17-explore/explore-mobile-mobile.png) | [🌲 Studio](../screenshots/studio/17-explore/explore-mobile-mobile.png)

