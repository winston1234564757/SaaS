'use client';

import React from 'react';
import { Award, UserPlus, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface GrowthListsProps {
  loyaltyMembersCount: number;
  loyaltyPointsEarned: number;
  referralsSent: number;
  referralsSignedUp: number;
  referralsActivated: number;
}

export function GrowthLists({
  loyaltyMembersCount,
  loyaltyPointsEarned,
  referralsSent,
  referralsSignedUp,
  referralsActivated,
}: GrowthListsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full bento-card p-5">
      {/* Ліва секція: Loyalty Program */}
      <div className="flex flex-col justify-between h-full min-h-[160px] pr-0 md:pr-4 md:border-r border-border/10">
        <div className="flex justify-between items-start mb-2">
          <div>
            <p className="text-xs font-semibold text-muted-foreground/60 uppercase tracking-wider">Клуб лояльності</p>
            <span className="text-xs text-muted-foreground/50">Учасники та накопичені бали</span>
          </div>
          <div className="size-8 rounded-xl bg-success/10 flex items-center justify-center text-success flex-shrink-0">
            <Award size={16} />
          </div>
        </div>

        <div className="flex flex-col gap-3 mt-2 select-none">
          <div className="flex items-baseline gap-1.5">
            <span className="metric-value text-2xl font-bold text-foreground">{loyaltyMembersCount}</span>
            <span className="text-xs text-muted-foreground/60 font-semibold">активних учасників</span>
          </div>
          <div className="flex justify-between text-xs py-2 px-3 rounded-xl bg-secondary/50 border border-border/5">
            <span className="text-muted-foreground">Нараховано балів:</span>
            <span className="font-bold text-success flex items-center gap-1">
              <TrendingUp size={12} />
              {loyaltyPointsEarned}
            </span>
          </div>
        </div>
      </div>

      {/* Права секція: Referral Funnel */}
      <div className="flex flex-col justify-between h-full min-h-[160px] pl-0 md:pl-4">
        <div className="flex justify-between items-start mb-2">
          <div>
            <p className="text-xs font-semibold text-muted-foreground/60 uppercase tracking-wider">Реферальна мережа</p>
            <span className="text-xs text-muted-foreground/50">Воронка Life-Time запрошень</span>
          </div>
          <div className="size-8 rounded-xl bg-accent/10 flex items-center justify-center text-accent flex-shrink-0">
            <UserPlus size={16} />
          </div>
        </div>

        <div className="flex flex-col gap-2 mt-2 select-none">
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: 'Надіслано', value: referralsSent, color: 'text-muted-foreground' },
              { label: 'Зареєстровано', value: referralsSignedUp, color: 'text-foreground' },
              { label: 'Активовано', value: referralsActivated, color: 'text-primary' },
            ].map((step, idx) => (
              <div key={idx} className="flex flex-col items-center p-2 rounded-xl bg-secondary/40 border border-border/5">
                <span className={cn('text-base font-bold', step.color)}>{step.value}</span>
                <span className="text-[9px] text-muted-foreground/60 text-center leading-tight mt-1">
                  {step.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
