'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

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

  const { error } = await createAdminClient()
    .from('master_time_off')
    .delete()
    .eq('id', id)
    .eq('master_id', user.id);

  if (error) return { error: error.message };
  return { error: null };
}
