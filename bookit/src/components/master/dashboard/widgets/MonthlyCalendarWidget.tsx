'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, X, Clock } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  format, startOfMonth, endOfMonth,
  startOfWeek, endOfWeek, eachDayOfInterval,
  isSameMonth, isToday, isSameDay,
} from 'date-fns';
import { uk } from 'date-fns/locale';
import { useBookings, type BookingWithServices } from '@/lib/supabase/hooks/useBookings';
import { formatPrice } from '@/components/master/services/types';

const STATUS_DOT: Record<string, string> = {
  confirmed: 'var(--success)',
  pending:   'var(--warning)',
  completed: 'var(--text-tertiary)',
  cancelled: 'var(--error)',
  no_show:   'var(--error)',
};

const UA_DAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд'];

function toISO(d: Date) { return format(d, 'yyyy-MM-dd'); }

/* ─── Skeleton ───────────────────────────────────────────── */
function SkeletonCalendar() {
  return (
    <div className="grid grid-cols-7 gap-1 px-4 pb-4">
      {Array.from({ length: 14 }).map((_, i) => (
        <div key={i} className="skeleton-shimmer rounded-xl" style={{ height: 44 }} />
      ))}
    </div>
  );
}

/* ─── DayCard ────────────────────────────────────────────── */
interface DayCardProps {
  day: Date;
  bookings: BookingWithServices[];
  isCurrentMonth: boolean;
  isSelected: boolean;
  onClick: () => void;
}

function DayCard({ day, bookings, isCurrentMonth, isSelected, onClick }: DayCardProps) {
  const today        = isToday(day);
  const count        = bookings.length;
  const hasConfirmed = bookings.some(b => b.status === 'confirmed');
  const hasPending   = bookings.some(b => b.status === 'pending');
  const hasCompleted = bookings.some(b => b.status === 'completed');

  return (
    <motion.button
      onClick={onClick}
      disabled={!isCurrentMonth}
      whileTap={isCurrentMonth ? { scale: 0.88 } : {}}
      animate={{ scale: isSelected ? 1.06 : 1 }}
      transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
      className="relative flex flex-col items-center gap-1 py-2.5 px-1 rounded-2xl"
      style={{
        background: isSelected ? 'var(--accent)' : today ? 'var(--accent-light)' : 'transparent',
        opacity: isCurrentMonth ? 1 : 0.25,
        cursor: isCurrentMonth ? 'pointer' : 'default',
      }}
    >
      <span
        className="text-[13px] font-semibold leading-none"
        style={{
          color: isSelected ? 'white' : today ? 'var(--accent)' : 'var(--text-primary)',
        }}
      >
        {format(day, 'd')}
      </span>

      {count > 0 && (
        <div className="flex gap-[3px] items-center">
          {hasConfirmed && (
            <div className="w-[5px] h-[5px] rounded-full"
              style={{ background: isSelected ? 'rgba(255,255,255,0.8)' : 'var(--success)' }} />
          )}
          {hasPending && (
            <div className="w-[5px] h-[5px] rounded-full"
              style={{ background: isSelected ? 'rgba(255,255,255,0.8)' : 'var(--warning)' }} />
          )}
          {hasCompleted && !hasConfirmed && !hasPending && (
            <div className="w-[5px] h-[5px] rounded-full"
              style={{ background: isSelected ? 'rgba(255,255,255,0.5)' : 'var(--text-tertiary)' }} />
          )}
        </div>
      )}

      {count > 0 && (
        <span
          className="absolute -top-1 right-0 min-w-[16px] h-4 rounded-full text-[9px] font-bold flex items-center justify-center px-1"
          style={{ background: isSelected ? 'rgba(0,0,0,0.28)' : 'var(--accent)', color: 'white' }}
        >
          {count}
        </span>
      )}
    </motion.button>
  );
}

/* ─── BookingRow ─────────────────────────────────────────── */
function BookingRow({
  b, index, onOpen,
}: { b: BookingWithServices; index: number; onOpen: (id: string) => void }) {
  const svc      = b.services[0]?.name ?? 'Послуга';
  const dotColor = STATUS_DOT[b.status] ?? 'var(--text-tertiary)';

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1], delay: index * 0.055 }}
      className="flex items-center gap-3 py-3 px-4 cursor-pointer"
      style={{ borderBottom: '0.5px solid var(--border)' }}
      onClick={() => onOpen(b.id)}
      onMouseEnter={e => (e.currentTarget.style.background = 'var(--background-deep)')}
      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
    >
      <div className="w-1 h-10 rounded-full shrink-0" style={{ background: dotColor }} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{svc}</p>
        <p className="text-xs truncate" style={{ color: 'var(--text-tertiary)' }}>{b.client_name}</p>
      </div>
      <div className="text-right shrink-0">
        <p className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>{b.start_time}</p>
        <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{formatPrice(b.total_price)}</p>
      </div>
    </motion.div>
  );
}

