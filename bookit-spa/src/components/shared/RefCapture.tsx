import { useEffect, Suspense } from 'react';
import { useSearchParams } from 'react-router-dom';

function RefCaptureInner() {
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const ref = searchParams.get('ref');
    if (ref && typeof window !== 'undefined') {
      localStorage.setItem('bookit_ref', ref);
    }
  }, [searchParams]);

  return null;
}

/**
 * Перехоплює ?ref=<code> з URL та зберігає в localStorage('bookit_ref').
 * Код "виживає" після редиректів авторизації.
 */
export function RefCapture() {
  return (
    <Suspense fallback={null}>
      <RefCaptureInner />
    </Suspense>
  );
}
