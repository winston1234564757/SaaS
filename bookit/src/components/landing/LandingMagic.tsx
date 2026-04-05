'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { UserPlus, Share2, TrendingUp } from 'lucide-react';

const steps = [
  {
    number: '01',
    icon: UserPlus,
    title: 'Реєструєшся',
    description: 'Заповнюєш профіль, додаєш послуги та розклад. Займає 2 хвилини.',
  },
  {
    number: '02',
    icon: Share2,
    title: 'Ділишся посиланням',
    description:
      'Ставиш своє bookit-посилання в bio Instagram або TikTok. Клієнти самі знаходять вільний час.',
  },
  {
    number: '03',
    icon: TrendingUp,
    title: 'Отримуєш записи та гроші',
    description:
      'Смарт-слоти, флеш-акції та програма лояльності працюють автоматично — 24/7.',
  },
];

export function LandingMagic() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <section ref={ref} className="py-20">
      {/* Title */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.5 }}
        className="text-center mb-12"
      >
        <p
          className="text-xs font-semibold uppercase tracking-widest mb-4"
          style={{ color: '#789A99' }}
        >
          Як це працює
        </p>
        <h2 className="display-md text-[#2C1A14] text-balance">
          Три кроки до першого запису.
        </h2>
      </motion.div>

      {/* Steps grid */}
      <div className="relative grid grid-cols-1 sm:grid-cols-3 gap-4 items-start">
        {/* Dashed connector line — desktop only */}
        <div
          className="hidden sm:block absolute top-14 left-[calc(16.67%+1rem)] right-[calc(16.67%+1rem)] pointer-events-none"
          style={{ borderTop: '1px dashed rgba(201,149,106,0.3)', zIndex: 0 }}
        />

        {steps.map((step, i) => {
          const Icon = step.icon;
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 28 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: i * 0.12, type: 'spring', stiffness: 280, damping: 24 }}
              className="bento-card p-6 flex flex-col gap-4 relative z-10"
            >
              {/* Step number */}
              <span
                className="font-display text-5xl font-bold leading-none"
                style={{ color: '#C9956A', opacity: 0.9 }}
              >
                {step.number}
              </span>

              {/* Icon */}
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: 'rgba(120,154,153,0.1)' }}
              >
                <Icon size={20} style={{ color: '#789A99' }} />
              </div>

              {/* Text */}
              <div>
                <h3 className="heading-serif text-lg text-[#2C1A14] mb-2 leading-snug">
                  {step.title}
                </h3>
                <p className="text-sm text-[#6B5750] leading-relaxed">
                  {step.description}
                </p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
