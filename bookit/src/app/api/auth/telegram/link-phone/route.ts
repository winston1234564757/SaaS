import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { validateTelegramData } from '@/lib/telegram/validation';
import { generateVirtualEmail } from '@/lib/utils/phone';

export async function POST(req: NextRequest) {
  try {
    const { initData, phone } = await req.json();

    if (!initData || !phone) {
      return NextResponse.json({ error: 'Missing data' }, { status: 400 });
    }

    // 1. Validate Telegram data (Security check)
    let tgUser;
    try {
      tgUser = validateTelegramData(initData);
    } catch (err) {
      return NextResponse.json({ error: 'Invalid Telegram data' }, { status: 401 });
    }

    const cleanPhone = phone.replace(/\D/g, '');
    const virtualEmail = generateVirtualEmail(cleanPhone);
    const admin = createAdminClient();

    // 2. Identity Sync (similar to verify-sms)
    // We create or update the profile based on the phone number
    
    // Check if user exists in Auth
    let userId: string;
    const { data: authUser } = await admin.auth.admin.listUsers(); // Simple check or better: try to create
    
    // Attempt to create user (idempotent via generateLink or error handling)
    const { data: createdUser, error: createError } = await admin.auth.admin.createUser({
      email: virtualEmail,
      password: crypto.randomUUID(),
      email_confirm: true,
      user_metadata: { phone: cleanPhone, role: 'client' }
    });

    if (createError && createError.message.includes('already exists')) {
      // User exists, find their ID
      const { data: profileByEmail } = await admin
        .from('profiles')
        .select('id')
        .eq('email', virtualEmail)
        .maybeSingle();
      
      if (!profileByEmail) {
        return NextResponse.json({ error: 'Could not resolve user' }, { status: 500 });
      }
      userId = profileByEmail.id;
    } else if (createdUser?.user) {
      userId = createdUser.user.id;
    } else {
      return NextResponse.json({ error: 'Failed to create/find user' }, { status: 500 });
    }

    // 3. Update profile with telegram_chat_id
    const { error: updateError } = await admin
      .from('profiles')
      .upsert({
        id: userId,
        phone: cleanPhone,
        email: virtualEmail,
        telegram_chat_id: tgUser.id.toString(),
        full_name: tgUser.first_name + (tgUser.last_name ? ` ${tgUser.last_name}` : ''),
        role: 'client' // TMA for clients is the priority
      });

    if (updateError) {
      console.error('[link-phone] Profile update error:', updateError);
      return NextResponse.json({ error: 'Failed to link profile' }, { status: 500 });
    }

    // 4. Generate magiclink for login
    const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
      type: 'magiclink',
      email: virtualEmail,
    });

    if (linkError || !linkData?.properties?.email_otp) {
      return NextResponse.json({ error: 'Login generation failed' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      email: virtualEmail,
      token: linkData.properties.email_otp,
    });

  } catch (err) {
    console.error('[api/auth/telegram/link-phone] Fatal error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
