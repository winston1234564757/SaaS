# Wave 2 — Batch 13: Landing + Root (22 files)
**8 instruments: critique A+B + audit + animate + overdrive + polish + layout + optimize**
**Date: 2026-06-02 | Sub-agent: ses_17af09631ffeVimftKkvWnkhtc**

## Scores

| File | Score | P0 | P1 | P2 | P3 |
|------|-------|----|----|----|----|
| LandingHero.tsx | 25/40 | 0 | 2 | 3 | 1 |
| LandingNav.tsx | 22/40 | 1 | 2 | 2 | 1 |
| LandingFeatures.tsx | 18/40 | 0 | 3 | 2 | 1 |
| LandingBentoFeatures.tsx | 26/40 | 0 | 2 | 3 | 1 |
| LandingProcess.tsx | 24/40 | 0 | 2 | 3 | 1 |
| LandingPricing.tsx | 23/40 | 0 | 2 | 3 | 1 |
| LandingTestimonials.tsx | 24/40 | 0 | 2 | 3 | 1 |
| LandingFAQ.tsx | 25/40 | 0 | 2 | 3 | 1 |
| LandingMagic.tsx | 22/40 | 0 | 2 | 2 | 1 |
| LandingFooterCTA.tsx | 26/40 | 0 | 2 | 3 | 1 |
| LandingEconomy.tsx | 20/40 | 0 | 3 | 2 | 1 |
| LandingComparison.tsx | 23/40 | 0 | 2 | 3 | 1 |
| LandingClientFlow.tsx | 24/40 | 0 | 2 | 3 | 1 |
| LandingIntegrations.tsx | 21/40 | 0 | 2 | 2 | 1 |
| LandingAgitation.tsx | 22/40 | 0 | 2 | 2 | 1 |
| LandingTrustBar.tsx | 27/40 | 0 | 1 | 3 | 2 |
| LandingSplitHeading.tsx | 28/40 | 0 | 1 | 3 | 2 |
| LandingMarquee.tsx | 25/40 | 0 | 2 | 3 | 1 |
| LandingScrollProgress.tsx | 29/40 | 0 | 1 | 3 | 2 |
| RootPageClient.tsx | 24/40 | 0 | 2 | 3 | 1 |
| layout.tsx | 26/40 | 0 | 1 | 3 | 2 |
| page.tsx | 30/40 | 0 | 1 | 3 | 2 |

**Assessment B**: `layout.tsx` — 7 em-dashes in body text (AI-writing tell)

## P0 Issues (1 total)
1. **LandingNav** — Production console.log artifacts (API keys, component paths) left from development

## Key Findings
- **LandingFeatures (18/40)**: Lowest in batch — duplicate feature cards, GSAP and Framer Motion fighting for control
- **Extreme code duplication**: `WordLine`, `splitSentences`, `CountUp` helpers duplicated across 5+ files
- **Motion engine conflict**: Half the landing uses GSAP, half uses Framer Motion — inconsistent feel
- **Economy (20/40)**: Static mock economy dashboard with hardcoded values (fake vacancy counts, revenue)
- **LandingNav**: Console.log of API keys is a real security concern for production builds
- **LandingTrustBar / SplitHeading / ScrollProgress**: Cleanest files — isolated, single-purpose
- **RootPageClient**: Decent router shell, but bundles all landing sections eagerly (no dynamic import)
- **layout.tsx**: Em-dash overuse flagged by detect — classic AI-generated copy pattern

## Systemic
- Landing zone needs a DRY refactor: extract shared helpers (`WordLine`, `CountUp`, animation triggers) into a single `lib/landing-utils.ts`
- GSAP ↔ Framer Motion split should be resolved to one engine
- No landing page has error boundaries — any section crash brings down the entire page
- Hero section images lack `loading="lazy"` and `fetchPriority="high"` — LCP optimization needed
- All landing copy is inline Ukrainian with no i18n structure
- `LandingFeatures.tsx` appears to be dead code (superseded by BentoFeatures but not deleted)


---

