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

function NextBookingRow({ booking, todayStr }: { booking: BookingWithServices; todayStr: string }) {
  const serviceName = booking.services[0]?.name ?? 'Запис';
  const tomorrowStr = format(addDays(new Date(todayStr), 1), 'yyyy-MM-dd');
  const isToday    = booking.date === todayStr;
  const isTomorrow = booking.date === tomorrowStr;

  const dotClass =
    booking.status === 'confirmed'
      ? 'bg-[var(--success)] shadow-[0_0_6px_color-mix(in_srgb,var(--success)_50%,transparent)]'
      : booking.status === 'pending'
      ? 'bg-[var(--warning)]'
      : 'opacity-30';

  return (
    <div
      className="mt-4 rounded-[var(--card-radius)] overflow-hidden relative"
      style={{ background: 'var(--hero-card-bg)', boxShadow: 'var(--hero-card-shadow)' }}
    >
      <div className="absolute inset-x-0 top-0 h-px pointer-events-none" style={{ background: 'color-mix(in srgb, var(--accent-on) 7%, transparent)' }} />
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
              <p className="font-service text-[21px] truncate leading-tight" style={{ color: 'var(--accent-on)' }}>
                {serviceName}
              </p>
              <p className="text-[14px] mt-0.5 truncate" style={{ color: 'var(--accent-on)', opacity: 0.45 }}>
                {booking.client_name}
              </p>
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-[12px] whitespace-nowrap" style={{ color: 'var(--accent-on)', opacity: 0.42 }}>
              {isToday ? 'Сьогодні' : isTomorrow ? 'Завтра' : format(new Date(booking.date + 'T00:00:00'), 'd MMMM', { locale: uk })}
            </p>
            <p className="metric-value text-[20px] font-bold leading-tight whitespace-nowrap" style={{ color: 'var(--accent-on)' }}>
              {booking.start_time}
            </p>
          </div>
        </div>
      </Link>
    </div>
  );
}

export function GreetingWidget() {
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

  const { greetingText, dayLabel, dateLabel } = useMemo(() => {
    const raw = format(now, 'EEEE', { locale: uk });
    return {
      greetingText: getGreeting(now.getHours()),
      dayLabel:     raw.charAt(0).toUpperCase() + raw.slice(1),
      dateLabel:    format(now, 'd MMMM', { locale: uk }),
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
    <div className="pb-4 flex flex-col gap-3">
      <div className="flex justify-between">
        <div className="skeleton-shimmer h-8 w-32 rounded-lg" />
        <div className="skeleton-shimmer h-8 w-20 rounded-lg" />
      </div>
      <div className="skeleton-shimmer h-3 w-36 rounded-full mt-1" />
      <div className="skeleton-shimmer h-[90px] rounded-[24px] mt-2" />
    </div>
  );

  const firstName = (profile?.full_name ?? 'Майстре').split(' ')[0];

  return (
    <div className="pb-4">
      {/* Date + time as primary data hero */}
      <motion.div
        initial={{ opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring' as const, duration: 0.45, bounce: 0 }}
        className="flex items-end justify-between gap-4 mb-3"
        suppressHydrationWarning
      >
        <div>
          <p
            className="text-[11px] font-bold tracking-[0.18em] uppercase mb-1"
            style={{ color: 'var(--text-tertiary)' }}
          >
            {dayLabel}
          </p>
          <p
            className="metric-value text-[36px] font-bold leading-tight"
            style={{ color: 'var(--text-primary)', letterSpacing: '-0.02em' }}
          >
            {dateLabel}
          </p>
        </div>

        <div className="text-right flex-shrink-0">
          <p
            className="text-[11px] font-bold tracking-[0.14em] uppercase mb-1"
            style={{ color: 'var(--text-tertiary)' }}
          >
            Зараз
          </p>
          <p
            className="metric-value text-[36px] font-bold leading-tight"
            style={{ color: 'var(--accent)', letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums' }}
            suppressHydrationWarning
          >
            {timeStr}
          </p>
        </div>
      </motion.div>

      {/* Greeting */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.15 }}
        className="text-[26px] font-semibold"
        style={{ color: 'var(--text-primary)' }}
        suppressHydrationWarning
      >
        {greetingText}, {firstName}
      </motion.p>

      {nextBooking && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring' as const, duration: 0.5, bounce: 0, delay: 0.22 }}
        >
          <NextBookingRow booking={nextBooking} todayStr={todayStr} />
        </motion.div>
      )}
    </div>
  );
}
