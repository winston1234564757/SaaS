'use client';

import React from 'react';
import { Users, AlertTriangle } from 'lucide-react';
import { LtvHistogram } from '../charts/LtvHistogram';
import { formatPrice } from '@/components/master/services/types';

export interface WinbackCandidate {
  client_name: string;
  client_phone: string;
  ltv: number; // в копійках
  last_visit_date: string;
  days_inactive: number;
}

interface LtvConcentrationProps {
  concentrationPct: number;
  ltvDistribution: Record<string, number>;
  winbackCandidates: WinbackCandidate[];
  onOpenClient?: (name: string, phone: string) => void;
}

export function LtvConcentration({
  concentrationPct,
  ltvDistribution,
  winbackCandidates,
  onOpenClient,
}: LtvConcentrationProps) {
  return (
    <div className="flex flex-col gap-4 h-full min-h-[360px] justify-between">
      {/* Шапка та концентрація */}
      <div>
        <div className="flex justify-between items-start mb-2">
          <div>
            <p className="text-xs font-semibold text-muted-foreground/60 uppercase tracking-wider">LTV Концентрація</p>
            <span className="text-xs text-muted-foreground/70">Сума життєвого циклу клієнта</span>
          </div>
          <div className="size-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
            <Users size={16} />
          </div>
        </div>

        <div className="flex items-baseline gap-1 mt-1 select-none">
          <span className="metric-value text-2xl font-bold text-foreground">{concentrationPct}%</span>
          <span className="text-xs text-muted-foreground/60">виручки приносять топ-20% клієнтів</span>
        </div>
      </div>

      {/* Гістограма розподілу LTV */}
      <div className="flex-1 mt-2">
        <p className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-wider mb-2 select-none">
          Розподіл бази клієнтів
        </p>
        <LtvHistogram distribution={ltvDistribution} />
      </div>

      {/* VIP кандидати на повернення */}
      {winbackCandidates.length > 0 && (
        <div className="mt-3 border-t border-border/10 pt-3">
          <p className="text-[10px] font-semibold text-destructive/80 uppercase tracking-wider mb-2 flex items-center gap-1 select-none">
            <AlertTriangle size={10} />
            Кандидати на повернення (Win-back)
          </p>
          <div className="flex flex-col gap-1.5">
            {winbackCandidates.map((c, i) => (
              <button
                type="button"
                key={i}
                onClick={() => onOpenClient?.(c.client_name, c.client_phone)}
                className="flex items-center justify-between p-2 rounded-xl hover:bg-secondary/60 transition-colors text-left w-full cursor-pointer"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-foreground truncate">{c.client_name}</p>
                  <p className="text-[10px] text-muted-foreground/60 leading-none mt-0.5">
                    Немає {c.days_inactive} дн. · LTV {formatPrice(Math.round(c.ltv / 100))}
                  </p>
                </div>
                <span className="text-[10px] font-bold text-primary whitespace-nowrap ml-2">
                  Повернути →
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
