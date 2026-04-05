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

  // Only process successful payments
  if (transactionStatus === 'Approved') {
    const parts = orderReference.split('_');
    const tier  = parts[1] as 'pro' | 'studio';
    const uid32 = parts[2];

    if ((tier === 'pro' || tier === 'studio') && uid32?.length === 32) {
      const userId = flatUidToUuid(uid32);
      const supabase = createAdminClient();

      // CR-03: Idempotency — skip if this webhook was already processed
      const { data: existing } = await supabase
        .from('payments')
        .select('id')
        .eq('provider', 'wayforpay')
        .eq('external_reference', orderReference)
        .maybeSingle();

      if (!existing) {
        const { error: paymentError } = await supabase.from('payments').insert({
          provider:           'wayforpay',
          external_reference: orderReference,
          master_id:          userId,
          tier,
        });

        if (paymentError && paymentError.code !== '23505') {
          // 23505 = concurrent webhook race — UNIQUE constraint caught it, safe to ignore
          console.error('[wayforpay-webhook] payment insert failed:', paymentError.message);
        }
        if (!paymentError) {
          const { error: updateError } = await supabase
            .from('master_profiles')
            .update({
              subscription_tier:       tier,
              subscription_expires_at: new Date(Date.now() + 31 * 24 * 60 * 60 * 1000).toISOString(),
            })
            .eq('id', userId);
          if (updateError) {
            console.error('[wayforpay-webhook] subscription update failed:', updateError.message, { userId, tier });
          }
        }
      }
    }
  }

  // WayForPay requires this exact response
  const now = Math.floor(Date.now() / 1000);
  const responseSig = hmacMd5([orderReference, 'accept', now].join(';'), SECRET);

  return NextResponse.json({
    orderReference,
    status: 'accept',
    time: now,
    signature: responseSig,
  });
}
