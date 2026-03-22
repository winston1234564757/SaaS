'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight, Star, Zap } from 'lucide-react';

export function LandingHero() {
  return (
    <section className="pt-28 pb-12 flex flex-col items-center text-center">

      {/* Social proof chip */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bento-card mb-10"
      >
        <div className="flex -space-x-1.5">
          {['💅', '✂️', '👁️', '💄'].map((emoji, i) => (
            <div
              key={i}
              className="w-7 h-7 rounded-full flex items-center justify-center text-sm border-2 border-white/80"
              style={{ background: 'rgba(255,210,194,0.6)' }}
            >
              {emoji}
            </div>
          ))}
        </div>
        <span className="text-sm text-[#2C1A14]">
          <strong>500+</strong> майстрів вже заробляють більше
        </span>
        <div className="flex gap-0.5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star key={i} size={11} className="fill-[#D4935A] text-[#D4935A]" />
          ))}
        </div>
      </motion.div>

      {/* Main headline */}
      <motion.h1
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.18, type: 'spring', stiffness: 260, damping: 22 }}
        className="display-xl text-[#2C1A14] max-w-3xl text-balance leading-tight"
      >
        Ваш бізнес не повинен{' '}
        <em className="not-italic text-[#789A99]">забирати весь ваш час.</em>
      </motion.h1>

      {/* Sub */}
      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.28 }}
        className="mt-6 text-xl text-[#6B5750] max-w-xl leading-relaxed text-balance"
      >
        Перша CRM, яка не просто записує клієнтів, а сама заповнює порожні вікна,
        продає палаючі слоти і повертає втрачених клієнтів.{' '}
        <span className="text-[#2C1A14] font-medium">Поки ви відпочиваєте.</span>
      </motion.p>

      {/* CTA */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.36 }}
        className="mt-9 flex flex-col sm:flex-row items-center gap-3"
      >
        <Link
          href="/register"
          className="inline-flex items-center gap-2.5 h-14 px-9 rounded-2xl bg-[#789A99] text-white font-semibold text-lg hover:bg-[#5C7E7D] transition-colors shadow-[0_8px_28px_rgba(120,154,153,0.4)] active:scale-[0.97]"
        >
          Спробувати безкоштовно
          <ArrowRight size={19} />
        </Link>
        <span className="text-sm text-[#A8928D]">Без кредитної картки · Старт за 2 хвилини</span>
      </motion.div>

      {/* Demo mockup */}
      <motion.div
        initial={{ opacity: 0, y: 44, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ delay: 0.46, type: 'spring', stiffness: 200, damping: 24 }}
        className="mt-16 w-full max-w-[380px] mx-auto"
      >
        <DemoMockup />
      </motion.div>
    </section>
  );
}

function DemoMockup() {
  return (
    <div className="bento-card p-5 text-left">
      {/* Flash deal banner */}
      <div
        className="flex items-center gap-2 px-3 py-2 rounded-2xl mb-4 text-sm font-semibold"
        style={{ background: 'rgba(212,147,90,0.12)', color: '#D4935A' }}
      >
        <Zap size={14} className="fill-[#D4935A] flex-shrink-0" />
        <span>Флеш-акція · -25% до 20:00 · лишилось 2 місця</span>
      </div>

      {/* Master header */}
      <div className="flex items-center gap-3.5 mb-5">
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0"
          style={{ background: 'rgba(255,210,194,0.5)' }}
        >
          💅
        </div>
        <div>
          <h3 className="heading-serif text-lg text-[#2C1A14] leading-tight">
            Анна Коваленко
          </h3>
          <p className="text-sm text-[#6B5750] mt-0.5">Манікюр · Київ</p>
          <div className="flex items-center gap-1 mt-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} size={10} className="fill-[#D4935A] text-[#D4935A]" />
            ))}
            <span className="text-xs text-[#A8928D] ml-1">4.9 (128)</span>
          </div>
        </div>
      </div>

      {/* Services */}
      <p className="text-[10px] font-semibold text-[#A8928D] uppercase tracking-widest mb-2.5">
        Послуги
      </p>
      <div className="grid grid-cols-2 gap-2 mb-4">
        {[
          { name: 'Класичний манікюр', price: '375 ₴', oldPrice: '500 ₴', time: '60 хв', popular: true },
          { name: 'Покриття гелем', price: 'від 525 ₴', time: '90 хв', popular: false },
          { name: 'Педикюр', price: '650 ₴', time: '75 хв', popular: false },
          { name: 'Дизайн', price: '50–200 ₴', time: '20 хв', popular: false },
        ].map((s, i) => (
          <div
            key={i}
            className={`rounded-2xl p-3 border transition-all ${
              s.popular
                ? 'col-span-2 border-[#D4935A]/30'
                : 'border-white/60'
            }`}
            style={{
              background: s.popular
                ? 'rgba(212,147,90,0.08)'
                : 'rgba(255,255,255,0.5)',
            }}
          >
            <p className="text-sm font-semibold text-[#2C1A14] leading-snug">{s.name}</p>
            <div className="flex items-center justify-between mt-1">
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-bold text-[#D4935A]">{s.price}</span>
                {s.oldPrice && (
                  <span className="text-xs text-[#A8928D] line-through">{s.oldPrice}</span>
                )}
              </div>
              <span className="text-xs text-[#A8928D]">{s.time}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Loyalty points */}
      <div
        className="flex items-center justify-between px-3 py-2 rounded-2xl mb-3 text-xs"
        style={{ background: 'rgba(92,158,122,0.1)' }}
      >
        <span className="text-[#5C9E7A] font-medium">🎁 Ваші бонуси: 240 балів</span>
        <span className="text-[#5C9E7A] font-semibold">= 48 ₴</span>
      </div>

      {/* CTA */}
      <button className="w-full h-12 rounded-2xl bg-[#789A99] text-white font-semibold text-sm shadow-[0_4px_14px_rgba(120,154,153,0.35)] transition-colors hover:bg-[#5C7E7D]">
        Записатися
      </button>

      <p className="text-center text-[10px] text-[#A8928D] mt-3">
        Powered by <span className="font-semibold text-[#789A99]">Bookit</span>
      </p>
    </div>
  );
}
