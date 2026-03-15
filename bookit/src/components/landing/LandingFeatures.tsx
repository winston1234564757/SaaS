'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Zap, ShoppingBag, RefreshCw } from 'lucide-react';

const features = [
  {
    icon: Zap,
    title: 'Запис за 15 секунд',
    description: 'Клієнт обирає послугу, час та підтверджує в 4 кроки — без реєстрації.',
    color: '#D4935A',
    bgColor: 'rgba(212, 147, 90, 0.1)',
  },
  {
    icon: ShoppingBag,
    title: 'Продаж товарів на сторінці',
    description: 'Додай товари до послуг. Клієнти купують у той самий візит — більший чек.',
    color: '#789A99',
    bgColor: 'rgba(120, 154, 153, 0.1)',
  },
  {
    icon: RefreshCw,
    title: 'Клієнти повертаються самі',
    description: 'CRM, нагадування, програми лояльності — всі інструменти для повторних візитів.',
    color: '#5C9E7A',
    bgColor: 'rgba(92, 158, 122, 0.1)',
  },
];

export function LandingFeatures() {
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
        <h2 className="display-md text-[#2C1A14]">
          Чому майстри обирають Bookit
        </h2>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {features.map((f, i) => {
          const Icon = f.icon;
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 28 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: i * 0.1, type: 'spring', stiffness: 300, damping: 24 }}
              className="bento-card p-6 flex flex-col gap-4"
            >
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center"
                style={{ background: f.bgColor }}
              >
                <Icon size={22} style={{ color: f.color }} />
              </div>
              <div>
                <h3 className="heading-serif text-xl text-[#2C1A14] mb-2">{f.title}</h3>
                <p className="text-sm text-[#6B5750] leading-relaxed">{f.description}</p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
