🚨 OPERATION: GLOBAL INTEGRITY SWEEP & STUB ERADICATION (PHASE 6) -USE RUFLO SWARM 🚨

CONTEXT: We are finalizing the migration to the Vite SPA. In previous phases, the agent exhibited "lazy stubbing" (creating routing files with <div>TODO</div> or missing logic instead of fully porting the Next.js code). You are now the Lead Quality Assurance & Migration Enforcer.

MISSION:
Execute a merciless global sweep of the ./bookit-spa/src/ directory. Your absolute priority is to eradicate EVERY single stub, placeholder, or half-ported file, and verify that all data connections (Supabase/React Query) and routes are fully functional.

EXECUTION DIRECTIVES:

HUNT AND DESTROY STUBS (DEEP PORT):

Use your search/grep tool to scan ./bookit-spa/src/pages/ and ./bookit-spa/src/components/ for the word "TODO", "todo", or files that return extremely basic empty <div> tags instead of real UI.

For EVERY stub you find, locate the exact original file in ./bookit/src/app/ or ./bookit/src/components/.

DEEP PORT: Overwrite the stub in bookit-spa with the FULL, complete code from the original file. Translate all Next.js specific code (next/link, next/image, removed "use client") to Vite/React Router standards. DO NOT truncate or skip any logic, state, or JSX.

ROUTER MATRIX INTEGRITY:

Scan ./bookit-spa/src/App.tsx.

Verify that every single imported page component actually exists, is fully populated (not a stub), and is correctly exported. Fix any missing or dead imports.

DATA CONNECTION & HOOKS VERIFICATION:

Scan the newly ported pages. Ensure that all useQuery, useMutation (TanStack Query), and Supabase hooks (useBookings, useClients, etc.) are imported correctly from src/lib/supabase/hooks/ and are fully implemented inside the components.

Ensure NO components are marked as async function (this breaks Vite React 18 rendering).

LAZY LOADING & PERFORMANCE (OPTIONAL BUT RECOMMENDED):

If App.tsx has dozens of static imports, consider wrapping the heavy page routes (like Dashboard segments) in React.lazy() and <Suspense fallback={<Loader />}> to ensure the initial load is lightning fast.

ENFORCEMENT:
Do not report "Done" until you have actively searched for stubs, cross-referenced with the original Next.js codebase, and fully ported the missing logic. The application must be 100% feature-complete with zero placeholders. Report back with a list of the exact files you "un-stubbed" and fixed.

Що він робитиме:

Він просканує всі файли на наявність "TODO" або пустих div-ів.

Знайшовши такий файл, він полізе в стару папку bookit, візьме звідти твій оригінальний величезний код і акуратно вставить його в нову папку, виправивши імпорти.

Він перевірить App.tsx, щоб переконатися, що всі шляхи ведуть до реальних компонентів.

Опціонально, він може налаштувати React.lazy(), щоб твоя адмінка вантажилася по шматках і працювала ще швидше.