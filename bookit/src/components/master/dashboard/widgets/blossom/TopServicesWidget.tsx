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
      <p className="text-[15px] font-semibold tracking-[0.08em] uppercase text-[var(--text-secondary)] mb-4">
        Топ послуги · {monthLabel}
      </p>

      {isLoading ? (
        <div className="flex flex-col gap-3">
          {[0, 1, 2].map(i => (
            <div key={i} className="skeleton-shimmer h-5 rounded-full" />
          ))}
        </div>
      ) : top.length === 0 ? (
        <p className="text-[14px] italic text-[var(--text-tertiary)]">
          Даних за цей місяць ще немає
        </p>
      ) : (
        <div className="flex flex-col">
          {top.map((svc, i) => (
            <div key={svc.name}>
              <div className="flex items-baseline gap-3 py-3.5">
                <span
                  style={{
                    fontFamily:    "var(--font-cormorant, 'Cormorant Garamond', Georgia, serif)",
                    fontSize:      '1.1rem',
                    fontWeight:    300,
                    color:         i === 0 ? 'var(--accent)' : 'var(--text-tertiary)',
                    letterSpacing: '0.02em',
                    lineHeight:    1,
                    minWidth:      '1.5rem',
                  }}
                >
                  {String(i + 1).padStart(2, '0')}
                </span>
                <p
                  className="font-service flex-1 min-w-0 truncate"
                  style={{
                    color:    'var(--text-primary)',
                    fontSize: i === 0 ? '17px' : '16px',
                  }}
                >
                  {svc.name}
                </p>
                <span
                  className="text-[14px] font-medium flex-shrink-0"
                  style={{ color: i === 0 ? 'var(--text-secondary)' : 'var(--text-tertiary)' }}
                >
                  {svc.count}×
                </span>
              </div>
              {i < top.length - 1 && (
                <div className="h-px w-full" style={{ background: 'var(--border)' }} />
              )}
            </div>
          ))}
        </div>
      )}

      <div className="pt-4 mt-3" style={{ borderTop: '1px solid var(--border)' }}>
        <div className="grid grid-cols-2 gap-2">
          {SVC_ACTIONS.slice(0, 2).map(({ href, label, Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-full text-[13px] font-semibold transition-all duration-150 active:scale-[0.95]"
              style={{ background: 'var(--hero-card-bg)', color: 'var(--accent-on)' }}
            >
              <span style={{ color: 'var(--accent-on)', display: 'flex' }}><Icon size={14} /></span>
              {label}
            </Link>
          ))}
        </div>
        {SVC_ACTIONS.slice(2).map(({ href, label, Icon }) => (
          <div key={href} className="flex justify-center mt-2">
            <Link
              href={href}
              className="flex items-center justify-center gap-1.5 px-6 py-2.5 rounded-full text-[13px] font-semibold transition-all duration-150 active:scale-[0.95]"
              style={{ background: 'var(--hero-card-bg)', color: 'var(--accent-on)' }}
            >
              <span style={{ color: 'var(--accent-on)', display: 'flex' }}><Icon size={14} /></span>
              {label}
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
