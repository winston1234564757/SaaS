'use client';

import { useRef } from 'react';
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion';
import { useIsDesktop } from '@/lib/hooks/useIsDesktop';
import { Sparkles, Footprints, Eye, Scissors, Users, Droplets, Brush, Flower2, PenTool, Wind } from 'lucide-react';
import { LandingSplitHeading } from '@/components/landing/LandingSplitHeading';

const easeOut: [number, number, number, number] = [0.22, 1, 0.36, 1];
const spring = { type: 'spring' as const, stiffness: 320, damping: 22 };

type Block = {
  name: string;
  desc: string;
  Icon: typeof Sparkles;
  wide?: boolean;
  dark?: boolean;
};

// Bento — mixed block sizes, one dark anchor. Icon + niche + a two-word read.
// Order matters: the two `wide` blocks sit at row starts so the 4-col grid fills flush.
const BLOCKS: Block[] = [
  { name: 'Манікюр', desc: 'постійний потік', Icon: Sparkles, wide: true, dark: true },
  { name: 'Педикюр', desc: 'спокійний ритм', Icon: Footprints },
  { name: 'Брови та вії', desc: 'швидко й точно', Icon: Eye },
  { name: 'Волосся', desc: 'довгі візити', Icon: Scissors },
  { name: 'Барбершоп', desc: 'свої клієнти', Icon: Users },
  { name: 'Косметологія', desc: 'догляд курсами', Icon: Droplets },
  { name: 'Макіяж', desc: 'під подію', Icon: Brush },
  { name: 'Масаж і SPA', desc: 'тільки за записом', Icon: Flower2, wide: true },
  { name: 'Тату та перманент', desc: 'великі сесії', Icon: PenTool },
  { name: 'Епіляція', desc: 'регулярні візити', Icon: Wind },
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

        {/* Bento */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 auto-rows-[132px] sm:auto-rows-[150px]">
          {BLOCKS.map((b, i) => {
            const { Icon } = b;
            return (
              <motion.div
                key={b.name}
                {...reveal(0.04 + i * 0.05)}
                whileHover={shouldReduce ? undefined : { y: -4, transition: spring }}
                className={`group relative flex flex-col justify-between overflow-hidden rounded-[1.25rem] p-5 sm:p-6 transition-shadow duration-300 ${b.wide ? 'col-span-2' : ''}`}
                style={{
                  background: b.dark ? 'var(--l-accent)' : 'var(--l-surface)',
                  border: `1px solid ${b.dark ? 'transparent' : 'var(--l-border)'}`,
                  boxShadow: 'var(--l-shadow-sm)',
                }}
              >
                {b.dark && (
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0"
                    style={{ background: 'radial-gradient(ellipse 70% 80% at 88% 10%, var(--l-blob-indigo) 0%, transparent 60%)' }}
                  />
                )}
                <Icon
                  size={b.wide ? 26 : 22}
                  strokeWidth={1.7}
                  className="relative transition-transform duration-300 group-hover:-translate-y-0.5"
                  style={{ color: b.dark ? 'var(--l-indigo-glow)' : 'var(--l-indigo)' }}
                  aria-hidden="true"
                />
                <div className="relative">
                  <h3
                    className="font-[family-name:var(--font-cormorant)] font-semibold leading-tight tracking-tight"
                    style={{
                      fontSize: b.wide ? 'clamp(1.5rem,2.6vw,2rem)' : '1.35rem',
                      color: b.dark ? 'var(--l-text-on-dark)' : 'var(--l-ink)',
                    }}
                  >
                    {b.name}
                  </h3>
                  <p
                    className="mt-1 text-sm"
                    style={{ color: b.dark ? 'var(--l-muted-on-dark)' : 'var(--l-muted)' }}
                  >
                    {b.desc}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Closing note */}
        <motion.p
          {...reveal(0.1)}
          className="mt-10 sm:mt-12 font-[family-name:var(--font-cormorant)] leading-snug max-w-xl"
          style={{ fontSize: 'clamp(1.15rem,2vw,1.5rem)', color: 'var(--l-muted)' }}
        >
          …і будь-яка інша справа, що робить людей красивішими.
        </motion.p>

      </div>
    </section>
  );
}
