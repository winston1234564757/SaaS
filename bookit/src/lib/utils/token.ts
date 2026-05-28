/**
 * Generates a cryptographically secure random token using a readable alphabet
 * (no O, 0, I, 1 to avoid visual confusion).
 *
 * Default length 8 gives ~41 bits of entropy — sufficient for referral codes
 * and short-lived one-time tokens.
 */
const TOKEN_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export function generateSecureToken(length = 8): string {
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  return Array.from(bytes, b => TOKEN_CHARS[b % TOKEN_CHARS.length]).join('');
}

/** SHA-256 hex digest — used to store invite tokens as hashes in DB. */
export async function sha256Hex(text: string): Promise<string> {
  const buffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buffer), b => b.toString(16).padStart(2, '0')).join('');
}
