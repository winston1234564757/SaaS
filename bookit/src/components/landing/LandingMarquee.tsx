'use client';

const ITEMS = [
  'Один лінк ↗ безліч записів',
  '★',
  '24/7 онлайн',
  '★',
  'Smart Slots — вільний час не пропадає',
  '★',
  'Telegram · Push · SMS',
  '★',
  'до 27% більше доходу',
  '★',
  '0 порожніх вікон тижнями',
  '★',
];

const doubled = [...ITEMS, ...ITEMS];

export function LandingMarquee() {
  return (
    <section
      aria-hidden="true"
      style={{
        borderTop: '1px solid var(--l-border-on-dark)',
        borderBottom: '1px solid var(--l-border-on-dark)',
        padding: '20px 0',
        overflow: 'hidden',
        background: 'var(--l-accent)',
      }}
    >
      <div
        style={{
          maskImage: 'linear-gradient(to right, transparent, black 8%, black 92%, transparent)',
          WebkitMaskImage: 'linear-gradient(to right, transparent, black 8%, black 92%, transparent)',
          overflow: 'hidden',
        }}
      >
        <div className="lm-track">
          {doubled.map((item, i) => (
            <span
              key={i}
              style={{
                display: 'inline-block',
                flexShrink: 0,
                whiteSpace: 'nowrap',
                padding: item === '★' ? '0 28px' : '0',
                fontSize: item === '★' ? '0.55rem' : '0.875rem',
                fontWeight: item === '★' ? 400 : 600,
                letterSpacing: item === '★' ? 0 : '0.10em',
                textTransform: item === '★' ? 'none' : 'uppercase',
                color: item === '★' ? 'rgba(248,250,252,0.20)' : 'rgba(248,250,252,0.60)',
              }}
            >
              {item}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
