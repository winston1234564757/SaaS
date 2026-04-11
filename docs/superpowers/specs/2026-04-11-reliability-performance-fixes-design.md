# Reliability & Performance Fixes — Design Spec
**Date:** 2026-04-11  
**Scope:** 5 targeted fixes — no new features, no aesthetic refactor  
**Execution order:** DB → Server → Hooks → React

---

## Context

Iron Machine audit (2026-04-11) identified 53 findings. CRITICAL/HIGH/MEDIUM were resolved.
This spec covers the remaining items that directly affect:
- **Correctness** — stale closure auto-selects a vacation day; fire-and-forget loses tour state
- **Performance** — select('*') over-fetches; sequential cron awaits; N+1 round-trips
- **Scalability** — N+1 worsens linearly with client roster size

---

## Fix 1 — Migration 068: `get_master_clients` RPC + JOIN

### Problem
`useClients.ts` makes 2 parallel round-trips on every CRM page open:
1. `rpc('get_master_clients')` — booking aggregates
2. `SELECT` from `client_master_relations` — is_vip + relation_id

JS then merges via `Map<clientId, {id, is_vip}>`. Every new client makes this slower (more rows in both queries, bigger JS map).

### Fix
`CREATE OR REPLACE FUNCTION get_master_clients(p_master_id uuid)` — add `LEFT JOIN client_master_relations` inside the RPC, return `is_vip boolean` and `relation_id uuid` as new columns.

```sql
CREATE OR REPLACE FUNCTION get_master_clients(p_master_id uuid)
RETURNS TABLE (
  client_phone  text,
  client_name   text,
  client_id     uuid,
  total_visits  bigint,
  total_spent   numeric,
  average_check numeric,
  last_visit_at text,
  is_vip        boolean,
  relation_id   uuid
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    b.client_phone,
    MAX(b.client_name)                       AS client_name,
    MAX(b.client_id::text)::uuid             AS client_id,
    COUNT(*)                                 AS total_visits,
    SUM(b.total_price)                       AS total_spent,
    ROUND(SUM(b.total_price) / COUNT(*), 2)  AS average_check,
    MAX(b.date)                              AS last_visit_at,
    COALESCE(BOOL_OR(r.is_vip), false)       AS is_vip,
    MAX(r.id)                                AS relation_id
  FROM bookings b
  LEFT JOIN client_master_relations r
         ON r.master_id  = p_master_id
        AND r.client_id  = b.client_id
        AND b.client_id IS NOT NULL
  WHERE b.master_id  = p_master_id
    AND b.status    != 'cancelled'
    AND b.client_phone IS NOT NULL
  GROUP BY b.client_phone
  ORDER BY COUNT(*) DESC
$$;

GRANT EXECUTE ON FUNCTION get_master_clients(uuid) TO authenticated;
```

**Notes:**
- `BOOL_OR(r.is_vip)` — if any relation for this phone is VIP → row is VIP. Handles multiple client_id per phone edge-case correctly.
- `MAX(r.id)` — deterministic relation_id; toggleClientVip uses `client_id`, not `relation_id`, so this is safe.
- Migration file: `supabase/migrations/068_get_master_clients_with_vip.sql`

### `useClients.ts` changes
Remove `Promise.all([rpc, relationsRes])` second query and all JS merge logic. Replace with single `rpc` call whose result already has `is_vip` and `relation_id`.

---

## Fix 2 — Cron Rebooking: Sequential → `Promise.allSettled`

### Problem
`src/app/api/cron/rebooking/route.ts` inner loop:
```typescript
await broadcastPush(...)       // sequential
await sendTelegramMessage(...) // sequential
```
For N bookings: `2N` sequential awaits. At 1000 bookings → 2000 awaits, dominated by Telegram API latency (~100-300ms each).

### Fix
```typescript
const [pushResult, tgResult] = await Promise.allSettled([
  userPushSubs.length > 0
    ? broadcastPush(userPushSubs as any, { title, body, url: bookingUrl })
    : Promise.resolve(0),
  tgChatId
    ? sendTelegramMessage(tgChatId, tgMsg)
    : Promise.resolve(null),
]);
const wasSent =
  (pushResult.status === 'fulfilled' && Number(pushResult.value) > 0) ||
  (tgResult.status === 'fulfilled' && !!tgChatId);
```

**Why `allSettled` not `all`:** One failing Telegram send must not skip the push notification (and vice versa). `allSettled` guarantees both are attempted regardless of individual failures.

---

## Fix 3 — `useServices` + `useProducts`: Explicit Column Select

