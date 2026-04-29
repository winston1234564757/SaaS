'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { escHtml } from '@/lib/telegram';
import { notifyClientBroadcast } from '@/lib/notifications';
import type { BroadcastChannel, BroadcastTagFilter } from '@/types/database';
import {
  matchesTagFilters,
  personalizeMessage,
  buildTargetUrl,
  generateShortCode,
} from '@/lib/utils/broadcastUtils';

// ── Constants ─────────────────────────────────────────────────────────────────

const STARTER_BROADCAST_LIMIT = 3;
const COOLDOWN_HOURS = 72;
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://bookit.com.ua';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface CreateBroadcastInput {
  title: string;
  message_template: string;
  channels: BroadcastChannel[];
  tag_filters: BroadcastTagFilter[];
  discount_percent?: number | null;
  discount_service_id?: string | null;
  discount_expires_days?: number | null;
  service_link_id?: string | null;
  product_link_id?: string | null;
}

export interface ClientPreview {
  clientId: string;
  name: string;
  phone: string;
  retentionStatus: string | null;
  isVip: boolean;
  totalVisits: number;
}

export interface DeliveryResult {
  clientId: string;
  name: string;
  phone: string;
  pushSent: boolean;
  telegramSent: boolean;
  smsSent: boolean;
}

interface ClientRow {
  client_id: string | null;
  client_name: string;
  client_phone: string;
  total_visits: number;
  average_check: number;
  is_vip: boolean;
  retention_status: string | null;
}

// ── Internal wrapper for buildTargetUrl with SITE_URL ────────────────────────

function buildUrl(slug: string, serviceId: string | null, productId: string | null): string {
  return buildTargetUrl(slug, SITE_URL, serviceId, productId);
}

// ── Actions ───────────────────────────────────────────────────────────────────

export async function createBroadcast(input: CreateBroadcastInput) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthorized' };

  const admin = createAdminClient();

  const { data, error } = await admin
    .from('broadcasts')
    .insert({
      master_id:            user.id,
      title:                input.title,
      message_template:     input.message_template,
      channels:             input.channels,
      tag_filters:          input.tag_filters,
      discount_percent:     input.discount_percent ?? null,
      discount_service_id:  input.discount_service_id ?? null,
      discount_expires_days: input.discount_expires_days ?? null,
      service_link_id:      input.service_link_id ?? null,
      product_link_id:      input.product_link_id ?? null,
      status:               'draft',
    })
    .select('id')
    .single();

  if (error) return { error: error.message };

  revalidatePath('/dashboard/marketing');
  return { id: data.id };
}

