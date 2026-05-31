# Audit: Onboarding Wizard (v2, 5-Step)

> **Product:** BookIT — beauty/salon booking SaaS  
> **Audience:** Ukrainian beauty professionals (mobile-first, mid-session)  
> **Route:** `/dashboard/onboarding` (new, v2 only)  
> **Theme:** Forced Frost (`data-theme="frost"`, `#EFF2FF`)  
> **Pages audited:** Nov 6, 2026

---

## 1. Critique

### AI Slop Verdict

**NOT AI-generated.** Handcrafted with genuine product thinking.  

Tells:
- Confetti on success (AI default trope) — present but justified by rest of step (share templates are genuinely useful, not decoration)
- Glassmorphism in preview card (`backdropFilter: 'blur(24px)'`) — borderline anti-pattern, present in `StepPreview.tsx:226-229`
- "Magic" language — absent (0 occurrences)
- Generic welcome — absent. "Твоя студія онлайн!" is product-specific
- Share template texts (`StepSuccess.tsx:147-161`) reference Instagram/Direct/Viber workflows showing real understanding of Ukrainian beauty professionals' distribution channels — too specific for AI generation

**Verdict: Human-crafted.** Glassmorphism in Preview + confetti in Success are the only borderline tells.

### Heuristic Scores

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 4 | Progress bar with animated dots + labels; save spinners; copy confirmations |
| 2 | Match System / Real World | 3 | UA language throughout; beauty terms; pricing model (base × multiplier) may not be intuitive |
| 3 | User Control and Freedom | **1** | **No back button anywhere across all 5 steps.** Forward-only. Skip only on StepServices |
| 4 | Consistency and Standards | 3 | `var(--btn-primary-bg, var(--accent))` token outlier; `var(--hero-card-bg)` undefined token in StepSuccess |
| 5 | Error Prevention | 3 | Inline validation on name/phone/price/slug; no double-submit guard gap |
| 6 | Recognition vs Recall | 3 | Inline editing on services (dotted underline→click) is novel, may not be discoverable |
| 7 | Flexibility and Efficiency | 2 | No keyboard shortcuts; no bulk tier editing; "до всіх" on schedule is good |
| 8 | Aesthetic and Minimalist | 3 | Glassmorphism in Preview violates anti-pattern; otherwise clean bento structure |
| 9 | Error Recovery | 2 | Toast on save error but no retry action; phone format error could be more specific |
| 10 | Help and Documentation | 1 | Zero help/tooltip/explanation on complex fields (pricing model, tier calculation) |
| **Total** | | **25/40** | **Good** (20-32 band) |

### Cognitive Load

**8-item checklist failures:**
- [FAIL] Step 2 (Services) density: 3 tiers × 2 editable fields (price+duration) × N categories. Base price auto-calculates tiers, but per-category overrides stack complexity.
- [FAIL] Working memory: Moving between category tabs in Services requires remembering what you set on the previous tab. No summary chip.
- [FAIL] Decision options: StepProfile's category grid shows all categories at once (≈90), no progressive reveal.
- [WARN] StepSuccess: 3 competing primary actions (Copy / Share / Create Story / Dashboard) — goal ambiguity.

**Verdict: LOW-MODERATE** (3 failures + 1 warning). Step 2 is the bottleneck. One-tap template on Schedule and slide-animated preview provide cognitive relief.

---

## 2. Animation Audit

### What's Active

| Component | Animation | Type | Quality |
|-----------|-----------|------|---------|
| OnboardingWizard | Step slide: `custom` variants with x offset | `framer-motion` | Good — direction-aware, spring transition |
| OnboardingProgress | Spring layout on active dot width | `framer-motion layout` | Good — damped spring feels natural |
| StepServices | Category switch: `popLayout` with opacity+x | `AnimatePresence` | Good — smooth carousel feel |
| StepServicesForm | Drag-to-swipe categories | `framer-motion drag` | Good — `dragElastic: 0.15` prevents accidental triggers |
| StepPreview | Gradient tile selector | `whileTap` scale | Acceptable — minimal motion |
| StepSuccess | Confetti particles (18 items) | `initial→animate` burst | AI trope, but well-implemented (staggered delay, varied size/rotation) |
| StepProfilePreview | Flash deal reveal | `AnimatePresence` height | Good — smooth collapse |
| Loading | Static skeleton, no pulse/shimmer | None | MISSED — no loading feedback |

