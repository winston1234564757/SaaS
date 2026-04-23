'use client';

import { useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { useQueryClient } from '@tanstack/react-query';
import { Check, X, Loader2, CheckCircle2, UserX } from 'lucide-react';
import { PricingBadge } from '@/components/shared/PricingBadge';
import type { BookingWithServices } from '@/lib/supabase/hooks/useBookings';
import type { BookingStatus } from '@/types/database';
import { formatPrice } from '@/components/master/services/types';
import { BOOKING_STATUS_CONFIG } from '@/lib/constants/bookingStatus';
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
  const cfg = BOOKING_STATUS_CONFIG[booking.status];
  const serviceNames = booking.services.map(s => s.name).join(', ') || 'Без послуги';

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
    ]);
  };

  const [isPendingConfirm, startConfirm] = useTransition();
  const [isPendingCancel, startCancel] = useTransition();
  const [isPendingComplete, startComplete] = useTransition();
  const [isPendingNoShow, startNoShow] = useTransition();

  const isAnyPending = isPendingConfirm || isPendingCancel || isPendingComplete || isPendingNoShow;

  const handleConfirm = () => {
    startConfirm(async () => {
      const { error } = await confirmBooking(booking.id);
      if (error) { console.error(error); return; }
      await invalidateAll();
    });
  };

  const handleCancel = () => {
    startCancel(async () => {
      const { error } = await cancelBooking(booking.id);
      if (error) { console.error(error); return; }
      await invalidateAll();
    });
  };

  const handleComplete = () => {
    startComplete(async () => {
      const { error } = await completeBooking(booking.id);
      if (error) { console.error(error); return; }
      await invalidateAll();
    });
  };

  const handleNoShow = () => {
    startNoShow(async () => {
      const { error } = await updateBookingStatus(booking.id, 'no_show');
      if (error) { console.error(error); return; }
      await invalidateAll();
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, type: 'spring', stiffness: 300, damping: 24 }}
      className="bento-card overflow-hidden"
    >
      <button
        onClick={openModal}
        className="w-full flex items-center gap-3 p-4 text-left hover:bg-white/30 transition-colors"
      >
        {/* Time block */}
        <div className="flex-shrink-0 text-center w-14">
          <p className="text-base font-bold text-[#2C1A14] leading-none">{booking.start_time}</p>
          <p className="text-[11px] text-[#A8928D] mt-0.5">{booking.end_time}</p>
        </div>

        {/* Divider */}
        <div className="w-px h-10 bg-[#F5E8E3] flex-shrink-0" />

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-[#2C1A14] truncate">{booking.client_name}</p>
          <p className="text-xs text-[#A8928D] break-words leading-tight mt-0.5">{serviceNames}</p>
        </div>

        {/* Status + price */}
        <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
          <span
            className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
            style={{ color: cfg.color, background: cfg.bg }}
          >
            {cfg.label}
          </span>
          <p className="text-sm font-bold text-[#2C1A14]">{formatPrice(booking.total_price)}</p>
          <PricingBadge dynamicLabel={booking.dynamic_pricing_label} size="sm" />
        </div>
      </button>

      {/* Quick Actions */}
      {(booking.status === 'pending' || booking.status === 'confirmed') && (
        <div
          className="flex flex-wrap gap-2 px-4 pb-3"
          onClick={e => e.stopPropagation()}
        >
          {booking.status === 'pending' && (
            <button
              onClick={handleConfirm}
              disabled={isAnyPending}
              className="flex items-center gap-1.5 px-3 h-7 rounded-lg bg-[#789A99]/12 text-[#789A99] hover:bg-[#789A99]/22 text-xs font-semibold transition-colors disabled:opacity-50"
            >
              {isPendingConfirm ? <Loader2 size={11} className="animate-spin" /> : <Check size={11} />}
              Підтвердити
            </button>
          )}
          <button
            onClick={handleComplete}
            disabled={isAnyPending}
            className="flex items-center gap-1.5 px-3 h-7 rounded-lg bg-[#5C9E7A]/12 text-[#5C9E7A] hover:bg-[#5C9E7A]/22 text-xs font-semibold transition-colors disabled:opacity-50"
          >
            {isPendingComplete ? <Loader2 size={11} className="animate-spin" /> : <CheckCircle2 size={11} />}
            Завершити
          </button>
          {booking.status === 'confirmed' && (
            <button
              onClick={handleNoShow}
              disabled={isAnyPending}
              className="flex items-center gap-1.5 px-3 h-7 rounded-lg bg-[#A8928D]/12 text-[#A8928D] hover:bg-[#A8928D]/22 text-xs font-semibold transition-colors disabled:opacity-50"
            >
              {isPendingNoShow ? <Loader2 size={11} className="animate-spin" /> : <UserX size={11} />}
              Не прийшов
            </button>
          )}
          <button
            onClick={handleCancel}
            disabled={isAnyPending}
            className="flex items-center gap-1.5 px-3 h-7 rounded-lg bg-[#C05B5B]/12 text-[#C05B5B] hover:bg-[#C05B5B]/22 text-xs font-semibold transition-colors disabled:opacity-50"
          >
            {isPendingCancel ? <Loader2 size={11} className="animate-spin" /> : <X size={11} />}
            Скасувати
          </button>
        </div>
      )}
    </motion.div>
  );
}
