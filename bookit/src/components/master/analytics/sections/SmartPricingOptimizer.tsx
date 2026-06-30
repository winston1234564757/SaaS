'use client';

import React, { useMemo } from 'react';
import { Zap, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { pluralUk } from '@/lib/utils/pluralUk';

interface SmartPricingOptimizerProps {
  occupancyHeatmap?: { dow: number; hour: number; occupancy_pct: number }[];
}

const DAYS = ['Неділя', 'Понеділок', 'Вівторок', 'Середа', 'Четвер', "П'ятниця", 'Субота'];
const DAYS_GENITIVE = ['неділю', 'понеділок', 'вівторок', 'середу', 'четвер', "п'ятницю", 'суботу'];

/**
 * Чесний нудж розумних цін на основі РЕАЛЬНОЇ теплової карти завантаження.
 * Без вигаданих сум/відсотків і без фейкової «активації» — веде на справжню
 * сторінку налаштування динамічних цін. Не рендериться без вираженого піку.
 * (M-ANL-01: прибрано захардкоджені «+₴3,200/міс / 95% / +15% / one-click toast».)
 */
export function SmartPricingOptimizer({ occupancyHeatmap }: SmartPricingOptimizerProps) {
  const peak = useMemo(() => {
    if (!occupancyHeatmap || occupancyHeatmap.length === 0) return null;
    // Найвища завантаженість по днях тижня (реальні дані)
    const byDay = new Map<number, { max: number; hotHours: number }>();
    for (const slot of occupancyHeatmap) {
      const cur = byDay.get(slot.dow) ?? { max: 0, hotHours: 0 };
      byDay.set(slot.dow, {
        max: Math.max(cur.max, slot.occupancy_pct),
        hotHours: cur.hotHours + (slot.occupancy_pct >= 80 ? 1 : 0),
      });
    }
    let best: { dow: number; max: number; hotHours: number } | null = null;
    for (const [dow, v] of byDay) {
      if (!best || v.max > best.max) best = { dow, ...v };
    }
    // Поріг показу: пік має бути реально високим
    if (!best || best.max < 75) return null;
    return best;
  }, [occupancyHeatmap]);

  if (!peak) return null;

  const dayName = DAYS[peak.dow] ?? '';
  const dayGen = DAYS_GENITIVE[peak.dow] ?? dayName.toLowerCase();

  return (
    <div className="bento-card h-full p-5 flex flex-col gap-3 relative overflow-hidden">
      <div aria-hidden className="absolute -top-6 -right-6 opacity-[0.07]">
        <Zap className="size-24 text-primary" />
      </div>

      <div className="flex items-center gap-2 relative z-10">
        <span className="inline-flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary border border-primary/15">
          <Zap className="size-3.5" />
        </span>
        <h3 className="text-sm font-semibold text-foreground">Розумні ціни</h3>
      </div>

      <div className="relative z-10 flex-1">
        <p className="text-[15px] font-semibold text-foreground leading-snug">
          {dayName} — твій пік: завантаженість сягає <span className="text-primary tabular-nums">{Math.round(peak.max)}%</span>
        </p>
        <p className="text-[13px] text-text-sub mt-1.5 leading-relaxed">
          {peak.hotHours > 0
            ? `${peak.hotHours} ${pluralUk(peak.hotHours, 'гаряча година', 'гарячі години', 'гарячих годин')} у ${dayGen}. Клієнти готові платити більше за зручний час. Додай націнку, щоб не віддавати її задешево.`
            : `Висока завантаженість у ${dayGen}. Клієнти готові платити більше за зручний час, тож додай націнку.`}
        </p>
      </div>

      <Link
        href="/dashboard/revenue?tab=pricing"
        className="relative z-10 group inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full bg-[var(--btn-primary-bg)] text-[var(--accent-on)] text-[13px] font-semibold cursor-pointer active:scale-[0.97] transition-transform self-start"
      >
        Налаштувати націнку
        <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
      </Link>
    </div>
  );
}
