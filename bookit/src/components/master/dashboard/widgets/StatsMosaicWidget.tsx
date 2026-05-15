'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowUp, ArrowDown, Minus, Phone, MessageCircle } from 'lucide-react';
import Link from 'next/link';
import { format, startOfWeek, endOfWeek } from 'date-fns';
import { useDashboardStats } from '@/lib/supabase/hooks/useDashboardStats';
import { useBookings } from '@/lib/supabase/hooks/useBookings';
import type { BookingWithServices } from '@/lib/supabase/hooks/useBookings';
import { useClients } from '@/lib/supabase/hooks/useClients';
import type { ClientRow } from '@/lib/supabase/hooks/useClients';
import { useMasterContext } from '@/lib/supabase/context';
import { PopUpModal } from '@/components/ui/PopUpModal';
import { ClientDetailSheet } from '@/components/master/clients/ClientDetailSheet';
import { getNow } from '@/lib/utils/now';
import { pluralUk } from '@/lib/utils/pluralUk';

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

/* ─── Hero Card — Bookings today ────────────────────────────── */
function HeroCard({
  label, value, statusLine, cancelledCount, trend, positive, isLoading, href,
}: {
  label: string; value: string; statusLine: string | null; cancelledCount: number;
  trend: string; positive: boolean | null; isLoading: boolean; href: string;
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

          <div
            aria-hidden
            className="absolute right-3 -top-4 select-none pointer-events-none leading-none"
            style={{
              fontFamily: 'var(--font-cormorant, Georgia, serif)',
              fontSize: '10rem',
              fontWeight: 700,
              letterSpacing: '-0.04em',
              color: 'var(--text-primary)',
              opacity: 0.06,
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
            <div className="flex items-center gap-2 flex-wrap min-h-[16px]">
              {statusLine && (
                <p className="text-[11px]" style={{ color: 'var(--text-secondary)' }}>
                  {statusLine}
                </p>
              )}
              {cancelledCount > 0 && (
                <span
                  className="text-[10px]"
                  style={{ color: 'var(--text-tertiary)', opacity: 0.55 }}
                >
                  {statusLine ? '· ' : ''}{cancelledCount} скасовано
                </span>
              )}
            </div>
          )}
        </div>
      </Link>
    </motion.div>
  );
}

/* ─── Small Card — half width ──────────────────────────────── */
function SmallCard({
  label, value, sub, accentColor, trend, positive, delay, isLoading, href, onClick,
}: {
  label: string; value: string; sub: string; accentColor: string;
  trend: string; positive: boolean | null; delay: number; isLoading: boolean;
  href?: string; onClick?: () => void;
}) {
  const inner = (
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
  );

  return (
    <motion.div
      className="h-full"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 180, damping: 34, delay }}
    >
      {href ? (
        <Link href={href} className="block h-full">{inner}</Link>
      ) : (
        <button type="button" className="block h-full w-full text-left" onClick={onClick}>
          {inner}
        </button>
      )}
    </motion.div>
  );
}

/* ─── Revenue Modal ─────────────────────────────────────────── */
function RevenueModal({
  isOpen, onClose, bookings, totalRevenue,
}: {
  isOpen: boolean; onClose: () => void;
  bookings: BookingWithServices[]; totalRevenue: number;
}) {
  const completed = bookings.filter(b => b.status === 'completed');

  return (
    <PopUpModal isOpen={isOpen} onClose={onClose} title="Виручка сьогодні">
      <div className="px-4 pb-6">
        {completed.length === 0 ? (
          <p className="text-center text-sm py-8" style={{ color: 'var(--text-tertiary)' }}>
            Завершених записів ще немає
          </p>
        ) : (
          <>
            <div>
              {completed.map(b => (
                <div
                  key={b.id}
                  className="py-3 flex items-center justify-between gap-3"
                  style={{ borderBottom: '0.5px solid var(--border)' }}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                      {b.services[0]?.name ?? 'Послуга'}
                    </p>
                    <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                      {b.client_name} · {b.start_time}
                    </p>
                  </div>
                  <p className="text-sm font-bold shrink-0" style={{ color: 'var(--success)' }}>
                    {fmt(b.total_price)}
                  </p>
                </div>
              ))}
            </div>
            <div
              className="mt-4 pt-4 flex items-center justify-between"
              style={{ borderTop: '1.5px solid var(--border)' }}
            >
              <p
                className="text-[10px] font-bold uppercase tracking-[0.18em]"
                style={{ color: 'var(--text-tertiary)' }}
              >
                Разом
              </p>
              <p
                style={{
                  fontFamily: 'var(--font-cormorant, Georgia, serif)',
                  fontSize: '1.75rem',
                  fontWeight: 600,
                  color: 'var(--success)',
                }}
              >
                {fmt(totalRevenue)}
              </p>
            </div>
          </>
        )}
      </div>
    </PopUpModal>
  );
}

