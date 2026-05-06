'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { sendPush, broadcastPush } from '@/lib/push';
import { sendTelegramMessage } from '@/lib/telegram';
import { sendTurboSMS } from '@/lib/turbosms';

import { format } from 'date-fns';
import { uk } from 'date-fns/locale';
import { revalidatePath } from 'next/cache';

export async function confirmBooking(bookingId: string): Promise<{ error: string | null }> {
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
        status: 'confirmed', 
        status_changed_at: new Date().toISOString() 
      })
      .eq('id', bookingId);

    if (error) throw error;

    revalidatePath('/dashboard/bookings');
    revalidatePath('/my/bookings');
    
    notifyClientOnStatusChange(bookingId, 'confirmed').catch(err => 
      console.error('[confirmBooking] Notification failed:', err)
    );

    return { error: null };
  } catch (err: any) {
    console.error('[confirmBooking] error:', err);
    return { error: 'Не вдалося підтвердити запис. Спробуйте пізніше.' };
  }
}

export async function cancelBooking(bookingId: string): Promise<{ error: string | null }> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Не авторизовано' };

    const admin = createAdminClient();

    const { data: booking } = await admin
      .from('bookings')
      .select('master_id, client_id, date, start_time, end_time')
      .eq('id', bookingId)
      .single();

    if (!booking) return { error: 'Запис не знайдено' };
    if (booking.master_id !== user.id) return { error: 'Немає доступу' };

    const { error } = await admin
      .from('bookings')
      .update({ 
        status: 'cancelled', 
        status_changed_at: new Date().toISOString() 
      })
      .eq('id', bookingId);

    if (error) throw error;

    revalidatePath('/dashboard/bookings');
    revalidatePath('/my/bookings');
    
    await Promise.allSettled([
      notifyClientOnStatusChange(bookingId, 'cancelled'),
      notifyFreedSlot(booking.master_id, booking.date, booking.start_time, booking.end_time, booking.client_id)
    ]);

    return { error: null };
  } catch (err: any) {
    console.error('[cancelBooking] error:', err);
    return { error: 'Не вдалося скасувати запис.' };
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

    if (error) throw error;

    revalidatePath('/dashboard/bookings');
    revalidatePath('/my/bookings');

    return { error: null };
  } catch (err: any) {
    console.error('[rescheduleBooking] error:', err);
    return { error: 'Не вдалося перенести запис.' };
  }
}

export async function updateBookingStatus(
  bookingId: string,
  status: string,
): Promise<{ error: string | null }> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Не авторизовано' };

    const admin = createAdminClient();

    const { data: booking } = await admin
      .from('bookings')
      .select('master_id, client_id, date, start_time, end_time')
      .eq('id', bookingId)
      .single();

    if (!booking) return { error: 'Запис не знайдено' };
    if (booking.master_id !== user.id) return { error: 'Немає доступу' };

    const { error } = await admin
      .from('bookings')
      .update({ 
        status: status as any, 
        status_changed_at: new Date().toISOString() 
      })
      .eq('id', bookingId);

    if (error) throw error;

    revalidatePath('/dashboard/bookings');
    revalidatePath('/my/bookings');
    
    if (status === 'confirmed' || status === 'cancelled') {
        const tasks = [notifyClientOnStatusChange(bookingId, status)];
        if (status === 'cancelled') {
          tasks.push(notifyFreedSlot(booking.master_id, booking.date, booking.start_time, booking.end_time, booking.client_id));
        }
        await Promise.allSettled(tasks);
    }

    return { error: null };
  } catch (err: any) {
    console.error('[updateBookingStatus] error:', err);
    return { error: 'Не вдалося оновити статус запису.' };
  }
}

