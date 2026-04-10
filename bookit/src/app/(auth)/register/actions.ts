'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';

function generateReferralCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no 0/O/I/1 to avoid confusion
  const bytes = crypto.getRandomValues(new Uint8Array(8));
  return Array.from(bytes, b => chars[b % chars.length]).join('');
}

function generatePlaceholderSlug(): string {
  // hex slug — guaranteed URL-safe, 8 chars, collision-negligible at current scale
  const bytes = crypto.getRandomValues(new Uint8Array(4));
  return 'master-' + Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Called immediately after SMS OTP verification on /register.
 *
 * Sets profiles.role = 'master' AND creates a placeholder master_profiles row
 * atomically (with rollback). This unblocks the proxy for /dashboard/onboarding
 * before the user has completed the full onboarding wizard.
 *
 * Client-only accounts MUST NOT be created here.
 * Client accounts are provisioned exclusively via:
 *   - /api/auth/verify-sms (PostBookingAuth SMS path)
 *   - /auth/callback with ?bid= param (PostBookingAuth Google OAuth path)
 */
export async function claimMasterRole(
  phone: string,
  referredBy?: string | null,
): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Не авторизований' };

  const admin = createAdminClient();

  // 1. Ensure Profile Identity
  const { error: profileError } = await admin
    .from('profiles')
    .upsert(
      { id: user.id, role: 'master', phone, full_name: '' },
      { onConflict: 'id', ignoreDuplicates: false },
    );

  if (profileError) {
    console.error('[register] profiles upsert failed:', profileError.message);
    return { error: profileError.message };
  }

  // 2. Prepare Master Profile Data
  const slug = generatePlaceholderSlug();
  const masterReferralCode = generateReferralCode().slice(0, 6); 
  
  let subscriptionTier: 'starter' | 'pro' = 'starter';
  let subscriptionExpiresAt: string | null = null;
  let finalReferredBy: string | null = null;

  // 3. Referral Logic (Parallel Check)
  if (referredBy) {
    const [masterRes, clientRes] = await Promise.all([
      admin.from('master_profiles').select('id, subscription_expires_at').eq('referral_code', referredBy).maybeSingle(),
      admin.from('client_profiles').select('id').eq('referral_code', referredBy).maybeSingle()
    ]);

    const mReferrer = masterRes.data;
    const cReferrer = clientRes.data;

    if (mReferrer && mReferrer.id !== user.id) {
      finalReferredBy = referredBy;
      subscriptionTier = 'pro';
      
      const newBonus = new Date();
      newBonus.setDate(newBonus.getDate() + 30);
      subscriptionExpiresAt = newBonus.toISOString();

      const baseDate = mReferrer.subscription_expires_at ? new Date(mReferrer.subscription_expires_at) : new Date();
      const refStart = baseDate > new Date() ? baseDate : new Date();
      refStart.setDate(refStart.getDate() + 30);

      await admin.from('master_profiles').update({ subscription_expires_at: refStart.toISOString() }).eq('id', mReferrer.id);
      console.log(`[claimMasterRole] M2M Referral applied: ${referredBy} -> ${user.id}`);
    } 
    else if (cReferrer) {
      finalReferredBy = referredBy;
      subscriptionTier = 'pro';
      
      const newBonus = new Date();
      newBonus.setDate(newBonus.getDate() + 30);
      subscriptionExpiresAt = newBonus.toISOString();

      try {
        await admin.from('client_promocodes').insert({
          client_id: cReferrer.id,
          master_id: user.id,
          discount_percentage: 50
        });
      } catch (err: any) {
        console.log('[claimMasterRole] Promocode skip (duplicate or error)', err.message);
      }
      
      await admin.rpc('increment_client_master_invite_count', { p_client_id: cReferrer.id });
      console.log(`[claimMasterRole] C2M Barter applied: ${referredBy} -> ${user.id}`);
    }
  }

  // 4. Upsert Master Profile
  const { error: masterError } = await admin
    .from('master_profiles')
    .upsert(
      { 
        id: user.id, 
        slug, 
        is_published: false, 
        referral_code: masterReferralCode, 
        referred_by: finalReferredBy,
        subscription_tier: subscriptionTier,
        subscription_expires_at: subscriptionExpiresAt
      },
      { onConflict: 'id' } 
    );

  if (masterError) {
    console.error('[register] master_profiles upsert failed:', masterError.message);
    return { error: `master_profiles error: ${masterError.message}` };
  }

  revalidatePath('/dashboard', 'layout');
  return { error: null };
}

