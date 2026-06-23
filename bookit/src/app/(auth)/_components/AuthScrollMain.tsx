import type { ReactNode } from 'react';

export function AuthScrollMain({ children }: { children: ReactNode }) {
  return (
    <main className="relative z-10 flex-1 flex flex-col overflow-y-auto px-5 py-6">
      {/* my-auto: центрує форму коли влазить; коли вища за видиму зону —
          margins колапсують і overflow-y-auto дає скрол без flex-clip bug */}
      <div className="w-full max-w-sm mx-auto my-auto">
        {children}
      </div>
    </main>
  );
}
