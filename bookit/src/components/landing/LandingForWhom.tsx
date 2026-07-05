'use client';

import { Fragment, useRef } from 'react';
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion';
import { useIsDesktop } from '@/lib/hooks/useIsDesktop';
import { LandingSplitHeading } from '@/components/landing/LandingSplitHeading';

const easeOut: [number, number, number, number] = [0.22, 1, 0.36, 1];

type Spec = { name: string; tier: 'core' | 'adj'; accent?: boolean };

const SPECS: Spec[] = [
  { name: 'Манікюр', tier: 'core', accent: true },
  { name: 'Педикюр', tier: 'core' },
  { name: 'Брови', tier: 'core', accent: true },
  { name: 'Вії', tier: 'core' },
  { name: 'Волосся', tier: 'core' },
  { name: 'Косметологія', tier: 'core' },
  { name: 'Макіяж', tier: 'core' },
  { name: 'Барбер', tier: 'core' },
  { name: 'Масаж', tier: 'adj' },
  { name: 'Тату та перманент', tier: 'adj' },
  { name: 'Епіляція', tier: 'adj' },
  { name: 'Подологія', tier: 'adj' },
  { name: 'Стиль та імідж', tier: 'adj' },
  { name: 'SPA-догляд', tier: 'adj' },
];

export function LandingForWhom() {
  const ref = useRef<HTMLElement>(null);
  const shouldReduce = useReducedMotion();

  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const isDesktop = useIsDesktop();
  const headingYDesktop = useTransform(scrollYProgress, [0, 1], shouldReduce ? ['0%', '0%'] : ['0%', '-8%']);
  const headingYMobile = useTransform(scrollYProgress, [0, 1], shouldReduce ? ['0%', '0%'] : ['0%', '-2%']);
  const headingY = isDesktop ? headingYDesktop : headingYMobile;

  const reveal = (delay: number) => ({
    initial: { opacity: 0, y: 16 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: '-60px' },
    transition: { duration: shouldReduce ? 0 : 0.5, ease: easeOut, delay: shouldReduce ? 0 : delay },
  });

  return (
    <section ref={ref} id="sec-forwhom" className="py-20 sm:py-32 px-4 sm:px-6 lg:px-12" style={{ background: 'var(--l-bg)' }}>
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <motion.div className="mb-12 sm:mb-16 max-w-2xl" style={{ y: headingY }}>
          <LandingSplitHeading
            text={"Для кожного,\nхто робить красу."}
            className="font-[family-name:var(--font-cormorant)] font-semibold leading-[0.92] tracking-tight"
            style={{ fontSize: 'clamp(2.6rem,5vw,4.4rem)', color: 'var(--l-ink)' }}
            stagger={70}
            lineDelay={200}
          />
          <motion.p
            {...reveal(0.28)}
            className="mt-6 text-base sm:text-lg leading-relaxed"
            style={{ color: 'var(--l-muted)' }}
          >
            Bookit однаково добре працює для будь-якої б&apos;юті-ніші. І для суміжних теж.
          </motion.p>
        </motion.div>

        {/* Editorial specialization index — flowing serif, size/colour tiers, no cards */}
        <div className="flex flex-wrap items-baseline gap-x-5 sm:gap-x-7 gap-y-2">
          {SPECS.map((s, i) => {
            const core = s.tier === 'core';
            return (
              <Fragment key={s.name}>
                {i > 0 && (
                  <span
                    className="select-none self-center"
                    style={{ color: 'var(--l-muted-2)', fontSize: '0.85rem' }}
                    aria-hidden="true"
                  >
                    ·
                  </span>
                )}
                <motion.span
                  {...reveal(0.04 + i * 0.035)}
                  className="font-[family-name:var(--font-cormorant)] font-semibold leading-none tracking-tight"
                  style={{
                    fontSize: core ? 'clamp(1.7rem,3.4vw,2.7rem)' : 'clamp(1.15rem,2vw,1.55rem)',
                    color: s.accent ? 'var(--l-indigo)' : core ? 'var(--l-ink)' : 'var(--l-muted)',
                  }}
                >
                  {s.name}
                </motion.span>
              </Fragment>
            );
          })}
        </div>

        {/* Closing note — trails the index */}
        <motion.p
          {...reveal(0.1)}
          className="mt-9 sm:mt-11 font-[family-name:var(--font-cormorant)] leading-snug max-w-xl"
          style={{ fontSize: 'clamp(1.15rem,2vw,1.5rem)', color: 'var(--l-muted)' }}
        >
          …і будь-яка інша справа, що робить людей красивішими.
        </motion.p>

      </div>
    </section>
  );
}