/* ─── Clients Modal ─────────────────────────────────────────── */
function ClientsModal({
  isOpen, onClose, weekBookings, allClients, newPhones,
}: {
  isOpen: boolean; onClose: () => void;
  weekBookings: BookingWithServices[]; allClients: ClientRow[];
  newPhones: Set<string>;
}) {
  const [selectedClient, setSelectedClient] = useState<ClientRow | null>(null);

  const norm = (p: string) => p.replace(/\D/g, '');

  const uniqueClients = (() => {
    const seen = new Set<string>();
    const result: Array<{ name: string; phone: string; clientRow: ClientRow | null; isNew: boolean }> = [];
    for (const b of weekBookings) {
      if (b.status === 'cancelled') continue;
      const key = b.client_phone || b.client_name;
      if (seen.has(key)) continue;
      seen.add(key);
      const clientRow = allClients.find(c => c.client_phone === b.client_phone) ?? null;
      const isNew = !!b.client_phone && newPhones.has(norm(b.client_phone));
      result.push({ name: b.client_name, phone: b.client_phone, clientRow, isNew });
    }
    return result;
  })();

  return (
    <>
      <PopUpModal isOpen={isOpen} onClose={onClose} title="Клієнти тижня">
        <div className="px-4 pb-6">
          {uniqueClients.length === 0 ? (
            <p className="text-center text-sm py-8" style={{ color: 'var(--text-tertiary)' }}>
              Записів на цьому тижні ще немає
            </p>
          ) : (
            <div>
              {uniqueClients.map(({ name, phone, clientRow, isNew }) => (
                <div
                  key={phone || name}
                  className="py-3 flex items-center gap-3"
                  style={{ borderBottom: '0.5px solid var(--border)' }}
                >
                  <button
                    type="button"
                    className="flex-1 min-w-0 text-left"
                    onClick={() => clientRow && setSelectedClient(clientRow)}
                    disabled={!clientRow}
                  >
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                        {name}
                      </p>
                      <span
                        className="shrink-0 text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                        style={isNew
                          ? { background: 'rgba(74,148,96,0.12)', color: 'var(--success)' }
                          : { background: 'var(--background-deep)', color: 'var(--text-tertiary)' }
                        }
                      >
                        {isNew ? 'новий' : 'повт.'}
                      </span>
                    </div>
                    {phone && (
                      <p className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>{phone}</p>
                    )}
                  </button>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {phone && (
                      <a
                        href={`tel:${phone}`}
                        className="p-2 rounded-xl"
                        style={{ background: 'var(--background-deep)' }}
                        onClick={e => e.stopPropagation()}
                      >
                        <span style={{ color: 'var(--success)' }}>
                          <Phone size={14} strokeWidth={2} />
                        </span>
                      </a>
                    )}
                    {phone && (
                      <a
                        href={`https://t.me/+${phone.replace(/\D/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-xl"
                        style={{ background: 'var(--background-deep)' }}
                        onClick={e => e.stopPropagation()}
                      >
                        <span style={{ color: 'var(--info, #5B8DEF)' }}>
                          <MessageCircle size={14} strokeWidth={2} />
                        </span>
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </PopUpModal>

      <ClientDetailSheet
        client={selectedClient}
        onClose={() => setSelectedClient(null)}
        onVipChange={() => {}}
      />
    </>
  );
}

/* ─── Week Revenue Bar — replaces CompletedBar ──────────────── */
function WeekRevenueBar({
  weekRevenue, prevWeekRevenue, isLoading,
}: {
  weekRevenue: number; prevWeekRevenue: number; isLoading: boolean;
}) {
  const trend: { value: string; positive: boolean | null } = (() => {
    if (prevWeekRevenue === 0 && weekRevenue === 0) return { value: '—', positive: null };
    if (prevWeekRevenue === 0) return { value: 'перший тиждень', positive: true };
    const pct = Math.round(((weekRevenue - prevWeekRevenue) / prevWeekRevenue) * 100);
    return { value: `${pct > 0 ? '+' : ''}${pct}% vs минулий`, positive: pct >= 0 };
  })();

  const barMax = Math.max(weekRevenue, prevWeekRevenue, 1);
  const barPct = Math.round((weekRevenue / barMax) * 100);

  return (
    <motion.div
      className="col-span-2"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 180, damping: 34, delay: 0.14 }}
    >
      <div className="bento-card px-5 py-4">
        <div className="flex items-start justify-between mb-2">
          <p
            className="text-[9px] font-bold uppercase tracking-[0.18em]"
            style={{ color: 'var(--text-tertiary)' }}
          >
            Виручка за тиждень
          </p>
          <TrendChip value={trend.value} positive={trend.positive} />
        </div>

        {isLoading ? (
          <Skeleton className="h-8 w-32 mb-3" />
        ) : (
          <p
            className="leading-none mb-3"
            style={{
              fontFamily: 'var(--font-cormorant, Georgia, serif)',
              fontSize: '1.75rem',
              fontWeight: 600,
              letterSpacing: '-0.02em',
              color: 'var(--text-primary)',
            }}
          >
            {fmt(weekRevenue)}
          </p>
        )}

        {!isLoading && (
          <>
            <div
              className="rounded-full overflow-hidden"
              style={{ height: '3px', background: 'var(--background-deep)' }}
            >
              <motion.div
                className="h-full rounded-full"
                style={{ background: trend.positive !== false ? 'var(--success)' : 'var(--error)' }}
                initial={{ width: 0 }}
                animate={{ width: `${barPct}%` }}
                transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
              />
            </div>
            {prevWeekRevenue > 0 && (
              <p className="text-[9px] mt-1.5" style={{ color: 'var(--text-tertiary)' }}>
                Минулий тиждень: {fmt(prevWeekRevenue)}
              </p>
            )}
          </>
        )}
      </div>
    </motion.div>
  );
}

/* ─── Main Export ──────────────────────────────────────────── */
export function StatsMosaicWidget() {
  const s = useDashboardStats();
  const { masterProfile } = useMasterContext();

  const [revenueOpen, setRevenueOpen] = useState(false);
  const [clientsOpen, setClientsOpen] = useState(false);

  const now          = getNow();
  const today        = format(now, 'yyyy-MM-dd');
  const weekStart    = format(startOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd');
  const weekEnd      = format(endOfWeek(now,   { weekStartsOn: 1 }), 'yyyy-MM-dd');
  const prevWeekRef  = new Date(now.getTime() - 7 * 86_400_000);
  const prevWeekStart = format(startOfWeek(prevWeekRef, { weekStartsOn: 1 }), 'yyyy-MM-dd');
  const prevWeekEnd   = format(endOfWeek(prevWeekRef,   { weekStartsOn: 1 }), 'yyyy-MM-dd');

  const { bookings: todayBookings }    = useBookings(today, today);
  const { bookings: weekBookings }     = useBookings(weekStart, weekEnd);
  const { bookings: prevWeekBookings } = useBookings(prevWeekStart, prevWeekEnd);
  const { clients }                    = useClients();

  const weekRevenue     = weekBookings.filter(b => b.status === 'completed').reduce((s, b) => s + b.total_price, 0);
  const prevWeekRevenue = prevWeekBookings.filter(b => b.status === 'completed').reduce((s, b) => s + b.total_price, 0);

  const activeCount = s.todayCount - s.todayCancelled;

  const heroStatusLine = (() => {
    const parts: string[] = [];
    if (s.todayPending > 0)
      parts.push(`${s.todayPending} ${pluralUk(s.todayPending, 'очікує', 'очікують', 'очікують')}`);
    if (s.todayConfirmed > 0) parts.push(`${s.todayConfirmed} підтверджено`);
    if (s.todayCompleted > 0) parts.push(`${s.todayCompleted} завершено`);
    return parts.length > 0 ? parts.join(' · ') : null;
  })();

  const revTrend: { value: string; positive: boolean | null } = (() => {
    if (s.prevDayRevenue === 0 && s.todayRevenue === 0) return { value: '—', positive: null };
    if (s.prevDayRevenue === 0) return { value: 'новий', positive: true };
    const pct = Math.round(((s.todayRevenue - s.prevDayRevenue) / s.prevDayRevenue) * 100);
    return { value: `${pct > 0 ? '+' : ''}${pct}%`, positive: pct >= 0 };
  })();

  const newPhones = new Set(s.weekNewPhones);

  return (
    <div className="grid grid-cols-2 gap-3">

      <HeroCard
        label="Записів сьогодні"
        value={String(activeCount)}
        statusLine={heroStatusLine}
        cancelledCount={s.todayCancelled}
        trend={s.todayPending > 0 ? `+${s.todayPending}` : '—'}
        positive={s.todayPending > 0 ? true : null}
        isLoading={s.isLoading}
        href="/dashboard/bookings"
      />

      <SmallCard
        label="Виручка"
        value={fmt(s.todayRevenue)}
        sub={s.todayCompleted > 0 ? `${s.todayCompleted} завершених` : 'Ще немає'}
        accentColor="var(--success)"
        trend={revTrend.value}
        positive={revTrend.positive}
        delay={0.06}
        isLoading={s.isLoading}
        onClick={() => setRevenueOpen(true)}
      />
      <SmallCard
        label="Клієнти"
        value={String(s.weekClients)}
        sub={s.weekNewClients > 0 ? `${s.weekNewClients} нових цього тижня` : 'цього тижня'}
        accentColor="var(--highlight, #D3A376)"
        trend={s.weekNewClients > 0 ? `+${s.weekNewClients}` : '—'}
        positive={s.weekNewClients > 0 ? true : null}
        delay={0.10}
        isLoading={s.isLoading}
        onClick={() => setClientsOpen(true)}
      />

      <WeekRevenueBar
        weekRevenue={weekRevenue}
        prevWeekRevenue={prevWeekRevenue}
        isLoading={s.isLoading}
      />

      <RevenueModal
        isOpen={revenueOpen}
        onClose={() => setRevenueOpen(false)}
        bookings={todayBookings}
        totalRevenue={s.todayRevenue}
      />
      <ClientsModal
        isOpen={clientsOpen}
        onClose={() => setClientsOpen(false)}
        weekBookings={weekBookings}
        allClients={clients}
        newPhones={newPhones}
      />
    </div>
  );
}
