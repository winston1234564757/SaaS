'use server';

import { createAdminClient } from '@/lib/supabase/admin';

// ── Генератор коду (6 символів, читабельний алфавіт) ──────────────

function generateCode(length = 6): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Без 0, O, I, 1 для усунення плутанини
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  return Array.from(bytes)
    .map(b => chars[b % chars.length])
    .join('');
}

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
      const code = generateCode(6);
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
