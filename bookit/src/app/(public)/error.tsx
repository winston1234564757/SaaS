'use client';
import { useEffect } from 'react';
import { AlertTriangle, Home, RefreshCcw } from 'lucide-react';
import Link from 'next/link';

export default function PublicError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Public Error:', error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-6 text-center">
      <div className="relative mb-8">
        <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full" />
        <div className="relative w-24 h-24 bg-background border-2 border-primary/20 rounded-3xl flex items-center justify-center rotate-12 transition-transform hover:rotate-0">
          <AlertTriangle className="w-12 h-12 text-primary" />
        </div>
      </div>
      
      <h1 className="text-4xl font-extrabold tracking-tight mb-4 bg-gradient-to-br from-foreground to-foreground/60 bg-clip-text text-transparent">
        Ой! Щось пішло не так
      </h1>
      <p className="text-lg text-muted-foreground max-w-lg mb-10 leading-relaxed">
        На жаль, сталася помилка. Спробуйте оновити сторінку або поверніться пізніше.
      </p>

      <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
        <button
          onClick={() => reset()}
          className="flex-1 flex items-center justify-center gap-2 bg-primary text-primary-foreground px-8 py-4 rounded-3xl font-bold shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all active:scale-95"
        >
          <RefreshCcw className="w-5 h-5" />
          Спробувати ще раз
        </button>
        
        <Link
          href="/"
          className="flex-1 flex items-center justify-center gap-2 bg-secondary/50 backdrop-blur-sm text-secondary-foreground px-8 py-4 rounded-3xl font-bold border border-secondary/50 hover:bg-secondary/80 transition-all active:scale-95"
        >
          <Home className="w-5 h-5" />
          На головну
        </Link>
      </div>

      <div className="mt-16 text-sm text-muted-foreground/40">
        Код помилки: {error.digest || 'unknown'}
      </div>
    </div>
  );
}
