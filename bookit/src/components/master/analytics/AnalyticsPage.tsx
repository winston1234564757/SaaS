'use client';

import React, { useState, useMemo } from 'react';
import { useTour } from '@/lib/hooks/useTour';
import { TourBanner, type TourStep } from '@/components/master/onboarding/TourBanner';
import { DESTINATION_TOURS } from '@/components/master/onboarding/destinationTours';
import { cn } from '@/lib/utils/cn';
import { motion, AnimatePresence, type PanInfo } from 'framer-motion';
import { useQueryState, parseAsString } from 'nuqs';
import {
  BarChart2, Download, Loader2, RefreshCw,
  Crown, Star, Users, TrendingUp,
  AlertTriangle, Clock, ShoppingBag, ShieldAlert,
  ChevronDown, ChevronLeft, ChevronRight
} from 'lucide-react';
import Link from 'next/link';

import { createClient } from '@/lib/supabase/client';
import { useMasterContext } from '@/lib/supabase/context';
import { formatPrice } from '@/lib/utils/currency';
import { pluralUk } from '@/lib/utils/pluralUk';
import { useDateRange } from '@/lib/supabase/hooks/useDateRange';
import { useAnalytics, exportAnalyticsCsv, linearRegression } from '@/lib/supabase/hooks/useAnalytics';
import { useAnalyticsExtras } from '@/lib/supabase/hooks/useAnalyticsExtras';
import { useQuery, keepPreviousData } from '@tanstack/react-query';

// Компоненти-сегменти Bento
import { PeriodControls } from './sections/PeriodControls';
import { KpiTicker } from './sections/KpiTicker';
import { HeroStory, type StoryItem } from './sections/HeroStory';
import { BentoSecondary } from './sections/BentoSecondary';
import { GrowthLists } from './sections/GrowthLists';
import { BusinessHealthScoreWidget } from './sections/BusinessHealthScoreWidget';
import { MorningBriefing } from './sections/MorningBriefing';
import { SmartPricingOptimizer } from './sections/SmartPricingOptimizer';

// Графіки
import { RevenueLineChart } from './charts/RevenueLineChart';
import { CohortHeatmap } from './charts/CohortHeatmap';
import { HeatmapGrid } from './charts/HeatmapGrid';

// Вкладки drill-down
import { ReviewsTab } from './sections/tabs/ReviewsTab';
import { NoShowTab } from './sections/tabs/NoShowTab';
import { LeadTimeTab } from './sections/tabs/LeadTimeTab';
import { VacationTab } from './sections/tabs/VacationTab';
import { SourceTab } from './sections/tabs/SourceTab';
import { FinancesTab } from './sections/tabs/FinancesTab';
import { StockTab } from './sections/tabs/StockTab';

// Примітиви
import { BentoCell } from './primitives/BentoCell';
import { SkeletonCell } from './primitives/SkeletonCell';
import { EmptyCell } from './primitives/EmptyCell';
import { ErrorCell } from './primitives/ErrorCell';
import { ProUpgradeCard } from './primitives/ProUpgradeCard';

// Деталі клієнта
import { ClientDetailSheet } from '@/components/master/clients/ClientDetailSheet';
import type { ClientRow } from '@/components/master/clients/ClientsPage';

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

// ── Types for ClientSheetById ─────────────────────────────────────────────────

interface BookingForSheet {
  client_phone: string | null;
  date: string | null;
  total_price: number;
  status: string;
  client_name: string | null;
}

interface RelationForSheet {
  id: string;
  is_vip: boolean;
  health_notes: string | null;
  medical_notes: string | null;
}

// ── ClientSheetById ───────────────────────────────────────────────────────────

