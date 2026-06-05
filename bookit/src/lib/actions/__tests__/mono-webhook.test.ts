import { describe, it, expect } from 'vitest';

// ── Pure extractions from mono-webhook/route.ts ─────────────────────────

function parseMonoReference(ref: string): { tier: 'pro' | 'studio'; uid32: string } | null {
  const parts = ref.split('_');
  const tier = parts[1] as 'pro' | 'studio';
  const uid32 = parts[2];
  if ((tier !== 'pro' && tier !== 'studio') || uid32?.length !== 32) return null;
  return { tier, uid32 };
}

function checkFreshness(ref: string, nowMs: number, windowMs: number): boolean {
  const tsMatch = ref.match(/_(\d+)$/);
  if (!tsMatch) return true;
  const webhookTs = parseInt(tsMatch[1], 10) * 1000;
  const ageMs = Math.abs(nowMs - webhookTs);
  return ageMs <= windowMs;
}

function computeNewExpiry(
  currentExpiresAt: string | null,
  now: Date,
  addDays: number,
): string {
  const base = currentExpiresAt && new Date(currentExpiresAt) > now
    ? new Date(currentExpiresAt)
    : new Date(now);
  base.setDate(base.getDate() + addDays);
  return base.toISOString();
}

describe('mono-webhook — parseMonoReference', () => {
  it('parses valid pro reference', () => {
    const r = parseMonoReference('bookit_pro_abc123def456abc123def456abc123de_1718000000');
    expect(r).toEqual({
      tier: 'pro',
      uid32: 'abc123def456abc123def456abc123de',
    });
  });

  it('parses valid studio reference', () => {
    const r = parseMonoReference('bookit_studio_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa_1718000000');
    expect(r).toEqual({
      tier: 'studio',
      uid32: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
    });
  });

  it('rejects when uid32 is not 32 chars', () => {
    expect(parseMonoReference('bookit_pro_short_1718000000')).toBeNull();
  });

  it('rejects unknown tier', () => {
    expect(parseMonoReference('bookit_starter_abc123def456abc123def456abc123de_1718000000')).toBeNull();
  });

  it('rejects missing parts', () => {
    expect(parseMonoReference('bookit_pro')).toBeNull();
  });
});

describe('mono-webhook — checkFreshness', () => {
  const now = 1718000000000;

  it('accepts webhook within window', () => {
    const ref = `bookit_pro_abc123def456abc123def456abc123de_${Math.floor(now / 1000)}`;
    expect(checkFreshness(ref, now, 15 * 60 * 1000)).toBe(true);
  });

  it('rejects stale webhook beyond window', () => {
    const oldTs = Math.floor(now / 1000) - 20 * 60;
    const ref = `bookit_pro_abc123def456abc123def456abc123de_${oldTs}`;
    expect(checkFreshness(ref, now, 15 * 60 * 1000)).toBe(false);
  });

  it('allows webhooks without timestamp', () => {
    expect(checkFreshness('bookit_pro_abc123def456abc123def456abc123de', now, 15 * 60 * 1000)).toBe(true);
  });
});

describe('mono-webhook — computeNewExpiry', () => {
  const now = new Date('2026-06-10T12:00:00Z');

  it('extends from current expiry when future', () => {
    const r = computeNewExpiry('2026-07-01T00:00:00Z', now, 30);
    expect(new Date(r) > now).toBe(true);
    const diffDays = (new Date(r).getTime() - new Date('2026-07-01T00:00:00Z').getTime()) / 86400000;
    expect(Math.round(diffDays)).toBe(30);
  });

  it('extends from now when current expiry is past', () => {
    const r = computeNewExpiry('2026-01-01T00:00:00Z', now, 30);
    const diffDays = (new Date(r).getTime() - now.getTime()) / 86400000;
    expect(Math.round(diffDays)).toBe(30);
  });

  it('extends from now when current expiry is null', () => {
    const r = computeNewExpiry(null, now, 30);
    const diffDays = (new Date(r).getTime() - now.getTime()) / 86400000;
    expect(Math.round(diffDays)).toBe(30);
  });
});
