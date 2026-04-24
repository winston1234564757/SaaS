import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { hmacMd5 } from '@/lib/utils/wayforpay';
import { flatUidToUuid } from '@/lib/utils/uuid';

export const runtime = 'nodejs';

// ── Admin Supabase client — initialised inside handler (serverless-safe) ──────
function getAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(`Missing Supabase env vars: url=${!!url} key=${!!key}`);
  }
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

function buildAck(orderReference: string, secret: string) {
  const now = Math.floor(Date.now() / 1000);
  const signature = hmacMd5([orderReference, 'accept', now].join(';'), secret);
  return { orderReference, status: 'accept', time: now, signature };
}

// ── Handler ───────────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  console.log('[wfp-webhook] POST trigger started');

  try {
    const rawBody = await req.text();
    console.log('[wfp-webhook] rawBody length:', rawBody.length);

    // ── Parse body ─────────────────────────────────────────────────────────
    let body: Record<string, string>;
    try {
      body = JSON.parse(rawBody);
    } catch (e) {
      console.error('[wfp-webhook] JSON parse failed:', e);
      return NextResponse.json({ status: 'error', message: 'invalid json' }, { status: 400 });
    }
    console.log('[wfp-webhook] payload:', JSON.stringify(body));

    const secret = process.env.WAYFORPAY_MERCHANT_SECRET;
    if (!secret) {
      console.error('[wfp-webhook] WAYFORPAY_MERCHANT_SECRET is not set');
      return NextResponse.json({ status: 'error' }, { status: 500 });
    }

    const {
      merchantAccount, orderReference, amount, currency,
      authCode, cardPan, transactionStatus, reasonCode,
      merchantSignature, recToken,
    } = body;

    console.log('[WFP DEBUG] Full payload:', JSON.stringify(body));
    console.log('[WFP DEBUG] recToken present:', !!recToken, '| value:', recToken ?? 'MISSING');
    console.log('[WFP DEBUG] transactionStatus:', transactionStatus);

    // ── Signature validation ────────────────────────────────────────────────
    const sigStr = [
      merchantAccount, orderReference, amount, currency,
      authCode, cardPan, transactionStatus, reasonCode,
    ].join(';');
    const computedSig = hmacMd5(sigStr, secret);
    console.log('[wfp-webhook] computed sig:', computedSig, '| received sig:', merchantSignature);

    if (computedSig !== merchantSignature) {
      console.error('[wfp-webhook] signature check FAILED');
      return NextResponse.json({ status: 'error', message: 'bad signature' }, { status: 403 });
    }
    console.log('[wfp-webhook] signature check PASSED');

    if (transactionStatus !== 'Approved') {
      console.log('[wfp-webhook] non-Approved status:', transactionStatus, '— acking without processing');
      return NextResponse.json(buildAck(orderReference, secret));
    }

    // orderReference: bookit_{tier}_{uid32}_{timestamp}
    const parts = orderReference.split('_');
    const tier  = parts[1] as 'pro' | 'studio';
    const uid32 = parts[2];
    console.log('[wfp-webhook] parsed reference — tier:', tier, 'uid32 length:', uid32?.length);

    if ((tier !== 'pro' && tier !== 'studio') || uid32?.length !== 32) {
      console.error('[wfp-webhook] invalid reference format:', orderReference);
      return NextResponse.json(buildAck(orderReference, secret));
    }

    const userId = flatUidToUuid(uid32);
    console.log('[wfp-webhook] resolved userId:', userId);

    // ── Init admin client ───────────────────────────────────────────────────
    const admin = getAdmin();

    // ── Idempotency insert into billing_events ──────────────────────────────
    console.log('[wfp-webhook] inserting billing_event — orderReference:', orderReference);
    const { error: evtErr } = await admin.from('billing_events').insert({
      payment_id:  orderReference,
      external_id: orderReference,
      provider:    'wayforpay',
      master_id:   userId,
      tier,
      amount:      amount ? Math.round(parseFloat(amount) * 100) : null,
      status:      'success',
      payload:     body,
    });

    if (evtErr) {
      if (evtErr.code === '23505') {
        console.info('[wfp-webhook] duplicate — already processed:', orderReference);
        return NextResponse.json(buildAck(orderReference, secret));
      }
      console.error('[wfp-webhook] billing_events insert ERROR:', JSON.stringify(evtErr));
      return NextResponse.json({ status: 'error' }, { status: 500 });
    }
    console.log('[wfp-webhook] billing_events insert OK');

    // ── Fetch current master subscription state ─────────────────────────────
    const { data: mp, error: mpErr } = await admin
      .from('master_profiles')
      .select('id, subscription_expires_at')
      .eq('id', userId)
      .maybeSingle();

    console.log('[wfp-webhook] master_profiles fetch — found:', !!mp, 'error:', mpErr?.message ?? 'none');

    if (mpErr || !mp) {
      console.error('[wfp-webhook] master not found in master_profiles — userId:', userId);
      return NextResponse.json(buildAck(orderReference, secret));
    }

    // ── Compute new expiry ──────────────────────────────────────────────────
    const base = mp.subscription_expires_at && new Date(mp.subscription_expires_at) > new Date()
      ? new Date(mp.subscription_expires_at)
      : new Date();
    base.setDate(base.getDate() + 30);
    const expiresAt = base.toISOString();

    // ── Update master_profiles tier + expiry ────────────────────────────────
    console.log('[wfp-webhook] updating master_profiles — tier:', tier, 'expires_at:', expiresAt);
    const { error: upErr } = await admin
      .from('master_profiles')
      .update({ subscription_tier: tier, subscription_expires_at: expiresAt })
      .eq('id', userId);

    if (upErr) {
      console.error('[wfp-webhook] master_profiles update ERROR:', JSON.stringify(upErr));
    } else {
      console.log('[wfp-webhook] master_profiles update OK');
    }

    // ── Upsert recToken into token vault ────────────────────────────────────
    if (recToken) {
      console.log('[wfp-webhook] upserting recToken into master_subscriptions');
      const { error: tokenErr } = await admin.from('master_subscriptions').upsert(
        {
          master_id:       userId,
          provider:        'wayforpay',
          token:           recToken,
          plan_id:         tier,
          expires_at:      expiresAt,
          status:          'active',
          failed_attempts: 0,
          next_charge_at:  expiresAt,
          updated_at:      new Date().toISOString(),
        },
        { onConflict: 'master_id,provider' },
      );
      if (tokenErr) {
        console.error('[wfp-webhook] master_subscriptions upsert ERROR:', JSON.stringify(tokenErr));
      } else {
        console.log('[wfp-webhook] master_subscriptions upsert OK');
      }
    }

    console.log('[wfp-webhook] completed successfully');
    return NextResponse.json(buildAck(orderReference, secret));

  } catch (fatal) {
    console.error('[WEBHOOK FATAL ERROR] wfp-webhook threw:', fatal);
    return NextResponse.json({ status: 'error' }, { status: 500 });
  }
}
