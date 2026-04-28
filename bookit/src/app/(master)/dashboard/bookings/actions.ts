'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { sendPush } from '@/lib/push';

import { revalidatePath } from 'next/cache';

export async function confirmBooking(bookingId: string): Promise<{ error: string | null }> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Не авторизовано' };

    const admin = createAdminClient();

    // 1. Ownership Verify (Security Gate)
    const { data: booking } = await admin
      .from('bookings')
      .select('master_id')
      .eq('id', bookingId)
      .single();

    if (!booking) return { error: 'Запис не знайдено' };
    if (booking.master_id !== user.id) return { error: 'Немає доступу' };

    // 2. Atomic Update
    const { error } = await admin
      .from('bookings')
      .update({ 
        status: 'confirmed', 
        status_changed_at: new Date().toISOString() 
      })
      .eq('id', bookingId);

    if (error) return { error: error.message };

    // 3. Revalidate & Notify
    // PERF-HIGH-1: granular invalidation — don't blow away full layout cache on every booking op
    revalidatePath('/dashboard/bookings');
    revalidatePath('/my/bookings');
    
    // Fire-and-forget notification
    notifyClientOnStatusChange(bookingId, 'confirmed').catch(console.error);

    return { error: null };
  } catch (err) {
    console.error('[confirmBooking]', err);
    return { error: 'Помилка сервера' };
  }
}

export async function cancelBooking(bookingId: string): Promise<{ error: string | null }> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Не авторизовано' };

    const admin = createAdminClient();

    // 1. Ownership Verify
    const { data: booking } = await admin
      .from('bookings')
      .select('master_id')
      .eq('id', bookingId)
      .single();

    if (!booking) return { error: 'Запис не знайдено' };
    if (booking.master_id !== user.id) return { error: 'Немає доступу' };

    // 2. Atomic Update
    const { error } = await admin
      .from('bookings')
      .update({ 
        status: 'cancelled', 
        status_changed_at: new Date().toISOString() 
      })
      .eq('id', bookingId);

    if (error) return { error: error.message };

    // 3. Revalidate & Notify
    // PERF-HIGH-1: granular invalidation — don't blow away full layout cache on every booking op
    revalidatePath('/dashboard/bookings');
    revalidatePath('/my/bookings');
    
    notifyClientOnStatusChange(bookingId, 'cancelled').catch(console.error);

    return { error: null };
  } catch (err) {
    console.error('[cancelBooking]', err);
    return { error: 'Помилка сервера' };
  }
}

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

    // PERF-HIGH-1: granular invalidation — don't blow away full layout cache on every booking op
    revalidatePath('/dashboard/bookings');
    revalidatePath('/my/bookings');

    return { error: null };
  } catch (err) {
    console.error('[rescheduleBooking]', err);
    return { error: 'Помилка сервера' };
  }
}

export async function updateBookingStatus(
  bookingId: string,
  status: string,
): Promise<{ error: string | null }> {
  console.log(`[updateBookingStatus] Starting for ID: ${bookingId}, target status: ${status}`);
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Не авторизовано' };

    const admin = createAdminClient();

    // 1. Ownership Verify
    const { data: booking } = await admin
      .from('bookings')
      .select('master_id')
      .eq('id', bookingId)
      .single();

    if (!booking) return { error: 'Запис не знайдено' };
    if (booking.master_id !== user.id) return { error: 'Немає доступу' };

    // 2. Atomic Update
    const { error } = await admin
      .from('bookings')
      .update({ 
        status: status as any, 
        status_changed_at: new Date().toISOString() 
      })
      .eq('id', bookingId);

    if (error) {
      console.error(`[updateBookingStatus] DB Update Error:`, error);
      return { error: error.message };
    }

    console.log(`[updateBookingStatus] Success for ID: ${bookingId}`);
    // 3. Revalidate & Notify
    // PERF-HIGH-1: granular invalidation — don't blow away full layout cache on every booking op
    revalidatePath('/dashboard/bookings');
    revalidatePath('/my/bookings');
    
    // Notify client for specific statuses
    if (status === 'confirmed' || status === 'cancelled') {
        notifyClientOnStatusChange(bookingId, status).catch(console.error);
    }

    return { error: null };
  } catch (err) {
    console.error('[updateBookingStatus] Catch-all error:', err);
    return { error: 'Помилка сервера' };
  }
}

