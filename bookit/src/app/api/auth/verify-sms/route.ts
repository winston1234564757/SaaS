import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(req: NextRequest) {
  const { phone: rawPhone, otp } = await req.json();

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
  const virtualPassword = `${cleanPhone}${process.env.SUPABASE_SERVICE_ROLE_KEY.slice(0, 10)}`;

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
    // Юзер існує (міг бути створений через Magic Link без пароля)
    // Знаходимо його і форсово синхронізуємо пароль
    console.log('[verify-sms] user exists, syncing password. createError:', createError.message);
    const { data: { users } } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
    const existing = users.find(u => u.email === virtualEmail);
    if (existing) {
      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
        existing.id,
        { password: virtualPassword, email_confirm: true }
      );
      console.log('[verify-sms] password sync result:', updateError ?? 'OK', 'uid:', existing.id);
    } else {
      console.error('[verify-sms] could not find existing user by email:', virtualEmail);
    }
  }

  console.log('[verify-sms] success. isNew:', isNew, 'email:', virtualEmail);
  return NextResponse.json({ success: true, email: virtualEmail, password: virtualPassword, isNew });
}
