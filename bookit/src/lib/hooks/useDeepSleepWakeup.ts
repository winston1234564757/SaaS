'use client';

import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';

const HEARTBEAT_INTERVAL = 5_000;  // 5 секунд
const FREEZE_THRESHOLD = 180_000;  // 3 хвилини — JS був заморожений ОС

/**
 * Heartbeat-детектор для iOS PWA та Android WebView,
 * де visibilitychange може не спрацювати після deep-freeze ОС.
 * Якщо інтервал між тіками > 3 хв — JS був заморожений, відновлюємо сесію.
 * (DEV_RULES §12 — useDeepSleepWakeup)
 */
export function useDeepSleepWakeup() {
  const queryClient = useQueryClient();
  const supabaseRef = useRef(createClient());
  const lastTickRef = useRef(Date.now());

  useEffect(() => {
    const interval = setInterval(async () => {
      const now = Date.now();
      const elapsed = now - lastTickRef.current;
      lastTickRef.current = now;

      if (elapsed > FREEZE_THRESHOLD) {
        console.warn(`[DeepSleep] JS був заморожений ${Math.round(elapsed / 1000)}с — відновлення`);
        try {
          await supabaseRef.current.auth.getSession();
        } catch {
          // Ігноруємо помилку — все одно інвалідуємо
        }
        queryClient.invalidateQueries({ type: 'active' });
      }
    }, HEARTBEAT_INTERVAL);

    return () => clearInterval(interval);
  }, [queryClient]);
}
