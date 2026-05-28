/**
 * Normalizes phone number to a consistent format (only digits, no +, no spaces).
 * Handles various formats: +380671234567, +38 067 123 4567, 067 123 4567, 0671234567, etc.
 */
export function normalizePhoneNumber(rawPhone: string): string {
  if (!rawPhone) return '';
  // Remove all non-digits
  return rawPhone.replace(/\D/g, '');
}

/**
 * Validates if a phone number is a valid Ukraine phone (10 digits without country code, or 12 digits with +38).
 */
export function isValidUkrainianPhone(phone: string): boolean {
  const normalized = normalizePhoneNumber(phone);
  // Either 10 digits (067...) or 12 digits (38067...)
  return normalized.length === 10 || normalized.length === 12;
}

/**
 * Converts various phone formats to a standard format for database storage.
 * Returns 10-digit format (without country code): 0671234567
 */
export function standardizePhoneForDb(rawPhone: string): string {
  const normalized = normalizePhoneNumber(rawPhone);

  // If it's 12 digits and starts with 38, remove the country code
  if (normalized.length === 12 && normalized.startsWith('38')) {
    return normalized.slice(2);
  }

  // If it's 10 digits, return as-is
  if (normalized.length === 10) {
    return normalized;
  }

  // Fallback: return whatever we have
  return normalized;
}
