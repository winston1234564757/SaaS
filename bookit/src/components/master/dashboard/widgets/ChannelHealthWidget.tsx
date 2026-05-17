'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Send, Bell, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { getChannelHealth, type ChannelHealth } from '@/app/(master)/dashboard/actions';

function HealthBar({ pct, color }: { pct: number; color: string }) {
  return (
    <div className="health-bar-track">
      <motion.div
        className="absolute inset-y-0 left-0 rounded-full"
        style={{ background: color }}
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
      />
    </div>
  );
}

function pct(count: number, total: number) {
  if (total === 0) return 0;
  return Math.round((count / total) * 100);
}

function scoreColor(val: number, thresholdHigh: number, thresholdLow: number): string {
  if (val >= thresholdHigh) return 'var(--success)';
  if (val >= thresholdLow)  return 'var(--accent)';
  return 'var(--error)';
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
      <div className="px-5 pt-5 pb-5 flex flex-col gap-4">

        {/* Header */}
        <div>
          <p className="dash-eyebrow mb-1">Канали клієнтів</p>
          {data && data.total > 0 && (
            <p style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: 2 }}>
              {data.total} клієнтів за 90 днів
            </p>
          )}
        </div>

        {/* Skeleton */}
        {!data && (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <div className="skeleton-shimmer rounded" style={{ height: 11, width: '70%' }} />
              <div className="skeleton-shimmer rounded-full" style={{ height: 5, width: '100%' }} />
            </div>
            <div className="flex flex-col gap-2">
              <div className="skeleton-shimmer rounded" style={{ height: 11, width: '50%' }} />
              <div className="skeleton-shimmer rounded-full" style={{ height: 5, width: '100%' }} />
            </div>
          </div>
        )}

        {/* Empty state */}
        {isEmpty && (
          <p style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>
            Записів за останні 90 днів ще немає
          </p>
        )}

        {/* Channel bars */}
        {data && data.total > 0 && (
          <div className="flex flex-col gap-4">
            {/* Telegram */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Send size={11} strokeWidth={1.8} style={{ color: 'var(--text-tertiary)' }} />
                  <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                    Telegram
                  </span>
                </div>
                <span
                  style={{
                    fontFamily: 'var(--font-cormorant, Georgia, serif)',
                    fontSize: '1.05rem',
                    fontWeight: 600,
                    color: scoreColor(tgPct, 60, 30),
                    lineHeight: 1,
                  }}
                >
                  {tgPct}%
                </span>
              </div>
              <HealthBar pct={tgPct} color={scoreColor(tgPct, 60, 30)} />
            </div>

            {/* Push */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Bell size={11} strokeWidth={1.8} style={{ color: 'var(--text-tertiary)' }} />
                  <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                    Push
                  </span>
                </div>
                <span
                  style={{
                    fontFamily: 'var(--font-cormorant, Georgia, serif)',
                    fontSize: '1.05rem',
                    fontWeight: 600,
                    color: scoreColor(pshPct, 40, 20),
                    lineHeight: 1,
                  }}
                >
                  {pshPct}%
                </span>
              </div>
              <HealthBar pct={pshPct} color={scoreColor(pshPct, 40, 20)} />
            </div>
          </div>
        )}

        {/* CTA */}
        {showCta && (
          <Link href="/dashboard/clients">
            <motion.div
              whileTap={{ scale: 0.97 }}
              className="flex items-center justify-between px-3.5 py-2.5 rounded-full cursor-pointer"
              style={{
                background: 'var(--background-deep)',
                border: '0.5px solid var(--border-strong)',
              }}
            >
              <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                Як залучити більше клієнтів?
              </span>
              <ChevronRight size={13} strokeWidth={1.8} style={{ color: 'var(--text-tertiary)' }} />
            </motion.div>
          </Link>
        )}
      </div>
    </motion.div>
  );
}
