'use client';

import React from 'react';
import { Zap } from 'lucide-react';
import { formatPrice } from '@/components/master/services/types';
import { cn } from '@/lib/utils/cn';

export interface DynamicPricingUpliftProps {
  upliftKopecks: number;
  ruleCounts: Record<string, number>;
}

export function DynamicPricingUplift({
  upliftKopecks,
  ruleCounts,
}: DynamicPricingUpliftProps) {
  const rulesList = Object.entries(ruleCounts);
  const totalCount = rulesList.reduce((sum, [_, count]) => sum + count, 0);

  return (
    <div className="flex flex-col justify-between h-full min-h-[180px]">
      <div className="flex justify-between items-start mb-2">
        <div>
          <p className="text-xs font-semibold text-muted-foreground/60 uppercase tracking-wider">Розумні ціни</p>
          <span className="text-xs text-muted-foreground/50">Додатковий заробіток (Uplift)</span>
        </div>

        <div className="size-8 rounded-xl bg-accent/10 flex items-center justify-center text-accent flex-shrink-0">
          <Zap size={16} />
        </div>
      </div>

      <div className="flex flex-col gap-2 mt-1">
        <div className="flex items-baseline gap-1 select-none">
          <span className="metric-value text-2xl font-bold text-success">
            +{formatPrice(Math.round(upliftKopecks / 100))}
          </span>
        </div>

        {totalCount > 0 ? (
          <div className="flex flex-col gap-1.5 mt-2">
            <p className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-wider select-none">
              Спрацювань правил ({totalCount})
            </p>
            <div className="flex flex-col gap-1">
              {rulesList.slice(0, 2).map(([rule, count]) => {
                let ruleLabel = rule;
                if (rule === 'peak') ruleLabel = 'Пікові години';
                if (rule === 'quiet') ruleLabel = 'Спокійні години';
                if (rule === 'early_bird') ruleLabel = 'Раннє бронювання';
                if (rule === 'last_minute') ruleLabel = 'Остання хвилина';

                return (
                  <div key={rule} className="flex justify-between text-[11px] leading-tight select-none">
                    <span className="text-muted-foreground">{ruleLabel}</span>
                    <span className="font-bold text-foreground">{count} ×</span>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <p className="text-[10px] text-muted-foreground/50 mt-3 italic select-none">
            Правила розумного ціноутворення ще не спрацьовували за цей період.
          </p>
        )}
      </div>
    </div>
  );
}
