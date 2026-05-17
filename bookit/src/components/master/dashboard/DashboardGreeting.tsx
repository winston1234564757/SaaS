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
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 200, damping: 32, delay: 0.28 }}
      className="mt-5"
    >
      <p className="dash-eyebrow mb-2.5">Найближчий запис</p>
      <Link href={`/dashboard/bookings?bookingId=${booking.id}`} className="block group">
        <div
          className="flex items-center justify-between gap-3 py-3.5 active:opacity-60 transition-opacity"
          style={{ borderTop: '0.5px solid var(--border-strong)' }}
        >
          <div className="flex items-center gap-3 min-w-0">
            {/* Animated status dot */}
            <motion.div
              animate={{ scale: [1, 1.18, 1] }}
              transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
              style={{
                width: 8,
                height: 8,
                borderRadius: '999px',
                background: dotColor,
                flexShrink: 0,
              }}
            />
            <div className="min-w-0">
              <p
                className="truncate font-service"
                style={{
                  fontSize: '13px',
                  fontWeight: 500,
                  lineHeight: 1.25,
                  color: 'var(--text-primary)',
                }}
              >
                {serviceName}
              </p>
              <p
                className="text-[11px] mt-0.5 truncate"
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
      <div className="space-y-4 pb-1">
        <div className="skeleton-shimmer rounded-full" style={{ height: 9, width: 140 }} />
        <div className="skeleton-shimmer" style={{ height: 64, width: 220, borderRadius: 8 }} />
        <div className="skeleton-shimmer rounded-full" style={{ height: 2, width: 40 }} />
      </div>
    );
  }

  const firstName = (profile?.full_name ?? 'Майстре').split(' ')[0];

  return (
    <div>
      {/* Eyebrow — date · time */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.04 }}
        suppressHydrationWarning
        className="dash-eyebrow mb-3.5"
      >
        {dateLabel}&nbsp;·&nbsp;{timeStr}
      </motion.p>

      {/* Script greeting */}
      <motion.h1
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 160, damping: 28, delay: 0.07 }}
        suppressHydrationWarning
        className="greeting-script"
        style={{ fontSize: 'clamp(3.2rem, 10vw, 4.8rem)', lineHeight: 1.06 }}
      >
        {greetingText},<br />{firstName}
      </motion.h1>

      {/* Accent rule */}
      <motion.div
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1], delay: 0.22 }}
        style={{
          marginTop: 16,
          height: '1.5px',
          width: '2.5rem',
          background: 'var(--accent)',
          borderRadius: '999px',
          transformOrigin: 'left',
          opacity: 0.65,
        }}
      />

      {nextBooking && <NextBookingRow booking={nextBooking} todayStr={todayStr} />}
    </div>
  );
}
