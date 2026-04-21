'use client';

import { useTransition } from 'react';
import { BentoCard } from '@/components/ui/BentoCard';
import { Wallet, Zap, BadgePercent } from 'lucide-react';
import { RevenueDrawers } from './RevenueDrawers';

interface RevenueHubClientProps {
  flashData: {
    activeCount: number;
    deals: any[];
    tier: string;
    usedThisMonth: number;
  };
  pricingData: {
    tier: string;
    extraEarned: number;
    rules: any;
    isPro: boolean;
  };
}

export function RevenueHubClient({ flashData, pricingData }: RevenueHubClientProps) {
  const [, startTransition] = useTransition();

  // window.history.pushState — nuqs intercepts this, Next.js router does NOT.
  // Prevents server-component re-render on drawer open (fixes first-click error).
  const openDrawer = (id: string) => {
    startTransition(() => {
      const url = new URL(window.location.href);
      url.searchParams.set('drawer', id);
      window.history.pushState(null, '', url.pathname + url.search);
    });
  };

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

      {/* Bento Grid - This grid is now protected from re-renders when a drawer opens */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <BentoCard
          title="Flash Deals"
          metric={`${flashData.activeCount} Активні`}
          hint={flashData.activeCount > 0 ? "Діє зараз" : "Немає акцій"}
          description="Створюйте моментальні знижки на вільні вікна сьогодні-завтра, щоб заповнити графік."
          icon={Zap}
          statusColor={flashData.activeCount > 0 ? 'success' : 'info'}
          onClick={() => openDrawer('flash_deals')}
        />

        <BentoCard
          title="Dynamic Pricing"
          metric={`+${Math.round(pricingData.extraEarned / 100)} ₴`}
          description="Автоматичне регулювання цін: націнки для пікових годин та знижки для 'тихого часу'."
          hint={pricingData.isPro ? "Pro активний" : "Starter"}
          icon={BadgePercent}
          statusColor={pricingData.isPro ? 'success' : 'warning'}
          onClick={() => openDrawer('dynamic_pricing')}
        />
      </div>

      {/* 
        Isolated Drawer Container 
        Everything below this renders in its own branch, 
        reading the URL state ONLY when needed.
      */}
      <RevenueDrawers 
        flashData={flashData} 
        pricingData={pricingData} 
      />
    </div>
  );
}
