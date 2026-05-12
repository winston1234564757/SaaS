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
    <div className="grid grid-cols-2 gap-3">
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
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay, duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
      className="bento-card p-4 relative overflow-hidden group active:scale-95 transition-transform"
    >
      <div className="flex justify-between items-start mb-3">
        <p className="flex-1 min-w-0 pr-2 text-[10px] font-medium text-muted-foreground/60 uppercase tracking-widest leading-tight">{title}</p>
        <div className="shrink-0 p-1.5 rounded-xl bg-white/50 border border-white/40 shadow-sm">
          {icon}
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          <div className="h-8 w-24 bg-muted/20 animate-pulse rounded-lg" />
          <div className="h-3 w-16 bg-muted/10 animate-pulse rounded-md" />
        </div>
      ) : (
        <>
          <h3 className="heading-serif text-2xl text-foreground leading-tight">{value}</h3>
          <p className="text-[11px] text-muted-foreground/50 mt-1 line-clamp-1">{label}</p>
        </>
      )}

      {/* Subtle Background Glow */}
      <div className={`absolute -right-4 -bottom-4 w-16 h-16 rounded-full blur-2xl opacity-10 transition-opacity group-hover:opacity-20
        ${color === 'primary' ? 'bg-primary' : color === 'success' ? 'bg-success' : color === 'warning' ? 'bg-warning' : 'bg-sage'}
      `} />
    </motion.div>
  );
}
