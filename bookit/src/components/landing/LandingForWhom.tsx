'use client';

import { useRef } from 'react';
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion';
import { useIsDesktop } from '@/lib/hooks/useIsDesktop';
import { LandingSplitHeading } from '@/components/landing/LandingSplitHeading';

const easeOut: [number, number, number, number] = [0.22, 1, 0.36, 1];
const spring = { type: 'spring' as const, stiffness: 340, damping: 18 };

const SPECS = [
  'Манікюр', 'Педикюр', 'Брови', 'Вії', 'Волосся', 'Косметологія',
  'Макіяж', 'Барбер', 'Масаж', 'Тату та перманент', 'Епіляція',
  'Подологія', 'Стиль та імідж', 'SPA-догляд',
];

// Deterministic pseudo-random in [0,1) — identical on server and client (no hydration drift).
function rnd(i: number, salt: number): number {
  const x = Math.sin(i * 97.13 + salt * 41.7) * 43758.5453;
  return x - Math.floor(x);
}

const SIZE_EM = [1.35, 1.7, 2.2, 2.85, 3.6];

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

        {/* Scattered specialization collage — mixed sizes, broken baseline, tap/hover delight.
            Base font-size scales with viewport; per-word multipliers give the big/small mix. */}
        <div
          className="flex flex-wrap items-start gap-y-5 sm:gap-y-8"
          style={{ fontSize: 'clamp(0.72rem, 1.9vw, 1.05rem)' }}
        >
          {SPECS.map((name, i) => {
            const long = name.length > 10;
            const bucket = Math.min(long ? 2 : 4, Math.floor(rnd(i, 1) * 5));
            const size = SIZE_EM[bucket];
            const rot = (rnd(i, 2) - 0.5) * 7;            // -3.5°..3.5°
            const mt = (rnd(i, 3) - 0.3) * 0.85;          // vertical scatter (em)
            const mr = 0.45 + rnd(i, 4) * 0.7;            // horizontal rhythm (em)
            const accent = rnd(i, 5) > 0.68;
            const color = accent ? 'var(--l-indigo)' : size >= 2.2 ? 'var(--l-ink)' : 'var(--l-muted)';

            return (
              <motion.span
                key={name}
                className="inline-block font-[family-name:var(--font-cormorant)] font-semibold leading-none tracking-tight"
                style={{
                  fontSize: `${size}em`,
                  marginTop: `${mt}em`,
                  marginRight: `${mr}em`,
                  color,
                  cursor: 'default',
                  willChange: 'transform',
                }}
                initial={shouldReduce ? { opacity: 1, rotate: rot } : { opacity: 0, scale: 0.8, rotate: rot * 1.7 }}
                whileInView={shouldReduce ? { opacity: 1, rotate: rot } : { opacity: 1, scale: 1, rotate: rot }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: shouldReduce ? 0 : 0.5, ease: easeOut, delay: shouldReduce ? 0 : 0.03 * i + rnd(i, 6) * 0.25 }}
                whileHover={shouldReduce ? undefined : { scale: 1.16, rotate: 0, color: 'var(--l-indigo)', transition: spring }}
                whileTap={{ scale: 0.92, rotate: 0, transition: spring }}
              >
                {name}
              </motion.span>
            );
          })}
        </div>

        {/* Closing note */}
        <motion.p
          {...reveal(0.1)}
          className="mt-12 sm:mt-16 font-[family-name:var(--font-cormorant)] leading-snug max-w-xl"
          style={{ fontSize: 'clamp(1.15rem,2vw,1.5rem)', color: 'var(--l-muted)' }}
        >
          …і будь-яка інша справа, що робить людей красивішими.
        </motion.p>

      </div>
    </section>
  );
}