### Issues

1. **Loading skeleton is static** — `loading.tsx` uses flat rgba colors, no shimmer/pulse animation. On slow connections, the skeleton is barely perceptible as loading state. Fix: Add `animate-pulse` or framer-motion opacity loop to skeleton bars.

2. **StepPreview:440/449/473** — Icon buttons use `active:scale-[0.95]` but no `whileTap` from framer-motion. These are CSS-only tap effects that work inconsistently across browsers. Recommend framer-motion `whileTap={{ scale: 0.92 }}`.

3. **No entrance stagger** — Cards/rows appear all at once per step. A 30-50ms stagger on child items would improve perceived performance.

---

## 3. Polish & Accessibility

### DIV→BUTTON Scan (41 cursor-pointer elements)

**All 41 cursor-pointer elements are on `<button type="button">`.** No violations. ✓

### Missing aria-label

| Location | Element | Issue |
|----------|---------|-------|
| StepServicesForm.tsx:156-166 | ChevronLeft nav button | Icon-only, no `aria-label` |
| StepServicesForm.tsx:188-198 | ChevronRight nav button | Icon-only, no `aria-label` |
| StepServicesForm.tsx:205-216 | Dot indicators (5 buttons) | No visible text, no `aria-label` |
| StepScheduleForm.tsx:159 | Break remove X button | Icon-only, no `aria-label` |
| StepSuccess.tsx:286 | Share template button | Icon+text, text is visible — acceptable |

**Missing on: 4 locations (P2).**

### Touch Targets

All interactive elements pass ≥44px height check:
- Category chips: `py-4` (64px+) — OK
- Primary buttons: `py-3.5` (56px) — OK  
- Schedule day rows: `py-4` (64px) — OK
- Tier cards: `py-3.5` (56px) — OK
- Icon buttons (ChevronLeft/Right): `size-9` (36px) — **FAILS mobile** (36 < 44). Minimal size is 44px. These need `size-11` at minimum.

**Touch target violations: 2 locations (P2).**

---

## 4. Layout Audit

### Structure
- Central column: `max-w-sm` (384px) — correct for mobile-first
- Bento card: `rounded-2xl` — consistent with rest of app
- Padding: `px-6` (24px) — adequate for mobile
- Bottom actions: stacked button pattern — consistent across all steps

### Issues
1. **Step2 (Services) card overflows on small screens** — category grid has `grid-cols-2` with 3 gap; service templates can expand the card beyond viewport. No `overflow-y-auto` on the card wrapper. `OnboardingWizard.tsx` has `overflow-y-auto` on outer container but individual step cards may not scroll properly.

2. **Step3 (Schedule) day rows** — On Mon-Sat template + custom editor, the schedule list with 6 days × 2 time inputs + toggle becomes very long on 375px viewport. Need `max-h` with scroll within step.

3. **Step5 (Success) template cards** — Three template types side by side requires horizontal scroll on mobile. No visual scroll hint (fade edges or dots).

---

## 5. Color & Themes

### Hardcoded Colors

