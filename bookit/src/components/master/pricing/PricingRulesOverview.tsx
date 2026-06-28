'use client';

import { TrendingUp, TrendingDown, Bird, Zap, ChevronRight } from 'lucide-react';
import { pluralUk } from '@/lib/utils/pluralUk';
import type { PricingRulesOverview as OverviewData } from '@/app/(master)/dashboard/pricing/actions';
import type { RuleStatMeta } from './PricingRuleStatsSheet';

interface Props {
  data: OverviewData | null;
  onOpenRule: (meta: RuleStatMeta) => void;
}

const WARM = 'var(--warning)';
const COOL = 'var(--success)';
const tint = (color: string, pct: number) => `color-mix(in srgb, ${color} ${pct}%, transparent)`;

function kopToUah(kop: number): string {
  return (kop / 100).toLocaleString('uk-UA', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

interface Row {
  meta: RuleStatMeta;
  icon: typeof TrendingUp;
  count: number;
  metric: string;          // готовий текст метрики
}

export function PricingRulesOverview({ data, onOpenRule }: Props) {
  if (!data) return null;

  const total = data.peak.count + data.quiet.count + data.early_bird.count + data.last_minute.count;
  if (total === 0) return null; // нічого ще не спрацювало → блоку нема

  const peakRow: Row = {
    meta: { marker: 'Пік', title: 'Пік-години', tone: 'warm' },
    icon: TrendingUp,
    count: data.peak.count,
    metric: data.peak.count > 0 ? `+${kopToUah(data.peak.earned_kopecks)} ₴ · ${data.peak.count}×` : '0',
  };

  const discountBase: Omit<Row, 'metric'>[] = [
    { meta: { marker: 'Тихий час', title: 'Тихий час', tone: 'cool' }, icon: TrendingDown, count: data.quiet.count },
    { meta: { marker: 'Рання бронь', title: 'Рання бронь', tone: 'cool' }, icon: Bird, count: data.early_bird.count },
    { meta: { marker: 'Остання хвилина', title: 'Остання хвилина', tone: 'cool' }, icon: Zap, count: data.last_minute.count },
  ];
  const discountRows: Row[] = discountBase
    .map(r => ({ ...r, metric: r.count > 0 ? `${r.count} ${pluralUk(r.count, 'слот', 'слоти', 'слотів')}` : '0' }))
    .sort((a, b) => b.count - a.count);

  const rows: Row[] = [peakRow, ...discountRows];

  return (
    <div className="bento-card p-4">
      <p className="text-sm font-semibold text-foreground px-1 mb-2.5">Результати правил</p>
      <div className="flex flex-col gap-0.5">
        {rows.map(({ meta, icon: Icon, count, metric }) => {
          const color = meta.tone === 'warm' ? WARM : COOL;
          const zero = count === 0;
          return (
            <button
              key={meta.marker}
              type="button"
              onClick={() => onOpenRule(meta)}
              aria-label={`Статистика: ${meta.title}`}
              className="w-full flex items-center justify-between gap-3 px-2 py-2.5 rounded-xl hover:bg-secondary/40 active:scale-[0.99] transition-all"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="size-8 rounded-xl flex items-center justify-center shrink-0" style={{ background: tint(color, zero ? 7 : 13) }}>
                  <Icon size={15} style={{ color, opacity: zero ? 0.5 : 1 }} />
                </div>
                <span className="text-sm text-foreground truncate">{meta.title}</span>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <span className={`text-sm font-semibold tabular-nums ${zero ? 'text-muted-foreground' : 'text-foreground'}`}>
                  {metric}
                </span>
                <ChevronRight size={15} className="text-muted-foreground/40" />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
