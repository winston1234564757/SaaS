'use client';

import { useEffect, useRef, type ReactNode } from 'react';

export function AuthScrollMain({ children }: { children: ReactNode }) {
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;

    const onResize = () => {
      const wrap = wrapRef.current;
      if (!wrap) return;
      const kbH = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
      if (kbH > 100) {
        // keyboard open: push form to bottom, pb-6 becomes the only gap
        wrap.style.marginTop = 'auto';
        wrap.style.marginBottom = '0';
      } else {
        // keyboard closed: restore my-auto centering
        wrap.style.marginTop = '';
        wrap.style.marginBottom = '';
      }
    };

    vv.addEventListener('resize', onResize);
    return () => vv.removeEventListener('resize', onResize);
  }, []);

  return (
    <main className="relative z-10 flex-1 flex flex-col overflow-y-auto px-5 pt-8 pb-6">
      <div ref={wrapRef} className="w-full max-w-sm mx-auto my-auto">
        {children}
      </div>
    </main>
  );
}
