/**
 * Returns the current date, potentially overridden by an environment variable OR a cookie for E2E testing.
 * This is the 'safe' way to implement time-travel without breaking OS-level timers or Auth.
 */
export function getNow(): Date {
  let debugNow: string | null = null;
  let source: 'cookie' | 'env' | 'clock' = 'clock';

  // 1. Check cookie (Highest priority for E2E overrides)
  try {
    if (typeof window !== 'undefined') {
      const match = document.cookie.match(/next-public-debug-now=([^;]+)/);
      if (match) {
        debugNow = decodeURIComponent(match[1]);
        if (debugNow !== 'undefined' && debugNow !== 'null') {
          source = 'cookie';
        } else {
          debugNow = null;
        }
      }
    } else {
      try {
        const { cookies } = require('next/headers');
        const cookieStore = cookies();
        const cookieValue = cookieStore.get('next-public-debug-now')?.value;
        if (cookieValue) {
          debugNow = decodeURIComponent(cookieValue);
          source = 'cookie';
        }
      } catch { /* SSR context fallback */ }
    }
  } catch (e) { /* ignore */ }

  // 2. Fallback to environment variable (CI default)
  if (!debugNow && process.env.NEXT_PUBLIC_DEBUG_NOW) {
    debugNow = process.env.NEXT_PUBLIC_DEBUG_NOW;
    source = 'env';
  }

  let result = debugNow ? new Date(debugNow) : new Date();
  
  // Resilience: Fallback to real 'now' if the override produced an Invalid Date
  if (isNaN(result.getTime())) {
    console.error(`[getNow] Invalid date encountered: "${debugNow}". Falling back to real time.`);
    result = new Date();
    source = 'clock';
  }

  // Client-side diagnostic logging
  if (typeof window !== 'undefined') {
     if (!(window as any)._now_logged || (window as any).E2E_DEBUG) {
       console.log(`[getNow] Source: ${source}, Time: ${result.toISOString()} (raw: ${debugNow})`);
       (window as any)._now_logged = true;
     }
  }

  return result;
}
