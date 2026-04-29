'use server';

import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

const phoneSchema = z
  .string()
  .transform(v => v.replace(/\D/g, ''))
  .pipe(z.string().regex(/^380\d{9}$/, 'Некоректний формат телефону (380XXXXXXXXX)'));

const otpSchema = z
  .string()
  .trim()
  .regex(/^\d{6}$/, 'Код має містити 6 цифр');

export async function confirmPhone(
  phone: string,
  otp: string,
): Promise<{ error: string } | { success: true }> {
  // 1. Validate inputs
  const parsedPhone = phoneSchema.safeParse(phone);
  const parsedOtp = otpSchema.safeParse(otp);
  if (!parsedPhone.success) return { error: parsedPhone.error.issues[0]?.message ?? 'Некоректний телефон' };
  if (!parsedOtp.success) return { error: 'Код має містити 6 цифр' };

  const cleanPhone = parsedPhone.data;
  const cleanOtp = parsedOtp.data;

  // 2. Get authenticated user (Google OAuth session)
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthorized' };

  const admin = createAdminClient();

  // 3. Rate-limit check (same RPC as verify-sms)
  const { data: allowed, error: rpcError } = await admin.rpc(
    'check_and_log_sms_attempt',
    { p_phone: cleanPhone, max_attempts: 10, window_minutes: 15 },
  );
  if (rpcError) {
    console.error('[confirmPhone] RPC error:', rpcError.message);
    return { error: 'Помилка перевірки. Спробуйте пізніше.' };
  }
  if (!allowed) return { error: 'Забагато спроб. Зачекайте 15 хвилин.' };

  // 4. Fetch OTP record
  const { data: record, error: fetchError } = await admin
    .from('sms_otps')
    .select('otp, created_at')
    .eq('phone', cleanPhone)
    .single();
  if (fetchError || !record) {
    return { error: 'Код не знайдено або він застарів. Запросіть новий.' };
  }

  // 5. Check TTL: 10 minutes
  if (Date.now() - new Date(record.created_at).getTime() > 10 * 60 * 1000) {
    await admin.from('sms_otps').delete().eq('phone', cleanPhone);
    return { error: 'Код застарів. Запросіть новий.' };
  }

  // 6. Check OTP match
  if (record.otp !== cleanOtp) {
    return { error: 'Невірний код. Спробуйте ще раз.' };
  }

  // 7. Clean up OTP and rate-limit log
  await Promise.all([
    admin.from('sms_otps').delete().eq('phone', cleanPhone),
    admin.from('sms_verify_attempts').delete().eq('phone', cleanPhone),
  ]);

  // 8. Idempotency: check if already linked to THIS user
  const { data: currentProfile } = await admin
    .from('profiles')
    .select('phone')
    .eq('id', user.id)
    .maybeSingle();

  if (currentProfile?.phone === cleanPhone) {
    console.log('[confirmPhone] Phone already linked to this user, returning success');
    revalidatePath('/my', 'layout');
    revalidatePath('/my/setup/phone');
    return { success: true };
  }

  // 9. Check phone not taken by another account
  const { data: conflict } = await admin
    .from('profiles')
    .select('id')
    .eq('phone', cleanPhone)
    .neq('id', user.id)
    .maybeSingle();
  if (conflict) {
    return { error: "Цей номер вже прив'язаний до іншого акаунту. Зверніться до підтримки." };
  }

  // STEP 1: Ensure Profile Identity exists (with metadata)
  // This satisfies the FK for client_profiles.id -> profiles.id
  const assignedRole = (user.user_metadata?.role as any) || 'client';
  const fullName = user.user_metadata?.full_name || user.user_metadata?.name || `User ${cleanPhone.slice(-4)}`;

  const { error: profileUpsertError } = await admin.from('profiles').upsert(
    { 
      id: user.id, 
      full_name: fullName, 
      role: assignedRole,
      email: user.email 
    },
    { onConflict: 'id', ignoreDuplicates: false }
  );
  if (profileUpsertError) {
    console.error('[confirmPhone] IDENTITY UPSERT ERROR:', profileUpsertError.message);
    return { error: 'Помилка ідентифікації профілю' };
  }

  // STEP 2: Ensure Client Profile existence
  // This satisfies the FK for bookings.client_id -> client_profiles.id
  const { error: clientProfileError } = await admin.from('client_profiles').upsert(
    { id: user.id },
    { onConflict: 'id', ignoreDuplicates: true }
  );
  if (clientProfileError) {
    console.error('[confirmPhone] CLIENT_PROFILE UPSERT ERROR:', clientProfileError.message);
    return { error: 'Помилка ініціалізації клієнтського профілю' };
  }

  // STEP 3: Set Phone Number & Activate Linkage Trigger
  const { error: phoneUpdateError } = await admin
    .from('profiles')
    .update({ phone: cleanPhone })
    .eq('id', user.id);

  if (phoneUpdateError) {
    console.error('[confirmPhone] PHONE UPDATE ERROR:', JSON.stringify({
      code: phoneUpdateError.code,
      message: phoneUpdateError.message,
      userId: user.id,
      phone: cleanPhone,
    }));
    return { error: `Помилка збереження: ${phoneUpdateError.code}` };
  }

  // STEP 4: Explicit Booking Linkage (Redundancy for trigger)
  const phoneSuffix = cleanPhone.slice(-10);
  const { data: linkedBookings } = await admin
    .from('bookings')
    .update({ client_id: user.id })
    .like('client_phone', `%${phoneSuffix}`)
    .is('client_id', null)
    .select('id');

  console.log('[confirmPhone] LINKAGE COMPLETE:', { userId: user.id, linked: linkedBookings?.length ?? 0 });

  revalidatePath('/my', 'layout');
  revalidatePath('/my/setup/phone');
  
  return { success: true };
}
