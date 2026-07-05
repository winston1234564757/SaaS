'use client';

import { useEffect, useState } from 'react';
import { MotionConfig } from 'framer-motion';
import { LandingNav } from '@/components/landing/LandingNav';
import { LandingHero } from '@/components/landing/LandingHero';
import { LandingScrollProgress } from '@/components/landing/LandingScrollProgress';
import { LandingTrustBar } from '@/components/landing/LandingTrustBar';
import { LandingMarquee } from '@/components/landing/LandingMarquee';
import { LandingForWhom } from '@/components/landing/LandingForWhom';
import { LandingAgitation } from '@/components/landing/LandingAgitation';
import { LandingMagic } from '@/components/landing/LandingMagic';
import { LandingBentoFeatures } from '@/components/landing/LandingBentoFeatures';
import { LandingFeatures } from '@/components/landing/LandingFeatures';
import { LandingTestimonials } from '@/components/landing/LandingTestimonials';
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
const OVERLAP = '22vh';

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
  { Component: LandingFeatures,      id: 'sec-features',     overlap: true  },
  { Component: LandingIntegrations,  id: 'sec-integrations', overlap: true  },
  { Component: LandingClientFlow,    id: 'sec-client-flow',  overlap: false },
  { Component: LandingComparison,    id: 'sec-comparison',   overlap: true  },
  { Component: LandingProcess,       id: 'sec-process',      overlap: false },
  { Component: LandingEconomy,       id: 'sec-economy',      overlap: true  },
  { Component: LandingTestimonials,  id: 'sec-testimonials', overlap: true  },
  { Component: LandingPricing,       id: 'sec-pricing',      overlap: true  },
  { Component: LandingFAQ,           id: 'sec-faq',          overlap: false },
  { Component: LandingFooterCTA,     id: 'sec-footer-cta',   overlap: true  },
];

export function LandingPageContent() {
  const [prefersReduced, setPrefersReduced] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReduced(mq.matches);
    const listener = (e: MediaQueryListEvent) => setPrefersReduced(e.matches);
    mq.addEventListener('change', listener);
    return () => mq.removeEventListener('change', listener);
  }, []);

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)');
    setIsDesktop(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  useEffect(() => {
    const systemReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let isReducedDevice = systemReduced;
    if (typeof navigator !== 'undefined') {
      const concurrency = navigator.hardwareConcurrency;
      const memory = (navigator as any).deviceMemory;
      if ((concurrency && concurrency < 4) || (memory && memory < 4)) {
        isReducedDevice = true;
      }
    }

    if (isReducedDevice || window.innerWidth < 1024) return;

    let revert: (() => void) | undefined;
    let mounted = true;

    Promise.all([import('gsap'), import('gsap/ScrollTrigger')]).then(
      ([{ default: gsap }, { ScrollTrigger }]) => {
        if (!mounted) return;

        gsap.registerPlugin(ScrollTrigger);

        const ctx = gsap.context(() => {
          SECTIONS.forEach((sec, i) => {
            const prev = SECTIONS[i - 1];
            if (!sec.overlap || !prev?.overlap) return;

            gsap.set(`#${sec.id}`, { y: OVERLAP });
            gsap.to(`#${sec.id}`, {
              y: 0,
              ease: 'none',
              scrollTrigger: {
                trigger: `#${prev.id}`,
                start: 'bottom bottom',
                end: `+=${OVERLAP}`,
                pin: true,
                pinType: 'transform',
                anticipatePin: 1,
                scrub: true,
                invalidateOnRefresh: true,
              },
            });
          });

          ScrollTrigger.refresh();
        });

        revert = () => ctx.revert();
      }
    );

    return () => {
      mounted = false;
      revert?.();
    };
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
          <LandingForWhom />

          {SECTIONS.map((sec, i) => {
            const { Component, id, overlap } = sec;
            const prev = SECTIONS[i - 1];
            // isRising: this section rises up over the previous one
            const isRising = overlap && prev?.overlap === true && !prefersReduced && isDesktop;

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
          <p>© 2026 Bookit — зроблено в Україні</p>
          <LegalFooterLinks />
        </footer>
      </div>
    </MotionConfig>
  );
}
