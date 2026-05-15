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
        title="Завантаженість"
        value={`${Math.round(stats.occupancyRate)}%`}
        label="робочого часу"
        icon={<Clock className="text-primary" size={18} />}
        delay={0.1}
        isLoading={isLoading}
        color="primary"
      />

      {/* 2. Forecast Revenue */}
      <WidgetCard
        title="Прогноз"
        value={`${stats.forecastRevenue.toLocaleString('uk-UA')} ₴`}
        label="очікувано"
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
        label={stats.lostMinutes > 0 ? `-${stats.lostMinutes} хв через скасування` : 'Без втрат часу'}
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
      <div className="flex justify-between items-start mb-4 lg:mb-6">
        <p className="flex-1 min-w-0 pr-2 text-[10px] lg:text-[11px] font-black text-muted-foreground/40 uppercase tracking-[0.2em] leading-tight">{title}</p>
        <div className="shrink-0 p-2 lg:p-3 rounded-2xl bg-white/60 border border-white/40 shadow-sm group-hover:scale-110 transition-transform duration-500">
          {icon}
        </div>
      </div>

      <div className="min-h-[58px] lg:min-h-[66px] flex flex-col justify-end">
        {isLoading ? (
          <div className="space-y-1.5 lg:space-y-2">
            <div className="h-9 lg:h-10 w-24 bg-muted/20 animate-pulse rounded-lg" />
            <div className="h-4 w-16 bg-muted/10 animate-pulse rounded-md" />
          </div>
        ) : (
          <>
            <h3 className="heading-serif text-3xl lg:text-4xl text-foreground leading-tight font-black transition-all">
              {value}
            </h3>
            <p className="text-[11px] lg:text-[13px] text-muted-foreground/50 mt-1.5 lg:mt-2 font-medium line-clamp-1">{label}</p>
          </>
        )}
      </div>

      {/* Subtle Background Glow */}
      <div className={`absolute -right-4 -bottom-4 w-16 h-16 rounded-full blur-2xl opacity-10
        ${color === 'primary' ? 'bg-primary' : color === 'success' ? 'bg-success' : color === 'warning' ? 'bg-warning' : 'bg-sage'}
      `} />
    </div>
  );
}
