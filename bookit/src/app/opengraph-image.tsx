import { ImageResponse } from 'next/og';

export const runtime = 'edge';

// Default social share card for every route without its own opengraph-image
// (homepage, /explore, /legal, landing, login). Replaces the broken static
// /og-default.png reference. Brand-consistent with [slug]/opengraph-image.tsx
// and apple-icon.tsx — an ImageResponse, so there is no static asset to maintain.
export const alt = 'Bookit — онлайн запис до майстрів краси';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#FFE8DC',
          color: '#2C1A14',
          fontFamily: 'sans-serif',
          padding: '80px',
        }}
      >
        {/* Decorative blur elements — mirror the master-card aesthetic */}
        <div style={{ position: 'absolute', top: -120, right: -120, width: 460, height: 460, borderRadius: 230, background: 'rgba(120, 154, 153, 0.22)', filter: 'blur(70px)' }} />
        <div style={{ position: 'absolute', bottom: -160, left: -120, width: 520, height: 520, borderRadius: 260, background: 'rgba(212, 147, 90, 0.16)', filter: 'blur(90px)' }} />

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(255, 255, 255, 0.7)',
            borderRadius: '48px',
            border: '1px solid rgba(255, 255, 255, 0.5)',
            boxShadow: '0 20px 50px rgba(44, 26, 20, 0.05)',
            padding: '72px',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: '28px', fontWeight: 700, color: '#789A99', marginBottom: '28px', textTransform: 'uppercase', letterSpacing: '8px' }}>
            Bookit
          </div>
          <h1 style={{ fontSize: '76px', fontWeight: 900, margin: 0, lineHeight: 1.05, color: '#2C1A14' }}>
            Онлайн запис до майстрів краси
          </h1>
          <p style={{ fontSize: '34px', fontWeight: 500, color: '#6B5750', marginTop: '32px', maxWidth: '880px' }}>
            Твоя booking-сторінка за 2 хвилини — запис, продаж товарів та CRM
          </p>
        </div>
      </div>
    ),
    { ...size },
  );
}
