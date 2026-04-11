# Reliability & Performance Fixes — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 5 targeted fixes that improve correctness, performance, and scalability with zero behaviour changes for the user.

**Architecture:** Layer-first execution — DB migration first (unblocks hook simplification), then server, then hooks, then React components. Each task is independently committable and verifiable with `tsc --noEmit`.

**Tech Stack:** Next.js 16 App Router, Supabase (PostgreSQL + JS client), TanStack Query v5, TypeScript strict

---

## Files Changed

| File | Action | Task |
|------|--------|------|
| `bookit/supabase/migrations/068_get_master_clients_with_vip.sql` | Create | 1 |
| `bookit/src/lib/supabase/hooks/useClients.ts` | Modify | 1 |
| `bookit/src/app/api/cron/rebooking/route.ts` | Modify | 2 |
| `bookit/src/lib/supabase/hooks/useServices.ts` | Modify | 3 |
| `bookit/src/lib/supabase/hooks/useProducts.ts` | Modify | 3 |
| `bookit/src/components/master/dashboard/DashboardTourContext.tsx` | Modify | 4 |
| `bookit/src/components/shared/BookingWizard.tsx` | Modify | 5 |

---

## Task 1: Migration 068 — `get_master_clients` N+1 → Single RPC

**Problem:** `useClients.ts` makes 2 parallel round-trips — RPC for aggregates, then `client_master_relations` for VIP data — and merges them in JS. Adding `is_vip` + `relation_id` to the RPC eliminates the second query entirely.

**Files:**
- Create: `bookit/supabase/migrations/068_get_master_clients_with_vip.sql`
- Modify: `bookit/src/lib/supabase/hooks/useClients.ts`

- [ ] **Step 1.1 — Create migration file**

Create `bookit/supabase/migrations/068_get_master_clients_with_vip.sql` with this exact content:

```sql
-- Migration 068: add is_vip + relation_id to get_master_clients
-- Eliminates the second round-trip to client_master_relations in useClients.ts.
-- BOOL_OR(r.is_vip): true if ANY relation for this phone is VIP.
-- MAX(r.id): one deterministic relation_id; toggleClientVip uses client_id, not relation_id.

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

- [ ] **Step 1.2 — Dry-run migration**

Run from `bookit/`:
```bash
npx supabase db push --dry-run
```
Expected output: `Would push these migrations: • 068_get_master_clients_with_vip.sql`

- [ ] **Step 1.3 — Apply migration**

```bash
npx supabase db push
```
Expected: `Applying migration 068_get_master_clients_with_vip.sql... Finished supabase db push.`

- [ ] **Step 1.4 — Rewrite `useClients.ts` queryFn**

Replace the entire `queryFn` body (the section from `const [rpcRes, relationsRes]` through the end of the `.map(...)` call) with:

```typescript
queryFn: async (): Promise<ClientRow[]> => {
  const supabase = createClient();

  const { data, error } = await supabase
    .rpc('get_master_clients', { p_master_id: masterId! });

  if (error) throw error;

  return (data ?? []).map((row: {
    client_phone: string;
    client_name: string;
    client_id: string | null;
    total_visits: number;
    total_spent: number;
    average_check: number;
    last_visit_at: string | null;
    is_vip: boolean;
    relation_id: string | null;
  }) => ({
    id:            row.client_phone,
    client_id:     row.client_id ?? null,
    client_name:   row.client_name ?? 'Клієнт',
    client_phone:  row.client_phone,
    total_visits:  Number(row.total_visits),
    total_spent:   Number(row.total_spent),
    average_check: Number(row.average_check),
    last_visit_at: row.last_visit_at ?? null,
    is_vip:        row.is_vip ?? false,
    relation_id:   row.relation_id ?? null,
  }));
},
```

- [ ] **Step 1.5 — TypeScript check**

```bash
npx tsc --noEmit
```
Expected: no output, `EXIT:0`

- [ ] **Step 1.6 — Commit**

```bash
git add bookit/supabase/migrations/068_get_master_clients_with_vip.sql bookit/src/lib/supabase/hooks/useClients.ts
git commit -m "perf: get_master_clients N+1 → single RPC with LEFT JOIN (migration 068)"
```

---

## Task 2: Cron Rebooking — Sequential `await` → `Promise.allSettled`

**Problem:** Inner loop in `rebooking/route.ts` awaits `broadcastPush` then `sendTelegramMessage` sequentially. For N bookings = 2N sequential awaits. Telegram API latency ~100-300ms each → at 1000 reminders this is minutes of wall-clock time.

**Files:**
- Modify: `bookit/src/app/api/cron/rebooking/route.ts:98–110`

- [ ] **Step 2.1 — Replace sequential awaits**

Find and replace lines 98–110 in `bookit/src/app/api/cron/rebooking/route.ts`.

**Before (lines 98–110):**
```typescript
    let wasSent = false;

    const userPushSubs = pushSubsByUser.get(clientId) ?? [];
    if (userPushSubs.length > 0) {
      const count = await broadcastPush(userPushSubs as any, { title, body, url: bookingUrl });
      if (count > 0) wasSent = true;
    }

    const tgChatId = tgChatByUser.get(clientId);
    if (tgChatId) {
      await sendTelegramMessage(tgChatId, tgMsg);
      wasSent = true;
    }
