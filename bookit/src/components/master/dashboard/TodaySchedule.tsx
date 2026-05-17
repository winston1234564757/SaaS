'use client';

import { useState, useMemo, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronRight, Loader2, AlertCircle, CheckCircle2,
  BarChart2, List, TrendingUp, Trophy,
} from 'lucide-react';
import { useBookings, type BookingWithServices } from '@/lib/supabase/hooks/useBookings';
import { formatPrice } from '@/components/master/services/types';
import { useMasterContext } from '@/lib/supabase/context';
import { useToast } from '@/lib/toast/context';
import { BookingActionsDropdown } from '@/components/master/bookings/BookingActionsDropdown';
import { completeBooking } from '@/app/(master)/dashboard/bookings/actions';
import Link from 'next/link';
import { useQueryClient } from '@tanstack/react-query';
import { getNow } from '@/lib/utils/now';
import { parseError } from '@/lib/utils/errors';
import { format, parseISO } from 'date-fns';
import { uk } from 'date-fns/locale';

type ViewMode = 'today' | 'tomorrow' | 'week';
type DisplayMode = 'list' | 'stats';

const DATE_TABS: { id: ViewMode; label: string }[] = [
  { id: 'today',    label: 'Сьогодні' },
  { id: 'tomorrow', label: 'Завтра'   },
  { id: 'week',     label: 'Тиждень'  },
];

const DISPLAY_TABS: { id: DisplayMode; label: string; Icon: React.ComponentType<{ size?: number }> }[] = [
  { id: 'list',  label: 'Список',     Icon: List      },
  { id: 'stats', label: 'Статистика', Icon: TrendingUp },
];

const STATUS_CONFIG = {
  confirmed: { label: 'Підтверджено', variant: 'success'  as const, color: 'var(--success)' },
  pending:   { label: 'Очікує',       variant: 'warning'  as const, color: 'var(--warning)' },
  completed: { label: 'Завершено',    variant: 'default'  as const, color: 'var(--text-tertiary)' },
  cancelled: { label: 'Скасовано',    variant: 'error'    as const, color: 'var(--error)' },
  no_show:   { label: 'Не прийшов',   variant: 'error'    as const, color: 'var(--error)' },
};

