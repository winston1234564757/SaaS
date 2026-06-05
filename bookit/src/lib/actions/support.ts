'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { NotificationOrchestrator } from '@/lib/notifications/NotificationOrchestrator';

export async function createSupportTicketAction(
  type: 'feedback' | 'bug' | 'idea' | 'chat',
  message: string,
  attachmentUrl?: string | null
): Promise<{ error: string | null; ticketId?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Не авторизований' };

  // 1. Create support ticket
  const { data: ticket, error: ticketErr } = await supabase
    .from('support_tickets')
    .insert({
      user_id: user.id,
      type,
      status: 'open'
    })
    .select('id')
    .single();

  if (ticketErr || !ticket) {
    return { error: ticketErr?.message || 'Помилка створення тікету' };
  }

  // 2. Create initial message
  const { error: msgErr } = await supabase
    .from('support_messages')
    .insert({
      ticket_id: ticket.id,
      sender_id: user.id,
      message,
      attachment_url: attachmentUrl ?? null
    });

  if (msgErr) {
    return { error: msgErr.message };
  }

  // 3. Dispatch alert to administrators on Telegram
  try {
    const adminClient = createAdminClient();
    const { data: admins } = await adminClient
      .from('profiles')
      .select('id')
      .eq('role', 'admin');

    if (admins && admins.length > 0) {
      const { data: profile } = await adminClient
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single();

      const senderName = profile?.full_name || 'Користувач';

      await Promise.all(
        admins.map(adminUser =>
          NotificationOrchestrator.send({
            eventType: 'support_admin_alert',
            recipientId: adminUser.id,
            recipientRole: 'client',
            data: {
              clientName: senderName,
              comment: message,
              ticketId: ticket.id
            }
          })
        )
      );
    }
  } catch (err) {
    console.error('[SupportAction] Failed to dispatch admin alert:', err);
  }

  return { error: null, ticketId: ticket.id };
}

export interface SupportMessageResult {
  id: string;
  ticket_id: string;
  sender_id: string;
  message: string;
  attachment_url: string | null;
  created_at: string;
}

export async function sendSupportMessageAction(
  ticketId: string,
  message: string,
  attachmentUrl?: string | null
): Promise<{ error: string | null; messageData?: SupportMessageResult }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Не авторизований' };

  // 1. Check ticket existence
  const { data: ticket, error: ticketFetchErr } = await supabase
    .from('support_tickets')
    .select('id, user_id, status')
    .eq('id', ticketId)
    .single();

  if (ticketFetchErr || !ticket) {
    return { error: ticketFetchErr?.message || 'Тікет не знайдено' };
  }

  // 2. Insert message
  const { data: newMsg, error: msgErr } = await supabase
    .from('support_messages')
    .insert({
      ticket_id: ticketId,
      sender_id: user.id,
      message,
      attachment_url: attachmentUrl ?? null
    })
    .select('id, ticket_id, sender_id, message, attachment_url, created_at')
    .single();

  if (msgErr || !newMsg) {
    return { error: msgErr?.message || 'Помилка надсилання повідомлення' };
  }

  // 3. Update ticket activity timestamps & status based on sender role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, full_name')
    .eq('id', user.id)
    .single();

  const isSenderAdmin = profile?.role === 'admin';

  await supabase
    .from('support_tickets')
    .update({
      updated_at: new Date().toISOString(),
      ...(isSenderAdmin ? { status: 'active' } : { status: 'open' })
    })
    .eq('id', ticketId);

  // 4. Dispatch support notifications
  try {
    const adminClient = createAdminClient();
    if (isSenderAdmin) {
      const { data: recipientProfile } = await adminClient
        .from('profiles')
        .select('role')
        .eq('id', ticket.user_id)
        .single();

      await NotificationOrchestrator.send({
        eventType: 'support_user_reply',
        recipientId: ticket.user_id,
        recipientRole: recipientProfile?.role === 'master' ? 'master' : 'client',
        masterId: recipientProfile?.role === 'master' ? ticket.user_id : undefined,
        data: {
          comment: message,
          ticketId: ticketId,
          userRole: recipientProfile?.role === 'master' ? 'master' : 'client'
        }
      });
    } else {
      const { data: admins } = await adminClient
        .from('profiles')
        .select('id')
        .eq('role', 'admin');

      if (admins && admins.length > 0) {
        const senderName = profile?.full_name || 'Користувач';
        await Promise.all(
          admins.map(adminUser =>
            NotificationOrchestrator.send({
              eventType: 'support_admin_alert',
              recipientId: adminUser.id,
              recipientRole: 'client',
              data: {
                clientName: senderName,
                comment: message,
                ticketId: ticketId
              }
            })
          )
        );
      }
    }
  } catch (err) {
    console.error('[SupportAction] Failed to dispatch chat notification:', err);
  }

  return { error: null, messageData: newMsg };
}

export async function resolveSupportTicketAction(
  ticketId: string
): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Не авторизований' };

  const { data: profile } = await supabase
    .from('profiles').select('role').eq('id', user.id).single();
  if (profile?.role !== 'admin') return { error: 'Недостатньо прав' };

  const { error } = await supabase
    .from('support_tickets')
    .update({ status: 'resolved', updated_at: new Date().toISOString() })
    .eq('id', ticketId);

  if (error) return { error: error.message };
  return { error: null };
}
