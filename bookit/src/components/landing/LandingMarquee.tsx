'use client';

const ITEMS = [
  'Один лінк ↗ безліч записів',
  '★',
  '24/7 онлайн',
  '★',
  'Smart Slots закривають вікна автоматично',
  '★',
  'Telegram · Push · SMS',
  '★',
  '+32% до доходу в середньому',
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
        borderTop: '1px solid var(--l-border)',
        borderBottom: '1px solid var(--l-border)',
        padding: '20px 0',
        overflow: 'hidden',
        background: 'var(--l-bg)',
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
              fontSize: item === '★' ? '0.55rem' : '0.74rem',
              fontWeight: item === '★' ? 400 : 600,
              letterSpacing: item === '★' ? 0 : '0.08em',
              textTransform: item === '★' ? 'none' : 'uppercase',
              color: item === '★' ? 'var(--l-border-2)' : 'var(--l-muted)',
            }}
          >
            {item}
          </span>
        ))}
      </div>
    </section>
  );
}
