---
name: ship-gate
description: Pre-deploy 8-category audit. Run before every Vercel production deploy. All 8 categories must be green. Covers TypeScript, build, tests, security, performance, accessibility, migrations, and UX smoke test.
version: "1.0.0"
---

# Ship Gate — Pre-Deploy Audit

8 categories. ALL green = deploy. ANY red = fix first.

---

## Usage

```
/ship-gate          # Full 8-category audit
/ship-gate quick    # Skip time-intensive checks (no e2e)
/ship-gate [area]   # Audit specific category only
```

---

## Categories

### 1. TypeScript Gate
```bash
npx tsc --noEmit
```
- [ ] Zero TypeScript errors
- [ ] No new `any` types (unless with justification comment)
- [ ] No `@ts-ignore` added without explanation

### 2. Build Gate
```bash
npm run build
```
- [ ] Clean build, zero warnings
- [ ] Bundle size delta checked (flag >50KB increase)
- [ ] No missing env vars during build

### 3. Test Gate
```bash
npm test && npm run test:e2e
```
- [ ] All unit tests passing
- [ ] E2E critical paths covered (booking, auth, payments)
- [ ] New feature has ≥1 test

### 4. Security Gate
- [ ] No new RLS violations (every new table has RLS enabled)
- [ ] No `service_role` key in client-side code
- [ ] Webhook handlers have signature verification (Monobank)
- [ ] No .env values hardcoded in source
- [ ] Admin operations via `createAdminClient()` only
- [ ] OTP endpoints behind rate-limit

### 5. Performance Gate
- [ ] No N+1 queries in new RPC/Server Actions
- [ ] TanStack Query `staleTime` set on new hooks
- [ ] No blocking operations in Server Components
- [ ] Images optimized (Next.js Image component)

### 6. Accessibility Gate
- [ ] Interactive elements: `<button>` not `<div onClick>`
- [ ] All buttons: `type="button"` + `aria-label` if icon-only
- [ ] Touch targets: `min-height: 44px` on mobile
- [ ] Color contrast: WCAG AA (4.5:1 text, 3:1 UI components)

### 7. Migration Gate (only if DB changes)
- [ ] Migration file exists in `supabase/migrations/`
- [ ] Header: `SET search_path TO public;`
- [ ] New tables: `ALTER TABLE ... ENABLE ROW LEVEL SECURITY;`
- [ ] RPC functions: `SECURITY DEFINER` + `SET search_path = public`
- [ ] No destructive operations without backup plan
- [ ] `npx supabase db push` tested on staging

### 8. UX Smoke Test
- [ ] Golden path works in browser (`npm run dev` → manual test)
- [ ] Mobile view checked (Chrome DevTools mobile)
- [ ] No console errors / warnings
- [ ] Loading states visible, no layout shifts

---

## Verdict

```
PASS ✅ — All 8 green → deploy with confidence
WARN ⚠️ — Yellow items present → deploy with known risk
FAIL ❌ — Any red → do NOT deploy, fix first
```

---

## Integration with Workflow

```
adversarial-reviewer (code review)
→ npx tsc --noEmit
→ npm run build
→ ship-gate (full audit)
→ vercel --prod
→ self-improving-agent extract
```

---

## Marketplace Version

After `/plugin install engineering-advanced-skills@claude-code-skills`:
- Automated category checks via shell scripts
- Deploy-intent intercept (detects "vercel --prod" and auto-runs gate)
- History tracking — past failures and fixes
