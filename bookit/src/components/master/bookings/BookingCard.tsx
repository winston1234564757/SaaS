'use client';

import { useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Check, X, Loader2 } from 'lucide-react';
import { PricingBadge } from '@/components/shared/PricingBadge';
import { createClient } from '@/lib/supabase/client';
import type { BookingWithServices } from '@/lib/supabase/hooks/useBookings';
import type { BookingStatus } from '@/types/database';
import { formatPrice } from '@/components/master/services/types';
import { 
  confirmBooking, 
  cancelBooking 
} from '@/app/(master)/dashboard/bookings/actions';

interface BookingCardProps {
  booking: BookingWithServices;
  index: number;
}

const STATUS_CONFIG: Record<BookingStatus, { label: string; color: string; bg: string }> = {
  pending:   { label: 'Очікує',       color: '#D4935A', bg: 'rgba(212,147,90,0.12)'   },
  confirmed: { label: 'Підтверджено', color: '#789A99', bg: 'rgba(120,154,153,0.12)' },
  completed: { label: 'Завершено',    color: '#5C9E7A', bg: 'rgba(92,158,122,0.12)'   },
  cancelled: { label: 'Скасовано',    color: '#C05B5B', bg: 'rgba(192,91,91,0.12)'    },
  no_show:   { label: 'Не прийшов',   color: '#A8928D', bg: 'rgba(168,146,141,0.12)'  },
};

export function BookingCard({ booking, index }: BookingCardProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const qc = useQueryClient();
  const cfg = STATUS_CONFIG[booking.status];
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

  const handleConfirm = () => {
    startConfirm(async () => {
      const { error } = await confirmBooking(booking.id);
      if (error) {
        console.error(error);
        return;
      }
      await invalidateAll();
    });
  };

  const handleCancel = () => {
    startCancel(async () => {
      const { error } = await cancelBooking(booking.id);
      if (error) {
        console.error(error);
        return;
      }
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

      {/* Quick Actions — тільки для pending */}
      {booking.status === 'pending' && (
        <div
          className="flex gap-2 px-4 pb-3"
          onClick={e => e.stopPropagation()}
        >
          <button
            onClick={handleConfirm}
            disabled={isPendingConfirm || isPendingCancel}
            className="flex items-center gap-1.5 px-3 h-7 rounded-lg bg-[#789A99]/12 text-[#789A99] hover:bg-[#789A99]/22 text-xs font-semibold transition-colors disabled:opacity-50"
          >
            {isPendingConfirm
              ? <Loader2 size={11} className="animate-spin" />
              : <Check size={11} />
            }
            Підтвердити
          </button>
          <button
            onClick={handleCancel}
            disabled={isPendingConfirm || isPendingCancel}
            className="flex items-center gap-1.5 px-3 h-7 rounded-lg bg-[#C05B5B]/12 text-[#C05B5B] hover:bg-[#C05B5B]/22 text-xs font-semibold transition-colors disabled:opacity-50"
          >
            {isPendingCancel
              ? <Loader2 size={11} className="animate-spin" />
              : <X size={11} />
            }
            Скасувати
          </button>
        </div>
      )}
    </motion.div>
  );
}
