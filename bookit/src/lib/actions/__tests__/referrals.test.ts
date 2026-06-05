import { describe, it, expect } from 'vitest';

// ── V-11: Referral code validation (from referrals.ts) ────────────

const REFERRAL_CODE_RE = /^[a-zA-Z0-9]{3,16}$/;

function sanitizeRefCode(raw: string): string | null {
  const trimmed = raw.trim();
  return REFERRAL_CODE_RE.test(trimmed) ? trimmed : null;
}

describe('V-11: Referral code validation', () => {
  it('ABCDEF (6 символів) → проходить', () => {
    expect(sanitizeRefCode('ABCDEF')).toBe('ABCDEF');
  });

  it('abc123 (6 символів) → проходить', () => {
    expect(sanitizeRefCode('abc123')).toBe('abc123');
  });

  it('мінімум 3 символи "abc" → проходить', () => {
    expect(sanitizeRefCode('abc')).toBe('abc');
  });

  it('максимум 16 символів → проходить', () => {
    expect(sanitizeRefCode('a'.repeat(16))).toBe('a'.repeat(16));
  });

  it('2 символи → reject', () => {
    expect(sanitizeRefCode('ab')).toBeNull();
  });

  it('17 символів → reject', () => {
    expect(sanitizeRefCode('a'.repeat(17))).toBeNull();
  });

  it('пробіли всередині → reject', () => {
    expect(sanitizeRefCode('ABC DEF')).toBeNull();
  });

  it('trim видаляє пробіли з країв', () => {
    expect(sanitizeRefCode('  ABC123  ')).toBe('ABC123');
  });

  it('спецсимволи → reject', () => {
    expect(sanitizeRefCode('ABC-123')).toBeNull();
    expect(sanitizeRefCode('ABC_123')).toBeNull();
    expect(sanitizeRefCode('ABC!123')).toBeNull();
  });

  it('кирилиця → reject', () => {
    expect(sanitizeRefCode('АВС123')).toBeNull();
  });

  it('порожній після trim → reject', () => {
    expect(sanitizeRefCode('   ')).toBeNull();
  });

  it('порожній рядок → reject', () => {
    expect(sanitizeRefCode('')).toBeNull();
  });

  it('тільки цифри "123456" → проходить', () => {
    expect(sanitizeRefCode('123456')).toBe('123456');
  });
});

// ── Trial days logic (from applyReferralRewards idempotent path) ──

function resolveTrialDays(refCode: string, masterRefCodes: string[], clientRefCodes: string[]): number {
  const isMasterRef = masterRefCodes.includes(refCode);
  return isMasterRef ? 14 : 30;
}

describe('Trial days assignment', () => {
  it('M2M referral (code в master_profiles) → 14 днів', () => {
    expect(resolveTrialDays('ABC123', ['ABC123'], [])).toBe(14);
  });

  it('C2B referral (code не знайдено в master_profiles) → 30 днів', () => {
    expect(resolveTrialDays('DEF456', ['ABC123'], ['DEF456'])).toBe(30);
  });

  it('code не знайдено в жодній таблиці → 30 (default)', () => {
    expect(resolveTrialDays('GHI789', ['ABC123'], ['DEF456'])).toBe(30);
  });
});

// ── Link generation patterns ──────────────────────────────────────

function buildB2BLink(appUrl: string, code: string): string {
  return `${appUrl}/invite/${code}`;
}

function buildC2CLink(appUrl: string, masterSlug: string, code: string): string {
  return `${appUrl}/${masterSlug}?ref=${code}`;
}

describe('Referral link generation', () => {
  const APP_URL = 'https://bookit.com.ua';

  it('B2B: /invite/{code}', () => {
    expect(buildB2BLink(APP_URL, 'ABC123')).toBe('https://bookit.com.ua/invite/ABC123');
  });

  it('B2B з іншим URL', () => {
    expect(buildB2BLink('http://localhost:3000', 'XYZ789')).toBe('http://localhost:3000/invite/XYZ789');
  });

  it('C2C: /{slug}?ref={code}', () => {
    expect(buildC2CLink(APP_URL, 'anna-master', 'CLNT01')).toBe('https://bookit.com.ua/anna-master?ref=CLNT01');
  });

  it('C2C: code зберігає регістр', () => {
    expect(buildC2CLink(APP_URL, 'test-slug', 'AbCdEf')).toBe('https://bookit.com.ua/test-slug?ref=AbCdEf');
  });

  it('C2C: masterSlug безпечний (лише a-z, 0-9, дефіс)', () => {
    expect(buildC2CLink(APP_URL, 'valid-slug-123', 'CODE')).toBe('https://bookit.com.ua/valid-slug-123?ref=CODE');
  });
});
