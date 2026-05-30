'use client';

import { useState, useMemo, useTransition } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter, useSearchParams } from 'next/navigation';
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
  confirmed: { label: 'Підтверджено', variant: 'success'  as const },
  pending:   { label: 'Очікує',       variant: 'warning'  as const },
  completed: { label: 'Завершено',    variant: 'default'  as const },
  cancelled: { label: 'Скасовано',    variant: 'error'    as const },
  no_show:   { label: 'Не прийшов',   variant: 'error'    as const },
};

const DOT_CLASS: Record<'success' | 'warning' | 'default' | 'error', string> = {
  success: 'bg-[var(--success)] pulse-confirmed',
  warning: 'bg-[var(--warning)] pulse-pending',
  default: 'bg-[var(--text-tertiary)]/60',
  error:   'bg-[var(--error)]',
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

function EmptyState({ view }: { view: ViewMode }) {
  return (
    <div className="flex items-center gap-2 px-4 py-5" style={{ color: 'var(--text-tertiary)' }}>
      <BarChart2 size={14} strokeWidth={1.6} />
      <span className="text-[12px]">
        {view === 'today'    ? 'Записів на сьогодні немає'
        : view === 'tomorrow' ? 'Завтра вільно'
        : 'На тиждень записів немає'}
      </span>
    </div>
  );
}

function BookingRow({
  b, onComplete, isCompleting, onOpen, onSuccess,
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
  const dotCls  = DOT_CLASS[cfg.variant] ?? DOT_CLASS.default;

  return (
    <div
      onClick={() => onOpen(b.id)}
      className={`relative cursor-pointer border-b border-[var(--border)] last:border-b-0
                 hover:bg-[var(--surface-hover)] active:bg-[var(--border)]
                 transition-colors duration-150
                 ${active ? 'bg-[var(--accent)]/[0.04]' : ''}`}
    >
      {active && (
        <div className="absolute left-0 inset-y-0 w-[2px] bg-[var(--accent)] rounded-r pointer-events-none" />
      )}

      <div className="grid grid-cols-[52px_1fr_auto] items-center gap-3 px-4 py-3.5">
        <div className="flex flex-col items-start">
          <p className={`metric-value text-[15px] font-bold leading-none ${
            active  ? 'text-[var(--accent)]' :
            pastDue ? 'text-[var(--warning)]' :
            'text-[var(--text-primary)]'
          }`}>
            {b.start_time}
          </p>
          {active && (
            <p className="text-[8px] font-bold uppercase tracking-[0.1em] text-[var(--accent)] mt-0.5">
              зараз
            </p>
          )}
        </div>

        <div className="min-w-0">
          <p className="font-service text-[17px] leading-tight truncate text-[var(--text-primary)]">
            {svcName}
          </p>
          <p className="text-[14px] text-[var(--text-tertiary)] mt-0.5 truncate">
            {b.client_name}
          </p>
        </div>

        <div className="flex flex-col items-end gap-1.5">
          <div className={`w-[7px] h-[7px] rounded-full flex-shrink-0 ${dotCls}`} />
          <p className="metric-value text-[14px] font-semibold text-[var(--text-secondary)]">
            {formatPrice(b.total_price)}
          </p>
          <div onClick={e => e.stopPropagation()}>
            <BookingActionsDropdown booking={b} onSuccess={onSuccess} />
          </div>
        </div>
      </div>

      {pastDue && (
        <div
          onClick={e => e.stopPropagation()}
          className="flex items-center justify-between px-4 pb-3 gap-3"
        >
          <div className="flex items-center gap-1.5 text-[var(--warning)]">
            <AlertCircle size={11} />
            <span className="text-[12px] font-semibold">Очікує завершення</span>
          </div>
          <button
            onClick={() => onComplete(b.id)}
            disabled={isCompleting}
            className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-[var(--warning)] text-white text-[10px] font-bold tracking-[0.06em] uppercase disabled:opacity-50 transition-opacity"
          >
            {isCompleting
              ? <Loader2 size={10} className="animate-spin" />
              : <CheckCircle2 size={10} />}
            Завершити
          </button>
        </div>
      )}
    </div>
  );
}

function StatTile({
  label, value, colIdx, bookingItems, note,
}: {
  label: string;
  value: React.ReactNode;
  colIdx: number;
  bookingItems: BookingWithServices[] | null;
  note?: string;
}) {
  const [hovered, setHovered] = useState(false);
  const hasContent = (bookingItems !== null && bookingItems.length > 0) || !!note;
  const tooltipPos = colIdx % 3 === 0 ? { left: 0 } : colIdx % 3 === 2 ? { right: 0 } : { left: '50%', transform: 'translateX(-50%)' };
  const shown = bookingItems?.slice(0, 4) ?? [];
  const extra = (bookingItems?.length ?? 0) - 4;

  return (
    <div
      className="stat-box relative"
      onMouseEnter={() => hasContent && setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <p className="metric-value text-[14px] font-semibold text-[var(--text-primary)]">{value}</p>
      <p className="text-[8px] font-bold tracking-[0.12em] uppercase text-[var(--text-tertiary)]">{label}</p>
      {hovered && hasContent && (
        <div
          className="absolute z-50 bottom-full mb-1.5 pointer-events-none rounded-lg px-2.5 py-2"
          style={{
            ...tooltipPos,
            background: 'var(--hero-card-bg)',
            boxShadow: '0 4px 20px rgba(0,0,0,0.18)',
            width: 'max-content',
            maxWidth: '200px',
          }}
        >
          {note ? (
            <p className="text-[11px]" style={{ color: 'color-mix(in srgb, var(--accent-on) 70%, transparent)' }}>{note}</p>
          ) : (
            <div className="flex flex-col gap-1">
              {shown.map(b => (
                <div key={b.id} className="flex items-center justify-between gap-3">
                  <span className="text-[11px] truncate" style={{ color: 'var(--accent-on)', maxWidth: '110px' }}>
                    {b.services[0]?.name ?? 'Послуга'}
                  </span>
                  <span className="font-mono text-[10px] flex-shrink-0" style={{ color: 'color-mix(in srgb, var(--accent-on) 55%, transparent)' }}>
                    {b.start_time}
                  </span>
                </div>
              ))}
              {extra > 0 && (
                <p className="text-[10px] mt-0.5" style={{ color: 'color-mix(in srgb, var(--accent-on) 40%, transparent)' }}>+{extra} більше</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function StatsView({ bookings, view }: { bookings: BookingWithServices[]; view: ViewMode }) {
  const completed      = bookings.filter(b => b.status === 'completed');
  const confirmed      = bookings.filter(b => b.status === 'confirmed');
  const pending        = bookings.filter(b => b.status === 'pending');
  const activeBookings = [...confirmed, ...pending];
  const revenue        = completed.reduce((s, b) => s + b.total_price, 0);
  const potential      = activeBookings.reduce((s, b) => s + b.total_price, 0);
  const allDone        = bookings.length > 0 && activeBookings.length === 0;
  const conversion     = bookings.length > 0
    ? Math.round((completed.length / bookings.length) * 100) : 0;
  const viewLabel = view === 'today' ? 'сьогодні' : view === 'tomorrow' ? 'завтра' : 'за тиждень';

  const topService = useMemo(() => {
    if (view !== 'week' || bookings.length === 0) return null;
    const counts = new Map<string, number>();
    bookings.forEach(b => {
      const svc = b.services[0]?.name;
      if (svc) counts.set(svc, (counts.get(svc) ?? 0) + 1);
    });
    let topName = ''; let topCount = 0;
    counts.forEach((count, name) => { if (count > topCount) { topCount = count; topName = name; } });
    return topCount > 0 ? { name: topName, count: topCount } : null;
  }, [bookings, view]);

  const stats: Array<{ label: string; value: React.ReactNode; bookingItems: BookingWithServices[] | null; note?: string }> = [
    { label: 'Всього',       value: String(bookings.length),  bookingItems: bookings  },
    { label: 'Підтверджено', value: String(confirmed.length), bookingItems: confirmed },
    { label: 'Очікують',     value: String(pending.length),   bookingItems: pending   },
    { label: 'Завершено',    value: String(completed.length), bookingItems: completed },
    { label: 'Виручка',      value: formatPrice(revenue),     bookingItems: null, note: `від ${completed.length} завершених записів` },
    {
      label: allDone ? 'Все!' : 'Потенційно',
      value: allDone ? <Trophy size={18} strokeWidth={1.5} className="text-[var(--accent)]" /> : formatPrice(potential),
      bookingItems: null,
      note: allDone ? 'Усі записи завершено!' : `від ${activeBookings.length} активних записів`,
    },
  ];

  return (
    <div className="p-4 flex flex-col gap-4">
      {bookings.length > 0 && (
        <div className="flex items-center gap-4">
          <div className="relative flex-shrink-0 w-[52px] h-[52px]">
            <svg viewBox="0 0 52 52" width={52} height={52}>
              <circle cx="26" cy="26" r="21" fill="none" strokeWidth="5"
                stroke="var(--border)" />
              <circle cx="26" cy="26" r="21" fill="none" strokeWidth="5"
                strokeLinecap="round"
                stroke="var(--accent)"
                strokeDasharray={`${2 * Math.PI * 21}`}
                strokeDashoffset={`${2 * Math.PI * 21 * (1 - conversion / 100)}`}
                style={{ transform: 'rotate(-90deg)', transformOrigin: '26px 26px' }}
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center metric-value text-[13px] font-bold text-[var(--text-primary)]">
              {conversion}%
            </span>
          </div>
          <div>
            <p className="text-[14px] font-semibold text-[var(--text-primary)]">Конверсія {viewLabel}</p>
            <p className="text-[12px] text-[var(--text-tertiary)] mt-0.5">
              {completed.length} з {bookings.length} записів завершено
            </p>
          </div>
        </div>
      )}

      {topService && (
        <div className="flex items-center justify-between py-2.5 border-t border-[var(--border)]">
          <div>
            <p className="text-[10px] font-bold tracking-[0.16em] uppercase text-[var(--text-tertiary)]">Топ послуга</p>
            <p className="font-service text-[15px] text-[var(--text-primary)] mt-0.5">{topService.name}</p>
          </div>
          <p className="metric-value text-[15px] font-semibold text-[var(--accent)]">{topService.count}×</p>
        </div>
      )}

      <div className="grid grid-cols-3 gap-1.5">
        {stats.map((s, idx) => (
          <StatTile
            key={s.label}
            label={s.label}
            value={s.value}
            colIdx={idx}
            bookingItems={s.bookingItems}
            note={s.note}
          />
        ))}
      </div>
    </div>
  );
}

function DisplayToggle({ active, onChange }: { active: DisplayMode; onChange: (m: DisplayMode) => void }) {
  return (
    <div className="flex items-center gap-0.5 p-0.5 rounded-full bg-[var(--border)]">
      {DISPLAY_TABS.map(tab => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className="relative flex items-center gap-1 px-2.5 py-1.5 rounded-full text-[12px] font-semibold active:scale-[0.95] transition-transform duration-100"
          style={{ color: tab.id === active ? 'var(--accent-on)' : 'var(--text-tertiary)' }}
        >
          {tab.id === active && (
            <motion.div
              layoutId="schedule-display-tab"
              className="absolute inset-0 rounded-full"
              style={{ background: 'var(--hero-card-bg)' }}
              transition={{ type: 'spring' as const, duration: 0.35, bounce: 0 }}
            />
          )}
          <span className="relative z-10 flex items-center gap-1">
            <tab.Icon size={10} />
            <span className="hidden sm:inline">{tab.label}</span>
          </span>
        </button>
      ))}
    </div>
  );
}

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
    <div className="bento-card">
      {/* Header — title + link */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <div className="flex items-center gap-2">
          <h2 className="heading-serif text-base font-medium text-[var(--text-primary)]">Записи</h2>
          {!isLoading && (
            <span className="px-2 py-0.5 rounded-full bg-[var(--border)] metric-value text-[12px] font-bold text-[var(--text-tertiary)]">
              {filtered.length}
            </span>
          )}
        </div>
        <Link
          href="/dashboard/bookings"
          className="flex items-center gap-0.5 text-[12px] font-semibold text-[var(--text-tertiary)] hover:text-[var(--accent)] transition-colors"
        >
          Усі <ChevronRight size={13} />
        </Link>
      </div>

      {/* Controls — date tabs + display toggle in one row */}
      <div className="flex items-center justify-between gap-2 px-4 pb-3 min-w-0">
        <div className="flex items-center gap-0.5 p-0.5 rounded-full flex-shrink-0" style={{ background: 'var(--border)' }}>
          {DATE_TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setView(tab.id)}
              className="relative px-2.5 py-1.5 rounded-full whitespace-nowrap text-[12px] font-semibold active:scale-[0.97] transition-transform duration-100"
              style={{ color: view === tab.id ? 'var(--accent-on)' : 'var(--text-tertiary)' }}
            >
              {view === tab.id && (
                <motion.div
                  layoutId="schedule-date-tab"
                  className="absolute inset-0 rounded-full"
                  style={{ background: 'var(--accent)' }}
                  transition={{ type: 'spring' as const, duration: 0.35, bounce: 0 }}
                />
              )}
              <span className="relative z-10">{tab.label}</span>
            </button>
          ))}
        </div>
        <DisplayToggle active={display} onChange={setDisplay} />
      </div>

      {/* Content — AnimatePresence for smooth tab/mode switching */}
      <div className="relative overflow-hidden w-full">
        <AnimatePresence mode="popLayout">
          <motion.div
            key={`${display}-${view}`}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1] }}
            className="w-full"
          >
            {display === 'list' ? (
              isLoading ? (
                <div className="flex flex-col gap-2 px-4 pb-4">
                  {[0, 1, 2].map(i => (
                    <div key={i} className="skeleton-shimmer h-14 rounded-xl" />
                  ))}
                </div>
              ) : filtered.length === 0 ? (
                <EmptyState view={view} />
              ) : view === 'week' ? (
                (() => {
                  const groups: Record<string, typeof filtered> = {};
                  filtered.forEach(b => { if (!groups[b.date]) groups[b.date] = []; groups[b.date].push(b); });
                  let globalIdx = 0;
                  return (
                    <div>
                      {Object.entries(groups)
                        .sort(([a], [b]) => a.localeCompare(b))
                        .map(([date, dayBookings]) => (
                          <div key={date}>
                            <div className="flex items-center gap-3 px-4 py-2">
                              <span className="text-[12px] font-bold tracking-[0.14em] uppercase text-[var(--text-tertiary)] whitespace-nowrap">
                                {format(parseISO(date), 'EEEE d MMMM', { locale: uk })}
                              </span>
                              <div className="flex-1 h-px bg-[var(--border)]" />
                            </div>
                            {dayBookings.map(b => {
                              const idx = globalIdx++;
                              return (
                                <BookingRow
                                  key={b.id} b={b} index={idx}
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
                <div>
                  {filtered.map((b, i) => (
                    <BookingRow
                      key={b.id} b={b} index={i}
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
                <div className="skeleton-shimmer h-40 m-4 rounded-xl" />
              ) : (
                <StatsView bookings={filtered} view={view} />
              )
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-4 py-3 border-t border-[var(--border)]">
        <span className="text-[12px] text-[var(--text-tertiary)]">Виручка (завершені)</span>
        <span className="metric-value text-[14px] font-semibold text-[var(--text-primary)]">
          {formatPrice(totalRevenue)}
        </span>
      </div>
    </div>
  );
}
