import type { Metadata } from 'next';
import { BookingsPage } from '@/components/master/bookings/BookingsPage';

export const metadata: Metadata = { title: 'Записи — Bookit' };

export default function Page() {
  return <BookingsPage />;
}
