'use client';

import React from 'react';
import { Star, ArrowUpRight, ArrowDownRight, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { pluralUk } from '@/lib/utils/pluralUk';
import { useReviewsMetrics } from '@/lib/supabase/hooks/useReviewsMetrics';
import type { ReviewsMetrics, ReviewMetricPoint } from '@/lib/supabase/hooks/useReviewsMetrics';
import { SkeletonCell } from '../../primitives/SkeletonCell';
import { ErrorCell } from '../../primitives/ErrorCell';
import { EmptyCell } from '../../primitives/EmptyCell';
import { BentoCell } from '../../primitives/BentoCell';
import { SectionHeading } from '../OverviewTab';
import type { OverviewDetail } from '../OverviewDetailSheet';

interface ReviewsTabProps {
  start: string;
  end: string;
  onOpenDetail: (d: OverviewDetail) => void;
}

function formatReviewDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('uk-UA', { day: 'numeric', month: 'long', year: 'numeric' });
  } catch {
    return '';
  }
}

/** Δ-чіп на темному slate-герої (світлі тінти для контрасту на #0F172A) */
function DarkDeltaChip({ value, suffix = '' }: { value: number; suffix?: string }) {
  if (value === 0) return null;
  const up = value > 0;
  const Icon = up ? ArrowUpRight : ArrowDownRight;
  return (
    <span className={cn('inline-flex items-center gap-0.5 text-xs font-semibold leading-none tabular-nums', up ? 'text-emerald-300' : 'text-rose-300')}>
      <Icon size={13} strokeWidth={2.5} />
      {up ? '+' : ''}{value}{suffix}
    </span>
  );
}

function bucketDetail(stars: number, count: number, total: number): OverviewDetail {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return {
    title: `${stars} ${pluralUk(stars, 'зірка', 'зірки', 'зірок')}`,
    eyebrow: 'Розподіл оцінок',
    hero: { label: 'Відгуків', value: String(count) },
    rows: [{ label: 'Частка', value: `${pct}%`, tone: 'primary' }],
    note: 'Скільки відгуків отримали саме цю оцінку за вибраний період.',
  };
}

function reviewDetail(r: ReviewMetricPoint): OverviewDetail {
  return {
    title: r.client_name,
    eyebrow: 'Відгук',
    hero: { label: 'Оцінка', value: `${r.rating} / 5` },
    rows: [{ label: 'Дата', value: formatReviewDate(r.created_at) }],
    note: r.comment || 'Клієнт залишив лише оцінку, без коментаря.',
  };
}

function npsDetail(d: ReviewsMetrics): OverviewDetail {
  const promoters = d.distribution[5] ?? 0;
  const passives = d.distribution[4] ?? 0;
  const detractors = (d.distribution[1] ?? 0) + (d.distribution[2] ?? 0) + (d.distribution[3] ?? 0);
  return {
    title: 'Лояльність клієнтів',
    eyebrow: 'NPS',
    hero: { label: 'NPS', value: String(d.npsScore) },
    rows: [
      { label: 'Промоутери (оцінка 5)', value: String(promoters), tone: 'success' },
      { label: 'Нейтральні (оцінка 4)', value: String(passives) },
      { label: 'Критики (оцінка 1–3)', value: String(detractors), tone: 'warning' },
    ],
    note: 'NPS = частка промоутерів (оцінка 5) мінус частка критиків (оцінка 1–3). Вище нуля означає, що задоволених більше.',
  };
}

export function ReviewsTab({ start, end, onOpenDetail }: ReviewsTabProps) {
  const { data, isLoading, isError, refetch } = useReviewsMetrics({ start, end, compareTrend: true });

  if (isLoading) {
    return <SkeletonCell variant="flat" className="min-h-[250px]" />;
  }
  if (isError) {
    return <ErrorCell onRetry={refetch} />;
  }
  if (!data || data.totalCount === 0) {
    return (
      <EmptyCell
        title="Відгуків ще немає"
        description="Тут зʼявиться репутація та NPS після того, як ваші клієнти залишать перші відгуки."
        icon={<Star size={20} />}
      />
    );
  }

  return <ReviewsTabView data={data} onOpenDetail={onOpenDetail} />;
}

