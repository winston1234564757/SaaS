'use client';

import { useEffect, Suspense } from 'react';
import { useQueryState, parseAsString } from 'nuqs';
import { Gift, Share2, Users } from 'lucide-react';
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
  const [drawerParam, setDrawerParam] = useQueryState('drawer', parseAsString.withOptions({ shallow: true, scroll: false }));
  const [activeTab, setActiveTab] = useQueryState('tab', parseAsString.withDefault('loyalty').withOptions({ shallow: true, scroll: false }));

  useEffect(() => {
    if (drawerParam) {
      if (drawerParam === 'loyalty') {
        setActiveTab('loyalty');
      } else if (drawerParam === 'referral') {
        setActiveTab('referral');
      } else if (drawerParam === 'partners') {
        setActiveTab('partners');
      }
      setDrawerParam(null);
    }
  }, [drawerParam, setActiveTab, setDrawerParam]);

  const tabs = [
    { id: 'loyalty',  label: 'Лояльність', icon: Gift,   description: 'Знижки для постійних клієнтів' },
    { id: 'referral', label: 'Реферали',   icon: Share2,  description: 'Бонус за кожного нового майстра' },
    { id: 'partners', label: 'Партнери',   icon: Users,   description: 'Спільні акції з майстрами поряд' },
  ];

  return (
    <div className="flex flex-col gap-6 lg:grid lg:grid-cols-[240px_1fr] lg:gap-6 lg:items-start">

      {/* Left sidebar: hub header + tab navigation */}
      <div className="bento-card p-5 flex flex-col gap-4">
        <div>
          <h1 className="display-md text-foreground">Growth Hub</h1>
          <p className="text-sm text-muted-foreground">Інструменти залучення та утримання клієнтів</p>
        </div>

        {/* Tabs: widget blocks (mobile) / vertical nav (desktop) */}
        <div className={cn(
          'grid grid-cols-3 gap-2',
          'lg:flex lg:flex-col lg:gap-1'
        )}>
          {tabs.map(tab => {
            const isActive = activeTab === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                aria-pressed={isActive}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'relative flex flex-col items-center gap-1.5 p-3 rounded-2xl text-center transition-colors duration-200 cursor-pointer active:scale-[0.96] transform-gpu',
                  'lg:flex-row lg:items-center lg:text-left lg:rounded-xl lg:px-4 lg:py-2.5 lg:justify-start lg:gap-2',
                  !isActive && 'bg-surface/60 border border-border/40 lg:bg-transparent lg:border-0',
                  isActive
                    ? 'text-[var(--accent-on)]'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="growth-active-tab"
                    className="absolute inset-0 rounded-2xl lg:rounded-xl"
                    style={{ background: 'var(--accent)' }}
                    transition={{ type: 'spring' as const, duration: 0.35, bounce: 0 }}
                  />
                )}
                <Icon size={18} className="relative z-10 shrink-0" />
                <div className="relative z-10 flex flex-col gap-0.5">
                  <span className="text-xs font-semibold leading-tight">{tab.label}</span>
                  <span className="text-[11px] leading-snug opacity-70 lg:hidden">{tab.description}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Right: tab content */}
      <div>
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
