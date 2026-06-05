'use client';

import React, { useMemo } from 'react';
import { useLeadTimeDistribution } from '@/lib/supabase/hooks/useLeadTimeDistribution';
import { SkeletonCell } from '../../primitives/SkeletonCell';
import { ErrorCell } from '../../primitives/ErrorCell';
import { EmptyCell } from '../../primitives/EmptyCell';
import { Clock } from 'lucide-react';
import { motion } from 'framer-motion';

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
        icon={<Clock size={20} />}
      />
    );
  }

  return (
    <div className="flex flex-col gap-5 w-full">
      {/* Метрика середнього часу */}
      <div className="bento-card p-4 flex flex-col justify-between">
        <div>
          <p className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-wider">Середній час попереднього запису</p>
          <p className="text-xs text-muted-foreground/50 mt-0.5">За скільки днів до візиту клієнти створюють записи</p>
        </div>
        <div className="mt-4 flex items-baseline gap-1.5 select-none">
          <span className="metric-value text-3xl font-bold text-primary">{data.averageDays} дн.</span>
          <span className="text-[10px] text-muted-foreground/60 font-semibold">на основі {data.totalBookings} записів</span>
        </div>
      </div>

      {/* Гістограма розподілу */}
      <div className="bento-card p-5">
        <p className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-wider mb-4 select-none">
          Розподіл часу бронювання
        </p>
        <div className="flex flex-col gap-3.5 select-none">
          {buckets.map((b, idx) => (
            <div key={b.label} className="flex flex-col gap-1">
              <div className="flex justify-between items-center text-xs">
                <span className="font-medium text-foreground">{b.label}</span>
                <span className="font-semibold text-muted-foreground">
                  {b.value} запис. <span className="text-[10px] text-muted-foreground/50">({b.pct}%)</span>
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-secondary overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${b.fillPct}%` }}
                  transition={{
                    type: 'spring',
                    stiffness: 100,
                    damping: 20,
                    delay: idx * 0.05,
                  }}
                  className="h-full rounded-full bg-gradient-to-r from-primary to-primary/60"
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
