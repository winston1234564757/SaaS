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
 * Universal aggressive wake-up — web + PWA.
 *
 * Відстежує час, коли вкладка йде у фон (visibilityState = 'hidden').
 * При поверненні (visibilityState = 'visible') перевіряє elapsed:
 *
 *   < 60 s  → легкий refresh токена + onFocus(true)  (звичайне перемикання вкладок)
 *   ≥ 60 s  → агресивна послідовність:
 *               Step 1: refreshSession() з 12s timeout
 *               Step 2: resetQueries({ type: 'active' }) — очищує error state + тригерить refetch
 *               Step 3: якщо Supabase повертає auth error (сесія мертва) → window.location.reload()
 *
 * waking ref: debounce-lock — не дозволяє запускатись паралельно при швидкому перемиканні.
 */
function useAggressiveWakeup() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const supabase = createClient();
    let hiddenAt: number | null = null;
    let waking = false;

    const cleanup = focusManager.setEventListener((onFocus) => {
      const handleVisibility = async () => {
        if (document.visibilityState === 'hidden') {
          hiddenAt = Date.now();
          return;
        }
        if (document.visibilityState !== 'visible') return;
        if (waking) return;

        const elapsed = hiddenAt !== null ? Date.now() - hiddenAt : 0;
        hiddenAt = null;
        waking = true;

        try {
          if (elapsed >= 60_000) {
            // ── Агресивне пробудження після 1+ хвилини ──────────────────────
            let sessionDead = false;
            try {
              const { error } = await Promise.race([
                supabase.auth.refreshSession(),
                new Promise<never>((_, reject) =>
                  setTimeout(() => reject(new Error('wake timeout')), 12_000)
                ),
              ]);
              // error від Supabase = refresh token протермінований / сесія відкликана
              if (error) sessionDead = true;
            } catch {
              // network/timeout — сесія може бути ще дійсна, продовжуємо з reset
            }

            if (sessionDead) {
              window.location.reload();
              return;
            }

            queryClient.resetQueries({ type: 'active' });
          } else if (elapsed > 0) {
            // ── Легкий refresh при короткій відсутності ──────────────────────
            try {
              await Promise.race([
                supabase.auth.refreshSession(),
                new Promise(resolve => setTimeout(resolve, 10_000)),
              ]);
            } catch {}
          }

          onFocus(true);
        } finally {
          waking = false;
        }
      };

      const handleFocus = () => {
        // window focus без visibilitychange (напр. клік по вже видимому вікну)
        if (document.visibilityState === 'visible' && !waking) onFocus(true);
      };

      document.addEventListener('visibilitychange', handleVisibility);
      window.addEventListener('focus', handleFocus);
      return () => {
        document.removeEventListener('visibilitychange', handleVisibility);
        window.removeEventListener('focus', handleFocus);
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
  useAggressiveWakeup();
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

