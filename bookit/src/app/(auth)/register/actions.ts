'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { applyReferralRewards } from '@/lib/actions/referrals';
import { generateSecureToken } from '@/lib/utils/token';
import { revalidatePath } from 'next/cache';

function generatePlaceholderSlug(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(4));
  return 'master-' + Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
}

export async function checkPhoneExists(
  phone: string,
): Promise<{ exists: boolean; error: string | null }> {
  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from('profiles')
      .select('id')
      .eq('phone', phone)
      .maybeSingle();
    if (error) return { exists: false, error: error.message };
    return { exists: !!data, error: null };
  } catch {
    return { exists: false, error: 'Помилка сервера' };
  }
}

export async function claimMasterRole(
  phone: string,
  referredBy?: string | null,
): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Не авторизований' };

  const admin = createAdminClient();

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

  const slug = generatePlaceholderSlug();
  const masterReferralCode = generateSecureToken(6);

  const bonus = referredBy
    ? await applyReferralRewards(user.id, referredBy)
    : { subscriptionTier: 'starter' as const, subscriptionExpiresAt: null, finalReferredBy: null };

  const { error: masterError } = await admin
    .from('master_profiles')
    .upsert(
      {
        id: user.id,
        slug,
        is_published: false,
        referral_code: masterReferralCode,
        referred_by: bonus.finalReferredBy,
        subscription_tier: bonus.subscriptionTier,
        subscription_expires_at: bonus.subscriptionExpiresAt,
      },
      { onConflict: 'id' },
    );

  if (masterError) {
    console.error('[register] master_profiles upsert failed:', masterError.message);
    return { error: `master_profiles error: ${masterError.message}` };
  }

  revalidatePath('/dashboard', 'layout');
  return { error: null };
}

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

  if (profileError) return { error: profileError.message };

  let referralCode = generateSecureToken(8);
  for (let attempt = 0; attempt < 5; attempt++) {
    const { data: existing } = await admin.from('master_profiles').select('id').eq('referral_code', referralCode).maybeSingle();
    if (!existing) break;
    referralCode = generateSecureToken(8);
  }

  const bonus = params.referredBy
    ? await applyReferralRewards(params.userId, params.referredBy)
    : { subscriptionTier: 'starter' as const, subscriptionExpiresAt: null, finalReferredBy: null };

  // PRIMARY TX
  const masterData: Record<string, unknown> = {
    id: params.userId,
    slug: params.slug,
    categories: params.categories,
    referral_code: referralCode,
    subscription_tier: bonus.subscriptionTier,
    is_published: false,
  };
  if (bonus.finalReferredBy) masterData.referred_by = bonus.finalReferredBy;
  if (bonus.subscriptionExpiresAt) masterData.subscription_expires_at = bonus.subscriptionExpiresAt;

  const { error: masterError } = await admin
    .from('master_profiles')
    .upsert(masterData, { onConflict: 'id', ignoreDuplicates: false });

  if (masterError) return { error: 'Помилка створення профілю. Спробуйте ще раз.' };

  revalidatePath('/dashboard', 'layout');
  return { error: null };
}