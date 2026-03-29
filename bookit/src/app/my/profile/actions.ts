'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function updateClientProfile(name: string, phone: string): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  const { error } = await supabase
    .from('profiles')
    .update({
      full_name: name.trim(),
      phone: phone.trim() || null,
    })
    .eq('id', user.id);

  if (error) throw error;

  revalidatePath('/my/profile');
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
