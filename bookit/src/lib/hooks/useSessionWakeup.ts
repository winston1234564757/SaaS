// src/lib/hooks/useSessionWakeup.ts
'use client';

import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { resetFetchController } from '@/lib/supabase/client';

export function useSessionWakeup() {
  const queryClient = useQueryClient();
  const lastHiddenAt = useRef(Date.now());
  const isRunning = useRef(false);

  useEffect(() => {
    async function handleVisibilityChange() {
      if (document.hidden) {
        lastHiddenAt.current = Date.now();
        return;
      }

      if (isRunning.current) return;
      isRunning.current = true;

      const gap = Date.now() - lastHiddenAt.current;
      console.debug(`[Wakeup] gap=${gap}ms`);

      try {
        // ─── КРОК 1: Kill switch ─────────────────────────────────────────────
        // Абортуємо будь-які in-flight Supabase fetch-и (frozen DB queries тощо).
        // З autoRefreshToken:false — немає frozen auto-refresh fetch,
        // але DB query fetches можуть бути заморожені.
        resetFetchController();

        // ─── КРОК 2: 500ms ──────────────────────────────────────────────────
        // Supabase's _onVisibilityChanged → _acquireLock → _recoverAndRefresh()
        // З autoRefreshToken:false — лише localStorage read, ~0-10ms.
        // 500ms дає запас щоб lock точно звільнився і JS мікро-черга очистилась.
        await new Promise(r => setTimeout(r, 500));

        // ─── КРОК 3: Скасовуємо TQ запити ───────────────────────────────────
        queryClient.cancelQueries();

        // ─── КРОК 4: Інвалідуємо активні queries ─────────────────────────
        // Без refreshSession() — токен оновиться автоматично через __loadSession()
        // при першому API call якщо token expired (lockAcquired = false, нема блокування).
        // invalidateQueries (а не resetQueries) — зберігає кеш, нема loading flash.
        queryClient.invalidateQueries({ type: 'active' });

        console.debug('[Wakeup] done');
      } finally {
        isRunning.current = false;
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [queryClient]);
}
