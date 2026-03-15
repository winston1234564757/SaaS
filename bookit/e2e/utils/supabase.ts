/**
 * Supabase admin client for E2E tests.
 * Uses SERVICE_ROLE_KEY — bypasses RLS entirely.
 * Never import this in browser/app code.
 */
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error(
    '[e2e/utils/supabase] NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set',
  );
}

export const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false },
});

// ─── Bookings ────────────────────────────────────────────────────────────────

export async function getBookingById(id: string) {
  const { data, error } = await supabaseAdmin
    .from('bookings')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw new Error(`getBookingById(${id}): ${error.message}`);
  return data;
}

/** Delete test bookings by master_id + guest client_name (cleanup helper). */
export async function deleteTestBookings(masterSlug: string, clientName: string) {
  // Resolve master_id from slug
  const { data: profile, error: profileErr } = await supabaseAdmin
    .from('master_profiles')
    .select('id')
    .eq('slug', masterSlug)
    .single();

  if (profileErr || !profile) {
    console.warn(`[deleteTestBookings] Could not find master with slug "${masterSlug}": ${profileErr?.message}`);
    return;
  }

  const { error } = await supabaseAdmin
    .from('bookings')
    .delete()
    .eq('master_id', profile.id)
    .eq('client_name', clientName);

  if (error) {
    console.warn(`[deleteTestBookings] Delete failed: ${error.message}`);
  }
}

// ─── CRM / client_master_relations ───────────────────────────────────────────

export async function getClientMasterRelation(clientId: string, masterId: string) {
  const { data, error } = await supabaseAdmin
    .from('client_master_relations')
    .select('*')
    .eq('client_id', clientId)
    .eq('master_id', masterId)
    .maybeSingle();

  if (error) throw new Error(`getClientMasterRelation: ${error.message}`);
  return data ?? null;
}

// ─── Notifications ────────────────────────────────────────────────────────────

export async function getNotificationsFor(recipientId: string, limit = 5) {
  const { data, error } = await supabaseAdmin
    .from('notifications')
    .select('*')
    .eq('recipient_id', recipientId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw new Error(`getNotificationsFor(${recipientId}): ${error.message}`);
  return data ?? [];
}

// ─── Products ─────────────────────────────────────────────────────────────────

export async function getProductStock(productId: string): Promise<number> {
  const { data, error } = await supabaseAdmin
    .from('products')
    .select('stock_quantity')
    .eq('id', productId)
    .single();

  if (error) throw new Error(`getProductStock(${productId}): ${error.message}`);
  return (data as { stock_quantity: number }).stock_quantity;
}

// ─── Master profiles ──────────────────────────────────────────────────────────

export async function getMasterProfileBySlug(slug: string) {
  const { data, error } = await supabaseAdmin
    .from('master_profiles')
    .select('*')
    .eq('slug', slug)
    .single();

  if (error) throw new Error(`getMasterProfileBySlug("${slug}"): ${error.message}`);
  return data;
}

// ─── Reviews ──────────────────────────────────────────────────────────────────

export async function getReviewsByMasterId(masterId: string) {
  const { data, error } = await supabaseAdmin
    .from('reviews')
    .select('*')
    .eq('master_id', masterId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(`getReviewsByMasterId(${masterId}): ${error.message}`);
  return data ?? [];
}
