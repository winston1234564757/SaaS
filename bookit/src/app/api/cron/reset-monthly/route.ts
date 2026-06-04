import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { notifyMasterBilling } from '@/lib/notifications';
import { verifyCronSecret } from '@/lib/utils/verifyCronSecret';

/**
 * Vercel Cron: 1-го числа кожного місяця о 00:05 UTC
 * 1. Downgrade до 'starter' якщо subscription_expires_at < now
 * 2. Очищення старих IP-логів (sms_ip_logs > 25h)
 *
 * NOTE: Ліміт 40 записів/місяць більше НЕ залежить від bookings_this_month.
 * Він розраховується динамічно з таблиці bookings (gte created_at = початок місяця).
 */
export async function GET(req: NextRequest): Promise<NextResponse> {
  const authHeader = req.headers.get('authorization');
  if (!verifyCronSecret(authHeader)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const admin = createAdminClient();
  const now = new Date().toISOString();

  // 1. Downgrade прострочених підписок
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
      .update({ subscription_tier: 'starter' })
      .in('id', expired.map(r => r.id));
    downgraded = expired.length;

    // Notify each downgraded master (fire-and-forget)
    for (const { id } of expired) {
      void notifyMasterBilling(id, 'subscription_downgraded');
    }
  }

  // Expiring warning: subscriptions that expire in 2–4 days
  const in2days = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString();
  const in4days = new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString();
  const { data: expiring } = await admin
    .from('master_profiles')
    .select('id, subscription_expires_at, subscription_tier')
    .in('subscription_tier', ['pro', 'studio'])
    .gte('subscription_expires_at', in2days)
    .lte('subscription_expires_at', in4days);

  for (const m of expiring ?? []) {
    const formatted = new Date(m.subscription_expires_at as string).toLocaleDateString('uk-UA', { day: 'numeric', month: 'long' });
    void notifyMasterBilling(m.id as string, 'subscription_expiring', undefined, formatted);
  }

  // 2. Прибираємо старі IP-логи (старіші 25 годин — гарантовано поза вікном rate-limit)
  const cutoff = new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString();
  await admin.from('sms_ip_logs').delete().lt('created_at', cutoff);

  console.log(`[cron/reset-monthly] downgraded=${downgraded}`);

  return NextResponse.json({
    ok: true,
    expiredError: expiredError?.message ?? null,
    downgraded,
  });
}
