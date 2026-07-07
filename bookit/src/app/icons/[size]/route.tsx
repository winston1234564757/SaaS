import { ImageResponse } from 'next/og';

export const runtime = 'edge';

const VALID_SIZES = [192, 512];

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ size: string }> }
) {
  const { size: sizeStr } = await params;
  // Accept both bare numbers ("192") and manifest-style names ("icon-192.png",
  // "icon-512-maskable.png") — the web app manifest references the latter, which the
  // strict parseInt(sizeStr) rejected as NaN → 404 → broken PWA install icon.
  const size = parseInt(sizeStr.replace(/[^0-9]/g, ''), 10);

  if (!VALID_SIZES.includes(size)) {
    return new Response('Not found', { status: 404 });
  }

  const fontSize = Math.round(size * 0.45);
  const radius = Math.round(size * 0.28);

  return new ImageResponse(
    (
      <div
        style={{
          width: size,
          height: size,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #8AADAC 0%, #789A99 50%, #6B8B8A 100%)',
          borderRadius: radius,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: fontSize,
            fontWeight: 800,
            letterSpacing: '-0.04em',
            fontFamily: 'system-ui, sans-serif',
          }}
        >
          B
        </div>
      </div>
    ),
    { width: size, height: size }
  );
}
