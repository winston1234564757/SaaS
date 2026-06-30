'use client';

import React from 'react';
import { formatPrice } from '@/lib/utils/currency';
import type { TopProduct } from '@/lib/supabase/hooks/useAnalytics';
import type { OverviewDetail } from './OverviewDetailSheet';

function productDetail(prod: TopProduct): OverviewDetail {
  const avgPrice = prod.qty > 0 ? Math.round(prod.revenue / prod.qty) : 0;
  return {
    title: prod.name,
    eyebrow: 'Товар',
    hero: { label: 'Дохід за період', value: formatPrice(Math.round(prod.revenue)) },
    rows: [
      { label: 'Продано', value: `${prod.qty} шт.` },
      { label: 'Середня ціна', value: avgPrice > 0 ? formatPrice(avgPrice) : '—', tone: 'primary' },
    ],
    note: 'Враховано продажі і в записах (розхідники), і окремо в магазині.',
  };
}

/**
 * Товари з асиметричною ієрархією (Принцип темного блоку):
 * №1 — featured-бестселер, решта — компактний ранг-список. Усі клікабельні
 * → деталі товару (OverviewDetailSheet).
 */
export function FeaturedProducts({
  products,
  onOpenDetail,
}: {
  products: TopProduct[];
  onOpenDetail: (d: OverviewDetail) => void;
}) {
  if (products.length === 0) return null;
  const [hero, ...rest] = products;
  const maxRest = Math.max(...rest.map(p => p.revenue), 1);

  return (
    <div className="flex flex-col">
      {/* ── Бестселер №1 ── */}
      <button
        type="button"
        onClick={() => onOpenDetail(productDetail(hero))}
        className="text-left w-full pb-4 cursor-pointer group"
      >
        <span className="inline-block text-[11px] font-semibold text-warning mb-1.5">Бестселер</span>
        <div className="flex items-end justify-between gap-3">
          <div className="min-w-0">
            <h4 className="heading-serif text-[22px] leading-none text-foreground truncate group-hover:text-warning transition-colors">{hero.name}</h4>
            <p className="text-xs text-text-sub mt-1.5 tabular-nums">Продано {hero.qty} шт.</p>
          </div>
          <p className="metric-value text-2xl font-semibold text-foreground flex-shrink-0 leading-none">
            {formatPrice(Math.round(hero.revenue))}
          </p>
        </div>
      </button>

      {/* ── Решта №2-N ── */}
      {rest.length > 0 && (
        <div className="flex flex-col border-t border-border-strong/45 pt-1">
          {rest.map((prod, i) => (
            <button
              type="button"
              key={prod.name}
              onClick={() => onOpenDetail(productDetail(prod))}
              className="flex items-center gap-3 py-2.5 border-b border-border/30 last:border-0 text-left w-full cursor-pointer group"
            >
              <span className="metric-value text-[13px] font-semibold text-text-sub w-4 flex-shrink-0 text-center">{i + 2}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-sm font-medium text-foreground truncate group-hover:text-warning transition-colors">{prod.name}</span>
                  <span className="metric-value text-sm font-semibold text-foreground flex-shrink-0">{formatPrice(Math.round(prod.revenue))}</span>
                </div>
                <div className="h-1 mt-1.5 rounded-full bg-secondary overflow-hidden">
                  <div className="h-full rounded-full bg-warning/70" style={{ width: `${Math.round((prod.revenue / maxRest) * 100)}%` }} />
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
