'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';

/**
 * Generates a partner invitation link for the current master.
 */
export async function getPartnerInviteLink(): Promise<{ link: string | null; error: string | null }> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { link: null, error: 'Не авторизований' };

    const { data: mp } = await supabase
      .from('master_profiles')
      .select('slug, referral_code')
      .eq('id', user.id)
      .single();

    if (!mp) return { link: null, error: 'Профіль майстра не знайдено' };

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    const link = `${baseUrl}/dashboard/partners/join?token=${mp.referral_code}`;
    
    return { link, error: null };
  } catch (err: any) {
    console.error('[getPartnerInviteLink] error:', err);
    return { link: null, error: 'Не вдалося згенерувати посилання.' };
  }
}

/**
 * Accepts a partner invitation.
 */
export async function acceptPartnerInvitation(token: string): Promise<{ success: boolean; error: string | null }> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Не авторизований' };

    const admin = createAdminClient();

    // 1. Find the inviting master by token (referral_code)
    const { data: invitingMaster } = await admin
      .from('master_profiles')
      .select('id')
      .eq('referral_code', token)
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
 * Toggles is_visible on a master_alliance record (for public "Trusted Partners" display).
 * Only the inviter or invitee may toggle their own alliance row.
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
 * Removes a partner from the network.
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

