'use client';

import { Suspense, useTransition } from 'react';
import { useQueryState, parseAsString } from 'nuqs';
import { BentoCard } from '@/components/ui/BentoCard';
import { HubDrawer } from '@/components/shared/HubDrawer';
import { Rocket, Gift, Share2, Users } from 'lucide-react';
import { LoyaltyPage } from '@/components/master/loyalty/LoyaltyPage';
import { ReferralPage } from '@/components/master/referral/ReferralPage';
import { PartnersPage } from '@/components/master/partners/PartnersPage';

interface GrowthHubClientProps {
  loyaltyData: {
    activeCount: number;
  };
  referralData: {
    masterId: string;
    code: string;
    count: number;
    activeCount: number;
    lifetimeDiscount: number;
    bountiesPending:  number;
    discountReserve:  number;
    tier: string;
    expiresAt: string | null;
  };
  partnersData: {
    partners: any[];
    inviteLink: string;
    alliances?: Array<{
      id: string;
      isVisible: boolean;
      otherId: string;
      slug: string;
      name: string;
      emoji: string;
    }>;
  };
}

// Isolated: only this subtree re-renders when ?drawer= changes
function GrowthDrawers({ loyaltyData, referralData, partnersData }: GrowthHubClientProps) {
  const [drawer, setDrawer] = useQueryState('drawer', parseAsString.withOptions({ shallow: true, scroll: false }));
  const closeDrawer = () => setDrawer(null);

  return (
    <>
      <HubDrawer isOpen={drawer === 'loyalty'} onClose={closeDrawer} title="Лояльність">
        <Suspense fallback={<div className="p-8 text-center text-[#A8928D] animate-pulse">Завантаження...</div>}>
          <LoyaltyPage isDrawer={true} />
        </Suspense>
      </HubDrawer>

      <HubDrawer isOpen={drawer === 'referral'} onClose={closeDrawer} title="Реферальна програма">
        <Suspense fallback={<div className="p-8 text-center text-[#A8928D] animate-pulse">Завантаження...</div>}>
          <ReferralPage
            masterId={referralData.masterId}
            referralCode={referralData.code}
            referralCount={referralData.count}
            activeReferralCount={referralData.activeCount}
            lifetimeDiscount={referralData.lifetimeDiscount}
            referralBountiesPending={referralData.bountiesPending}
            discountReserve={referralData.discountReserve}
            subscriptionTier={referralData.tier}
            subscriptionExpiresAt={referralData.expiresAt}
            isDrawer={true}
          />
        </Suspense>
      </HubDrawer>

      <HubDrawer isOpen={drawer === 'partners'} onClose={closeDrawer} title="Партнерська мережа">
        <Suspense fallback={<div className="p-8 text-center text-[#A8928D] animate-pulse">Завантаження...</div>}>
          <PartnersPage
            partners={partnersData.partners}
            inviteLink={partnersData.inviteLink}
            alliances={partnersData.alliances ?? []}
            isDrawer={true}
          />
        </Suspense>
      </HubDrawer>
    </>
  );
}

export function GrowthHubClient({ loyaltyData, referralData, partnersData }: GrowthHubClientProps) {
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
        <div className="w-12 h-12 rounded-2xl bg-[#D4935A]/10 flex items-center justify-center text-[#D4935A]">
          <Rocket size={24} />
        </div>
        <div>
          <h1 className="display-md text-[#2C1A14]">Growth Hub</h1>
          <p className="text-sm text-[#6B5750]">Інструменти залучення та утримання клієнтів</p>
        </div>
      </div>

      {/* Bento Grid — protected from re-renders when ?drawer= changes */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <BentoCard
          title="Loyalty"
          metric={`${loyaltyData.activeCount} Програм`}
          hint={loyaltyData.activeCount > 0 ? 'Накопичувальні знижки' : 'Не налаштовано'}
          description="Бонусна система та кешбек для утримання клієнтів та підвищення чеку."
          icon={Gift}
          statusColor={loyaltyData.activeCount > 0 ? 'success' : 'info'}
          onClick={() => openDrawer('loyalty')}
        />

        <BentoCard
          title="Referral"
          metric={`${referralData.count} Запрошень`}
          hint="Отримуйте Pro бонусом"
          description="Залучайте нових майстрів та отримуйте місяці Pro-підписки безкоштовно."
          icon={Share2}
          statusColor={referralData.count > 0 ? 'success' : 'info'}
          onClick={() => openDrawer('referral')}
        />

        <BentoCard
          title="Partners"
          metric={`${partnersData.partners.length} Партнерів`}
          hint="Спільна мережа (Cartel)"
          description="Об'єднуйтесь з іншими майстрами для перехресного просування та обміну базою."
          icon={Users}
          statusColor={partnersData.partners.length > 0 ? 'success' : 'info'}
          onClick={() => openDrawer('partners')}
        />
      </div>

      {/* Isolated drawer subtree — only this re-renders on URL change */}
      <GrowthDrawers
        loyaltyData={loyaltyData}
        referralData={referralData}
        partnersData={partnersData}
      />
    </div>
  );
}
