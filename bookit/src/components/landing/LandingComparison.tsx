'use client';

import { useRef } from 'react';
import { motion, useInView, useScroll, useTransform } from 'framer-motion';
import { useIsDesktop } from '@/lib/hooks/useIsDesktop';
import { X, Check } from 'lucide-react';
import { LandingSplitHeading } from '@/components/landing/LandingSplitHeading';

const spring = { type: 'spring', stiffness: 240, damping: 26 } as const;
const easeOut: [number, number, number, number] = [0.22, 1, 0.36, 1];

const ROWS = [
  {
    before: 'Р—Р°РїРёСЃСѓС”С€ Сѓ Direct С– РіСѓР±РёС€ Сѓ РїРµСЂРµРїРёСЃС†С–',
    after: 'РљР»С–С”РЅС‚ Р·Р°РїРёСЃСѓС”С‚СЊСЃСЏ СЃР°Рј Р·Р° РїРѕСЃРёР»Р°РЅРЅСЏРј',
  },
  {
    before: 'РЎРєР°СЃСѓРІР°РЅРЅСЏ вЂ” РіРѕРґРёРЅСѓ С€СѓРєР°С”С€ Р·Р°РјС–РЅСѓ',
    after: 'Р¤Р»РµС€-Р°РєС†С–СЏ Р·Р°РєСЂРёРІР°С” РІС–РєРЅРѕ Р·Р° 10 С…РІРёР»РёРЅ',
  },
  {
    before: 'РљР»С–С”РЅС‚ Р·РЅРёРє РїС–СЃР»СЏ РїРµСЂС€РѕРіРѕ СЂР°Р·Сѓ вЂ” РЅР°Р·Р°РІР¶РґРё',
    after: 'РќР°РіР°РґСѓРІР°РЅРЅСЏ РїРѕРІРµСЂС‚Р°С” РєР»С–С”РЅС‚Р° РІ РїРѕС‚СЂС–Р±РЅРёР№ РјРѕРјРµРЅС‚',
  },
  {
    before: 'Р’РёСЂСѓС‡РєР° вЂ” С‰РѕСЃСЊ РјС–Р¶ 8 С– 12 С‚РёСЃСЏС‡Р°РјРё',
    after: 'РўРѕС‡РЅР° Р°РЅР°Р»С–С‚РёРєР° Р·Р° РґРµРЅСЊ, С‚РёР¶РґРµРЅСЊ, РјС–СЃСЏС†СЊ',
  },
  {
    before: 'РќРѕРІС– РєР»С–С”РЅС‚Рё С‚С–Р»СЊРєРё РїРѕ Р·РЅР°Р№РѕРјСЃС‚РІСѓ',
    after: 'РџСѓР±Р»С–С‡РЅР° СЃС‚РѕСЂС–РЅРєР° Р·РЅР°С…РѕРґРёС‚СЊ С‚РµР±Рµ РІ Google',
  },
];

export function LandingComparison() {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });

  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const isDesktop = useIsDesktop();
  const headingYDesktop = useTransform(scrollYProgress, [0, 1], ['0%', '-14%']);
  const headingYMobile = useTransform(scrollYProgress, [0, 1], ['0%', '-4%']);
  const headingY = isDesktop ? headingYDesktop : headingYMobile;

  return (
    <section
      ref={ref}
      className="py-20 sm:py-36 px-4 sm:px-6 lg:px-12"
      style={{ background: 'var(--l-surface)' }}
    >
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <motion.div className="mb-16 max-w-2xl" style={{ y: headingY }}>
          <motion.span
            initial={{ opacity: 0, y: 12, filter: 'blur(8px)' }}
            animate={inView ? { opacity: 1, y: 0, filter: 'blur(0px)' } : {}}
            transition={{ ...spring, delay: 0.05 }}
            className="inline-block text-[11px] font-semibold uppercase tracking-[0.18em] mb-5"
            style={{ color: 'var(--l-indigo)' }}
          >
            РџРѕСЂС–РІРЅСЏРЅРЅСЏ
          </motion.span>
          <LandingSplitHeading
            text={"РЇРє РІРёРіР»СЏРґР°С”\nСЂС–Р·РЅРёС†СЏ."}
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
            Р‘РµР· Bookit
          </p>
          <p
            className="text-[11px] font-semibold uppercase tracking-[0.15em]"
            style={{ color: 'var(--l-indigo)' }}
          >
            Р— Bookit
          </p>
        </motion.div>

        {/* Comparison rows */}
        <div style={{ borderTop: '1px solid var(--l-border)' }}>
          {ROWS.map((row, i) => (
            <div
              key={i}
              className="grid grid-cols-2 gap-4 py-5 px-4"
              style={{ borderBottom: '1px solid var(--l-border)' }}
            >
              {/* Before вЂ” slides from left, reinforces "without Bookit" narrative */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={inView ? { opacity: 1, x: 0 } : {}}
                transition={{ duration: 0.8, ease: easeOut, delay: 0.24 + i * 0.08 }}
                className="flex items-start gap-3"
              >
                <div
                  className="size-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                  style={{ background: 'color-mix(in srgb, var(--l-muted-2) 12%, transparent)' }}
                  aria-hidden="true"
                >
                  <X size={10} style={{ color: 'var(--l-muted-2)' }} />
                </div>
                <p className="text-sm leading-snug" style={{ color: 'var(--l-muted)' }}>
                  {row.before}
                </p>
              </motion.div>

              {/* After вЂ” slides from right, reinforces "with Bookit" narrative */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={inView ? { opacity: 1, x: 0 } : {}}
                transition={{ duration: 0.8, ease: easeOut, delay: 0.30 + i * 0.08 }}
                className="flex items-start gap-3 px-4 py-3 rounded-xl"
                style={{ background: 'color-mix(in srgb, var(--l-indigo-glow) 6%, transparent)', border: '1px solid color-mix(in srgb, var(--l-indigo-glow) 12%, transparent)' }}
              >
                <div
                  className="size-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                  style={{ background: 'color-mix(in srgb, var(--l-indigo-glow) 18%, transparent)' }}
                  aria-hidden="true"
                >
                  <Check size={10} style={{ color: 'var(--l-indigo)' }} />
                </div>
                <p className="text-sm font-semibold leading-snug" style={{ color: 'var(--l-ink)' }}>
                  {row.after}
                </p>
              </motion.div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
