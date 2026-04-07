import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

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

  // 7. Check if user is already authenticated (e.g. Google user)
  const supabaseServer = await createClient();
  const { data: { user: currentUser } } = await supabaseServer.auth.getUser();

  let isNew = false;
  let userId: string | null = null;
  const virtualEmail = `${cleanPhone}@bookit.app`;
  let emailOtpToken: string | undefined;

  if (currentUser) {
    // Google user linking phone or existing user on same device
    userId = currentUser.id;
  } else {
    // Create user if new (idempotent — ignores conflict)
    const { error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: virtualEmail,
      password: crypto.randomUUID(), // throwaway — never returned or used
      email_confirm: true,
      user_metadata: { phone: cleanPhone, role: role ?? 'client' },
    });
    if (!createError) isNew = true;

    // 8. Generate one-time magiclink token
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
    
    emailOtpToken = linkData.properties.email_otp;
    userId = linkData.user?.id ?? null;

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
  }

  // STEP 1: Синхронізація IDENTITY (Auth Metadata + Profiles Table).
  // SMART ROLE ASSIGNMENT: Extract role from request body. If body.role === 'master', use 'master'.
  // If null/missing, default to 'client'. If user already exists in profiles, DO NOT overwrite their existing role with a lower-tier one.
  let assignedRole = role === 'master' ? 'master' : 'client';

  if (currentUser) {
    const { data: existingProfile } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .maybeSingle();

    if (existingProfile?.role === 'master') {
      assignedRole = 'master'; // don't downgrade a master
    }
  }

  // 1a. Оновлюємо Auth Metadata (джерело правди для сесій)
  const metaResult = await supabaseAdmin.auth.admin.updateUserById(userId!, {
    user_metadata: { phone: cleanPhone, role: assignedRole }
  });
  if (metaResult.error) {
    console.error('[verify-sms] AUTH METADATA UPDATE ERROR:', JSON.stringify({
      message: metaResult.error.message,
      status: metaResult.error.status,
      userId,
      phone: cleanPhone,
    }));
  }

  // STEP 1: Ensure Profile Identity exists (without phone yet)
  // This satisfies the FK for client_profiles.id -> profiles.id
  const fallbackName = currentUser?.user_metadata?.full_name
    || currentUser?.user_metadata?.name
    || `User ${cleanPhone.slice(-4)}`;

  const { error: profileUpsertError } = await supabaseAdmin.from('profiles').upsert(
    { id: userId, full_name: fallbackName, role: assignedRole, email: virtualEmail },
    { onConflict: 'id', ignoreDuplicates: false }
  );
  if (profileUpsertError) {
    console.error('[verify-sms] IDENTITY UPSERT ERROR:', profileUpsertError.message);
    return NextResponse.json({ success: false, error: 'Помилка ідентифікації профілю' }, { status: 500 });
  }

  // STEP 2: Ensure Client Profile existence
  // This satisfies the FK for bookings.client_id -> client_profiles.id
  const { error: clientProfileError } = await supabaseAdmin.from('client_profiles').upsert(
    { id: userId },
    { onConflict: 'id', ignoreDuplicates: true }
  );
  if (clientProfileError) {
    console.error('[verify-sms] CLIENT_PROFILE UPSERT ERROR:', clientProfileError.message);
    return NextResponse.json({ success: false, error: 'Помилка ініціалізації клієнтського профілю' }, { status: 500 });
  }

  // STEP 3: Set Phone Number & Activate Linkage Trigger
  // Now that client_profiles exists, the trigger trg_link_bookings_on_phone will satisfy the FK.
  const { error: phoneUpdateError } = await supabaseAdmin
    .from('profiles')
    .update({ phone: cleanPhone })
    .eq('id', userId);

  if (phoneUpdateError) {
    console.error('[verify-sms] PHONE UPDATE ERROR (Linkage Trigger):', JSON.stringify({
      code: phoneUpdateError.code,
      message: phoneUpdateError.message,
      details: phoneUpdateError.details,
      userId,
      phone: cleanPhone,
    }));
    return NextResponse.json(
      { success: false, error: `Помилка активації номеру: ${phoneUpdateError.code} — ${phoneUpdateError.message}` },
      { status: 500 }
    );
  }
  console.log('[verify-sms] IDENTITY SYNC COMPLETE:', { userId, phone: cleanPhone, role: assignedRole });

  // STEP 2: Атомічний linkage гостьових бронювань за номером телефону.
  // Використовуємо останні 10 цифр для resilient matching (старі бронювання
  // могли зберігати номер як 0961234567 замість 380961234567).
  const phoneSuffix = cleanPhone.slice(-10);
  const { data: linkedBookings, error: bookingLinkError } = await supabaseAdmin
    .from('bookings')
    .update({ client_id: userId })
    .like('client_phone', `%${phoneSuffix}`)
    .is('client_id', null)
    .select('id');
    
  console.log('[verify-sms] BOOKING LINKAGE:', {
    phoneSuffix,
    linkedCount: linkedBookings?.length ?? 0,
    error: bookingLinkError?.message ?? null,
  });
  if (bookingLinkError) {
    console.error('[verify-sms] booking linkage error:', bookingLinkError.message);
  }


  // email_otp — це OTP-код для verifyOtp({ type: 'email' }) на клієнті.
  const response = NextResponse.json({
    success: true,
    email: virtualEmail,
    token: emailOtpToken,  // will be undefined if currentUser exists
    isNew,
    isExistingSession: !!currentUser,
  });

  // Clear stale user_role cookie so proxy.ts re-reads from DB on next navigation.
  response.cookies.set('user_role', '', { path: '/', maxAge: 0, httpOnly: true, sameSite: 'lax' });

  return response;
}
