'use client';

import { motion } from 'framer-motion';
import { ArrowUp, ArrowDown, Minus } from 'lucide-react';
import Link from 'next/link';
import { useDashboardStats } from '@/lib/supabase/hooks/useDashboardStats';
import { useMonthlyBookingCount } from '@/lib/supabase/hooks/useBookings';
import { useMasterContext } from '@/lib/supabase/context';

function fmt(n: number) {
  if (n >= 1000) return (n / 1000).toFixed(1).replace('.0', '') + 'k ₴';
  return n.toLocaleString('uk-UA') + ' ₴';
}

function Skeleton({ className }: { className?: string }) {
  return <div className={`skeleton-shimmer rounded-2xl ${className ?? ''}`} />;
}

function TrendChip({ value, positive }: { value: string; positive: boolean | null }) {
  if (positive === null || value === '—') {
    return (
      <span
        className="inline-flex items-center text-[10px] font-semibold"
        style={{ color: 'var(--text-tertiary)', opacity: 0.4 }}
      >
        <Minus size={9} strokeWidth={2} />
      </span>
    );
  }
  return (
    <span
      className="inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full"
      style={{
        background: positive ? 'rgba(74, 148, 96, 0.12)' : 'rgba(176, 56, 80, 0.10)',
        color: positive ? 'var(--success)' : 'var(--error)',
      }}
    >
      {positive
        ? <ArrowUp size={8} strokeWidth={2.5} />
        : <ArrowDown size={8} strokeWidth={2.5} />}
      {value}
    </span>
  );
}

/* ─── Hero Card — Bookings today (full width) ──────────────── */

function HeroCard({
  label, value, sub, trend, positive, isLoading, href,
}: {
  label: string; value: string; sub: string; trend: string;
  positive: boolean | null; isLoading: boolean; href: string;
}) {
  return (
    <motion.div
      className="col-span-2"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 180, damping: 34 }}
    >
      <Link href={href} className="block">
        <div className="bento-card px-5 py-5 cursor-pointer group relative overflow-hidden">

          {/* Ghost decorative number — editorial depth */}
          <div
            aria-hidden
            className="absolute right-3 -top-4 select-none pointer-events-none leading-none"
            style={{
              fontFamily: 'var(--font-cormorant, Georgia, serif)',
              fontSize: '8rem',
              fontWeight: 700,
              letterSpacing: '-0.04em',
              color: 'var(--text-primary)',
              opacity: 0.04,
            }}
          >
            {!isLoading ? value : ''}
          </div>

          <div className="flex items-start justify-between mb-3">
            <p
              className="text-[10px] font-bold uppercase tracking-[0.20em]"
              style={{ color: 'var(--text-tertiary)' }}
            >
              {label}
            </p>
            <TrendChip value={trend} positive={positive} />
          </div>

          {isLoading ? (
            <Skeleton className="h-12 w-24 mb-3" />
          ) : (
            <p
              className="leading-none mb-3"
              style={{
                fontFamily: 'var(--font-cormorant, Georgia, serif)',
                fontSize: 'clamp(3rem, 10vw, 3.75rem)',
                fontWeight: 600,
                letterSpacing: '-0.03em',
                color: 'var(--text-primary)',
              }}
            >
              {value}
            </p>
          )}

          {isLoading ? (
            <Skeleton className="h-3 w-44" />
          ) : (
            <p className="text-[11px]" style={{ color: 'var(--text-secondary)' }}>
              {sub}
            </p>
          )}
        </div>
      </Link>
    </motion.div>
  );
}

/* ─── Small Card — half width ──────────────────────────────── */

function SmallCard({
  label, value, sub, accentColor, trend, positive, delay, isLoading, href,
}: {
  label: string; value: string; sub: string; accentColor: string;
  trend: string; positive: boolean | null; delay: number; isLoading: boolean; href: string;
}) {
  return (
    <motion.div
      className="h-full"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 180, damping: 34, delay }}
    >
      <Link href={href} className="block h-full">
        <div
          className="bento-card px-4 py-4 cursor-pointer group relative overflow-hidden h-full flex flex-col gap-2"
          style={{ borderLeft: `3px solid ${accentColor}` }}
        >

          <div className="flex items-center justify-between pl-3">
            <p
              className="text-[9px] font-bold uppercase tracking-[0.14em] leading-none"
              style={{ color: 'var(--text-tertiary)' }}
            >
              {label}
            </p>
            <TrendChip value={trend} positive={positive} />
          </div>

          <div className="pl-3 flex-1 flex items-center">
            {isLoading ? (
              <Skeleton className="h-7 w-12 mt-1" />
            ) : (
              <p
                className="leading-none"
                style={{
                  fontFamily: 'var(--font-cormorant, Georgia, serif)',
                  fontSize: '2.25rem',
                  fontWeight: 600,
                  letterSpacing: '-0.02em',
                  color: 'var(--text-primary)',
                }}
              >
                {value}
              </p>
            )}
          </div>

          {isLoading ? (
            <Skeleton className="h-2.5 w-4/5 ml-3" />
          ) : (
            <p
              className="text-[10px] font-medium pl-3 truncate"
              style={{ color: accentColor }}
            >
              {sub}
            </p>
          )}
        </div>
      </Link>
    </motion.div>
  );
}

