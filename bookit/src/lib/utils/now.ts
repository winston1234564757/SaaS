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
  // We use a manual cookie check to avoid 'next/headers' dependency in client-side utility
  try {
    if (typeof window !== 'undefined') {
      const match = document.cookie.match(/next-public-debug-now=([^;]+)/);
      if (match) debugNow = decodeURIComponent(match[1]);
    } else {
      // Server-side: we try to import cookies() dynamically if needed, 
      // but for absolute reach (middleware/actions), we check process.env or rely on cookie injection.
      // In this app, we'll rely on the client passing it or CI env.
    }
  } catch (e) {
    // Ignore errors in environments where cookie/window is partially present
  }

  return debugNow ? new Date(debugNow) : new Date();
}