### Problem
Both hooks use `.select('*')` in list queries, fetching `master_id`, `created_at`, `updated_at` on every dashboard render. These columns are never used by components.

### Fix — `useServices.ts`
```typescript
.select('id, name, emoji, category, price, duration_minutes, is_popular, is_active, sort_order, description, image_url')
```
`description` and `image_url` are kept — `rowToService` maps them and the service edit UI displays them.

### Fix — `useProducts.ts`
```typescript
.select('id, name, emoji, price, stock_unlimited, stock_quantity, is_active, sort_order, description, image_url')
```
Same reasoning — `rowToProduct` uses `description` and `image_url`.

**Excluded:** `master_id` (already filtered by `.eq('master_id', masterId!)`), `created_at`, `updated_at`.

---

## Fix 4 — `DashboardTourContext`: Fire-and-Forget → Logged Error

### Problem
`void markTourSeen()` silently discards any DB error. If save fails:
- This device: tour doesn't reappear (localStorage is set)
- Other devices: tour reappears next login (DB state not persisted)
- Result: inconsistent cross-device state with no visibility

### Fix
```typescript
markTourSeen().catch(err =>
  console.error('[Tour] Failed to persist tour completion:', err)
);
```

No retry logic needed — `localStorage` provides primary deduplication. Error log gives observability without blocking UX.

---

## Fix 5 — `BookingWizard`: Stale Closure in Auto-Select Effect

### Problem
Effect at lines 538–549 (auto-selects first available date on datetime step):

```typescript
useEffect(() => {
  if (step !== 'datetime' || !scheduleStore) return;
  if (selectedDate !== null) return;               // ← selectedDate captured at effect creation
  const first = days.find(d => {
    const s = toISO(d);
    return !offDayDates.has(s) && !fullyBookedDates.has(s); // ← offDayDates missing from deps
  });
  if (first) setSelectedDate(first);
// eslint-disable-next-line react-hooks/exhaustive-deps
}, [step, scheduleStore, fullyBookedDates]);
```

**Bug:** `offDayDates` is missing from deps. If a master adds a vacation day (`master_time_off`) while the wizard is open — `scheduleStore` updates, `offDayDates` recomputes, but this effect doesn't re-run with the new `offDayDates`. The auto-select can pick a newly-blocked vacation day.

**Why not just add `selectedDate` to deps:** Would cause the effect to fire on every user date-selection, re-running the auto-select on every change — wrong behavior.

### Fix: `useRef` for `selectedDate` inside the effect
```typescript
// Add ref alongside existing state (no new state variable)
const selectedDateRef = useRef<Date | null>(null);
selectedDateRef.current = selectedDate; // sync ref every render (before effects)

useEffect(() => {
  if (step !== 'datetime' || !scheduleStore) return;
  if (selectedDateRef.current !== null) return;  // reads current value via ref, not dep
  const first = days.find(d => {
    const s = toISO(d);
    return !offDayDates.has(s) && !fullyBookedDates.has(s);
  });
  if (first) setSelectedDate(first);
}, [step, scheduleStore, fullyBookedDates, days, offDayDates]); // all deps now correct, no suppress
```

**Effect 1 (`[isOpen, masterId]`):** All missing deps (`initialServices`, `mode`, `resetForm`, `setValue`, `ensureClientProfile`) are either stable references (RHF methods, state setters) or their change is always accompanied by wizard close+reopen. Disable is intentional — add a comment explaining why.

---

## Files Changed

| File | Change |
|------|--------|
| `supabase/migrations/068_get_master_clients_with_vip.sql` | New migration — RPC update |
| `src/lib/supabase/hooks/useClients.ts` | Single RPC call, remove merge logic |
| `src/app/api/cron/rebooking/route.ts` | Promise.allSettled |
| `src/lib/supabase/hooks/useServices.ts` | select('*') → explicit |
| `src/lib/supabase/hooks/useProducts.ts` | select('*') → explicit |
| `src/components/master/dashboard/DashboardTourContext.tsx` | Logged catch |
| `src/components/shared/BookingWizard.tsx` | selectedDateRef + fix deps + document effect 1 |

Total: 7 files, 1 new migration, ~50 lines changed.

---

## Verification

1. `npx tsc --noEmit` → EXIT:0
2. `npx supabase db push --dry-run` → shows migration 068
3. Manual smoke test: open CRM page → clients load with correct VIP badges
4. Manual: open BookingWizard → datetime step auto-selects first available day
5. Cron: unit-test with mock that delays push and telegram (both should complete)
