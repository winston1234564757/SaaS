import { describe, it, expect } from 'vitest';
import { formatCurrency, formatPrice } from './currency';

describe('formatCurrency', () => {
  it('formats number in UAH currency style', () => {
    const r = formatCurrency(1500);
    expect(r).toContain('500');
  });

  it('handles 0', () => {
    expect(formatCurrency(0)).toBeTruthy();
  });

  it('handles large numbers', () => {
    expect(formatCurrency(1000000)).toBeTruthy();
  });
});

describe('formatPrice', () => {
  it('formats with ₴ suffix', () => {
    expect(formatPrice(1500)).toContain('₴');
  });

  it('formats with Ukrainian locale separators', () => {
    const r = formatPrice(1500);
    expect(r).toMatch(/[\d\s]+ ₴/);
  });

  it('handles 0', () => {
    expect(formatPrice(0)).toBe('0 ₴');
  });
});
