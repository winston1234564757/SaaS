'use server';

import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

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

  // 8. Check phone not taken by another account
  const { data: conflict } = await admin
    .from('profiles')
    .select('id')
    .eq('phone', cleanPhone)
    .neq('id', user.id)
    .maybeSingle();
  if (conflict) {
    return { error: "Цей номер вже прив'язаний до іншого акаунту. Зверніться до підтримки." };
  }

  // 9. Upsert profile phone → trigger trg_link_bookings_on_phone fires automatically
  const { error: upsertError } = await admin
    .from('profiles')
    .upsert(
      { id: user.id, phone: cleanPhone },
      { onConflict: 'id', ignoreDuplicates: false },
    );
  if (upsertError) {
    // 23505 = unique_violation on profiles.phone (race with another account claiming same phone)
    if (upsertError.code === '23505') {
      return { error: "Цей номер вже прив'язаний до іншого акаунту. Зверніться до підтримки." };
    }
    console.error('[confirmPhone] upsert error:', upsertError.message);
    return { error: 'Помилка збереження номеру. Спробуйте ще раз.' };
  }

  return { success: true };
}
