/**
 * Shared test utilities for Supabase React Query hook tests.
 * Provides: makeChain, makeBrowserClient, createWrapper, MASTER_ID constant.
 */

import React from 'react';
import { vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// ── Chain mock ────────────────────────────────────────────────────────────────

export type MockResult = { data?: unknown; error?: unknown; count?: number | null };

/**
 * Returns a thenable Supabase query-builder proxy.
 * All chaining methods (.select, .eq, .gte, …) return `this`.
 * Direct `await chain` resolves to { data, error, count }.
 * .single() / .maybeSingle() resolve to the same object.
 */
export function makeChain(r: MockResult = {}): any {
  const resolved = {
    data:  r.data  !== undefined ? r.data  : null,
    error: r.error !== undefined ? r.error : null,
    count: r.count !== undefined ? r.count : null,
  };
  const p = Promise.resolve(resolved);
  const chain: any = {};
  const methods = [
    'select', 'insert', 'update', 'delete', 'upsert',
    'eq', 'neq', 'in', 'gte', 'lte', 'gt', 'lt', 'is', 'not',
    'limit', 'order', 'or', 'filter', 'range', 'contains', 'overlaps',
  ];
  for (const m of methods) chain[m] = vi.fn().mockReturnValue(chain);
  chain.single      = vi.fn().mockResolvedValue(resolved);
  chain.maybeSingle = vi.fn().mockResolvedValue(resolved);
  chain.then        = p.then.bind(p);
  chain.catch       = p.catch.bind(p);
  chain.finally     = p.finally.bind(p);
  return chain;
}

/**
 * Creates a fake browser Supabase client (createClient from @/lib/supabase/client).
 *
 * `tables`     — map of table name → MockResult or MockResult[].
 *               When an array is given, consecutive from(table) calls consume
 *               the queue in order; the last entry is reused when exhausted.
 *
 * `rpcResults` — single MockResult or queue for rpc() calls.
 */
export function makeBrowserClient(
  tables: Record<string, MockResult | MockResult[]> = {},
  rpcResults: MockResult | MockResult[] = {},
): any {
  const idx: Record<string, number> = {};
  let rpcIdx = 0;

  return {
    from: vi.fn().mockImplementation((table: string) => {
      const entry = tables[table];
      if (!entry) return makeChain({});
      const arr = Array.isArray(entry) ? entry : [entry];
      const i = idx[table] ?? 0;
      idx[table] = i + 1;
      return makeChain(arr[Math.min(i, arr.length - 1)]);
    }),
    rpc: vi.fn().mockImplementation(() => {
      const arr = Array.isArray(rpcResults) ? rpcResults : [rpcResults];
      const i = rpcIdx++;
      const r = arr[Math.min(i, arr.length - 1)];
      return Promise.resolve({ data: r.data ?? null, error: r.error ?? null });
    }),
  };
}

// ── QueryClient wrapper ────────────────────────────────────────────────────────

/**
 * Creates a fresh QueryClient (retry=0, gcTime=0) and a React wrapper component.
 * Pass `wrapper` to renderHook's options to provide QueryClientProvider.
 */
export function createWrapper() {
  const qc = new QueryClient({
    defaultOptions: {
      queries:   { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });
  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={qc}>
        {children}
      </QueryClientProvider>
    );
  }
  return { wrapper: Wrapper, qc };
}

// ── Constants ─────────────────────────────────────────────────────────────────

export const MASTER_ID = 'aaaaaaaa-0000-4000-8000-000000000001';

// ── Fake DB error ─────────────────────────────────────────────────────────────

export function makeDbError(msg = 'DB failure') {
  return { message: msg, code: '500', details: '', hint: '' };
}
