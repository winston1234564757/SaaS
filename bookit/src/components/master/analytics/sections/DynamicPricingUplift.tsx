'use client';

import React from 'react';
import { Zap } from 'lucide-react';
import { formatPrice } from '@/components/master/services/types';
import { pluralUk } from '@/lib/utils/pluralUk';

export interface DynamicPricingUpliftProps {
  upliftKopecks: number;
  ruleCounts: Record<string, number>;
  savedSlots: number;
}

// Чисті ключі типів (M-REV-05: RPC більше не фрагментує по повному лейблу).
const RULE_LABELS: Record<string, string> = {
  peak: 'Пікові години',
  quiet: 'Тихі години',
  early_bird: 'Раннє бронювання',
  last_minute: 'Остання хвилина',
};

export function DynamicPricingUplift({
  upliftKopecks,
  ruleCounts,
  savedSlots,
}: DynamicPricingUpliftProps) {
  const rulesList = Object.entries(ruleCounts).sort((a, b) => b[1] - a[1]);
  const totalCount = rulesList.reduce((sum, [, count]) => sum + count, 0);

  return (
    <div className="flex flex-col justify-between h-full min-h-[180px]">
      <div className="flex justify-between items-start mb-2">
        <div>
          <p className="text-xs font-semibold text-muted-foreground/60 uppercase tracking-wider">Розумні ціни</p>
          <span className="text-xs text-muted-foreground/70">Надбавка та врятовані слоти</span>
        </div>

        <div className="size-8 rounded-xl bg-accent/10 flex items-center justify-center text-accent flex-shrink-0">
          <Zap size={16} />
        </div>
      </div>

      <div className="flex flex-col gap-2 mt-1">
        <div className="flex items-baseline gap-2 select-none flex-wrap">
          <span className="metric-value text-2xl font-bold text-success">
            +{formatPrice(Math.round(upliftKopecks / 100))}
          </span>
          {savedSlots > 0 && (
            <span className="text-xs font-semibold text-foreground">
              · {savedSlots} {pluralUk(savedSlots, 'врятований слот', 'врятовані слоти', 'врятованих слотів')}
            </span>
          )}
        </div>

        {totalCount > 0 ? (
          <div className="flex flex-col gap-1.5 mt-2">
            <p className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-wider select-none">
              Спрацювань правил ({totalCount})
            </p>
            <div className="flex flex-col gap-1">
              {rulesList.slice(0, 3).map(([rule, count]) => (
                <div key={rule} className="flex justify-between text-[11px] leading-tight select-none">
                  <span className="text-muted-foreground">{RULE_LABELS[rule] ?? rule}</span>
                  <span className="font-bold text-foreground">{count} ×</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <p className="text-[10px] text-muted-foreground/70 mt-3 italic select-none">
            Правила розумного ціноутворення ще не спрацьовували за цей період.
          </p>
        )}
      </div>
    </div>
  );
}
