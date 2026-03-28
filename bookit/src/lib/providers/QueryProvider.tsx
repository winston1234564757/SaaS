'use client';

import { useEffect, useState } from 'react';
import { QueryClient, QueryClientProvider, focusManager, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/lib/toast/context';
import type { SafeResult } from '@/lib/supabase/safeQuery';
import { createClient } from '@/lib/supabase/client';

function createQueryClient(showToast: ReturnType<typeof useToast>['showToast']) {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30000,            // 30 sec defaults
        gcTime:    1000 * 60 * 15,   // 15 min — keep cache alive across navigation
        refetchOnWindowFocus: true,  // wake up stale queries on tab return
        refetchOnMount: true,        // refetch on component mount
        refetchOnReconnect: true,    // wake up on network restore
        retry: 2,                    // two retries — first may hit stale token after sleep
        retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 8000), // 1s, 2s, 4s, 8s
      },
      mutations: {
        retry: 0,
        onError: (error: unknown) => {
          const supaError = (error as { __safeResult?: SafeResult<unknown> | null })?.__safeResult;
          if (supaError?.isRlsError) {
            showToast({
              type: 'error',
              title: 'Помилка доступу до даних',
              message: 'Не вдалося зберегти або завантажити дані. Перевірте права доступу (RLS) або оновіть сторінку.',
            });
          }
        },
      },
    },
  });
}

/**
 * Refreshes the Supabase auth session BEFORE TanStack Query refetches on tab focus.
 *
 * After a long background period (PWA minimised, tab switched), the Supabase JWT
 * expires silently. If React Query fires refetches *before* the token is renewed,
 * every query fails with 401/403.
 *
 * Strategy:
 *   1. Intercept TanStack Query's focus event via focusManager
 *   2. Await `getSession()` (triggers automatic token refresh if expired) — 10s timeout
 *   3. Call `onFocus()` — signals TanStack Query to refetch all stale queries
 *
 * We intentionally do NOT call `router.refresh()` or `queryClient.invalidateQueries()`
 * here. TanStack Query's built-in `refetchOnWindowFocus: true` handles data refetching
 * after `onFocus()` fires, without conflicting with server component re-renders.
 */
function useSessionWakeup() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const supabase = createClient();

    const cleanup = focusManager.setEventListener((onFocus) => {
      const handler = async () => {
        if (document.visibilityState !== 'visible') return;

        // Renew auth token before any data fetches fire.
        // 10s timeout: after sleep the first network request may be slow,
        // but 3s was too aggressive and caused stale-token cascades.
        try {
          await Promise.race([
            supabase.auth.getSession(),
            new Promise(resolve => setTimeout(resolve, 10_000)),
          ]);
        } catch {
          // Auth refresh failed — onFocus() below will still fire and TanStack Query
          // will retry with exponential backoff (retry: 2). If the token truly expired,
          // the global onError handler will prompt a page reload.
        }

        // Signal TanStack Query: "the window is focused, refetch stale queries."
        // This respects each query's staleTime — only stale queries are refetched.
        onFocus();
      };

      document.addEventListener('visibilitychange', handler);
      window.addEventListener('focus', handler);
      return () => {
        document.removeEventListener('visibilitychange', handler);
        window.removeEventListener('focus', handler);
      };
    });

    return cleanup;
  }, [queryClient]);
}

/**
 * Detects when the PWA wakes up from deep sleep (iOS/Android backgrounding).
 * Mobile browsers often freeze JS completely, and sometimes fail to fire 
 * visibilitychange or focus events when waking back up.
 * 
 * Strategy: A silent 5s interval heartbeat. If the interval fires and >3 minutes
 * have passed, the device was asleep. We then force a token refresh and refetch.
 */
function useDeepSleepWakeup() {
  const queryClient = useQueryClient();

  useEffect(() => {
    let lastTime = Date.now();
    
    const interval = setInterval(async () => {
      const now = Date.now();
      const elapsed = now - lastTime;
      
      // If JS was frozen for more than 3 minutes (180,000 ms)
      if (elapsed > 180_000) {
        const supabase = createClient();
        try {
          await Promise.race([
            supabase.auth.getSession(),
            new Promise(resolve => setTimeout(resolve, 5000)),
          ]);
        } catch {}
        
        // Force TanStack Query to refetch all mounted components 
        // (background refetch, no spinners/skeletons)
        queryClient.invalidateQueries({ type: 'active' });
      }
      
      lastTime = now;
    }, 5000);

    return () => clearInterval(interval);
  }, [queryClient]);
}

function SessionWakeup() {
  useSessionWakeup();
  useDeepSleepWakeup();
  return null;
}

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const { showToast } = useToast();
  const [client] = useState(() => createQueryClient(showToast));

  return (
    <QueryClientProvider client={client}>
      <SessionWakeup />
      {children}
    </QueryClientProvider>
  );
}

