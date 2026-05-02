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

    const virtualEmail = generateVirtualEmail(e164Phone); // e.g. 380967953488@bookit.app
    const tgChatId = tgUser.id.toString();
    const admin = createAdminClient();
    const fullName =
      tgUser.first_name + (tgUser.last_name ? ` ${tgUser.last_name}` : '');

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
      // New or drifted identity — create auth user if needed, otherwise recover by email.
      console.log('[link-phone] Creating or recovering auth user...');
      const { data: createdUser, error: createError } = await admin.auth.admin.createUser({
        email: virtualEmail,
        password: crypto.randomUUID(),
        email_confirm: true,
        user_metadata: { phone: e164Phone, role: 'client' },
      });

      if (createError && createError.status !== 422) {
        console.error('[link-phone] createUser error:', createError.message);
        return NextResponse.json(
          { error: `Failed to create user: ${createError.message}` },
          { status: 500 },
        );
      }

      userId = createdUser?.user?.id ?? '';

      if (!userId) {
        const { data: rpcId, error: rpcError } = await admin.rpc('get_user_id_by_email', {
          p_email: virtualEmail,
        });

        if (rpcError) {
          console.error('[link-phone] get_user_id_by_email error:', rpcError.message);
          return NextResponse.json({ error: 'Failed to resolve existing user' }, { status: 500 });
        }

        if (typeof rpcId !== 'string' || !rpcId) {
          console.error('[link-phone] Could not resolve user ID for email:', virtualEmail);
          return NextResponse.json({ error: 'Failed to resolve existing user' }, { status: 500 });
        }

        userId = rpcId;
        console.log('[link-phone] Recovered existing auth user:', userId);
      } else {
        console.log('[link-phone] Created auth user:', userId);
      }

      const { error: profileUpsertError } = await admin.from('profiles').upsert(
        {
          id: userId,
          phone: e164Phone,
          email: virtualEmail,
          telegram_chat_id: tgChatId,
          full_name: fullName || `User ${e164Phone.slice(-4)}`,
          role: 'client',
        },
        { onConflict: 'id', ignoreDuplicates: false },
      );

      if (profileUpsertError) {
        console.error('[link-phone] Profile upsert error:', profileUpsertError.message);
        return NextResponse.json({ error: 'Failed to create profile' }, { status: 500 });
      }

      const { error: clientProfileError } = await admin.from('client_profiles').upsert(
        { id: userId },
        { onConflict: 'id', ignoreDuplicates: true },
      );

      if (clientProfileError) {
        console.error('[link-phone] client_profiles upsert error:', clientProfileError.message);
        return NextResponse.json({ error: 'Failed to initialize client profile' }, { status: 500 });
      }

      console.log('[link-phone] Profile identity synced');
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
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown server error';
    console.error('[link-phone] Fatal error:', message);
    return NextResponse.json({ error: `Server error: ${message}` }, { status: 500 });
  }
}
