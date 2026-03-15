'use server';

import { createClient } from '@supabase/supabase-js';

// Service role — обходить RLS, використовується лише на сервері
function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

function generateReferralCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no 0/O/I/1 to avoid confusion
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export async function createMasterProfileAfterSignup(params: {
  userId: string;
  fullName: string;
  email?: string | null;
  phone?: string | null;
  slug: string;
  categories: string[];
  referredBy?: string | null; // referral_code of the inviter
}): Promise<{ error: string | null }> {
  const admin = getAdminClient();

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
  // Generate a unique referral code, retry on collision
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

  // Determine if new master gets a Pro trial via referral
  let subscriptionTier: 'starter' | 'pro' = 'starter';
  let subscriptionExpiresAt: string | null = null;

  if (params.referredBy) {
    // Validate referral code exists
    const { data: referrer } = await admin
      .from('master_profiles')
      .select('id, subscription_tier, subscription_expires_at')
      .eq('referral_code', params.referredBy)
      .maybeSingle();

    if (referrer) {
      // New master gets 30 days Pro trial
      subscriptionTier = 'pro';
      subscriptionExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

      // Referrer also gets +30 days Pro
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
    console.error('[register] master_profiles upsert error:', masterError);
    return { error: masterError.message };
  }

  return { error: null };
}
