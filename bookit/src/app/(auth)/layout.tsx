import Link from 'next/link';
import { Quote } from 'lucide-react';
import { AuthScrollMain } from './_components/AuthScrollMain';
import { AuthViewportShell } from './_components/AuthViewportShell';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    // AuthViewportShell: position:fixed + visualViewport height (iOS keyboard fix)
    <AuthViewportShell>

      {/* ── Left brand panel (lg+) ─────────────────────────────────────────── */}
      <aside
        className="hidden lg:flex flex-col justify-between w-[45%] relative overflow-hidden p-10 xl:p-14"
        style={{ background: 'var(--accent)' }}
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
              Розклад, клієнти й дохід. В одному місці.
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
          background: 'var(--background)',
          backgroundImage: [
            'radial-gradient(ellipse 90% 55% at 50% -10%, rgba(99,102,241,0.18) 0%, transparent 65%)',
            'radial-gradient(ellipse 55% 45% at 88% 8%, rgba(139,92,246,0.11) 0%, transparent 55%)',
            'radial-gradient(ellipse 45% 35% at 8% 92%, rgba(59,130,246,0.09) 0%, transparent 50%)',
          ].join(', '),
        }}
      >
        {/* Mobile brand strip — dark editorial header (lg:hidden).
            При відкритій клавіатурі (.kb-open на shell) стає вищою — бренд завжди добре видно. */}
        <div
          className="relative overflow-hidden px-5 pt-6 pb-5 lg:hidden transition-[padding] duration-300 ease-out [.kb-open_&]:pt-10 [.kb-open_&]:pb-8"
          style={{ background: 'var(--accent)' }}
        >
          <div aria-hidden="true" style={{
            position: 'absolute', top: '-50%', right: '-10%',
            width: '60%', height: '250%',
            background: 'radial-gradient(ellipse, rgba(99,102,241,0.35) 0%, transparent 70%)',
            filter: 'blur(30px)',
          }} />
          <Link
            href="/"
            className="relative heading-serif text-[1.35rem] block"
            style={{ color: '#FFFFFF' }}
          >
            Bookit<span style={{ color: '#6366F1' }}>.</span>
          </Link>
          <p
            className="relative text-[10.5px] uppercase tracking-[0.18em] mt-1.5"
            style={{ color: 'rgba(255,255,255,0.38)' }}
          >
            Для тих, хто перетворив красу на роботу
          </p>
        </div>

        <AuthScrollMain>
          {children}
        </AuthScrollMain>
      </div>

    </AuthViewportShell>
  );
}
