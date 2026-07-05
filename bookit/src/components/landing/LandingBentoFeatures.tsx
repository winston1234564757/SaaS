'use client';

import { useRef } from 'react';
import {
  motion,
  useInView,
  useReducedMotion,
  useTransform,
  useScroll,
} from 'framer-motion';
import { useIsDesktop } from '@/lib/hooks/useIsDesktop';
import { LandingSplitHeading } from '@/components/landing/LandingSplitHeading';
import { CountUp } from '@/components/landing/shared/CountUp';

const easeOut: [number, number, number, number] = [0.22, 1, 0.36, 1];

const DAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
const TIMES = ['09:00', '10:30', '12:00', '13:30', '15:00', '16:30', '18:00'];

const SLOTS: Record<string, { status: 'booked' | 'smart' | 'free'; label?: string }> = {
  'Пн-09:00': { status: 'booked' },
  'Пн-10:30': { status: 'booked' },
  'Пн-12:00': { status: 'smart', label: 'Flash' },
  'Пн-15:00': { status: 'booked' },
  'Пн-16:30': { status: 'booked' },
  'Пн-18:00': { status: 'booked' },
  'Вт-09:00': { status: 'booked' },
  'Вт-10:30': { status: 'smart', label: 'Smart' },
  'Вт-13:30': { status: 'booked' },
  'Вт-15:00': { status: 'booked' },
  'Вт-16:30': { status: 'booked' },
  'Ср-09:00': { status: 'booked' },
  'Ср-12:00': { status: 'booked' },
  'Ср-13:30': { status: 'smart', label: 'Smart' },
  'Ср-15:00': { status: 'booked' },
  'Ср-18:00': { status: 'booked' },
  'Чт-09:00': { status: 'booked' },
  'Чт-10:30': { status: 'booked' },
  'Чт-15:00': { status: 'booked' },
  'Чт-16:30': { status: 'smart', label: 'Smart' },
  'Пт-09:00': { status: 'booked' },
  'Пт-12:00': { status: 'booked' },
  'Пт-13:30': { status: 'booked' },
  'Пт-16:30': { status: 'booked' },
  'Пт-18:00': { status: 'booked' },
  'Сб-09:00': { status: 'booked' },
  'Сб-10:30': { status: 'booked' },
  'Сб-12:00': { status: 'smart', label: 'Smart' },
  'Сб-13:30': { status: 'booked' },
  'Сб-15:00': { status: 'booked' },
};

