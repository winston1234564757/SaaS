# SEC-01 — E2E harness must not target production Supabase

**Priority:** P0 (deferred by founder to after the test-coverage phase; prod is pre-launch/closed).
**Status:** ⬜ TODO (saved 2026-07-07).
**Source:** TEST_COVERAGE_MATRIX §3b + MemPalace problems drawer.

## Problem (corrected assessment)
`bookit/.env.test` is a **local, gitignored** file (not in repo, never in history — no key leaked in git). But on the dev machine it points the e2e harness at the **production** Supabase project (`sqlrxsopllgztvgrerqk`, per SYSTEM_MAP) with `E2E_ALLOW_REMOTE=true`. Therefore a local `npm run test:e2e` runs `scripts/seed-e2e-data.ts`, which **wipe+recreate `e2e_*@test.com` accounts on prod**, guarded only by an email regex. CI is already safe (spins up a local ephemeral Supabase, `E2E_ALLOW_REMOTE=false`).

## Fix (when security phase opens)
1. On the dev machine, repoint `.env.test` at a **local** Supabase (`npx supabase start`, `E2E_ALLOW_REMOTE=false`) or a **dedicated** e2e cloud project — never prod. (An `.env.test.example` could not be committed — the env-guard hook blocks writing any `.env*` file; create it by hand from the template below.)

```dotenv
NEXT_PUBLIC_SUPABASE_URL="http://127.0.0.1:54321"
NEXT_PUBLIC_SUPABASE_ANON_KEY="<local-anon-key>"
SUPABASE_SERVICE_ROLE_KEY="<local-service-role-key>"
E2E_BASE_URL=http://localhost:3000
E2E_ALLOW_REMOTE=false
E2E_MASTER_TIMETRAVEL_EMAIL=e2e_master_timetravel@test.com
E2E_MASTER_CRM_EMAIL=e2e_master_crm@test.com
E2E_MASTER_AUTH_EMAIL=e2e_master_auth@test.com
E2E_MASTER_REFERRAL_EMAIL=e2e_master_referral@test.com
E2E_CLIENT_EMAIL=e2e_client@test.com
E2E_STUDIO_ADMIN_EMAIL=e2e_studioadmin@test.com
E2E_MASTER_AUDIT_EMAIL=e2e_master_audit@test.com
E2E_CLIENT_AUDIT_EMAIL=e2e_client_audit@test.com
```
2. Optionally rotate the prod service-role key (it lived only on disk, not in git, so exposure is low).
3. Consider a hard guard in `seed-e2e-data.ts`: refuse to run if the target URL matches the known prod ref, even with `E2E_ALLOW_REMOTE=true`.

## Acceptance
- `npm run test:e2e` locally cannot touch the prod project.
- Seed aborts loudly if pointed at the prod ref.
