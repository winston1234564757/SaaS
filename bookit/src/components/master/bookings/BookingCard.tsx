'use client';

import { useTransition, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { useQueryClient } from '@tanstack/react-query';
import { Check, X, Loader2, CheckCircle2, UserX } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { uk } from 'date-fns/locale';
import { useToast } from '@/lib/toast/context';
import { PricingBadge } from '@/components/shared/PricingBadge';
import type { BookingWithServices } from '@/lib/supabase/hooks/useBookings';
import { formatPrice } from '@/components/master/services/types';
import { BOOKING_STATUS_CONFIG } from '@/lib/constants/bookingStatus';
import { parseError } from '@/lib/utils/errors';
import { invalidateBookingQueries } from '@/lib/utils/invalidateBookingQueries';
import {
  confirmBooking,
  cancelBooking,
  completeBooking,
  updateBookingStatus,
} from '@/app/(master)/dashboard/bookings/actions';
import { cn } from '@/lib/utils/cn';
import { useConsumablesForBooking } from '@/lib/supabase/hooks/useConsumablesForBooking';
import { MaterialsReviewSheet } from './MaterialsReviewSheet';

interface BookingCardProps {
  booking: BookingWithServices;
  index?: number;
  compact?: boolean;
  hideTime?: boolean;
  hideActions?: boolean;
  showDate?: boolean;
  className?: string;
}

export function BookingCard({
  booking,
  index = 0,
  compact = false,
  hideTime = false,
  hideActions = false,
  showDate = false,
  className,
}: BookingCardProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const qc = useQueryClient();
  const { showToast } = useToast();
  const cfg = BOOKING_STATUS_CONFIG[booking.status];
  const serviceNames = booking.services.map(s => s.name).join(', ') || 'Без послуги';
  const hasActions = !hideActions && (booking.status === 'pending' || booking.status === 'confirmed');
  const hasBadge = !!booking.dynamic_pricing_label;

  const openModal = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('bookingId', booking.id);
    router.push(`?${params.toString()}`, { scroll: false });
  };

  const invalidateAll = () => invalidateBookingQueries(qc);

  const [isPendingConfirm, startConfirm] = useTransition();
  const [isPendingCancel, startCancel] = useTransition();
  const [isPendingComplete, startComplete] = useTransition();
  const [isPendingNoShow, startNoShow] = useTransition();
  const isAnyPending = isPendingConfirm || isPendingCancel || isPendingComplete || isPendingNoShow;

  const [reviewSheetOpen, setReviewSheetOpen] = useState(false);
  const { data: consumables = [], isLoading: consumablesLoading } = useConsumablesForBooking(
    booking.status === 'confirmed' ? booking.id : null
  );

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

  const handleComplete = () => {
    if (consumablesLoading || consumables.length > 0) {
      setReviewSheetOpen(true);
      return;
    }
    startComplete(async () => {
      const { error } = await completeBooking(booking.id);
      if (error) {
        showToast({ type: 'error', title: 'Помилка', message: parseError(error) });
      } else {
        showToast({ type: 'success', title: 'Запис завершено' });
        await invalidateAll();
      }
    });
  };

  const handleCompleteWithConsumables = (reviewed: { product_id: string; qty_used: number }[]) => {
    setReviewSheetOpen(false);
    startComplete(async () => {
      const { error } = await completeBooking(booking.id, reviewed);
      if (error) {
        showToast({ type: 'error', title: 'Помилка', message: parseError(error) });
      } else {
        showToast({ type: 'success', title: 'Запис завершено' });
        await invalidateAll();
      }
    });
  };

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
    <>
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, type: 'spring', stiffness: 260, damping: 28 }}
      className={cn("bento-card overflow-hidden transition-all duration-300 hover:translate-y-[-4px] hover:shadow-2xl hover:border-primary/20 group flex flex-col", className)}
      style={{ border: `1px solid ${cfg.color}`, background: `${cfg.color}08` }}
    >
      <div className="flex flex-1">

        {/* ── Card body ───────────────────────────── */}
        <div className="flex-1 min-w-0 flex flex-col">

          {/* Main clickable row */}
          <button
            type="button"
            onClick={openModal}
            className="w-full flex-1 flex items-center gap-4 lg:gap-6 px-4 py-4 lg:px-8 lg:py-6 text-left hover:bg-secondary/40 transition-colors rounded-2xl active:scale-95 transition-all"
          >
            {/* Time */}
            {!hideTime && (
              <div className="shrink-0 w-[52px] text-center">
                {showDate && (
                  <p className="text-[8px] font-bold text-muted-foreground/40 uppercase tabular-nums leading-none mb-0.5">
                    {format(parseISO(booking.date), 'd MMM', { locale: uk })}
                  </p>
                )}
                <p className="text-[15px] font-bold tabular-nums text-foreground leading-none">
                  {booking.start_time}
                </p>
                {!compact && (
                  <p className="text-[11px] text-muted-foreground/60 mt-0.5 tabular-nums">
                    {booking.end_time}
                  </p>
                )}
              </div>
            )}

            {/* Divider */}
            {!hideTime && (
              <div className="w-px self-stretch bg-[#F0DDD6] shrink-0" />
            )}

            {/* Name + Service */}
            <div className="flex-1 min-w-0">
              <p className="font-display text-base lg:text-xl text-foreground truncate font-bold group-hover:text-primary transition-colors">
                {booking.client_name}
              </p>
              <p className="text-xs lg:text-sm text-muted-foreground/60 truncate mt-1 font-medium">
                {serviceNames}
              </p>
              {(() => {
                const bDate = new Date(booking.date);
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const diffDays = Math.ceil((bDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                const isHighRisk = diffDays >= 20 && (booking.status === 'confirmed' || booking.status === 'pending');
                if (isHighRisk) {
                  return (
                    <p className="text-[10px] text-destructive font-bold mt-1.5 flex items-center gap-1">
                      ⚠️ Ризик неявки: запис заздалегідь (+{diffDays} дн.). Підтвердіть візит!
                    </p>
                  );
                }
                return null;
              })()}
            </div>

            {/* Status pill + Price — isolated on the right, no badge here */}
            {!compact && (
              <div className="shrink-0 flex flex-col items-end gap-2 ml-1">
                <span
                  className="text-[10px] lg:text-[11px] font-bold px-3 py-1 rounded-full whitespace-nowrap uppercase tracking-wider"
                  style={{ color: cfg.color, background: cfg.bg }}
                >
                  {cfg.label}
                </span>
                <p className="text-sm lg:text-lg font-bold text-foreground tabular-nums">
                  {formatPrice(booking.total_price)}
                </p>
              </div>
            )}

            {/* Compact Price */}
            {compact && (
              <p className="text-sm font-bold text-foreground tabular-nums ml-auto">
                {formatPrice(booking.total_price)}
              </p>
            )}
          </button>

          {/* Pricing badge — own row, full available width */}
          {hasBadge && !compact && (
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
                  type="button"
                  onClick={handleConfirm}
                  disabled={isAnyPending}
                  className="flex items-center gap-1.5 px-3 h-11 rounded-lg bg-primary/12 text-primary hover:bg-primary/20 text-xs font-semibold transition-colors disabled:opacity-50 active:scale-95 transition-all"
                >
                  {isPendingConfirm
                    ? <Loader2 size={11} className="animate-spin" />
                    : <Check size={11} />}
                  Підтвердити
                </button>
              )}
              <button
                type="button"
                onClick={handleComplete}
                disabled={isAnyPending}
                className="flex items-center gap-1.5 px-3 h-11 rounded-lg bg-success/12 text-success hover:bg-success/20 text-xs font-semibold transition-colors disabled:opacity-50 active:scale-95 transition-all"
              >
                {isPendingComplete
                  ? <Loader2 size={11} className="animate-spin" />
                  : <CheckCircle2 size={11} />}
                Завершити
              </button>
              {booking.status === 'confirmed' && (
                <button
                  type="button"
                  onClick={handleNoShow}
                  disabled={isAnyPending}
                  className="flex items-center gap-1.5 px-3 h-11 rounded-lg bg-muted-foreground/10 text-muted-foreground/60 hover:bg-muted-foreground/20 text-xs font-semibold transition-colors disabled:opacity-50 active:scale-95 transition-all"
                >
                  {isPendingNoShow
                    ? <Loader2 size={11} className="animate-spin" />
                    : <UserX size={11} />}
                  Не прийшов
                </button>
              )}
              <button
                type="button"
                onClick={handleCancel}
                disabled={isAnyPending}
                className="flex items-center gap-1.5 px-3 h-11 rounded-lg bg-error/10 text-error hover:bg-error/20 text-xs font-semibold transition-colors disabled:opacity-50 active:scale-95 transition-all"
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

    <MaterialsReviewSheet
      bookingId={booking.id}
      open={reviewSheetOpen}
      onConfirm={handleCompleteWithConsumables}
      onClose={() => setReviewSheetOpen(false)}
    />
    </>
  );
}