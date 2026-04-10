# Implementation Plan - Fix Phantom VIP Toggle

Migrate the VIP toggle logic to a Server Action to ensure database persistence and fix the "Phantom Toggle" bug on the Master's Clients page.

## User Review Required

> [!IMPORTANT]
> The implementation will use `supabaseAdmin` (via `createAdminClient`) to bypass RLS for the `client_master_relations` table, as requested. The action will verify the `master_id` against the authenticated user to maintain security.

## Proposed Changes

### Master Clients Backend

#### [MODIFY] [actions.ts](file:///c:/Users/Vitossik/SaaS/bookit/src/app/(master)/dashboard/clients/actions.ts)
- Add `toggleClientVip(clientId: string, isVip: boolean)` server action.
- Get current master ID using `supabase.auth.getUser()`.
- Update `is_vip` in `client_master_relations` for the specific `master_id` and `client_id`.

---

### Master Clients Frontend

#### [MODIFY] [ClientDetailSheet.tsx](file:///c:/Users/Vitossik/SaaS/bookit/src/components/master/clients/ClientDetailSheet.tsx)
- Import `toggleClientVip` from the actions file.
- Implement `useTransition` to manage the loading state of the toggle.
- Update `handleToggleVip` to call the Server Action.
- Invalidate React Query caches (`['clients']`) after successful update.

## Open Questions

- Should I also invalidate a specific client query? The task mentions `(and any specific client detail query key)`. I need to check if there's a specific `['client', id]` query used in the application.

## Verification Plan

### Automated Tests
- Since this is a UI/DB integration, I will perform manual verification of the flow using the browser tool if possible, or at least ensure the code is syntactically correct and follows the project patterns.

### Manual Verification
1. Toggle VIP status in the Client Detail Sheet.
2. Observe optimistic UI update or loading state.
3. Refresh the page to confirm the status persists in the database.
