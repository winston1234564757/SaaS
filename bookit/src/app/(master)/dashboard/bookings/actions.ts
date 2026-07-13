'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { after } from 'next/server';
import {
  notifyClientOnStatusChange,
  notifyClientOnReschedule,
  notifyMasterStockAlert,
} from '@/lib/notifications';
import { createFlashDealInternal } from '@/app/(master)/dashboard/flash/actions';
import type { BookingStatus } from '@/types/database';

const CANCELLABLE_STATUSES = ['pending', 'confirmed'] as const;
const MUTABLE_STATUSES = ['pending', 'confirmed'] as const;

/**
 * Return retail products (booking_products) to stock when a booking is cancelled.
 * createBooking decremented this stock atomically at creation; cancellation must
 * give it back, mirroring the shop-order cancellation path (updateOrderStatus).
 * Safe to call once per cancellation — both cancel paths gate on pending/confirmed,
 * so a booking can never be cancelled twice.
 */
async function restockBookingProducts(
  admin: ReturnType<typeof createAdminClient>,
  bookingId: string,
): Promise<void> {
  const { data: bps } = await admin
    .from('booking_products')
    .select('product_id, quantity')
    .eq('booking_id', bookingId);

  for (const bp of bps ?? []) {
    await admin.rpc('increment_stock', { p_product_id: bp.product_id, p_qty: bp.quantity });
    await admin
      .from('product_transactions')
      .insert({
        product_id: bp.product_id,
        type:       'return',
        qty_delta:  bp.quantity,
        note:       `Повернення складу після скасування запису ${bookingId}`,
      });
  }
}

type BookingService = { service_name: string };
type MasterProfileNested = { profiles: { full_name: string } | null } | null;

type ExtendedBookingService = {
  service_id:    string | null;
  service_name:  string;
  service_price: number;
};

type ExtendedMasterProfile = {
  profiles:                { full_name: string } | null;
  auto_flash_on_cancel:    boolean;
  auto_flash_discount_pct: number;
  slug:                    string;
  subscription_tier:       string;
} | null;

export async function confirmBooking(bookingId: string): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Не авторизовано' };

  try {
    const admin = createAdminClient();

    const { data: booking } = await admin
      .from('bookings')
      .select('master_id, client_id, date, start_time, booking_services(service_name), master_profiles(profiles(full_name))')
      .eq('id', bookingId)
      .single();

    if (!booking) return { error: 'Запис не знайдено' };
    if (booking.master_id !== user.id) return { error: 'Немає доступу' };

    const { error } = await admin
      .from('bookings')
      .update({ status: 'confirmed', status_changed_at: new Date().toISOString() })
      .eq('id', bookingId);

    if (error) throw error;

    revalidatePath('/dashboard/bookings');
    revalidatePath('/my/bookings');

    if (booking.client_id) {
      const services = (booking.booking_services as BookingService[]).map(s => s.service_name).join(', ');
      const masterName = (booking.master_profiles as unknown as MasterProfileNested)?.profiles?.full_name ?? 'Майстра';
      after(() =>
        notifyClientOnStatusChange({
          clientId: booking.client_id,
          masterId: booking.master_id,
          masterName,
          bookingId,
          date: booking.date,
          startTime: booking.start_time,
          services,
          status: 'confirmed',
        }).catch(err => console.error('[confirmBooking] Notification failed:', err)),
      );
    }

    return { error: null };
  } catch (err: any) {
    console.error('[confirmBooking] error:', err);
    return { error: 'Не вдалося підтвердити запис. Спробуйте пізніше.' };
  }
}

