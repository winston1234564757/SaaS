'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export function LandingFooterCTA() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <section ref={ref} className="py-16">
      <motion.div
        initial={{ opacity: 0, y: 28, scale: 0.98 }}
        animate={isInView ? { opacity: 1, y: 0, scale: 1 } : {}}
        transition={{ type: 'spring', stiffness: 280, damping: 24 }}
        className="bento-card p-10 sm:p-14 text-center flex flex-col items-center gap-7"
        style={{
          background:
            'linear-gradient(140deg, rgba(120,154,153,0.1) 0%, rgba(255,210,194,0.35) 60%, rgba(255,255,255,0.5) 100%)',
        }}
      >
        <span className="text-6xl">🚀</span>

        <div>
          <h2 className="display-md text-[#2C1A14] mb-3 text-balance">
            Ваш наступний клієнт вже шукає майстра
          </h2>
          <p className="text-[#6B5750] max-w-md mx-auto leading-relaxed text-lg text-balance">
            500+ майстрів вже використовують Bookit для автоматичного заповнення
            розкладу та утримання клієнтів. Приєднуйтесь — налаштування займе менше 2 хвилин.
          </p>
        </div>

        <Link
          href="/register"
          className="inline-flex items-center gap-2.5 h-14 px-10 rounded-2xl bg-[#789A99] text-white font-bold text-lg hover:bg-[#5C7E7D] transition-colors shadow-[0_8px_24px_rgba(120,154,153,0.4)] active:scale-[0.97]"
        >
          Почати заробляти більше
          <ArrowRight size={20} />
        </Link>

        <p className="text-sm text-[#A8928D]">
          Стартовий план — назавжди безкоштовно · Без кредитної картки
        </p>
      </motion.div>
    </section>
  );
}