export function LandingBentoFeatures() {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  const shouldReduce = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });
  const isDesktop = useIsDesktop();
  const headingYDesktop = useTransform(scrollYProgress, [0, 1], shouldReduce ? ['0%', '0%'] : ['0%', '-14%']);
  const headingYMobile  = useTransform(scrollYProgress, [0, 1], shouldReduce ? ['0%', '0%'] : ['0%', '-4%']);
  const headingY = isDesktop ? headingYDesktop : headingYMobile;

  return (
    <section
      ref={ref}
      className="py-20 sm:py-36 px-4 sm:px-6 lg:px-12"
      style={{ background: 'var(--l-bg-dark)' }}
    >
      <style>{`
        @media (prefers-reduced-motion: no-preference) {
          .l-slot-smart { animation: lSlotPulse 2s ease-in-out infinite; }
        }
        @keyframes lSlotPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }
      `}</style>

      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mb-20">
          <motion.div style={{ y: headingY }}>
            <LandingSplitHeading
              text={"Розклад\nбез прогалин."}
              className="font-[family-name:var(--font-cormorant)] font-semibold leading-[0.9] tracking-tight"
              style={{ fontSize: 'clamp(2.8rem, 6vw, 5.5rem)', color: 'var(--l-text-on-dark)' }}
              stagger={80}
              lineDelay={220}
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.97 }}
            animate={inView ? { opacity: 1, y: 0, scale: 1 } : {}}
            transition={{ duration: 0.9, ease: easeOut, delay: 0.18 }}
            className="lg:pt-12"
          >
            <p
              className="text-base leading-relaxed"
              style={{ color: 'var(--l-muted-on-dark)' }}
            >
              Алгоритм бачить твій тиждень і заповнює його рівномірно. Хтось скасував? Флеш-акція знаходить заміну за хвилини.
            </p>
          </motion.div>
        </div>

        {/* Metrics — editorial stat strip, featured first, no pill blobs */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: shouldReduce ? 0 : 0.7, ease: easeOut, delay: 0.24 }}
          className="mb-14 pt-8 flex flex-col sm:flex-row sm:items-end gap-8 sm:gap-14"
          style={{ borderTop: '1px solid var(--l-border-on-dark)' }}
        >
          <div>
            <p
              className="font-[family-name:var(--font-cormorant)] font-semibold leading-none"
              style={{ fontSize: 'clamp(3rem, 6vw, 4.5rem)', color: 'var(--l-text-on-dark)' }}
            >
              до 27%
            </p>
            <p className="mt-2 text-sm" style={{ color: 'var(--l-muted-on-dark)' }}>більше доходу</p>
          </div>

          <div className="flex gap-10 sm:gap-14">
            <div>
              <p
                className="font-[family-name:var(--font-cormorant)] font-semibold leading-none"
                style={{ fontSize: 'clamp(1.8rem, 3vw, 2.6rem)', color: 'var(--l-text-on-dark)' }}
              >
                0
              </p>
              <p className="mt-2 text-sm max-w-[150px]" style={{ color: 'var(--l-muted-on-dark)' }}>
                порожніх вікон тижнями
              </p>
            </div>
            <div>
              <p
                className="font-[family-name:var(--font-cormorant)] font-semibold leading-none"
                style={{ fontSize: 'clamp(1.8rem, 3vw, 2.6rem)', color: 'var(--l-text-on-dark)' }}
              >
                <CountUp to={10} />
              </p>
              <p className="mt-2 text-sm max-w-[160px]" style={{ color: 'var(--l-muted-on-dark)' }}>
                хвилин — і скасування закрите
              </p>
            </div>
          </div>
        </motion.div>

        {/* Slot grid */}
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.97 }}
          animate={inView ? { opacity: 1, y: 0, scale: 1 } : {}}
          transition={{ duration: 0.9, ease: easeOut, delay: 0.36 }}
          className="rounded-[1.5rem] overflow-hidden"
          style={{
            background: 'var(--l-surface-on-dark)',
            border: '1px solid var(--l-border-on-dark)',
          }}
          aria-label="Приклад розкладу Smart Slots"
        >
          <div className="p-5 sm:p-8 overflow-x-auto">
            <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '3px' }} role="presentation">
              <thead>
                <tr>
                  <th style={{ width: 52, paddingRight: 8 }} />
                  {DAYS.map((d) => (
                    <th
                      key={d}
                      className="text-center text-[11px] font-semibold pb-3"
                      style={{ color: 'var(--l-muted-on-dark)' }}
                    >
                      {d}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {TIMES.map((t) => (
                  <tr key={t}>
                    <td
                      className="text-[10px] font-medium pr-3 text-right"
                      style={{ color: 'var(--l-muted-on-dark)', paddingBottom: 3 }}
                    >
                      {t}
                    </td>
                    {DAYS.map((d) => {
                      const key = `${d}-${t}`;
                      const slot = SLOTS[key];
                      return (
                        <td key={d} style={{ paddingBottom: 3 }}>
                          <div
                            className={slot?.status === 'smart' ? 'l-slot-smart' : undefined}
                            style={{
                              height: 28,
                              borderRadius: 6,
                              background: slot?.status === 'booked'
                                ? 'rgba(99,102,241,0.30)'
                                : slot?.status === 'smart'
                                ? 'var(--l-slot-booked)'
                                : 'rgba(248,250,252,0.04)',
                              border: slot?.status === 'smart'
                                ? '1px solid rgba(99,102,241,0.6)'
                                : '1px solid rgba(248,250,252,0.05)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            {slot?.status === 'smart' && (
                              <span style={{ fontSize: 8, color: 'rgba(255,255,255,0.88)', fontWeight: 700 }}>
                                {slot.label}
                              </span>
                            )}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="flex items-center gap-6 mt-6 flex-wrap">
              {[
                { bg: 'color-mix(in srgb, var(--l-indigo-glow) 30%, transparent)', border: 'var(--l-border-on-dark)', label: 'Заброньовано' },
                { bg: 'var(--l-slot-booked)', border: 'color-mix(in srgb, var(--l-indigo-glow) 60%, transparent)', label: 'Smart / Flash слот' },
                { bg: 'var(--l-surface-on-dark)', border: 'var(--l-border-on-dark)', label: 'Вільно' },
              ].map((l, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div
                    style={{
                      width: 14, height: 14, borderRadius: 4,
                      background: l.bg,
                      border: `1px solid ${l.border}`,
                      flexShrink: 0,
                    }}
                    aria-hidden="true"
                  />
                  <span style={{ fontSize: 11, color: 'var(--l-muted-on-dark)' }}>{l.label}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
