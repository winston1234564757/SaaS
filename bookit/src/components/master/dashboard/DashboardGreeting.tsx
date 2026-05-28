'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { format, addDays } from 'date-fns';
import { uk } from 'date-fns/locale';
import Link from 'next/link';
import { useMasterContext } from '@/lib/supabase/context';
import { useBookings, type BookingWithServices } from '@/lib/supabase/hooks/useBookings';
import { getNow } from '@/lib/utils/now';

function getGreeting(hour: number): string {
  if (hour < 6)  return 'Доброї ночі';
  if (hour < 12) return 'Доброго ранку';
  if (hour < 17) return 'Доброго дня';
  if (hour < 21) return 'Доброго вечора';
  return 'Доброї ночі';
}

const wordContainer = {
  hidden:  {},
  visible: { transition: { staggerChildren: 0.1 } },
} as const;

const wordItem = {
  hidden:  { opacity: 0, y: 12, filter: 'blur(5px)' },
  visible: {
    opacity: 1, y: 0, filter: 'blur(0px)',
    transition: { type: 'spring' as const, duration: 0.65, bounce: 0.08 },
  },
} as const;

function NextBookingRow({ booking, todayStr }: { booking: BookingWithServices; todayStr: string }) {
  const serviceName = booking.services[0]?.name ?? 'Запис';
  const tomorrowStr = format(addDays(new Date(todayStr), 1), 'yyyy-MM-dd');
  const isToday    = booking.date === todayStr;
  const isTomorrow = booking.date === tomorrowStr;

  const timeLabel = isToday
    ? `Сьогодні, ${booking.start_time}`
    : isTomorrow
    ? `Завтра, ${booking.start_time}`
    : `${format(new Date(booking.date + 'T00:00:00'), 'd MMMM', { locale: uk })}, ${booking.start_time}`;

  const dotClass =
    booking.status === 'confirmed'
      ? 'bg-[var(--success)] shadow-lg shadow-success/30'
      : booking.status === 'pending'
      ? 'bg-[var(--warning)]'
      : 'opacity-30';

  return (
    <div
      className="mt-5 rounded-[var(--card-radius)] overflow-hidden relative"
      style={{ background: 'var(--hero-card-bg)', boxShadow: 'var(--hero-card-shadow)' }}
    >
      <div className="absolute inset-x-0 top-0 h-px pointer-events-none" style={{ background: 'rgba(255,255,255,0.07)' }} />

      <p
        className="px-5 pt-4 pb-0 text-[10px] font-bold tracking-[0.2em] uppercase"
        style={{ color: 'var(--accent-on)', opacity: 0.42 }}
      >
        Найближчий запис
      </p>

      <Link href={`/dashboard/bookings?bookingId=${booking.id}`} className="block px-5 pt-3 pb-5 group">
        <div className="flex items-end justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className={`w-[7px] h-[7px] rounded-full flex-shrink-0 ${dotClass}`} />
            <div className="min-w-0">
              <p
                className="font-service text-[21px] truncate leading-tight"
                style={{ color: 'var(--accent-on)' }}
              >
                {serviceName}
              </p>
              <p
                className="text-[14px] mt-0.5 truncate"
                style={{ color: 'var(--accent-on)', opacity: 0.45 }}
              >
                {booking.client_name}
              </p>
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            <p
              className="text-[12px] whitespace-nowrap"
              style={{ color: 'var(--accent-on)', opacity: 0.42 }}
            >
              {isToday ? 'Сьогодні' : isTomorrow ? 'Завтра' : format(new Date(booking.date + 'T00:00:00'), 'd MMMM', { locale: uk })}
            </p>
            <p
              className="metric-value text-[20px] font-bold leading-tight whitespace-nowrap"
              style={{ color: 'var(--accent-on)' }}
            >
              {booking.start_time}
            </p>
          </div>
        </div>
      </Link>
    </div>
  );
}

