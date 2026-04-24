'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { generateSecureToken } from '@/lib/utils/token';

// ── getOrGenerateReferralCode ─────────────────────────────────────

/**
 * Гарантує наявність реферального коду для профілю (майстра або клієнта).
 */
export async function getOrGenerateProfileReferralCode(
  id: string,
  type: 'master' | 'client' = 'master'
): Promise<{ success: boolean; code?: string; error?: string }> {
  try {
    const admin = createAdminClient();
    const table = type === 'master' ? 'master_profiles' : 'client_profiles';

    // 1. Шукаємо існуючий
    const { data: profile } = await admin
      .from(table)
      .select('referral_code')
      .eq('id', id)
      .maybeSingle();

    if (profile?.referral_code) {
      return { success: true, code: profile.referral_code };
    }

    // 2. Генеруємо новий з retry при колізіях
    for (let attempt = 0; attempt < 10; attempt++) {
      const code = generateSecureToken(6);
      const { error } = await admin
        .from(table)
        .update({ referral_code: code })
        .eq('id', id)
        .is('referral_code', null);

      if (!error) return { success: true, code };
      // 23505 = unique_violation
      if (error.code !== '23505') return { success: false, error: error.message };
    }

    return { success: false, error: 'Не вдалося згенерувати унікальний код після декількох спроб' };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

/**
 * @deprecated Use getOrGenerateProfileReferralCode
 */
export async function getOrGenerateReferralCode(masterId: string) {
  return getOrGenerateProfileReferralCode(masterId, 'master');
}

// ── getOrCreateReferralLink (Legacy wrapper for backward compat) ──

export async function getOrCreateReferralLink(
  ownerId: string,
  role: 'master' | 'client',
  targetType: 'B2B' | 'C2M' | 'C2C',
  targetMasterId?: string | null,
): Promise<
  | { success: true; code: string; link: string }
  | { success: false; error: string }
> {
  // Тепер ми просто повертаємо код з профілю для B2B
  const appUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://bookit.com.ua';
  
  if (targetType === 'B2B') {
    const res = await getOrGenerateReferralCode(ownerId);
    if (res.success && res.code) {
      return { success: true, code: res.code, link: `${appUrl}/invite/${res.code}` };
    }
    return { success: false, error: res.error || 'Помилка' };
  }

  // Для решти типів поки лишаємо як було або ігноруємо (згідно з MVP цілями)
  return { success: false, error: 'Метод застарів для цього типу. Використовуйте Classic Referral.' };
}

// ── applyReferralRewards ──────────────────────────────────────────

export interface ReferralBonus {
  subscriptionTier: 'starter' | 'pro';
  subscriptionExpiresAt: string | null;
  finalReferredBy: string | null;
}

/**
 * Resolves a referral code (M2M or C2B), awards the referrer,
 * and returns the subscription bonus to apply to the new master.
 *
 * Awards are fire-and-forget — errors are logged but never throw,
 * so a reward failure never blocks registration.
 */
// V-11: Referral code must be 3-16 alphanumeric chars. Rejects anything else early.
const REFERRAL_CODE_RE = /^[a-zA-Z0-9]{3,16}$/;

export async function applyReferralRewards(
  newMasterId: string,
  refCode: string,
): Promise<ReferralBonus> {
  const sanitized = refCode.trim();
  if (!REFERRAL_CODE_RE.test(sanitized)) {
    return { subscriptionTier: 'starter', subscriptionExpiresAt: null, finalReferredBy: null };
  }

  const admin = createAdminClient();

  const [masterRes, clientRes] = await Promise.all([
    admin.from('master_profiles').select('id, subscription_expires_at').eq('referral_code', refCode).maybeSingle(),
    admin.from('client_profiles').select('id').eq('referral_code', refCode).maybeSingle(),
  ]);

  const mReferrer = masterRes.data;
  const cReferrer = clientRes.data;

  const bonus: ReferralBonus = {
    subscriptionTier: 'starter',
    subscriptionExpiresAt: null,
    finalReferredBy: null,
  };

  if (mReferrer && mReferrer.id !== newMasterId) {
    bonus.finalReferredBy = refCode;
    bonus.subscriptionTier = 'pro';
    const expires = new Date();
    expires.setDate(expires.getDate() + 30);
    bonus.subscriptionExpiresAt = expires.toISOString();

    const baseDate = mReferrer.subscription_expires_at
      ? new Date(mReferrer.subscription_expires_at)
      : new Date();
    const refStart = baseDate > new Date() ? baseDate : new Date();
    refStart.setDate(refStart.getDate() + 30);
    admin.from('master_profiles').update({
      subscription_tier: 'pro',
      subscription_expires_at: refStart.toISOString(),
    }).eq('id', mReferrer.id).then(({ error }) => {
      if (error) console.error('[referrals] master referrer reward failed:', error.message);
    });
  } else if (cReferrer) {
    bonus.finalReferredBy = refCode;
    bonus.subscriptionTier = 'pro';
    const expires = new Date();
    expires.setDate(expires.getDate() + 30);
    bonus.subscriptionExpiresAt = expires.toISOString();

    Promise.all([
      admin.from('client_promocodes').insert({
        client_id: cReferrer.id,
        master_id: newMasterId,
        discount_percentage: 50,
      }),
      admin.rpc('increment_client_master_invite_count', { p_client_id: cReferrer.id }),
    ]).then(results => {
      for (const r of results) {
        if ('error' in r && r.error) {
          console.error('[referrals] client referrer reward failed:', r.error.message);
        }
      }
    });
  }

  return bonus;
}

// ── processRegistrationReferral ───────────────────────────────────

/**
 * Викликається після реєстрації нового майстра (newMasterId).
 * Зберігає зв'язок та нараховує бонуси.
 */
export async function processRegistrationReferral(
  newMasterId: string,
  refCode: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const admin = createAdminClient();

    // 1. Знаходимо реферера (власника коду)
    const { data: referrer } = await admin
      .from('master_profiles')
      .select('id, subscription_expires_at')
      .eq('referral_code', refCode)
      .single();

    if (!referrer) return { success: false, error: 'Реферальний код не знайдено' };
    if (referrer.id === newMasterId) return { success: false, error: 'Самореферал заборонено' };

    // 2. Оновлюємо нового майстра (referred_by)
    await admin
      .from('master_profiles')
      .update({ referred_by: refCode })
      .eq('id', newMasterId);

    // 3. Нараховуємо бонус рефереру (+30 днів)
    const baseDate = referrer.subscription_expires_at
      ? new Date(referrer.subscription_expires_at)
      : new Date();
    
    // Якщо підписка вже закінчилась, рахуємо від сьогодні
    const start = baseDate > new Date() ? baseDate : new Date();
    start.setDate(start.getDate() + 30);

    const { error: promoError } = await admin
      .from('master_profiles')
      .update({ subscription_expires_at: start.toISOString() })
      .eq('id', referrer.id);

    // 4. Нараховуємо бонус новому майстру (+30 днів пробного періоду Pro)
    // (Логіка залежить від того, чи хочемо ми давати бонус і новачкові відразу)
    // Для MVP даємо обом:
    const newMasterBonus = new Date();
    newMasterBonus.setDate(newMasterBonus.getDate() + 30);
    
    await admin
      .from('master_profiles')
      .update({ 
        subscription_expires_at: newMasterBonus.toISOString(),
        subscription_tier: 'pro' // Даємо Pro тріал
      })
      .eq('id', newMasterId);

    if (promoError) return { success: false, error: promoError.message };
    
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}
