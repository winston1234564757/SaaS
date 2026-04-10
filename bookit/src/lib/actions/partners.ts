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
    if (!user) return { link: null, error: 'Unauthorized' };

    const { data: mp } = await supabase
      .from('master_profiles')
      .select('slug, referral_code')
      .eq('id', user.id)
      .single();

    if (!mp) return { link: null, error: 'Master profile not found' };

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    // Using referral_code as the invite token for simplicity as requested
    const link = `${baseUrl}/dashboard/partners/join?token=${mp.referral_code}`;
    
    return { link, error: null };
  } catch (err: any) {
    return { link: null, error: err.message };
  }
}

/**
 * Accepts a partner invitation.
 */
export async function acceptPartnerInvitation(token: string): Promise<{ success: boolean; error: string | null }> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Unauthorized' };

    const admin = createAdminClient();

    // 1. Find the inviting master by token (referral_code)
    const { data: invitingMaster } = await admin
      .from('master_profiles')
      .select('id')
      .eq('referral_code', token)
      .single();

    if (!invitingMaster) return { success: false, error: 'Invalid or expired invitation' };
    if (invitingMaster.id === user.id) return { success: false, error: 'You cannot partner with yourself' };

    // 2. Clear status: Upsert partnership as accepted on BOTH ways for the "Cartel" visibility
    // In our model, master_partners stores the relationship. 
    // We treat it as a mutual link.
    
    // Check if already exists
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
    return { success: false, error: err.message };
  }
}

/**
 * Removes a partner from the network.
 */
export async function removePartner(partnerId: string): Promise<{ success: boolean; error: string | null }> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Unauthorized' };

    const admin = createAdminClient();

    // Delete both entries to ensure mutual removal
    await admin
      .from('master_partners')
      .delete()
      .or(`and(master_id.eq.${user.id},partner_id.eq.${partnerId}),and(master_id.eq.${partnerId},partner_id.eq.${user.id})`);

    revalidatePath('/dashboard/partners');
    return { success: true, error: null };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
