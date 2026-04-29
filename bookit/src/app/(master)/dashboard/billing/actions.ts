'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

const MONO_TOKEN = process.env.MONO_API_KEY!;

const APP_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ??
  process.env.NEXT_PUBLIC_APP_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : null) ??
  'https://bookit-five-psi.vercel.app'
);

const PLAN: Record<string, { priceKopecks: number; name: string }> = {
  pro:    { priceKopecks: 70000, name: 'Bookit Pro — підписка на місяць' },
  studio: { priceKopecks: 29900, name: 'Bookit Studio — підписка за майстра/місяць' },
};

// ── Monobank Acquiring ────────────────────────────────────────────────────────
export async function createMonoInvoice(
  tier: 'pro' | 'studio'
): Promise<{ invoiceUrl: string } | { error: string }> {
  try {
    if (!MONO_TOKEN) {
      console.error('[createMonoInvoice] missing MONO_API_KEY');
      return { error: 'Monobank не налаштовано' };
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Unauthorized' };

    const plan = PLAN[tier];
    if (!plan) return { error: 'Невідомий тариф' };

    const uid = user.id.replace(/-/g, '');
    const reference = `bookit_${tier}_${uid}_${Math.floor(Date.now() / 1000)}`;

    const body = {
      amount: plan.priceKopecks,
      ccy: 980,
      type: 'subscription', // Hidden flag to trigger card token in webhook
      merchantPaymInfo: {
        reference,
        destination: plan.name,
        comment: `Оплата тарифу ${tier === 'pro' ? 'Pro' : 'Studio'} на 1 місяць`,
        basketOrder: [{
          name: plan.name,
          qty: 1,
          sum: plan.priceKopecks,
          unit: 'шт',
        }],
      },
      redirectUrl: `${APP_URL}/api/billing/paid`,
      webHookUrl:  `${APP_URL}/api/billing/mono-webhook`,
      validity:    3600,
      paymentType: 'debit',
      saveCardData: {
        saveCard: true,
        walletId: `bookit_${uid}`,
      },
    };

    console.log('[createMonoInvoice] creating invoice — reference:', reference, 'amount kopecks:', plan.priceKopecks);

    const res = await fetch('https://api.monobank.ua/api/merchant/invoice/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Token': MONO_TOKEN },
      body: JSON.stringify(body),
    });
    const json = await res.json() as { pageUrl?: string; errText?: string };
    console.log('[createMonoInvoice] Monobank response status:', res.status, '| pageUrl present:', !!json.pageUrl, '| errText:', json.errText ?? 'none');
    if (json.pageUrl) return { invoiceUrl: json.pageUrl };
    return { error: json.errText ?? 'Помилка Monobank' };
  } catch (e) {
    console.error('[createMonoInvoice] fatal:', String(e));
    return { error: 'Помилка створення рахунку' };
  }
}

// ── Recovery: populate master_subscriptions from Mono Wallet API ──────────────
// Called when a user has a paid plan but master_subscriptions is empty
// (e.g. old payment before walletData.cardToken fix).
// Mono keeps the tokenized card in their wallet — we retrieve it once.
export async function recoverCardToken(): Promise<{ ok: true; found: boolean } | { error: string }> {
  try {
    if (!MONO_TOKEN) return { error: 'Monobank не налаштовано' };

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Unauthorized' };

    const admin = createAdminClient();

    // Skip if subscription row already has a token
    const { data: existing } = await admin
      .from('master_subscriptions')
      .select('id, token')
      .eq('master_id', user.id)
      .eq('provider', 'monobank')
      .maybeSingle();

    if (existing?.token) {
      console.log('[recoverCardToken] token already present — skipping');
      return { ok: true, found: true };
    }

    // Get current plan and expiry from master_profiles
    const { data: mp } = await admin
      .from('master_profiles')
      .select('subscription_tier, subscription_expires_at')
      .eq('id', user.id)
      .maybeSingle();

    if (!mp || mp.subscription_tier === 'starter') {
      return { ok: true, found: false };
    }

    // Fetch tokenized cards from Mono Wallet API
    const uid = user.id.replace(/-/g, '');
    const walletId = `bookit_${uid}`;
    console.log('[recoverCardToken] fetching wallet — walletId:', walletId);

    const res = await fetch(
      `https://api.monobank.ua/api/merchant/wallet?walletId=${encodeURIComponent(walletId)}`,
      { headers: { 'X-Token': MONO_TOKEN } },
    );
    const json = await res.json() as { wallet?: { cardToken: string; maskedPan: string }[]; errText?: string };
    console.log('[recoverCardToken] wallet response status:', res.status, '| cards:', json.wallet?.length ?? 0, '| errText:', json.errText ?? 'none');

    const cards = json.wallet ?? [];
    if (cards.length === 0) {
      console.warn('[recoverCardToken] no cards in wallet — user must re-pay');
      return { ok: true, found: false };
    }

    const cardToken = cards[0].cardToken;
    // Use existing expiry or default to now+30d
    const expiresAt = mp.subscription_expires_at
      ?? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

    const { error: upsertErr } = await admin.from('master_subscriptions').upsert(
      {
        master_id:       user.id,
        provider:        'monobank',
        token:           cardToken,
        plan_id:         mp.subscription_tier,
        expires_at:      expiresAt,
        status:          'active',
        failed_attempts: 0,
        next_charge_at:  expiresAt,
        updated_at:      new Date().toISOString(),
      },
      { onConflict: 'master_id,provider' },
    );

    if (upsertErr) {
      console.error('[recoverCardToken] upsert error:', upsertErr.message);
      return { error: 'DB помилка' };
    }

    console.log('[recoverCardToken] recovered token for master:', user.id, '| maskedPan:', cards[0].maskedPan, '| next_charge_at:', expiresAt);
    return { ok: true, found: true };
  } catch (e) {
    console.error('[recoverCardToken] fatal:', String(e));
    return { error: 'Помилка відновлення картки' };
  }
}
