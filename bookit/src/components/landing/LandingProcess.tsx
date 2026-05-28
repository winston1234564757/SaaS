'use client';

import { Fragment, useRef } from 'react';
import { motion, useInView, useScroll, useTransform } from 'framer-motion';

const spring = { type: 'spring', stiffness: 240, damping: 26 } as const;
const easeOut: [number, number, number, number] = [0.22, 1, 0.36, 1];

const STEPS = [
  {
    no: '01',
    title: 'Реєструєшся за 2 хвилини',
    body: 'Номер телефону, назва і місто. Більше нічого. Без демо-дзвінків і менеджерів.',
  },
  {
    no: '02',
    title: 'Додаєш послуги і розклад',
    body: 'Завантажуєш портфоліо, вказуєш ціни і час роботи. Система сама формує твою публічну сторінку.',
  },
  {
    no: '03',
    title: 'Отримуєш записи в Telegram',
    body: 'Клієнти записуються через посилання або QR-код. Ти бачиш все в одному місці і нічого не пропускаєш.',
  },
];

/* Inline word-by-word reveal for styled headings */
function WordLine({
  words,
  lineIndex,
  style,
  inView,
}: {
  words: string[];
  lineIndex: number;
  style?: React.CSSProperties;
  inView: boolean;
}) {
  return (
    <span style={{ display: 'block', ...style }}>
      {words.map((word, wi) => {
        const delay = (lineIndex * 200 + wi * 70) / 1000;
        return (
          <span
            key={wi}
            style={{
              display: 'inline-block',
              overflow: 'hidden',
              verticalAlign: 'bottom',
              lineHeight: 'inherit',
              marginRight: wi < words.length - 1 ? '0.28em' : 0,
            }}
          >
            <motion.span
              style={{ display: 'inline-block' }}
              initial={{ y: '110%' }}
              animate={inView ? { y: 0 } : {}}
              transition={{ duration: 0.9, ease: easeOut, delay }}
            >
              {word}
            </motion.span>
          </span>
        );
      })}
    </span>
  );
}

function splitSentences(text: string): string[] {
  return text.split(/(?<=[.?!]) /).filter(Boolean);
}

function StepItem({ item }: { item: typeof STEPS[0] }) {
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
        style={{ fontSize: 'clamp(2.4rem, 4vw, 3.6rem)', color: 'var(--l-border-2)', display: 'block' }}
        aria-hidden="true"
      >
        {item.no}
      </motion.span>

      <div className="pt-1 flex-1 min-w-0">
        {/* Word-by-word h3 — starts simultaneously with body */}
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

        {/* Sentence-by-sentence body */}
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

export function LandingProcess() {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });
  const headingY = useTransform(scrollYProgress, [0, 1], ['3%', '-3%']);

  return (
    <section ref={ref} className="py-20 sm:py-36 px-4 sm:px-6 lg:px-12 relative overflow-hidden">
      {/* Ambient blob */}
      <motion.div
        className="pointer-events-none absolute rounded-full"
        style={{
          width: 420,
          height: 420,
          background: 'radial-gradient(circle, rgba(99,102,241,0.09) 0%, transparent 70%)',
          bottom: '0%',
          right: '-6%',
        }}
        animate={{ x: [0, -18, 0], y: [0, -22, 0] }}
        transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
        aria-hidden="true"
      />

      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.4fr] gap-16 lg:gap-24 items-start">

          {/* Left: sticky header */}
          <div className="lg:sticky lg:top-32">
            <motion.div style={{ y: headingY }}>
              <motion.span
                initial={{ opacity: 0, y: 12 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ ...spring, delay: 0.05 }}
                className="inline-block text-[11px] font-semibold uppercase tracking-[0.15em] mb-5"
                style={{ color: 'var(--l-indigo)' }}
              >
                Старт
              </motion.span>
              <h2
                className="font-[family-name:var(--font-cormorant)] font-semibold leading-[0.95] tracking-tight"
                style={{ fontSize: 'clamp(2.4rem,5vw,4rem)', color: 'var(--l-ink)' }}
              >
                <WordLine words={['Три', 'кроки']} lineIndex={0} inView={inView} />
                <WordLine
                  words={['до', 'першого', 'запису.']}
                  lineIndex={1}
                  inView={inView}
                  style={{ color: 'var(--l-accent)', fontStyle: 'normal' }}
                />
              </h2>
              <motion.p
                initial={{ opacity: 0, y: 16 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ ...spring, delay: 0.52 }}
                className="mt-5 text-base leading-relaxed"
                style={{ color: 'var(--l-muted)' }}
              >
                Від реєстрації до першої броні — менше одного дня.
              </motion.p>
            </motion.div>
          </div>

          {/* Right: step cards */}
          <div className="flex flex-col gap-4">
            {STEPS.map((s, i) => (
              <StepItem key={i} item={s} />
            ))}

            {/* Time badge */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ ...spring, delay: 0.58 }}
              className="mt-4 inline-flex items-center gap-3 px-5 py-3 rounded-full self-start"
              style={{
                background: 'rgba(99,102,241,0.08)',
                border: '1px solid rgba(99,102,241,0.15)',
              }}
            >
              <span
                className="w-2 h-2 rounded-full animate-pulse"
                style={{ background: 'var(--l-accent)' }}
                aria-hidden="true"
              />
              <span className="text-sm font-medium" style={{ color: 'var(--l-accent)' }}>
                Старт за 2 хвилини · Без кредитної картки
              </span>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
