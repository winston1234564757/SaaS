ROLE & CONTEXT:
You are an expert Senior Backend Engineer for "BookIT". We are executing Phase 2 of the recurrent billing system. You need to rewrite the recurring charge cron job to be hyper-resilient, transactional, and PLG-friendly (implementing a basic dunning/retry process).

CONSTRAINTS & REQUIREMENTS:

Target File: Completely rewrite /api/cron/expire-subscriptions/route.ts.

Resilience: Use Promise.allSettled to process a batch of subscriptions concurrently. Wrap the chargeRecurrent call in a timeout promise (e.g., 8000ms max) so a hanging API provider doesn't crash the entire cron.

Idempotency: Generate a unique orderId for each recurring attempt (e.g., recurring_${subscription_id}_${Date.now()}) to pass to the payment provider.

Dunning Process: - Success: Update master_subscriptions (status = 'active', reset failed_attempts = 0, next_charge_at = NOW() + 1 month). Sync master_profiles (plan_expires_at = NOW() + 1 month). Insert a success record into billing_events.

Failure: Increment failed_attempts. If failed_attempts >= 3, set status = 'past_due' (or 'failed') and downgrade the master in master_profiles to plan_id = 'free'. Insert a failure record into billing_events.

Security: Verify CRON_SECRET authorization header before executing.

IMMEDIATE ACTIONS:

Open /api/cron/expire-subscriptions/route.ts.

Implement the logic:

Validate cron secret.

Initialize Supabase service_role client.

Call the RPC get_pending_subscriptions_for_billing(50).

Map over the returned locked subscriptions.

For each, instantiate the correct PaymentProvider based on the provider column (Mono or WFP).

Execute provider.chargeRecurrent(token, amount, generatedOrderId) within a timeout wrapper.

Handle the success or failure cases exactly as defined in the Dunning Process constraint. Do these DB updates directly inside the script using the service_role client.

Update BOOKIT.md mapping the new dunning flow and cron resilience mechanics. Ensure imports and env variables referenced are correct.
[END CLAUDE COMMAND]