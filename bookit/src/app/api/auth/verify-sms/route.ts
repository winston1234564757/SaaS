'use server';

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase/admin';

// ── Zod schema ────────────────────────────────────────────────────────────────

const bodySchema = z.object({
  phone: z
    .string({ error: 'Введіть номер телефону' })
    .transform(v => v.replace(/\D/g, ''))
    .pipe(z.string().regex(/^380\d{9}$/, 'Некоректний формат телефону (380XXXXXXXXX)')),
  otp: z
    .string({ error: 'Введіть код підтвердження' })
    .trim()
    .regex(/^\d{6}$/, 'Код має містити 6 цифр'),
  role: z.enum(['client', 'master']).optional(),
});

// ── Handler ───────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  // 1. Parse & validate request body with Zod
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Невірний формат запиту' }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(raw);
  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? 'Невірні дані';
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }

  const { phone: cleanPhone, otp: cleanOtp, role } = parsed.data;
  const supabaseAdmin = createAdminClient();

  // 2. Atomic rate-limit check via PostgreSQL RPC (fixes race condition).
  //    check_and_log_sms_attempt() uses pg_advisory_xact_lock to serialize
  //    concurrent requests for the same phone, preventing SELECT+INSERT race.
  const { data: allowed, error: rpcError } = await supabaseAdmin.rpc(
    'check_and_log_sms_attempt',
    { p_phone: cleanPhone, max_attempts: 10, window_minutes: 15 }
  );

  if (rpcError) {
    console.error('[verify-sms] RPC error:', rpcError.message);
    // Fail-closed: reject on DB error rather than allowing through
    return NextResponse.json(
      { success: false, error: 'Помилка перевірки. Спробуйте пізніше.' },
      { status: 500 }
    );
  }

  if (!allowed) {
    return NextResponse.json(
      { success: false, error: 'Забагато спроб. Зачекайте 15 хвилин.' },
      { status: 429 }
    );
  }

  // 3. Fetch OTP record
  const { data: record, error: fetchError } = await supabaseAdmin
    .from('sms_otps')
    .select('otp, created_at')
    .eq('phone', cleanPhone)
    .single();

  if (fetchError) {
    if (fetchError.code === 'PGRST116') {
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

  // 4. OTP expiry: 10 minutes
  const otpAge = Date.now() - new Date(record.created_at).getTime();
  if (otpAge > 10 * 60 * 1000) {
    await supabaseAdmin.from('sms_otps').delete().eq('phone', cleanPhone);
    return NextResponse.json(
      { success: false, error: 'Код застарів. Запросіть новий.' },
      { status: 400 }
    );
  }

  // 5. OTP match check
  if (record.otp !== cleanOtp) {
    return NextResponse.json(
      { success: false, error: 'Невірний код. Спробуйте ще раз.' },
      { status: 400 }
    );
  }

  // 6. Correct OTP — clean up OTP + rate-limit log
  await Promise.all([
    supabaseAdmin.from('sms_otps').delete().eq('phone', cleanPhone),
    supabaseAdmin.from('sms_verify_attempts').delete().eq('phone', cleanPhone),
  ]);

  // 7. Create user if new (idempotent — ignores conflict)
  const virtualEmail = `${cleanPhone}@bookit.app`;
  let isNew = false;

  const { error: createError } = await supabaseAdmin.auth.admin.createUser({
    email: virtualEmail,
    password: crypto.randomUUID(), // throwaway — never returned or used
    email_confirm: true,
    user_metadata: { phone: cleanPhone, role: role ?? 'client' },
  });
  if (!createError) isNew = true;

  // 8. Generate one-time magiclink token і одразу обмінюємо на сесію server-side.
  //    Supabase JS клієнт v2 видаляє type:'magiclink' як deprecated → verifyOtp ламається.
  //    Пряме REST звернення до /auth/v1/verify приймає type:'magiclink' і повертає сесію.
  const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
    type: 'magiclink',
    email: virtualEmail,
  });

  if (linkError || !linkData?.properties?.email_otp) {
    console.error('[verify-sms] generateLink error:', linkError, 'properties:', linkData?.properties);
    return NextResponse.json(
      { success: false, error: 'Помилка авторизації. Спробуйте ще раз.' },
      { status: 500 }
    );
  }

  // 8b. Отримуємо user.id надійно.
  //     generateLink повертає linkData.user для нових юзерів, але може бути null для існуючих.
  //     Використовуємо кастомний RPC get_user_id_by_email — це найбільш прямий та
  //     швидкий спосіб знайти Auth ID за email без пагінації чи затримок тригерів.
  let userId: string | null = linkData.user?.id ?? null;

  if (!userId) {
    const { data: rpcId, error: rpcError } = await supabaseAdmin.rpc(
      'get_user_id_by_email',
      { p_email: virtualEmail }
    );
    if (rpcError) console.error('[verify-sms] rpc get_user_id_by_email error:', rpcError.message);
    userId = rpcId;
  }

  // Останній фоллбек — таблиця profiles
  if (!userId) {
    const { data: profileByEmail } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('email', virtualEmail)
      .maybeSingle();
    userId = profileByEmail?.id ?? null;
  }

  if (!userId) {
    console.error('[verify-sms] cannot resolve user id for', virtualEmail);
    return NextResponse.json(
      { success: false, error: 'Помилка ідентифікації. Спробуйте ще раз.' },
      { status: 500 }
    );
  }

  // STEP 1: Синхронізація IDENTITY (Auth Metadata + Profiles Table).
  //         Якщо юзер вже існував, то при createUser нічого не змінилось у Auth.
  //         Тому МУСИМО оновити Auth Metadata через admin.updateUserById,
  //         щоб майбутні системні перевірки (тригери, middleware) бачили актуальну роль.
  const assignedRole = (role === 'master') ? 'master' : 'client';

  await Promise.all([
    // 1a. Оновлюємо Auth Metadata (джерело правди для сесій)
    supabaseAdmin.auth.admin.updateUserById(userId, {
      user_metadata: { phone: cleanPhone, role: assignedRole }
    }),
    // 1b. Force-upsert profiles (джерело правди для запитів)
    supabaseAdmin.from('profiles').upsert(
      { id: userId, phone: cleanPhone, role: assignedRole },
      { onConflict: 'id', ignoreDuplicates: false }
    )
  ]);

  // STEP 2: Атомічний linkage гостьових бронювань за номером телефону.
  const { error: bookingLinkError } = await supabaseAdmin
    .from('bookings')
    .update({ client_id: userId })
    .eq('client_phone', cleanPhone)
    .is('client_id', null);
  if (bookingLinkError) {
    console.error('[verify-sms] booking linkage error:', bookingLinkError.message);
  }

  // email_otp — це OTP-код для verifyOtp({ type: 'email' }) на клієнті.
  const response = NextResponse.json({
    success: true,
    email: virtualEmail,
    token: linkData.properties.email_otp,
    isNew,
  });

  // Clear stale user_role cookie so proxy.ts re-reads from DB on next navigation.
  // Prevents a browser with user_role=master from routing a fresh client session
  // into /dashboard after SMS login.
  response.cookies.set('user_role', '', { path: '/', maxAge: 0, httpOnly: true, sameSite: 'lax' });

  return response;
}
