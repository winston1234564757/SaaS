'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { broadcastPush } from '@/lib/push';
import { sendTelegramMessage } from '@/lib/telegram';

export async function saveClientNote(
  clientPhone: string,
  noteText: string,
): Promise<{ error: string | null }> {
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
  return { error: error?.message ?? null };
}

export async function sendChurnReminder(
  clientId: string | null,
  clientPhone: string,
  clientName: string
): Promise<{ sent: boolean; error: string | null }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { sent: false, error: 'Не авторизований' };

  const admin = createAdminClient();

  const { data: mp } = await admin
    .from('master_profiles')
    .select('slug')
    .eq('id', user.id)
    .single();

  const { data: profile } = await admin
    .from('profiles')
    .select('full_name')
    .eq('id', user.id)
    .single();

  const masterName = profile?.full_name ?? 'Ваш майстер';
  const bookingUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? 'https://bookit.com.ua'}/${mp?.slug}`;
  const msg = `👋 <b>${masterName}</b> чекає на вас!\n\nДавно не бачились — запишіться на зручний час.\n\n<a href="${bookingUrl}">Записатися →</a>`;

  let sent = false;

  if (clientId) {
    // Try push notification
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

    // Try Telegram
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
    return { sent: false, error: 'У клієнта немає push-підписки або Telegram. Зателефонуйте вручну.' };
  }

  return { sent: true, error: null };
}

export async function toggleClientVip(
  clientId: string,
  isVip: boolean
): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Не авторизований' };

  const admin = createAdminClient();
  const { error } = await admin
    .from('client_master_relations')
    .update({ is_vip: isVip })
    .eq('master_id', user.id)
    .eq('client_id', clientId);

  return { error: error?.message ?? null };
}
