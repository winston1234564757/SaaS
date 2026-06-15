'use client';

import { useRef } from 'react';
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowUpRight } from 'lucide-react';
import { LANDING_SPRING } from './shared/CountUp';

export function LandingHero() {
  const sectionRef = useRef<HTMLElement>(null);
  const shouldReduce = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start start', 'end start'],
  });

  const textY      = useTransform(scrollYProgress, [0, 1], shouldReduce ? ['0%', '0%'] : ['0%', '18%']);
  const mockupRotX = useTransform(scrollYProgress, [0, 0.45], shouldReduce ? [0, 0] : [36, 0]);
  const mockupScale= useTransform(scrollYProgress, [0, 0.45], shouldReduce ? [1, 1] : [0.95, 1]);
  const mockupY    = useTransform(scrollYProgress, [0, 1], shouldReduce ? ['0%', '0%'] : ['0%', '6%']);

  return (
    <section
      ref={sectionRef}
      className="relative overflow-hidden"
      style={{ minHeight: '100dvh', background: 'var(--l-bg)' }}
    >
      <style>{`
        @media (min-width: 768px) and (prefers-reduced-motion: no-preference) {
          .l-blob-1 { animation: lBlobDrift1 22s ease-in-out infinite; }
          .l-blob-2 { animation: lBlobDrift2 28s ease-in-out infinite; }
          .l-blob-3 { animation: lBlobDrift3 34s ease-in-out infinite; }
        }
        @keyframes lBlobDrift1 {
          0%,100% { transform: scale(1) translate(0,0); }
          33% { transform: scale(1.06) translate(2%,1%); }
          66% { transform: scale(0.96) translate(-1%,2%); }
        }
        @keyframes lBlobDrift2 {
          0%,100% { transform: scale(1) translate(0,0); }
          50% { transform: scale(1.05) translate(-2%,-1%); }
        }
        @keyframes lBlobDrift3 {
          0%,100% { transform: scale(1) translate(0,0); }
          40% { transform: scale(1.08) translate(1%,-2%); }
          80% { transform: scale(0.97) translate(-1%,1%); }
        }
      `}</style>

      {/* Frost gradient blobs — split for independent drift animation */}
      <div
        className="l-blob-1 pointer-events-none absolute inset-0"
        aria-hidden="true"
        style={{ background: 'radial-gradient(ellipse 100% 55% at 50% -5%, var(--l-blob-indigo) 0%, transparent 60%)' }}
      />
      <div
        className="l-blob-2 pointer-events-none absolute inset-0"
        aria-hidden="true"
        style={{ background: 'radial-gradient(ellipse 55% 40% at 88% 5%, var(--l-blob-violet) 0%, transparent 50%)' }}
      />
      <div
        className="l-blob-3 pointer-events-none absolute inset-0"
        aria-hidden="true"
        style={{ background: 'radial-gradient(ellipse 40% 30% at 8% 95%, var(--l-blob-blue) 0%, transparent 45%)' }}
      />

      {/* Text block */}
      <motion.div
        style={{ y: textY }}
        className="relative z-10 flex flex-col items-center text-center px-4 pt-36 sm:pt-44 pb-16"
      >
        <motion.span
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...LANDING_SPRING, delay: 0.08 }}
          className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] px-4 py-1.5 rounded-full mb-9"
          style={{
            background: 'var(--l-blob-indigo-sm)',
            border: '1px solid var(--l-blob-badge)',
            color: 'var(--l-indigo)',
          }}
        >
          <span
            className="size-1.5 rounded-full animate-pulse"
            style={{ background: 'var(--l-indigo-glow)' }}
            aria-hidden="true"
          />
          для майстрів краси
        </motion.span>

        <motion.h1
          initial={{ opacity: 0, y: 36 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...LANDING_SPRING, delay: 0.16 }}
          className="font-[family-name:var(--font-cormorant)] font-semibold leading-[0.9] tracking-tight text-balance"
          style={{ fontSize: 'clamp(3.4rem, 9.5vw, 8.5rem)', color: 'var(--l-accent)' }}
        >
          Більше записів.
          <br />
          <em className="not-italic" style={{ color: 'var(--l-indigo-glow)' }}>Жодної метушні.</em>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...LANDING_SPRING, delay: 0.36 }}
          className="mt-6 text-base sm:text-lg leading-relaxed max-w-md"
          style={{ color: 'var(--l-muted)' }}
        >
          Один лінк — і клієнти записуються самі, поки ти займаєшся роботою.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...LANDING_SPRING, delay: 0.48 }}
          className="mt-10 flex items-center gap-4 flex-wrap justify-center"
        >
          <motion.div
            whileHover={shouldReduce ? {} : { scale: 1.03 }}
            transition={LANDING_SPRING}
            className="inline-flex"
          >
            <Link
              href="/register"
              className="group flex items-center gap-2 text-sm font-semibold pl-6 pr-2.5 py-3 rounded-full transition-colors active:scale-[0.97] focus-visible:ring-2 focus-visible:ring-[var(--l-indigo)] focus-visible:ring-offset-2 focus-visible:outline-none"
              style={{
                background: 'var(--l-accent)',
                color: 'var(--l-accent-on)',
                boxShadow: '0 4px 24px rgba(15,23,42,0.30), 0 1px 4px rgba(15,23,42,0.12)',
              }}
            >
              Почати безкоштовно
              <span
                className="size-7 rounded-full flex items-center justify-center transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                style={{ background: 'rgba(248,250,252,0.12)' }}
                aria-hidden="true"
              >
                <ArrowUpRight size={13} aria-hidden="true" />
              </span>
            </Link>
          </motion.div>

          <Link
            href="/login"
            className="text-sm font-medium transition-opacity hover:opacity-60 focus-visible:ring-2 focus-visible:ring-[var(--l-indigo)] focus-visible:ring-offset-2 focus-visible:outline-none focus-visible:rounded-sm"
            style={{ color: 'var(--l-muted)' }}
          >
            Вже є акаунт
          </Link>
        </motion.div>
      </motion.div>

      {/* 3D Mockup */}
      <div style={{ perspective: '1400px' }}>
        <motion.div
          style={{
            rotateX: mockupRotX,
            scale: mockupScale,
            y: mockupY,
            transformOrigin: 'top center',
          }}
          initial={{ opacity: 0, y: 56 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...LANDING_SPRING, delay: 0.6 }}
          className="relative z-10 mx-auto px-4 sm:px-10 lg:px-20"
          aria-hidden="true"
        >
          <div style={{ maxWidth: 1080, margin: '0 auto' }}>
            {/* Browser chrome */}
            <div
              style={{
                background: 'var(--l-accent-mid)',
                borderRadius: '14px 14px 0 0',
                padding: '10px 14px',
                display: 'flex',
                alignItems: 'center',
                gap: 5,
              }}
            >
              {[0, 1, 2].map((i) => (
                <span key={i} style={{ width: 10, height: 10, borderRadius: '50%', background: 'rgba(248,250,252,0.18)' }} />
              ))}
              <div
                style={{
                  flex: 1, height: 20, borderRadius: 6,
                  background: 'rgba(248,250,252,0.07)',
                  marginLeft: 10,
                }}
              />
            </div>

            {/* Dashboard screenshot */}
            <div
              style={{
                height: 440,
                position: 'relative',
                boxShadow: '0 40px 100px rgba(15,23,42,0.24), 0 8px 24px rgba(15,23,42,0.10)',
                borderRadius: '0 0 14px 14px',
                overflow: 'hidden',
              }}
            >
              <Image
                src="/landing/dashboard.png"
                alt="Інтерфейс особистого кабінету майстра в BookIT"
                fill
                style={{ objectFit: 'cover', objectPosition: 'top' }}
                priority
              />
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
