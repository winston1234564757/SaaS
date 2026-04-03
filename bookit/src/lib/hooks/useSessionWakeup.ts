'use client';

import { useEffect, useRef } from 'react';
import { useQueryClient, focusManager } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';

const SOFT_THRESHOLD = 60_000;  // 1 хв — м'яке оновлення (stale check)
const HARD_THRESHOLD = 300_000; // 5 хв — жорстке оновлення (invalidate active)

/**
 * Слухає visibilitychange і відновлює сесію + TanStack Query після фону.
 * getSession() тут дозволений — це event handler, не queryFn (DEV_RULES §12).
 */
export function useSessionWakeup() {
  const queryClient = useQueryClient();
  const lastHiddenAt = useRef(Date.now());
  const supabaseRef = useRef(createClient());

  useEffect(() => {
    function handleVisibilityChange() {
      if (document.hidden) {
        lastHiddenAt.current = Date.now();
        return;
      }

      const gap = Date.now() - lastHiddenAt.current;

      if (gap < SOFT_THRESHOLD) return;

      // Оновлюємо токен (може бути протухлий після фону)
      supabaseRef.current.auth.getSession().then(() => {
        if (gap >= HARD_THRESHOLD) {
          // Жорстке оновлення — інвалідуємо всі активні запити
          queryClient.invalidateQueries({ type: 'active' });
        } else {
          // М'яке оновлення — TQ перевірить staleTime і оновить за потреби
          focusManager.setFocused(undefined);
        }
      }).catch(() => {
        // Токен не оновився — все одно пробуємо оновити дані
        queryClient.invalidateQueries({ type: 'active' });
      });
    }

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [queryClient]);
}
