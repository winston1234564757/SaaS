'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { Scissors, Tag, Zap } from 'lucide-react';
import { format, startOfMonth, endOfMonth } from 'date-fns';

const SVC_ACTIONS = [
  { href: '/dashboard/services', label: 'Послуги', Icon: Scissors },
  { href: '/dashboard/pricing',  label: 'Прайс',   Icon: Tag      },
  { href: '/dashboard/flash',    label: 'Промо',   Icon: Zap      },
] as const;
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
  const monthLabel = format(now, 'LLLL', { locale: uk });

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

  return (
    <div className="flex flex-col">
      {/* Table header */}
      <div className="flex items-center justify-between pb-2 mb-1"
        style={{ borderBottom: '1px solid var(--border)' }}>
        <p className="text-[10px] font-bold tracking-[0.22em] uppercase text-[var(--text-tertiary)]">
          Послуга · {monthLabel}
        </p>
        <p className="text-[10px] font-bold tracking-[0.22em] uppercase text-[var(--text-tertiary)]">
          К-сть
        </p>
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-2 pt-2">
          {[0, 1, 2].map(i => (
            <div key={i} className="skeleton-shimmer h-5 rounded-full" />
          ))}
        </div>
      ) : top.length === 0 ? (
        <p className="pt-3 text-[13px] tracking-[0.04em] uppercase" style={{ color: 'var(--text-tertiary)' }}>
          Немає даних
        </p>
      ) : (
        <div className="flex flex-col">
          {top.map((svc, i) => (
            <div
              key={svc.name}
              className="flex items-center gap-3 py-3"
              style={{ borderBottom: i < top.length - 1 ? '1px solid var(--border)' : 'none' }}
            >
              <span
                className="font-mono text-[11px] font-bold tabular-nums flex-shrink-0"
                style={{ color: i === 0 ? 'var(--accent)' : 'var(--text-tertiary)', opacity: i === 0 ? 1 : 0.5 }}
              >
                {String(i + 1).padStart(2, '0')}
              </span>
              <p
                className="flex-1 min-w-0 truncate text-[15px]"
                style={{ color: 'var(--text-primary)', fontWeight: i === 0 ? 600 : 400 }}
              >
                {svc.name}
              </p>
              <span
                className="metric-value text-[15px] font-bold flex-shrink-0"
                style={{ color: i === 0 ? 'var(--text-primary)' : 'var(--text-tertiary)' }}
              >
                {svc.count}
              </span>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-wrap gap-1.5 pt-3 mt-3" style={{ borderTop: '1px solid var(--border)' }}>
        {SVC_ACTIONS.map(({ href, label, Icon }) => (
          <Link
            key={href}
            href={href}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-full text-[12px] font-semibold transition-all duration-150 active:scale-[0.94]"
            style={{ background: 'var(--accent)', color: 'var(--accent-on)' }}
          >
            <span style={{ color: 'var(--accent-on)', display: 'flex' }}><Icon size={13} /></span>
            {label}
          </Link>
        ))}
      </div>
    </div>
  );
}
