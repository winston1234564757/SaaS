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
 *   2. Await `refreshSession()` — гарантований мережевий запит, свіжий токен
 *   3. Call `onFocus(true)` — явний boolean гарантує тригер #onFocus() у TQ v5
 *
 * FIX #1: getSession() → refreshSession() — getSession() повертає кеш, НЕ оновлює токен.
 * FIX #2: onFocus() → onFocus(true) — без аргументу setFocused(undefined) не тригерить
 *         рефетч у TanStack Query v5, якщо #focused вже undefined (initial state).
 */
function useSessionWakeup() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const supabase = createClient();

    const cleanup = focusManager.setEventListener((onFocus) => {
      const handler = async () => {
        if (document.visibilityState !== 'visible') return;

        // FIX #1: refreshSession() робить мережевий запит і гарантує свіжий JWT.
        // getSession() повертав токен з in-memory cache — міг бути протермінованим.
        // 10s timeout залишаємо — мережа після сну може бути повільною.
        try {
          await Promise.race([
            supabase.auth.refreshSession(),
            new Promise(resolve => setTimeout(resolve, 10_000)),
          ]);
        } catch {
          // Refresh failed — onFocus(true) нижче все одно стріляє,
          // TanStack Query зробить retry з exponential backoff.
        }

        // FIX #2: onFocus(true) замість onFocus().
        // У TQ v5 setFocused(undefined) → #focused !== undefined = false → #onFocus() не викликається.
        // setFocused(true) → завжди встановлює #focused=true і тригерить рефетч.
        onFocus(true);
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
 *
 * FIX #3: getSession() → refreshSession() — гарантований мережевий refresh токена.
 * FIX #4: invalidateQueries → resetQueries — invalidate лише позначає як stale,
 *         але НЕ очищує error state після retry exhaustion. resetQueries повертає
 *         query в initial стан і тригерить чистий fetch.
 * FIX #5: timeout 5s → 12s — мережа після deep sleep прокидається повільно,
 *         5s було занадто агресивно і race виграв timeout до завершення refresh.
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
          // FIX #3 + #5: refreshSession() з 12s timeout.
          // Дає достатньо часу мережі прокинутись і завершити token refresh
          // до того як запити підуть з новим токеном.
          await Promise.race([
            supabase.auth.refreshSession(),
            new Promise(resolve => setTimeout(resolve, 12_000)),
          ]);
        } catch {}

        // FIX #4: resetQueries замість invalidateQueries.
        // Після 3+ хвилин сну частина запитів може бути в error state (retry exhausted).
        // invalidateQueries позначає як stale, але не очищує error — юзер бачить dead UI.
        // resetQueries: очищує error state, повертає initial, тригерить свіжий fetch.
        queryClient.resetQueries({ type: 'active' });
      }

      lastTime = now;
    }, 5000);

    return () => clearInterval(interval);
  }, [queryClient]);
}

/**
 * FIX #3: Слухаємо TOKEN_REFRESHED від Supabase.
 *
 * Коли Supabase успішно оновлює JWT (фоново або явно), він емітить TOKEN_REFRESHED.
 * Без цього listener queryClient не знає про свіжий токен — запити в error state
 * залишаються мертвими до наступного F5.
 *
 * resetQueries({ type: 'active' }): очищує error state тільки у АКТИВНИХ запитів
 * (тих що зараз маунтовані). Inactive (кешовані) не чіпаємо — вони оновляться при mount.
 */
function useAuthQuerySync() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const supabase = createClient();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event: string) => {
      if (event === 'TOKEN_REFRESHED') {
        queryClient.resetQueries({ type: 'active' });
      }
    });
    return () => subscription.unsubscribe();
  }, [queryClient]);
}

function SessionWakeup() {
  useSessionWakeup();
  useDeepSleepWakeup();
  useAuthQuerySync();
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

