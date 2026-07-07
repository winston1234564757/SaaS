# R2 Pre-Launch Audit — AUTH FLOWS (09)

Date: 2026-07-06 · Launch: 2026-07-10 · Mode: READ-ONLY
Scope: proxy/middleware guards, OTP phone auth, session, PostBookingAuth, /my/setup/phone,
register C2B referral ordering, client/master role separation, logout.
Note: the routing guard lives at `src/middleware.ts` (task said `proxy.ts`; that path does not
exist — Next.js `matcher`-based middleware is the actual guard). No `src/proxy.ts` in repo.

## Verdict
No P0 and no P1 exploitable holes found. The auth surface survived the Sprint-05 rebuild.
Findings are hardening/correctness gaps (P2/P3). All 4 failing referral unit tests are STALE
tests, not code regressions (proof below).

---

## Findings

### P2

`[P2] src/middleware.ts:46-47 — user_role cookie trusted for 30min with no session-user binding.`
Failure: `roleUid` (`user_role_uid` cookie) is read on line 47 but never compared against the
actual session user id, and when `user_role` is present middleware takes the Zero-Network path
and never re-validates against DB (line 51 only fetches when role is absent). Consequence: a DB
role change (client→master via claimMasterRole, or an admin demotion) is not reflected in routing
for up to the 30-min cookie TTL (line 110 `maxAge: 60*30`). The intended cookie→session double-check
that `user_role_uid` was added for is dead code. Not exploitable (role logic is gated behind
`hasSession`, and both login paths clear the cookie server-side), but the defense-in-depth binding
is absent. NOTE: task item 3 expected "4h expiry"; actual is 30min — tighter, not a regression.

`[P2] src/app/(master)/layout.tsx:87-91 — DB-timeout redirect loop for masters during degradation.`
Failure: if the profile fetch times out (4s race, line 74/81), `profile` stays null, and line 91
`if (!profile ...) redirect('/my/bookings')`. Middleware then sees cookie role=master on `/my` with
no `view_mode=client` and redirects back to `/dashboard` (middleware:135-139) → layout times out
again → infinite `/dashboard ⇄ /my/bookings` loop while the DB is slow/cold. Fails safe (no data
leak) but bricks the master dashboard under sustained DB latency.

### P3

`[P3] src/app/my/setup/phone/actions.ts:66 — OTP compared with plain !== (not timing-safe).`
Failure: `if (record.otp !== cleanOtp)` uses a non-constant-time compare, unlike verify-sms:99 which
uses `timingSafeEqual` (added for finding V-09). Inconsistent. Practical timing attack is infeasible
(6-digit code, 10 attempts / 15 min via check_and_log_sms_attempt, 10-min TTL), so low severity.

`[P3] src/components/client/MyProfilePage.tsx:474 + src/components/master/settings/SettingsPage.tsx:342 — logout cannot delete the httpOnly user_role cookie.`
Failure: logout runs `document.cookie = 'user_role=; max-age=0'`, but middleware sets `user_role`
with `httpOnly: true` (middleware:110), so client JS cannot clear it — the stale role cookie
survives logout (up to 30-min TTL). Mitigated: it is inert without a session (all role logic sits
behind `hasSession`, middleware:32 returns early for guests), and both re-login paths clear it
server-side (verify-sms:283, auth/callback:68). So "no stale role cookie" (item 8) is technically
violated but not exploitable. Master logout also never clears `view_mode`.

`[P3] src/app/(master)/dashboard/products/actions.ts:12 — getMasterId() has no role assertion.`
Failure: `getMasterId` returns `user.id` for ANY authenticated user with no `role === 'master'`
check, so a client session can invoke master product actions. No real impact: every mutation
self-scopes with `.eq('master_id', masterId=own id)` (lines 166/186/238/286...) and createProduct
inserts `master_id = own id`; a client owns no master rows and hits FK/empty-scope. Cannot reach
another master's data. Guard-by-data-model, not an explicit role gate — fragile but safe today.
Same self-scoping pattern verified in my/bookings/actions.ts:27 (`.eq('client_id', user.id)`).

`[P3] src/middleware.ts:37 — /onboarding guarded by exact === while /dashboard,/my,/admin use startsWith.`
Failure: only `pathname === '/onboarding'` is protected. Today `/onboarding` is a single page
(no subroutes), so it is covered; but any future `/onboarding/*` subroute would be unguarded for
unauthenticated users. Inconsistent with the other zones.

