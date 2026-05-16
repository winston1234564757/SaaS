'use client';

/**
 * URL Action Bus — Command Bus via Search Params.
 *
 * Any button, notification, or external link can trigger complex UI workflows
 * by navigating to a URL with `?_action=<type>&<payload params>`.
 *
 * Usage:
 *   useUrlActionBus('booking:create', ({ serviceId, clientId }) => {
 *     openWizard({ serviceId, clientId });
 *   });
 *
 *   buildActionUrl('/dashboard/bookings', 'booking:create', { clientId: 'xxx' })
 *   // → '/dashboard/bookings?_action=booking%3Acreate&clientId=xxx'
 */

import { z } from 'zod';
import { useSearchParams } from 'next/navigation';
import { useEffect, useRef } from 'react';

// ── Regex helpers ─────────────────────────────────────────────────────────────
const uuid  = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const date  = /^\d{4}-\d{2}-\d{2}$/;
const hhmm  = /^\d{2}:\d{2}$/;

// ── Action registry ───────────────────────────────────────────────────────────
export const URL_ACTION_SCHEMAS = {
  /** Open BookingWizard, optionally pre-selecting service / client / slot */
  'booking:create': z.object({
    serviceId: z.string().regex(uuid).optional(),
    clientId:  z.string().regex(uuid).optional(),
    date:      z.string().regex(date).optional(),
    startTime: z.string().regex(hhmm).optional(),
  }),

  /** Open reschedule flow for an existing booking */
  'booking:reschedule': z.object({
    bookingId: z.string().regex(uuid),
    date:      z.string().regex(date).optional(),
  }),

  /** Open ClientDetailSheet for a specific client */
  'client:open': z.object({
    clientId: z.string().regex(uuid),
  }),

  /** Open BroadcastEditor, optionally pre-filling audience and template */
  'marketing:broadcast': z.object({
    clientIds:  z.string().optional(), // comma-separated UUIDs
    templateId: z.string().optional(),
  }),

  /** Open any named drawer/sheet via a stable drawerId */
  'ui:open_drawer': z.object({
    drawerId: z.string().min(1),
    targetId: z.string().optional(),
  }),

  /** Open Flash Deal creator, optionally pre-selecting a service */
  'flash:create': z.object({
    serviceId: z.string().regex(uuid).optional(),
  }),

  /** Open Product editor sheet */
  'product:edit': z.object({
    productId: z.string().regex(uuid),
  }),
} as const;

export type UrlActionType = keyof typeof URL_ACTION_SCHEMAS;
export type UrlActionPayload<T extends UrlActionType> =
  z.infer<typeof URL_ACTION_SCHEMAS[T]>;

// ── URL cleanup ───────────────────────────────────────────────────────────────
// Truly shallow: uses History API directly (no React re-render, no history entry).
// This is the same mechanism nuqs uses internally.
function clearActionFromUrl(payloadKeys: string[]): void {
  if (typeof window === 'undefined') return;
  const url = new URL(window.location.href);
  url.searchParams.delete('_action');
  payloadKeys.forEach(k => url.searchParams.delete(k));
  window.history.replaceState(null, '', url.toString());
}

// ── Core hook ─────────────────────────────────────────────────────────────────
/**
 * Subscribe to a URL action. When `?_action=<actionType>` is detected:
 * 1. Parses & validates remaining params with Zod (strict, no `any`).
 * 2. Calls `handler` with the validated payload.
 * 3. Removes `_action` + payload keys from URL (shallow, no history entry).
 *
 * Place this hook in the component that owns the UI to open (e.g. the parent
 * that controls `isOpen` state). Each component subscribes independently —
 * no global provider required.
 */
export function useUrlActionBus<T extends UrlActionType>(
  actionType: T,
  handler: (payload: UrlActionPayload<T>) => void,
): void {
  const searchParams = useSearchParams();
  const handlerRef   = useRef(handler);
  handlerRef.current = handler;

  // Guard: store fingerprint of last fired action to prevent double-dispatch on re-renders.
  const firedRef = useRef<string | null>(null);

  useEffect(() => {
    const action = searchParams.get('_action');
    if (action !== actionType) return;

    // Collect payload params
    const raw: Record<string, string> = {};
    const payloadKeys: string[] = [];
    searchParams.forEach((value, key) => {
      if (key === '_action') return;
      raw[key] = value;
      payloadKeys.push(key);
    });

    // Idempotency guard
    const fingerprint = `${action}::${JSON.stringify(raw)}`;
    if (firedRef.current === fingerprint) return;
    firedRef.current = fingerprint;

    // Validate
    const schema = URL_ACTION_SCHEMAS[actionType] as unknown as z.ZodType<UrlActionPayload<T>>;
    const result = schema.safeParse(raw);

    // Always clear URL first (prevents re-trigger on hot-reload / re-render)
    clearActionFromUrl(payloadKeys);

    if (!result.success) {
      console.warn(`[UrlActionBus] Invalid payload for "${actionType}":`, result.error.flatten());
      return;
    }

    handlerRef.current(result.data);
  }, [searchParams, actionType]);
}

// ── Builder helper ────────────────────────────────────────────────────────────
/**
 * Construct a deep-link URL that will trigger a specific action.
 *
 * Example:
 *   buildActionUrl('/dashboard/marketing', 'marketing:broadcast', {
 *     clientIds: 'uuid1,uuid2',
 *   })
 *   // → 'https://bookit.com.ua/dashboard/marketing?_action=marketing%3Abroadcast&clientIds=uuid1%2Cuuid2'
 */
export function buildActionUrl<T extends UrlActionType>(
  path: string,
  action: T,
  payload: UrlActionPayload<T>,
): string {
  const origin = typeof window !== 'undefined'
    ? window.location.origin
    : (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://bookit.com.ua');

  const url = new URL(path, origin);
  url.searchParams.set('_action', action);

  Object.entries(payload as Record<string, string | undefined>).forEach(([key, value]) => {
    if (value !== undefined && value !== '') {
      url.searchParams.set(key, value);
    }
  });

  return url.toString();
}
