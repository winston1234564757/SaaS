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
