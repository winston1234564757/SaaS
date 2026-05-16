'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { 
  notifyClientOnStatusChange, 
  notifyClientOnReschedule 
} from '@/lib/notifications';

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
    
    // Notifications handled by centralized Orchestrator
    const { data: b } = await admin
      .from('bookings')
      .select('client_id, master_id, date, start_time, master_profiles(profiles(full_name)), booking_services(service_name)')
      .eq('id', bookingId)
      .single();

    if (b && b.client_id) {
      const services = (b.booking_services as any[]).map(s => s.service_name).join(', ');
      const masterName = (b.master_profiles as any)?.profiles?.full_name ?? 'Майстра';

      notifyClientOnStatusChange({
        clientId: b.client_id,
        masterId: b.master_id,
        masterName,
        bookingId,
        date: b.date,
        startTime: b.start_time,
        services,
        status: 'confirmed'
      }).catch(err => console.error('[confirmBooking] Notification failed:', err));
    }

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
      .select('master_id')
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
    
    // Notifications handled by centralized Orchestrator
    const { data: b } = await admin
      .from('bookings')
      .select('client_id, master_id, date, start_time, master_profiles(profiles(full_name)), booking_services(service_name)')
      .eq('id', bookingId)
      .single();

    if (b && b.client_id) {
      const services = (b.booking_services as any[]).map(s => s.service_name).join(', ');
      const masterName = (b.master_profiles as any)?.profiles?.full_name ?? 'Майстра';

      notifyClientOnStatusChange({
        clientId: b.client_id,
        masterId: b.master_id,
        masterName,
        bookingId,
        date: b.date,
        startTime: b.start_time,
        services,
        status: 'cancelled'
      }).catch(err => console.error('[cancelBooking] Notification failed:', err));
    }

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

    // Notifications handled by centralized Orchestrator
    const { data: b } = await admin
      .from('bookings')
      .select('client_id, master_id, master_profiles(profiles(full_name)), booking_services(service_name)')
      .eq('id', bookingId)
      .single();

    if (b && b.client_id) {
      const services = (b.booking_services as any[]).map(s => s.service_name).join(', ');
      const masterName = (b.master_profiles as any)?.profiles?.full_name ?? 'Майстра';

      notifyClientOnReschedule({
        clientId: b.client_id,
        masterId: b.master_id,
        masterName,
        bookingId,
        date,
        startTime,
        services,
      }).catch(err => console.error('[rescheduleBooking] Notification failed:', err));
    }

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
      .select('master_id')
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
        // Notifications handled by centralized Orchestrator
        const { data: b } = await admin
          .from('bookings')
          .select('client_id, master_id, date, start_time, master_profiles(profiles(full_name)), booking_services(service_name)')
          .eq('id', bookingId)
          .single();

        if (b && b.client_id) {
          const services = (b.booking_services as any[]).map(s => s.service_name).join(', ');
          const masterName = (b.master_profiles as any)?.profiles?.full_name ?? 'Майстра';

          notifyClientOnStatusChange({
            clientId: b.client_id,
            masterId: b.master_id,
            masterName,
            bookingId,
            date: b.date,
            startTime: b.start_time,
            services,
            status: status as any
          }).catch(err => console.error('[updateBookingStatus] Notification failed:', err));
        }
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
      const { data: b } = await admin
        .from('bookings')
        .select('master_id, master_profiles(profiles(full_name))')
        .eq('id', bookingId)
        .single();
        
      const masterName = (b?.master_profiles as any)?.profiles?.full_name ?? 'Майстра';

      notifyClientOnStatusChange({
        clientId: booking.client_id,
        masterId: booking.master_id,
        masterName,
        bookingId,
        date: '', 
        startTime: '', 
        services: '',
        status: 'completed'
      }).catch(err => console.error('[completeBooking] Notification failed:', err));
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
