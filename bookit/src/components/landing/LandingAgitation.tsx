'use client';

import { Fragment, useRef } from 'react';
import { motion, useInView, useScroll, useTransform } from 'framer-motion';
import { useIsDesktop } from '@/lib/hooks/useIsDesktop';
import { LandingSplitHeading } from '@/components/landing/LandingSplitHeading';

const spring = { type: 'spring', stiffness: 240, damping: 26 } as const;
const easeOut: [number, number, number, number] = [0.22, 1, 0.36, 1];

const PAINS = [
  {
    no: '01',
    title: 'Р—Р°РїРёСЃСѓС”С€ Сѓ Direct, РїРѕС‚С–Рј Р·Р°Р±СѓРІР°С”С€',
    body: 'РџРµСЂРµРїРёСЃРєР° СЂРѕР·РїРѕСЂРѕС€РµРЅР° РјС–Р¶ Instagram, Viber С– Telegram. РџСЂРѕ СЃРєР°СЃСѓРІР°РЅРЅСЏ РґС–Р·РЅР°С”С€СЃСЏ Рѕ 22:00.',
  },
  {
    no: '02',
    title: 'РџРѕСЂРѕР¶РЅС– РІС–РєРЅР° вЂ” С– РЅС–С…С‚Рѕ С—С… РЅРµ Р·Р°РїРѕРІРЅРёС‚СЊ',
    body: 'РљР»С–С”РЅС‚ РІС–РґРјС–РЅРёРІ Р·Р°РїРёСЃ, Р° С‚Рё РіРѕРґРёРЅСѓ С€СѓРєР°С”С€ Р·Р°РјС–РЅСѓ РїРѕ С‡Р°С‚Р°С…. Р“СЂРѕС€С– РїСЂРѕСЃС‚Рѕ Р·РЅРёРєР»Рё.',
  },
  {
    no: '03',
    title: 'Р‘РµР· СЃС‚РѕСЂС–РЅРєРё РЅРµРјР°С” РґРѕРІС–СЂРё',
    body: 'РљР»С–С”РЅС‚ С…РѕС‡Рµ РїРѕР±Р°С‡РёС‚Рё С†С–РЅРё Р№ РїРѕСЂС‚С„РѕР»С–Рѕ РґРѕ РґР·РІС–РЅРєР°. РЇРєС‰Рѕ РЅРµ Р·РЅР°Р№РґРµ вЂ” РїСЂРѕСЃС‚Рѕ С–РґРµ.',
  },
  {
    no: '04',
    title: 'РћР±Р»С–Рє "РЅР° РїР°Р»СЊС†СЏС…" вЂ” Р¶РѕРґРЅРѕС— РєР°СЂС‚РёРЅРё',
    body: 'РЎРєС–Р»СЊРєРё Р·Р°СЂРѕР±РёР»Р° С†СЊРѕРіРѕ РјС–СЃСЏС†СЏ? РЇРєР° РїРѕСЃР»СѓРіР° РЅР°Р№РІРёРіС–РґРЅС–С€Р°? Р¦С– С†РёС„СЂРё РЅС–РєСѓРґРё РЅРµ Р·Р°РїРёСЃР°РЅС–.',
  },
];

// Split body into sentences keeping punctuation
function splitSentences(text: string): string[] {
  return text.split(/(?<=[.?!]) /).filter(Boolean);
}

