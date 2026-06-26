'use client';

import { useState, useTransition, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence, useMotionValue } from 'framer-motion';
import { useQueryClient } from '@tanstack/react-query';
import { toMins, fromMins } from '@/lib/utils/smartSlots';
import { type BookingWithServices } from '@/lib/supabase/hooks/useBookings';
import { Plus, Moon, Check, X, Loader2, Coffee, Clock } from 'lucide-react';
import { useToast } from '@/lib/toast/context';
import { rescheduleBooking } from '@/app/(master)/dashboard/bookings/actions';
import { cn } from '@/lib/utils/cn';
import { invalidateBookingQueries } from '@/lib/utils/invalidateBookingQueries';
import { BOOKING_STATUS_CONFIG } from '@/lib/constants/bookingStatus';
import { statusGlow } from '@/lib/utils/statusGlow';
import { formatPrice } from '@/components/master/services/types';
import { formatDurationFull } from '@/lib/utils/dates';
import { PricingBadge } from '@/components/shared/PricingBadge';

interface BreakWindow { start: string; end: string }

interface Props {
  bookings: BookingWithServices[];
  date: string;
  workStart?: string;
  workEnd?: string;
  isWorkingDay?: boolean;
  bufferMinutes?: number;
  breaks?: BreakWindow[];
  onOpportunityClick?: (time: string) => void;
}

const HOUR_HEIGHT   = 180;
const DRAG_THRESHOLD = 18; // px — ignore accidental swipes below this

function pad2(n: number) {
  return String(n).padStart(2, '0');
}

type TL = BookingWithServices & { top: number; height: number };

