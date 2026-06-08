'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { generateSecureToken } from '@/lib/utils/token';

// ── getOrGenerateReferralCode ─────────────────────────────────────

/**
 * Гарантує наявність реферального коду для профілю (майстра або клієнта).
 */
export async function getOrGenerateProfileReferralCode(
  id: string,
  type: 'master' | 'client' = 'master'
): Promise<{ success: boolean; code?: string; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.id !== id) return { success: false, error: 'Unauthorized' };
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
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.id !== ownerId) return { success: false, error: 'Unauthorized' };

  // Тепер ми просто повертаємо код з профілю для B2B
  const appUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://bookit.com.ua';

  if (targetType === 'B2B') {
    const res = await getOrGenerateReferralCode(ownerId);
    if (res.success && res.code) {
      return { success: true, code: res.code, link: `${appUrl}/invite/${res.code}` };
    }
    return { success: false, error: res.error || 'Помилка' };
  }

  if (targetType === 'C2C') {
    if (!targetMasterId) return { success: false, error: 'masterId не передано для C2C посилання' };

    const admin = createAdminClient();

    // Get client referral code (generate if missing)
    const codeRes = await getOrGenerateProfileReferralCode(ownerId, 'client');
    if (!codeRes.success || !codeRes.code) {
      return { success: false, error: codeRes.error || 'Не вдалося отримати код клієнта' };
    }

    // Get master slug
    const { data: master } = await admin
      .from('master_profiles')
      .select('slug')
      .eq('id', targetMasterId)
      .maybeSingle();

    if (!master?.slug) return { success: false, error: 'Майстра не знайдено' };

    const link = `${appUrl}/${master.slug}?ref=${codeRes.code}`;
    return { success: true, code: codeRes.code, link };
  }

  return { success: false, error: 'Невідомий тип реферального посилання' };
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
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.id !== newMasterId) {
    return { subscriptionTier: 'starter', subscriptionExpiresAt: null, finalReferredBy: null };
  }

  const sanitized = refCode.trim();
  if (!REFERRAL_CODE_RE.test(sanitized)) {
    return { subscriptionTier: 'starter', subscriptionExpiresAt: null, finalReferredBy: null };
  }

  const admin = createAdminClient();

  // ── Idempotency check: якщо бонус вже нараховувався для цього майстра ──
  // ВАЖЛИВО: повертаємо pro-бонус (не starter), щоб retry реєстрації не скидав тариф
  const { data: existingGrant, error: grantCheckError } = await admin
    .from('referral_grants')
    .select('id, ref_code, granted_at')
    .eq('referee_id', newMasterId)
    .maybeSingle();

  if (grantCheckError) {
    console.error('[referrals] grant check failed, continuing without idempotency:', grantCheckError.message);
  } else if (existingGrant) {
    // Гранту вже є — визначаємо тип (M2M vs C2B) та повертаємо бонус.
    // Важливо: НЕ нараховуємо повторно (+30д рефереру), але відновлюємо
    // відсутні relationship-рядки (master_referrals, master_alliances, client_promocodes).
    console.warn('[referrals] idempotent path for masterId:', newMasterId);

    const [masterRefRes, clientRefRes] = await Promise.all([
      admin.from('master_profiles').select('id').eq('referral_code', existingGrant.ref_code).maybeSingle(),
      admin.from('client_profiles').select('id').eq('referral_code', existingGrant.ref_code).maybeSingle(),
    ]);

    const isMasterRef = !!masterRefRes.data;
    const trialDays = isMasterRef ? 14 : 30;
    
    const { data: currentMaster } = await admin
      .from('master_profiles')
      .select('created_at')
      .eq('id', newMasterId)
      .maybeSingle();

    const grantDate = new Date(existingGrant.granted_at);
    let baseDate = grantDate;
    
    if (currentMaster?.created_at) {
      const masterCreated = new Date(currentMaster.created_at);
      if (masterCreated.getTime() - grantDate.getTime() > 24 * 60 * 60 * 1000) {
        baseDate = masterCreated;
        await admin.from('referral_grants').update({ granted_at: masterCreated.toISOString() }).eq('id', existingGrant.id);
      }
    }

    const expiresAt = new Date(baseDate);
    expiresAt.setDate(expiresAt.getDate() + trialDays);
    const isExpired = expiresAt < new Date();

    if (isMasterRef && masterRefRes.data) {
      // M2M: відновлюємо master_referrals / master_alliances якщо відсутні
      const [mrCheck, maCheck] = await Promise.all([
        admin.from('master_referrals').select('id')
          .eq('referrer_id', masterRefRes.data.id).eq('referee_id', newMasterId).maybeSingle(),
        admin.from('master_alliances').select('id')
          .eq('inviter_id', masterRefRes.data.id).eq('invitee_id', newMasterId).maybeSingle(),
      ]);

      if (!mrCheck.data) {
        const ins = await admin.from('master_referrals').insert({
          referrer_id: masterRefRes.data.id,
          referee_id: newMasterId,
          status: 'trial',
        });
        if (ins.error && ins.error.code !== '23505')
          console.error('[referrals] idempotent M2M referral insert failed:', ins.error.message);
      }

      if (!maCheck.data) {
        const ins = await admin.from('master_alliances').insert({
          inviter_id: masterRefRes.data.id,
          invitee_id: newMasterId,
        });
        if (ins.error && ins.error.code !== '23505')
          console.error('[referrals] idempotent M2M alliance insert failed:', ins.error.message);
      }
    } else if (!isMasterRef && clientRefRes.data) {
      // C2B: відновлюємо client_promocodes якщо відсутній
      const { data: existingPromo } = await admin
        .from('client_promocodes')
        .select('id')
        .eq('client_id', clientRefRes.data.id)
        .eq('master_id', newMasterId)
        .maybeSingle();

      if (!existingPromo) {
        // Increment НЕ повторюємо: міг вже виконатись в попередній спробі.
        const promoRes = await admin.from('client_promocodes').insert({
          client_id: clientRefRes.data.id,
          master_id: newMasterId,
          discount_percentage: 50,
        });
        if (promoRes.error && promoRes.error.code !== '23505')
          console.error('[referrals] C2B idempotent re-apply promo failed:', promoRes.error.message);
      }
    }

    return {
      subscriptionTier: isExpired ? 'starter' : 'pro',
      subscriptionExpiresAt: isExpired ? null : expiresAt.toISOString(),
      finalReferredBy: existingGrant.ref_code,
    };
  }

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
    // 14-day Pro trial (vs 7-day standard) for referral invitees
    const expires = new Date();
    expires.setDate(expires.getDate() + 14);
    bonus.subscriptionExpiresAt = expires.toISOString();

    const baseDate = mReferrer.subscription_expires_at
      ? new Date(mReferrer.subscription_expires_at)
      : new Date();
    const refStart = baseDate > new Date() ? baseDate : new Date();
    refStart.setDate(refStart.getDate() + 30);

    // M2M нагороди — awaited (не fire-and-forget), бо serverless вбиває lambda після відповіді.
    // Помилки логуються але НЕ кидаються — реєстрація не блокується.
    const [profileRes, allianceRes, referralRes, grantRes] = await Promise.all([
      admin.from('master_profiles').update({
        subscription_tier: 'pro',
        subscription_expires_at: refStart.toISOString(),
      }).eq('id', mReferrer.id),

      admin.from('master_alliances').insert({
        inviter_id: mReferrer.id,
        invitee_id: newMasterId,
      }),

      admin.from('master_referrals').insert({
        referrer_id: mReferrer.id,
        referee_id:  newMasterId,
        status:      'trial',
      }),

      admin.from('referral_grants').insert({
        referrer_id: mReferrer.id,
        referee_id:  newMasterId,
        ref_code:    refCode,
      }),
    ]);

    if (profileRes.error) console.error('[referrals] M2M referrer +30d failed:', profileRes.error.message);
    if (allianceRes.error && allianceRes.error.code !== '23505') console.error('[referrals] M2M alliance insert failed:', allianceRes.error.message);
    if (referralRes.error && referralRes.error.code !== '23505') console.error('[referrals] M2M master_referrals insert failed:', referralRes.error.message);
    if (grantRes.error && grantRes.error.code !== '23505') console.error('[referrals] M2M grant insert failed:', grantRes.error.message);
  } else if (cReferrer) {
    bonus.finalReferredBy = refCode;
    bonus.subscriptionTier = 'pro';
    const expires = new Date();
    expires.setDate(expires.getDate() + 30);
    bonus.subscriptionExpiresAt = expires.toISOString();

    // C2B нагороди клієнту — awaited (не fire-and-forget),
    // бо serverless може вбити lambda до завершення fire-and-forget.
    // Помилки логуються але НЕ кидаються — реєстрація не блокується.
    const [promoRes, incrRes, grantRes] = await Promise.all([
      admin.from('client_promocodes').insert({
        client_id: cReferrer.id,
        master_id: newMasterId,
        discount_percentage: 50,
      }),
      admin.rpc('increment_client_master_invite_count', { p_client_id: cReferrer.id }),
      admin.from('referral_grants').insert({
        referrer_id: cReferrer.id,
        referee_id:  newMasterId,
        ref_code:    refCode,
      }),
    ]);

    if (promoRes.error && promoRes.error.code !== '23505')
      console.error('[referrals] C2B client_promocodes failed:', promoRes.error.message);
    if ('error' in incrRes && incrRes.error)
      console.error('[referrals] C2B increment_client_master_invite_count failed:', (incrRes.error as { message: string }).message);
    if (grantRes.error && grantRes.error.code !== '23505')
      console.error('[referrals] C2B grant insert failed:', grantRes.error.message);
  }

  return bonus;
}

