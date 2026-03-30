🚨 OPERATION: POST-MIGRATION AUDIT & VULNERABILITY SWEEP (PHASE 5) - RUFLO SWARM 🚨

CONTEXT: We have successfully migrated the architecture from Next.js to a pure Vite SPA. However, we need to ensure no Next.js paradigms, server-side logic, or broken routing methods have leaked into the Vite codebase (./bookit-spa/src/). You are the Lead QA & Security Architect.

MISSION:
Execute a deep codebase scan using your MCP search/grep tools to hunt down and automatically patch the most common Next.js-to-Vite migration vulnerabilities.

VULNERABILITY MATRIX TO SCAN & DESTROY:

The Async Component Crash:

Search for: export default async function or export async function inside src/pages/ and src/components/.

Fix: Standard React components in Vite CANNOT be async. Remove the async keyword. Move any await logic inside a useEffect or use TanStack Query hooks.

Dead Next.js Imports:

Search for: from 'next/link', from 'next/image', from 'next/navigation', from 'next/font'.

Fix: Replace with react-router-dom equivalents or standard HTML tags.

Server Action & Form Traps:

Search for: <form action={ or action={.

Fix: SPA forms must use onSubmit={handleSubmit}. Convert any leftover Server Action forms to standard React Hook Form or onSubmit handlers calling Supabase client mutations.

Environment Variable Leaks:

Search for: process.env.NEXT_PUBLIC anywhere in the src/ directory.

Fix: Replace completely with import.meta.env.VITE_.

Server Artifacts & Metadata:

Search for: "use client", 'use client', export const metadata, generateMetadata.

Fix: Delete these lines entirely. They cause build errors in Vite.

Hard Reloads & Window Location:

Search for: window.location.href = or window.location.reload() used for internal routing.

Fix: Replace with Maps('/path') from react-router-dom to maintain the SPA state, unless redirecting to an external site like WayForPay.

EXECUTION DIRECTIVE:
Deploy your MCP tools to grep/search the codebase for these exact patterns. Do not read file-by-file blindly; use targeted text searches. When a vulnerability is found, open the file, rewrite the broken logic to fit the Vite SPA architecture, and save it. Report back with a summary of the "defused mines".