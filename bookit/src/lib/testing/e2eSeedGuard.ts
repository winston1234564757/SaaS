/**
 * E2E seed safety guard — pure, side-effect-free logic (SEC-01).
 *
 * The e2e seeder (`scripts/seed-e2e-data.ts`) wipes + recreates `e2e_*@test.com`
 * accounts. It must NEVER run against production. `E2E_ALLOW_REMOTE=true` is a
 * legitimate escape hatch for a *dedicated* remote e2e project, but it must NOT
 * be able to unlock the known production project. This module is that last line
 * of defense — kept pure so it can be unit-tested without the seeder's side effects.
 */

/**
 * Known production Supabase project ref(s). Seeding against any of these is a
 * hard abort regardless of E2E_ALLOW_REMOTE. Add new prod refs here if the
 * project ever migrates.
 */
export const PROD_SUPABASE_REFS: readonly string[] = ['sqlrxsopllgztvgrerqk'];

/**
 * Returns the matching production ref if `url` points at a known prod project,
 * otherwise `undefined`. Matching is a plain substring check because the ref
 * appears in the hostname (e.g. `https://sqlrxsopllgztvgrerqk.supabase.co`).
 */
export function findProdRef(
  url: string | undefined | null,
  refs: readonly string[] = PROD_SUPABASE_REFS,
): string | undefined {
  if (!url) return undefined;
  return refs.find((ref) => ref.length > 0 && url.includes(ref));
}

/** True if `url` targets a known production Supabase project. */
export function isProdSupabaseUrl(
  url: string | undefined | null,
  refs: readonly string[] = PROD_SUPABASE_REFS,
): boolean {
  return findProdRef(url, refs) !== undefined;
}
