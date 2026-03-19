import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { createAdminClient } from '@/lib/supabase/admin';

const MERCHANT = process.env.WAYFORPAY_MERCHANT_ACCOUNT!;
const SECRET   = process.env.WAYFORPAY_MERCHANT_SECRET!;

function hmacMd5(str: string): string {
  return crypto.createHmac('md5', SECRET).update(str).digest('hex');
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

  if (hmacMd5(sigStr) !== merchantSignature) {
    return NextResponse.json({ status: 'error', message: 'bad signature' }, { status: 400 });
  }

  // Only process successful payments
  if (transactionStatus === 'Approved') {
    // orderReference format: bookit_{tier}_{uid32}_{timestamp}
    const parts = orderReference.split('_');
    const tier  = parts[1] as 'pro' | 'studio';
    const uid32 = parts[2];

    if ((tier === 'pro' || tier === 'studio') && uid32?.length === 32) {
      const userId = flatUidToUuid(uid32);
      const supabase = createAdminClient();
      await supabase
        .from('master_profiles')
        .update({
          subscription_tier: tier,
          subscription_expires_at: new Date(Date.now() + 31 * 24 * 60 * 60 * 1000).toISOString(),
        })
        .eq('id', userId);
    }
  }

  // WayForPay requires this exact response
  const now = Math.floor(Date.now() / 1000);
  const responseSig = hmacMd5([orderReference, 'accept', now].join(';'));

  return NextResponse.json({
    orderReference,
    status: 'accept',
    time: now,
    signature: responseSig,
  });
}
