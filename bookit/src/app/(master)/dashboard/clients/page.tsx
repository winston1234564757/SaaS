import type { Metadata } from 'next';
import { ClientsPage } from '@/components/master/clients/ClientsPage';

export const metadata: Metadata = { title: 'Клієнти — Bookit' };

export default function Page() {
  return <ClientsPage />;
}
