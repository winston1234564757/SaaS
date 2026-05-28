'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { generateSecureToken, sha256Hex } from '@/lib/utils/token';

export async function joinStudio(token: string): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Не авторизований' };

  const admin = createAdminClient();

  const tokenHash = await sha256Hex(token);
  const { data: studio } = await admin
    .from('studios')
    .select('id, owner_id, name, invite_token_expires_at')
    .eq('invite_token_hash', tokenHash)
    .single();

  if (!studio) return { error: 'Недійсне посилання або студія не знайдена' };

  if (!studio.invite_token_expires_at || new Date(studio.invite_token_expires_at) < new Date()) {
    return { error: 'Посилання застаріло. Попросіть власника студії надіслати нове.' };
  }

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

  // Optimistic lock: rotate token first, matching original hash.
  // If two masters arrive simultaneously, only one matches — the second gets 0 rows.
  const newRawToken = generateSecureToken(32);
  const newTokenHash = await sha256Hex(newRawToken);
  const { data: rotated, error: rotateErr } = await admin
    .from('studios')
    .update({
      invite_token: newRawToken,
      invite_token_hash: newTokenHash,
      invite_token_expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    })
    .eq('id', studio.id)
    .eq('invite_token_hash', tokenHash)
    .select('id');

  if (rotateErr || !rotated?.length) {
    return { error: 'Посилання вже було використане. Попросіть власника студії надіслати нове.' };
  }

  const { error: memberErr } = await admin
    .from('studio_members')
    .insert({ studio_id: studio.id, master_id: user.id, role: 'member' });

  if (memberErr) {
    return { error: 'Не вдалося приєднатися до студії. Спробуйте ще раз.' };
  }

  const { error: profileErr } = await admin
    .from('master_profiles')
    .update({ studio_id: studio.id, subscription_tier: 'studio' })
    .eq('id', user.id);

  if (profileErr) {
    // Compensate: remove the member record to avoid broken state
    await admin.from('studio_members').delete().eq('studio_id', studio.id).eq('master_id', user.id);
    return { error: 'Не вдалося оновити профіль. Спробуйте ще раз.' };
  }

  return { error: null };
}
