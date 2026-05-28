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
      ? 'bg-[var(--success)] shadow-[0_0_6px_rgba(78,152,112,0.5)]'
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

  const { greetingText, dateLabel } = useMemo(() => {
    const day  = format(now, 'EEEE', { locale: uk }).toUpperCase();
    const date = format(now, 'd MMMM', { locale: uk }).toUpperCase();
    return {
      greetingText: getGreeting(now.getHours()),
      dateLabel:    `${day} · ${date}`,
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
    <div className="pb-6 flex flex-col gap-3">
      <div className="skeleton-shimmer h-3 w-48 rounded-full" />
      <div className="skeleton-shimmer h-10 w-3/4 rounded-xl mt-2" />
      <div className="skeleton-shimmer h-[90px] rounded-[24px] mt-3" />
    </div>
  );

  const firstName = (profile?.full_name ?? 'Майстре').split(' ')[0];

  return (
    <div className="pb-6">
      {/* Monocle-style date line */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.35 }}
        className="text-[11px] font-bold tracking-[0.22em] mb-5"
        style={{ color: 'var(--text-tertiary)' }}
        suppressHydrationWarning
      >
        {dateLabel} · {timeStr}
      </motion.p>

      {/* Greeting — Monocle/DM Sans editorial headline */}
      <motion.h1
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring' as const, duration: 0.5, bounce: 0, delay: 0.08 }}
        suppressHydrationWarning
        style={{
          fontFamily:    'var(--font-cormorant, "Cormorant Garamond", Georgia, serif)',
          fontSize:      'clamp(3rem, 7vw, 5rem)',
          fontWeight:    400,
          letterSpacing: '0.01em',
          color:         'var(--accent)',
          lineHeight:    1,
        }}
      >
        {greetingText}, {firstName}
      </motion.h1>

      {/* Full-width divider — Studio signature */}
      <motion.div
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] as [number, number, number, number], delay: 0.28 }}
        className="mt-5"
        style={{ height: '0.5px', background: 'var(--border)', transformOrigin: 'left' }}
      />

      {nextBooking && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring' as const, duration: 0.5, bounce: 0, delay: 0.35 }}
        >
          <NextBookingRow booking={nextBooking} todayStr={todayStr} />
        </motion.div>
      )}
    </div>
  );
}
