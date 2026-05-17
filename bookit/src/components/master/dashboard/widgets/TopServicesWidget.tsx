'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { uk } from 'date-fns/locale';
import { useBookings } from '@/lib/supabase/hooks/useBookings';
import { getNow } from '@/lib/utils/now';

function toISO(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

const RANK_COLORS = ['var(--accent)', 'var(--text-secondary)', 'var(--text-tertiary)'];

export function TopServicesWidget() {
  const now  = getNow();
  const from = toISO(startOfMonth(now));
  const to   = toISO(endOfMonth(now));
  const { bookings, isLoading } = useBookings(from, to);

  const top = useMemo(() => {
    if (!bookings) return [];
    const map = new Map<string, { count: number }>();
    bookings.forEach(b => {
      if (b.status === 'cancelled') return;
      const name = b.services[0]?.name;
      if (!name) return;
      const prev = map.get(name) ?? { count: 0 };
      map.set(name, { count: prev.count + 1 });
    });
    return Array.from(map.entries())
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);
  }, [bookings]);

  const monthLabel = format(now, 'LLLL', { locale: uk });
  const maxCount   = top[0]?.count ?? 1;

  return (
    <div className="bento-card overflow-hidden">
      <div className="px-5 pt-5 pb-1">
        <p className="dash-eyebrow">
          Топ послуги · {monthLabel}
        </p>
      </div>

      {isLoading ? (
        <div className="flex flex-col px-5 pb-5 pt-3.5 gap-3.5">
          {[68, 50, 38].map((w, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="skeleton-shimmer rounded" style={{ height: 22, width: 20 }} />
              <div className="flex-1 flex flex-col gap-1.5">
                <div className="skeleton-shimmer rounded" style={{ height: 12, width: `${w}%` }} />
                <div className="skeleton-shimmer rounded" style={{ height: 3, width: `${w}%` }} />
              </div>
              <div className="skeleton-shimmer rounded" style={{ height: 16, width: 24 }} />
            </div>
          ))}
        </div>
      ) : top.length === 0 ? (
        <p
          style={{
            fontSize: '12px',
            color: 'var(--text-tertiary)',
            padding: '12px 20px 20px',
          }}
        >
          Даних за цей місяць ще немає
        </p>
      ) : (
        <div className="flex flex-col pt-2 pb-4">
          {top.map((svc, i) => {
            const barPct = Math.round((svc.count / maxCount) * 100);
            return (
              <motion.div
                key={svc.name}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ type: 'spring', stiffness: 220, damping: 32, delay: i * 0.08 }}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '24px 1fr auto',
                  gap: '10px',
                  padding: '10px 20px',
                  borderBottom: i < top.length - 1 ? '0.5px solid var(--border)' : 'none',
                  alignItems: 'center',
                }}
              >
                {/* Rank number */}
                <span
                  className="sidebar-rank-number"
                  style={{ color: RANK_COLORS[i] ?? 'var(--text-tertiary)' }}
                >
                  {i + 1}
                </span>

                {/* Name + mini bar */}
                <div className="min-w-0">
                  <p
                    className="font-service truncate"
                    style={{ fontSize: '12px', fontWeight: 400, color: 'var(--text-primary)', marginBottom: 4 }}
                  >
                    {svc.name}
                  </p>
                  <div className="progress-line" style={{ height: '2px' }}>
                    <motion.div
                      style={{
                        height: '100%',
                        borderRadius: '999px',
                        background: RANK_COLORS[i] ?? 'var(--border-strong)',
                        opacity: i === 0 ? 1 : 0.55,
                      }}
                      initial={{ width: 0 }}
                      animate={{ width: `${barPct}%` }}
                      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: i * 0.1 + 0.15 }}
                    />
                  </div>
                </div>

                {/* Count */}
                <p
                  style={{
                    fontFamily: 'var(--font-cormorant, Georgia, serif)',
                    fontSize: '1rem',
                    fontWeight: 500,
                    color: 'var(--text-secondary)',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {svc.count}×
                </p>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
