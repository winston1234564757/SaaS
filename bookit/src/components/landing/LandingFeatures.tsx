'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Zap, Flame, Gift, Smartphone } from 'lucide-react';

const features = [
  {
    icon: Zap,
    title: 'Смарт-слоти та динамічні ціни',
    description:
      'Система сама заповнює порожні вікна у графіку та пропонує знижки на "незручні" години — ви заробляєте навіть тоді, коли зазвичай простоюєте.',
    color: '#D4935A',
    bgColor: 'rgba(212, 147, 90, 0.1)',
  },
  {
    icon: Flame,
    title: 'Флеш-акції за один клік',
    description:
      'Терміново потрібні клієнти на завтра? Запустіть флеш-акцію в один клік і створіть ажіотаж навколо вільних слотів.',
    color: '#C05B5B',
    bgColor: 'rgba(192, 91, 91, 0.1)',
  },
  {
    icon: Gift,
    title: 'Кешбек та реферальна програма',
    description:
      'Бонуси та кешбек повертають клієнтів знову і знову. Реферальна програма перетворює кожного клієнта на амбасадора вашого бренду.',
    color: '#5C9E7A',
    bgColor: 'rgba(92, 158, 122, 0.1)',
  },
  {
    icon: Smartphone,
    title: 'PWA та Telegram-сповіщення',
    description:
      'Bookit встановлюється як нативний додаток на iOS та Android без App Store. Миттєві сповіщення про записи — прямо у Telegram.',
    color: '#789A99',
    bgColor: 'rgba(120, 154, 153, 0.1)',
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
        <h2 className="display-md text-foreground text-balance">
          Не просто запис — повноцінна машина для зростання бізнесу
        </h2>
        <p className="mt-3 text-muted-foreground text-lg max-w-xl mx-auto text-balance">
          Інструменти, які раніше були тільки у великих мереж, тепер у вашому смартфоні.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                <h3 className="heading-serif text-xl text-foreground mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.description}</p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
