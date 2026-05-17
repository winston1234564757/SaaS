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

  return (
    <div className="bento-card overflow-hidden">
      <div className="px-5 pt-4 pb-0">
        <p
          className="text-[9px] font-bold uppercase tracking-[0.22em]"
          style={{ color: 'var(--text-tertiary)' }}
        >
          Топ послуги · {monthLabel}
        </p>
      </div>

      {isLoading ? (
        <div className="flex flex-col px-5 pb-4 pt-3 gap-3">
          {[68, 50, 38].map((w, i) => (
            <div key={i} className="flex justify-between items-center">
              <div className="skeleton-shimmer rounded" style={{ height: 13, width: `${w}%` }} />
              <div className="skeleton-shimmer rounded" style={{ height: 13, width: 24 }} />
            </div>
          ))}
        </div>
      ) : top.length === 0 ? (
        <p className="text-xs px-5 py-4 pt-2" style={{ color: 'var(--text-tertiary)' }}>
          Даних за цей місяць ще немає
        </p>
      ) : (
        <div className="flex flex-col pt-1 pb-2">
          {top.map((svc, i) => (
            <motion.div
              key={svc.name}
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ type: 'spring', stiffness: 200, damping: 32, delay: i * 0.07 }}
              style={{
                display: 'grid',
                gridTemplateColumns: '20px 1fr auto',
                gap: '10px',
                padding: '10px 20px',
                borderBottom: i < top.length - 1 ? '0.5px solid var(--border)' : 'none',
                alignItems: 'center',
              }}
            >
              <span
                style={{
                  fontFamily: 'var(--font-cormorant, Georgia, serif)',
                  fontSize: '1.05rem',
                  fontWeight: 600,
                  color: i === 0 ? 'var(--accent)' : 'var(--text-tertiary)',
                  lineHeight: 1,
                }}
              >
                {i + 1}
              </span>
              <p
                className="text-[12px] font-medium truncate"
                style={{ color: 'var(--text-primary)' }}
              >
                {svc.name}
              </p>
              <p
                style={{
                  fontFamily: 'var(--font-cormorant, Georgia, serif)',
                  fontSize: '0.95rem',
                  fontWeight: 500,
                  color: 'var(--text-secondary)',
                  whiteSpace: 'nowrap',
                }}
              >
                {svc.count}×
              </p>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
