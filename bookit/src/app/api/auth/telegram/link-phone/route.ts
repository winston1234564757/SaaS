import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { ensureTelegramClientIdentity } from '@/lib/telegram/ensureTelegramClientIdentity';
import { validateTelegramData } from '@/lib/telegram/validation';
import { generateVirtualEmail, normalizeToE164 } from '@/lib/utils/phone';

export async function POST(req: NextRequest) {
  try {
    const { initData, phone, role } = await req.json();
    console.log('[link-phone] Received: phone=', phone, 'role=', role);

    if (!initData || !phone) {
      return NextResponse.json({ error: 'Missing data' }, { status: 400 });
    }

    // 1. Validate Telegram data
    let tgUser;
    try {
      tgUser = validateTelegramData(initData);
      console.log('[link-phone] TG user:', tgUser.id);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Invalid Telegram authentication data';
      console.error('[link-phone] TG validation failed:', message);
      return NextResponse.json({ error: `Validation failed: ${message}` }, { status: 401 });
    }

    // 2. Normalize phone to E.164 (same as SMS OTP flow: 380XXXXXXXXX)
    const e164Phone = normalizeToE164(phone);
    if (!e164Phone) {
      console.error('[link-phone] Could not normalize phone:', phone);
      return NextResponse.json({ error: 'Invalid phone number format' }, { status: 400 });
    }

    const tgChatId = tgUser.id.toString();
    const admin = createAdminClient();
    const fullName =
      tgUser.first_name + (tgUser.last_name ? ` ${tgUser.last_name}` : '');
    const virtualEmail = generateVirtualEmail(e164Phone);

    console.log('[link-phone] e164=', e164Phone, 'email=', virtualEmail, 'tgChatId=', tgChatId);

    let userId: string;
    let resolvedRole: 'client' | 'master';

    try {
      const identity = await ensureTelegramClientIdentity({
        phone: e164Phone,
        telegramChatId: tgChatId,
        fullName: fullName || undefined,
        role: (role === 'master' ? 'master' : 'client'),
      });

      userId = identity.userId;
      resolvedRole = identity.role;
      console.log('[link-phone] Identity synced:', { userId, status: identity.status, role: resolvedRole });
    } catch (identityError: unknown) {
      const message =
        identityError instanceof Error ? identityError.message : 'Failed to sync identity';
      console.error('[link-phone] Identity sync error:', message);
      return NextResponse.json({ error: message }, { status: 500 });
    }

    // 4. Generate magiclink token for auto-login
    const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
      type: 'magiclink',
      email: virtualEmail,
    });

    if (linkError || !linkData?.properties?.email_otp) {
      console.error('[link-phone] generateLink error:', linkError?.message);
      return NextResponse.json({ error: 'Failed to generate login token' }, { status: 500 });
    }

    console.log('[link-phone] ✅ Success for userId:', userId, 'role:', resolvedRole);

    return NextResponse.json({
      success: true,
      email: virtualEmail,
      token: linkData.properties.email_otp,
      role: resolvedRole,
      user: { id: userId, role: resolvedRole },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown server error';
    console.error('[link-phone] Fatal error:', message);
    return NextResponse.json({ error: `Server error: ${message}` }, { status: 500 });
  }
}
