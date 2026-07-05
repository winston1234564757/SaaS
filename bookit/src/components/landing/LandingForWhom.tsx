'use client';

import { useRef } from 'react';
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion';
import { useIsDesktop } from '@/lib/hooks/useIsDesktop';
import { LandingSplitHeading } from '@/components/landing/LandingSplitHeading';

const easeOut: [number, number, number, number] = [0.22, 1, 0.36, 1];
const spring = { type: 'spring' as const, stiffness: 320, damping: 18 };

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

const isLong = (n: string) => n.length > 10;

// Estimated word footprint as a % of the (worst-case, mobile) container.
// Positions are placed so these boxes never overlap; on wider desktop the same
// %-boxes are relatively smaller, so it only gets airier.
function box(name: string) {
  const long = isLong(name);
  const fontPx = long ? 19.2 : 24;           // clamp() mins on mobile (bigger)
  const maxScale = long ? 1.02 : 1.3;        // breathing ceiling (long words grow less)
  const wpx = name.length * fontPx * 0.5 * maxScale;
  const hpx = fontPx * maxScale;
  const refW = 360, refH = 470;              // denser field → smaller gaps
  return { w: (wpx / refW) * 100, h: (hpx / refH) * 100 };
}

// Free (gridless) placement: no rows, no alignment. Widest words placed first so
// they reserve room; box-overlap rejection keeps everything legible.
function buildPositions(specs: string[]) {
  const items = specs
    .map((n, i) => ({ i, ...box(n) }))
    .sort((a, b) => b.w - a.w);
  const placed: { i: number; x: number; y: number; w: number; h: number }[] = [];

  for (const it of items) {
    const xMax = Math.max(1, 99 - it.w);
    const yMax = Math.max(2, 96 - it.h);
    let spot: { x: number; y: number } | null = null;
    for (let a = 0; a < 700 && !spot; a++) {
      const x = 1 + rnd(it.i * 7 + a, 11) * (xMax - 1);
      const y = 2 + rnd(it.i * 7 + a, 23) * (yMax - 2);
      const clash = placed.some(
        (p) => x < p.x + p.w + 0.6 && p.x < x + it.w + 0.6 && y < p.y + p.h + 1 && p.y < y + it.h + 1,
      );
      if (!clash) spot = { x, y };
    }
    if (!spot) spot = { x: 1 + rnd(it.i, 5) * (xMax - 1), y: 2 + rnd(it.i, 9) * (yMax - 2) };
    placed.push({ i: it.i, ...spot, w: it.w, h: it.h });
  }

  const out: { x: number; y: number }[] = new Array(specs.length);
  for (const p of placed) out[p.i] = { x: p.x, y: p.y };
  return out;
}

const POS = buildPositions(SPECS);
const CYCLE = 2.6; // seconds — big↔small breathing

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
        <motion.div className="mb-10 sm:mb-14 max-w-2xl" style={{ y: headingY }}>
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

        {/* Gridless word field — upright words at free random positions, breathing size loop.
            scale (GPU transform) animates instead of font-size to avoid reflow. */}
        <div className="relative w-full h-[460px] sm:h-[360px] lg:h-[380px]">
          {SPECS.map((name, i) => {
            const long = isLong(name);
            const pos = POS[i];
            const phase = rnd(i, 5) * CYCLE;                // desync so sizes swap over time
            const baseStatic = 0.72 + rnd(i, 7) * 0.55;     // reduced-motion: varied fixed size
            const accent = rnd(i, 8) > 0.66;
            const color = accent ? 'var(--l-indigo)' : rnd(i, 9) > 0.5 ? 'var(--l-ink)' : 'var(--l-muted)';
            const loop = long ? [0.74, 1.02, 0.74] : [0.62, 1.3, 0.62];

            return (
              <motion.span
                key={name}
                className="absolute inline-block font-[family-name:var(--font-cormorant)] font-semibold leading-none tracking-tight whitespace-nowrap"
                style={{
                  left: `${pos.x}%`,
                  top: `${pos.y}%`,
                  fontSize: long ? 'clamp(1.2rem,2.6vw,1.95rem)' : 'clamp(1.5rem,3.4vw,2.5rem)',
                  color,
                  cursor: 'default',
                  transformOrigin: 'left center',
                  willChange: 'transform, opacity',
                }}
                initial={{ opacity: 0, scale: shouldReduce ? baseStatic : 0.9 }}
                whileInView={shouldReduce ? { opacity: 1, scale: baseStatic } : { opacity: 1, scale: loop }}
                viewport={{ once: true, margin: '-40px' }}
                transition={
                  shouldReduce
                    ? { duration: 0 }
                    : {
                        opacity: { duration: 0.5, ease: easeOut, delay: 0.03 * i },
                        scale: { duration: CYCLE, repeat: Infinity, ease: 'easeInOut', delay: phase },
                      }
                }
                whileHover={shouldReduce ? undefined : { color: 'var(--l-indigo)', transition: spring }}
              >
                {name}
              </motion.span>
            );
          })}
        </div>

        {/* Closing note */}
        <motion.p
          {...reveal(0.1)}
          className="mt-8 sm:mt-10 font-[family-name:var(--font-cormorant)] leading-snug max-w-xl"
          style={{ fontSize: 'clamp(1.15rem,2vw,1.5rem)', color: 'var(--l-muted)' }}
        >
          …і будь-яка інша справа, що робить людей красивішими.
        </motion.p>

      </div>
    </section>
  );
}