function PainItem({ item }: { item: typeof PAINS[0] }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });
  const sentences = splitSentences(item.body);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 32, scale: 0.97 }}
      animate={inView ? { opacity: 1, y: 0, scale: 1 } : {}}
      transition={{ duration: 0.65, ease: easeOut }}
      className="flex items-start gap-7 p-7 rounded-[1.25rem]"
      style={{
        background: 'var(--l-surface, rgba(248,250,252,0.65))',
        border: '1px solid var(--l-border)',
        boxShadow: '0 2px 20px rgba(15,23,42,0.04), 0 1px 4px rgba(15,23,42,0.02)',
      }}
    >
      {/* Number */}
      <motion.span
        initial={{ opacity: 0, y: 14 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.9, ease: easeOut, delay: 0.04 }}
        className="font-[family-name:var(--font-cormorant)] font-semibold leading-none select-none flex-shrink-0 pt-0.5"
        style={{ fontSize: 'clamp(2.2rem, 3.5vw, 3.2rem)', color: 'var(--l-border-2)' }}
        aria-hidden="true"
      >
        {item.no}
      </motion.span>

      <div className="flex-1 min-w-0">
        {/* Word-by-word h3 вЂ” title and body start simultaneously */}
        <h3 className="font-semibold leading-snug mb-3" style={{ fontSize: '1.1rem', color: 'var(--l-ink)' }}>
          {item.title.split(' ').map((word, wi, arr) => (
            <span
              key={wi}
              style={{
                display: 'inline-block',
                overflow: 'hidden',
                verticalAlign: 'bottom',
                lineHeight: 'inherit',
                marginRight: wi < arr.length - 1 ? '0.28em' : 0,
              }}
            >
              <motion.span
                style={{ display: 'inline-block' }}
                initial={{ y: '110%' }}
                animate={inView ? { y: 0 } : {}}
                transition={{ duration: 0.85, ease: easeOut, delay: 0.08 + wi * 0.065 }}
              >
                {word}
              </motion.span>
            </span>
          ))}
        </h3>

        {/* Sentence-by-sentence body вЂ” starts at same base delay as title first word */}
        <p className="text-[0.9rem] leading-relaxed" style={{ color: 'var(--l-muted)' }}>
          {sentences.map((sentence, si, arr) => (
            <Fragment key={si}>
              <span style={{ display: 'inline-block', overflow: 'hidden', verticalAlign: 'bottom' }}>
                <motion.span
                  style={{ display: 'inline-block' }}
                  initial={{ y: '115%', opacity: 0 }}
                  animate={inView ? { y: 0, opacity: 1 } : {}}
                  transition={{ duration: 0.85, ease: easeOut, delay: 0.08 + si * 0.16 }}
                >
                  {sentence}
                </motion.span>
              </span>
              {si < arr.length - 1 ? ' ' : ''}
            </Fragment>
          ))}
        </p>
      </div>
    </motion.div>
  );
}

export function LandingAgitation() {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });
  const isDesktop = useIsDesktop();
  const headingYDesktop = useTransform(scrollYProgress, [0, 1], ['0%', '-8%']);
  const headingYMobile = useTransform(scrollYProgress, [0, 1], ['0%', '-2%']);
  const headingY = isDesktop ? headingYDesktop : headingYMobile;

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
          background: 'radial-gradient(circle, rgba(99,102,241,0.055) 0%, transparent 70%)',
          top: '-12%',
          right: '-6%',
        }}
        aria-hidden="true"
      />

      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.6fr] gap-16 lg:gap-28 items-start">

          <div className="lg:sticky lg:top-36 self-start">
            <motion.div style={{ y: headingY }}>
              <motion.span
                initial={{ opacity: 0, y: 12, filter: 'blur(8px)' }}
                animate={inView ? { opacity: 1, y: 0, filter: 'blur(0px)' } : {}}
                transition={{ ...spring, delay: 0.05 }}
                className="inline-block text-[11px] font-semibold uppercase tracking-[0.18em] mb-6"
                style={{ color: 'var(--l-indigo)' }}
              >
                РџСЂРѕР±Р»РµРјР°
              </motion.span>
              <LandingSplitHeading
                text={"Р—РІРёРєР»Р°\nРґРѕ С…Р°РѕСЃСѓ?"}
                className="font-[family-name:var(--font-cormorant)] font-semibold leading-[0.9] tracking-tight"
                style={{ fontSize: 'clamp(2.8rem, 5.5vw, 5rem)', color: 'var(--l-ink)' }}
                stagger={80}
                lineDelay={220}
              />
              <motion.p
                initial={{ opacity: 0, y: 16 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ ...spring, delay: 0.32 }}
                className="mt-5 text-base leading-relaxed"
                style={{ color: 'var(--l-muted)', maxWidth: 280 }}
              >
                Р‘С–Р»СЊС€С–СЃС‚СЊ РјР°Р№СЃС‚СЂС–РІ РІРёС‚СЂР°С‡Р°СЋС‚СЊ 2вЂ“3 РіРѕРґРёРЅРё С‰РѕРґРЅСЏ РЅРµ РЅР° СЂРѕР±РѕС‚Сѓ, Р° РЅР° С—С— РѕСЂРіР°РЅС–Р·Р°С†С–СЋ.
              </motion.p>
            </motion.div>
          </div>

          <div className="flex flex-col gap-4">
            {PAINS.map((p, i) => (
              <PainItem key={i} item={p} />
            ))}
          </div>

        </div>
      </div>
    </section>
  );
}
