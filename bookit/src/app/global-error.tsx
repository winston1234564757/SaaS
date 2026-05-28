'use client';

import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[Global Error Boundary]', error);
  }, [error]);

  return (
    <html lang="uk">
      <body style={{ background: '#FFE8DC', margin: 0, fontFamily: 'sans-serif' }}>
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', minHeight: '100vh', gap: 16, padding: 24, textAlign: 'center',
        }}>
          <div style={{
            width: 56, height: 56, borderRadius: '50%',
            background: 'rgba(192,91,91,0.1)', display: 'flex',
            alignItems: 'center', justifyContent: 'center', fontSize: 28,
          }}>⚠️</div>
          <div>
            <h2 style={{ color: '#2C1A14', marginBottom: 4 }}>Критична помилка</h2>
            <p style={{ color: '#6B5750', fontSize: 14 }}>Будь ласка, оновіть сторінку.</p>
          </div>
          <button
            onClick={reset}
            style={{
              background: '#789A99', color: '#fff', border: 'none',
              padding: '10px 20px', borderRadius: 16, fontSize: 14,
              cursor: 'pointer', fontWeight: 600,
            }}
          >
            Оновити
          </button>
        </div>
      </body>
    </html>
  );
}
