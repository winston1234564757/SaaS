'use client';

import React from 'react';
import { formatPrice } from '@/lib/utils/currency';
import { pluralUk } from '@/lib/utils/pluralUk';
import type { TopService } from '@/lib/supabase/hooks/useAnalytics';
import type { OverviewDetail } from './OverviewDetailSheet';

function serviceDetail(svc: TopService): OverviewDetail {
  const avg = svc.count > 0 ? Math.round(svc.revenue / svc.count) : 0;
  const withProd = Math.round(svc.count * svc.crossSellRate / 100);
  return {
    title: svc.name,
    eyebrow: 'Послуга',
    hero: { label: 'Дохід за період', value: formatPrice(Math.round(svc.revenue)) },
    rows: [
      { label: 'Записів', value: String(svc.count) },
      { label: 'Середній чек', value: avg > 0 ? formatPrice(avg) : '—', tone: 'primary' },
      { label: 'Cross-sell', value: `${svc.crossSellRate}%` },
      { label: 'Записів із товарами', value: `${withProd} / ${svc.count}` },
    ],
    note: 'Cross-sell — частка записів на цю послугу, де клієнт також купив товар. Вищий відсоток означає більше допродажів.',
  };
}

/**
 * Послуги з асиметричною ієрархією (Принцип темного блоку):
 * №1 — featured-герой, решта — компактний ранг-список. Усі елементи клікабельні
 * → розширений огляд послуги (OverviewDetailSheet).
 */
export function FeaturedServices({
  services,
  onOpenDetail,
}: {
  services: TopService[];
  onOpenDetail: (d: OverviewDetail) => void;
}) {
  if (services.length === 0) return null;
  const [hero, ...rest] = services;
  const maxRest = Math.max(...rest.map(s => s.revenue), 1);

  const heroAvg = hero.count > 0 ? Math.round(hero.revenue / hero.count) : 0;
  const heroWithProducts = Math.round(hero.count * hero.crossSellRate / 100);

  return (
    <div className="flex flex-col">
      {/* ── Герой №1 (клік → деталі) ── */}
      <button
        type="button"
        onClick={() => onOpenDetail(serviceDetail(hero))}
        className="text-left w-full pb-4 cursor-pointer group"
      >
        <div className="flex items-end justify-between gap-3">
          <div className="min-w-0">
            <span className="inline-block text-[11px] font-semibold text-primary mb-1.5">Лідер періоду</span>
            <h4 className="heading-serif text-[26px] leading-none text-foreground truncate group-hover:text-primary transition-colors">{hero.name}</h4>
            <p className="text-xs text-text-sub mt-1.5 tabular-nums">
              {hero.count} {pluralUk(hero.count, 'запис', 'записи', 'записів')}
            </p>
          </div>
          <p className="metric-value text-3xl font-semibold text-foreground flex-shrink-0 leading-none">
            {formatPrice(Math.round(hero.revenue))}
          </p>
        </div>

        <div className="mt-4 grid grid-cols-3 divide-x divide-border-strong/40 rounded-2xl bg-primary/[0.05] border border-primary/10">
          {[
            { label: 'Cross-sell', value: `${hero.crossSellRate}%` },
            { label: 'З товарами', value: `${heroWithProducts}/${hero.count}` },
            { label: 'Серед. чек', value: heroAvg > 0 ? formatPrice(heroAvg) : '—' },
          ].map((s, i) => (
            <div key={s.label} className={i === 0 ? 'pr-3 pl-3.5 py-2.5' : 'px-3 py-2.5'}>
              <p className="text-[10px] text-text-sub mb-0.5">{s.label}</p>
              <p className="metric-value text-[15px] font-semibold text-foreground">{s.value}</p>
            </div>
          ))}
        </div>
      </button>

      {/* ── Решта №2-N (клік → деталі) ── */}
      {rest.length > 0 && (
        <div className="flex flex-col border-t border-border-strong/45 pt-1">
          {rest.map((svc, i) => (
            <button
              type="button"
              key={svc.name}
              onClick={() => onOpenDetail(serviceDetail(svc))}
              className="flex items-center gap-3 py-2.5 border-b border-border/30 last:border-0 text-left w-full cursor-pointer group"
            >
              <span className="metric-value text-[13px] font-semibold text-text-sub w-4 flex-shrink-0 text-center">{i + 2}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">{svc.name}</span>
                  <span className="metric-value text-sm font-semibold text-foreground flex-shrink-0">{formatPrice(Math.round(svc.revenue))}</span>
                </div>
                <div className="h-1 mt-1.5 rounded-full bg-secondary overflow-hidden">
                  <div className="h-full rounded-full bg-primary/70" style={{ width: `${Math.round((svc.revenue / maxRest) * 100)}%` }} />
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
