'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';

export interface QuickFlashResult {
  success: boolean;
  dealId?: string;
  error?: string;
}

export async function launchQuickFlashDeal(): Promise<QuickFlashResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Unauthorized' };

  const admin = createAdminClient();

  const { data: profile } = await admin
    .from('master_profiles')
    .select('subscription_tier, id')
    .eq('id', user.id)
    .single();

  if (!profile) return { success: false, error: 'Профіль не знайдено' };

  // Starter: ліміт 2 Flash Deals на місяць
  if (profile.subscription_tier === 'starter') {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const { count } = await admin
      .from('flash_deals')
      .select('id', { count: 'exact', head: true })
      .eq('master_id', user.id)
      .gte('created_at', startOfMonth.toISOString());

    if ((count ?? 0) >= 2) {
      return { success: false, error: 'Ліміт Flash Deals для Starter: 2/місяць' };
    }
  }

  // Найпопулярніша послуга — за кількістю завершених бронювань
  const { data: services } = await admin
    .from('services')
    .select('id, name, price, duration_minutes')
    .eq('master_id', user.id)
    .eq('is_active', true)
    .order('is_popular', { ascending: false })
    .limit(1);

  const topService = services?.[0];
  if (!topService) {
    return { success: false, error: 'Немає активних послуг для акції' };
  }

  const expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000); // +2 год

  const { data: deal, error } = await admin
    .from('flash_deals')
    .insert({
      master_id: user.id,
      service_id: topService.id,
      service_name: topService.name,
      original_price: topService.price,
      discount_pct: 20,
      expires_at: expiresAt.toISOString(),
      status: 'active',
    })
    .select('id')
    .single();

  if (error) return { success: false, error: error.message };

  revalidatePath('/dashboard');
  return { success: true, dealId: deal.id };
}
