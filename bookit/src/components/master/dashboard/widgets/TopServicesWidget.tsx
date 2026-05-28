'use client';

import { useMemo } from 'react';
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
    <div className="bento-card p-5">
      <p className="widget-heading mb-4">
        Топ послуги · {monthLabel}
      </p>

      {isLoading ? (
        <div className="space-y-3">
          {[0, 1, 2].map(i => (
            <div key={i} className="skeleton-shimmer h-6 rounded-full" />
          ))}
        </div>
      ) : top.length === 0 ? (
        <p className="text-[14px] italic" style={{ color: 'var(--text-tertiary)' }}>
          Даних за цей місяць ще немає
        </p>
      ) : (
        <div className="space-y-1">
          {top.map((svc, i) => {
            const isFirst = i === 0;
            return (
              <div
                key={svc.name}
                className="flex items-center gap-3 -mx-2 px-2 py-2 rounded-lg cursor-pointer hover:bg-[var(--border)] transition-colors duration-150"
              >
                {/* Rank number */}
                <span
                  className="metric-value text-[14px] font-bold w-4 text-right flex-shrink-0"
                  style={{ color: isFirst ? 'var(--accent)' : 'var(--text-tertiary)' }}
                >
                  {i + 1}
                </span>

                {/* Service name */}
                <div
                  className={`flex-1 min-w-0 pl-3 ${isFirst ? 'border-l-2' : 'border-l'}`}
                  style={{ borderColor: isFirst ? 'var(--accent)' : 'var(--border-strong)' }}
                >
                  <p
                    className="font-service truncate"
                    style={{
                      color: 'var(--text-primary)',
                      fontSize: isFirst ? '16px' : '14px',
                    }}
                  >
                    {svc.name}
                  </p>
                </div>

                {/* Count */}
                <span
                  className="metric-value text-[14px] font-bold flex-shrink-0"
                  style={{ color: isFirst ? 'var(--text-secondary)' : 'var(--text-tertiary)' }}
                >
                  {svc.count}×
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
