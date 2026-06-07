'use client';

import React from 'react';
import { useReviewsMetrics } from '@/lib/supabase/hooks/useReviewsMetrics';
import { SkeletonCell } from '../../primitives/SkeletonCell';
import { ErrorCell } from '../../primitives/ErrorCell';
import { EmptyCell } from '../../primitives/EmptyCell';
import { Star, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { pluralUk } from '@/lib/utils/pluralUk';

interface ReviewsTabProps {
  start: string;
  end: string;
}

export function ReviewsTab({ start, end }: ReviewsTabProps) {
  const { data, isLoading, isError, refetch } = useReviewsMetrics({ start, end });

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
        description="Тут з'явиться аналітика та NPS після того, як ваші клієнти залишать перші відгуки."
        icon={<Star size={20} />}
      />
    );
  }

  return (
    <div className="flex flex-col gap-5 w-full">
      {/* Метрики NPS та Рейтингу */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* NPS */}
        <div className="bento-card p-4 flex flex-col justify-between">
          <div>
            <p className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-wider">NPS лояльність</p>
            <p className="text-xs text-muted-foreground/70 mt-0.5">Net Promoter Score</p>
          </div>
          <div className="mt-4 flex items-baseline gap-1.5 select-none">
            <span className="metric-value text-3xl font-bold text-foreground">{data.npsScore}</span>
            <span className="text-[10px] text-muted-foreground/60 font-semibold">індекс від -100 до +100</span>
          </div>
        </div>

        {/* Середній бал */}
        <div className="bento-card p-4 flex flex-col justify-between">
          <div>
            <p className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-wider">Середня оцінка</p>
            <p className="text-xs text-muted-foreground/70 mt-0.5">Загальний бал відгуків</p>
          </div>
          <div className="mt-4 flex items-baseline gap-1.5 select-none">
            <span className="metric-value text-3xl font-bold text-warning flex items-center gap-1">
              <Star size={24} fill="var(--warning)" className="text-warning" />
              {data.averageRating}
            </span>
            <span className="text-[10px] text-muted-foreground/60 font-semibold">на основі {data.totalCount} {pluralUk(data.totalCount, 'відгуку', 'відгуків', 'відгуків')}</span>
          </div>
        </div>

        {/* Розподіл зірок */}
        <div className="bento-card p-4 flex flex-col gap-2">
          <p className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-wider select-none">Розподіл оцінок</p>
          <div className="flex flex-col gap-1.5 mt-1 select-none">
            {[5, 4, 3, 2, 1].map((stars) => {
              const count = data.distribution[stars] ?? 0;
              const pct = data.totalCount > 0 ? Math.round((count / data.totalCount) * 100) : 0;
              return (
                <div key={stars} className="flex items-center gap-2 text-[10px]">
                  <span className="w-3 font-semibold text-foreground">{stars}</span>
                  <div className="h-1.5 flex-1 bg-secondary rounded-full overflow-hidden">
                    <div className="h-full bg-warning rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="w-10 text-right text-muted-foreground/80 font-bold">
                    {pct}% ({count})
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Останні відгуки */}
      <div className="bento-card p-5">
        <p className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-wider mb-4 select-none">
          Останні відгуки
        </p>
        <div className="flex flex-col gap-3">
          {data.recentReviews.map((r, i) => (
            <div key={i} className="flex flex-col gap-1.5 p-3 rounded-2xl bg-secondary/30 border border-border/10 select-none">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-foreground">{r.client_name}</span>
                <div className="flex gap-0.5 text-warning">
                  {Array.from({ length: r.rating }).map((_, sIdx) => (
                    <Star key={sIdx} size={10} fill="var(--warning)" className="text-warning" />
                  ))}
                </div>
              </div>
              {r.comment && (
                <p className="text-xs text-muted-foreground leading-normal mt-0.5 italic">
                  "{r.comment}"
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
