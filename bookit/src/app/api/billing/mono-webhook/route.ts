import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createVerify } from 'node:crypto';
import { flatUidToUuid } from '@/lib/utils/uuid';
import { syncReferralAndBounty } from '@/lib/billing/syncReferralAndBounty';
import { notifyMasterBilling } from '@/lib/notifications';

export const runtime = 'nodejs';

// ── Public key cache ──────────────────────────────────────────────────────────
const PUBKEY_TTL_MS = 24 * 60 * 60 * 1000;
let pubKeyCache: { keyB64: string; fetchedAt: number } | null = null;

async function getMonoPubKey(forceRefresh = false): Promise<string | null> {
  if (!forceRefresh && pubKeyCache && Date.now() - pubKeyCache.fetchedAt < PUBKEY_TTL_MS) {
    return pubKeyCache.keyB64;
  }
  const apiKey = process.env.MONO_API_KEY;
  if (!apiKey) {
    console.error('[mono-webhook] MONO_API_KEY env var is not set');
    return null;
  }
  try {
    const res = await fetch('https://api.monobank.ua/api/merchant/pubkey', {
      headers: { 'X-Token': apiKey },
    });
    const json = (await res.json()) as { key?: string; errText?: string };
    console.log('[mono-webhook] pubkey fetch status:', res.status, '| key present:', !!json.key, '| errText:', json.errText ?? 'none');
    if (json.key) {
      pubKeyCache = { keyB64: json.key, fetchedAt: Date.now() };
      return json.key;
    }
    console.error('[mono-webhook] pubkey fetch returned no key:', JSON.stringify(json));
    return null;
  } catch (e) {
    console.error('[mono-webhook] pubkey fetch error:', e);
    return null;
  }
}

// Monobank uses ECDSA P-256 + SHA-256. The /pubkey response is a
// base64-encoded PEM file — decode → PEM string → createVerify('SHA256').
function verifyECDSA(rawBody: string, xSignB64: string, pubKeyB64: string): boolean {
  try {
    const pemText = Buffer.from(pubKeyB64, 'base64').toString('utf-8');
    console.log('[MONO] sig bytes:', Buffer.from(xSignB64, 'base64').length, '| body bytes:', Buffer.byteLength(rawBody));
    const verify = createVerify('SHA256');
    verify.update(Buffer.from(rawBody));
    const result = verify.verify(pemText, Buffer.from(xSignB64, 'base64'));
    console.log('[MONO] ECDSA verify result:', result);
    return result;
  } catch (e) {
    console.error('[mono-webhook] ECDSA verify threw:', String(e));
    return false;
  }
}

// ── Admin client ──────────────────────────────────────────────────────────────
const getAdmin = () => createAdminClient();

const RECURRING_MAX_FAILED_ATTEMPTS = 3;

