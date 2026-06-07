'use client';

import { motion } from 'framer-motion';
import { TrendingUp, Users, Zap, Clock, Info } from 'lucide-react';
import { pluralUk } from '@/lib/utils/pluralUk';
import type { DashboardStats } from '../hooks/useBookingsDashboardLogic';

interface Props {
  stats: DashboardStats;
  isLoading?: boolean;
}

export function DashboardWidgets({ stats, isLoading }: Props) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
      {/* 1. Occupancy % */}
      <WidgetCard
        title="Заповненість"
        value={`${Math.round(stats.occupancyRate)}%`}
        label="розкладу"
        icon={<Clock className="text-primary" size={18} />}
        delay={0.1}
        isLoading={isLoading}
        color="primary"
      />

      {/* 2. Forecast Revenue */}
      <WidgetCard
        title="Прогноз"
        value={`${stats.forecastRevenue.toLocaleString('uk-UA')} ₴`}
        label="до кінця місяця"
        icon={<TrendingUp className="text-success" size={18} />}
        delay={0.2}
        isLoading={isLoading}
        color="success"
      />

      {/* 3. Retention */}
      <WidgetCard
        title="Лояльність"
        value={`${Math.round(stats.retentionRate)}%`}
        label={`${stats.returningClientsCount} ${pluralUk(stats.returningClientsCount, 'повертається', 'повертаються', 'повертаються')}`}
        icon={<Users className="text-sage" size={18} />}
        delay={0.3}
        isLoading={isLoading}
        color="sage"
      />

      {/* 4. Efficiency / Lost Time */}
      <WidgetCard
        title="Ефективність"
        value={`${Math.round(stats.efficiencyRate)}%`}
        label={stats.lostMinutes > 0 ? `${stats.lostMinutes} хв на скасуваннях` : 'Без втрат часу'}
        icon={<Zap className="text-warning" size={18} />}
        delay={0.4}
        isLoading={isLoading}
        color="warning"
      />
    </div>
  );
}

interface WidgetCardProps {
  title: string;
  value: string | number;
  label: string;
  icon: React.ReactNode;
  delay: number;
  isLoading?: boolean;
  color?: 'primary' | 'success' | 'warning' | 'sage';
}

function WidgetCard({ title, value, label, icon, delay, isLoading, color = 'primary' }: WidgetCardProps) {
  return (
    <div
      className="bento-card p-5 lg:p-7 relative overflow-hidden group transition-all"
    >
      <p className="text-[10px] lg:text-[11px] font-bold text-muted-foreground/70 uppercase tracking-[0.2em] leading-tight mb-3 lg:mb-4">{title}</p>

      <div className="min-h-[58px] lg:min-h-[66px] flex flex-col justify-end">
        {isLoading ? (
          <div className="space-y-1.5 lg:space-y-2">
            <div className="h-9 lg:h-10 w-24 bg-muted/20 animate-pulse rounded-lg" />
            <div className="h-4 w-16 bg-muted/10 animate-pulse rounded-md" />
          </div>
        ) : (
          <>
            <h3 className="heading-serif text-3xl lg:text-4xl text-foreground leading-tight transition-all">
              {value}
            </h3>
            <p className="text-[11px] lg:text-[13px] text-muted-foreground/70 mt-1.5 lg:mt-2 font-medium line-clamp-1">{label}</p>
          </>
        )}
      </div>

      {/* Icon — decorative, bottom-right */}
      <div className="absolute bottom-4 right-4 opacity-[0.18] group-hover:opacity-[0.30] transition-opacity duration-200">
        {icon}
      </div>
    </div>
  );
}
