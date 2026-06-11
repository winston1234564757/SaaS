'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { generateSecureToken } from '@/lib/utils/token';
import { revalidatePath } from 'next/cache';

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
      .from('master_partners')
      .select('id')
      .match({ master_id: invitingMaster.id, partner_id: user.id })
      .maybeSingle();

    if (existing) {
      await admin
        .from('master_partners')
        .update({ status: 'accepted' })
        .eq('id', existing.id);
    } else {
      await admin
        .from('master_partners')
        .insert([
          { master_id: invitingMaster.id, partner_id: user.id, status: 'accepted' },
          { master_id: user.id, partner_id: invitingMaster.id, status: 'accepted' }
        ]);
    }

    revalidatePath('/dashboard/partners');
    return { success: true, error: null };
  } catch (err: any) {
    console.error('[acceptPartnerInvitation] error:', err);
    return { success: false, error: 'Не вдалося прийняти запрошення.' };
  }
}

/**
 * Toggles is_visible on a master_partners record.
 * Controls whether this partner appears on the master's public page.
 */
export async function togglePartnerVisibility(
  partnerRowId: string,
  isVisible: boolean,
): Promise<{ success: boolean; error: string | null }> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Не авторизований' };

    const admin = createAdminClient();

    const { data: row } = await admin
      .from('master_partners')
      .select('id, master_id')
      .eq('id', partnerRowId)
      .maybeSingle();

    if (!row) return { success: false, error: 'Партнера не знайдено' };
    if (row.master_id !== user.id) return { success: false, error: 'Доступ заборонено' };

    await admin
      .from('master_partners')
      .update({ is_visible: isVisible })
      .eq('id', partnerRowId);

    revalidatePath('/dashboard/growth');
    return { success: true, error: null };
  } catch (err: any) {
    console.error('[togglePartnerVisibility] error:', err);
    return { success: false, error: 'Не вдалося змінити видимість.' };
  }
}

/**
 * Toggles is_visible on a master_alliances record (M2M referral network).
 */
export async function toggleAllianceVisibility(
  allianceId: string,
  isVisible: boolean,
): Promise<{ success: boolean; error: string | null }> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Не авторизований' };

    const admin = createAdminClient();

    const { data: row } = await admin
      .from('master_alliances')
      .select('id, inviter_id, invitee_id')
      .eq('id', allianceId)
      .maybeSingle();

    if (!row) return { success: false, error: 'Альянс не знайдено' };
    if (row.inviter_id !== user.id && row.invitee_id !== user.id) {
      return { success: false, error: 'Доступ заборонено' };
    }

    await admin
      .from('master_alliances')
      .update({ is_visible: isVisible })
      .eq('id', allianceId);

    revalidatePath('/dashboard/growth');
    return { success: true, error: null };
  } catch (err: any) {
    console.error('[toggleAllianceVisibility] error:', err);
    return { success: false, error: 'Не вдалося змінити видимість.' };
  }
}

/**
 * Removes a partner from both directions of the master_partners table.
 */
export async function removePartner(partnerId: string): Promise<{ success: boolean; error: string | null }> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Не авторизований' };

    const admin = createAdminClient();

    await admin
      .from('master_partners')
      .delete()
      .or(`and(master_id.eq.${user.id},partner_id.eq.${partnerId}),and(master_id.eq.${partnerId},partner_id.eq.${user.id})`);

    revalidatePath('/dashboard/partners');
    return { success: true, error: null };
  } catch (err: any) {
    console.error('[removePartner] error:', err);
    return { success: false, error: 'Не вдалося видалити партнера.' };
  }
}
