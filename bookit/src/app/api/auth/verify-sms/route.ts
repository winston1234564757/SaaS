import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(req: NextRequest) {
  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Невірний формат запиту' }, { status: 400 });
  }
  const rawPhone = body.phone;
  const otp = body.otp;

  if (!rawPhone || !otp) {
    return NextResponse.json({ error: 'Невірні дані' }, { status: 400 });
  }

  const cleanPhone = String(rawPhone).replace(/\D/g, '');
  const cleanOtp = String(otp).trim();

  const supabaseAdmin = createAdminClient();

  // Rate limit on verify: max 10 attempts per phone per 15 minutes
  const fifteenMinAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString();
  const { count: attemptCount } = await supabaseAdmin
    .from('sms_verify_attempts')
    .select('*', { count: 'exact', head: true })
    .eq('phone', cleanPhone)
    .gte('created_at', fifteenMinAgo);

  if (attemptCount !== null && attemptCount >= 10) {
    return NextResponse.json(
      { success: false, error: 'Забагато спроб. Зачекайте 15 хвилин.' },
      { status: 429 }
    );
  }

  const { data: record, error } = await supabaseAdmin
    .from('sms_otps')
    .select('otp, created_at')
    .eq('phone', cleanPhone)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return NextResponse.json(
        { success: false, error: 'Код не знайдено або він застарів. Запросіть новий.' },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, error: 'Помилка перевірки коду' },
      { status: 500 }
    );
  }

  // OTP expiry: 10 minutes
  const otpAge = Date.now() - new Date(record.created_at).getTime();
  if (otpAge > 10 * 60 * 1000) {
    await supabaseAdmin.from('sms_otps').delete().eq('phone', cleanPhone);
    return NextResponse.json(
      { success: false, error: 'Код застарів. Запросіть новий.' },
      { status: 400 }
    );
  }

  if (record.otp !== cleanOtp) {
    // Log failed attempt (for rate limiting)
    await supabaseAdmin.from('sms_verify_attempts').insert({ phone: cleanPhone });
    return NextResponse.json(
      { success: false, error: 'Невірний код. Спробуйте ще раз.' },
      { status: 400 }
    );
  }

  // Correct OTP — delete it and clear attempt log
  await Promise.all([
    supabaseAdmin.from('sms_otps').delete().eq('phone', cleanPhone),
    supabaseAdmin.from('sms_verify_attempts').delete().eq('phone', cleanPhone),
  ]);

  const virtualEmail = `${cleanPhone}@bookit.app`;

  let isNew = false;
  const { error: createError } = await supabaseAdmin.auth.admin.createUser({
    email: virtualEmail,
    password: crypto.randomUUID(), // throwaway — never used or returned
    email_confirm: true,
    user_metadata: { phone: cleanPhone },
  });

  if (!createError) {
    isNew = true;
  }

  // Generate a one-time magic link token — never expose the password
  const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
    type: 'magiclink',
    email: virtualEmail,
  });

  if (linkError || !linkData) {
    console.error('[verify-sms] generateLink error:', linkError);
    return NextResponse.json(
      { success: false, error: 'Помилка авторизації. Спробуйте ще раз.' },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    email: virtualEmail,
    token: linkData.properties.hashed_token,
    isNew,
  });
}
