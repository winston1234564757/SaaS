'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Zap, TrendingUp, Gift, Share2, Building2, CreditCard, ChevronRight } from 'lucide-react';
import { useMasterContext } from '@/lib/supabase/context';

const SPRING = { type: 'spring', stiffness: 280, damping: 24 } as const;

interface BentoItem {
  href: string;
  icon: typeof Zap;
  label: string;
  desc: string;
  soon?: boolean;
  accent: string;
  bg: string;
  /** Tailwind span на мобільному (grid-cols-2) */
  mobile: string;
  /** Tailwind span на десктопі (grid-cols-6) */
  desktop: string;
}

const ITEMS: BentoItem[] = [
  {
    href:    '/dashboard/flash',
    icon:    Zap,
    label:   'Флеш-акції',
    desc:    'Заповни вільний слот — сповісти клієнтів миттєво зі знижкою',
    accent:  '#D4935A',
    bg:      'rgba(212,147,90,0.08)',
    mobile:  'col-span-2',
    desktop: 'md:col-span-4 md:row-span-2',
  },
  {
    href:    '/dashboard/pricing',
    icon:    TrendingUp,
    label:   'Ціноутворення',
    desc:    'Пік, тихий час, рання бронь, остання хвилина',
    accent:  '#789A99',
    bg:      'rgba(120,154,153,0.08)',
    mobile:  'col-span-1',
    desktop: 'md:col-span-2 md:row-span-2',
  },
  {
    href:    '/dashboard/loyalty',
    icon:    Gift,
    label:   'Лояльність',
    desc:    'Програма знижок та бонусів для постійних клієнтів',
    accent:  '#5C9E7A',
    bg:      'rgba(92,158,122,0.08)',
    mobile:  'col-span-1',
    desktop: 'md:col-span-3',
  },
  {
    href:    '/dashboard/referral',
    icon:    Share2,
    label:   'Запроси друга',
    desc:    'Запрошуй колег — обидва отримуєте місяць Pro',
    accent:  '#789A99',
    bg:      'rgba(120,154,153,0.06)',
    mobile:  'col-span-2',
    desktop: 'md:col-span-3',
  },
  {
    href:    '/dashboard/studio',
    icon:    Building2,
    label:   'Студія',
    desc:    'Команда майстрів, зведена аналітика та управління персоналом',
    soon:    true,
    accent:  '#6B5750',
    bg:      'rgba(107,87,80,0.06)',
    mobile:  'col-span-2',
    desktop: 'md:col-span-4',
  },
  {
    href:    '/dashboard/billing',
    icon:    CreditCard,
    label:   'Тариф та оплата',
    desc:    'Керування підпискою та платіжними методами',
    accent:  '#2C1A14',
    bg:      'rgba(44,26,20,0.04)',
    mobile:  'col-span-2',
    desktop: 'md:col-span-2',
  },
];

export function MorePage() {
  const { masterProfile } = useMasterContext();
  const tier = masterProfile?.subscription_tier ?? 'starter';
  const tierLabel = tier === 'pro' ? 'Pro' : tier === 'studio' ? 'Studio' : 'Starter';

  return (
    <div className="flex flex-col gap-4 pb-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...SPRING, delay: 0.05 }}
        className="bento-card p-5"
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="heading-serif text-xl text-[#2C1A14]">Ще</h1>
            <p className="text-sm text-[#A8928D] mt-0.5">Інструменти для зростання вашого бізнесу</p>
          </div>
          <span className="text-xs font-semibold text-[#789A99] bg-[#789A99]/10 px-2.5 py-1 rounded-full">
            {tierLabel}
          </span>
        </div>
      </motion.div>

      {/* Bento Grid — 2 cols mobile / 6 cols desktop */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3 items-stretch">
        {ITEMS.map((item, i) => {
          const Icon = item.icon;
          return (
            <motion.div
              key={item.href}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...SPRING, delay: 0.08 + i * 0.06 }}
              className={`${item.mobile} ${item.desktop}`}
            >
              <Link href={item.href} className="block h-full">
                <div
                  className="bento-card p-4 h-full flex flex-col gap-3 group active:scale-[0.98] hover:scale-[1.01] transition-transform duration-200 min-h-[120px]"
                  style={{ background: item.bg }}
                >
                  {/* Icon + Soon badge */}
                  <div className="flex items-start justify-between">
                    <div
                      className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0"
                      style={{ background: `${item.accent}18` }}
                    >
                      <Icon size={18} style={{ color: item.accent }} />
                    </div>
                    {item.soon && (
                      <span className="text-[10px] font-bold text-[#789A99] bg-[#789A99]/12 px-1.5 py-0.5 rounded-full">
                        Скоро
                      </span>
                    )}
                  </div>

                  {/* Text */}
                  <div className="flex-1">
                    <p className="text-sm font-bold text-[#2C1A14] mb-1">{item.label}</p>
                    <p className="text-xs text-[#6B5750] leading-relaxed line-clamp-3">{item.desc}</p>
                  </div>

                  {/* Arrow */}
                  <div className="flex items-center gap-1" style={{ color: item.accent }}>
                    <span className="text-xs font-semibold">Відкрити</span>
                    <ChevronRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