// ── checkC2cEligibility ───────────────────────────────────────────

export async function checkC2cEligibility(
  phone: string,
  masterId: string,
  referralCode: string,
): Promise<{ eligible: boolean; reason?: 'self_referral' | 'already_used' }> {
  const admin = createAdminClient();

  const { data: referrerProfile } = await admin
    .from('client_profiles')
    .select('id')
    .eq('referral_code', referralCode)
    .maybeSingle();

  if (!referrerProfile) return { eligible: false, reason: 'already_used' };

  // Self-referral check
  const { data: authProfile } = await admin
    .from('profiles')
    .select('phone')
    .eq('id', referrerProfile.id)
    .maybeSingle();

  const normalize = (ph: string) => String(ph ?? '').replace(/^\+/, '');
  if (authProfile?.phone && normalize(phone) === normalize(String(authProfile.phone))) {
    return { eligible: false, reason: 'self_referral' };
  }

  // Prior bookings check (phone-based)
  const { count: priorBookings } = await admin
    .from('bookings')
    .select('id', { count: 'exact', head: true })
    .eq('client_phone', phone)
    .eq('master_id', masterId)
    .neq('status', 'cancelled');

  if ((priorBookings ?? 0) > 0) return { eligible: false, reason: 'already_used' };

  // Existing referral check
  const { data: existingRefs } = await admin
    .from('c2c_referrals')
    .select('booking_id')
    .eq('referrer_id', referrerProfile.id)
    .eq('master_id', masterId)
    .not('booking_id', 'is', null);

  const refBookingIds = (existingRefs ?? [])
    .map((r: { booking_id: string | null }) => r.booking_id)
    .filter(Boolean) as string[];

  if (refBookingIds.length) {
    const { data: refBookings } = await admin
      .from('bookings')
      .select('id')
      .in('id', refBookingIds)
      .eq('client_phone', phone);
    if (refBookings?.length) return { eligible: false, reason: 'already_used' };
  }

  return { eligible: true };
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
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.id !== newMasterId) return { success: false, error: 'Unauthorized' };
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
    const newMasterBonus = new Date();
    newMasterBonus.setDate(newMasterBonus.getDate() + 30);

    await admin
      .from('master_profiles')
      .update({
        subscription_expires_at: newMasterBonus.toISOString(),
        subscription_tier: 'pro'
      })
      .eq('id', newMasterId);

    if (promoError) return { success: false, error: promoError.message };

    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

