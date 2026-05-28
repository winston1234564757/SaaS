import Link from 'next/link';
import { Quote } from 'lucide-react';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-[100dvh] flex">

      {/* ── Left brand panel (lg+) ─────────────────────────────────────────── */}
      <aside
        className="hidden lg:flex flex-col justify-between w-[45%] relative overflow-hidden p-10 xl:p-14"
        style={{ background: '#0F172A' }}
      >
        {/* Aurora blobs */}
        <div aria-hidden="true" className="absolute inset-0 pointer-events-none">
          <div style={{
            position: 'absolute', top: '-20%', left: '-15%',
            width: '75%', height: '70%',
            background: 'radial-gradient(ellipse, rgba(99,102,241,0.30) 0%, transparent 70%)',
            filter: 'blur(60px)',
          }} />
          <div style={{
            position: 'absolute', bottom: '-10%', right: '-15%',
            width: '65%', height: '65%',
            background: 'radial-gradient(ellipse, rgba(139,92,246,0.22) 0%, transparent 70%)',
            filter: 'blur(50px)',
          }} />
          <div style={{
            position: 'absolute', top: '35%', right: '5%',
            width: '45%', height: '40%',
            background: 'radial-gradient(ellipse, rgba(59,130,246,0.12) 0%, transparent 70%)',
            filter: 'blur(40px)',
          }} />
        </div>

        {/* Logo */}
        <Link
          href="/"
          className="relative z-10 heading-serif text-2xl"
          style={{ color: '#FFFFFF' }}
        >
          Bookit<span style={{ color: '#6366F1' }}>.</span>
        </Link>

        {/* Editorial block */}
        <div className="relative z-10 space-y-10">
          <div>
            <p
              className="text-[11px] uppercase tracking-[0.2em] font-medium mb-5"
              style={{ color: 'rgba(255,255,255,0.32)' }}
            >
              Для майстрів краси
            </p>
            <h2
              className="heading-serif text-[2.2rem] xl:text-[2.6rem] leading-[1.12] mb-5"
              style={{ color: '#FFFFFF' }}
            >
              Для тих, хто перетворив<br />красу на роботу
            </h2>
            <p
              className="text-base leading-relaxed max-w-[32ch]"
              style={{ color: 'rgba(255,255,255,0.45)' }}
            >
              Розклад, клієнти й дохід — в одному місці.
            </p>
          </div>

          {/* Testimonial */}
          <div style={{
            background: 'rgba(255,255,255,0.055)',
            border: '1px solid rgba(255,255,255,0.10)',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.07)',
            borderRadius: '18px',
            padding: '24px',
          }}>
            <Quote
              size={18}
              strokeWidth={1.5}
              style={{ color: '#6366F1', marginBottom: '14px' }}
            />
            <p
              className="text-sm leading-relaxed mb-5"
              style={{ color: 'rgba(255,255,255,0.62)' }}
            >
              Записи пішли вже на другий день. Тепер не уявляю, як взагалі без цього працювала.
            </p>
            <div className="flex items-center gap-3">
              <div
                aria-hidden="true"
                style={{
                  width: '36px', height: '36px', borderRadius: '50%',
                  background: 'linear-gradient(135deg, rgba(99,102,241,0.55) 0%, rgba(139,92,246,0.48) 100%)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '13px', fontWeight: 600, color: '#FFFFFF', flexShrink: 0,
                }}
              >
                А
              </div>
              <div>
                <p className="text-xs font-medium" style={{ color: 'rgba(255,255,255,0.78)' }}>
                  Аліна К.
                </p>
                <p className="text-xs" style={{ color: 'rgba(255,255,255,0.36)' }}>
                  Нігтьовий майстер — Харків
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="relative z-10 text-xs" style={{ color: 'rgba(255,255,255,0.16)' }}>
          © 2025 Bookit
        </p>
      </aside>

      {/* ── Right form panel ───────────────────────────────────────────────── */}
      <div
        className="flex-1 relative flex flex-col"
        style={{
          background: '#EFF2FF',
          backgroundImage: [
            'radial-gradient(ellipse 90% 55% at 50% -10%, rgba(99,102,241,0.18) 0%, transparent 65%)',
            'radial-gradient(ellipse 55% 45% at 88% 8%, rgba(139,92,246,0.11) 0%, transparent 55%)',
            'radial-gradient(ellipse 45% 35% at 8% 92%, rgba(59,130,246,0.09) 0%, transparent 50%)',
          ].join(', '),
        }}
      >
        {/* Mobile nav */}
        <header className="relative z-10 p-5 lg:hidden">
          <Link href="/" className="heading-serif text-xl text-foreground">
            Bookit<span className="text-primary">.</span>
          </Link>
        </header>

        <main className="relative z-10 flex-1 flex items-center justify-center px-5 py-10">
          <div className="w-full max-w-sm">
            {children}
          </div>
        </main>
      </div>

    </div>
  );
}
