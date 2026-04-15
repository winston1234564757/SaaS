/**
 * Returns the current date, potentially overridden by an environment variable OR a cookie for E2E testing.
 * This is the 'safe' way to implement time-travel without breaking OS-level timers or Auth.
 */
export function getNow(): Date {
  let debugNow: string | null = null;

  // 1. Check environment variable (CI-level override)
  if (process.env.NEXT_PUBLIC_DEBUG_NOW) {
    debugNow = process.env.NEXT_PUBLIC_DEBUG_NOW;
  }

  // 2. Check cookie (Request-level override for E2E)
  try {
    if (typeof window !== 'undefined') {
      // Client-side
      const match = document.cookie.match(/next-public-debug-now=([^;]+)/);
      if (match) debugNow = decodeURIComponent(match[1]);
    } else {
      // Server-side (SSR / Server Actions)
      // We use a dynamic require to avoid crashing in non-Next environments (like seeds/scripts)
      try {
        const { cookies } = require('next/headers');
        const cookieStore = cookies();
        const cookieValue = cookieStore.get('next-public-debug-now')?.value;
        if (cookieValue) debugNow = cookieValue;
      } catch {
        // Not in a Next.js request context (e.g. build time or standalone script)
      }
    }
  } catch (e) {
    // Ignore errors in environments where cookie/window is partially present
  }

  return debugNow ? new Date(debugNow) : new Date();
}
