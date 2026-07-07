'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { normalizeToE164 } from '@/lib/utils/phone';

export async function updateClientProfile(
  name: string,
  phone: string,
  medicalNotes?: string,
  healthNotes?: string,
  avatarUrl?: string,
  instagramUrl?: string,
  telegramHandle?: string,
): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Не авторизований' };

  const cleanPhone = phone.trim() ? (normalizeToE164(phone.trim()) ?? null) : null;

  if (cleanPhone) {
    const { data: existing } = await supabase
      .from('profiles')
      .select('id')
      .eq('phone', cleanPhone)
      .neq('id', user.id)
      .maybeSingle();

    if (existing) {
      return { error: 'Цей номер телефону вже зареєстрований в іншому акаунті' };
    }
  }

  const { error } = await supabase
    .from('profiles')
    .update({
      full_name: name.trim(),
      phone: cleanPhone,
      medical_notes: medicalNotes ?? undefined,
      health_notes: healthNotes ?? undefined,
      avatar_url: avatarUrl ?? undefined,
      instagram_url: instagramUrl ?? undefined,
      telegram_handle: telegramHandle ?? undefined,
    })
    .eq('id', user.id);

  if (error) {
    if (error.code === '23505') {
      return { error: 'Цей номер телефону вже зареєстрований в іншому акаунті' };
    }
    return { error: error.message };
  }

  await supabase.auth.updateUser({ data: { full_name: name.trim() } });

  // A profile edit only affects the client cabinet — scope it there instead of
  // purging the whole-site cache (was revalidatePath('/', 'layout')).
  revalidatePath('/my', 'layout');
  return { error: null };
}

export async function disconnectClientTelegram(): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  await supabase
    .from('profiles')
    .update({ telegram_chat_id: null })
    .eq('id', user.id);

  revalidatePath('/my/profile');
}
