'use client';

import { useEffect, useState } from 'react';
import { Send, Bell, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { getChannelHealth, type ChannelHealth } from '@/app/(master)/dashboard/actions';
import { pluralUk } from '@/lib/utils/pluralUk';

function HealthBar({ pct, healthy }: { pct: number; healthy: boolean }) {
  return (
    <div
      className="h-[5px] rounded-full overflow-hidden"
      style={{ background: 'var(--border)' }}
    >
      <div
        className="h-full rounded-full transition-all duration-700"
        style={{
          width: `${pct}%`,
          background: healthy ? 'var(--success)' : 'var(--warning)',
        }}
      />
    </div>
  );
}

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
  const isEmpty = data && data.total === 0;

  return (
    <div className="bento-card p-5">
      <div className="mb-4">
        <p className="widget-heading mb-1">
          Канали клієнтів
        </p>
        {data && data.total > 0 && (
          <p className="text-[13px] mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
            {data.total} {pluralUk(data.total, 'клієнт', 'клієнти', 'клієнтів')} за 90 днів
          </p>
        )}
      </div>

      {!data && (
        <div className="space-y-2.5">
          <div className="skeleton-shimmer h-[38px] rounded-xl" />
          <div className="skeleton-shimmer h-[38px] rounded-xl" />
        </div>
      )}

      {isEmpty && (
        <p className="text-[14px] italic" style={{ color: 'var(--text-tertiary)' }}>
          Записів за останні 90 днів ще немає
        </p>
      )}

      {data && data.total > 0 && (
        <div className="space-y-3.5">
          {/* Telegram */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-1.5">
                <span style={{ color: 'var(--text-secondary)' }}><Send size={11} strokeWidth={1.8} /></span>
                <span className="text-[14px] font-medium" style={{ color: 'var(--text-primary)' }}>
                  Telegram
                </span>
              </div>
              <span
                className="metric-value text-[14px] font-bold"
                style={{ color: 'var(--text-primary)' }}
              >
                {tgPct}%
              </span>
            </div>
            <HealthBar pct={tgPct} healthy={tgPct >= 60} />
          </div>

          {/* Push */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-1.5">
                <span style={{ color: 'var(--text-secondary)' }}><Bell size={11} strokeWidth={1.8} /></span>
                <span className="text-[14px] font-medium" style={{ color: 'var(--text-primary)' }}>
                  Push
                </span>
              </div>
              <span
                className="metric-value text-[14px] font-bold"
                style={{ color: 'var(--text-primary)' }}
              >
                {pshPct}%
              </span>
            </div>
            <HealthBar pct={pshPct} healthy={pshPct >= 40} />
          </div>
        </div>
      )}

      {showCta && (
        <Link
          href="/dashboard/clients"
          className="mt-4 flex items-center justify-between py-2.5 px-3 rounded-xl group hover:opacity-90 transition-opacity"
          style={{ background: 'var(--border)' }}
        >
          <span className="text-[13px] font-medium" style={{ color: 'var(--text-primary)' }}>
            Як залучити більше клієнтів?
          </span>
          <ChevronRight
            size={14}
            strokeWidth={1.8}
            className="group-hover:translate-x-0.5 transition-transform"
            style={{ color: 'var(--text-tertiary)' }}
          />
        </Link>
      )}
    </div>
  );
}