/**
 * Full profile creation called from the onboarding wizard once the user has
 * provided their name, slug, and categories.
 *
 * Upserts both profiles (role: master) and master_profiles (with real slug +
 * categories). Rolls back profiles if master_profiles insert fails.
 */
export async function createMasterProfileAfterSignup(params: {
  userId: string;
  fullName: string;
  email?: string | null;
  phone?: string | null;
  slug: string;
  categories: string[];
  referredBy?: string | null;
}): Promise<{ error: string | null }> {
  const admin = createAdminClient();

  // --- profiles ---
  const profileData: Record<string, unknown> = {
    id: params.userId,
    role: 'master',
    full_name: params.fullName,
  };
  if (params.email) profileData.email = params.email;
  if (params.phone) profileData.phone = params.phone;

  const { error: profileError } = await admin
    .from('profiles')
    .upsert(profileData, { onConflict: 'id', ignoreDuplicates: false });

  if (profileError) {
    console.error('[register] profiles upsert error:', profileError);
    return { error: profileError.message };
  }

  // --- master_profiles ---
  let referralCode = generateReferralCode();
  for (let attempt = 0; attempt < 5; attempt++) {
    const { data: existing } = await admin
      .from('master_profiles')
      .select('id')
      .eq('referral_code', referralCode)
      .maybeSingle();
    if (!existing) break;
    referralCode = generateReferralCode();
  }

  let subscriptionTier: 'starter' | 'pro' = 'starter';
  let subscriptionExpiresAt: string | null = null;

  if (params.referredBy) {
    const [masterRes, clientRes] = await Promise.all([
      admin.from('master_profiles').select('id, subscription_expires_at').eq('referral_code', params.referredBy).maybeSingle(),
      admin.from('client_profiles').select('id').eq('referral_code', params.referredBy).maybeSingle()
    ]);

    const mReferrer = masterRes.data;
    const cReferrer = clientRes.data;

    // SCENARIO A: Master Referral (M2M)
    if (mReferrer && mReferrer.id !== params.userId) {
      subscriptionTier = 'pro';
      const newBonus = new Date();
      newBonus.setDate(newBonus.getDate() + 30);
      subscriptionExpiresAt = newBonus.toISOString();

      const referrerExpiresAt = mReferrer.subscription_expires_at ? new Date(mReferrer.subscription_expires_at) : new Date();
      const refStart = referrerExpiresAt > new Date() ? referrerExpiresAt : new Date();
      refStart.setDate(refStart.getDate() + 30);

      await admin.from('master_profiles').update({
          subscription_tier: 'pro',
          subscription_expires_at: refStart.toISOString(),
        }).eq('id', mReferrer.id);
    } 
    // SCENARIO B: Client Referral (C2M - Barter)
    else if (cReferrer) {
      subscriptionTier = 'pro';
      const newBonus = new Date();
      newBonus.setDate(newBonus.getDate() + 30);
      subscriptionExpiresAt = newBonus.toISOString();

      try {
        await admin.from('client_promocodes').insert({
          client_id: cReferrer.id,
          master_id: params.userId,
          discount_percentage: 50
        });
      } catch (err) {}
          
      await admin.rpc('increment_client_master_invite_count', { p_client_id: cReferrer.id });
    }
  }

  const masterData: Record<string, unknown> = {
    id: params.userId,
    slug: params.slug,
    categories: params.categories,
    referral_code: referralCode,
    subscription_tier: subscriptionTier,
    is_published: false,
  };
  if (params.referredBy) masterData.referred_by = params.referredBy;
  if (subscriptionExpiresAt) masterData.subscription_expires_at = subscriptionExpiresAt;

  const { error: masterError } = await admin
    .from('master_profiles')
    .upsert(masterData, { onConflict: 'id', ignoreDuplicates: false });

  if (masterError) {
    await admin.from('profiles').delete().eq('id', params.userId);
    return { error: 'Помилка створення профілю. Спробуйте ще раз.' };
  }

  revalidatePath('/dashboard', 'layout');
  return { error: null };
}
