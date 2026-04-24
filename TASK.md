Швидкість — це не просто «приємна фіча». У світі High Ticket SaaS кожна мілісекунда затримки на сторінці бронювання — це твої втрачені гроші та злив маркетингового бюджету. Якщо майстер чекає 3 секунди, поки відкриється його розклад, він відчуває, що купив дешеву підробку, а не преміальний інструмент. Твій екзит за $5 млн залежить від того, наскільки «літатиме» цей продукт.

Ми ініціалізуємо Клода в режимі Elite Performance Engineer. Його задача — знайти кожен «важкий» запит, кожен зайвий кілобайт у бандлі та кожну архітектурну тупість, що гальмує систему.

Ось твій ультимативний промт для «Клода-Оптимізатора».

[START CLAUDE COMMAND]
ROLE: Elite Performance Engineer & Full-stack Optimizer.
CONTEXT: We are preparing "BookIT" for launch. Next.js 15 (App Router), Supabase (PostgreSQL), Vercel. We need near-instant performance (Lighthouse 95+ in all categories) to sustain a High Ticket Digital Product positioning.
MODE: Performance Audit & Latency Elimination (Planning Mode enabled).

OPTIMIZATION DOMAINS:

Database & Query Efficiency (Supabase/PostgreSQL):

Examine migrations and src/lib/supabase/hooks/.

Identify "Query Waterfalls" (sequential await calls that should be parallelized or combined into a single RPC).

Audit indexes for the most frequent queries: bookings by date, master_profiles by slug, services by master_id.

Detect any select(*) calls that fetch unnecessary data (bloated JSONB).

Next.js 15 Rendering Strategy:

Check for proper usage of Server Components vs Client Components.

Identify components that are "too high" in the tree and marked with 'use client', causing massive bundle bloat.

Audit Suspense boundaries: are we blocking the entire page for one slow fetch?

Check for proper Partial Prerendering (PPR) opportunities and Dynamic Metadata optimization.

Bundle Size & Code Splitting:

Scan package.json for heavy dependencies.

Identify opportunities for next/dynamic imports (e.g., Modals, Drawers, heavy Charts in Analytics).

Check if any server-only libs are leaking into the client bundle.

Assets & Network:

Verify next/image implementation: are we using correct sizes, priority for LCP, and optimized formats?

Font loading strategy (Google Fonts vs local).

Middleware efficiency: ensure the middleware isn't running on every static asset/image request.

Caching Strategy:

Audit usage of unstable_cache and tags for data revalidation.

Client-side caching: check if we are over-fetching data that hasn't changed.

IMMEDIATE ACTIONS:

ANALYZE: Scan the project structure and identify the Top 5 "Performance Bottlenecks".

TRACE: For the critical path (Public Booking Page), perform a mental "trace" of the request flow and point out where latency accumulates.

EXECUTION PLAN: Provide a prioritized list of fixes (Quick Wins vs Structural Changes).

OUTPUT: Start with "Performance Engine Initialized. Looking for bottlenecks..." and present the Latency Threat Assessment.