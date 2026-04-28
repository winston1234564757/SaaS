'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { notifyClientPortfolioConsent } from '@/lib/notifications';
import type { PortfolioItemFull } from '@/types/database';

const STARTER_ITEM_LIMIT = 5;
const MAX_PHOTOS_PER_ITEM = 5;

const itemSchema = z.object({
  title: z.string().min(1).max(120),
  description: z.string().max(1000).nullable().optional(),
  service_id: z.string().uuid().nullable().optional(),
  is_published: z.boolean().optional(),
});

// ─── Fetch helpers ────────────────────────────────────────────────────────────

export async function getPortfolioItems(): Promise<PortfolioItemFull[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const admin = createAdminClient();

  const { data: items } = await admin
    .from('portfolio_items')
    .select(`
      id, master_id, title, description, service_id, tagged_client_id,
      consent_status, is_published, display_order, created_at, updated_at,
      portfolio_item_photos ( id, portfolio_item_id, storage_path, url, display_order, created_at ),
      portfolio_item_reviews ( review_id )
    `)
    .eq('master_id', user.id)
    .order('display_order', { ascending: true });

  if (!items) return [];

  // Fetch service names and tagged client names in one pass
  const serviceIds = [...new Set(items.map(i => i.service_id).filter(Boolean) as string[])];
  const clientIds = [...new Set(items.map(i => i.tagged_client_id).filter(Boolean) as string[])];

  const [servicesRes, clientsRes] = await Promise.all([
    serviceIds.length > 0
      ? admin.from('services').select('id, name').in('id', serviceIds)
      : Promise.resolve({ data: [] }),
    clientIds.length > 0
      ? admin.from('profiles').select('id, full_name').in('id', clientIds)
      : Promise.resolve({ data: [] }),
  ]);

  const serviceMap = new Map((servicesRes.data ?? []).map(s => [s.id, s.name]));
  const clientMap = new Map((clientsRes.data ?? []).map(c => [c.id, c.full_name]));

  return items.map(item => ({
    id: item.id,
    master_id: item.master_id,
    title: item.title,
    description: item.description ?? null,
    service_id: item.service_id ?? null,
    tagged_client_id: item.tagged_client_id ?? null,
    consent_status: (item.consent_status as 'pending' | 'approved' | 'declined') ?? null,
    is_published: item.is_published,
    display_order: item.display_order,
    created_at: item.created_at,
    updated_at: item.updated_at,
    photos: (item.portfolio_item_photos ?? []).sort((a, b) => a.display_order - b.display_order),
    review_ids: (item.portfolio_item_reviews ?? []).map(r => r.review_id),
    service_name: item.service_id ? (serviceMap.get(item.service_id) ?? null) : null,
    tagged_client_name: item.tagged_client_id ? (clientMap.get(item.tagged_client_id) ?? null) : null,
  }));
}

export async function getMasterReviews() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data } = await supabase
    .from('reviews')
    .select('id, rating, comment, client_name, created_at')
    .eq('master_id', user.id)
    .eq('is_published', true)
    .order('created_at', { ascending: false })
    .limit(100);

  return data ?? [];
}

export async function getMasterClients() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const admin = createAdminClient();

  const { data: relations } = await admin
    .from('client_master_relations')
    .select('client_id')
    .eq('master_id', user.id)
    .limit(200);

  if (!relations || relations.length === 0) return [];

  const clientIds = relations.map(r => r.client_id as string);

  const { data: profiles } = await admin
    .from('profiles')
    .select('id, full_name')
    .in('id', clientIds);

  return (profiles ?? []).map(p => ({ id: p.id as string, full_name: p.full_name as string }));
}

// ─── Create ───────────────────────────────────────────────────────────────────