// ── Recurring renewal settlement ────────────────────────────────────────────────
// Reconciles a signature-verified recurrent-charge webhook. reference is
// `recurring_{subId}_{YYYY}_{MM}` (subId is a UUID → no underscores). Idempotent via
// the UNIQUE billing_events.invoiceId: a webhook that races the cron's own success
// grant is de-duped and acked. Clears the charging_at / pending_invoice_id claim set
// by the cron so the row is no longer considered in-flight.
async function settleRecurringCharge(args: {
  reference: string;
  invoiceId?: string;
  status?: string;
  amount?: number;
  body: Record<string, unknown>;
}): Promise<NextResponse> {
  const { reference, invoiceId, status, amount, body } = args;
  const admin = getAdmin();

  if (!invoiceId) {
    console.warn('[mono-webhook] recurring webhook without invoiceId — acking:', reference);
    return NextResponse.json({ status: 'ok' });
  }

  const subId = reference.split('_')[1];
  if (!subId) {
    console.error('[mono-webhook] recurring reference missing subId:', reference);
    return NextResponse.json({ status: 'ok' });
  }

  const { data: sub, error: subErr } = await admin
    .from('master_subscriptions')
    .select('id, master_id, plan_id, failed_attempts')
    .eq('id', subId)
    .maybeSingle();

  if (subErr || !sub) {
    console.error('[mono-webhook] recurring sub not found:', subId, subErr?.message ?? '');
    return NextResponse.json({ status: 'ok' });
  }

  const tier = (sub.plan_id === 'studio' ? 'studio' : 'pro') as 'pro' | 'studio';

  // ── Non-success → reconcile the deferred pending charge as failed (dunning) ──
  if (status !== 'success') {
    const newAttempts = (sub.failed_attempts ?? 0) + 1;
    const isDunned    = newAttempts >= RECURRING_MAX_FAILED_ATTEMPTS;
    const subUpdate: Record<string, unknown> = {
      failed_attempts:    newAttempts,
      charging_at:        null,
      pending_invoice_id: null,
      updated_at:         new Date().toISOString(),
    };
    if (isDunned) subUpdate.status = 'past_due';
    await admin.from('master_subscriptions').update(subUpdate).eq('id', sub.id);
    if (isDunned) {
      await admin.from('master_profiles').update({ subscription_tier: 'starter' }).eq('id', sub.master_id);
    }
    const { error: evtErr } = await admin.from('billing_events').insert({
      payment_id:  invoiceId,
      external_id: invoiceId,
      provider:    'monobank',
      master_id:   sub.master_id,
      tier,
      amount:      typeof amount === 'number' ? amount : null,
      status:      'failure',
      payload:     body,
    });
    if (evtErr && evtErr.code !== '23505') {
      console.error('[mono-webhook] recurring failure event insert:', evtErr.message);
    }
    notifyMasterBilling(sub.master_id, 'subscription_failed').catch(e => console.error('[notifyMasterBilling]', e));
    if (isDunned) notifyMasterBilling(sub.master_id, 'subscription_downgraded').catch(e => console.error('[notifyMasterBilling]', e));
    console.warn(`[mono-webhook] recurring FAILURE settled — sub=${sub.id} attempts=${newAttempts} dunned=${isDunned}`);
    return NextResponse.json({ status: 'ok' });
  }

  // ── Success → grant one month, idempotent on the UNIQUE invoiceId ──
  const { error: evtErr } = await admin.from('billing_events').insert({
    payment_id:  invoiceId,
    external_id: invoiceId,
    provider:    'monobank',
    master_id:   sub.master_id,
    tier,
    amount:      typeof amount === 'number' ? amount : null,
    status:      'success',
    payload:     body,
  });
  if (evtErr) {
    if (evtErr.code === '23505') {
      console.info('[mono-webhook] recurring already settled (dup invoiceId):', invoiceId);
      return NextResponse.json({ status: 'ok' });
    }
    console.error('[mono-webhook] recurring billing_events insert ERROR:', evtErr.message);
    return NextResponse.json({ status: 'error' }, { status: 500 });
  }

  const { data: mp } = await admin
    .from('master_profiles')
    .select('subscription_expires_at')
    .eq('id', sub.master_id)
    .maybeSingle();

  const base = mp?.subscription_expires_at && new Date(mp.subscription_expires_at) > new Date()
    ? new Date(mp.subscription_expires_at)
    : new Date();
  base.setDate(base.getDate() + 30);
  const expiresAt = base.toISOString();

  await admin.from('master_profiles')
    .update({ subscription_tier: tier, subscription_expires_at: expiresAt })
    .eq('id', sub.master_id);

  await admin.from('master_subscriptions').update({
    status:             'active',
    failed_attempts:    0,
    next_charge_at:     expiresAt,
    expires_at:         expiresAt,
    charging_at:        null,
    pending_invoice_id: null,
    updated_at:         new Date().toISOString(),
  }).eq('id', sub.id);

  // Renewal → keep the referrer's monthly bounty/status in sync (matches the cron's
  // per-paid-month behavior; runs here only when the cron deferred a pending charge).
  await syncReferralAndBounty(sub.master_id);

  const expiresFormatted = new Date(expiresAt).toLocaleDateString('uk-UA', { day: 'numeric', month: 'long', year: 'numeric' });
  notifyMasterBilling(sub.master_id, 'subscription_paid', tier === 'pro' ? 'Pro' : 'Studio', expiresFormatted).catch(e => console.error('[notifyMasterBilling]', e));
  console.log(`[mono-webhook] recurring SUCCESS settled — sub=${sub.id} expires=${expiresAt}`);
  return NextResponse.json({ status: 'ok' });
}

