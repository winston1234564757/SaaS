'use client';

import { useRef } from 'react';
import {
  motion,
  useInView,
  useTransform,
  useScroll,
} from 'framer-motion';
import { useIsDesktop } from '@/lib/hooks/useIsDesktop';
import { LandingSplitHeading } from '@/components/landing/LandingSplitHeading';
import { CountUp } from '@/components/landing/shared/CountUp';

const spring = { type: 'spring', stiffness: 240, damping: 26 } as const;
const easeOut: [number, number, number, number] = [0.22, 1, 0.36, 1];


const DAYS = ['РџРЅ', 'Р’С‚', 'РЎСЂ', 'Р§С‚', 'РџС‚', 'РЎР±'];
const TIMES = ['09:00', '10:30', '12:00', '13:30', '15:00', '16:30', '18:00'];

const SLOTS: Record<string, { status: 'booked' | 'smart' | 'free'; label?: string }> = {
  'РџРЅ-09:00': { status: 'booked' },
  'РџРЅ-10:30': { status: 'booked' },
  'РџРЅ-12:00': { status: 'smart', label: 'Flash' },
  'РџРЅ-15:00': { status: 'booked' },
  'РџРЅ-16:30': { status: 'booked' },
  'РџРЅ-18:00': { status: 'booked' },
  'Р’С‚-09:00': { status: 'booked' },
  'Р’С‚-10:30': { status: 'smart', label: 'Smart' },
  'Р’С‚-13:30': { status: 'booked' },
  'Р’С‚-15:00': { status: 'booked' },
  'Р’С‚-16:30': { status: 'booked' },
  'РЎСЂ-09:00': { status: 'booked' },
  'РЎСЂ-12:00': { status: 'booked' },
  'РЎСЂ-13:30': { status: 'smart', label: 'Smart' },
  'РЎСЂ-15:00': { status: 'booked' },
  'РЎСЂ-18:00': { status: 'booked' },
  'Р§С‚-09:00': { status: 'booked' },
  'Р§С‚-10:30': { status: 'booked' },
  'Р§С‚-15:00': { status: 'booked' },
  'Р§С‚-16:30': { status: 'smart', label: 'Smart' },
  'РџС‚-09:00': { status: 'booked' },
  'РџС‚-12:00': { status: 'booked' },
  'РџС‚-13:30': { status: 'booked' },
  'РџС‚-16:30': { status: 'booked' },
  'РџС‚-18:00': { status: 'booked' },
  'РЎР±-09:00': { status: 'booked' },
  'РЎР±-10:30': { status: 'booked' },
  'РЎР±-12:00': { status: 'smart', label: 'Smart' },
  'РЎР±-13:30': { status: 'booked' },
  'РЎР±-15:00': { status: 'booked' },
};

type MetricItem =
  | { type: 'count'; to: number; suffix: string; label: string }
  | { type: 'static'; text: string; label: string };

const METRICS: MetricItem[] = [
  { type: 'count', to: 32, suffix: '%', label: 'Р±С–Р»СЊС€Рµ РґРѕС…РѕРґСѓ РІ СЃРµСЂРµРґРЅСЊРѕРјСѓ' },
  { type: 'static', text: '0', label: 'РїРѕСЂРѕР¶РЅС–С… РІС–РєРѕРЅ С‚РёР¶РЅСЏРјРё' },
  { type: 'count', to: 10, suffix: '', label: 'С…РІРёР»РёРЅ вЂ” С– СЃРєР°СЃСѓРІР°РЅРЅСЏ Р·Р°РєСЂРёС‚Рµ' },
];

export function LandingBentoFeatures() {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });
  const isDesktop = useIsDesktop();
  const headingYDesktop = useTransform(scrollYProgress, [0, 1], ['0%', '-14%']);
  const headingYMobile = useTransform(scrollYProgress, [0, 1], ['0%', '-4%']);
  const headingY = isDesktop ? headingYDesktop : headingYMobile;

  return (
    <section
      ref={ref}
      className="py-20 sm:py-36 px-4 sm:px-6 lg:px-12"
      style={{ background: 'var(--l-bg-dark)' }}
    >
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mb-20">
          <motion.div style={{ y: headingY }}>
            <motion.span
              initial={{ opacity: 0, y: 12, filter: 'blur(8px)' }}
              animate={inView ? { opacity: 1, y: 0, filter: 'blur(0px)' } : {}}
              transition={{ ...spring, delay: 0.05 }}
              className="inline-block text-[11px] font-semibold uppercase tracking-[0.18em] mb-5"
              style={{ color: 'color-mix(in srgb, var(--l-indigo-glow) 70%, transparent)' }}
            >
              Smart Slots
            </motion.span>
            <LandingSplitHeading
              text={"Р РѕР·РєР»Р°Рґ\nР±РµР· РїСЂРѕРіР°Р»РёРЅ."}
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
              РђР»РіРѕСЂРёС‚Рј Р±Р°С‡РёС‚СЊ С‚РІС–Р№ С‚РёР¶РґРµРЅСЊ С– Р·Р°РїРѕРІРЅСЋС” Р№РѕРіРѕ СЂС–РІРЅРѕРјС–СЂРЅРѕ. РҐС‚РѕСЃСЊ СЃРєР°СЃСѓРІР°РІ? Р¤Р»РµС€-Р°РєС†С–СЏ Р·РЅР°С…РѕРґРёС‚СЊ Р·Р°РјС–РЅСѓ Р·Р° С…РІРёР»РёРЅРё.
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
                background: 'var(--l-surface-on-dark)',
                border: '1px solid var(--l-border-on-dark)',
              }}
            >
              <span
                className="font-[family-name:var(--font-cormorant)] font-semibold"
                style={{ fontSize: '1.6rem', color: 'var(--l-text-on-dark)' }}
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
                style={{ color: 'var(--l-muted-on-dark)' }}
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
            background: 'var(--l-surface-on-dark)',
            border: '1px solid var(--l-border-on-dark)',
          }}
          aria-label="РџСЂРёРєР»Р°Рґ СЂРѕР·РєР»Р°РґСѓ Smart Slots"
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
                      style={{ color: 'var(--l-muted-2-on-dark)' }}
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
                      style={{ color: 'var(--l-muted-2-on-dark)', paddingBottom: 3 }}
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
                                ? 'var(--l-indigo)'
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
                  { bg: 'color-mix(in srgb, var(--l-indigo-glow) 30%, transparent)', border: 'var(--l-border-on-dark)', label: 'Р—Р°Р±СЂРѕРЅСЊРѕРІР°РЅРѕ' },
                { bg: 'var(--l-indigo)', border: 'color-mix(in srgb, var(--l-indigo-glow) 60%, transparent)', label: 'Smart / Flash СЃР»РѕС‚' },
                { bg: 'var(--l-surface-on-dark)', border: 'var(--l-border-on-dark)', label: 'Р’С–Р»СЊРЅРѕ' },
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
                  <span style={{ fontSize: 11, color: 'var(--l-muted-2-on-dark)' }}>{l.label}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