export async function createPortfolioItem(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const admin = createAdminClient();

  const { data: mp } = await admin
    .from('master_profiles')
    .select('subscription_tier')
    .eq('id', user.id)
    .single();

  const tier = mp?.subscription_tier ?? 'starter';

  if (tier === 'starter') {
    const { count } = await admin
      .from('portfolio_items')
      .select('id', { count: 'exact', head: true })
      .eq('master_id', user.id)
      .eq('is_published', true);
    if ((count ?? 0) >= STARTER_ITEM_LIMIT) {
      return { error: 'limit_reached' };
    }
  }

  const parsed = itemSchema.safeParse({
    title: formData.get('title'),
    description: formData.get('description') || null,
    service_id: formData.get('service_id') || null,
    is_published: formData.get('is_published') === 'true',
  });

  if (!parsed.success) return { error: 'validation_error' };

  const { data: item, error } = await admin
    .from('portfolio_items')
    .insert({
      master_id: user.id,
      title: parsed.data.title,
      description: parsed.data.description ?? null,
      service_id: parsed.data.service_id ?? null,
      is_published: parsed.data.is_published ?? true,
      display_order: 0,
    })
    .select('id')
    .single();

  if (error || !item) return { error: 'insert_failed' };

  revalidatePath('/dashboard/portfolio');
  return { id: item.id };
}

// ─── Update ───────────────────────────────────────────────────────────────────

export async function updatePortfolioItem(itemId: string, formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const parsed = itemSchema.safeParse({
    title: formData.get('title'),
    description: formData.get('description') || null,
    service_id: formData.get('service_id') || null,
    is_published: formData.get('is_published') === 'true',
  });

  if (!parsed.success) return { error: 'validation_error' };

  const admin = createAdminClient();

  const { error } = await admin
    .from('portfolio_items')
    .update({
      title: parsed.data.title,
      description: parsed.data.description ?? null,
      service_id: parsed.data.service_id ?? null,
      is_published: parsed.data.is_published ?? true,
    })
    .eq('id', itemId)
    .eq('master_id', user.id);

  if (error) return { error: 'update_failed' };

  revalidatePath('/dashboard/portfolio');
  return { ok: true };
}

// ─── Delete ───────────────────────────────────────────────────────────────────

export async function deletePortfolioItem(itemId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const admin = createAdminClient();

  // Fetch photos to delete from storage
  const { data: photos } = await admin
    .from('portfolio_item_photos')
    .select('storage_path')
    .eq('portfolio_item_id', itemId);

  if (photos && photos.length > 0) {
    await admin.storage
      .from('portfolios')
      .remove(photos.map(p => p.storage_path));
  }

  await admin
    .from('portfolio_items')
    .delete()
    .eq('id', itemId)
    .eq('master_id', user.id);

  revalidatePath('/dashboard/portfolio');
  return { ok: true };
}

// ─── Reorder items ────────────────────────────────────────────────────────────

export async function reorderPortfolioItems(orderedIds: string[]) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const admin = createAdminClient();

  await Promise.all(
    orderedIds.map((id, index) =>
      admin
        .from('portfolio_items')
        .update({ display_order: index })
        .eq('id', id)
        .eq('master_id', user.id)
    )
  );

  revalidatePath('/dashboard/portfolio');
  return { ok: true };
}

// ─── Photos: add ──────────────────────────────────────────────────────────────

export async function addPortfolioPhoto(
  itemId: string,
  storagePath: string,
  url: string,
  displayOrder: number
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const admin = createAdminClient();

  // Guard: max 5 photos per item
  const { count } = await admin
    .from('portfolio_item_photos')
    .select('id', { count: 'exact', head: true })
    .eq('portfolio_item_id', itemId);

  if ((count ?? 0) >= MAX_PHOTOS_PER_ITEM) return { error: 'photo_limit' };

  await admin.from('portfolio_item_photos').insert({
    portfolio_item_id: itemId,
    storage_path: storagePath,
    url,
    display_order: displayOrder,
  });

  revalidatePath('/dashboard/portfolio');
  return { ok: true };
}

