'use client';

import { useEffect, useState } from 'react';
import { Send, Bell } from 'lucide-react';
import Link from 'next/link';
import { getChannelHealth, type ChannelHealth } from '@/app/(master)/dashboard/actions';
import { pluralUk } from '@/lib/utils/pluralUk';

function pct(count: number, total: number) {
  if (total === 0) return 0;
  return Math.round((count / total) * 100);
}

export function ChannelHealthWidget() {
  const [data, setData] = useState<ChannelHealth | null>(null);

  useEffect(() => {
    getChannelHealth().then(setData);
  }, []);

  const tgPct  = data ? pct(data.tg,   data.total) : 0;
  const pshPct = data ? pct(data.push, data.total) : 0;
  const showCta = data && data.total > 0 && (tgPct < 60 || pshPct < 40);

  return (
    <div className="flex flex-col">
      <div className="flex items-baseline justify-between mb-3" style={{ borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
        <p className="text-[10px] font-bold tracking-[0.22em] uppercase text-[var(--text-tertiary)]">
          Канали клієнтів
        </p>
        {data && data.total > 0 && (
          <span className="text-[11px] text-[var(--text-tertiary)]">
            {data.total} {pluralUk(data.total, 'клієнт', 'клієнти', 'клієнтів')}
          </span>
        )}
      </div>

      {!data && (
        <div className="flex flex-col gap-2">
          <div className="skeleton-shimmer h-5 rounded-full" />
          <div className="skeleton-shimmer h-5 rounded-full" />
        </div>
      )}

      {data && data.total === 0 && (
        <p className="text-[13px] tracking-[0.04em] uppercase text-[var(--text-tertiary)]">
          Немає записів за 90 днів
        </p>
      )}

      {data && data.total > 0 && (
        <div className="flex flex-col">
          <div className="flex items-center justify-between py-2.5" style={{ borderBottom: '1px solid var(--border)' }}>
            <div className="flex items-center gap-2">
              <span style={{ color: 'var(--text-tertiary)' }}><Send size={11} strokeWidth={1.8} /></span>
              <span className="text-[13px] tracking-[0.04em]" style={{ color: 'var(--text-secondary)' }}>
                Telegram
              </span>
            </div>
            <span
              className="metric-value text-[1.1rem] font-bold tabular-nums"
              style={{ color: tgPct >= 60 ? 'var(--success)' : 'var(--text-primary)' }}
            >
              {tgPct}%
            </span>
          </div>

          <div className="flex items-center justify-between py-2.5">
            <div className="flex items-center gap-2">
              <span style={{ color: 'var(--text-tertiary)' }}><Bell size={11} strokeWidth={1.8} /></span>
              <span className="text-[13px] tracking-[0.04em]" style={{ color: 'var(--text-secondary)' }}>
                Push
              </span>
            </div>
            <span
              className="metric-value text-[1.1rem] font-bold tabular-nums"
              style={{ color: pshPct >= 40 ? 'var(--success)' : 'var(--text-primary)' }}
            >
              {pshPct}%
            </span>
          </div>
        </div>
      )}

      {showCta && (
        <Link
          href="/dashboard/clients"
          className="mt-3 text-[11px] font-bold tracking-[0.12em] uppercase transition-opacity duration-150 hover:opacity-70"
          style={{ color: 'var(--accent)' }}
        >
          Залучити клієнтів
        </Link>
      )}
    </div>
  );
}
