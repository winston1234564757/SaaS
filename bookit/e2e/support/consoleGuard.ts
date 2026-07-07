import { type Page, type ConsoleMessage, expect } from '@playwright/test';

/**
 * Runtime-guard: fails a test on any uncaught page error or console.error.
 *
 * This is the guard the suite lacked: the client-login realtime crash
 * ("cannot add postgres_changes callbacks ... after subscribe()") threw inside a
 * useEffect, was swallowed by React, and left every URL/visibility assertion green.
 * A pageerror/console.error listener turns that class of runtime failure into a
 * red test.
 *
 * Usage:
 *   const guard = attachConsoleGuard(page);
 *   await page.goto('/my/bookings');
 *   await guard.settle();
 *   guard.assertClean('/my/bookings');
 */

/** Benign messages that must not fail a test. Keep this list tight and justified. */
const IGNORE: RegExp[] = [
  /Download the React DevTools/i,
  /\[Fast Refresh\]/i,
  /Skipping auto-scroll behavior/i, // Next.js dev router noise
  // Resource-load noise (missing favicon/og in test env) — not a JS defect:
  /Failed to load resource: the server responded with a status of 40[34]/i,
  // Transient network failures reaching the REMOTE Supabase from a headless
  // browser (token refresh in _getUser/_useSession). Environmental, not an app
  // defect — a real app-logic throw (e.g. the realtime channel crash) has its
  // own message and is NOT a "Failed to fetch".
  /Failed to fetch/i,
  /TypeError: Load failed/i, // WebKit's equivalent of "Failed to fetch"
  /network error/i, // transient fetch failure (incl. error-boundary re-log)
];

export interface ConsoleGuard {
  /** All captured error strings so far. */
  readonly errors: string[];
  /** Wait for late effects (realtime subscribe, hydration) to run. */
  settle(ms?: number): Promise<void>;
  /** Assert no errors were captured; message names the context (e.g. a route). */
  assertClean(context?: string): void;
}

export function attachConsoleGuard(page: Page): ConsoleGuard {
  const errors: string[] = [];

  const record = (text: string) => {
    if (IGNORE.some((r) => r.test(text))) return;
    errors.push(text);
  };

  page.on('console', (msg: ConsoleMessage) => {
    if (msg.type() === 'error') record(msg.text());
  });
  page.on('pageerror', (err: Error) => {
    record(`[pageerror] ${err.message}`);
  });

  return {
    get errors() {
      return errors;
    },
    async settle(ms = 1500) {
      // Let realtime .subscribe() and post-mount effects fire before asserting.
      await page.waitForTimeout(ms);
    },
    assertClean(context = '') {
      expect(
        errors,
        `Runtime errors on ${context}:\n  ${errors.join('\n  ')}`,
      ).toEqual([]);
    },
  };
}
