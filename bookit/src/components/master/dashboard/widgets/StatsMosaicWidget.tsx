'use client';

import { useState, useEffect } from 'react';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { ArrowUp, ArrowDown, Minus, Phone, MessageCircle } from 'lucide-react';
import Link from 'next/link';
import { format, startOfWeek, endOfWeek } from 'date-fns';
import { useDashboardStats } from '@/lib/supabase/hooks/useDashboardStats';
import { useBookings } from '@/lib/supabase/hooks/useBookings';
import type { BookingWithServices } from '@/lib/supabase/hooks/useBookings';
import { useClients } from '@/lib/supabase/hooks/useClients';
import type { ClientRow } from '@/lib/supabase/hooks/useClients';
import { PopUpModal } from '@/components/ui/PopUpModal';
import { ClientDetailSheet } from '@/components/master/clients/ClientDetailSheet';
import { getNow } from '@/lib/utils/now';

function fmt(n: number) {
  if (n >= 1000) return (n / 1000).toFixed(1).replace('.0', '') + 'k ₴';
  return n.toLocaleString('uk-UA') + ' ₴';
}

function AnimatedNumber({ value, format: formatter }: { value: number; format: (n: number) => string }) {
  const motionVal = useMotionValue(0);
  const display   = useTransform(motionVal, (v) => formatter(Math.round(v)));

  useEffect(() => {
    const controls = animate(motionVal, value, {
      type: 'spring' as const, duration: 1.8, bounce: 0,
    });
    return controls.stop;
  }, [value, motionVal]);

  return <motion.span>{display}</motion.span>;
}

function TrendChip({ value, positive }: { value: string; positive: boolean | null }) {
  if (positive === null || value === '—') {
    return (
      <span className="inline-flex items-center justify-center w-[18px] h-[18px] rounded-full bg-[var(--border)] text-[var(--text-tertiary)]">
        <Minus size={9} strokeWidth={2} />
      </span>
    );
  }
  return (
    <span
      className={`inline-flex items-center gap-0.5 px-2 py-[3px] rounded-full text-[10px] font-bold tracking-[0.04em] ${
        positive
          ? 'bg-[var(--success)]/15 text-[var(--success)]'
          : 'bg-[var(--error)]/15 text-[var(--error)]'
      }`}
    >
      {positive ? <ArrowUp size={8} strokeWidth={2.5} /> : <ArrowDown size={8} strokeWidth={2.5} />}
      {value}
    </span>
  );
}

const STATUS_ITEMS = [
  { key: 'confirmed', label: 'підтверджено', dotClass: 'pulse-confirmed', bg: 'var(--success)' },
  { key: 'pending',   label: 'очікує',       dotClass: 'pulse-pending',   bg: 'var(--warning)' },
  { key: 'completed', label: 'завершено',    dotClass: '',                bg: 'var(--text-tertiary)' },
  { key: 'cancelled', label: 'скасовано',    dotClass: '',                bg: 'var(--error)' },
] as const;

