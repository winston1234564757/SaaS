# 14 — Database Security Domain Map

## 1. Domain Overview

Row Level Security (RLS) матриця, Security Definer RPC, захист API/webhook/cron, SMS OTP rate-limit.

### Key Files
- `src/lib/supabase/client.ts` — Browser client (anon key)
- `src/lib/supabase/server.ts` — SSR client (cookies)
- `src/lib/supabase/admin.ts` — Admin client (service_role key)
- `src/middleware.ts` — Routing guard
- All API routes under `src/app/api/`
- All migration files under `supabase/migrations/`

---

## 2. RLS Matrix

### Complete Table Access Matrix

| Таблиця | anon SELECT | anon INSERT | auth client SELECT | auth client INSERT/UPDATE | auth master SELECT | auth master INSERT/UPDATE/DELETE |
|---|---|---|---|---|---|---|
| `profiles` | public name/avatar | ❌ | Own profile | UPDATE own | Their clients | ❌ |
| `master_profiles` | Public by slug | ❌ | Their masters | ❌ | Own profile | UPDATE own |
| `client_master_relations` | ❌ | ❌ | Own relations | ❌ | Their clients | INSERT/UPDATE |
| `services` | Active services | ❌ | All active | ❌ | Own services | Full CRUD |
| `products` | Active products | ❌ | All active | ❌ | Own products | Full CRUD |
| `bookings` | ❌ | Via OTP token | Own bookings | ❌ | Own bookings | INSERT/UPDATE |
| `orders` | ❌ | Pickup/NP | Own orders | ❌ | Shop orders | UPDATE |
| `notifications` | ❌ | ❌ | Own | UPDATE read | Own | UPDATE read |
| `push_subscriptions` | ❌ | ❌ | Own | INSERT/DELETE | Own | INSERT/DELETE |
| `notification_logs` | ❌ | ❌ | ❌ | ❌ | Own logs | SELECT only |
| `payments` | ❌ | ❌ | ❌ | ❌ | Own | SELECT |
| `master_subscriptions` | ❌ | ❌ | ❌ | ❌ | Own | SELECT |
| `master_alliances` | ❌ | ❌ | ❌ | ❌ | Own | SELECT |
| `reviews` | Public | ❌ | Own | INSERT | Own | SELECT |
| `portfolio_items` | Published only | ❌ | Tagged items | UPDATE consent | Own | Full CRUD |
| `flash_deals` | Active | ❌ | Active | ❌ | Own | Full CRUD |
| `broadcasts` | ❌ | ❌ | ❌ | ❌ | Own | Full CRUD |
| `broadcast_recipients` | ❌ | ❌ | Own | ❌ | Own | SELECT/UPDATE |
| `support_tickets` | ❌ | ❌ | Own | INSERT | Own | INSERT |
| `content_reports` | ❌ | ❌ | Own | INSERT | ❌ | ❌ |

### RLS States Testing

| State | Expected |
|---|---|
| auth.uid() = NULL (anon) | Minimal public access |
| auth.uid() = master_id | Own data + client data access |
| auth.uid() = client_id | Own profile + booking access |
| auth.uid() mismatch | No cross-user data leak |
| service_role key | Full bypass (admin.ts only) |

---

## 3. Security Definer RPC

| RPC | Has `search_path = public`? | Risk Level |
|---|---|---|
| `get_master_clients(p_master_id)` | ✅ Yes | Low |
| `check_and_log_sms_send(p_phone, p_ip, ...)` | ❌ **MISSING** | **P0 — HIGH** |
| `get_pending_subscriptions_for_billing()` | ✅ Yes (uses SKIP LOCKED) | Low |

### RPC Security Rules
1. All SECURITY DEFINER functions MUST have `SET search_path = public`
2. Missing search_path = risk of function hijacking
3. All functions must be granted only to `authenticated` role (not `anon`)
4. `check_and_log_sms_send` — P0 fix required

---

## 4. Webhook Security

| Webhook | Method | Protection |
|---|---|---|
| `/api/billing/mono-webhook` | POST | Ed25519 signature verification (strict) |
| All cron routes | GET | Bearer CRON_SECRET (first line check) |

