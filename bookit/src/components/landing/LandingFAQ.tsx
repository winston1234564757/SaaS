'use client';

import { useRef, useState } from 'react';
import { motion, useInView, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import { useIsDesktop } from '@/lib/hooks/useIsDesktop';
import { Plus } from 'lucide-react';
import { LandingSplitHeading } from '@/components/landing/LandingSplitHeading';

const spring = { type: 'spring', stiffness: 240, damping: 26 } as const;
const easeOut: [number, number, number, number] = [0.22, 1, 0.36, 1];

const FAQS = [
  {
    q: 'РЎРєС–Р»СЊРєРё С‡Р°СЃСѓ Р·Р°Р№РјР°С” РЅР°Р»Р°С€С‚СѓРІР°РЅРЅСЏ?',
    a: 'Р—Р°Р·РІРёС‡Р°Р№ РІС–Рґ 15 РґРѕ 40 С…РІРёР»РёРЅ. Р РµС”СЃС‚СЂР°С†С–СЏ, РґРѕРґР°РІР°РЅРЅСЏ РїРѕСЃР»СѓРі С– РїРµСЂС€РѕРіРѕ СЂРѕР·РєР»Р°РґСѓ вЂ” С†Рµ РІСЃРµ С‰Рѕ РїРѕС‚СЂС–Р±РЅРѕ РґР»СЏ СЃС‚Р°СЂС‚Сѓ. Р РµС€С‚Сѓ РјРѕР¶РЅР° РЅР°Р»Р°С€С‚СѓРІР°С‚Рё РїС–Р·РЅС–С€Рµ.',
  },
  {
    q: 'РњРµРЅС– РїРѕС‚СЂС–Р±РµРЅ РѕРєСЂРµРјРёР№ СЃР°Р№С‚ Р°Р±Рѕ РґРѕРґР°С‚РѕРє?',
    a: 'РќС–. Bookit РґР°С” РІР°Рј РїСѓР±Р»С–С‡РЅСѓ СЃС‚РѕСЂС–РЅРєСѓ Р·Р° РїРѕСЃРёР»Р°РЅРЅСЏРј С‚РёРїСѓ bookit.ua/anna вЂ” С†Рµ РІР°С€ link in bio, СЃС‚РѕСЂС–РЅРєР° Р·Р°РїРёСЃСѓ С– РјС–РЅС–РјР°РіР°Р·РёРЅ РІ РѕРґРЅРѕРјСѓ РјС–СЃС†С–.',
  },
  {
    q: 'РЇРє РєР»С–С”РЅС‚Рё Р·Р°РїРёСЃСѓСЋС‚СЊСЃСЏ?',
    a: 'Р’РѕРЅРё РїРµСЂРµС…РѕРґСЏС‚СЊ Р·Р° РІР°С€РёРј РїРѕСЃРёР»Р°РЅРЅСЏРј, РѕР±РёСЂР°СЋС‚СЊ РїРѕСЃР»СѓРіСѓ С– С‡Р°СЃ, РІРІРѕРґСЏС‚СЊ РЅРѕРјРµСЂ С‚РµР»РµС„РѕРЅСѓ (OTP) С– РѕС‚СЂРёРјСѓСЋС‚СЊ РїС–РґС‚РІРµСЂРґР¶РµРЅРЅСЏ РІ SMS. Р РµС”СЃС‚СЂР°С†С–СЏ РЅРµ РїРѕС‚СЂС–Р±РЅР°.',
  },
  {
    q: 'Р©Рѕ С‚Р°РєРµ Smart Slots?',
    a: 'РђР»РіРѕСЂРёС‚Рј Р°РЅР°Р»С–Р·СѓС” РІР°С€ СЂРѕР·РєР»Р°Рґ С– Р°РІС‚РѕРјР°С‚РёС‡РЅРѕ РїСЂРѕРїРѕРЅСѓС” РєР»С–С”РЅС‚Р°Рј С‡Р°СЃ, СЏРєРёР№ РІРёРіС–РґРЅРёР№ РІР°Рј вЂ” Р±РµР· РґС–СЂРѕРє С– Р·Р°Р№РІРёС… РїР°СѓР· РјС–Р¶ Р·Р°РїРёСЃР°РјРё.',
  },
  {
    q: 'Р§Рё РјРѕР¶Сѓ СЏ СЃРєР°СЃСѓРІР°С‚Рё РїС–РґРїРёСЃРєСѓ?',
    a: 'РўР°Рє, РІ Р±СѓРґСЊ-СЏРєРёР№ РјРѕРјРµРЅС‚ С‡РµСЂРµР· РЅР°Р»Р°С€С‚СѓРІР°РЅРЅСЏ. Р–РѕРґРЅРёС… С€С‚СЂР°С„С–РІ С– РїСЂРёС…РѕРІР°РЅРёС… СѓРјРѕРІ. Р’Р°С€С– РґР°РЅС– Р·Р°Р»РёС€Р°СЋС‚СЊСЃСЏ Сѓ РІР°СЃ.',
  },
  {
    q: 'Р„ РїС–РґС‚СЂРёРјРєР° РґР»СЏ РїРѕС‡Р°С‚РєС–РІС†С–РІ?',
    a: 'РўР°Рє. Р’ С‡Р°С‚С– Telegram С– Р·Р° email. РќР° Pro-РїР»Р°РЅС– вЂ” РїСЂС–РѕСЂРёС‚РµС‚РЅР° РІС–РґРїРѕРІС–РґСЊ РїСЂРѕС‚СЏРіРѕРј 2 РіРѕРґРёРЅ.',
  },
];

function FAQItem({ item, index, inView }: { item: typeof FAQS[0]; index: number; inView: boolean }) {
  const [open, setOpen] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.9, ease: easeOut, delay: 0.08 + index * 0.07 }}
      style={{ borderBottom: '1px solid var(--l-border)' }}
    >
      <button type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-6 py-6 text-left transition-opacity hover:opacity-80"
        aria-expanded={open}
      >
        <span className="text-base font-semibold leading-snug" style={{ color: 'var(--l-ink)' }}>
          {item.q}
        </span>
        <span
          className="size-8 rounded-full flex items-center justify-center flex-shrink-0"
          style={{
            background: open ? 'var(--l-accent)' : 'var(--l-surface-2)',
            border: '1px solid var(--l-border)',
            transform: open ? 'rotate(45deg)' : 'rotate(0deg)',
            color: open ? '#FDFAF5' : 'var(--l-ink)',
            transition: 'transform 220ms ease-out, background 220ms ease-out, color 220ms ease-out',
          }}
          aria-hidden="true"
        >
          <Plus size={14} />
        </span>
      </button>

      <AnimatePresence mode="popLayout" initial={false}>
        {open && (
          <motion.div
            key="answer"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.32, 0.72, 0, 1] }}
            style={{ overflow: 'hidden' }}
          >
            <p className="pb-6 text-base leading-relaxed" style={{ color: 'var(--l-muted)' }}>
              {item.a}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export function LandingFAQ() {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });

  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const isDesktop = useIsDesktop();
  const headingYDesktop = useTransform(scrollYProgress, [0, 1], ['0%', '-8%']);
  const headingYMobile = useTransform(scrollYProgress, [0, 1], ['0%', '-2%']);
  const headingY = isDesktop ? headingYDesktop : headingYMobile;

  return (
    <section id="faq" ref={ref} className="py-20 sm:py-36 px-4 sm:px-6 lg:px-12">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.6fr] gap-16 lg:gap-24">

          <div className="lg:sticky lg:top-32 self-start">
            <motion.div style={{ y: headingY }}>
              <motion.span
                initial={{ opacity: 0, y: 12, filter: 'blur(8px)' }}
                animate={inView ? { opacity: 1, y: 0, filter: 'blur(0px)' } : {}}
                transition={{ ...spring, delay: 0.05 }}
                className="inline-block text-[11px] font-semibold uppercase tracking-[0.15em] mb-5"
                style={{ color: 'var(--l-indigo)' }}
              >
                Р—Р°РїРёС‚Р°РЅРЅСЏ
              </motion.span>
              <LandingSplitHeading
                text={"Р§Р°СЃС‚С–\nР·Р°РїРёС‚Р°РЅРЅСЏ."}
                className="font-[family-name:var(--font-cormorant)] font-semibold leading-[0.95] tracking-tight"
                style={{ fontSize: 'clamp(2.2rem,4vw,3.6rem)', color: 'var(--l-ink)' }}
                stagger={80}
                lineDelay={220}
              />
            </motion.div>
          </div>

          <div style={{ borderTop: '1px solid var(--l-border)' }}>
            {FAQS.map((item, i) => (
              <FAQItem key={i} item={item} index={i} inView={inView} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
