import { describe, it, expect, afterEach } from 'vitest';
import { getNow } from './now';

describe('getNow', () => {
  const OLD_ENV = process.env.NEXT_PUBLIC_DEBUG_NOW;

  afterEach(() => {
    process.env.NEXT_PUBLIC_DEBUG_NOW = OLD_ENV;
  });

  it('returns a valid Date object', () => {
    const now = getNow();
    expect(now).toBeInstanceOf(Date);
    expect(now.getTime()).not.toBeNaN();
  });

  it('uses env override when set', () => {
    process.env.NEXT_PUBLIC_DEBUG_NOW = '2026-06-10T12:00:00Z';
    const now = getNow();
    expect(now.toISOString()).toContain('2026-06-10');
  });

  it('falls back to real time on invalid env date', () => {
    process.env.NEXT_PUBLIC_DEBUG_NOW = 'totally-invalid-date';
    const now = getNow();
    expect(now.getTime()).not.toBeNaN();
  });

  it('rejects env value of "undefined"', () => {
    process.env.NEXT_PUBLIC_DEBUG_NOW = 'undefined';
    const now = getNow();
    expect(now.getTime()).not.toBeNaN();
  });

  it('rejects env value of "null"', () => {
    process.env.NEXT_PUBLIC_DEBUG_NOW = 'null';
    const now = getNow();
    expect(now.getTime()).not.toBeNaN();
  });
});
