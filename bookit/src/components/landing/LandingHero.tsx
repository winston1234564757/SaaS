'use client';

import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowUpRight } from 'lucide-react';

const spring = { type: 'spring', stiffness: 240, damping: 26 } as const;

export function LandingHero() {
  const sectionRef = useRef<HTMLElement>(null);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start start', 'end start'],
  });

  const textY       = useTransform(scrollYProgress, [0, 1], ['0%', '18%']);
  const mockupRotX  = useTransform(scrollYProgress, [0, 0.45], [36, 0]);
  const mockupScale = useTransform(scrollYProgress, [0, 0.45], [0.95, 1]);
  const mockupY     = useTransform(scrollYProgress, [0, 1], ['0%', '6%']);

  return (
    <section
      ref={sectionRef}
      className="relative overflow-hidden"
      style={{ minHeight: '100dvh', background: 'var(--l-bg)' }}
    >
      {/* Frost gradient blobs */}
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden="true"
        style={{
          backgroundImage:
            'radial-gradient(ellipse 100% 55% at 50% -5%, rgba(99,102,241,0.22) 0%, transparent 60%),' +
            'radial-gradient(ellipse 55% 40% at 88% 5%, rgba(139,92,246,0.14) 0%, transparent 50%),' +
            'radial-gradient(ellipse 40% 30% at 8% 95%, rgba(59,130,246,0.10) 0%, transparent 45%)',
        }}
      />

      {/* Text block */}
      <motion.div
        style={{ y: textY }}
        className="relative z-10 flex flex-col items-center text-center px-4 pt-36 sm:pt-44 pb-16"
      >
        <motion.span
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...spring, delay: 0.08 }}
          className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] px-4 py-1.5 rounded-full mb-9"
          style={{
            background: 'rgba(99,102,241,0.10)',
            border: '1px solid rgba(99,102,241,0.20)',
            color: 'var(--l-indigo)',
          }}
        >
          <span
            className="w-1.5 h-1.5 rounded-full animate-pulse"
            style={{ background: 'var(--l-indigo-glow)' }}
            aria-hidden="true"
          />
          для майстрів краси
        </motion.span>

        <motion.h1
          initial={{ opacity: 0, y: 36 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...spring, delay: 0.16 }}
          className="font-[family-name:var(--font-cormorant)] font-semibold leading-[0.9] tracking-tight text-balance"
          style={{ fontSize: 'clamp(3.4rem, 9.5vw, 7.5rem)', color: 'var(--l-accent)' }}
        >
          Більше записів.
          <br />
          <em className="not-italic" style={{ color: 'var(--l-indigo-glow)' }}>Жодної метушні.</em>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...spring, delay: 0.26 }}
          className="mt-6 text-base sm:text-lg leading-relaxed max-w-md"
          style={{ color: 'var(--l-muted)' }}
        >
          Один лінк — і клієнти записуються самі, поки ти займаєшся роботою.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...spring, delay: 0.36 }}
          className="mt-10 flex items-center gap-4 flex-wrap justify-center"
        >
          <Link
            href="/register"
            className="group flex items-center gap-2 text-sm font-semibold pl-6 pr-2.5 py-3 rounded-full transition-all active:scale-[0.97]"
            style={{
              background: 'var(--l-accent)',
              color: 'var(--l-accent-on)',
              boxShadow: '0 4px 24px rgba(15,23,42,0.30), 0 1px 4px rgba(15,23,42,0.12)',
            }}
          >
            Почати безкоштовно
            <span
              className="w-7 h-7 rounded-full flex items-center justify-center transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
              style={{ background: 'rgba(248,250,252,0.12)' }}
            >
              <ArrowUpRight size={13} aria-hidden="true" />
            </span>
          </Link>
          <Link
            href="/login"
            className="text-sm font-medium transition-opacity hover:opacity-60"
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
          transition={{ ...spring, delay: 0.5 }}
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
              {['rgba(248,250,252,0.18)', 'rgba(248,250,252,0.18)', 'rgba(248,250,252,0.18)'].map((bg, i) => (
                <span key={i} style={{ width: 10, height: 10, borderRadius: '50%', background: bg }} />
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
