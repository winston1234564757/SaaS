'use client';

import { useQueryState, parseAsString } from 'nuqs';
import { useMasterContext } from '@/lib/supabase/context';
import { FlashDealDrawer } from '@/components/master/dashboard/FlashDealDrawer';
import { PricingDrawer } from '@/components/master/dashboard/PricingDrawer';
import type { PricingRules } from '@/lib/utils/dynamicPricing';

export function DashboardDrawers() {
  const [drawer, setDrawer] = useQueryState('drawer', parseAsString.withOptions({ shallow: true, scroll: false }));
  const { masterProfile } = useMasterContext();
  const pricingRules = (masterProfile?.pricing_rules ?? {}) as PricingRules;

  const closeDrawer = () => setDrawer(null);

  return (
    <>
      <FlashDealDrawer 
        isOpen={drawer === 'flash_deals'} 
        onClose={closeDrawer} 
      />
      <PricingDrawer 
        isOpen={drawer === 'dynamic_pricing'} 
        onClose={closeDrawer} 
        pricingRules={pricingRules}
      />
    </>
  );
}
