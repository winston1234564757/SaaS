'use client';

import React from 'react';
import { useNoShowMetrics } from '@/lib/supabase/hooks/useNoShowMetrics';
import { SkeletonCell } from '../../primitives/SkeletonCell';
import { ErrorCell } from '../../primitives/ErrorCell';
import { EmptyCell } from '../../primitives/EmptyCell';
import { AlertTriangle, UserX } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface NoShowTabProps {
  start: string;
  end: string;
}

export function NoShowTab({ start, end }: NoShowTabProps) {
  const { data, isLoading, isError, refetch } = useNoShowMetrics({ start, end });

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
        description="Тут з'явиться аналітика скасувань та неявок після отримання перших бронювань."
        icon={<UserX size={20} />}
      />
    );
  }

  return (
    <div className="flex flex-col gap-5 w-full">
      {/* Картки неявок та скасувань */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Неявки */}
        <div className="bento-card p-4 flex flex-col justify-between">
          <div>
            <p className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-wider">Неявки (No-Show)</p>
            <p className="text-xs text-muted-foreground/50 mt-0.5">Клієнти, які не прийшли на запис</p>
          </div>
          <div className="mt-4 flex items-baseline gap-1.5 select-none">
            <span className="metric-value text-3xl font-bold text-destructive">{data.noShowCount}</span>
            <span className="text-[10px] text-destructive/80 font-bold">({data.noShowPct}%)</span>
            <span className="text-[10px] text-muted-foreground/60 font-semibold">від загальних {data.totalBookings} зап.</span>
          </div>
        </div>

        {/* Скасування */}
        <div className="bento-card p-4 flex flex-col justify-between">
          <div>
            <p className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-wider">Скасування</p>
            <p className="text-xs text-muted-foreground/50 mt-0.5">Записи, скасовані клієнтами</p>
          </div>
          <div className="mt-4 flex items-baseline gap-1.5 select-none">
            <span className="metric-value text-3xl font-bold text-warning">{data.cancellationCount}</span>
            <span className="text-[10px] text-warning/80 font-bold">({data.cancellationPct}%)</span>
            <span className="text-[10px] text-muted-foreground/60 font-semibold">від загальних {data.totalBookings}  зап.</span>
          </div>
        </div>
      </div>

      {/* Історія інцидентів */}
      <div className="bento-card p-5">
        <p className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-wider mb-4 select-none">
          Журнал інцидентів скасувань та неявок
        </p>
        {data.history.length > 0 ? (
          <div className="flex flex-col gap-3">
            {data.history.map((r, i) => (
              <div key={i} className="flex flex-col gap-1.5 p-3 rounded-2xl bg-secondary/30 border border-border/10 select-none">
                <div className="flex items-center justify-between text-xs w-full">
                  <span className="font-semibold text-foreground">{r.client_name}</span>
                  <span
                    className={cn(
                      'text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full',
                      r.status === 'no_show'
                        ? 'bg-destructive/10 text-destructive'
                        : 'bg-warning/10 text-warning'
                    )}
                  >
                    {r.status === 'no_show' ? 'Не з\'явився' : 'Скасовано'}
                  </span>
                </div>
                <div className="flex justify-between items-baseline text-[10px] text-muted-foreground mt-0.5 leading-none">
                  <span>Дата: {r.date} · {r.start_time.slice(0, 5)}</span>
                  <span>Телефон: {r.client_phone}</span>
                </div>
                {r.cancellation_reason && (
                  <p className="text-[10px] text-muted-foreground/60 mt-1 italic">
                    Причина: "{r.cancellation_reason}"
                  </p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground/50 text-center py-4 italic">
            Інцидентів скасувань або неявок за цей період не зафіксовано.
          </p>
        )}
      </div>
    </div>
  );
}