function HeroStrip({
  count, confirmedCount, pendingCount, completedCount, cancelledCount, isLoading, href,
}: {
  count: number;
  confirmedCount: number; pendingCount: number; completedCount: number;
  cancelledCount: number; isLoading: boolean; href: string;
}) {
  const counts: Record<typeof STATUS_ITEMS[number]['key'], number> = {
    confirmed: confirmedCount,
    pending:   pendingCount,
    completed: completedCount,
    cancelled: cancelledCount,
  };
  const visibleItems = STATUS_ITEMS.filter(s => counts[s.key] > 0);

  return (
    <div>
      <Link href={href} className="block group">
        <div className="border-l-2 border-[var(--accent)] pl-4 py-1 flex items-end justify-between gap-4 group-hover:pl-5 transition-[padding] duration-200">
          <div>
            <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-[var(--text-tertiary)] mb-1.5">
              Записів сьогодні
            </p>
            {isLoading ? (
              <div className="skeleton-shimmer h-14 w-20 rounded-xl" />
            ) : (
              <p className="metric-value text-[clamp(2.8rem,8vw,4rem)] font-bold leading-none text-[var(--text-primary)] group-hover:text-[var(--accent)] transition-colors duration-200">
                <AnimatedNumber value={count} format={String} />
              </p>
            )}
          </div>

          {!isLoading && visibleItems.length > 0 && (
            <div className="flex flex-col gap-1.5 pb-1">
              {visibleItems.map(item => (
                <div key={item.key} className="flex items-center gap-1.5">
                  <div
                    className={`w-[6px] h-[6px] rounded-full flex-shrink-0 ${item.dotClass}`}
                    style={{ background: item.bg }}
                  />
                  <span className="text-[13px] whitespace-nowrap" style={{ color: 'var(--text-secondary)' }}>
                    {counts[item.key]} {item.label}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </Link>
    </div>
  );
}

function FloatStats({
  todayRevenue, todayCompleted, revTrend,
  weekClients, weekNewClients,
  isLoading,
  onRevenueClick, onClientsClick,
}: {
  todayRevenue: number; todayCompleted: number;
  revTrend: { value: string; positive: boolean | null };
  weekClients: number; weekNewClients: number;
  isLoading: boolean;
  onRevenueClick: () => void;
  onClientsClick: () => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-3 items-stretch">
      {/* Виручка — dark hero card with glow */}
      <button
        type="button"
        onClick={onRevenueClick}
        className="glow-warm text-left flex flex-col gap-3 p-4 rounded-[var(--card-radius)] overflow-hidden relative cursor-pointer active:scale-[0.97] transition-transform duration-150"
        style={{ background: 'var(--hero-card-bg)' }}
      >
        <div className="absolute inset-x-0 top-0 h-px pointer-events-none" style={{ background: 'rgba(255,255,255,0.07)' }} />
        <div className="flex justify-between items-start gap-2">
          <p
            className="text-[10px] font-bold tracking-[0.2em] uppercase"
            style={{ color: 'var(--accent-on)', opacity: 0.42 }}
          >
            Виручка
          </p>
          <TrendChip value={revTrend.value} positive={revTrend.positive} />
        </div>
        {isLoading ? (
          <div className="skeleton-shimmer h-8 w-20 rounded-lg" />
        ) : (
          <p
            className="metric-value text-[clamp(1.5rem,5vw,2rem)] font-bold leading-none"
            style={{ color: 'var(--accent-on)' }}
          >
            <AnimatedNumber value={todayRevenue} format={fmt} />
          </p>
        )}
        {!isLoading && (
          <p className="text-[10px] mt-auto" style={{ color: 'var(--accent-on)', opacity: 0.45 }}>
            {todayCompleted > 0 ? `${todayCompleted} завершених` : 'ще немає'}
          </p>
        )}
      </button>

      {/* Клієнти — editorial open strip, high contrast */}
      <button
        type="button"
        onClick={onClientsClick}
        className="text-left flex flex-col gap-2 pl-4 py-1 cursor-pointer active:scale-[0.97] transition-transform duration-150 group border-l-2"
        style={{ borderColor: 'var(--accent)' }}
      >
        <div className="flex justify-between items-start gap-2">
          <p
            className="text-[10px] font-bold tracking-[0.2em] uppercase"
            style={{ color: 'var(--text-tertiary)' }}
          >
            Клієнти тижня
          </p>
          <TrendChip
            value={weekNewClients > 0 ? `+${weekNewClients}` : '—'}
            positive={weekNewClients > 0 ? true : null}
          />
        </div>
        {isLoading ? (
          <div className="skeleton-shimmer h-8 w-12 rounded-lg" />
        ) : (
          <p
            className="metric-value text-[clamp(1.8rem,6vw,2.8rem)] font-bold leading-none transition-colors duration-200 group-hover:opacity-80"
            style={{ color: 'var(--text-primary)' }}
          >
            <AnimatedNumber value={weekClients} format={String} />
          </p>
        )}
        {!isLoading && (
          <p className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>
            {weekNewClients > 0 ? 'нових' : 'цього тижня'}
          </p>
        )}
      </button>
    </div>
  );
}

function WeekRevenueBar({
  weekRevenue, prevWeekRevenue, isLoading,
}: {
  weekRevenue: number; prevWeekRevenue: number; isLoading: boolean;
}) {
  const trend = (() => {
    if (prevWeekRevenue === 0 && weekRevenue === 0) return { value: '—', positive: null as null };
    if (prevWeekRevenue === 0) return { value: 'перший тиждень', positive: true };
    const pct = Math.round(((weekRevenue - prevWeekRevenue) / prevWeekRevenue) * 100);
    return { value: `${pct > 0 ? '+' : ''}${pct}% vs минулий`, positive: pct >= 0 };
  })();

  const barPct = Math.round((weekRevenue / Math.max(weekRevenue, prevWeekRevenue, 1)) * 100);

  return (
    <div className="bento-card glow-accent p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[10px] font-bold tracking-[0.18em] uppercase text-[var(--text-tertiary)]">
          Виручка за тиждень
        </p>
        <TrendChip value={trend.value} positive={trend.positive} />
      </div>

      {isLoading ? (
        <div className="skeleton-shimmer h-7 w-32 rounded-lg" />
      ) : (
        <p className="metric-value text-2xl font-semibold text-[var(--text-primary)]">
          {fmt(weekRevenue)}
        </p>
      )}

      {!isLoading && (
        <>
          <div className="h-1.5 bg-[var(--border)] rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-[width] duration-700 ease-out ${
                trend.positive !== false
                  ? 'bg-[var(--accent)]'
                  : 'bg-[var(--text-tertiary)]'
              }`}
              style={{ width: `${barPct}%` }}
            />
          </div>
          {prevWeekRevenue > 0 && (
            <p className="text-[12px] text-[var(--text-tertiary)]">
              Минулий тиждень: {fmt(prevWeekRevenue)}
            </p>
          )}
        </>
      )}
    </div>
  );
}

function RevenueModal({
  isOpen, onClose, bookings, totalRevenue,
}: {
  isOpen: boolean; onClose: () => void;
  bookings: BookingWithServices[]; totalRevenue: number;
}) {
  const completed = bookings.filter(b => b.status === 'completed');
  return (
    <PopUpModal isOpen={isOpen} onClose={onClose} title="Виручка сьогодні">
      <div className="flex flex-col">
        {completed.length === 0 ? (
          <p className="text-sm text-[var(--text-tertiary)] text-center py-6">
            Завершених записів ще немає
          </p>
        ) : (
          <>
            <div className="flex flex-col divide-y divide-[var(--border)]">
              {completed.map(b => (
                <div key={b.id} className="flex items-center justify-between py-3">
                  <div className="min-w-0 mr-3">
                    <p className="text-sm font-medium text-[var(--text-primary)] truncate">
                      {b.services[0]?.name ?? 'Послуга'}
                    </p>
                    <p className="text-xs text-[var(--text-tertiary)] mt-0.5">
                      {b.client_name} · {b.start_time}
                    </p>
                  </div>
                  <p className="metric-value text-sm font-semibold text-[var(--text-primary)] whitespace-nowrap flex-shrink-0">
                    {fmt(b.total_price)}
                  </p>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between pt-3 mt-1 border-t border-[var(--border-strong)]">
              <p className="text-sm font-medium text-[var(--text-secondary)]">Разом</p>
              <p className="metric-value text-base font-bold text-[var(--text-primary)]">
                {fmt(totalRevenue)}
              </p>
            </div>
          </>
        )}
      </div>
    </PopUpModal>
  );
}

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
        <div className="flex flex-col">
          {uniqueClients.length === 0 ? (
            <p className="text-sm text-[var(--text-tertiary)] text-center py-6">
              Записів на цьому тижні ще немає
            </p>
          ) : (
            <div className="flex flex-col divide-y divide-[var(--border)]">
              {uniqueClients.map(({ name, phone, clientRow, isNew }) => (
                <div key={phone || name} className="flex items-center justify-between py-2.5 gap-3">
                  <button
                    type="button"
                    onClick={() => clientRow && setSelectedClient(clientRow)}
                    disabled={!clientRow}
                    className="flex items-center gap-2 min-w-0 text-left disabled:opacity-60"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-sm font-medium text-[var(--text-primary)] truncate">{name}</p>
                        <span
                          className={`px-1.5 py-px rounded-full text-[10px] font-bold tracking-[0.04em] ${
                            isNew
                              ? 'bg-[var(--accent)]/15 text-[var(--accent)]'
                              : 'bg-[var(--border)] text-[var(--text-tertiary)]'
                          }`}
                        >
                          {isNew ? 'новий' : 'повт.'}
                        </span>
                      </div>
                      {phone && (
                        <p className="text-xs text-[var(--text-tertiary)] mt-0.5">{phone}</p>
                      )}
                    </div>
                  </button>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {phone && (
                      <a
                        href={`tel:${phone}`}
                        onClick={e => e.stopPropagation()}
                        className="w-8 h-8 flex items-center justify-center rounded-full bg-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--accent)] hover:text-[var(--accent-on)] transition-colors duration-150"
                      >
                        <Phone size={13} strokeWidth={2} />
                      </a>
                    )}
                    {phone && (
                      <a
                        href={`https://t.me/+${phone.replace(/\D/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={e => e.stopPropagation()}
                        className="w-8 h-8 flex items-center justify-center rounded-full bg-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--accent)] hover:text-[var(--accent-on)] transition-colors duration-150"
                      >
                        <MessageCircle size={13} strokeWidth={2} />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </PopUpModal>
      <ClientDetailSheet client={selectedClient} onClose={() => setSelectedClient(null)} />
    </>
  );
}

export function StatsMosaicWidget() {
  const s = useDashboardStats();
  const [revenueOpen, setRevenueOpen] = useState(false);
  const [clientsOpen, setClientsOpen] = useState(false);

  const now           = getNow();
  const today         = format(now, 'yyyy-MM-dd');
  const weekStart     = format(startOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd');
  const weekEnd       = format(endOfWeek(now,   { weekStartsOn: 1 }), 'yyyy-MM-dd');
  const prevWeekRef   = new Date(now.getTime() - 7 * 86_400_000);
  const prevWeekStart = format(startOfWeek(prevWeekRef, { weekStartsOn: 1 }), 'yyyy-MM-dd');
  const prevWeekEnd   = format(endOfWeek(prevWeekRef,   { weekStartsOn: 1 }), 'yyyy-MM-dd');

  const { bookings: todayBookings }    = useBookings(today, today);
  const { bookings: weekBookings }     = useBookings(weekStart, weekEnd);
  const { bookings: prevWeekBookings } = useBookings(prevWeekStart, prevWeekEnd);
  const { clients }                    = useClients();

  const weekRevenue     = weekBookings.filter(b => b.status === 'completed').reduce((acc, b) => acc + b.total_price, 0);
  const prevWeekRevenue = prevWeekBookings.filter(b => b.status === 'completed').reduce((acc, b) => acc + b.total_price, 0);

  const activeCount = s.todayCount - s.todayCancelled;

  const revTrend = (() => {
    if (s.prevDayRevenue === 0 && s.todayRevenue === 0) return { value: '—', positive: null as null };
    if (s.prevDayRevenue === 0) return { value: 'новий', positive: true };
    const pct = Math.round(((s.todayRevenue - s.prevDayRevenue) / s.prevDayRevenue) * 100);
    return { value: `${pct > 0 ? '+' : ''}${pct}%`, positive: pct >= 0 };
  })();

  return (
    <div className="flex flex-col gap-4">
      <HeroStrip
        count={activeCount}
        confirmedCount={s.todayConfirmed}
        pendingCount={s.todayPending}
        completedCount={s.todayCompleted}
        cancelledCount={s.todayCancelled}
        isLoading={s.isLoading}
        href="/dashboard/bookings"
      />

      <div className="flex flex-col gap-3">
        <FloatStats
          todayRevenue={s.todayRevenue}
          todayCompleted={s.todayCompleted}
          revTrend={revTrend}
          weekClients={s.weekClients}
          weekNewClients={s.weekNewClients}
          isLoading={s.isLoading}
          onRevenueClick={() => setRevenueOpen(true)}
          onClientsClick={() => setClientsOpen(true)}
        />
        <WeekRevenueBar
          weekRevenue={weekRevenue}
          prevWeekRevenue={prevWeekRevenue}
          isLoading={s.isLoading}
        />
      </div>

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
        newPhones={new Set(s.weekNewPhones)}
      />
    </div>
  );
}
