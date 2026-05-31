import type { Metadata } from 'next';
import { Suspense } from 'react';
import { BookingsPage } from '@/components/master/bookings/BookingsPage';

export const metadata: Metadata = { title: 'Записи — Bookit' };

export default function Page() {
  return (
    <Suspense>
      <BookingsPage />
    </Suspense>
  );
}
