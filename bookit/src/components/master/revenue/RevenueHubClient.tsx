'use client';

import { useEffect, Suspense } from 'react';
import { useQueryState, parseAsString } from 'nuqs';
import { Wallet, Zap, BadgePercent } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils/cn';
import dynamic from 'next/dynamic';
import { useMasterContext } from '@/lib/supabase/context';
import { useTour } from '@/lib/hooks/useTour';
import { TourBanner, type TourStep } from '@/components/master/onboarding/TourBanner';
import { DESTINATION_TOURS } from '@/components/master/onboarding/destinationTours';

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

  const { masterProfile } = useMasterContext();
  const seenTours = masterProfile?.seen_tours as Record<string, boolean> | null;
  const { currentStep, nextStep, closeTour } = useTour('revenue_v1', REVENUE_STEPS.length + 1, {
    initialSeen: !!(seenTours?.['revenue_v1']),
    masterId: masterProfile?.id ?? '',
  });
  const nextTours = DESTINATION_TOURS.filter(d => !seenTours?.[d.tourKey] && d.tourKey !== 'revenue_v1').slice(0, 3).map(d => ({ icon: d.icon, label: d.label, href: d.href }));
  // humanized — navigator step
  const dynamicSteps: TourStep[] = [...REVENUE_STEPS, { title: 'Дохід під контролем', text: 'Що далі?', isNavigator: true, links: nextTours }];

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
  ];

  return (
    <>
      <div className="flex flex-col gap-6 lg:grid lg:grid-cols-[240px_1fr] lg:gap-6 lg:items-start">

        {/* Left sidebar: hub header + tab navigation */}
        <div className="bento-card p-5 flex flex-col gap-4" data-tour-key="rev-sidebar">
          <div className="flex items-center gap-3">
            <div className="size-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
              <Wallet size={24} />
            </div>
            <div>
              <h1 className="display-md text-foreground">Revenue Hub</h1>
              <p className="text-sm text-muted-foreground">Управління доходами та спецпропозиціями</p>
            </div>
          </div>

          {/* Tabs: horizontal pill on mobile, vertical nav on desktop */}
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
                    'relative flex-1 px-5 py-2.5 rounded-full text-xs font-semibold flex items-center justify-center gap-2 transition-colors duration-200 cursor-pointer active:scale-[0.95] transform-gpu',
                    'lg:flex-none lg:w-full lg:rounded-xl lg:px-4 lg:justify-start',
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
                  <Icon size={14} className="relative z-10" />
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
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      <TourBanner steps={dynamicSteps} currentStep={currentStep} onNext={nextStep} onClose={closeTour} />
    </>
  );
}
