import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

/**
 * Cron job: downgrade expired Pro/Studio subscriptions back to Starter.
 * Called daily (e.g. 02:00 UTC) via Supabase pg_cron or external scheduler.
 *
 * Security: requires CRON_SECRET header.
 */
export async function GET(req: NextRequest) {
  const secret = req.headers.get('x-cron-secret');
  if (!secret || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const admin = createAdminClient();

  const { data, error } = await admin
    .from('master_profiles')
    .update({ subscription_tier: 'starter' })
    .lt('subscription_expires_at', new Date().toISOString())
    .neq('subscription_tier', 'starter')
    .select('id');

  if (error) {
    console.error('[expire-subscriptions] Supabase error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const count = data?.length ?? 0;
  console.log(`[expire-subscriptions] Downgraded ${count} subscriptions.`);

  return NextResponse.json({ ok: true, downgraded: count });
}
