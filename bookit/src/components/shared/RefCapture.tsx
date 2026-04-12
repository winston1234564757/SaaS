'use client';

import { useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Cookies from 'js-cookie';

/**
 * Невидимий компонент для захоплення реферального коду з URL.
 * Зберігає код у куки на 30 днів.
 */
function RefCaptureInner() {
  const searchParams = useSearchParams();

  useEffect(() => {
    // 1. Пріоритет: шлях /invite/CODE
    let refCode = '';
    const path = window.location.pathname;
    if (path.startsWith('/invite/')) {
      refCode = path.split('/').pop() || '';
    }

    // 2. Фолбек: search params ?ref=CODE або ?code=CODE
    if (!refCode) {
      refCode = searchParams.get('ref') || searchParams.get('code') || '';
    }

    if (refCode && refCode.length >= 3 && refCode.length <= 16) {
      // Зберігаємо на 30 днів
      Cookies.set('bookit_ref', refCode, { 
        expires: 30, 
        path: '/',
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production'
      });
    }
  }, [searchParams]);

  return null;
}

export function RefCapture() {
  return (
    <Suspense fallback={null}>
      <RefCaptureInner />
    </Suspense>
  );
}
