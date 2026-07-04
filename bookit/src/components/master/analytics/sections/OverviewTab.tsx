'use client';

import React from 'react';
import { Download, Loader2, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { formatPrice } from '@/lib/utils/currency';
import type { MonthStat, TopService, TopProduct, TopClient } from '@/lib/supabase/hooks/useAnalytics';

import { BentoCell } from '../primitives/BentoCell';
import { RevenueLineChart } from '../charts/RevenueLineChart';
import { SmartPricingOptimizer } from './SmartPricingOptimizer';
import { FeaturedServices } from './FeaturedServices';
import { FeaturedProducts } from './FeaturedProducts';
import { FeaturedClients } from './FeaturedClients';
import type { OverviewDetail } from './OverviewDetailSheet';

// ── Shared section heading (editorial: hairline rule, як masthead обкладинки) ──

export function SectionHeading({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <div className="mb-4 pb-2.5 border-b border-border-strong/45 flex items-start justify-between gap-3">
      <div className="min-w-0">
        <h3 className="heading-serif text-xl text-foreground leading-tight">{title}</h3>
        {subtitle && <p className="text-xs text-text-sub mt-1">{subtitle}</p>}
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  );
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface OverviewTabProps {
  monthStats: MonthStat[];
  forecast: number | null;
  nextMonthName: string;
  isPro: boolean;
  showPricingNudge: boolean;
  occupancyHeatmap?: { dow: number; hour: number; occupancy_pct: number }[];
  topServices: TopService[];
  maxSvcRev: number;
  topProducts: TopProduct[];
  maxProdRev: number;
  topClients: TopClient[];
  onOpenClient: (clientId: string, clientName: string) => void;
  onOpenDetail: (d: OverviewDetail) => void;
  rangeLabel: string;
  exporting: boolean;
  onExport: () => void;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function OverviewTab({
  monthStats,
  forecast,
  nextMonthName,
  isPro,
  showPricingNudge,
  occupancyHeatmap,
  topServices,
  topProducts,
  topClients,
  onOpenClient,
  onOpenDetail,
  rangeLabel,
  exporting,
  onExport,
}: OverviewTabProps) {
  const lastRev = monthStats.length ? monthStats[monthStats.length - 1].revenue : 0;
  const forecastDeltaPct = forecast != null && lastRev > 0 ? Math.round(((forecast - lastRev) / lastRev) * 100) : null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
      {/* Revenue chart — featured (прогноз-герой + графік) */}
      <div data-tour-key="anl-chart" className={cn('min-w-0', showPricingNudge ? 'lg:col-span-8' : 'lg:col-span-12')}>
        <BentoCell className="h-full p-5">
          <SectionHeading title="Графік виручки" subtitle="Динаміка за 6 місяців" />
          {isPro && forecast != null && (
            <div className="mb-4 pb-4 border-b border-border-strong/45">
              <span className="inline-block text-[11px] font-semibold text-primary mb-1.5">Прогноз на {nextMonthName}</span>
              <div className="flex items-end gap-2.5 flex-wrap">
                <p className="metric-value text-3xl font-semibold text-foreground leading-none">{formatPrice(Math.round(forecast))}</p>
                {forecastDeltaPct != null && forecastDeltaPct !== 0 && (
                  <span className={cn('inline-flex items-center gap-0.5 text-xs font-semibold leading-none mb-0.5 tabular-nums', forecastDeltaPct > 0 ? 'text-success' : 'text-error')}>
                    {forecastDeltaPct > 0 ? <ArrowUpRight size={13} strokeWidth={2.5} /> : <ArrowDownRight size={13} strokeWidth={2.5} />}
                    {forecastDeltaPct > 0 ? '+' : ''}{forecastDeltaPct}%
                  </span>
                )}
              </div>
              <p className="text-xs text-text-sub mt-1.5">проти минулого місяця, за лінійним трендом</p>
            </div>
          )}
          <RevenueLineChart
            data={monthStats}
            forecastRevenue={forecast ?? undefined}
            forecastMonthName={nextMonthName}
            isPro={isPro}
          />
        </BentoCell>
      </div>

      {/* Smart Pricing Nudge (реальний пік) */}
      {showPricingNudge && (
        <div className="lg:col-span-4 min-w-0">
          <SmartPricingOptimizer occupancyHeatmap={occupancyHeatmap} />
        </div>
      )}

      {/* Top Services — герой + ранг-список */}
      <div className="lg:col-span-7 min-w-0">
        <BentoCell className="h-full p-5">
          <SectionHeading title="Найпопулярніші послуги" subtitle="Рейтинг за кількістю та доходом" />
          {topServices.length === 0 ? (
            <p className="text-sm text-text-sub text-center py-8">Послуги ще не надавалися</p>
          ) : (
            <FeaturedServices services={topServices} onOpenDetail={onOpenDetail} />
          )}
        </BentoCell>
      </div>

      {/* Top Products — бестселер + ранг-список */}
      <div className="lg:col-span-5 min-w-0">
        <BentoCell className="h-full p-5">
          <SectionHeading title="Продажі товарів" subtitle="Рейтинг продажів товарів" />
          {topProducts.length === 0 ? (
            <p className="text-sm text-text-sub text-center py-8">Товари ще не продавалися</p>
          ) : (
            <FeaturedProducts products={topProducts} onOpenDetail={onOpenDetail} />
          )}
        </BentoCell>
      </div>

      {/* Top Clients — VIP + список */}
      {topClients.length > 0 && (
        <div className="lg:col-span-12 min-w-0">
          <BentoCell className="p-5">
            <SectionHeading title="Найактивніші клієнти" subtitle="Рейтинг за витратами та візитами" />
            <FeaturedClients clients={topClients} onOpenClient={onOpenClient} />
          </BentoCell>
        </div>
      )}

      {/* CSV Export Card */}
      <div className="lg:col-span-12 min-w-0">
        <BentoCell className="p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-foreground">Експорт фінансового звіту</p>
              <p className="text-[11px] text-text-sub mt-0.5">Завантажте CSV-файл з детальною історією транзакцій за {rangeLabel}</p>
            </div>
            <button
              type="button"
              onClick={onExport}
              disabled={exporting}
              className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[var(--btn-primary-bg)] text-[var(--accent-on)] text-xs font-semibold cursor-pointer active:scale-[0.95] transition-transform duration-150 disabled:opacity-50"
            >
              {exporting ? <><Loader2 size={13} className="animate-spin" />Генеруємо...</> : <><Download size={13} />Експорт в CSV</>}
            </button>
          </div>
        </BentoCell>
      </div>
    </div>
  );
}
