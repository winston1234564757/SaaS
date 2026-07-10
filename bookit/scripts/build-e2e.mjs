/**
 * Production build pointed at LOCAL Supabase, for e2e / own-eyes runs.
 *
 * Why this exists: `NEXT_PUBLIC_*` and the build-time bits of next.config.ts (CSP,
 * images.remotePatterns) are baked in at build time, so `next start` cannot be
 * retargeted afterwards — the build itself must carry the local Supabase origin.
 *
 * This used to be done with a `.env.production.local` file, which Next loads ahead of
 * `.env.local`. That silently retargeted EVERY local `npm run build` at local Supabase,
 * so a "pre-deploy build check" was never checking the production config. Loading the
 * env explicitly here keeps `npm run build` honest.
 *
 * Usage: npm run build:e2e   (then `npm run start`, or let Playwright's webServer do it)
 */
import { config } from 'dotenv';
import { spawnSync } from 'node:child_process';

// override: true — beat anything already exported in the shell.
config({ path: '.env.test', override: true });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
if (!/^https?:\/\/(127\.0\.0\.1|localhost)(:|\/|$)/.test(url)) {
  console.error(
    `[build:e2e] refusing to build: NEXT_PUBLIC_SUPABASE_URL is not local (${url || '<empty>'}).\n` +
    `            Point .env.test at your local \`supabase start\` instance.`,
  );
  process.exit(1);
}

console.log(`[build:e2e] building against ${url}`);

const result = spawnSync('npx', ['next', 'build'], {
  stdio: 'inherit',
  env: process.env,
  shell: true,
});

process.exit(result.status ?? 1);