/* ─── ViewToggle ─────────────────────────────────────────── */
function ViewToggle({
  isExpanded, onChange,
}: { isExpanded: boolean; onChange: (v: boolean) => void }) {
  const opts = [
    { value: false, label: 'Тиждень' },
    { value: true,  label: 'Місяць'  },
  ] as const;

  return (
    <div
      className="flex gap-0.5 p-0.5 rounded-xl"
      style={{
        background: 'var(--background-deep)',
        border: '0.5px solid var(--border-strong)',
      }}
    >
      {opts.map(opt => {
        const active = opt.value === isExpanded;
        return (
          <button
            key={String(opt.value)}
            onClick={() => onChange(opt.value)}
            className="relative px-3 py-1.5 rounded-[10px] text-[11px] font-semibold"
            style={{ color: active ? 'var(--text-primary)' : 'var(--text-tertiary)', zIndex: 1 }}
          >
            {active && (
              <motion.div
                layoutId="cal-view-pill"
                className="absolute inset-0 rounded-[10px]"
                style={{
                  background: 'var(--surface)',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.10)',
                  zIndex: 0,
                }}
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              />
            )}
            <span style={{ position: 'relative', zIndex: 1 }}>{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
}

/* ─── Main ───────────────────────────────────────────────── */
export function MonthlyCalendarWidget() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [isExpanded, setIsExpanded] = useState(true);
  const router      = useRouter();
  const searchParams = useSearchParams();

  /* Navigation key — changes on month nav or toggle */
  const animKey = isExpanded
    ? `month-${format(currentDate, 'yyyy-MM')}`
    : 'week';

  const openBooking = (id: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('bookingId', id);
    router.push(`?${params.toString()}`, { scroll: false });
  };

  const monthStart = startOfMonth(currentDate);
  const monthEnd   = endOfMonth(currentDate);

  const currentWeekStart = useMemo(
    () => startOfWeek(new Date(), { weekStartsOn: 1 }), []
  );
  const currentWeekEnd = useMemo(
    () => endOfWeek(new Date(), { weekStartsOn: 1 }), []
  );

  const from = isExpanded
    ? toISO(startOfWeek(monthStart, { weekStartsOn: 1 }))
    : toISO(currentWeekStart);
  const to = isExpanded
    ? toISO(endOfWeek(monthEnd, { weekStartsOn: 1 }))
    : toISO(currentWeekEnd);

  const { bookings, isLoading } = useBookings(from, to);

  const allDays = useMemo(() => {
    if (!isExpanded) {
      return eachDayOfInterval({ start: currentWeekStart, end: currentWeekEnd });
    }
    return eachDayOfInterval({
      start: startOfWeek(monthStart, { weekStartsOn: 1 }),
      end:   endOfWeek(monthEnd,     { weekStartsOn: 1 }),
    });
  }, [isExpanded, monthStart, monthEnd, currentWeekStart, currentWeekEnd]);

  const bookingsByDay = useMemo(() => {
    const map = new Map<string, BookingWithServices[]>();
    (bookings ?? []).forEach(b => {
      if (b.status === 'cancelled') return;
      const arr = map.get(b.date) ?? [];
      arr.push(b);
      map.set(b.date, arr);
    });
    return map;
  }, [bookings]);

  const selectedBookings = selectedDay
    ? (bookingsByDay.get(toISO(selectedDay)) ?? [])
    : [];

  const totalCount = useMemo(
    () => (bookings ?? []).filter(b => b.status !== 'cancelled').length,
    [bookings]
  );

  /* ── Height animation ─────────────────────────────────── */
  const gridRef    = useRef<HTMLDivElement>(null);
  const [calHeight, setCalHeight] = useState<number>(() => {
    // Initial estimate: 1 row (week) + pt-2 (8px) + pb-4 (16px)
    return 44 + 24;
  });

  useEffect(() => {
    if (!gridRef.current || isLoading) return;
    const h = gridRef.current.scrollHeight;
    if (h > 0) setCalHeight(h + 20); // Add a bit of padding safety
  }, [allDays.length, isLoading, isExpanded]);

  /* ── Content crossfade on key change ─────────────────── */
  const [gridVisible, setGridVisible] = useState(true);
  const prevKeyRef = useRef(animKey);

  useEffect(() => {
    if (prevKeyRef.current === animKey) return;
    prevKeyRef.current = animKey;

    /* Fade out → swap content (already happened in React render) → fade in */
    setGridVisible(false);
    const t = setTimeout(() => setGridVisible(true), 55);
    return () => clearTimeout(t);
  }, [animKey]);

  /* ── Handle toggle ────────────────────────────────────── */
  const handleToggle = (expanded: boolean) => {
    setIsExpanded(expanded);
    setSelectedDay(null);
  };

  return (
    <div className="widget-card w-full overflow-hidden flex flex-col bg-white/70 backdrop-blur-2xl">

      {/* ── Header row: title + toggle ──────────────────── */}
      <div className="flex items-center justify-between px-5 pt-5 pb-3">
        <div>
          <h2
            className="text-base font-semibold heading-serif"
            style={{ color: 'var(--text-primary)' }}
          >
            Календар записів
          </h2>
          <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
            {totalCount} {isExpanded ? 'записів за місяць' : 'записів цього тижня'}
          </p>
        </div>

        <ViewToggle isExpanded={isExpanded} onChange={handleToggle} />
      </div>

      {/* ── Month navigation row (only when expanded) ───── */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            key="month-nav"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="flex items-center justify-center gap-2 px-5 pb-3">
              <button
                onClick={() => {
                  setCurrentDate(d => { const n = new Date(d); n.setMonth(d.getMonth() - 1); return n; });
                  setSelectedDay(null);
                }}
                className="w-7 h-7 rounded-xl flex items-center justify-center transition-colors"
                style={{ color: 'var(--text-tertiary)' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--background-deep)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <ChevronLeft size={15} />
              </button>

              <span
                className="text-[13px] font-semibold min-w-[120px] text-center capitalize"
                style={{ color: 'var(--text-primary)' }}
              >
                {format(currentDate, 'LLLL yyyy', { locale: uk })}
              </span>

              <button
                onClick={() => {
                  setCurrentDate(d => { const n = new Date(d); n.setMonth(d.getMonth() + 1); return n; });
                  setSelectedDay(null);
                }}
                className="w-7 h-7 rounded-xl flex items-center justify-center transition-colors"
                style={{ color: 'var(--text-tertiary)' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--background-deep)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <ChevronRight size={15} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Day-of-week labels ──────────────────────────── */}
      <div className="grid grid-cols-7 px-4 mb-1">
        {UA_DAYS.map(d => (
          <div
            key={d}
            className="text-center text-[10px] font-bold uppercase tracking-wider py-1"
            style={{ color: 'var(--text-tertiary)' }}
          >
            {d}
          </div>
        ))}
      </div>

      {/* ── Calendar grid ───────────────────────────────── */}
      {isLoading ? (
        <SkeletonCalendar />
      ) : (
        /*
         * Height-animated outer wrapper: framer-motion drives the height
         * from the measured grid content. overflow-hidden clips the grid
         * during expansion/collapse so rows reveal/hide cleanly.
         *
         * Content crossfade: CSS opacity transition (55ms blank ≈ 3 frames,
         * imperceptible) prevents the abrupt swap during key changes.
         */
        <motion.div
          animate={{ height: calHeight }}
          transition={{ duration: 0.52, ease: [0.22, 1, 0.36, 1] }}
          initial={false}
          style={{ overflow: 'hidden' }}
        >
          <div
            ref={gridRef}
            className="grid grid-cols-7 gap-1 px-4 pt-2 pb-4"
            style={{
              opacity: gridVisible ? 1 : 0,
              transition: gridVisible
                ? 'opacity 0.28s cubic-bezier(0.22, 1, 0.36, 1)'
                : 'opacity 0.04s linear',
            }}
          >
            {allDays.map(day => (
              <DayCard
                key={toISO(day)}
                day={day}
                bookings={bookingsByDay.get(toISO(day)) ?? []}
                isCurrentMonth={isExpanded ? isSameMonth(day, currentDate) : true}
                isSelected={!!selectedDay && isSameDay(day, selectedDay)}
                onClick={() => setSelectedDay(prev =>
                  prev && isSameDay(prev, day) ? null : day
                )}
              />
            ))}
          </div>
        </motion.div>
      )}

      {/* ── Day detail panel ────────────────────────────── */}
      <AnimatePresence>
        {selectedDay && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
            style={{ borderTop: '0.5px solid var(--border)' }}
          >
            {/* Detail header */}
            <div
              className="flex items-center justify-between px-5 py-3"
              style={{ background: 'var(--background-deep)' }}
            >
              <div>
                <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                  {format(selectedDay, 'd MMMM', { locale: uk })}
                </p>
                <p className="text-[11px]" style={{ color: 'var(--text-tertiary)' }}>
                  {selectedBookings.length === 0
                    ? 'Записів немає'
                    : `${selectedBookings.length} ${selectedBookings.length === 1 ? 'запис' : 'записів'}`}
                </p>
              </div>
              <button
                onClick={() => setSelectedDay(null)}
                className="w-7 h-7 rounded-xl flex items-center justify-center transition-colors"
                style={{ color: 'var(--text-tertiary)' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--border)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <X size={14} />
              </button>
            </div>

            {selectedBookings.length === 0 ? (
              <div className="flex flex-col items-center py-6 gap-2" style={{ color: 'var(--text-tertiary)' }}>
                <Clock size={24} strokeWidth={1.5} />
                <p className="text-xs">Вільний день</p>
              </div>
            ) : (
              <div className="max-h-48 overflow-y-auto scrollbar-hide">
                {selectedBookings
                  .sort((a, b) => a.start_time.localeCompare(b.start_time))
                  .map((b, i) => (
                    <BookingRow key={b.id} b={b} index={i} onOpen={openBooking} />
                  ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
