'use client';

import { useEffect, useRef, type CSSProperties, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}

export function AuthKeyboard({ children, className, style }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  // Same pattern as RestockDrawer: visualViewport → set height explicitly.
  // For position:fixed drawers we change `bottom`; for page panels we change `height`.
  // This ensures flex centering (my-auto on inner div) works within the visible area,
  // not the full layout viewport height that doesn't shrink on some iOS versions.
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;

    const update = () => {
      const el = ref.current;
      if (!el) return;
      el.style.height = `${vv.height}px`;
    };

    update();
    vv.addEventListener('resize', update);
    vv.addEventListener('scroll', update);

    return () => {
      vv.removeEventListener('resize', update);
      vv.removeEventListener('scroll', update);
      if (ref.current) ref.current.style.height = '';
    };
  }, []);

  return (
    <div
      ref={ref}
      className={className}
      style={style}
    >
      {children}
    </div>
  );
}