// ── checkAmbassadorStatus ──────────────────────────────────────────

/**
 * Перевіряє, чи є клієнт за номером телефону амбасадором для конкретного майстра.
 * Використовує admin client для обходу RLS (майстер не має доступу до чужих профілів).
 */
export async function checkAmbassadorStatus(
  phone: string,
  masterId: string
): Promise<{ isAmbassador: boolean }> {
  try {
    const admin = createAdminClient();
    const cleanPhone = phone.replace(/\D/g, '');

    // 1. Шукаємо профіль клієнта за телефоном
    const { data: prof } = await admin
      .from('profiles')
      .select('id')
      .or(`phone.eq.+${cleanPhone},phone.eq.${cleanPhone}`)
      .limit(1)
      .maybeSingle();

    if (!prof) return { isAmbassador: false };

    // 2. Перевіряємо наявність промокоду (C2B зв'язок)
    const { data: promo } = await admin
      .from('client_promocodes')
      .select('id')
      .eq('client_id', prof.id)
      .eq('master_id', masterId)
      .limit(1)
      .maybeSingle();

    return { isAmbassador: !!promo };
  } catch (e) {
    console.error('[referrals] checkAmbassadorStatus error:', e);
    return { isAmbassador: false };
  }
}

// ── getTopAmbassadors ─────────────────────────────────────────────

