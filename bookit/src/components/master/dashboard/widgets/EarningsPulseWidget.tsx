'use client';

import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { useDashboardStats } from '@/lib/supabase/hooks/useDashboardStats';
import { formatCurrency } from '@/lib/utils/currency';
import { pluralUk } from '@/lib/utils/pluralUk';

function TrendBadge({ today, prev }: { today: number; prev: number }) {
  if (prev === 0 && today === 0) return null;

  if (prev === 0) {
    return (
      <span
        className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full"
        style={{ background: 'color-mix(in srgb, var(--success) 14%, transparent)', color: 'var(--success)' }}
      >
        <TrendingUp size={11} />
        Перший запис!
      </span>
    );
  }

  const diff = Math.round(((today - prev) / prev) * 100);
  const isUp = diff >= 0;

  return (
    <span
      className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full"
      style={{
        background: isUp
          ? 'color-mix(in srgb, var(--success) 14%, transparent)'
          : 'color-mix(in srgb, var(--error) 12%, transparent)',
        color: isUp ? 'var(--success)' : 'var(--error)',
      }}
    >
      {diff === 0
        ? <><Minus size={11} /> як вчора</>
        : isUp
          ? <><TrendingUp size={11} /> +{diff}%</>
          : <><TrendingDown size={11} /> {diff}%</>
      }
    </span>
  );
}

export function EarningsPulseWidget() {
  const stats = useDashboardStats();

  const todayUah = stats.todayRevenue / 100;
  const prevUah  = stats.prevDayRevenue / 100;
  const count    = stats.todayCount;
  const completed = stats.todayCompleted;

  return (
    <div className="bento-card p-5 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-widest mb-1" style={{ color: 'var(--text-tertiary)' }}>
            Сьогодні
          </p>
          <motion.p
            key={todayUah}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring' as const, stiffness: 300, damping: 24 }}
            className="metric-value text-[28px] leading-none"
            style={{ color: 'var(--text-primary)' }}
          >
            {formatCurrency(todayUah)}
          </motion.p>
        </div>

        <TrendBadge today={stats.todayRevenue} prev={stats.prevDayRevenue} />
      </div>

      <div className="flex items-center gap-3 pt-1">
        <span className="text-[12px]" style={{ color: 'var(--text-secondary)' }}>
          {count > 0
            ? `${count} ${pluralUk(count, 'запис', 'записи', 'записів')} · ${completed} завершено`
            : 'Ще немає записів'}
        </span>
        {prevUah > 0 && (
          <>
            <span style={{ color: 'var(--border-strong)' }}>·</span>
            <span className="text-[12px]" style={{ color: 'var(--text-tertiary)' }}>
              вчора {formatCurrency(prevUah)}
            </span>
          </>
        )}
      </div>
    </div>
  );
}
