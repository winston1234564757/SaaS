import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { validateTelegramData } from '@/lib/telegram/validation';
import { generateVirtualEmail, normalizeToE164 } from '@/lib/utils/phone';

export async function POST(req: NextRequest) {
  try {
    const { initData, phone } = await req.json();
    console.log('[link-phone] Received: phone=', phone);

    if (!initData || !phone) {
      return NextResponse.json({ error: 'Missing data' }, { status: 400 });
    }

    // 1. Validate Telegram data
    let tgUser;
    try {
      tgUser = validateTelegramData(initData);
      console.log('[link-phone] TG user:', tgUser.id);
    } catch (err: any) {
      console.error('[link-phone] TG validation failed:', err.message);
      return NextResponse.json({ error: `Validation failed: ${err.message}` }, { status: 401 });
    }

    // 2. Normalize phone to E.164 (same as SMS OTP flow: 380XXXXXXXXX)
    const e164Phone = normalizeToE164(phone);
    if (!e164Phone) {
      console.error('[link-phone] Could not normalize phone:', phone);
      return NextResponse.json({ error: 'Invalid phone number format' }, { status: 400 });
    }

    const virtualEmail = generateVirtualEmail(e164Phone); // e.g. 380967953488@bookit.app
    const tgChatId = tgUser.id.toString();
    const admin = createAdminClient();

    console.log('[link-phone] e164=', e164Phone, 'email=', virtualEmail, 'tgChatId=', tgChatId);

    // 3. Check if profile already exists by phone (E.164) or email
    const { data: existingByPhone } = await admin
      .from('profiles')
      .select('id, email')
      .eq('phone', e164Phone)
      .maybeSingle();

    const { data: existingByEmail } = existingByPhone
      ? { data: null }
      : await admin.from('profiles').select('id').eq('email', virtualEmail).maybeSingle();

    const existingProfile = existingByPhone ?? existingByEmail;

    let userId: string;

    if (existingProfile?.id) {
      // Existing user — just link telegram_chat_id
      userId = existingProfile.id;
      console.log('[link-phone] Found existing profile:', userId);

      const { error: linkErr } = await admin
        .from('profiles')
        .update({ telegram_chat_id: tgChatId })
        .eq('id', userId);

      if (linkErr) {
        console.error('[link-phone] Failed to link telegram_chat_id:', linkErr.message);
        return NextResponse.json({ error: 'Failed to link Telegram' }, { status: 500 });
      }
    } else {
      // New user — create auth user + profile
      console.log('[link-phone] Creating new auth user...');
      const { data: createdUser, error: createError } = await admin.auth.admin.createUser({
        email: virtualEmail,
        password: crypto.randomUUID(),
        email_confirm: true,
        user_metadata: { phone: e164Phone, role: 'client' },
      });

      if (createError) {
        console.error('[link-phone] createUser error (status may be 422):', createError.message);
        return NextResponse.json(
          { error: `Failed to create user: ${createError.message}` },
          { status: 500 },
        );
      }

      if (!createdUser?.user?.id) {
        return NextResponse.json({ error: 'No user ID returned' }, { status: 500 });
      }

      userId = createdUser.user.id;
      console.log('[link-phone] Created auth user:', userId);

      const fullName =
        tgUser.first_name + (tgUser.last_name ? ` ${tgUser.last_name}` : '');

      const { error: insertErr } = await admin.from('profiles').insert({
        id: userId,
        phone: e164Phone,
        email: virtualEmail,
        telegram_chat_id: tgChatId,
        full_name: fullName || 'User',
        role: 'client',
      });

      if (insertErr) {
        console.error('[link-phone] Profile insert error:', insertErr.message);
        return NextResponse.json({ error: 'Failed to create profile' }, { status: 500 });
      }

      console.log('[link-phone] Profile created');
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

    console.log('[link-phone] ✅ Success for userId:', userId);

    return NextResponse.json({
      success: true,
      email: virtualEmail,
      token: linkData.properties.email_otp,
    });
  } catch (err: any) {
    console.error('[link-phone] Fatal error:', err.message);
    return NextResponse.json({ error: `Server error: ${err.message}` }, { status: 500 });
  }
}
