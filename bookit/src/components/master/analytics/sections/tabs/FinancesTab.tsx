'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useAnalyticsExtras } from '@/lib/supabase/hooks/useAnalyticsExtras';
import { formatPrice } from '@/lib/utils/currency';
import { WaterfallChart } from '../../charts/WaterfallChart';
import { SkeletonCell } from '../../primitives/SkeletonCell';
import { EmptyCell } from '../../primitives/EmptyCell';
import { AlertTriangle, TrendingUp, DollarSign } from 'lucide-react';

interface FinancesTabProps {
  start: string;
  end: string;
  isPro: boolean;
}

export function FinancesTab({ start, end, isPro }: FinancesTabProps) {
  const router = useRouter();
  const { data, isLoading } = useAnalyticsExtras({
    start,
    end,
    isPro,
    scope: 'finances',
    enabled: isPro,
  });

  if (!isPro) {
    return (
      <div className="p-6 rounded-2xl bg-secondary/20 border border-border/5 text-center flex flex-col items-center justify-center min-h-[300px]">
        <TrendingUp className="size-12 text-primary mb-4" />
        <h3 className="text-lg font-semibold text-foreground mb-2">Фінансова аналітика доступна в Pro</h3>
        <p className="text-sm text-muted-foreground/60 max-w-sm mb-4">
          Підключіть тариф Pro, щоб розраховувати реальну собівартість матеріалів, чистий прибуток та маржинальність послуг.
        </p>
      </div>
    );
  }

  if (isLoading) {
    return <SkeletonCell variant="flat" className="h-[350px]" />;
  }

  const fin = data?.finances ?? {
    services_revenue: 0,
    products_revenue: 0,
    materials_cost: 0,
    discount_amount: 0,
    net_profit: 0,
    services: [],
    products: [],
  };

  const hasData = fin.services_revenue > 0 || fin.products_revenue > 0;

  const displayFin = hasData ? fin : {
    services_revenue: 1540000,
    products_revenue: 320000,
    materials_cost: 410000,
    discount_amount: 50000,
    net_profit: 1400000,
    services: [
      { service_id: 's1', service_name: 'Складне фарбування', bookings_count: 12, revenue_kopecks: 600000, cost_kopecks: 200000, margin_pct: 66 },
      { service_id: 's2', service_name: 'Базовий догляд (низька маржа)', bookings_count: 5, revenue_kopecks: 100000, cost_kopecks: 70000, margin_pct: 30 },
      { service_id: 's3', service_name: 'Преміум процедура', bookings_count: 24, revenue_kopecks: 840000, cost_kopecks: 140000, margin_pct: 83 },
    ],
    products: []
  };

  const lowMarginServices = displayFin.services.filter(s => s.margin_pct < 40 && s.bookings_count > 0);

  return (
    <div className="relative w-full">
      {/* Blurred Dummy Content */}
      <div className={`flex flex-col gap-5 transition-all duration-700 ${!hasData ? 'blur-[8px] opacity-40 pointer-events-none select-none grayscale-[0.2]' : ''}`}>
        {/* 4 KPI Tickers */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bento-card p-4 flex flex-col justify-between">
            <p className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-wider">Виручка послуг</p>
            <p className="text-lg font-bold text-foreground mt-2">{formatPrice(Math.round(displayFin.services_revenue / 100))}</p>
          </div>

          <div className="bento-card p-4 flex flex-col justify-between">
            <p className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-wider">Продажі товарів</p>
            <p className="text-lg font-bold text-foreground mt-2">{formatPrice(Math.round(displayFin.products_revenue / 100))}</p>
          </div>

          <div className="bento-card p-4 flex flex-col justify-between">
            <p className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-wider">Собівартість розхідників</p>
            <p className="text-lg font-bold text-destructive mt-2">-{formatPrice(Math.round(displayFin.materials_cost / 100))}</p>
          </div>

          <div className="bento-card p-4 flex flex-col justify-between">
            <p className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-wider">Чистий прибуток</p>
            <p className="text-lg font-bold text-success mt-2">{formatPrice(Math.round(displayFin.net_profit / 100))}</p>
          </div>
        </div>

        {/* Waterfall & Alerts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="bento-card p-5 lg:col-span-2">
            <WaterfallChart
              servicesRevenue={displayFin.services_revenue}
              productsRevenue={displayFin.products_revenue}
              materialsCost={displayFin.materials_cost}
              discountAmount={displayFin.discount_amount}
              netProfit={displayFin.net_profit}
            />
          </div>

          <div className="flex flex-col gap-4">
            {/* Consumable Price Alert */}
            {lowMarginServices.length > 0 ? (
              <div className="bento-card p-5 bg-warning/10 border border-warning/20 flex flex-col gap-3">
                <div className="flex items-center gap-2 text-warning">
                  <AlertTriangle size={16} />
                  <span className="text-xs font-bold uppercase tracking-wider">Низька маржа послуг</span>
                </div>
                <div className="flex flex-col gap-3">
                  {lowMarginServices.slice(0, 2).map((s) => (
                    <div key={s.service_id} className="text-xs">
                      <p className="font-semibold text-foreground">{s.service_name}</p>
                      <p className="text-muted-foreground/70 mt-0.5">
                        Маржа становить лише <span className="font-bold text-destructive">{s.margin_pct}%</span> через високу вартість розхідників.
                      </p>
                      <button
                        type="button"
                        onClick={() => router.push(`/dashboard/services?edit=${s.service_id}`)}
                        className="mt-2 text-[10px] font-bold text-primary hover:underline cursor-pointer"
                      >
                        Рекомендуємо підняти ціну на +10% ➔
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="bento-card p-5 bg-success/10 border border-success/20 flex flex-col gap-2">
                <div className="flex items-center gap-2 text-success">
                  <TrendingUp size={16} />
                  <span className="text-xs font-bold uppercase tracking-wider">Маржинальність у нормі</span>
                </div>
                <p className="text-xs text-muted-foreground/80">
                  Всі ваші послуги мають високу рентабельність (&gt;40%). Націнка та собівартість матеріалів знаходяться в балансі.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Список маржинальності послуг */}
        <div className="bento-card p-5">
          <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-4">Маржинальність послуг</h3>
          
          <div className="flex flex-col divide-y divide-border/10">
            <div className="py-2.5 grid grid-cols-4 text-[10px] font-semibold text-muted-foreground/60 uppercase">
              <div className="col-span-2">Назва послуги</div>
              <div className="text-right">Виручка</div>
              <div className="text-right">Маржа %</div>
            </div>

            {displayFin.services.map((s) => {
              const isLowMargin = s.margin_pct < 40;
              return (
                <div key={s.service_id} className="py-3 grid grid-cols-4 items-center gap-2">
                  <div className="col-span-2 min-w-0">
                    <p className="text-xs font-semibold text-foreground truncate">{s.service_name}</p>
                    <p className="text-[10px] text-muted-foreground/60">{s.bookings_count} записів</p>
                  </div>
                  
                  <div className="text-right text-xs font-bold text-foreground">
                    {formatPrice(Math.round(s.revenue_kopecks / 100))}
                  </div>

                  <div className="text-right">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      isLowMargin ? 'bg-destructive/10 text-destructive' : 'bg-success/10 text-success'
                    }`}>
                      {s.margin_pct}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Premium Overlay for Empty State */}
      {!hasData && (
        <div className="absolute inset-0 flex items-center justify-center z-20 px-4 pointer-events-auto">
          <div className="bento-card p-8 flex flex-col items-center justify-center text-center max-w-md bg-surface/80 backdrop-blur-xl border border-white/30 shadow-[0_8px_32px_rgb(0,0,0,0.12)]">
            <div className="size-16 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-5 border border-primary/20 shadow-inner">
              <DollarSign size={28} />
            </div>
            <h3 className="heading-serif text-2xl font-bold text-foreground mb-2">Фінансова аналітика</h3>
            <p className="text-sm text-muted-foreground/80 mb-6 leading-relaxed">
              Цей розділ оживе, як тільки ви завершите перші записи з послугами. Система автоматично розрахує чистий прибуток та маржинальність.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
