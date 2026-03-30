import { Link } from 'react-router-dom';
import { BlobBackground } from '@/components/shared/BlobBackground';
import { RegisterForm } from '@/components/auth/RegisterForm';

export function RegisterPage() {
  return (
    <div className="min-h-dvh flex flex-col">
      <BlobBackground />

      <header className="p-4">
        <Link to="/" className="heading-serif text-xl text-[#2C1A14]">
          Bookit<span className="text-[#789A99]">.</span>
        </Link>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 pb-8">
        <div className="w-full max-w-sm">
          <RegisterForm />
        </div>
      </main>
    </div>
  );
}