| File | Locations | Pattern |
|------|-----------|---------|
| StepServicesForm.tsx | 10 | GROUP_TINTS, TIER_CONFIG hex |
| StepProfitPredictor.tsx | 7 | Gradient hex pairs |
| StepProfilePreview.tsx | 12 | Phone mockup, flash deal badge hex |
| StepPreview.tsx | 9 | GRADIENT_PAIRS, TILE_ACCENTS |
| ConfettiParticles.tsx | 6 | CONFETTI_COLORS array |
| StepSuccess.tsx | 1 | `color-mix(in srgb, #5C9E7A...)` |
| PublicPagePreview.tsx | 2 | ctaTextColor, gradient hex |
| types.ts | 0 | Uses CSS variable classes via `inputCls` |
| page.tsx | 0 | Uses theme-var backgrounds |
| loading.tsx | 0 | Uses rgba indigo-400 |

**Total: ~47 hardcoded hex values** — high for a themed product.

### Theme Token Violations
| Token | Location | Issue |
|-------|----------|-------|
| `var(--btn-primary-bg, var(--accent))` | All step primary buttons | `--btn-primary-bg` undefined in Frost |
| `var(--hero-card-bg)` | StepSuccess.tsx:271-273 | Undefined token, no fallback → renders transparent |
| `var(--surface)` | StepServicesForm.tsx:257 | Used as component token — OK if defined |

### Emoji

| Location | Emoji | Issue |
|----------|-------|-------|
| StepProfilePreview.tsx:292 | 🎉 | "Твоя сторінка готова 🎉" — violates no-emoji policy |
| types.ts (SPECIALIZATIONS) | Multiple (💅🦶🎨💎✂️🌈💈✨🌿👁 etc.) | These are in SPECIALIZATIONS for category display in profile — functional use, not decorative. Acceptable exception. |

### Gradient Count

8 linear-gradient uses: 4 in StepProfitPredictor, 2 in StepProfilePreview, 1 in StepPreview, 1 in PublicPagePreview.

---

## 6. Microcopy

### What's Good
- "Твоя студія онлайн!" — product-specific, warm but not patronizing
- "Шаблон: Пн–Пт, 10:00–19:00" + "Один клік — і розклад готовий" — clear value proposition
- "Залиш порожнім — використаємо ім'я." — reassuring fallback statement
- Share templates (Stories/Reels/Bio/Viber) — concrete, channel-specific, not generic

### What Needs Work
- "Сфера діяльності" + "Оберіть напрямок — ми згенеруємо базовий прайс" — "ми згенеруємо" is passive. Active: "Ми створимо прайс за хвилину"
- "Ціноутворення" — too formal for step 2. "Ваші ціни" is warmer
- "Базовий" tier label is confusing — "Базовий" is both a category concept and a tier label. Rename tiers: "Економ", "Стандарт", "Преміум"
- "Flash Deal — вільні вікна зі знижкою" — 10 words on a mockup. Shorten: "Flash Deal — знижка на вільні слоти"

---

## 7. Performance & Optimization

### What's Healthy
- All 5 steps share a single `AnimatePresence` wrapper — only one step rendered at a time
- Confetti uses 18 particles (not 100+) — reasonable
- gradient/background patterns are CSS, not images

### What's Not
- `document.body.style.backgroundColor = '#EFF2FF'` in OnboardingWizard.tsx:71 — direct DOM mutation. Should use CSS variable or className on `<html>`
- `PublicPagePreview.tsx` imports `moodThemes` from `@/lib/constants/themes` (all 8 themes) but only renders 1 — unused bundle weight
- `StepServicesForm.tsx` imports 17 lucide icons — heavy for a sub-step. Only ~5 are displayed at once. Dynamic import opportunity.

### Bundle Impact
| File | Lucide Imports | Notes |
|------|---------------|-------|
| StepServicesForm.tsx | 17 icons | Category icon map — all pre-loaded but only 1 used at a time |
| StepSuccess.tsx | 6 icons | Reasonable for step |
| StepPreview.tsx | 8 icons | Reasonable |
| StepScheduleForm.tsx | 4 icons | Minimal |

**Potential bundle saving:** Lazy-load `StepServicesForm` as dynamic import since it's a sub-step shown only after category grid interaction.

---

## 8. Interaction Audit

