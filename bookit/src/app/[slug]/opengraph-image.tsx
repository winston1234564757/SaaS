import { ImageResponse } from 'next/og';
import { getMaster } from './data';
import { CATEGORY_TEMPLATES } from '@/lib/constants/onboardingTemplates';

export const runtime = 'edge';

// Image metadata
export const alt = 'Bookit Master Profile';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  try {
    const master = await getMaster(slug);

    if (!master) {
      return new ImageResponse(
        (
          <div style={{ background: '#FFE8DC', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 60, color: '#2C1A14' }}>
            Майстер не знайдений
          </div>
        ),
        { width: 1200, height: 630 }
      );
    }

    const profile = master.profiles as unknown as { full_name: string; avatar_url: string | null };
    const displayName = master.business_name || profile.full_name;
    const avatarUrl = profile.avatar_url;
    
    const specialties = (master.categories as string[] ?? [])
      .map(val => {
        const template = CATEGORY_TEMPLATES[val];
        return template ? `${template.emoji} ${template.label}` : val;
      })
      .slice(0, 3);

    const rating = master.rating ? `★ ${Number(master.rating).toFixed(1)}` : '';
    const reviews = master.rating_count ? `(${master.rating_count})` : '';

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
            padding: '40px',
            color: '#2C1A14',
            fontFamily: 'sans-serif',
          }}
        >
          {/* Decorative Elements */}
          <div style={{ position: 'absolute', top: -100, right: -100, width: 400, height: 400, borderRadius: 200, background: 'rgba(120, 154, 153, 0.2)', filter: 'blur(60px)' }} />
          <div style={{ position: 'absolute', bottom: -150, left: -100, width: 500, height: 500, borderRadius: 250, background: 'rgba(212, 147, 90, 0.15)', filter: 'blur(80px)' }} />

          <div
            style={{
              display: 'flex',
              flexDirection: 'row',
              width: '100%',
              height: '100%',
              backgroundColor: 'rgba(255, 255, 255, 0.7)',
              borderRadius: '48px',
              padding: '60px',
              border: '1px solid rgba(255, 255, 255, 0.5)',
              alignItems: 'center',
              boxShadow: '0 20px 50px rgba(44, 26, 20, 0.05)',
            }}
          >
            {/* Left Side: Avatar */}
            <div style={{ display: 'flex', position: 'relative', marginRight: '60px' }}>
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={displayName}
                  style={{
                    width: '320px',
                    height: '320px',
                    borderRadius: '80px',
                    objectFit: 'cover',
                    border: '8px solid white',
                    boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
                  }}
                />
              ) : (
                <div
                  style={{
                    width: '320px',
                    height: '320px',
                    borderRadius: '80px',
                    backgroundColor: '#789A99',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '120px',
                    border: '8px solid white',
                    boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
                  }}
                >
                  {master.avatar_emoji || '✨'}
                </div>
              )}
              {rating && (
                <div
                  style={{
                    position: 'absolute',
                    bottom: '-20px',
                    right: '-20px',
                    backgroundColor: '#2C1A14',
                    color: 'white',
                    padding: '12px 24px',
                    borderRadius: '24px',
                    fontSize: '32px',
                    fontWeight: 800,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    boxShadow: '0 8px 20px rgba(0,0,0,0.2)',
                  }}
                >
                  {rating} <span style={{ opacity: 0.6, fontSize: '24px', marginLeft: '4px' }}>{reviews}</span>
                </div>
              )}
            </div>

            {/* Right Side: Info */}
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
              <div style={{ fontSize: '24px', fontWeight: 700, color: '#789A99', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '4px' }}>
                Bookit Pro
              </div>
              
              <h1 style={{ fontSize: displayName.length > 20 ? '56px' : '72px', fontWeight: 900, margin: '0 0 20px 0', lineHeight: 1.1, color: '#2C1A14' }}>
                {displayName}
              </h1>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginBottom: '32px' }}>
                {specialties.map((tag) => (
                  <div
                    key={tag}
                    style={{
                      backgroundColor: 'rgba(120, 154, 153, 0.1)',
                      color: '#789A99',
                      padding: '10px 20px',
                      borderRadius: '16px',
                      fontSize: '24px',
                      fontWeight: 700,
                      border: '1px solid rgba(120, 154, 153, 0.2)',
                    }}
                  >
                    {tag}
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', marginTop: 'auto' }}>
                <div style={{ fontSize: '32px', fontWeight: 600, color: '#6B5750', display: 'flex', alignItems: 'center' }}>
                   bookit.app/{slug}
                </div>
              </div>
            </div>
          </div>
        </div>
      ),
      {
        ...size,
      }
    );
  } catch (err: any) {
    console.error('OG Image Error:', err);
    return new ImageResponse(
      (
        <div style={{ background: '#FFE8DC', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40, color: '#2C1A14' }}>
          Error: {err.message}
        </div>
      ),
      { ...size }
    );
  }
}
