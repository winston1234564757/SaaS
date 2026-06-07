import { QueryClient } from '@tanstack/react-query';

/**
 * Canonical 6-key invalidation cascade for any booking mutation.
 * Uses prefix matching — catches all query variants with extra params (masterId, dates, etc).
 * Call after every booking status change, create, reschedule, or cancel.
 */
export async function invalidateBookingQueries(qc: QueryClient): Promise<void> {
  await Promise.all([
    qc.invalidateQueries({ queryKey: ['bookings'] }),
    qc.invalidateQueries({ queryKey: ['wizard-schedule'] }),
    qc.invalidateQueries({ queryKey: ['dashboard-stats'] }),
    qc.invalidateQueries({ queryKey: ['weekly-overview'] }),
    qc.invalidateQueries({ queryKey: ['monthly-booking-count'] }),
    qc.invalidateQueries({ queryKey: ['unified-sales'] }),
  ]);
}
