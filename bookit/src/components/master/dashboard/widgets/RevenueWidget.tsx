'use client';

import { TrendingUp, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { useDashboardStats } from '@/lib/supabase/hooks/useDashboardStats';
import { Skeleton } from '@/components/ui/skeleton';
import { formatPrice } from '@/components/master/services/types';

export function RevenueWidget() {
  const { todayRevenue, todayCompleted, isLoading } = useDashboardStats();

  if (isLoading) {
    return <div className="p-6 space-y-4">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-10 w-32" />
      <Skeleton className="h-16 w-full rounded-2xl" />
    </div>;
  }

  return (
    <div className="p-6 h-full flex flex-col">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Виручка сьогодні</h3>
          <p className="text-3xl font-bold text-foreground mt-1">{formatPrice(todayRevenue)}</p>
        </div>
        <div className="w-10 h-10 rounded-2xl bg-success/12 flex items-center justify-center">
          <TrendingUp size={20} className="text-success" />
        </div>
      </div>

      <div className="flex-1 flex flex-col justify-end gap-4">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-0.5 text-success font-bold text-xs">
            <ArrowUpRight size={14} />
            <span>+12%</span>
          </div>
          <span className="text-[10px] text-muted-foreground/60 uppercase font-bold tracking-widest">vs вчора</span>
        </div>

        <div className="bg-white/40 border border-white/60 rounded-2xl p-3 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[10px] text-muted-foreground/60 uppercase font-bold tracking-widest">Завершено</span>
            <span className="text-sm font-bold">{todayCompleted} записів</span>
          </div>
          <div className="h-8 w-1 bg-success/20 rounded-full" />
        </div>
      </div>
    </div>
  );
}
