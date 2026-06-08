# Audit: Settings Page (`/dashboard/settings`)

> **Product:** BookIT — beauty/salon booking SaaS  
> **Audience:** Ukrainian beauty professionals (mobile-first, mid-session)  
> **Route:** `/dashboard/settings`  
> **Scope:** SettingsPage, NavigationStrip, ProfileHero, ScheduleWidget, ScheduleDrawer, PublicStatusWidget, StatsPulseWidget, SmartAdvisor, TechnicalIsland, LocationWidget, LocationPicker, CategoriesWidget, ProductMixWidget, SegmentConfigWidget, VacationManager, useSettingsForm, ImageCropper, page.tsx, loading.tsx  
> **Audited:** Nov 6, 2026

---

## 1. Critique

### AI Slop Verdict

**NOT AI-generated overall.** The Ukrainian microcopy, Vaul Drawer avatar crop, real Google Maps Places integration, and widget-card system are handcrafted.

**SmartAdvisor widget is a red flag.** Gradient bg, blur-3xl decoration, Sparkles icon, "80% more bookings" stat, "profile health" progress bar — every AI-generation signal on one card. Reads as a feature the team felt they needed but didn't have real data for.

**Verdict: Human-crafted with one AI-slop anchor (SmartAdvisor).**

### Heuristic Scores

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | Dirty-state save bar + slug checking are good. No save confirmation animation. |
| 2 | Match System / Real World | 3 | Ukrainian labels. "Smart Advisor" is generic/AI-feeling name. |
| 3 | User Control and Freedom | 3 | Cancel restores context state. No per-field undo, all-or-nothing. No navigation guard on dirty state. |
| 4 | Consistency and Standards | **2** | Color tokens disagree (emerald/amber/rose vs success/warning/error). 40/41 buttons missing `type="button"`. |
| 5 | Error Prevention | 2 | Slug sanitization + category cap (4). No time overlap, break-vs-schedule conflict validation. |
| 6 | Recognition vs Recall | 3 | Nav strip helps. No persistent "you are here" indicator after scroll. |
| 7 | Flexibility and Efficiency | **1** | No keyboard shortcuts. No selective save. All-or-nothing pattern. |
| 8 | Aesthetic and Minimalist | **2** | 14 zones on one page for a form. SmartAdvisor + BusynessWidget are decorative noise. |
| 9 | Error Recovery | 2 | Cancel works. No save failure retry. No per-field recovery. |
| 10 | Help and Documentation | **1** | SmartAdvisor explanation is isolated. No tooltips, field-level docs, or tour. |
| **Total** | | **22/40** | **Acceptable (low end)** |

### Cognitive Load

**High — 5/8 failures:**
- [FAIL] Single focus: 14 zones competing for attention
- [FAIL] Chunking: far exceeds 4 items per working memory group
- [FAIL] Visual hierarchy: ProfileHero gradient + SmartAdvisor gradient + save bar + analytics = no clear primary action
- [FAIL] Minimal choices: dozens of visible options at all times
- [FAIL] Progressive disclosure: Partial — ScheduleDrawer is good, but SmartAdvisor + BusynessWidget + 2 analytics widgets are all visible simultaneously

---

## 2. Animation Audit

### What's Active

| Component | Animation | Quality |
|-----------|-----------|---------|
| NavigationStrip | `layoutId="nav-active"` underline slide | Good — direction-aware spring |
| ProfileHero | `motion.div layout` on card | Good — smooth card spring |
| ProfileHero | ExpandableBio spring expand | Good — spring with bounce:0 |
| SettingsPage save bar | `AnimatePresence` slide up/down | Good — slide + fade |
| SettingsPage busyness bars | `motion.div width` animation | Acceptable — 0.8s ease-out |
| VacationManager | `AnimatePresence` list items | Good — spring exit x:20 |
| VacationManager form | Height collapse/expand | Good — smooth |

### Issues

1. **No entrance stagger** — All widgets appear at once. 30-50ms stagger on bento grid items would improve perceived performance.
2. **BusynessWidget bars** use `animate={{ width: X% }}` but this re-triggers on every render. Should use `initial` only once.
3. **Save button scale** uses CSS `active:scale-95` inconsistently. Some use `active:scale-[0.97]`, `active:scale-[0.88]`, `active:scale-[0.95]` — 3 different values.

---

## 3. Polish & Accessibility

### DIV→BUTTON: PASS (structural check)

All interactive elements use `<button>` or `<a>` tags. No `<div>` with `onClick` detected. ✓

