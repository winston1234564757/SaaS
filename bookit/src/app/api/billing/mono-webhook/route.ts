import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
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
  let body: Record<string, unknown>;
  try {
    body = await req.json();
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
      const admin = getAdmin();

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
