'use client';

import React from 'react';
import { Instagram, Send, Pencil, Compass, Globe, ArrowUpRight, ArrowDownRight, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { formatPrice } from '@/lib/utils/currency';
import { pluralUk } from '@/lib/utils/pluralUk';
import { useSourceAttribution, type SourceAttributionPoint } from '@/lib/supabase/hooks/useSourceAttribution';
import { SkeletonCell } from '../../primitives/SkeletonCell';
import { ErrorCell } from '../../primitives/ErrorCell';
import { EmptyCell } from '../../primitives/EmptyCell';
import { BentoCell } from '../../primitives/BentoCell';
import { ChannelDonut } from '../../charts/ChannelDonut';
import { SectionHeading } from '../OverviewTab';
import type { OverviewDetail } from '../OverviewDetailSheet';

interface SourceTabProps {
  start: string;
  end: string;
  isPro: boolean;
  onOpenDetail: (d: OverviewDetail) => void;
}

const CHANNEL_ICON: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  Instagram,
  Telegram: Send,
  'Вручну': Pencil,
  'Каталог': Compass,
  'Сайт-візитка': Globe,
};

function channelDetail(p: SourceAttributionPoint): OverviewDetail {
  const completionRate = p.count > 0 ? Math.round((p.completedCount / p.count) * 100) : 0;
  const avgCheck = p.completedCount > 0 ? Math.round(p.revenue / p.completedCount) : 0;
  return {
    title: p.source,
    eyebrow: 'Канал',
    hero: { label: 'Виручка за період', value: formatPrice(Math.round(p.revenue)) },
    rows: [
      { label: 'Записів', value: String(p.count) },
      { label: 'Завершено', value: `${p.completedCount} / ${p.count}` },
      { label: 'Завершеність', value: `${completionRate}%`, tone: completionRate >= 70 ? 'success' : completionRate >= 40 ? 'primary' : 'warning' },
      { label: 'Середній чек', value: avgCheck > 0 ? formatPrice(avgCheck) : '—', tone: 'primary' },
    ],
    note: 'Завершеність показує, яка частка записів із цього каналу дійшла до візиту. Решта припадає на скасування та неявки.',
  };
}

/** Δ-чіп на світлій поверхні (semantic Frost) */
function DeltaChip({ delta }: { delta: number }) {
  if (delta === 0) return null;
  const up = delta > 0;
  const Icon = up ? ArrowUpRight : ArrowDownRight;
  return (
    // up: #0D6B2F (5.21:1) замість text-success #16803C (3.93 провал малого тексту на periwinkle)
    <span className={cn('inline-flex items-center gap-0.5 text-xs font-semibold leading-none tabular-nums', up ? 'text-[#0D6B2F]' : 'text-destructive')}>
      <Icon size={13} strokeWidth={2.5} />
      {up ? '+' : ''}{delta}%
    </span>
  );
}

export function SourceTab({ start, end, isPro, onOpenDetail }: SourceTabProps) {
  const { data, isLoading, isError, refetch } = useSourceAttribution({ start, end, compareTrend: isPro });

  if (isLoading) {
    return <SkeletonCell variant="flat" className="min-h-[250px]" />;
  }
  if (isError) {
    return <ErrorCell onRetry={refetch} />;
  }
  if (!data || data.length === 0) {
    return (
      <EmptyCell
        title="Записів ще немає"
        description="Тут зʼявиться аналітика джерел записів після того, як ви отримаєте перші бронювання."
        icon={<TrendingUp size={20} />}
      />
    );
  }

  return <SourceTabView data={data} isPro={isPro} onOpenDetail={onOpenDetail} />;
}

