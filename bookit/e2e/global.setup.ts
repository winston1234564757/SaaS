/**
 * Global Setup — зберігає auth state для master і client.
 *
 * Підхід: Supabase Admin API → magic link → extract tokens → set session
 * cookies directly in Playwright context (bypasses UI completely).
 *
 * Потрібні змінні у .env.local:
 *   E2E_MASTER_EMAIL, E2E_CLIENT_EMAIL
 *   NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, NEXT_PUBLIC_SUPABASE_ANON_KEY
 */
import { chromium, type FullConfig } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/** Decodes JWT payload without verification (for sub/exp extraction only). */
function decodeJwtPayload(token: string): Record<string, unknown> {
  const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
  const json = Buffer.from(base64, 'base64').toString('utf8');
  return JSON.parse(json);
}

/** Derives Supabase project ref from the project URL. */
function getProjectRef(url: string): string {
  return new URL(url).hostname.split('.')[0];
}

/** Splits a string into chunks of maxLength. */
function chunkString(str: string, maxLen: number): string[] {
  const chunks: string[] = [];
  for (let i = 0; i < str.length; i += maxLen) {
    chunks.push(str.slice(i, i + maxLen));
  }
  return chunks;
}

async function buildAuthState(
  baseURL: string,
  email: string,
  expectedUrlPattern: RegExp,
  stateFile: string,
) {
  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // 1. Generate magic link (don't send email — just get the action_link)
  const { data: linkData, error: linkErr } = await admin.auth.admin.generateLink({
    type: 'magiclink',
    email,
    options: { redirectTo: `${baseURL}/dashboard` },
  });
  if (linkErr || !linkData.properties?.action_link) {
    throw new Error(`generateLink failed for ${email}: ${linkErr?.message}`);
  }

  // 2. Follow the action_link (manual, no redirect) — get Location header with tokens
  const res = await fetch(linkData.properties.action_link, { redirect: 'manual' });
  const location = res.headers.get('location') ?? '';

  // Parse hash fragment: #access_token=...&refresh_token=...&expires_at=...
  const hashIdx = location.indexOf('#');
  if (hashIdx < 0) throw new Error(`No hash fragment in redirect URL: ${location}`);
  const params = new URLSearchParams(location.slice(hashIdx + 1));

  const accessToken = params.get('access_token');
  const refreshToken = params.get('refresh_token');
  const expiresAt = parseInt(params.get('expires_at') ?? '0');
  const expiresIn = parseInt(params.get('expires_in') ?? '3600');

  if (!accessToken || !refreshToken) {
    throw new Error(`Missing tokens in redirect: ${location.slice(hashIdx)}`);
  }

  // 3. Get full user object via admin API
  const payload = decodeJwtPayload(accessToken);
  const userId = payload.sub as string;
  const { data: { user }, error: userErr } = await admin.auth.admin.getUserById(userId);
  if (userErr || !user) throw new Error(`getUserById failed: ${userErr?.message}`);

  // 4. Build the session JSON (Supabase SSR format)
  const session = {
    access_token: accessToken,
    token_type: 'bearer',
    expires_in: expiresIn,
    expires_at: expiresAt,
    refresh_token: refreshToken,
    user,
  };
  const sessionJson = JSON.stringify(session);

  // 5. Chunk and set cookies in Playwright context
  //    @supabase/ssr chunks at 3180 chars per cookie
  const CHUNK_SIZE = 3180;
  const projectRef = getProjectRef(supabaseUrl);
  const cookieBaseName = `sb-${projectRef}-auth-token`;
  const chunks = chunkString(sessionJson, CHUNK_SIZE);

  const cookieExpiry = expiresAt; // unix timestamp

  const authCookies: { name: string; value: string; domain: string; path: string; expires: number; httpOnly: boolean; secure: boolean; sameSite: 'Lax' | 'Strict' | 'None' }[] = chunks.map(
    (chunk, i) => ({
      name: chunks.length === 1 ? cookieBaseName : `${cookieBaseName}.${i}`,
      value: chunk,
      domain: 'localhost',
      path: '/',
      expires: cookieExpiry,
      httpOnly: false,
      secure: false,
      sameSite: 'Lax',
    }),
  );

  // 6. Open browser, inject cookies, navigate to expected URL, save state
  const browser = await chromium.launch();
  const context = await browser.newContext({ baseURL });
  await context.addCookies(authCookies);

  const page = await context.newPage();
  await page.goto('/dashboard', { waitUntil: 'load', timeout: 120_000 });

  const currentUrl = page.url();
  if (!expectedUrlPattern.test(currentUrl)) {
    await page.screenshot({ path: `playwright/.auth/setup-fail-${email.split('@')[0]}.png` });
    throw new Error(`[setup] URL mismatch for ${email}: ${currentUrl}`);
  }

  await context.storageState({ path: stateFile });
  await context.close();
  await browser.close();
}

export default async function globalSetup(config: FullConfig) {
  const baseURL = config.projects[0].use.baseURL ?? 'http://localhost:3000';

  if (!supabaseUrl || !serviceRoleKey || !anonKey) {
    console.warn('[setup] Missing Supabase env vars — skipping auth setup');
    return;
  }

  fs.mkdirSync('playwright/.auth', { recursive: true });

  const masterEmail = process.env.E2E_MASTER_EMAIL;
  if (masterEmail) {
    console.log(`[setup] Auth master (${masterEmail})...`);
    try {
      await buildAuthState(baseURL, masterEmail, /\/dashboard/, 'playwright/.auth/master.json');
      console.log('[setup] master.json saved');
    } catch (e) {
      console.warn(`[setup] Master auth failed: ${(e as Error).message}`);
      if (fs.existsSync('playwright/.auth/master.json')) fs.unlinkSync('playwright/.auth/master.json');
    }
  } else {
    console.warn('[setup] E2E_MASTER_EMAIL not set');
  }

  const clientEmail = process.env.E2E_CLIENT_EMAIL;
  if (clientEmail) {
    console.log(`[setup] Auth client (${clientEmail})...`);
    try {
      await buildAuthState(baseURL, clientEmail, /\/my\/bookings/, 'playwright/.auth/client.json');
      console.log('[setup] client.json saved');
    } catch (e) {
      console.warn(`[setup] Client auth failed: ${(e as Error).message}`);
      if (fs.existsSync('playwright/.auth/client.json')) fs.unlinkSync('playwright/.auth/client.json');
    }
  } else {
    console.warn('[setup] E2E_CLIENT_EMAIL not set');
  }
}