export async function completeBooking(bookingId: string): Promise<{ error: string | null }> {
  console.log(`[completeBooking] Starting for ID: ${bookingId}`);
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Не авторизовано' };

    const admin = createAdminClient();

    // 1. Ownership Verify — also fetch client_id for review nudge
    const { data: booking } = await admin
      .from('bookings')
      .select('master_id, client_id')
      .eq('id', bookingId)
      .single();

    if (!booking) return { error: 'Запис не знайдено' };
    if (booking.master_id !== user.id) return { error: 'Немає доступу' };

    // 2. Atomic Update
    const { error } = await admin
      .from('bookings')
      .update({
        status: 'completed',
        status_changed_at: new Date().toISOString()
      })
      .eq('id', bookingId);

    if (error) {
      console.error(`[completeBooking] DB Update Error:`, error);
      return { error: error.message };
    }

    console.log(`[completeBooking] Success for ID: ${bookingId}`);
    // 3. Revalidate
    revalidatePath('/dashboard/bookings');
    revalidatePath('/my/bookings');

    // 4. Fire-and-forget: nudge client to leave a review
    if (booking.client_id) {
      notifyClientReviewNudge(bookingId, booking.client_id).catch(console.error);
    }

    return { error: null };
  } catch (err) {
    console.error('[completeBooking] Catch-all error:', err);
    return { error: 'Помилка сервера' };
  }
}

async function notifyClientReviewNudge(bookingId: string, clientId: string): Promise<void> {
  try {
    const admin = createAdminClient();

    // In-app notification for client
    await admin.from('notifications').insert({
      recipient_id: clientId,
      title: 'Як пройшов ваш візит? ⭐',
      body: 'Залишіть відгук — це займе лише хвилину і дуже допоможе майстру.',
      type: 'new_review',
      related_booking_id: bookingId,
    });

    // Web Push to client (best-effort)
    const { data: subs } = await admin
      .from('push_subscriptions')
      .select('subscription')
      .eq('user_id', clientId);

    if (subs && subs.length > 0) {
      const { sendPush } = await import('@/lib/push');
      await Promise.allSettled(
        subs.map(s => sendPush(s.subscription, {
          title: 'Як пройшов ваш візит? ⭐',
          body: 'Залишіть відгук — це допоможе майстру.',
          url: `/my/bookings?bookingId=${bookingId}`,
        }))
      );
    }
  } catch (err) {
    console.error('[notifyClientReviewNudge]', err);
  }
}

export async function updateMasterNotes(
  bookingId: string,
  notes: string,
): Promise<{ error: string | null }> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Не авторизовано' };

    const admin = createAdminClient();

    // 1. Ownership Verify
    const { data: booking } = await admin
      .from('bookings')
      .select('master_id')
      .eq('id', bookingId)
      .single();

    if (!booking) return { error: 'Запис не знайдено' };
    if (booking.master_id !== user.id) return { error: 'Немає доступу' };

    // 2. Update Notes
    const { error } = await admin
      .from('bookings')
      .update({ master_notes: notes })
      .eq('id', bookingId);

    if (error) return { error: error.message };

    // PERF-HIGH-1: notes-only change — no layout bust needed
    revalidatePath('/dashboard/bookings');

    return { error: null };
  } catch (err) {
    console.error('[updateMasterNotes]', err);
    return { error: 'Помилка сервера' };
  }
}

export async function approveReview(
  reviewId: string,
  approved: boolean,
): Promise<{ error: string | null }> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Не авторизовано' };

    const admin = createAdminClient();

    // 1. Ownership verify — review must belong to this master
    const { data: review } = await admin
      .from('reviews')
      .select('master_id')
      .eq('id', reviewId)
      .single();

    if (!review) return { error: 'Відгук не знайдено' };
    if (review.master_id !== user.id) return { error: 'Немає доступу' };

    // 2. Approve → publish | Decline → delete
    if (approved) {
      const { error } = await admin
        .from('reviews')
        .update({ is_published: true })
        .eq('id', reviewId);
      if (error) return { error: error.message };
    } else {
      const { error } = await admin
        .from('reviews')
        .delete()
        .eq('id', reviewId);
      if (error) return { error: error.message };
    }

    revalidatePath('/dashboard/reviews');

    return { error: null };
  } catch (err) {
    console.error('[approveReview]', err);
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
        pushSent = results.some(r => r.status === 'fulfilled' && r.value.ok);
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
          sms: { sender: 'BookIT', text: body },
        }),
      });
    }
  } catch (error) {
    console.error('[notifyClientOnStatusChange] Error:', error);
  }
}
