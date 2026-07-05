'use client';

import { useRef } from 'react';
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion';
import { useIsDesktop } from '@/lib/hooks/useIsDesktop';
import { LandingSplitHeading } from '@/components/landing/LandingSplitHeading';

const easeOut: [number, number, number, number] = [0.22, 1, 0.36, 1];

const PAINS = [
  {
    title: 'Записуєш у Direct, потім забуваєш',
    body: 'Переписка розпорошена між Instagram, Viber і Telegram. Про скасування дізнаєшся о 22:00.',
  },
  {
    title: 'Порожні вікна — і ніхто їх не заповнить',
    body: 'Клієнт відмінив запис, а ти годину шукаєш заміну по чатах. Гроші просто зникли.',
  },
  {
    title: 'Без сторінки немає довіри',
    body: 'Клієнт хоче побачити ціни й портфоліо до дзвінка. Якщо не знайде — просто іде.',
  },
  {
    title: 'Облік «на пальцях» — жодної картини',
    body: 'Скільки заробила цього місяця? Яка послуга найвигідніша? Ці цифри нікуди не записані.',
  },
];

export function LandingAgitation() {
  const ref = useRef<HTMLElement>(null);
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
    <section
      ref={ref}
      className="py-20 sm:py-36 px-4 sm:px-6 lg:px-12 relative overflow-hidden"
      style={{ background: 'var(--l-surface)' }}
    >
      {/* Ambient indigo blob */}
      <div
        className="pointer-events-none absolute rounded-full l-blob-float"
        style={{
          width: 500,
          height: 500,
          background: 'radial-gradient(circle, var(--l-blob-indigo-xs) 0%, transparent 70%)',
          top: '-12%',
          right: '-6%',
        }}
        aria-hidden="true"
      />

      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.6fr] gap-14 lg:gap-28 items-start">

          {/* Left: sticky header */}
          <div className="lg:sticky lg:top-36 self-start">
            <motion.div style={{ y: headingY }}>
              <LandingSplitHeading
                text={"Звикла\nдо хаосу?"}
                className="font-[family-name:var(--font-cormorant)] font-semibold leading-[0.9] tracking-tight"
                style={{ fontSize: 'clamp(2.8rem, 5.5vw, 5rem)', color: 'var(--l-ink)' }}
                stagger={80}
                lineDelay={220}
              />
              <motion.p
                {...reveal(0.28)}
                className="mt-6 text-base sm:text-lg leading-relaxed"
                style={{ color: 'var(--l-muted)', maxWidth: 320 }}
              >
                Більшість майстрів витрачають 2–3 години щодня не на роботу, а на її організацію.
              </motion.p>
            </motion.div>
          </div>

          {/* Right: editorial pain list — first is featured, hairline rows, no numbered cards */}
          <div>
            {PAINS.map((p, i) => {
              const featured = i === 0;
              return (
                <motion.div
                  key={i}
                  {...reveal(0.05 + i * 0.07)}
                  className="py-7 sm:py-9"
                  style={{ borderTop: i === 0 ? 'none' : '1px solid var(--l-border)' }}
                >
                  <h3
                    className="font-[family-name:var(--font-cormorant)] font-semibold leading-[1.05] tracking-tight"
                    style={{
                      fontSize: featured ? 'clamp(1.9rem,3.2vw,2.6rem)' : 'clamp(1.35rem,2vw,1.7rem)',
                      color: 'var(--l-ink)',
                    }}
                  >
                    {p.title}
                  </h3>
                  <p
                    className="mt-3 leading-relaxed"
                    style={{
                      color: 'var(--l-muted)',
                      fontSize: featured ? '1.05rem' : '0.95rem',
                      maxWidth: 560,
                    }}
                  >
                    {p.body}
                  </p>
                </motion.div>
              );
            })}
          </div>

        </div>
      </div>
    </section>
  );
}
