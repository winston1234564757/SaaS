'use client';

import { useEffect, useRef, useState } from 'react';
import {
  motion,
  useInView,
  useMotionValue,
  useMotionValueEvent,
  useSpring,
  useTransform,
  useScroll,
} from 'framer-motion';
import { LandingSplitHeading } from '@/components/landing/LandingSplitHeading';

const spring = { type: 'spring', stiffness: 240, damping: 26 } as const;
const easeOut: [number, number, number, number] = [0.22, 1, 0.36, 1];

function CountUp({ to, suffix = '' }: { to: number; suffix?: string }) {
  const nodeRef = useRef<HTMLSpanElement>(null);
  const inView = useInView(nodeRef, { once: true, margin: '-40px' });
  const mv = useMotionValue(0);
  const sv = useSpring(mv, { stiffness: 60, damping: 14 });
  const [text, setText] = useState(`0${suffix}`);

  useMotionValueEvent(sv, 'change', (v) => setText(`${Math.round(v)}${suffix}`));

  useEffect(() => {
    if (inView) mv.set(to);
  }, [inView, mv, to]);

  return (
    <motion.span
      ref={nodeRef}
      initial={{ opacity: 0 }}
      animate={inView ? { opacity: 1 } : {}}
      transition={{ duration: 0.3, ease: 'easeOut' }}
    >
      {text}
    </motion.span>
  );
}

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

type MetricItem =
  | { type: 'count'; to: number; suffix: string; label: string }
  | { type: 'static'; text: string; label: string };

const METRICS: MetricItem[] = [
  { type: 'count', to: 32, suffix: '%', label: 'більше доходу в середньому' },
  { type: 'static', text: '0', label: 'порожніх вікон тижнями' },
  { type: 'count', to: 10, suffix: '', label: 'хвилин — і скасування закрите' },
];

export function LandingBentoFeatures() {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });
  const headingY = useTransform(scrollYProgress, [0, 1], ['4%', '-4%']);

  return (
    <section
      ref={ref}
      className="py-20 sm:py-36 px-4 sm:px-6 lg:px-12"
      style={{ background: '#0F172A' }}
    >
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mb-20">
          <motion.div style={{ y: headingY }}>
            <motion.span
              initial={{ opacity: 0, y: 12 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ ...spring, delay: 0.05 }}
              className="inline-block text-[11px] font-semibold uppercase tracking-[0.18em] mb-5"
              style={{ color: 'rgba(99,102,241,0.7)' }}
            >
              Smart Slots
            </motion.span>
            <LandingSplitHeading
              text={"Розклад\nбез прогалин."}
              className="font-[family-name:var(--font-cormorant)] font-semibold leading-[0.9] tracking-tight"
              style={{ fontSize: 'clamp(2.8rem, 6vw, 5.5rem)', color: '#F8FAFC' }}
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
              style={{ color: 'rgba(248,250,252,0.55)' }}
            >
              Алгоритм бачить твій тиждень і заповнює його рівномірно. Хтось скасував? Флеш-акція знаходить заміну за хвилини.
            </p>
          </motion.div>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-14">
          {METRICS.map((m, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 12, scale: 0.96 }}
              animate={inView ? { opacity: 1, y: 0, scale: 1 } : {}}
              transition={{ duration: 0.9, ease: easeOut, delay: 0.26 + i * 0.08 }}
              className="flex items-center gap-4 px-6 py-4 rounded-full"
              style={{
                background: 'rgba(248,250,252,0.06)',
                border: '1px solid rgba(248,250,252,0.10)',
              }}
            >
              <span
                className="font-[family-name:var(--font-cormorant)] font-semibold"
                style={{ fontSize: '1.6rem', color: '#F8FAFC' }}
              >
                {m.type === 'count' ? (
                  <CountUp to={m.to} suffix={m.suffix} />
                ) : (
                  <motion.span
                    initial={{ opacity: 0, filter: 'blur(6px)' }}
                    animate={inView ? { opacity: 1, filter: 'blur(0px)' } : {}}
                    transition={{ duration: 0.9, ease: easeOut, delay: 0.3 + i * 0.08 }}
                    style={{ display: 'inline-block' }}
                  >
                    {m.text}
                  </motion.span>
                )}
              </span>
              <span
                className="text-sm leading-snug max-w-[140px]"
                style={{ color: 'rgba(248,250,252,0.50)' }}
              >
                {m.label}
              </span>
            </motion.div>
          ))}
        </div>

        {/* Slot grid */}
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.97 }}
          animate={inView ? { opacity: 1, y: 0, scale: 1 } : {}}
          transition={{ duration: 0.9, ease: easeOut, delay: 0.36 }}
          className="rounded-[1.5rem] overflow-hidden"
          style={{
            background: 'rgba(248,250,252,0.04)',
            border: '1px solid rgba(248,250,252,0.08)',
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
                      style={{ color: 'rgba(248,250,252,0.35)' }}
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
                      style={{ color: 'rgba(248,250,252,0.25)', paddingBottom: 3 }}
                    >
                      {t}
                    </td>
                    {DAYS.map((d) => {
                      const key = `${d}-${t}`;
                      const slot = SLOTS[key];
                      return (
                        <td key={d} style={{ paddingBottom: 3 }}>
                          <div
                            style={{
                              height: 28,
                              borderRadius: 6,
                              background: slot?.status === 'booked'
                                ? 'rgba(99,102,241,0.30)'
                                : slot?.status === 'smart'
                                ? '#4338CA'
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
                              <span style={{ fontSize: 8, color: '#E0E7FF', fontWeight: 700 }}>
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
                { bg: 'rgba(99,102,241,0.30)', border: 'rgba(248,250,252,0.05)', label: 'Заброньовано' },
                { bg: '#4338CA', border: 'rgba(99,102,241,0.6)', label: 'Smart / Flash слот' },
                { bg: 'rgba(248,250,252,0.04)', border: 'rgba(248,250,252,0.05)', label: 'Вільно' },
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
                  <span style={{ fontSize: 11, color: 'rgba(248,250,252,0.40)' }}>{l.label}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
