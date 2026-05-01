import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { validateTelegramData } from '@/lib/telegram/validation';
import { generateVirtualEmail } from '@/lib/utils/phone';

export async function POST(req: NextRequest) {
  try {
    const { initData, phone } = await req.json();
    console.log('[link-phone] Received request: phone length=', phone?.length);

    if (!initData || !phone) {
      console.error('[link-phone] Missing initData or phone');
      return NextResponse.json({ error: 'Missing data' }, { status: 400 });
    }

    // 1. Validate Telegram data
    let tgUser;
    try {
      tgUser = validateTelegramData(initData);
      console.log('[link-phone] TG validation OK for user:', tgUser.id);
    } catch (err: any) {
      console.error('[link-phone] TG validation failed:', err.message);
      return NextResponse.json({ error: `Validation failed: ${err.message}` }, { status: 401 });
    }

    const cleanPhone = phone.replace(/\D/g, '');
    const virtualEmail = generateVirtualEmail(cleanPhone);
    const admin = createAdminClient();

    console.log('[link-phone] Phone:', cleanPhone, 'Email:', virtualEmail);

    // 2. Try to create auth user (idempotent)
    const { data: createdUser, error: createError } = await admin.auth.admin.createUser({
      email: virtualEmail,
      password: crypto.randomUUID(),
      email_confirm: true,
      user_metadata: { phone: cleanPhone, role: 'client' },
    });

    let userId: string;

    if (createError) {
      console.log('[link-phone] Create user error:', createError.message);

      // User already exists - try to find their ID
      if (createError.message.includes('already exists')) {
        const { data: existingProfile, error: findErr } = await admin
          .from('profiles')
          .select('id')
          .eq('email', virtualEmail)
          .maybeSingle();

        if (findErr) {
          console.error('[link-phone] Error finding existing profile:', findErr.message);
          return NextResponse.json({ error: 'Database error' }, { status: 500 });
        }

        if (existingProfile?.id) {
          userId = existingProfile.id;
          console.log('[link-phone] Found existing user:', userId);
        } else {
          // Profile doesn't exist but auth user does - this shouldn't happen
          console.error('[link-phone] Auth user exists but profile does not');
          return NextResponse.json({ error: 'User state error' }, { status: 500 });
        }
      } else {
        console.error('[link-phone] Unexpected create error:', createError.message);
        return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
      }
    } else if (createdUser?.user?.id) {
      userId = createdUser.user.id;
      console.log('[link-phone] Created new user:', userId);
    } else {
      console.error('[link-phone] Unexpected response: no user ID');
      return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
    }

    // 3. Upsert profile with telegram data
    console.log('[link-phone] Upserting profile:', userId);
    const { error: upsertError } = await admin.from('profiles').upsert({
      id: userId,
      phone: cleanPhone,
      email: virtualEmail,
      telegram_chat_id: tgUser.id.toString(),
      full_name: tgUser.first_name + (tgUser.last_name ? ` ${tgUser.last_name}` : ''),
      role: 'client',
    });

    if (upsertError) {
      console.error('[link-phone] Upsert error:', upsertError.message);
      return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
    }

    console.log('[link-phone] Profile upserted successfully');

    // 4. Generate magiclink token
    const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
      type: 'magiclink',
      email: virtualEmail,
    });

    if (linkError) {
      console.error('[link-phone] generateLink error:', linkError.message);
      return NextResponse.json({ error: 'Failed to generate login token' }, { status: 500 });
    }

    if (!linkData?.properties?.email_otp) {
      console.error('[link-phone] No email_otp in response');
      return NextResponse.json({ error: 'Failed to generate login token' }, { status: 500 });
    }

    console.log('[link-phone] Success! Token generated');

    return NextResponse.json({
      success: true,
      email: virtualEmail,
      token: linkData.properties.email_otp,
    });
  } catch (err: any) {
    console.error('[api/auth/telegram/link-phone] Fatal error:', err.message, err);
    return NextResponse.json({ error: `Server error: ${err.message}` }, { status: 500 });
  }
}
