# A2: `/auth/callback` — Impeccable Audit (Skill Workflow)

**Route**: `/auth/callback` (OAuth callback handler)
**File**: `src/app/auth/callback/route.ts` — 227 lines
**Type**: Server Route Handler (Next.js App Router GET handler)
**Register**: Product (auth — critical security boundary)
**Date**: 2026-06-01
**Methodology**: critique (split assessment) → audit → animate → overdrive → polish → layout → optimize

---

## critique — Combined Report

### Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3/4 | Logs errors via `console.error`. User sees redirect on failure. No status page. |
| 2 | Match System / Real World | 4/4 | Ukrainian redirect (onboarding, dashboard, billing). |
| 3 | User Control and Freedom | 4/4 | Redirects to appropriate post-auth location. Booking claim preserves intent. |
| 4 | Consistency and Standards | 4/4 | Consistent with `register/actions.ts` Phase pattern. Same DB patterns. |
| 5 | Error Prevention | **0/4** | No try/catch on `exchangeCodeForSession` (P0). Network exception = 500. |
| 6 | Recognition Rather Than Recall | 4/4 | Cookie names are semantic. Comments explain every security pattern. |
| 7 | Flexibility and Efficiency | 3/4 | Handles Google OAuth, SMS fallback, booking links, referral flows. |
| 8 | Aesthetic and Minimalist Design | 2/4 | 227-line GET handler. Empty else-if block. Inline type. Chained replaces. |
| 9 | Error Recovery | 2/4 | Redirects on `exchangeCodeForSession` error. But no fallback for network exception. |
| 10 | Help and Documentation | 4/4 | Excellent inline comments: `SEC-CRIT-1`, `SEC-HIGH-1`, `V-06`, `V-10`, Phase 1/2/3. |
| **Total** | | **30/40** | **Good** |

### Anti-Patterns Verdict

**LLM Assessment (sub-agent)**: LOW slop. Well-documented security-critical route. Two P0 issues found:

| Violation | Line | Severity |
|-----------|------|----------|
| No `try/catch` around `supabase.auth.exchangeCodeForSession(code)` — unhandled promise rejection | 57 | **P0** |
| Empty `else if (isNewMaster)` block — dead code | 171-173 | **P0** |
| `?? false` superfluous on boolean `endsWith` return | 76 | P1 |
| Inline type should be named alias | 147-148 | P1 |
| `.replace()` chain hard to read | 114 | P1 |
| No `master_id` ownership check on booking claim (lines 177-193) — cross-master claim possible | 177-193 | P2 |
| Master block extractable to helper (~100 lines) | 107-205 | P2 |

**Deterministic scan**: `npx impeccable detect --json --gpt` → `[]` — no patterns detected.

### Overall Impression

This is the most security-conscious file in the codebase. Every auth vector has a comment explaining the threat and the mitigation. The open-redirect protection (URL constructor + pathname extraction) is gold standard. The dual cookie+param role validation prevents external link elevation. However, two P0 issues in a security-critical route — missing try/catch and dead code — should be fixed before they cause production incidents.

### What's Working

1. **Security comments are excellent** — `SEC-CRIT-1`, `SEC-HIGH-1`, `V-06` comments explain threats + mitigations. Best in project.
2. **Role preservation guards** (lines 86-90) — prevents admin/master demotion on re-auth.
3. **Atomic booking claim** (lines 177-193) — `client_email` check + `.is('client_id', null)` guard prevents TOCTOU race.

### Priority Issues

| ID | P | What | Why | Fix |
|----|---|------|-----|-----|
| A2-I1 | **P0** | No try/catch on `exchangeCodeForSession` (line 57) | Network exception (DNS failure, timeout) would cause unhandled promise rejection and 500 | Wrap in try/catch, redirect to `/login?error=auth_failed` |
| A2-I2 | **P0** | Empty `else if (isNewMaster)` block (lines 171-173) | Dead code indicates incomplete refactor. Confusing to maintainers. | Remove the empty else-if |
| A2-I3 | **P1** | `?? false` on boolean `endsWith` (line 76) | Superfluous — `endsWith` already returns boolean | Remove `?? false` |
| A2-I4 | **P1** | Inline type on lines 147-148 should be named | Repeated across `register/actions.ts` — violates DRY | Extract to `types/auth.ts` |
| A2-I5 | **P2** | No `master_id` ownership check on booking claim | If email matches and booking unclaimed, any master can claim any booking | Add `master_id` verification or scope by master slug |
| A2-I6 | **P2** | Master block (lines 107-205) extractable to helper | ~100 lines inline makes route hard to test | Extract to `handleMasterRedirect()` |

### Persona Red Flags

**Developer onboarding**:
- Reads code → sees empty `else if` at line 171 → wonders if behavior was intended → loses trust

---

## audit — Technical Quality

| # | Dimension | Score | Key Finding |
|---|-----------|-------|-------------|
| 1 | Security | **2/4** | Missing try/catch on critical auth call. Booking claim lacks master ownership check. |
| 2 | Performance | 4/4 | Server-only code. No client bundle. Admin client direct DB. Efficient. |
| 3 | Theming | 4/4 | No UI code. N/A. |
| 4 | Error Handling | **2/4** | exchangeCodeForSession unguarded. Dead code branch. |
| 5 | Code Quality | 3/4 | Well-commented. 227 lines borderline. Empty else-if. Inline type. |
| **Total** | | **15/20** | **Good** |

### Executive Summary

**15/20** — Good. Best security practices in the codebase. Two P0s (missing try/catch + dead code) need immediate fix.

---

## animate — Motion Analysis

**Score**: N/A — Server route handler. No UI, no motion. Correct.

---

## overdrive — Push Limits

### Direction A: Structured Auth Audit Log
Add an `auth_events` table that logs every auth callback execution: user_id, role, referral_code, booking_claimed, source (google/sms). Enables debugging auth issues in production without guesswork.

### Direction B: Rate Limit on Code Exchange
Add rate limiting to `exchangeCodeForSession` — same IP can't exchange codes more than 5 times per minute. Prevents brute-force on broken OAuth flows.

### Direction C: Booking Claim Email Verification
Before claiming booking via `bid`, send verification email to the client email. Adds friction but prevents any possibility of wrong-account claim.

---

## polish — Final Quality

### Copy
No user-facing text — server handler only.

### Comments
- `SEC-CRIT-1`, `SEC-HIGH-1`, `V-06`, `V-10` — excellent security annotation
- Phase 1/2/3 markers — consistent with `register/actions.ts`
- Empty else-if block (171-173) lacks comment — confusing

---

## layout — Spatial Design

**Score**: N/A — Server route handler. No layout.

---

## optimize — Performance

**Score**: 10/10 — Server-side only, no client code, direct DB, minimal allocations.

---

## Summary — All 7 Commands

| Command | Result |
|---------|--------|
| critique | 30/40 heuristics — Good. 2 P0 issues (missing try/catch, dead code) |
| audit | 15/20 — Good. Security 2/4, Error Handling 2/4 |
| animate | N/A — Server handler |
| overdrive | 3 directions: Auth event log, Rate limiting, Booking claim verification |
| polish | Clean server code. Empty else-if needs removal |
| layout | N/A |
| optimize | 10/10 — Perfect |

**Priority fix order**: try/catch on line 57 → Remove else-if dead block (171-173) → Remove `?? false` → Extract type → Extract master helper → Add booking master check
