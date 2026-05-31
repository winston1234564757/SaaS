'use client';

import { useState, useMemo } from 'react';
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
import { pluralUk } from '@/lib/utils/pluralUk';

const UA_DAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд'];

function toISO(d: Date) { return format(d, 'yyyy-MM-dd'); }

const calendarVariants = {
  enter: (dir: number) => ({
    opacity: 0,
    x: dir !== 0 ? dir * 20 : 0,
    y: dir === 0 ? 6 : 0,
  }),
  center: { opacity: 1, x: 0, y: 0 },
  exit: (dir: number) => ({
    opacity: 0,
    x: dir !== 0 ? dir * -20 : 0,
    y: dir === 0 ? -4 : 0,
  }),
};

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
    <button
      onClick={onClick}
      disabled={!isCurrentMonth}
      className={`relative flex flex-col items-center justify-start pt-1.5 pb-1 w-full rounded-lg transition-all duration-150 min-h-[36px] active:scale-[0.92] ${
        isCurrentMonth && !isSelected ? 'hover:bg-[var(--border)]' : ''
      } ${!isCurrentMonth ? 'opacity-25 cursor-default' : ''}`}
      style={
        isSelected
          ? { background: 'var(--accent)' }
          : today
          ? { background: 'color-mix(in srgb, var(--accent) 10%, transparent)' }
          : {}
      }
    >
      <span
        className="text-[14px] font-semibold leading-none"
        style={{
          color: isSelected
            ? 'var(--accent-on)'
            : today
            ? 'var(--accent)'
            : isCurrentMonth
            ? 'var(--text-primary)'
            : 'var(--text-tertiary)',
        }}
      >
        {format(day, 'd')}
      </span>

      {count > 0 && (
        <div className="flex gap-[2px] mt-[3px]">
          {hasConfirmed && (
            <div
              className="w-[4px] h-[4px] rounded-full"
              style={{ background: isSelected ? 'var(--accent-on)' : 'var(--success)' }}
            />
          )}
          {hasPending && (
            <div
              className="w-[4px] h-[4px] rounded-full"
              style={{
                background: isSelected ? 'var(--accent-on)' : 'var(--warning)',
                opacity: isSelected ? 0.8 : 1,
              }}
            />
          )}
          {hasCompleted && !hasConfirmed && !hasPending && (
            <div
              className="w-[4px] h-[4px] rounded-full opacity-50"
              style={{ background: isSelected ? 'var(--accent-on)' : 'var(--text-tertiary)' }}
            />
          )}
        </div>
      )}
    </button>
  );
}

function DarkBookingRow({ b, onOpen }: { b: BookingWithServices; onOpen: (id: string) => void }) {
  const svc = b.services[0]?.name ?? 'Послуга';
  const dotGlow = b.status === 'confirmed' ? '0 0 6px rgba(78,152,112,0.6)' : undefined;
  const dotBg = b.status === 'confirmed'
    ? 'var(--success)'
    : b.status === 'pending'
    ? 'var(--warning)'
    : 'rgba(245,237,224,0.28)';

  return (
    <div
      className="flex items-center gap-3 py-3 border-b last:border-0 cursor-pointer transition-opacity hover:opacity-80 active:opacity-60"
      style={{ borderColor: 'rgba(255,255,255,0.08)' }}
      onClick={() => onOpen(b.id)}
    >
      <div
        className="w-[7px] h-[7px] rounded-full flex-shrink-0"
        style={{ background: dotBg, boxShadow: dotGlow }}
      />
      <div className="flex-1 min-w-0">
        <p className="font-service text-[16px] truncate" style={{ color: 'var(--accent-on)' }}>{svc}</p>
        <p className="text-[14px] mt-0.5 truncate" style={{ color: 'var(--accent-on)', opacity: 0.45 }}>{b.client_name}</p>
      </div>
      <div className="text-right flex-shrink-0">
        <p className="metric-value text-[14px] font-semibold" style={{ color: 'var(--accent-on)' }}>{b.start_time}</p>
        <p className="text-[14px] mt-0.5" style={{ color: 'var(--accent-on)', opacity: 0.45 }}>{formatPrice(b.total_price)}</p>
      </div>
    </div>
  );
}

function ViewToggle({
  isExpanded, onChange,
}: { isExpanded: boolean; onChange: (v: boolean) => void }) {
  const opts = [
    { value: false, label: 'Тиждень' },
    { value: true,  label: 'Місяць'  },
  ] as const;

  return (
    <div
      className="flex items-center gap-0.5 p-[3px] rounded-full flex-shrink-0"
      style={{ background: 'var(--border)' }}
    >
      {opts.map(opt => (
        <button
          key={String(opt.value)}
          onClick={() => onChange(opt.value)}
          className="relative px-3 py-[5px] rounded-full text-[13px] font-medium active:scale-[0.95] transition-transform duration-100"
          style={{ color: opt.value === isExpanded ? 'var(--accent-on)' : 'var(--text-tertiary)' }}
        >
          {opt.value === isExpanded && (
            <motion.div
              layoutId="calendar-view-tab"
              className="absolute inset-0 rounded-full"
              style={{ background: 'var(--accent)' }}
              transition={{ type: 'spring' as const, duration: 0.35, bounce: 0 }}
            />
          )}
          <span className="relative z-10">{opt.label}</span>
        </button>
      ))}
    </div>
  );
}

