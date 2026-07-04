'use client';

import { formatPrice } from '@/lib/utils/currency';
import { pluralUk } from '@/lib/utils/pluralUk';
import type { ProductStats } from '@/app/(master)/dashboard/products/actions';

function relDate(iso: string): string {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = new Date(iso);
  d.setHours(0, 0, 0, 0);
  const days = Math.round((today.getTime() - d.getTime()) / 86_400_000);
  if (days <= 0) return 'сьогодні';
  if (days === 1) return 'вчора';
  if (days < 7) return `${days} ${pluralUk(days, 'день', 'дні', 'днів')} тому`;
  if (days < 31) {
    const w = Math.floor(days / 7);
    return `${w} ${pluralUk(w, 'тиждень', 'тижні', 'тижнів')} тому`;
  }
  const m = Math.floor(days / 30);
  return `${m} ${pluralUk(m, 'місяць', 'місяці', 'місяців')} тому`;
}

interface Props {
  stats: ProductStats | null;
  loading: boolean;
}

export function ProductStatsPanel({ stats, loading }: Props) {
  if (loading && !stats) {
    return (
      <div className="bg-secondary/20 border border-dashed border-border p-4 rounded-xl text-center">
        <p className="text-xs font-semibold text-text-sub">Рахуємо статистику…</p>
      </div>
    );
  }

  if (!stats || stats.soldQty === 0) {
    return (
      <div className="bg-secondary/20 border border-dashed border-border p-4 rounded-xl text-center">
        <p className="text-xs font-semibold text-text-sub">Статистика з&apos;явиться після перших продажів</p>
      </div>
    );
  }

  return (
    <div className="bg-secondary/20 border border-border p-4 rounded-xl">
      <div className="grid grid-cols-3 gap-2 text-center">
        <div>
          <p className="text-sm font-bold text-foreground tabular-nums leading-tight">{stats.soldQty}</p>
          <p className="text-[10px] uppercase tracking-wider text-text-sub mt-0.5">Продано, шт</p>
        </div>
        <div>
          <p className="text-sm font-bold text-foreground tabular-nums leading-tight">{formatPrice(stats.revenue)}</p>
          <p className="text-[10px] uppercase tracking-wider text-text-sub mt-0.5">Виручка</p>
        </div>
        <div>
          <p className="text-sm font-bold text-foreground tabular-nums leading-tight">{stats.marginPct}%</p>
          <p className="text-[10px] uppercase tracking-wider text-text-sub mt-0.5">Маржа</p>
        </div>
      </div>
      <div className="flex items-center justify-between gap-2 mt-3 pt-3 border-t border-border/60 text-xs text-text-sub">
        <span>Прибуток <b className="font-bold text-foreground tabular-nums">{formatPrice(stats.profit)}</b></span>
        {stats.lastSaleAt && <span>Останній продаж {relDate(stats.lastSaleAt)}</span>}
      </div>
    </div>
  );
}
