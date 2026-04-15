/**
 * Returns the current date, potentially overridden by an environment variable for E2E testing.
 * This is the 'safe' way to implement time-travel without breaking OS-level timers or Auth.
 */
export function getNow(): Date {
  // NEXT_PUBLIC_ prefix makes this available on both client and server.
  // In CI, we bake a specific date (e.g. 2026-05-01) into this variable.
  const debugNow = process.env.NEXT_PUBLIC_DEBUG_NOW;
  
  // If debugNow is present, we treat it as an absolute UTC timestamp
  return debugNow ? new Date(debugNow) : new Date();
}
