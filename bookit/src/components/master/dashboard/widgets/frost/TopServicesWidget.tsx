'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { Scissors, Tag, Zap } from 'lucide-react';
import { format, startOfMonth, endOfMonth } from 'date-fns';

const SVC_ACTIONS = [
  { href: '/dashboard/services', label: 'Послуги', Icon: Scissors, primary: false },
  { href: '/dashboard/pricing',  label: 'Прайс',   Icon: Tag,      primary: false },
  { href: '/dashboard/flash',    label: 'Промо',   Icon: Zap,      primary: true  },
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

  const maxCount = top[0]?.count ?? 1;

  return (
    <div className="bento-card p-4 flex flex-col">
      <p className="text-[10px] font-bold tracking-[0.16em] uppercase text-[var(--text-tertiary)] mb-3">
        Топ послуги · {monthLabel}
      </p>

      {isLoading ? (
        <div className="space-y-2">
          {[0, 1, 2].map(i => <div key={i} className="skeleton-shimmer h-8 rounded-lg" />)}
        </div>
      ) : top.length === 0 ? (
        <div className="flex items-center gap-2 py-1" style={{ color: 'var(--text-tertiary)' }}>
          <Scissors size={14} strokeWidth={1.6} />
          <span className="text-[12px]">Немає даних цього місяця</span>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {top.map((svc, i) => {
            const barW = Math.round((svc.count / maxCount) * 100);
            return (
              <div key={svc.name}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className="font-mono text-[11px] font-bold tabular-nums flex-shrink-0"
                      style={{ color: i === 0 ? 'var(--accent)' : 'var(--text-tertiary)' }}
                    >
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <p className="text-[13px] truncate" style={{ color: 'var(--text-primary)', fontWeight: i === 0 ? 600 : 400 }}>
                      {svc.name}
                    </p>
                  </div>
                  <span className="metric-value text-[13px] font-bold flex-shrink-0 ml-2"
                    style={{ color: 'var(--text-primary)' }}>
                    {svc.count}×
                  </span>
                </div>
                {/* Relative bar */}
                <div className="h-[3px] rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width:      `${barW}%`,
                      background: i === 0 ? 'var(--accent)' : 'var(--border-strong)',
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="grid grid-cols-3 gap-2 pt-3 mt-auto" style={{ borderTop: '1px solid color-mix(in srgb, var(--accent) 10%, transparent)' }}>
        {SVC_ACTIONS.map(({ href, label, Icon, primary }) => (
          <Link
            key={href}
            href={href}
            className="flex items-center justify-center gap-1.5 h-11 rounded-[14px] font-semibold text-[12px] transition-all duration-150 active:scale-[0.96]"
            style={primary
              ? { background: 'var(--accent)', color: 'var(--accent-on)', boxShadow: '0 3px 10px color-mix(in srgb, var(--accent) 22%, transparent)' }
              : { background: 'color-mix(in srgb, var(--accent) 10%, var(--surface))', border: '1px solid color-mix(in srgb, var(--accent) 15%, transparent)', color: 'var(--text-primary)' }
            }
          >
            <Icon size={13} strokeWidth={1.8} />
            {label}
          </Link>
        ))}
      </div>
    </div>
  );
}
