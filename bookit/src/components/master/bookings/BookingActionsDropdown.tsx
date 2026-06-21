'use client';

import { useTransition, useState } from 'react';
import { CheckCircle2, UserCheck, XCircle, MoreVertical, Loader2, Calendar } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter, useSearchParams } from 'next/navigation';
import { useToast } from '@/lib/toast/context';
import {
  confirmBooking,
  completeBooking,
  cancelBooking,
} from '@/app/(master)/dashboard/bookings/actions';
import { DropdownMenu } from '@/components/ui/DropdownMenu';
import type { BookingWithServices } from '@/lib/supabase/hooks/useBookings';
import { parseError } from '@/lib/utils/errors';
import { invalidateBookingQueries } from '@/lib/utils/invalidateBookingQueries';
import { useConsumablesForBooking } from '@/lib/supabase/hooks/useConsumablesForBooking';
import { MaterialsReviewSheet } from './MaterialsReviewSheet';

type BookingSlice = Pick<
  BookingWithServices,
  'id' | 'status' | 'date' | 'start_time' | 'end_time'
>;

interface BookingActionsDropdownProps {
  booking: BookingSlice;
  /** Called after a successful action. Defaults to broad query invalidation. */
  onSuccess?: () => Promise<void>;
}

export function BookingActionsDropdown({ booking, onSuccess }: BookingActionsDropdownProps) {
  const qc = useQueryClient();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showToast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [reviewSheetOpen, setReviewSheetOpen] = useState(false);

  const defaultInvalidate = () => invalidateBookingQueries(qc);

  const run = (
    action: () => Promise<{ error: string | null }>,
    successTitle: string,
  ) => {
    startTransition(async () => {
      const { error } = await action();
      if (error) {
        showToast({ type: 'error', title: 'Помилка', message: parseError(error) });
      } else {
        showToast({ type: 'success', title: successTitle });
        await (onSuccess ?? defaultInvalidate)();
      }
    });
  };

  const openBookingModal = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('bookingId', booking.id);
    router.push(`?${params.toString()}`, { scroll: false });
  };

  const { id, status } = booking;

  const canConfirm    = status === 'pending';
  const canComplete   = status === 'confirmed';
  const { data: consumables = [], isLoading: consumablesLoading } = useConsumablesForBooking(canComplete ? id : null);
  const canCancel     = status === 'pending' || status === 'confirmed';
  const canReschedule = status === 'pending' || status === 'confirmed';

  if (!canConfirm && !canComplete && !canCancel && !canReschedule) return null;

  const items = [
    ...(canConfirm
      ? [
          {
            icon: <CheckCircle2 size={14} />,
            label: 'Підтвердити',
            onClick: () => run(() => confirmBooking(id), 'Запис підтверджено'),
            className: 'text-primary',
            disabled: isPending,
          },
        ]
      : []),
    ...(canComplete
      ? [
          {
            icon: <UserCheck size={14} />,
            label: 'Завершити',
            onClick: () => {
              if (consumablesLoading || consumables.length > 0) {
                setReviewSheetOpen(true);
              } else {
                run(() => completeBooking(id), 'Запис завершено');
              }
            },
            className: 'text-success',
            disabled: isPending,
          },
        ]
      : []),
    ...(canReschedule
      ? [
          {
            icon: <Calendar size={14} />,
            label: 'Перенести',
            onClick: openBookingModal,
            className: 'text-primary',
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
            className: 'text-destructive',
            disabled: isPending,
          },
        ]
      : []),
  ];

  const handleCompleteWithConsumables = (reviewed: { product_id: string; qty_used: number }[]) => {
    setReviewSheetOpen(false);
    run(() => completeBooking(id, reviewed), 'Запис завершено');
  };

  return (
    <>
      <DropdownMenu
        trigger={
          isPending ? (
            <Loader2 size={16} className="animate-spin text-primary" />
          ) : (
            <MoreVertical size={16} />
          )
        }
        items={items}
        align="right"
        disabled={isPending}
      />

      <MaterialsReviewSheet
        bookingId={id}
        open={reviewSheetOpen}
        onConfirm={handleCompleteWithConsumables}
        onClose={() => setReviewSheetOpen(false)}
      />
    </>
  );
}