// ── Handler ───────────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  console.log('[mono-webhook] POST received');

  try {
    const rawBody = await req.text();
    const xSign   = req.headers.get('x-sign') ?? '';
    console.log('[mono-webhook] body length:', rawBody.length, '| x-sign present:', !!xSign);

    if (!xSign) {
      console.error('[mono-webhook] missing x-sign header — rejecting');
      return NextResponse.json({ status: 'error', message: 'missing signature' }, { status: 403 });
    }

    // ── Strict ECDSA SHA-256 signature verification ───────────────────────────
    console.log('[MONO] Received X-Sign:', xSign);
    const pubKeyB64 = await getMonoPubKey();
    console.log('[MONO] Public Key Used:', pubKeyB64 ? pubKeyB64.slice(0, 40) + '...' : 'null — fetch failed');
    let sigValid = pubKeyB64 ? verifyECDSA(rawBody, xSign, pubKeyB64) : false;

    if (!sigValid && pubKeyB64) {
      console.log('[mono-webhook] sig failed — retrying with fresh key');
      const fresh = await getMonoPubKey(true);
      sigValid = fresh ? verifyECDSA(rawBody, xSign, fresh) : false;
    }

    console.log('[MONO] Sig valid:', sigValid);
    if (!sigValid) {
      console.error('[mono-webhook] signature INVALID — pubKeyPresent:', !!pubKeyB64, '| x-sign:', xSign, '— rejecting 403');
      return NextResponse.json({ status: 'error', message: 'bad signature' }, { status: 403 });
    }
    console.log('[mono-webhook] signature PASSED');

    // ── Parse payload ─────────────────────────────────────────────────────────
    let body: Record<string, unknown>;
    try {
      body = JSON.parse(rawBody);
    } catch {
      console.error('[mono-webhook] JSON parse failed');
      return NextResponse.json({ status: 'error' }, { status: 400 });
    }
    // Redact walletData before logging — it carries `cardToken`, the persistent
    // recurring-charge token. Logging the raw body would leak card tokens to
    // anyone with Vercel log access (R2 security P2). Keep the useful envelope.
    const { walletData: _redactedWallet, ...loggableBody } = body as Record<string, unknown>;
    console.log('[mono-webhook] payload:', JSON.stringify(loggableBody), _redactedWallet ? '| walletData: [redacted]' : '');

    const { status, reference, invoiceId, amount } = body as {
      status?: string;
      reference?: string;
      invoiceId?: string;
      amount?: number;
    };
    // Monobank stores card token under walletData.cardToken (not top-level recToken)
    const walletData = (body as Record<string, unknown>).walletData as
      { cardToken?: string; walletId?: string; status?: string } | undefined;
    const cardToken = walletData?.cardToken;

    // ── Recurring renewal reconciliation ──────────────────────────────────────
    // The billing cron initiates recurrent charges (reference: recurring_{subId}_{YYYY}_{MM})
    // and passes this webhook URL — the webhook is the authoritative settlement for
    // renewals (the cron only defers on a synchronous 'pending'). Handled BEFORE the
    // freshness/replay window below, whose `_(\d+)$` regex would misread the `_MM`
    // period suffix as a unix timestamp and wrongly reject it. First-payment refs
    // (bookit_{tier}_{uid32}_{ts}) fall through to the unchanged path below.
    if (reference && reference.startsWith('recurring_')) {
      return await settleRecurringCharge({ reference, invoiceId, status, amount, body });
    }

    if (status !== 'success') {
      console.log('[mono-webhook] non-success status:', status, '— acking');
      return NextResponse.json({ status: 'ok' });
    }
    if (!reference || !invoiceId) {
      console.error('[mono-webhook] missing reference or invoiceId');
      return NextResponse.json({ status: 'ok' });
    }

    // V-05: Replay attack prevention — reject webhooks older than 15 minutes.
    // reference format: bookit_{tier}_{uid32}_{timestamp}
    const FRESHNESS_WINDOW_MS = 15 * 60 * 1000;
    const tsMatch = (reference as string).match(/_(\d+)$/);
    if (tsMatch) {
      const webhookTs = parseInt(tsMatch[1], 10) * 1000;
      const ageMs = Math.abs(Date.now() - webhookTs);
      if (ageMs > FRESHNESS_WINDOW_MS) {
        console.warn('[mono-webhook] Stale webhook rejected — reference:', reference, '| age ms:', ageMs);
        return NextResponse.json({ error: 'stale_webhook' }, { status: 400 });
      }
    }

    const parts = reference.split('_');
    const tier  = parts[1] as 'pro' | 'studio';
    const uid32 = parts[2];
    console.log('[mono-webhook] tier:', tier, '| uid32 length:', uid32?.length);

    if ((tier !== 'pro' && tier !== 'studio') || uid32?.length !== 32) {
      console.error('[mono-webhook] bad reference format:', reference);
      return NextResponse.json({ status: 'ok' });
    }

    const userId = flatUidToUuid(uid32);
    console.log('[mono-webhook] userId:', userId);

    const admin = getAdmin();

    // ── billing_events insert (idempotency) ───────────────────────────────────
    const { error: evtErr } = await admin.from('billing_events').insert({
      payment_id:  invoiceId,
      external_id: invoiceId,
      provider:    'monobank',
      master_id:   userId,
      tier,
      amount:      typeof amount === 'number' ? amount : null,
      status:      'success',
      payload:     body,
    });

    if (evtErr) {
      if (evtErr.code === '23505') {
        console.info('[mono-webhook] duplicate invoiceId — already processed:', invoiceId);
        return NextResponse.json({ status: 'ok' });
      }
      console.error('[mono-webhook] billing_events insert ERROR:', evtErr.message, '| details:', evtErr.details);
      return NextResponse.json({ status: 'error' }, { status: 500 });
    }
    console.log('[mono-webhook] billing_events insert OK');

    // ── master_profiles — fetch current expiry ────────────────────────────────
    const { data: mp, error: mpErr } = await admin
      .from('master_profiles')
      .select('id, subscription_expires_at')
      .eq('id', userId)
      .maybeSingle();

    if (mpErr || !mp) {
      console.error('[mono-webhook] master not found for userId:', userId);
      return NextResponse.json({ status: 'ok' });
    }

    // ── Compute new expiry ────────────────────────────────────────────────────
    const base = mp.subscription_expires_at && new Date(mp.subscription_expires_at) > new Date()
      ? new Date(mp.subscription_expires_at)
      : new Date();
    base.setDate(base.getDate() + 30);
    const expiresAt = base.toISOString();

    // ── Update master_profiles ────────────────────────────────────────────────
    console.log('[mono-webhook] updating master_profiles — tier:', tier, 'expires:', expiresAt);
    const { error: upErr } = await admin
      .from('master_profiles')
      .update({ subscription_tier: tier, subscription_expires_at: expiresAt })
      .eq('id', userId);

    if (upErr) {
      console.error('[mono-webhook] master_profiles update ERROR:', upErr.message, '| details:', upErr.details);
    } else {
      console.log('[mono-webhook] master_profiles update OK');
      // Sync referral status + bounty for this master's referrer (first payment detection)
      await syncReferralAndBounty(userId);
    }

    // ── Upsert cardToken + next_charge_at ─────────────────────────────────────
    if (!cardToken) {
      console.error('[MONO] CRITICAL: Payment successful but walletData.cardToken missing — master:', userId, '| invoiceId:', invoiceId, '| walletData:', JSON.stringify(walletData));
    }
    if (cardToken) {
      console.log('[mono-webhook] upserting cardToken with next_charge_at | token prefix:', cardToken.slice(0, 8));
      const { error: tokErr } = await admin.from('master_subscriptions').upsert(
        {
          master_id:      userId,
          provider:       'monobank',
          token:          cardToken,
          plan_id:        tier,
          expires_at:     expiresAt,
          status:         'active',
          failed_attempts: 0,
          next_charge_at: expiresAt,
          updated_at:     new Date().toISOString(),
        },
        { onConflict: 'master_id,provider' },
      );
      if (tokErr) console.error('[mono-webhook] master_subscriptions upsert ERROR:', tokErr.message, '| details:', tokErr.details);
      else console.log('[mono-webhook] master_subscriptions upsert OK');
    }

    // Notify master about successful payment
    const expiresFormatted = new Date(expiresAt).toLocaleDateString('uk-UA', { day: 'numeric', month: 'long', year: 'numeric' });
    notifyMasterBilling(userId, 'subscription_paid', tier === 'pro' ? 'Pro' : 'Studio', expiresFormatted).catch(e => console.error('[notifyMasterBilling]', e));

    console.log('[mono-webhook] completed OK');
    return NextResponse.json({ status: 'ok' });

  } catch (fatal) {
    console.error('[WEBHOOK FATAL ERROR] mono-webhook:', String(fatal));
    return NextResponse.json({ status: 'error' }, { status: 500 });
  }
}
