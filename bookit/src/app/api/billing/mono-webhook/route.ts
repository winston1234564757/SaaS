import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { createAdminClient } from '@/lib/supabase/admin';

// Cache the Monobank public key in memory (refreshed on cold start)
let cachedMonoPubKey: string | null = null;

async function getMonoPubKey(): Promise<string | null> {
  if (cachedMonoPubKey) return cachedMonoPubKey;
  try {
    const res = await fetch('https://api.monobank.ua/api/merchant/pubkey', {
      headers: { 'X-Token': process.env.MONO_API_KEY! },
    });
    const json = await res.json();
    cachedMonoPubKey = json.key ?? null;
    return cachedMonoPubKey;
  } catch {
    return null;
  }
}

async function verifyMonoSignature(rawBody: string, xSign: string): Promise<boolean> {
  const pubKeyBase64 = await getMonoPubKey();
  if (!pubKeyBase64) return false;
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
      Buffer.from(xSign, 'base64')
    );
  } catch {
    return false;
  }
}

function flatUidToUuid(flat: string): string {
  return [
    flat.slice(0, 8),
    flat.slice(8, 12),
    flat.slice(12, 16),
    flat.slice(16, 20),
    flat.slice(20),
  ].join('-');
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
  const { status, reference } = body as { status: string; reference: string };

  if (status === 'success' && typeof reference === 'string') {
    // reference format: bookit_{tier}_{uid32}_{timestamp}
    const parts = reference.split('_');
    const tier  = parts[1] as 'pro' | 'studio';
    const uid32 = parts[2];

    if ((tier === 'pro' || tier === 'studio') && uid32?.length === 32) {
      const userId = flatUidToUuid(uid32);
      const admin = createAdminClient();

      const { data: mp } = await admin
        .from('master_profiles')
        .select('subscription_expires_at')
        .eq('id', userId)
        .single();

      const currentExpiry = mp?.subscription_expires_at
        ? new Date(mp.subscription_expires_at)
        : new Date();
      if (currentExpiry < new Date()) currentExpiry.setTime(Date.now());
      currentExpiry.setDate(currentExpiry.getDate() + 31);

      await admin
        .from('master_profiles')
        .update({
          subscription_tier: tier,
          subscription_expires_at: currentExpiry.toISOString(),
        })
        .eq('id', userId);
    }
  }

  return NextResponse.json({ status: 'ok' });
}
