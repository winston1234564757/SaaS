import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

/**
 * Vercel Cron: 1-го числа кожного місяця о 00:05 UTC
 * 1. Скидає bookings_this_month = 0 для всіх майстрів
 * 2. Downgrade до 'starter' якщо subscription_expires_at < now
 */
export async function GET(req: NextRequest): Promise<NextResponse> {
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const admin = createAdminClient();
  const now = new Date().toISOString();

  // 1. Скидаємо лічильник записів для Starter майстрів
  const { error: resetError } = await admin
    .from('master_profiles')
    .update({ bookings_this_month: 0 })
    .eq('subscription_tier', 'starter');

  // 2. Downgrade прострочених підписок
  const { data: expired, error: expiredError } = await admin
    .from('master_profiles')
    .select('id')
    .in('subscription_tier', ['pro', 'studio'])
    .lt('subscription_expires_at', now)
    .not('subscription_expires_at', 'is', null);

  let downgraded = 0;
  if (expired && expired.length > 0) {
    await admin
      .from('master_profiles')
      .update({ subscription_tier: 'starter', bookings_this_month: 0 })
      .in('id', expired.map(r => r.id));
    downgraded = expired.length;
  }

  console.log(`[cron/reset-monthly] reset=${!resetError} downgraded=${downgraded}`);

  return NextResponse.json({
    ok: true,
    resetError: resetError?.message ?? null,
    expiredError: expiredError?.message ?? null,
    downgraded,
  });
}
