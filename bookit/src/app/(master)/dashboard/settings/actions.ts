'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { generateSecureToken } from '@/lib/utils/token';

/**
 * SEC-HIGH-2: Generates a short-lived one-time token for Telegram account linking.
 * The token is stored in master_profiles.telegram_connect_token and used as the
 * /start payload in the Telegram bot deep-link instead of the public slug.
 * Token is cleared atomically by the webhook after successful linking.
 */
export async function generateTelegramConnectToken(): Promise<{ token: string | null; error: string | null }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { token: null, error: 'Не авторизований' };

  const token = generateSecureToken(8);

  const { error } = await createAdminClient()
    .from('master_profiles')
    .update({ telegram_connect_token: token })
    .eq('id', user.id);

  if (error) return { token: null, error: error.message };
  return { token, error: null };
}

export type TimeOffType = 'vacation' | 'day_off' | 'short_day';

export interface AddTimeOffPayload {
  type: TimeOffType;
  startDate: string;   // 'YYYY-MM-DD'
  endDate: string;     // 'YYYY-MM-DD' (= startDate для day_off / short_day)
  startTime?: string;  // 'HH:MM' — тільки для short_day
  endTime?: string;    // 'HH:MM' — тільки для short_day
}

export async function addTimeOff(
  payload: AddTimeOffPayload,
): Promise<{ id: string | null; error: string | null }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { id: null, error: 'Не авторизований' };

  const { type, startDate, endDate, startTime, endTime } = payload;

  if (startDate > endDate) return { id: null, error: 'Дата початку не може бути пізніше дати кінця' };
  if (type === 'short_day' && (!startTime || !endTime)) {
    return { id: null, error: 'Для короткого дня вкажіть час початку та кінця' };
  }
  if (type === 'short_day' && startTime! >= endTime!) {
    return { id: null, error: 'Час початку повинен бути раніше часу кінця' };
  }

  const { data, error } = await createAdminClient()
    .from('master_time_off')
    .insert({
      master_id:  user.id,
      type,
      start_date: startDate,
      end_date:   type === 'vacation' ? endDate : startDate,
      start_time: type === 'short_day' ? startTime : null,
      end_time:   type === 'short_day' ? endTime   : null,
    })
    .select('id')
    .single();

  if (error) return { id: null, error: error.message };
  return { id: data.id, error: null };
}

export async function removeTimeOff(
  id: string,
): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Не авторизований' };

  const admin = createAdminClient();

  const { data: deleted, error } = await admin
    .from('master_time_off')
    .delete()
    .eq('id', id)
    .eq('master_id', user.id)
    .select('id')
    .single();

  if (error?.code === 'PGRST116') return { error: 'Запис не знайдено' };
  if (error) return { error: error.message };
  return { error: null };
}