### type="button": CRITICAL FAIL

| Finding | Count |
|---------|-------|
| `<button>` elements across settings | 41 |
| Buttons with `type="button"` | **1** (VacationManager.tsx:184) |
| Buttons missing `type="button"` | **40** (default to `type="submit"`) |

**Impact:** Any button inside a form context will submit the form. This is a systemic violation across all 11 widget files. All `onClick` buttons must have `type="button"`.

**Affected files:** CategoriesWidget, NavigationStrip, ProductMixWidget, ProfileHero, PublicStatusWidget, ScheduleDrawer, ScheduleWidget, SegmentConfigWidget, SmartAdvisor, TechnicalIsland, SettingsPage, VacationManager.

### aria-label: FAIL

| Finding | Count |
|---------|-------|
| `aria-label` across all settings | 1 (ImageCropper `aria-labelledby`) |
| `aria-pressed` across all settings | 0 |

**Icon-only buttons without labels:**
- ProfileHero: Share button (Share2 icon), Close button (X icon)
- VacationManager: Remove entry (X icon)
- ScheduleDrawer: Close (X icon)
- SmartAdvisor: Info close (X icon)
- TechnicalIsland: Theme swatches (icon+color only)

### Touch Targets: FAIL

| Element | Size | Min Required |
|---------|------|-------------|
| Share button (ProfileHero:150) | `size-9` = 36px | 44px |
| Close button (ProfileHero:215) | `p-3` ≈ 36px | 44px |
| Vacation remove (VacationManager:155) | `size-6` = 24px | 44px |
| Navigation buttons (many locations) | `py-1.5` / `py-2` | 44px |

---

## 4. Layout Audit

### Structure
- max-w-7xl (1280px) with 1/2/4-col grid — correct for settings dashboard
- Bento card pattern: `widget-card p-6` — consistent with rest of app  
- Navigation strip: sticky top-4, z-[100], rounded-full — well executed

### Issues
1. **14 zones on one page** — too many for a form. Analytics (StatsPulse, Busyness, ProductMix) should live on dashboard, not settings.
2. **Data duplication** — ProfileHero (row 1) and Identity section (row 5) both display/edit fullName, businessName, bio. Same state, two render locations.
3. **No section headers** — Widgets are placed in a bento grid with no visible section labels. User navigates by scrolling or using top nav only.
4. **SmartAdvisor spans 2 columns** — takes same visual weight as the combined ProductMix + Categories widgets, but delivers less value.

---

## 5. Color & Themes

### Hardcoded Colors: 11 total

| File | Count | Examples |
|------|-------|---------|
| ProfileHero.tsx | 2 | `#D4935A` (star), `#D4935A` (text) |
| TechnicalIsland.tsx | 5 | Theme swatch colors |
| LocationPicker.tsx | 1 | Placeholder color `#A8928D` |
| VacationManager.tsx | 3 | `#789A99`, `#D4935A`, `#5C9E7A` (type icons) |

### Theme Token Inconsistency

**Same data, different color systems:**
- ScheduleWidget: uses `text-success/warning/error` (theme tokens)
- BusynessWidget (in SettingsPage): uses `text-emerald-500/amber-500/rose-500` (hardcoded Tailwind)

When theme changes (e.g. Frost), ScheduleWidget adapts, BusynessWidget stays emerald/amber/rose — visual clash.

### Token Outlier

`--btn-primary-bg` used in ScheduleWidget toggle switches — this token is not documented in the theme system. All other primary elements use `var(--accent)`.

### Emoji

3 occurrences of `💅` in `useSettingsForm.ts` (lines 40, 91, 117) — used as `avatar_emoji` default value and snapshot. Legacy field, acceptable as user-content default.

### Gradients

5 `bg-gradient` uses:
- NavigationStrip: 2 (mobile scroll edge fade hints — functional)
- ProfileHero: 2 (no-avatar placeholder + bottom overlay — decorative but functional)
- SmartAdvisor: 1 (gradient background — decorative, flagged as AI slop)

---

## 6. Microcopy

### What's Good
- "Запорука якісної роботи — якісний відпочинок" — warm, human, Ukrainian
- "Інтеграція з картою очікує активації API" — honest degradation message
- "Так клієнти бачитимуть тебе у Bookit" — product-aware, personal

