# Phase M — Modals, Sheets, Drawers (9 files) — FULL 8-INSTRUMENT WORKFLOW

**Date:** 2026-06-01 (REDONE)
**Skill:** impeccable — LOADED ✅
**Instrument 1/8:** critique → Assessment A — sub-agent `ses_17b960278ffezQiBKn3aIIm8t7` ✅
**Instrument 2/8:** critique → Assessment B — `npx impeccable detect --json --gpt` all 9 files ✅ (all `[]`)
**Instruments 3-8:** audit, animate, overdrive, polish, layout, optimize — applied via skill references ✅

---

## Files Audited

| # | File | Size | Location |
|---|------|------|----------|
| M1 | BottomSheet.tsx | 2,580 B | `src/components/ui/` |
| M2 | DashboardDrawer.tsx | 379 B | `src/components/ui/` |
| M3 | PopUpModal.tsx | 4,625 B | `src/components/ui/` |
| M4 | HubDrawer.tsx | 777 B | `src/components/shared/` |
| M5 | MicaModal.tsx | 2,954 B | `src/components/ui/` |
| M6a | FlashDealDrawer.tsx | 575 B | `src/components/master/dashboard/` |
| M6b | PricingDrawer.tsx | 747 B | `src/components/master/dashboard/` |
| M6c | RestockDrawer.tsx | 4,746 B | `src/components/master/products/` |
| M6d | DashboardDrawers.tsx | 887 B | `src/components/master/dashboard/` |

---

## Instrument 3/8 — audit (reference: audit.md)

| File | A11y | Perf | Theming | Responsive | Anti-Pattern | Total /20 |
|------|:----:|:----:|:-------:|:----------:|:------------:|:---------:|
| BottomSheet.tsx | 3 | 4 | 4 | 4 | 4 | **19** |
| DashboardDrawer.tsx | 3 | 4 | 4 | 4 | 4 | **19** |
| PopUpModal.tsx | 4 | 3 | 4 | 4 | 4 | **19** |
| HubDrawer.tsx | 3 | 4 | 4 | 4 | 4 | **19** |
| MicaModal.tsx | **1** | 3 | 3 | 3 | **1** | **11** |
| FlashDealDrawer.tsx | 3 | 4 | 4 | 4 | 4 | **19** |
| PricingDrawer.tsx | 3 | 4 | 4 | 4 | 4 | **19** |
| RestockDrawer.tsx | **1** | 3 | 3 | 3 | **0** | **10** |
| DashboardDrawers.tsx | 3 | 4 | 4 | 4 | 3 | **18** |

**Worst:** RestockDrawer (10/20 — Anti-Pattern 0/4, A11y 1/4), MicaModal (11/20 — Anti-Pattern 1/4)

---

## Instrument 4/8 — animate (reference: animate.md)

| File | Motion type | Duration | Guard | Notes |
|------|------------|----------|:-----:|-------|
| BottomSheet | Vaul native spring | Vaul default | N/A | Vaul handles internally |
| DashboardDrawer | N/A (wrapper) | — | — | Delegates to PopUpModal |
| PopUpModal | Spring fade+scale | 350/32 spring | ❌ | Has pointer-events guard but no reduced-motion |
| HubDrawer | N/A (wrapper) | — | — | Delegates to PopUpModal |
| MicaModal | Spring fade+scale+y:20 | 300/30 spring | ❌ | No reduced-motion guard |
| FlashDealDrawer | N/A (wrapper) | — | — | Delegates to PopUpModal |
| PricingDrawer | N/A (wrapper) | — | — | Delegates to PopUpModal |
| RestockDrawer | Slide-up y:100%→0 | 380/32 spring | ❌ | Full framer-motion without guard |
| DashboardDrawers | N/A (orchestrator) | — | — | No own UI |

**Gap:** 3 animated files (PopUpModal, MicaModal, RestockDrawer) all lack `prefers-reduced-motion` guard

---

## Instrument 5/8 — overdrive (reference: overdrive.md)

| File | Direction | Viability |
|------|-----------|:---------:|
| PopUpModal | View Transitions API: morph trigger button into modal | High |
| MicaModal | View Transitions API + 8 width presets as named transitions | Medium (should replace with PopUpModal first) |
| RestockDrawer | Replace with PopUpModal + quantity stepper as slot (not overdrive, fix) | — |
| BottomSheet | Drag handles with spring snap points (25%/50%/90%) | Low (Vaul already handles) |

**Primary recommendation:** PopUpModal as morphing modal via View Transitions API

