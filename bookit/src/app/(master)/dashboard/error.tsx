'use client';
import { useEffect } from 'react';
import { AlertCircle, RotateCcw, Home } from 'lucide-react';
import Link from 'next/link';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Dashboard Error:', error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 text-center">
      <div className="w-20 h-20 bg-destructive/10 rounded-full flex items-center justify-center mb-6 animate-pulse">
        <AlertCircle className="w-10 h-10 text-destructive" />
      </div>
      
      <h1 className="text-3xl font-bold tracking-tight mb-2">Щось пішло не так</h1>
      <p className="text-muted-foreground max-w-md mb-8">
        Виникла помилка під час завантаження даних дашборду. Наші інженери вже повідомлені.
      </p>

      <div className="flex flex-col sm:flex-row gap-3 w-full max-w-sm">
        <button
          onClick={() => reset()}
          className="flex-1 flex items-center justify-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-2xl font-semibold hover:opacity-90 transition-all active:scale-95"
        >
          <RotateCcw className="w-4 h-4" />
          Спробувати знову
        </button>
        
        <Link
          href="/dashboard"
          className="flex-1 flex items-center justify-center gap-2 bg-secondary text-secondary-foreground px-6 py-3 rounded-2xl font-semibold hover:bg-secondary/80 transition-all active:scale-95"
        >
          <Home className="w-4 h-4" />
          На головну
        </Link>
      </div>

      {process.env.NODE_ENV === 'development' && (
        <pre className="mt-12 p-4 bg-muted rounded-lg text-left text-xs overflow-auto max-w-2xl w-full border">
          {error.message}
          {error.stack && `\n\n${error.stack}`}
        </pre>
      )}
    </div>
  );
}
