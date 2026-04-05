'use client';

import { useRef, useState, useEffect } from 'react';
import { motion, useInView } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight, Sparkles } from 'lucide-react';

export function LandingFooterCTA() {
  const ref = useRef(null);
  const [todayCount, setTodayCount] = useState<number | null>(null);

  useEffect(() => {
    setTodayCount(Math.floor(Math.random() * 5) + 3);
  }, []);

  const isInView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <section ref={ref} className="py-16">
      <motion.div
        initial={{ opacity: 0, y: 28, scale: 0.98 }}
        animate={isInView ? { opacity: 1, y: 0, scale: 1 } : {}}
        transition={{ type: 'spring', stiffness: 280, damping: 24 }}
        className="max-w-5xl mx-auto rounded-3xl px-8 sm:px-16 py-16 text-center flex flex-col items-center gap-7"
        style={{ background: '#16100C' }}
      >
        {/* Decorative icon */}
        <motion.div
          initial={{ opacity: 0, scale: 0.7 }}
          animate={isInView ? { opacity: 1, scale: 1 } : {}}
          transition={{ delay: 0.15, type: 'spring', stiffness: 300, damping: 22 }}
        >
          <Sparkles size={36} style={{ color: '#C9956A' }} />
        </motion.div>

        <div>
          <h2
            className="display-md mb-4 text-balance"
            style={{ color: '#F5EDE8' }}
          >
            Ваш наступний клієнт вже шукає майстра.
          </h2>
          <p
            className="max-w-md mx-auto leading-relaxed text-lg text-balance"
            style={{ color: 'rgba(245,237,232,0.65)' }}
          >
            500+ майстрів вже використовують Bookit для автоматичного заповнення
            розкладу та утримання клієнтів. Приєднуйтесь — налаштування займе менше 2 хвилин.
          </p>
        </div>

        <Link
          href="/register"
          className="inline-flex items-center gap-2.5 h-14 px-10 rounded-2xl font-bold text-lg text-white transition-colors cursor-pointer active:scale-[0.97]"
          style={{
            background: '#C9956A',
            boxShadow: '0 8px 24px rgba(201,149,106,0.4)',
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#B07A52'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = '#C9956A'; }}
        >
          Почати заробляти більше — безкоштовно
          <ArrowRight size={20} />
        </Link>

        <div className="flex flex-col items-center gap-1">
          <p className="text-sm" style={{ color: 'rgba(245,237,232,0.4)' }}>
            Стартовий план — назавжди безкоштовно · Без кредитної картки
          </p>
          <p className="text-xs" style={{ color: 'rgba(245,237,232,0.5)' }}>
            Сьогодні вже зареєструвалось{' '}
            <span className="font-semibold" style={{ color: '#C9956A' }}>
              {todayCount ?? '…'} майстрів
            </span>
          </p>
        </div>
      </motion.div>
    </section>
  );
}
