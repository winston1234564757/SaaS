import type { Metadata } from 'next';
import { LoginForm } from '@/components/auth/LoginForm';

export const metadata: Metadata = {
  title: 'Увійти — Bookit',
};

export default function LoginPage() {
  return <LoginForm />;
}
