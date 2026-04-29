'use client';

import { Suspense } from 'react';
import { useQueryState, parseAsString } from 'nuqs';
import dynamic from 'next/dynamic';
import type { FlashDealRow } from '@/app/(master)/dashboard/flash/page';
import type { PricingRules } from '@/lib/utils/dynamicPricing';
import { HubDrawer } from '@/components/shared/HubDrawer';

const FlashDealPage = dynamic(() => import('@/components/master/flash/FlashDealPage').then(m => m.FlashDealPage), {
  loading: () => <div className="p-8 text-center text-muted-foreground/60 animate-pulse">Завантажуємо бандл...</div>,
  ssr: false,
});

const DynamicPricingPage = dynamic(() => import('@/components/master/pricing/DynamicPricingPage').then(m => m.DynamicPricingPage), {
  loading: () => <div className="p-8 text-center text-muted-foreground/60 animate-pulse">Завантажуємо бандл...</div>,
  ssr: false,
});

interface RevenueDrawersProps {
  flashData: {
    deals: FlashDealRow[];
    tier: string;
    usedThisMonth: number;
  };
  pricingData: {
    rules: PricingRules;
  };
}

export function RevenueDrawers({ flashData, pricingData }: RevenueDrawersProps) {
  // nuqs state is isolated here to prevent RevenueHubClient from re-rendering the whole grid
  const [drawer, setDrawer] = useQueryState('drawer', parseAsString.withOptions({ shallow: true, scroll: false }));

  const closeDrawer = () => setDrawer(null);

  return (
    <>
      {/* Flash Deals Drawer */}
      <HubDrawer
        isOpen={drawer === 'flash_deals'}
        onClose={closeDrawer}
        title="Флеш-акції"
      >
        <Suspense fallback={
          <div className="flex flex-col gap-6 p-6 animate-pulse">
            <div className="h-44 bg-white/60 border border-white/70 rounded-[28px]" />
            <div className="h-44 bg-white/60 border border-white/70 rounded-[28px]" />
          </div>
        }>
          <FlashDealPage
            activeDeals={flashData.deals}
            tier={flashData.tier}
            usedThisMonth={flashData.usedThisMonth}
            isDrawer={true}
          />
        </Suspense>
      </HubDrawer>

      {/* Dynamic Pricing Drawer */}
      <HubDrawer
        isOpen={drawer === 'dynamic_pricing'}
        onClose={closeDrawer}
        title="Динамічне ціноутворення"
      >
        <Suspense fallback={
          <div className="flex flex-col gap-6 p-6 animate-pulse">
            <div className="h-44 bg-white/60 border border-white/70 rounded-[28px]" />
            <div className="h-44 bg-white/60 border border-white/70 rounded-[28px]" />
          </div>
        }>
          <DynamicPricingPage
            initial={pricingData.rules}
            isDrawer={true}
          />
        </Suspense>
      </HubDrawer>
    </>
  );
}
