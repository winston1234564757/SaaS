'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[Dashboard Error Boundary]', error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 px-6 text-center">
      <div className="w-14 h-14 rounded-full bg-destructive/10 flex items-center justify-center">
        <AlertTriangle className="w-7 h-7 text-destructive" />
      </div>
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-1">Щось пішло не так</h2>
        <p className="text-sm text-muted-foreground">
          Сторінка не змогла завантажитись. Спробуйте оновити.
        </p>
      </div>
      <button
        onClick={reset}
        className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-primary text-white text-sm font-medium active:scale-95 transition-transform"
      >
        <RefreshCw className="w-4 h-4" />
        Спробувати знову
      </button>
    </div>
  );
}
