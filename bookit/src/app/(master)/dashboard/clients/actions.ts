'use server';
import { revalidatePath } from 'next/cache';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { broadcastPush } from '@/lib/push';
import { sendTelegramMessage } from '@/lib/telegram';

export async function saveClientNote(
  clientPhone: string,
  noteText: string,
): Promise<{ error: string | null }> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Не авторизований' };

    const admin = createAdminClient();
    const { error } = await admin
      .from('master_client_notes')
      .upsert(
        { master_id: user.id, client_phone: clientPhone, note_text: noteText, updated_at: new Date().toISOString() },
        { onConflict: 'master_id,client_phone' },
      );
    if (error) throw error;
    return { error: null };
  } catch (err: any) {
    console.error('[saveClientNote] error:', err);
    return { error: 'Не вдалося зберегти нотатку. Спробуйте ще раз.' };
  }
}

export async function sendChurnReminder(
  clientId: string | null,
  clientPhone: string,
  clientName: string
): Promise<{ sent: boolean; error: string | null }> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { sent: false, error: 'Не авторизований' };

    const admin = createAdminClient();

    const [{ data: mp }, { data: profile }] = await Promise.all([
      admin.from('master_profiles').select('slug').eq('id', user.id).single(),
      admin.from('profiles').select('full_name').eq('id', user.id).single(),
    ]);

    const masterName = profile?.full_name ?? 'Ваш майстер';
    const bookingUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? 'https://bookit.com.ua'}/${mp?.slug}`;
    const msg = `👋 <b>${masterName}</b> чекає на вас!\n\nДавно не бачились — запишіться на зручний час.\n\n<a href="${bookingUrl}">Записатися →</a>`;

    let sent = false;

    if (clientId) {
      const { data: pushSubs } = await admin
        .from('push_subscriptions')
        .select('subscription')
        .eq('user_id', clientId);

      if (pushSubs && pushSubs.length > 0) {
        const count = await broadcastPush(pushSubs as any, {
          title: `${masterName} чекає на вас!`,
          body: 'Давно не бачились — запишіться на зручний час.',
          url: bookingUrl,
        });
        if (count > 0) sent = true;
      }

      const { data: tgProfile } = await admin
        .from('profiles')
        .select('telegram_chat_id')
        .eq('id', clientId)
        .single();

      if (tgProfile?.telegram_chat_id) {
        try {
          await sendTelegramMessage(tgProfile.telegram_chat_id, msg);
          sent = true;
        } catch (tgErr) {
          console.error('[sendChurnReminder] Telegram failed:', tgErr);
        }
      }
    }

    if (!sent) {
      return { sent: false, error: 'У клієнта немає активних каналів зв\'язку (Push/Telegram). Надішліть повідомлення вручну.' };
    }

    return { sent: true, error: null };
  } catch (err: any) {
    console.error('[sendChurnReminder] error:', err);
    return { sent: false, error: 'Помилка при надсиланні нагадування.' };
  }
}

export async function toggleClientVip(
  clientId: string,
  isVip: boolean
): Promise<{ error: string | null }> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Не авторизований' };

    const admin = createAdminClient();

    const { error } = await admin
      .from('client_master_relations')
      .update({ is_vip: isVip })
      .eq('master_id', user.id)
      .eq('client_id', clientId);

    if (error) {
      if (error.code === 'PGRST116') return { error: 'Клієнта не знайдено' };
      throw error;
    }
    return { error: null };
  } catch (err: any) {
    console.error('[toggleClientVip] error:', err);
    return { error: 'Не вдалося змінити статус VIP. Спробуйте пізніше.' };
  }
}

export async function archiveClient(clientId: string): Promise<{ error: string | null }> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Не авторизований' };

    const admin = createAdminClient();

    const { error } = await admin
      .from('client_master_relations')
      .update({ is_archived: true })
      .eq('master_id', user.id)
      .eq('client_id', clientId);

    if (error) throw error;

    revalidatePath('/dashboard/clients');
    return { error: null };
  } catch (err: any) {
    console.error('[archiveClient] error:', err);
    return { error: 'Не вдалося архівувати клієнта.' };
  }
}

