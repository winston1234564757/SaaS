'use client';

import { useEffect, useRef, type ReactNode } from 'react';

export function AuthScrollMain({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;

    const onResize = () => {
      const el = ref.current;
      if (!el) return;
      const kbH = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
      if (kbH > 100) {
        // keyboard open — push form bottom to 10px above keyboard
        requestAnimationFrame(() => {
          if (ref.current) ref.current.scrollTop = ref.current.scrollHeight;
        });
      }
    };

    vv.addEventListener('resize', onResize);
    return () => vv.removeEventListener('resize', onResize);
  }, []);

  return (
    <main
      ref={ref}
      className="relative z-10 flex-1 flex flex-col overflow-y-auto px-5 pt-8 pb-[10px]"
    >
      {children}
    </main>
  );
}