--- 
## 📸 Візуальний E2E Аудит & Порівняння Тем (Visual Registry & Carousel)
> Цей розділ автоматично синхронізовано з E2E тестами та скріншотами Playwright за допомогою інтерактивних каруселей.

### 📍 Зона: 00-landing (Landing)

#### 🖼️ Екран: FAQ Closed Desktop

````carousel
![🌸 Blossom Theme: FAQ Closed Desktop](../screenshots/blossom/00-landing/faq-closed-desktop.png)
<!-- slide -->
![❄️ Frost Theme: FAQ Closed Desktop](../screenshots/frost/00-landing/faq-closed-desktop.png)
<!-- slide -->
![🌲 Studio Theme: FAQ Closed Desktop](../screenshots/studio/00-landing/faq-closed-desktop.png)
````

*Швидкі посилання на оригінали:* [🌸 Blossom](../screenshots/blossom/00-landing/faq-closed-desktop.png) | [❄️ Frost](../screenshots/frost/00-landing/faq-closed-desktop.png) | [🌲 Studio](../screenshots/studio/00-landing/faq-closed-desktop.png)

#### 🖼️ Екран: FAQ Open Desktop

````carousel
![🌸 Blossom Theme: FAQ Open Desktop](../screenshots/blossom/00-landing/faq-open-desktop.png)
<!-- slide -->
![❄️ Frost Theme: FAQ Open Desktop](../screenshots/frost/00-landing/faq-open-desktop.png)
<!-- slide -->
![🌲 Studio Theme: FAQ Open Desktop](../screenshots/studio/00-landing/faq-open-desktop.png)
````

*Швидкі посилання на оригінали:* [🌸 Blossom](../screenshots/blossom/00-landing/faq-open-desktop.png) | [❄️ Frost](../screenshots/frost/00-landing/faq-open-desktop.png) | [🌲 Studio](../screenshots/studio/00-landing/faq-open-desktop.png)

#### 🖼️ Екран: Hero CTA Desktop

````carousel
![🌸 Blossom Theme: Hero CTA Desktop](../screenshots/blossom/00-landing/hero-cta-desktop.png)
<!-- slide -->
![❄️ Frost Theme: Hero CTA Desktop](../screenshots/frost/00-landing/hero-cta-desktop.png)
<!-- slide -->
![🌲 Studio Theme: Hero CTA Desktop](../screenshots/studio/00-landing/hero-cta-desktop.png)
````

*Швидкі посилання на оригінали:* [🌸 Blossom](../screenshots/blossom/00-landing/hero-cta-desktop.png) | [❄️ Frost](../screenshots/frost/00-landing/hero-cta-desktop.png) | [🌲 Studio](../screenshots/studio/00-landing/hero-cta-desktop.png)

#### 🖼️ Екран: Landing Mobile Mobile

````carousel
![🌸 Blossom Theme: Landing Mobile Mobile](../screenshots/blossom/00-landing/landing-mobile-mobile.png)
<!-- slide -->
![❄️ Frost Theme: Landing Mobile Mobile](../screenshots/frost/00-landing/landing-mobile-mobile.png)
<!-- slide -->
![🌲 Studio Theme: Landing Mobile Mobile](../screenshots/studio/00-landing/landing-mobile-mobile.png)
````

*Швидкі посилання на оригінали:* [🌸 Blossom](../screenshots/blossom/00-landing/landing-mobile-mobile.png) | [❄️ Frost](../screenshots/frost/00-landing/landing-mobile-mobile.png) | [🌲 Studio](../screenshots/studio/00-landing/landing-mobile-mobile.png)

#### 🖼️ Екран: Landing Overview Desktop Desktop

````carousel
![🌸 Blossom Theme: Landing Overview Desktop Desktop](../screenshots/blossom/00-landing/landing-overview-desktop-desktop.png)
<!-- slide -->
![❄️ Frost Theme: Landing Overview Desktop Desktop](../screenshots/frost/00-landing/landing-overview-desktop-desktop.png)
<!-- slide -->
![🌲 Studio Theme: Landing Overview Desktop Desktop](../screenshots/studio/00-landing/landing-overview-desktop-desktop.png)
````

