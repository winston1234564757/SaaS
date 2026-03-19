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

  console.log('[verify-sms] admin client initialized. Attempting to verify:', {
    phone: cleanPhone,
    otp: cleanOtp,
  });

  const { data: record, error } = await supabaseAdmin
    .from('sms_otps')
    .select('otp')
    .eq('phone', cleanPhone)
    .single();

  console.log('[verify-sms] DB result:', { record, error });

  if (error) {
    console.error('[verify-sms] Supabase DB Error Details:', error);
    if (error.code === 'PGRST116') {
      return NextResponse.json(
        { success: false, error: 'Код не знайдено або він застарів. Запросіть новий.' },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, error: `DB Error: ${error.message}` },
      { status: 400 }
    );
  }

  if (record.otp !== cleanOtp) {
    console.warn('[verify-sms] код не співпав:', { expected: record.otp, got: cleanOtp });
    return NextResponse.json(
      { success: false, error: 'Невірний код. Спробуйте ще раз.' },
      { status: 400 }
    );
  }

  // Код правильний — видаляємо
  await supabaseAdmin.from('sms_otps').delete().eq('phone', cleanPhone);

  const virtualEmail = `${cleanPhone}@bookit.app`;
  const secretTail = process.env.SUPABASE_SERVICE_ROLE_KEY!.slice(-16);
  const virtualPassword = `${cleanPhone}_${secretTail}`;

  let isNew = false;
  const { error: createError } = await supabaseAdmin.auth.admin.createUser({
    email: virtualEmail,
    password: virtualPassword,
    email_confirm: true,
    user_metadata: { phone: cleanPhone },
  });

  if (!createError) {
    isNew = true;
    console.log('[verify-sms] new user created:', virtualEmail);
  } else {
    console.log('[verify-sms] user exists, proceeding with deterministic password.');
  }

  console.log('[verify-sms] success. isNew:', isNew, 'email:', virtualEmail);
  return NextResponse.json({ success: true, email: virtualEmail, password: virtualPassword, isNew });
}
