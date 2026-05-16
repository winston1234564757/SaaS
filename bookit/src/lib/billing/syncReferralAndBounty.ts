import { createAdminClient } from '@/lib/supabase/admin';
import { computeLifetimeDiscount } from '@/lib/billing/pricing';

export async function syncReferralAndBounty(masterId: string): Promise<void> {
  const admin = createAdminClient();

  const { data: ref } = await admin
    .from('master_referrals')
    .select('referrer_id, is_first_payment_made')
    .eq('referee_id', masterId)
    .maybeSingle();

  if (!ref) return;

  const now = new Date().toISOString();
  const updates: PromiseLike<unknown>[] = [
    admin.from('master_referrals')
      .update({ status: 'active', updated_at: now })
      .eq('referee_id', masterId),
  ];

  if (!ref.is_first_payment_made) {
    updates.push(
      admin.from('master_referrals')
        .update({ is_first_payment_made: true })
        .eq('referee_id', masterId),
      admin.rpc('increment_discount_reserve', { p_master_id: ref.referrer_id, p_amount: 0.10 }),
    );
  }

  const { count } = await admin
    .from('master_referrals')
    .select('id', { count: 'exact', head: true })
    .eq('referrer_id', ref.referrer_id)
    .eq('status', 'active');

  updates.push(
    admin.from('master_profiles')
      .update({ lifetime_discount: computeLifetimeDiscount(count ?? 0) })
      .eq('id', ref.referrer_id),
  );

  await Promise.all(updates);
}
