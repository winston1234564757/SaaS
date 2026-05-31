'use client';

import { useEffect, Suspense } from 'react';
import { useQueryState, parseAsString } from 'nuqs';
import { Wallet, Zap, BadgePercent } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils/cn';
import dynamic from 'next/dynamic';

const FlashDealPage = dynamic(() => import('@/components/master/flash/FlashDealPage').then(m => m.FlashDealPage), {
  loading: () => <div className="p-8 text-center text-muted-foreground/60 animate-pulse">Завантажуємо бандл...</div>,
  ssr: false,
});

const DynamicPricingPage = dynamic(() => import('@/components/master/pricing/DynamicPricingPage').then(m => m.DynamicPricingPage), {
  loading: () => <div className="p-8 text-center text-muted-foreground/60 animate-pulse">Завантажуємо бандл...</div>,
  ssr: false,
});

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
  // nuqs states to handle tab and date/time selections
  const [drawerParam, setDrawerParam] = useQueryState('drawer', parseAsString.withOptions({ shallow: true, scroll: false }));
  const [activeTab, setActiveTab] = useQueryState('tab', parseAsString.withDefault('flash_deals').withOptions({ shallow: true, scroll: false }));
  const [date] = useQueryState('date', parseAsString);
  const [time] = useQueryState('time', parseAsString);

  // Backward compatibility: map drawer parameter to the correct active tab
  useEffect(() => {
    if (drawerParam) {
      if (drawerParam === 'flash_deals' || drawerParam === 'flash') {
        setActiveTab('flash_deals');
      } else if (drawerParam === 'dynamic_pricing' || drawerParam === 'pricing') {
        setActiveTab('dynamic_pricing');
      }
      // Clear drawer parameter from URL to clean up state
      setDrawerParam(null);
    }
  }, [drawerParam, setActiveTab, setDrawerParam]);

  const tabs = [
    { id: 'flash_deals', label: 'Флеш-акції', icon: Zap },
    { id: 'dynamic_pricing', label: 'Смарт-ціни', icon: BadgePercent }
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/40 pb-5">
        <div className="flex items-center gap-3">
          <div className="size-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
            <Wallet size={24} />
          </div>
          <div>
            <h1 className="display-md text-foreground">Revenue Hub</h1>
            <p className="text-sm text-muted-foreground">Управління доходами та спецпропозиціями</p>
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
                type="button"
                aria-pressed={isActive}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'relative px-5 py-2.5 rounded-full text-xs font-semibold flex items-center gap-2 transition-colors duration-200 cursor-pointer active:scale-[0.95] transform-gpu',
                  isActive ? 'text-[var(--accent-on)]' : 'text-text-secondary hover:text-foreground'
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="revenue-active-tab"
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
            {activeTab === 'flash_deals' && (
              <motion.div
                key="flash_deals"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ type: 'spring' as const, duration: 0.3, bounce: 0 }}
              >
                <Suspense fallback={
                  <div className="flex flex-col gap-6 p-6 animate-pulse">
                    <div className="h-44 bg-secondary/40 border border-border rounded-[28px]" />
                    <div className="h-44 bg-secondary/40 border border-border rounded-[28px]" />
                  </div>
                }>
                  <FlashDealPage
                    activeDeals={flashData.deals}
                    tier={flashData.tier}
                    usedThisMonth={flashData.usedThisMonth}
                    isDrawer={false}
                    initialDate={date || undefined}
                    initialTime={time || undefined}
                  />
                </Suspense>
              </motion.div>
            )}

            {activeTab === 'dynamic_pricing' && (
              <motion.div
                key="dynamic_pricing"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ type: 'spring' as const, duration: 0.3, bounce: 0 }}
              >
                <Suspense fallback={
                  <div className="flex flex-col gap-6 p-6 animate-pulse">
                    <div className="h-44 bg-secondary/40 border border-border rounded-[28px]" />
                    <div className="h-44 bg-secondary/40 border border-border rounded-[28px]" />
                  </div>
                }>
                  <DynamicPricingPage
                    initial={pricingData.rules}
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
