import { describe, it, expect } from 'vitest';
import { pluralUk } from './pluralUk';

describe('pluralUk', () => {
  const one = 'запис';
  const few = 'записи';
  const many = 'записів';

  it('returns one form for n=1', () => {
    expect(pluralUk(1, one, few, many)).toBe('запис');
  });

  it('returns one form for n=21, 31, 41', () => {
    expect(pluralUk(21, one, few, many)).toBe('запис');
    expect(pluralUk(31, one, few, many)).toBe('запис');
    expect(pluralUk(101, one, few, many)).toBe('запис');
  });

  it('returns few form for n=2,3,4', () => {
    expect(pluralUk(2, one, few, many)).toBe('записи');
    expect(pluralUk(3, one, few, many)).toBe('записи');
    expect(pluralUk(4, one, few, many)).toBe('записи');
  });

  it('returns few form for n=22,23,24', () => {
    expect(pluralUk(22, one, few, many)).toBe('записи');
    expect(pluralUk(23, one, few, many)).toBe('записи');
    expect(pluralUk(24, one, few, many)).toBe('записи');
  });

  it('returns many form for n=0', () => {
    expect(pluralUk(0, one, few, many)).toBe('записів');
  });

  it('returns many form for n=5..20', () => {
    for (let n = 5; n <= 20; n++) {
      expect(pluralUk(n, one, few, many)).toBe('записів');
    }
  });

  it('returns many form for n=25..30', () => {
    for (let n = 25; n <= 30; n++) {
      expect(pluralUk(n, one, few, many)).toBe('записів');
    }
  });

  it('returns many form for n=11..14', () => {
    for (const n of [11, 12, 13, 14]) {
      expect(pluralUk(n, one, few, many)).toBe('записів');
    }
  });

  it('handles negative numbers (all return many, mod10 < 0)', () => {
    expect(pluralUk(-1, one, few, many)).toBe('записів');
    expect(pluralUk(-5, one, few, many)).toBe('записів');
    expect(pluralUk(-11, one, few, many)).toBe('записів');
  });

  it('handles fractional numbers', () => {
    expect(pluralUk(1.5, one, few, many)).toBe('записів');
  });
});
