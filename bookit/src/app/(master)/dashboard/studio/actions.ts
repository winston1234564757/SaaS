'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';

export async function joinStudio(token: string): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Не авторизований' };

  const admin = createAdminClient();

  const { data: studio } = await admin
    .from('studios')
    .select('id, owner_id, name')
    .eq('invite_token', token)
    .single();

  if (!studio) return { error: 'Недійсне посилання або студія не знайдена' };

  const { data: existing } = await admin
    .from('studio_members')
    .select('id')
    .eq('studio_id', studio.id)
    .eq('master_id', user.id)
    .maybeSingle();

  if (existing) return { error: 'Ви вже у цій студії' };

  const { data: mp } = await admin
    .from('master_profiles')
    .select('studio_id, subscription_tier')
    .eq('id', user.id)
    .single();

  if (mp?.studio_id) return { error: 'Ви вже у іншій студії' };

  await Promise.all([
    admin.from('studio_members').insert({ studio_id: studio.id, master_id: user.id, role: 'member' }),
    admin.from('master_profiles').update({ studio_id: studio.id, subscription_tier: 'studio' }).eq('id', user.id),
  ]);

  revalidatePath('/', 'layout');
  return { error: null };
}
