'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { XCircle, Clock, MessageCircle } from 'lucide-react';

const pains = [
  {
    icon: XCircle,
    title: 'Клієнт скасував о 23:00',
    description:
      'Завтра вранці — порожній слот. Ви вже не встигнете нікого знайти. Гроші просто зникли.',
  },
  {
    icon: Clock,
    title: '"Дірка" 45 хвилин між записами',
    description:
      'Ні відпочити нормально, ні взяти ще клієнта. Ви просто сидите і дивитесь у стелю.',
  },
  {
    icon: MessageCircle,
    title: 'Відповідаєте в Direct під час роботи',
    description:
      'Клієнт у кріслі чекає. А ви тикаєте в телефон — домовляєтесь про наступний запис.',
  },
];

export function LandingAgitation() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <section
      ref={ref}
      className="py-20"
      style={{ background: '#1E1410' }}
    >
      <div className="max-w-5xl mx-auto px-4">
        {/* Title block */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <p
            className="text-xs font-semibold uppercase tracking-widest mb-4"
            style={{ color: '#C05B5B' }}
          >
            Знайоме?
          </p>
          <h2 className="display-md text-balance" style={{ color: '#F5EDE8' }}>
            Ви втрачаєте гроші прямо зараз.{' '}
            <em className="not-italic" style={{ color: '#C05B5B' }}>Щодня.</em>
          </h2>
        </motion.div>

        {/* Pain cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {pains.map((pain, i) => {
            const Icon = pain.icon;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 28 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: i * 0.1, type: 'spring', stiffness: 280, damping: 24 }}
                className="flex flex-col gap-4 p-6 rounded-3xl"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(192,91,91,0.2)',
                }}
              >
                <div
                  className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0"
                  style={{
                    background: 'rgba(192,91,91,0.1)',
                    border: '1px solid rgba(192,91,91,0.2)',
                  }}
                >
                  <Icon size={20} style={{ color: '#C05B5B' }} />
                </div>
                <div>
                  <h3
                    className="heading-serif text-lg mb-2 leading-snug"
                    style={{ color: '#F5EDE8' }}
                  >
                    {pain.title}
                  </h3>
                  <p
                    className="text-sm leading-relaxed"
                    style={{ color: 'rgba(245,237,232,0.65)' }}
                  >
                    {pain.description}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Bottom line */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ delay: 0.5 }}
          className="text-center text-base mt-10 max-w-lg mx-auto text-balance"
          style={{ color: 'rgba(245,237,232,0.5)' }}
        >
          І так — кожен тиждень. Місяць за місяцем. Поки щось не зміниться.
        </motion.p>
      </div>
    </section>
  );
}
