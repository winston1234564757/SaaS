/**
 * Global Setup — кешує auth state для всіх ізольованих E2E акаунтів.
 *
 * Стратегія: Supabase Admin API → magic link → витягуємо токени → інжектуємо
 * cookies напряму в Playwright context (UI login не потрібен).
 *
 * Ізоляція акаунтів (один домен = один акаунт = один storageState):
 *   e2e_master_timetravel@test.com → master-timetravel.json
 *   e2e_master_crm@test.com        → master-crm.json
 *   e2e_master_auth@test.com       → master-auth.json
 *   e2e_master_referral@test.com   → master-referral.json
 *   e2e_client@test.com            → client.json
 *   e2e_studioadmin@test.com       → studio-admin.json  (foundation — тести пізніше)
 *
 * Необхідні змінні у .env.test:
 *   NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, NEXT_PUBLIC_SUPABASE_ANON_KEY
 *   E2E_MASTER_TIMETRAVEL_EMAIL, E2E_MASTER_CRM_EMAIL, E2E_MASTER_AUTH_EMAIL
 *   E2E_MASTER_REFERRAL_EMAIL, E2E_CLIENT_EMAIL, E2E_STUDIO_ADMIN_EMAIL
 */
import { chromium, type FullConfig } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';

// ─── Env ──────────────────────────────────────────────────────────────────────

const supabaseUrl      = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey   = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Safety: global.setup runs in Node — dotenv already loaded by playwright.config.ts.

// ─── Account registry ─────────────────────────────────────────────────────────

interface AccountConfig {
  label: string;
  emailEnvVar: string;
  stateFile: string;
  /** Path prefix that the final URL must resolve to after auth bootstrap. */
  expectedPathPrefix: string;
  /** Paths that indicate auth/setup is not in a valid deterministic state. */
  disallowedPathPrefixes: string[];
  /**
   * Page to navigate after cookie injection.
   * Proxy.ts will redirect to the correct location based on role.
   */
  landingPath: string;
}