`[P3] src/components/public/PostBookingAuth.tsx:122 — handleVerify has no re-entrancy guard.`
Failure: OTP auto-submit (handleDigitChange:172 / handlePaste:188) plus a manual "Підтвердити"
click can fire two concurrent verify-sms POSTs. Harmless: the OTP row is deleted after the first
success (verify-sms:109) so the second returns "code not found", and attempts are rate-limited.

---

## Confirmed intact (regression checks passed)

- Guards: `/dashboard`, `/my/*` (incl. setup/phone, support/chat), `/admin`, `/onboarding` all
  redirect to `/login` when no session cookie (middleware:32-40). MyLayout:39 and MasterLayout:43
  redirect `!user`. No redirect loop under normal conditions.
- OTP: 10-min TTL enforced + delete (verify-sms:87-93), single-use via delete-after-success (109),
  timing-safe compare (99), atomic rate-limit RPCs check_and_log_sms_send (send:66) and
  check_and_log_sms_attempt (verify:44), phone + IP limits, resend 60s cooldown (PostBookingAuth:193),
  send-side phone-conflict 409 block (send-sms:47-60). No `used` column, but delete gives single-use.
- Session: MasterContext setTimeout(0) deadlock fix present + documented (context.tsx:140-148).
  MasterLayout getUser 3s timeout → getSession fallback (6e844bf) present; impersonation admin role
  verified from DB, never from cookie (layout.tsx:45-56).
- register/actions.ts C2B FK ordering intact: master_profiles upserted (Phase 1) BEFORE
  applyReferralRewards (Phase 2) in both claimMasterRole (68→88) and createMasterProfileAfterSignup
  (163→181). V-13 ownership check present (createMasterProfileAfterSignup:132-137).
- referrals.ts applyReferralRewards: caller-owns-id check (143), referral-code regex allowlist
  V-11 (135/148), referral_grants idempotency (156-284) so referrer never double-rewarded.
- /my/setup/phone confirmPhone: OTP verified (steps 4-6) BEFORE the phone-conflict check
  (`.eq('phone').neq('id', user.id)`, line 91-99) and write — a logged-in client CANNOT hijack a
  phone owned by another account. Answer to item 5: NO.
- PostBookingAuth 4-step flow (choose→phone→otp→channels) sound; mid-flow abandon just resets state.
- Client vs master separation: MasterLayout:91 bounces clients to /my/bookings; master actions
  self-scope by user.id. auth/callback preserves admin/master role, prevents downgrade (callback:86-90,
  verify-sms:189-193). Open-redirect (SEC-CRIT-1), forged-role (SEC-HIGH-1 via httpOnly
  bookit_reg_role), plan-param allowlist (V-10), booking-claim ownership check (V-06) all present.
- Logout clears the session (signOut) and attempts role clear; re-login clears role server-side.

---

## Failing referral tests — verdict: ALL STALE (not regressions)

Ran `npx vitest run partners.test.ts referrals.action.test.ts` → 4 failed / 32 passed. Root causes:

1. `partners.test.ts › getPartnerInviteLink › returns link when master has referral_code` and
   `› returns error when master profile not found`: tests mock `createClient().from` returning
   `{ referral_code }`, but production reads `createAdminClient().from` selecting
   `partner_invite_token` (M-GROW-02 refactor). Test never mocks `createAdminClient` → `admin.from`
   throws → generic catch error. STALE: test predates the partner_invite_token/admin-client rewrite.

2. `referrals.action.test.ts › getOrCreateReferralLink › C2C link`: test mocks
   `client_profiles.referral_code = 'CLI001'`, but code reads column `c2c_referral_code` (client
   column rename) → no match → generates a fresh code (got `ref=B3V5UP`). STALE column name.

3. `referrals.action.test.ts › applyReferralRewards › awards C2B 30-day Pro trial`: code grants a
   21-day C2B trial (referrals.ts:350 `+21`, and idempotent path:178 `trialDays = ...: 21` — both
   agree), test asserts ~30 days (got 20.99). Deliberate business-value change 30→21, consistent
   across both code paths. STALE expectation.

None of the 4 touch auth correctness or the C2B FK ordering. Referral/auth code is intact.

---

## Severity counts

| Severity | Count |
|----------|-------|
| P0       | 0     |
| P1       | 0     |
| P2       | 2     |
| P3       | 4     |
| Total    | 6     |

Failing unit tests: 4 (all stale mocks/expectations — no code fix required; update tests).
