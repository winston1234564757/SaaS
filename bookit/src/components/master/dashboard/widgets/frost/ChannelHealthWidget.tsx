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
    <div className="bento-card p-4">
      <div className="mb-3">
        <p className="text-[10px] font-bold tracking-[0.16em] uppercase text-[var(--text-tertiary)]">
          Канали клієнтів
        </p>
        {data && data.total > 0 && (
          <p className="text-[12px] text-[var(--text-tertiary)] mt-0.5">
            {data.total} {pluralUk(data.total, 'клієнт', 'клієнти', 'клієнтів')} за 90 днів
          </p>
        )}
      </div>

      {!data && (
        <div className="space-y-2">
          <div className="skeleton-shimmer h-[36px] rounded-xl" />
          <div className="skeleton-shimmer h-[36px] rounded-xl" />
        </div>
      )}

      {data && data.total === 0 && (
        <div className="flex items-center gap-2 py-1" style={{ color: 'var(--text-tertiary)' }}>
          <Send size={14} strokeWidth={1.6} />
          <span className="text-[12px]">Немає клієнтів за 90 днів</span>
        </div>
      )}

      {data && data.total > 0 && (
        <div className="space-y-2.5">
          {[
            { Icon: Send, label: 'Telegram', value: tgPct, healthy: tgPct >= 60 },
            { Icon: Bell, label: 'Push', value: pshPct, healthy: pshPct >= 40 },
          ].map(({ Icon, label, value, healthy }) => (
            <div key={label}
              className="flex items-center justify-between px-3 py-2.5 rounded-xl"
              style={{ border: '1px solid color-mix(in srgb, var(--accent) 10%, transparent)', background: 'var(--surface)' }}>
              <div className="flex items-center gap-2">
                <span style={{ color: 'var(--text-tertiary)' }}><Icon size={11} strokeWidth={1.8} /></span>
                <span className="text-[13px] font-medium" style={{ color: 'var(--text-primary)' }}>{label}</span>
              </div>
              <span
                className="metric-value text-[1.1rem] font-bold tabular-nums"
                style={{ color: healthy ? 'var(--success)' : 'var(--text-primary)' }}
              >
                {value}%
              </span>
            </div>
          ))}
        </div>
      )}

      {showCta && (
        <Link
          href="/dashboard/clients"
          className="mt-3 flex items-center justify-between py-2 px-3 rounded-xl text-[12px] font-medium group"
          style={{ background: 'var(--border)', color: 'var(--text-primary)' }}
        >
          Як залучити більше клієнтів?
        </Link>
      )}
    </div>
  );
}
