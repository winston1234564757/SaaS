'use client';

import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, Clock, ChevronRight, Bell } from 'lucide-react';
import { useMasterContext } from '@/lib/supabase/context';
import { getClientAlerts } from '@/app/(master)/dashboard/actions';
import type { ClientAlert } from '@/app/(master)/dashboard/actions';
import { pluralUk } from '@/lib/utils/pluralUk';

function fmtName(name: string): string {
  const parts = name.trim().split(/\s+/);
  return parts.length >= 2 ? `${parts[0]} ${parts[1][0].toUpperCase()}.` : parts[0] ?? name;
}

function AlertRow({ alert, index }: { alert: ClientAlert; index: number }) {
  const router = useRouter();

  const isNoReview   = alert.type === 'no_review';
  const label        = isNoReview
    ? `Не залишила відгук · ${alert.daysAgo} ${pluralUk(alert.daysAgo, 'день', 'дні', 'днів')} тому`
    : `Не була ${alert.daysAgo} ${pluralUk(alert.daysAgo, 'день', 'дні', 'днів')}`;
  const ctaLabel     = isNoReview ? 'Нагадати' : 'Написати';
  const href         = isNoReview
    ? `/dashboard/clients?filter=no_review&phone=${encodeURIComponent(alert.clientPhone)}`
    : `/dashboard/clients?filter=at_risk&phone=${encodeURIComponent(alert.clientPhone)}`;

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ type: 'spring' as const, stiffness: 340, damping: 28, delay: index * 0.06 }}
      className="flex items-center gap-3 py-2.5 group"
    >
      <span
        className="flex items-center justify-center size-8 rounded-xl shrink-0"
        style={{
          background: isNoReview
            ? 'color-mix(in srgb, var(--warning) 14%, transparent)'
            : 'color-mix(in srgb, var(--info) 12%, transparent)',
          color: isNoReview ? 'var(--warning)' : 'var(--info)',
        }}
      >
        {isNoReview ? <Star size={14} strokeWidth={1.8} /> : <Clock size={14} strokeWidth={1.8} />}
      </span>

      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
          {fmtName(alert.clientName)}
        </p>
        <p className="text-[11px] truncate" style={{ color: 'var(--text-secondary)' }}>
          {label}
        </p>
      </div>

      <button
        onClick={() => router.push(href)}
        className="shrink-0 text-[11px] font-semibold px-3 py-1.5 rounded-full transition-all active:scale-[0.95] cursor-pointer"
        style={{
          background: 'color-mix(in srgb, var(--accent) 10%, transparent)',
          color: 'var(--accent)',
        }}
      >
        {ctaLabel}
      </button>
    </motion.div>
  );
}

export function ClientAlertsWidget() {
  const { masterProfile } = useMasterContext();
  const router = useRouter();

  const { data: alerts = [], isLoading } = useQuery({
    queryKey: ['client-alerts', masterProfile?.id],
    queryFn: () => getClientAlerts(),
    enabled: !!masterProfile?.id,
    staleTime: 5 * 60_000,
  });

  if (isLoading) {
    return (
      <div className="bento-card p-5 space-y-3">
        <div className="skeleton-shimmer h-4 w-32 rounded-full" />
        {[0, 1].map(i => (
          <div key={i} className="flex items-center gap-3">
            <div className="skeleton-shimmer size-8 rounded-xl" />
            <div className="flex-1 space-y-1.5">
              <div className="skeleton-shimmer h-3 w-24 rounded-full" />
              <div className="skeleton-shimmer h-2.5 w-32 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (alerts.length === 0) return null;

  return (
    <div className="bento-card p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span style={{ color: 'var(--accent)' }}>
            <Bell size={14} strokeWidth={1.8} />
          </span>
          <p className="text-[11px] font-bold tracking-[0.14em] uppercase" style={{ color: 'var(--text-tertiary)' }}>
            Зверни увагу
          </p>
        </div>
        <button
          onClick={() => router.push('/dashboard/clients')}
          className="flex items-center gap-1 text-[11px] font-semibold transition-opacity hover:opacity-70 cursor-pointer"
          style={{ color: 'var(--accent)' }}
        >
          Всі клієнти
          <ChevronRight size={13} />
        </button>
      </div>

      <AnimatePresence mode="popLayout">
        <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
          {alerts.map((alert, i) => (
            <AlertRow
              key={`${alert.type}-${alert.clientPhone}-${i}`}
              alert={alert}
              index={i}
            />
          ))}
        </div>
      </AnimatePresence>
    </div>
  );
}
