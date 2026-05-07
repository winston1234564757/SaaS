'use client';

import { useState, useEffect, useMemo } from 'react';
import { format, addDays } from 'date-fns';
import { uk } from 'date-fns/locale';
import { ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useMasterContext } from '@/lib/supabase/context';
import { useBookings, type BookingWithServices } from '@/lib/supabase/hooks/useBookings';
import { NotificationsBell } from './NotificationsBell';
import { Skeleton } from '@/components/ui/skeleton';
import { getNow } from '@/lib/utils/now';

function getGreeting(hour: number): string {
  if (hour < 6)  return 'Доброї ночі';
  if (hour < 12) return 'Доброго ранку';
  if (hour < 17) return 'Доброго дня';
  if (hour < 21) return 'Доброго вечора';
  return 'Доброї ночі';
}

/* ── Date / Time pill ─────────────────────────────────────── */
function MetaPill({ children, suppressHydrationWarning }: { children: React.ReactNode; suppressHydrationWarning?: boolean }) {
  return (
    <span
      suppressHydrationWarning={suppressHydrationWarning}
      className="inline-flex items-center px-2.5 py-1 text-[11px] font-semibold rounded-full"
      style={{
        background: 'var(--surface)',
        border: '0.5px solid var(--border-strong)',
        color: 'var(--text-secondary)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
      }}
    >
      {children}
    </span>
  );
}

/* ── Next Booking pill ────────────────────────────────────── */
function NextBookingPill({ booking, todayStr }: { booking: BookingWithServices; todayStr: string }) {
  const serviceName = booking.services[0]?.name ?? 'Запис';
  const tomorrowStr = format(addDays(new Date(todayStr), 1), 'yyyy-MM-dd');
  const isToday    = booking.date === todayStr;
  const isTomorrow = booking.date === tomorrowStr;

  const isConfirmed = booking.status === 'confirmed';
  const pulseClass  = isConfirmed ? 'pulse-confirmed' : 'pulse-pending';
  const dotColor    = isConfirmed ? 'var(--success)' : 'var(--warning)';

  let whenLabel: string;
  if (isToday) {
    whenLabel = `Сьогодні о ${booking.start_time}`;
  } else if (isTomorrow) {
    whenLabel = `Завтра о ${booking.start_time}`;
  } else {
    const fullDate = format(new Date(booking.date + 'T00:00:00'), 'EEEE, d MMMM', { locale: uk });
    whenLabel = fullDate.charAt(0).toUpperCase() + fullDate.slice(1) + ` о ${booking.start_time}`;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 180, damping: 34, delay: 0.22 }}
      className="mt-4"
    >
      <p
        className="text-[10px] font-bold uppercase tracking-[0.16em] mb-2 px-1"
        style={{ color: 'var(--text-tertiary)' }}
      >
        Найближчий запис
      </p>

      <Link href={`/dashboard/bookings?bookingId=${booking.id}`} className="block">
        <div
          className="flex items-center gap-3 px-4 py-3.5 cursor-pointer active:scale-[0.98] transition-transform"
          style={{
            background: 'var(--surface)',
            border: '0.5px solid var(--border-strong)',
            borderRadius: 'var(--button-radius)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
          }}
        >
          <span
            className={`w-2 h-2 rounded-full shrink-0 ${pulseClass}`}
            style={{ background: dotColor }}
          />

          <div className="flex-1 min-w-0">
            <p
              className="text-[13px] font-semibold leading-tight"
              style={{ color: 'var(--text-primary)' }}
            >
              {whenLabel}
            </p>
            <p
              className="text-[12px] leading-tight mt-0.5"
              style={{ color: 'var(--text-secondary)' }}
            >
              {serviceName} · {booking.client_name}
            </p>
          </div>

          <ChevronRight size={14} strokeWidth={2} style={{ color: 'var(--text-tertiary)', flexShrink: 0 }} />
        </div>
      </Link>
    </motion.div>
  );
}

/* ── Main component ───────────────────────────────────────── */
export function DashboardGreeting() {
  const { profile, isLoading } = useMasterContext();
  const now = getNow();
  const todayStr = format(now, 'yyyy-MM-dd');
  // Look ahead 5 days to find next booking even if today is empty
  const lookaheadStr = format(addDays(now, 5), 'yyyy-MM-dd');

  const { bookings } = useBookings(todayStr, lookaheadStr);

  const [timeStr, setTimeStr] = useState(() => format(getNow(), 'HH:mm'));

  useEffect(() => {
    const id = setInterval(() => setTimeStr(format(getNow(), 'HH:mm')), 60_000);
    return () => clearInterval(id);
  }, []);

  const { greetingText, fullDateLabel } = useMemo(() => {
    const raw = format(now, 'EEEE, d MMMM', { locale: uk });
    return {
      greetingText: getGreeting(now.getHours()),
      fullDateLabel: raw.charAt(0).toUpperCase() + raw.slice(1),
    };
  }, []);

  const nextBooking = useMemo<BookingWithServices | null>(() => {
    if (!bookings) return null;
    return bookings
      .filter(b => {
        if (b.status !== 'pending' && b.status !== 'confirmed') return false;
        // Skip Sundays (day === 0)
        const d = new Date(b.date + 'T00:00:00');
        if (d.getDay() === 0) return false;
        // Today: only future time slots
        if (b.date === todayStr) return b.start_time > timeStr;
        // Future days: any booking
        return b.date > todayStr;
      })
      .sort((a, b) => {
        if (a.date !== b.date) return a.date.localeCompare(b.date);
        return a.start_time.localeCompare(b.start_time);
      })[0] ?? null;
  }, [bookings, timeStr, todayStr]);

  /* ── Loading skeleton ─── */
  if (isLoading) {
    return (
      <div className="mb-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1.5">
            <Skeleton className="h-6 w-44 rounded-full" />
          </div>
          <NotificationsBell />
        </div>
        <Skeleton className="h-14 w-64 rounded-xl mb-3" />
        <Skeleton className="h-1.5 w-8 rounded-full" />
      </div>
    );
  }

  const firstName = (profile?.full_name ?? 'Майстре').split(' ')[0];

  return (
    <div className="mb-5">
      {/* Top row: single date+time pill + bell */}
      <div className="flex items-center justify-between mb-3">
        <MetaPill suppressHydrationWarning>
          {fullDateLabel} · {timeStr}
        </MetaPill>
        <NotificationsBell />
      </div>

      {/* Greeting — Great Vibes dominant */}
      <motion.h1
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 180, damping: 34 }}
        suppressHydrationWarning
        style={{
          fontFamily: 'var(--font-great-vibes, cursive)',
          fontSize: 'clamp(3rem, 12vw, 4rem)',
          fontWeight: 400,
          lineHeight: 1.15,
          color: 'var(--text-primary)',
        }}
      >
        {greetingText}, {firstName}
      </motion.h1>

      {/* Accent line */}
      <div
        className="mt-3 rounded-full"
        style={{ height: '1.5px', width: '2rem', background: 'var(--text-secondary)', opacity: 0.35 }}
      />

      {/* Next booking pill */}
      {nextBooking && <NextBookingPill booking={nextBooking} todayStr={todayStr} />}
    </div>
  );
}
