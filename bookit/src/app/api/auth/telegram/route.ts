import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { validateTelegramData } from '@/lib/telegram/validation';
import { generateVirtualEmail } from '@/lib/utils/phone';

type TmaAuthSuccess = {
  success: true;
  email: string;
  token: string;
  user: { id: string; role: 'client' | 'master' | string };
};

type TmaAuthPending = {
  success: false;
  status: 'NEED_PHONE' | 'WAITING_FOR_PHONE';
  message?: string;
  tgUser?: {
    id: number;
    first_name?: string;
    last_name?: string;
    username?: string;
  };
};

type TmaAuthError = { error: string };

export async function POST(req: NextRequest) {
  try {
    const { initData } = (await req.json()) as { initData?: string; role?: string };
    const debug = req.nextUrl.searchParams.get('debug') === '1';

    if (!initData) {
      return NextResponse.json<TmaAuthError>({ error: 'Missing initData' }, { status: 400 });
    }

    // 1. Validate Telegram HMAC signature
    let tgUser: { id: number; first_name?: string; last_name?: string; username?: string };
    try {
      tgUser = validateTelegramData(initData);
      if (debug) console.log('[api/auth/telegram] Validated TG user ID:', tgUser.id);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Invalid Telegram data';
      console.error('[api/auth/telegram] Validation failed:', message);
      return NextResponse.json<TmaAuthError>({ error: `Validation failed: ${message}` }, { status: 401 });
    }

    const admin = createAdminClient();
    const tgChatIdStr = tgUser.id.toString();

    // 2. Lookup profile by telegram_chat_id
    const { data: profile, error: profileErr } = await admin
      .from('profiles')
      .select('id, phone, email, role, telegram_chat_id')
      .eq('telegram_chat_id', tgChatIdStr)
      .maybeSingle();

    if (profileErr) {
      console.error('[api/auth/telegram] Profile search error:', profileErr.message);
      return NextResponse.json<TmaAuthError>({ error: 'Database error during profile search' }, { status: 500 });
    }

    // 3. Profile linked + has phone → issue magiclink
    if (profile?.phone) {
      const virtualEmail = profile.email || generateVirtualEmail(profile.phone);

      const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
        type: 'magiclink',
        email: virtualEmail,
      });

      if (linkError || !linkData?.properties?.email_otp) {
        console.error('[api/auth/telegram] generateLink error:', linkError?.message);
        return NextResponse.json<TmaAuthError>({ error: 'Login session generation failed' }, { status: 500 });
      }

      return NextResponse.json<TmaAuthSuccess>({
        success: true,
        email: virtualEmail,
        token: linkData.properties.email_otp,
        user: { id: profile.id, role: profile.role ?? 'client' },
      });
    }

    // 4. Profile exists but waiting for phone (contact webhook hasn't fired yet)
    if (profile) {
      return NextResponse.json<TmaAuthPending>({
        success: false,
        status: 'WAITING_FOR_PHONE',
        message: 'Profile exists, awaiting phone confirmation',
      });
    }

    // 5. No profile at all → frontend must request phone
    return NextResponse.json<TmaAuthPending>({
      success: false,
      status: 'NEED_PHONE',
      tgUser: {
        id: tgUser.id,
        first_name: tgUser.first_name,
        last_name: tgUser.last_name,
        username: tgUser.username,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown server error';
    console.error('[api/auth/telegram] Fatal error:', message);
    return NextResponse.json<TmaAuthError>({ error: `Internal server error: ${message}` }, { status: 500 });
  }
}
