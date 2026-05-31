/**
 * themeSetup.ts — Утіліта зміни теми через Supabase Admin
 *
 * Використовується в beforeAll() кожного audit spec файлу.
 * Читає назву Playwright project ('audit-blossom' → 'blossom')
 * та оновлює master_profiles.mood_theme в DB.
 */

import { createClient } from '@supabase/supabase-js';

export type AuditTheme = 'blossom' | 'studio' | 'frost';

const SUPABASE_URL    = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/**
 * Парсить AuditTheme з назви Playwright project.
 * 'audit-blossom' → 'blossom'
 * 'audit-studio'  → 'studio'
 * 'audit-frost'   → 'frost'
 */
export function getThemeFromProject(projectName: string): AuditTheme {
  const theme = projectName.replace('audit-', '') as AuditTheme;
  if (!['blossom', 'studio', 'frost'].includes(theme)) {
    // Fallback for non-audit projects (e.g. running spec directly)
    return 'blossom';
  }
  return theme;
}

/**
 * Встановлює mood_theme для аудит-майстра через Supabase Admin API.
 * Обходить RLS — безпечно тільки для e2e_*@test.com акаунтів.
 */
export async function switchTheme(
  theme: AuditTheme,
  masterEmail: string,
): Promise<void> {
  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // Resolve user ID by email
  const { data: listData, error: listErr } = await admin.auth.admin.listUsers({ perPage: 1000 });
  if (listErr) throw new Error(`[themeSetup] listUsers failed: ${listErr.message}`);

  const user = listData?.users.find((u) => u.email === masterEmail);
  if (!user) throw new Error(`[themeSetup] User not found: ${masterEmail}`);

  // Update theme
  const { error } = await admin
    .from('master_profiles')
    .update({ mood_theme: theme })
    .eq('id', user.id);

  if (error) throw new Error(`[themeSetup] UPDATE mood_theme failed: ${error.message}`);

  console.log(`[themeSetup] ✓ ${masterEmail} → theme: ${theme}`);
}
