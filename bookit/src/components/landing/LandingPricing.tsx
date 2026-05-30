'use client';

import { useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, useInView, useScroll, useTransform } from 'framer-motion';
import { useIsDesktop } from '@/hooks/useIsDesktop';
import { Check } from 'lucide-react';
import { LandingSplitHeading } from '@/components/landing/LandingSplitHeading';

const spring = { type: 'spring', stiffness: 240, damping: 26 } as const;
const easeOut: [number, number, number, number] = [0.22, 1, 0.36, 1];

const PLANS = [
  {
    name: 'Starter',
    price: '0',
    period: 'назавжди',
    description: 'Для старту. Без обмежень по часу.',
    features: [
      'До 40 записів на місяць',
      'Публічна сторінка',
      'Telegram-сповіщення',
      'Базова аналітика',
    ],
    cta: 'Почати безкоштовно',
    accent: false,
  },
  {
    name: 'Pro',
    price: '700',
    period: 'місяць',
    description: 'Для майстра, який хоче більше.',
    features: [
      'Необмежені записи',
      'Smart Slots + Флеш-акції',
      'Програма лояльності',
      'CRM клієнтів з нотатками',
      'Розширена аналітика',
      'Пріоритетна підтримка',
    ],
    cta: 'Спробувати Pro',
    accent: true,
  },
  {
    name: 'Studio',
    price: '299',
    period: 'майстер / місяць',
    description: 'Для студій від 2 майстрів.',
    features: [
      'Все з Pro для кожного майстра',
      'Управління командою',
      'Загальна аналітика студії',
      'Білий лейбл (ваш бренд)',
      'Виділений менеджер',
    ],
    cta: 'Обговорити Studio',
    accent: false,
  },
];

export function LandingPricing() {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  const router = useRouter();

  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const isDesktop = useIsDesktop();
  const headingYDesktop = useTransform(scrollYProgress, [0, 1], ['0%', '-14%']);
  const headingYMobile = useTransform(scrollYProgress, [0, 1], ['0%', '-4%']);
  const headingY = isDesktop ? headingYDesktop : headingYMobile;

  return (
    <section
      id="pricing"
      ref={ref}
      className="py-20 sm:py-36 px-4 sm:px-6 lg:px-12"
      style={{ background: 'var(--l-bg-alt)' }}
    >
      <div className="max-w-7xl mx-auto">
        <motion.div className="text-center mb-16" style={{ y: headingY }}>
          <motion.span
            initial={{ opacity: 0, y: 12, filter: 'blur(8px)' }}
            animate={inView ? { opacity: 1, y: 0, filter: 'blur(0px)' } : {}}
            transition={{ ...spring, delay: 0.05 }}
            className="inline-block text-[11px] font-semibold uppercase tracking-[0.15em] mb-5"
            style={{ color: 'var(--l-indigo)' }}
          >
            Тарифи
          </motion.span>
          <LandingSplitHeading
            text="Оберіть свій план."
            className="font-[family-name:var(--font-cormorant)] font-semibold leading-[0.95] tracking-tight"
            style={{ fontSize: 'clamp(2.2rem,4.5vw,3.8rem)', color: 'var(--l-ink)' }}
            stagger={80}
          />
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {PLANS.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 32, scale: 0.97 }}
              animate={inView ? { opacity: 1, y: 0, scale: 1 } : {}}
              transition={{ duration: 0.9, ease: easeOut, delay: 0.12 + i * 0.1 }}
              className={plan.accent ? 'md:-mt-4 md:mb-4' : ''}
            >
              <div
                className="p-1.5 rounded-[1.75rem] h-full"
                style={{
                  background: plan.accent ? 'var(--l-accent)' : 'rgba(26,23,16,0.03)',
                  border: `1px solid ${plan.accent ? 'var(--l-accent)' : 'var(--l-border)'}`,
                  boxShadow: plan.accent ? '0 24px 64px rgba(99,102,241,0.28)' : 'none',
                }}
              >
                <div
                  className="rounded-[calc(1.75rem-0.375rem)] p-8 h-full flex flex-col"
                  style={{
                    background: plan.accent ? 'var(--l-accent)' : 'var(--l-surface)',
                    boxShadow: plan.accent ? 'none' : 'inset 0 1px 1px rgba(255,255,255,0.9)',
                  }}
                >
                  <p
                    className="text-[11px] font-semibold uppercase tracking-widest mb-4"
                    style={{ color: plan.accent ? 'color-mix(in srgb, var(--l-text-on-dark) 60%, transparent)' : 'var(--l-muted-2)' }}
                  >
                    {plan.name}
                  </p>

                  <div className="mb-2">
                    <span
                      className="font-[family-name:var(--font-cormorant)] font-semibold leading-none"
                      style={{
                        fontSize: 'clamp(2.5rem,5vw,3.5rem)',
                        color: plan.accent ? 'var(--l-text-on-dark)' : 'var(--l-ink)',
                      }}
                    >
                      {plan.price === '0' ? 'Безкоштовно' : `₴${plan.price}`}
                    </span>
                  </div>
                  <p
                    className="text-sm mb-2"
                    style={{ color: plan.accent ? 'var(--l-muted-on-dark)' : 'var(--l-muted-2)' }}
                  >
                    {plan.period}
                  </p>
                  <p
                    className="text-sm leading-relaxed mb-8"
                    style={{ color: plan.accent ? 'color-mix(in srgb, var(--l-text-on-dark) 75%, transparent)' : 'var(--l-muted)' }}
                  >
                    {plan.description}
                  </p>

                  <ul className="flex flex-col gap-3 flex-1 mb-8">
                    {plan.features.map((f, fi) => (
                      <motion.li
                        key={fi}
                        initial={{ opacity: 0, x: -8 }}
                        animate={inView ? { opacity: 1, x: 0 } : {}}
                        transition={{ duration: 0.7, ease: easeOut, delay: 0.32 + i * 0.1 + fi * 0.055 }}
                        className="flex items-start gap-3"
                      >
                        <div
                          className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                          style={{
                            background: plan.accent ? 'color-mix(in srgb, var(--l-text-on-dark) 18%, transparent)' : 'color-mix(in srgb, var(--l-indigo-glow) 10%, transparent)',
                          }}
                          aria-hidden="true"
                        >
                          <Check
                            size={11}
                            style={{ color: plan.accent ? 'var(--l-text-on-dark)' : 'var(--l-accent)' }}
                          />
                        </div>
                        <span
                          className="text-sm leading-snug"
                          style={{ color: plan.accent ? 'rgba(255,255,255,0.85)' : 'var(--l-ink-2)' }}
                        >
                          {f}
                        </span>
                      </motion.li>
                    ))}
                  </ul>

                  <button
                    onClick={() => router.push('/register')}
                    className="w-full h-12 rounded-full font-semibold text-sm transition-all active:scale-[0.97]"
                    style={
                      plan.accent
                        ? {
                            background: 'var(--l-surface)',
                            color: 'var(--l-accent)',
                            boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
                          }
                        : {
                            background: 'transparent',
                            color: 'var(--l-ink)',
                            border: '1.5px solid var(--l-border-2)',
                          }
                    }
                  >
                    {plan.cta}
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ ...spring, delay: 0.62 }}
          className="text-center text-sm mt-8"
          style={{ color: 'var(--l-muted)' }}
        >
          Всі тарифи без прихованих комісій. Змінити або скасувати — в два кліки.
        </motion.p>
      </div>
    </section>
  );
}
