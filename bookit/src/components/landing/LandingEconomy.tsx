'use client';

import { useState, useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { TrendingDown, ArrowRight, CalendarDays, Calendar, CreditCard } from 'lucide-react';
import Link from 'next/link';

function clamp(val: number, min: number, max: number) {
  return Math.max(min, Math.min(max, val));
}

export function LandingEconomy() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });

  const [emptySlots, setEmptySlots] = useState(2);
  const [weeksPerMonth, setWeeksPerMonth] = useState(4);
  const [avgPrice, setAvgPrice] = useState(500);

  const monthlyLoss = emptySlots * weeksPerMonth * avgPrice;
  const formattedLoss = monthlyLoss.toLocaleString('uk-UA');
  const monthsToPayoff = monthlyLoss > 0 ? Math.ceil(700 / (monthlyLoss / 1)) : 1;

  return (
    <section ref={ref} className="py-20">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.5 }}
        className="text-center mb-10"
      >
        <p
          className="text-xs font-semibold uppercase tracking-widest mb-4"
          style={{ color: '#D4935A' }}
        >
          Математика
        </p>
        <h2 className="display-md text-[#2C1A14] text-balance">
          Скільки ви втрачаєте{' '}
          <em className="not-italic text-[#C05B5B]">без Bookit?</em>
        </h2>
        <p className="text-sm text-[#A8928D] mt-2">Введіть свої цифри — побачте реальні втрати</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 32, scale: 0.97 }}
        animate={isInView ? { opacity: 1, y: 0, scale: 1 } : {}}
        transition={{ delay: 0.1, type: 'spring', stiffness: 260, damping: 24 }}
        className="bento-card p-8 sm:p-10 max-w-2xl mx-auto"
        style={{
          background:
            'linear-gradient(140deg, rgba(120,154,153,0.08) 0%, rgba(255,255,255,0.7) 100%)',
        }}
      >
        {/* Calculator steps */}
        <div className="flex flex-col gap-3 mb-8">
          {/* Empty slots */}
          <div className="flex items-center gap-3 p-4 rounded-2xl bg-white/50">
            <CalendarDays size={22} style={{ color: '#789A99' }} className="flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-[#6B5750]">Порожніх слотів на тиждень</p>
            </div>
            <input
              type="number"
              min={1}
              max={40}
              value={emptySlots}
              onChange={e => setEmptySlots(clamp(Number(e.target.value) || 1, 1, 40))}
              className="heading-serif text-xl text-[#2C1A14] w-16 text-right bg-transparent border-b-2 border-[#789A99]/40 focus:border-[#789A99] outline-none"
            />
          </div>

          <div className="flex items-center justify-center text-[#A8928D]">
            <span className="text-lg font-light">×</span>
          </div>

          {/* Weeks */}
          <div className="flex items-center gap-3 p-4 rounded-2xl bg-white/50">
            <Calendar size={22} style={{ color: '#789A99' }} className="flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-[#6B5750]">Тижнів на місяць</p>
            </div>
            <input
              type="number"
              min={1}
              max={5}
              value={weeksPerMonth}
              onChange={e => setWeeksPerMonth(clamp(Number(e.target.value) || 1, 1, 5))}
              className="heading-serif text-xl text-[#2C1A14] w-16 text-right bg-transparent border-b-2 border-[#789A99]/40 focus:border-[#789A99] outline-none"
            />
          </div>

          <div className="flex items-center justify-center text-[#A8928D]">
            <span className="text-lg font-light">×</span>
          </div>

          {/* Avg price */}
          <div className="flex items-center gap-3 p-4 rounded-2xl bg-white/50">
            <CreditCard size={22} style={{ color: '#789A99' }} className="flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-[#6B5750]">Середній чек</p>
            </div>
            <div className="flex items-baseline gap-1">
              <input
                type="number"
                min={50}
                max={10000}
                step={50}
                value={avgPrice}
                onChange={e => setAvgPrice(clamp(Number(e.target.value) || 50, 50, 10000))}
                className="heading-serif text-xl text-[#2C1A14] w-20 text-right bg-transparent border-b-2 border-[#789A99]/40 focus:border-[#789A99] outline-none"
              />
              <span className="text-sm text-[#A8928D]">₴</span>
            </div>
          </div>

          <div className="flex items-center justify-center text-[#A8928D]">
            <span className="text-lg font-light">=</span>
          </div>

          {/* Result */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={isInView ? { opacity: 1, scale: 1 } : {}}
            transition={{ delay: 0.4, type: 'spring', stiffness: 260, damping: 22 }}
            className="flex items-center gap-3 p-5 rounded-2xl"
            style={{ background: 'rgba(192,91,91,0.1)', border: '1px solid rgba(192,91,91,0.2)' }}
          >
            <TrendingDown size={24} className="text-[#C05B5B] flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-[#C05B5B]">Втрачаєте щомісяця</p>
            </div>
            <span className="display-lg text-[#C05B5B]">{formattedLoss} ₴</span>
          </motion.div>
        </div>

        {/* Divider */}
        <div className="border-t border-white/60 my-6" />

        {/* Value prop */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.55 }}
          className="text-center"
        >
          <p className="text-base text-[#6B5750] leading-relaxed mb-2 text-balance">
            <span className="font-semibold text-[#789A99]">Pro-план Bookit — 700 ₴.</span>{' '}
            {monthlyLoss >= 700
              ? (
                <>
                  Він окупить себе після ПЕРШОГО врятованого слота.{' '}
                  <span className="font-semibold text-[#2C1A14]">Решту 29 днів — чистий прибуток.</span>
                </>
              )
              : (
                <>
                  Навіть один врятований слот покриває підписку на{' '}
                  <span className="font-semibold text-[#2C1A14]">{monthsToPayoff} міс.</span>
                </>
              )}
          </p>
          <p className="text-sm text-[#A8928D] text-balance">
            700 ₴ — це вартість одного манікюру. Один флеш-слот = повна окупність за місяць.
          </p>

          <Link
            href="/register?plan=pro"
            className="inline-flex items-center gap-2 mt-6 h-12 px-7 rounded-2xl text-white font-semibold text-sm transition-colors cursor-pointer"
            style={{
              background: '#C9956A',
              boxShadow: '0 4px 14px rgba(201,149,106,0.35)',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#B07A52'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = '#C9956A'; }}
          >
            Спробувати Pro безкоштовно
            <ArrowRight size={16} />
          </Link>
        </motion.div>
      </motion.div>
    </section>
  );
}
