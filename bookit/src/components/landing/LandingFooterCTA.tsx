'use client';

import { useRef } from 'react';
import { motion, useInView, useReducedMotion, useScroll, useTransform, useMotionValue, useSpring } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { LandingSplitHeading } from '@/components/landing/LandingSplitHeading';
import { LANDING_SPRING } from './shared/CountUp';

export function LandingFooterCTA() {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  const shouldReduce = useReducedMotion();

  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const bgY = useTransform(scrollYProgress, [0, 1], shouldReduce ? ['0%', '0%'] : ['0%', '6%']);

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const blob1X = useSpring(useTransform(mouseX, [-1, 1], [-12, 12]), { stiffness: 50, damping: 20 });
  const blob1Y = useSpring(useTransform(mouseY, [-1, 1], [-8, 8]), { stiffness: 50, damping: 20 });
  const blob2X = useSpring(useTransform(mouseX, [-1, 1], [10, -10]), { stiffness: 40, damping: 18 });
  const blob2Y = useSpring(useTransform(mouseY, [-1, 1], [6, -6]), { stiffness: 40, damping: 18 });
  const blob3X = useSpring(useTransform(mouseX, [-1, 1], [-7, 7]), { stiffness: 60, damping: 22 });
  const blob3Y = useSpring(useTransform(mouseY, [-1, 1], [5, -5]), { stiffness: 60, damping: 22 });

  function handleMouseMove(e: React.MouseEvent<HTMLElement>) {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    mouseX.set((e.clientX - rect.left) / rect.width * 2 - 1);
    mouseY.set((e.clientY - rect.top) / rect.height * 2 - 1);
  }

  function handleMouseLeave() {
    mouseX.set(0);
    mouseY.set(0);
  }

  return (
    <section
      ref={ref}
      className="relative overflow-hidden mx-4 sm:mx-6 lg:mx-12 mb-16 rounded-[2.5rem]"
      style={{ minHeight: '520px' }}
      onMouseMove={shouldReduce ? undefined : handleMouseMove}
      onMouseLeave={shouldReduce ? undefined : handleMouseLeave}
    >
      <style>{`
        @media (min-width: 1024px) and (prefers-reduced-motion: no-preference) {
          .l-footer-blob-1 { animation: lFooterBlob1 22s ease-in-out infinite; }
          .l-footer-blob-2 { animation: lFooterBlob2 28s ease-in-out infinite; }
          .l-footer-blob-3 { animation: lFooterBlob3 19s ease-in-out infinite; }
        }
        @keyframes lFooterBlob1 { 0%, 100% { opacity: 1; } 50% { opacity: 0.72; } }
        @keyframes lFooterBlob2 { 0%, 100% { opacity: 0.88; } 50% { opacity: 1; } }
        @keyframes lFooterBlob3 { 0%, 100% { opacity: 1; } 50% { opacity: 0.65; } }
      `}</style>

      {/* Base dark background with scroll parallax */}
      <motion.div
        style={{ y: bgY }}
        className="absolute inset-[-10%]"
        aria-hidden="true"
      >
        <div className="w-full h-full" style={{ background: 'var(--l-bg-dark)' }} />
      </motion.div>

      {/* Blob 1 — top center indigo */}
      <motion.div
        className="pointer-events-none absolute l-footer-blob-1"
        style={{
          width: 520,
          height: 420,
          top: '-10%',
          left: '50%',
          translateX: '-50%',
          x: blob1X,
          y: blob1Y,
          background: 'radial-gradient(ellipse 60% 50% at 50% 30%, var(--l-blob-indigo) 0%, transparent 70%)',
        }}
        aria-hidden="true"
      />

      {/* Blob 2 — bottom right violet */}
      <motion.div
        className="pointer-events-none absolute l-footer-blob-2"
        style={{
          width: 420,
          height: 340,
          bottom: '0',
          right: '-5%',
          x: blob2X,
          y: blob2Y,
          background: 'radial-gradient(ellipse 70% 65% at 60% 60%, var(--l-blob-violet) 0%, transparent 65%)',
        }}
        aria-hidden="true"
      />

      {/* Blob 3 — bottom left blue */}
      <motion.div
        className="pointer-events-none absolute l-footer-blob-3"
        style={{
          width: 360,
          height: 300,
          bottom: '5%',
          left: '-3%',
          x: blob3X,
          y: blob3Y,
          background: 'radial-gradient(ellipse 65% 60% at 40% 50%, var(--l-blob-blue) 0%, transparent 65%)',
        }}
        aria-hidden="true"
      />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center text-center px-6 py-28">
        <motion.span
          initial={{ opacity: 0, y: 12, filter: 'blur(8px)' }}
          animate={inView ? { opacity: 1, y: 0, filter: 'blur(0px)' } : {}}
          transition={{ ...LANDING_SPRING, delay: 0.05 }}
          className="inline-block text-[11px] font-semibold uppercase tracking-[0.18em] mb-8"
          style={{ color: 'color-mix(in srgb, var(--l-indigo-glow) 70%, transparent)' }}
        >
          Починай сьогодні
        </motion.span>

        <LandingSplitHeading
          text={"Перший запис\nвже сьогодні."}
          className="font-[family-name:var(--font-cormorant)] font-semibold leading-[0.92] tracking-tight text-balance"
          style={{ fontSize: 'clamp(2.8rem,7vw,6.5rem)', color: 'var(--l-text-on-dark)' }}
          stagger={80}
          lineDelay={220}
        />

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ ...LANDING_SPRING, delay: 0.48 }}
          className="mt-6 text-base leading-relaxed max-w-md"
          style={{ color: 'var(--l-muted-on-dark)' }}
        >
          Безкоштовно для старту. Без кредитної картки. Налаштування — 15 хвилин.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ ...LANDING_SPRING, delay: 0.58 }}
          className="mt-10 flex flex-col sm:flex-row items-center gap-4"
        >
          <motion.div
            whileHover={shouldReduce ? {} : { scale: 1.04 }}
            transition={LANDING_SPRING}
          >
            <Link
              href="/register"
              className="group flex items-center gap-3 h-14 pl-8 pr-3 rounded-full font-semibold text-base transition-colors active:scale-[0.97] focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--l-bg-dark)] focus-visible:outline-none"
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
                aria-hidden="true"
              >
                <ArrowRight size={15} aria-hidden="true" />
              </span>
            </Link>
          </motion.div>

          <Link
            href="/login"
            className="text-sm font-medium transition-opacity hover:opacity-70 focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none rounded"
            style={{ color: 'var(--l-muted-on-dark)' }}
          >
            Вже є акаунт? Увійти
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