export async function completeBooking(bookingId: string): Promise<{ error: string | null }> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Не авторизовано' };

    const admin = createAdminClient();

    const { data: booking } = await admin
      .from('bookings')
      .select('master_id, client_id')
      .eq('id', bookingId)
      .single();

    if (!booking) return { error: 'Запис не знайдено' };
    if (booking.master_id !== user.id) return { error: 'Немає доступу' };

    const { error } = await admin
      .from('bookings')
      .update({
        status: 'completed',
        status_changed_at: new Date().toISOString()
      })
      .eq('id', bookingId);

    if (error) throw error;

    revalidatePath('/dashboard/bookings');
    revalidatePath('/my/bookings');

    if (booking.client_id) {
      notifyClientReviewNudge(bookingId, booking.client_id).catch(err => 
        console.error('[completeBooking] Review nudge failed:', err)
      );
    }

    return { error: null };
  } catch (err: any) {
    console.error('[completeBooking] error:', err);
    return { error: 'Не вдалося завершити запис.' };
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
          url: `/my/bookings`,
        }))
      );
    }

    // Telegram to client
    const { data: profile } = await admin
      .from('profiles')
      .select('telegram_chat_id')
      .eq('id', clientId)
      .single();

    if (profile?.telegram_chat_id) {
      const { sendTelegramMessage } = await import('@/lib/telegram');
      const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://bookit.com.ua';
      const replyMarkup = { inline_keyboard: [[{ text: 'Залишити відгук', url: `${SITE_URL}/my/bookings` }]] };
      await sendTelegramMessage(
        profile.telegram_chat_id, 
        `<b>Як пройшов ваш візит? ⭐</b>\n\nЗалишіть відгук — це займе лише хвилину і дуже допоможе майстру.`, 
        replyMarkup
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

    const { data: booking } = await admin
      .from('bookings')
      .select('master_id')
      .eq('id', bookingId)
      .single();

    if (!booking) return { error: 'Запис не знайдено' };
    if (booking.master_id !== user.id) return { error: 'Немає доступу' };

    const { error } = await admin
      .from('bookings')
      .update({ master_notes: notes })
      .eq('id', bookingId);

    if (error) throw error;

    revalidatePath('/dashboard/bookings');
    return { error: null };
  } catch (err: any) {
    console.error('[updateMasterNotes] error:', err);
    return { error: 'Не вдалося зберегти нотатки.' };
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

    const { data: review } = await admin
      .from('reviews')
      .select('master_id')
      .eq('id', reviewId)
      .single();

    if (!review) return { error: 'Відгук не знайдено' };
    if (review.master_id !== user.id) return { error: 'Немає доступу' };

    if (approved) {
      const { error } = await admin
        .from('reviews')
        .update({ is_published: true })
        .eq('id', reviewId);
      if (error) throw error;
    } else {
      const { error } = await admin
        .from('reviews')
        .delete()
        .eq('id', reviewId);
      if (error) throw error;
    }

    revalidatePath('/dashboard/reviews');
    return { error: null };
  } catch (err: any) {
    console.error('[approveReview] error:', err);
    return { error: 'Не вдалося обробити відгук.' };
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

    // ── Спроба 0: In-App Notification ────────────────────────────────────
    if (booking.client_id) {
      await admin.from('notifications').insert({
        recipient_id: booking.client_id,
        title,
        body,
        type: status === 'confirmed' ? 'new_booking' : 'booking_cancelled',
        related_booking_id: bookingId,
      });
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
          subs.map(sub => sendPush(sub.subscription as any, { title, body, url: '/my/bookings' }))
        );
        console.log(`[notifyClientOnStatusChange] Push results for client ${booking.client_id}:`, results);
        
        let anyOk = false;
        const expiredEndpoints: string[] = [];
        results.forEach((r, i) => {
          if (r.status === 'fulfilled') {
            if (r.value.ok) anyOk = true;
            if (r.value.gone) expiredEndpoints.push((subs[i].subscription as any).endpoint);
          }
        });
        
        if (expiredEndpoints.length > 0) {
          admin.from('push_subscriptions').delete().in('endpoint', expiredEndpoints).then();
        }
        
        pushSent = anyOk;
      } else {
        console.log(`[notifyClientOnStatusChange] No push subscriptions found for client ${booking.client_id}`);
      }
    } else {
      console.log(`[notifyClientOnStatusChange] booking.client_id is null`);
    }

    if (pushSent) return;

    // ── Спроба 2: Telegram ───────────────────────────────────────────────
    let telegramSent = false;
    if (booking.client_id) {
      const { data: profile } = await admin
        .from('profiles')
        .select('telegram_chat_id')
        .eq('id', booking.client_id)
        .single();
      
      if (profile?.telegram_chat_id) {
        const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://bookit.com.ua';
        const replyMarkup = { inline_keyboard: [[{ text: 'Деталі запису', url: `${SITE_URL}/my/bookings` }]] };
        telegramSent = await sendTelegramMessage(profile.telegram_chat_id, `<b>${title}</b>\n\n${body}`, replyMarkup);
      }
    }

    if (telegramSent) return;

    // ── Спроба 3: TurboSMS fallback ──────────────────────────────────────
    await sendTurboSMS(booking.client_phone, body);
  } catch (error) {
    console.error('[notifyClientOnStatusChange] Error:', error);
  }
}

