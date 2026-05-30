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
  const [hovered, setHovered] = useState(false);
  const today     = isToday(day);
  const count     = bookings.length;
  const hasConfirmed = bookings.some(b => b.status === 'confirmed');
  const hasPending   = bookings.some(b => b.status === 'pending');

  const colIndex   = (getDay(day) + 6) % 7;
  const tooltipPos = colIndex <= 1 ? { left: 0 } : colIndex >= 5 ? { right: 0 } : { left: '50%', transform: 'translateX(-50%)' };

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      disabled={!isCurrentMonth}
      className="relative flex flex-col items-center justify-start pt-1 pb-0.5 w-full rounded-md transition-colors duration-100 min-h-[32px]"
      style={{
        opacity:    !isCurrentMonth ? 0.2 : 1,
        background: isSelected
          ? 'var(--accent)'
          : today
          ? 'color-mix(in srgb, var(--accent) 8%, transparent)'
          : 'transparent',
        cursor: !isCurrentMonth ? 'default' : 'pointer',
        border: today && !isSelected ? '1px solid color-mix(in srgb, var(--accent) 25%, transparent)' : '1px solid transparent',
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
        <div className="flex gap-[2px] mt-[2px]">
          {hasConfirmed && <div className="w-[5px] h-[5px] rounded-full" style={{ background: isSelected ? 'var(--accent-on)' : 'var(--success)', opacity: isSelected ? 0.8 : 0.75 }} />}
          {hasPending   && <div className="w-[5px] h-[5px] rounded-full" style={{ background: isSelected ? 'var(--accent-on)' : 'var(--warning)', opacity: isSelected ? 0.8 : 0.75 }} />}
          {!hasConfirmed && !hasPending && <div className="w-[5px] h-[5px] rounded-full" style={{ background: isSelected ? 'var(--accent-on)' : 'var(--accent)', opacity: isSelected ? 0.8 : 0.75 }} />}
        </div>
      )}

      {hovered && isCurrentMonth && count > 0 && (
        <div
          className="absolute z-50 bottom-full mb-1.5 pointer-events-none whitespace-nowrap rounded-lg px-2.5 py-1.5"
          style={{ ...tooltipPos, background: 'var(--hero-card-bg)', boxShadow: '0 4px 20px rgba(0,0,0,0.18)' }}
        >
          <div className="flex items-center gap-1.5">
            {hasConfirmed && <div className="w-[4px] h-[4px] rounded-full flex-shrink-0" style={{ background: 'var(--success)' }} />}
            {hasPending   && <div className="w-[4px] h-[4px] rounded-full flex-shrink-0" style={{ background: 'var(--warning)' }} />}
            <span className="font-mono text-[11px] font-bold" style={{ color: 'var(--accent-on)' }}>
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
    <button
      type="button"
      className="flex items-center gap-3 py-2 w-full text-left cursor-pointer active:opacity-70 transition-opacity bg-transparent border-0"
      style={{ borderBottom: '1px solid color-mix(in srgb, var(--accent) 8%, transparent)' }}
      onClick={() => onOpen(b.id)}
    >
      <div className="w-[4px] h-[4px] rounded-full flex-shrink-0"
        style={{
          background: b.status === 'confirmed' ? 'var(--success)'
            : b.status === 'pending' ? 'var(--warning)'
            : 'var(--text-tertiary)',
        }}
      />
      <p className="text-[13px] font-medium flex-1 min-w-0 truncate" style={{ color: 'var(--accent-on)' }}>
        {b.services[0]?.name ?? 'Послуга'}
      </p>
      <span className="font-mono text-[11px] flex-shrink-0" style={{ color: 'color-mix(in srgb, var(--accent-on) 55%, transparent)' }}>{b.start_time}</span>
      <span className="metric-value text-[12px] font-bold flex-shrink-0" style={{ color: 'var(--accent-on)' }}>
        {formatPrice(b.total_price)}
      </span>
    </button>
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
    <div className="bento-card overflow-hidden">
      {/* Header */}
      <div className="px-4 pt-4 pb-3 flex items-center justify-between gap-3"
        style={{ borderBottom: '1px solid color-mix(in srgb, var(--accent) 8%, transparent)' }}>
        <div>
          <p className="text-[10px] font-bold tracking-[0.16em] uppercase text-[var(--text-tertiary)]">
            Календар записів
          </p>
          <p className="text-[12px] mt-0.5 text-[var(--text-tertiary)]">
            {totalCount} {pluralUk(totalCount, 'запис', 'записи', 'записів')} {isExpanded ? 'за місяць' : 'цього тижня'}
          </p>
        </div>
        <div
          className="flex items-center gap-0.5 p-[3px] rounded-full"
          style={{ background: 'var(--border)' }}
        >
          {([{ label: 'Тиждень', val: false }, { label: 'Місяць', val: true }]).map(opt => (
            <button
              key={String(opt.val)}
              onClick={() => { setDirection(0); setIsExpanded(opt.val); setSelectedDay(null); }}
              className="relative px-2.5 py-[4px] rounded-full text-[11px] font-bold transition-colors duration-100"
              style={{ color: opt.val === isExpanded ? 'var(--accent-on)' : 'var(--text-tertiary)' }}
            >
              {opt.val === isExpanded && (
                <motion.div
                  layoutId="frost-cal-tab"
                  className="absolute inset-0 rounded-full"
                  style={{ background: 'var(--accent)' }}
                  transition={{ type: 'spring' as const, duration: 0.35, bounce: 0 }}
                />
              )}
              <span className="relative z-10">{opt.label}</span>
            </button>
          ))}
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
            <div className="flex items-center justify-between px-4 pt-3 pb-1">
              <button className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-[var(--border)] text-[var(--text-tertiary)] active:scale-[0.88] transition-all"
                onClick={() => { setDirection(-1); setCurrentDate(d => { const n = new Date(d); n.setMonth(d.getMonth() - 1); return n; }); setSelectedDay(null); }}>
                <ChevronLeft size={12} />
              </button>
              <span className="font-mono text-[11px] font-bold tracking-[0.08em] uppercase text-[var(--text-secondary)] capitalize">
                {format(currentDate, 'LLLL yyyy', { locale: uk })}
              </span>
              <button className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-[var(--border)] text-[var(--text-tertiary)] active:scale-[0.88] transition-all"
                onClick={() => { setDirection(1); setCurrentDate(d => { const n = new Date(d); n.setMonth(d.getMonth() + 1); return n; }); setSelectedDay(null); }}>
                <ChevronRight size={12} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Day headers */}
      <div className="grid grid-cols-7 px-3 py-1">
        {UA_DAYS.map(d => (
          <div key={d} className="flex justify-center">
            <span className="font-mono text-[9px] font-bold tracking-[0.08em] uppercase text-[var(--text-tertiary)] opacity-50">{d}</span>
          </div>
        ))}
      </div>

      {/* Grid */}
      <div className="px-3 pb-3">
        {isLoading ? (
          <div className="grid grid-cols-7 gap-[2px]">
            {Array.from({ length: isExpanded ? 35 : 7 }).map((_, i) => (
              <div key={i} className="skeleton-shimmer rounded-md min-h-[32px]" />
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
      </div>

      {/* Day detail */}
      <motion.div layout="size" transition={{ type: 'spring' as const, duration: 0.25, bounce: 0 }}>
        <AnimatePresence mode="popLayout">
          {selectedDay && (
            <motion.div
              key={toISO(selectedDay)}
              initial={{ opacity: 0, y: 6, scale: 0.99 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 6, scale: 0.99, transition: { type: 'spring' as const, duration: 0.15, bounce: 0 } }}
              transition={{ type: 'spring' as const, duration: 0.28, bounce: 0 }}
              className="mx-3 mb-3 rounded-xl overflow-hidden"
              style={{ background: 'var(--hero-card-bg)' }}
            >
            <div className="flex items-center justify-between px-4 pt-3 pb-2"
              style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
              <p className="font-mono text-[12px] font-bold tracking-[0.08em] uppercase capitalize"
                style={{ color: 'var(--accent-on)' }}>
                {format(selectedDay, 'd MMMM', { locale: uk })}
                {' · '}
                {selectedBookings.length === 0 ? 'вільний' : `${selectedBookings.length} ${pluralUk(selectedBookings.length, 'запис', 'записи', 'записів')}`}
              </p>
              <button onClick={() => setSelectedDay(null)} className="opacity-40 hover:opacity-80 transition-opacity">
                <X size={12} style={{ color: 'var(--accent-on)' }} />
              </button>
            </div>
            <div className="px-4 pb-3 pt-2">
              {selectedBookings.length === 0 ? (
                <p className="text-[12px] opacity-40" style={{ color: 'var(--accent-on)' }}>Записів немає</p>
              ) : (
                selectedBookings
                  .sort((a, b) => a.start_time.localeCompare(b.start_time))
                  .map(b => <BookingRow key={b.id} b={b} onOpen={openBooking} />)
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      </motion.div>
    </div>
  );
}
