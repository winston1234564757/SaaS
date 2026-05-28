'use client';

import { useEffect, Suspense } from 'react';
import { useQueryState, parseAsString } from 'nuqs';
import { Rocket, Gift, Share2, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils/cn';
import dynamic from 'next/dynamic';
import type { ReferralHistoryItem } from '@/components/master/referral/ReferralPage';

const LoyaltyPage = dynamic(() => import('@/components/master/loyalty/LoyaltyPage').then(m => m.LoyaltyPage), {
  loading: () => <div className="p-8 text-center text-muted-foreground/60 animate-pulse">Завантаження...</div>,
  ssr: false,
});

const ReferralPage = dynamic(() => import('@/components/master/referral/ReferralPage').then(m => m.ReferralPage), {
  loading: () => <div className="p-8 text-center text-muted-foreground/60 animate-pulse">Завантаження...</div>,
  ssr: false,
});

const PartnersPage = dynamic(() => import('@/components/master/partners/PartnersPage').then(m => m.PartnersPage), {
  loading: () => <div className="p-8 text-center text-muted-foreground/60 animate-pulse">Завантаження...</div>,
  ssr: false,
});

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
    history: ReferralHistoryItem[];
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

export function GrowthHubClient({ loyaltyData, referralData, partnersData }: GrowthHubClientProps) {
  // nuqs states to handle tab and legacy drawer parameters
  const [drawerParam, setDrawerParam] = useQueryState('drawer', parseAsString.withOptions({ shallow: true, scroll: false }));
  const [activeTab, setActiveTab] = useQueryState('tab', parseAsString.withDefault('loyalty').withOptions({ shallow: true, scroll: false }));

  // Backward compatibility: map legacy drawer parameter to active tab state
  useEffect(() => {
    if (drawerParam) {
      if (drawerParam === 'loyalty') {
        setActiveTab('loyalty');
      } else if (drawerParam === 'referral') {
        setActiveTab('referral');
      } else if (drawerParam === 'partners') {
        setActiveTab('partners');
      }
      // Clear legacy parameter
      setDrawerParam(null);
    }
  }, [drawerParam, setActiveTab, setDrawerParam]);

  const tabs = [
    { id: 'loyalty', label: 'Лояльність', icon: Gift },
    { id: 'referral', label: 'Реферали', icon: Share2 },
    { id: 'partners', label: 'Партнери', icon: Users }
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/40 pb-5">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-warning/10 flex items-center justify-center text-warning shrink-0">
            <Rocket size={24} />
          </div>
          <div>
            <h1 className="display-md text-foreground">Growth Hub</h1>
            <p className="text-sm text-muted-foreground">Інструменти залучення та утримання клієнтів</p>
          </div>
        </div>

        {/* Sliding Tab Switcher */}
        <div className="relative bg-surface/40 backdrop-blur-md border border-border/40 p-1 rounded-[100px] flex gap-1 self-start transform-gpu">
          {tabs.map(tab => {
            const isActive = activeTab === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'relative px-5 py-2.5 rounded-full text-xs font-semibold flex items-center gap-2 transition-colors duration-200 cursor-pointer active:scale-[0.95] transform-gpu',
                  isActive ? 'text-[var(--accent-on)]' : 'text-text-secondary hover:text-foreground'
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="growth-active-tab"
                    className="absolute inset-0 rounded-full"
                    style={{ background: 'var(--accent)' }}
                    transition={{ type: 'spring' as const, duration: 0.35, bounce: 0 }}
                  />
                )}
                <Icon size={14} className="relative z-10" />
                <span className="relative z-10">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content Display */}
      <div className="mt-2">
        <AnimatePresence mode="popLayout">
          <motion.div
            layout
            transition={{ type: 'spring' as const, duration: 0.3, bounce: 0 }}
            className="w-full"
          >
            {activeTab === 'loyalty' && (
              <motion.div
                key="loyalty"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ type: 'spring' as const, duration: 0.3, bounce: 0 }}
              >
                <Suspense fallback={<div className="p-8 text-center text-muted-foreground/60 animate-pulse">Завантаження...</div>}>
                  <LoyaltyPage isDrawer={false} />
                </Suspense>
              </motion.div>
            )}

            {activeTab === 'referral' && (
              <motion.div
                key="referral"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ type: 'spring' as const, duration: 0.3, bounce: 0 }}
              >
                <Suspense fallback={<div className="p-8 text-center text-muted-foreground/60 animate-pulse">Завантаження...</div>}>
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
                    history={referralData.history}
                    isDrawer={false}
                  />
                </Suspense>
              </motion.div>
            )}

            {activeTab === 'partners' && (
              <motion.div
                key="partners"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ type: 'spring' as const, duration: 0.3, bounce: 0 }}
              >
                <Suspense fallback={<div className="p-8 text-center text-muted-foreground/60 animate-pulse">Завантаження...</div>}>
                  <PartnersPage
                    partners={partnersData.partners}
                    inviteLink={partnersData.inviteLink}
                    alliances={partnersData.alliances ?? []}
                    isDrawer={false}
                  />
                </Suspense>
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
