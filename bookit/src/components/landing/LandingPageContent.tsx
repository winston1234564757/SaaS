'use client';

import { useEffect, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { MotionConfig } from 'framer-motion';
import { LandingNav } from '@/components/landing/LandingNav';
import { LandingHero } from '@/components/landing/LandingHero';
import { LandingScrollProgress } from '@/components/landing/LandingScrollProgress';
import { LandingTrustBar } from '@/components/landing/LandingTrustBar';
import { LandingMarquee } from '@/components/landing/LandingMarquee';
import { LandingAgitation } from '@/components/landing/LandingAgitation';
import { LandingMagic } from '@/components/landing/LandingMagic';
import { LandingBentoFeatures } from '@/components/landing/LandingBentoFeatures';
import { LandingIntegrations } from '@/components/landing/LandingIntegrations';
import { LandingClientFlow } from '@/components/landing/LandingClientFlow';
import { LandingComparison } from '@/components/landing/LandingComparison';
import { LandingProcess } from '@/components/landing/LandingProcess';
import { LandingEconomy } from '@/components/landing/LandingEconomy';
import { LandingPricing } from '@/components/landing/LandingPricing';
import { LandingFAQ } from '@/components/landing/LandingFAQ';
import { LandingFooterCTA } from '@/components/landing/LandingFooterCTA';
import { LegalFooterLinks } from '@/components/shared/LegalFooterLinks';

// How far the rising section overlaps the pinned one.
// 30vh = less aggressive, sections stay visually distinct.
const OVERLAP = '30vh';

type SectionDef = {
  Component: React.ComponentType;
  id: string;
  // overlap: false → transparent bg (Process, FAQ) — excluded from card-rise effect
  overlap: boolean;
};

const SECTIONS: SectionDef[] = [
  { Component: LandingAgitation,     id: 'sec-agitation',    overlap: true  },
  { Component: LandingMagic,         id: 'sec-magic',        overlap: true  },
  { Component: LandingBentoFeatures, id: 'sec-bento',        overlap: true  },
  { Component: LandingIntegrations,  id: 'sec-integrations', overlap: true  },
  { Component: LandingClientFlow,    id: 'sec-client-flow',  overlap: true  },
  { Component: LandingComparison,    id: 'sec-comparison',   overlap: true  },
  { Component: LandingProcess,       id: 'sec-process',      overlap: false },
  { Component: LandingEconomy,       id: 'sec-economy',      overlap: true  },
  { Component: LandingPricing,       id: 'sec-pricing',      overlap: true  },
  { Component: LandingFAQ,           id: 'sec-faq',          overlap: false },
  { Component: LandingFooterCTA,     id: 'sec-footer-cta',   overlap: true  },
];

export function LandingPageContent() {
  const [prefersReduced, setPrefersReduced] = useState(false);

  useEffect(() => {
    // 1. Check system reduced motion
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    let isReduced = mediaQuery.matches;

    // 2. Check hardware constraints for weak devices
    if (typeof navigator !== 'undefined') {
      const concurrency = navigator.hardwareConcurrency;
      const memory = (navigator as any).deviceMemory;
      if ((concurrency && concurrency < 4) || (memory && memory < 4)) {
        isReduced = true;
      }
    }

    setPrefersReduced(isReduced);

    const listener = (e: MediaQueryListEvent) => {
      let currentReduced = e.matches;
      if (typeof navigator !== 'undefined') {
        const concurrency = navigator.hardwareConcurrency;
        const memory = (navigator as any).deviceMemory;
        if ((concurrency && concurrency < 4) || (memory && memory < 4)) {
          currentReduced = true;
        }
      }
      setPrefersReduced(currentReduced);
    };

    mediaQuery.addEventListener('change', listener);
    return () => mediaQuery.removeEventListener('change', listener);
  }, []);

  useEffect(() => {
    // Check prefers-reduced-motion / weak devices check inside GSAP setup too
    const systemReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let isReducedDevice = systemReduced;
    if (typeof navigator !== 'undefined') {
      const concurrency = navigator.hardwareConcurrency;
      const memory = (navigator as any).deviceMemory;
      if ((concurrency && concurrency < 4) || (memory && memory < 4)) {
        isReducedDevice = true;
      }
    }

    if (isReducedDevice) {
      return; // Do not register heavy GSAP scroll animations
    }

    gsap.registerPlugin(ScrollTrigger);

    const ctx = gsap.context(() => {
      SECTIONS.forEach((sec, i) => {
        const prev = SECTIONS[i - 1];

        // Only consecutive overlap: true pairs participate in the card-rise effect.
        // overlap: false (Process, FAQ) breaks the chain — no pin, no rise around them.
        if (!sec.overlap || !prev?.overlap) return;

        // CSS margin-top: -OVERLAP pulls the rising section 30vh up in layout flow,
        // pre-closing the gap that would appear once it animates up.
        // gsap.set(y: OVERLAP) counteracts this visually → looks natural on load.
        gsap.set(`#${sec.id}`, { y: OVERLAP });

        // prev section pins; current section rises scrubbed 1:1 to the scroll wheel.
        // ease: 'none' → scrub owns the easing feel entirely.
        gsap.to(`#${sec.id}`, {
          y: 0,
          ease: 'none',
          scrollTrigger: {
            trigger: `#${prev.id}`,
            start: 'bottom bottom',   // pins when prev bottom touches viewport bottom
            end: `+=${OVERLAP}`,      // 30vh of scroll = full rise = pin releases
            pin: true,
            anticipatePin: 1,         // prevents the pop on fast scroll
            scrub: 1,                 // 1s smoothing lag — weight-y, physical feel
            invalidateOnRefresh: true,
          },
        });
      });

      ScrollTrigger.refresh();
    });

    return () => ctx.revert();
  }, []);

  return (
    <MotionConfig reducedMotion={prefersReduced ? 'always' : 'user'}>
      <div className="landing-page relative min-h-dvh" style={{ background: 'var(--l-bg)' }}>
        <LandingScrollProgress />
        <LandingNav />

        <main style={{ overflowX: 'clip' }}>
          <LandingHero />
          <LandingTrustBar />
          <LandingMarquee />

          {SECTIONS.map((sec, i) => {
            const { Component, id, overlap } = sec;
            const prev = SECTIONS[i - 1];
            // isRising: this section rises up over the previous one
            const isRising = overlap && prev?.overlap === true && !prefersReduced;

            return (
              <div
                key={id}
                id={id}
                style={{
                  position: 'relative',
                  zIndex: i + 2,
                  ...(isRising && {
                    // Closes the layout gap; gsap.set(y: OVERLAP) offsets visually.
                    marginTop: `-${OVERLAP}`,
                    // Card-rise aesthetic: rounded top corners + depth shadow.
                    // overflow: clip clips inner bg without creating a scroll container
                    // (unlike overflow: hidden which would break any sticky descendants).
                    borderRadius: '1.5rem 1.5rem 0 0',
                    overflow: 'clip' as React.CSSProperties['overflow'],
                    boxShadow: '0 -20px 60px rgba(15,23,42,0.16)',
                  }),
                }}
              >
                <Component />
              </div>
            );
          })}
        </main>

        <footer
          className="py-10 px-4 flex flex-col items-center gap-3 text-sm"
          style={{ color: 'var(--l-muted)', borderTop: '1px solid var(--l-border)' }}
        >
          <p>© 2026 Bookit — зроблено в Україні 🇺🇦</p>
          <LegalFooterLinks />
        </footer>
      </div>
    </MotionConfig>
  );
}
