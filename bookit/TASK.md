🚨 URGENT ARCHITECTURAL OVERHAUL: GLOBAL DATA PIPELINE & STATE PARALYSIS (RUFLO SWARM ONLY) 🚨

STATUS: SYSTEMIC FAILURE. The application is suffering from catastrophic, app-wide data fetching and state management issues. We are done playing whack-a-mole with localized bugs. You must deploy your Ruflo Architect and Coder agents to implement a global fix across the entire infrastructure.

THE 4 FATAL SYMPTOMS WE MUST ERADICATE:

Silent Deadlocks & Infinite Spinners: Mutations (like image uploads or complex saves) randomly hang indefinitely. isPending stays true, but there are zero network requests and zero console errors. Promises are being swallowed before execution.

PWA Idle Death: Leaving the app in the background for 3+ minutes causes the Supabase token to expire. Upon returning, TanStack Query fires with a dead token, gets a 401, caches the error state, and permanently displays skeleton loaders until a hard F5 refresh.

Cache Schizophrenia: Data becomes stale immediately after mutations. The Next.js RSC cache and React Query client cache are out of sync. revalidatePath is failing to update the client UI.

Dead Props & Missing Data: Modals and hybrid pages (Portfolio, Flash Deals) fail to render related data (like useServices()) because they rely on stale server-side props instead of active React Query subscriptions.

STRICT EXECUTION DIRECTIVES FOR THE SWARM:
Do NOT use native file editing. Do NOT use single-threaded "high effort" guessing. Call your Ruflo MCP tool to execute the following GLOBAL RESURRECTION PLAN:

PHASE 1: The Promise Enforcer (Anti-Deadlock)
Scan all critical useMutation hooks (especially storage uploads in usePortfolio). Ensure EVERY Supabase async call is wrapped in rigorous try/catch blocks. Implement Promise.race with 10-second timeout breakers for .upload() calls. Force isPending to resolve and throw visible errors. NO SILENT FAILURES ALLOWED.

PHASE 2: The PWA Auto-Recovery (Anti-Idle Death)
Rewrite src/lib/providers/QueryProvider.tsx.

Fix the TanStack Query v5 focusManager (ensure onFocus(true) is called).

Add a global onAuthStateChange listener that catches TOKEN_REFRESHED and explicitly calls queryClient.resetQueries({ type: 'active' }) to clear cached 401 errors.

Ensure useDeepSleepWakeup uses a fresh token before triggering refetches.

PHASE 3: 100% Client-Side Consistency (Anti-Stale Cache)
Strip revalidatePath from ALL Dashboard Server Actions. Every single dashboard useMutation MUST have an onSuccess block that calls queryClient.invalidateQueries() for its exact domain.

PHASE 4: Hydration Fixes
Ensure modals (like Portfolio item views) actively call their respective hooks (e.g., useServices()) to fetch required relational data, rather than relying on dead prop drilling.

ACTION:
Deploy the swarm. Analyze QueryProvider.tsx, usePortfolio.ts, and the main dashboard layout/mutations. Implement these structural fixes line-by-line and report back when the global pipeline is bulletproof.