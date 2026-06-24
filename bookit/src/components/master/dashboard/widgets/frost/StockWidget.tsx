'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FlaskConical, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { useProducts } from '@/lib/supabase/hooks/useProducts';
import { RestockDrawer } from '@/components/master/products/RestockDrawer';
import type { Product } from '@/types/database';

// humanized
const UNIT_LABEL: Record<'pcs' | 'ml' | 'g', string> = { pcs: 'шт', ml: 'мл', g: 'г' };

export function StockWidget() {
  const { products, isLoading } = useProducts();
  const [restocking, setRestocking] = useState<Product | null>(null);

  const consumables = products.filter(p => p.product_type === 'consumable' && p.is_active);
  const critical = consumables.filter(
    p => p.stock_alert_threshold != null && p.stock_qty <= p.stock_alert_threshold,
  );
  const items = critical.length > 0 ? critical : consumables.slice(0, 5);

  if (isLoading || consumables.length === 0) return null;

  return (
    <>
      <div className="bento-card p-5 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span style={{ color: 'var(--text-tertiary)', display: 'flex' }}>
              <FlaskConical size={15} strokeWidth={1.8} />
            </span>
            <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>
              Склад
            </p>
          </div>
          {critical.length > 0 && (
            <span className="flex items-center gap-1 text-[10px] font-bold" style={{ color: 'var(--error)' }}>
              <AlertTriangle size={11} strokeWidth={2} />
              {critical.length} мало
            </span>
          )}
        </div>

        <div className="flex flex-col gap-2.5">
          {items.map(p => {
            const isCritical = p.stock_alert_threshold != null && p.stock_qty <= p.stock_alert_threshold;
            const maxForBar = p.stock_alert_threshold ? p.stock_alert_threshold * 3 : p.stock_qty || 1;
            const pct = Math.min(100, Math.round((p.stock_qty / maxForBar) * 100));
            const unit = (p.unit ?? 'pcs') as 'pcs' | 'ml' | 'g';

            return (
              <div key={p.id} className="flex flex-col gap-1 group">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium truncate" style={{ color: 'var(--text-primary)' }}>{p.name}</span>
                  <div className="flex items-center gap-2 shrink-0 ml-2">
                    <span
                      className="font-bold tabular-nums"
                      style={{ color: isCritical ? 'var(--error)' : 'var(--text-tertiary)' }}
                    >
                      {p.stock_qty} {UNIT_LABEL[unit]}
                    </span>
                    <AnimatePresence>
                      <motion.button
                        type="button"
                        aria-label={`Поповнити ${p.name}`}
                        onClick={() => setRestocking(p)}
                        className="px-2 py-1 rounded-full text-[10px] font-bold opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity duration-150 active:scale-[0.90] md:block hidden"
                        style={{ background: 'var(--accent)', color: 'var(--accent-on)' }}
                      >
                        Поповнити
                      </motion.button>
                      {/* Always visible on mobile */}
                      <button
                        type="button"
                        aria-label={`Поповнити ${p.name}`}
                        onClick={() => setRestocking(p)}
                        className="px-3 py-2 rounded-full text-[11px] font-bold active:scale-[0.90] transition-transform md:hidden"
                        style={{ background: 'var(--accent)', color: 'var(--accent-on)' }}
                      >
                        +
                      </button>
                    </AnimatePresence>
                  </div>
                </div>
                {p.stock_alert_threshold != null && (
                  <div className="h-1 w-full rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${pct}%`,
                        background: isCritical
                          ? 'var(--error)'
                          : 'color-mix(in srgb, var(--accent) 45%, transparent)',
                      }}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <Link
          href="/dashboard/products?tab=consumables"
          className="text-[10px] font-semibold self-start transition-opacity hover:opacity-70"
          style={{ color: 'var(--accent)' }}
        >
          Всі розхідники
        </Link>
      </div>

      {restocking && (
        <RestockDrawer
          product={restocking}
          open={true}
          onClose={() => setRestocking(null)}
        />
      )}
    </>
  );
}
