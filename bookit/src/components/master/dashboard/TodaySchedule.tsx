'use client';

import { useState, useMemo, useEffect, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, ChevronRight, Loader2, CheckCircle2, Star, Package, LayoutList, CalendarDays, BarChart2 } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Tooltip } from '@/components/ui/Tooltip';
import { useBookings, type BookingWithServices } from '@/lib/supabase/hooks/useBookings';
import { formatPrice } from '@/components/master/services/types';
import { useMasterContext } from '@/lib/supabase/context';
import { createClient } from '@/lib/supabase/client';
import { confirmBooking, completeBooking } from '@/app/(master)/dashboard/bookings/actions';
import Link from 'next/link';
import { useQueryClient } from '@tanstack/react-query';

type ViewMode = 'today' | 'tomorrow' | 'week';
type DisplayMode = 'list' | 'calendar' | 'stats';

const TABS: { id: ViewMode; label: string }[] = [
  { id: 'today',    label: 'Сьогодні' },
  { id: 'tomorrow', label: 'Завтра'   },
  { id: 'week',     label: 'Тиждень'  },
];

const DISPLAY_MODES: { id: DisplayMode; Icon: typeof LayoutList; label: string }[] = [
  { id: 'list',     Icon: LayoutList,    label: 'Список'  },
  { id: 'calendar', Icon: CalendarDays,  label: 'Тиждень' },
  { id: 'stats',    Icon: BarChart2,     label: 'Стата'   },
];

const STATUS_CONFIG = {
  confirmed: { label: 'Підтверджено', variant: 'success'  as const },
  pending:   { label: 'Очікує',       variant: 'warning'  as const },
  completed: { label: 'Завершено',    variant: 'default'  as const },
  cancelled: { label: 'Скасовано',    variant: 'error'    as const },
  no_show:   { label: 'Не прийшов',   variant: 'error'    as const },
};

const UA_DAYS_SHORT = ['Нд','Пн','Вт','Ср','Чт','Пт','Сб'];

