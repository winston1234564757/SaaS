'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';

function generateToken(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  const bytes = crypto.getRandomValues(new Uint8Array(12));
  return Array.from(bytes, b => chars[b % chars.length]).join('');
}

export async function createStudio(name: string): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Не авторизований' };

  const admin = createAdminClient();

  // Check master is Studio tier
  const { data: mp } = await admin
    .from('master_profiles')
    .select('id, subscription_tier, studio_id')
    .eq('id', user.id)
    .single();

  if (!mp) return { error: 'Профіль не знайдено' };
  if (mp.subscription_tier !== 'studio') return { error: 'Потрібен тариф Studio' };
  if (mp.studio_id) return { error: 'Ви вже у студії' };

  let token = generateToken();
  // Retry on collision
  for (let i = 0; i < 5; i++) {
    const { data: existing } = await admin.from('studios').select('id').eq('invite_token', token).maybeSingle();
    if (!existing) break;
    token = generateToken();
  }

  const { data: studio, error: studioErr } = await admin
    .from('studios')
    .insert({ owner_id: user.id, name: name.trim(), invite_token: token })
    .select('id')
    .single();

  if (studioErr) return { error: studioErr.message };

  // Add owner as member
  await admin.from('studio_members').insert({ studio_id: studio.id, master_id: user.id, role: 'owner' });

  // Link master to studio
  await admin.from('master_profiles').update({ studio_id: studio.id }).eq('id', user.id);

  revalidatePath('/dashboard/studio', 'layout');
  revalidatePath('/dashboard', 'layout');
  return { error: null };
}

export async function joinStudio(token: string): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Не авторизований' };

  const admin = createAdminClient();

  // Find studio by token
  const { data: studio } = await admin
    .from('studios')
    .select('id, owner_id, name')
    .eq('invite_token', token)
    .single();

  if (!studio) return { error: 'Недійсне посилання або студія не знайдена' };

  // Check if already member
  const { data: existing } = await admin
    .from('studio_members')
    .select('id')
    .eq('studio_id', studio.id)
    .eq('master_id', user.id)
    .maybeSingle();

  if (existing) return { error: 'Ви вже у цій студії' };

  // Check if already in another studio
  const { data: mp } = await admin
    .from('master_profiles')
    .select('studio_id, subscription_tier')
    .eq('id', user.id)
    .single();

  if (mp?.studio_id) return { error: 'Ви вже у іншій студії' };

  await admin.from('studio_members').insert({ studio_id: studio.id, master_id: user.id, role: 'member' });
  await admin.from('master_profiles').update({ studio_id: studio.id, subscription_tier: 'studio' }).eq('id', user.id);

  revalidatePath('/dashboard/studio');
  return { error: null };
}

export async function leaveStudio(): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Не авторизований' };

  const admin = createAdminClient();

  const { data: mp } = await admin
    .from('master_profiles')
    .select('studio_id')
    .eq('id', user.id)
    .single();

  if (!mp?.studio_id) return { error: 'Ви не у жодній студії' };

  // Check if owner — owners cannot leave (must delete studio)
  const { data: membership } = await admin
    .from('studio_members')
    .select('role')
    .eq('studio_id', mp.studio_id)
    .eq('master_id', user.id)
    .single();

  if (membership?.role === 'owner') return { error: 'Власник не може покинути студію. Спочатку видаліть студію.' };

  await admin.from('studio_members').delete().eq('studio_id', mp.studio_id).eq('master_id', user.id);
  await admin.from('master_profiles').update({ studio_id: null, subscription_tier: 'starter' }).eq('id', user.id);

  revalidatePath('/dashboard/studio');
  return { error: null };
}

export async function removeMember(masterId: string): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Не авторизований' };

  const admin = createAdminClient();

  // Verify requester is owner of the studio the master belongs to
  const { data: mp } = await admin
    .from('master_profiles')
    .select('studio_id')
    .eq('id', masterId)
    .single();

  if (!mp?.studio_id) return { error: 'Майстер не у студії' };

  const { data: studio } = await admin
    .from('studios')
    .select('owner_id')
    .eq('id', mp.studio_id)
    .single();

  if (studio?.owner_id !== user.id) return { error: 'Недостатньо прав' };

  await admin.from('studio_members').delete().eq('studio_id', mp.studio_id).eq('master_id', masterId);
  await admin.from('master_profiles').update({ studio_id: null, subscription_tier: 'starter' }).eq('id', masterId);

  revalidatePath('/dashboard/studio');
  return { error: null };
}
