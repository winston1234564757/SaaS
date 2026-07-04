'use client';

import { Sheet } from '@/components/ui/Sheet';
import { useQuery } from '@tanstack/react-query';
import { getPricingRuleStats } from '@/app/(master)/dashboard/pricing/actions';
import { useMasterContext } from '@/lib/supabase/context';
import { pluralUk } from '@/lib/utils/pluralUk';
import { TrendingUp, TrendingDown, Percent, CalendarClock, BarChart3 } from 'lucide-react';

export interface RuleStatMeta {
  marker: string;            // підрядок лейбла: 'Пік' / 'Тихий час' / ...
  title: string;
  tone: 'warm' | 'cool';
}

interface Props {
  rule: RuleStatMeta | null;
  onClose: () => void;
}

const WARM = 'var(--warning)';
const COOL = 'var(--success)';
const tint = (color: string, pct: number) => `color-mix(in srgb, ${color} ${pct}%, transparent)`;

function kopToUah(kop: number): string {
  return (kop / 100).toLocaleString('uk-UA', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function formatDate(d: string | null): string {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('uk-UA', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export function PricingRuleStatsSheet({ rule, onClose }: Props) {
  const { masterProfile } = useMasterContext();
  const { data: stats, isLoading } = useQuery({
    queryKey: ['pricing-rule-stats', rule?.marker],
    queryFn:  () => getPricingRuleStats(rule!.marker),
    enabled:  !!rule && !!masterProfile?.id,
    staleTime: 30_000,
  });

  const color = rule?.tone === 'warm' ? WARM : COOL;
  const isWarm = rule?.tone === 'warm';
  const count = stats?.usage_count ?? 0;

  return (
    <Sheet
      open={!!rule}
      onOpenChange={(v) => !v && onClose()}
      title="Статистика правила"
      maxWidth="md"
    >
      <div className="flex flex-col gap-5 pb-4">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="size-11 rounded-2xl flex items-center justify-center shrink-0" style={{ background: tint(color, 13) }}>
            {isWarm ? <TrendingUp size={20} style={{ color }} /> : <TrendingDown size={20} style={{ color }} />}
          </div>
          <div className="min-w-0">
            <p className="text-base font-semibold text-foreground truncate">{rule?.title}</p>
            <p className="text-xs text-text-sub">
              {isWarm ? 'Надбавка до ціни' : 'Знижка для заповнення вікон'}
            </p>
          </div>
        </div>

        {isLoading && (
          <div className="flex flex-col gap-3 animate-pulse">
            <div className="h-24 rounded-2xl bg-secondary/50" />
            <div className="h-20 rounded-2xl bg-secondary/50" />
          </div>
        )}

        {!isLoading && count === 0 && (
          <div className="flex flex-col items-center text-center gap-2 py-8">
            <div className="size-12 rounded-2xl flex items-center justify-center" style={{ background: tint(color, 10) }}>
              <BarChart3 size={22} style={{ color }} />
            </div>
            <p className="text-sm font-medium text-foreground">Це правило ще не спрацьовувало</p>
            <p className="text-xs text-text-sub max-w-xs text-balance">
              Щойно клієнт забронює слот за цим правилом — тут зʼявиться статистика.
            </p>
          </div>
        )}

        {!isLoading && count > 0 && stats && (
          <>
            {/* Primary stat */}
            <div className="rounded-2xl px-4 py-4" style={{ background: tint(color, 9) }}>
              <p className="text-[11px] font-medium uppercase tracking-wide text-text-sub mb-1">
                {isWarm ? 'Спрацювало' : 'Врятувало вікон'}
              </p>
              <p className="text-2xl font-bold text-foreground tabular-nums">
                {count}{' '}
                <span className="text-sm font-semibold text-text-sub">
                  {isWarm ? pluralUk(count, 'раз', 'рази', 'разів') : pluralUk(count, 'слот', 'слоти', 'слотів')}
                </span>
              </p>
            </div>

            {/* Secondary metrics */}
            <div className="grid grid-cols-2 gap-2.5">
              {isWarm && (
                <div className="rounded-2xl bg-secondary/50 px-3.5 py-3">
                  <div className="flex items-center gap-1.5 mb-1">
                    <TrendingUp size={13} style={{ color }} />
                    <span className="text-[11px] text-text-sub">Додано</span>
                  </div>
                  <p className="text-base font-bold text-foreground tabular-nums">+{kopToUah(stats.earned_kopecks)} ₴</p>
                </div>
              )}
              {stats.avg_pct != null && (
                <div className="rounded-2xl bg-secondary/50 px-3.5 py-3">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Percent size={13} style={{ color }} />
                    <span className="text-[11px] text-text-sub">{isWarm ? 'Середня надбавка' : 'Середня знижка'}</span>
                  </div>
                  <p className="text-base font-bold text-foreground tabular-nums">{isWarm ? '+' : '−'}{stats.avg_pct}%</p>
                </div>
              )}
              <div className="rounded-2xl bg-secondary/50 px-3.5 py-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <CalendarClock size={13} style={{ color }} />
                  <span className="text-[11px] text-text-sub">Востаннє</span>
                </div>
                <p className="text-base font-bold text-foreground tabular-nums">{formatDate(stats.last_date)}</p>
              </div>
            </div>

            {/* Recent bookings */}
            {stats.recent.length > 0 && (
              <div>
                <p className="text-[11px] font-medium uppercase tracking-wide text-text-sub mb-2 px-1">
                  Останні записи
                </p>
                <div className="flex flex-col gap-1.5">
                  {stats.recent.map((b, i) => (
                    <div key={i} className="flex items-center justify-between rounded-xl bg-secondary/40 px-3.5 py-2.5">
                      <span className="text-sm text-foreground truncate">{b.client_name || 'Клієнт'}</span>
                      <span className="text-xs text-text-sub tabular-nums shrink-0 ml-3">{formatDate(b.date)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </Sheet>
  );
}