export interface AmbassadorData {
  id: string;
  name: string;
  completedCount: number;
  revenue: number;
  referrals: Array<{ name: string; date: string }>;
}

export interface TopAmbassadorsResult {
  totalReferrals: number;
  completedReferrals: number;
  totalRevenue: number;
  ambassadors: AmbassadorData[];
}

export async function getTopAmbassadors(
  masterId: string,
): Promise<{ success: true; data: TopAmbassadorsResult } | { success: false; error: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.id !== masterId) return { success: false, error: 'Unauthorized' };

  const admin = createAdminClient();

  const [refsRes, statsRes] = await Promise.all([
    admin
      .from('c2c_referrals')
      .select('referrer_id, referred_id, booking_id, created_at')
      .eq('master_id', masterId)
      .eq('status', 'completed')
      .order('created_at', { ascending: false }),
    supabase.rpc('get_c2c_stats_for_master', { p_master_id: masterId }),
  ]);

  if (refsRes.error) return { success: false, error: refsRes.error.message };

  const refs = refsRes.data ?? [];
  const stats = (statsRes.data as { total_referrals: number; completed_referrals: number } | null)
    ?? { total_referrals: 0, completed_referrals: 0 };

  const ambassadors: AmbassadorData[] = [];
  let totalRevenue = 0;

  if (refs.length > 0) {
    const clientIds = [...new Set([...refs.map(r => r.referrer_id), ...refs.map(r => r.referred_id)])];
    const bookingIds = refs.map(r => r.booking_id).filter(Boolean) as string[];

    const [clientsRes, bookingsRes] = await Promise.all([
      admin.from('client_profiles').select('id, full_name').in('id', clientIds),
      bookingIds.length
        ? admin.from('bookings').select('id, total_price').in('id', bookingIds)
        : null,
    ]);

    const clientNames = new Map((clientsRes.data ?? []).map(c => [c.id, c.full_name ?? 'Клієнт']));
    const bookingPrices = new Map(
      (bookingsRes?.data ?? []).map(b => [b.id, Number(b.total_price ?? 0)]),
    );

    const ambMap = new Map<string, AmbassadorData>();

    for (const ref of refs) {
      const d = new Date(ref.created_at);
      const date = `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}`;
      const price = ref.booking_id ? (bookingPrices.get(ref.booking_id) ?? 0) : 0;
      const referredName = clientNames.get(ref.referred_id) ?? 'Клієнт';

      if (!ambMap.has(ref.referrer_id)) {
        ambMap.set(ref.referrer_id, {
          id: ref.referrer_id,
          name: clientNames.get(ref.referrer_id) ?? 'Клієнт',
          completedCount: 0,
          revenue: 0,
          referrals: [],
        });
      }

      const amb = ambMap.get(ref.referrer_id)!;
      amb.completedCount++;
      amb.revenue += price;
      amb.referrals.push({ name: referredName, date });
      totalRevenue += price;
    }

    ambassadors.push(
      ...Array.from(ambMap.values())
        .sort((a, b) => b.completedCount - a.completedCount)
        .slice(0, 5),
    );
  }

  return {
    success: true,
    data: {
      totalReferrals: Number(stats.total_referrals ?? 0),
      completedReferrals: Number(stats.completed_referrals ?? 0),
      totalRevenue,
      ambassadors,
    },
  };
}
