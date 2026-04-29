import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendPush } from '@/lib/push';

const WELCOME: Record<string, { title: string; body: string; url: string }> = {
  master: {
    title: '🔔 Сповіщення увімкнено',
    body: 'Нові записи, підтвердження та флеш-акції — все миттєво у тебе в руках',
    url: '/dashboard',
  },
  client: {
    title: '🔔 Сповіщення підключені',
    body: 'Ти завжди будеш в курсі: нагадування про записи та спецпропозиції від улюблених майстрів',
    url: '/my/bookings',
  },
};

export async function POST(req: NextRequest): Promise<NextResponse> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
  }

  const { role, ...subscriptionData } = body as { role?: string; endpoint: string; keys: { p256dh: string; auth: string }; [k: string]: unknown };
  const endpoint = subscriptionData.endpoint as string;

  const admin = createAdminClient();
  await admin.from('push_subscriptions').upsert(
    { user_id: user.id, endpoint, subscription: subscriptionData },
    { onConflict: 'endpoint' }
  );

  const resolvedRole = role === 'client' ? 'client' : 'master';
  const welcome = WELCOME[resolvedRole];
  const subForPush = subscriptionData as { endpoint: string; keys: { p256dh: string; auth: string } };

  console.log('[Push] Sending welcome push — role:', resolvedRole, 'user:', user.id, 'endpoint:', endpoint?.slice(0, 60));
  const pushResult = await sendPush(subForPush, welcome);
  console.log('[Push] Welcome push result:', pushResult);

  return NextResponse.json({ ok: true, push_sent: pushResult.ok });
}

export async function DELETE(req: NextRequest): Promise<NextResponse> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body: { endpoint?: string } = {};
  try { body = await req.json(); } catch { /* empty body ok */ }

  const admin = createAdminClient();
  if (body.endpoint) {
    await admin.from('push_subscriptions').delete().eq('endpoint', body.endpoint).eq('user_id', user.id);
  } else {
    await admin.from('push_subscriptions').delete().eq('user_id', user.id);
  }

  return NextResponse.json({ ok: true });
}
