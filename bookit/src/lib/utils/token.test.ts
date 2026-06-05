import { describe, it, expect } from 'vitest';
import { generateSecureToken, sha256Hex } from './token';

const TOKEN_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

describe('generateSecureToken', () => {
  it('returns a string of default length 8', () => {
    const token = generateSecureToken();
    expect(token).toHaveLength(8);
  });

  it('returns a string of specified length', () => {
    expect(generateSecureToken(16)).toHaveLength(16);
    expect(generateSecureToken(32)).toHaveLength(32);
  });

  it('only uses allowed characters (no 0, O, I, 1)', () => {
    for (let i = 0; i < 100; i++) {
      const token = generateSecureToken(16);
      for (const ch of token) {
        expect(TOKEN_CHARS).toContain(ch);
      }
    }
  });

  it('generates different tokens on each call', () => {
    const tokens = new Set(Array.from({ length: 50 }, () => generateSecureToken()));
    expect(tokens.size).toBeGreaterThan(45);
  });
});

describe('sha256Hex', () => {
  it('produces a 64-character hex string', async () => {
    const hash = await sha256Hex('test');
    expect(hash).toHaveLength(64);
    expect(/^[0-9a-f]{64}$/.test(hash)).toBe(true);
  });

  it('is deterministic for same input', async () => {
    const a = await sha256Hex('hello');
    const b = await sha256Hex('hello');
    expect(a).toBe(b);
  });

  it('produces different hashes for different inputs', async () => {
    const a = await sha256Hex('abc');
    const b = await sha256Hex('xyz');
    expect(a).not.toBe(b);
  });

  it('handles empty string', async () => {
    const hash = await sha256Hex('');
    expect(hash).toHaveLength(64);
  });

  it('handles Unicode strings', async () => {
    const hash = await sha256Hex('привіт');
    expect(hash).toHaveLength(64);
  });
});