export async function notifyFreedSlot(
  masterId: string,
  date: string,
  time: string,
  endTime: string | null,
  excludedClientId: string | null
): Promise<void> {
  try {
    const admin = createAdminClient();

    // 1. Get Master Profile & Config
    const { data: mp } = await admin
      .from('master_profiles')
      .select('slug, waitlist_discount_pct, profiles(full_name)')
      .eq('id', masterId)
      .single();
    
    if (!mp) return;

    const masterName = (mp.profiles as any)?.full_name ?? 'Майстер';
    let bookingUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? 'https://bookit.com.ua'}/${mp.slug}`;
    const dateStr = format(new Date(date + 'T00:00:00'), 'd MMMM', { locale: uk });
    const timeStr = time.slice(0, 5);

    let notifTitle = `⚡ Звільнилося місце!`;
    let notifBody = `До ${masterName} щойно звільнилося місце на ${dateStr} о ${timeStr}. Встигніть записатися першим!`;

    // Calculate duration
    let durationMinutes = 60; // default
    if (endTime) {
      const startD = new Date(`1970-01-01T${time}Z`);
      const endD = new Date(`1970-01-01T${endTime}Z`);
      durationMinutes = Math.round((endD.getTime() - startD.getTime()) / 60000);
      bookingUrl += `?max_duration=${durationMinutes}`;
    }

    // Check discount & create Flash Deal
    if (mp.waitlist_discount_pct && mp.waitlist_discount_pct > 0) {
      const { data: flashDeal, error: fdErr } = await admin.from('flash_deals').insert({
        master_id: masterId,
        service_id: null, // Any service
        service_name: 'Звільнене вікно (Waitlist)',
        slot_date: date,
        slot_time: time,
        original_price: 0,
        discount_pct: mp.waitlist_discount_pct,
        expires_at: new Date(new Date().getTime() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
        status: 'active'
      }).select('id').single();

      if (!fdErr && flashDeal) {
        bookingUrl += (bookingUrl.includes('?') ? '&' : '?') + `flash=${flashDeal.id}`;
        notifTitle = `🎁 Звільнилося місце зі знижкою -${mp.waitlist_discount_pct}%!`;
        notifBody = `До ${masterName} щойно звільнилося місце на ${dateStr} о ${timeStr}. Забирайте з унікальною знижкою -${mp.waitlist_discount_pct}%, поки не зайняли інші!`;
      }
    }

    // 2. Get eligible clients via RPC
    const slotTimestamp = `${date}T${time.slice(0, 8)}+03:00`;
    const { data: eligibleRows } = await admin
      .rpc('get_freed_slot_clients', {
        p_master_id: masterId,
        p_slot_timestamp: slotTimestamp,
        p_excluded_client_id: excludedClientId
      });

    const clientIds = (eligibleRows ?? []).map((r: any) => r.client_id);
    if (clientIds.length === 0) return;

    console.log(`[notifyFreedSlot] Sending Waitlist to ${clientIds.length} clients for ${dateStr} ${timeStr}`);

    // 3. In-App Notifications
    await admin.from('notifications').insert(
      clientIds.map((clientId: string) => ({
        recipient_id: clientId,
        title: notifTitle,
        body: notifBody,
        type: 'waitlist_freed_slot',
        channel: 'in_app',
        related_master_id: masterId,
        related_url: bookingUrl,
      }))
    );

    // 4. Web Push
    const { data: pushSubs } = await admin
      .from('push_subscriptions')
      .select('subscription, user_id')
      .in('user_id', clientIds);

    const pushedUserIds = new Set<string>();

    if (pushSubs && pushSubs.length > 0) {
      await broadcastPush(
        pushSubs as any,
        { title: notifTitle, body: notifBody, url: bookingUrl }
      );
      // We assume if they have an active sub, the push was sent
      pushSubs.forEach(sub => pushedUserIds.add(sub.user_id));
    }

    // 5. Telegram (Fallback for clients who didn't get Push)
    const clientsForTg = clientIds.filter((id: string) => !pushedUserIds.has(id));

    if (clientsForTg.length > 0) {
      const { data: profilesWithTg } = await admin
        .from('profiles')
        .select('telegram_chat_id')
        .in('id', clientsForTg)
        .not('telegram_chat_id', 'is', null);

      if (profilesWithTg && profilesWithTg.length > 0) {
        const tgMsg = `<b>${notifTitle}</b>\n\n${notifBody}\n\n<a href="${bookingUrl}">Записатися першим →</a>`;
        await Promise.allSettled(
          profilesWithTg.map(c => {
            const { sendTelegramMessage: sendTg } = require('@/lib/telegram');
            return sendTg(c.telegram_chat_id!, tgMsg);
          })
        );
      }
    }

  } catch (error) {
    console.error('[notifyFreedSlot] Error:', error);
  }
}