```

**After:**
```typescript
    const userPushSubs = pushSubsByUser.get(clientId) ?? [];
    const tgChatId = tgChatByUser.get(clientId);

    // PERF: run push + telegram in parallel — both are fire-and-forget notifications,
    // a failure in one must not block or cancel the other.
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

- [ ] **Step 2.2 — TypeScript check**

```bash
npx tsc --noEmit
```
Expected: no output, `EXIT:0`

- [ ] **Step 2.3 — Commit**

```bash
git add bookit/src/app/api/cron/rebooking/route.ts
git commit -m "perf: cron rebooking push+telegram sequential → Promise.allSettled"
```

---

## Task 3: `useServices` + `useProducts` — Explicit Column Select

**Problem:** Both list queries use `.select('*')`, fetching `master_id`, `created_at`, `updated_at` on every dashboard render. These are never used by components.

**Files:**
- Modify: `bookit/src/lib/supabase/hooks/useServices.ts:73`
- Modify: `bookit/src/lib/supabase/hooks/useProducts.ts:68`

- [ ] **Step 3.1 — Narrow `useServices` select**

In `bookit/src/lib/supabase/hooks/useServices.ts`, find and replace:
```typescript
            .select('*')
            .eq('master_id', masterId!)
            .order('sort_order', { ascending: true })
            .order('created_at', { ascending: true })
```

With:
```typescript
            .select('id, name, emoji, category, price, duration_minutes, is_popular, is_active, sort_order, description, image_url')
            .eq('master_id', masterId!)
            .order('sort_order', { ascending: true })
            .order('created_at', { ascending: true })
```

Note: `description` and `image_url` are kept — `rowToService` maps both and the service edit UI displays them.

- [ ] **Step 3.2 — Narrow `useProducts` select**

In `bookit/src/lib/supabase/hooks/useProducts.ts`, find and replace:
```typescript
            .select('*')
            .eq('master_id', masterId!)
            .order('sort_order', { ascending: true })
```

With:
```typescript
            .select('id, name, emoji, price, stock_unlimited, stock_quantity, is_active, sort_order, description, image_url')
            .eq('master_id', masterId!)
            .order('sort_order', { ascending: true })
```

- [ ] **Step 3.3 — TypeScript check**

```bash
npx tsc --noEmit
```
Expected: no output, `EXIT:0`

- [ ] **Step 3.4 — Commit**

```bash
git add bookit/src/lib/supabase/hooks/useServices.ts bookit/src/lib/supabase/hooks/useProducts.ts
git commit -m "perf: useServices + useProducts select(*) → explicit column list"
```

---

## Task 4: `DashboardTourContext` — Fire-and-Forget → Logged Error

