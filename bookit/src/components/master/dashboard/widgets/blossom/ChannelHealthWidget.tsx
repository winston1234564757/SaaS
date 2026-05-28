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
      <div className="mb-4">
        <p className="text-[15px] font-semibold tracking-[0.08em] uppercase text-[var(--text-secondary)] mb-1">
          Канали клієнтів
        </p>
        {data && data.total > 0 && (
          <p className="text-[13px] text-[var(--text-tertiary)]">
            {data.total} {pluralUk(data.total, 'клієнт', 'клієнти', 'клієнтів')} за 90 днів
          </p>
        )}
      </div>

      {!data && (
        <div className="flex flex-col gap-2">
          <div className="skeleton-shimmer h-5 rounded-full" />
          <div className="skeleton-shimmer h-5 rounded-full" />
        </div>
      )}

      {data && data.total === 0 && (
        <p className="text-[14px] italic text-[var(--text-tertiary)]">
          Записів за останні 90 днів ще немає
        </p>
      )}

      {data && data.total > 0 && (
        <div className="flex flex-col">
          <div className="flex items-center justify-between py-3">
            <div className="flex items-center gap-2">
              <span style={{ color: 'var(--text-tertiary)' }}><Send size={13} strokeWidth={1.8} /></span>
              <span className="text-[16px] text-[var(--text-secondary)]">Telegram</span>
            </div>
            <span
              className="metric-value text-[1.4rem] font-semibold leading-none"
              style={{ color: tgPct >= 60 ? 'var(--success)' : 'var(--text-primary)' }}
            >
              {tgPct}%
            </span>
          </div>

          <div className="h-px" style={{ background: 'var(--border)' }} />

          <div className="flex items-center justify-between py-3">
            <div className="flex items-center gap-2">
              <span style={{ color: 'var(--text-tertiary)' }}><Bell size={13} strokeWidth={1.8} /></span>
              <span className="text-[16px] text-[var(--text-secondary)]">Push</span>
            </div>
            <span
              className="metric-value text-[1.4rem] font-semibold leading-none"
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
          className="mt-3 text-[13px] text-[var(--accent)] hover:opacity-70 transition-opacity duration-150"
        >
          Як залучити більше клієнтів?
        </Link>
      )}
    </div>
  );
}
