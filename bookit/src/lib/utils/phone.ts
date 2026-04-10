/**
 * Нормалізує будь-який введений український номер до E.164: 380XXXXXXXXX
 * Приймає: '0967953488', '380967953488', '+380967953488', '967953488'
 * Повертає null якщо формат не розпізнано.
 */
export function normalizeToE164(raw: string): string | null {
  const digits = raw.replace(/\D/g, '');
  if (/^380\d{9}$/.test(digits)) return digits;          // вже E.164
  if (/^0\d{9}$/.test(digits))   return '38' + digits;  // 0XX → 380XX
  if (/^\d{9}$/.test(digits))    return '380' + digits; // 9 цифр без префікса
  return null;
}

/**
 * Конвертує збережений E.164 номер (380XXXXXXXXX або 0XXXXXXXXX)
 * у 9-цифровий формат для input полів з префіксом +38.
 */
export function e164ToInputPhone(stored: string | null | undefined): string {
  if (!stored) return '';
  const digits = stored.replace(/\D/g, '');
  if (digits.startsWith('380') && digits.length === 12) return digits.slice(3);
  if (digits.startsWith('0') && digits.length === 10)  return digits.slice(1);
  return digits.slice(0, 9);
}

/** Format 9-digit phone (without leading 0) as "0XX XXX XX XX" */
export function formatPhoneDisplay(raw: string): string {
  const d = '0' + raw.replace(/\D/g, '');
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)} ${d.slice(3)}`;
  if (d.length <= 8) return `${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6)}`;
  return `${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6, 8)} ${d.slice(8, 10)}`;
}

/** Normalize user phone input: strip non-digits, remove leading 0, limit to 9 chars */
export function normalizePhoneInput(val: string): string {
  let raw = val.replace(/\D/g, '');
  if (raw.startsWith('0')) raw = raw.slice(1);
  return raw.slice(0, 9);
}

/** Convert 9-digit phone to full E.164 format: 380XXXXXXXXX */
export function toFullPhone(phone9: string): string {
  return `380${phone9}`;
}

/** 
 * Bulletproof virtual email generation for SMS Auth.
 * Strips ALL non-numeric characters and appends @bookit.app.
 * e.g., "+380 96 123 45 67" -> "380961234567@bookit.app"
 */
export const generateVirtualEmail = (phone: string): string => {
  const digits = phone.replace(/\D/g, '');
  return `${digits}@bookit.app`;
};
