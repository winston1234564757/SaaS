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
import { PopUpModal } from '@/components/ui/PopUpModal';
import { ClientDetailSheet } from '@/components/master/clients/ClientDetailSheet';
import { getNow } from '@/lib/utils/now';
import { pluralUk } from '@/lib/utils/pluralUk';

function fmt(n: number) {
  if (n >= 1000) return (n / 1000).toFixed(1).replace('.0', '') + 'k ₴';
  return n.toLocaleString('uk-UA') + ' ₴';
}

function Sk({ style }: { style?: React.CSSProperties }) {
  return (
    <div
      className="skeleton-shimmer rounded-md"
      style={style}
    />
  );
}

function TrendChip({ value, positive }: { value: string; positive: boolean | null }) {
  if (positive === null || value === '—') {
    return (
      <span className="inline-flex items-center" style={{ color: 'var(--text-tertiary)', opacity: 0.4 }}>
        <Minus size={9} strokeWidth={2} />
      </span>
    );
  }
  return (
    <span
      className="inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full"
      style={{
        background: positive ? 'rgba(74,148,96,0.12)' : 'rgba(176,56,80,0.10)',
        color: positive ? 'var(--success)' : 'var(--error)',
      }}
    >
      {positive ? <ArrowUp size={8} strokeWidth={2.5} /> : <ArrowDown size={8} strokeWidth={2.5} />}
      {value}
    </span>
  );
}

/* ─── Hero Strip — full-bleed on mobile, card on desktop ────── */
function HeroStrip({
  value, statusLine, cancelledCount, isLoading, href,
}: {
  value: string; statusLine: string | null;
  cancelledCount: number; isLoading: boolean; href: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 180, damping: 34 }}
    >
      <Link href={href} className="block">
        <div
          className="relative overflow-hidden -mx-4 md:mx-0 rounded-none md:rounded-xl active:opacity-90 transition-opacity"
          style={{
            background: 'var(--hero-card-bg)',
            boxShadow: 'var(--hero-card-shadow)',
            padding: '24px 24px 22px',
          }}
        >
          {/* Watermark */}
          {!isLoading && (
            <div
              aria-hidden
              className="absolute right-3 -top-4 select-none pointer-events-none leading-none"
              style={{
                fontFamily: 'var(--font-cormorant, Georgia, serif)',
                fontSize: 'clamp(7rem, 24vw, 11rem)',
                fontWeight: 700,
                color: 'var(--accent-on)',
                opacity: 0.05,
                letterSpacing: '-0.04em',
              }}
            >
              {value}
            </div>
          )}

          {/* Eyebrow */}
          <p
            className="text-[9px] font-bold uppercase tracking-[0.26em] leading-none mb-3"
            style={{ color: 'var(--accent-on)', opacity: 0.5 }}
          >
            Записів сьогодні
          </p>

          {/* Number */}
          {isLoading ? (
            <div
              className="rounded-lg mb-3"
              style={{ height: '4rem', width: '3rem', background: 'rgba(255,255,255,0.08)' }}
            />
          ) : (
            <p
              className="leading-none mb-3"
              style={{
                fontFamily: 'var(--font-cormorant, Georgia, serif)',
                fontSize: 'clamp(4.5rem, 16vw, 7rem)',
                fontWeight: 600,
                letterSpacing: '-0.03em',
                color: 'var(--accent-on)',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {value}
            </p>
          )}

          {/* Status */}
          {isLoading ? (
            <div className="rounded-md" style={{ height: 10, width: 160, background: 'rgba(255,255,255,0.08)' }} />
          ) : (
            <div className="min-h-[14px]">
              {statusLine && (
                <p className="text-[10px] leading-tight" style={{ color: 'var(--accent-on)', opacity: 0.55 }}>
                  {statusLine}
                  {cancelledCount > 0 && <span style={{ opacity: 0.6 }}> · {cancelledCount} скасовано</span>}
                </p>
              )}
            </div>
          )}
        </div>
      </Link>
    </motion.div>
  );
}