export function MonthlyCalendarWidget() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [isExpanded, setIsExpanded]   = useState(true);
  const [direction, setDirection]     = useState(0);
  const router       = useRouter();
  const searchParams = useSearchParams();

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

  const handleToggle = (expanded: boolean) => {
    setDirection(0);
    setIsExpanded(expanded);
    setSelectedDay(null);
  };

  const gridKey = `${isExpanded ? 'month' : 'week'}-${toISO(monthStart)}`;

  return (
    <div className="bento-card overflow-hidden">
      {/* Header */}
      <div className="px-5 pt-5 pb-4 flex items-center justify-between gap-3">
        <div>
          <h2 className="heading-serif text-base font-medium text-[var(--text-primary)]">
            Календар записів
          </h2>
          <p className="text-[14px] mt-0.5 text-[var(--text-tertiary)]">
            {totalCount} {pluralUk(totalCount, 'запис', 'записи', 'записів')} {isExpanded ? 'за місяць' : 'цього тижня'}
          </p>
        </div>
        <ViewToggle isExpanded={isExpanded} onChange={handleToggle} />
      </div>

      {/* Month navigation — animates in/out with view toggle */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            key="month-nav"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ type: 'spring' as const, duration: 0.35, bounce: 0 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-3 flex items-center justify-between">
              <button
                className="size-7 rounded-full flex items-center justify-center text-[var(--text-secondary)] hover:bg-[var(--border)] active:scale-[0.88] transition-all duration-100"
                onClick={() => {
                  setDirection(-1);
                  setCurrentDate(d => { const n = new Date(d); n.setMonth(d.getMonth() - 1); return n; });
                  setSelectedDay(null);
                }}
              >
                <ChevronLeft size={15} />
              </button>

              <span className="heading-serif text-[15px] font-medium text-[var(--text-primary)] capitalize">
                {format(currentDate, 'LLLL yyyy', { locale: uk })}
              </span>

              <button
                className="size-7 rounded-full flex items-center justify-center text-[var(--text-secondary)] hover:bg-[var(--border)] active:scale-[0.88] transition-all duration-100"
                onClick={() => {
                  setDirection(1);
                  setCurrentDate(d => { const n = new Date(d); n.setMonth(d.getMonth() + 1); return n; });
                  setSelectedDay(null);
                }}
              >
                <ChevronRight size={15} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Day-of-week labels */}
      <div className="grid grid-cols-7 px-3 mb-1">
        {UA_DAYS.map(d => (
          <div key={d} className="flex justify-center">
            <span
              className="text-[12px] font-bold tracking-[0.1em] uppercase"
              style={{ color: 'var(--text-tertiary)' }}
            >
              {d}
            </span>
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="px-3 pb-3">
        {isLoading ? (
          <div className="grid grid-cols-7 gap-[2px]">
            {Array.from({ length: isExpanded ? 35 : 7 }).map((_, i) => (
              <div key={i} className="skeleton-shimmer rounded-lg min-h-[36px]" />
            ))}
          </div>
        ) : (
          <AnimatePresence mode="popLayout" custom={direction}>
            <motion.div
              key={gridKey}
              custom={direction}
              variants={calendarVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ type: 'spring' as const, duration: 0.28, bounce: 0 }}
              className="grid grid-cols-7 gap-[2px]"
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
            </motion.div>
          </AnimatePresence>
        )}
      </div>

      {/* Day detail panel */}
      <motion.div layout transition={{ type: 'spring' as const, duration: 0.3, bounce: 0 }}>
        <AnimatePresence mode="popLayout">
          {selectedDay && (
            <motion.div
              key={toISO(selectedDay)}
              initial={{ opacity: 0, y: 8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 4, scale: 0.99, position: 'absolute', left: 12, right: 12, bottom: 12 }}
              transition={{ type: 'spring' as const, duration: 0.35, bounce: 0 }}
              className="mx-3 mb-3 rounded-[20px] overflow-hidden relative"
              style={{
                background: 'var(--hero-card-bg)',
                boxShadow: 'var(--hero-card-shadow), var(--glow-accent-shadow)',
              }}
            >
            <div className="absolute inset-x-0 top-0 h-px pointer-events-none" style={{ background: 'rgba(255,255,255,0.07)' }} />

            <div className="flex items-center justify-between px-4 pt-4 pb-2">
              <div>
                <p
                  className="heading-serif text-[16px] font-medium capitalize"
                  style={{ color: 'var(--accent-on)' }}
                >
                  {format(selectedDay, 'd MMMM', { locale: uk })}
                </p>
                <p
                  className="text-[14px] mt-0.5"
                  style={{ color: 'var(--accent-on)', opacity: 0.45 }}
                >
                  {selectedBookings.length === 0
                    ? 'Записів немає'
                    : `${selectedBookings.length} ${pluralUk(selectedBookings.length, 'запис', 'записи', 'записів')}`}
                </p>
              </div>
              <button
                onClick={() => setSelectedDay(null)}
                className="size-7 rounded-full flex items-center justify-center active:scale-[0.88] transition-transform duration-100"
                style={{ background: 'rgba(245,237,224,0.08)', color: 'var(--accent-on)' }}
              >
                <X size={14} />
              </button>
            </div>

            <div className="px-4 pb-4">
              {selectedBookings.length === 0 ? (
                <div className="flex flex-col items-center py-5 gap-2">
                  <Clock size={24} strokeWidth={1.5} style={{ color: 'var(--accent-on)', opacity: 0.4 }} />
                  <p className="text-[14px]" style={{ color: 'var(--accent-on)', opacity: 0.4 }}>Вільний день</p>
                </div>
              ) : (
                <div>
                  {selectedBookings
                    .sort((a, b) => a.start_time.localeCompare(b.start_time))
                    .map(b => (
                      <DarkBookingRow key={b.id} b={b} onOpen={openBooking} />
                    ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      </motion.div>
    </div>
  );
}
