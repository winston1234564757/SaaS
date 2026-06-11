'use client';

import { useEffect, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { useToast, type ToastType } from '@/lib/toast/context';
import { createClient } from '../client';
import { useMasterContext } from '../context';

// ── Web Audio: critical notification sounds ──────────────────────────────────

let _audioCtx: AudioContext | null = null;

function getAudioCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  try {
    if (!_audioCtx) _audioCtx = new AudioContext();
    return _audioCtx;
  } catch {
    return null;
  }
}

function playNotificationSound(variant: 'positive' | 'warning'): void {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const ctx = getAudioCtx();
  if (!ctx) return;

  const play = () => {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';

    if (variant === 'positive') {
      osc.frequency.setValueAtTime(523.25, now);        // C5
      osc.frequency.setValueAtTime(659.25, now + 0.12); // E5
    } else {
      osc.frequency.setValueAtTime(349.23, now);        // F4
    }

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.22, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.65);
    osc.start(now);
    osc.stop(now + 0.65);
  };

  if (ctx.state === 'suspended') {
    ctx.resume().then(play).catch(() => {});
  } else {
    play();
  }
}

function soundVariant(type: string): 'positive' | 'warning' | null {
  if (type === 'new_booking' || type === 'new_review') return 'positive';
  if (type === 'booking_cancelled' || type === 'unhandled_booking') return 'warning';
  return null;
}

// ── Hook ─────────────────────────────────────────────────────────────────────

/**
 * Consolidated Realtime channels for the master dashboard.
 */
export function useRealtimeNotifications() {
  const { masterProfile } = useMasterContext();
  const { showToast } = useToast();
  const qc = useQueryClient();
  const router = useRouter();
  const pathname = usePathname();
  const masterId = masterProfile?.id;

  const invalidateAll = (id: string) => {
    qc.invalidateQueries({ queryKey: ['bookings', id] });
    qc.invalidateQueries({ queryKey: ['wizard-schedule', id] });
    qc.invalidateQueries({ queryKey: ['dashboard-stats', id] });
    qc.invalidateQueries({ queryKey: ['busyness', id] });
    qc.invalidateQueries({ queryKey: ['weekly-overview', id] });
    qc.invalidateQueries({ queryKey: ['notifications', id] });
    qc.invalidateQueries({ queryKey: ['monthly-booking-count'] });
    qc.invalidateQueries({ queryKey: ['clients', id] });
  };

  const markReadAndNavigate = async (notifId: string, url: string) => {
    const supabase = createClient();
    await supabase.from('notifications').update({ is_read: true }).eq('id', notifId);
    qc.invalidateQueries({ queryKey: ['notifications', masterId] });
    router.push(url);
  };

  useEffect(() => {
    console.log('[Realtime] masterId:', masterId);
    if (!masterId) return;

    const supabase = createClient();

    // ── Channel 1: bookings — cache invalidation only ───────────────────────
    const bookingChannel = supabase
      .channel(`bookings-realtime-${masterId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'bookings', filter: `master_id=eq.${masterId}` },
        (payload: { new: Record<string, unknown> }) => {
          console.log('[Realtime] Booking INSERT:', payload);
          invalidateAll(masterId);
        },
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'bookings', filter: `master_id=eq.${masterId}` },
        (payload: { new: Record<string, unknown>; old: Record<string, unknown> }) => {
          console.log('[Realtime] Booking UPDATE:', payload);
          invalidateAll(masterId);
        },
      )
      .subscribe((status: string) => {
        console.log('[Realtime] Booking Channel status:', status);
      });

    // ── Channel 2: notifications — actionable toasts ─────────────────
    const notifChannel = supabase
      .channel(`notifications-realtime-${masterId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `recipient_id=eq.${masterId}` },
        (payload: { new: Record<string, unknown> }) => {
          console.log('[Realtime] Notification INSERT:', payload);
          const n = payload.new as {
            id: string;
            type: string;
            title: string;
            body: string;
            related_booking_id: string | null;
          };

          qc.invalidateQueries({ queryKey: ['notifications', masterId] });

          const sv = soundVariant(n.type);
          if (sv) playNotificationSound(sv);

          if (n.type === 'support_user_reply' && (pathname === '/dashboard/support/chat' || pathname === '/my/support/chat')) {
            console.log('[Realtime] Suppressing support notification toast because user is on support chat page.');
            return;
          }

          const targetUrl = resolveUrl(n.type, n.related_booking_id);
          const actionLabel = n.type === 'new_review' ? 'Переглянути відгук' : 'Переглянути запис';

          console.log('[Realtime] Showing toast:', n.title);
          showToast({
            type: toastTypeMap(n.type),
            title: n.title,
            message: n.body || undefined,
            duration: 7000,
            action: {
              label: actionLabel,
              onClick: () => markReadAndNavigate(n.id, targetUrl),
            },
          });
        },
      )
      .subscribe((status: string) => {
        console.log('[Realtime] Notif Channel status:', status);
      });

    return () => {
      supabase.removeChannel(bookingChannel);
      supabase.removeChannel(notifChannel);
    };
  }, [masterId, invalidateAll, markReadAndNavigate, qc, showToast, pathname]);

  return null;
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function resolveUrl(type: string, bookingId: string | null): string {
  if (type === 'new_review') return '/dashboard/reviews';
  if (bookingId) return `/dashboard/bookings?bookingId=${bookingId}`;
  return '/dashboard';
}

function toastTypeMap(type: string): ToastType {
  switch (type) {
    case 'new_booking':        return 'success';
    case 'new_review':         return 'success';
    case 'booking_cancelled':  return 'warning';
    case 'unhandled_booking':  return 'warning';
    default:                   return 'info';
  }
}
