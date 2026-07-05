'use client';

import { useRef } from 'react';
import { motion, useInView, useReducedMotion, useScroll, useTransform } from 'framer-motion';
import { useIsDesktop } from '@/lib/hooks/useIsDesktop';
import { WordLine } from '@/components/landing/shared/WordLine';

const easeOut: [number, number, number, number] = [0.22, 1, 0.36, 1];

const STEPS = [
  {
    title: 'Реєструєшся за 2 хвилини',
    body: 'Номер телефону, назва і місто. Більше нічого. Без демо-дзвінків і менеджерів.',
  },
  {
    title: 'Додаєш послуги і розклад',
    body: 'Завантажуєш портфоліо, вказуєш ціни і час роботи. Система сама формує твою публічну сторінку.',
  },
  {
    title: 'Отримуєш записи в Telegram',
    body: 'Клієнти записуються через посилання або QR-код. Ти бачиш все в одному місці і нічого не пропускаєш.',
  },
];

export function LandingProcess() {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  const shouldReduce = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });
  const isDesktop = useIsDesktop();
  const headingYDesktop = useTransform(scrollYProgress, [0, 1], shouldReduce ? ['0%', '0%'] : ['0%', '-8%']);
  const headingYMobile = useTransform(scrollYProgress, [0, 1], shouldReduce ? ['0%', '0%'] : ['0%', '-2%']);
  const headingY = isDesktop ? headingYDesktop : headingYMobile;

  const reveal = (delay: number) => ({
    initial: { opacity: 0, y: 24 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: '-60px' },
    transition: { duration: shouldReduce ? 0 : 0.6, ease: easeOut, delay: shouldReduce ? 0 : delay },
  });

  return (
    <section ref={ref} className="py-20 sm:py-36 px-4 sm:px-6 lg:px-12 relative overflow-hidden">
      {/* Ambient blob */}
      <div
        className="pointer-events-none absolute rounded-full l-blob-float-2"
        style={{
          width: 420,
          height: 420,
          background: 'radial-gradient(circle, var(--l-blob-indigo-sm) 0%, transparent 70%)',
          bottom: '0%',
          right: '-6%',
        }}
        aria-hidden="true"
      />

      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.4fr] gap-14 lg:gap-24 items-start">

          {/* Left: sticky header */}
          <div className="lg:sticky lg:top-32">
            <motion.div style={{ y: headingY }}>
              <h2
                className="font-[family-name:var(--font-cormorant)] font-semibold leading-[0.95] tracking-tight"
                style={{ fontSize: 'clamp(2.4rem,5vw,4rem)', color: 'var(--l-ink)' }}
              >
                <WordLine words={['Три', 'кроки']} lineIndex={0} inView={inView} reducedMotion={!!shouldReduce} />
                <WordLine
                  words={['до', 'першого', 'запису.']}
                  lineIndex={1}
                  inView={inView}
                  reducedMotion={!!shouldReduce}
                  style={{ color: 'var(--l-accent)', fontStyle: 'normal' }}
                />
              </h2>
              <motion.p
                {...reveal(0.5)}
                className="mt-5 text-base sm:text-lg leading-relaxed"
                style={{ color: 'var(--l-muted)' }}
              >
                Від реєстрації до першої броні — менше одного дня.
              </motion.p>
            </motion.div>
          </div>

          {/* Right: vertical spine timeline */}
          <div className="relative">
            {/* spine line behind nodes */}
            <div
              aria-hidden="true"
              className="absolute w-px"
              style={{ top: 26, bottom: 96, left: 26, background: 'var(--l-border-2)' }}
            />

            <div className="flex flex-col gap-10 sm:gap-12">
              {STEPS.map((s, i) => (
                <motion.div key={i} {...reveal(0.1 + i * 0.12)} className="relative flex gap-6 sm:gap-7">
                  <span
                    className="size-[52px] rounded-full flex items-center justify-center flex-shrink-0 font-[family-name:var(--font-cormorant)] font-semibold leading-none relative z-10"
                    style={{
                      background: 'var(--l-bg)',
                      border: '1.5px solid var(--l-indigo)',
                      color: 'var(--l-indigo)',
                      fontSize: '1.5rem',
                    }}
                  >
                    {i + 1}
                  </span>
                  <div className="pt-2">
                    <h3
                      className="font-[family-name:var(--font-cormorant)] font-semibold leading-tight mb-2"
                      style={{ fontSize: '1.5rem', color: 'var(--l-ink)' }}
                    >
                      {s.title}
                    </h3>
                    <p className="text-[0.95rem] leading-relaxed" style={{ color: 'var(--l-muted)', maxWidth: 460 }}>
                      {s.body}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Time badge */}
            <motion.div
              {...reveal(0.5)}
              className="mt-10 ml-[74px] sm:ml-[78px] inline-flex items-center gap-3 px-5 py-3 rounded-full"
              style={{
                background: 'color-mix(in srgb, var(--l-indigo-glow) 8%, transparent)',
                border: '1px solid color-mix(in srgb, var(--l-indigo-glow) 15%, transparent)',
              }}
            >
              <span
                className="size-2 rounded-full animate-pulse"
                style={{ background: 'var(--l-accent)' }}
                aria-hidden="true"
              />
              <span className="text-sm font-medium" style={{ color: 'var(--l-accent)' }}>
                Старт за 2 хвилини · Без кредитної картки
              </span>
            </motion.div>
          </div>

        </div>
      </div>
    </section>
  );
}
