'use client';

import React from 'react';
import { cn } from '@/lib/utils/cn';
import { TrendingUp, TrendingDown, Minus, BarChart2, ShoppingBag, DollarSign, Users } from 'lucide-react';
import { formatPrice } from '@/components/master/services/types';

interface KpiPillProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  delta?: number | null;
  onClick?: () => void;
}

function KpiPill({ icon, label, value, delta, onClick }: KpiPillProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-3.5 px-5 py-3.5 rounded-[20px] bg-surface/60 backdrop-blur-md hover:bg-surface/80 hover:shadow-[0_8px_24px_rgb(0,0,0,0.06)] border border-white/30 text-left active:scale-[0.95] duration-200 transition-all flex-shrink-0 cursor-pointer shadow-sm select-none relative overflow-hidden group min-w-[140px]"
    >
      {/* М'який підсвітка на ховер */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
      
      <div className="size-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20 shadow-inner group-hover:scale-105 transition-transform duration-300 flex-shrink-0 relative z-10">
        {icon}
      </div>
      <div className="relative z-10">
        <div className="flex items-baseline gap-1.5 leading-none mb-1">
          <p className="metric-value text-xl font-bold text-foreground tracking-tight drop-shadow-sm">{value}</p>
          {delta !== undefined && delta !== null && (
            <span
              className={cn(
                'inline-flex items-center text-[10px] font-bold leading-none',
                delta > 0 && 'text-success',
                delta < 0 && 'text-destructive',
                delta === 0 && 'text-muted-foreground/60'
              )}
            >
              {delta > 0 ? '+' : ''}
              {delta}%
            </span>
          )}
        </div>
        <span className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-wider block">
          {label}
        </span>
      </div>
    </button>
  );
}

export interface KpiTickerProps {
  bookings: number;
  orders: number;
  revenue: number; // у гривнях
  activeClients: number;
  deltas?: {
    bookings?: number | null;
    orders?: number | null;
    revenue?: number | null;
    clients?: number | null;
  };
}

export function KpiTicker({
  bookings,
  orders,
  revenue,
  activeClients,
  deltas = {},
}: KpiTickerProps) {
  return (
    <div className="w-full overflow-x-auto scrollbar-hide -mx-5 px-5 py-1">
      <div className="flex gap-3 w-max">
        <KpiPill
          icon={<DollarSign size={16} />}
          label="Виручка"
          value={formatPrice(Math.round(revenue))}
          delta={deltas.revenue}
        />
        <KpiPill
          icon={<BarChart2 size={16} />}
          label="Записів"
          value={bookings}
          delta={deltas.bookings}
        />
        <KpiPill
          icon={<ShoppingBag size={16} />}
          label="Замовлень"
          value={orders}
          delta={deltas.orders}
        />
        <KpiPill
          icon={<Users size={16} />}
          label="Клієнтів"
          value={activeClients}
          delta={deltas.clients}
        />
      </div>
    </div>
  );
}
