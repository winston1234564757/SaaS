import { ImageResponse } from 'next/og';

export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 180,
          height: 180,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #8AADAC 0%, #789A99 50%, #6B8B8A 100%)',
          borderRadius: 40,
        }}
      >
        <div
          style={{
            color: 'white',
            fontSize: 90,
            fontWeight: 800,
            letterSpacing: '-0.04em',
            fontFamily: 'system-ui, sans-serif',
          }}
        >
          B
        </div>
      </div>
    ),
    { ...size }
  );
}
