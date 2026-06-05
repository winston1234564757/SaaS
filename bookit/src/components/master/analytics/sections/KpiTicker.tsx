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
      className="flex items-center gap-3 px-4 py-2.5 rounded-full bg-secondary/50 hover:bg-secondary border border-border-strong text-left active:scale-[0.95] duration-100 transition-all flex-shrink-0 cursor-pointer shadow-sm select-none"
    >
      <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
        {icon}
      </div>
      <div>
        <div className="flex items-baseline gap-1.5 leading-none">
          <p className="metric-value text-2xl font-bold text-foreground !text-base">{value}</p>
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
        <span className="text-[9px] font-semibold text-muted-foreground/60 uppercase tracking-wider block mt-0.5">
          {label}
        </span>
      </div>
    </button>
  );
}

interface KpiTickerProps {
  bookings: number;
  orders: number;
  revenue: number; // в копійках
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
          value={formatPrice(Math.round(revenue / 100))}
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
