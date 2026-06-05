import { describe, it, expect } from 'vitest';
import { z } from 'zod';

// ── Schema (identical to verify-sms/route.ts) ──────────────────────

const bodySchema = z.object({
  phone: z
    .string({ error: 'Введіть номер телефону' })
    .transform(v => v.replace(/\D/g, ''))
    .pipe(z.string().regex(/^380\d{9}$/, 'Некоректний формат телефону (380XXXXXXXXX)')),
  otp: z
    .string({ error: 'Введіть код підтвердження' })
    .trim()
    .regex(/^\d{6}$/, 'Код має містити 6 цифр'),
  role: z.enum(['client', 'master']).optional(),
});

type ValidInput = { phone: string; otp: string; role?: string };

function assertValid(input: unknown) {
  const r = bodySchema.safeParse(input);
  if (!r.success) {
    throw new Error(`Expected valid, got: ${r.error.issues.map(i => i.message).join(', ')}`);
  }
  return r.data;
}

function assertError(input: unknown, expectedMessage?: string) {
  const r = bodySchema.safeParse(input);
  expect(r.success).toBe(false);
  if (expectedMessage && !r.success) {
    const msgs = r.error.issues.map(i => i.message).join('; ');
    expect(msgs).toContain(expectedMessage);
  }
}

// ── phone: transform + pipe ────────────────────────────────────────

describe('bodySchema — phone', () => {
  it('380501234567 → проходить, повертає очищений', () => {
    const data = assertValid({ phone: '380501234567', otp: '123456' });
    expect(data.phone).toBe('380501234567');
  });

  it('+38(050)123-45-67 → transform зрізає не-digits → проходить', () => {
    const data = assertValid({ phone: '+38(050)123-45-67', otp: '123456' });
    expect(data.phone).toBe('380501234567');
  });

  it('0501234567 (0 + 9 цифр) → transform → "0501234567" → pipe reject', () => {
    assertError({ phone: '0501234567', otp: '123456' });
  });

  it('порожній рядок → transform → "" → pipe reject', () => {
    assertError({ phone: '', otp: '123456' });
  });

  it('тільки не-digits → transform → "" → pipe reject', () => {
    assertError({ phone: 'abc!@#', otp: '123456' });
  });

  it('недостатньо цифр (38050123) → pipe reject', () => {
    assertError({ phone: '38050123', otp: '123456' });
  });

  it('відсутній phone → помилка "Введіть номер телефону"', () => {
    assertError({ otp: '123456' }, 'Введіть номер телефону');
  });

  it('phone = null → помилка', () => {
    assertError({ phone: null, otp: '123456' });
  });

  it('phone = число → Zod z.string() reject (stricter ніж send-sms)', () => {
    assertError({ phone: 380501234567, otp: '123456' });
  });
});

// ── otp ────────────────────────────────────────────────────────────

describe('bodySchema — otp', () => {
  it('6 цифр → проходить', () => {
    const data = assertValid({ phone: '380501234567', otp: '123456' });
    expect(data.otp).toBe('123456');
  });

  it('5 цифр → reject', () => {
    assertError({ phone: '380501234567', otp: '12345' });
  });

  it('7 цифр → reject', () => {
    assertError({ phone: '380501234567', otp: '1234567' });
  });

  it('пробіли всередині → trim не допомагає (123 456 → reject)', () => {
    assertError({ phone: '380501234567', otp: '123 456' });
  });

  it('букви → reject', () => {
    assertError({ phone: '380501234567', otp: 'abcdef' });
  });

  it('відсутній otp → помилка', () => {
    assertError({ phone: '380501234567' }, 'Введіть код підтвердження');
  });
});

// ── role ───────────────────────────────────────────────────────────

describe('bodySchema — role', () => {
  it('"client" → проходить', () => {
    const data = assertValid({ phone: '380501234567', otp: '123456', role: 'client' });
    expect(data.role).toBe('client');
  });

  it('"master" → проходить', () => {
    const data = assertValid({ phone: '380501234567', otp: '123456', role: 'master' });
    expect(data.role).toBe('master');
  });

  it('відсутній role → undefined (optional)', () => {
    const data = assertValid({ phone: '380501234567', otp: '123456' });
    expect(data.role).toBeUndefined();
  });

  it('"admin" → reject', () => {
    assertError({ phone: '380501234567', otp: '123456', role: 'admin' });
  });

  it('порожній рядок → reject (не в enum)', () => {
    assertError({ phone: '380501234567', otp: '123456', role: '' });
  });
});

// ── Combined edge cases ────────────────────────────────────────────

describe('bodySchema — combined', () => {
  it('повністю валідний запит', () => {
    const data = assertValid({ phone: '380501234567', otp: '654321', role: 'master' });
    expect(data).toEqual({ phone: '380501234567', otp: '654321', role: 'master' });
  });

  it('мінімальний валідний запит (без role)', () => {
    const data = assertValid({ phone: '380501234567', otp: '000000' });
    expect(data).toEqual({ phone: '380501234567', otp: '000000' });
  });

  it('зайві поля — silent strip', () => {
    const data = assertValid({ phone: '380501234567', otp: '123456', extra: 'ignored' });
    expect(data).not.toHaveProperty('extra');
    expect(data.phone).toBe('380501234567');
  });
});
