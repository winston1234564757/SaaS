'use client';

import { DashboardDrawer } from '@/components/ui/DashboardDrawer';
import { DynamicPricingPage } from '@/components/master/pricing/DynamicPricingPage';
import { PricingUpgradeGate } from '@/components/master/pricing/PricingUpgradeGate';
import { useMasterContext } from '@/lib/supabase/context';
import type { PricingRules } from '@/lib/utils/dynamicPricing';

const TRIAL_LIMIT_KOP = 100_000;

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export function PricingDrawer({ isOpen, onClose }: Props) {
  const { masterProfile } = useMasterContext();
  const tier = masterProfile?.subscription_tier ?? 'starter';
  const extraEarned = masterProfile?.dynamic_pricing_extra_earned ?? 0;
  const pricingRules: PricingRules = (masterProfile?.pricing_rules as PricingRules | null) ?? {};

  const isPro = tier === 'pro' || tier === 'studio';
  const isStarter = tier === 'starter';
  const trialExhausted = isStarter && extraEarned >= TRIAL_LIMIT_KOP;

  function renderContent() {
    if (trialExhausted) {
      return (
        <PricingUpgradeGate
          trial={{ earned: extraEarned, limit: TRIAL_LIMIT_KOP, exhausted: true }}
          quietHoursInsight={null}
        />
      );
    }
    if (isStarter) {
      return (
        <div className="flex flex-col gap-4">
          <PricingUpgradeGate
            trial={{ earned: extraEarned, limit: TRIAL_LIMIT_KOP, exhausted: false }}
            quietHoursInsight={null}
          />
          <DynamicPricingPage initial={pricingRules} />
        </div>
      );
    }
    if (!isPro) {
      return <PricingUpgradeGate />;
    }
    return <DynamicPricingPage initial={pricingRules} />;
  }

  return (
    <DashboardDrawer isOpen={isOpen} onClose={onClose} title="Ціноутворення">
      <div className="p-6">
        {renderContent()}
      </div>
    </DashboardDrawer>
  );
}