const ACCOUNTS: AccountConfig[] = [
  {
    label: 'master-timetravel',
    emailEnvVar: 'E2E_MASTER_TIMETRAVEL_EMAIL',
    stateFile: 'playwright/.auth/master-timetravel.json',
    expectedPathPrefix: '/dashboard',
    disallowedPathPrefixes: ['/login', '/register', '/my/setup/phone', '/dashboard/onboarding'],
    landingPath: '/dashboard',
  },
  {
    label: 'master-crm',
    emailEnvVar: 'E2E_MASTER_CRM_EMAIL',
    stateFile: 'playwright/.auth/master-crm.json',
    expectedPathPrefix: '/dashboard',
    disallowedPathPrefixes: ['/login', '/register', '/my/setup/phone', '/dashboard/onboarding'],
    landingPath: '/dashboard',
  },
  {
    label: 'master-auth',
    emailEnvVar: 'E2E_MASTER_AUTH_EMAIL',
    stateFile: 'playwright/.auth/master-auth.json',
    expectedPathPrefix: '/dashboard',
    disallowedPathPrefixes: ['/login', '/register', '/my/setup/phone', '/dashboard/onboarding'],
    landingPath: '/dashboard',
  },
  {
    label: 'master-referral',
    emailEnvVar: 'E2E_MASTER_REFERRAL_EMAIL',
    stateFile: 'playwright/.auth/master-referral.json',
    expectedPathPrefix: '/dashboard',
    disallowedPathPrefixes: ['/login', '/register', '/my/setup/phone', '/dashboard/onboarding'],
    landingPath: '/dashboard',
  },
  {
    label: 'client',
    emailEnvVar: 'E2E_CLIENT_EMAIL',
    stateFile: 'playwright/.auth/client.json',
    // proxy.ts redirects clients from /dashboard → /my/bookings.
    // Use strict /my/bookings contract so /my/setup/phone is treated as a setup failure.
    expectedPathPrefix: '/my/bookings',
    disallowedPathPrefixes: ['/login', '/register', '/my/setup/phone'],
    landingPath: '/dashboard',
  },
  {
    label: 'studio-admin',
    emailEnvVar: 'E2E_STUDIO_ADMIN_EMAIL',
    stateFile: 'playwright/.auth/studio-admin.json',
    expectedPathPrefix: '/dashboard',
    disallowedPathPrefixes: ['/login', '/register', '/my/setup/phone'],
    landingPath: '/dashboard',
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Decodes JWT payload without verification (sub/exp extraction only). */
function decodeJwtPayload(token: string): Record<string, unknown> {
  const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
  return JSON.parse(Buffer.from(base64, 'base64').toString('utf8'));
}

/** Derives Supabase project ref from the project URL. */
function getProjectRef(url: string): string {
  return new URL(url).hostname.split('.')[0];
}

/** Splits a string into chunks of maxLength (mirrors @supabase/ssr cookie chunking). */
function chunkString(str: string, maxLen: number): string[] {
  const chunks: string[] = [];
  for (let i = 0; i < str.length; i += maxLen) {
    chunks.push(str.slice(i, i + maxLen));
  }
  return chunks;
}

function assertLandingUrl(currentUrl: string, account: AccountConfig): void {
  const path = new URL(currentUrl).pathname;

  if (account.disallowedPathPrefixes.some((prefix) => path.startsWith(prefix))) {
    throw new Error(
      `[setup:${account.label}] Landed on disallowed path "${path}" after auth bootstrap`,
    );
  }

  if (!path.startsWith(account.expectedPathPrefix)) {
    throw new Error(
      `[setup:${account.label}] Path mismatch: got "${path}", expected prefix "${account.expectedPathPrefix}"`,
    );
  }
}

// ─── Core auth builder ────────────────────────────────────────────────────────

async function buildAuthState(
  baseURL: string,
  email: string,
  account: AccountConfig,
): Promise<void> {
  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // 1. Generate magic link (server-side — no email sent)
  const { data: linkData, error: linkErr } = await admin.auth.admin.generateLink({
    type: 'magiclink',
    email,
    options: { redirectTo: `${baseURL}${account.landingPath}` },
  });
  if (linkErr || !linkData.properties?.action_link) {
    throw new Error(`[setup:${account.label}] generateLink failed: ${linkErr?.message}`);
  }

  // 2. Follow the action_link (no redirect) → grab Location header with tokens
  const res = await fetch(linkData.properties.action_link, { redirect: 'manual' });
  const location = res.headers.get('location') ?? '';

  const hashIdx = location.indexOf('#');
  if (hashIdx < 0) {
    throw new Error(`[setup:${account.label}] No hash fragment in redirect: ${location}`);
  }
  const params = new URLSearchParams(location.slice(hashIdx + 1));

  const accessToken  = params.get('access_token');
  const refreshToken = params.get('refresh_token');
  const expiresAt    = parseInt(params.get('expires_at') ?? '0');
  const expiresIn    = parseInt(params.get('expires_in') ?? '3600');

  if (!accessToken || !refreshToken) {
    throw new Error(`[setup:${account.label}] Missing tokens in redirect`);
  }

  // 3. Fetch full user object
  const payload = decodeJwtPayload(accessToken);
  const userId  = payload.sub as string;
  const { data: { user }, error: userErr } = await admin.auth.admin.getUserById(userId);
  if (userErr || !user) {
    throw new Error(`[setup:${account.label}] getUserById failed: ${userErr?.message}`);
  }

  // 4. Build Supabase SSR session JSON
  const session = {
    access_token:  accessToken,
    token_type:    'bearer',
    expires_in:    expiresIn,
    expires_at:    expiresAt,
    refresh_token: refreshToken,
    user,
  };
  const sessionJson = JSON.stringify(session);

  // 5. Chunk + build cookies (mirrors @supabase/ssr chunking at 3180 chars)
  const CHUNK_SIZE   = 3180;
  const projectRef   = getProjectRef(supabaseUrl);
  const cookieBase   = `sb-${projectRef}-auth-token`;
  const chunks       = chunkString(sessionJson, CHUNK_SIZE);

  type SameSiteValue = 'Lax' | 'Strict' | 'None';
  const authCookies = chunks.map((chunk, i) => ({
    name:     chunks.length === 1 ? cookieBase : `${cookieBase}.${i}`,
    value:    chunk,
    domain:   'localhost',
    path:     '/',
    expires:  expiresAt,
    httpOnly: false,
    secure:   false,
    sameSite: 'Lax' as SameSiteValue,
  }));

  // 6. Open browser → inject cookies → navigate → assert URL → save storageState
  const browser = await chromium.launch();
  const context = await browser.newContext({ baseURL });
  await context.addCookies(authCookies);

  const page = await context.newPage();
  await page.goto(account.landingPath, { waitUntil: 'load', timeout: 120_000 });

  const currentUrl = page.url();
  try {
    assertLandingUrl(currentUrl, account);
  } catch (error) {
    const screenshotPath = `playwright/.auth/setup-fail-${account.label}.png`;
    await page.screenshot({ path: screenshotPath });
    await context.close();
    await browser.close();
    throw new Error(`${(error as Error).message}. Screenshot: ${screenshotPath}`);
  }

  await context.storageState({ path: account.stateFile });
  await context.close();
  await browser.close();

  console.log(`[setup] ✓ ${account.label} → ${account.stateFile}`);
}

// ─── Entry point ──────────────────────────────────────────────────────────────

export default async function globalSetup(config: FullConfig) {
  const baseURL = config.projects[0].use.baseURL ?? 'http://localhost:3000';

  if (!supabaseUrl || !serviceRoleKey) {
    console.warn('[setup] Missing Supabase env vars — skipping auth setup');
    return;
  }

  fs.mkdirSync('playwright/.auth', { recursive: true });

  for (const account of ACCOUNTS) {
    const email = process.env[account.emailEnvVar];

    if (!email) {
      console.warn(`[setup] ${account.emailEnvVar} not set — skipping ${account.label}`);
      continue;
    }

    // Safety: only allow e2e_*@test.com pattern
    if (!/^e2e_.+@test\.com$/.test(email)) {
      console.error(
        `[setup] SAFETY ABORT: ${account.emailEnvVar}="${email}" ` +
        `does not match e2e_*@test.com pattern. ` +
        `Refusing to auth non-test account.`,
      );
      continue;
    }

    try {
      await buildAuthState(baseURL, email, account);
    } catch (e) {
      console.warn(`[setup] ${account.label} auth failed: ${(e as Error).message}`);
      // Remove stale state file so tests skip gracefully instead of using expired tokens
      if (fs.existsSync(account.stateFile)) fs.unlinkSync(account.stateFile);
    }
  }

  console.log('[setup] Auth state caching complete.');
}
