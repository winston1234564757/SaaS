'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { normalizeToE164 } from '@/lib/utils/phone';

export async function updateClientProfile(
  name: string,
  phone: string,
): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Не авторизований' };

  // Нормалізуємо до E.164 (380XXXXXXXXX). Якщо формат невалідний — null.
  const cleanPhone = phone.trim() ? (normalizeToE164(phone.trim()) ?? null) : null;

  // Явна перевірка дублікату до update — дає зрозумілу помилку замість Postgres 23505
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
    .update({ full_name: name.trim(), phone: cleanPhone })
    .eq('id', user.id);

  if (error) {
    // Fallback: ловимо Postgres UNIQUE violation (23505) якщо явна перевірка пропустила race
    if (error.code === '23505') {
      return { error: 'Цей номер телефону вже зареєстрований в іншому акаунті' };
    }
    return { error: error.message };
  }

  // СИНХРОНІЗАЦІЯ: Оновлюємо ім'я також у метаданих Auth, щоб сесія була актуальною
  await supabase.auth.updateUser({
    data: { full_name: name.trim() }
  });

  revalidatePath('/', 'layout');
  revalidatePath('/my/profile');
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
