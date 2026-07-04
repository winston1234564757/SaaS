'use client';

// src/components/shared/wizard/WizardHero.tsx
// Темний editorial hero-band майстра запису (DESIGN_LANGUAGE: один темний герой + світле тіло).
// Один band на поверхню, адаптується під крок: домінанта-намір + контекст-метрика on-dark.

import { motion } from 'framer-motion';
import { StepProgress } from './StepProgress';
import type { WizardStep } from './types';
import { fmt, DAY_S, MONTH_S } from './helpers';
import { formatDurationFull } from '@/lib/utils/dates';
import { pluralUk } from '@/lib/utils/pluralUk';

interface WizardHeroProps {
  step: WizardStep;
  mode: 'client' | 'master';
  masterName: string;
  hasProducts: boolean;
  selectedCount: number;
  effectiveDuration: number;
  totalServicesPrice: number;
  cartCount: number;
  finalTotal: number;
  selectedDate: Date | null;
  selectedTime: string | null;
  statusColor?: string;
}

function heroTitle(step: WizardStep, mode: 'client' | 'master'): string {
  switch (step) {
    case 'services': return 'Обери послуги';
    case 'datetime': return 'Обери час';
    case 'products': return 'Додай товари';
    case 'details':  return mode === 'master' ? 'Деталі запису' : 'Твої контакти';
    default:         return '';
  }
}

/** Права метрика-домінанта на темному band (числа = .metric-value, тихе — white/55). */
function heroMetric(p: WizardHeroProps): { value: string; sub: string } | null {
  const { step, selectedCount, effectiveDuration, totalServicesPrice, cartCount, finalTotal, selectedDate, selectedTime } = p;
  if (step === 'services') {
    if (selectedCount === 0) return null;
    return {
      value: fmt(totalServicesPrice),
      sub: `${pluralUk(selectedCount, 'послуга', 'послуги', 'послуг')} · ${formatDurationFull(effectiveDuration)}`,
    };
  }
  if (step === 'datetime') {
    if (selectedCount === 0) return null;
    return { value: fmt(totalServicesPrice), sub: `${selectedCount} · ${formatDurationFull(effectiveDuration)}` };
  }
  if (step === 'products') {
    if (cartCount === 0) return null;
    return { value: fmt(finalTotal), sub: pluralUk(cartCount, 'товар', 'товари', 'товарів') };
  }
  if (step === 'details') {
    // Чек-cover: сума домінує, дата/час — контекст
    if (selectedDate && selectedTime) {
      return { value: fmt(finalTotal), sub: `${selectedDate.getDate()} ${MONTH_S[selectedDate.getMonth()]} · ${selectedTime}` };
    }
    return { value: fmt(finalTotal), sub: pluralUk(p.selectedCount, 'послуга', 'послуги', 'послуг') };
  }
  return null;
}

/** Тихий підпис під домінантою коли ще нема вибору (веде фокус). */
function heroHint(p: WizardHeroProps): string | null {
  if (p.step === 'services' && p.selectedCount === 0) return 'Одна чи кілька — рахунок оновиться сам';
  if (p.step === 'datetime' && !p.selectedTime) return 'Обери вільний день і зручний час';
  if (p.step === 'products' && p.cartCount === 0) return 'За бажанням — додай товари до запису';
  return null;
}

export function WizardHero(props: WizardHeroProps) {
  const { step, mode, masterName, hasProducts, statusColor } = props;
  const title = heroTitle(step, mode);
  const metric = heroMetric(props);
  const hint = heroHint(props);
  const identity = mode === 'master' ? 'Новий запис' : (masterName || 'Онлайн-запис');

  return (
    <div className="editorial-cover relative overflow-hidden rounded-2xl px-5 pt-4 pb-5">
      {/* М'яка аврора — глибина, не декор */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-16 -right-10 size-52 rounded-full blur-3xl"
        style={{ background: `color-mix(in srgb, ${statusColor ?? '#6366F1'} 30%, transparent)` }}
      />

      <div className="relative">
        <StepProgress step={step} hasProducts={hasProducts} onDark />

        <p className="mt-3 text-[11px] font-medium text-white/55">{identity}</p>

        <div className="mt-1 flex items-end justify-between gap-4">
          <motion.h2
            key={title}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 32 }}
            className="heading-serif text-[26px] leading-[1.04] text-white tracking-tight min-w-0"
          >
            {title}
          </motion.h2>

          {metric && (
            <motion.div
              key={metric.value + metric.sub}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 400, damping: 32 }}
              className="text-right shrink-0"
            >
              <p className="metric-value text-[22px] leading-none text-white tabular-nums">{metric.value}</p>
              <p className="text-[11px] text-white/55 mt-1">{metric.sub}</p>
            </motion.div>
          )}
        </div>

        {hint && <p className="mt-2 text-[13px] text-white/60 leading-snug">{hint}</p>}
      </div>
    </div>
  );
}
