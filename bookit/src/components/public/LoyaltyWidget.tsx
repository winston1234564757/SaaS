'use client';

import { Gift, Crown } from 'lucide-react';
import { pluralUk } from '@/lib/utils/pluralUk';

interface LoyaltyTier {
  targetVisits: number;
  rewardType: string;
  rewardValue: number;
}

interface Props {
  isAuth: boolean;
  currentVisits: number;
  tiers: LoyaltyTier[];
  onBook?: () => void;
}

function formatReward(tier: LoyaltyTier): string {
  if (tier.rewardType === 'percent_discount') return `-${tier.rewardValue}%`;
  if (tier.rewardType === 'fixed_discount') return `-${tier.rewardValue} ₴`;
  return 'Подарунок';
}

export function LoyaltyWidget({ isAuth, currentVisits, tiers, onBook }: Props) {
  if (tiers.length === 0) return null;

  const firstTier = tiers[0];
  const maxTier = tiers[tiers.length - 1];

  // Unauth — marketing teaser showing first (lowest) tier + CTA
  if (!isAuth) {
    return (
      <div className="bento-card p-4 bg-secondary/40 border border-border">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 bg-primary/15 text-primary">
            <Gift size={18} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground leading-snug">Програма лояльності</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Знижка {formatReward(firstTier)} після {firstTier.targetVisits}-го візиту
            </p>
          </div>
        </div>
        {onBook && (
          <button
            onClick={onBook}
            className="mt-3 w-full py-2 rounded-lg text-xs font-semibold text-primary-foreground transition-opacity hover:opacity-90 active:scale-[0.95] transition-all cursor-pointer bg-primary"
          >
            Записатись і отримати
          </button>
        )}
      </div>
    );
  }

  // Compute current and next tiers
  const currentTier = [...tiers].reverse().find(t => t.targetVisits <= currentVisits) ?? null;
  const nextTier = tiers.find(t => t.targetVisits > currentVisits) ?? null;
  const maxReached = currentVisits >= maxTier.targetVisits;

  // Max tier reached
  if (maxReached) {
    return (
      <div className="bento-card p-4 bg-secondary/40 border border-border">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Crown size={14} className="text-primary" />
            <span className="text-xs font-semibold text-foreground uppercase tracking-wider">Програма лояльності</span>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/15 text-primary">
            Максимум
          </span>
        </div>
        <div className="h-2 rounded-full mb-3 bg-primary" />
        <p className="text-xs font-semibold text-foreground">
          Ви досягли максимального рівня! Ваша постійна знижка: {formatReward(maxTier)}.
        </p>
      </div>
    );
  }

  // Progress toward next tier
  const progressPct = nextTier
    ? Math.min(100, Math.round((currentVisits / nextTier.targetVisits) * 100))
    : 100;
  const visitsLeft = nextTier ? nextTier.targetVisits - currentVisits : 0;

  return (
    <div className="bento-card p-4 bg-secondary/40 border border-border">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Gift size={14} className="text-primary" />
          <span className="text-xs font-semibold text-foreground uppercase tracking-wider">Програма лояльності</span>
        </div>
        <span className="text-xs font-bold text-warning">{currentVisits} / {nextTier?.targetVisits ?? maxTier.targetVisits}</span>
      </div>

      <div className="h-2 rounded-full mb-3 overflow-hidden bg-primary/15">
        <div
          className="h-full rounded-full transition-all duration-500 bg-primary"
          style={{ width: `${progressPct}%` }}
        />
      </div>

      {currentTier && (
        <p className="text-[11px] font-semibold mb-1 text-success">
          Ваша поточна знижка: {formatReward(currentTier)}
        </p>
      )}

      <p className="text-xs text-muted-foreground">
        {nextTier
          ? `Ще ${visitsLeft} ${pluralUk(visitsLeft, 'візит', 'візити', 'візитів')} до постійної знижки ${formatReward(nextTier)}.`
          : ''}
      </p>
    </div>
  );
}
