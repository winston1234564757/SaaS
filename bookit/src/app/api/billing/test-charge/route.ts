import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { MonoProvider } from '@/lib/billing/MonoProvider';
import { WfpProvider } from '@/lib/billing/WfpProvider';
import { getBaseUrl } from '@/lib/utils/url';
import type { ProviderId } from '@/lib/billing/PaymentProvider';

const TEST_AMOUNT_KOPECKS = 500; // 5 UAH

export async function POST(req: NextRequest) {
  // Auth check — only authenticated masters can initiate a test charge
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: { provider: ProviderId; planId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { provider, planId = 'pro' } = body;
  if (provider !== 'monobank' && provider !== 'wayforpay') {
    return NextResponse.json({ error: 'provider must be monobank or wayforpay' }, { status: 400 });
  }
  if (planId !== 'pro' && planId !== 'studio') {
    return NextResponse.json({ error: 'planId must be pro or studio' }, { status: 400 });
  }

  const masterId = user.id;
  const uid32 = masterId.replace(/-/g, '');
  const ts = Date.now();
  const orderId = `bookit_${planId}_${uid32}_${ts}`;

  const base = getBaseUrl();
  const returnUrl = `${base}/dashboard/billing?status=pending`;
  const webhookUrl = provider === 'monobank'
    ? `${base}/api/billing/mono-webhook`
    : `${base}/api/billing/wfp-webhook`;

  try {
    const providerImpl = provider === 'monobank' ? new MonoProvider() : new WfpProvider();
    const result = await providerImpl.createCheckout({
      masterId,
      planId,
      amountKopecks: TEST_AMOUNT_KOPECKS,
      orderId,
      returnUrl,
      webhookUrl,
    });

    return NextResponse.json({ checkoutUrl: result.checkoutUrl, orderId: result.orderId });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[test-charge] provider error:', message);
    return NextResponse.json({ error: 'Provider error', detail: message }, { status: 502 });
  }
}
