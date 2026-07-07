import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { MonoProvider } from '@/lib/billing/MonoProvider';
import type { PaymentProvider } from '@/lib/billing/PaymentProvider';
import { calculateBillingDecision } from '@/lib/billing/pricing';
import { syncReferralAndBounty as sharedSyncReferralAndBounty } from '@/lib/billing/syncReferralAndBounty';
import { sendTelegramMessage } from '@/lib/telegram';
import { notifyMasterBilling } from '@/lib/notifications';
import { verifyCronSecret } from '@/lib/utils/verifyCronSecret';

export const runtime = 'nodejs';

const STUDIO_KOPECKS    = 29_900; // 299 UAH — flat, no referral discounts
const MAX_FAILED_ATTEMPTS = 3;
const CHARGE_TIMEOUT_MS   = 8_000;
const BATCH_SIZE          = 50;

const APP_URL =
  process.env.NEXT_PUBLIC_SITE_URL ??
  process.env.NEXT_PUBLIC_APP_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : 'https://bookit-five-psi.vercel.app');

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

interface SubscriptionRow {
  id: string;
  master_id: string;
  provider: string;
  token: string;
  plan_id: string;
  failed_attempts: number;
}

interface BillingStateRow {
  lifetime_discount:         number;
  referral_bounties_pending: number; // always 0 after migration 098, kept for compat
  discount_reserve:          number;
  active_refs_count:         number;
  telegram_chat_id:          string | null;
}

