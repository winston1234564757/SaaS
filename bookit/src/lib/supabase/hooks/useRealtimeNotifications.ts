'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { createClient } from '../client';
import { useMasterContext } from '../context';
import { useToast } from '@/lib/toast/context';
import type { ToastType } from '@/lib/toast/context';

/**
 * Single consolidated Realtime channel for ALL booking-related invalidation
 * + notification-table INSERT toasts.
 *
 * Booking channel (bookings-realtime-{masterId}):
 *   INSERT  → "Новий запис" toast + invalidate all
 *   UPDATE  → cancellation toast + invalidate all
 *
 * Notifications channel (notifications-realtime-{masterId}):
 *   INSERT  → toast for new_review / unhandled_booking / etc.
 *   Skips new_booking / booking_cancelled — already covered by booking channel above.
 */
export function useRealtimeNotifications() {
  const { masterProfile } = useMasterContext();
  const { showToast } = useToast();
  const qc = useQueryClient();
  const router = useRouter();
  const masterId = masterProfile?.id;

  useEffect(() => {
    if (!masterId) return;

    const supabase = createClient();

    // ── Channel 1: bookings table ────────────────────────────────────────────
    const bookingChannel = supabase
      .channel(`bookings-realtime-${masterId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'bookings',
          filter: `master_id=eq.${masterId}`,
        },
        (payload: { new: Record<string, unknown> }) => {
          const b = payload.new as {
            client_name: string;
            date: string;
            start_time: string;
            source?: string;
          };

          if (b.source !== 'manual') {
            showToast({
              type: 'success',
              title: 'Новий запис! 🎉',
              message: `${b.client_name} · ${formatDate(b.date)} о ${b.start_time?.slice(0, 5)}`,
              duration: 6000,
            });
          }

          invalidateAll(qc, masterId);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'bookings',
          filter: `master_id=eq.${masterId}`,
        },
        (payload: { new: Record<string, unknown> }) => {
          const b = payload.new as { status: string; client_name: string };

          invalidateAll(qc, masterId);

          if (b.status === 'cancelled') {
            showToast({
              type: 'warning',
              title: 'Запис скасовано',
              message: `${b.client_name} скасував запис`,
              duration: 5000,
            });
          }
        }
      )
      .subscribe();

    // ── Channel 2: notifications table ───────────────────────────────────────
    // Fires toasts for new_review, unhandled_booking, etc.
    // Skips new_booking + booking_cancelled — those are already shown by channel 1.
    const SKIP_TYPES = new Set(['new_booking', 'booking_cancelled']);

    const notifChannel = supabase
      .channel(`notifications-realtime-${masterId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `recipient_id=eq.${masterId}`,
        },
        (payload: { new: Record<string, unknown> }) => {
          const n = payload.new as {
            id: string;
            type: string;
            title: string;
            body: string;
            related_booking_id: string | null;
          };

          // Avoid duplicate toasts for events already handled by the booking channel
          if (SKIP_TYPES.has(n.type)) {
            qc.invalidateQueries({ queryKey: ['notifications', masterId] });
            return;
          }

          const toastType = notifTypeToToastType(n.type);
          const bookingId = n.related_booking_id;

          showToast({
            type: toastType,
            title: n.title,
            message: n.body || undefined,
            duration: 6000,
            ...(bookingId
              ? {
                  action: {
                    label: 'Переглянути',
                    onClick: () =>
                      router.push(`/dashboard/bookings?bookingId=${bookingId}`),
                  },
                }
              : {}),
          });

          qc.invalidateQueries({ queryKey: ['notifications', masterId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(bookingChannel);
      supabase.removeChannel(notifChannel);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [masterId, showToast, router]);
}

function notifTypeToToastType(type: string): ToastType {
  switch (type) {
    case 'new_review':        return 'success';
    case 'unhandled_booking': return 'warning';
    default:                  return 'info';
  }
}

function invalidateAll(qc: ReturnType<typeof useQueryClient>, masterId: string) {
  qc.invalidateQueries({ queryKey: ['bookings', masterId] });
  qc.invalidateQueries({ queryKey: ['wizard-schedule', masterId] });
  qc.invalidateQueries({ queryKey: ['dashboard-stats', masterId] });
  qc.invalidateQueries({ queryKey: ['weekly-overview', masterId] });
  qc.invalidateQueries({ queryKey: ['notifications', masterId] });
  qc.invalidateQueries({ queryKey: ['monthly-booking-count'] });
  qc.invalidateQueries({ queryKey: ['clients', masterId] });
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  const months = ['січ','лют','бер','квіт','трав','черв','лип','серп','вер','жовт','лист','груд'];
  return `${d.getDate()} ${months[d.getMonth()]}`;
}
