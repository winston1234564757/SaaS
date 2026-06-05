import { describe, it, expect } from 'vitest';
import { flatUidToUuid } from './uuid';

describe('flatUidToUuid', () => {
  it('32 символи без дефісів → uuid з дефісами', () => {
    const result = flatUidToUuid('a0eebc999c0b4ef8bb6d6bb9bd380a11');
    expect(result).toBe('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11');
  });

  it('корректна довжина груп: 8-4-4-4-12', () => {
    const result = flatUidToUuid('123456781234123412341234567890ab');
    const parts = result.split('-');
    expect(parts[0]).toHaveLength(8);
    expect(parts[1]).toHaveLength(4);
    expect(parts[2]).toHaveLength(4);
    expect(parts[3]).toHaveLength(4);
    expect(parts[4]).toHaveLength(12);
  });

  it('короткий рядок — не кидає помилку, але результат некоректний', () => {
    // Функція не валідує довжину — slice поверне порожні рядки
    const result = flatUidToUuid('abc');
    expect(result).toBeTruthy();
    expect(result.split('-').length).toBe(5);
  });

  it('hex символи', () => {
    const result = flatUidToUuid('ffffffffffffffffffffffffffffffff');
    expect(result).toBe('ffffffff-ffff-ffff-ffff-ffffffffffff');
  });

  it('нульовий uuid', () => {
    const result = flatUidToUuid('00000000000000000000000000000000');
    expect(result).toBe('00000000-0000-0000-0000-000000000000');
  });
});

// ── mono-webhook: Reference parsing + freshness ───────────────────

function parseMonoReference(reference: string): { tier: 'pro' | 'studio'; uid32: string; timestamp: number } | null {
  const FRESHNESS_WINDOW_MS = 15 * 60 * 1000;
  const tsMatch = reference.match(/_(\d+)$/);
  if (!tsMatch) return null;

  const webhookTs = parseInt(tsMatch[1], 10) * 1000;
  const ageMs = Math.abs(Date.now() - webhookTs);
  if (ageMs > FRESHNESS_WINDOW_MS) return null;

  const parts = reference.split('_');
  const tier = parts[1] as 'pro' | 'studio';
  const uid32 = parts[2];

  if ((tier !== 'pro' && tier !== 'studio') || uid32?.length !== 32) return null;

  return { tier, uid32, timestamp: webhookTs };
}

function computeNewExpiry(existingExpiry: string | null | undefined): string {
  const base = existingExpiry && new Date(existingExpiry) > new Date()
    ? new Date(existingExpiry)
    : new Date();
  base.setDate(base.getDate() + 30);
  return base.toISOString();
}

describe('mono-webhook: Reference parsing', () => {
  it('bookit_pro_32charhex_timestamp → ok', () => {
    const ref = `bookit_pro_a0eebc999c0b4ef8bb6d6bb9bd380a11_${Math.floor(Date.now() / 1000)}`;
    const result = parseMonoReference(ref);
    expect(result).not.toBeNull();
    expect(result!.tier).toBe('pro');
    expect(result!.uid32).toHaveLength(32);
  });

  it('bookit_studio_... → studio', () => {
    const ref = `bookit_studio_a0eebc999c0b4ef8bb6d6bb9bd380a11_${Math.floor(Date.now() / 1000)}`;
    const result = parseMonoReference(ref);
    expect(result).not.toBeNull();
    expect(result!.tier).toBe('studio');
  });

  it('uid32 не 32 символи → null', () => {
    const ref = `bookit_pro_short_${Math.floor(Date.now() / 1000)}`;
    expect(parseMonoReference(ref)).toBeNull();
  });

  it('невідомий tier → null', () => {
    const ref = `bookit_enterprise_a0eebc999c0b4ef8bb6d6bb9bd380a11_${Math.floor(Date.now() / 1000)}`;
    expect(parseMonoReference(ref)).toBeNull();
  });

  it('без timestamp → null', () => {
    expect(parseMonoReference('bookit_pro_a0eebc999c0b4ef8bb6d6bb9bd380a11')).toBeNull();
  });

  it('прострочений >15хв → null', () => {
    const oldTs = Math.floor((Date.now() - 20 * 60 * 1000) / 1000);
    const ref = `bookit_pro_a0eebc999c0b4ef8bb6d6bb9bd380a11_${oldTs}`;
    expect(parseMonoReference(ref)).toBeNull();
  });
});

describe('mono-webhook: Expiry computation', () => {
  it('без існуючого expiry → now + 30 днів', () => {
    const result = computeNewExpiry(null);
    const expected = new Date();
    expected.setDate(expected.getDate() + 30);
    // допуск 1 секунда
    expect(Math.abs(new Date(result).getTime() - expected.getTime())).toBeLessThan(1000);
  });

  it('існуючий expiry в майбутньому → продовжується від нього', () => {
    const future = new Date();
    future.setDate(future.getDate() + 10);
    const result = computeNewExpiry(future.toISOString());
    const expected = new Date(future);
    expected.setDate(expected.getDate() + 30);
    expect(Math.abs(new Date(result).getTime() - expected.getTime())).toBeLessThan(1000);
  });

  it('існуючий expiry в минулому → ігнорується (now + 30)', () => {
    const past = new Date('2025-01-01');
    const result = computeNewExpiry(past.toISOString());
    const expected = new Date();
    expected.setDate(expected.getDate() + 30);
    expect(Math.abs(new Date(result).getTime() - expected.getTime())).toBeLessThan(1000);
  });

  it('undefined (немає поля) → now + 30', () => {
    const result = computeNewExpiry(undefined);
    const expected = new Date();
    expected.setDate(expected.getDate() + 30);
    expect(Math.abs(new Date(result).getTime() - expected.getTime())).toBeLessThan(1000);
  });
});
