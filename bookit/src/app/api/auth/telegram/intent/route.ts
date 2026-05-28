import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { validateTelegramData } from '@/lib/telegram/validation';

// One-shot endpoint: client calls this BEFORE tg.requestContact() so that the
// bot webhook (which receives the contact moments later) knows whether the user
// chose 'master' or 'client'. Single insert per session — not on every poll.
export async function POST(req: NextRequest) {
  try {
    const { initData, role } = (await req.json()) as { initData?: string; role?: 'client' | 'master' };

    if (!initData || (role !== 'client' && role !== 'master')) {
      return NextResponse.json({ ok: false, error: 'Missing initData or role' }, { status: 400 });
    }

    const tgUser = validateTelegramData(initData);
    const admin = createAdminClient();

    // Dedup: skip insert if same role logged for this chat in last 5 minutes.
    const fiveMinAgo = new Date(Date.now() - 5 * 60_000).toISOString();
    const { data: recent } = await admin
      .from('telegram_webhook_logs')
      .select('id, request_data')
      .eq('telegram_chat_id', tgUser.id)
      .eq('event_type', 'role_intent')
      .gte('created_at', fiveMinAgo)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    const recentRole = (recent?.request_data as { role?: string } | null)?.role;
    if (recent && recentRole === role) {
      return NextResponse.json({ ok: true, deduped: true });
    }

    await admin.from('telegram_webhook_logs').insert({
      event_type: 'role_intent',
      telegram_chat_id: Number(tgUser.id),
      status: 'success',
      request_data: { role },
    });

    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[telegram/intent] error:', message);
    // Soft-fail: never block UX over diagnostics
    return NextResponse.json({ ok: false, error: message }, { status: 200 });
  }
}
