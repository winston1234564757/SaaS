# Phase W — Complex Widgets (12 files) — FULL 8-INSTRUMENT WORKFLOW

**Date:** 2026-06-01 (REDONE)
**Skill:** impeccable — LOADED ✅
**Instrument 1/8:** critique → Assessment A — sub-agent `ses_17b9352e5ffec07ITCsUklYcG0` ✅
**Instrument 2/8:** critique → Assessment B — `npx impeccable detect --json --gpt` all 12 files ✅ (all `[]`)
**Instruments 3-8:** audit, animate, overdrive, polish, layout, optimize — applied via skill references ✅

---

## Files Audited

| # | File | Lines | Location |
|---|------|:-----:|----------|
| W1 | BookingWizard.tsx | 445 | `src/components/shared/` |
| W2 | StoryGenerator.tsx | 1528 | `src/components/master/marketing/` |
| W3 | BroadcastEditor.tsx | 755 | `src/components/master/marketing/` |
| W4 | BroadcastHistory.tsx | 211 | `src/components/master/marketing/` |
| W5 | NotificationsBell.tsx | 166 | `src/components/master/dashboard/` |
| W6 | ChannelBanner.tsx | 105 | `src/components/client/` |
| W12a | SmartBackButton.tsx | 55 | `src/components/shared/` |
| W12b | PushSubscribeCard.tsx | 266 | `src/components/shared/` |
| W12c | BlobBackground.tsx | 58 | `src/components/shared/` |
| W12d | BeautyLoader.tsx | 96 | `src/components/shared/` |
| W12e | ServiceWorkerRegistration.tsx | 15 | `src/components/shared/` |
| W12f | InstallBanner.tsx | 82 | `src/components/shared/` |

---

## Instrument 3/8 — audit (reference: audit.md)

| File | A11y | Perf | Theming | Responsive | Anti-Pattern | Total /20 |
|------|:----:|:----:|:-------:|:----------:|:------------:|:---------:|
| BookingWizard | 4 | 3 | 3 | 3 | 3 | **16** |
| StoryGenerator | 2 | 2 | 2 | 2 | 2 | **10** |
| BroadcastEditor | 2 | 3 | **0** | 3 | **1** | **9** |
| BroadcastHistory | 2 | 3 | **0** | 3 | **0** | **8** |
| NotificationsBell | 3 | 4 | 3 | 4 | 3 | **17** |
| ChannelBanner | 4 | 4 | 4 | 4 | 4 | **20** |
| SmartBackButton | 3 | 4 | 4 | 3 | 4 | **18** |
| PushSubscribeCard | 3 | 3 | 4 | 3 | 3 | **16** |
| BlobBackground | 4 | 3 | **0** | 4 | 3 | **14** |
| BeautyLoader | 2 | 3 | 2 | 3 | 2 | **12** |
| ServiceWorkerRegistration | 3 | 4 | 4 | 4 | 4 | **19** |
| InstallBanner | 3 | 3 | 2 | 3 | 3 | **14** |

**Worst:** BroadcastHistory (8/20 — theming 0/4, anti-pattern 0/4), BroadcastEditor (9/20 — theming 0/4)
**Best:** ChannelBanner (20/20 — perfect score)

---

## Instrument 4/8 — animate (reference: animate.md)

| File | Motion | Duration | Easing | Reduced-motion | Notes |
|------|--------|----------|--------|:--------------:|-------|
| BookingWizard | AnimatePresence step transitions | spring | default | ❌ | Direction-aware exit/enter |
| StoryGenerator | Framer Layout + entrance | default | default | ❌ | 1528-ln god component |
| BroadcastEditor | Framer Layout + entrance | default | default | ❌ | Step transitions (edit→confirm) |
| BroadcastHistory | AnimatePresence expand/collapse | default | default | ❌ | StatCards enter simultaneously |
| NotificationsBell | Spring bottom-sheet + stagger | spring | 300/30 | ❌ | 3ms stagger per item |
| ChannelBanner | AnimatePresence | spring | default | ❌ | Smooth enter/exit |
| SmartBackButton | N/A | — | — | — | No animation |
| PushSubscribeCard | N/A | — | — | — | State transitions only |
| BlobBackground | CSS animate-spin-slow | 20s | linear | ❌ | CSS animation, no FM |
| BeautyLoader | AnimatePresence phrase cycle | 3s interval | ease | ❌ | Sparkle pulse + progress |
| ServiceWorkerRegistration | N/A | — | — | — | Side-effect only |
| InstallBanner | N/A | — | — | — | No animation |

**Gap:** 9/12 files with animations lack `prefers-reduced-motion` guard

---

