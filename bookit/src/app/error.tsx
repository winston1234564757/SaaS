'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[Root Error Boundary]', error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] gap-4 px-6 text-center">
      <div className="w-14 h-14 rounded-full bg-[#C05B5B]/10 flex items-center justify-center">
        <AlertTriangle className="w-7 h-7 text-[#C05B5B]" />
      </div>
      <div>
        <h2 className="text-lg font-semibold text-[#2C1A14] mb-1">Щось пішло не так</h2>
        <p className="text-sm text-[#6B5750]">Спробуйте оновити сторінку.</p>
      </div>
      <button
        onClick={reset}
        className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-[#789A99] text-white text-sm font-medium active:scale-95 transition-transform"
      >
        <RefreshCw className="w-4 h-4" />
        Оновити
      </button>
    </div>
  );
}