/** Чиста презентація (без fetch) — для прев'ю/тестів і верифікації власними очима */
export function ReviewsTabView({
  data,
  onOpenDetail,
}: {
  data: ReviewsMetrics;
  onOpenDetail: (d: OverviewDetail) => void;
}) {
  const avgRounded = Math.round(data.averageRating);
  const promoters = data.distribution[5] ?? 0;
  const passives = data.distribution[4] ?? 0;
  const detractors = (data.distribution[1] ?? 0) + (data.distribution[2] ?? 0) + (data.distribution[3] ?? 0);
  const maxBucket = Math.max(...[5, 4, 3, 2, 1].map(s => data.distribution[s] ?? 0), 1);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
      {/* ── Темний герой: репутація (cover) ── */}
      <div className="lg:col-span-12 min-w-0">
        <section
          className="relative overflow-hidden rounded-[var(--card-radius)] text-[var(--accent-on)]"
          style={{ background: 'var(--hero-card-bg)', boxShadow: 'var(--hero-card-shadow)' }}
          aria-label="Репутація за період"
        >
          <div aria-hidden className="pointer-events-none absolute -top-24 -right-16 size-72 rounded-full blur-3xl" style={{ background: 'rgba(99,102,241,0.28)' }} />
          <div aria-hidden className="pointer-events-none absolute -bottom-28 -left-20 size-72 rounded-full blur-3xl" style={{ background: 'rgba(139,92,246,0.18)' }} />

          <div className="relative z-10 p-6 md:p-8">
            {/* Masthead */}
            <div className="flex items-center justify-between gap-4 pb-4 border-b border-white/12">
              <h2 className="heading-serif text-lg md:text-xl text-white/90 leading-none">Репутація</h2>
              <span className="text-xs font-medium text-white/55 tabular-nums">
                {data.totalCount} {pluralUk(data.totalCount, 'відгук', 'відгуки', 'відгуків')}
              </span>
            </div>

            {/* Cover: середній бал + NPS */}
            <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-6 lg:gap-10 pt-6">
              {/* Ліворуч: середній бал-домінанта */}
              <div className="flex flex-col justify-center">
                <p className="text-[13px] font-medium text-white/55 mb-1.5">Середня оцінка</p>
                <div className="flex items-end gap-2.5 flex-wrap">
                  <span className="heading-serif leading-[0.9] text-[clamp(2.75rem,7vw,4.5rem)] text-white tracking-tight">
                    {data.averageRating.toFixed(1)}
                  </span>
                  {data.deltaAvg !== null && <span className="mb-2.5"><DarkDeltaChip value={data.deltaAvg} /></span>}
                </div>
                <div className="flex items-center gap-1 mt-2">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} size={18} className={cn(s <= avgRounded ? 'text-amber-400 fill-amber-400' : 'text-white/25')} />
                  ))}
                </div>
                {data.deltaAvg !== null && (
                  <p className="text-xs text-white/55 mt-2">проти минулого періоду</p>
                )}
              </div>

              {/* Праворуч: NPS спів-герой (клік → пояснення) */}
              <button
                type="button"
                onClick={() => onOpenDetail(npsDetail(data))}
                className="flex flex-col justify-center text-left w-full group cursor-pointer lg:border-l lg:border-white/12 lg:pl-10"
              >
                <p className="text-[13px] font-medium text-white/55 mb-1.5 flex items-center gap-1.5">
                  Лояльність клієнтів
                  <ArrowRight size={12} className="opacity-0 group-hover:opacity-60 -translate-x-1 group-hover:translate-x-0 transition-all" />
                </p>
                <div className="flex items-end gap-2.5 flex-wrap">
                  <span className="metric-value text-[clamp(2.25rem,5.5vw,3.25rem)] font-semibold text-white leading-none">{data.npsScore}</span>
                  {data.deltaNps !== null && <span className="mb-1.5"><DarkDeltaChip value={data.deltaNps} /></span>}
                </div>
                <p className="text-xs text-white/55 mt-2">індекс від −100 до +100</p>
              </button>
            </div>

            {/* By the numbers: композиція NPS */}
            <div className="mt-7 pt-5 border-t border-white/12 grid grid-cols-3 divide-x divide-white/12">
              {[
                { label: 'Промоутери', value: promoters, hint: 'оцінка 5' },
                { label: 'Нейтральні', value: passives, hint: 'оцінка 4' },
                { label: 'Критики', value: detractors, hint: 'оцінка 1–3' },
              ].map((m, i) => (
                <div key={m.label} className={cn('flex flex-col', i === 0 ? 'pr-4' : 'px-4', i === 2 && 'pr-0')}>
                  <span className="metric-value text-2xl md:text-[28px] text-white leading-none">{m.value}</span>
                  <span className="text-[11px] md:text-xs font-medium text-white/55 mt-1.5">{m.label}</span>
                  <span className="text-[10px] text-white/55 mt-0.5">{m.hint}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>

      {/* ── Розподіл оцінок (клік → інсайт) ── */}
      <div className="lg:col-span-5 min-w-0">
        <BentoCell className="h-full p-5">
          <SectionHeading title="Розподіл оцінок" subtitle="Скільки яких оцінок за період" />
          <div className="flex flex-col gap-1.5">
            {[5, 4, 3, 2, 1].map((stars) => {
              const count = data.distribution[stars] ?? 0;
              const pct = data.totalCount > 0 ? Math.round((count / data.totalCount) * 100) : 0;
              return (
                <button
                  type="button"
                  key={stars}
                  onClick={() => onOpenDetail(bucketDetail(stars, count, data.totalCount))}
                  disabled={count === 0}
                  className="flex items-center gap-2.5 py-1.5 text-left w-full cursor-pointer group disabled:cursor-default disabled:opacity-50"
                >
                  <span className="flex items-center gap-0.5 w-7 flex-shrink-0">
                    <span className="metric-value text-sm font-semibold text-foreground">{stars}</span>
                    <Star size={11} className="text-warning fill-current" />
                  </span>
                  <div className="h-2 flex-1 rounded-full bg-secondary overflow-hidden">
                    <div className="h-full rounded-full bg-warning/80" style={{ width: `${Math.round((count / maxBucket) * 100)}%` }} />
                  </div>
                  <span className="metric-value text-xs font-semibold text-foreground w-14 text-right flex-shrink-0 tabular-nums">
                    {pct}% <span className="text-text-sub">({count})</span>
                  </span>
                </button>
              );
            })}
          </div>
        </BentoCell>
      </div>

      {/* ── Останні відгуки (клік → деталі) ── */}
      <div className="lg:col-span-7 min-w-0">
        <BentoCell className="h-full p-5">
          <SectionHeading title="Останні відгуки" subtitle="Що пишуть клієнти" />
          <div className="flex flex-col">
            {data.recentReviews.map((r, i) => (
              <button
                type="button"
                key={i}
                onClick={() => onOpenDetail(reviewDetail(r))}
                className="flex flex-col gap-1.5 py-3 border-b border-border/30 last:border-0 text-left w-full cursor-pointer group"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">{r.client_name}</span>
                  <span className="flex items-center gap-0.5 flex-shrink-0">
                    {Array.from({ length: r.rating }).map((_, sIdx) => (
                      <Star key={sIdx} size={11} className="text-warning fill-current" />
                    ))}
                  </span>
                </div>
                {r.comment && (
                  <p className="text-xs text-text-sub leading-relaxed line-clamp-2">{r.comment}</p>
                )}
              </button>
            ))}
          </div>
        </BentoCell>
      </div>
    </div>
  );
}
