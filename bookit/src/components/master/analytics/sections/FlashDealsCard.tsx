'use client';

import React from 'react';
import { Flame, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface FlashDealsCardProps {
  dealsCount: number;
  claimedDeals: number;
}

export function FlashDealsCard({ dealsCount, claimedDeals }: FlashDealsCardProps) {
  const conversionRate = dealsCount > 0 ? Math.round((claimedDeals / dealsCount) * 100) : 0;

  return (
    <div className="flex flex-col justify-between h-full min-h-[180px]">
      <div className="flex justify-between items-start mb-2">
        <div>
          <p className="text-xs font-semibold text-muted-foreground/60 uppercase tracking-wider">Флеш-акції</p>
          <span className="text-xs text-muted-foreground/50">Гарячі пропозиції з дисконтом</span>
        </div>

        <div className="size-8 rounded-xl bg-warning/10 flex items-center justify-center text-warning flex-shrink-0">
          <Flame size={16} />
        </div>
      </div>

      <div className="flex flex-col gap-2 mt-1">
        <div className="flex items-baseline gap-1 select-none">
          <span className="metric-value text-2xl font-bold text-foreground">{dealsCount}</span>
          <span className="text-xs text-muted-foreground/60">акцій створено</span>
        </div>

        {dealsCount > 0 ? (
          <div className="flex flex-col gap-1.5 mt-2">
            <div className="flex justify-between text-[11px] leading-tight select-none">
              <span className="text-muted-foreground">Заброньовано:</span>
              <span className="font-bold text-foreground">{claimedDeals}</span>
            </div>
            
            <div className="flex justify-between text-[11px] leading-tight select-none">
              <span className="text-muted-foreground">Конверсія акцій:</span>
              <span className="font-bold text-success flex items-center gap-1">
                <CheckCircle size={10} />
                {conversionRate}%
              </span>
            </div>
          </div>
        ) : (
          <p className="text-[10px] text-muted-foreground/50 mt-3 italic select-none">
            У цьому періоді ви ще не запускали гарячі пропозиції.
          </p>
        )}
      </div>
    </div>
  );
}
