'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence, useInView, useReducedMotion, useScroll, useTransform } from 'framer-motion';
import { useIsDesktop } from '@/lib/hooks/useIsDesktop';
import { formatCurrency } from '@/lib/utils/currency';
import { WordLine } from '@/components/landing/shared/WordLine';
import { LANDING_SPRING } from './shared/CountUp';

const easeOut: [number, number, number, number] = [0.22, 1, 0.36, 1];

export function LandingEconomy() {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  const shouldReduce = useReducedMotion();

  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const isDesktop = useIsDesktop();
  const headingYDesktop = useTransform(scrollYProgress, [0, 1], shouldReduce ? ['0%', '0%'] : ['0%', '-14%']);
  const headingYMobile = useTransform(scrollYProgress, [0, 1], shouldReduce ? ['0%', '0%'] : ['0%', '-4%']);
  const headingY = isDesktop ? headingYDesktop : headingYMobile;

  const [clients, setClients] = useState(5);
  const [avgPrice, setAvgPrice] = useState(600);
  const [workDays, setWorkDays] = useState(22);
  const [hasDemoed, setHasDemoed] = useState(false);

  const monthlyRaw = clients * avgPrice * workDays;
  const monthlyBookit = Math.round(monthlyRaw * 1.27);
  const yearlyBookit = monthlyBookit * 12;
  const gain = monthlyBookit - monthlyRaw;

  useEffect(() => {
    if (!inView || !isDesktop || shouldReduce || hasDemoed) return;
    setHasDemoed(true);
    const t1 = setTimeout(() => setClients(8), 700);
    const t2 = setTimeout(() => setAvgPrice(900), 1400);
    const t3 = setTimeout(() => setWorkDays(24), 2100);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [inView, isDesktop, shouldReduce, hasDemoed]);

  return (
    <section
      ref={ref}
      className="py-20 sm:py-36 px-4 sm:px-6 lg:px-12"
      style={{ background: 'var(--l-bg-alt)' }}
    >
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-start">

          <motion.div style={{ y: headingY }}>
            <motion.span
              initial={{ opacity: 0, y: 12, filter: 'blur(8px)' }}
              animate={inView ? { opacity: 1, y: 0, filter: 'blur(0px)' } : {}}
              transition={{ ...LANDING_SPRING, delay: 0.05 }}
              className="inline-block text-[11px] font-semibold uppercase tracking-[0.18em] mb-5"
              style={{ color: 'var(--l-indigo)' }}
            >
              Калькулятор доходу
            </motion.span>

            <h2
              className="font-[family-name:var(--font-cormorant)] font-semibold leading-[0.95] tracking-tight"
              style={{ fontSize: 'clamp(2.2rem,4.5vw,3.8rem)', color: 'var(--l-ink)' }}
            >
              <WordLine words={['Порахуй,']} lineIndex={0} inView={inView} />
              <WordLine words={['скільки', 'ти']} lineIndex={1} inView={inView} />
              <WordLine
                words={['залишаєш', 'на', 'столі.']}
                lineIndex={2}
                inView={inView}
                style={{ color: 'var(--l-accent)', fontStyle: 'normal' }}
              />
            </h2>

            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ ...LANDING_SPRING, delay: 0.68 }}
              className="mt-5 text-base leading-relaxed max-w-sm"
              style={{ color: 'var(--l-muted)' }}
            >
              В середньому майстри з Bookit заробляють до 27% більше за рахунок заповнених вікон і повернутих клієнтів.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ ...LANDING_SPRING, delay: 0.76 }}
              className="mt-10 p-8 rounded-[1.5rem]"
              style={{
                background: 'var(--l-surface)',
                border: '1px solid var(--l-border)',
                boxShadow: '0 8px 32px rgba(26,23,16,0.06)',
              }}
            >
              <div className="flex flex-col gap-4">
                <div className="flex items-end justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] mb-1.5" style={{ color: 'var(--l-muted)' }}>
                      Зараз
                    </p>
                    <AnimatePresence mode="wait">
                      <motion.p
                        key={monthlyRaw}
                        initial={shouldReduce ? false : { opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={shouldReduce ? undefined : { opacity: 0, y: -8 }}
                        transition={{ duration: 0.15 }}
                        className="font-[family-name:var(--font-cormorant)] font-semibold leading-none"
                        style={{ fontSize: 'clamp(2.4rem,4vw,3rem)', color: 'var(--l-ink)' }}
                      >
                        {formatCurrency(monthlyRaw)}
                      </motion.p>
                    </AnimatePresence>
                  </div>

                  <motion.span
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={inView ? { opacity: 1, scale: 1 } : {}}
                    transition={{ ...LANDING_SPRING, delay: 0.82 }}
                    className="font-[family-name:var(--font-cormorant)] font-semibold flex-shrink-0 pb-1"
                    style={{ fontSize: '1.8rem', color: 'var(--l-indigo)' }}
                    aria-hidden="true"
                  >
                    ×1.27
                  </motion.span>

                  <div className="text-right">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] mb-1.5" style={{ color: 'var(--l-muted)' }}>
                      З Bookit
                    </p>
                    <AnimatePresence mode="wait">
                      <motion.p
                        key={monthlyBookit}
                        initial={shouldReduce ? false : { opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={shouldReduce ? undefined : { opacity: 0, y: -8 }}
                        transition={{ duration: 0.15 }}
                        className="font-[family-name:var(--font-cormorant)] font-semibold leading-none"
                        style={{ fontSize: 'clamp(2.4rem,4vw,3rem)', color: 'var(--l-accent)' }}
                      >
                        {formatCurrency(monthlyBookit)}
                      </motion.p>
                    </AnimatePresence>
                  </div>
                </div>

                <div className="h-px w-full" style={{ background: 'var(--l-border)' }} aria-hidden="true" />

                <div className="flex items-center justify-between">
                  <p className="text-sm" style={{ color: 'var(--l-muted)' }}>
                    Додатковий дохід на місяць
                  </p>
                  <AnimatePresence mode="wait">
                    <motion.p
                      key={`gain-${gain}`}
                      initial={shouldReduce ? false : { opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={shouldReduce ? undefined : { opacity: 0, y: -4 }}
                      transition={{ duration: 0.15 }}
                      className="text-lg font-bold"
                      style={{ color: 'var(--l-accent)' }}
                    >
                      +{formatCurrency(gain)}
                    </motion.p>
                  </AnimatePresence>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-sm" style={{ color: 'var(--l-muted)' }}>На рік</p>
                  <AnimatePresence mode="wait">
                    <motion.p
                      key={`yearly-${yearlyBookit}`}
                      initial={shouldReduce ? false : { opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={shouldReduce ? undefined : { opacity: 0, y: -4 }}
                      transition={{ duration: 0.15 }}
                      className="text-lg font-bold"
                      style={{ color: 'var(--l-ink)' }}
                    >
                      {formatCurrency(yearlyBookit)}
                    </motion.p>
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 32 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: shouldReduce ? 0 : 0.9, ease: easeOut, delay: shouldReduce ? 0 : 0.22 }}
            className="flex flex-col gap-10 lg:pt-24"
          >
            <Slider
              label="Клієнтів на день"
              value={clients}
              min={1} max={15} step={1}
              format={(v) => `${v}`}
              onChange={setClients}
            />
            <Slider
              label="Середня вартість послуги"
              value={avgPrice}
              min={200} max={2000} step={50}
              format={(v) => `${v} грн`}
              onChange={setAvgPrice}
            />
            <Slider
              label="Робочих днів на місяць"
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
