import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { flatUidToUuid } from '@/lib/utils/uuid';
import { hmacMd5 } from '@/lib/utils/wayforpay';

const MERCHANT = process.env.WAYFORPAY_MERCHANT_ACCOUNT!;
const SECRET   = process.env.WAYFORPAY_MERCHANT_SECRET!;

export async function POST(req: NextRequest) {
  let body: Record<string, string>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ status: 'error' }, { status: 400 });
  }

  const {
    merchantAccount, orderReference, amount, currency,
    authCode, cardPan, transactionStatus, reasonCode,
    merchantSignature,
  } = body;

  // Verify incoming signature
  const sigStr = [
    merchantAccount, orderReference, amount, currency,
    authCode, cardPan, transactionStatus, reasonCode,
  ].join(';');

  if (hmacMd5(sigStr, SECRET) !== merchantSignature) {
    return NextResponse.json({ status: 'error', message: 'bad signature' }, { status: 400 });
  }

  if (transactionStatus !== 'Approved') {
    // Ack non-success events so WayForPay stops retrying
    return NextResponse.json(buildAck(orderReference, SECRET));
  }

  // orderReference format: bookit_{tier}_{uid32}_{timestamp}
  const parts = orderReference.split('_');
  const tier  = parts[1] as 'pro' | 'studio';
  const uid32 = parts[2];

  if ((tier !== 'pro' && tier !== 'studio') || uid32?.length !== 32) {
    return NextResponse.json(buildAck(orderReference, SECRET));
  }

  const userId = flatUidToUuid(uid32);
  const admin = createAdminClient();

  // ── Idempotency check — atomic INSERT prevents double-processing on retries ──
  const { error: idempotencyError } = await admin
    .from('billing_events')
    .insert({ payment_id: orderReference, provider: 'wayforpay', master_id: userId, tier });

  if (idempotencyError) {
    if (idempotencyError.code === '23505') {
      console.info('[wayforpay-webhook] duplicate orderReference ignored:', orderReference);
      return NextResponse.json(buildAck(orderReference, SECRET));
    }
    console.error('[wayforpay-webhook] billing_events insert failed:', idempotencyError.message);
    return NextResponse.json({ status: 'error' }, { status: 500 });
  }

  // ── Verify master exists ──────────────────────────────────────────────────────
  const { data: mp, error: selectError } = await admin
    .from('master_profiles')
    .select('subscription_expires_at')
    .eq('id', userId)
    .maybeSingle();

  if (selectError) {
    console.error('[wayforpay-webhook] master_profiles select failed:', selectError.message, { userId });
    return NextResponse.json(buildAck(orderReference, SECRET));
  }
  if (!mp) {
    console.error('[wayforpay-webhook] userId not found in master_profiles:', userId);
    return NextResponse.json(buildAck(orderReference, SECRET));
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
    console.error('[wayforpay-webhook] subscription update failed:', updateError.message, { userId, tier });
  }

  return NextResponse.json(buildAck(orderReference, SECRET));
}

function buildAck(orderReference: string, secret: string) {
  const now = Math.floor(Date.now() / 1000);
  const signature = hmacMd5([orderReference, 'accept', now].join(';'), secret);
  return { orderReference, status: 'accept', time: now, signature };
}
