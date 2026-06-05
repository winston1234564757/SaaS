import { describe, it, expect } from 'vitest';
import {
  normalizeToE164,
  e164ToInputPhone,
  formatPhoneDisplay,
  normalizePhoneInput,
  toFullPhone,
  generateVirtualEmail,
} from './phone';

// ── normalizeToE164 ───────────────────────────────────────────────

describe('normalizeToE164', () => {
  it('380XXXXXXXXX — пропускає без змін', () => {
    expect(normalizeToE164('380501234567')).toBe('380501234567');
  });

  it('0XX XXX XX XX — додає 38', () => {
    expect(normalizeToE164('0501234567')).toBe('380501234567');
  });

  it('80 + 9 цифр (11 всього) — додає 3', () => {
    expect(normalizeToE164('80501234567')).toBe('380501234567');
  });

  it('80 + 8 цифр (10 всього) — не підтримується, null', () => {
    expect(normalizeToE164('8050123456')).toBeNull();
  });

  it('+380(50)123-45-67 — strip не-digits, розпізнає 380', () => {
    expect(normalizeToE164('+38(050)123-45-67')).toBe('380501234567');
  });

  it('XXXXXXXXX (9 цифр без префікса) — додає 380', () => {
    expect(normalizeToE164('501234567')).toBe('380501234567');
  });

  it('+380(50)123-45-67 — strip не-digits, розпізнає 380', () => {
    expect(normalizeToE164('+38(050)123-45-67')).toBe('380501234567');
  });

  it('пробіли і дефіси — очищаються', () => {
    expect(normalizeToE164(' 380 50 123 45 67 ')).toBe('380501234567');
  });

  it('закордонний номер (+48...) — null', () => {
    expect(normalizeToE164('48123456789')).toBeNull();
  });

  it('порожній рядок — null', () => {
    expect(normalizeToE164('')).toBeNull();
  });

  it('тільки сміття без цифр — null', () => {
    expect(normalizeToE164('abc!@#')).toBeNull();
  });

  it('недостатньо цифр після очищення — null', () => {
    expect(normalizeToE164('123')).toBeNull();
  });

  it('12 цифр (380 + 9) — має спрацювати', () => {
    expect(normalizeToE164('380501234567')).toBe('380501234567');
  });

  it('13+ цифр — не проходить regex', () => {
    expect(normalizeToE164('3805012345678')).toBeNull();
  });

  it('0 + 11 цифр — не проходить жоден regex (не 380, не 0+9, не 80+9, не 9)', () => {
    expect(normalizeToE164('00501234567')).toBeNull();
  });
});

// ── e164ToInputPhone ───────────────────────────────────────────────

describe('e164ToInputPhone', () => {
  it('380XXXXXXXXX → 9 цифр', () => {
    expect(e164ToInputPhone('380501234567')).toBe('501234567');
  });

  it('0XXXXXXXXX → без першої 0', () => {
    expect(e164ToInputPhone('0501234567')).toBe('501234567');
  });

  it('null / undefined → ""', () => {
    expect(e164ToInputPhone(null)).toBe('');
    expect(e164ToInputPhone(undefined)).toBe('');
  });

  it('короткий рядок — просто обрізає до 9', () => {
    expect(e164ToInputPhone('123')).toBe('123');
  });
});

// ── formatPhoneDisplay ─────────────────────────────────────────────

describe('formatPhoneDisplay', () => {
  it('9 цифр → "0XX XXX XX XX"', () => {
    expect(formatPhoneDisplay('501234567')).toBe('050 123 45 67');
  });

  it('менше 3 цифр — без форматування', () => {
    expect(formatPhoneDisplay('50')).toBe('050');
  });

  it('3-6 цифр — часткове форматування', () => {
    expect(formatPhoneDisplay('50123')).toBe('050 123');
  });

  it('6-8 цифр — два блоки', () => {
    expect(formatPhoneDisplay('5012345')).toBe('050 123 45');
  });

  it('очищає не-digits', () => {
    expect(formatPhoneDisplay('50-12-34')).toBe('050 123 4');
  });
});

// ── normalizePhoneInput ────────────────────────────────────────────

describe('normalizePhoneInput', () => {
  it('380XXXXXXXXX → зрізає 380', () => {
    expect(normalizePhoneInput('380501234567')).toBe('501234567');
  });

  it('38XXXXXXXXXX → зрізає 38', () => {
    expect(normalizePhoneInput('385012345678')).toBe('501234567');
  });

  it('0XXXXXXXXX → зрізає 0', () => {
    expect(normalizePhoneInput('0501234567')).toBe('501234567');
  });

  it('9 цифр без префікса — без змін', () => {
    expect(normalizePhoneInput('501234567')).toBe('501234567');
  });

  it('обрізає до 9 символів', () => {
    expect(normalizePhoneInput('50123456789')).toBe('501234567');
  });

  it('strip не-digits', () => {
    expect(normalizePhoneInput('+38(050)123-45-67')).toBe('501234567');
  });
});

// ── toFullPhone ────────────────────────────────────────────────────

describe('toFullPhone', () => {
  it('9 цифр → 380 + 9 цифр', () => {
    expect(toFullPhone('501234567')).toBe('380501234567');
  });
});

// ── generateVirtualEmail ───────────────────────────────────────────

describe('generateVirtualEmail', () => {
  it('380XXXXXXXXX → name@bookit.app', () => {
    expect(generateVirtualEmail('380501234567')).toBe('380501234567@bookit.app');
  });

  it('очищає не-digits з вхідного', () => {
    expect(generateVirtualEmail('+380(50)123-45-67')).toBe('380501234567@bookit.app');
  });

  it('порожній вхідний → тільки домен', () => {
    expect(generateVirtualEmail('')).toBe('@bookit.app');
  });
});