export async function cancelBooking(
  bookingId: string,
): Promise<{ error: string | null; flashPrompt?: { discountPct: number; serviceName: string } }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Не авторизовано' };

  try {
    const admin = createAdminClient();

    const { data: booking } = await admin
      .from('bookings')
      .select('master_id, client_id, status, date, start_time, booking_services(service_id, service_name, service_price), master_profiles(profiles(full_name))')
      .eq('id', bookingId)
      .single();

    if (!booking) return { error: 'Запис не знайдено' };
    if (booking.master_id !== user.id) return { error: 'Немає доступу' };
    if (!(CANCELLABLE_STATUSES as readonly string[]).includes(booking.status)) {
      return { error: 'Запис вже завершено або скасовано.' };
    }

    // Run update + auto-flash settings fetch in parallel
    const [{ error: updateErr }, { data: mpFlashRaw }] = await Promise.all([
      admin
        .from('bookings')
        .update({ status: 'cancelled', status_changed_at: new Date().toISOString() })
        .eq('id', bookingId),
      admin
        .from('master_profiles')
        .select('subscription_tier, slug, auto_flash_on_cancel, auto_flash_discount_pct')
        .eq('id', booking.master_id)
        .single(),
    ]);

    if (updateErr) throw updateErr;

    // Return any retail products on this booking back to stock.
    await restockBookingProducts(admin, bookingId);

    revalidatePath('/dashboard/bookings');
    revalidatePath('/my/bookings');

    const mpBase   = booking.master_profiles as unknown as MasterProfileNested;
    const mpFlash  = mpFlashRaw as unknown as ExtendedMasterProfile;
    const masterName = mpBase?.profiles?.full_name ?? 'Майстра';

    if (booking.client_id) {
      const services  = (booking.booking_services as ExtendedBookingService[]).map(s => s.service_name).join(', ');
      const clientId  = booking.client_id;
      const masterId  = booking.master_id;
      const date      = booking.date;
      const startTime = booking.start_time;
      // M-REV-02 (NFR-1): run the client notification after the response flushes
      // so the serverless invocation doesn't drop the detached promise.
      after(() =>
        notifyClientOnStatusChange({
          clientId,
          masterId,
          masterName,
          bookingId,
          date,
          startTime,
          services,
          status: 'cancelled',
        }).catch(err => console.error('[cancelBooking] Notification failed:', err)),
      );
    }

    // ── Auto Flash Deal (M-REV-02 B) ─────────────────────────────────────
    // Master-initiated cancel ASKS first: surface a prompt, fire on confirm
    // via fireAutoFlashForSlot. (Client-initiated cancel fires automatically
    // in my/bookings/actions.ts.)
    let flashPrompt: { discountPct: number; serviceName: string } | undefined;
    if (mpFlash?.auto_flash_on_cancel) {
      const first = (booking.booking_services as ExtendedBookingService[])[0];
      // skip if no services / product-only / zero price
      if (first?.service_id && Number(first.service_price) > 0) {
        flashPrompt = { discountPct: mpFlash.auto_flash_discount_pct, serviceName: first.service_name };
      }
    }

    return { error: null, flashPrompt };
  } catch (err: any) {
    console.error('[cancelBooking] error:', err);
    return { error: 'Не вдалося скасувати запис.' };
  }
}

/**
 * M-REV-02 (B): master confirmed the upsell after cancelling → fire the deal.
 * Re-fetches + re-validates ownership server-side; excludes the booking's client
 * (whose slot just freed) from targeting.
 */
export async function fireAutoFlashForSlot(
  bookingId: string,
): Promise<{ error: string | null; sentTo: number }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Не авторизовано', sentTo: 0 };

  try {
    const admin = createAdminClient();
    const { data: booking } = await admin
      .from('bookings')
      .select('master_id, client_id, date, start_time, booking_services(service_id, service_name, service_price), master_profiles(slug, subscription_tier, auto_flash_on_cancel, auto_flash_discount_pct, profiles(full_name))')
      .eq('id', bookingId)
      .single();

    if (!booking) return { error: 'Запис не знайдено', sentTo: 0 };
    if (booking.master_id !== user.id) return { error: 'Немає доступу', sentTo: 0 };

    const mp = booking.master_profiles as unknown as ExtendedMasterProfile;
    if (!mp?.auto_flash_on_cancel) return { error: null, sentTo: 0 };

    const first = (booking.booking_services as ExtendedBookingService[])[0];
    if (!first?.service_id || Number(first.service_price) <= 0) return { error: null, sentTo: 0 };

    const { error, sentTo } = await createFlashDealInternal(booking.master_id, mp.subscription_tier, {
      serviceId:       first.service_id,
      serviceName:     first.service_name,
      slotDate:        booking.date,
      slotTime:        booking.start_time.slice(0, 5),
      originalPrice:   Number(first.service_price),
      discountPct:     mp.auto_flash_discount_pct,
      expiresInHours:  2,
      slug:            mp.slug ?? '',
      masterName:      mp.profiles?.full_name ?? 'Майстер',
      excludeClientId: booking.client_id ?? undefined,
      bookingId,
    });

    return { error, sentTo };
  } catch (err: any) {
    console.error('[fireAutoFlashForSlot] error:', err);
    return { error: 'Не вдалося запустити акцію.', sentTo: 0 };
  }
}

