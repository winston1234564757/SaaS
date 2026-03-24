'use server';

import { revalidatePath } from 'next/cache';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { sendPush } from '@/lib/push';

export async function rescheduleBooking(
  bookingId: string,
  date: string,
  startTime: string,
  endTime: string,
): Promise<{ error: string | null }> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Не авторизовано' };

    const admin = createAdminClient();

    const { data: booking } = await admin
      .from('bookings')
      .select('master_id')
      .eq('id', bookingId)
      .single();

    if (!booking) return { error: 'Запис не знайдено' };
    if (booking.master_id !== user.id) return { error: 'Немає доступу' };

    const { error } = await admin
      .from('bookings')
      .update({
        date,
        start_time: startTime,
        end_time: endTime,
        updated_at: new Date().toISOString(),
      })
      .eq('id', bookingId);

    if (error) return { error: error.message };

    revalidatePath('/dashboard/bookings');
    return { error: null };
  } catch (err) {
    console.error('[rescheduleBooking]', err);
    return { error: 'Помилка сервера' };
  }
}

export async function notifyClientOnStatusChange(
  bookingId: string,
  status: string,
): Promise<void> {
  try {
    const admin = createAdminClient();

    const { data: booking } = await admin
      .from('bookings')
      .select('client_id, client_phone, date, start_time, master_profiles(profiles(full_name))')
      .eq('id', bookingId)
      .single();

    if (!booking || !booking.client_phone) return;

    const masterName = (booking.master_profiles as any)?.profiles?.full_name ?? 'Майстра';
    const timeStr = (booking.start_time as string | null)?.slice(0, 5) ?? '';

    let title = '';
    let body = '';
    if (status === 'confirmed') {
      title = 'Запис підтверджено! ✅';
      body = `Ваш візит до ${masterName} на ${booking.date} о ${timeStr} підтверджено.`;
    } else if (status === 'cancelled') {
      title = 'Запис скасовано ❌';
      body = `Ваш візит до ${masterName} на ${booking.date} о ${timeStr} скасовано.`;
    } else {
      return;
    }

    let pushSent = false;

    // ── Спроба 1: Web Push ───────────────────────────────────────────────
    if (booking.client_id) {
      const { data: subs } = await admin
        .from('push_subscriptions')
        .select('subscription')
        .eq('user_id', booking.client_id);

      if (subs && subs.length > 0) {
        const results = await Promise.allSettled(
          subs.map(sub => sendPush(sub.subscription, { title, body, url: '/my/bookings' }))
        );
        pushSent = results.some(r => r.status === 'fulfilled' && r.value === true);
      }
    }

    // ── Спроба 2: TurboSMS fallback ──────────────────────────────────────
    if (!pushSent) {
      await fetch('https://api.turbosms.ua/message/send.json', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.TURBOSMS_TOKEN}`,
        },
        body: JSON.stringify({
          recipients: [booking.client_phone],
          sms: { sender: 'BEAUTY', text: body },
        }),
      });
    }
  } catch (error) {
    console.error('[notifyClientOnStatusChange] Error:', error);
  }
}
