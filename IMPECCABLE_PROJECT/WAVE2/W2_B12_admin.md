# Wave 2 — Batch 12: Admin Zone (7 files)
**8 instruments: critique A+B + audit + animate + overdrive + polish + layout + optimize**
**Date: 2026-06-02 | Sub-agent: ses_17af0a562ffecbdP2Q8SCFE8lX**

## Scores

| File | Score | P0 | P1 | P2 | P3 |
|------|-------|----|----|----|----|
| AdminOverviewCharts.tsx | 33/40 | 2 | 1 | 3 | 2 |
| AdminSupportConsole.tsx | 31/40 | 1 | 2 | 3 | 1 |
| MastersDirectory.tsx | 34/40 | 1 | 1 | 3 | 2 |
| ModerationHub.tsx | 30/40 | 1 | 2 | 3 | 1 |
| SystemLogsViewer.tsx | 32/40 | 0 | 2 | 3 | 1 |
| AllianceMap.tsx | 29/40 | 0 | 2 | 3 | 1 |
| ImpersonationBanner.tsx | 35/40 | 0 | 1 | 3 | 2 |

**Assessment B**: detect clean (all `[]`)

## P0 Issues (5 total) — Most Critical Batch in Wave 2
1. **AdminOverviewCharts** — Client-side mutations bypass Supabase RLS entirely (direct `.update()` in browser)
2. **AdminOverviewCharts** — `order_total` displayed without currency formatting, raw decimal sent to UI
3. **AdminSupportConsole** — OTP reset token rendered in plaintext inside session storage
4. **MastersDirectory** — Impersonation cookie written with no signature or HMAC (any admin can forge)
5. **ModerationHub** — Content flagging sends full user profile in URL params (PII leak in server logs)

## Key Findings
- **Security**: 4 of 5 P0s are security issues — admin zone is the most dangerous in the codebase
- **AdminOverviewCharts**: RLS bypass means any authenticated admin can mutate any master's data
- **AllianceMap**: Solid UI for a complex geo feature, but map tiles load over HTTP (mixed content risk)
- **ImpersonationBanner**: Clean component, but the impersonation mechanism it displays is insecure
- **SystemLogsViewer**: Well-isolated, no security issues — the safest file in the batch

## Systemic
- Admin zone has no centralized auth guard — each file implements its own permission check
- OTP and session data should use httpOnly cookies, not `localStorage`/`sessionStorage`
- No audit trail for admin actions (who impersonated whom, when)
- Impersonation should use server-side session tokens, not unsigned cookies
- **This batch needs immediate security remediation before any production deployment**
