'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Bell, CalendarCheck, Clock } from 'lucide-react';

const solutions = [
  {
    icon: Bell,
    title: 'Скасування = нові клієнти',
    description:
      'Хтось скасував запис — Bookit миттєво надсилає Push-сповіщення всім вашим клієнтам про вільне вікно зі знижкою. Слот закривається за хвилини.',
    color: '#5C9E7A',
    bgColor: 'rgba(92, 158, 122, 0.1)',
    borderColor: 'rgba(92, 158, 122, 0.2)',
    tag: 'Флеш-акції',
  },
  {
    icon: CalendarCheck,
    title: 'Жодної "дірки" у графіку',
    description:
      'Смарт-слоти не дозволяють з\'явитись незручному проміжку. Алгоритм будує ваш день як ідеальний тетріс — без порожнього місця.',
    color: '#789A99',
    bgColor: 'rgba(120, 154, 153, 0.1)',
    borderColor: 'rgba(120, 154, 153, 0.2)',
    tag: 'Смарт-слоти',
  },
  {
    icon: Clock,
    title: 'Запис 24/7 без вас',
    description:
      'Клієнти самостійно записуються о будь-якій годині — навіть коли ви спите. Ви отримуєте Telegram-сповіщення і просто приходите на роботу.',
    color: '#5C9E7A',
    bgColor: 'rgba(92, 158, 122, 0.1)',
    borderColor: 'rgba(92, 158, 122, 0.2)',
    tag: 'Автозапис',
  },
];

export function LandingMagic() {
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
        <p className="text-sm font-semibold text-[#5C9E7A] uppercase tracking-widest mb-3">
          Рішення
        </p>
        <h2 className="display-md text-[#2C1A14] text-balance">
          Bookit вирішує це{' '}
          <em className="not-italic text-[#789A99]">автоматично.</em>{' '}
          Поки ви зайняті.
        </h2>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {solutions.map((s, i) => {
          const Icon = s.icon;
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 28 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: i * 0.1, type: 'spring', stiffness: 280, damping: 24 }}
              className="bento-card p-6 flex flex-col gap-4"
              style={{ background: s.bgColor, borderColor: s.borderColor }}
            >
              <div className="flex items-start justify-between">
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center"
                  style={{ background: 'rgba(255,255,255,0.6)', border: `1px solid ${s.borderColor}` }}
                >
                  <Icon size={22} style={{ color: s.color }} />
                </div>
                <span
                  className="text-xs font-semibold px-2.5 py-1 rounded-full"
                  style={{ background: 'rgba(255,255,255,0.7)', color: s.color }}
                >
                  {s.tag}
                </span>
              </div>
              <div>
                <h3 className="heading-serif text-lg text-[#2C1A14] mb-2 leading-snug">
                  {s.title}
                </h3>
                <p className="text-sm text-[#6B5750] leading-relaxed">{s.description}</p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
