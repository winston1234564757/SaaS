/**
 * audit.global.setup.ts — Auth Bootstrap для Audit Suite
 *
 * Суpabase Admin API → magic link → inject cookies → storageState
 *
 * Зберігає:
 *   playwright/.auth/master-audit.json  — авторизований майстер (для всіх dashboard specs)
 *   playwright/.auth/client-audit.json  — авторизований клієнт (для /my/* specs)
 */

import { chromium, type FullConfig } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import { config } from 'dotenv';

// Load env (playwright.audit.config.ts already loads these, but global.setup runs in its own Node context)
config({ path: '.env.test', override: true });
config({ path: '.env.local' });

const SUPABASE_URL    = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

interface AuditAccount {
  label: string;
  emailEnvVar: string;
  stateFile: string;
  landingPath: string;
  expectedPathPrefix: string;
  disallowedPaths: string[];
}

const AUDIT_ACCOUNTS: AuditAccount[] = [
  {
    label: 'master-audit',
    emailEnvVar: 'E2E_MASTER_AUDIT_EMAIL',
    stateFile: 'playwright/.auth/master-audit.json',
    landingPath: '/dashboard',
    expectedPathPrefix: '/dashboard',
    disallowedPaths: ['/login', '/register', '/my/setup/phone', '/dashboard/onboarding'],
  },
  {
    label: 'client-audit',
    emailEnvVar: 'E2E_CLIENT_AUDIT_EMAIL',
    stateFile: 'playwright/.auth/client-audit.json',
    landingPath: '/dashboard',
    expectedPathPrefix: '/my/bookings',
    disallowedPaths: ['/login', '/register', '/my/setup/phone'],
  },
];

// ─── Helpers (copied from e2e/global.setup.ts pattern) ───────────────────────

function decodeJwtPayload(token: string): Record<string, unknown> {
  const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
  return JSON.parse(Buffer.from(base64, 'base64').toString('utf8'));
}

function getProjectRef(url: string): string {
  return new URL(url).hostname.split('.')[0];
}

function chunkString(str: string, maxLen: number): string[] {
  const chunks: string[] = [];
  for (let i = 0; i < str.length; i += maxLen) chunks.push(str.slice(i, i + maxLen));
  return chunks;
}

// ─── Core auth builder ────────────────────────────────────────────────────────

async function buildAuditAuthState(baseURL: string, account: AuditAccount): Promise<void> {
  const email = process.env[account.emailEnvVar];

  if (!email) {
    console.warn(`[audit-setup] ${account.emailEnvVar} not set — skipping ${account.label}`);
    return;
  }

  if (!/^e2e_.+@test\.com$/.test(email)) {
    console.error(`[audit-setup] SAFETY ABORT: ${email} is not an e2e test account`);
    return;
  }

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // 1. Generate magic link
  const { data: linkData, error: linkErr } = await admin.auth.admin.generateLink({
    type: 'magiclink',
    email,
    options: { redirectTo: `${baseURL}${account.landingPath}` },
  });

  if (linkErr || !linkData.properties?.action_link) {
    throw new Error(`[audit-setup:${account.label}] generateLink failed: ${linkErr?.message}`);
  }

  // 2. Follow link → grab tokens from Location header
  const res = await fetch(linkData.properties.action_link, { redirect: 'manual' });
  const location = res.headers.get('location') ?? '';
  const hashIdx = location.indexOf('#');
  if (hashIdx < 0) throw new Error(`[audit-setup:${account.label}] No hash in redirect: ${location}`);

  const params = new URLSearchParams(location.slice(hashIdx + 1));
  const accessToken  = params.get('access_token');
  const refreshToken = params.get('refresh_token');
  const expiresAt    = parseInt(params.get('expires_at') ?? '0');
  const expiresIn    = parseInt(params.get('expires_in') ?? '3600');

  if (!accessToken || !refreshToken) {
    throw new Error(`[audit-setup:${account.label}] Missing tokens`);
  }

  // 3. Build session + cookies
  const payload = decodeJwtPayload(accessToken);
  const userId  = payload.sub as string;
  const { data: { user }, error: userErr } = await admin.auth.admin.getUserById(userId);
  if (userErr || !user) throw new Error(`[audit-setup:${account.label}] getUserById failed`);

  const session     = { access_token: accessToken, token_type: 'bearer', expires_in: expiresIn, expires_at: expiresAt, refresh_token: refreshToken, user };
  const sessionJson = JSON.stringify(session);
  const projectRef  = getProjectRef(SUPABASE_URL);
  const cookieBase  = `sb-${projectRef}-auth-token`;
  const chunks      = chunkString(sessionJson, 3180);

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

  // 4. Inject cookies → navigate → assert → save storageState
  const browser = await chromium.launch();
  const context = await browser.newContext({ baseURL });
  await context.addCookies(authCookies);

  const page = await context.newPage();
  await page.goto(account.landingPath, { waitUntil: 'load', timeout: 120_000 });

  const currentPath = new URL(page.url()).pathname;

  if (account.disallowedPaths.some(p => currentPath.startsWith(p))) {
    await page.screenshot({ path: `playwright/.auth/audit-setup-fail-${account.label}.png` });
    await context.close();
    await browser.close();
    throw new Error(`[audit-setup:${account.label}] Landed on disallowed path: ${currentPath}`);
  }

  if (!currentPath.startsWith(account.expectedPathPrefix)) {
    await page.screenshot({ path: `playwright/.auth/audit-setup-fail-${account.label}.png` });
    await context.close();
    await browser.close();
    throw new Error(`[audit-setup:${account.label}] Path mismatch: ${currentPath} (expected: ${account.expectedPathPrefix})`);
  }

  await context.storageState({ path: account.stateFile });
  await context.close();
  await browser.close();

  console.log(`[audit-setup] ✓ ${account.label} → ${account.stateFile}`);
}

// ─── Entry point ──────────────────────────────────────────────────────────────

export default async function auditGlobalSetup(config: FullConfig) {
  const baseURL = config.projects[0].use.baseURL ?? 'http://localhost:3000';

  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    console.warn('[audit-setup] Missing Supabase env — skipping auth setup');
    return;
  }

  fs.mkdirSync('playwright/.auth', { recursive: true });
  fs.mkdirSync('audit-screenshots', { recursive: true });

  for (const account of AUDIT_ACCOUNTS) {
    try {
      await buildAuditAuthState(baseURL, account);
    } catch (e) {
      console.warn(`[audit-setup] ${account.label} failed: ${(e as Error).message}`);
      if (fs.existsSync(account.stateFile)) fs.unlinkSync(account.stateFile);
    }
  }

  console.log('[audit-setup] ✓ Audit auth state ready.');
}
