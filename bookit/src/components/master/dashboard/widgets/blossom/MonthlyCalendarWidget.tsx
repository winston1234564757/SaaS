'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  format, getDay, startOfMonth, endOfMonth,
  startOfWeek, endOfWeek, eachDayOfInterval,
  isSameMonth, isToday, isSameDay,
} from 'date-fns';
import { uk } from 'date-fns/locale';
import { useBookings, type BookingWithServices } from '@/lib/supabase/hooks/useBookings';
import { formatPrice } from '@/components/master/services/types';
import { pluralUk } from '@/lib/utils/pluralUk';

const UA_DAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд'];
function toISO(d: Date) { return format(d, 'yyyy-MM-dd'); }

const calVars = {
  enter:  (dir: number) => ({ opacity: 0, y: dir === 0 ? 6 : dir > 0 ? 10 : -10 }),
  center: { opacity: 1, y: 0 },
  exit:   (dir: number) => ({ opacity: 0, y: dir === 0 ? -4 : dir > 0 ? -10 : 10 }),
};

interface DayProps {
  day: Date;
  bookings: BookingWithServices[];
  isCurrentMonth: boolean;
  isSelected: boolean;
  onClick: () => void;
}

function DayCell({ day, bookings, isCurrentMonth, isSelected, onClick }: DayProps) {
  const [hovered, setHovered]  = useState(false);
  const today        = isToday(day);
  const hasConfirmed = bookings.some(b => b.status === 'confirmed');
  const hasPending   = bookings.some(b => b.status === 'pending');
  const hasCompleted = bookings.some(b => b.status === 'completed');
  const count        = bookings.length;

  const colIndex = (getDay(day) + 6) % 7;
  const tooltipPos = colIndex <= 1
    ? { left: 0 }
    : colIndex >= 5
    ? { right: 0 }
    : { left: '50%', transform: 'translateX(-50%)' };

  return (
    <button type="button"
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      disabled={!isCurrentMonth}
      className="relative flex flex-col items-center justify-start pt-1.5 pb-1 w-full rounded-lg transition-colors duration-150 min-h-[34px]"
      style={{
        opacity:    !isCurrentMonth ? 0.2 : 1,
        background: isSelected
          ? 'var(--accent)'
          : today
          ? 'color-mix(in srgb, var(--accent) 8%, transparent)'
          : 'transparent',
        cursor: !isCurrentMonth ? 'default' : 'pointer',
      }}
    >
      <span
        className="text-[13px] leading-none"
        style={{
          fontFamily: isSelected || today
            ? "var(--font-cormorant, 'Cormorant Garamond', Georgia, serif)"
            : 'inherit',
          fontWeight: isSelected ? 400 : today ? 500 : 400,
          fontSize:   isSelected || today ? '14px' : '13px',
          color:      isSelected ? 'var(--accent-on)' : today ? 'var(--accent)' : 'var(--text-primary)',
        }}
      >
        {format(day, 'd')}
      </span>
      {count > 0 && (
        <div className="flex gap-[2px] mt-[3px]">
          {hasConfirmed && (
            <div className="w-[5px] h-[5px] rounded-full"
              style={{ background: isSelected ? 'var(--accent-on)' : 'var(--success)' }} />
          )}
          {hasPending && (
            <div className="w-[5px] h-[5px] rounded-full"
              style={{ background: isSelected ? 'var(--accent-on)' : 'var(--warning)', opacity: isSelected ? 0.8 : 1 }} />
          )}
          {hasCompleted && !hasConfirmed && !hasPending && (
            <div className="w-[5px] h-[5px] rounded-full opacity-50"
              style={{ background: isSelected ? 'var(--accent-on)' : 'var(--text-tertiary)' }} />
          )}
        </div>
      )}

      {hovered && isCurrentMonth && count > 0 && (
        <div
          className="absolute z-50 bottom-full mb-1.5 pointer-events-none whitespace-nowrap rounded-lg px-2.5 py-1.5"
          style={{
            ...tooltipPos,
            background:  'var(--hero-card-bg)',
            boxShadow:   '0 4px 16px rgba(0,0,0,0.18)',
          }}
        >
          <div className="flex items-center gap-1.5">
            {hasConfirmed && <div className="w-[4px] h-[4px] rounded-full flex-shrink-0" style={{ background: 'var(--success)' }} />}
            {hasPending   && <div className="w-[4px] h-[4px] rounded-full flex-shrink-0" style={{ background: 'var(--warning)' }} />}
            {hasCompleted && !hasConfirmed && !hasPending && <div className="w-[4px] h-[4px] rounded-full flex-shrink-0 opacity-50" style={{ background: 'var(--accent-on)' }} />}
            <span className="text-[11px] font-semibold" style={{ color: 'var(--accent-on)' }}>
              {count} {pluralUk(count, 'запис', 'записи', 'записів')}
            </span>
          </div>
        </div>
      )}
    </button>
  );
}

