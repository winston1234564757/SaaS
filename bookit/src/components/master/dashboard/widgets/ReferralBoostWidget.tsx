'use client';

import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Gift, Copy, ChevronRight, Users } from 'lucide-react';
import { useMasterContext } from '@/lib/supabase/context';
import { useToast } from '@/lib/toast/context';
import { getActiveReferralCount } from '@/app/(master)/dashboard/actions';
import { pluralUk } from '@/lib/utils/pluralUk';
import Link from 'next/link';

// Milestone: [threshold, label, shortLabel]
const MILESTONES = [
  [1,  '-10% щомісяця',      '1 реферал'],
  [3,  '-20% щомісяця',      '3 реферали'],
  [5,  'місяць безкоштовно', '5 рефералів'],
  [10, '-30% назавжди',      '10 рефералів'],
] as const;

function getMilestone(count: number) {
  const current = [...MILESTONES].reverse().find(([threshold]) => count >= threshold);
  const next    = MILESTONES.find(([threshold]) => count < threshold);
  return { current, next };
}

function ProgressBar({ count }: { count: number }) {
  const { next } = getMilestone(count);
  const target = next ? next[0] : MILESTONES[MILESTONES.length - 1][0];
  const prev   = (() => {
    const idx = MILESTONES.findIndex(([t]) => t === target);
    return idx > 0 ? MILESTONES[idx - 1][0] : 0;
  })();
  const pct = Math.min(100, Math.round(((count - prev) / (target - prev)) * 100));

  return (
    <div className="space-y-1.5">
      <div
        className="h-1.5 rounded-full overflow-hidden"
        style={{ background: 'color-mix(in srgb, var(--accent) 15%, transparent)' }}
      >
        <motion.div
          className="h-full rounded-full"
          style={{ background: 'var(--accent)' }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ type: 'spring' as const, stiffness: 120, damping: 20, delay: 0.3 }}
        />
      </div>
      <div className="flex justify-between">
        <span className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>
          {count} {pluralUk(count, 'реферал', 'реферали', 'рефералів')}
        </span>
        {next && (
          <span className="text-[10px] font-semibold" style={{ color: 'var(--accent)' }}>
            ще {next[0] - count} до {next[1]}
          </span>
        )}
      </div>
    </div>
  );
}

export function ReferralBoostWidget() {
  const { masterProfile } = useMasterContext();
  const { showToast } = useToast();

  const { data: count = 0 } = useQuery({
    queryKey: ['referral-count', masterProfile?.id],
    queryFn: () => getActiveReferralCount(),
    enabled: !!masterProfile?.id,
    staleTime: 5 * 60_000,
  });

  const referralCode = masterProfile?.referral_code ?? '';
  const referralUrl  = referralCode ? `https://bookit.com.ua/invite/${referralCode}` : '';

  const { current } = getMilestone(count);

  function copyLink() {
    if (!referralUrl) return;
    navigator.clipboard.writeText(referralUrl).then(() => {
      showToast({ type: 'success', title: 'Скопійовано', message: 'Лінк у буфері обміну' });
    });
  }

  return (
    <div
      className="bento-card p-5 space-y-4"
      style={{ background: 'color-mix(in srgb, var(--accent) 6%, var(--surface))' }}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span
            className="flex items-center justify-center size-10 rounded-xl shrink-0"
            style={{
              background: 'color-mix(in srgb, var(--accent) 16%, transparent)',
              color: 'var(--accent)',
            }}
          >
            <Gift size={18} strokeWidth={1.8} />
          </span>
          <div>
            <p className="text-[14px] font-semibold leading-tight" style={{ color: 'var(--text-primary)' }}>
              Запрошуй колег, платиш менше
            </p>
            <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-secondary)' }}>
              {current
                ? `Знижка зараз: ${current[1]}`
                : 'Один колега вже мінус 10% щомісяця'}
            </p>
          </div>
        </div>

        {count > 0 && (
          <div
            className="flex items-center gap-1 px-2 py-1 rounded-full shrink-0"
            style={{ background: 'color-mix(in srgb, var(--accent) 14%, transparent)' }}
          >
            <Users size={11} style={{ color: 'var(--accent)' }} />
            <span className="text-[11px] font-bold" style={{ color: 'var(--accent)' }}>
              {count}
            </span>
          </div>
        )}
      </div>

      {/* Progress */}
      <ProgressBar count={count} />

      {/* Milestones row */}
      <div className="flex gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
        {MILESTONES.map(([threshold, label, shortLabel]) => {
          const reached = count >= threshold;
          return (
            <div
              key={threshold}
              className="flex-shrink-0 flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-xl text-center"
              style={{
                background: reached
                  ? 'color-mix(in srgb, var(--accent) 14%, transparent)'
                  : 'color-mix(in srgb, var(--accent) 6%, transparent)',
                minWidth: '72px',
              }}
            >
              <span
                className="text-[9px] font-bold uppercase tracking-wide"
                style={{ color: reached ? 'var(--accent)' : 'var(--text-tertiary)' }}
              >
                {shortLabel}
              </span>
              <span
                className="text-[10px] font-semibold leading-tight text-center"
                style={{ color: reached ? 'var(--text-primary)' : 'var(--text-tertiary)' }}
              >
                {label}
              </span>
            </div>
          );
        })}
      </div>

      {/* CTAs */}
      <div className="flex gap-2">
        <button type="button"
          onClick={copyLink}
          disabled={!referralUrl}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[12px] font-semibold transition-all active:scale-[0.95] cursor-pointer"
          style={{
            background: 'var(--accent)',
            color: 'var(--accent-on)',
          }}
        >
          <Copy size={13} strokeWidth={2} />
          Скопіювати лінк
        </button>

        <Link
          href="/dashboard/growth?tab=referral"
          className="flex items-center justify-center size-10 rounded-xl transition-all active:scale-[0.95] cursor-pointer shrink-0"
          style={{ background: 'color-mix(in srgb, var(--accent) 12%, transparent)' }}
        >
          <ChevronRight size={16} style={{ color: 'var(--accent)' }} />
        </Link>
      </div>
    </div>
  );
}
