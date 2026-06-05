# 15 — Landing Page Domain Map

## 1. Domain Overview

Маркетинговий лендінг BookIT з 14 секціями, GSAP ScrollTrigger card-rise stack, ROI калькулятором, та преміальними анімаціями.

### Key Files
- `src/app/page.tsx` — Entry point
- `src/components/landing/RootPageClient.tsx` — TMA guard wrapper
- `src/components/landing/LandingPageContent.tsx` — Main content (GSAP stack)
- `src/components/landing/LandingHero.tsx` — Frost 3D mockup
- `src/components/landing/LandingTrustBar.tsx` — Stats
- `src/components/landing/LandingMarquee.tsx` — Infinite ticker
- `src/components/landing/LandingAgitation.tsx` — Pain points
- `src/components/landing/LandingMagic.tsx` — Features
- `src/components/landing/LandingBentoFeatures.tsx` — Smart Slots demo
- `src/components/landing/LandingIntegrations.tsx` — Channel previews
- `src/components/landing/LandingClientFlow.tsx` — How it works
- `src/components/landing/LandingComparison.tsx` — Before/after
- `src/components/landing/LandingProcess.tsx` — Setup steps
- `src/components/landing/LandingEconomy.tsx` — ROI calculator
- `src/components/landing/LandingPricing.tsx` — Pricing cards
- `src/components/landing/LandingFAQ.tsx` — FAQ accordion
- `src/components/landing/LandingFooterCTA.tsx` — Final CTA
- `src/components/landing/LandingScrollProgress.tsx` — Progress bar
- `src/components/landing/LandingSplitHeading.tsx` — Animated heading
- `src/components/landing/LandingTestimonials.tsx` — (exists, not integrated)

---

## 2. State Machine

### 2.1 Section States

Each section has independent states:

| State | Description | Animation |
|---|---|---|
| OFFSCREEN | Below viewport | Opacity 0, y: 32, scale: 0.97 |
| ENTERING | ScrollTrigger activates | 0.65s ease [0.22,1,0.36,1] |
| VISIBLE | In viewport | Normal scroll |
| LEAVING | Above viewport | — |

### 2.2 GSAP Card-Rise Stack

```
overflowX: 'clip' on <main>

Pre-stack (normal scroll):
  → LandingHero (#hero) — perspective(1400px) rotateX 12°→0°
  → LandingTrustBar (#trust)
  → LandingMarquee (#marquee)

Rising stack (6 sections, 30vh overlap):
  Each rising section:
    → wrapper: marginTop: '-30vh'
    → wrapper: borderRadius: '1.5rem'
    → gsap.set(y: '30vh')  // counteract margin-top
    → scrollTrigger: {
        trigger: prevSection.id,
        start: 'bottom bottom',
        end: '+=30vh',
        pin: true,
        scrub: 1
      }
    → On activate: section rises 30vh into view

  → LandingAgitation → LandingMagic → LandingBentoFeatures
    → LandingIntegrations → LandingClientFlow → LandingComparison
    → LandingEconomy → LandingPricing → LandingFooterCTA

Excluded (no rise):
  → LandingProcess (sticky left column)
  → LandingFAQ (AnimatePresence accordion)
```

### 2.3 GSAP State Machine

```
PAGE_LOAD → gsap.context() created
  → REGISTER_TRIGGERS → for each section
  → REFRESH → ScrollTrigger.refresh()
  → SCROLL → triggers fire
    → PREV_SECTION_BOTTOM → next section rising
    → SECTION_TOP_PIN → section pinned during rise
    → RISE_COMPLETE → section in final position
  → UNMOUNT → ctx.revert() → cleanup
```

### 2.4 Per-Item Animation States

Each sub-component (PainItem, FeatureCard, StepCard, StepItem):
```
useInView(ref, { once: true, margin: '-60px' })
  → NOT_IN_VIEW → initial state
  → IN_VIEW → trigger animations:
    → Card: opacity 0→1, y: 32→0, scale 0.97→1
    → Heading: word-by-word y: 110%→0 (stagger 0.065s)
    → Body: sentence split y: 115%→0, opacity 0→1 (stagger 0.16s)
    → Both start at delay: 0.08 (simultaneous)
```

### 2.5 Section-Specific States

**LandingHero:**
- Normal → perspective rotateX 12°→0° on scroll
- Mobile → simplified, no 3D

