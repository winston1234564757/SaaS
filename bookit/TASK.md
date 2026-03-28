CRITICAL BUG FIX: PORTFOLIO UPLOAD & SERVICE LINKING (RUFLO SWARM DIRECTIVE)

CONTEXT:
We are working on the Bookit SaaS (Next.js App Router, React Query v5, Supabase). The Portfolio feature is currently broken.

SYMPTOMS:

Infinite Spinner: Attempting to upload a new portfolio photo results in an endless loading state. The UI never recovers.

Missing Services for Linking: When trying to link a service to an existing portfolio photo, the services do not render, or the list is completely empty.

SUSPECTED ARCHITECTURAL VIOLATIONS:

The upload useMutation is likely missing queryClient.invalidateQueries({ queryKey: ['portfolio'] }) in its onSuccess callback, OR it's swallowing a Supabase storage error.

The modal/component handling the photo details is failing to fetch the master's services using the useServices() hook, or the data is not being hydrated properly.

A possible violation of the "No Blocking getSession() in QueryFn" rule.

STRICT EXECUTION RULE (RUFLO ONLY):
You are strictly FORBIDDEN from using your native single-threaded file-editing tools. Do NOT use "high effort" mode. You MUST invoke your Ruflo MCP tools to deploy the Swarm (Coder & Architect) to fix this bug.

MISSIONS FOR THE SWARM:

Analyze: Scan src/components/master/portfolio (e.g., PortfolioPage.tsx and related modals/uploaders) and src/lib/supabase/hooks/usePortfolio.ts.

Fix Upload: Resolve the infinite spinner. Ensure the mutation handles loading states (isPending) correctly and invalidates the query on success.

Fix Service Linking: Ensure the photo-detail component correctly fetches available services (via React Query) and allows the master to link them to the photo.

Execute: Apply the exact code changes and report back.

Call the Ruflo tool NOW to begin.