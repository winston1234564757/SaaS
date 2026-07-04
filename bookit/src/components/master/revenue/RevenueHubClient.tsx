'use client';

import { useEffect, Suspense } from 'react';
import { useQueryState, parseAsString } from 'nuqs';
import { Wallet, Zap, BadgePercent, ReceiptText } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils/cn';
import dynamic from 'next/dynamic';
import { TourBanner, type TourStep } from '@/components/master/onboarding/TourBanner';
import { useDestinationTour } from '@/lib/hooks/useDestinationTour';

const FlashDealPage = dynamic(() => import('@/components/master/flash/FlashDealPage').then(m => m.FlashDealPage), {
  loading: () => <div className="p-8 text-center text-text-sub animate-pulse">Завантажуємо бандл...</div>,
  ssr: false,
});

const ExpensesTab = dynamic(() => import('./ExpensesTab').then(m => m.ExpensesTab), {
  loading: () => <div className="p-8 text-center text-text-sub animate-pulse">Завантажуємо...</div>,
  ssr: false,
});

const DynamicPricingPage = dynamic(() => import('@/components/master/pricing/DynamicPricingPage').then(m => m.DynamicPricingPage), {
  loading: () => <div className="p-8 text-center text-text-sub animate-pulse">Завантажуємо бандл...</div>,
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

// humanized
const REVENUE_STEPS: TourStep[] = [
  {
    title: 'Revenue Hub',
    text: 'Два інструменти для збільшення доходу: Флеш-акції і Смарт-ціни.',
    tourKey: 'rev-sidebar',
  },
  {
    title: 'Флеш-акції',
    text: 'Знижка на вільні слоти сьогодні — клієнти бачать акцію і записуються за хвилини.',
    tourKey: 'rev-content',
  },
  {
    title: 'Смарт-ціни',
    text: 'Автоматична надбавка в години пік і знижка в тихі години — більше доходу без зусиль.',
  },
  {
    title: 'Revenue Hub готовий',
    text: 'Flash Sale на порожній слот краще ніж порожній слот. Запускай за 30 секунд.',
  },
];

export function RevenueHubClient({ flashData, pricingData }: RevenueHubClientProps) {
  const [drawerParam, setDrawerParam] = useQueryState('drawer', parseAsString.withOptions({ shallow: true, scroll: false }));
  const [activeTab, setActiveTab] = useQueryState('tab', parseAsString.withDefault('flash_deals').withOptions({ shallow: true, scroll: false }));
  const [date] = useQueryState('date', parseAsString);
  const [time] = useQueryState('time', parseAsString);

  const { currentStep, nextStep, closeTour, dynamicSteps } = useDestinationTour('revenue_v1', REVENUE_STEPS);

  useEffect(() => {
    if (drawerParam) {
      if (drawerParam === 'flash_deals' || drawerParam === 'flash') {
        setActiveTab('flash_deals');
      } else if (drawerParam === 'dynamic_pricing' || drawerParam === 'pricing') {
        setActiveTab('dynamic_pricing');
      }
      setDrawerParam(null);
    }
  }, [drawerParam, setActiveTab, setDrawerParam]);

  const tabs = [
    { id: 'flash_deals', label: 'Флеш-акції', icon: Zap },
    { id: 'dynamic_pricing', label: 'Смарт-ціни', icon: BadgePercent },
    { id: 'expenses', label: 'Фінанси', icon: ReceiptText },
  ];

  return (
    <>
      <div className="flex flex-col gap-6 lg:grid lg:grid-cols-[240px_1fr] lg:gap-6 lg:items-start">

        {/* Left sidebar: hub header + tab navigation. Quiet nav chrome on mobile —
            the focal moment belongs to the tab content below, not this shell. */}
        <div className="bento-card p-4 lg:p-5 flex flex-col gap-3 lg:gap-4" data-tour-key="rev-sidebar">
          <div className="flex items-center gap-2.5">
            <div className="size-9 rounded-xl bg-accent-light flex items-center justify-center text-accent shrink-0">
              <Wallet size={18} />
            </div>
            <div className="min-w-0">
              <h1 className="text-base font-semibold text-foreground tracking-tight leading-tight">Revenue Hub</h1>
              <p className="hidden lg:block text-xs text-text-sub mt-0.5">Управління доходами та спецпропозиціями</p>
            </div>
          </div>

          {/* Tabs: text-only segmented control on mobile (fits 3 labels, no wrap),
              icon + label vertical nav on desktop. */}
          <div className={cn(
            'relative bg-surface/40 backdrop-blur-md border border-border/40 p-1 flex gap-1 rounded-[100px]',
            'lg:flex-col lg:rounded-2xl lg:bg-transparent lg:border-0 lg:p-0 lg:gap-1'
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
                    'relative flex-1 px-3 py-2 rounded-full text-xs font-semibold flex items-center justify-center gap-2 whitespace-nowrap transition-colors duration-200 cursor-pointer active:scale-[0.97] transform-gpu',
                    'lg:flex-none lg:w-full lg:rounded-xl lg:px-4 lg:py-2.5 lg:justify-start',
                    isActive ? 'text-[var(--accent-on)]' : 'text-text-secondary hover:text-foreground'
                  )}
                >
                  {isActive && (
                    <motion.div
                      layoutId="revenue-active-tab"
                      className="absolute inset-0 rounded-full lg:rounded-xl"
                      style={{ background: 'var(--accent)' }}
                      transition={{ type: 'spring' as const, duration: 0.35, bounce: 0 }}
                    />
                  )}
                  <Icon size={14} className="relative z-10 hidden lg:block" />
                  <span className="relative z-10">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: tab content */}
        <div data-tour-key="rev-content">
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

              {activeTab === 'expenses' && (
                <motion.div
                  key="expenses"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ type: 'spring' as const, duration: 0.3, bounce: 0 }}
                >
                  <Suspense fallback={
                    <div className="flex flex-col gap-4 p-4 animate-pulse">
                      <div className="h-20 bg-secondary/40 border border-border rounded-[28px]" />
                      <div className="h-40 bg-secondary/40 border border-border rounded-[28px]" />
                    </div>
                  }>
                    <ExpensesTab />
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
