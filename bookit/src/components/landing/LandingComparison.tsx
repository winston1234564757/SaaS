'use client';

import { useRef } from 'react';
import { motion, useInView, useScroll, useTransform } from 'framer-motion';
import { X, Check } from 'lucide-react';
import { LandingSplitHeading } from '@/components/landing/LandingSplitHeading';

const spring = { type: 'spring', stiffness: 240, damping: 26 } as const;
const easeOut: [number, number, number, number] = [0.22, 1, 0.36, 1];

const ROWS = [
  {
    before: 'Записуєш у Direct і губиш у переписці',
    after: 'Клієнт записується сам за посиланням',
  },
  {
    before: 'Скасування — годину шукаєш заміну',
    after: 'Флеш-акція закриває вікно за 10 хвилин',
  },
  {
    before: 'Клієнт зник після першого разу — назавжди',
    after: 'Нагадування повертає клієнта в потрібний момент',
  },
  {
    before: 'Виручка — щось між 8 і 12 тисячами',
    after: 'Точна аналітика за день, тиждень, місяць',
  },
  {
    before: 'Нові клієнти тільки по знайомству',
    after: 'Публічна сторінка знаходить тебе в Google',
  },
];

export function LandingComparison() {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });

  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const headingY = useTransform(scrollYProgress, [0, 1], ['3%', '-3%']);

  return (
    <section
      ref={ref}
      className="py-20 sm:py-36 px-4 sm:px-6 lg:px-12"
      style={{ background: '#FFFFFF' }}
    >
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <motion.div className="mb-16 max-w-2xl" style={{ y: headingY }}>
          <motion.span
            initial={{ opacity: 0, y: 12 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ ...spring, delay: 0.05 }}
            className="inline-block text-[11px] font-semibold uppercase tracking-[0.18em] mb-5"
            style={{ color: 'var(--l-indigo)' }}
          >
            Порівняння
          </motion.span>
          <LandingSplitHeading
            text={"Як виглядає\nрізниця."}
            className="font-[family-name:var(--font-cormorant)] font-semibold leading-[0.92] tracking-tight"
            style={{ fontSize: 'clamp(2.6rem,5vw,4.4rem)', color: 'var(--l-ink)' }}
            stagger={70}
            lineDelay={200}
          />
        </motion.div>

        {/* Column headers */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ ...spring, delay: 0.22 }}
          className="grid grid-cols-2 gap-4 mb-4 px-4"
        >
          <p
            className="text-[11px] font-semibold uppercase tracking-[0.15em]"
            style={{ color: 'var(--l-muted-2)' }}
          >
            Без Bookit
          </p>
          <p
            className="text-[11px] font-semibold uppercase tracking-[0.15em]"
            style={{ color: 'var(--l-indigo)' }}
          >
            З Bookit
          </p>
        </motion.div>

        {/* Comparison rows */}
        <div style={{ borderTop: '1px solid var(--l-border)' }}>
          {ROWS.map((row, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 16 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.9, ease: easeOut, delay: 0.24 + i * 0.08 }}
              className="grid grid-cols-2 gap-4 py-5 px-4"
              style={{ borderBottom: '1px solid var(--l-border)' }}
            >
              {/* Before */}
              <div className="flex items-start gap-3">
                <div
                  className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                  style={{ background: 'rgba(100,116,139,0.12)' }}
                  aria-hidden="true"
                >
                  <X size={10} style={{ color: '#94A3B8' }} />
                </div>
                <p className="text-sm leading-snug" style={{ color: 'var(--l-muted)' }}>
                  {row.before}
                </p>
              </div>

              {/* After */}
              <div
                className="flex items-start gap-3 px-4 py-3 rounded-xl"
                style={{ background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.12)' }}
              >
                <div
                  className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                  style={{ background: 'rgba(99,102,241,0.18)' }}
                  aria-hidden="true"
                >
                  <Check size={10} style={{ color: '#4338CA' }} />
                </div>
                <p className="text-sm font-semibold leading-snug" style={{ color: 'var(--l-ink)' }}>
                  {row.after}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
}