export async function rescheduleBooking(
  bookingId: string,
  date: string,
  startTime: string,
  endTime: string,
): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Не авторизовано' };

  try {
    const admin = createAdminClient();

    const { data: booking } = await admin
      .from('bookings')
      .select('master_id, client_id, booking_services(service_name), master_profiles(profiles(full_name))')
      .eq('id', bookingId)
      .single();

    if (!booking) return { error: 'Запис не знайдено' };
    if (booking.master_id !== user.id) return { error: 'Немає доступу' };

    const { error } = await admin
      .from('bookings')
      .update({ date, start_time: startTime, end_time: endTime, updated_at: new Date().toISOString() })
      .eq('id', bookingId);

    // Перенос — головне джерело перекритих записів: до `bookings_no_overlap` цей UPDATE
    // не перевірявся НІЧИМ (unique-індекс ловить лише точний збіг start_time), тож
    // перетягування накладало один запис на інший мовчки. Тепер відмовляє БД.
    if (error?.code === '23P01' && error.message.includes('bookings_no_overlap')) {
      return { error: 'Тут уже є запис. Перетягніть на вільний час.' };
    }
    if (error?.code === '23505' && error.message.includes('booking_slot_collision')) {
      return { error: 'Тут уже є запис. Перетягніть на вільний час.' };
    }

    if (error) throw error;

    revalidatePath('/dashboard/bookings');
    revalidatePath('/my/bookings');

    if (booking.client_id) {
      const services = (booking.booking_services as BookingService[]).map(s => s.service_name).join(', ');
      const masterName = (booking.master_profiles as unknown as MasterProfileNested)?.profiles?.full_name ?? 'Майстра';
      after(() =>
        notifyClientOnReschedule({
          clientId: booking.client_id,
          masterId: booking.master_id,
          masterName,
          bookingId,
          date,
          startTime,
          services,
        }).catch(err => console.error('[rescheduleBooking] Notification failed:', err)),
      );
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
): Promise<{ error: string | null; flashPrompt?: { discountPct: number; serviceName: string } }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Не авторизовано' };

  try {
    const admin = createAdminClient();

    const { data: booking } = await admin
      .from('bookings')
      .select('master_id, client_id, status, date, start_time, booking_services(service_id, service_name, service_price), master_profiles(auto_flash_on_cancel, auto_flash_discount_pct, profiles(full_name))')
      .eq('id', bookingId)
      .single();

    if (!booking) return { error: 'Запис не знайдено' };
    if (booking.master_id !== user.id) return { error: 'Немає доступу' };
    if (!(MUTABLE_STATUSES as readonly string[]).includes(booking.status)) {
      return { error: 'Статус цього запису не можна змінити.' };
    }

    const { error } = await admin
      .from('bookings')
      .update({ status: status as BookingStatus, status_changed_at: new Date().toISOString() })
      .eq('id', bookingId);

    if (error) throw error;

    // Return retail products to stock when this status change is a cancellation.
    if (status === 'cancelled') {
      await restockBookingProducts(admin, bookingId);
    }

    revalidatePath('/dashboard/bookings');
    revalidatePath('/my/bookings');

    const mpNested = booking.master_profiles as unknown as ExtendedMasterProfile;

    if ((status === 'confirmed' || status === 'cancelled') && booking.client_id) {
      const services = (booking.booking_services as ExtendedBookingService[]).map(s => s.service_name).join(', ');
      const masterName = mpNested?.profiles?.full_name ?? 'Майстра';
      const clientId  = booking.client_id;
      const masterId  = booking.master_id;
      const date      = booking.date;
      const startTime = booking.start_time;
      const st        = status as 'confirmed' | 'cancelled';
      after(() =>
        notifyClientOnStatusChange({
          clientId,
          masterId,
          masterName,
          bookingId,
          date,
          startTime,
          services,
          status: st,
        }).catch(err => console.error('[updateBookingStatus] Notification failed:', err)),
      );
    }

    // M-REV-02 (B): master cancelling via the details modal → ask before flash.
    let flashPrompt: { discountPct: number; serviceName: string } | undefined;
    if (status === 'cancelled' && mpNested?.auto_flash_on_cancel) {
      const first = (booking.booking_services as ExtendedBookingService[])[0];
      if (first?.service_id && Number(first.service_price) > 0) {
        flashPrompt = { discountPct: mpNested.auto_flash_discount_pct, serviceName: first.service_name };
      }
    }

    return { error: null, flashPrompt };
  } catch (err: any) {
    console.error('[updateBookingStatus] error:', err);
    return { error: 'Не вдалося оновити статус запису.' };
  }
}