export async function GET(req: NextRequest) {
  if (!verifyCronSecret(req.headers.get('authorization'))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const admin = createAdminClient();

  const { data: subscriptions, error: rpcErr } = await admin
    .rpc('get_pending_subscriptions_for_billing', { batch_size: BATCH_SIZE });

  if (rpcErr) {
    console.error('[charge-subscriptions] RPC error:', rpcErr.message);
    return NextResponse.json({ error: rpcErr.message }, { status: 500 });
  }

  if (!subscriptions || subscriptions.length === 0) {
    console.log('[charge-subscriptions] No pending subscriptions');
    return NextResponse.json({ ok: true, processed: 0, succeeded: 0, failed: 0, free: 0 });
  }

  console.log(`[charge-subscriptions] Batch size: ${subscriptions.length}`);

  const providers: Record<string, PaymentProvider> = { monobank: new MonoProvider() };

  const results = await Promise.allSettled(
    (subscriptions as SubscriptionRow[]).map(async (sub) => {
      const provider = providers[sub.provider];
      if (!provider) throw new Error(`Unknown provider: ${sub.provider}`);

      const now      = new Date();
      const billingPeriod = `${now.getUTCFullYear()}_${String(now.getUTCMonth() + 1).padStart(2, '0')}`;
      const orderId  = `recurring_${sub.id}_${billingPeriod}`;
      const webhookUrl = `${APP_URL}/api/billing/mono-webhook`;

      // ── Studio: flat price, skip discount engine ──────────
      if (sub.plan_id === 'studio') {
        return chargeAndCommit({ sub, provider, amountKopecks: STUDIO_KOPECKS, orderId, webhookUrl, now, admin, isFree: false });
      }

      if (sub.plan_id !== 'pro') throw new Error(`Unknown plan_id: ${sub.plan_id}`);

      // ── Pro: read billing state atomically, decide branch ──
      const { data: stateRows, error: stateError } = await admin
        .rpc('get_master_billing_state', { p_master_id: sub.master_id }) as { data: BillingStateRow[] | null; error: unknown };
      if (stateError) throw new Error(`Billing state RPC failed for ${sub.master_id}`);

      const state = stateRows?.[0];
      const decision = calculateBillingDecision({
        activeRefsCount:  state?.active_refs_count  ?? 0,
        discountReserve:  state?.discount_reserve   ?? 0,
        lifetimeDiscount: state?.lifetime_discount  ?? 0,
      });

      // ── Branch A: total >= 100% → grant free month ────────
      if (decision.shouldGrantFree) {
        const expiresAt = addDays(now, 30);
        await admin.rpc('commit_free_month', {
          p_master_id:   sub.master_id,
          p_new_reserve: decision.newReserve,
          p_expires_at:  expiresAt,
        });
        await Promise.all([
          admin.from('billing_events').insert({
            payment_id:  `free_${orderId}`,
            external_id: `free_${orderId}`,
            provider:    sub.provider,
            master_id:   sub.master_id,
            tier:        sub.plan_id,
            amount:      0,
            status:      'success',
            payload:     {
              orderId,
              type:          'free_month',
              totalDiscount:  decision.totalDiscount,
              newReserve:     decision.newReserve,
              statusDiscount: decision.statusDiscount,
              carryover:      decision.carryover,
            },
          }),
          admin.from('master_subscriptions').update({
            status:             'active',
            failed_attempts:    0,
            next_charge_at:     expiresAt,
            expires_at:         expiresAt,
            charging_at:        null,
            pending_invoice_id: null,
            updated_at:         now.toISOString(),
          }).eq('id', sub.id),
        ]);
        // Network Success Report (Telegram) + Orchestrator notification
        const chatId = state?.telegram_chat_id;
        if (chatId) {
          const reservePct = Math.round(decision.newReserve * 100);
          const msg =
            `🎉 <b>Ваша мережа працює на вас!</b>\n\n` +
            `Завдяки активності ваших партнерів, наступні 30 днів BookIT для вас безкоштовні.\n` +
            (reservePct > 0
              ? `\nЗалишок бонусу <b>${reservePct}%</b> збережено на майбутнє.`
              : '');
          sendTelegramMessage(chatId, msg).catch(() => {});
        }
        const freeExpiresFormatted = new Date(expiresAt).toLocaleDateString('uk-UA', { day: 'numeric', month: 'long' });
        notifyMasterBilling(sub.master_id, 'subscription_paid', sub.plan_id === 'pro' ? 'Pro' : 'Studio', freeExpiresFormatted).catch(e => console.error('[notifyMasterBilling]', e));
        console.log(
          `[BILLING] User ${sub.master_id} granted 30 free days.`,
          `Reserve carried over: ${decision.newReserve}`,
          `(status=${decision.statusDiscount} carry=${decision.carryover})`,
        );
        return { subId: sub.id, succeeded: true, free: true, deferred: false };
      }

      // ── Branch B: create invoice at discounted price ───────
      return chargeAndCommit({
        sub, provider, amountKopecks: decision.finalKopecks,
        orderId, webhookUrl, now, admin, isFree: false,
        onSuccess: async (invoiceId: string | undefined) => {
          // Reset reserve + bounties (atomic RPC)
          await admin.rpc('commit_paid_month', { p_master_id: sub.master_id });

          // Sync referral status + bounty for this master's referrer
          await sharedSyncReferralAndBounty(sub.master_id);

          await admin.from('billing_events').insert({
            payment_id:  invoiceId ?? orderId,
            external_id: invoiceId ?? orderId,
            provider:    sub.provider,
            master_id:   sub.master_id,
            tier:        sub.plan_id,
            amount:      decision.finalKopecks,
            status:      'success',
            payload:     {
              orderId,
              totalDiscount:  decision.totalDiscount,
              statusDiscount: decision.statusDiscount,
              carryover:      decision.carryover,
              discountedFrom: 70_000,
            },
          });
        },
      });
    }),
  );

  const succeededCount = results.filter(
    (r) => r.status === 'fulfilled' && r.value.succeeded,
  ).length;
  const freeCount = results.filter(
    (r) => r.status === 'fulfilled' && r.value.free,
  ).length;
  const deferredCount = results.filter(
    (r) => r.status === 'fulfilled' && r.value.deferred,
  ).length;
  // Rejected promises (thrown before returning a result) + confirmed failures.
  const failedCount = results.length - succeededCount - deferredCount;

  console.log(`[charge-subscriptions] Done. succeeded=${succeededCount} free=${freeCount} deferred=${deferredCount} failed=${failedCount}`);
  return NextResponse.json({
    ok: true, processed: subscriptions.length, succeeded: succeededCount, free: freeCount, deferred: deferredCount, failed: failedCount,
  });
}

// ── Helpers ───────────────────────────────────────────────────

async function chargeAndCommit({
  sub, provider, amountKopecks, orderId, webhookUrl, now, admin, isFree, onSuccess,
}: {
  sub: SubscriptionRow;
  provider: PaymentProvider;
  amountKopecks: number;
  orderId: string;
  webhookUrl: string;
  now: Date;
  admin: ReturnType<typeof import('@/lib/supabase/admin').createAdminClient>;
  isFree: boolean;
  onSuccess?: (invoiceId: string | undefined) => Promise<void>;
}): Promise<{ subId: string; succeeded: boolean; free: boolean; deferred: boolean }> {
  // Synchronous charge status is only a hint. Monobank confirms the real outcome
  // asynchronously via the webhook (webHookUrl is passed to chargeRecurrent), so a
  // 'pending' response is NEVER treated as paid — it is deferred to mono-webhook.
  let chargeStatus: 'success' | 'failure' | 'pending' = 'failure';
  let invoiceId: string | undefined;
  let chargeError: string | undefined;

  try {
    const result = await withTimeout(
      provider.chargeRecurrent({ token: sub.token, amountKopecks, orderId, webhookUrl }),
      CHARGE_TIMEOUT_MS,
    );
    chargeStatus = result.status;
    invoiceId    = result.invoiceId;
  } catch (err) {
    // Network / timeout — outcome unknown but not confirmed paid → treat as failure.
    chargeError = String(err);
  }

  const expiresAt = addDays(now, 30);

  // ── PENDING: outcome unknown — do NOT grant, do NOT dun. Record the invoice so
  //    the claim RPC won't re-charge this row, and let the webhook settle it. ──────
  if (chargeStatus === 'pending' && invoiceId) {
    await admin.from('master_subscriptions').update({
      pending_invoice_id: invoiceId,
      updated_at:         now.toISOString(),
    }).eq('id', sub.id);
    await admin.from('billing_events').insert({
      payment_id:  `pending_${invoiceId}`,
      external_id: `pending_${invoiceId}`,
      provider:    sub.provider,
      master_id:   sub.master_id,
      tier:        sub.plan_id,
      amount:      amountKopecks,
      status:      'pending',
      payload:     { orderId, subscriptionId: sub.id, awaitingWebhook: true },
    });
    // No master notification on pending — the webhook notifies once the charge is
    // actually confirmed (avoids a false "оплачено" on a charge that may still fail).
    console.log(`[charge-subscriptions] PENDING — sub=${sub.id} master=${sub.master_id} invoice=${invoiceId} → awaiting webhook`);
    return { subId: sub.id, succeeded: false, free: false, deferred: true };
  }

  const succeeded = chargeStatus === 'success';

  if (succeeded) {
    await Promise.all([
      admin.from('master_subscriptions').update({
        status:             'active',
        failed_attempts:    0,
        next_charge_at:     expiresAt,
        expires_at:         expiresAt,
        charging_at:        null,
        pending_invoice_id: null,
        updated_at:         now.toISOString(),
      }).eq('id', sub.id),
      admin.from('master_profiles').update({
        subscription_tier:       sub.plan_id,
        subscription_expires_at: expiresAt,
      }).eq('id', sub.master_id),
      onSuccess?.(invoiceId) ?? Promise.resolve(),
    ]);
    if (!onSuccess) {
      await admin.from('billing_events').insert({
        payment_id:  invoiceId ?? orderId,
        external_id: invoiceId ?? orderId,
        provider:    sub.provider,
        master_id:   sub.master_id,
        tier:        sub.plan_id,
        amount:      amountKopecks,
        status:      'success',
        payload:     { orderId, subscriptionId: sub.id },
      });
    }
    const paidExpiresFormatted = new Date(expiresAt).toLocaleDateString('uk-UA', { day: 'numeric', month: 'long' });
    notifyMasterBilling(sub.master_id, 'subscription_paid', sub.plan_id === 'pro' ? 'Pro' : 'Studio', paidExpiresFormatted).catch(e => console.error('[notifyMasterBilling]', e));
    console.log(`[charge-subscriptions] OK — sub=${sub.id} master=${sub.master_id}`);
  } else {
    const newAttempts = (sub.failed_attempts ?? 0) + 1;
    const isDunned    = newAttempts >= MAX_FAILED_ATTEMPTS;
    const subUpdate: Record<string, unknown> = {
      failed_attempts:    newAttempts,
      charging_at:        null, // release the claim so dunning can retry next cron
      pending_invoice_id: null,
      updated_at:         now.toISOString(),
    };
    if (isDunned) subUpdate.status = 'past_due';
    await Promise.all([
      admin.from('master_subscriptions').update(subUpdate).eq('id', sub.id),
      isDunned
        ? admin.from('master_profiles').update({ subscription_tier: 'starter' }).eq('id', sub.master_id)
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
    notifyMasterBilling(sub.master_id, 'subscription_failed').catch(e => console.error('[notifyMasterBilling]', e));
    if (isDunned) notifyMasterBilling(sub.master_id, 'subscription_downgraded').catch(e => console.error('[notifyMasterBilling]', e));
    console.warn(`[charge-subscriptions] FAIL — sub=${sub.id} master=${sub.master_id} attempts=${newAttempts} error=${chargeError}`);
  }

  return { subId: sub.id, succeeded, free: isFree, deferred: false };
}

