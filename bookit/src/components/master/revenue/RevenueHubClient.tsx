'use client';

import { Suspense } from 'react';
import { useQueryState, parseAsString } from 'nuqs';
import { BentoCard } from '@/components/ui/BentoCard';
import { HubDrawer } from '@/components/shared/HubDrawer';
import { Zap, BadgePercent, Wallet } from 'lucide-react';

// We'll import these once we refactor them to be "drawer-ready"
// For now, we'll use placeholders or simple versions
import { FlashDealPage } from '@/components/master/flash/FlashDealPage';
import { DynamicPricingPage } from '@/components/master/pricing/DynamicPricingPage';
import type { FlashDealRow } from '@/app/(master)/dashboard/flash/page.tsx';
import type { PricingRules } from '@/lib/utils/dynamicPricing';

interface RevenueHubClientProps {
  flashData: {
    activeCount: number;
    deals: FlashDealRow[];
    tier: string;
    usedThisMonth: number;
  };
  pricingData: {
    tier: string;
    extraEarned: number;
    rules: PricingRules;
    isPro: boolean;
  };
}

export function RevenueHubClient({ flashData, pricingData }: RevenueHubClientProps) {
  const [drawer, setDrawer] = useQueryState('drawer', parseAsString);

  const closeDrawer = () => setDrawer(null);

  return (
    <div className="flex flex-col gap-8">
      {/* Header Area */}
      <div className="flex items-center gap-3 mb-2">
        <div className="w-12 h-12 rounded-2xl bg-[#789A99]/10 flex items-center justify-center text-[#789A99]">
          <Wallet size={24} />
        </div>
        <div>
          <h1 className="display-md text-[#2C1A14]">Revenue Hub</h1>
          <p className="text-sm text-[#6B5750]">Управління доходами та спецпропозиціями</p>
        </div>
      </div>

      {/* Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <BentoCard
          title="Flash Deals"
          metric={`${flashData.activeCount} Активні`}
          hint={flashData.activeCount > 0 ? "Діє зараз" : "Немає акцій"}
          description="Створюйте моментальні знижки на вільні вікна сьогодні-завтра, щоб заповнити графік."
          icon={Zap}
          statusColor={flashData.activeCount > 0 ? 'success' : 'info'}
          onClick={() => setDrawer('flash_deals')}
        />

        <BentoCard
          title="Dynamic Pricing"
          metric={`+${Math.round(pricingData.extraEarned / 100)} ₴`}
          description="Автоматичне регулювання цін: націнки для пікових годин та знижки для 'тихого часу'."
          hint={pricingData.isPro ? "Pro активний" : "Starter"}
          icon={BadgePercent}
          statusColor={pricingData.isPro ? 'success' : 'warning'}
          onClick={() => setDrawer('dynamic_pricing')}
        />
      </div>

      {/* URL-Driven Drawers */}
      <HubDrawer
        isOpen={drawer === 'flash_deals'}
        onClose={closeDrawer}
        title="Флеш-акції"
      >
        <Suspense fallback={<div className="p-8 text-center text-[#A8928D]">Завантаження...</div>}>
          <FlashDealPage
            activeDeals={flashData.deals}
            tier={flashData.tier}
            usedThisMonth={flashData.usedThisMonth}
            isDrawer={true} // We'll add this prop to suppress layout
          />
        </Suspense>
      </HubDrawer>

      <HubDrawer
        isOpen={drawer === 'dynamic_pricing'}
        onClose={closeDrawer}
        title="Динамічне ціноутворення"
      >
        <Suspense fallback={<div className="p-8 text-center text-[#A8928D]">Завантаження...</div>}>
          <DynamicPricingPage
            initial={pricingData.rules}
            isDrawer={true} // We'll add this prop to suppress layout
          />
        </Suspense>
      </HubDrawer>
    </div>
  );
}
