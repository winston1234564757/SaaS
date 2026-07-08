import { describe, it, expect } from 'vitest';
import { PROD_SUPABASE_REFS, findProdRef, isProdSupabaseUrl } from './e2eSeedGuard';

describe('e2eSeedGuard (SEC-01)', () => {
  it('flags the known production project ref', () => {
    const url = 'https://sqlrxsopllgztvgrerqk.supabase.co';
    expect(isProdSupabaseUrl(url)).toBe(true);
    expect(findProdRef(url)).toBe('sqlrxsopllgztvgrerqk');
    // The real prod ref must be in the blocklist — this is the guard's whole point.
    expect(PROD_SUPABASE_REFS).toContain('sqlrxsopllgztvgrerqk');
  });

  it('passes local Supabase URLs', () => {
    expect(isProdSupabaseUrl('http://127.0.0.1:54321')).toBe(false);
    expect(isProdSupabaseUrl('http://localhost:54321')).toBe(false);
    expect(findProdRef('http://127.0.0.1:54321')).toBeUndefined();
  });

  it('passes a non-prod remote (dedicated e2e) project', () => {
    expect(isProdSupabaseUrl('https://abcdef1234567890xyz.supabase.co')).toBe(false);
  });

  it('does not match on empty/undefined URLs', () => {
    expect(isProdSupabaseUrl(undefined)).toBe(false);
    expect(isProdSupabaseUrl(null)).toBe(false);
    expect(isProdSupabaseUrl('')).toBe(false);
  });

  it('ignores empty strings in the refs list (no accidental match-all)', () => {
    expect(findProdRef('https://anything.supabase.co', ['', 'sqlrxsopllgztvgrerqk'])).toBeUndefined();
    expect(findProdRef('https://sqlrxsopllgztvgrerqk.supabase.co', [''])).toBeUndefined();
  });
});
