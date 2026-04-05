'use client';

import { useRef } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight, Zap, Star } from 'lucide-react';

/* ─────────────────────────────────────────── FloatingBadge ── */
interface FloatingBadgeProps {
  children: React.ReactNode;
  dotColor: string;
  style?: React.CSSProperties;
}

function FloatingBadge({ children, dotColor, style }: FloatingBadgeProps) {
  return (
    <div
      className="bento-card absolute flex items-center gap-2 px-3 py-2 text-sm font-semibold text-[#2C1A14] whitespace-nowrap"
      style={style}
    >
      <span
        className="w-2 h-2 rounded-full flex-shrink-0"
        style={{ background: dotColor }}
      />
      {children}
    </div>
  );
}

/* ─────────────────────────────────────────── DemoPhoneCard ── */
function DemoPhoneCard() {
  return (
    <div
      className="relative mx-auto overflow-hidden"
      style={{
        width: 280,
        borderRadius: '2.5rem',
        border: '2px solid rgba(255,255,255,0.12)',
        background: '#F5EDE8',
        boxShadow: '0 32px 80px rgba(0,0,0,0.45)',
      }}
    >
      {/* Status bar notch */}
      <div
        className="flex items-center justify-center py-2"
        style={{ background: '#1a1210' }}
      >
        <div className="w-20 h-5 rounded-full" style={{ background: '#0e0b09' }} />
      </div>

      {/* Content */}
      <div className="px-4 pt-4 pb-6 flex flex-col gap-3">
        {/* Flash banner */}
        <div
          className="flex items-center gap-2 px-3 py-2 rounded-2xl text-xs font-semibold"
          style={{ background: 'rgba(201,149,106,0.18)', color: '#C9956A' }}
        >
          <Zap size={12} style={{ fill: '#C9956A', color: '#C9956A' }} />
          Flash -25% · лишилось 2 місця
        </div>

        {/* Master info */}
        <div className="flex items-center gap-3">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'rgba(120,154,153,0.2)' }}
          >
            <span style={{ color: '#789A99', fontWeight: 700, fontSize: 16 }}>А</span>
          </div>
          <div>
            <p className="heading-serif text-sm text-[#2C1A14] leading-tight">Анна К.</p>
            <p className="text-xs text-[#6B5750]">Манікюр · Київ</p>
            <div className="flex gap-0.5 mt-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} size={8} style={{ fill: '#D4935A', color: '#D4935A' }} />
              ))}
              <span className="text-[10px] text-[#A8928D] ml-1">4.9</span>
            </div>
          </div>
        </div>

        {/* Services */}
        <div className="flex flex-col gap-1.5">
          {[
            { name: 'Класичний манікюр', price: '375 ₴', old: '500 ₴', flash: true },
            { name: 'Покриття гелем', price: 'від 525 ₴', flash: false },
            { name: 'Педикюр', price: '650 ₴', flash: false },
          ].map((s, i) => (
            <div
              key={i}
              className="flex items-center justify-between px-2.5 py-2 rounded-xl"
              style={{
                background: s.flash
                  ? 'rgba(201,149,106,0.12)'
                  : 'rgba(255,255,255,0.55)',
                border: s.flash
                  ? '1px solid rgba(201,149,106,0.3)'
                  : '1px solid rgba(255,255,255,0.6)',
              }}
            >
              <span className="text-xs font-medium text-[#2C1A14]">{s.name}</span>
              <div className="flex items-center gap-1">
                <span className="text-xs font-bold" style={{ color: '#C9956A' }}>{s.price}</span>
                {s.old && (
                  <span className="text-[10px] text-[#A8928D] line-through">{s.old}</span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <button
          className="w-full h-10 rounded-xl text-white text-sm font-semibold cursor-pointer"
          style={{
            background: '#C9956A',
            boxShadow: '0 4px 14px rgba(201,149,106,0.4)',
          }}
        >
          Записатися
        </button>

        <p className="text-center text-[9px] text-[#A8928D]">
          Powered by <span className="font-semibold" style={{ color: '#789A99' }}>Bookit</span>
        </p>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────── LandingHero ── */
export function LandingHero() {
  const ref = useRef(null);

  return (
    <section
      ref={ref}
      className="relative min-h-[92dvh] flex items-center overflow-hidden"
      style={{ background: '#16100C' }}
    >
      {/* Subtle radial glow */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 70% 60% at 70% 50%, rgba(201,149,106,0.08) 0%, transparent 70%)',
        }}
      />

      <div className="relative z-10 w-full max-w-5xl mx-auto px-4 pt-28 pb-16 flex flex-col md:flex-row items-center gap-12 md:gap-8">

        {/* ── LEFT: Text ── */}
        <div className="flex-1 flex flex-col items-start gap-6">

          {/* Tag */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, type: 'spring', stiffness: 280, damping: 24 }}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold uppercase tracking-widest"
            style={{
              background: 'rgba(120,154,153,0.15)',
              border: '1px solid rgba(120,154,153,0.3)',
              color: '#789A99',
            }}
          >
            Для б&apos;юті-майстрів
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 280, damping: 24 }}
            className="display-xl leading-tight text-balance"
            style={{ color: '#F5EDE8' }}
          >
            Система, що сама заповнює ваш графік.
          </motion.h1>

          {/* Subtext */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, type: 'spring', stiffness: 280, damping: 24 }}
            className="text-lg leading-relaxed max-w-lg text-balance"
            style={{ color: 'rgba(245,237,232,0.7)' }}
          >
            Перша CRM для б&apos;юті-майстра, яка не просто записує клієнтів — а заробляє для вас.
            Флеш-акції, смарт-слоти, лояльність. Поки ви зайняті.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, type: 'spring', stiffness: 280, damping: 24 }}
            className="flex flex-col sm:flex-row items-start sm:items-center gap-3"
          >
            <Link
              href="/register"
              className="inline-flex items-center gap-2.5 h-14 px-9 rounded-2xl font-bold text-lg text-white transition-colors cursor-pointer active:scale-[0.97]"
              style={{
                background: '#C9956A',
                boxShadow: '0 8px_28px rgba(201,149,106,0.4)',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#B07A52'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = '#C9956A'; }}
            >
              Спробувати безкоштовно →
            </Link>
            <Link
              href="/explore"
              className="inline-flex items-center gap-2 h-14 px-7 rounded-2xl font-semibold text-base transition-colors cursor-pointer"
              style={{
                border: '1px solid rgba(245,237,232,0.2)',
                color: 'rgba(245,237,232,0.8)',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(245,237,232,0.5)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(245,237,232,0.2)'; }}
            >
              Переглянути демо
            </Link>
          </motion.div>

          {/* Trust line */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-sm"
            style={{ color: 'rgba(245,237,232,0.4)' }}
          >
            500+ майстрів · Без кредитки · Старт за 2 хвилини
          </motion.p>

          {/* Mobile inline metrics (shown only on mobile) */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.55 }}
            className="flex md:hidden items-center gap-3 flex-wrap"
          >
            <span
              className="px-3 py-1.5 rounded-full text-xs font-semibold"
              style={{ background: 'rgba(201,149,106,0.15)', color: '#C9956A' }}
            >
              500+ майстрів
            </span>
            <span
              className="px-3 py-1.5 rounded-full text-xs font-semibold"
              style={{ background: 'rgba(92,158,122,0.15)', color: '#5C9E7A' }}
            >
              +₴4 800/міс середньо
            </span>
          </motion.div>
        </div>

        {/* ── RIGHT: Phone mockup ── */}
        <motion.div
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3, type: 'spring', stiffness: 200, damping: 28 }}
          className="hidden md:flex flex-shrink-0 relative"
          style={{ width: 340, height: 560 }}
        >
          {/* Phone */}
          <div className="absolute inset-0 flex items-center justify-center">
            <DemoPhoneCard />
          </div>

          {/* Badge 1 — top right */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5, type: 'spring', stiffness: 280, damping: 22 }}
            className="absolute"
            style={{ top: 28, right: -24 }}
          >
            <FloatingBadge dotColor="#C9956A">
              +₴4 800/міс
            </FloatingBadge>
          </motion.div>

          {/* Badge 2 — left middle */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.6, type: 'spring', stiffness: 280, damping: 22 }}
            className="absolute"
            style={{ top: '40%', left: -32 }}
          >
            <FloatingBadge dotColor="#789A99">
              98% завантаженість
            </FloatingBadge>
          </motion.div>

          {/* Badge 3 — bottom right */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.7, type: 'spring', stiffness: 280, damping: 22 }}
            className="absolute"
            style={{ bottom: 40, right: -20 }}
          >
            <FloatingBadge dotColor="#5C9E7A">
              Flash: 3 записи за 12 хв
            </FloatingBadge>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
