'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowUp, ArrowDown, Minus, Send, Zap, CalendarX, ChevronRight } from 'lucide-react';
import { useCancellationRate, type CancelledEntry } from '../shared/hooks/useCancellationRate';
import { Sheet } from '@/components/ui/Sheet';
import { timeAgo } from '@/lib/utils/dates';
import { pluralUk } from '@/lib/utils/pluralUk';

const CANCEL_ACTIONS = [
  { href: '/dashboard/marketing',                   label: 'Розсилка',   Icon: Send, primary: false },
  { href: '/dashboard/revenue?drawer=flash_deals',  label: 'Пропозиція', Icon: Zap,  primary: true  },
] as const;

function CancelledRow({ entry }: { entry: CancelledEntry }) {
  const when = entry.when ?? entry.bookingDate;
  return (
    <div className="flex items-center gap-3 py-3" style={{ borderBottom: '1px solid color-mix(in srgb, var(--accent) 8%, transparent)' }}>
      <span
        className="flex items-center justify-center size-10 rounded-full flex-shrink-0"
        style={{ background: 'color-mix(in srgb, var(--error) 10%, transparent)', color: 'var(--error)' }}
      >
        <CalendarX size={18} strokeWidth={1.8} />
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-[14px] font-semibold text-[var(--text-primary)] truncate">{entry.clientName}</p>
        {entry.service && (
          <p className="text-[12px] text-[var(--text-tertiary)] truncate">{entry.service}</p>
        )}
      </div>
      <div className="flex flex-col items-end flex-shrink-0 text-right">
        <span className="text-[12px] text-[var(--text-secondary)]">{timeAgo(when)}</span>
        <span className="text-[11px] text-[var(--text-tertiary)]">
          {entry.by === 'client' ? 'Скасував клієнт' : 'Скасували ви'}
        </span>
      </div>
    </div>
  );
}

export function CancellationRateWidget() {
  const { thisRate, delta, improved, cancelledList, isLoading } = useCancellationRate();
  const [open, setOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="bento-card p-4">
        <div className="skeleton-shimmer h-4 w-24 rounded-full mb-2" />
        <div className="skeleton-shimmer h-10 w-16 rounded-xl" />
      </div>
    );
  }

  const count = cancelledList.length;
  const hint = count > 0
    ? `${count} ${pluralUk(count, 'скасування', 'скасування', 'скасувань')}`
    : 'цього тижня';

  return (
    <div className="bento-card p-4 flex flex-col">
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-haspopup="dialog"
          aria-expanded={open}
          aria-label="Деталі скасувань цього тижня"
          className="flex-1 min-w-0 text-left rounded-xl -m-1 p-1 transition-colors active:bg-[color-mix(in_srgb,var(--accent)_6%,transparent)]"
        >
          <p className="text-[10px] font-bold tracking-[0.16em] uppercase text-[var(--text-tertiary)] mb-1.5">
            Скасування
          </p>
          <p className="metric-value text-[2rem] font-bold leading-tight text-[var(--text-primary)]">
            {thisRate !== null ? `${thisRate}%` : '—'}
          </p>
          <p className="text-[11px] text-[var(--text-tertiary)] mt-1 flex items-center gap-1">
            {hint}
            <ChevronRight size={12} className="opacity-60" />
          </p>
        </button>

        {delta !== null && (
          <div
            className="flex flex-col items-center justify-center w-[48px] h-[48px] rounded-xl text-[11px] font-bold flex-shrink-0"
            style={{
              background: improved
                ? 'color-mix(in srgb, var(--success) 12%, transparent)'
                : delta === 0
                ? 'var(--border)'
                : 'color-mix(in srgb, var(--error) 12%, transparent)',
              color: improved ? 'var(--success)' : delta === 0 ? 'var(--text-tertiary)' : 'var(--error)',
              border: '1px solid color-mix(in srgb, var(--accent) 8%, transparent)',
            }}
          >
            {improved ? <ArrowDown size={14} strokeWidth={2.5} /> : delta === 0 ? <Minus size={14} /> : <ArrowUp size={14} strokeWidth={2.5} />}
            <span className="mt-0.5">{Math.abs(delta)}%</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2 pt-3 mt-auto" style={{ borderTop: '1px solid color-mix(in srgb, var(--accent) 10%, transparent)' }}>
        {CANCEL_ACTIONS.map(({ href, label, Icon, primary }) => (
          <Link
            key={href}
            href={href}
            className="flex items-center justify-center gap-2 h-12 rounded-[14px] font-semibold text-[13px] transition-all duration-150 active:scale-[0.96]"
            style={primary
              ? { background: 'var(--accent)', color: 'var(--accent-on)', boxShadow: '0 3px 10px color-mix(in srgb, var(--accent) 22%, transparent)' }
              : { background: 'color-mix(in srgb, var(--accent) 10%, var(--surface))', border: '1px solid color-mix(in srgb, var(--accent) 15%, transparent)', color: 'var(--text-primary)' }
            }
          >
            <Icon size={15} strokeWidth={1.8} />
            {label}
          </Link>
        ))}
      </div>

      <Sheet open={open} onOpenChange={setOpen} variant="adaptive" title="Скасування цього тижня" maxWidth="md">
        {count > 0 ? (
          <div className="flex flex-col">
            {cancelledList.map(entry => (
              <CancelledRow key={entry.id} entry={entry} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center text-center py-10">
            <span
              className="flex items-center justify-center size-14 rounded-full mb-4"
              style={{ background: 'color-mix(in srgb, var(--accent) 8%, transparent)', color: 'var(--text-tertiary)' }}
            >
              <CalendarX size={26} strokeWidth={1.6} />
            </span>
            <p className="text-[15px] font-semibold text-[var(--text-primary)]">Цього тижня скасувань немає</p>
            <p className="text-[13px] text-[var(--text-tertiary)] mt-1 max-w-[260px]">
              Коли запис скасують, тут буде видно хто і коли.
            </p>
          </div>
        )}
      </Sheet>
    </div>
  );
}