## Instrument 5/8 — overdrive (reference: overdrive.md)

| File | Direction | Viability |
|------|-----------|:---------:|
| BookingWizard | View Transitions API: morph step containers — fluid page-to-page feel | High |
| StoryGenerator | Canvas rendering to WebGL for real-time story preview | Medium (1528-line refactor needed first) |
| BroadcastEditor | Rich text preview with live mobile mockup in-panel | Medium |
| BroadcastHistory | Animated stat transitions between time periods | Low |
| ChannelBanner | Morphing banner: slides in from bell icon | High |
| NotificationsBell | Notification toast morphs from bell icon (View Transitions) | High |
| BlobBackground | Pointer-reactive blob movement (Parallax + cursor tracking) | Medium |
| BeautyLoader | Progress bar with actual operation percentage | Medium |
| InstallBanner | Animated install prompt drops in from top with spring | Medium |

---

## Instrument 6/8 — polish (reference: polish.md)

| File | Design System | Spacing | States | Copy | Touch |
|------|:-------------:|:-------:|:------:|:----:|:-----:|
| BookingWizard | ⚠️ (1 text-white) | ✅ | ✅ | ✅ | ✅ |
| StoryGenerator | ❌ (gradients, bg-white/80) | ✅ | ⚠️ | ⚠️ | ✅ |
| BroadcastEditor | ❌ (20+ inline hex/rgba) | ✅ | ✅ | ✅ | ✅ |
| BroadcastHistory | ❌ (StatCard hard-coded) | ✅ | ✅ | ✅ | ✅ |
| NotificationsBell | ❌ (rgba peach bg) | ✅ | ✅ | ✅ | ✅ |
| ChannelBanner | ✅ | ✅ | ✅ | ✅ | ✅ |
| SmartBackButton | ✅ | N/A | ✅ | ✅ | ❌ (h-8=32px) |
| PushSubscribeCard | ✅ | ✅ | ✅ | ✅ | ✅ |
| BlobBackground | ❌ (4 hex/rgba) | N/A | N/A | N/A | N/A |
| BeautyLoader | ⚠️ (bg-peach) | ✅ | ✅ | ✅ | ✅ |
| ServiceWorkerRegistration | ✅ (no UI) | N/A | N/A | N/A | N/A |
| InstallBanner | ⚠️ (text-white×4) | ✅ | ⚠️ | ✅ | ✅ |

---

## Instrument 7/8 — layout (reference: layout.md)

| File | Hierarchy | Density | Issues |
|------|:---------:|:-------:|--------|
| BookingWizard | Clear (steps) | Normal | Good step progress indicator |
| StoryGenerator | Complex (modal) | Dense | 1528 lines, needs decomposition |
| BroadcastEditor | Clear (edit→confirm) | Normal | Collapsible sections good |
| BroadcastHistory | Clear (cards+stats) | Normal | Expand/collapse per card |
| NotificationsBell | Good (list) | Normal | Staggered animation + badge |
| ChannelBanner | Clear (channels) | Normal | Max-w-lg constraint |
| SmartBackButton | Simple | Compact | Floating vs inline |
| PushSubscribeCard | Clear (steps) | Normal | 7-state machine |
| BlobBackground | N/A (decorative) | N/A | Absolute positioned |
| BeautyLoader | Clear (icon→text→bar) | Normal | Fullscreen centered |
| ServiceWorkerRegistration | N/A (no UI) | N/A | Returns null |
| InstallBanner | Clear (icon→text→btn) | Compact | Bottom-aligned |

---

## Instrument 8/8 — optimize (reference: optimize.md)

| File | Bundle | Render | Layout shift | Issue |
|:----:|:------:|:------:|:------------:|-------|
| BookingWizard | ✅ | ✅ | ✅ | Double-submit guard |
| StoryGenerator | ❌ (1528 lines) | ⚠️ | ✅ | God component, canvas export |
| BroadcastEditor | ✅ | ✅ | ✅ | Debounced search |
| BroadcastHistory | ✅ | ✅ | ✅ | AnimatePresence clean |
| NotificationsBell | ✅ | ✅ | ✅ | Staggered list |
| ChannelBanner | ✅ | ✅ | ✅ | Minimal |
| SmartBackButton | ✅ | ✅ | ✅ | Minimal |
| PushSubscribeCard | ✅ | ✅ | ✅ | 8s timeouts |
| BlobBackground | ✅ | ✅ | ✅ | CSS animation |
| BeautyLoader | ✅ | ⚠️ | ✅ | z-9999 creates layer |
| ServiceWorkerRegistration | ✅ | ✅ | ✅ | SSR-safe |
| InstallBanner | ✅ | ✅ | ✅ | localStorage guard |

