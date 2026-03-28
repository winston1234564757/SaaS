'use client';

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { createClient } from '../client';
import { useMasterContext } from '../context';
import { useToast } from '@/lib/toast/context';

/**
 * Single consolidated Realtime channel for ALL booking-related invalidation.
 *
 * Previously we had 4 separate channels:
 *   - bookings-realtime (INSERT+UPDATE) — toast + bookings/dashboard-stats
 *   - dashboard-stats   (*) — dashboard-stats
 *   - weekly-overview   (*) — weekly-overview
 *   - notifications-bell (INSERT) — notifications
 *
 * Now everything is handled here. Other hooks (useDashboardStats, useWeeklyOverview,
 * useNotifications) rely on TanStack Query invalidation — no own Realtime channels.
 */
export function useRealtimeNotifications() {
  const { masterProfile } = useMasterContext();
  const { showToast } = useToast();
  const qc = useQueryClient();
  const masterId = masterProfile?.id;

  useEffect(() => {
    if (!masterId) return;

    const supabase = createClient();

    const channel = supabase
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

          const isManual = b.source === 'manual';
          if (!isManual) {
            showToast({
              type: 'success',
              title: 'Новий запис! 🎉',
              message: `${b.client_name} · ${formatDate(b.date)} о ${b.start_time?.slice(0, 5)}`,
              duration: 6000,
            });
          }

          // Invalidate ALL booking-related caches in one place
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

    return () => {
      supabase.removeChannel(channel);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [masterId, showToast]);
}

/**
 * Invalidates ALL booking-related query keys.
 * Called from the single Realtime channel above.
 */
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