function ClientSheetById({
  clientPhone,
  clientId,
  masterId,
  clientName,
  onClose,
}: {
  clientPhone?: string | null;
  clientId?: string | null;
  masterId: string;
  clientName: string;
  onClose: () => void;
}) {
  const sb = createClient();

  const { data: row, isLoading } = useQuery<ClientRow | null>({
    queryKey: ['client-sheet-detail', masterId, clientId ?? clientPhone],
    enabled: !!masterId && (!!clientId || !!clientPhone),
    staleTime: 2 * 60_000,
    placeholderData: keepPreviousData,
    queryFn: async (): Promise<ClientRow | null> => {
      let resolvedClientId: string | null = clientId ?? null;
      const resolvedPhone: string | null = clientPhone ?? null;

      // Пошук ID клієнта за номером телефону, якщо ID не передано
      if (!resolvedClientId && resolvedPhone) {
        const { data: profile } = await sb
          .from('profiles')
          .select('id')
          .eq('phone', resolvedPhone)
          .maybeSingle();
        if (profile) {
          resolvedClientId = (profile as { id: string }).id;
        }
      }

      const finalId = resolvedClientId || resolvedPhone || 'unknown';

      // Будуємо OR-умову тільки з наявними ідентифікаторами
      const orParts: string[] = [];
      if (resolvedPhone) orParts.push(`client_phone.eq.${resolvedPhone}`);
      if (resolvedClientId) orParts.push(`client_id.eq.${resolvedClientId}`);
      if (orParts.length === 0) return null;

      const [bRes, rRes] = await Promise.all([
        sb.from('bookings')
          .select('client_phone, date, total_price, status, client_name')
          .eq('master_id', masterId)
          .or(orParts.join(','))
          .order('date', { ascending: false }),
        sb.from('client_master_relations')
          .select('id, is_vip, health_notes, medical_notes')
          .eq('master_id', masterId)
          .or(resolvedClientId ? `client_id.eq.${resolvedClientId}` : `client_id.eq.00000000-0000-0000-0000-000000000000`)
          .maybeSingle(),
      ]);

      const bs = (bRes.data ?? []) as BookingForSheet[];
      const rel = rRes.data as RelationForSheet | null;
      const nonCancelled = bs.filter((b) => b.status !== 'cancelled');
      const completed = bs.filter((b) => b.status === 'completed');
      const spent = completed.reduce((s, b) => s + Number(b.total_price), 0);

      return {
        id: bs[0]?.client_phone ?? finalId,
        client_id: resolvedClientId || null,
        client_name: bs[0]?.client_name ?? clientName,
        client_phone: bs[0]?.client_phone ?? resolvedPhone ?? '',
        total_visits: nonCancelled.length,
        total_spent: spent,
        average_check: completed.length > 0 ? Math.round(spent / completed.length) : 0,
        last_visit_at: bs[0]?.date ?? null,
        last_service_name: null,
        is_vip: rel?.is_vip ?? false,
        relation_id: rel?.id ?? null,
        retention_status: 'active' as const,
        health_notes: rel?.health_notes ?? null,
        medical_notes: rel?.medical_notes ?? null,
      };
    },
  });

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
        <Loader2 className="animate-spin text-primary size-8" />
      </div>
    );
  }

  return (
    <ClientDetailSheet
      client={row ?? null}
      onClose={onClose}
    />
  );
}

// ── ServiceRow ────────────────────────────────────────────────────────────────

