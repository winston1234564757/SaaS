'use client';

import { useEffect, useState } from 'react';
import { QueryClient, QueryClientProvider, focusManager } from '@tanstack/react-query';
import { useToast } from '@/lib/toast/context';
import type { SafeResult } from '@/lib/supabase/safeQuery';
import { createClient } from '@/lib/supabase/client';

function createQueryClient(showToast: ReturnType<typeof useToast>['showToast']) {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1000 * 60 * 2,   // 2 min — data is fresh, no extra fetches
        gcTime:    1000 * 60 * 15,  // 15 min — keep cache alive across navigation
        refetchOnWindowFocus: true,  // wake up stale queries on tab return
        refetchOnReconnect: true,    // wake up on network restore
        retry: 1,                    // one retry on failure (dead connection after sleep)
        retryDelay: 2000,
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

/** Refreshes the Supabase auth session BEFORE TanStack Query refetches on tab focus.
 *  This prevents "stale token" failures when the user returns to a backgrounded tab. */
function useSessionWakeup() {
  useEffect(() => {
    const supabase = createClient();

    // Replace TanStack Query's default focus listener so we can refresh the session first.
    const cleanup = focusManager.setEventListener((onFocus) => {
      const handler = async () => {
        if (document.visibilityState !== 'visible') return;
        // Supabase refreshes the token automatically if it's expired.
        await supabase.auth.getSession();
        // Now it's safe to let TanStack Query refetch stale queries.
        onFocus();
      };

      document.addEventListener('visibilitychange', handler);
      return () => document.removeEventListener('visibilitychange', handler);
    });

    return cleanup;
  }, []);
}

function SessionWakeup() {
  useSessionWakeup();
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

