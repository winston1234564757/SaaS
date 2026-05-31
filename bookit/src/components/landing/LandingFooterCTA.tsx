'use client';

import { useRef } from 'react';
import { motion, useInView, useScroll, useTransform } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { LandingSplitHeading } from '@/components/landing/LandingSplitHeading';

const spring = { type: 'spring', stiffness: 240, damping: 26 } as const;
const easeOut: [number, number, number, number] = [0.22, 1, 0.36, 1];

export function LandingFooterCTA() {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });

  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const bgY = useTransform(scrollYProgress, [0, 1], ['0%', '6%']);

  return (
    <section
      ref={ref}
      className="relative overflow-hidden mx-4 sm:mx-6 lg:mx-12 mb-16 rounded-[2.5rem]"
      style={{ minHeight: '480px' }}
    >
      {/* Parallax background */}
      <motion.div
        style={{ y: bgY }}
        className="absolute inset-[-10%]"
        aria-hidden="true"
      >
        <div className="w-full h-full" style={{ background: 'var(--l-bg-dark)' }} />
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse 60% 50% at 50% 0%, rgba(99,102,241,0.22) 0%, transparent 60%),' +
              'radial-gradient(ellipse 40% 35% at 85% 75%, rgba(139,92,246,0.14) 0%, transparent 50%),' +
              'radial-gradient(ellipse 35% 30% at 10% 80%, rgba(59,130,246,0.10) 0%, transparent 45%)',
          }}
        />
      </motion.div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center text-center px-6 py-28">
        <motion.span
          initial={{ opacity: 0, y: 12, filter: 'blur(8px)' }}
          animate={inView ? { opacity: 1, y: 0, filter: 'blur(0px)' } : {}}
          transition={{ ...spring, delay: 0.05 }}
          className="inline-block text-[11px] font-semibold uppercase tracking-[0.18em] mb-8"
          style={{ color: 'color-mix(in srgb, var(--l-indigo-glow) 70%, transparent)' }}
        >
          Починай сьогодні
        </motion.span>

        <LandingSplitHeading
          text={"Перший запис\nвже сьогодні."}
          className="font-[family-name:var(--font-cormorant)] font-semibold leading-[0.92] tracking-tight text-balance"
          style={{ fontSize: 'clamp(2.8rem,7vw,6rem)', color: 'var(--l-text-on-dark)' }}
          stagger={80}
          lineDelay={220}
        />

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.9, ease: easeOut, delay: 0.48 }}
          className="mt-6 text-base leading-relaxed max-w-md"
            style={{ color: 'var(--l-muted-on-dark)' }}
        >
          Безкоштовно для старту. Без кредитної картки. Налаштування — 15 хвилин.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.9, ease: easeOut, delay: 0.58 }}
          className="mt-10 flex flex-col sm:flex-row items-center gap-4"
        >
          <Link
            href="/register"
            className="group flex items-center gap-3 h-14 pl-8 pr-3 rounded-full font-semibold text-base transition-all active:scale-[0.97]"
            style={{
              background: 'var(--l-text-on-dark)',
              color: 'var(--l-accent)',
              boxShadow: 'var(--l-shadow-xl)',
            }}
          >
            Спробувати безкоштовно
            <span
              className="size-8 rounded-full flex items-center justify-center transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
              style={{ background: 'color-mix(in srgb, var(--l-accent) 10%, transparent)' }}
            >
              <ArrowRight size={15} aria-hidden="true" />
            </span>
          </Link>

          <Link
            href="/login"
            className="text-sm font-medium transition-opacity hover:opacity-70"
          style={{ color: 'var(--l-muted-on-dark)' }}
          >
            Вже є акаунт? Увійти
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
