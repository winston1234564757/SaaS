import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

/**
 * Saves a Web Push subscription for the current user.
 * The subscription is stored in push_subscriptions table.
 * DELETE removes the subscription.
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let subscription: PushSubscription;
  try {
    subscription = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
  }

  const admin = createAdminClient();
  const endpoint = (subscription as any).endpoint as string;

  await admin.from('push_subscriptions').upsert(
    { user_id: user.id, endpoint, subscription: JSON.stringify(subscription) },
    { onConflict: 'endpoint' }
  );

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest): Promise<NextResponse> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body: any;
  try { body = await req.json(); } catch { body = {}; }

  const admin = createAdminClient();
  if (body.endpoint) {
    await admin.from('push_subscriptions').delete().eq('endpoint', body.endpoint).eq('user_id', user.id);
  } else {
    await admin.from('push_subscriptions').delete().eq('user_id', user.id);
  }

  return NextResponse.json({ ok: true });
}
