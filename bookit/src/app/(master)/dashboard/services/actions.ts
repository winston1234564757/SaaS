'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

async function getMasterId(): Promise<string | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id ?? null;
}

export async function removeServiceConsumableLink(
  serviceId: string,
  productId: string,
): Promise<{ error: string | null }> {
  const masterId = await getMasterId();
  if (!masterId) return { error: 'Не авторизовано' };
  try {
    const admin = createAdminClient();
    // Verify service belongs to this master
    const { data: service } = await admin
      .from('services')
      .select('id')
      .eq('id', serviceId)
      .eq('master_id', masterId)
      .single();
    if (!service) return { error: 'Послугу не знайдено' };

    const { error } = await admin
      .from('product_service_links')
      .delete()
      .eq('service_id', serviceId)
      .eq('product_id', productId);

    if (error) throw error;

    revalidatePath('/dashboard/services');
    return { error: null };
  } catch (err: unknown) {
    console.error('[removeServiceConsumableLink]', err);
    return { error: 'Не вдалося видалити прив\'язку' };
  }
}

export interface ServiceStats {
  completedCount: number;
  revenue: number;          // Σ service_price across completed bookings
  avgCheck: number;         // revenue / completedCount
  sharePct: number;         // revenue as % of all-services completed revenue
  lastDate: string | null;  // YYYY-MM-DD of latest completed booking
  plannedCount: number;     // upcoming pending/confirmed bookings
}

interface StatRow {
  service_id: string;
  service_price: number | string;
  bookings: { date: string } | { date: string }[] | null;
}

/**
 * Per-service stats for the service editor.
 * Admin client is scoped to the authenticated master on every query; ownership
 * of the service is verified first. Revenue counts ONLY completed bookings
 * (matches useAnalytics convention); planned = upcoming pending/confirmed.
 */
export async function getServiceStats(
  serviceId: string,
): Promise<{ data: ServiceStats | null; error: string | null }> {
  const masterId = await getMasterId();
  if (!masterId) return { data: null, error: 'Не авторизовано' };
  try {
    const admin = createAdminClient();

    // Ownership: service must belong to this master
    const { data: service } = await admin
      .from('services')
      .select('id')
      .eq('id', serviceId)
      .eq('master_id', masterId)
      .single();
    if (!service) return { data: null, error: 'Послугу не знайдено' };

    // All completed booking_services for this master — gives both the total
    // (for share %) and this service's slice in one round-trip.
    const { data: rows, error: rErr } = await admin
      .from('booking_services')
      .select('service_id, service_price, bookings!inner(date)')
      .eq('bookings.master_id', masterId)
      .eq('bookings.status', 'completed');
    if (rErr) throw rErr;

    let totalRevenue = 0;
    let revenue = 0;
    let completedCount = 0;
    let lastDate: string | null = null;

    for (const row of (rows ?? []) as StatRow[]) {
      const price = Number(row.service_price) || 0;
      totalRevenue += price;
      if (row.service_id === serviceId) {
        revenue += price;
        completedCount += 1;
        const bk = Array.isArray(row.bookings) ? row.bookings[0] : row.bookings;
        const d = bk?.date ?? null;
        if (d && (!lastDate || d > lastDate)) lastDate = d;
      }
    }

    const avgCheck = completedCount > 0 ? Math.round(revenue / completedCount) : 0;
    const sharePct = totalRevenue > 0 ? Math.round((revenue / totalRevenue) * 100) : 0;

    // Upcoming bookings (no revenue counted — just a forward-looking counter)
    const today = new Date().toISOString().slice(0, 10);
    const { count: plannedCount } = await admin
      .from('booking_services')
      .select('id, bookings!inner(master_id, status, date)', { count: 'exact', head: true })
      .eq('service_id', serviceId)
      .eq('bookings.master_id', masterId)
      .in('bookings.status', ['pending', 'confirmed'])
      .gte('bookings.date', today);

    return {
      data: { completedCount, revenue, avgCheck, sharePct, lastDate, plannedCount: plannedCount ?? 0 },
      error: null,
    };
  } catch (err: unknown) {
    console.error('[getServiceStats]', err);
    return { data: null, error: 'Не вдалося завантажити статистику' };
  }
}

export async function addServiceConsumableLinks(
  serviceId: string,
  links: { productId: string; quantity: number }[],
): Promise<{ error: string | null }> {
  const masterId = await getMasterId();
  if (!masterId) return { error: 'Не авторизовано' };
  if (links.length === 0) return { error: null };
  try {
    const admin = createAdminClient();
    const { data: service } = await admin
      .from('services')
      .select('id')
      .eq('id', serviceId)
      .eq('master_id', masterId)
      .single();
    if (!service) return { error: 'Послугу не знайдено' };

    const { error } = await admin
      .from('product_service_links')
      .upsert(
        links.map(l => ({
          service_id: serviceId,
          product_id: l.productId,
          quantity:   l.quantity,
        })),
        { onConflict: 'service_id,product_id' },
      );

    if (error) throw error;

    revalidatePath('/dashboard/services');
    return { error: null };
  } catch (err: unknown) {
    console.error('[addServiceConsumableLinks]', err);
    return { error: 'Не вдалося зберегти прив\'язки' };
  }
}