export async function updateBroadcast(id: string, input: Partial<CreateBroadcastInput>) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthorized' };

  const admin = createAdminClient();

  const { error } = await admin
    .from('broadcasts')
    .update({ ...input, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('master_id', user.id)
    .eq('status', 'draft');

  if (error) return { error: error.message };

  revalidatePath('/dashboard/marketing');
  return { ok: true };
}

export async function deleteBroadcast(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthorized' };

  const admin = createAdminClient();
  await admin
    .from('broadcasts')
    .delete()
    .eq('id', id)
    .eq('master_id', user.id)
    .eq('status', 'draft');

  revalidatePath('/dashboard/marketing');
  return { ok: true };
}

// ── Shared: get cooldown client IDs for current master ────────────────────────

async function getCooldownIds(admin: ReturnType<typeof createAdminClient>, masterId: string): Promise<Set<string>> {
  const cooldownCutoff = new Date(Date.now() - COOLDOWN_HOURS * 60 * 60 * 1000).toISOString();
  const { data: sentBroadcasts } = await admin
    .from('broadcasts').select('id').eq('master_id', masterId).eq('status', 'sent');
  const sentIds = sentBroadcasts?.map(b => b.id) ?? [];
  if (sentIds.length === 0) return new Set();
  const { data: recent } = await admin
    .from('broadcast_recipients').select('client_id')
    .in('broadcast_id', sentIds).gte('created_at', cooldownCutoff);
  return new Set((recent ?? []).map(r => r.client_id as string));
}

export async function previewBroadcastRecipients(
  tagFilters: BroadcastTagFilter[],
  page = 0,
  pageSize = 20,
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { count: 0, clients: [] as ClientPreview[], hasMore: false };

  const admin = createAdminClient();
  const [clientsRes, cooldownIds] = await Promise.all([
    admin.rpc('get_master_clients', { p_master_id: user.id }),
    getCooldownIds(admin, user.id),
  ]);

  const eligible = (clientsRes.data ?? []).filter((c: ClientRow) =>
    c.client_id && !cooldownIds.has(c.client_id) && matchesTagFilters(c, tagFilters),
  );

  const sliced = eligible.slice(page * pageSize, (page + 1) * pageSize);
  const clients: ClientPreview[] = sliced.map((c: ClientRow) => ({
    clientId:        c.client_id as string,
    name:            c.client_name,
    phone:           c.client_phone,
    retentionStatus: c.retention_status,
    isVip:           c.is_vip,
    totalVisits:     c.total_visits,
  }));

  return { count: eligible.length, clients, hasMore: (page + 1) * pageSize < eligible.length };
}

export async function resolveTagClientIds(tagFilters: BroadcastTagFilter[]): Promise<string[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const admin = createAdminClient();
  const [clientsRes, cooldownIds] = await Promise.all([
    admin.rpc('get_master_clients', { p_master_id: user.id }),
    getCooldownIds(admin, user.id),
  ]);

  return (clientsRes.data ?? [])
    .filter((c: ClientRow) =>
      c.client_id && !cooldownIds.has(c.client_id) && matchesTagFilters(c, tagFilters),
    )
    .map((c: ClientRow) => c.client_id as string);
}

export async function getClientsForPicker(
  search = '',
  page = 0,
  pageSize = 20,
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { count: 0, clients: [] as ClientPreview[], hasMore: false };

  const admin = createAdminClient();
  const [clientsRes, cooldownIds] = await Promise.all([
    admin.rpc('get_master_clients', { p_master_id: user.id }),
    getCooldownIds(admin, user.id),
  ]);

  const q = search.toLowerCase();
  const eligible = (clientsRes.data ?? []).filter((c: ClientRow) => {
    if (!c.client_id || cooldownIds.has(c.client_id)) return false;
    if (!q) return true;
    return c.client_name?.toLowerCase().includes(q) || c.client_phone?.includes(q);
  });

  const sliced = eligible.slice(page * pageSize, (page + 1) * pageSize);
  const clients: ClientPreview[] = sliced.map((c: ClientRow) => ({
    clientId:        c.client_id as string,
    name:            c.client_name,
    phone:           c.client_phone,
    retentionStatus: c.retention_status,
    isVip:           c.is_vip,
    totalVisits:     c.total_visits,
  }));

  return { count: eligible.length, clients, hasMore: (page + 1) * pageSize < eligible.length };
}

export async function sendBroadcast(broadcastId: string, clientIds: string[]) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthorized' };
  if (!clientIds.length) return { error: 'Оберіть хоча б одного клієнта' };

  const admin = createAdminClient();

  // ── 1. Load broadcast + master profile ───────────────────────────────────
  const [broadcastRes, mpRes, masterProfileRes] = await Promise.all([
    admin.from('broadcasts').select('*')
      .eq('id', broadcastId).eq('master_id', user.id).eq('status', 'draft').single(),
    admin.from('master_profiles').select('subscription_tier, broadcasts_used, slug')
      .eq('id', user.id).single(),
    admin.from('profiles').select('full_name').eq('id', user.id).single(),
  ]);

  const broadcast = broadcastRes.data;
  const mp = mpRes.data;
  if (!broadcast) return { error: 'Розсилку не знайдено або вже відправлено' };
  if (!mp) return { error: 'Профіль не знайдено' };

  const masterName = masterProfileRes.data?.full_name ?? 'Майстер';

  // ── 2. Starter limit check ────────────────────────────────────────────────
  const isStarter = (mp.subscription_tier ?? 'starter') === 'starter';
  if (isStarter && (mp.broadcasts_used ?? 0) >= STARTER_BROADCAST_LIMIT) {
    return { error: 'STARTER_LIMIT' };
  }

  // ── 3. Resolve client data + apply cooldown safety check ─────────────────
  const [clientsRes, cooldownIds] = await Promise.all([
    admin.rpc('get_master_clients', { p_master_id: user.id }),
    getCooldownIds(admin, user.id),
  ]);

  const clientIdSet = new Set(clientIds);
  const filtered = (clientsRes.data ?? []).filter((c: ClientRow) =>
    c.client_id && clientIdSet.has(c.client_id) && !cooldownIds.has(c.client_id),
  );

  if (filtered.length === 0) {
    return { error: 'Немає клієнтів для розсилки (або всі в cooldown 72год)' };
  }

  // ── 4. Mark as sending ────────────────────────────────────────────────────
  await admin.from('broadcasts').update({ status: 'sending' }).eq('id', broadcastId);

  // ── 5. Build target URL ───────────────────────────────────────────────────
  const targetUrl = buildUrl(mp.slug, broadcast.service_link_id, broadcast.product_link_id);

  // ── 6. Send to each client ────────────────────────────────────────────────
  let successCount = 0;

  for (const client of filtered) {
    const clientId = client.client_id as string;
    const phone    = client.client_phone;

    const code     = generateShortCode();
    const shortUrl = `${SITE_URL}/r/${code}`;

    const message = personalizeMessage(broadcast.message_template, {
      name:     client.client_name ?? 'Клієнте',
      visits:   client.total_visits,
      discount: broadcast.discount_percent,
    });

    const fullSmsMessage = broadcast.discount_percent
      ? `${message}\n\nОтримати знижку ${broadcast.discount_percent}%: ${shortUrl}`
      : `${message}\n\n${shortUrl}`;

    const tgText = broadcast.discount_percent
      ? `${escHtml(message)}\n\n<a href="${shortUrl}">Отримати знижку ${broadcast.discount_percent}%</a>`
      : `${escHtml(message)}\n\n<a href="${shortUrl}">Записатись</a>`;

    const { data: recipient } = await admin
      .from('broadcast_recipients')
      .insert({ broadcast_id: broadcastId, client_id: clientId, phone })
      .select('id').single();

    if (!recipient) continue;

    await admin.from('broadcast_links').insert({
      code, broadcast_id: broadcastId, recipient_id: recipient.id, target_url: targetUrl,
    });

    if (broadcast.discount_percent) {
      const expiresAt = new Date(
        Date.now() + (broadcast.discount_expires_days ?? 3) * 24 * 60 * 60 * 1000
      ).toISOString();
      await admin.from('phone_discounts').insert({
        broadcast_id: broadcastId, master_id: user.id, phone,
        service_id: broadcast.discount_service_id ?? null,
        discount_percent: broadcast.discount_percent, expires_at: expiresAt,
      });
    }

    const { pushDelivered, telegramSent, smsSent } = await notifyClientBroadcast({
      clientId, phone,
      channels:     broadcast.channels as string[],
      pushTitle:    broadcast.title,
      pushBody:     message,
      pushUrl:      targetUrl,
      telegramText: tgText,
      smsText:      fullSmsMessage.slice(0, 160),
      masterName,
      shortUrl,
    });

    await admin.from('broadcast_recipients')
      .update({ push_sent: pushDelivered, telegram_sent: telegramSent, sms_sent: smsSent })
      .eq('id', recipient.id);

    successCount++;
  }

  // ── 7. Mark as sent + update counters ────────────────────────────────────
  await Promise.all([
    admin.from('broadcasts').update({
      status: 'sent', recipients_count: successCount, sent_at: new Date().toISOString(),
    }).eq('id', broadcastId),
    admin.from('master_profiles').update({
      broadcasts_used: (mp.broadcasts_used ?? 0) + 1,
    }).eq('id', user.id),
  ]);

  revalidatePath('/dashboard/marketing');
  return { ok: true, sent: successCount };
}

