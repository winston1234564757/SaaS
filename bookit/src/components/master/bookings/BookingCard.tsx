'use client';

import { useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { useQueryClient } from '@tanstack/react-query';
import { Check, X, Loader2, CheckCircle2, UserX } from 'lucide-react';
import { useToast } from '@/lib/toast/context';
import { PricingBadge } from '@/components/shared/PricingBadge';
import type { BookingWithServices } from '@/lib/supabase/hooks/useBookings';
import { formatPrice } from '@/components/master/services/types';
import { BOOKING_STATUS_CONFIG } from '@/lib/constants/bookingStatus';
import { parseError } from '@/lib/utils/errors';
import {
  confirmBooking,
  cancelBooking,
  completeBooking,
  updateBookingStatus,
} from '@/app/(master)/dashboard/bookings/actions';

interface BookingCardProps {
  booking: BookingWithServices;
  index: number;
}

export function BookingCard({ booking, index }: BookingCardProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const qc = useQueryClient();
  const { showToast } = useToast();
  const cfg = BOOKING_STATUS_CONFIG[booking.status];
  const serviceNames = booking.services.map(s => s.name).join(', ') || 'Без послуги';
  const hasActions = booking.status === 'pending' || booking.status === 'confirmed';
  const hasBadge = !!booking.dynamic_pricing_label;

  const openModal = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('bookingId', booking.id);
    router.push(`?${params.toString()}`, { scroll: false });
  };

  const invalidateAll = async () => {
    await Promise.all([
      qc.invalidateQueries({ queryKey: ['bookings'] }),
      qc.invalidateQueries({ queryKey: ['wizard-schedule'] }),
      qc.invalidateQueries({ queryKey: ['dashboard-stats'] }),
      qc.invalidateQueries({ queryKey: ['weekly-overview'] }),
      qc.invalidateQueries({ queryKey: ['monthly-booking-count'] }),
      qc.invalidateQueries({ queryKey: ['unified-sales'] }),
    ]);
  };

  const [isPendingConfirm, startConfirm] = useTransition();
  const [isPendingCancel, startCancel] = useTransition();
  const [isPendingComplete, startComplete] = useTransition();
  const [isPendingNoShow, startNoShow] = useTransition();
  const isAnyPending = isPendingConfirm || isPendingCancel || isPendingComplete || isPendingNoShow;

  const handleConfirm = () =>
    startConfirm(async () => {
      const { error } = await confirmBooking(booking.id);
      if (error) {
        showToast({ type: 'error', title: 'Помилка', message: parseError(error) });
      } else {
        showToast({ type: 'success', title: 'Запис підтверджено' });
        await invalidateAll();
      }
    });

  const handleCancel = () =>
    startCancel(async () => {
      const { error } = await cancelBooking(booking.id);
      if (error) {
        showToast({ type: 'error', title: 'Помилка', message: parseError(error) });
      } else {
        showToast({ type: 'success', title: 'Запис скасовано' });
        await invalidateAll();
      }
    });

  const handleComplete = () =>
    startComplete(async () => {
      const { error } = await completeBooking(booking.id);
      if (error) {
        showToast({ type: 'error', title: 'Помилка', message: parseError(error) });
      } else {
        showToast({ type: 'success', title: 'Запис завершено' });
        await invalidateAll();
      }
    });

  const handleNoShow = () =>
    startNoShow(async () => {
      const { error } = await updateBookingStatus(booking.id, 'no_show');
      if (error) {
        showToast({ type: 'error', title: 'Помилка', message: parseError(error) });
      } else {
        showToast({ type: 'success', title: 'Статус оновлено' });
        await invalidateAll();
      }
    });

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, type: 'spring', stiffness: 300, damping: 26 }}
      className="bento-card overflow-hidden"
    >
      <div className="flex">
        {/* ── Status accent strip ─────────────────── */}
        <div
          className="w-[3px] shrink-0 my-3 ml-3 rounded-full"
          style={{ background: cfg.color }}
        />

        {/* ── Card body ───────────────────────────── */}
        <div className="flex-1 min-w-0">

          {/* Main clickable row */}
          <button
            onClick={openModal}
            className="w-full flex items-center gap-3 px-3 py-3.5 text-left hover:bg-white/25 transition-colors rounded-xl active:scale-95 transition-all"
          >
            {/* Time */}
            <div className="shrink-0 w-[52px] text-center">
              <p className="text-[15px] font-bold tabular-nums text-foreground leading-none">
                {booking.start_time}
              </p>
              <p className="text-[11px] text-muted-foreground/60 mt-0.5 tabular-nums">
                {booking.end_time}
              </p>
            </div>

            {/* Divider */}
            <div className="w-px self-stretch bg-[#F0DDD6] shrink-0" />

            {/* Name + Service */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground truncate">
                {booking.client_name}
              </p>
              <p className="text-xs text-muted-foreground/60 truncate mt-0.5">
                {serviceNames}
              </p>
            </div>

            {/* Status pill + Price — isolated on the right, no badge here */}
            <div className="shrink-0 flex flex-col items-end gap-1 ml-1">
              <span
                className="text-[11px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap"
                style={{ color: cfg.color, background: cfg.bg }}
              >
                {cfg.label}
              </span>
              <p className="text-sm font-bold text-foreground tabular-nums">
                {formatPrice(booking.total_price)}
              </p>
            </div>
          </button>

          {/* Pricing badge — own row, full available width */}
          {hasBadge && (
            <div className="px-3 pb-2.5 -mt-0.5">
              <PricingBadge dynamicLabel={booking.dynamic_pricing_label} size="sm" />
            </div>
          )}

          {/* Quick action buttons */}
          {hasActions && (
            <div
              className="flex flex-wrap gap-2 px-3 pb-3.5"
              onClick={e => e.stopPropagation()}
            >
              {booking.status === 'pending' && (
                <button
                  onClick={handleConfirm}
                  disabled={isAnyPending}
                  className="flex items-center gap-1.5 px-3 h-7 rounded-lg bg-primary/12 text-primary hover:bg-primary/20 text-xs font-semibold transition-colors disabled:opacity-50 active:scale-95 transition-all"
                >
                  {isPendingConfirm
                    ? <Loader2 size={11} className="animate-spin" />
                    : <Check size={11} />}
                  Підтвердити
                </button>
              )}
              <button
                onClick={handleComplete}
                disabled={isAnyPending}
                className="flex items-center gap-1.5 px-3 h-7 rounded-lg bg-success/12 text-success hover:bg-success/20 text-xs font-semibold transition-colors disabled:opacity-50 active:scale-95 transition-all"
              >
                {isPendingComplete
                  ? <Loader2 size={11} className="animate-spin" />
                  : <CheckCircle2 size={11} />}
                Завершити
              </button>
              {booking.status === 'confirmed' && (
                <button
                  onClick={handleNoShow}
                  disabled={isAnyPending}
                  className="flex items-center gap-1.5 px-3 h-7 rounded-lg bg-muted-foreground/60/12 text-muted-foreground/60 hover:bg-muted-foreground/60/20 text-xs font-semibold transition-colors disabled:opacity-50 active:scale-95 transition-all"
                >
                  {isPendingNoShow
                    ? <Loader2 size={11} className="animate-spin" />
                    : <UserX size={11} />}
                  Не прийшов
                </button>
              )}
              <button
                onClick={handleCancel}
                disabled={isAnyPending}
                className="flex items-center gap-1.5 px-3 h-7 rounded-lg bg-destructive/12 text-destructive hover:bg-destructive/20 text-xs font-semibold transition-colors disabled:opacity-50 active:scale-95 transition-all"
              >
                {isPendingCancel
                  ? <Loader2 size={11} className="animate-spin" />
                  : <X size={11} />}
                Скасувати
              </button>
            </div>
          )}
        </div>

        {/* Right padding */}
        <div className="w-3 shrink-0" />
      </div>
    </motion.div>
  );
}
