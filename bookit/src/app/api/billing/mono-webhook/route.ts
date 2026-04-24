import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createPublicKey, verify as cryptoVerify } from 'node:crypto';
import { flatUidToUuid } from '@/lib/utils/uuid';

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

// Ed25519 SPKI DER header for raw 32-byte keys.
const ED25519_SPKI_PREFIX = Buffer.from('302a300506032b6570032100', 'hex');

function toSpkiBuffer(keyB64: string): Buffer {
  const raw = Buffer.from(keyB64, 'base64');
  if (raw.length === 32) {
    return Buffer.concat([ED25519_SPKI_PREFIX, raw]);
  }
  return raw;
}

function verifyEd25519(rawBody: string, xSignB64: string, pubKeyB64: string): boolean {
  try {
    const keyDer  = toSpkiBuffer(pubKeyB64);
    const sigBuf  = Buffer.from(xSignB64, 'base64');
    const bodyBuf = Buffer.from(rawBody);
    const pubKey  = createPublicKey({ key: keyDer, format: 'der', type: 'spki' });
    return cryptoVerify(null, bodyBuf, pubKey, sigBuf);
  } catch (e) {
    console.error('[mono-webhook] Ed25519 verify threw:', String(e));
    return false;
  }
}

// ── Admin client ──────────────────────────────────────────────────────────────
function getAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error(`Missing Supabase env: url=${!!url} key=${!!key}`);
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
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

    // ── Strict Ed25519 signature verification ─────────────────────────────────
    // Fetch pubkey; on first failure retry with a fresh key (handles key rotation).
    const pubKeyB64 = await getMonoPubKey();
    let sigValid = pubKeyB64 ? verifyEd25519(rawBody, xSign, pubKeyB64) : false;

    if (!sigValid && pubKeyB64) {
      console.log('[mono-webhook] sig failed — retrying with fresh key');
      const fresh = await getMonoPubKey(true);
      sigValid = fresh ? verifyEd25519(rawBody, xSign, fresh) : false;
    }

    console.log('[MONO DEBUG] Signature verification result:', sigValid, '| pubKeyPresent:', !!pubKeyB64);
    if (!sigValid) {
      console.error('[mono-webhook] signature INVALID — pubKeyPresent:', !!pubKeyB64, '— rejecting 403');
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
    console.log('[mono-webhook] payload:', JSON.stringify(body));

    console.log('[MONO DEBUG] Full payload:', JSON.stringify(body));
    console.log('[MONO DEBUG] recToken present:', !!(body as Record<string, unknown>).recToken);

    const { status, reference, invoiceId, amount, recToken } = body as {
      status?: string;
      reference?: string;
      invoiceId?: string;
      amount?: number;
      recToken?: string;
    };

    if (status !== 'success') {
      console.log('[mono-webhook] non-success status:', status, '— acking');
      return NextResponse.json({ status: 'ok' });
    }
    if (!reference || !invoiceId) {
      console.error('[mono-webhook] missing reference or invoiceId');
      return NextResponse.json({ status: 'ok' });
    }

    // reference: bookit_{tier}_{uid32}_{timestamp}
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
      console.error('[mono-webhook] billing_events insert ERROR:', JSON.stringify(evtErr));
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
      console.error('[mono-webhook] master_profiles update ERROR:', JSON.stringify(upErr));
    } else {
      console.log('[mono-webhook] master_profiles update OK');
    }

    // ── Upsert recToken + next_charge_at ──────────────────────────────────────
    if (recToken) {
      console.log('[mono-webhook] upserting recToken with next_charge_at');
      const { error: tokErr } = await admin.from('master_subscriptions').upsert(
        {
          master_id:      userId,
          provider:       'monobank',
          token:          recToken,
          plan_id:        tier,
          expires_at:     expiresAt,
          status:         'active',
          failed_attempts: 0,
          next_charge_at: expiresAt,
          updated_at:     new Date().toISOString(),
        },
        { onConflict: 'master_id,provider' },
      );
      if (tokErr) console.error('[mono-webhook] master_subscriptions upsert ERROR:', JSON.stringify(tokErr));
      else console.log('[mono-webhook] master_subscriptions upsert OK');
    }

    console.log('[mono-webhook] completed OK');
    return NextResponse.json({ status: 'ok' });

  } catch (fatal) {
    console.error('[WEBHOOK FATAL ERROR] mono-webhook:', String(fatal));
    return NextResponse.json({ status: 'error' }, { status: 500 });
  }
}
