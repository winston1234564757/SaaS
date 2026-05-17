'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Send, Bell, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { getChannelHealth, type ChannelHealth } from '@/app/(master)/dashboard/actions';

function HealthBar({ pct, color }: { pct: number; color: string }) {
  return (
    <div
      className="relative h-1.5 rounded-full overflow-hidden"
      style={{ background: 'var(--border-light)' }}
    >
      <motion.div
        className="absolute inset-y-0 left-0 rounded-full"
        style={{ background: color }}
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
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
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 180, damping: 34 }}
      className="bento-card overflow-hidden"
    >
      <div className="px-5 pt-5 pb-4 flex flex-col gap-4">

        {/* Header */}
        <div>
          <p
            className="text-[10px] font-bold uppercase tracking-[0.18em]"
            style={{ color: 'var(--text-tertiary)' }}
          >
            Канали клієнтів
          </p>
          {data && data.total > 0 && (
            <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
              {data.total} клієнтів за 90 днів
            </p>
          )}
        </div>

        {/* Skeleton */}
        {!data && (
          <div className="flex flex-col gap-3">
            <div className="skeleton-shimmer rounded-md" style={{ height: 12, width: '70%' }} />
            <div className="skeleton-shimmer rounded-md" style={{ height: 12, width: '50%' }} />
          </div>
        )}

        {/* Empty state */}
        {isEmpty && (
          <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
            Записів за останні 90 днів ще немає
          </p>
        )}

        {/* Bars */}
        {data && data.total > 0 && (
          <div className="flex flex-col gap-3">
            {/* Telegram */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span style={{ color: 'var(--text-tertiary)' }}>
                    <Send size={11} strokeWidth={1.8} />
                  </span>
                  <span className="text-[11px] font-semibold" style={{ color: 'var(--text-secondary)' }}>
                    Telegram
                  </span>
                </div>
                <span
                  className="text-[12px] font-bold tabular-nums"
                  style={{ color: tgPct >= 60 ? 'var(--success)' : tgPct >= 30 ? 'var(--text-primary)' : 'var(--error)' }}
                >
                  {tgPct}%
                </span>
              </div>
              <HealthBar pct={tgPct} color={tgPct >= 60 ? 'var(--success)' : tgPct >= 30 ? 'var(--accent)' : 'var(--error)'} />
            </div>

            {/* Push */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span style={{ color: 'var(--text-tertiary)' }}>
                    <Bell size={11} strokeWidth={1.8} />
                  </span>
                  <span className="text-[11px] font-semibold" style={{ color: 'var(--text-secondary)' }}>
                    Push
                  </span>
                </div>
                <span
                  className="text-[12px] font-bold tabular-nums"
                  style={{ color: pshPct >= 40 ? 'var(--success)' : pshPct >= 20 ? 'var(--text-primary)' : 'var(--error)' }}
                >
                  {pshPct}%
                </span>
              </div>
              <HealthBar pct={pshPct} color={pshPct >= 40 ? 'var(--success)' : pshPct >= 20 ? 'var(--accent)' : 'var(--error)'} />
            </div>
          </div>
        )}

        {/* CTA */}
        {showCta && (
          <Link href="/dashboard/clients">
            <motion.div
              whileTap={{ scale: 0.97 }}
              className="flex items-center justify-between px-3 py-2.5 rounded-full cursor-pointer"
              style={{
                background: 'var(--background-deep)',
                border: '0.5px solid var(--border-strong)',
              }}
            >
              <span className="text-[11px] font-semibold" style={{ color: 'var(--text-secondary)' }}>
                Як залучити більше клієнтів?
              </span>
              <span style={{ color: 'var(--text-tertiary)' }}>
                <ChevronRight size={14} strokeWidth={1.8} />
              </span>
            </motion.div>
          </Link>
        )}
      </div>
    </motion.div>
  );
}