export async function completeBooking(
  bookingId: string,
  // undefined  = client didn't provide (race condition) → auto-fetch server-side
  // []         = user explicitly skipped deduction ("Без списання")
  // [{...}]    = user reviewed and confirmed quantities
  reviewedConsumables?: { product_id: string; qty_used: number }[],
): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Не авторизовано' };

  try {
    const admin = createAdminClient();

    const { data: booking } = await admin
      .from('bookings')
      .select('master_id, client_id, status, date, start_time, booking_services(service_name, service_id), master_profiles(profiles(full_name))')
      .eq('id', bookingId)
      .single();

    if (!booking) return { error: 'Запис не знайдено' };
    if (booking.master_id !== user.id) return { error: 'Немає доступу' };
    // Idempotency: never deduct consumables twice. A second "Завершити"
    // (double-click / re-complete) must be a no-op for stock.
    if (booking.status === 'completed') return { error: null };

    // Server-side fallback: when client didn't pass consumables, auto-fetch from product_service_links
    let toDeduct = reviewedConsumables;
    if (toDeduct === undefined) {
      const svcIds = ((booking.booking_services as { service_id: string | null }[]) ?? [])
        .map(s => s.service_id)
        .filter(Boolean) as string[];

      if (svcIds.length > 0) {
        const { data: links } = await admin
          .from('product_service_links')
          .select('product_id, quantity, products!inner(product_type, is_archived)')
          .in('service_id', svcIds)
          .eq('products.product_type', 'consumable')
          .eq('products.is_archived', false);

        if (links && links.length > 0) {
          const deductMap = new Map<string, number>();
          for (const link of links) {
            const existing = deductMap.get(link.product_id) ?? 0;
            deductMap.set(link.product_id, existing + Number(link.quantity));
          }
          toDeduct = Array.from(deductMap.entries()).map(([pid, qty]) => ({
            product_id: pid,
            qty_used: qty,
          }));
        }
      }
    }

    if (toDeduct && toDeduct.length > 0) {
      for (const item of toDeduct) {
        if (item.qty_used <= 0) continue;

        const { data: product } = await admin
          .from('products')
          .select('name, stock_alert_threshold')
          .eq('id', item.product_id)
          .single();

        if (!product) continue;

        // Atomic deduct (clamps at 0) — returns the actual units removed so the
        // ledger never diverges from stock, and is safe under concurrency.
        const { data: deductRows, error: deductErr } = await admin
          .rpc('deduct_consumable_stock', { p_product_id: item.product_id, p_qty: item.qty_used });
        if (deductErr) {
          console.error('[completeBooking] deduct_consumable_stock:', deductErr.message);
          continue;
        }
        const row = Array.isArray(deductRows) ? deductRows[0] : deductRows;
        const deducted = Number(row?.deducted) || 0;
        const newQty = Number(row?.new_stock) || 0;
        if (deducted <= 0) continue;

        if (product.stock_alert_threshold != null && newQty <= product.stock_alert_threshold) {
          after(() => notifyMasterStockAlert(booking.master_id, product.name, newQty));
        }

        await admin
          .from('product_transactions')
          .insert({
            product_id: item.product_id,
            type:       'deduction',
            qty_delta:  -deducted,
            note:       `Списано при завершенні запису ${bookingId}`,
          });
      }
    }

    const { error } = await admin
      .from('bookings')
      .update({ status: 'completed', status_changed_at: new Date().toISOString() })
      .eq('id', bookingId);

    if (error) throw error;

    revalidatePath('/dashboard/bookings');
    revalidatePath('/my/bookings');

    if (booking.client_id) {
      const services = (booking.booking_services as BookingService[]).map(s => s.service_name).join(', ');
      const masterName = (booking.master_profiles as unknown as MasterProfileNested)?.profiles?.full_name ?? 'Майстра';
      after(() =>
        notifyClientOnStatusChange({
          clientId: booking.client_id,
          masterId: booking.master_id,
          masterName,
          bookingId,
          date: booking.date,
          startTime: booking.start_time,
          services,
          status: 'completed',
        }).catch(err => console.error('[completeBooking] Notification failed:', err)),
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

    await admin.from('notifications').insert({
      recipient_id: clientId,
      title: 'Як пройшов ваш візит?',
      body: 'Залишіть відгук — це займе лише хвилину і дуже допоможе майстру.',
      type: 'new_review',
      related_booking_id: bookingId,
    });

    const { data: subs } = await admin
      .from('push_subscriptions')
      .select('subscription')
      .eq('user_id', clientId);

    if (subs && subs.length > 0) {
      const { sendPush } = await import('@/lib/push');
      await Promise.allSettled(
        subs.map(s => sendPush(s.subscription, {
          title: 'Як пройшов ваш візит?',
          body: 'Залишіть відгук — це допоможе майстру.',
          url: `/my/bookings`,
        }))
      );
    }

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
        `<b>Як пройшов ваш візит?</b>\n\nЗалишіть відгук — це займе лише хвилину і дуже допоможе майстру.`,
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
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Не авторизовано' };

  try {
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
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Не авторизовано' };

  try {
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
