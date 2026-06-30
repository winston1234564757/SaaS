'use client';

import React, { useState, useMemo } from 'react';
import { TourBanner, type TourStep } from '@/components/master/onboarding/TourBanner';
import { useDestinationTour } from '@/lib/hooks/useDestinationTour';
import { cn } from '@/lib/utils/cn';
import { motion, AnimatePresence, type PanInfo } from 'framer-motion';
import { useQueryState, parseAsString } from 'nuqs';
import {
  RefreshCw, Crown,
  Users, TrendingUp, AlertTriangle,
  ChevronLeft, ChevronRight,
} from 'lucide-react';
import Link from 'next/link';

import { useMasterContext } from '@/lib/supabase/context';
import { formatPrice } from '@/lib/utils/currency';
import { pluralUk } from '@/lib/utils/pluralUk';
import { useDateRange } from '@/lib/supabase/hooks/useDateRange';
import { useAnalytics, exportAnalyticsCsv, linearRegression } from '@/lib/supabase/hooks/useAnalytics';
import { useAnalyticsExtras } from '@/lib/supabase/hooks/useAnalyticsExtras';
import { useAnalyticsMarketing } from '@/lib/supabase/hooks/useAnalyticsMarketing';

// Сегменти
import { PeriodControls } from './sections/PeriodControls';
import { OverviewBriefing, type BriefingMetric } from './sections/OverviewBriefing';
import { OverviewDetailSheet, type OverviewDetail } from './sections/OverviewDetailSheet';
import { type StoryItem } from './sections/HeroStory';
import { BentoSecondary } from './sections/BentoSecondary';
import { GrowthLists } from './sections/GrowthLists';
import { BusinessHealthScoreWidget } from './sections/BusinessHealthScoreWidget';
import { MorningBriefing } from './sections/MorningBriefing';
import { OverviewTab, SectionHeading } from './sections/OverviewTab';
import { AnalyticsActivation } from './sections/AnalyticsActivation';

// Графіки
import { CohortHeatmap } from './charts/CohortHeatmap';

// Вкладки drill-down
import { ReviewsTab } from './sections/tabs/ReviewsTab';
import { BehaviorTab } from './sections/tabs/BehaviorTab';
import { SourceTab } from './sections/tabs/SourceTab';
import { FinancesTab } from './sections/tabs/FinancesTab';
import { StockTab } from './sections/tabs/StockTab';

// Примітиви
import { BentoCell } from './primitives/BentoCell';
import { SkeletonCell } from './primitives/SkeletonCell';
import { ErrorCell } from './primitives/ErrorCell';
import { ProUpgradeCard } from './primitives/ProUpgradeCard';

// Деталі клієнта
import { ClientSheetById } from './ClientSheetById';

// ── Props ─────────────────────────────────────────────────────────────────────

