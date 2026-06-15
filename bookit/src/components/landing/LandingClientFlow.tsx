'use client';

import { Fragment, useRef } from 'react';
import { motion, useInView, useScroll, useTransform } from 'framer-motion';
import { useIsDesktop } from '@/lib/hooks/useIsDesktop';
import { LandingSplitHeading } from '@/components/landing/LandingSplitHeading';

const spring = { type: 'spring', stiffness: 240, damping: 26 } as const;
const easeOut: [number, number, number, number] = [0.22, 1, 0.36, 1];

const STEPS = [
  {
    no: '01',
    title: 'Клієнт відкриває посилання',
    body: 'Ніякої реєстрації. Бачить твої послуги, ціни і вільний час прямо зараз.',
    detail: 'bookit.ua/anna',
  },
  {
    no: '02',
    title: 'Обирає час і підтверджує номер',
    body: 'OTP за 30 секунд. Запис підтверджено — жодного дзвінка.',
    detail: 'SMS · 30 сек',
  },
  {
    no: '03',
    title: 'Отримує нагадування перед записом',
    body: 'Telegram або Push за 2 години. Ніхто не забуває, ніхто не спізнюється.',
    detail: 'TG / Push · −2 год',
  },
];

function splitSentences(text: string): string[] {
  return text.split(/(?<=[.?!]) /).filter(Boolean);
}

function StepCard({ item }: { item: typeof STEPS[0] }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });
  const sentences = splitSentences(item.body);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 32, scale: 0.97 }}
      animate={inView ? { opacity: 1, y: 0, scale: 1 } : {}}
      transition={{ duration: 0.65, ease: easeOut }}
      className="flex flex-col gap-5 p-7 rounded-[1.25rem]"
      style={{
        background: 'var(--l-surface, rgba(248,250,252,0.65))',
        border: '1px solid var(--l-border)',
        boxShadow: '0 2px 20px rgba(15,23,42,0.04), 0 1px 4px rgba(15,23,42,0.02)',
        height: '100%',
      }}
    >
      {/* Top row: number + chip */}
      <div className="flex items-end justify-between">
        <motion.span
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.9, ease: easeOut, delay: 0.04 }}
          className="font-[family-name:var(--font-cormorant)] font-semibold leading-none select-none"
          style={{ fontSize: 'clamp(3rem,5vw,4.5rem)', color: 'var(--l-border-2)' }}
          aria-hidden="true"
        >
          {item.no}
        </motion.span>
        <motion.span
          initial={{ opacity: 0, scale: 0.85 }}
          animate={inView ? { opacity: 1, scale: 1 } : {}}
          transition={{ ...spring, delay: 0.08 }}
          className="text-sm font-semibold px-4 py-2 rounded-full"
          style={{
            background: 'color-mix(in srgb, var(--l-indigo-glow) 10%, transparent)',
            color: 'var(--l-indigo)',
            border: '1px solid color-mix(in srgb, var(--l-indigo-glow) 18%, transparent)',
          }}
        >
          {item.detail}
        </motion.span>
      </div>

      <div>
        {/* Word-by-word h3 — starts simultaneously with body */}
        <h3 className="font-semibold leading-snug mb-3" style={{ fontSize: '1.05rem', color: 'var(--l-ink)' }}>
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
                transition={{ duration: 0.85, ease: easeOut, delay: 0.1 + wi * 0.065 }}
              >
                {word}
              </motion.span>
            </span>
          ))}
        </h3>

        {/* Sentence-by-sentence body */}
        <p className="text-[0.9rem] leading-relaxed" style={{ color: 'var(--l-muted)' }}>
          {sentences.map((sentence, si, arr) => (
            <Fragment key={si}>
              <span style={{ display: 'inline-block', overflow: 'hidden', verticalAlign: 'bottom' }}>
                <motion.span
                  style={{ display: 'inline-block' }}
                  initial={{ y: '115%', opacity: 0 }}
                  animate={inView ? { y: 0, opacity: 1 } : {}}
                  transition={{ duration: 0.85, ease: easeOut, delay: 0.1 + si * 0.16 }}
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

export function LandingClientFlow() {
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
      className="pt-20 sm:pt-36 pb-40 sm:pb-64 px-4 sm:px-6 lg:px-12"
      style={{ background: 'var(--l-bg)' }}
    >
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <motion.div className="mb-14 max-w-xl" style={{ y: headingY }}>
          <motion.span
            initial={{ opacity: 0, y: 12, filter: 'blur(8px)' }}
            animate={inView ? { opacity: 1, y: 0, filter: 'blur(0px)' } : {}}
            transition={{ ...spring, delay: 0.05 }}
            className="inline-block text-[11px] font-semibold uppercase tracking-[0.18em] mb-5"
            style={{ color: 'var(--l-indigo)' }}
          >
            Клієнтський досвід
          </motion.span>
          <LandingSplitHeading
            text={"Три кроки\nдля клієнта."}
            className="font-[family-name:var(--font-cormorant)] font-semibold leading-[0.92] tracking-tight"
            style={{ fontSize: 'clamp(2.6rem,5vw,4.4rem)', color: 'var(--l-ink)' }}
            stagger={70}
            lineDelay={200}
          />
        </motion.div>

        {/* Step cards grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {STEPS.map((s, i) => (
            <StepCard key={i} item={s} />
          ))}
        </div>

      </div>
    </section>
  );
}