### Ed25519 Verification Flow
```
POST mono-webhook:
  → header: X-Mono-Signature
  → fetch Monobank public key (cached, with rotation)
  → ed25519.verify(signature, body, publicKey)
    → PASS → process
    → FAIL → 403 Forbidden (no soft-mode)
```

---

## 5. SMS OTP Rate-Limit

| Limit | Scope | Enforcement |
|---|---|---|
| 3 SMS / 15 min | Per phone number | `check_and_log_sms_attempt` RPC |
| 10 SMS / 1 hour | Per IP address | `sms_ip_logs` table |
| 10 verify attempts / 15 min | Per phone | `sms_verify_attempts` table |
| OTP TTL | Per code | 10 minutes, then expired |

### Atomicity
- `check_and_log_sms_attempt` uses PostgreSQL advisory locks
- Prevents TOCTOU race (two simultaneous sends for same phone)

---

## 6. Route Protection (middleware.ts)

| Route Pattern | Guard |
|---|---|
| `/dashboard/*` | Master role required |
| `/my/*` | Auth required (any role) |
| `/login`, `/register` | Guest only (redirect if auth) |
| `/admin/*` | Admin role required |
| `/*` (public) | No guard |

### Guard States
| State | Behavior |
|---|---|
| No session | Redirect /login |
| Master session | Allow /dashboard, redirect /my → dashboard? |
| Client session | Allow /my, redirect /dashboard → /my/bookings |
| Admin session | Allow /admin |
| Expired session | Cookie cleared → redirect /login |
| Invalid session | Same as expired |

---

## 7. Identity Security

| Mechanism | Detail |
|---|---|
| Virtual email | `phone.replace('+', '') + '@bookit.app'` |
| Admin client | Only in server-only contexts (cron, webhook) |
| Service role key | Never in client code |
| RLS bypass | Only via admin client, never anon client |

---

## 8. Test Vectors

### RLS Tests
- [ ] Anon user: only public data accessible
- [ ] Master A: sees own bookings, not Master B's
- [ ] Client A: sees own bookings, not Client B's
- [ ] Client: cannot access /dashboard routes
- [ ] Guest: redirected from protected routes
- [ ] Master: sees own clients only
- [ ] Admin: can see all data
- [ ] RLS bypass attempt via ANON key → blocked
- [ ] RLS with deleted user → no access

### API Security Tests
- [ ] Mono webhook: missing signature → 403
- [ ] Mono webhook: tampered body → 403
- [ ] Mono webhook: valid signature → 200
- [ ] Cron: missing Bearer → 401
- [ ] Cron: wrong Bearer → 401
- [ ] SMS send: rate-limit (4th request in 15 min) → block
- [ ] SMS send: IP rate-limit (11th request in 1h) → block
- [ ] SMS verify: 11th attempt in 15 min → block
- [ ] SMS verify: wrong code → error, increment counter
- [ ] SMS verify: expired code → error

### RPC Security Tests
- [ ] `get_master_clients`: Master A queries → gets only A's clients
- [ ] `get_master_clients`: Client queries → blocked (auth role?)
- [ ] `get_master_clients`: Anon queries → blocked
- [ ] `check_and_log_sms_send`: concurrent sends → atomic

### SQL Injection Tests
- [ ] Phone parameter in send-sms
- [ ] Slug parameter in public page
- [ ] Booking ID in detail page
- [ ] All user-facing string parameters

---

## 9. File Inventory

### Auth/Guard
- `src/middleware.ts`
- `src/lib/supabase/client.ts`
- `src/lib/supabase/server.ts`
- `src/lib/supabase/admin.ts`
- `src/lib/supabase/context.tsx`
- `src/lib/supabase/safeQuery.ts`

### All API Routes
- `src/app/api/auth/*`
- `src/app/api/billing/*`
- `src/app/api/cron/*`
- `src/app/api/push/*`
- `src/app/api/telegram/*`

### All Migrations (RLS policies in every migration)
- `supabase/migrations/*.sql`

### Key RLS Migrations
- `003_auth_trigger_and_grants.sql`
- `005_client_booking_link_policy.sql`
- `006_client_master_select_policy.sql`
- `022_explore_rls.sql`
- `034_rls_payments_referrals.sql`
- `046_schedule_indexes_and_rls.sql`
- `114_portfolio_items.sql` (portfolio RLS)

### Existing Tests
- `e2e/tests/01-auth-guards.spec.ts`