export function DashboardGreeting() {
  const { profile, isLoading } = useMasterContext();
  const now          = getNow();
  const todayStr     = format(now, 'yyyy-MM-dd');
  const lookaheadStr = format(addDays(now, 5), 'yyyy-MM-dd');
  const { bookings } = useBookings(todayStr, lookaheadStr);

  const [timeStr, setTimeStr] = useState(() => format(getNow(), 'HH:mm'));
  useEffect(() => {
    const id = setInterval(() => setTimeStr(format(getNow(), 'HH:mm')), 60_000);
    return () => clearInterval(id);
  }, []);

  const { greetingText, dateLabel } = useMemo(() => {
    const raw = format(now, 'EEEE, d MMMM', { locale: uk });
    return {
      greetingText: getGreeting(now.getHours()),
      dateLabel:    raw.charAt(0).toUpperCase() + raw.slice(1),
    };
  }, []);

  const nextBooking = useMemo<BookingWithServices | null>(() => {
    if (!bookings) return null;
    return bookings
      .filter(b => {
        if (b.status !== 'pending' && b.status !== 'confirmed') return false;
        const d = new Date(b.date + 'T00:00:00');
        if (d.getDay() === 0) return false;
        if (b.date === todayStr) return b.start_time > timeStr;
        return b.date > todayStr;
      })
      .sort((a, b) => {
        if (a.date !== b.date) return a.date.localeCompare(b.date);
        return a.start_time.localeCompare(b.start_time);
      })[0] ?? null;
  }, [bookings, timeStr, todayStr]);

  if (isLoading) return (
    <div className="pt-2 pb-4 flex flex-col gap-3">
      <div className="skeleton-shimmer h-4 w-40 rounded-full" />
      <div className="skeleton-shimmer h-24 w-5/6 rounded-xl mt-1" />
      <div className="skeleton-shimmer h-[90px] rounded-xl mt-2" />
    </div>
  );

  const firstName = (profile?.full_name ?? 'Майстре').split(' ')[0];
  const greetingWords = greetingText.split(' ');
  const nameWords     = firstName.split(' ');
  const wordCount     = greetingWords.length + nameWords.length;

  return (
    <div className="pt-2 pb-1">
      <motion.div
        className="flex items-center gap-2 mb-4"
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', duration: 0.4, bounce: 0 }}
        suppressHydrationWarning
      >
        <span
          className="text-[12px] font-medium tracking-[0.05em] text-[var(--text-secondary)] px-3 py-1 rounded-full"
          style={{ background: 'var(--border)' }}
        >
          {dateLabel}
        </span>
        <span className="text-[var(--border-strong)] text-xs select-none">·</span>
        <span
          className="metric-value text-[13px] font-semibold text-[var(--text-tertiary)]"
          suppressHydrationWarning
        >
          {timeStr}
        </span>
      </motion.div>

      <motion.h1
        className="greeting-script"
        style={{ fontSize: 'clamp(3rem, 9vw, 6rem)' }}
        variants={wordContainer}
        initial="hidden"
        animate="visible"
        suppressHydrationWarning
      >
        {greetingWords.map((w, i) => (
          <motion.span
            key={`g-${i}`}
            variants={wordItem}
            style={{ display: 'inline-block', marginRight: '0.22em' }}
          >
            {i === greetingWords.length - 1 ? `${w},` : w}
          </motion.span>
        ))}
        <br />
        {nameWords.map((w, i) => (
          <motion.span
            key={`n-${i}`}
            variants={wordItem}
            style={{ display: 'inline-block', marginRight: '0.22em' }}
          >
            {w}
          </motion.span>
        ))}
      </motion.h1>

      <motion.div
        className="mt-4 rounded-full accent-breathe"
        initial={{ width: 0, opacity: 0 }}
        animate={{ width: 40, opacity: 1 }}
        transition={{ type: 'spring', duration: 0.6, bounce: 0, delay: wordCount * 0.07 + 0.1 }}
        style={{ height: 2, background: 'var(--accent)' }}
      />

      {nextBooking && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', duration: 0.5, bounce: 0.1, delay: wordCount * 0.07 + 0.2 }}
        >
          <NextBookingRow booking={nextBooking} todayStr={todayStr} />
        </motion.div>
      )}
    </div>
  );
}