*Швидкі посилання на оригінали:* [🌸 Blossom](../screenshots/blossom/00-landing/landing-overview-desktop-desktop.png) | [❄️ Frost](../screenshots/frost/00-landing/landing-overview-desktop-desktop.png) | [🌲 Studio](../screenshots/studio/00-landing/landing-overview-desktop-desktop.png)

#### 🖼️ Екран: Landing Overview Mobile Mobile

````carousel
![🌸 Blossom Theme: Landing Overview Mobile Mobile](../screenshots/blossom/00-landing/landing-overview-mobile-mobile.png)
<!-- slide -->
![❄️ Frost Theme: Landing Overview Mobile Mobile](../screenshots/frost/00-landing/landing-overview-mobile-mobile.png)
<!-- slide -->
![🌲 Studio Theme: Landing Overview Mobile Mobile](../screenshots/studio/00-landing/landing-overview-mobile-mobile.png)
````

*Швидкі посилання на оригінали:* [🌸 Blossom](../screenshots/blossom/00-landing/landing-overview-mobile-mobile.png) | [❄️ Frost](../screenshots/frost/00-landing/landing-overview-mobile-mobile.png) | [🌲 Studio](../screenshots/studio/00-landing/landing-overview-mobile-mobile.png)

#### 🖼️ Екран: Pricing Section Desktop

````carousel
![🌸 Blossom Theme: Pricing Section Desktop](../screenshots/blossom/00-landing/pricing-section-desktop.png)
<!-- slide -->
![❄️ Frost Theme: Pricing Section Desktop](../screenshots/frost/00-landing/pricing-section-desktop.png)
<!-- slide -->
![🌲 Studio Theme: Pricing Section Desktop](../screenshots/studio/00-landing/pricing-section-desktop.png)
````

*Швидкі посилання на оригінали:* [🌸 Blossom](../screenshots/blossom/00-landing/pricing-section-desktop.png) | [❄️ Frost](../screenshots/frost/00-landing/pricing-section-desktop.png) | [🌲 Studio](../screenshots/studio/00-landing/pricing-section-desktop.png)

#### 🖼️ Екран: ROI Calculator Changed Desktop

````carousel
![🌸 Blossom Theme: ROI Calculator Changed Desktop](../screenshots/blossom/00-landing/roi-calculator-changed-desktop.png)
<!-- slide -->
![❄️ Frost Theme: ROI Calculator Changed Desktop](../screenshots/frost/00-landing/roi-calculator-changed-desktop.png)
<!-- slide -->
![🌲 Studio Theme: ROI Calculator Changed Desktop](../screenshots/studio/00-landing/roi-calculator-changed-desktop.png)
````

*Швидкі посилання на оригінали:* [🌸 Blossom](../screenshots/blossom/00-landing/roi-calculator-changed-desktop.png) | [❄️ Frost](../screenshots/frost/00-landing/roi-calculator-changed-desktop.png) | [🌲 Studio](../screenshots/studio/00-landing/roi-calculator-changed-desktop.png)

#### 🖼️ Екран: Scroll Progress Desktop

````carousel
![🌸 Blossom Theme: Scroll Progress Desktop](../screenshots/blossom/00-landing/scroll-progress-desktop.png)
<!-- slide -->
![❄️ Frost Theme: Scroll Progress Desktop](../screenshots/frost/00-landing/scroll-progress-desktop.png)
<!-- slide -->
![🌲 Studio Theme: Scroll Progress Desktop](../screenshots/studio/00-landing/scroll-progress-desktop.png)
````

*Швидкі посилання на оригінали:* [🌸 Blossom](../screenshots/blossom/00-landing/scroll-progress-desktop.png) | [❄️ Frost](../screenshots/frost/00-landing/scroll-progress-desktop.png) | [🌲 Studio](../screenshots/studio/00-landing/scroll-progress-desktop.png)