**LandingBentoFeatures:**
- CountUp: useState + useMotionValueEvent
- Smart Slots grid visualization
- Dark section (#0F172A bg)

**LandingEconomy (ROI Calculator):**
```
[IDLE] → default values
[SILDING] → user drags slider
  → real-time formatCurrency update
  → min/max clamping
[RESULT] → projection calculated
[EDGE] → slider at extremes
```

**LandingPricing:**
- Starter card (free)
- Pro card (accent #0F172A, shadow indigo)
- Studio card (team pricing)
- Hover: slight lift

**LandingFAQ:**
```
AnimatePresence height accordion
  → [COLLAPSED] → question only
  → [EXPANDING] → spring open
  → [EXPANDED] → answer visible
  → [COLLAPSING] → spring close
```

---

## 3. Environment Matrix

| Environment | Animation | Behavior |
|---|---|---|
| Desktop (≥1024px) | Full GSAP | Card-rise, 3D, scroll |
| Tablet (768-1023px) | Simplified GSAP | No 3D, card rise? |
| Mobile (<768px) | Framer Motion only | Disable GSAP? |
| Slow device | prefers-reduced-motion | Disable animations |
| prefers-reduced-motion | No animations | Static sections |
| TMA (Telegram) | Simple render | GSAP might fail |
| Print | Static | All animations disabled |

---

## 4. Load & Performance Vectors

| Vector | Risk |
|---|---|
| GSAP + ScrollTrigger heavy | Jank on low-end devices |
| 14 sections + images | Large page size |
| CountUp loop | CPU |
| Many motion.divs | Memory |
| 3D perspective + scroll | GPU repaint |

### Performance Optimizations
- GSAP scrub: 1 (not 0 for perf)
- prefers-reduced-motion
- Weak device detection?
- overflow:clip not hidden (GPU)
- No film grain on parallax containers

---

## 5. Data Variations

| Variation | Effect |
|---|---|
| CTA click → new master | Redirect to /register?ref= |
| CTA click → existing user | Redirect to /login |
| ROI = 0 | Display 0 ₴ |
| ROI = very high | Large number formatting |
| All FAQ closed | Default state |
| All FAQ open | Scroll overflow |
| Mobile breakpoint | Column layout changes |
| TMA detection | Show booking link not landing |

---

## 6. Test Vectors

### Unit Tests
- [ ] ROI calculator: formula correct
- [ ] ROI calculator: min/max clamping
- [ ] ROI calculator: formatCurrency output
- [ ] CountUp: number transition correct
- [ ] Price display: 3 tiers correct values

### Integration Tests
- [ ] All sections render SSR (no JS)
- [ ] All sections render with JS
- [ ] GSAP triggers register correctly
- [ ] FAQ accordion: expand/collapse animation
- [ ] Smooth scroll to pricing section

### E2E Tests
- [ ] Landing page loads with all 14 sections
- [ ] Hero section: scroll → 3D perspective changes
- [ ] BentoFeatures: CountUp animates
- [ ] Economy: sliders adjust → project refresh
- [ ] Pricing: 3 cards visible with CTAs
- [ ] FAQ: expand → answer visible → collapse
- [ ] Footer CTA: click → navigate to register
- [ ] Mobile: layout responsive, no overflow
- [ ] Mobile: bottom CTA visible
- [ ] prefers-reduced-motion: no animations

### Accessibility Tests
- [ ] All section headings semantic (h1-h4)
- [ ] CTA buttons have descriptive text
- [ ] Sliders have aria-valuemin/max/now
- [ ] Color contrast WCAG AA (indigo #4338CA on #EFF2FF)
- [ ] Focus visible on interactive elements
- [ ] Skip to content link

---

## 7. File Inventory

### Components
- `src/app/page.tsx`
- `src/components/landing/RootPageClient.tsx`
- `src/components/landing/LandingPageContent.tsx`
- `src/components/landing/LandingHero.tsx`
- `src/components/landing/LandingTrustBar.tsx`
- `src/components/landing/LandingMarquee.tsx`
- `src/components/landing/LandingAgitation.tsx`
- `src/components/landing/LandingMagic.tsx`
- `src/components/landing/LandingBentoFeatures.tsx`
- `src/components/landing/LandingIntegrations.tsx`
- `src/components/landing/LandingClientFlow.tsx`
- `src/components/landing/LandingComparison.tsx`
- `src/components/landing/LandingProcess.tsx`
- `src/components/landing/LandingEconomy.tsx`
- `src/components/landing/LandingPricing.tsx`
- `src/components/landing/LandingFAQ.tsx`
- `src/components/landing/LandingFooterCTA.tsx`
- `src/components/landing/LandingScrollProgress.tsx`
- `src/components/landing/LandingSplitHeading.tsx`
- `src/components/landing/LandingTestimonials.tsx` (exists, pending)

### Dependencies
- `gsap@^3.15.0`
- `gsap/ScrollTrigger`
- `framer-motion`
