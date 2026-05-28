import type { Metadata } from 'next';
import { ServicesPage } from '@/components/master/services/ServicesPage';

export const metadata: Metadata = { title: 'Послуги та товари — Bookit' };

export default function Page() {
  return <ServicesPage />;
}
