// Pure helpers for flash deal logic — importable from server actions and tests

/** Returns UTC first-day-of-month for Starter quota boundary checks. */
export function getMonthStart(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
}

/** Discounted price in UAH, rounded to nearest integer. */
export function calcDiscountedPrice(originalPrice: number, discountPct: number): number {
  return Math.round(originalPrice * (1 - discountPct / 100));
}

/**
 * Validates that a booking's date/time matches the flash deal's reserved slot.
 * dealSlotTime from PostgreSQL TIME arrives as 'HH:MM:SS'; bookingTime is 'HH:MM'.
 */
export function isFlashSlotMatch(
  bookingDate: string | null | undefined,
  bookingTime: string | null | undefined,
  dealSlotDate: string,
  dealSlotTime: string,
): boolean {
  if (!bookingDate || !bookingTime) return false;
  return dealSlotDate === bookingDate && dealSlotTime.slice(0, 5) === bookingTime;
}