/* ─── Completed Bar — full width bottom ────────────────────── */

function CompletedBar({
  todayCompleted, monthCompleted, quotaCount, tier, isLoading,
}: {
  todayCompleted: number; monthCompleted: number; quotaCount: number; tier: string; isLoading: boolean;
}) {
  const limit = tier === 'starter' ? 50 : null;
  const progress = limit ? Math.min((quotaCount / limit) * 100, 100) : 0;

  return (
    <motion.div
      className="col-span-2"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 180, damping: 34, delay: 0.14 }}
    >
      <Link href="/dashboard/bookings" className="block">
        <div className="bento-card px-5 py-4 cursor-pointer group">
          <div className="flex items-center justify-between">
            <div>
              <p
                className="text-[9px] font-bold uppercase tracking-[0.18em] mb-1.5"
                style={{ color: 'var(--text-tertiary)' }}
              >
                Завершено сьогодні
              </p>
              {isLoading ? (
                <Skeleton className="h-6 w-8" />
              ) : (
                <p
                  className="leading-none"
                  style={{
                    fontFamily: 'var(--font-cormorant, Georgia, serif)',
                    fontSize: '1.75rem',
                    fontWeight: 600,
                    letterSpacing: '-0.02em',
                    color: 'var(--text-primary)',
                  }}
                >
                  {todayCompleted}
                </p>
              )}
            </div>

            <div className="text-right">
              <p
                className="text-[9px] font-bold uppercase tracking-[0.14em] mb-1.5"
                style={{ color: 'var(--text-tertiary)' }}
              >
                За місяць
              </p>
              {isLoading ? (
                <Skeleton className="h-5 w-14" />
              ) : (
                <p
                  style={{
                    fontFamily: 'var(--font-cormorant, Georgia, serif)',
                    fontSize: '1.25rem',
                    fontWeight: 600,
                    letterSpacing: '-0.01em',
                    color: 'var(--text-secondary)',
                  }}
                >
                  {monthCompleted}
                </p>
              )}
            </div>
          </div>

          {limit && !isLoading && (
            <div className="mt-3">
              <div
                className="rounded-full overflow-hidden"
                style={{ height: '3px', background: 'var(--background-deep)' }}
              >
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: progress > 80 ? 'var(--warning)' : 'var(--info)' }}
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
                />
              </div>
              <p
                className="text-[9px] mt-1.5"
                style={{ color: progress > 80 ? 'var(--warning)' : 'var(--text-tertiary)' }}
              >
                {quotaCount} / {limit} записів цього місяця
              </p>
            </div>
          )}
        </div>
      </Link>
    </motion.div>
  );
}

/* ─── Main Export ──────────────────────────────────────────── */

export function StatsMosaicWidget() {
  const s = useDashboardStats();
  const { count: quotaCount } = useMonthlyBookingCount();
  const { masterProfile } = useMasterContext();
  const tier = masterProfile?.subscription_tier ?? 'starter';

  return (
    <div className="grid grid-cols-2 gap-3">

      {/* Row 1: Bookings hero */}
      <HeroCard
        label="Записів сьогодні"
        value={String(s.todayCount)}
        sub={
          s.todayPending > 0
            ? `${s.todayPending} очікують підтвердження`
            : s.todayConfirmed > 0
            ? `${s.todayConfirmed} підтверджено`
            : 'Записів поки немає'
        }
        trend={s.todayPending > 0 ? `+${s.todayPending}` : '—'}
        positive={s.todayPending > 0 ? true : null}
        isLoading={s.isLoading}
        href="/dashboard/bookings"
      />

      {/* Row 2: Revenue + Clients */}
      <SmallCard
        label="Виручка"
        value={fmt(s.todayRevenue)}
        sub={s.todayCompleted > 0 ? `${s.todayCompleted} завершених` : 'Ще немає'}
        accentColor="var(--success)"
        trend={s.todayRevenue > 0 ? '+' : '—'}
        positive={s.todayRevenue > 0 ? true : null}
        delay={0.06}
        isLoading={s.isLoading}
        href="/dashboard/analytics"
      />
      <SmallCard
        label="Клієнти"
        value={String(s.weekClients)}
        sub="цього тижня"
        accentColor="var(--highlight, #D3A376)"
        trend={s.weekClients > 0 ? String(s.weekClients) : '—'}
        positive={s.weekClients > 0 ? true : null}
        delay={0.10}
        isLoading={s.isLoading}
        href="/dashboard/clients"
      />

      {/* Row 3: Completed today + completed this month */}
      <CompletedBar
        todayCompleted={s.todayCompleted}
        monthCompleted={s.monthCompleted}
        quotaCount={quotaCount}
        tier={tier}
        isLoading={s.isLoading}
      />
    </div>
  );
}
