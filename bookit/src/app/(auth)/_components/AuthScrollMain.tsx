import type { ReactNode } from 'react';

export function AuthScrollMain({ children }: { children: ReactNode }) {
  return (
    <main className="relative z-10 flex-1 flex flex-col overflow-y-auto px-5 pb-6">
      {/* spacer: fills all free space above form, shrinks when keyboard opens */}
      <div className="flex-1 min-h-8" aria-hidden="true" />
      <div className="w-full max-w-sm mx-auto">
        {children}
      </div>
    </main>
  );
}