### What Needs Work
- "Скасувати" / "Зберегти" on floating save bar — no state indication ("Збережено" after success)
- "80% більше записів" in SmartAdvisor — promotional, unsubstantiated
- "Тред місяця" in ProductMixWidget — should be "Тренд місяця" (typo)
- "Ваше повне ім'я" with backtick template ` — unnecessary, static string

---

## 7. Performance & Optimization

### What's Healthy
- Google Maps script loaded as singleton (once per page, deduped)
- `AdvancedMarkerElement` used instead of legacy Marker (better perf)
- Schedule template upserts in parallel (`Promise.all`)
- Fields initialize once from context (`formInitialized` ref guard)

### What's Not
- `useSettingsForm` manages 25+ independent `useState` calls — each triggers individual re-render
- `isDirty` effect has 20+ dependencies — re-evaluates on every field change, potentially costly
- Google Maps script always loaded on LocationPicker mount, even if user never opens location section
- SmartAdvisor always queries/polls despite being decorative — network waste
- `document.querySelector('#hero input[type="file"]')` in SettingsPage — fragile DOM coupling

---

## 8. Interaction Audit

### Primary Actions
| Action | Mechanism | State Feedback |
|--------|-----------|---------------|
| Save form | Floating save bar (appears when dirty) | Loader2 spinner |
| Cancel form | Resets all 25 fields to snapshot | No animation |
| Avatar upload | Hidden input → ImageCropper Drawer | Upload spinner |
| Nav scroll | Smooth scroll to section + highlight glow | 1.5s tour-glow class |
| Theme switch | Dropdown (TechnicalIsland) | Immediate |
| Vacation CRUD | Inline form | Spring animations |

### Missing Interactions
- No `beforeunload` guard on dirty state — user can navigate away and lose changes
- No keyboard shortcuts (Enter to save, Esc to cancel)
- No selective save — all-or-nothing for 25 fields
- No optimistic updates on toggle switches (published status, schedule day toggle)

---

## 9. Priority Issues

### P0 — 40/41 Buttons Missing `type="button"`
- All settings buttons default to `type="submit"` — will submit form if placed inside any `<form>`
- **Fix:** Add `type="button"` to all 40 buttons across all 12 widget files

### P1 — Settings vs Dashboard Identity Crisis (14 zones)
- 4/14 zones are analytics (StatsPulse, Busyness, ProductMix, SmartAdvisor)
- Users come to settings to configure, not review performance
- **Fix:** Remove/compress analytics into 1 compact widget. Move BusynessWidget + ProductMixWidget to dashboard. Collapse SmartAdvisor into compact tip bar.

### P1 — Color Token Inconsistency (emerald/amber/rose vs success/warning/error)
- ScheduleWidget uses theme tokens, BusynessWidget uses hardcoded Tailwind — same data, two color systems
- **Fix:** Replace hardcoded colors with theme tokens in BusynessWidget

### P2 — Data Duplication: ProfileHero vs Identity Section
- fullName, businessName, bio appear in both locations
- **Fix:** Remove identity section, inline editing into ProfileHero

### P2 — SmartAdvisor (AI Slop Anchor)
- Gradient bg, blur decoration, Sparkles, "80% more bookings", profile health bar
- **Fix:** Strip gradient, remove blur, use real profile completion data or remove progress bar

### P2 — Icon-Only Buttons Missing `aria-label`
- Share, Close, Remove, Info buttons have no accessible labels
- **Fix:** Add `aria-label` to all icon-only buttons

### P2 — Touch Targets Below Minimum (24-36px vs 44px)
- Vacation remove button: 24px. Share button: 36px. Close button: 36px.
- **Fix:** Minimum 44px for all interactive elements

### P3 — Missing Navigation Guard on Dirty State
- User can scroll-nav away and lose all unsaved changes
- **Fix:** Add `beforeunload` + nav strip confirmation when dirty

### P3 — Emoji Default (💅) in Form State
- `useSettingsForm.ts:40` — `useState('💅')` as avatar default
- **Fix:** Use null/empty default

---

## 10. Summary

| Metric | Score |
|--------|-------|
| Heuristic Total | 22/40 (Acceptable — low end) |
| Cognitive Load | HIGH (5/8 failures) |
| AI Slop | SmartAdvisor flagged as anchor |
| Hardcoded Hex | 11 values |
| Gradients | 5 bg-gradient (1 decorative/SmartAdvisor) |
| Emoji | 3 uses of 💅 (legacy default) |
| type="button" | **40/41 missing** — CRITICAL |
| aria-label | 1 match — FAIL |
| Missing type | 40 buttons |
| Touch Target Violations | 3+ (24px, 36px) |
| Data Duplication | ProfileHero vs Identity section |
| Loading States | Skeleton per widget |
| Save Guard | Missing |
