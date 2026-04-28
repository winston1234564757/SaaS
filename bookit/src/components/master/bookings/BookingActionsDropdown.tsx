'use client';

import { useTransition } from 'react';
import { CheckCircle2, UserCheck, XCircle, MoreVertical, Loader2 } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/lib/toast/context';
import {
  confirmBooking,
  completeBooking,
  cancelBooking,
} from '@/app/(master)/dashboard/bookings/actions';
import { DropdownMenu } from '@/components/ui/DropdownMenu';
import type { BookingWithServices } from '@/lib/supabase/hooks/useBookings';
import { getNow } from '@/lib/utils/now';

type BookingSlice = Pick<
  BookingWithServices,
  'id' | 'status' | 'date' | 'start_time' | 'end_time'
>;

interface BookingActionsDropdownProps {
  booking: BookingSlice;
  /** Called after a successful action. Defaults to broad query invalidation. */
  onSuccess?: () => Promise<void>;
}

function isEndTimePast(date: string, endTime: string): boolean {
  const now = getNow();
  const [h, m] = endTime.split(':').map(Number);
  const bookingEnd = new Date(date);
  bookingEnd.setHours(h, m, 0, 0);
  return now >= bookingEnd;
}

export function BookingActionsDropdown({ booking, onSuccess }: BookingActionsDropdownProps) {
  const qc = useQueryClient();
  const { showToast } = useToast();
  const [isPending, startTransition] = useTransition();

  const defaultInvalidate = async () => {
    await Promise.all([
      qc.invalidateQueries({ queryKey: ['bookings'] }),
      qc.invalidateQueries({ queryKey: ['dashboard-stats'] }),
      qc.invalidateQueries({ queryKey: ['weekly-overview'] }),
      qc.invalidateQueries({ queryKey: ['monthly-booking-count'] }),
      qc.invalidateQueries({ queryKey: ['unified-sales'] }),
    ]);
  };

  const run = (
    action: () => Promise<{ error: string | null }>,
    successTitle: string,
  ) => {
    startTransition(async () => {
      const { error } = await action();
      if (error) {
        showToast({ type: 'error', title: 'Помилка', message: error });
      } else {
        showToast({ type: 'success', title: successTitle });
        await (onSuccess ?? defaultInvalidate)();
      }
    });
  };

  const { id, status, date, end_time } = booking;

  const canConfirm = status === 'pending';
  const canComplete = status === 'confirmed' && isEndTimePast(date, end_time);
  const canCancel   = status === 'pending' || status === 'confirmed';

  if (!canConfirm && !canComplete && !canCancel) return null;

  const items = [
    ...(canConfirm
      ? [
          {
            icon: <CheckCircle2 size={14} />,
            label: 'Підтвердити',
            onClick: () => run(() => confirmBooking(id), 'Запис підтверджено'),
            className: 'text-[#789A99]',
            disabled: isPending,
          },
        ]
      : []),
    ...(canComplete
      ? [
          {
            icon: <UserCheck size={14} />,
            label: 'Завершити',
            onClick: () => run(() => completeBooking(id), 'Запис завершено'),
            className: 'text-[#5C9E7A]',
            disabled: isPending,
          },
        ]
      : []),
    ...(canCancel
      ? [
          {
            icon: <XCircle size={14} />,
            label: 'Скасувати',
            onClick: () => run(() => cancelBooking(id), 'Запис скасовано'),
            className: 'text-[#C05B5B]',
            disabled: isPending,
          },
        ]
      : []),
  ];

  return (
    <DropdownMenu
      trigger={
        isPending ? (
          <Loader2 size={16} className="animate-spin text-[#789A99]" />
        ) : (
          <MoreVertical size={16} />
        )
      }
      items={items}
      align="right"
      disabled={isPending}
    />
  );
}
