'use client';

import React from 'react';
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

  if (!hasData) {
    return (
      <EmptyCell
        title="Немає фінансових даних"
        description="Аналітика з'явиться після завершення перших записів з послугами та товарами."
        icon={<DollarSign size={24} />}
      />
    );
  }

  // Знаходимо послуги з низькою маржею (<40% маржа)
  const lowMarginServices = fin.services.filter(s => s.margin_pct < 40 && s.bookings_count > 0);

  return (
    <div className="flex flex-col gap-5">
      {/* 4 KPI Tickers */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bento-card p-4 flex flex-col justify-between">
          <p className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-wider">Виручка послуг</p>
          <p className="text-lg font-bold text-foreground mt-2">{formatPrice(Math.round(fin.services_revenue / 100))}</p>
        </div>

        <div className="bento-card p-4 flex flex-col justify-between">
          <p className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-wider">Продажі товарів</p>
          <p className="text-lg font-bold text-foreground mt-2">{formatPrice(Math.round(fin.products_revenue / 100))}</p>
        </div>

        <div className="bento-card p-4 flex flex-col justify-between">
          <p className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-wider">Собівартість розхідників</p>
          <p className="text-lg font-bold text-destructive mt-2">-{formatPrice(Math.round(fin.materials_cost / 100))}</p>
        </div>

        <div className="bento-card p-4 flex flex-col justify-between">
          <p className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-wider">Чистий прибуток</p>
          <p className="text-lg font-bold text-success mt-2">{formatPrice(Math.round(fin.net_profit / 100))}</p>
        </div>
      </div>

      {/* Waterfall & Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="bento-card p-5 lg:col-span-2">
          <WaterfallChart
            servicesRevenue={fin.services_revenue}
            productsRevenue={fin.products_revenue}
            materialsCost={fin.materials_cost}
            discountAmount={fin.discount_amount}
            netProfit={fin.net_profit}
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
                      onClick={() => window.open(`/dashboard/services?edit=${s.service_id}`, '_self')}
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

          {fin.services.map((s) => {
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
  );
}
