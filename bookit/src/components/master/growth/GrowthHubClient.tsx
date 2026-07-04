'use client';

import { useEffect, Suspense } from 'react';
import { useQueryState, parseAsString } from 'nuqs';
import { Gift, Share2, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils/cn';
import dynamic from 'next/dynamic';
import type { ReferralHistoryItem } from '@/components/master/referral/ReferralPage';
import { TourBanner, type TourStep } from '@/components/master/onboarding/TourBanner';
import { useDestinationTour } from '@/lib/hooks/useDestinationTour';

const LoyaltyPage = dynamic(() => import('@/components/master/loyalty/LoyaltyPage').then(m => m.LoyaltyPage), {
  loading: () => <div className="p-8 text-center text-text-sub animate-pulse">Завантаження...</div>,
  ssr: false,
});

const ReferralPage = dynamic(() => import('@/components/master/referral/ReferralPage').then(m => m.ReferralPage), {
  loading: () => <div className="p-8 text-center text-text-sub animate-pulse">Завантаження...</div>,
  ssr: false,
});

const PartnersPage = dynamic(() => import('@/components/master/partners/PartnersPage').then(m => m.PartnersPage), {
  loading: () => <div className="p-8 text-center text-text-sub animate-pulse">Завантаження...</div>,
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

// humanized
const GROWTH_STEPS: TourStep[] = [
  {
    title: 'Growth Hub',
    text: 'Три інструменти для росту: Лояльність, Реферали i Партнери. Обирай потрібний.',
    tourKey: 'grw-sidebar',
  },
  {
    title: 'Лояльність',
    text: 'Клієнти отримують знижку після N-го відвідування. Ти налаштовуєш правила.',
    tourKey: 'grw-content',
  },
  {
    title: 'Реферали',
    text: 'Ділись своїм реферальним посиланням — отримуй бонус за кожного нового майстра.',
  },
  {
    title: 'Growth Hub готовий',
    text: 'Лояльність збільшує повернення клієнтів. Реферали — пасивний дохід. Запускай обидва.',
  },
];

export function GrowthHubClient({ loyaltyData, referralData, partnersData }: GrowthHubClientProps) {
  const [drawerParam, setDrawerParam] = useQueryState('drawer', parseAsString.withOptions({ shallow: true, scroll: false }));
  const [activeTab, setActiveTab] = useQueryState('tab', parseAsString.withDefault('loyalty').withOptions({ shallow: true, scroll: false }));

  const { currentStep, nextStep, closeTour, dynamicSteps } = useDestinationTour('growth_v1', GROWTH_STEPS);

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
    <>
      <div className="flex flex-col gap-6 lg:grid lg:grid-cols-[240px_1fr] lg:gap-6 lg:items-start">

        {/* Left sidebar: hub header + tab navigation */}
        <div className="bento-card p-5 flex flex-col gap-4" data-tour-key="grw-sidebar">
          <div>
            <h1 className="display-md text-foreground">Growth Hub</h1>
            <p className="text-sm text-text-sub">Інструменти залучення та утримання клієнтів</p>
          </div>

          {/* Tabs: widget blocks (mobile) / vertical nav (desktop) */}
          <div className={cn(
            'flex flex-col gap-2',
            'lg:gap-1'
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
                    'relative flex items-center gap-3 px-4 py-3 rounded-2xl text-left w-full transition-colors duration-200 cursor-pointer active:scale-[0.98] transform-gpu',
                    'lg:rounded-xl lg:px-4 lg:py-2.5',
                    !isActive && 'bg-surface/60 border border-border/40 lg:bg-transparent lg:border-0',
                    isActive
                      ? 'text-[var(--accent-on)]'
                      : 'text-text-sub hover:text-foreground'
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
                    <span className="text-[11px] leading-snug opacity-70">{tab.description}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: tab content */}
        <div data-tour-key="grw-content">
          <AnimatePresence mode="popLayout">
            <motion.div
              layout
              transition={{ type: 'spring' as const, duration: 0.3, bounce: 0 }}
              className="w-full"
            >
              {activeTab === 'loyalty' && (
                <motion.div
                  key="loyalty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ type: 'spring' as const, duration: 0.3, bounce: 0 }}
                >
                  <Suspense fallback={<div className="p-8 text-center text-text-sub animate-pulse">Завантаження...</div>}>
                    <LoyaltyPage isDrawer={false} />
                  </Suspense>
                </motion.div>
              )}

              {activeTab === 'referral' && (
                <motion.div
                  key="referral"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ type: 'spring' as const, duration: 0.3, bounce: 0 }}
                >
                  <Suspense fallback={<div className="p-8 text-center text-text-sub animate-pulse">Завантаження...</div>}>
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
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ type: 'spring' as const, duration: 0.3, bounce: 0 }}
                >
                  <Suspense fallback={<div className="p-8 text-center text-text-sub animate-pulse">Завантаження...</div>}>
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

      <TourBanner steps={dynamicSteps} currentStep={currentStep} onNext={nextStep} onClose={closeTour} />
    </>
  );
}
