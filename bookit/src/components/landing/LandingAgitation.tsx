'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { XCircle, Timer, Smartphone } from 'lucide-react';

const pains = [
  {
    icon: XCircle,
    emoji: '😩',
    title: 'Клієнт скасував о 23:00',
    description:
      'Завтра вранці — порожній слот. Ви вже не встигнете нікого знайти. Гроші просто зникли.',
    color: '#C05B5B',
    bgColor: 'rgba(192, 91, 91, 0.08)',
    borderColor: 'rgba(192, 91, 91, 0.2)',
  },
  {
    icon: Timer,
    emoji: '😤',
    title: '"Дірка" 45 хвилин між записами',
    description:
      'Ні відпочити нормально, ні взяти ще клієнта. Ви просто сидите і дивитесь у стелю.',
    color: '#D4935A',
    bgColor: 'rgba(212, 147, 90, 0.08)',
    borderColor: 'rgba(212, 147, 90, 0.2)',
  },
  {
    icon: Smartphone,
    emoji: '😬',
    title: 'Відповідаєте в Direct під час роботи',
    description:
      'Клієнт у кріслі чекає. А ви, вибачившись, тикаєте в телефон — домовляєтесь про наступний запис.',
    color: '#C05B5B',
    bgColor: 'rgba(192, 91, 91, 0.08)',
    borderColor: 'rgba(192, 91, 91, 0.2)',
  },
];

export function LandingAgitation() {
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
        <p className="text-sm font-semibold text-[#C05B5B] uppercase tracking-widest mb-3">
          Звучить знайомо?
        </p>
        <h2 className="display-md text-[#2C1A14] text-balance">
          Ви втрачаєте гроші прямо зараз.{' '}
          <em className="not-italic text-[#C05B5B]">Щодня.</em>
        </h2>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {pains.map((pain, i) => {
          const Icon = pain.icon;
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 28 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: i * 0.1, type: 'spring', stiffness: 280, damping: 24 }}
              className="bento-card p-6 flex flex-col gap-4"
              style={{
                background: pain.bgColor,
                borderColor: pain.borderColor,
              }}
            >
              <div className="flex items-start justify-between">
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center"
                  style={{ background: `${pain.bgColor}` , border: `1px solid ${pain.borderColor}` }}
                >
                  <Icon size={22} style={{ color: pain.color }} />
                </div>
                <span className="text-3xl">{pain.emoji}</span>
              </div>
              <div>
                <h3 className="heading-serif text-lg text-[#2C1A14] mb-2 leading-snug">
                  {pain.title}
                </h3>
                <p className="text-sm text-[#6B5750] leading-relaxed">{pain.description}</p>
              </div>
            </motion.div>
          );
        })}
      </div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={isInView ? { opacity: 1 } : {}}
        transition={{ delay: 0.5 }}
        className="text-center text-base text-[#6B5750] mt-8 max-w-lg mx-auto text-balance"
      >
        І так — кожен тиждень. Місяць за місяцем. Поки щось не зміниться.
      </motion.p>
    </section>
  );
}
