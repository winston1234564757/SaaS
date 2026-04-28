'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export async function approvePortfolioConsent(itemId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const admin = createAdminClient();

  const { data: item } = await admin
    .from('portfolio_items')
    .select('tagged_client_id')
    .eq('id', itemId)
    .single();

  if (!item || item.tagged_client_id !== user.id) return { error: 'forbidden' };

  await admin
    .from('portfolio_items')
    .update({ consent_status: 'approved' })
    .eq('id', itemId);

  // Mark related notification as read
  await admin
    .from('notifications')
    .update({ is_read: true })
    .eq('recipient_id', user.id)
    .eq('type', 'portfolio_consent_request');

  revalidatePath('/my');
  return { ok: true };
}

export async function declinePortfolioConsent(itemId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const admin = createAdminClient();

  const { data: item } = await admin
    .from('portfolio_items')
    .select('tagged_client_id')
    .eq('id', itemId)
    .single();

  if (!item || item.tagged_client_id !== user.id) return { error: 'forbidden' };

  // Remove client tag, publish without client association
  await admin
    .from('portfolio_items')
    .update({ tagged_client_id: null, consent_status: 'declined' })
    .eq('id', itemId);

  await admin
    .from('notifications')
    .update({ is_read: true })
    .eq('recipient_id', user.id)
    .eq('type', 'portfolio_consent_request');

  revalidatePath('/my');
  return { ok: true };
}
