'use client';

import { Fragment, useRef } from 'react';
import { motion, useInView, useScroll, useTransform } from 'framer-motion';
import { useIsDesktop } from '@/lib/hooks/useIsDesktop';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { LandingSplitHeading } from '@/components/landing/LandingSplitHeading';

const spring = { type: 'spring', stiffness: 240, damping: 26 } as const;
const easeOut: [number, number, number, number] = [0.22, 1, 0.36, 1];

const FEATURES = [
  {
    stat: '24/7',
    eyebrow: 'Онлайн-запис',
    title: 'Клієнт обирає час сам. О третій ночі.',
    body: 'Публічна сторінка з твоїми послугами, цінами й розкладом — завжди доступна. Клієнт записується без дзвінків і повідомлень, ти отримуєш підтвердження в Telegram.',
    reverse: false,
  },
  {
    stat: 'до 27%',
    eyebrow: 'Smart Slots',
    title: 'Порожні вікна заповнюються до того, як ти їх помітила.',
    body: 'Алгоритм аналізує твій розклад і автоматично пропонує клієнтам час без зайвих пауз. Флеш-акції при скасуваннях — і вікно закривається за 10 хвилин.',
    reverse: true,
  },
  {
    stat: '×3',
    eyebrow: 'Повернення клієнтів',
    title: 'Клієнт, якого ти вже забула, пишеться сам.',
    body: 'Автоматичні нагадування через Telegram і Push виходять у потрібний момент — коли минає стандартний цикл повернення. Ніяких ручних розсилок.',
    reverse: false,
  },
];

function splitSentences(text: string): string[] {
  return text.split(/(?<=[.?!]) /).filter(Boolean);
}

function FeatureCard({ feature }: { feature: typeof FEATURES[0] }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });
  const sentences = splitSentences(feature.body);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 36, scale: 0.97 }}
      animate={inView ? { opacity: 1, y: 0, scale: 1 } : {}}
      transition={{ duration: 0.65, ease: easeOut }}
      className={`flex flex-col lg:items-start gap-10 p-8 rounded-[1.25rem] ${
        feature.reverse ? 'lg:flex-row-reverse' : 'lg:flex-row'
      }`}
      style={{
        background: 'var(--l-surface, rgba(248,250,252,0.65))',
        border: '1px solid var(--l-border)',
        boxShadow: '0 2px 20px rgba(15,23,42,0.04), 0 1px 4px rgba(15,23,42,0.02)',
      }}
    >
      {/* Stat side */}
      <div className="flex-shrink-0 lg:w-64">
        <div style={{ overflow: 'hidden' }}>
          <motion.p
            initial={{ y: '110%', opacity: 0 }}
            animate={inView ? { y: 0, opacity: 1 } : {}}
            transition={{ duration: 0.9, ease: easeOut, delay: 0.04 }}
            className="font-[family-name:var(--font-cormorant)] font-semibold leading-none"
            style={{ fontSize: 'clamp(4rem, 8vw, 7rem)', color: 'var(--l-ink)', display: 'block' }}
          >
            {feature.stat}
          </motion.p>
        </div>
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ ...spring, delay: 0.16 }}
          className="text-[11px] font-semibold uppercase tracking-[0.18em] mt-3"
          style={{ color: 'var(--l-indigo)' }}
        >
          {feature.eyebrow}
        </motion.p>
      </div>

      {/* Content side — title and body start simultaneously */}
      <div className="flex-1 pt-2">
        <h3
          className="font-[family-name:var(--font-cormorant)] font-semibold leading-snug mb-5"
          style={{ fontSize: 'clamp(1.6rem, 3vw, 2.4rem)', color: 'var(--l-ink)' }}
        >
          {feature.title.split(' ').map((word, wi, arr) => (
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
                transition={{ duration: 0.85, ease: easeOut, delay: 0.1 + wi * 0.055 }}
              >
                {word}
              </motion.span>
            </span>
          ))}
        </h3>

        <p className="text-base leading-relaxed max-w-lg" style={{ color: 'var(--l-muted)' }}>
          {sentences.map((sentence, si, arr) => (
            <Fragment key={si}>
              <span style={{ display: 'inline-block', overflow: 'hidden', verticalAlign: 'bottom' }}>
                <motion.span
                  style={{ display: 'inline-block' }}
                  initial={{ y: '115%', opacity: 0 }}
                  animate={inView ? { y: 0, opacity: 1 } : {}}
                  transition={{ duration: 0.85, ease: easeOut, delay: 0.1 + si * 0.18 }}
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

export function LandingMagic() {
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
    <section ref={ref} className="px-4 sm:px-6 lg:px-12" style={{ background: 'var(--l-bg)' }}>
      <div className="max-w-7xl mx-auto">

        {/* Section header */}
        <motion.div className="pt-20 sm:pt-36 pb-14 max-w-2xl" style={{ y: headingY }}>
          <motion.span
            initial={{ opacity: 0, y: 12, filter: 'blur(8px)' }}
            animate={inView ? { opacity: 1, y: 0, filter: 'blur(0px)' } : {}}
            transition={{ ...spring, delay: 0.05 }}
            className="inline-block text-[11px] font-semibold uppercase tracking-[0.18em] mb-5"
            style={{ color: 'var(--l-indigo)' }}
          >
            Як це працює
          </motion.span>
          <LandingSplitHeading
            text={"Bookit працює,\nпоки ти — зі своїми клієнтами."}
            className="font-[family-name:var(--font-cormorant)] font-semibold leading-[0.92] tracking-tight"
            style={{ fontSize: 'clamp(2.6rem, 5.5vw, 4.8rem)', color: 'var(--l-ink)' }}
            stagger={60}
            lineDelay={200}
          />
        </motion.div>

        {/* Feature cards */}
        <div className="flex flex-col gap-4 pb-0">
          {FEATURES.map((f, i) => (
            <FeatureCard key={i} feature={f} />
          ))}
        </div>

        {/* Bottom CTA row */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ ...spring, delay: 0.54 }}
          className="py-16 flex items-center justify-between gap-6 flex-wrap"
          style={{ borderTop: '1px solid var(--l-border)' }}
        >
          <p
            className="font-[family-name:var(--font-cormorant)] font-semibold"
            style={{ fontSize: 'clamp(1.4rem, 2.5vw, 2rem)', color: 'var(--l-ink)' }}
          >
            Починається безкоштовно. Назавжди.
          </p>
          <Link
            href="/register"
            className="group flex items-center gap-2 text-sm font-semibold pl-6 pr-2.5 py-3 rounded-full transition-all active:scale-[0.97] flex-shrink-0"
            style={{
              background: 'var(--l-accent)',
              color: 'var(--l-accent-on)',
              boxShadow: '0 4px 20px rgba(15,23,42,0.22)',
            }}
          >
            Спробувати безкоштовно
            <span
              className="size-7 rounded-full flex items-center justify-center transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
              style={{ background: 'color-mix(in srgb, var(--l-accent-on) 12%, transparent)' }}
            >
              <ArrowUpRight size={13} aria-hidden="true" />
            </span>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