function EditorialBookingRow({ b, onOpen }: { b: BookingWithServices; onOpen: (id: string) => void }) {
  const svc = b.services[0]?.name ?? 'Послуга';
  return (
    <div
      className="flex items-center gap-3 py-2.5 cursor-pointer group"
      onClick={() => onOpen(b.id)}
    >
      <div
        className="w-[5px] h-[5px] rounded-full flex-shrink-0"
        style={{
          background: b.status === 'confirmed' ? 'var(--success)'
            : b.status === 'pending' ? 'var(--warning)'
            : 'var(--text-tertiary)',
        }}
      />
      <div className="flex-1 min-w-0">
        <p className="font-service text-[15px] truncate group-hover:text-[var(--accent)] transition-colors duration-150"
          style={{ color: 'var(--text-primary)' }}>
          {svc}
        </p>
        <p className="text-[13px] mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
          {b.client_name}
        </p>
      </div>
      <div className="text-right flex-shrink-0">
        <p className="metric-value text-[14px]" style={{ color: 'var(--text-primary)' }}>{b.start_time}</p>
        <p className="text-[13px] mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
          {formatPrice(b.total_price)}
        </p>
      </div>
    </div>
  );
}

function ViewToggle({ isExpanded, onChange }: { isExpanded: boolean; onChange: (v: boolean) => void }) {
  const opts = [{ value: false, label: 'Тиждень' }, { value: true, label: 'Місяць' }] as const;
  return (
    <div className="flex items-center gap-3">
      {opts.map(opt => (
        <button type="button"
          key={String(opt.value)}
          onClick={() => onChange(opt.value)}
          className="relative text-[13px] font-medium pb-px transition-colors duration-150"
          style={{ color: opt.value === isExpanded ? 'var(--text-primary)' : 'var(--text-tertiary)' }}
        >
          {opt.label}
          {opt.value === isExpanded && (
            <motion.div
              layoutId="blossom-cal-tab"
              className="absolute bottom-0 left-0 right-0 h-px"
              style={{ background: 'var(--accent)' }}
              transition={{ type: 'spring' as const, duration: 0.35, bounce: 0 }}
            />
          )}
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
  const currentWeekStart = useMemo(() => startOfWeek(new Date(), { weekStartsOn: 1 }), []);
  const currentWeekEnd   = useMemo(() => endOfWeek(new Date(), { weekStartsOn: 1 }), []);

  const from = isExpanded ? toISO(startOfWeek(monthStart, { weekStartsOn: 1 })) : toISO(currentWeekStart);
  const to   = isExpanded ? toISO(endOfWeek(monthEnd, { weekStartsOn: 1 }))     : toISO(currentWeekEnd);

  const { bookings, isLoading } = useBookings(from, to);

  const allDays = useMemo(() => {
    if (!isExpanded) return eachDayOfInterval({ start: currentWeekStart, end: currentWeekEnd });
    return eachDayOfInterval({
      start: startOfWeek(monthStart, { weekStartsOn: 1 }),
      end:   endOfWeek(monthEnd, { weekStartsOn: 1 }),
    });
  }, [isExpanded, monthStart, monthEnd, currentWeekStart, currentWeekEnd]);

  const bookingsByDay = useMemo(() => {
    const map = new Map<string, BookingWithServices[]>();
    (bookings ?? []).forEach(b => {
      if (b.status === 'cancelled') return;
      const arr = map.get(b.date) ?? []; arr.push(b); map.set(b.date, arr);
    });
    return map;
  }, [bookings]);

  const selectedBookings = selectedDay ? (bookingsByDay.get(toISO(selectedDay)) ?? []) : [];
  const totalCount = useMemo(() => (bookings ?? []).filter(b => b.status !== 'cancelled').length, [bookings]);
  const gridKey    = `${isExpanded ? 'month' : 'week'}-${toISO(monthStart)}`;

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="heading-serif text-base font-medium text-[var(--text-primary)]">
            Календар записів
          </h2>
          <p className="text-[13px] mt-0.5 text-[var(--text-tertiary)]">
            {totalCount} {pluralUk(totalCount, 'запис', 'записи', 'записів')} {isExpanded ? 'за місяць' : 'цього тижня'}
          </p>
        </div>
        <ViewToggle isExpanded={isExpanded} onChange={v => { setDirection(0); setIsExpanded(v); setSelectedDay(null); }} />
      </div>

      {/* Month nav */}
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
            <div className="flex items-center justify-between mb-3">
              <button type="button"
                aria-label="Попередній місяць"
                className="size-11 rounded-full flex items-center justify-center text-[var(--text-secondary)] hover:bg-[var(--border)] active:scale-[0.88] transition-all duration-100"
                onClick={() => { setDirection(-1); setCurrentDate(d => { const n = new Date(d); n.setMonth(d.getMonth() - 1); return n; }); setSelectedDay(null); }}
              >
                <ChevronLeft size={15} />
              </button>
              <span
                style={{
                  fontFamily:    "var(--font-cormorant, 'Cormorant Garamond', Georgia, serif)",
                  fontSize:      '1.1rem',
                  fontWeight:    400,
                  color:         'var(--text-primary)',
                  letterSpacing: '0.03em',
                  textTransform: 'capitalize',
                }}
              >
                {format(currentDate, 'LLLL yyyy', { locale: uk })}
              </span>
              <button type="button"
                aria-label="Наступний місяць"
                className="size-11 rounded-full flex items-center justify-center text-[var(--text-secondary)] hover:bg-[var(--border)] active:scale-[0.88] transition-all duration-100"
                onClick={() => { setDirection(1); setCurrentDate(d => { const n = new Date(d); n.setMonth(d.getMonth() + 1); return n; }); setSelectedDay(null); }}
              >
                <ChevronRight size={15} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Day-of-week labels */}
      <div className="grid grid-cols-7 mb-1">
        {UA_DAYS.map(d => (
          <div key={d} className="flex justify-center">
            <span className="text-[11px] font-bold tracking-[0.1em] uppercase text-[var(--text-tertiary)]">{d}</span>
          </div>
        ))}
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-7 gap-[2px]">
          {Array.from({ length: isExpanded ? 35 : 7 }).map((_, i) => (
            <div key={i} className="skeleton-shimmer rounded-lg min-h-[34px]" />
          ))}
        </div>
      ) : (
        <motion.div layout transition={{ type: 'spring' as const, duration: 0.3, bounce: 0 }}>
        <AnimatePresence mode="popLayout" custom={direction}>
          <motion.div
            key={gridKey}
            custom={direction}
            variants={calVars}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: 'spring' as const, duration: 0.25, bounce: 0 }}
            className="grid grid-cols-7 gap-[2px]"
          >
            {allDays.map(day => (
              <DayCell
                key={toISO(day)}
                day={day}
                bookings={bookingsByDay.get(toISO(day)) ?? []}
                isCurrentMonth={isExpanded ? isSameMonth(day, currentDate) : true}
                isSelected={!!selectedDay && isSameDay(day, selectedDay)}
                onClick={() => setSelectedDay(prev => prev && isSameDay(prev, day) ? null : day)}
              />
            ))}
          </motion.div>
        </AnimatePresence>
        </motion.div>
      )}

      {/* Editorial day detail — no dark hero card */}
      <motion.div layout="size" transition={{ type: 'spring' as const, duration: 0.25, bounce: 0 }}>
        <AnimatePresence mode="popLayout">
          {selectedDay && (
            <motion.div
              key={toISO(selectedDay)}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 6, transition: { type: 'spring' as const, duration: 0.15, bounce: 0 } }}
              transition={{ type: 'spring' as const, duration: 0.28, bounce: 0 }}
              className="mt-4"
            >
            <div className="h-px mb-4" style={{ background: 'var(--border)' }} />
            <div className="flex items-center justify-between mb-3">
              <p
                className="heading-serif text-[15px] font-medium capitalize"
                style={{ color: 'var(--text-primary)' }}
              >
                {format(selectedDay, 'd MMMM', { locale: uk })}
              </p>
              <button type="button"
                onClick={() => setSelectedDay(null)}
                aria-label="Закрити"
                className="size-11 rounded-full flex items-center justify-center active:scale-[0.88] transition-transform duration-100"
                style={{ background: 'var(--border)', color: 'var(--text-secondary)' }}
              >
                <X size={12} />
              </button>
            </div>

            {selectedBookings.length === 0 ? (
              <p className="text-[14px] italic text-[var(--text-tertiary)]">Вільний день</p>
            ) : (
              <div className="flex flex-col divide-y" style={{ borderColor: 'var(--border)' }}>
                {selectedBookings
                  .sort((a, b) => a.start_time.localeCompare(b.start_time))
                  .map(b => <EditorialBookingRow key={b.id} b={b} onOpen={openBooking} />)}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
      </motion.div>
    </div>
  );
}
