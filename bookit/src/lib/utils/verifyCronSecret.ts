import { createHmac, timingSafeEqual } from 'crypto';

export function verifyCronSecret(header: string | null): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret || !header) return false;
  const expected = `Bearer ${secret}`;
  // HMAC normalizes both values to fixed 32-byte length → no length timing leak
  const key = 'cron';
  const a = createHmac('sha256', key).update(header).digest();
  const b = createHmac('sha256', key).update(expected).digest();
  return timingSafeEqual(a, b);
}
