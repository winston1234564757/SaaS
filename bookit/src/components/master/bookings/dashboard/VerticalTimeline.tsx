'use client';

import { useState, useTransition, useMemo } from 'react';
import { motion, AnimatePresence, useMotionValue } from 'framer-motion';
import { useQueryClient } from '@tanstack/react-query';
import { toMins, fromMins } from '@/lib/utils/smartSlots';
import { type BookingWithServices } from '@/lib/supabase/hooks/useBookings';
import { BookingCard } from '../BookingCard';
import { Plus, Moon, Check, X, Loader2, Coffee } from 'lucide-react';
import { useToast } from '@/lib/toast/context';
import { rescheduleBooking } from '@/app/(master)/dashboard/bookings/actions';
import { cn } from '@/lib/utils/cn';
import { invalidateBookingQueries } from '@/lib/utils/invalidateBookingQueries';

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

const STATUS_COLORS: Record<string, string> = {
  confirmed: 'var(--success)',
  pending:   'var(--warning)',
  completed: 'var(--text-tertiary)',
  no_show:   'var(--error)',
};

function padHour(h: number) {
  return String(h).padStart(2, '0') + ':00';
}

type TL = BookingWithServices & { top: number; height: number; color: string };

// ─────────────────────────────────────────────────────────────────────────────
// DraggableBookingBlock
// ─────────────────────────────────────────────────────────────────────────────
function DraggableBookingBlock({
  booking,
  startHour,
  endHour,
  totalHeight,
  date,
  bufferMinutes,
}: {
  booking: TL;
  startHour: number;
  endHour: number;
  totalHeight: number;
  date: string;
  bufferMinutes: number;
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
    <>
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
          <BookingCard booking={booking} compact={false} hideActions hideTime={false} className="h-full" />
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
              <p className="text-[11px] font-black tabular-nums text-foreground">
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

    </>
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

  const now     = new Date();
  const nowMins = now.getHours() * 60 + now.getMinutes();
  const nowTop  = ((nowMins - startHour * 60) / 60) * HOUR_HEIGHT;
  const isToday = new Date().toISOString().split('T')[0] === date;

  const timelineBookings = useMemo(() => {
    return bookings
      .filter(b => b.date === date && b.status !== 'cancelled')
      .map(b => {
        const startMin = toMins(b.start_time);
        const endMin   = toMins(b.end_time);
        const top      = toTop(b.start_time);
        const height   = Math.max(((endMin - startMin) / 60) * HOUR_HEIGHT, 52);
        const color    = STATUS_COLORS[b.status] ?? 'var(--accent)';
        return { ...b, top, height, color };
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

      {/* Hour grid */}
      <div className="absolute inset-0 pointer-events-none">
        {hours.map(h => (
          <div key={h} className="absolute left-0 right-0" style={{ top: (h - startHour) * HOUR_HEIGHT }}>
            <div
              className="absolute left-0 right-0"
              style={{ borderTop: '0.5px solid var(--border)', opacity: 0.55 }}
            />
            <span
              className="absolute select-none"
              style={{
                left:          8,
                top:           4,
                color:         'var(--text-secondary)',
                fontFamily:    'var(--font-cormorant, Georgia, serif)',
                fontSize:      '0.8rem',
                letterSpacing: '-0.01em',
                opacity:       0.8,
              }}
            >
              {padHour(h)}
            </span>
          </div>
        ))}
      </div>

      {/* Vertical accent line */}
      <div
        className="absolute top-0 bottom-0 pointer-events-none"
        style={{ left: 52, width: 2, background: 'var(--border-strong)', opacity: 0.5 }}
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
          bufferMinutes={bufferMinutes}
        />
      ))}

      {/* Now indicator */}
      {isToday && nowTop >= 0 && nowTop < totalHeight && (
        <div
          className="absolute pointer-events-none z-10"
          style={{ top: nowTop, left: 44, right: 0 }}
        >
          <div className="flex items-center gap-1">
            <div
              className="size-2 rounded-full shrink-0"
              style={{ background: 'var(--error)', boxShadow: '0 0 6px var(--error)' }}
            />
            <div className="flex-1 h-px" style={{ background: 'var(--error)', opacity: 0.6 }} />
          </div>
        </div>
      )}
    </div>
  );
}
