import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

/**
 * Vercel Cron: 1-го числа кожного місяця о 00:05 UTC
 * 1. Downgrade до 'starter' якщо subscription_expires_at < now
 * 2. Очищення старих IP-логів (sms_ip_logs > 25h)
 *
 * NOTE: Ліміт 30 записів/місяць більше НЕ залежить від bookings_this_month.
 * Він розраховується динамічно з таблиці bookings (gte created_at = початок місяця).
 */
export async function GET(req: NextRequest): Promise<NextResponse> {
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
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
