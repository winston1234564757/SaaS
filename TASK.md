🚨 OPERATION: ARCHITECTURE EXODUS (PHASE 2 - STATE, SUPABASE & SHARED) - RUFLO SWARM 🚨

CONTEXT: Phase 1 is complete. We are now porting Phase 2 of the Next.js to Vite SPA migration. You are the Principal Migration Engineer.

MISSION FOR THIS PHASE:
Port the core data layer, hooks, and shared layout components from ./bookit to ./bookit-spa.

TARGET DIRECTORIES TO PORT:
Read from ./bookit/src/ and write to ./bookit-spa/src/ for the following specific paths:

lib/constants/

lib/hooks/

lib/supabase/ (CRITICAL EXCEPTION: Do NOT port server.ts or admin.ts - this is a pure SPA now. Only port client.ts, safeQuery.ts, context.tsx, and the entire hooks/ subdirectory).

components/icons/

components/shared/

STRICT TRANSLATION PROTOCOLS:

Annihilate Server Directives: Strip "use client"; from all files.

Next.js Navigation Eradication: - Replace import { useRouter, usePathname, useSearchParams } from 'next/navigation' with import { useNavigate, useLocation, useSearchParams } from 'react-router-dom'.

Replace const router = useRouter() with const navigate = useNavigate(). Change router.push('/path') to Maps('/path').

Replace const pathname = usePathname() with const location = useLocation(); const pathname = location.pathname.

Next/Link & Next/Image: - Replace <Link href="..."> with <Link to="..."> (import from react-router-dom).

Replace <Image src={...} /> with <img src={...} />.

No Server Actions: If you encounter any Next.js Server Actions imported in these shared components, leave a // TODO: Refactor Server Action to Supabase Client comment next to them, but port the rest of the file.

EXECUTION DIRECTIVE:
Deploy your Ruflo Coder MCP tool. Process the target directories file-by-file. Apply the translation protocols rigorously. Do not stop until all files in these directories (excluding the forbidden server files) are successfully ported. Report back when Phase 2 is 100% complete.