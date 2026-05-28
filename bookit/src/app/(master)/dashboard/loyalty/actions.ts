'use server';

import { revalidatePath } from 'next/cache';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

export async function saveMasterC2CSettings(
  enabled: boolean,
  discountPct: number,
): Promise<{ error?: string }> {
  if (discountPct < 1 || discountPct > 50) {
    return { error: 'Знижка має бути від 1 до 50%' };
  }

  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return { error: 'Не авторизовано' };

  const admin = createAdminClient();
  const { error } = await admin
    .from('master_profiles')
    .update({ c2c_enabled: enabled, c2c_discount_pct: discountPct })
    .eq('id', user.id);

  if (error) return { error: error.message };

  revalidatePath('/dashboard/loyalty');
  return {};
}
