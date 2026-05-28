import { BlobBackground } from '@/components/shared/BlobBackground';
import Link from 'next/link';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh flex flex-col">
      <BlobBackground />

      {/* Auth navbar */}
      <header className="p-4">
        <Link href="/" className="heading-serif text-xl text-foreground">
          Bookit<span className="text-primary">.</span>
        </Link>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 pb-8">
        <div className="w-full max-w-sm">
          {children}
        </div>
      </main>
    </div>
  );
}