interface AnalyticsPageProps {
  isPro: boolean;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const TABS = [
  { key: 'overview', label: 'Огляд' },
  { key: 'growth', label: 'Зростання' },
  { key: 'behavior', label: 'Поведінка' },
  { key: 'reviews', label: 'Відгуки' },
  { key: 'source', label: 'Джерела' },
  { key: 'finances', label: 'Фінанси' },
  { key: 'stock', label: 'Склад' },
] as const;

// ── Tour Steps ────────────────────────────────────────────────────────────────

// humanized
const ANALYTICS_STEPS: TourStep[] = [
  {
    title: 'Аналітика',
    text: 'Повна картина бізнесу — виручка, записи, клієнти. Тут все в одному місці.',
    tourKey: 'anl-header',
  },
  {
    title: 'Зведення за період',
    text: 'Головне число й підказка з дією — одразу зверху, без скролу.',
    tourKey: 'anl-kpi',
  },
  {
    title: 'Графік виручки',
    text: 'Тренд за місяцями — бачиш де зростаєш i де є резерви для росту.',
    tourKey: 'anl-chart',
  },
  {
    title: 'Аналітика готова',
    text: 'Відкривай будь-який таб — Зростання, Поведінка, Відгуки — i копай глибше.',
  },
];

// ── Main Component ────────────────────────────────────────────────────────────

export function AnalyticsPage({ isPro }: AnalyticsPageProps) {
  const { masterProfile } = useMasterContext();
  const masterId = masterProfile?.id;
  const { currentStep, nextStep, closeTour, dynamicSteps } = useDestinationTour('analytics_v1', ANALYTICS_STEPS);

  const range = useDateRange();
  const [exporting, setExporting] = useState(false);
  const [direction, setDirection] = useState(0);
  const [selectedClient, setSelectedClient] = useState<{ clientId?: string | null; clientName: string; clientPhone?: string | null } | null>(null);
  const [detail, setDetail] = useState<OverviewDetail | null>(null);

  // nuqs таб-контроль
  const [activeTab, setActiveTab] = useQueryState('tab', parseAsString.withDefault('overview'));

  // Starter: обмежуємо безкоштовний доступ лише поточним місяцем
  const isLockedDateRange = !isPro && (range.preset !== 'month' || range.offset !== 0);

  // 1. Основний хук аналітики
  const { data, isLoading, isError, refetch, isFetching } = useAnalytics(
    { startDate: range.startDate, endDate: range.endDate },
    isPro,
    range.preset,
    range.offset
  );

  // 2. Мега-RPC хук для Pro метрик
  const { data: extras, isLoading: isExtrasLoading, refetch: refetchExtras } = useAnalyticsExtras({
    start: range.startDate,
    end: range.endDate,
    isPro,
    scope: 'all',
    enabled: isPro && !!data?.summary?.bookings,
  });

  // 3. Маркетингові/growth статистики для вкладки «Зростання»
  const { flashDealsStats, broadcastsStats, loyaltyStats, referralStats } = useAnalyticsMarketing({
    masterId,
    startDate: range.startDate,
    endDate: range.endDate,
    enabled: !!masterId && isPro && !!data?.summary?.bookings,
  });

  const summary = data?.summary ?? { bookings: 0, orders: 0, revenue: 0, activeClients: 0, newClients: null };
  const monthStats = data?.monthStats ?? [];
  const topServices = data?.topServices ?? [];
  const topProducts = data?.topProducts ?? [];
  const bento = data?.bento ?? null;

  const maxSvcRev = Math.max(...topServices.map(s => s.revenue), 1);
  const maxProdRev = Math.max(...topProducts.map(p => p.revenue), 1);

  // Лінійна регресія та прогноз виручки
  const forecast = isPro && monthStats.length >= 2
    ? linearRegression(monthStats.map(m => m.revenue))
    : null;

  const nextMonthName = useMemo(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 1);
    const months = ['Січень', 'Лютий', 'Березень', 'Квітень', 'Травень', 'Червень', 'Липень', 'Серпень', 'Вересень', 'Жовтень', 'Листопад', 'Грудень'];
    return months[d.getMonth()] ?? 'Наст. місяць';
  }, []);

  // Чи показувати нудж розумних цін (реальний пік ≥75%) — синхронно з SmartPricingOptimizer
  const showPricingNudge = isPro && (extras?.occupancy_heatmap?.some(h => h.occupancy_pct >= 75) ?? false);

  // Генерація actionable insight-історій (виручка-рекап НЕ включаємо — вона вже герой обкладинки)
  const storiesList = useMemo(() => {
    const list: StoryItem[] = [];
    if (!data || !isPro) return list;

    // 1. Дохід від Smart Pricing
    const pricingUplift = extras?.dynamic_pricing_uplift?.uplift_kopecks ?? 0;
    if (pricingUplift > 0) {
      list.push({
        id: 'story-pricing',
        type: 'pricing',
        title: `Розумне ціноутворення принесло +${formatPrice(Math.round(pricingUplift / 100))}`,
        description: 'Автоматичні націнки в години пік та знижки в гарячі години підвищили дохід.',
        ctaLabel: 'Налаштувати ціни',
        ctaHref: '/dashboard/revenue?tab=pricing',
        icon: <TrendingUp size={14} />,
      });
    }

    // 2. Аномалія завантаженості (наступний тиждень)
    const anomalies = extras?.anomaly_alerts ?? [];
    if (anomalies.length > 0) {
      const alert = anomalies[0];
      const alertDate = new Date(alert.date).toLocaleDateString('uk-UA', { day: 'numeric', month: 'long' });
      list.push({
        id: 'story-anomaly',
        type: 'anomaly',
        title: `Прогнозується спад завантаження на ${alertDate}`,
        description: 'Кількість записів суттєво нижча за середню. Створіть флеш-акцію, щоб заповнити вільні вікна.',
        ctaLabel: 'Створити акцію',
        ctaHref: '/dashboard/revenue?tab=flash',
        icon: <AlertTriangle size={14} />,
      });
    }

    // 3. LTV Концентрація (Парето)
    const concentration = extras?.ltv_concentration?.concentration_pct ?? 0;
    if (concentration > 0) {
      list.push({
        id: 'story-ltv',
        type: 'growth',
        title: `Топ-20% клієнтів приносять ${concentration}% доходу`,
        description: 'Зосередьтеся на утриманні VIP-клієнтів та реактивуйте кандидатів на повернення.',
        icon: <Users size={14} />,
      });
    }

    return list;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, extras, isPro]);

  // Розбивка виручки по категоріях (клік по виручці-герою) — реальні дані bento
  const revenueDetail: OverviewDetail | undefined = useMemo(() => {
    if (!bento?.revenueByCategory) return undefined;
    const c = bento.revenueByCategory;
    return {
      title: 'Виручка за період',
      hero: { value: formatPrice(Math.round(summary.revenue)) },
      rows: [
        { label: 'Послуги', value: formatPrice(Math.round(c.services)), tone: 'primary' },
        { label: 'Товари при записах', value: formatPrice(Math.round(c.bookingProducts)) },
        { label: 'Магазин', value: formatPrice(Math.round(c.shopProducts)) },
      ],
      note: 'Сума завершених записів та замовлень за період. Розбивка показує, що саме приносить дохід.',
    };
  }, [bento, summary.revenue]);

  // By the numbers — вторинні метрики обкладинки (Δ лише там, де реальні дані) + пояснення по кліку
  const secondaryMetrics: BriefingMetric[] = useMemo(() => [
    {
      label: pluralUk(summary.bookings, 'запис', 'записи', 'записів'), value: String(summary.bookings), delta: bento?.bookings?.delta ?? null,
      detail: { title: 'Записи', hero: { value: String(summary.bookings) }, note: 'Завершені записи за обраний період. Скасовані та неявки не враховані.' },
    },
    {
      label: pluralUk(summary.orders, 'замовлення', 'замовлення', 'замовлень'), value: String(summary.orders),
      detail: { title: 'Замовлення', hero: { value: String(summary.orders) }, note: 'Продажі товарів — окремо в магазині та як розхідники в записах.' },
    },
    {
      label: pluralUk(summary.activeClients, 'клієнт', 'клієнти', 'клієнтів'), value: String(summary.activeClients),
      detail: { title: 'Активні клієнти', hero: { value: String(summary.activeClients) }, note: 'Унікальні клієнти із записом чи замовленням за період.', cta: { label: 'Усі клієнти', href: '/dashboard/clients' } },
    },
  ], [summary.bookings, summary.orders, summary.activeClients, bento]);

  async function handleExport() {
    if (!masterId) return;
    setExporting(true);
    try {
      await exportAnalyticsCsv(masterId, range.startDate, range.endDate);
    } finally {
      setExporting(false);
    }
  }

  const handleRefreshAll = () => {
    refetch();
    if (isPro) {
      refetchExtras();
    }
  };

  const TAB_KEYS = TABS.map(t => t.key as string);

  const tabSpring = { type: 'spring', stiffness: 300, damping: 30 } as const;

  const slideVariants = {
    enter: (d: number) => ({ x: d > 0 ? 60 : -60, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (d: number) => ({ x: d > 0 ? -60 : 60, opacity: 0 }),
  };

  const handleTabChange = (key: string) => {
    const ci = TAB_KEYS.indexOf(activeTab);
    const ni = TAB_KEYS.indexOf(key);
    setDirection(ni > ci ? 1 : -1);
    setActiveTab(key);
  };

  const handleDragEnd = (_: PointerEvent, { offset, velocity }: PanInfo) => {
    const power = Math.abs(offset.x) * velocity.x;
    const ci = TAB_KEYS.indexOf(activeTab);
    if (power < -8000 && ci < TABS.length - 1) handleTabChange(TAB_KEYS[ci + 1]);
    else if (power > 8000 && ci > 0) handleTabChange(TAB_KEYS[ci - 1]);
  };

  return (
    <div className="flex flex-col gap-4 pb-8 w-full max-w-full overflow-x-hidden">

      {/* ── Editorial masthead + контроль періодів ── */}
      <div className="flex flex-col gap-3.5 px-0.5" data-tour-key="anl-header">
        <div className="flex items-center justify-between gap-3 pb-3 border-b border-border-strong/60">
          <div className="flex items-baseline gap-3 min-w-0">
            <h1 className="heading-serif text-2xl md:text-[26px] text-foreground leading-none">Аналітика</h1>
            <span className="text-xs text-text-sub truncate hidden sm:inline">Статистика та звіти</span>
          </div>
          <button
            type="button"
            onClick={handleRefreshAll}
            disabled={isFetching}
            aria-label="Оновити дані"
            className="size-9 flex-shrink-0 flex items-center justify-center rounded-full bg-secondary/70 border border-border text-text-sub hover:bg-primary/10 hover:text-primary active:scale-[0.90] cursor-pointer transition-colors duration-150 disabled:opacity-40"
          >
            <RefreshCw size={14} className={isFetching ? 'animate-spin' : ''} />
          </button>
        </div>
        <PeriodControls
          preset={range.preset}
          canGoNext={range.canGoNext}
          label={range.label}
          setPreset={range.setPreset}
          goPrev={range.goPrev}
          goNext={range.goNext}
        />
        {isLockedDateRange && (
          <div data-testid="locked-date-range" className="mt-3 flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl bg-primary/10 border border-primary/20">
            <Crown size={13} className="text-primary flex-shrink-0" />
            <p className="text-[12px] text-foreground flex-1">Цей діапазон доступний у Pro</p>
            <Link href="/dashboard/billing" className="text-[11px] font-bold text-primary whitespace-nowrap">
              Оновити
            </Link>
          </div>
        )}
      </div>

      {/* ── Error State ── */}
      {isError && (
        <BentoCell className="p-6">
          <ErrorCell onRetry={handleRefreshAll} />
        </BentoCell>
      )}

      {/* ── Loading State ── */}
      {isLoading && (
        <div data-testid="stats-loading" className="flex flex-col gap-4">
          <SkeletonCell variant="flat" className="h-[300px]" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SkeletonCell variant="square" />
            <SkeletonCell variant="square" />
          </div>
        </div>
      )}

      {/* ── Empty State (No Bookings) → Activation ── */}
      {!isLoading && !isLockedDateRange && summary.bookings === 0 && (
        <AnalyticsActivation slug={masterProfile?.slug || ''} />
      )}

      {/* ── Main Pro / Ready Dashboard Content ── */}
      {!isLoading && !isError && summary.bookings > 0 && (!isLockedDateRange || isPro) && (
        <div data-testid="stats-ready" className="flex flex-col gap-4">

          {/* Editorial-обкладинка зведення (виручка + інсайт + by the numbers) */}
          <div data-tour-key="anl-kpi">
            <OverviewBriefing
              periodLabel={range.label}
              revenue={summary.revenue}
              revenueDelta={bento?.revenue?.delta ?? null}
              secondary={secondaryMetrics}
              stories={storiesList}
              isPro={isPro}
              onOpenDetail={setDetail}
              revenueDetail={revenueDetail}
            />
          </div>

          {/* Paywall для Starter */}
          {!isPro && <ProUpgradeCard />}

          {isPro && extras?.business_health && (
            <BusinessHealthScoreWidget health={extras.business_health} />
          )}

          <MorningBriefing onOpenClient={(name, phone) => setSelectedClient({ clientName: name, clientPhone: phone })} />

          {/* ── Tabs Strip ── */}
          <div className="flex items-center gap-0 border-b border-border/40">
            <button
              type="button"
              aria-label="Попередня вкладка"
              onClick={() => { const ci = TAB_KEYS.indexOf(activeTab); if (ci > 0) handleTabChange(TAB_KEYS[ci - 1]); }}
              disabled={TAB_KEYS.indexOf(activeTab) === 0}
              className="size-8 flex-shrink-0 flex items-center justify-center rounded-full text-text-sub hover:text-foreground hover:bg-secondary/60 active:scale-[0.90] transition-all duration-100 disabled:opacity-20 cursor-pointer"
            >
              <ChevronLeft size={14} />
            </button>

            <div className="flex flex-1 overflow-x-auto scrollbar-hide">
              {TABS.map((t) => {
                const isLocked = !isPro && t.key !== 'overview';
                const isActive = activeTab === t.key;
                return (
                  <button
                    type="button"
                    key={t.key}
                    aria-pressed={isActive}
                    onClick={() => !isLocked && handleTabChange(t.key)}
                    className={cn(
                      'relative flex-shrink-0 px-4 py-3 text-xs font-semibold select-none cursor-pointer flex items-center gap-1.5 active:scale-[0.95] transition-colors duration-150 whitespace-nowrap',
                      isLocked && 'opacity-40 cursor-not-allowed'
                    )}
                  >
                    <span className={cn(isActive ? 'text-foreground' : 'text-text-sub hover:text-foreground')}>
                      {t.label}
                    </span>
                    {isLocked && <Crown size={10} className="text-primary flex-shrink-0" />}
                    {isActive && (
                      <motion.div
                        layoutId="analytics-tab-underline"
                        transition={tabSpring}
                        className="absolute bottom-0 left-0 right-0 h-[2px] bg-primary rounded-full"
                      />
                    )}
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              aria-label="Наступна вкладка"
              onClick={() => { const ci = TAB_KEYS.indexOf(activeTab); if (ci < TABS.length - 1) handleTabChange(TAB_KEYS[ci + 1]); }}
              disabled={TAB_KEYS.indexOf(activeTab) === TABS.length - 1}
              className="size-8 flex-shrink-0 flex items-center justify-center rounded-full text-text-sub hover:text-foreground hover:bg-secondary/60 active:scale-[0.90] transition-all duration-100 disabled:opacity-20 cursor-pointer"
            >
              <ChevronRight size={14} />
            </button>
          </div>

          {/* ── Tabs Render ── */}
          <AnimatePresence mode="popLayout" custom={direction}>
            <motion.div
              key={activeTab}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={tabSpring}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.15}
              onDragEnd={handleDragEnd}
              className="w-full cursor-grab active:cursor-grabbing"
            >

              {/* Tab 1: OVERVIEW */}
              {activeTab === 'overview' && (
                <OverviewTab
                  monthStats={monthStats}
                  forecast={forecast?.forecast ?? null}
                  nextMonthName={nextMonthName}
                  isPro={isPro}
                  showPricingNudge={showPricingNudge}
                  occupancyHeatmap={extras?.occupancy_heatmap}
                  topServices={topServices}
                  maxSvcRev={maxSvcRev}
                  topProducts={topProducts}
                  maxProdRev={maxProdRev}
                  topClients={bento?.topClients ?? []}
                  onOpenClient={(clientId, clientName) => setSelectedClient({ clientId, clientName })}
                  onOpenDetail={setDetail}
                  rangeLabel={range.label}
                  exporting={exporting}
                  onExport={handleExport}
                />
              )}

              {/* Tab 2: GROWTH */}
              {activeTab === 'growth' && isPro && (
                <div className="flex flex-col gap-4 lg:grid lg:grid-cols-2 lg:gap-6 lg:items-start">
                  <BentoSecondary
                    isPro={isPro}
                    currentRevenue={summary.revenue}
                    upliftKopecks={extras?.dynamic_pricing_uplift?.uplift_kopecks ?? 0}
                    ruleCounts={extras?.dynamic_pricing_uplift?.rule_counts ?? {}}
                    savedSlots={extras?.dynamic_pricing_uplift?.saved_slots ?? 0}
                    dealsCount={flashDealsStats?.total ?? 0}
                    claimedDeals={flashDealsStats?.claimed ?? 0}
                    sentBroadcasts={broadcastsStats?.sent ?? 0}
                    openedBroadcasts={broadcastsStats?.opened ?? 0}
                    convertedBroadcasts={broadcastsStats?.converted ?? 0}
                    concentrationPct={extras?.ltv_concentration?.concentration_pct ?? 0}
                    ltvDistribution={extras?.ltv_concentration?.ltv_distribution ?? {}}
                    winbackCandidates={extras?.ltv_concentration?.winback_candidates ?? []}
                    servicePairs={extras?.service_pairing ?? []}
                    onOpenClient={(name, phone) => setSelectedClient({ clientName: name, clientPhone: phone })}
                  />

                  <GrowthLists
                    loyaltyMembersCount={loyaltyStats?.activeMembers ?? 0}
                    loyaltyPointsEarned={loyaltyStats?.totalPoints ?? 0}
                    referralsSent={referralStats?.totalSent ?? 0}
                    referralsSignedUp={referralStats?.signedUp ?? 0}
                    referralsActivated={referralStats?.activated ?? 0}
                  />

                  {extras?.cohort_matrix && extras.cohort_matrix.length > 0 && (
                    <BentoCell className="p-5 lg:col-span-2">
                      <SectionHeading title="Когортний аналіз повернення" subtitle="Відсоток повторних візитів нових клієнтів по місяцях" />
                      <CohortHeatmap data={extras.cohort_matrix} />
                    </BentoCell>
                  )}
                </div>
              )}

              {/* Tab 3: BEHAVIOR */}
              {activeTab === 'behavior' && (
                <BehaviorTab
                  start={range.startDate}
                  end={range.endDate}
                  isPro={isPro}
                  occupancyHeatmap={extras?.occupancy_heatmap}
                  onOpenDetail={setDetail}
                />
              )}

              {/* Tab 4: REVIEWS */}
              {activeTab === 'reviews' && (
                <ReviewsTab start={range.startDate} end={range.endDate} onOpenDetail={setDetail} />
              )}

              {/* Tab 5: SOURCE */}
              {activeTab === 'source' && (
                <SourceTab start={range.startDate} end={range.endDate} isPro={isPro} onOpenDetail={setDetail} />
              )}

              {/* Tab 6: FINANCES */}
              {activeTab === 'finances' && (
                <FinancesTab start={range.startDate} end={range.endDate} isPro={isPro} rangeLabel={range.label} onOpenDetail={setDetail} />
              )}

              {/* Tab 7: STOCK */}
              {activeTab === 'stock' && (
                <StockTab start={range.startDate} end={range.endDate} isPro={isPro} onOpenDetail={setDetail} />
              )}

            </motion.div>
          </AnimatePresence>

          {/* Dots */}
          <div className="flex items-center justify-center gap-1.5 pt-2">
            {TABS.map((t) => {
              const isLocked = !isPro && t.key !== 'overview';
              return (
                <button
                  type="button"
                  key={t.key}
                  onClick={() => !isLocked && handleTabChange(t.key)}
                  aria-label={t.label}
                  disabled={isLocked}
                  className="cursor-pointer transition-all duration-150 active:scale-[0.85] disabled:cursor-not-allowed"
                >
                  <div className={cn(
                    'rounded-full transition-all duration-300',
                    activeTab === t.key ? 'w-4 h-1.5 bg-primary' : 'w-1.5 h-1.5 bg-muted-foreground/25 hover:bg-muted-foreground/50'
                  )} />
                </button>
              );
            })}
          </div>

        </div>
      )}

      {/* ── Client Detail Sheet Modal ── */}
      {selectedClient && masterId && (
        <ClientSheetById
          clientId={selectedClient.clientId}
          clientPhone={selectedClient.clientPhone}
          masterId={masterId}
          clientName={selectedClient.clientName}
          onClose={() => setSelectedClient(null)}
        />
      )}

      {/* ── Overview detail Sheet (клік по елементах Огляду) ── */}
      <OverviewDetailSheet detail={detail} onClose={() => setDetail(null)} />

      <TourBanner steps={dynamicSteps} currentStep={currentStep} onNext={nextStep} onClose={closeTour} />
    </div>
  );
}
