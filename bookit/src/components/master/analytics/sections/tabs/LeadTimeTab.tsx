'use client';

import React, { useMemo } from 'react';
import { useLeadTimeDistribution } from '@/lib/supabase/hooks/useLeadTimeDistribution';
import { SkeletonCell } from '../../primitives/SkeletonCell';
import { ErrorCell } from '../../primitives/ErrorCell';
import { EmptyCell } from '../../primitives/EmptyCell';
import { Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import { pluralUk } from '@/lib/utils/pluralUk';

interface LeadTimeTabProps {
  start: string;
  end: string;
}

export function LeadTimeTab({ start, end }: LeadTimeTabProps) {
  const { data, isLoading, isError, refetch } = useLeadTimeDistribution({ start, end });

  const buckets = useMemo(() => {
    if (!data) return [];
    
    const items = [
      { label: 'У той самий день', value: data.same_day },
      { label: '1 – 3 дні', value: data.one_three_days },
      { label: '3 – 7 днів', value: data.three_seven_days },
      { label: '1 – 2 тижні', value: data.seven_fourteen_days },
      { label: 'Більше 2 тижнів', value: data.above_fourteen_days },
    ];

    const maxVal = Math.max(...items.map((x) => x.value), 1);
    
    return items.map((item) => ({
      ...item,
      pct: data.totalBookings > 0 ? Math.round((item.value / data.totalBookings) * 100) : 0,
      fillPct: Math.round((item.value / maxVal) * 100),
    }));
  }, [data]);

  if (isLoading) {
    return <SkeletonCell variant="flat" className="min-h-[250px]" />;
  }

  if (isError) {
    return <ErrorCell onRetry={refetch} />;
  }

  if (!data || data.totalBookings === 0) {
    return (
      <EmptyCell
        title="Записів ще немає"
        description="Тут з'явиться аналітика часу попереднього запису після отримання перших бронювань."
        icon={<Clock size={24} />}
      />
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-[1fr_2fr] gap-5 w-full">
      {/* Метрика середнього часу */}
      <div className="bento-card p-5 bg-surface/60 backdrop-blur-md border border-white/20 shadow-[0_4px_24px_rgb(0,0,0,0.02)] relative overflow-hidden flex flex-col justify-between min-h-[160px]">
        {/* Soft background glow */}
        <div className="absolute -top-10 -right-10 size-32 bg-primary/10 rounded-full blur-2xl pointer-events-none" />
        
        <div className="flex items-start justify-between relative z-10">
          <div>
            <p className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-wider">Середній час запису</p>
            <p className="text-xs text-muted-foreground/70 mt-1 max-w-[200px] leading-relaxed">За скільки часу клієнти планують візит</p>
          </div>
          <div className="size-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary drop-shadow-sm border border-primary/20 flex-shrink-0">
            <Clock size={18} />
          </div>
        </div>
        
        <div className="mt-6 flex items-baseline gap-2 select-none relative z-10">
          <span className="metric-value text-4xl font-bold text-foreground drop-shadow-sm">{data.averageDays}</span>
          <span className="text-sm font-bold text-primary">{pluralUk(Math.round(data.averageDays), 'день', 'дні', 'днів')}</span>
        </div>
      </div>

      {/* Гістограма розподілу */}
      <div className="bento-card p-5 bg-surface/40 backdrop-blur-sm border border-white/10">
        <p className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-wider mb-5 select-none">
          Розподіл часу бронювання
        </p>
        <div className="flex flex-col gap-4 select-none">
          {buckets.map((b, idx) => (
            <div key={b.label} className="flex flex-col gap-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-foreground">{b.label}</span>
                <span className="font-bold text-foreground">
                  {b.value} <span className="text-muted-foreground font-semibold">{pluralUk(b.value, 'запис', 'записи', 'записів')}</span> <span className="text-[10px] text-muted-foreground/50 ml-1">({b.pct}%)</span>
                </span>
              </div>
              <div className="h-2.5 w-full rounded-full bg-secondary/60 overflow-hidden shadow-inner">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${b.fillPct}%` }}
                  transition={{
                    type: 'spring',
                    stiffness: 90,
                    damping: 15,
                    delay: idx * 0.05,
                  }}
                  className="h-full rounded-full bg-gradient-to-r from-primary/80 to-primary shadow-sm"
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
