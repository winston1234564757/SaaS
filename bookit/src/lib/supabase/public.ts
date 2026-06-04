import { createClient } from '@supabase/supabase-js';

/**
 * Anonymous (anon-key) Supabase client for server-side public reads.
 * Respects RLS — use for public master pages, public studio pages.
 * Does NOT bypass RLS unlike createAdminClient().
 */
export function createPublicClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
}
