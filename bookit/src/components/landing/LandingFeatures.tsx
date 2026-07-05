'use client';

import { useRef } from 'react';
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion';
import { useIsDesktop } from '@/lib/hooks/useIsDesktop';
import { Zap, Flame, Gift, Smartphone, Instagram, ShoppingBag } from 'lucide-react';
import { LandingSplitHeading } from '@/components/landing/LandingSplitHeading';

const easeOut: [number, number, number, number] = [0.22, 1, 0.36, 1];

// The flagship carries the section — dark featured block. The rest read as an
// editorial hairline list, not a grid of identical cards.
const FLAGSHIP = {
  icon: Zap,
  title: 'Смарт-слоти та динамічні ціни',
  description:
    'Заповнює порожні вікна і пропонує знижки на «незручні» години. Заробляєте навіть коли немає записів.',
};

const FEATURES = [
  {
    icon: Flame,
    title: 'Флеш-акції за один клік',
    description: 'Терміново потрібні клієнти на завтра? Запускаєте флеш-акцію — і слоти заповнюються за годину.',
  },
  {
    icon: Gift,
    title: 'Кешбек та реферальна програма',
    description: 'Кешбек і бонуси — причина повернутися. А реферальна програма перетворює клієнтів на живу рекламу.',
  },
  {
    icon: Smartphone,
    title: 'PWA та Telegram-сповіщення',
    description: 'Встановлюється як нативний додаток на iOS та Android без App Store. Сповіщення про записи — прямо у Telegram.',
  },
  {
    icon: Instagram,
    title: 'Stories для Instagram за секунду',
    description: 'Створюєте Stories з вільними вікнами в один клік. Без дизайну, без зайвих витрат часу.',
  },
  {
    icon: ShoppingBag,
    title: 'Магазин косметики та товарів',
    description: 'Продавайте товари прямо під час запису. Система веде залишки, радить схожі позиції і підключає Нову Пошту.',
  },
];

export function LandingFeatures() {
  const ref = useRef<HTMLElement>(null);
  const shouldReduce = useReducedMotion();

  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const isDesktop = useIsDesktop();
  const headingYDesktop = useTransform(scrollYProgress, [0, 1], shouldReduce ? ['0%', '0%'] : ['0%', '-10%']);
  const headingYMobile = useTransform(scrollYProgress, [0, 1], shouldReduce ? ['0%', '0%'] : ['0%', '-3%']);
  const headingY = isDesktop ? headingYDesktop : headingYMobile;

  const reveal = (delay: number) => ({
    initial: { opacity: 0, y: 24 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: '-60px' },
    transition: { duration: shouldReduce ? 0 : 0.6, ease: easeOut, delay: shouldReduce ? 0 : delay },
  });

  const FlagshipIcon = FLAGSHIP.icon;

  return (
    <section ref={ref} className="py-20 sm:py-36 px-4 sm:px-6 lg:px-12">
      <div className="max-w-6xl mx-auto">

        {/* Header — the heading leads, no kicker label */}
        <motion.div className="mb-12 sm:mb-16 max-w-2xl" style={{ y: headingY }}>
          <LandingSplitHeading
            text={"Більше\nніж запис."}
            className="font-[family-name:var(--font-cormorant)] font-semibold leading-[0.92] tracking-tight"
            style={{ fontSize: 'clamp(2.6rem,5vw,4.4rem)', color: 'var(--l-ink)' }}
            stagger={70}
            lineDelay={200}
          />
          <motion.p
            {...reveal(0.28)}
            className="mt-5 text-base sm:text-lg leading-relaxed"
            style={{ color: 'var(--l-muted)' }}
          >
            Те, що раніше могли дозволити собі тільки великі мережі, тепер у вас в кишені.
          </motion.p>
        </motion.div>

        {/* Flagship — dark featured block */}
        <motion.article
          {...reveal(0.05)}
          className="relative overflow-hidden rounded-[1.75rem] p-8 sm:p-12 lg:p-14"
          style={{ background: 'var(--l-accent)', color: 'var(--l-text-on-dark)' }}
        >
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0"
            style={{ background: 'radial-gradient(ellipse 60% 70% at 90% 0%, var(--l-blob-indigo) 0%, transparent 60%)' }}
          />
          <div className="relative flex flex-col gap-6 max-w-2xl">
            <FlagshipIcon size={30} strokeWidth={1.6} style={{ color: 'var(--l-indigo-glow)' }} aria-hidden="true" />
            <h3
              className="font-[family-name:var(--font-cormorant)] font-semibold leading-[1] tracking-tight"
              style={{ fontSize: 'clamp(2rem,3.6vw,3.1rem)' }}
            >
              {FLAGSHIP.title}
            </h3>
            <p
              className="text-base sm:text-lg leading-relaxed max-w-xl"
              style={{ color: 'var(--l-muted-on-dark)' }}
            >
              {FLAGSHIP.description}
            </p>
          </div>
        </motion.article>

        {/* The rest — editorial hairline list, not a card grid */}
        <div className="mt-3 sm:mt-4 grid sm:grid-cols-2 sm:gap-x-14">
          {FEATURES.map((f, i) => {
            const Icon = f.icon;
            return (
              <motion.div
                key={i}
                {...reveal(0.06 + i * 0.06)}
                className="flex items-start gap-4 sm:gap-5 py-6 sm:py-7"
                style={{ borderTop: '1px solid var(--l-border)' }}
              >
                <Icon
                  size={22}
                  strokeWidth={1.7}
                  className="flex-shrink-0 mt-0.5"
                  style={{ color: 'var(--l-indigo)' }}
                  aria-hidden="true"
                />
                <div>
                  <h4
                    className="font-[family-name:var(--font-cormorant)] font-semibold leading-tight mb-1.5"
                    style={{ fontSize: '1.4rem', color: 'var(--l-ink)' }}
                  >
                    {f.title}
                  </h4>
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--l-muted)' }}>
                    {f.description}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
