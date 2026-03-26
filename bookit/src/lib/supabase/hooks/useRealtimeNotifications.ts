'use client';

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { createClient } from '../client';
import { useMasterContext } from '../context';
import { useToast } from '@/lib/toast/context';

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

          // Інвалідуємо лише кеш цього майстра
          qc.invalidateQueries({ queryKey: ['bookings', masterId] });
          qc.invalidateQueries({ queryKey: ['dashboard-stats', masterId] });
          qc.invalidateQueries({ queryKey: ['weekly-overview', masterId] });
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
          // Інвалідуємо кеш при оновленні статусу
          qc.invalidateQueries({ queryKey: ['bookings', masterId] });
          qc.invalidateQueries({ queryKey: ['dashboard-stats', masterId] });

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
  }, [masterId]);
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  const months = ['січ','лют','бер','квіт','трав','черв','лип','серп','вер','жовт','лист','груд'];
  return `${d.getDate()} ${months[d.getMonth()]}`;
}
