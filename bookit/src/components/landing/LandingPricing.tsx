'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Check, Sparkles } from 'lucide-react';
import Link from 'next/link';

const plans = [
  {
    name: 'Starter',
    price: '0',
    period: '',
    label: 'Безкоштовно',
    description: 'Ідеально для старту',
    highlight: false,
    features: [
      'До 30 записів на місяць',
      'Публічна booking-сторінка',
      'Базові Mood Themes',
      'Управління послугами та товарами',
      'Водяний знак Bookit',
    ],
    cta: 'Почати безкоштовно',
    ctaHref: '/register',
  },
  {
    name: 'Pro',
    price: '349',
    period: '/міс',
    label: '',
    description: 'Для серйозного бізнесу',
    highlight: true,
    badge: 'Популярний',
    features: [
      'Необмежено записів',
      'Власний брендинг (без знаку)',
      'Аналітика та звіти',
      'CRM з фільтрами та мітками',
      'Автонагадування клієнтам',
      'Telegram-бот нотифікації',
      'Всі Mood Themes',
    ],
    cta: 'Спробувати Pro',
    ctaHref: '/register?plan=pro',
  },
  {
    name: 'Studio',
    price: '199',
    period: '/майстер/міс',
    label: '',
    description: 'Команди від 2 майстрів',
    highlight: false,
    features: [
      'Все з Pro для кожного майстра',
      'Зведена аналітика студії',
      'Мультилокації (Phase 2)',
      'Пріоритетна підтримка',
    ],
    cta: "Зв'язатися з нами",
    ctaHref: '/contact',
  },
];

export function LandingPricing() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <section ref={ref} className="py-16">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.5 }}
        className="text-center mb-10"
      >
        <h2 className="display-md text-[#2C1A14] mb-3">Прозорі ціни</h2>
        <p className="text-[#6B5750]">Почни безкоштовно, масштабуйся коли готова</p>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-start">
        {plans.map((plan, i) => (
          <motion.div
            key={plan.name}
            initial={{ opacity: 0, y: 28 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: i * 0.1, type: 'spring', stiffness: 300, damping: 24 }}
            className={`bento-card p-6 flex flex-col gap-5 relative ${
              plan.highlight
                ? 'ring-2 ring-[#789A99]/60 shadow-[0_8px_32px_rgba(120,154,153,0.22)]'
                : ''
            }`}
          >
            {plan.badge && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 flex items-center gap-1 px-3 py-1 bg-[#789A99] text-white text-xs font-semibold rounded-full shadow-md">
                <Sparkles size={10} />
                {plan.badge}
              </div>
            )}

            <div>
              <p className="text-xs font-semibold text-[#A8928D] uppercase tracking-wider mb-1">{plan.name}</p>
              <p className="text-sm text-[#6B5750]">{plan.description}</p>
            </div>

            <div className="flex items-end gap-1">
              {plan.label ? (
                <span className="heading-serif text-3xl text-[#2C1A14]">{plan.label}</span>
              ) : (
                <>
                  <span className="heading-serif text-4xl text-[#2C1A14]">{plan.price} ₴</span>
                  <span className="text-sm text-[#A8928D] mb-1">{plan.period}</span>
                </>
              )}
            </div>

            <ul className="flex flex-col gap-2">
              {plan.features.map((feature) => (
                <li key={feature} className="flex items-start gap-2.5">
                  <Check size={14} className="text-[#789A99] mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-[#6B5750]">{feature}</span>
                </li>
              ))}
            </ul>

            <Link
              href={plan.ctaHref}
              className={`mt-auto flex items-center justify-center h-12 rounded-2xl font-semibold text-sm transition-colors ${
                plan.highlight
                  ? 'bg-[#789A99] text-white hover:bg-[#5C7E7D] shadow-[0_4px_14px_rgba(120,154,153,0.35)]'
                  : 'bg-white/70 text-[#2C1A14] hover:bg-white/90'
              }`}
            >
              {plan.cta}
            </Link>
          </motion.div>
        ))}
      </div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={isInView ? { opacity: 1 } : {}}
        transition={{ delay: 0.5 }}
        className="text-center text-sm text-[#A8928D] mt-6"
      >
        + 3–5% комісія з продажу товарів через платформу
      </motion.p>
    </section>
  );
}
