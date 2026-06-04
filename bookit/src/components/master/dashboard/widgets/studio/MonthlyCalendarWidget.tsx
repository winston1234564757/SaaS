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

interface DayProps { day: Date; bookings: BookingWithServices[]; isCurrentMonth: boolean; isSelected: boolean; onClick: () => void }

function DayCell({ day, bookings, isCurrentMonth, isSelected, onClick }: DayProps) {
  const [hovered, setHovered]  = useState(false);
  const today        = isToday(day);
  const hasConfirmed = bookings.some(b => b.status === 'confirmed');
  const hasPending   = bookings.some(b => b.status === 'pending');
  const hasCompleted = bookings.some(b => b.status === 'completed');
  const count        = bookings.length;

  const colIndex   = (getDay(day) + 6) % 7;
  const tooltipPos = colIndex <= 1 ? { left: 0 } : colIndex >= 5 ? { right: 0 } : { left: '50%', transform: 'translateX(-50%)' };

  return (
    <button type="button"
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      disabled={!isCurrentMonth}
      className="relative flex flex-col items-center justify-center w-full min-h-[30px] transition-colors duration-100"
      style={{
        opacity:      !isCurrentMonth ? 0.2 : 1,
        background:   isSelected ? 'var(--accent)' : today ? 'color-mix(in srgb, var(--accent) 10%, transparent)' : 'transparent',
        borderRadius: '4px',
        cursor:       !isCurrentMonth ? 'default' : 'pointer',
      }}
    >
      <span
        className="font-mono text-[12px] tabular-nums leading-none"
        style={{
          fontWeight: today || isSelected ? 700 : 400,
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
              style={{ background: isSelected ? 'var(--accent-on)' : 'var(--warning)' }} />
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
          style={{ ...tooltipPos, background: 'var(--hero-card-bg)', boxShadow: '0 4px 16px rgba(0,0,0,0.25)' }}
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

function BookingRow({ b, onOpen }: { b: BookingWithServices; onOpen: (id: string) => void }) {
  return (
    <div
      className="flex items-center justify-between py-2 cursor-pointer group active:opacity-70 transition-opacity"
      style={{ borderBottom: '1px solid var(--border)' }}
      onClick={() => onOpen(b.id)}
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <div
          className="w-[3px] h-[3px] rounded-full flex-shrink-0"
          style={{
            background: b.status === 'confirmed' ? 'var(--success)'
              : b.status === 'pending' ? 'var(--warning)'
              : 'var(--text-tertiary)',
          }}
        />
        <p className="text-[13px] truncate" style={{ color: 'var(--text-primary)' }}>
          {b.services[0]?.name ?? 'Послуга'}
        </p>
        <span className="text-[12px] text-[var(--text-tertiary)] flex-shrink-0">{b.client_name}</span>
      </div>
      <div className="flex-shrink-0 flex items-center gap-3">
        <span className="font-mono text-[12px] text-[var(--text-secondary)]">{b.start_time}</span>
        <span className="metric-value text-[12px] font-bold text-[var(--text-primary)]">{formatPrice(b.total_price)}</span>
      </div>
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
    params.set('bookingId', id); router.push(`?${params.toString()}`, { scroll: false });
  };

  const monthStart = startOfMonth(currentDate);
  const monthEnd   = endOfMonth(currentDate);
  const weekStart  = useMemo(() => startOfWeek(new Date(), { weekStartsOn: 1 }), []);
  const weekEnd    = useMemo(() => endOfWeek(new Date(), { weekStartsOn: 1 }), []);

  const from = isExpanded ? toISO(startOfWeek(monthStart, { weekStartsOn: 1 })) : toISO(weekStart);
  const to   = isExpanded ? toISO(endOfWeek(monthEnd, { weekStartsOn: 1 }))     : toISO(weekEnd);
  const { bookings, isLoading } = useBookings(from, to);

  const allDays = useMemo(() => {
    if (!isExpanded) return eachDayOfInterval({ start: weekStart, end: weekEnd });
    return eachDayOfInterval({
      start: startOfWeek(monthStart, { weekStartsOn: 1 }),
      end:   endOfWeek(monthEnd, { weekStartsOn: 1 }),
    });
  }, [isExpanded, monthStart, monthEnd, weekStart, weekEnd]);

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
      <div className="flex items-center justify-between gap-3 mb-4"
        style={{ borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
        <div className="flex items-baseline gap-3">
          <p className="text-[10px] font-bold tracking-[0.22em] uppercase text-[var(--text-tertiary)]">
            Календар
          </p>
          <span className="text-[11px] text-[var(--text-tertiary)]">
            {totalCount} {pluralUk(totalCount, 'запис', 'записи', 'записів')}
          </span>
        </div>
        <div className="flex items-center gap-4">
          {(['Тиждень', 'Місяць'] as const).map((label, idx) => {
            const val = idx === 1;
            return (
              <button type="button"
                key={label}
                onClick={() => { setDirection(0); setIsExpanded(val); setSelectedDay(null); }}
                className="text-[11px] font-bold tracking-[0.14em] uppercase transition-colors duration-150 relative pb-px"
                style={{ color: isExpanded === val ? 'var(--accent)' : 'var(--text-tertiary)' }}
              >
                {label}
                {isExpanded === val && (
                  <motion.div
                    layoutId="studio-cal-tab"
                    className="absolute bottom-0 left-0 right-0 h-px"
                    style={{ background: 'var(--accent)' }}
                    transition={{ type: 'spring' as const, duration: 0.35, bounce: 0 }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Month nav */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            key="month-nav"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ type: 'spring' as const, duration: 0.3, bounce: 0 }}
            className="overflow-hidden"
          >
            <div className="flex items-center justify-between mb-3">
              <button type="button" aria-label="Попередній місяць" className="size-6 flex items-center justify-center text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors"
                onClick={() => { setDirection(-1); setCurrentDate(d => { const n = new Date(d); n.setMonth(d.getMonth() - 1); return n; }); setSelectedDay(null); }}>
                <ChevronLeft size={13} />
              </button>
              <span className="text-[12px] font-bold tracking-[0.1em] uppercase text-[var(--text-secondary)] capitalize">
                {format(currentDate, 'LLLL yyyy', { locale: uk })}
              </span>
              <button type="button" aria-label="Наступний місяць" className="size-6 flex items-center justify-center text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors"
                onClick={() => { setDirection(1); setCurrentDate(d => { const n = new Date(d); n.setMonth(d.getMonth() + 1); return n; }); setSelectedDay(null); }}>
                <ChevronRight size={13} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Day headers */}
      <div className="grid grid-cols-7 mb-1">
        {UA_DAYS.map(d => (
          <div key={d} className="flex justify-center">
            <span className="font-mono text-[9px] font-bold tracking-[0.1em] uppercase text-[var(--text-tertiary)] opacity-50">{d}</span>
          </div>
        ))}
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-7 gap-[2px]">
          {Array.from({ length: isExpanded ? 35 : 7 }).map((_, i) => (
            <div key={i} className="skeleton-shimmer rounded min-h-[30px]" />
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

      {/* Day detail */}
      <motion.div layout="size" transition={{ type: 'spring' as const, duration: 0.25, bounce: 0 }}>
        <AnimatePresence mode="popLayout">
          {selectedDay && (
            <motion.div
              key={toISO(selectedDay)}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4, transition: { type: 'spring' as const, duration: 0.15, bounce: 0 } }}
              transition={{ type: 'spring' as const, duration: 0.25, bounce: 0 }}
              className="mt-4"
            >
            <div className="flex items-center justify-between mb-3" style={{ borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
              <span className="text-[12px] font-bold tracking-[0.1em] uppercase text-[var(--text-secondary)] capitalize">
                {format(selectedDay, 'd MMMM', { locale: uk })}
              </span>
              <button type="button" onClick={() => setSelectedDay(null)} className="opacity-40 hover:opacity-80 transition-opacity">
                <X size={12} style={{ color: 'var(--text-secondary)' }} />
              </button>
            </div>

            {selectedBookings.length === 0 ? (
              <p className="text-[12px] tracking-[0.08em] uppercase text-[var(--text-tertiary)] opacity-50">
                Вільний день
              </p>
            ) : (
              selectedBookings
                .sort((a, b) => a.start_time.localeCompare(b.start_time))
                .map(b => <BookingRow key={b.id} b={b} onOpen={openBooking} />)
            )}
          </motion.div>
        )}
      </AnimatePresence>
      </motion.div>
    </div>
  );
}
