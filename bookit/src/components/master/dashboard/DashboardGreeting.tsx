'use client';

import { useState, useEffect, useMemo } from 'react';
import { format, addDays } from 'date-fns';
import { uk } from 'date-fns/locale';
import Link from 'next/link';
import { motion } from 'framer-motion';
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

function NextBookingRow({ booking, todayStr }: { booking: BookingWithServices; todayStr: string }) {
  const serviceName = booking.services[0]?.name ?? 'Запис';
  const tomorrowStr = format(addDays(new Date(todayStr), 1), 'yyyy-MM-dd');
  const isToday    = booking.date === todayStr;
  const isTomorrow = booking.date === tomorrowStr;
  const dotColor   = booking.status === 'confirmed' ? 'var(--success)' : 'var(--warning)';

  const timeLabel = isToday
    ? `Сьогодні, ${booking.start_time}`
    : isTomorrow
    ? `Завтра, ${booking.start_time}`
    : `${format(new Date(booking.date + 'T00:00:00'), 'd MMMM', { locale: uk })}, ${booking.start_time}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 180, damping: 34, delay: 0.22 }}
      className="mt-4"
    >
      <p
        className="text-[9px] font-bold uppercase tracking-[0.22em] mb-2"
        style={{ color: 'var(--text-tertiary)' }}
      >
        Найближчий запис
      </p>
      <Link href={`/dashboard/bookings?bookingId=${booking.id}`} className="block">
        <div
          className="flex items-center justify-between gap-3 py-3 active:opacity-60 transition-opacity"
          style={{ borderTop: '0.5px solid var(--border-strong)' }}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-[7px] h-[7px] rounded-full shrink-0" style={{ background: dotColor }} />
            <div className="min-w-0">
              <p
                className="text-[13px] font-semibold leading-tight truncate"
                style={{ color: 'var(--text-primary)' }}
              >
                {serviceName}
              </p>
              <p
                className="text-[11px] leading-tight mt-0.5 truncate"
                style={{ color: 'var(--text-secondary)' }}
              >
                {booking.client_name}
              </p>
            </div>
          </div>
          <p
            className="text-[11px] font-semibold shrink-0 tabular-nums"
            style={{ color: 'var(--text-tertiary)' }}
          >
            {timeLabel}
          </p>
        </div>
      </Link>
    </motion.div>
  );
}

export function DashboardGreeting() {
  const { profile, isLoading } = useMasterContext();
  const now        = getNow();
  const todayStr   = format(now, 'yyyy-MM-dd');
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

  if (isLoading) {
    return (
      <div className="space-y-3 pb-1">
        <div className="skeleton-shimmer rounded-full" style={{ height: 10, width: 120 }} />
        <div className="skeleton-shimmer rounded-md" style={{ height: 52, width: 200 }} />
        <div className="skeleton-shimmer rounded-full" style={{ height: 2, width: 36 }} />
      </div>
    );
  }

  const firstName = (profile?.full_name ?? 'Майстре').split(' ')[0];

  return (
    <div>
      {/* Date + time eyebrow */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.04 }}
        suppressHydrationWarning
        className="text-[9px] font-bold uppercase tracking-[0.26em] mb-3"
        style={{ color: 'var(--text-tertiary)' }}
      >
        {dateLabel} · {timeStr}
      </motion.p>

      {/* Greeting — two lines */}
      <motion.h1
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 180, damping: 34, delay: 0.06 }}
        suppressHydrationWarning
        className="greeting-script"
        style={{ fontSize: 'clamp(3rem, 10vw, 4.5rem)', lineHeight: 1.08 }}
      >
        {greetingText},<br />{firstName}
      </motion.h1>

      {/* Accent rule */}
      <motion.div
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
        style={{
          marginTop: '14px',
          height: '1.5px',
          width: '2.5rem',
          background: 'var(--accent)',
          borderRadius: '999px',
          transformOrigin: 'left',
          opacity: 0.7,
        }}
      />

      {/* Next booking — editorial row */}
      {nextBooking && <NextBookingRow booking={nextBooking} todayStr={todayStr} />}
    </div>
  );
}