export async function getBroadcastDeliveryResults(broadcastId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const admin = createAdminClient();

  // Verify ownership
  const { data: bc } = await admin.from('broadcasts').select('id')
    .eq('id', broadcastId).eq('master_id', user.id).single();
  if (!bc) return null;

  const { data: recipients } = await admin
    .from('broadcast_recipients')
    .select('client_id, phone, push_sent, telegram_sent, sms_sent')
    .eq('broadcast_id', broadcastId)
    .order('created_at');

  if (!recipients?.length) return [] as DeliveryResult[];

  const clientIds = recipients.map(r => r.client_id).filter(Boolean) as string[];
  const { data: profileNames } = await admin
    .from('profiles').select('id, full_name').in('id', clientIds);

  const nameMap = new Map((profileNames ?? []).map(p => [p.id as string, p.full_name as string]));

  return recipients.map(r => ({
    clientId:     r.client_id as string,
    name:         nameMap.get(r.client_id as string) ?? r.phone,
    phone:        r.phone,
    pushSent:     r.push_sent,
    telegramSent: r.telegram_sent,
    smsSent:      r.sms_sent,
  })) as DeliveryResult[];
}

export async function getBroadcasts() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: [] };

  const admin = createAdminClient();

  const { data } = await admin
    .from('broadcasts')
    .select('*')
    .eq('master_id', user.id)
    .order('created_at', { ascending: false });

  return { data: data ?? [] };
}

export async function getBroadcastAnalytics(broadcastId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const admin = createAdminClient();

  const { data: recipients } = await admin
    .from('broadcast_recipients')
    .select('push_sent, telegram_sent, sms_sent, clicked_at, booked_at, discount_used_at')
    .eq('broadcast_id', broadcastId)
    .in('broadcast_id',
      (await admin.from('broadcasts').select('id').eq('master_id', user.id).eq('id', broadcastId))
        .data?.map(b => b.id) ?? []
    );

  if (!recipients) return null;

  const sent    = recipients.length;
  const clicked = recipients.filter(r => r.clicked_at).length;
  const booked  = recipients.filter(r => r.booked_at).length;

  return {
    sent,
    push_sent:     recipients.filter(r => r.push_sent).length,
    telegram_sent: recipients.filter(r => r.telegram_sent).length,
    sms_sent:      recipients.filter(r => r.sms_sent).length,
    clicked,
    booked,
    discount_used: recipients.filter(r => r.discount_used_at).length,
    conversion_pct: sent > 0 ? Math.round((booked / sent) * 100) : 0,
  };
}

export async function getActivePhoneDiscount(phone: string, masterId: string, serviceId?: string) {
  const admin = createAdminClient();

  const { data } = await admin
    .from('phone_discounts')
    .select('id, discount_percent, service_id, expires_at')
    .eq('phone', phone)
    .eq('master_id', masterId)
    .is('used_at', null)
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })
    .limit(1);

  if (!data || data.length === 0) return null;

  const d = data[0];
  // If discount is service-specific, must match
  if (d.service_id && serviceId && d.service_id !== serviceId) return null;

  return { id: d.id as string, discount_percent: d.discount_percent as number, service_id: d.service_id as string | null };
}
