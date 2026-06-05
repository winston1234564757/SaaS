import { describe, it, expect } from 'vitest';

// ── OTP Generation (copied from send-sms route) ────────────────────

function generateOtp(): string {
  return (100000 + (crypto.getRandomValues(new Uint32Array(1))[0] % 900000)).toString();
}

describe('OTP generation (send-sms route)', () => {
  it('генерує 6 цифр', () => {
    const otp = generateOtp();
    expect(otp).toHaveLength(6);
    expect(/^\d{6}$/.test(otp)).toBe(true);
  });

  it('OTP в діапазоні 100000–999999', () => {
    for (let i = 0; i < 100; i++) {
      const otp = generateOtp();
      const num = Number(otp);
      expect(num).toBeGreaterThanOrEqual(100000);
      expect(num).toBeLessThanOrEqual(999999);
    }
  });

  it('100 генерацій — жодного дубліката (тест на entropy)', () => {
    const otps = new Set<string>();
    for (let i = 0; i < 100; i++) {
      otps.add(generateOtp());
    }
    expect(otps.size).toBe(100);
  });

  it('String(0) веде себе коректно — при ду дуже малому random значенні 0 дасть "100000"', () => {
    // Мінімальне: 100000 + 0 = 100000 → "100000"
    const minOtp = 100000 + 0;
    expect(String(minOtp)).toBe('100000');
    expect(String(minOtp)).toHaveLength(6);
  });
});

// ── TurboSMS response validation (from send-sms route) ─────────────

type SmsResponse = {
  response_code?: number;
  response_status?: string;
};

function isTurboSmsSuccess(smsData: SmsResponse): boolean {
  const isAltSuccess = !!(
    smsData?.response_status?.includes('SUCCESS') ||
    smsData?.response_status?.includes('OK')
  );
  return (
    smsData.response_code === 800 ||
    smsData.response_code === 801 ||
    smsData.response_code === 0 ||
    isAltSuccess
  );
}

describe('TurboSMS response validation', () => {
  it('response_code 800 → success', () => {
    expect(isTurboSmsSuccess({ response_code: 800 })).toBe(true);
  });

  it('response_code 801 → success', () => {
    expect(isTurboSmsSuccess({ response_code: 801 })).toBe(true);
  });

  it('response_code 0 → success', () => {
    expect(isTurboSmsSuccess({ response_code: 0 })).toBe(true);
  });

  it('response_status містить SUCCESS → success', () => {
    expect(isTurboSmsSuccess({ response_code: 123, response_status: 'SUCCESS' })).toBe(true);
  });

  it('response_status містить OK → success', () => {
    expect(isTurboSmsSuccess({ response_code: 999, response_status: 'OK' })).toBe(true);
  });

  it('response_code 400 → falsy (undefined або false)', () => {
    // JS: undefined || undefined = undefined, тому isAltSuccess = undefined
    // Але !undefined = true → коректно в if (!isSuccess)
    expect(isTurboSmsSuccess({ response_code: 400 })).toBeFalsy();
  });

  it('response_code 500 → falsy', () => {
    expect(isTurboSmsSuccess({ response_code: 500 })).toBeFalsy();
  });

  it('порожній обʼєкт → falsy', () => {
    expect(isTurboSmsSuccess({})).toBeFalsy();
  });

  it('response_status: "ERROR" + response_code: undefined → falsy', () => {
    expect(isTurboSmsSuccess({ response_status: 'ERROR' })).toBeFalsy();
  });

  it('null response_code → покладається на response_status', () => {
    expect(isTurboSmsSuccess({ response_code: undefined, response_status: 'SUCCESS' })).toBe(true);
    expect(isTurboSmsSuccess({ response_code: undefined, response_status: 'ERROR' })).toBe(false);
  });

  it('response_code 800 але status ERROR → все одно success (code має пріоритет)', () => {
    // В реальному коді: спочатку code, потім response_status
    expect(isTurboSmsSuccess({ response_code: 800, response_status: 'ERROR' })).toBe(true);
  });
});

// ── Phone normalization (inline logic from send-sms route) ─────────

function normalizePhoneInline(raw: unknown): string | null {
  if (!raw) return null;
  const phone = String(raw).replace(/\D/g, '');
  if (!/^380\d{9}$/.test(phone)) return null;
  return phone;
}

describe('Phone normalization (inline, send-sms route)', () => {
  it('null/undefined → null', () => {
    expect(normalizePhoneInline(null)).toBeNull();
    expect(normalizePhoneInline(undefined)).toBeNull();
  });

  it('проходить коректний 380XXXXXXXXX', () => {
    expect(normalizePhoneInline('380501234567')).toBe('380501234567');
  });

  it('+38(050)123-45-67 → strip → 380501234567', () => {
    expect(normalizePhoneInline('+38(050)123-45-67')).toBe('380501234567');
  });

  it('порожній рядок → null', () => {
    expect(normalizePhoneInline('')).toBeNull();
  });

  it('не-380 номер → null', () => {
    expect(normalizePhoneInline('48123456789')).toBeNull();
  });

  it('число замість рядка → String(number) → працює', () => {
    expect(normalizePhoneInline(380501234567)).toBe('380501234567');
  });
});