function toISO(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function getDateRange(view: ViewMode): { from: string; to: string } {
  const today = new Date();
  if (view === 'today') {
    const s = toISO(today);
    return { from: s, to: s };
  }
  if (view === 'tomorrow') {
    const t = new Date(today);
    t.setDate(today.getDate() + 1);
    const s = toISO(t);
    return { from: s, to: s };
  }
  const day = today.getDay();
  const monday = new Date(today);
  monday.setDate(today.getDate() - (day === 0 ? 6 : day - 1));
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return { from: toISO(monday), to: toISO(sunday) };
}

function isNextBooking(b: BookingWithServices, list: BookingWithServices[]): boolean {
  const now = new Date();
  const todayStr = toISO(now);
  if (b.date !== todayStr) return false;
  const nowMins = now.getHours() * 60 + now.getMinutes();
  const [h, m] = b.start_time.split(':').map(Number);
  const bMins = h * 60 + m;
  const first = list.find(x => {
    if (x.date !== todayStr) return false;
    const [xh, xm] = x.start_time.split(':').map(Number);
    return xh * 60 + xm >= nowMins;
  });
  return bMins >= nowMins && first?.id === b.id;
}

type StatsPeriod = 'yesterday' | 'week';

interface PeriodStats {
  revenue: number;
  count: number;
  topProducts: { name: string; qty: number }[];
}

function EmptyScheduleWidget() {
  const [period, setPeriod] = useState<StatsPeriod>('yesterday');
  const [stats, setStats] = useState<PeriodStats | null>(null);
  const [loading, setLoading] = useState(false);
  const { masterProfile } = useMasterContext();

  useEffect(() => {
    const masterId = masterProfile?.id;
    if (!masterId) return;
    setLoading(true);
    const today = new Date();
    let from: string, to: string;
    if (period === 'yesterday') {
      const y = new Date(today);
      y.setDate(today.getDate() - 1);
      from = to = toISO(y);
    } else {
      const end = new Date(today);
      end.setDate(today.getDate() - 1);
      const start = new Date(today);
      start.setDate(today.getDate() - 7);
      from = toISO(start);
      to = toISO(end);
    }
    const supabase = createClient();
    supabase
      .from('bookings')
        .select('total_price, booking_products(product_name, quantity)')
        .eq('master_id', masterId)
        .eq('status', 'completed')
        .gte('date', from)
        .lte('date', to)
        .then((res: { data: any[] | null }) => {
          const rows = res.data ?? [];
          const revenue = rows.reduce((s, b) => s + Number(b.total_price ?? 0), 0);
          const count = rows.length;
          const prodMap = new Map<string, number>();
          rows.forEach(b => {
            ((b.booking_products as any[]) ?? []).forEach((p: any) => {
              prodMap.set(p.product_name, (prodMap.get(p.product_name) ?? 0) + (Number(p.quantity) || 1));
            });
          });
          const topProducts = [...prodMap.entries()]
            .map(([name, qty]) => ({ name, qty }))
            .sort((a, b) => b.qty - a.qty)
            .slice(0, 3);
          setStats({ revenue, count, topProducts });
          setLoading(false);
        });
  }, [period, masterProfile?.id]);

  return (
    <div className="px-5 py-4">
      <div className="flex gap-1.5 mb-4">
        {(['yesterday', 'week'] as const).map(p => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              period === p
                ? 'bg-[#789A99] text-white shadow-[0_2px_8px_rgba(120,154,153,0.3)]'
                : 'text-[#6B5750] hover:bg-white/60'
            }`}
          >
            {p === 'yesterday' ? 'Вчора' : 'За тиждень'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center gap-2 py-2">
          <Loader2 size={14} className="text-[#789A99] animate-spin" />
          <span className="text-xs text-[#A8928D]">Завантаження...</span>
        </div>
      ) : stats ? (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#A8928D]">Виручка</span>
            <span className="text-sm font-bold text-[#2C1A14]">{formatPrice(stats.revenue)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#A8928D]">Завершених записів</span>
            <span className="text-sm font-semibold text-[#6B5750]">{stats.count}</span>
          </div>
          {stats.topProducts.length > 0 && (
            <>
              <div className="h-px bg-[#F5E8E3]/60 my-1" />
              <div className="flex items-center gap-1.5 mb-1">
                <Package size={11} className="text-[#A8928D]" />
                <span className="text-[11px] font-semibold text-[#A8928D] uppercase tracking-wide">Топ продажі</span>
              </div>
              {stats.topProducts.map(p => (
                <div key={p.name} className="flex items-center justify-between">
                  <span className="text-xs text-[#6B5750] truncate">{p.name}</span>
                  <span className="text-xs font-semibold text-[#789A99]">{p.qty} шт.</span>
                </div>
              ))}
            </>
          )}
          {stats.count === 0 && stats.topProducts.length === 0 && (
            <p className="text-xs text-[#A8928D] text-center pt-1">Даних немає</p>
          )}
        </div>
      ) : null}
    </div>
  );
}

// ── CalendarView — тижневий стрип з індикаторами записів ──────────────────────

function CalendarView({ bookings }: { bookings: BookingWithServices[] }) {
  const today = new Date();
  const todayISO = toISO(today);
  const day = today.getDay();
  const monday = new Date(today);
  monday.setDate(today.getDate() - (day === 0 ? 6 : day - 1));

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const iso = toISO(d);
    const count = bookings.filter(b => b.date === iso).length;
    return { d, iso, count, isToday: iso === todayISO, dayName: UA_DAYS_SHORT[d.getDay()] };
  });

  const maxCount = Math.max(...days.map(d => d.count), 1);

  return (
    <div className="px-5 py-4">
      <div className="grid grid-cols-7 gap-1.5">
        {days.map(({ d, iso, count, isToday, dayName }) => (
          <div key={iso} className="flex flex-col items-center gap-1.5">
            <span className={`text-[10px] font-medium ${isToday ? 'text-[#789A99]' : 'text-[#A8928D]'}`}>
              {dayName}
            </span>
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-semibold transition-all ${
              isToday
                ? 'bg-[#789A99] text-white shadow-[0_2px_8px_rgba(120,154,153,0.35)]'
                : 'text-[#6B5750] bg-white/40'
            }`}>
              {d.getDate()}
            </div>
            {/* Bar indicator */}
            <div className="w-full flex flex-col items-center gap-0.5">
              {count > 0 ? (
                <>
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: Math.max(3, Math.round((count / maxCount) * 24)) }}
                    transition={{ delay: 0.1, type: 'spring', stiffness: 300, damping: 24 }}
                    className="w-1 rounded-full"
                    style={{ background: isToday ? '#789A99' : 'rgba(120,154,153,0.4)' }}
                  />
                  <span className="text-[10px] font-bold text-[#789A99]">{count}</span>
                </>
              ) : (
                <div className="h-5" />
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── StatsView — компактна статистика за обраний період ───────────────────────

function StatsView({ bookings }: { bookings: BookingWithServices[] }) {
  const completed = bookings.filter(b => b.status === 'completed');
  const revenue = completed.reduce((s, b) => s + b.total_price, 0);
  const avgCheck = completed.length > 0 ? Math.round(revenue / completed.length) : 0;

  const svcMap = new Map<string, number>();
  bookings.forEach(b => {
    const name = b.services[0]?.name;
    if (name) svcMap.set(name, (svcMap.get(name) ?? 0) + 1);
  });
  const topService = [...svcMap.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

  if (bookings.length === 0) {
    return (
      <div className="px-5 py-6 text-center">
        <p className="text-sm text-[#A8928D]">Записів немає за цей період</p>
      </div>
    );
  }

  return (
    <div className="px-5 py-4 grid grid-cols-2 gap-2.5">
      {[
        { label: 'Всього',     value: String(bookings.length),  color: '#789A99' },
        { label: 'Завершено',  value: String(completed.length), color: '#5C9E7A' },
        { label: 'Виручка',    value: formatPrice(revenue),     color: '#2C1A14' },
        { label: 'Сер. чек',   value: avgCheck > 0 ? formatPrice(avgCheck) : '—', color: '#2C1A14' },
      ].map(item => (
        <div key={item.label} className="p-3 rounded-2xl bg-white/50 border border-white/80">
          <p className="text-[10px] text-[#A8928D] uppercase tracking-wide mb-1">{item.label}</p>
          <p className="text-base font-bold" style={{ color: item.color }}>{item.value}</p>
        </div>
      ))}
      {topService && (
        <div className="col-span-2 p-3 rounded-2xl bg-white/50 border border-white/80 flex items-center gap-2">
          <Star size={13} className="text-[#D4935A] shrink-0" />
          <div className="min-w-0">
            <p className="text-[10px] text-[#A8928D] uppercase tracking-wide">Топ послуга</p>
            <p className="text-sm font-semibold text-[#2C1A14] truncate">{topService}</p>
          </div>
        </div>
      )}
    </div>
  );
}

export function TodaySchedule() {
  const [view, setView] = useState<ViewMode>('today');
  const [displayMode, setDisplayMode] = useState<DisplayMode>('list');
  const range = getDateRange(view);
  const { bookings, isLoading } = useBookings(range.from, range.to);
  const [isPending, startTransition] = useTransition();
  const queryClient = useQueryClient();
  const [loadingAction, setLoadingAction] = useState<{ id: string; type: 'confirm' | 'complete' } | null>(null);
  const { masterProfile } = useMasterContext();
  const masterId = masterProfile?.id;

  const invalidateAll = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['bookings', masterId] }),
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats', masterId] }),
      queryClient.invalidateQueries({ queryKey: ['weekly-overview', masterId] }),
      queryClient.invalidateQueries({ queryKey: ['monthly-booking-count', masterId] }),
    ]);
  };

  const handleConfirm = (id: string) => {
    setLoadingAction({ id, type: 'confirm' });
    startTransition(async () => {
      try {
        const { error } = await confirmBooking(id);
        if (!error) {
          await invalidateAll();
        } else {
          console.error('[handleConfirm]', error);
        }
      } finally {
        setLoadingAction(null);
      }
    });
  };

  const handleComplete = (id: string) => {
    setLoadingAction({ id, type: 'complete' });
    startTransition(async () => {
      try {
        const { error } = await completeBooking(id);
        if (!error) {
          await invalidateAll();
        } else {
          console.error('[handleComplete]', error);
        }
      } finally {
        setLoadingAction(null);
      }
    });
  };

  const allBookings: BookingWithServices[] = bookings ?? [];
  const router = useRouter();
  const searchParams = useSearchParams();

  const openBooking = (id: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('bookingId', id);
    router.push(`?${params.toString()}`, { scroll: false });
  };

  const filtered = useMemo(
    () => allBookings.filter(b => b.status !== 'cancelled'),
    [allBookings]
  );

  const grouped = useMemo(() => {
    if (view !== 'week') return null;
    const map = new Map<string, BookingWithServices[]>();
    filtered.forEach(b => {
      const arr = map.get(b.date) ?? [];
      arr.push(b);
      map.set(b.date, arr);
    });
    return map;
  }, [filtered, view]);

  const totalRevenue = filtered
    .filter(b => b.status === 'completed')
    .reduce((s, b) => s + b.total_price, 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.25, type: 'spring', stiffness: 280, damping: 24 }}
      className="bento-card overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-5 pb-3">
        <div className="flex items-center gap-2">
          <Clock size={16} className="text-[#789A99]" />
          <h2 className="heading-serif text-base text-[#2C1A14]">Записи</h2>
          {!isLoading && (
            <span className="text-xs font-semibold text-[#789A99] bg-[#789A99]/10 px-2 py-0.5 rounded-full">
              {filtered.length}
            </span>
          )}
        </div>
        <Link href="/dashboard/bookings" className="text-xs text-[#789A99] font-medium flex items-center gap-0.5 hover:underline">
          Усі <ChevronRight size={13} />
        </Link>
      </div>

      {/* Date tabs */}
      <div className="flex gap-1 px-5 pb-3">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setView(tab.id)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all duration-150 ${
              view === tab.id
                ? 'bg-[#789A99] text-white shadow-[0_2px_8px_rgba(120,154,153,0.35)]'
                : 'text-[#6B5750] hover:bg-white/60'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Display mode toggle (3-segment sliding pill) */}
      <div className="relative flex bg-[#F5E8E3]/60 rounded-2xl p-0.5 gap-0 mx-5 mb-3">
        {DISPLAY_MODES.map(mode => (
          <button
            key={mode.id}
            onClick={() => setDisplayMode(mode.id)}
            className="relative flex-1 flex items-center justify-center gap-1 py-2 z-10 text-[10px] font-semibold transition-colors"
            style={{ color: displayMode === mode.id ? '#2C1A14' : '#A8928D' }}
          >
            {displayMode === mode.id && (
              <motion.div
                layoutId="schedule-display-pill"
                className="absolute inset-0 bg-white rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.06)]"
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              />
            )}
            <mode.Icon size={11} className="relative z-10" />
            <span className="relative z-10">{mode.label}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`${view}-${displayMode}`}
          initial={{ opacity: 0, x: 8 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -8 }}
          transition={{ duration: 0.15 }}
        >
          {isLoading ? (
            <div className="flex items-center justify-center py-8 gap-2">
              <Loader2 size={18} className="text-[#789A99] animate-spin" />
              <span className="text-sm text-[#A8928D]">Завантаження...</span>
            </div>
          ) : displayMode === 'calendar' ? (
            <CalendarView bookings={filtered} />
          ) : displayMode === 'stats' ? (
            <StatsView bookings={filtered} />
          ) : filtered.length === 0 ? (
            view === 'today' ? (
              <EmptyScheduleWidget />
            ) : (
              <div className="flex flex-col items-center py-8 gap-2 text-center px-5">
                <p className="text-sm font-semibold text-[#2C1A14]">
                  {view === 'tomorrow' ? 'Завтра записів немає' : 'На тиждень записів немає'}
                </p>
                <p className="text-xs text-[#A8928D]">Поділіться сторінкою з клієнтами</p>
              </div>
            )
          ) : view === 'week' ? (
            /* ── Week view: grouped by date ── */
            <div className="flex flex-col divide-y divide-[#F5E8E3]/60">
              {[...grouped!.entries()].map(([date, items]) => {
                const d = new Date(date);
                const dayName = UA_DAYS_SHORT[d.getDay()];
                const dateLabel = `${dayName} ${d.getDate()}`;
                return (
                  <div key={date}>
                    <div className="px-5 py-2 bg-white/20">
                      <span className="text-[11px] font-bold text-[#789A99] uppercase tracking-wide">{dateLabel}</span>
                    </div>
                    {items.map(b => {
                      const cfg = STATUS_CONFIG[b.status] ?? STATUS_CONFIG.pending;
                      const svcName = b.services[0]?.name ?? 'Послуга';
                      return (
                        <div key={b.id} onClick={() => openBooking(b.id)} className="flex items-center gap-4 px-5 py-3 hover:bg-white/40 transition-colors cursor-pointer">
                          <div className="w-12 shrink-0 text-right">
                            <p className="text-sm font-semibold tabular-nums text-[#6B5750]">{b.start_time}</p>
                            <p className="text-[10px] text-[#A8928D]">{b.end_time}</p>
                          </div>
                          <div className="w-2 h-2 rounded-full shrink-0 bg-[#E8D5CF]" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-[#2C1A14] truncate">{svcName}</p>
                            <p className="text-xs text-[#6B5750] truncate">{b.client_name}</p>
                          </div>
                          <div className="flex flex-col items-end gap-1 shrink-0">
                            <p className="text-sm font-bold text-[#2C1A14]">{formatPrice(b.total_price)}</p>
                            <Badge variant={cfg.variant}>{cfg.label}</Badge>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          ) : (
            /* ── Today / Tomorrow view: timeline ── */
            <div className="flex flex-col divide-y divide-[#F5E8E3]/60">
              {filtered.map((b, i) => {
                const cfg = STATUS_CONFIG[b.status] ?? STATUS_CONFIG.pending;
                const svcName = b.services[0]?.name ?? 'Послуга';
                const isCurrent = view === 'today' && isNextBooking(b, filtered);
                const isConfirming = loadingAction?.id === b.id && loadingAction?.type === 'confirm';
                const isCompleting = loadingAction?.id === b.id && loadingAction?.type === 'complete';

                return (
                  <div
                    key={b.id}
                    onClick={() => openBooking(b.id)}
                    className={`flex items-center gap-4 px-5 py-4 transition-colors cursor-pointer ${
                      isCurrent
                        ? 'bg-[#789A99]/6'
                        : b.status === 'completed'
                        ? 'opacity-50'
                        : 'hover:bg-white/40'
                    }`}
                  >
                    {/* Час */}
                    <div className="w-12 shrink-0 text-right">
                      <p className={`text-sm font-semibold tabular-nums ${isCurrent ? 'text-[#789A99]' : 'text-[#6B5750]'}`}>
                        {b.start_time}
                      </p>
                      <p className="text-[10px] text-[#A8928D]">{b.end_time}</p>
                    </div>

                    {/* Dot + line */}
                    <div className="flex flex-col items-center self-stretch gap-0.5 shrink-0">
                      <Tooltip
                        position="right"
                        delay={150}
                        content={
                          <div className="flex flex-col gap-0.5 min-w-[140px]">
                            <p className="text-[11px] font-bold text-[#2C1A14]">{svcName}</p>
                            <p className="text-[11px] text-[#6B5750]">{b.client_name}</p>
                            <div className="h-px bg-[#F5E8E3] my-0.5" />
                            <p className="text-[11px] text-[#A8928D]">{b.start_time}–{b.end_time}</p>
                          </div>
                        }
                      >
                        <div className={`w-2.5 h-2.5 rounded-full shrink-0 mt-1.5 cursor-default ${
                          isCurrent
                            ? 'bg-[#789A99] ring-2 ring-[#789A99]/25 ring-offset-1'
                            : b.status === 'completed'
                            ? 'bg-[#A8928D]'
                            : 'bg-[#E8D5CF]'
                        }`} />
                      </Tooltip>
                      {i < filtered.length - 1 && (
                        <div className="w-px flex-1 bg-[#E8D5CF]/70" />
                      )}
                    </div>

                    {/* Інфо */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[#2C1A14] truncate">{svcName}</p>
                      <p className="text-xs text-[#6B5750] truncate">{b.client_name}</p>
                      {(b.status === 'pending' || b.status === 'confirmed') && (
                        <div className="flex items-center gap-1.5 mt-1.5">
                          {b.status === 'pending' && (
                            <button
                              onClick={(e) => { e.stopPropagation(); handleConfirm(b.id); }}
                              disabled={isPending}
                              className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-[#789A99]/10 text-[#789A99] text-[10px] font-semibold hover:bg-[#789A99]/20 transition-colors disabled:opacity-50"
                            >
                              {isConfirming ? <Loader2 size={10} className="animate-spin" /> : <CheckCircle2 size={10} />} Підтвердити
                            </button>
                          )}
                          <button
                            onClick={(e) => { e.stopPropagation(); handleComplete(b.id); }}
                            disabled={isPending}
                            className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-[#5C9E7A]/10 text-[#5C9E7A] text-[10px] font-semibold hover:bg-[#5C9E7A]/20 transition-colors disabled:opacity-50"
                          >
                            {isCompleting ? <Loader2 size={10} className="animate-spin" /> : <Star size={10} />} Завершити
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Ціна + статус */}
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <p className="text-sm font-bold text-[#2C1A14]">{formatPrice(b.total_price)}</p>
                      <Badge variant={cfg.variant}>{cfg.label}</Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Footer */}
      <div className="flex items-center justify-between px-5 py-3.5 border-t border-[#F5E8E3]/60 bg-white/20">
        <span className="text-xs text-[#A8928D]">Виручка (завершені)</span>
        <span className="text-sm font-bold text-[#2C1A14]">{formatPrice(totalRevenue)}</span>
      </div>
    </motion.div>
  );
}
