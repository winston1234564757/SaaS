🚨 OPERATION: ARCHITECTURE EXODUS (PHASE 4 - SYSTEM GLUE & CONFIG) - RUFLO SWARM 🚨

CONTEXT: Phases 1, 2, and 3 are completely successfully. We now have a full React tree in ./bookit-spa/src/. This is the final phase. We must fix the underlying infrastructure (Environment variables, Path Aliases, Tailwind config, and Public assets) to make the app compile and run perfectly.

MISSIONS FOR THIS PHASE:

Environment Variables Mass-Replace:
Scan the ENTIRE ./bookit-spa/src/ directory. Find every instance of process.env.NEXT_PUBLIC_... and replace it with import.meta.env.VITE_.... Target supabase/client.ts, webhook handlers, and anywhere Supabase/WayForPay keys are used. Also, copy the .env or .env.local file from ./bookit/ to ./bookit-spa/.env and rename the keys to use the VITE_ prefix instead of NEXT_PUBLIC_.

Tailwind & Global CSS Migration:

Copy ./bookit/tailwind.config.ts to ./bookit-spa/tailwind.config.ts. CRITICAL: Inside the new tailwind.config.ts, change the content array paths from ./src/app/**/*.{ts,tsx} and ./src/components/**/*.{ts,tsx} to just "./index.html" and "./src/**/*.{ts,tsx}".

Copy ./bookit/postcss.config.mjs to ./bookit-spa/postcss.config.mjs (or .js).

Replace ./bookit-spa/src/index.css with the complete contents of ./bookit/src/app/globals.css.

Ensure ./bookit-spa/src/main.tsx explicitly imports ./index.css.

Vite Configuration (Path Aliases & Build):
Update ./bookit-spa/vite.config.ts.

Import tsconfigPaths from vite-tsconfig-paths and add tsconfigPaths() to the plugins array. This is non-negotiable so Vite understands the @/* imports used throughout the components.

Also, ensure tsconfig.json and tsconfig.app.json in ./bookit-spa/ define "baseUrl": "." and "paths": { "@/*": ["./src/*"] } in compilerOptions.

Public Assets (PWA, Icons & HTML):

Copy the entire contents of ./bookit/public/ into ./bookit-spa/public/. Ensure manifest.json, sw.js, and all SVG/PNG icons are transferred so the PWA functionality remains perfectly intact.

Update ./bookit-spa/index.html. Add the <link rel="manifest" href="/manifest.json" />, <meta name="theme-color" content="#..." /> tags, and set the correct document title. Keep <div id="root"></div>.

EXECUTION DIRECTIVE:
Deploy your Ruflo Coder MCP tool. Apply these infrastructure fixes meticulously. You have absolute authority over config files. Do not stop until all 4 missions in this Phase 4 are executed. Report back when the global configuration is locked in and the App is ready to boot.