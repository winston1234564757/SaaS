import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { createAdminClient } from '@/lib/supabase/admin';
import { flatUidToUuid } from '@/lib/utils/uuid';

// Cache Monobank public key with 24h TTL.
// On verification failure the key is force-refreshed once to handle key rotation.
const PUBKEY_TTL_MS = 24 * 60 * 60 * 1000;
let pubKeyCache: { key: string; fetchedAt: number } | null = null;

async function getMonoPubKey(forceRefresh = false): Promise<string | null> {
  if (!forceRefresh && pubKeyCache && Date.now() - pubKeyCache.fetchedAt < PUBKEY_TTL_MS) {
    return pubKeyCache.key;
  }
  try {
    const res = await fetch('https://api.monobank.ua/api/merchant/pubkey', {
      headers: { 'X-Token': process.env.MONO_API_KEY! },
    });
    const json = await res.json();
    if (json.key) {
      pubKeyCache = { key: json.key, fetchedAt: Date.now() };
      return pubKeyCache.key;
    }
    return null;
  } catch {
    return null;
  }
}

function verifyWithKey(rawBody: string, xSign: string, pubKeyBase64: string): boolean {
  try {
    const pubKey = crypto.createPublicKey({
      key: Buffer.from(pubKeyBase64, 'base64'),
      format: 'der',
      type: 'spki',
    });
    return crypto.verify(
      null, // Ed25519 — no digest algo needed
      Buffer.from(rawBody),
      pubKey,
      Buffer.from(xSign, 'base64'),
    );
  } catch {
    return false;
  }
}

async function verifyMonoSignature(rawBody: string, xSign: string): Promise<boolean> {
  const pubKeyBase64 = await getMonoPubKey();
  if (!pubKeyBase64) return false;

  if (verifyWithKey(rawBody, xSign, pubKeyBase64)) return true;

  // Verification failed — Monobank may have rotated the key. Force-refresh and retry once.
  const freshKey = await getMonoPubKey(true);
  if (!freshKey || freshKey === pubKeyBase64) return false;
  return verifyWithKey(rawBody, xSign, freshKey);
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const xSign = req.headers.get('x-sign') ?? '';

  if (!xSign) {
    return NextResponse.json({ status: 'error', message: 'missing signature' }, { status: 400 });
  }

  const valid = await verifyMonoSignature(rawBody, xSign);
  if (!valid) {
    console.error('[mono-webhook] invalid signature');
    return NextResponse.json({ status: 'error', message: 'bad signature' }, { status: 400 });
  }

  let body: Record<string, unknown>;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ status: 'error' }, { status: 400 });
  }

  // Mono sends: { invoiceId, status, amount, ccy, reference, ... }
  const { status, reference, invoiceId } = body as {
    status: string;
    reference: string;
    invoiceId: string;
  };

  if (status !== 'success' || typeof reference !== 'string' || typeof invoiceId !== 'string') {
    return NextResponse.json({ status: 'ok' });
  }

  // reference format: bookit_{tier}_{uid32}_{timestamp}
  const parts = reference.split('_');
  const tier  = parts[1] as 'pro' | 'studio';
  const uid32 = parts[2];

  if ((tier !== 'pro' && tier !== 'studio') || uid32?.length !== 32) {
    return NextResponse.json({ status: 'ok' });
  }

  const userId = flatUidToUuid(uid32);
  const admin = createAdminClient();

  // ── Idempotency check — atomic INSERT prevents double-processing on retries ──
  const { error: idempotencyError } = await admin
    .from('billing_events')
    .insert({ payment_id: invoiceId, provider: 'monobank', master_id: userId, tier });

  if (idempotencyError) {
    if (idempotencyError.code === '23505') {
      // Duplicate key — already processed. Ack silently.
      console.info('[mono-webhook] duplicate invoiceId ignored:', invoiceId);
      return NextResponse.json({ status: 'ok' });
    }
    console.error('[mono-webhook] billing_events insert failed:', idempotencyError.message);
    // Don't ack — let Mono retry so we can process it later
    return NextResponse.json({ status: 'error' }, { status: 500 });
  }

  // ── Verify master exists ──────────────────────────────────────────────────────
  const { data: mp, error: selectError } = await admin
    .from('master_profiles')
    .select('subscription_expires_at')
    .eq('id', userId)
    .maybeSingle();

  if (selectError) {
    console.error('[mono-webhook] master_profiles select failed:', selectError.message, { userId });
    return NextResponse.json({ status: 'ok' });
  }
  if (!mp) {
    console.error('[mono-webhook] userId not found in master_profiles:', userId);
    return NextResponse.json({ status: 'ok' });
  }

  // ── Extend subscription — stack on top of existing expiry ────────────────────
  const base = mp.subscription_expires_at && new Date(mp.subscription_expires_at) > new Date()
    ? new Date(mp.subscription_expires_at)
    : new Date();
  base.setDate(base.getDate() + 30);

  const { error: updateError } = await admin
    .from('master_profiles')
    .update({ subscription_tier: tier, subscription_expires_at: base.toISOString() })
    .eq('id', userId);

  if (updateError) {
    console.error('[mono-webhook] subscription update failed:', updateError.message, { userId, tier });
  }

  return NextResponse.json({ status: 'ok' });
}
