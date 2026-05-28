'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { applyReferralRewards } from '@/lib/actions/referrals';
import { generateSecureToken } from '@/lib/utils/token';
import { LEGAL_VERSIONS } from '@/lib/constants/legal';
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
): Promise<{ error: string | null; needsOnboarding?: boolean }> {
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

  // Перевіряємо чи майстер вже пройшов онбординг (is_published = true)
  const { data: existingMp } = await admin
    .from('master_profiles')
    .select('id, is_published')
    .eq('id', user.id)
    .maybeSingle();
  const needsOnboarding = !existingMp || !existingMp.is_published;

  const slug = generatePlaceholderSlug();
  const masterReferralCode = generateSecureToken(6);

  // Phase 1: Гарантуємо наявність master_profiles до виклику referral-логіки.
  // master_alliances та master_referrals мають FK -> master_profiles(id),
  // тому рядок має існувати ДО fire-and-forget insertів у applyReferralRewards.
  const { error: masterInitError } = await admin
    .from('master_profiles')
    .upsert(
      {
        id: user.id,
        slug,
        is_published: false,
        referral_code: masterReferralCode,
        subscription_tier: 'starter',
      },
      { onConflict: 'id', ignoreDuplicates: true }, // зберігаємо існуючий slug/code при retry
    );

  if (masterInitError) {
    console.error('[register] master_profiles init failed:', masterInitError.message);
    return { error: masterInitError.message };
  }

  // Phase 2: Нараховуємо реферальний бонус (master_profiles вже існує → FK ок)
  const bonus = referredBy
    ? await applyReferralRewards(user.id, referredBy)
    : { subscriptionTier: 'starter' as const, subscriptionExpiresAt: null, finalReferredBy: null };

  // Phase 3: Застосовуємо бонус якщо реферал знайдено
  if (bonus.finalReferredBy) {
    const { error: masterError } = await admin
      .from('master_profiles')
      .update({
        subscription_tier: bonus.subscriptionTier,
        subscription_expires_at: bonus.subscriptionExpiresAt,
        referred_by: bonus.finalReferredBy,
      })
      .eq('id', user.id);

    if (masterError) {
      console.error('[register] referral bonus apply failed:', masterError.message);
      // Не блокуємо реєстрацію — майстер зареєструється зі Starter
    }
  }

  try {
    await admin.auth.admin.updateUserById(user.id, {
      user_metadata: {
        legal_accepted_at: new Date().toISOString(),
        legal_versions: LEGAL_VERSIONS,
      },
    });
  } catch (e) {
    console.error('[register] legal metadata write failed:', e);
  }

  revalidatePath('/dashboard', 'layout');
  return { error: null, needsOnboarding };
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
  // V-13: Verify the caller owns the userId before creating/updating their profile.
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user || user.id !== params.userId) {
    return { error: 'Не авторизований' };
  }

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

  // Phase 1: Гарантуємо наявність master_profiles до referral-логіки (FK safety)
  const { error: masterInitError } = await admin
    .from('master_profiles')
    .upsert(
      {
        id: params.userId,
        slug: params.slug,
        categories: params.categories,
        referral_code: referralCode,
        subscription_tier: 'starter',
        is_published: false,
        mood_theme: 'frost',
      },
      { onConflict: 'id', ignoreDuplicates: true },
    );

  if (masterInitError) return { error: 'Помилка створення профілю. Спробуйте ще раз.' };

  // Phase 2: Нараховуємо реферальний бонус (master_profiles вже існує → FK ок)
  const bonus = params.referredBy
    ? await applyReferralRewards(params.userId, params.referredBy)
    : { subscriptionTier: 'starter' as const, subscriptionExpiresAt: null, finalReferredBy: null };

  // Phase 3: Повний upsert з усіма полями + бонус
  const masterData: Record<string, unknown> = {
    id: params.userId,
    slug: params.slug,
    categories: params.categories,
    referral_code: referralCode,
    subscription_tier: bonus.subscriptionTier,
    is_published: false,
    mood_theme: 'frost',
  };
  if (bonus.finalReferredBy) masterData.referred_by = bonus.finalReferredBy;
  if (bonus.subscriptionExpiresAt) masterData.subscription_expires_at = bonus.subscriptionExpiresAt;

  const { error: masterError } = await admin
    .from('master_profiles')
    .upsert(masterData, { onConflict: 'id', ignoreDuplicates: false });

  if (masterError) return { error: 'Помилка створення профілю. Спробуйте ще раз.' };

  try {
    await admin.auth.admin.updateUserById(params.userId, {
      user_metadata: {
        legal_accepted_at: new Date().toISOString(),
        legal_versions: LEGAL_VERSIONS,
      },
    });
  } catch (e) {
    console.error('[register] legal metadata write failed:', e);
  }

  revalidatePath('/dashboard', 'layout');
  return { error: null };
}