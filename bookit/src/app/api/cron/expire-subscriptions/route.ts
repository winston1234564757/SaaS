import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { MonoProvider } from '@/lib/billing/MonoProvider';
import { WfpProvider } from '@/lib/billing/WfpProvider';
import type { PaymentProvider } from '@/lib/billing/PaymentProvider';

export const runtime = 'nodejs';

// ── Constants ─────────────────────────────────────────────────────────────────
const PLAN_KOPECKS: Record<string, number> = {
  pro:    70_000, // 700 UAH
  studio: 29_900, // 299 UAH
};
const MAX_FAILED_ATTEMPTS = 3;
const CHARGE_TIMEOUT_MS  = 8_000;
const BATCH_SIZE          = 50;

const APP_URL =
  process.env.NEXT_PUBLIC_SITE_URL ??
  process.env.NEXT_PUBLIC_APP_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : 'https://bookit-five-psi.vercel.app');

// ── Helpers ───────────────────────────────────────────────────────────────────
function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`Provider timeout after ${ms}ms`)), ms),
    ),
  ]);
}

function addDays(date: Date, days: number): string {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

// ── Subscription row shape returned by RPC ────────────────────────────────────
interface SubscriptionRow {
  id: string;
  master_id: string;
  provider: string;
  token: string;
  plan_id: string;
  failed_attempts: number;
}

// ── Cron handler ──────────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  if (req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const admin = createAdminClient();

  // Fetch-and-lock pending subscriptions (FOR UPDATE SKIP LOCKED)
  const { data: subscriptions, error: rpcErr } = await admin
    .rpc('get_pending_subscriptions_for_billing', { batch_size: BATCH_SIZE });

  if (rpcErr) {
    console.error('[charge-subscriptions] RPC error:', rpcErr.message);
    return NextResponse.json({ error: rpcErr.message }, { status: 500 });
  }

  if (!subscriptions || subscriptions.length === 0) {
    console.log('[charge-subscriptions] No pending subscriptions');
    return NextResponse.json({ ok: true, processed: 0, succeeded: 0, failed: 0 });
  }

  console.log(`[charge-subscriptions] Batch size: ${subscriptions.length}`);

  const providers: Record<string, PaymentProvider> = {
    monobank:  new MonoProvider(),
    wayforpay: new WfpProvider(),
  };

  const results = await Promise.allSettled(
    (subscriptions as SubscriptionRow[]).map(async (sub) => {
      const provider = providers[sub.provider];
      if (!provider) throw new Error(`Unknown provider: ${sub.provider}`);

      const amountKopecks = PLAN_KOPECKS[sub.plan_id];
      if (!amountKopecks) throw new Error(`Unknown plan_id: ${sub.plan_id}`);

      const orderId = `recurring_${sub.id}_${Date.now()}`;
      const webhookUrl = sub.provider === 'monobank'
        ? `${APP_URL}/api/billing/mono-webhook`
        : `${APP_URL}/api/billing/wfp-webhook`;

      let succeeded = false;
      let invoiceId: string | undefined;
      let chargeError: string | undefined;

      try {
        const result = await withTimeout(
          provider.chargeRecurrent({ token: sub.token, amountKopecks, orderId, webhookUrl }),
          CHARGE_TIMEOUT_MS,
        );
        // 'pending' is also fine — final confirmation comes via webhook
        succeeded = result.status !== 'failure';
        invoiceId = result.invoiceId;
      } catch (err) {
        chargeError = String(err);
      }

      const now = new Date();

      if (succeeded) {
        const expiresAt = addDays(now, 30);

        await Promise.all([
          admin.from('master_subscriptions').update({
            status:          'active',
            failed_attempts: 0,
            next_charge_at:  expiresAt,
            expires_at:      expiresAt,
            updated_at:      now.toISOString(),
          }).eq('id', sub.id),

          admin.from('master_profiles').update({
            subscription_tier:       sub.plan_id,
            subscription_expires_at: expiresAt,
          }).eq('id', sub.master_id),

          admin.from('billing_events').insert({
            payment_id:  invoiceId ?? orderId,
            external_id: invoiceId ?? orderId,
            provider:    sub.provider,
            master_id:   sub.master_id,
            tier:        sub.plan_id,
            amount:      amountKopecks,
            status:      'success',
            payload:     { orderId, subscriptionId: sub.id },
          }),
        ]);

        console.log(`[charge-subscriptions] OK — sub=${sub.id} master=${sub.master_id}`);
      } else {
        const newAttempts = (sub.failed_attempts ?? 0) + 1;
        const isDunned    = newAttempts >= MAX_FAILED_ATTEMPTS;

        const subUpdate: Record<string, unknown> = {
          failed_attempts: newAttempts,
          updated_at:      now.toISOString(),
        };
        if (isDunned) subUpdate.status = 'past_due';

        await Promise.all([
          admin.from('master_subscriptions').update(subUpdate).eq('id', sub.id),

          isDunned
            ? admin.from('master_profiles').update({
                subscription_tier: 'starter',
              }).eq('id', sub.master_id)
            : Promise.resolve(),

          admin.from('billing_events').insert({
            payment_id:  orderId,
            external_id: orderId,
            provider:    sub.provider,
            master_id:   sub.master_id,
            tier:        sub.plan_id,
            amount:      amountKopecks,
            status:      'failure',
            payload:     { orderId, subscriptionId: sub.id, error: chargeError },
          }),
        ]);

        console.warn(
          `[charge-subscriptions] FAIL — sub=${sub.id} master=${sub.master_id}`,
          `attempts=${newAttempts} dunned=${isDunned} error=${chargeError}`,
        );
      }

      return { subId: sub.id, succeeded };
    }),
  );

  const succeededCount = results.filter(
    (r) => r.status === 'fulfilled' && r.value.succeeded,
  ).length;
  const failedCount = results.length - succeededCount;

  console.log(`[charge-subscriptions] Done. succeeded=${succeededCount} failed=${failedCount}`);
  return NextResponse.json({
    ok: true,
    processed: subscriptions.length,
    succeeded: succeededCount,
    failed: failedCount,
  });
}
