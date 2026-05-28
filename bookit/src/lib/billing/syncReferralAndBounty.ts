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

  // Step 1: Mark as active — must commit before counting active refs below.
  await admin.from('master_referrals')
    .update({ status: 'active', updated_at: now })
    .eq('referee_id', masterId);

  // Step 2: First-payment bounty (idempotent via is_first_payment_made flag).
  if (!ref.is_first_payment_made) {
    await Promise.all([
      admin.from('master_referrals')
        .update({ is_first_payment_made: true })
        .eq('referee_id', masterId),
      admin.rpc('increment_discount_reserve', { p_master_id: ref.referrer_id, p_amount: 0.10 }),
    ]);
  }

  // Step 3: Count active refs AFTER step 1 committed → accurate count for lifetime tier.
  const { count } = await admin
    .from('master_referrals')
    .select('id', { count: 'exact', head: true })
    .eq('referrer_id', ref.referrer_id)
    .eq('status', 'active');

  const newDiscount = computeLifetimeDiscount(count ?? 0);

  // Checkpoint: only increase lifetime_discount, never decrease.
  await admin.from('master_profiles')
    .update({ lifetime_discount: newDiscount })
    .eq('id', ref.referrer_id)
    .lt('lifetime_discount', newDiscount);
}
