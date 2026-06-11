'use client';

import Link from 'next/link';
import { Zap, Sparkles, FileText, Send } from 'lucide-react';
import { useNextFreeDays } from '../shared/hooks/useNextFreeDays';

const DAY_ACTIONS = [
  { href: '/dashboard/revenue?drawer=flash_deals', label: 'Flash',    Icon: Zap,      primary: true  },
  { href: '/dashboard/marketing?mode=free_slots',  label: 'Сторіс',   Icon: Sparkles, primary: true  },
  { href: '/dashboard/marketing?mode=templates',   label: 'Шаблони',  Icon: FileText, primary: false },
  { href: '/dashboard/marketing',                  label: 'Розсилки', Icon: Send,     primary: false },
] as const;

const pillStyle = {
  borderRadius: '8px',
  border:       '1px solid color-mix(in srgb, var(--accent) 15%, transparent)',
  background:   'var(--surface)',
} as const;

interface NextFreeDaysWidgetProps {
  onDayClick?: (date: string) => void;
}

export function NextFreeDaysWidget({ onDayClick }: NextFreeDaysWidgetProps) {
  const { freeDays, isLoading } = useNextFreeDays();

  if (!isLoading && freeDays.length === 0) return null;

  return (
    <div className="bento-card p-4 flex flex-col">
      <p className="text-[10px] font-bold tracking-[0.16em] uppercase text-[var(--text-tertiary)] mb-3">
        Вільні дні
      </p>

      {isLoading ? (
        <div className="flex gap-1.5">
          {[0, 1, 2, 3].map(i => <div key={i} className="skeleton-shimmer size-12 rounded-lg flex-shrink-0" />)}
        </div>
      ) : (
        <div className="flex gap-2">
          {freeDays.map(({ iso, dayLabel, dateLabel }) => {
            const inner = (
              <>
                <span className="text-[9px] font-bold tracking-[0.1em] uppercase" style={{ color: 'var(--text-tertiary)' }}>
                  {dayLabel}
                </span>
                <span className="metric-value text-[13px] font-bold tabular-nums" style={{ color: 'var(--text-primary)' }}>
                  {dateLabel.split(' ')[0]}
                </span>
                <span className="text-[9px]" style={{ color: 'var(--text-tertiary)' }}>
                  {dateLabel.split(' ')[1]}
                </span>
              </>
            );

            return onDayClick ? (
              <button
                key={iso}
                type="button"
                onClick={() => onDayClick(iso)}
                aria-label={`Слоти: ${dayLabel} ${dateLabel}`}
                className="flex-1 flex flex-col items-center py-2.5 gap-[2px] transition-opacity duration-150 active:scale-[0.95] hover:opacity-70"
                style={pillStyle}
              >
                {inner}
              </button>
            ) : (
              <span
                key={iso}
                className="flex-1 flex flex-col items-center py-2.5 gap-[2px]"
                style={pillStyle}
              >
                {inner}
              </span>
            );
          })}
        </div>
      )}

      <div className="grid grid-cols-2 gap-2 pt-3 mt-auto" style={{ borderTop: '1px solid color-mix(in srgb, var(--accent) 10%, transparent)' }}>
        {DAY_ACTIONS.map(({ href, label, Icon, primary }) => (
          <Link
            key={href}
            href={href}
            className="flex items-center justify-center gap-2 h-11 rounded-[14px] font-semibold text-[12px] transition-colors duration-150 active:scale-[0.96]"
            style={primary
              ? { background: 'var(--accent)', color: 'var(--accent-on)', boxShadow: '0 3px 10px color-mix(in srgb, var(--accent) 22%, transparent)' }
              : { background: 'color-mix(in srgb, var(--accent) 10%, var(--surface))', border: '1px solid color-mix(in srgb, var(--accent) 15%, transparent)', color: 'var(--text-primary)' }
            }
          >
            <Icon size={14} strokeWidth={1.8} />
            {label}
          </Link>
        ))}
      </div>
    </div>
  );
}
