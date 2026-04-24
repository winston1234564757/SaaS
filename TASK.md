ROLE & CONTEXT:
Senior Backend Engineer debugging "BookIT" billing.
Issues:

master_subscriptions table is empty (tokens not captured).

Monobank webhook fails to update the plan.

WayForPay captures payment but doesn't save tokens.

IMMEDIATE ACTIONS:

WayForPay Token Capture Fix:

In src/lib/billing/WfpProvider.ts, ensure createCheckout includes returnToken: 'Y' in the payload and that this field is NOT included in the signature (WFP rules).

In src/app/api/billing/webhook/route.ts (WFP), add console.log("[WFP DEBUG] Full payload:", body) to see if recToken is actually there.

Monobank Webhook & State Fix:

Review src/app/api/billing/mono-webhook/route.ts. It MUST use await req.text() to get the raw body for signature verification BEFORE any JSON parsing.

Add explicit logging: console.log("[MONO DEBUG] Signature verification result:", isValid).

After verification, ensure it updates master_profiles (cached plan) AND master_subscriptions (token vault) in a single flow.

Database Consistency:

In both webhook handlers, ensure you use SUPABASE_SERVICE_ROLE_KEY.

Log any Supabase error using JSON.stringify(error). If master_subscriptions insert fails, WE NEED TO KNOW WHY (check for RLS or missing columns like next_charge_at).

Payment Actions Sync:

In src/app/(master)/dashboard/billing/actions.ts, ensure createMonoInvoice and createWfpInvoice are using the same absolute webHookUrl logic.

CRITICAL: Provide a summary of what was missing in the WFP request that prevented token generation.