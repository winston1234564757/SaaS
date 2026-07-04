'use client';

import { Gift, Crown, ArrowRight } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { pluralUk } from '@/lib/utils/pluralUk';
import { createClient } from '@/lib/supabase/client';
import { Section } from '@/components/ui/Section';

interface LoyaltyTier {
  targetVisits: number;
  rewardType: string;
  rewardValue: number;
}

interface Props {
  masterId: string;
  serverIsAuth: boolean;
  serverCurrentVisits: number;
  tiers: LoyaltyTier[];
  onBook?: () => void;
}

// Калібрований тон активної знижки на Frost `--surface` (good 5.25:1, не сирий --success).
const GOOD = '#0B6B2E';

function formatReward(tier: LoyaltyTier): string {
  if (tier.rewardType === 'percent_discount') return `-${tier.rewardValue}%`;
  if (tier.rewardType === 'fixed_discount') return `-${tier.rewardValue} ₴`;
  return 'Подарунок';
}

/**
 * DS-CLIENT-01 — програма лояльності клієнта на публічній сторінці. Дизайн-мова: світлий
 * `Section` з домінантою (поточна знижка / прогрес), а не рівний bento з вимитими токенами.
 * Викорінено `text-muted-foreground` + warning/success на дрібному тексті (провал 4.5:1).
 */
export function LoyaltyWidget({ masterId, serverIsAuth, serverCurrentVisits, tiers, onBook }: Props) {
  const { data: clientAuth } = useQuery({
    queryKey: ['loyalty-visits', masterId],
    queryFn: async () => {
      const sb = createClient();
      const { data: { user } } = await sb.auth.getUser();
      if (!user) return { isAuth: false, visits: 0 };
      const { count } = await sb
        .from('bookings')
        .select('*', { count: 'exact', head: true })
        .eq('master_id', masterId)
        .eq('client_id', user.id)
        .eq('status', 'completed');
      return { isAuth: true, visits: count ?? 0 };
    },
    staleTime: 2 * 60 * 1000,
  });

  const isAuth = clientAuth ? clientAuth.isAuth : serverIsAuth;
  const currentVisits = clientAuth ? clientAuth.visits : serverCurrentVisits;

  if (tiers.length === 0) return null;

  const firstTier = tiers[0];
  const maxTier = tiers[tiers.length - 1];

  // ── Unauth — маркетинговий тизер найнижчого рівня + CTA ──
  if (!isAuth) {
    return (
      <div className="mb-4">
        <Section title="Програма лояльності" icon={Gift}>
          <div className="flex items-end justify-between gap-3">
            <div className="min-w-0">
              <p className="metric-value text-[26px] leading-none text-foreground">{formatReward(firstTier)}</p>
              <p className="text-xs text-text-sub mt-1.5">
                після {firstTier.targetVisits}-го візиту — і більше далі
              </p>
            </div>
            {onBook && (
              <button
                type="button"
                onClick={onBook}
                className="shrink-0 inline-flex items-center gap-1.5 h-10 px-4 rounded-xl text-[13px] font-bold bg-[var(--btn-primary-bg)] text-[var(--accent-on)] shadow-sm hover:opacity-90 active:scale-[0.97] transition-all cursor-pointer"
              >
                Записатись
                <ArrowRight size={14} />
              </button>
            )}
          </div>
        </Section>
      </div>
    );
  }

  const currentTier = [...tiers].reverse().find(t => t.targetVisits <= currentVisits) ?? null;
  const nextTier = tiers.find(t => t.targetVisits > currentVisits) ?? null;
  const maxReached = currentVisits >= maxTier.targetVisits;

  // ── Максимум досягнуто ──
  if (maxReached) {
    return (
      <div className="mb-4">
        <Section
          title="Програма лояльності"
          icon={Crown}
          action={<span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-primary/12 text-primary">Максимум</span>}
        >
          <p className="metric-value text-[26px] leading-none" style={{ color: GOOD }}>{formatReward(maxTier)}</p>
          <p className="text-xs text-text-sub mt-1.5">Постійна знижка — ви на найвищому рівні лояльності</p>
          <div className="h-1.5 rounded-full mt-3 bg-primary" />
        </Section>
      </div>
    );
  }

  // ── Прогрес до наступного рівня ──
  const nextTarget = nextTier?.targetVisits ?? maxTier.targetVisits;
  const progressPct = Math.min(100, Math.round((currentVisits / nextTarget) * 100));
  const visitsLeft = nextTier ? nextTier.targetVisits - currentVisits : 0;

  return (
    <div className="mb-4">
      <Section
        title="Програма лояльності"
        icon={Gift}
        action={<span className="metric-value text-sm text-text-sub">{currentVisits} / {nextTarget}</span>}
      >
        {/* Домінанта — поточна знижка (або перший рубіж, якщо ще нема) */}
        {currentTier ? (
          <div className="flex items-baseline gap-2">
            <p className="metric-value text-[26px] leading-none" style={{ color: GOOD }}>{formatReward(currentTier)}</p>
            <p className="text-xs text-text-sub">ваша знижка зараз</p>
          </div>
        ) : (
          <p className="text-sm font-bold text-foreground">Перша знижка {formatReward(firstTier)} — вже близько</p>
        )}

        <div className="h-1.5 rounded-full mt-3 overflow-hidden bg-primary/12">
          <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${progressPct}%` }} />
        </div>

        {nextTier && (
          <p className="text-xs text-text-sub mt-2.5">
            Ще <span className="font-bold text-foreground">{visitsLeft}</span> {pluralUk(visitsLeft, 'візит', 'візити', 'візитів')} до постійної знижки {formatReward(nextTier)}
          </p>
        )}
      </Section>
    </div>
  );
}
