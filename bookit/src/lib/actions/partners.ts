'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { generateSecureToken } from '@/lib/utils/token';
import { revalidatePath } from 'next/cache';

/**
 * M-GROW-02: партнери та альянси обʼєднані в master_connections (bilateral).
 * Партнери = kind 'partner' (взаємна співпраця, 2 симетричні рядки, mutable).
 * Альянси  = kind 'alliance' (реферал-граф, пишеться у referrals.ts).
 * master_referrals (білінг) НЕ чіпаємо.
 */

/**
 * Returns the partner invite link for the current master.
 * Generates and saves partner_invite_token on first call.
 */
export async function getPartnerInviteLink(): Promise<{ link: string | null; error: string | null }> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { link: null, error: 'Не авторизований' };

    const admin = createAdminClient();
    const { data: mp } = await admin
      .from('master_profiles')
      .select('slug, partner_invite_token')
      .eq('id', user.id)
      .single();

    if (!mp) return { link: null, error: 'Профіль майстра не знайдено' };

    let token = mp.partner_invite_token as string | null;
    if (!token) {
      token = generateSecureToken(8);
      const { error: updateError } = await admin
        .from('master_profiles')
        .update({ partner_invite_token: token })
        .eq('id', user.id);
      if (updateError?.code === '23505') {
        token = generateSecureToken(8);
        await admin.from('master_profiles').update({ partner_invite_token: token }).eq('id', user.id);
      }
    }

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    return { link: `${baseUrl}/dashboard/partners/join?token=${token}`, error: null };
  } catch (err: any) {
    console.error('[getPartnerInviteLink] error:', err);
    return { link: null, error: 'Не вдалося згенерувати посилання.' };
  }
}

/**
 * Accepts a partner invitation using partner_invite_token.
 * Creates a bidirectional 'partner' connection.
 */
export async function acceptPartnerInvitation(token: string): Promise<{ success: boolean; error: string | null }> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Не авторизований' };

    const admin = createAdminClient();

    const { data: invitingMaster } = await admin
      .from('master_profiles')
      .select('id')
      .eq('partner_invite_token', token)
      .single();

    if (!invitingMaster) return { success: false, error: 'Недійсне або прострочене запрошення' };
    if (invitingMaster.id === user.id) return { success: false, error: 'Ви не можете стати партнером самого себе' };

    const { data: existing } = await admin
      .from('master_connections')
      .select('id')
      .match({ master_id: invitingMaster.id, other_id: user.id })
      .maybeSingle();

    if (existing) {
      await admin
        .from('master_connections')
        .update({ status: 'accepted', kind: 'partner' })
        .eq('id', existing.id);
    } else {
      await admin
        .from('master_connections')
        .insert([
          { master_id: invitingMaster.id, other_id: user.id, kind: 'partner', status: 'accepted' },
          { master_id: user.id, other_id: invitingMaster.id, kind: 'partner', status: 'accepted' },
        ]);
    }

    revalidatePath('/dashboard/growth');
    revalidatePath('/dashboard/partners');
    return { success: true, error: null };
  } catch (err: any) {
    console.error('[acceptPartnerInvitation] error:', err);
    return { success: false, error: 'Не вдалося прийняти запрошення.' };
  }
}

/**
 * Toggles is_visible on a master_connections row (per-side public visibility).
 * Shared by partner + alliance toggles — каждая сторона керує своїм рядком.
 */
async function toggleConnectionVisibility(
  connectionId: string,
  isVisible: boolean,
  notFoundMsg: string,
): Promise<{ success: boolean; error: string | null }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Не авторизований' };

  const admin = createAdminClient();

  const { data: row } = await admin
    .from('master_connections')
    .select('id, master_id')
    .eq('id', connectionId)
    .maybeSingle();

  if (!row) return { success: false, error: notFoundMsg };
  if (row.master_id !== user.id) return { success: false, error: 'Доступ заборонено' };

  await admin
    .from('master_connections')
    .update({ is_visible: isVisible })
    .eq('id', connectionId);

  revalidatePath('/dashboard/growth');
  return { success: true, error: null };
}

/**
 * Toggles is_visible on a partner connection.
 */
export async function togglePartnerVisibility(
  partnerRowId: string,
  isVisible: boolean,
): Promise<{ success: boolean; error: string | null }> {
  try {
    return await toggleConnectionVisibility(partnerRowId, isVisible, 'Партнера не знайдено');
  } catch (err: any) {
    console.error('[togglePartnerVisibility] error:', err);
    return { success: false, error: 'Не вдалося змінити видимість.' };
  }
}

/**
 * Toggles is_visible on an alliance connection.
 */
export async function toggleAllianceVisibility(
  allianceId: string,
  isVisible: boolean,
): Promise<{ success: boolean; error: string | null }> {
  try {
    return await toggleConnectionVisibility(allianceId, isVisible, 'Альянс не знайдено');
  } catch (err: any) {
    console.error('[toggleAllianceVisibility] error:', err);
    return { success: false, error: 'Не вдалося змінити видимість.' };
  }
}

/**
 * Removes a partner connection from both directions.
 * Лише kind='partner' — альянси (реферал-граф) immutable.
 */
export async function removePartner(partnerId: string): Promise<{ success: boolean; error: string | null }> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Не авторизований' };

    const admin = createAdminClient();

    await admin
      .from('master_connections')
      .delete()
      .eq('kind', 'partner')
      .or(`and(master_id.eq.${user.id},other_id.eq.${partnerId}),and(master_id.eq.${partnerId},other_id.eq.${user.id})`);

    revalidatePath('/dashboard/growth');
    revalidatePath('/dashboard/partners');
    return { success: true, error: null };
  } catch (err: any) {
    console.error('[removePartner] error:', err);
    return { success: false, error: 'Не вдалося видалити партнера.' };
  }
}
