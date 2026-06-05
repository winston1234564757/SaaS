import { describe, it, expect } from 'vitest';
import { normalizePhoneNumber, isValidUkrainianPhone, standardizePhoneForDb } from './phone';

describe('normalizePhoneNumber', () => {
  it('removes + and spaces from +380 format', () => {
    expect(normalizePhoneNumber('+380 67 123 4567')).toBe('380671234567');
  });

  it('removes parentheses and dashes', () => {
    expect(normalizePhoneNumber('+38 (067) 123-45-67')).toBe('380671234567');
  });

  it('handles already clean digits', () => {
    expect(normalizePhoneNumber('0671234567')).toBe('0671234567');
  });

  it('returns empty string for empty input', () => {
    expect(normalizePhoneNumber('')).toBe('');
  });

  it('extracts digits from mixed string', () => {
    expect(normalizePhoneNumber('tel: +38 067 123 45 67')).toBe('380671234567');
  });
});

describe('isValidUkrainianPhone', () => {
  it('accepts 10-digit format', () => {
    expect(isValidUkrainianPhone('0671234567')).toBe(true);
  });

  it('accepts 12-digit format (with 38)', () => {
    expect(isValidUkrainianPhone('380671234567')).toBe(true);
  });

  it('accepts formatted number', () => {
    expect(isValidUkrainianPhone('+38 (067) 123-45-67')).toBe(true);
  });

  it('rejects 9-digit number', () => {
    expect(isValidUkrainianPhone('067123456')).toBe(false);
  });

  it('rejects too short number', () => {
    expect(isValidUkrainianPhone('123')).toBe(false);
  });

  it('rejects empty string', () => {
    expect(isValidUkrainianPhone('')).toBe(false);
  });
});

describe('standardizePhoneForDb', () => {
  it('strips country code from 12-digit 38-prefix format', () => {
    expect(standardizePhoneForDb('380671234567')).toBe('0671234567');
  });

  it('strips country code from +380 format', () => {
    expect(standardizePhoneForDb('+380 67 123 4567')).toBe('0671234567');
  });

  it('returns 10-digit number as-is', () => {
    expect(standardizePhoneForDb('0671234567')).toBe('0671234567');
  });

  it('returns digits-only even for invalid length', () => {
    expect(standardizePhoneForDb('12345')).toBe('12345');
  });

  it('returns empty for empty input', () => {
    expect(standardizePhoneForDb('')).toBe('');
  });
});
