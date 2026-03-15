import type { Metadata } from 'next';
import { SettingsPage } from '@/components/master/settings/SettingsPage';

export const metadata: Metadata = { title: 'Налаштування — Bookit' };

export default function Page() {
  return <SettingsPage />;
}