function toISO(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function getDateRange(view: ViewMode): { from: string; to: string } {
  const today = getNow();
  if (view === 'today') { const s = toISO(today); return { from: s, to: s }; }
  if (view === 'tomorrow') {
    const t = getNow(); t.setDate(today.getDate() + 1);
    const s = toISO(t); return { from: s, to: s };
  }
  const day = today.getDay();
  const monday = getNow();
  monday.setDate(today.getDate() - (day === 0 ? 6 : day - 1));
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return { from: toISO(monday), to: toISO(sunday) };
}

function isPastDue(b: BookingWithServices): boolean {
  if (b.status !== 'confirmed') return false;
  const now = getNow();
  const [h, m] = b.end_time.split(':').map(Number);
  const endDt = new Date(b.date);
  endDt.setHours(h, m, 0, 0);
  return now > endDt;
}

function isCurrentlyActive(b: BookingWithServices): boolean {
  if (b.status !== 'confirmed') return false;
  const now = getNow();
  const todayStr = toISO(now);
  if (b.date !== todayStr) return false;
  const nowMins = now.getHours() * 60 + now.getMinutes();
  const [sh, sm] = b.start_time.split(':').map(Number);
  const [eh, em] = b.end_time.split(':').map(Number);
  return nowMins >= sh * 60 + sm && nowMins < eh * 60 + em;
}

/* ── Skeleton ─────────────────────────────────────────────── */
function SkeletonRows() {
  return (
    <div className="flex flex-col">
      {[72, 80, 55].map((w, i) => (
        <div
          key={i}
          className="booking-row"
          style={{ borderLeft: '3px solid var(--border)', opacity: 0.6 }}
        >
          <div className="skeleton-shimmer rounded" style={{ height: 13, width: 36 }} />
          <div className="flex flex-col gap-1.5">
            <div className="skeleton-shimmer rounded" style={{ height: 14, width: `${w}%` }} />
            <div className="skeleton-shimmer rounded" style={{ height: 10, width: `${Math.round(w * 0.55)}%` }} />
          </div>
          <div className="skeleton-shimmer rounded" style={{ height: 13, width: 52 }} />
        </div>
      ))}
    </div>
  );
}

/* ── Empty state ──────────────────────────────────────────── */
function EmptyState({ view }: { view: ViewMode }) {
  return (
    <div className="flex flex-col items-center py-10 gap-2 px-5">
      <div
        className="w-10 h-10 rounded-full flex items-center justify-center mb-1"
        style={{ background: 'var(--background-deep)' }}
      >
        <BarChart2 size={17} strokeWidth={1.5} style={{ color: 'var(--text-tertiary)' }} />
      </div>
      <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
        {view === 'today'
          ? 'Записів на сьогодні немає'
          : view === 'tomorrow'
          ? 'Завтра вільно'
          : 'На тиждень записів немає'}
      </p>
      <p className="text-xs text-center" style={{ color: 'var(--text-tertiary)' }}>
        Поділіться сторінкою з клієнтами
      </p>
    </div>
  );
}

/* ── Booking row — editorial with side-stripe status ──────── */
function BookingRow({
  b, index, onComplete, isCompleting, onOpen, onSuccess,
}: {
  b: BookingWithServices;
  index: number;
  onComplete: (id: string) => void;
  isCompleting: boolean;
  onOpen: (id: string) => void;
  onSuccess: () => Promise<void>;
}) {
  const cfg     = STATUS_CONFIG[b.status] ?? STATUS_CONFIG.pending;
  const svcName = b.services[0]?.name ?? 'Послуга';
  const pastDue = isPastDue(b);
  const active  = isCurrentlyActive(b);

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ type: 'spring', stiffness: 220, damping: 32, delay: index * 0.055 }}
    >
      <div
        className={`booking-status-${b.status}`}
        style={{
          background: active
            ? `color-mix(in srgb, ${cfg.color} 6%, transparent)`
            : 'transparent',
          opacity: b.status === 'completed' ? 0.50 : 1,
          borderBottom: '0.5px solid var(--border)',
          cursor: 'pointer',
          transition: 'background 0.15s ease',
        }}
        onClick={() => onOpen(b.id)}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '48px 1fr auto',
            gap: '12px',
            padding: '13px 20px 13px 14px',
            alignItems: 'center',
          }}
        >
          {/* Time column */}
          <div>
            <p
              style={{
                fontFamily: 'var(--font-cormorant, Georgia, serif)',
                fontSize: '1.05rem',
                fontWeight: 500,
                lineHeight: 1,
                color: pastDue
                  ? 'var(--warning)'
                  : active
                  ? cfg.color
                  : 'var(--text-secondary)',
              }}
            >
              {b.start_time}
            </p>
            {active && (
              <p
                style={{
                  fontSize: '8px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  color: cfg.color,
                  marginTop: 2,
                }}
              >
                зараз
              </p>
            )}
          </div>

          {/* Service + client */}
          <div className="min-w-0">
            <p
              className="font-service truncate"
              style={{
                fontSize: '1.02rem',
                fontWeight: 400,
                lineHeight: 1.2,
                color: 'var(--text-primary)',
              }}
            >
              {svcName}
            </p>
            <p
              style={{
                fontSize: '11px',
                marginTop: 2,
                color: 'var(--text-tertiary)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {b.client_name}
            </p>
          </div>

          {/* Price + actions */}
          <div className="flex items-center gap-2 shrink-0">
            <p
              style={{
                fontFamily: 'var(--font-cormorant, Georgia, serif)',
                fontSize: '1rem',
                fontWeight: 500,
                whiteSpace: 'nowrap',
                color: 'var(--text-primary)',
              }}
            >
              {formatPrice(b.total_price)}
            </p>
            <div onClick={e => e.stopPropagation()}>
              <BookingActionsDropdown booking={b} onSuccess={onSuccess} />
            </div>
          </div>
        </div>

        {/* Past-due inline banner */}
        {pastDue && (
          <div
            className="flex items-center justify-between px-5 py-2"
            style={{
              background: 'rgba(200,120,64,0.06)',
              borderTop: '0.5px solid rgba(200,120,64,0.14)',
            }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center gap-1.5" style={{ color: 'var(--warning)' }}>
              <AlertCircle size={11} />
              <span style={{ fontSize: '11px', fontWeight: 600 }}>Очікує завершення</span>
            </div>
            <button
              onClick={() => onComplete(b.id)}
              disabled={isCompleting}
              className="flex items-center gap-1 px-2.5 py-1 rounded-full disabled:opacity-50 transition-opacity"
              style={{
                fontSize: '11px',
                fontWeight: 600,
                background: 'rgba(74,148,96,0.13)',
                color: 'var(--success)',
              }}
            >
              {isCompleting
                ? <Loader2 size={10} className="animate-spin" />
                : <CheckCircle2 size={10} />}
              Завершити
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}

/* ── Stats view ───────────────────────────────────────────── */
function StatsView({ bookings, view }: { bookings: BookingWithServices[]; view: ViewMode }) {
  const completed         = bookings.filter(b => b.status === 'completed');
  const confirmed         = bookings.filter(b => b.status === 'confirmed');
  const pending           = bookings.filter(b => b.status === 'pending');
  const activeBookings    = [...confirmed, ...pending];
  const revenue           = completed.reduce((s, b) => s + b.total_price, 0);
  const potential         = activeBookings.reduce((s, b) => s + b.total_price, 0);
  const allFullyCompleted = bookings.length > 0 && activeBookings.length === 0;
  const conversion        = bookings.length > 0
    ? Math.round((completed.length / bookings.length) * 100)
    : 0;

  const viewLabel = view === 'today' ? 'сьогодні' : view === 'tomorrow' ? 'завтра' : 'за тиждень';

  const topService = useMemo(() => {
    if (view !== 'week' || bookings.length === 0) return null;
    const counts = new Map<string, number>();
    bookings.forEach(b => {
      const svc = b.services[0]?.name;
      if (svc) counts.set(svc, (counts.get(svc) ?? 0) + 1);
    });
    let topName = '';
    let topCount = 0;
    counts.forEach((count, name) => {
      if (count > topCount) { topCount = count; topName = name; }
    });
    return topCount > 0 ? { name: topName, count: topCount } : null;
  }, [bookings, view]);

  const stats = [
    { label: 'Всього',       value: String(bookings.length),   color: 'var(--text-primary)'   },
    { label: 'Підтверджено', value: String(confirmed.length),  color: 'var(--success)'        },
    { label: 'Очікують',     value: String(pending.length),    color: 'var(--warning)'        },
    { label: 'Завершено',    value: String(completed.length),  color: 'var(--text-secondary)' },
    { label: 'Виручка',      value: formatPrice(revenue),      color: 'var(--accent)'         },
    {
      label: 'Потенційно',
      value: allFullyCompleted ? <Trophy size={20} className="mt-1" /> : formatPrice(potential),
      color: allFullyCompleted ? 'var(--success)' : 'var(--text-secondary)',
    },
  ];

  return (
    <div className="px-4 pb-4 flex flex-col gap-3">
      {bookings.length > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="flex items-center gap-4 px-4 py-3.5"
          style={{
            background: 'var(--background-deep)',
            border: '0.5px solid var(--border)',
            borderRadius: 'var(--card-radius)',
          }}
        >
          <div className="relative shrink-0" style={{ width: 52, height: 52 }}>
            <svg viewBox="0 0 52 52" style={{ width: 52, height: 52 }}>
              <circle cx="26" cy="26" r="21" fill="none" stroke="var(--border)" strokeWidth="5" />
              <circle
                cx="26" cy="26" r="21"
                fill="none"
                stroke="var(--accent)"
                strokeWidth="5"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 21}`}
                strokeDashoffset={`${2 * Math.PI * 21 * (1 - conversion / 100)}`}
                style={{ transform: 'rotate(-90deg)', transformOrigin: '26px 26px', transition: 'stroke-dashoffset 0.7s ease' }}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span
                style={{
                  fontFamily: 'var(--font-cormorant, Georgia, serif)',
                  fontSize: '0.95rem',
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                  lineHeight: 1,
                }}
              >
                {conversion}%
              </span>
            </div>
          </div>
          <div>
            <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
              Конверсія {viewLabel}
            </p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
              {completed.length} з {bookings.length} записів завершено
            </p>
          </div>
        </motion.div>
      )}

      {topService && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          className="px-4 py-3 flex items-center justify-between"
          style={{
            background: 'var(--accent-light)',
            border: '0.5px solid var(--border)',
            borderRadius: 'var(--card-radius)',
          }}
        >
          <div>
            <p className="dash-eyebrow mb-1" style={{ color: 'var(--accent)', opacity: 1 }}>
              Топ послуга
            </p>
            <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
              {topService.name}
            </p>
          </div>
          <p
            style={{
              fontFamily: 'var(--font-cormorant, Georgia, serif)',
              fontSize: '1.65rem',
              fontWeight: 700,
              color: 'var(--accent)',
              lineHeight: 1,
            }}
          >
            {topService.count}×
          </p>
        </motion.div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
        {stats.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.48, ease: [0.22, 1, 0.36, 1], delay: i * 0.05 }}
            className="px-4 py-4 flex flex-col justify-between"
            style={{
              background: 'var(--background-deep)',
              border: '0.5px solid var(--border)',
              borderRadius: 'var(--card-radius)',
              minHeight: 76,
            }}
          >
            <p
              style={{
                fontFamily: 'var(--font-cormorant, Georgia, serif)',
                fontSize: typeof s.value !== 'string' ? '1.5rem' : '1.8rem',
                fontWeight: 700,
                color: s.color,
                lineHeight: 1,
              }}
            >
              {s.value}
            </p>
            <p style={{ fontSize: '11px', fontWeight: 500, marginTop: 8, color: 'var(--text-secondary)' }}>
              {s.label === 'Потенційно' && allFullyCompleted ? 'Все завершено!' : s.label}
            </p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

/* ── Display toggle ───────────────────────────────────────── */
function DisplayToggle({ active, onChange }: { active: DisplayMode; onChange: (m: DisplayMode) => void }) {
  return (
    <div className="pill-tabs">
      {DISPLAY_TABS.map(tab => {
        const isActive = tab.id === active;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`pill-tab ${isActive ? 'pill-tab-active' : 'pill-tab-inactive'}`}
          >
            {isActive && (
              <motion.div
                layoutId="schedule-display-pill"
                className="absolute inset-0 rounded-full"
                style={{ background: 'var(--accent)', zIndex: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              />
            )}
            <span style={{ position: 'relative', zIndex: 1 }}><tab.Icon size={10} /></span>
            <span style={{ position: 'relative', zIndex: 1 }}>{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
}

/* ── Main export ─────────────────────────────────────────── */
export function TodaySchedule() {
  const [view, setView]       = useState<ViewMode>('today');
  const [display, setDisplay] = useState<DisplayMode>('list');
  const range                 = getDateRange(view);
  const { bookings, isLoading } = useBookings(range.from, range.to);
  const queryClient           = useQueryClient();
  const { masterProfile }     = useMasterContext();
  const masterId              = masterProfile?.id;
  const { showToast }         = useToast();
  const [completingId, setCompletingId] = useState<string | null>(null);
  const [, startComplete]     = useTransition();

  const router       = useRouter();
  const searchParams = useSearchParams();

  const openBooking = (id: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('bookingId', id);
    router.push(`?${params.toString()}`, { scroll: false });
  };

  const invalidateAll = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['bookings', masterId] }),
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats', masterId] }),
      queryClient.invalidateQueries({ queryKey: ['weekly-overview', masterId] }),
      queryClient.invalidateQueries({ queryKey: ['monthly-booking-count', masterId] }),
    ]);
  };

  const handleQuickComplete = (id: string) => {
    setCompletingId(id);
    startComplete(async () => {
      try {
        const { error } = await completeBooking(id);
        if (error) {
          showToast({ type: 'error', title: 'Помилка', message: parseError(error) });
        } else {
          showToast({ type: 'success', title: 'Запис завершено' });
          await invalidateAll();
        }
      } catch (_err) {
        showToast({ type: 'error', title: 'Помилка', message: 'Не вдалося завершити запис' });
      } finally {
        setCompletingId(null);
      }
    });
  };

  const filtered = useMemo(
    () => (bookings ?? [])
      .filter(b => b.status !== 'cancelled')
      .sort((a, b) => {
        if (a.date !== b.date) return a.date.localeCompare(b.date);
        return a.start_time.localeCompare(b.start_time);
      }),
    [bookings]
  );

  const totalRevenue = filtered
    .filter(b => b.status === 'completed')
    .reduce((s, b) => s + b.total_price, 0);

  return (
    <div className="bento-card overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-5 pb-3">
        <div className="flex items-center gap-2.5">
          <h2
            className="heading-serif"
            style={{ fontSize: '1rem', color: 'var(--text-primary)' }}
          >
            Записи
          </h2>
          <div className="relative h-5 overflow-hidden">
            <AnimatePresence mode="wait">
              {!isLoading && (
                <motion.span
                  key={filtered.length}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ type: 'spring', stiffness: 280, damping: 28 }}
                  className="inline-block text-xs font-bold px-2 py-0.5 rounded-full"
                  style={{ background: 'var(--accent-light)', color: 'var(--accent)' }}
                >
                  {filtered.length}
                </motion.span>
              )}
            </AnimatePresence>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <DisplayToggle active={display} onChange={setDisplay} />
          <Link
            href="/dashboard/bookings"
            className="flex items-center gap-0.5 text-xs font-semibold"
            style={{ color: 'var(--accent)' }}
          >
            Усі <ChevronRight size={13} />
          </Link>
        </div>
      </div>

      {/* Date tabs */}
      <div className="flex gap-1.5 px-5 pb-3">
        {DATE_TABS.map(tab => {
          const isActive = view === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setView(tab.id)}
              className="relative px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors duration-250 cursor-pointer"
              style={{ color: isActive ? 'white' : 'var(--text-tertiary)' }}
            >
              {isActive && (
                <motion.div
                  layoutId="schedule-view-pill"
                  className="absolute inset-0 rounded-full"
                  style={{ background: 'var(--accent)', zIndex: 0 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                />
              )}
              <span className="relative" style={{ zIndex: 1 }}>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`${display}-${view}`}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ type: 'spring', stiffness: 280, damping: 30 }}
        >
          {display === 'list' ? (
            isLoading ? (
              <SkeletonRows />
            ) : filtered.length === 0 ? (
              <EmptyState view={view} />
            ) : view === 'week' ? (
              (() => {
                const groups: Record<string, typeof filtered> = {};
                filtered.forEach(b => { if (!groups[b.date]) groups[b.date] = []; groups[b.date].push(b); });
                let globalIdx = 0;
                return (
                  <div className="flex flex-col">
                    {Object.entries(groups)
                      .sort(([a], [b]) => a.localeCompare(b))
                      .map(([date, dayBookings]) => (
                        <div key={date}>
                          <div className="schedule-date-header">
                            <span
                              style={{
                                fontSize: '10px',
                                fontWeight: 600,
                                textTransform: 'uppercase',
                                letterSpacing: '0.14em',
                                color: 'var(--text-tertiary)',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {format(parseISO(date), 'EEEE d MMMM', { locale: uk })}
                            </span>
                            <div className="h-px flex-1" style={{ background: 'var(--border)' }} />
                          </div>
                          {dayBookings.map(b => {
                            const idx = globalIdx++;
                            return (
                              <BookingRow
                                key={b.id}
                                b={b}
                                index={idx}
                                onComplete={handleQuickComplete}
                                isCompleting={completingId === b.id}
                                onOpen={openBooking}
                                onSuccess={invalidateAll}
                              />
                            );
                          })}
                        </div>
                      ))}
                  </div>
                );
              })()
            ) : (
              <div className="flex flex-col">
                {filtered.map((b, i) => (
                  <BookingRow
                    key={b.id}
                    b={b}
                    index={i}
                    onComplete={handleQuickComplete}
                    isCompleting={completingId === b.id}
                    onOpen={openBooking}
                    onSuccess={invalidateAll}
                  />
                ))}
              </div>
            )
          ) : (
            isLoading ? (
              <SkeletonRows />
            ) : (
              <StatsView bookings={filtered} view={view} />
            )
          )}
        </motion.div>
      </AnimatePresence>

      {/* Footer */}
      <div
        className="flex items-center justify-between px-5 py-3.5"
        style={{ borderTop: '0.5px solid var(--border)', background: 'var(--background-deep)' }}
      >
        <span className="dash-eyebrow" style={{ opacity: 0.55 }}>Виручка (завершені)</span>
        <div className="relative h-6 overflow-hidden flex items-center justify-end" style={{ minWidth: 80 }}>
          <AnimatePresence mode="wait">
            <motion.span
              key={totalRevenue}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -14 }}
              transition={{ type: 'spring', stiffness: 280, damping: 28 }}
              style={{
                fontFamily: 'var(--font-cormorant, Georgia, serif)',
                fontSize: '1.15rem',
                fontWeight: 600,
                color: 'var(--text-primary)',
              }}
            >
              {formatPrice(totalRevenue)}
            </motion.span>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
