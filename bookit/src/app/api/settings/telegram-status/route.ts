import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { NextResponse } from 'next/server';

export async function GET() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const admin = createAdminClient();
  const { data } = await admin
    .from('master_profiles')
    .select('telegram_chat_id')
    .eq('id', user.id)
    .maybeSingle();

  return NextResponse.json({
    connected: !!data?.telegram_chat_id,
    chatId: data?.telegram_chat_id ?? null,
  });
}
