'use client';

import { useState, useRef } from 'react';
import { motion, useInView, useScroll, useTransform } from 'framer-motion';
import { useIsDesktop } from '@/lib/hooks/useIsDesktop';
import { formatCurrency } from '@/lib/utils/currency';
import { WordLine } from '@/components/landing/shared/WordLine';

const spring = { type: 'spring', stiffness: 240, damping: 26 } as const;
const easeOut: [number, number, number, number] = [0.22, 1, 0.36, 1];


export function LandingEconomy() {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });

  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const isDesktop = useIsDesktop();
  const headingYDesktop = useTransform(scrollYProgress, [0, 1], ['0%', '-14%']);
  const headingYMobile = useTransform(scrollYProgress, [0, 1], ['0%', '-4%']);
  const headingY = isDesktop ? headingYDesktop : headingYMobile;

  const [clients, setClients] = useState(5);
  const [avgPrice, setAvgPrice] = useState(600);
  const [workDays, setWorkDays] = useState(22);

  const monthlyRaw    = clients * avgPrice * workDays;
  const monthlyBookit = Math.round(monthlyRaw * 1.32);
  const yearlyBookit  = monthlyBookit * 12;
  const gain          = monthlyBookit - monthlyRaw;

  return (
    <section
      ref={ref}
      className="py-20 sm:py-36 px-4 sm:px-6 lg:px-12"
      style={{ background: 'var(--l-bg-alt)' }}
    >
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-start">

          {/* Left: copy */}
          <motion.div style={{ y: headingY }}>
            <motion.span
              initial={{ opacity: 0, y: 12, filter: 'blur(8px)' }}
              animate={inView ? { opacity: 1, y: 0, filter: 'blur(0px)' } : {}}
              transition={{ ...spring, delay: 0.05 }}
              className="inline-block text-[11px] font-semibold uppercase tracking-[0.15em] mb-5"
              style={{ color: 'var(--l-indigo)' }}
            >
              РљР°Р»СЊРєСѓР»СЏС‚РѕСЂ РґРѕС…РѕРґСѓ
            </motion.span>

            {/* Word-by-word heading: 3 lines, last line accent-colored */}
            <h2
              className="font-[family-name:var(--font-cormorant)] font-semibold leading-[0.95] tracking-tight"
              style={{ fontSize: 'clamp(2.2rem,4.5vw,3.8rem)', color: 'var(--l-ink)' }}
            >
              <WordLine words={['РџРѕСЂР°С…СѓР№,']} lineIndex={0} inView={inView} />
              <WordLine words={['СЃРєС–Р»СЊРєРё', 'С‚Рё']} lineIndex={1} inView={inView} />
              <WordLine
                words={['Р·Р°Р»РёС€Р°С”С€', 'РЅР°', 'СЃС‚РѕР»С–.']}
                lineIndex={2}
                inView={inView}
                style={{ color: 'var(--l-accent)', fontStyle: 'normal' }}
              />
            </h2>

            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ ...spring, delay: 0.68 }}
              className="mt-5 text-base leading-relaxed max-w-sm"
              style={{ color: 'var(--l-muted)' }}
            >
              Р' СЃРµСЂРµРґРЅСЊРѕРјСѓ РјР°Р№СЃС‚СЂРё Р· Bookit Р·Р°СЂРѕР±Р»СЏСЋС‚СЊ РґРѕ 32% Р±С–Р»СЊС€Рµ Р·Р° СЂР°С…СѓРЅРѕРє Р·Р°РїРѕРІРЅРµРЅРёС… РІС–РєРѕРЅ С– РїРѕРІРµСЂРЅСѓС‚РёС… РєР»С–С”РЅС‚С–РІ.
            </motion.p>

            {/* Result display */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ ...spring, delay: 0.76 }}
              className="mt-10 p-6 rounded-[1.5rem]"
              style={{
                background: 'var(--l-surface)',
                border: '1px solid var(--l-border)',
                boxShadow: '0 8px 32px rgba(26,23,16,0.06)',
              }}
            >
              <div className="flex flex-col gap-4">
                <div className="flex items-end justify-between gap-4">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-widest mb-1" style={{ color: 'var(--l-muted-2)' }}>
                      Р—Р°СЂР°Р·
                    </p>
                    <p
                      className="font-[family-name:var(--font-cormorant)] font-semibold leading-none"
                      style={{ fontSize: 'clamp(1.8rem,3vw,2.4rem)', color: 'var(--l-ink)' }}
                    >
                      {formatCurrency(monthlyRaw)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[11px] font-semibold uppercase tracking-widest mb-1" style={{ color: 'var(--l-muted-2)' }}>
                      Р— Bookit
                    </p>
                    <p
                      className="font-[family-name:var(--font-cormorant)] font-semibold leading-none"
                      style={{ fontSize: 'clamp(1.8rem,3vw,2.4rem)', color: 'var(--l-accent)' }}
                    >
                      {formatCurrency(monthlyBookit)}
                    </p>
                  </div>
                </div>

                <div className="h-px w-full" style={{ background: 'var(--l-border)' }} aria-hidden="true" />

                <div className="flex items-center justify-between">
                  <p className="text-sm" style={{ color: 'var(--l-muted)' }}>
                    Р”РѕРґР°С‚РєРѕРІРёР№ РґРѕС…С–Рґ РЅР° РјС–СЃСЏС†СЊ
                  </p>
                  <p className="text-lg font-bold" style={{ color: 'var(--l-accent)' }}>
                    +{formatCurrency(gain)}
                  </p>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-sm" style={{ color: 'var(--l-muted)' }}>РќР° СЂС–Рє</p>
                  <p className="text-lg font-bold" style={{ color: 'var(--l-ink)' }}>
                    {formatCurrency(yearlyBookit)}
                  </p>
                </div>
              </div>
            </motion.div>
          </motion.div>

          {/* Right: sliders */}
          <motion.div
            initial={{ opacity: 0, x: 32 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.9, ease: easeOut, delay: 0.22 }}
            className="flex flex-col gap-10 lg:pt-24"
          >
            <Slider
              label="РљР»С–С”РЅС‚С–РІ РЅР° РґРµРЅСЊ"
              value={clients}
              min={1} max={15} step={1}
              format={(v) => `${v}`}
              onChange={setClients}
            />
            <Slider
              label="РЎРµСЂРµРґРЅСЏ РІР°СЂС‚С–СЃС‚СЊ РїРѕСЃР»СѓРіРё"
              value={avgPrice}
              min={200} max={2000} step={50}
              format={(v) => `${v} в‚ґ`}
              onChange={setAvgPrice}
            />
            <Slider
              label="Р РѕР±РѕС‡РёС… РґРЅС–РІ РЅР° РјС–СЃСЏС†СЊ"
              value={workDays}
              min={10} max={30} step={1}
              format={(v) => `${v}`}
              onChange={setWorkDays}
            />
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function Slider({
  label, value, min, max, step, format, onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  format: (v: number) => string;
  onChange: (v: number) => void;
}) {
  const clampedValue = Math.min(Math.max(value, min), max);
  const pct = max > min ? ((clampedValue - min) / (max - min)) * 100 : 0;

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <label className="text-sm font-medium" style={{ color: 'var(--l-ink)' }}>
          {label}
        </label>
        <span
          className="font-[family-name:var(--font-cormorant)] text-xl font-semibold"
          style={{ color: 'var(--l-accent)' }}
        >
          {format(clampedValue)}
        </span>
      </div>
      <div className="relative flex items-center" style={{ height: 40 }}>
        <div
          className="absolute left-0 right-0 h-1.5 rounded-full"
          style={{ background: 'var(--l-border)' }}
          aria-hidden="true"
        >
          <div
            className="absolute inset-y-0 left-0 rounded-full"
            style={{ width: `${pct}%`, background: 'var(--l-accent)' }}
          />
        </div>
        <div
          className="absolute size-4 rounded-full pointer-events-none transition-transform active:scale-110"
          style={{
            left: `calc(${pct}% - 8px)`,
            background: 'var(--l-surface)',
            border: '2px solid var(--l-accent)',
            outline: '2px solid var(--l-accent)',
            outlineOffset: '1px',
            boxShadow: '0 2px 8px rgba(99,102,241,0.25)',
          }}
          aria-hidden="true"
        />
        <input
          type="range"
          min={min} max={max} step={step} value={clampedValue}
          onChange={(e) => onChange(Number(e.target.value))}
          className="absolute inset-0 w-full opacity-0 cursor-pointer"
          style={{ height: '100%' }}
          aria-label={label}
          aria-valuenow={clampedValue}
          aria-valuemin={min}
          aria-valuemax={max}
        />
      </div>
    </div>
  );
}
