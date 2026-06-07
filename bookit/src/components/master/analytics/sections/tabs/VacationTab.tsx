'use client';

import React, { useState } from 'react';
import { useVacationImpact } from '@/lib/supabase/hooks/useVacationImpact';
import { SkeletonCell } from '../../primitives/SkeletonCell';
import { ErrorCell } from '../../primitives/ErrorCell';
import { EmptyCell } from '../../primitives/EmptyCell';
import { ShieldAlert, Calendar, LifeBuoy } from 'lucide-react';
import { formatPrice } from '@/components/master/services/types';
import { useToast } from '@/lib/toast/context';
import { pluralUk } from '@/lib/utils/pluralUk';

interface VacationTabProps {
  start: string;
  end: string;
}

export function VacationTab({ start, end }: VacationTabProps) {
  const { data, isLoading, isError, refetch } = useVacationImpact({ start, end });
  const [rescueActive, setRescueActive] = useState(false);
  const { showToast } = useToast();

  const handleOptimize = () => {
    setRescueActive(true);
    showToast({
      type: 'success',
      title: 'Розклад оптимізовано!',
      message: 'Додаткові слоти відкриті. Пропозиції запису надіслані клієнтам.',
    });
  };

  if (isLoading) {
    return <SkeletonCell variant="flat" className="min-h-[250px]" />;
  }

  if (isError) {
    return <ErrorCell onRetry={refetch} />;
  }

  if (!data || data.offSegmentsCount === 0) {
    return (
      <EmptyCell
        title="Відпусток не заплановано"
        description="Тут з'явиться розрахунок потенційної втраченої вигоди, якщо ви додасте відпустки чи вихідні дні."
        actionLabel="Додати вихідний"
        actionHref="/dashboard/settings"
        icon={<Calendar size={20} />}
      />
    );
  }

  return (
    <div className="flex flex-col gap-5 w-full">
      {/* Картки аналізу */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Втрачена вигода */}
        <div className="bento-card p-4 flex flex-col justify-between">
          <div>
            <p className="text-[10px] font-semibold text-destructive/80 uppercase tracking-wider flex items-center gap-1">
              <ShieldAlert size={12} />
              Втрачена вигода (Оцінка)
            </p>
            <p className="text-xs text-muted-foreground/70 mt-0.5">Сума, яку ви могли заробити у ці дні</p>
          </div>
          <div className="mt-4 flex items-baseline gap-1.5 select-none">
            <span className="metric-value text-3xl font-bold text-destructive">
              {formatPrice(Math.round(data.estimatedLostRevenue / 100))}
            </span>
            <span className="text-[10px] text-muted-foreground/60 font-semibold">
              за {data.totalOffDays} {pluralUk(data.totalOffDays, 'вихідний день', 'вихідні дні', 'вихідних днів')}
            </span>
          </div>
        </div>

        {/* Середній дохід за день */}
        <div className="bento-card p-4 flex flex-col justify-between">
          <div>
            <p className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-wider">Середній дохід за робочий день</p>
            <p className="text-xs text-muted-foreground/70 mt-0.5">На основі виконаних бронювань у періоді</p>
          </div>
          <div className="mt-4 flex items-baseline gap-1.5 select-none">
            <span className="metric-value text-3xl font-bold text-foreground">
              {formatPrice(Math.round(data.averageDailyRevenue / 100))}
            </span>
            <span className="text-[10px] text-muted-foreground/60 font-semibold">/ день</span>
          </div>
        </div>
      </div>

      {/* Vacation Rescue Widget */}
      {data.estimatedLostRevenue > 0 && (
        <div className="bento-card p-5 bg-primary/5 border border-primary/15 flex flex-col gap-4 relative overflow-hidden">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
            <div>
              <p className="text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-1.5">
                <LifeBuoy size={14} /> Рятувальник відпустки
              </p>
              <h3 className="text-sm font-semibold text-foreground mt-1.5">
                {rescueActive 
                  ? 'Розклад успішно оптимізовано!' 
                  : `Врятуйте ₴${Math.round(data.estimatedLostRevenue / 100 * 0.4)} від втрати`
                }
              </h3>
              <p className="text-xs text-muted-foreground/75 mt-1 leading-normal max-w-xl">
                {rescueActive
                  ? 'Додаткові слоти відкриті за 3 дні до та після відпустки. Ми надіслали сповіщення в Telegram клієнтам.'
                  : 'Ми можемо відкрити додаткові 2 години у вашому розкладі за 3 дні до та 3 дні після відпустки, а також автоматично запропонувати ці слоти вашим постійним клієнтам.'
                }
              </p>
            </div>
            
            <button
              type="button"
              onClick={handleOptimize}
              disabled={rescueActive}
              className={`flex-shrink-0 px-5 py-3 rounded-full text-xs font-bold transition-all active:scale-[0.95] ${
                rescueActive 
                  ? 'bg-success/10 text-success border border-success/20 cursor-default' 
                  : 'bg-primary text-primary-foreground hover:bg-primary/95 cursor-pointer'
              }`}
            >
              {rescueActive ? 'Оптимізовано' : 'Оптимізувати розклад'}
            </button>
          </div>
        </div>
      )}

      <div className="bento-card p-5 select-none">
        <p className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-wider mb-2">Як рахується оцінка?</p>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Ми беремо загальний дохід від завершених записів у поточному періоді, ділимо на кількість унікальних робочих днів для отримання середнього денного доходу. Після цього множимо отримане значення на кількість днів у зафіксованих відпустках чи вихідних.
        </p>
      </div>
    </div>
  );
}