**Problem:** `void markTourSeen()` silently discards DB errors. If save fails, localStorage is set (tour won't reappear here) but DB is not updated (tour reappears on other devices next login). No visibility into failures.

**Files:**
- Modify: `bookit/src/components/master/dashboard/DashboardTourContext.tsx:62`

- [ ] **Step 4.1 — Add error logging**

In `bookit/src/components/master/dashboard/DashboardTourContext.tsx`, find and replace:
```typescript
    void markTourSeen(); // fire-and-forget, DB persistence
```

With:
```typescript
    markTourSeen().catch(err =>
      console.error('[Tour] Failed to persist tour completion to DB:', err)
    );
```

- [ ] **Step 4.2 — TypeScript check**

```bash
npx tsc --noEmit
```
Expected: no output, `EXIT:0`

- [ ] **Step 4.3 — Commit**

```bash
git add bookit/src/components/master/dashboard/DashboardTourContext.tsx
git commit -m "fix: DashboardTourContext fire-and-forget → logged catch for DB persistence"
```

---

## Task 5: `BookingWizard` — Stale Closure in Auto-Select Effect

**Problem:** Auto-select effect (finds first available date on datetime step) has `offDayDates` missing from deps. If a master adds a vacation day while the wizard is open, `offDayDates` recomputes but the effect doesn't re-run — auto-select can pick a newly-blocked day.

Cannot add `selectedDate` to deps directly (would re-trigger on every user date-click). Solution: sync `selectedDate` to a `useRef` and read via ref inside the effect.

**Files:**
- Modify: `bookit/src/components/shared/BookingWizard.tsx`

- [ ] **Step 5.1 — Add `selectedDateRef` declaration**

In `bookit/src/components/shared/BookingWizard.tsx`, find the line:
```typescript
  const [selectedDate, setSelectedDate]         = useState<Date | null>(null);
```

Add two lines directly below it:
```typescript
  const [selectedDate, setSelectedDate]         = useState<Date | null>(null);
  // Ref kept in sync with selectedDate every render — read by auto-select effect
  // to avoid adding selectedDate to deps (would re-run on every user date-click).
  const selectedDateRef = useRef<Date | null>(null);
  selectedDateRef.current = selectedDate;
```

- [ ] **Step 5.2 — Fix the auto-select effect**

Find and replace the auto-select `useEffect` block (lines ~538–549). Replace this:

```typescript
  useEffect(() => {
    if (step !== 'datetime' || !scheduleStore) return;
    if (selectedDate !== null) return;

    const firstAvailable = days.find(d => {
      const str = toISO(d);
      return !offDayDates.has(str) && !fullyBookedDates.has(str);
    });

    if (firstAvailable) setSelectedDate(firstAvailable);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, scheduleStore, fullyBookedDates]);
```

With:
```typescript
  useEffect(() => {
    if (step !== 'datetime' || !scheduleStore) return;
    if (selectedDateRef.current !== null) return;

    const firstAvailable = days.find(d => {
      const str = toISO(d);
      return !offDayDates.has(str) && !fullyBookedDates.has(str);
    });

    if (firstAvailable) setSelectedDate(firstAvailable);
  }, [step, scheduleStore, fullyBookedDates, days, offDayDates]);
```

- [ ] **Step 5.3 — Document Effect 1 (`[isOpen, masterId]`) intentional disable**

Find the eslint-disable comment at line ~450:
```typescript
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, masterId]);
```

Replace with an explanatory comment (keep the disable — omissions are intentional):
```typescript
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  // Intentionally limited to [isOpen, masterId]:
  //   initialServices — stable per wizard lifecycle (parent closes+reopens to change it)
  //   mode            — constant per component instance
  //   resetForm/setValue — RHF stable refs, never change identity
  //   ensureClientProfile — imported stable function from actions module
  }, [isOpen, masterId]);
```

- [ ] **Step 5.4 — TypeScript check**

```bash
npx tsc --noEmit
```
Expected: no output, `EXIT:0`

- [ ] **Step 5.5 — Commit**

```bash
git add bookit/src/components/shared/BookingWizard.tsx
git commit -m "fix: BookingWizard auto-select uses ref to fix stale offDayDates closure"
```

---

## Final Verification

- [ ] **Full TypeScript pass**

```bash
npx tsc --noEmit; echo "EXIT:$?"
```
Expected: `EXIT:0`

- [ ] **Smoke test checklist**
  - Open `/dashboard/clients` → clients load, VIP badges correct, no console errors
  - Open booking wizard on any master page → datetime step auto-selects first available date
  - Open dashboard → tour (if not seen) completes and `has_seen_tour` updates in DB
  - Cron endpoint: `GET /api/cron/rebooking` with valid `CRON_SECRET` header returns `{ ok: true }`

- [ ] **Update audit report**

In `bookit/SECURITY_AND_OPTIMIZATION_AUDIT.md`, mark backlog items 20-22 as done ✅.

- [ ] **Final commit**

```bash
git add bookit/SECURITY_AND_OPTIMIZATION_AUDIT.md
git commit -m "docs: mark reliability/performance backlog items complete"
```