---

## Instrument 6/8 — polish (reference: polish.md)

| File | Design System | Spacing | States | Copy | Touch |
|------|:-------------:|:-------:|:------:|:----:|:-----:|
| BottomSheet | ✅ | ✅ | ✅ | ✅ | ✅ (Vaul handles) |
| DashboardDrawer | ✅ | ✅ | ✅ | N/A | ✅ |
| PopUpModal | ✅ | ✅ | ✅ | ✅ (aria-label="Закрити") | ✅ |
| HubDrawer | ✅ | ✅ | ✅ | N/A | ✅ |
| MicaModal | ❌ (no Vaul) | ✅ | ❌ (no a11y) | ✅ | ✅ |
| FlashDealDrawer | ✅ | ✅ | ⚠️ (no loading skeleton) | N/A | ✅ |
| PricingDrawer | ✅ | ✅ | ⚠️ (no loading skeleton) | N/A | ✅ |
| RestockDrawer | ❌ (no Vaul) | ✅ | ❌ (no try/catch) | ⚠️ | ❌ (close btn 32px) |
| DashboardDrawers | ✅ | ✅ | ✅ | N/A | ✅ |

**Drifts:** MicaModal + RestockDrawer — both bypass Vaul requirement (AI_DEVELOPER.md iron rule #6)

---

## Instrument 7/8 — layout (reference: layout.md)

| File | Scale | Hierarchy | Density | Issues |
|------|:-----:|:---------:|:-------:|--------|
| BottomSheet | Tailwind | Clear | Normal | pb-32 safe-area correct |
| DashboardDrawer | — | — | — | Wrapper |
| PopUpModal | Tailwind | Clear (title+content+actions) | Normal | max-w[620px] hardcoded |
| HubDrawer | Tailwind | Clear | Normal | Responsive padding correct |
| MicaModal | Tailwind | Clear | Normal | No portal — stacking issues |
| FlashDealDrawer | — | — | — | Wrapper |
| PricingDrawer | — | — | — | Wrapper |
| RestockDrawer | Tailwind | Clear (stepper+note+save) | Normal | max-w-lg vs PopUpModal 620px inconsistency, pb-10 vs pb-32 safe-area |
| DashboardDrawers | — | — | — | Orchestrator |

---

## Instrument 8/8 — optimize (reference: optimize.md)

| File | Bundle | Render | Layout Shift | Issue |
|:----:|:------:|:------:|:------------:|-------|
| BottomSheet | ✅ | ✅ | ✅ | Vaul handles will-change |
| DashboardDrawer | ✅ | ✅ | ✅ | Wrapper |
| PopUpModal | ✅ | ⚠️ | ✅ | hasOpenedOnce + keepMounted stateful logic is fragile |
| HubDrawer | ✅ | ✅ | ✅ | Wrapper |
| MicaModal | ✅ | ⚠️ | ✅ | Inline render without portal — reparenting on open/close |
| FlashDealDrawer | ✅ (dynamic) | ⚠️ | ⚠️ | No loading skeleton on first open |
| PricingDrawer | ✅ (dynamic) | ⚠️ | ⚠️ | No loading skeleton on first open |
| RestockDrawer | ✅ | ⚠️ | ✅ | Full re-render on every stepper change |
| DashboardDrawers | ✅ | ✅ | ✅ | Orchestrator |

---

## Final Scores

| File | Critique /40 | Audit /20 | Animate | Overdrive | Polish | Layout | Optimize | Overall |
|------|:-----------:|:---------:|:-------:|:---------:|:------:|:------:|:--------:|:-------:|
| BottomSheet | 31/40 | 19 | ✅ | medium | ✅ | ✅ | ✅ | B+ |
| DashboardDrawer | 30/40 | 19 | N/A | N/A | ✅ | ✅ | ✅ | A- |
| PopUpModal | 31/40 | 19 | ⚠️ | high | ✅ | ✅ | ⚠️ | B+ |
| HubDrawer | 29/40 | 19 | N/A | N/A | ✅ | ✅ | ✅ | B+ |
| MicaModal | **26/40** | **11** | ⚠️ | medium | ❌ (P1) | ⚠️ | ⚠️ | **C** |
| FlashDealDrawer | 30/40 | 19 | N/A | N/A | ⚠️ | ✅ | ⚠️ | B+ |
| PricingDrawer | 30/40 | 19 | N/A | N/A | ⚠️ | ✅ | ⚠️ | B+ |
| RestockDrawer | **20/40** | **10** | ⚠️ | N/A (fix) | ❌ (P0) | ⚠️ | ⚠️ | **F** |
| DashboardDrawers | 30/40 | 18 | N/A | N/A | ✅ | ✅ | ✅ | B+ |

---

## Priority Issues

**P0:**
1. **RestockDrawer.tsx** — Full framer-motion sheet when Vaul PopUpModal exists (violates AI_DEVELOPER.md iron rule #6)
2. **RestockDrawer.tsx** — Missing try/catch on async `restockProduct` call — UI hangs forever on error

**P1:**
1. **MicaModal.tsx** — No Vaul integration for mobile (same iron rule #6 violation)
2. **MicaModal.tsx** — No `role="dialog"`, `aria-modal`, focus trap, or Esc key
3. **MicaModal.tsx** — Close button missing `aria-label`
4. **RestockDrawer.tsx** — Close button size-8 (32px) violates 44px minimum
5. **RestockDrawer.tsx** — Quantity stepper ± buttons missing aria-labels, no keyboard accessibility

**P2 (selected):**
1. PopUpModal: hasOpenedOnce + keepMounted fragile stateful rendering
2. MicaModal: rendered inline without Portal — stacking issues
3. All 3 animated files: missing prefers-reduced-motion guard
4. FlashDealDrawer/PricingDrawer: no loading skeleton on dynamic import
5. DashboardDrawers: `as any` cast on pricing_rules
6. RestockDrawer: max-w-lg (512px) vs PopUpModal 620px — inconsistent width

**Gold standard:** BottomSheet, DashboardDrawer, HubDrawer, FlashDealDrawer, PricingDrawer — all clean wrappers

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

### 📍 Зона: 04-bookings (Bookings)

#### 🖼️ Екран: Bookings Create Form Open Desktop

````carousel
![🌸 Blossom Theme: Bookings Create Form Open Desktop](../screenshots/blossom/04-bookings/bookings-create-form-open-desktop.png)
<!-- slide -->
![❄️ Frost Theme: Bookings Create Form Open Desktop](../screenshots/frost/04-bookings/bookings-create-form-open-desktop.png)
<!-- slide -->
![🌲 Studio Theme: Bookings Create Form Open Desktop](../screenshots/studio/04-bookings/bookings-create-form-open-desktop.png)
````

*Швидкі посилання на оригінали:* [🌸 Blossom](../screenshots/blossom/04-bookings/bookings-create-form-open-desktop.png) | [❄️ Frost](../screenshots/frost/04-bookings/bookings-create-form-open-desktop.png) | [🌲 Studio](../screenshots/studio/04-bookings/bookings-create-form-open-desktop.png)

#### 🖼️ Екран: Bookings Day Desktop Desktop

````carousel
![🌸 Blossom Theme: Bookings Day Desktop Desktop](../screenshots/blossom/04-bookings/bookings-day-desktop-desktop.png)
<!-- slide -->
![❄️ Frost Theme: Bookings Day Desktop Desktop](../screenshots/frost/04-bookings/bookings-day-desktop-desktop.png)
<!-- slide -->
![🌲 Studio Theme: Bookings Day Desktop Desktop](../screenshots/studio/04-bookings/bookings-day-desktop-desktop.png)
````

*Швидкі посилання на оригінали:* [🌸 Blossom](../screenshots/blossom/04-bookings/bookings-day-desktop-desktop.png) | [❄️ Frost](../screenshots/frost/04-bookings/bookings-day-desktop-desktop.png) | [🌲 Studio](../screenshots/studio/04-bookings/bookings-day-desktop-desktop.png)

#### 🖼️ Екран: Bookings Day Mobile Mobile

````carousel
![🌸 Blossom Theme: Bookings Day Mobile Mobile](../screenshots/blossom/04-bookings/bookings-day-mobile-mobile.png)
<!-- slide -->
![❄️ Frost Theme: Bookings Day Mobile Mobile](../screenshots/frost/04-bookings/bookings-day-mobile-mobile.png)
<!-- slide -->
![🌲 Studio Theme: Bookings Day Mobile Mobile](../screenshots/studio/04-bookings/bookings-day-mobile-mobile.png)
````

*Швидкі посилання на оригінали:* [🌸 Blossom](../screenshots/blossom/04-bookings/bookings-day-mobile-mobile.png) | [❄️ Frost](../screenshots/frost/04-bookings/bookings-day-mobile-mobile.png) | [🌲 Studio](../screenshots/studio/04-bookings/bookings-day-mobile-mobile.png)

