'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Zap, Flame, Gift, Smartphone, Instagram, ShoppingBag } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

const features = [
  {
    icon: Zap,
    title: 'Смарт-слоти та динамічні ціни',
    description:
      'Заповнює порожні вікна і пропонує знижки на "незручні" години. Заробляєте навіть коли немає записів.',
    iconCls: 'bg-warning/10 text-warning',
  },
  {
    icon: Flame,
    title: 'Флеш-акції за один клік',
    description:
      'Терміново потрібні клієнти на завтра? Запускаєте флеш-акцію — і слоти заповнюються за годину.',
    iconCls: 'bg-destructive/10 text-destructive',
  },
  {
    icon: Gift,
    title: 'Кешбек та реферальна програма',
    description:
      'Кешбек і бонуси — причина повернутися. А реферальна програма перетворює клієнтів на живу рекламу.',
    iconCls: 'bg-success/10 text-success',
  },
  {
    icon: Smartphone,
    title: 'PWA та Telegram-сповіщення',
    description:
      'Bookit встановлюється як нативний додаток на iOS та Android без App Store. Миттєві сповіщення про записи — прямо у Telegram.',
    iconCls: 'bg-primary/10 text-primary',
  },
  {
    icon: Instagram,
    title: 'Stories для Instagram за секунду',
    description:
      'Створюєте Stories з вільними вікнами в один клік. Без дизайну, без зайвих витрат часу.',
    iconCls: 'bg-destructive/10 text-destructive',
  },
  {
    icon: ShoppingBag,
    title: 'Магазин косметики та товарів',
    description:
      'Продавайте товари прямо під час запису. Система веде залишки, радить схожі позиції і підключає Нову Пошту.',
    iconCls: 'bg-info/10 text-info',
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
          Більше ніж запис.
        </h2>
        <p className="mt-3 text-muted-foreground text-lg max-w-xl mx-auto text-balance">
          Те, що раніше могли дозволити собі тільки великі мережі, тепер у вас в кишені.
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
              <div className={cn('size-12 rounded-2xl flex items-center justify-center', f.iconCls)}>
                <Icon size={22} />
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
