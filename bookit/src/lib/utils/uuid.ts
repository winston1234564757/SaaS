/**
 * Converts a 32-char flat UUID string (no hyphens) to standard UUID format.
 * Used by billing webhooks to reconstruct user IDs from order references.
 * Format: bookit_{tier}_{uid32}_{timestamp}
 */
export function flatUidToUuid(flat: string): string {
  return [
    flat.slice(0, 8),
    flat.slice(8, 12),
    flat.slice(12, 16),
    flat.slice(16, 20),
    flat.slice(20),
  ].join('-');
}