/* ─── Float Stats — no container, typography on background ─── */
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
    <motion.div
      className="grid grid-cols-2"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 180, damping: 34, delay: 0.08 }}
    >
      {/* Revenue */}
      <button
        type="button"
        onClick={onRevenueClick}
        className="py-5 text-left active:opacity-60 transition-opacity"
        style={{ paddingRight: '16px', borderRight: '0.5px solid var(--border)' }}
      >
        <p
          className="text-[9px] font-bold uppercase tracking-[0.20em] leading-none mb-2"
          style={{ color: 'var(--text-tertiary)' }}
        >
          Виручка
        </p>
        {isLoading ? (
          <Sk style={{ height: '2.1rem', width: '5.5rem', marginBottom: 6 }} />
        ) : (
          <p
            className="leading-none mb-1.5"
            style={{
              fontFamily: 'var(--font-cormorant, Georgia, serif)',
              fontSize: '2.1rem',
              fontWeight: 600,
              letterSpacing: '-0.02em',
              fontVariantNumeric: 'tabular-nums',
              color: 'var(--text-primary)',
            }}
          >
            {fmt(todayRevenue)}
          </p>
        )}
        <div className="flex items-center gap-1.5 flex-wrap">
          <TrendChip value={revTrend.value} positive={revTrend.positive} />
          {!isLoading && (
            <p className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>
              {todayCompleted > 0 ? `${todayCompleted} завершених` : 'ще немає'}
            </p>
          )}
        </div>
      </button>

      {/* Clients */}
      <button
        type="button"
        onClick={onClientsClick}
        className="py-5 text-left active:opacity-60 transition-opacity"
        style={{ paddingLeft: '16px' }}
      >
        <p
          className="text-[9px] font-bold uppercase tracking-[0.20em] leading-none mb-2"
          style={{ color: 'var(--text-tertiary)' }}
        >
          Клієнти тижня
        </p>
        {isLoading ? (
          <Sk style={{ height: '2.1rem', width: '3rem', marginBottom: 6 }} />
        ) : (
          <p
            className="leading-none mb-1.5"
            style={{
              fontFamily: 'var(--font-cormorant, Georgia, serif)',
              fontSize: '2.1rem',
              fontWeight: 600,
              letterSpacing: '-0.02em',
              fontVariantNumeric: 'tabular-nums',
              color: 'var(--text-primary)',
            }}
          >
            {weekClients}
          </p>
        )}
        <div className="flex items-center gap-1.5 flex-wrap">
          <TrendChip
            value={weekNewClients > 0 ? `+${weekNewClients}` : '—'}
            positive={weekNewClients > 0 ? true : null}
          />
          {!isLoading && (
            <p className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>
              {weekNewClients > 0 ? 'нових' : 'цього тижня'}
            </p>
          )}
        </div>
      </button>
    </motion.div>
  );
}

/* ─── Week Revenue Bar ──────────────────────────────────────── */
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
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 180, damping: 34, delay: 0.14 }}
      style={{ borderTop: '0.5px solid var(--border)', paddingTop: '20px', paddingBottom: '4px' }}
    >
      <div className="flex items-start justify-between mb-2">
        <p
          className="text-[9px] font-bold uppercase tracking-[0.20em]"
          style={{ color: 'var(--text-tertiary)' }}
        >
          Виручка за тиждень
        </p>
        <TrendChip value={trend.value} positive={trend.positive} />
      </div>

      {isLoading ? (
        <Sk style={{ height: '1.75rem', width: '8rem', marginBottom: 12 }} />
      ) : (
        <p
          className="leading-none mb-3"
          style={{
            fontFamily: 'var(--font-cormorant, Georgia, serif)',
            fontSize: '1.7rem',
            fontWeight: 600,
            letterSpacing: '-0.02em',
            fontVariantNumeric: 'tabular-nums',
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
            style={{ height: '1.5px', background: 'var(--border)' }}
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
              <p className="text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: 'var(--text-tertiary)' }}>
                Разом
              </p>
              <p style={{
                fontFamily: 'var(--font-cormorant, Georgia, serif)',
                fontSize: '1.75rem',
                fontWeight: 600,
                color: 'var(--success)',
              }}>
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
                        className="p-2 rounded-full"
                        style={{ background: 'var(--background-deep)' }}
                        onClick={e => e.stopPropagation()}
                      >
                        <span style={{ color: 'var(--success)' }}><Phone size={14} strokeWidth={2} /></span>
                      </a>
                    )}
                    {phone && (
                      <a
                        href={`https://t.me/+${phone.replace(/\D/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-full"
                        style={{ background: 'var(--background-deep)' }}
                        onClick={e => e.stopPropagation()}
                      >
                        <span style={{ color: 'var(--info, #5080A0)' }}><MessageCircle size={14} strokeWidth={2} /></span>
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

/* ─── Main Export ───────────────────────────────────────────── */
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

  const heroStatusLine = (() => {
    const parts: string[] = [];
    if (s.todayPending > 0)   parts.push(`${s.todayPending} ${pluralUk(s.todayPending, 'очікує', 'очікують', 'очікують')}`);
    if (s.todayConfirmed > 0) parts.push(`${s.todayConfirmed} підтверджено`);
    if (s.todayCompleted > 0) parts.push(`${s.todayCompleted} завершено`);
    return parts.length > 0 ? parts.join(' · ') : null;
  })();

  const revTrend = (() => {
    if (s.prevDayRevenue === 0 && s.todayRevenue === 0) return { value: '—', positive: null as null };
    if (s.prevDayRevenue === 0) return { value: 'новий', positive: true };
    const pct = Math.round(((s.todayRevenue - s.prevDayRevenue) / s.prevDayRevenue) * 100);
    return { value: `${pct > 0 ? '+' : ''}${pct}%`, positive: pct >= 0 };
  })();

  return (
    <div>
      {/* Zone 2 — Hero Strip */}
      <HeroStrip
        value={String(activeCount)}
        statusLine={heroStatusLine}
        cancelledCount={s.todayCancelled}
        isLoading={s.isLoading}
        href="/dashboard/bookings"
      />

      {/* Zone 3 — Float Stats + Week Revenue (no container) */}
      <div className="px-1">
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