### Click/Tap Mapping
| Step | Back | Forward | Skip | Save |
|------|------|---------|------|------|
| PROFILE | ✗ | Continue → SERVICES | ✗ | Auto-save on continue |
| SERVICES | ✓ (via sub-form "Скасувати") | Continue → SCHEDULE | ✓ ("Додам пізніше") | Save on continue |
| SCHEDULE | ✓ (via form "Назад") | Continue → PREVIEW | ✗ | Save on continue |
| PREVIEW | ✓ ("Назад") | Continue → SUCCESS | ✗ | "Запустити профіль" |
| SUCCESS | ✗ | Dashboard redirect | ✗ | Share/copy actions |

### Hover States
All interactive elements have hover states via Tailwind `hover:` variants. Consistent pattern across all steps.

### Loading States
- Save buttons: `Loader2` spinner + text ("Зберігаємо...") — good
- Slug check: `slugChecking` state with spinner in StepPreview — good
- Initial load: Server component fetches profile → `Loading()` skeleton — acceptable

### Empty States
| Element | Empty State |
|---------|-------------|
| Avatar | Initials fallback + upload prompt |
| Services (preview) | "Послуги з'являться тут" + Sparkles icon |
| Category (unselected) | Grid of all options, none selected |
| Schedule (untouched) | Template prompt + "Вихідний" labels |
| Breaks (none) | "Немає перерв — весь робочий час доступний" |

---

## 9. Priority Issues

### P0 — No Back Navigation (Heuristic 3: Score 1)
- `goTo()` function supports bidirectional navigation but no UI calls it backward
- If user selects wrong categories in Step1, they're locked in — must restart
- **Fix:** Add "Назад" button between "Далі" and progress dots in OnboardingWizard

### P1 — Undefined Token `var(--hero-card-bg)` (StepSuccess.tsx:271)
- Share button uses undefined `var(--hero-card-bg)` with no fallback
- Renders transparent on invalid-browser or when context variables aren't set
- **Fix:** Replace with `var(--btn-primary-bg, var(--accent))` or define token in Frost

### P1 — Glassmorphism in Preview (StepPreview.tsx:226-229)
- `backdropFilter: 'blur(24px)'` + semi-transparent background = glassmorphism anti-pattern
- **Fix:** Replace with solid bento-card background + clean shadow (decorative blurred blobs can stay as `aria-hidden`)

### P2 — Missing Step Count Label
- Progress bar uses animated dots but no explicit "Крок 2 з 5" or time estimate
- **Fix:** Add "Крок X з 5 (~4 хв)" text

### P2 — StepSuccess Primary Action Ambiguity
- Copy / Share / Create Story / Dashboard — 4 equal actions
- Per onboard.md: "Celebrate completion but don't overdo it" + "Clear next steps"
- **Fix:** One primary CTA ("Поділитися"), one secondary ("Створити Сторі"), dashboard as text link

### P2 — Missing aria-label on Icon-Only Buttons
- StepServicesForm: ChevronLeft, ChevronRight nav buttons
- StepServicesForm: 5 dot-indicator buttons
- StepScheduleForm: break remove X button
- **Fix:** Add `aria-label` to each

### P2 — Emoji in StepProfilePreview h2
- "Твоя сторінка готова 🎉" — violates no-emoji policy
- **Fix:** Remove 🎉, use text-only celebration

---

## 10. Summary

| Metric | Score |
|--------|-------|
| Heuristic Total | 25/40 (Good) |
| Cognitive Load | LOW-MODERATE |
| AI Slop | Not AI-generated |
| Hardcoded Hex | ~47 values |
| Gradients | 8 |
| Emoji | 2 locations (1 functional exception, 1 violation) |
| DIV→BUTTON | 0 violations |
| Missing aria-label | 4 locations |
| Touch Target Violations | 2 (36px < 44px) |
| Hover States | Complete |
| Loading States | Complete (static skeleton only) |
