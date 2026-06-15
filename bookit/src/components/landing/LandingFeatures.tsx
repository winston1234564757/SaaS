'use client';

import { useRef } from 'react';
import { motion, useInView, useReducedMotion, useScroll, useTransform } from 'framer-motion';
import { useIsDesktop } from '@/lib/hooks/useIsDesktop';
import { Zap, Flame, Gift, Smartphone, Instagram, ShoppingBag } from 'lucide-react';
import { LandingSplitHeading } from '@/components/landing/LandingSplitHeading';
import { LANDING_SPRING } from './shared/CountUp';

const easeOut: [number, number, number, number] = [0.22, 1, 0.36, 1];

const FEATURES = [
  {
    icon: Zap,
    title: 'Смарт-слоти та динамічні ціни',
    description: 'Заповнює порожні вікна і пропонує знижки на "незручні" години. Заробляєте навіть коли немає записів.',
    iconBg: 'rgba(245, 158, 11, 0.10)',
    iconColor: '#D97706',
  },
  {
    icon: Flame,
    title: 'Флеш-акції за один клік',
    description: 'Терміново потрібні клієнти на завтра? Запускаєте флеш-акцію — і слоти заповнюються за годину.',
    iconBg: 'rgba(239, 68, 68, 0.10)',
    iconColor: '#DC2626',
  },
  {
    icon: Gift,
    title: 'Кешбек та реферальна програма',
    description: 'Кешбек і бонуси — причина повернутися. А реферальна програма перетворює клієнтів на живу рекламу.',
    iconBg: 'rgba(34, 197, 94, 0.10)',
    iconColor: '#16A34A',
  },
  {
    icon: Smartphone,
    title: 'PWA та Telegram-сповіщення',
    description: 'Bookit встановлюється як нативний додаток на iOS та Android без App Store. Миттєві сповіщення про записи — прямо у Telegram.',
    iconBg: 'color-mix(in srgb, var(--l-indigo) 10%, transparent)',
    iconColor: 'var(--l-indigo)',
  },
  {
    icon: Instagram,
    title: 'Stories для Instagram за секунду',
    description: 'Створюєте Stories з вільними вікнами в один клік. Без дизайну, без зайвих витрат часу.',
    iconBg: 'rgba(239, 68, 68, 0.10)',
    iconColor: '#DC2626',
  },
  {
    icon: ShoppingBag,
    title: 'Магазин косметики та товарів',
    description: 'Продавайте товари прямо під час запису. Система веде залишки, радить схожі позиції і підключає Нову Пошту.',
    iconBg: 'rgba(59, 130, 246, 0.10)',
    iconColor: '#2563EB',
  },
];

export function LandingFeatures() {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  const shouldReduce = useReducedMotion();

  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const isDesktop = useIsDesktop();
  const headingYDesktop = useTransform(scrollYProgress, [0, 1], shouldReduce ? ['0%', '0%'] : ['0%', '-10%']);
  const headingYMobile = useTransform(scrollYProgress, [0, 1], shouldReduce ? ['0%', '0%'] : ['0%', '-3%']);
  const headingY = isDesktop ? headingYDesktop : headingYMobile;

  return (
    <section ref={ref} className="py-20 sm:py-36 px-4 sm:px-6 lg:px-12">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <motion.div className="mb-14 max-w-xl" style={{ y: headingY }}>
          <motion.span
            initial={{ opacity: 0, y: 12, filter: 'blur(8px)' }}
            animate={inView ? { opacity: 1, y: 0, filter: 'blur(0px)' } : {}}
            transition={{ ...LANDING_SPRING, delay: 0.05 }}
            className="inline-block text-[11px] font-semibold uppercase tracking-[0.18em] mb-5"
            style={{ color: 'var(--l-indigo)' }}
          >
            Можливості
          </motion.span>
          <LandingSplitHeading
            text={"Більше\nніж запис."}
            className="font-[family-name:var(--font-cormorant)] font-semibold leading-[0.92] tracking-tight"
            style={{ fontSize: 'clamp(2.6rem,5vw,4.4rem)', color: 'var(--l-ink)' }}
            stagger={70}
            lineDelay={200}
          />
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ ...LANDING_SPRING, delay: 0.32 }}
            className="mt-5 text-base leading-relaxed"
            style={{ color: 'var(--l-muted)' }}
          >
            Те, що раніше могли дозволити собі тільки великі мережі, тепер у вас в кишені.
          </motion.p>
        </motion.div>

        {/* Feature grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map((f, i) => {
            const Icon = f.icon;
            return (
              <motion.article
                key={i}
                initial={{ opacity: 0, y: 28, scale: 0.97 }}
                animate={inView ? { opacity: 1, y: 0, scale: 1 } : {}}
                transition={{ duration: shouldReduce ? 0 : 0.65, ease: easeOut, delay: shouldReduce ? 0 : 0.08 + i * 0.10 }}
                whileHover={shouldReduce ? {} : { y: -3 }}
                className="flex flex-col gap-5 p-6 rounded-[1.25rem]"
                style={{
                  background: 'var(--l-surface)',
                  border: '1px solid var(--l-border)',
                  boxShadow: 'var(--l-shadow-sm)',
                }}
              >
                <div
                  className="size-12 rounded-2xl flex items-center justify-center flex-shrink-0"
                  style={{ background: f.iconBg }}
                >
                  <Icon size={22} style={{ color: f.iconColor }} aria-hidden="true" />
                </div>
                <div>
                  <h3
                    className="font-semibold leading-snug mb-2"
                    style={{ fontSize: '1.05rem', color: 'var(--l-ink)' }}
                  >
                    {f.title}
                  </h3>
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--l-muted)' }}>
                    {f.description}
                  </p>
                </div>
              </motion.article>
            );
          })}
        </div>

      </div>
    </section>
  );
}