// ─────────────────────────────────────────────────────────────────────────────
// TimelineBlock — purpose-built compact block (status rail + time-proportional)
// Replaces the full list BookingCard inside the day timeline (M-BOOK-02).
// ─────────────────────────────────────────────────────────────────────────────
function TimelineBlock({ booking }: { booking: TL }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const cfg = BOOKING_STATUS_CONFIG[booking.status];
  const serviceNames = booking.services.map(s => s.name).join(', ') || 'Без послуги';
  const duration = toMins(booking.end_time) - toMins(booking.start_time);

  // Smart Design System — content size + arrangement adapt to block height.
  // Height is duration-proportional, so longer bookings get a richer, top-anchored
  // layout (start-time aligns to its hour line); short ones stay compact/centered.
  const h = booking.height;
  const size: 'sm' | 'md' | 'lg' | 'xl' =
    h >= 175 ? 'xl' : h >= 115 ? 'lg' : h >= 70 ? 'md' : 'sm';

  const openModal = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('bookingId', booking.id);
    router.push(`?${params.toString()}`, { scroll: false });
  };

  return (
    <button
      type="button"
      onClick={openModal}
      aria-label={`${booking.start_time} ${booking.client_name}, ${cfg.label}`}
      className="relative h-full w-full text-left rounded-2xl overflow-hidden flex active:scale-[0.985] transition-transform"
      style={{
        background:      'var(--surface)',
        backgroundImage: statusGlow(cfg.color),
        border:          '0.5px solid var(--border)',
        boxShadow:       '0 2px 8px rgba(80,70,120,0.06)',
      }}
    >
      {/* Status rail — bold day-scan signal */}
      <span
        aria-hidden
        className="absolute left-0 inset-y-0 w-[5px]"
        style={{ background: cfg.color }}
      />

      {size === 'sm' ? (
        // Tight single row — vertically centered (no room to anchor)
        <div className="flex items-center gap-2 w-full h-full pl-[17px] pr-3 min-w-0">
          <span className="text-[14px] font-bold tabular-nums text-foreground leading-none shrink-0">
            {booking.start_time}
          </span>
          <span className="font-display text-sm font-bold text-foreground truncate flex-1 min-w-0">
            {booking.client_name}
          </span>
          <span className="text-[13px] font-bold tabular-nums text-foreground shrink-0">
            {formatPrice(booking.total_price)}
          </span>
        </div>
      ) : size === 'xl' ? (
        // Rich card — 1h+ blocks become a full booking card that fills the height
        <div className="flex flex-col h-full w-full pl-5 pr-4 py-3.5 min-w-0 justify-between">
          {/* Top — time, duration, status, client, service */}
          <div className="flex flex-col gap-2 min-w-0">
            <div className="flex items-start justify-between gap-3">
              <div className="flex flex-col gap-1 min-w-0">
                <span className="text-xl font-bold tabular-nums text-foreground leading-none">
                  {booking.start_time}
                  <span className="font-semibold" style={{ color: 'var(--text-tertiary)' }}>
                    –{booking.end_time}
                  </span>
                </span>
                <span
                  className="flex items-center gap-1 text-xs font-medium"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  <Clock size={11} />
                  {formatDurationFull(duration)}
                </span>
              </div>
              <span className="flex items-center gap-1.5 shrink-0 pt-0.5">
                <span className="size-1.5 rounded-full" style={{ background: cfg.color }} />
                <span
                  className="text-[10px] font-bold uppercase tracking-wider leading-none"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  {cfg.label}
                </span>
              </span>
            </div>
            <div className="flex flex-col gap-1 min-w-0 pt-0.5">
              <span className="font-display text-2xl font-bold text-foreground truncate leading-tight">
                {booking.client_name}
              </span>
              <span className="text-sm font-medium text-muted-foreground/70 truncate">
                {serviceNames}
              </span>
            </div>
            {booking.dynamic_pricing_label && h >= 230 && (
              <div className="pt-0.5">
                <PricingBadge dynamicLabel={booking.dynamic_pricing_label} size="md" />
              </div>
            )}
          </div>
          {/* Footer — price pinned to the bottom edge of the block */}
          <div
            className="flex items-end justify-between gap-3 pt-3"
            style={{ borderTop: '0.5px solid var(--border)' }}
          >
            <span
              className="text-[11px] font-semibold uppercase tracking-wider leading-none"
              style={{ color: 'var(--text-secondary)' }}
            >
              Сума
            </span>
            <span className="text-2xl font-bold tabular-nums text-foreground leading-none">
              {formatPrice(booking.total_price)}
            </span>
          </div>
        </div>
      ) : (
        // Top-anchored (md / lg) — start-time sits on its hour line; type scales with height
        <div
          className={cn(
            'flex flex-col w-full h-full pl-[17px] pr-3 min-w-0',
            size === 'lg' ? 'pt-3 gap-1.5' : 'pt-2 gap-1',
          )}
        >
          {/* Row 1 — time range + status label */}
          <div className="flex items-center justify-between gap-2">
            <span
              className={cn(
                'font-bold tabular-nums text-foreground leading-none',
                size === 'lg' ? 'text-base' : 'text-[15px]',
              )}
            >
              {booking.start_time}
              <span className="font-semibold" style={{ color: 'var(--text-tertiary)' }}>
                –{booking.end_time}
              </span>
            </span>
            <span
              className="text-[9px] font-bold uppercase tracking-wider shrink-0 leading-none"
              style={{ color: 'var(--text-secondary)' }}
            >
              {cfg.label}
            </span>
          </div>
          {/* Row 2 — client name + price */}
          <div className="flex items-end justify-between gap-2 min-w-0">
            <span
              className={cn(
                'font-display font-bold text-foreground truncate min-w-0',
                size === 'lg' ? 'text-lg' : 'text-base',
              )}
            >
              {booking.client_name}
            </span>
            <span className="text-sm font-bold tabular-nums text-foreground shrink-0">
              {formatPrice(booking.total_price)}
            </span>
          </div>
          {/* Row 3 — service (only on lg, which has the height for it) */}
          {size === 'lg' && (
            <span className="text-xs text-muted-foreground/60 truncate font-medium">
              {serviceNames}
            </span>
          )}
        </div>
      )}
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// DraggableBookingBlock
// ─────────────────────────────────────────────────────────────────────────────
function DraggableBookingBlock({
  booking,
  startHour,
  endHour,
  totalHeight,
  date,
}: {
  booking: TL;
  startHour: number;
  endHour: number;
  totalHeight: number;
  date: string;
}) {
  const { showToast } = useToast();
  const qc = useQueryClient();
  const [isPending, startT] = useTransition();
  const [isDragging, setIsDragging] = useState(false);
  const [previewStart, setPreviewStart] = useState<string | null>(null);
  const [pendingTime, setPendingTime] = useState<{ newStart: string; newEnd: string } | null>(null);

  const dragY    = useMotionValue(0);
  const duration = toMins(booking.end_time) - toMins(booking.start_time);
  const isDraggable = booking.status === 'confirmed';

  const snapTime = (offsetY: number): string => {
    const rawMins = toMins(booking.start_time) + (offsetY / HOUR_HEIGHT) * 60;
    const snapped = Math.round(rawMins / 15) * 15;
    const clamped = Math.max(startHour * 60, Math.min(endHour * 60 - duration, snapped));
    return fromMins(clamped);
  };

  const handleConfirm = () => {
    if (!pendingTime) return;
    startT(async () => {
      const { error } = await rescheduleBooking(booking.id, date, pendingTime.newStart, pendingTime.newEnd);
      dragY.set(0);
      setPendingTime(null);
      if (error) {
        showToast({ type: 'error', title: 'Помилка', message: error });
      } else {
        showToast({ type: 'success', title: `Перенесено на ${pendingTime.newStart}` });
        await invalidateBookingQueries(qc);
      }
    });
  };

  const handleCancel = () => {
    dragY.set(0);
    setPendingTime(null);
  };

  return (
    <motion.div
      drag={isDraggable && !pendingTime ? 'y' : false}
      dragConstraints={{
        top:    -booking.top,
        bottom: totalHeight - booking.top - booking.height,
      }}
      dragElastic={0}
      dragMomentum={false}
      onDragStart={() => setIsDragging(true)}
      onDrag={(_, info) => setPreviewStart(snapTime(info.offset.y))}
      onDragEnd={(_, info) => {
        setIsDragging(false);
        setPreviewStart(null);

        // Swipe protection
        if (Math.abs(info.offset.y) < DRAG_THRESHOLD) {
          dragY.set(0);
          return;
        }

        const newStart = snapTime(info.offset.y);
        const snapY    = ((toMins(newStart) - toMins(booking.start_time)) / 60) * HOUR_HEIGHT;
        dragY.set(snapY);

        if (newStart === booking.start_time) {
          dragY.set(0);
          return;
        }

        const newEnd = fromMins(toMins(newStart) + duration);
        setPendingTime({ newStart, newEnd });
      }}
      className={cn('select-none', isDragging && 'z-30')}
      style={{
        position: 'absolute',
        left:     56,
        right:    12,
        top:      booking.top,
        height:   booking.height,
        cursor:   !isDraggable
          ? 'default'
          : isPending
          ? 'wait'
          : isDragging
          ? 'grabbing'
          : 'grab',
        opacity: isPending ? 0.45 : 1,
        y:       dragY,
      }}
    >
      <div className={cn('h-full py-1', (isDragging || !!pendingTime) && 'pointer-events-none')}>
        <TimelineBlock booking={booking} />
      </div>

      {/* Drag time overlay — inside card, never clipped by timeline overflow:hidden */}
      <AnimatePresence>
        {isDragging && previewStart && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ type: 'spring', stiffness: 400, damping: 24 }}
            className="absolute top-2 left-2 px-2.5 py-1.5 rounded-xl text-[11px] font-bold tabular-nums pointer-events-none z-40"
            style={{
              background: 'var(--foreground)',
              color:      'var(--background)',
              boxShadow:  '0 2px 10px rgba(0,0,0,0.35)',
              whiteSpace: 'nowrap',
            }}
          >
            {previewStart} → {fromMins(toMins(previewStart) + duration)}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Inline confirmation overlay */}
      <AnimatePresence>
        {pendingTime && (
          <motion.div
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.94 }}
            transition={{ type: 'spring', stiffness: 380, damping: 28 }}
            className="absolute inset-0 rounded-2xl flex flex-col items-center justify-center gap-2 z-50 pointer-events-auto"
            style={{
              background:     'var(--surface)',
              border:         '1.5px solid var(--accent)',
              boxShadow:      '0 4px 20px rgba(140,110,99,0.18)',
              backdropFilter: 'blur(8px)',
            }}
          >
            <p className="text-[11px] font-bold tabular-nums text-foreground">
              {pendingTime.newStart}
              <span className="mx-1 opacity-40">→</span>
              {pendingTime.newEnd}
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleConfirm}
                disabled={isPending}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-success/15 text-success text-[11px] font-bold transition-all active:scale-95 disabled:opacity-50"
              >
                {isPending
                  ? <Loader2 size={10} className="animate-spin" />
                  : <Check size={10} />}
                Так
              </button>
              <button
                type="button"
                onClick={handleCancel}
                disabled={isPending}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-error/10 text-error text-[11px] font-bold transition-all active:scale-95 disabled:opacity-50"
              >
                <X size={10} />
                Ні
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// VerticalTimeline
// ─────────────────────────────────────────────────────────────────────────────
export function VerticalTimeline({
  bookings,
  date,
  workStart    = '09:00',
  workEnd      = '18:00',
  isWorkingDay = true,
  bufferMinutes = 0,
  breaks        = [],
  onOpportunityClick,
}: Props) {
  const startHour   = Math.floor(toMins(workStart) / 60);
  const endHour     = Math.ceil(toMins(workEnd)   / 60);
  const hours       = Array.from({ length: endHour - startHour + 1 }, (_, i) => startHour + i);
  const totalHeight = (endHour - startHour) * HOUR_HEIGHT;

  const toTop = (time: string) =>
    ((toMins(time) - startHour * 60) / 60) * HOUR_HEIGHT;

  const now      = new Date();
  const nowMins  = now.getHours() * 60 + now.getMinutes();
  const nowTop   = ((nowMins - startHour * 60) / 60) * HOUR_HEIGHT;
  const nowLabel = `${pad2(now.getHours())}:${pad2(now.getMinutes())}`;
  const isToday  = new Date().toISOString().split('T')[0] === date;

  const timelineBookings = useMemo(() => {
    return bookings
      .filter(b => b.date === date && b.status !== 'cancelled')
      .map(b => {
        const startMin = toMins(b.start_time);
        const endMin   = toMins(b.end_time);
        const top      = toTop(b.start_time);
        const height   = Math.max(((endMin - startMin) / 60) * HOUR_HEIGHT, 52);
        return { ...b, top, height };
      });
  }, [bookings, date, startHour]);

  // Free gaps — splits each gap around break windows so they never overlap break bands
  const gaps = useMemo(() => {
    if (!isWorkingDay) return [];
    const sorted = [...timelineBookings].sort((a, b) => a.top - b.top);
    const result: { top: number; height: number; time: string }[] = [];
    let lastEnd = toMins(workStart);
    const wEnd  = toMins(workEnd);

    const splitAroundBreaks = (gStart: number, gEnd: number) => {
      let subs: { start: number; end: number }[] = [{ start: gStart, end: gEnd }];
      for (const br of breaks) {
        const brS = toMins(br.start);
        const brE = toMins(br.end);
        subs = subs.flatMap(sg => {
          if (brE <= sg.start || brS >= sg.end) return [sg];
          const parts: { start: number; end: number }[] = [];
          if (brS - sg.start >= 30) parts.push({ start: sg.start, end: brS });
          if (sg.end - brE >= 30) parts.push({ start: brE, end: sg.end });
          return parts;
        });
      }
      return subs;
    };

    for (const b of sorted) {
      const bStart = toMins(b.start_time);
      if (bStart - lastEnd >= 30) {
        for (const sg of splitAroundBreaks(lastEnd, bStart)) {
          result.push({
            top:    toTop(fromMins(sg.start)),
            height: ((sg.end - sg.start) / 60) * HOUR_HEIGHT,
            time:   fromMins(sg.start),
          });
        }
      }
      lastEnd = Math.max(lastEnd, toMins(b.end_time) + bufferMinutes);
    }

    if (wEnd - lastEnd >= 30) {
      for (const sg of splitAroundBreaks(lastEnd, wEnd)) {
        result.push({
          top:    toTop(fromMins(sg.start)),
          height: ((sg.end - sg.start) / 60) * HOUR_HEIGHT,
          time:   fromMins(sg.start),
        });
      }
    }
    return result;
  }, [timelineBookings, workStart, workEnd, bufferMinutes, breaks, isWorkingDay]);

  if (!isWorkingDay && timelineBookings.length === 0) {
    return (
      <div
        className="rounded-3xl flex flex-col items-center justify-center gap-3 py-14"
        style={{ border: '0.5px solid var(--border)', background: 'var(--surface)' }}
      >
        <div className="size-12 rounded-full bg-muted/10 flex items-center justify-center">
          <Moon size={22} className="text-muted-foreground/30" />
        </div>
        <p className="text-sm font-semibold text-muted-foreground/60">Вихідний день</p>
        <p className="text-xs text-muted-foreground/70">Робочий графік не заплановано</p>
      </div>
    );
  }

  return (
    <div
      className="relative"
      style={{
        height:       totalHeight,
        background:   'var(--surface)',
        border:       '0.5px solid var(--border-strong)',
        borderRadius: 24,
        overflow:     'hidden',
      }}
    >
      {/* Non-working day banner */}
      {!isWorkingDay && (
        <div
          className="absolute top-0 left-0 right-0 z-10 flex items-center gap-2 px-4 py-2"
          style={{ background: 'rgba(255,170,50,0.08)', borderBottom: '0.5px solid var(--border)' }}
        >
          <Moon size={13} className="text-warning shrink-0" />
          <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--warning)' }}>
            Вихідний день
          </span>
        </div>
      )}

      {/* Hour grid + bold hour markers */}
      <div className="absolute inset-0 pointer-events-none">
        {hours.map(h => (
          <div key={h} className="absolute left-0 right-0" style={{ top: (h - startHour) * HOUR_HEIGHT }}>
            <div
              className="absolute left-0 right-0"
              style={{ borderTop: '0.5px solid var(--border)', opacity: 0.7 }}
            />
            {/* Hour marker — same sans tabular family/weight as the card time text */}
            <div className="absolute flex items-baseline gap-[2px] select-none" style={{ left: 8, top: 5 }}>
              <span
                className="tabular-nums leading-none font-bold"
                style={{
                  fontSize:      '1.6rem',
                  color:         'var(--text-primary)',
                  letterSpacing: '-0.02em',
                }}
              >
                {pad2(h)}
              </span>
              <span
                className="leading-none tabular-nums font-bold"
                style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}
              >
                00
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Vertical spine */}
      <div
        className="absolute top-0 bottom-0 pointer-events-none"
        style={{ left: 52, width: 2, background: 'var(--border-strong)', opacity: 0.65 }}
      />

      {/* Break windows */}
      {breaks.map((br, i) => {
        const top    = toTop(br.start);
        const height = ((toMins(br.end) - toMins(br.start)) / 60) * HOUR_HEIGHT;
        if (height <= 0) return null;
        return (
          <div
            key={`break-${i}`}
            className="absolute pointer-events-none left-0 right-0"
            style={{ top, height }}
          >
            {/* Full-width tinted band */}
            <div
              className="absolute inset-0"
              style={{
                background:
                  'repeating-linear-gradient(135deg, rgba(0,0,0,0.025) 0, rgba(0,0,0,0.025) 2px, transparent 2px, transparent 10px)',
                borderTop:    '0.5px solid var(--border)',
                borderBottom: '0.5px solid var(--border)',
              }}
            />
            {/* Label */}
            <div className="absolute left-14 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
              <Coffee size={10} className="text-muted-foreground/30" />
              <span
                className="text-[9px] font-bold uppercase tracking-widest"
                style={{ color: 'var(--text-tertiary)', opacity: 0.55 }}
              >
                Перерва · {br.start}–{br.end}
              </span>
            </div>
          </div>
        );
      })}

      {/* Free gap buttons */}
      {gaps.map((gap, i) => (
        <motion.button
          key={`gap-${i}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={() => onOpportunityClick?.(gap.time)}
          className="absolute group"
          style={{ left: 56, right: 12, top: gap.top + 3, height: Math.max(gap.height - 6, 28) }}
        >
          <div
            className="w-full h-full rounded-2xl flex items-center justify-center gap-2 transition-all"
            style={{ border: '1px dashed var(--accent)', opacity: 0.3, background: 'transparent' }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLDivElement).style.opacity    = '0.65';
              (e.currentTarget as HTMLDivElement).style.background = 'rgba(140,110,99,0.05)';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLDivElement).style.opacity    = '0.3';
              (e.currentTarget as HTMLDivElement).style.background = 'transparent';
            }}
          >
            <span style={{ color: 'var(--accent)' }}><Plus size={12} strokeWidth={2.5} /></span>
            <span
              className="text-[10px] font-bold uppercase tracking-widest"
              style={{ color: 'var(--accent)' }}
            >
              {gap.time}
            </span>
          </div>
        </motion.button>
      ))}

      {/* Draggable booking blocks (each manages its own buffer zone) */}
      {timelineBookings.map(b => (
        <DraggableBookingBlock
          key={b.id}
          booking={b}
          startHour={startHour}
          endHour={endHour}
          totalHeight={totalHeight}
          date={date}
        />
      ))}

      {/* Now indicator — hero current-time line with chip */}
      {isToday && nowTop >= 0 && nowTop < totalHeight && (
        <div
          className="absolute pointer-events-none z-20"
          style={{ top: nowTop, left: 4, right: 0 }}
        >
          <div className="flex items-center -translate-y-1/2">
            <span
              className="px-2 py-0.5 rounded-md text-[11px] font-bold tabular-nums shrink-0 leading-none"
              style={{ background: 'var(--error)', color: '#fff', boxShadow: '0 2px 8px rgba(192,91,91,0.4)' }}
            >
              {nowLabel}
            </span>
            <div
              className="size-2 rounded-full shrink-0 -ml-0.5"
              style={{ background: 'var(--error)', boxShadow: '0 0 8px var(--error)' }}
            />
            <div className="flex-1 h-[2px]" style={{ background: 'var(--error)', opacity: 0.85 }} />
          </div>
        </div>
      )}
    </div>
  );
}
