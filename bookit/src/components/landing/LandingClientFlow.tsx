'use client';

import { useRef } from 'react';
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion';
import { useIsDesktop } from '@/lib/hooks/useIsDesktop';
import { LandingSplitHeading } from '@/components/landing/LandingSplitHeading';

const easeOut: [number, number, number, number] = [0.22, 1, 0.36, 1];

const STEPS = [
  {
    title: 'Клієнт відкриває посилання',
    body: 'Ніякої реєстрації. Бачить твої послуги, ціни і вільний час прямо зараз.',
    detail: 'bookit.ua/anna',
  },
  {
    title: 'Обирає час і підтверджує номер',
    body: 'OTP за 30 секунд. Запис підтверджено — жодного дзвінка.',
    detail: 'SMS · 30 сек',
  },
  {
    title: 'Отримує нагадування перед записом',
    body: 'Telegram або Push за 2 години. Ніхто не забуває, ніхто не спізнюється.',
    detail: 'TG / Push · −2 год',
  },
];

export function LandingClientFlow() {
  const ref = useRef<HTMLElement>(null);
  const shouldReduce = useReducedMotion();

  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const isDesktop = useIsDesktop();
  const headingYDesktop = useTransform(scrollYProgress, [0, 1], shouldReduce ? ['0%', '0%'] : ['0%', '-14%']);
  const headingYMobile = useTransform(scrollYProgress, [0, 1], shouldReduce ? ['0%', '0%'] : ['0%', '-4%']);
  const headingY = isDesktop ? headingYDesktop : headingYMobile;

  const reveal = (delay: number) => ({
    initial: { opacity: 0, y: 24 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: '-60px' },
    transition: { duration: shouldReduce ? 0 : 0.6, ease: easeOut, delay: shouldReduce ? 0 : delay },
  });

  return (
    <section
      ref={ref}
      className="py-20 sm:py-32 px-4 sm:px-6 lg:px-12"
      style={{ background: 'var(--l-bg)' }}
    >
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <motion.div className="mb-14 sm:mb-16 max-w-xl" style={{ y: headingY }}>
          <LandingSplitHeading
            text={"Три кроки\nдля клієнта."}
            className="font-[family-name:var(--font-cormorant)] font-semibold leading-[0.92] tracking-tight"
            style={{ fontSize: 'clamp(2.6rem,5vw,4.4rem)', color: 'var(--l-ink)' }}
            stagger={70}
            lineDelay={200}
          />
        </motion.div>

        {/* Connected horizontal stepper (vertical stack on mobile) */}
        <div className="relative grid gap-12 lg:grid-cols-3 lg:gap-10">
          {/* Desktop connecting line, behind the number nodes */}
          <div
            aria-hidden="true"
            className="hidden lg:block absolute h-px"
            style={{ top: 26, left: 26, right: 26, background: 'var(--l-border-2)' }}
          />

          {STEPS.map((s, i) => (
            <motion.div key={i} {...reveal(0.08 + i * 0.12)} className="relative flex flex-col gap-5">
              <div className="flex items-center justify-between gap-3">
                <span
                  className="size-[52px] rounded-full flex items-center justify-center font-[family-name:var(--font-cormorant)] font-semibold leading-none"
                  style={{ background: 'var(--l-accent)', color: 'var(--l-accent-on)', fontSize: '1.5rem' }}
                >
                  {i + 1}
                </span>
                <span
                  className="text-[0.8rem] font-semibold px-3.5 py-1.5 rounded-full whitespace-nowrap"
                  style={{
                    background: 'color-mix(in srgb, var(--l-indigo-glow) 10%, transparent)',
                    color: 'var(--l-indigo)',
                    border: '1px solid color-mix(in srgb, var(--l-indigo-glow) 18%, transparent)',
                  }}
                >
                  {s.detail}
                </span>
              </div>

              <div>
                <h3
                  className="font-[family-name:var(--font-cormorant)] font-semibold leading-tight mb-2"
                  style={{ fontSize: '1.5rem', color: 'var(--l-ink)' }}
                >
                  {s.title}
                </h3>
                <p className="text-[0.95rem] leading-relaxed" style={{ color: 'var(--l-muted)', maxWidth: 360 }}>
                  {s.body}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
}