/** Чиста презентація (без fetch) — для прев'ю/тестів і верифікації власними очима */
export function SourceTabView({
  data,
  isPro,
  onOpenDetail,
}: {
  data: SourceAttributionPoint[];
  isPro: boolean;
  onOpenDetail: (d: OverviewDetail) => void;
}) {
  const [hero, ...rest] = data;
  // Смуги відносно загального лідера (hero) — чесна пропорція, не відносно «інших»
  const maxCount = Math.max(hero.count, 1);
  const HeroIcon = CHANNEL_ICON[hero.source] ?? Globe;
  const heroCompletion = hero.count > 0 ? Math.round((hero.completedCount / hero.count) * 100) : 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
      {/* ── Герой: головне джерело (світлий featured) ── */}
      <div className="lg:col-span-7 min-w-0">
        <BentoCell className="h-full p-5">
          <button
            type="button"
            onClick={() => onOpenDetail(channelDetail(hero))}
            className="relative text-left w-full cursor-pointer group overflow-hidden"
          >
            {/* Гліф каналу — візуальний якір у мертвому просторі справа */}
            <HeroIcon size={150} className="pointer-events-none absolute -right-5 -top-3 text-primary/[0.06]" aria-hidden />

            <span className="relative inline-flex items-center gap-1.5 text-[11px] font-semibold text-primary mb-3">
              <HeroIcon size={13} />
              Головне джерело
            </span>

            <div className="relative min-w-0">
              <h4 className="heading-serif text-[28px] leading-none text-foreground truncate group-hover:text-primary transition-colors">
                {hero.source}
              </h4>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="metric-value text-[40px] font-semibold text-foreground leading-none">{hero.pct}%</span>
                {isPro && hero.deltaPct !== null && <DeltaChip delta={hero.deltaPct} />}
              </div>
              <p className="text-xs text-text-sub mt-1.5">частка записів{isPro && hero.deltaPct !== null ? ' · проти минулого періоду' : ''}</p>
            </div>

            {/* by the numbers */}
            <div className="relative mt-5 grid grid-cols-3 divide-x divide-border-strong/40 rounded-2xl bg-primary/[0.05] border border-primary/10">
              <div className="pr-3 pl-3.5 py-2.5">
                <p className="text-[10px] text-text-sub mb-0.5">Записів</p>
                <p className="metric-value text-[15px] font-semibold text-foreground">{hero.count}</p>
              </div>
              <div className="px-3 py-2.5">
                <p className="text-[10px] text-text-sub mb-0.5">Завершеність</p>
                <p className="metric-value text-[15px] font-semibold text-foreground">{heroCompletion}%</p>
              </div>
              <div className="px-3 py-2.5">
                <p className="text-[10px] text-text-sub mb-0.5">Виручка</p>
                <p className="metric-value text-[15px] font-semibold text-foreground">{formatPrice(Math.round(hero.revenue))}</p>
              </div>
            </div>
          </button>
        </BentoCell>
      </div>

      {/* ── Donut: розподіл усіх каналів (support) ── */}
      <div className="lg:col-span-5 min-w-0">
        <BentoCell className="h-full p-5">
          <SectionHeading title="Розподіл записів" subtitle="Частка кожного каналу" />
          <ChannelDonut data={data} />
        </BentoCell>
      </div>

      {/* ── Усі канали: ранг-список #2-N ── */}
      {rest.length > 0 && (
        <div className="lg:col-span-12 min-w-0">
          <BentoCell className="p-5">
            <SectionHeading title="Інші канали" subtitle="Записи, виручка та динаміка за період" />
            <div className="flex flex-col">
              {rest.map((p, i) => {
                const Icon = CHANNEL_ICON[p.source] ?? Globe;
                return (
                  <button
                    type="button"
                    key={p.source}
                    onClick={() => onOpenDetail(channelDetail(p))}
                    className="flex items-center gap-3 py-2.5 border-b border-border/30 last:border-0 text-left w-full cursor-pointer group"
                  >
                    <span className="metric-value text-[13px] font-semibold text-text-sub w-4 flex-shrink-0 text-center">{i + 2}</span>
                    <span className="inline-flex size-7 items-center justify-center rounded-lg bg-secondary text-text-sub flex-shrink-0">
                      <Icon size={14} />
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">{p.source}</span>
                        <div className="flex items-baseline gap-2 flex-shrink-0">
                          {isPro && p.deltaPct !== null && <DeltaChip delta={p.deltaPct} />}
                          <span className="metric-value text-sm font-semibold text-foreground">{p.pct}%</span>
                        </div>
                      </div>
                      <div className="h-1 mt-2 rounded-full bg-secondary overflow-hidden">
                        <div className="h-full rounded-full bg-primary/70" style={{ width: `${Math.round((p.count / maxCount) * 100)}%` }} />
                      </div>
                      <p className="text-[11px] text-text-sub tabular-nums mt-1.5">
                        {p.count} {pluralUk(p.count, 'запис', 'записи', 'записів')} · {formatPrice(Math.round(p.revenue))}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </BentoCell>
        </div>
      )}
    </div>
  );
}
