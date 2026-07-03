'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { format, addDays } from 'date-fns';
import { uk } from 'date-fns/locale';
import Link from 'next/link';
import { ArrowUpRight, Zap, Sparkles } from 'lucide-react';
import { EditorialCover } from '@/components/ui/EditorialCover';
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

/** On-dark статус-мета: світлі тінти (не Frost-хекси, відтюнені під світле). */
function statusMeta(status: BookingWithServices['status']) {
  if (status === 'confirmed') return { glow: '#34D399', dot: 'bg-emerald-300', ring: 'shadow-[0_0_8px_rgba(52,211,153,0.55)]' };
  if (status === 'pending')   return { glow: '#FBBF24', dot: 'bg-amber-300',   ring: '' };
  return { glow: undefined, dot: 'bg-white/40', ring: '' };
}

/* ─── Hero stagger (Emil spring, bounce 0) ─────────────────── */
const cover = {
  hidden:  {},
  visible: { transition: { staggerChildren: 0.06, delayChildren: 0.04 } },
};
const item = {
  hidden:  { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring' as const, duration: 0.5, bounce: 0 } },
};

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
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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

  const reduce = useReducedMotion();
  const firstName = (profile?.full_name ?? 'Майстре').split(' ')[0];

  /* ─── Loading — skeleton on dark ─────────────────────────── */
  if (isLoading) {
    return (
      <EditorialCover>
        <div className="flex flex-col gap-5">
          <div className="flex items-center justify-between">
            <div className="h-3 w-28 rounded-full bg-white/10" />
            <div className="h-3 w-12 rounded-full bg-white/10" />
          </div>
          <div className="h-5 w-40 rounded-lg bg-white/10" />
          <div className="flex items-end justify-between pt-2">
            <div className="flex flex-col gap-2">
              <div className="h-8 w-44 rounded-lg bg-white/10" />
              <div className="h-3 w-32 rounded-full bg-white/10" />
            </div>
            <div className="h-8 w-16 rounded-lg bg-white/10" />
          </div>
        </div>
      </EditorialCover>
    );
  }

  const meta = nextBooking ? statusMeta(nextBooking.status) : { glow: undefined, dot: '', ring: '' };

  return (
    <EditorialCover glowColor={meta.glow}>
      <motion.div
        variants={reduce ? undefined : cover}
        initial={reduce ? undefined : 'hidden'}
        animate={reduce ? undefined : 'visible'}
        className="flex flex-col"
      >
        {/* Привітання — велике тепле editorial-вітання */}
        <motion.p
          variants={reduce ? undefined : item}
          className="heading-serif text-[24px] leading-[1.15] text-white"
          suppressHydrationWarning
        >
          {greetingText}, {firstName}
        </motion.p>

        {/* Дата + час — великим tabular-рядком */}
        <motion.div
          variants={reduce ? undefined : item}
          className="mt-1.5 flex items-baseline justify-between gap-4"
          suppressHydrationWarning
        >
          <p className="metric-value text-[16px] font-semibold text-white/70">
            {dayLabel}, {dateLabel}
          </p>
          <p className="metric-value text-[16px] font-semibold text-white/70" suppressHydrationWarning>
            {timeStr}
          </p>
        </motion.div>

        <motion.div variants={reduce ? undefined : item} className="mt-4 h-px bg-white/10" />

        {/* Домінанта */}
        {nextBooking ? (
          <NextBookingHero booking={nextBooking} todayStr={todayStr} meta={meta} reduce={!!reduce} />
        ) : (
          <EmptyDayHero reduce={!!reduce} />
        )}
      </motion.div>
    </EditorialCover>
  );
}

/* ─── Домінанта: наступний запис ───────────────────────────── */
export function NextBookingHero({
  booking, todayStr, meta,
}: {
  booking: BookingWithServices;
  todayStr: string;
  meta: ReturnType<typeof statusMeta>;
  reduce: boolean;
}) {
  const serviceName = booking.services[0]?.name ?? 'Запис';
  const tomorrowStr = format(addDays(new Date(todayStr), 1), 'yyyy-MM-dd');
  const whenLabel =
    booking.date === todayStr    ? 'Сьогодні'
    : booking.date === tomorrowStr ? 'Завтра'
    : format(new Date(booking.date + 'T00:00:00'), 'd MMMM', { locale: uk });

  return (
    <motion.div variants={item}>
      <p className="mt-4 text-[10px] font-bold tracking-[0.2em] uppercase text-white/55">
        Наступний
      </p>
      <Link
        href={`/dashboard/bookings?bookingId=${booking.id}`}
        className="group mt-1.5 flex items-end justify-between gap-4 rounded-lg active:scale-[0.99] transition-transform outline-none focus-visible:ring-2 focus-visible:ring-white/40"
      >
        <div className="min-w-0">
          <p className="heading-serif text-[30px] leading-[1.05] text-white line-clamp-2">
            {booking.client_name}
          </p>
          <p className="mt-1 text-[13px] text-white/55 truncate">
            {serviceName} · {whenLabel}
          </p>
        </div>
        <div className="flex flex-col items-end shrink-0">
          <span className="flex items-center gap-2">
            <span className={`w-[7px] h-[7px] rounded-full ${meta.dot} ${meta.ring}`} />
            <span className="metric-value text-[26px] leading-none text-white">
              {booking.start_time}
            </span>
          </span>
          <span className="mt-1.5 flex items-center gap-0.5 text-[11px] font-semibold text-white/55 group-hover:text-white/80 transition-colors">
            Відкрити <ArrowUpRight size={13} strokeWidth={2} aria-hidden />
          </span>
        </div>
      </Link>
    </motion.div>
  );
}

/* ─── Диференційований порожній стан → маркетинг ───────────── */
export function EmptyDayHero({ }: { reduce: boolean }) {
  return (
    <motion.div variants={item} className="mt-4">
      <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-white/50">
        Попереду вільно
      </p>
      <p className="heading-serif text-[28px] leading-tight text-white mt-1.5">
        Записів більше немає
      </p>
      <p className="text-[13px] text-white/55 mt-1.5 max-w-[34ch]">
        Заповни вікно: запусти акцію або покажи вільні місця в сторіс.
      </p>
      <div className="mt-4 flex flex-wrap items-center gap-2.5">
        <Link
          href="/dashboard/flash"
          className="inline-flex items-center gap-1.5 h-11 px-4 rounded-xl bg-white text-slate-900 text-[13px] font-bold active:scale-[0.97] transition-transform outline-none focus-visible:ring-2 focus-visible:ring-white/60"
        >
          <Zap size={15} strokeWidth={2} aria-hidden /> Запустити акцію
        </Link>
        <Link
          href="/dashboard/marketing?mode=free_slots"
          className="inline-flex items-center gap-1.5 h-11 px-4 rounded-xl border border-white/20 text-white/80 text-[13px] font-semibold hover:bg-white/5 active:scale-[0.97] transition-all outline-none focus-visible:ring-2 focus-visible:ring-white/40"
        >
          <Sparkles size={15} strokeWidth={2} aria-hidden /> Сторіс
        </Link>
      </div>
    </motion.div>
  );
}