// ─── Photos: delete ───────────────────────────────────────────────────────────

export async function deletePortfolioPhoto(photoId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const admin = createAdminClient();

  const { data: photo } = await admin
    .from('portfolio_item_photos')
    .select('storage_path, portfolio_item_id')
    .eq('id', photoId)
    .single();

  if (!photo) return { error: 'not_found' };

  // Verify ownership
  const { data: item } = await admin
    .from('portfolio_items')
    .select('master_id')
    .eq('id', photo.portfolio_item_id)
    .single();

  if (!item || item.master_id !== user.id) return { error: 'forbidden' };

  await admin.storage.from('portfolios').remove([photo.storage_path]);
  await admin.from('portfolio_item_photos').delete().eq('id', photoId);

  revalidatePath('/dashboard/portfolio');
  return { ok: true };
}

// ─── Photos: reorder ─────────────────────────────────────────────────────────

export async function reorderPortfolioPhotos(
  itemId: string,
  orderedPhotoIds: string[]
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const admin = createAdminClient();

  await Promise.all(
    orderedPhotoIds.map((id, index) =>
      admin
        .from('portfolio_item_photos')
        .update({ display_order: index })
        .eq('id', id)
        .eq('portfolio_item_id', itemId)
    )
  );

  revalidatePath('/dashboard/portfolio');
  return { ok: true };
}

// ─── Review links ─────────────────────────────────────────────────────────────

export async function setPortfolioItemReviews(itemId: string, reviewIds: string[]) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const admin = createAdminClient();

  // Verify ownership
  const { data: item } = await admin
    .from('portfolio_items')
    .select('master_id')
    .eq('id', itemId)
    .single();

  if (!item || item.master_id !== user.id) return { error: 'forbidden' };

  // Replace all links
  await admin.from('portfolio_item_reviews').delete().eq('portfolio_item_id', itemId);

  if (reviewIds.length > 0) {
    await admin.from('portfolio_item_reviews').insert(
      reviewIds.map(rid => ({ portfolio_item_id: itemId, review_id: rid }))
    );
  }

  revalidatePath('/dashboard/portfolio');
  return { ok: true };
}

// ─── Client tagging & consent ─────────────────────────────────────────────────

export async function tagClientOnPortfolioItem(itemId: string, clientId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const admin = createAdminClient();

  // Verify ownership
  const { data: item } = await admin
    .from('portfolio_items')
    .select('master_id, title')
    .eq('id', itemId)
    .single();

  if (!item || item.master_id !== user.id) return { error: 'forbidden' };

  const { data: mp } = await admin
    .from('master_profiles')
    .select('slug, profiles!inner(full_name)')
    .eq('id', user.id)
    .single();

  const masterName = (mp?.profiles as unknown as { full_name: string } | null)?.full_name ?? 'Майстер';
  const masterSlug = mp?.slug ?? '';

  await admin
    .from('portfolio_items')
    .update({ tagged_client_id: clientId, consent_status: 'pending' })
    .eq('id', itemId);

  await notifyClientPortfolioConsent({
    clientId,
    masterName,
    masterSlug,
    portfolioItemId: itemId,
    portfolioItemTitle: item.title,
  });

  revalidatePath('/dashboard/portfolio');
  return { ok: true };
}

export async function removeClientTag(itemId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const admin = createAdminClient();

  await admin
    .from('portfolio_items')
    .update({ tagged_client_id: null, consent_status: null })
    .eq('id', itemId)
    .eq('master_id', user.id);

  revalidatePath('/dashboard/portfolio');
  return { ok: true };
}

export async function togglePublishPortfolioItem(itemId: string, isPublished: boolean) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const admin = createAdminClient();
  await admin
    .from('portfolio_items')
    .update({ is_published: isPublished })
    .eq('id', itemId)
    .eq('master_id', user.id);

  revalidatePath('/dashboard/portfolio');
  return { ok: true };
}
