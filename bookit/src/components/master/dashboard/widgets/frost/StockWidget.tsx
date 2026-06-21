'use client';

import { FlaskConical, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { useProducts } from '@/lib/supabase/hooks/useProducts';

const UNIT_LABEL: Record<'pcs' | 'ml' | 'g', string> = { pcs: 'шт', ml: 'мл', g: 'г' };

export function StockWidget() {
  const { products, isLoading } = useProducts();

  const consumables = products.filter(p => p.product_type === 'consumable' && p.is_active);
  const critical = consumables.filter(
    p => p.stock_alert_threshold != null && p.stock_qty <= p.stock_alert_threshold,
  );
  const items = critical.length > 0 ? critical : consumables.slice(0, 5);

  if (isLoading || consumables.length === 0) return null;

  return (
    <div className="widget-card p-5 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FlaskConical size={15} className="text-muted-foreground" />
          <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Склад</p>
        </div>
        {critical.length > 0 && (
          <span className="flex items-center gap-1 text-[10px] font-bold text-destructive">
            <AlertTriangle size={11} />
            {critical.length} мало
          </span>
        )}
      </div>

      <div className="flex flex-col gap-2.5">
        {items.map(p => {
          const isCritical = p.stock_alert_threshold != null && p.stock_qty <= p.stock_alert_threshold;
          const maxForBar = p.stock_alert_threshold ? p.stock_alert_threshold * 3 : p.stock_qty || 1;
          const pct = Math.min(100, Math.round((p.stock_qty / maxForBar) * 100));

          return (
            <Link
              key={p.id}
              href={`/dashboard/products/${p.id}`}
              className="flex flex-col gap-1 group"
            >
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium truncate group-hover:text-primary transition-colors">{p.name}</span>
                <span className={`font-bold shrink-0 ml-2 ${isCritical ? 'text-destructive' : 'text-muted-foreground'}`}>
                  {p.stock_qty} {UNIT_LABEL[p.unit]}
                </span>
              </div>
              {p.stock_alert_threshold != null && (
                <div className="h-1 w-full rounded-full bg-secondary overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${isCritical ? 'bg-destructive' : 'bg-primary/40'}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              )}
            </Link>
          );
        })}
      </div>

      <Link
        href="/dashboard/products?tab=consumables"
        className="text-[10px] font-semibold text-primary/70 hover:text-primary transition-colors self-start"
      >
        Всі розхідники
      </Link>
    </div>
  );
}
