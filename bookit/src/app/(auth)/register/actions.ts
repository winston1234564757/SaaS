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
): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Не авторизований' };

  const admin = createAdminClient();
  const slug  = generatePlaceholderSlug();

  // PS-01: Use DB transaction function — eliminates orphaned auth user risk.
  // If either profiles or master_profiles insert fails, both are rolled back atomically.
  const { data, error: rpcError } = await admin.rpc('fn_claim_master_role', {
    p_user_id: user.id,
    p_phone:   phone,
    p_slug:    slug,
  });
  const result = data as string | null;

  if (rpcError || result !== 'ok') {
    console.error('[register] fn_claim_master_role failed:', rpcError?.message ?? result);
    return { error: 'Помилка ініціалізації профілю майстра. Спробуйте ще раз.' };
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
    const { data: referrer } = await admin
      .from('master_profiles')
      .select('id, subscription_tier, subscription_expires_at')
      .eq('referral_code', params.referredBy)
      .maybeSingle();

    if (referrer) {
      subscriptionTier = 'pro';
      subscriptionExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

      const referrerExpiresAt = referrer.subscription_expires_at
        ? new Date(referrer.subscription_expires_at)
        : new Date();
      if (referrerExpiresAt < new Date()) referrerExpiresAt.setTime(Date.now());
      referrerExpiresAt.setDate(referrerExpiresAt.getDate() + 30);

      await admin
        .from('master_profiles')
        .update({
          subscription_tier: 'pro',
          subscription_expires_at: referrerExpiresAt.toISOString(),
        })
        .eq('id', referrer.id);
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
