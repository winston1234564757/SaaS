'use server';

import { createAdminClient } from '@/lib/supabase/admin';

// ── Генератор коду (8 символів, base36, crypto-safe) ─────────────

function generateCode(length = 8): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  return Array.from(bytes)
    .map(b => chars[b % chars.length])
    .join('');
}

// ── getOrCreateReferralLink ───────────────────────────────────────

/**
 * Повертає існуючий або створює новий реферальний лінк.
 *
 * - B2B: Master → Master (ownerId = master user id, role='master')
 * - C2M: Client → Master (ownerId = client user id, role='client')
 * - C2C: Client → Client до конкретного майстра (потрібен targetMasterId)
 */
export async function getOrCreateReferralLink(
  ownerId: string,
  role: 'master' | 'client',
  targetType: 'B2B' | 'C2M' | 'C2C',
  targetMasterId?: string | null,
): Promise<
  | { success: true; code: string; link: string }
  | { success: false; error: string }
> {
  try {
    const admin = createAdminClient();
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? '';

    // Шукаємо існуючий лінк для цієї комбінації
    let query = admin
      .from('referral_links')
      .select('code')
      .eq('owner_id', ownerId)
      .eq('target_type', targetType);

    if (targetMasterId) {
      query = query.eq('target_master_id', targetMasterId);
    } else {
      query = query.is('target_master_id', null);
    }

    const { data: existing } = await query.maybeSingle();
    if (existing) {
      return {
        success: true,
        code: existing.code,
        link: `${appUrl}/invite/${existing.code}`,
      };
    }

    // Створюємо новий — retry при коліжн (надзвичайно рідко)
    for (let attempt = 0; attempt < 5; attempt++) {
      const code = generateCode(8);
      const { error } = await admin.from('referral_links').insert({
        code,
        owner_id: ownerId,
        owner_role: role,
        target_type: targetType,
        target_master_id: targetMasterId ?? null,
      });

      if (!error) {
        return {
          success: true,
          code,
          link: `${appUrl}/invite/${code}`,
        };
      }

      // 23505 = unique_violation → спробуємо новий код
      if (error.code !== '23505') {
        return { success: false, error: error.message };
      }
    }

    return { success: false, error: 'Не вдалося згенерувати унікальний код' };
  } catch (e: unknown) {
    return { success: false, error: (e as Error)?.message ?? 'Невідома помилка' };
  }
}

// ── processRegistrationReferral ───────────────────────────────────

/**
 * Викликається після реєстрації нового майстра (newMasterId).
 *
 * B2B: власнику лінка (майстру) +30 днів до subscription_expires_at.
 * C2M: між клієнтом-власником та новим майстром → INSERT client_master_relations
 *       з loyalty_points = 500.
 */
export async function processRegistrationReferral(
  newMasterId: string,
  refCode: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const admin = createAdminClient();

    const { data: link } = await admin
      .from('referral_links')
      .select('owner_id, owner_role, target_type')
      .eq('code', refCode)
      .single();

    if (!link) return { success: false, error: 'Реферальний код не знайдено' };

    // ── B2B: Майстер запросив Майстра → +30 днів ─────────────────
    if (link.target_type === 'B2B' && link.owner_role === 'master') {
      const { data: mp } = await admin
        .from('master_profiles')
        .select('subscription_expires_at')
        .eq('id', link.owner_id)
        .single();

      const base = mp?.subscription_expires_at
        ? new Date(mp.subscription_expires_at)
        : new Date();
      base.setDate(base.getDate() + 30);

      const { error } = await admin
        .from('master_profiles')
        .update({ subscription_expires_at: base.toISOString() })
        .eq('id', link.owner_id);

      if (error) return { success: false, error: error.message };
      return { success: true };
    }

    // ── C2M: Клієнт запросив Майстра → 500 лоял. балів ───────────
    if (link.target_type === 'C2M' && link.owner_role === 'client') {
      // Гарантуємо запис у client_profiles
      await admin
        .from('client_profiles')
        .upsert({ id: link.owner_id }, { onConflict: 'id', ignoreDuplicates: true });

      // Upsert relation: якщо вже є — додаємо бали через rpc або вставляємо новий запис
      const { data: existing } = await admin
        .from('client_master_relations')
        .select('id, loyalty_points')
        .eq('client_id', link.owner_id)
        .eq('master_id', newMasterId)
        .maybeSingle();

      if (existing) {
        const { error } = await admin
          .from('client_master_relations')
          .update({ loyalty_points: (existing.loyalty_points ?? 0) + 500 })
          .eq('id', existing.id);
        if (error) return { success: false, error: error.message };
      } else {
        const { error } = await admin
          .from('client_master_relations')
          .insert({
            client_id: link.owner_id,
            master_id: newMasterId,
            loyalty_points: 500,
          });
        if (error) return { success: false, error: error.message };
      }

      return { success: true };
    }

    return {
      success: false,
      error: `Непідтримуваний тип реф-лінка для реєстрації: ${link.target_type}`,
    };
  } catch (e: unknown) {
    return { success: false, error: (e as Error)?.message ?? 'Невідома помилка' };
  }
}
