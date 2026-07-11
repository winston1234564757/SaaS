import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { MyLoyaltyPage } from '@/components/client/MyLoyaltyPage';
import { getOrGenerateProfileReferralCode } from '@/lib/actions/referrals';

export const metadata = { title: 'Лояльність — Bookit' };

export default async function LoyaltyRoute() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // 1. Get client's relations with masters (for loyalty)
  const { data: relations } = await supabase
    .from('client_master_relations')
    .select('master_id, total_visits, loyalty_points')
    .eq('client_id', user!.id);

  const masterIds = (relations ?? []).map((r: any) => r.master_id as string);

  // 2. Get active loyalty programs for those masters
  let programs: any[] = [];
  if (masterIds.length > 0) {
    const { data } = await supabase
      .from('loyalty_programs')
      .select(`
        id, name, target_visits, reward_type, reward_value, is_active,
        master_profiles!inner (
          id, slug, avatar_emoji,
          profiles!inner ( full_name, avatar_url )
        )
      `)
      .in('master_id', masterIds)
      .eq('is_active', true);
    programs = data ?? [];
  }

  // 3. Combine programs with client's visit data
  const items = programs.map((p: any) => {
    const rel = (relations ?? []).find((r: any) => r.master_id === p.master_profiles?.id);
    const visits = (rel?.total_visits as number) ?? 0;
    const mp = p.master_profiles;
    // Handle potential array from profiles join
    const profile = Array.isArray(mp?.profiles) ? mp.profiles[0] : mp?.profiles;

    return {
      id: p.id as string,
      name: p.name as string,
      targetVisits: p.target_visits as number,
      rewardType: p.reward_type as string,
      rewardValue: Number(p.reward_value ?? 0),
      currentVisits: visits,
      masterId: mp?.id as string,
      masterSlug: mp?.slug as string,
      masterName: profile?.full_name as string ?? 'Майстер',
      masterEmoji: (mp?.avatar_emoji as string) ?? '💅',
      masterAvatarUrl: (profile?.avatar_url as string) ?? null,
    };
  });

  // 4. Get/Generate client's referral data
  const [c2cCodeRes, c2bCodeRes, clientProfileRes] = await Promise.all([
    getOrGenerateProfileReferralCode(user!.id, 'client-c2c'),
    getOrGenerateProfileReferralCode(user!.id, 'client-c2b'),
    supabase.from('client_profiles').select('total_masters_invited').eq('id', user!.id).single(),
  ]);
  const c2cCode = c2cCodeRes.code || '';
  const c2bCode = c2bCodeRes.code || '';

  // 5. Promocodes + C2C referrals + spent C2C bonuses — незалежні запити, один round-trip.
  //    c2c_bonus_uses замінює N викликів get_c2c_balance (по одному на кожного майстра):
  //    RLS "c2c_bonus_uses: owner select" пропускає referrer_id = auth.uid().
  const [{ data: promocodes }, { data: c2cRows }, { data: bonusUses }] = await Promise.all([
    supabase
      .from('client_promocodes')
      .select(`
        id, discount_percentage, is_used, created_at,
        master_profiles (
          id, slug, avatar_emoji,
          profiles ( full_name, avatar_url )
        )
      `)
      .eq('client_id', user!.id)
      .order('created_at', { ascending: false }),
    supabase
      .from('c2c_referrals')
      .select(`
        id, status, discount_pct,
        master_profiles (
          id, slug, avatar_emoji, c2c_discount_pct,
          profiles ( full_name, avatar_url )
        )
      `)
      .eq('referrer_id', user!.id)
      .order('created_at', { ascending: false }),
    supabase
      .from('c2c_bonus_uses')
      .select('master_id, discount_used')
      .eq('referrer_id', user!.id),
  ]);

  // Map promocodes for UI
  const promoItems = (promocodes ?? []).map((pc: any) => {
    const mp = Array.isArray(pc.master_profiles) ? pc.master_profiles[0] : pc.master_profiles;
    const profile = Array.isArray(mp?.profiles) ? mp.profiles[0] : mp?.profiles;
    return {
      id: pc.id,
      discount: pc.discount_percentage,
      isUsed: pc.is_used,
      masterName: profile?.full_name || 'Майстер',
      masterSlug: mp?.slug,
      masterEmoji: mp?.avatar_emoji || '💅',
      masterAvatarUrl: profile?.avatar_url || null,
      createdAt: pc.created_at,
    };
  });

  // 6. Build per-master C2C stats (+ earned bonus — SUM(discount_pct) по завершених рефералах)
  const c2cByMaster = new Map<string, {
    masterId: string; masterSlug: string; masterName: string; masterEmoji: string; masterAvatarUrl: string | null;
    c2cDiscountPct: number; invited: number; completed: number; earnedPct: number;
  }>();

  for (const row of (c2cRows ?? []) as any[]) {
    const mp = Array.isArray(row.master_profiles) ? row.master_profiles[0] : row.master_profiles;
    if (!mp) continue;
    const profile = Array.isArray(mp.profiles) ? mp.profiles[0] : mp.profiles;
    const existing = c2cByMaster.get(mp.id) ?? {
      masterId: mp.id, masterSlug: mp.slug, masterName: profile?.full_name || 'Майстер',
      masterEmoji: mp.avatar_emoji || '💅', masterAvatarUrl: profile?.avatar_url || null, c2cDiscountPct: mp.c2c_discount_pct ?? 10,
      invited: 0, completed: 0, earnedPct: 0,
    };
    existing.invited += 1;
    if (row.status === 'completed') {
      existing.completed += 1;
      existing.earnedPct += Number(row.discount_pct ?? 0);
    }
    c2cByMaster.set(mp.id, existing);
  }

  // Витрачені бонуси по майстрах
  const usedByMaster = new Map<string, number>();
  for (const u of (bonusUses ?? []) as { master_id: string; discount_used: number | null }[]) {
    usedByMaster.set(u.master_id, (usedByMaster.get(u.master_id) ?? 0) + Number(u.discount_used ?? 0));
  }

  // Баланс — та сама формула, що в get_c2c_balance: GREATEST(0, earned − used)
  const c2cMasters = Array.from(c2cByMaster.values()).map((m) => ({
    ...m,
    balance: Math.max(0, m.earnedPct - (usedByMaster.get(m.masterId) ?? 0)),
    shareLink: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://bookit.com.ua'}/${m.masterSlug}?ref=${c2cCode}`,
  }));

  return (
    <MyLoyaltyPage
      programs={items}
      c2cCode={c2cCode}
      c2bCode={c2bCode}
      totalMastersInvited={clientProfileRes.data?.total_masters_invited || 0}
      promocodes={promoItems}
      c2cMasters={c2cMasters}
    />
  );
}
