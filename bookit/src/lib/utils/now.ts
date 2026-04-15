import { toZonedTime } from 'date-fns-tz';

/**
 * Returns the current date, potentially overridden by an environment variable for E2E testing.
 * This is the 'safe' way to implement time-travel without breaking OS-level timers or Auth.
 */
export function getNow(timezone: string = 'Europe/Kyiv'): Date {
  // NEXT_PUBLIC_ prefix makes this available on both client and server.
  // In CI, we bake a specific date (e.g. 2026-05-01) into this variable.
  const debugNow = process.env.NEXT_PUBLIC_DEBUG_NOW;
  
  const baseDate = debugNow ? new Date(debugNow) : new Date();
  
  // Always return in the requested (or master) timezone to ensure consistency.
  return toZonedTime(baseDate, timezone);
}
