'use client';

import { useEffect } from 'react';

export function AdminThemeApplier() {
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', 'frost');
    
    // Dynamic theme-color update for iOS PWA/TMA
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) {
      meta.setAttribute('content', '#EFF2FF');
    }

    return () => {
      document.documentElement.removeAttribute('data-theme');
    };
  }, []);

  return null;
}