---

## Final Scores

| File | Lines | Critique /40 | Audit /20 | Animate | Overdrive | Polish | Layout | Optimize | Overall |
|------|:-----:|:-----------:|:---------:|:-------:|:---------:|:------:|:------:|:--------:|:-------:|
| BookingWizard | 445 | 33/40 | 16 | 3/5 | high | 1 drift | ✅ | ✅ | B+ |
| StoryGenerator | 1528 | **24/40** | **10** | 2/5 | medium | 4 drifts | ⚠️ | ⚠️ | **C** |
| BroadcastEditor | 755 | **23/40** | **9** | 2/5 | medium | **P0** | ✅ | ✅ | **F** |
| BroadcastHistory | 211 | **23/40** | **8** | 2/5 | low | **P0** | ✅ | ✅ | **F** |
| NotificationsBell | 166 | 30/40 | 17 | 3/5 | high | **P0** | ✅ | ✅ | B- |
| ChannelBanner | 105 | **35/40** | **20** | 3/5 | high | ✅ | ✅ | ✅ | **A** |
| SmartBackButton | 55 | 29/40 | 18 | N/A | N/A | 1 drift | ✅ | ✅ | B |
| PushSubscribeCard | 266 | 32/40 | 16 | N/A | N/A | 1 drift | ✅ | ✅ | B+ |
| BlobBackground | 58 | 30/40 | 14 | 1/5 | medium | ❌ (P3) | ✅ | ✅ | B- |
| BeautyLoader | 96 | **24/40** | **12** | 1/5 | medium | 2 drifts | ✅ | ⚠️ | C+ |
| ServiceWorkerRegistration | 15 | **37/40** | **19** | N/A | N/A | ✅ | N/A | ✅ | **A** |
| InstallBanner | 82 | 26/40 | 14 | N/A | N/A | 1 drift | ✅ | ✅ | B- |

---

## Priority Issues

**P0:**
1. **BroadcastEditor.tsx** — Entire component hard-coded for Blossom (20+ inline hex/rgba). Dark mode broken. Modal bg `rgba(255,232,220,0.98)` only works on Blossom.
2. **BroadcastHistory.tsx** — StatCard hard-codes all colors (`#5C9E7A`, `#A8928D`, `#2C1A14`). Card bg `rgba(255,255,255,0.68)`. Entire analytics grid broken on Studio/Frost.
3. **NotificationsBell.tsx** — Bottom-sheet bg `rgba(255,248,244,0.97)` hard-coded peach.

**P1 (selected):**
1. BroadcastEditor — Hard-coded gradient buttons (`#2C1A14` → `#4A2E24`)
2. StoryGenerator — 1528-line god component, needs decomposition
3. StoryGenerator — Missing aria-labels on all interactive controls

**P2 (selected):**
1. BookingWizard — `text-white` on limit-reached button
2. BroadcastEditor/BroadcastHistory — prefers-reduced-motion absent
3. SmartBackButton — h-8=32px touch target (should be 44px)
4. PushSubscribeCard — 6 console.log statements in production
5. InstallBanner — 4× `text-white` hard-coded

**Gold standards:**
1. **ChannelBanner** (35/40, 20/20 audit) — 100% CSS variables, correct aria-labels, try/catch on errors
2. **ServiceWorkerRegistration** (37/40, 19/20 audit) — Minimal, SSR-safe, error handling

---

*8 instruments complete: critique (sub-agent A + detect B) → audit → animate → overdrive → polish → layout → optimize*


---

--- 
## 📸 Візуальний E2E Аудит & Порівняння Тем (Visual Registry & Carousel)
> Цей розділ автоматично синхронізовано з E2E тестами та скріншотами Playwright за допомогою інтерактивних каруселей.

### 📍 Зона: 03-dashboard (Dashboard)

#### 🖼️ Екран: Dashboard Overview Desktop Desktop

````carousel
![🌸 Blossom Theme: Dashboard Overview Desktop Desktop](../screenshots/blossom/03-dashboard/dashboard-overview-desktop-desktop.png)
<!-- slide -->
![❄️ Frost Theme: Dashboard Overview Desktop Desktop](../screenshots/frost/03-dashboard/dashboard-overview-desktop-desktop.png)
<!-- slide -->
![🌲 Studio Theme: Dashboard Overview Desktop Desktop](../screenshots/studio/03-dashboard/dashboard-overview-desktop-desktop.png)
````

*Швидкі посилання на оригінали:* [🌸 Blossom](../screenshots/blossom/03-dashboard/dashboard-overview-desktop-desktop.png) | [❄️ Frost](../screenshots/frost/03-dashboard/dashboard-overview-desktop-desktop.png) | [🌲 Studio](../screenshots/studio/03-dashboard/dashboard-overview-desktop-desktop.png)

