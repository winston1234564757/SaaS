'use client';

import { useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, useInView } from 'framer-motion';
import { Check, Sparkles } from 'lucide-react';

const plans = [
  {
    name: 'Starter',
    price: '0',
    period: '',
    label: 'Безкоштовно',
    description: 'Для тих, хто тільки починає. Без кредитної картки.',
    highlight: false,
    features: [
      'До 30 записів на місяць',
      'Публічна booking-сторінка',
      'Управління послугами та розкладом',
      'Базовий CRM клієнтів',
      'Водяний знак Bookit',
    ],
    cta: 'Почати безкоштовно',
  },
  {
    name: 'Pro',
    price: '700',
    period: '/міс',
    label: '',
    description: 'Окупається після ПЕРШОГО врятованого слота.',
    highlight: true,
    badge: 'Хіт продажу',
    anchor: '700 ₴ = вартість одного манікюру. Один флеш-слот — і місяць окупився.',
    features: [
      'Необмежені записи',
      'Смарт-слоти та динамічне ціноутворення',
      'Флеш-акції та термінові пропозиції',
      'Програма лояльності та кешбек',
      'Реферальна програма для клієнтів',
      'Telegram-сповіщення для вас і клієнтів',
      'PWA — додаток без App Store',
      'Детальна аналітика та CRM',
      'Власний брендинг (без знаку Bookit)',
      'CSV-експорт клієнтів та записів',
    ],
    cta: 'Спробувати Pro',
  },
  {
    name: 'Studio',
    price: '299',
    period: '/майстер/міс',
    label: '',
    description: 'Для салонів та команд від 2 майстрів',
    highlight: false,
    disabled: true,
    features: [
      'Усе з Pro для кожного майстра',
      'Спільна сторінка салону',
      'Єдина база клієнтів студії',
      'Управління розкладом команди',
      'Розділення прав (власник / адмін / майстер)',
      'Зведена аналітика по всіх майстрах',
      'Пріоритетна підтримка',
    ],
    cta: 'Очікується',
  },
];

export function LandingPricing() {
  const router = useRouter();
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });

  function handleSelectPlan(planId: string) {
    if (planId !== 'starter') {
      document.cookie = `intended_plan=${planId}; path=/; max-age=3600; SameSite=Lax`;
    } else {
      document.cookie = 'intended_plan=; path=/; max-age=0';
    }
    router.push('/register');
  }

  return (
    <section ref={ref} className="py-16">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.5 }}
        className="text-center mb-10"
      >
        <h2 className="display-md text-[#2C1A14] mb-3 text-balance">Прозорі ціни без сюрпризів</h2>
        <p className="text-[#6B5750] text-lg text-balance">
          Починайте безкоштовно, масштабуйтесь коли готові
        </p>
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
                ? 'ring-2 ring-[#C9956A]/50 shadow-[0_8px_32px_rgba(201,149,106,0.2)]'
                : ''
            }`}
          >
            {plan.badge && (
              <div
                className="absolute -top-3 left-1/2 -translate-x-1/2 flex items-center gap-1 px-3 py-1 text-white text-xs font-semibold rounded-full shadow-md whitespace-nowrap"
                style={{ background: '#C9956A' }}
              >
                <Sparkles size={10} />
                {plan.badge}
              </div>
            )}

            <div>
              <p className="text-xs font-semibold text-[#A8928D] uppercase tracking-wider mb-1">{plan.name}</p>
              <p className="text-sm text-[#6B5750] leading-snug">{plan.description}</p>
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

            {'anchor' in plan && plan.anchor && (
              <p className="text-xs text-[#789A99] leading-relaxed px-1 text-balance">
                {plan.anchor as string}
              </p>
            )}

            <button
              type="button"
              onClick={() => !plan.disabled && handleSelectPlan(plan.name.toLowerCase())}
              disabled={'disabled' in plan && plan.disabled}
              className={`mt-auto flex items-center justify-center h-12 rounded-2xl font-semibold text-sm transition-colors cursor-pointer ${
                'disabled' in plan && plan.disabled
                  ? 'bg-white/50 text-[#A8928D] cursor-not-allowed'
                  : ''
              }`}
              style={
                !('disabled' in plan && plan.disabled)
                  ? plan.highlight
                    ? {
                        background: '#C9956A',
                        color: '#fff',
                        boxShadow: '0 4px 14px rgba(201,149,106,0.35)',
                      }
                    : { background: 'rgba(255,255,255,0.7)', color: '#2C1A14' }
                  : undefined
              }
              onMouseEnter={e => {
                if (!('disabled' in plan && plan.disabled) && plan.highlight) {
                  (e.currentTarget as HTMLElement).style.background = '#B07A52';
                }
              }}
              onMouseLeave={e => {
                if (!('disabled' in plan && plan.disabled) && plan.highlight) {
                  (e.currentTarget as HTMLElement).style.background = '#C9956A';
                }
              }}
            >
              {plan.cta}
            </button>
          </motion.div>
        ))}
      </div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={isInView ? { opacity: 1 } : {}}
        transition={{ delay: 0.5 }}
        className="text-center text-sm text-[#A8928D] mt-6"
      >
        Стартовий план — назавжди безкоштовно. Без прихованих платежів.
      </motion.p>
    </section>
  );
}
