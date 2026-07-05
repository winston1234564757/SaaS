'use client';

import { useRef } from 'react';
import { motion, useInView, useReducedMotion, useScroll, useTransform } from 'framer-motion';
import { useIsDesktop } from '@/lib/hooks/useIsDesktop';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { LandingSplitHeading } from '@/components/landing/LandingSplitHeading';
import { LANDING_SPRING } from './shared/CountUp';

const easeOut: [number, number, number, number] = [0.22, 1, 0.36, 1];

const FEATURES = [
  {
    stat: '24/7',
    title: 'Клієнт обирає час сам. О третій ночі.',
    body: 'Публічна сторінка з твоїми послугами, цінами й розкладом — завжди доступна. Клієнт записується без дзвінків і повідомлень, ти отримуєш підтвердження в Telegram.',
    reverse: false,
  },
  {
    stat: 'до 27%',
    title: 'Порожні вікна заповнюються до того, як ти їх помітила.',
    body: 'Алгоритм аналізує твій розклад і автоматично пропонує клієнтам час без зайвих пауз. Флеш-акції при скасуваннях — і вікно закривається за 10 хвилин.',
    reverse: true,
  },
  {
    stat: '×3',
    title: 'Клієнт, якого ти вже забула, пишеться сам.',
    body: 'Автоматичні нагадування через Telegram і Push виходять у потрібний момент — коли минає стандартний цикл повернення. Ніяких ручних розсилок.',
    reverse: false,
  },
];

export function LandingMagic() {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  const shouldReduce = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });
  const isDesktop = useIsDesktop();
  const headingYDesktop = useTransform(scrollYProgress, [0, 1], shouldReduce ? ['0%', '0%'] : ['0%', '-14%']);
  const headingYMobile = useTransform(scrollYProgress, [0, 1], shouldReduce ? ['0%', '0%'] : ['0%', '-4%']);
  const headingY = isDesktop ? headingYDesktop : headingYMobile;

  const reveal = (delay: number) => ({
    initial: { opacity: 0, y: 24 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: '-60px' },
    transition: { duration: shouldReduce ? 0 : 0.6, ease: easeOut, delay: shouldReduce ? 0 : delay },
  });

  return (
    <section ref={ref} className="px-4 sm:px-6 lg:px-12" style={{ background: 'var(--l-bg)' }}>
      <div className="max-w-7xl mx-auto">

        {/* Section header — heading leads */}
        <motion.div className="pt-20 sm:pt-36 pb-12 sm:pb-16 max-w-2xl" style={{ y: headingY }}>
          <LandingSplitHeading
            text={"Bookit працює,\nпоки ти — зі своїми клієнтами."}
            className="font-[family-name:var(--font-cormorant)] font-semibold leading-[0.92] tracking-tight"
            style={{ fontSize: 'clamp(2.6rem, 5.5vw, 4.8rem)', color: 'var(--l-ink)' }}
            stagger={60}
            lineDelay={200}
          />
        </motion.div>

        {/* Feature rows — editorial pull-stat + statement, hairline separated, no cards */}
        <div>
          {FEATURES.map((f, i) => (
            <motion.div
              key={i}
              {...reveal(0.05)}
              className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-12 items-start py-10 sm:py-14"
              style={{ borderTop: i > 0 ? '1px solid var(--l-border)' : 'none' }}
            >
              {/* Stat — big editorial numeral */}
              <div className={f.reverse ? 'lg:col-span-4 lg:order-2' : 'lg:col-span-4'}>
                <p
                  className="font-[family-name:var(--font-cormorant)] font-semibold leading-[0.85] tracking-tight"
                  style={{ fontSize: 'clamp(3.4rem, 6vw, 5.5rem)', color: 'var(--l-indigo)' }}
                >
                  {f.stat}
                </p>
              </div>

              {/* Statement */}
              <div className={f.reverse ? 'lg:col-span-8 lg:order-1' : 'lg:col-span-8'}>
                <h3
                  className="font-[family-name:var(--font-cormorant)] font-semibold leading-[1.08] tracking-tight mb-4"
                  style={{ fontSize: 'clamp(1.6rem, 3vw, 2.5rem)', color: 'var(--l-ink)' }}
                >
                  {f.title}
                </h3>
                <p className="text-base sm:text-lg leading-relaxed max-w-xl" style={{ color: 'var(--l-muted)' }}>
                  {f.body}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Bottom CTA row */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ ...LANDING_SPRING, delay: 0.2 }}
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
            className="group flex items-center gap-2 text-sm font-semibold pl-6 pr-2.5 py-3 rounded-full transition-all active:scale-[0.97] flex-shrink-0 focus-visible:ring-2 focus-visible:ring-[var(--l-indigo)] focus-visible:ring-offset-2 focus-visible:outline-none"
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
              aria-hidden="true"
            >
              <ArrowUpRight size={13} aria-hidden="true" />
            </span>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