#### 🖼️ Екран: Dashboard Overview Mobile Mobile

````carousel
![🌸 Blossom Theme: Dashboard Overview Mobile Mobile](../screenshots/blossom/03-dashboard/dashboard-overview-mobile-mobile.png)
<!-- slide -->
![❄️ Frost Theme: Dashboard Overview Mobile Mobile](../screenshots/frost/03-dashboard/dashboard-overview-mobile-mobile.png)
<!-- slide -->
![🌲 Studio Theme: Dashboard Overview Mobile Mobile](../screenshots/studio/03-dashboard/dashboard-overview-mobile-mobile.png)
````

*Швидкі посилання на оригінали:* [🌸 Blossom](../screenshots/blossom/03-dashboard/dashboard-overview-mobile-mobile.png) | [❄️ Frost](../screenshots/frost/03-dashboard/dashboard-overview-mobile-mobile.png) | [🌲 Studio](../screenshots/studio/03-dashboard/dashboard-overview-mobile-mobile.png)

#### 🖼️ Екран: Dashboard Widgets Desktop Desktop

````carousel
![🌸 Blossom Theme: Dashboard Widgets Desktop Desktop](../screenshots/blossom/03-dashboard/dashboard-widgets-desktop-desktop.png)
<!-- slide -->
![❄️ Frost Theme: Dashboard Widgets Desktop Desktop](../screenshots/frost/03-dashboard/dashboard-widgets-desktop-desktop.png)
<!-- slide -->
![🌲 Studio Theme: Dashboard Widgets Desktop Desktop](../screenshots/studio/03-dashboard/dashboard-widgets-desktop-desktop.png)
````

*Швидкі посилання на оригінали:* [🌸 Blossom](../screenshots/blossom/03-dashboard/dashboard-widgets-desktop-desktop.png) | [❄️ Frost](../screenshots/frost/03-dashboard/dashboard-widgets-desktop-desktop.png) | [🌲 Studio](../screenshots/studio/03-dashboard/dashboard-widgets-desktop-desktop.png)

#### 🖼️ Екран: Dashboard Widgets Mobile Mobile

````carousel
![🌸 Blossom Theme: Dashboard Widgets Mobile Mobile](../screenshots/blossom/03-dashboard/dashboard-widgets-mobile-mobile.png)
<!-- slide -->
![❄️ Frost Theme: Dashboard Widgets Mobile Mobile](../screenshots/frost/03-dashboard/dashboard-widgets-mobile-mobile.png)
<!-- slide -->
![🌲 Studio Theme: Dashboard Widgets Mobile Mobile](../screenshots/studio/03-dashboard/dashboard-widgets-mobile-mobile.png)
````

*Швидкі посилання на оригінали:* [🌸 Blossom](../screenshots/blossom/03-dashboard/dashboard-widgets-mobile-mobile.png) | [❄️ Frost](../screenshots/frost/03-dashboard/dashboard-widgets-mobile-mobile.png) | [🌲 Studio](../screenshots/studio/03-dashboard/dashboard-widgets-mobile-mobile.png)

#### 🖼️ Екран: Topbar Activity Dropdown Desktop

````carousel
![🌸 Blossom Theme: Topbar Activity Dropdown Desktop](../screenshots/blossom/03-dashboard/topbar-activity-dropdown-desktop.png)
<!-- slide -->
![❄️ Frost Theme: Topbar Activity Dropdown Desktop](../screenshots/frost/03-dashboard/topbar-activity-dropdown-desktop.png)
<!-- slide -->
![🌲 Studio Theme: Topbar Activity Dropdown Desktop](../screenshots/studio/03-dashboard/topbar-activity-dropdown-desktop.png)
````

*Швидкі посилання на оригінали:* [🌸 Blossom](../screenshots/blossom/03-dashboard/topbar-activity-dropdown-desktop.png) | [❄️ Frost](../screenshots/frost/03-dashboard/topbar-activity-dropdown-desktop.png) | [🌲 Studio](../screenshots/studio/03-dashboard/topbar-activity-dropdown-desktop.png)

#### 🖼️ Екран: Topbar Growth Dropdown Desktop

````carousel
![🌲 Studio Theme: Topbar Growth Dropdown Desktop](../screenshots/studio/03-dashboard/topbar-growth-dropdown-desktop.png)
````

*Швидкі посилання на оригінали:* [🌲 Studio](../screenshots/studio/03-dashboard/topbar-growth-dropdown-desktop.png)

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