function ServiceRow({ svc, maxRev }: { svc: any; maxRev: number }) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full text-left cursor-pointer transition-colors duration-150 active:scale-[0.98] hover:bg-secondary/40 rounded-xl p-2 -mx-2"
      >
        <div className="flex justify-between items-center mb-1.5">
          <span className="text-sm font-semibold text-foreground truncate pr-2">{svc.name}</span>
          <span className="text-sm font-bold text-success flex-shrink-0">{formatPrice(Math.round(svc.revenue))}</span>
        </div>
        <div className="h-2 rounded-full bg-secondary overflow-hidden">
          <div
            className="h-full rounded-full bg-primary transition-[width] duration-700"
            style={{ width: `${Math.round((svc.revenue / maxRev) * 100)}%` }}
          />
        </div>
        <div className="flex items-center justify-between mt-1">
          <span className="text-[11px] text-muted-foreground/60">{pluralUk(svc.count, 'запис', 'записи', 'записів')}</span>
          <ChevronDown size={12} className={`text-muted-foreground/60 transition-transform ${open ? 'rotate-180' : ''}`} />
        </div>
      </button>
      <div style={{ display: 'grid', gridTemplateRows: open ? '1fr' : '0fr', transition: 'grid-template-rows 0.25s ease' }}>
        <div style={{ overflow: 'hidden', minHeight: 0 }}>
          <div className="mt-2 p-3 rounded-2xl bg-primary/[0.06] border border-primary/15 grid grid-cols-3 gap-2">
            {[
              { label: 'Cross-sell', value: `${svc.crossSellRate}%`, className: 'text-primary' },
              { label: 'З товарами', value: `${Math.round(svc.count * svc.crossSellRate / 100)}/${svc.count}`, className: 'text-foreground' },
              { label: 'Серед. чек', value: svc.count > 0 ? formatPrice(Math.round(svc.revenue / svc.count)) : '—', className: 'text-foreground' },
            ].map(item => (
              <div key={item.label}>
                <p className="text-[10px] text-muted-foreground/60 mb-0.5">{item.label}</p>
                <p className={`text-sm font-bold ${item.className}`}>{item.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Tour Steps ────────────────────────────────────────────────────────────────

// humanized
const ANALYTICS_STEPS: TourStep[] = [
  {
    title: 'Аналітика',
    text: 'Повна картина бізнесу — виручка, записи, клієнти. Тут все в одному місці.',
    tourKey: 'anl-header',
  },
  {
    title: 'KPI в реальному часі',
    text: 'Ключові показники оновлюються щоразу як з\'являється новий запис.',
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
  const seenTours = masterProfile?.seen_tours as Record<string, boolean> | null;

  const { currentStep, nextStep, closeTour } = useTour('analytics_v1', ANALYTICS_STEPS.length + 1, {
    initialSeen: !!(seenTours?.['analytics_v1']),
    masterId,
  });
  const nextTours = DESTINATION_TOURS.filter(d => !seenTours?.[d.tourKey] && d.tourKey !== 'analytics_v1').slice(0, 3).map(d => ({ icon: d.icon, label: d.label, href: d.href }));
  // humanized — navigator step
  const dynamicSteps: TourStep[] = [...ANALYTICS_STEPS, { title: 'Цифри є', text: 'Куди зайдемо далі?', isNavigator: true, links: nextTours }];

  const range = useDateRange();
  const [exporting, setExporting] = useState(false);
  const [direction, setDirection] = useState(0);
  const [selectedClient, setSelectedClient] = useState<{ clientId?: string | null; clientName: string; clientPhone?: string | null } | null>(null);

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

  // 3. Додаткові маркетингові хуки для BentoSecondary
  const { data: flashDealsStats } = useQuery({
    queryKey: ['analytics-flash-deals', masterId, range.startDate, range.endDate],
    enabled: !!masterId && isPro && !!data?.summary?.bookings,
    queryFn: async () => {
      const supabase = createClient();
      const { data: fd, error } = await supabase
        .from('flash_deals')
        .select('status')
        .eq('master_id', masterId!)
        .gte('slot_date', range.startDate)
        .lte('slot_date', range.endDate);
      if (error) throw error;
      const total = fd?.length ?? 0;
      const claimed = fd?.filter((d: any) => d.status === 'booked').length ?? 0;
      return { total, claimed };
    },
    staleTime: 5 * 60_000,
  });

  const { data: broadcastsStats } = useQuery({
    queryKey: ['analytics-broadcasts', masterId, range.startDate, range.endDate],
    enabled: !!masterId && isPro && !!data?.summary?.bookings,
    queryFn: async () => {
      const supabase = createClient();
      const { data: b, error } = await supabase
        .from('broadcasts')
        .select('id')
        .eq('master_id', masterId!)
        .gte('created_at', range.startDate)
        .lte('created_at', range.endDate);
      if (error) throw error;

      if (!b || b.length === 0) {
        return { sent: 0, opened: 0, converted: 0 };
      }

      const ids = b.map((item: any) => item.id);
      const { data: recipients, error: rError } = await supabase
        .from('broadcast_recipients')
        .select('push_sent, telegram_sent, sms_sent, clicked_at, booked_at')
        .in('broadcast_id', ids);
      if (rError) throw rError;

      let sent = 0;
      let opened = 0;
      let converted = 0;

      recipients?.forEach((r: any) => {
        if (r.push_sent || r.telegram_sent || r.sms_sent) sent++;
        if (r.clicked_at) opened++;
        if (r.booked_at) converted++;
      });

      return { sent, opened, converted };
    },
    staleTime: 5 * 60_000,
  });

  const { data: loyaltyStats } = useQuery({
    queryKey: ['analytics-loyalty-stats', masterId],
    enabled: !!masterId && isPro && !!data?.summary?.bookings,
    queryFn: async () => {
      const supabase = createClient();
      const { data: cmr, error } = await supabase
        .from('client_master_relations')
        .select('total_visits')
        .eq('master_id', masterId!);
      if (error) throw error;

      const activeMembers = cmr?.filter((c: any) => c.total_visits > 0).length ?? 0;
      const totalPoints = cmr?.reduce((sum: number, c: any) => sum + (c.total_visits || 0), 0) ?? 0;

      return { activeMembers, totalPoints };
    },
    staleTime: 5 * 60_000,
  });

  const { data: referralStats } = useQuery({
    queryKey: ['analytics-referrals', masterId],
    enabled: !!masterId && isPro && !!data?.summary?.bookings,
    queryFn: async () => {
      const supabase = createClient();
      const { data: sent, error: e1 } = await supabase
        .from('referrals')
        .select('status')
        .eq('master_id', masterId!);
      if (e1) throw e1;

      const totalSent = sent?.length ?? 0;
      const signedUp = sent?.filter((r: any) => r.status === 'signed_up' || r.status === 'activated').length ?? 0;
      const activated = sent?.filter((r: any) => r.status === 'activated').length ?? 0;

      return { totalSent, signedUp, activated };
    },
    staleTime: 5 * 60_000,
  });

  const summary = data?.summary ?? { bookings: 0, orders: 0, revenue: 0, activeClients: 0, newClients: null };
  const monthStats = data?.monthStats ?? [];
  const topServices = data?.topServices ?? [];
  const topProducts = data?.topProducts ?? [];
  const retention = data?.retention ?? null;
  const bento = data?.bento ?? null;

  const maxSvcRev = Math.max(...topServices.map(s => s.revenue), 1);
  const maxProdRev = Math.max(...topProducts.map(p => p.revenue), 1);

  // Лінійна регресія та прогноз виручки
  const forecast = isPro && monthStats.length >= 2
    ? linearRegression(monthStats.map(m => m.revenue))
    : null;

  const lastMonthRev = monthStats[monthStats.length - 1]?.revenue ?? 0;
  const forecastDelta = forecast ? forecast.forecast - lastMonthRev : 0;
  const forecastPct = lastMonthRev > 0 ? Math.round((forecastDelta / lastMonthRev) * 100) : null;

  const nextMonthName = useMemo(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 1);
    const months = ['Січень', 'Лютий', 'Березень', 'Квітень', 'Травень', 'Червень', 'Липень', 'Серпень', 'Вересень', 'Жовтень', 'Листопад', 'Грудень'];
    return months[d.getMonth()] ?? 'Наст. місяць';
  }, []);

  // Генерація Insight Stories
  const storiesList = useMemo(() => {
    const list: StoryItem[] = [];
    if (!data) return list;

    // 1. Огляд виручки
    if (summary.bookings > 0) {
      list.push({
        id: 'story-rev',
        type: 'general',
        title: `Виручка за період: ${formatPrice(Math.round(summary.revenue))}`,
        description: `Завершено ${summary.bookings} ${pluralUk(summary.bookings, 'запис', 'записи', 'записів')}. Середній чек становить ${bento?.avgCheck?.current ? formatPrice(bento.avgCheck.current) : '—'}.`,
        icon: <Star size={14} className="text-primary" />
      });
    }

    // 2. Дохід від Smart Pricing
    const pricingUplift = extras?.dynamic_pricing_uplift?.uplift_kopecks ?? 0;
    if (pricingUplift > 0) {
      list.push({
        id: 'story-pricing',
        type: 'pricing',
        title: `Розумне ціноутворення принесло +${formatPrice(Math.round(pricingUplift / 100))}`,
        description: `Автоматичні націнки в години пік та знижки в гарячі години підвищили ROI.`,
        ctaLabel: 'Налаштувати ціни',
        ctaHref: '/dashboard/revenue?tab=pricing',
        icon: <TrendingUp size={14} className="text-success" />
      });
    }

    // 3. Аномалія завантаженості (наступний тиждень)
    const anomalies = extras?.anomaly_alerts ?? [];
    if (isPro && anomalies.length > 0) {
      const alert = anomalies[0];
      const alertDate = new Date(alert.date).toLocaleDateString('uk-UA', { day: 'numeric', month: 'long' });
      list.push({
        id: 'story-anomaly',
        type: 'anomaly',
        title: `Прогнозується спад завантаження на ${alertDate}`,
        description: `Кількість записів суттєво нижча за середню. Створіть флеш-акцію, щоб заповнити вільні вікна.`,
        ctaLabel: 'Створити акцію',
        ctaHref: '/dashboard/revenue?tab=flash',
        icon: <AlertTriangle size={14} className="text-warning" />
      });
    }

    // 4. LTV Концентрація (Парето)
    const concentration = extras?.ltv_concentration?.concentration_pct ?? 0;
    if (isPro && concentration > 0) {
      list.push({
        id: 'story-ltv',
        type: 'growth',
        title: `Топ-20% клієнтів приносять ${concentration}% вашого доходу`,
        description: `Зосередьтеся на утриманні VIP-клієнтів та реактивуйте кандидатів на повернення.`,
        icon: <Users size={14} className="text-primary" />
      });
    }

    return list;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, extras, isPro, summary, bento]);

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

      {/* ── Вступний заголовок та контроль періодів ── */}
      <div className="bento-card p-5" data-tour-key="anl-header">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="heading-serif text-xl text-foreground mb-0.5">Аналітика</h1>
            <p className="text-sm text-muted-foreground/60">Статистика та звіти</p>
          </div>
          <button
            type="button"
            onClick={handleRefreshAll}
            disabled={isFetching}
            aria-label="Оновити дані"
            className="size-11 flex items-center justify-center rounded-full bg-secondary text-muted-foreground hover:bg-primary/10 hover:text-primary active:scale-[0.90] cursor-pointer transition-colors duration-150 disabled:opacity-40"
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
            <p className="text-[12px] text-muted-foreground flex-1">Цей діапазон доступний у Pro</p>
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
          <SkeletonCell variant="ticker" />
          <SkeletonCell variant="flat" className="h-[240px]" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SkeletonCell variant="square" />
            <SkeletonCell variant="square" />
          </div>
        </div>
      )}

      {/* ── Empty State (No Bookings) ── */}
      {!isLoading && !isLockedDateRange && summary.bookings === 0 && (
        <BentoCell className="p-6">
          <EmptyCell
            title="Даних ще немає"
            description="Аналітика з'явиться після перших записів. Поширте вашу сторінку або додайте запис вручну."
            icon={<BarChart2 size={24} />}
            actionLabel="Поділитися посиланням"
            onActionClick={() => window.open(`/${masterProfile?.slug || ''}`, '_blank')}
          />
        </BentoCell>
      )}

      {/* ── Paywall Upgrade Card for Starter Tier ── */}
      {!isLockedDateRange && !isPro && summary.bookings > 0 && (
        <ProUpgradeCard />
      )}

      {/* ── Main Pro / Ready Dashboard Content ── */}
      {!isLoading && !isError && summary.bookings > 0 && (!isLockedDateRange || isPro) && (
        <div data-testid="stats-ready" className="flex flex-col gap-4">

          {isPro && extras?.business_health && (
            <BusinessHealthScoreWidget health={extras.business_health} />
          )}

          <MorningBriefing onOpenClient={(name, phone) => setSelectedClient({ clientName: name, clientPhone: phone })} />

          {/* KPI Ticker & stories (Pro-only insights) */}
          <div data-tour-key="anl-kpi">
            <KpiTicker
              bookings={summary.bookings}
              orders={summary.orders}
              revenue={summary.revenue}
              activeClients={summary.activeClients}
            />
          </div>

          {isPro && storiesList.length > 0 && (
            <HeroStory stories={storiesList} />
          )}

          {/* ── Tabs Strip ── */}
          <div className="flex items-center gap-0 border-b border-border/40">
            <button
              type="button"
              aria-label="Попередня вкладка"
              onClick={() => { const ci = TAB_KEYS.indexOf(activeTab); if (ci > 0) handleTabChange(TAB_KEYS[ci - 1]); }}
              disabled={TAB_KEYS.indexOf(activeTab) === 0}
              className="size-8 flex-shrink-0 flex items-center justify-center rounded-full text-muted-foreground/60 hover:text-foreground hover:bg-secondary/60 active:scale-[0.90] transition-all duration-100 disabled:opacity-20 cursor-pointer"
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
                    <span className={cn(isActive ? 'text-foreground' : 'text-muted-foreground/60 hover:text-muted-foreground')}>
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
              className="size-8 flex-shrink-0 flex items-center justify-center rounded-full text-muted-foreground/60 hover:text-foreground hover:bg-secondary/60 active:scale-[0.90] transition-all duration-100 disabled:opacity-20 cursor-pointer"
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
                <div className="flex flex-col gap-4">
                  {/* Revenue Line Chart */}
                  <div data-tour-key="anl-chart">
                    <BentoCell className="p-5">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <p className="text-xs font-semibold text-muted-foreground/60 uppercase tracking-wider">Графік виручки</p>
                          <p className="text-[11px] text-muted-foreground/50 mt-0.5">Динаміка за період з прогнозом</p>
                        </div>
                      </div>
                      <RevenueLineChart
                        data={monthStats}
                        forecastRevenue={forecast?.forecast}
                        forecastMonthName={nextMonthName}
                        isPro={isPro}
                      />
                    </BentoCell>
                  </div>

                  {isPro && (
                    <SmartPricingOptimizer occupancyHeatmap={extras?.occupancy_heatmap} />
                  )}

                  {/* Asymmetric grid: Top Services & Products */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Top Services */}
                    <BentoCell className="p-5">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <p className="text-xs font-semibold text-muted-foreground/60 uppercase tracking-wider">Найпопулярніші послуги</p>
                          <p className="text-[11px] text-muted-foreground/50 mt-0.5">Рейтинг за кількістю та доходом</p>
                        </div>
                      </div>
                      {topServices.length === 0 ? (
                        <p className="text-sm text-muted-foreground/60 text-center py-8">Послуги ще не надавалися</p>
                      ) : (
                        <div className="flex flex-col gap-4">
                          {topServices.map(svc => (
                            <ServiceRow key={svc.name} svc={svc} maxRev={maxSvcRev} />
                          ))}
                        </div>
                      )}
                    </BentoCell>

                    {/* Top Products */}
                    <BentoCell className="p-5">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <p className="text-xs font-semibold text-muted-foreground/60 uppercase tracking-wider">Продажі товарів</p>
                          <p className="text-[11px] text-muted-foreground/50 mt-0.5">Рейтинг продажів товарів</p>
                        </div>
                      </div>
                      {topProducts.length === 0 ? (
                        <p className="text-sm text-muted-foreground/60 text-center py-8">Товари ще не продавалися</p>
                      ) : (
                        <div className="flex flex-col gap-4">
                          {topProducts.map((prod, i) => (
                            <div key={i} className="flex items-center gap-3">
                              <span className="text-xs font-bold text-muted-foreground/60 w-4 flex-shrink-0">{i + 1}</span>
                              <div className="flex-1 min-w-0">
                                <div className="flex justify-between mb-1">
                                  <span className="text-sm font-semibold text-foreground truncate pr-2">{prod.name}</span>
                                  <span className="text-sm font-bold text-success flex-shrink-0">{formatPrice(Math.round(prod.revenue))}</span>
                                </div>
                                <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                                  <div
                                    className="h-full bg-warning/80 transition-[width] duration-700"
                                    style={{ width: `${Math.round((prod.revenue / maxProdRev) * 100)}%` }}
                                  />
                                </div>
                                <span className="text-[10px] text-muted-foreground/60 mt-1 block leading-none">Продано: {prod.qty} шт.</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </BentoCell>
                  </div>

                  {/* Top Clients */}
                  {bento?.topClients && bento.topClients.length > 0 && (
                    <BentoCell className="p-5">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <p className="text-xs font-semibold text-muted-foreground/60 uppercase tracking-wider">Найактивніші клієнти</p>
                          <p className="text-[11px] text-muted-foreground/50 mt-0.5">Рейтинг за витратами та візитами</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                        {bento.topClients.map((c, i) => (
                          <button
                            type="button"
                            key={i}
                            onClick={() => c.clientId ? setSelectedClient({ clientId: c.clientId, clientName: c.clientName }) : undefined}
                            disabled={!c.clientId}
                            className="flex items-center gap-3 p-3 rounded-2xl bg-secondary/40 hover:bg-secondary/70 border border-border/5 text-left w-full cursor-pointer transition-colors duration-150 active:scale-[0.98]"
                          >
                            <div className={cn(
                              'size-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 select-none',
                              i === 0 && 'bg-warning/20 text-warning',
                              i === 1 && 'bg-primary/20 text-primary',
                              i > 1 && 'bg-secondary text-muted-foreground/60'
                            )}>
                              {i + 1}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-semibold text-foreground truncate">{c.clientName}</p>
                              <p className="text-[10px] text-muted-foreground/60">{c.visits} {pluralUk(c.visits, 'відвідування', 'відвідування', 'відвідувань')}</p>
                            </div>
                            <p className="text-xs font-bold text-success flex-shrink-0 select-none">
                              {formatPrice(Math.round(c.revenue))}
                            </p>
                          </button>
                        ))}
                      </div>
                    </BentoCell>
                  )}

                  {/* CSV Export Card */}
                  <BentoCell className="p-5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <p className="text-sm font-semibold text-foreground">Експорт фінансового звіту</p>
                        <p className="text-[11px] text-muted-foreground/60 mt-0.5">Завантажте CSV-файл з детальною історією транзакцій за {range.label}</p>
                      </div>
                      <button
                        type="button"
                        onClick={handleExport}
                        disabled={exporting}
                        className="group relative overflow-hidden flex items-center justify-center gap-2 px-5 py-3 rounded-full bg-[var(--btn-primary-bg)] text-[var(--accent-on)] text-xs font-semibold cursor-pointer active:scale-[0.95] transition-colors duration-150 disabled:opacity-50"
                      >
                        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none" style={{ background: 'color-mix(in srgb, var(--accent-on) 12%, transparent)' }} />
                        <span className="relative z-10 flex items-center gap-2">
                          {exporting ? (
                            <>
                              <Loader2 size={13} className="animate-spin" />
                              Генеруємо...
                            </>
                          ) : (
                            <>
                              <Download size={13} />
                              Експорт в CSV
                            </>
                          )}
                        </span>
                      </button>
                    </div>
                  </BentoCell>
                </div>
              )}

              {/* Tab 2: GROWTH */}
              {activeTab === 'growth' && isPro && (
                <div className="flex flex-col gap-4 lg:grid lg:grid-cols-2 lg:gap-6 lg:items-start">
                  {/* BentoSecondary Section (Smart Pricing, Goals, LTV Concentration, Pairs) */}
                  <BentoSecondary
                    isPro={isPro}
                    currentRevenue={summary.revenue}
                    upliftKopecks={extras?.dynamic_pricing_uplift?.uplift_kopecks ?? 0}
                    ruleCounts={extras?.dynamic_pricing_uplift?.rule_counts ?? {}}
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

                  {/* GrowthLists Section (Loyalty & Referrals) */}
                  <GrowthLists
                    loyaltyMembersCount={loyaltyStats?.activeMembers ?? 0}
                    loyaltyPointsEarned={loyaltyStats?.totalPoints ?? 0}
                    referralsSent={referralStats?.totalSent ?? 0}
                    referralsSignedUp={referralStats?.signedUp ?? 0}
                    referralsActivated={referralStats?.activated ?? 0}
                  />

                  {/* Cohort Heatmap Card */}
                  {extras?.cohort_matrix && extras.cohort_matrix.length > 0 && (
                    <BentoCell className="p-5 lg:col-span-2">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <p className="text-xs font-semibold text-muted-foreground/60 uppercase tracking-wider">Когортний аналіз повернення</p>
                          <p className="text-[11px] text-muted-foreground/50 mt-0.5">Відсоток повторних візитів нових клієнтів по місяцях</p>
                        </div>
                      </div>
                      <CohortHeatmap data={extras.cohort_matrix} />
                    </BentoCell>
                  )}
                </div>
              )}

              {/* Tab 3: BEHAVIOR */}
              {activeTab === 'behavior' && isPro && (
                <div className="flex flex-col gap-5">
                  {/* Occupancy Heatmap */}
                  {extras?.occupancy_heatmap && extras.occupancy_heatmap.length > 0 && (
                    <BentoCell className="p-5">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <p className="text-xs font-semibold text-muted-foreground/60 uppercase tracking-wider">Теплова карта завантаження</p>
                          <p className="text-[11px] text-muted-foreground/50 mt-0.5">Рівень зайнятості по годинах та днях тижня</p>
                        </div>
                      </div>
                      <HeatmapGrid data={extras.occupancy_heatmap} />
                    </BentoCell>
                  )}

                  {/* Drill-down: Lead Time Tab */}
                  <LeadTimeTab start={range.startDate} end={range.endDate} />

                  {/* Drill-down: No-Show Tab */}
                  <NoShowTab start={range.startDate} end={range.endDate} />

                  {/* Drill-down: Vacation Impact */}
                  <VacationTab start={range.startDate} end={range.endDate} />
                </div>
              )}

              {/* Tab 4: REVIEWS */}
              {activeTab === 'reviews' && (
                <ReviewsTab start={range.startDate} end={range.endDate} />
              )}

              {/* Tab 5: SOURCE */}
              {activeTab === 'source' && (
                <SourceTab start={range.startDate} end={range.endDate} />
              )}

              {/* Tab 6: FINANCES */}
              {activeTab === 'finances' && (
                <FinancesTab start={range.startDate} end={range.endDate} isPro={isPro} />
              )}

              {/* Tab 7: STOCK */}
              {activeTab === 'stock' && (
                <StockTab start={range.startDate} end={range.endDate} isPro={isPro} />
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

      <TourBanner steps={dynamicSteps} currentStep={currentStep} onNext={nextStep} onClose={closeTour} />
    </div>
  );
}
