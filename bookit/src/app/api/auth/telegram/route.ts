import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { validateTelegramData } from '@/lib/telegram/validation';
import { generateVirtualEmail } from '@/lib/utils/phone';

export async function POST(req: NextRequest) {
  try {
    const { initData, role } = await req.json();
    const debug = req.nextUrl.searchParams.get('debug') === '1';

    if (debug) {
      console.log('[api/auth/telegram] DEBUG: Received request, initData length:', initData?.length, 'role:', role);
    }

    if (!initData) {
      return NextResponse.json({ error: 'Missing initData' }, { status: 400 });
    }

    // 1. Validate Telegram data
    let tgUser;
    try {
      tgUser = validateTelegramData(initData);
      if (debug) console.log('[api/auth/telegram] DEBUG: Validation success for user ID:', tgUser.id);
    } catch (err: any) {
      console.error('[api/auth/telegram] Validation failed:', err.message);
      return NextResponse.json({ error: `Validation failed: ${err.message}` }, { status: 401 });
    }

    const admin = createAdminClient();

    // 1.5 Log role intent if provided (helps native requestContact flow)
    if (role) {
      await admin.from('telegram_webhook_logs').insert({
        event_type: 'role_intent',
        telegram_chat_id: Number(tgUser.id),
        status: 'success',
        request_data: { role },
      });
    }

    // 2. Search for profile with this telegram_chat_id
    const tgChatIdStr = tgUser.id.toString();
    if (debug) console.log('[api/auth/telegram] DEBUG: Searching for telegram_chat_id:', tgChatIdStr);

    const { data: profile, error: profileErr } = await admin
      .from('profiles')
      .select('id, phone, email, role, telegram_chat_id')
      .eq('telegram_chat_id', tgChatIdStr)
      .maybeSingle();

    if (profileErr) {
      console.error('[api/auth/telegram] Profile search error:', profileErr);
      return NextResponse.json({ error: 'Database error during profile search' }, { status: 500 });
    }

    // 3. If profile exists and has phone, log them in via magiclink
    if (profile?.phone) {
      if (debug) {
        console.log('[api/auth/telegram] DEBUG: Profile found! ID:', profile.id, 'Phone:', profile.phone);
      }
      const virtualEmail = profile.email || generateVirtualEmail(profile.phone);

      const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
        type: 'magiclink',
        email: virtualEmail,
      });

      if (linkError || !linkData?.properties?.email_otp) {
        console.error('[api/auth/telegram] generateLink error:', linkError);
        return NextResponse.json({ error: 'Login session generation failed' }, { status: 500 });
      }

      if (debug) console.log('[api/auth/telegram] DEBUG: Login token generated successfully');

      return NextResponse.json({
        success: true,
        email: virtualEmail,
        token: linkData.properties.email_otp,
        user: {
          id: profile.id,
          role: profile.role,
        },
      });
    }

    // 4. If profile exists but no phone yet, tell frontend to wait
    if (profile) {
      if (debug) {
        console.log('[api/auth/telegram] DEBUG: Profile exists but no phone yet. telegram_chat_id:', profile.telegram_chat_id);
      }
      return NextResponse.json({
        success: false,
        status: 'WAITING_FOR_PHONE',
        message: 'Profile exists but waiting for phone confirmation',
      });
    }

    if (debug) console.log('[api/auth/telegram] DEBUG: No linked profile found, returning NEED_PHONE');

    // 5. If no profile found, tell frontend to request phone number
    return NextResponse.json({
      success: false,
      status: 'NEED_PHONE',
      tgUser: {
        id: tgUser.id,
        first_name: tgUser.first_name,
        last_name: tgUser.last_name,
        username: tgUser.username,
      },
    });
  } catch (err: any) {
    console.error('[api/auth/telegram] Fatal error:', err);
    return NextResponse.json({ error: `Internal server error: ${err.message}` }, { status: 500 });
  }
}
