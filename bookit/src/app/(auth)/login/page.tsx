import type { Metadata } from 'next';
import { PhoneOtpForm } from '@/components/auth/PhoneOtpForm';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Увійти — Bookit',
  description: 'Увійдіться або зареєструйтесь у Bookit',
};

export default function LoginPage() {
  return <PhoneOtpForm />;
}
