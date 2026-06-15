'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowUpRight } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

const NAV_LINKS = [
  { label: 'Майстрам', href: '/explore' },
  { label: 'Ціни', href: '#pricing' },
  { label: 'Питання', href: '#faq' },
];

const spring = { type: 'spring', stiffness: 280, damping: 26 } as const;
const focusRing = 'focus-visible:ring-2 focus-visible:ring-[var(--l-indigo)] focus-visible:ring-offset-2 focus-visible:rounded-sm focus-visible:outline-none';

export function LandingNav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 24);
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, []);

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 flex justify-center px-4 pt-5">
        <motion.nav
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...spring, delay: 0.1 }}
          className={cn(
            'grid items-center px-5 py-3 rounded-full transition-all duration-500',
            scrolled ? 'shadow-[0_8px_32px_rgba(15,23,42,0.10)]' : ''
          )}
          style={{
            gridTemplateColumns: '1fr auto 1fr',
            width: 'min(720px, calc(100vw - 32px))',
            background: scrolled ? 'rgba(239,242,255,0.96)' : 'rgba(239,242,255,0.82)',
            backdropFilter: 'blur(20px)',
            border: '1px solid var(--l-border)',
          }}
        >
          {/* Left: logo */}
          <Link
            href="/"
            className={cn(
              'font-[family-name:var(--font-cormorant)] font-bold flex-shrink-0 tracking-tight',
              focusRing
            )}
            style={{ fontSize: 'clamp(1.4rem, 3vw, 1.75rem)', color: 'var(--l-ink)' }}
          >
            bookit<span style={{ color: 'var(--l-indigo)' }}>.</span>
          </Link>

          {/* Center: primary CTA */}
          <Link
            href="/register"
            className={cn(
              'group flex items-center gap-2 text-sm font-semibold pl-5 pr-2.5 py-2 rounded-full transition-all active:scale-[0.97] mx-auto',
              focusRing
            )}
            style={{
              background: 'var(--l-accent)',
              color: 'var(--l-accent-on)',
              boxShadow: '0 2px 16px rgba(15,23,42,0.22)',
              whiteSpace: 'nowrap',
            }}
          >
            Спробувати безкоштовно
            <span
              className="size-6 rounded-full flex items-center justify-center group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform"
              style={{ background: 'rgba(248,250,252,0.18)' }}
              aria-hidden="true"
            >
              <ArrowUpRight size={12} aria-hidden="true" />
            </span>
          </Link>

          {/* Right: login + mobile hamburger */}
          <div className="flex items-center justify-end gap-2">
            <Link
              href="/login"
              className={cn(
                'hidden sm:block text-sm font-medium px-3 py-1.5 transition-opacity hover:opacity-60',
                focusRing
              )}
              style={{ color: 'var(--l-muted)' }}
            >
              Увійти
            </Link>
            <button
              type="button"
              onClick={() => setOpen(true)}
              className={cn(
                'sm:hidden size-9 flex flex-col items-center justify-center gap-[5px] rounded-full transition-colors hover:bg-black/5',
                focusRing
              )}
              aria-label="Відкрити навігацію"
              aria-expanded={open}
            >
              <span className="w-4 h-[1.5px] block" style={{ background: 'var(--l-ink)' }} />
              <span className="w-4 h-[1.5px] block" style={{ background: 'var(--l-ink)' }} />
            </button>
          </div>
        </motion.nav>
      </header>

      <AnimatePresence mode="popLayout">
        {open && (
          <motion.div
            key="mobile-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-0 z-50 flex flex-col"
            style={{ background: 'rgba(239,242,255,0.97)', backdropFilter: 'blur(24px)' }}
          >
            <div className="flex items-center justify-between px-6 pt-6 pb-8">
              <span
                className="font-[family-name:var(--font-cormorant)] text-2xl font-semibold"
                style={{ color: 'var(--l-ink)' }}
              >
                bookit<span style={{ color: 'var(--l-indigo)' }}>.</span>
              </span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className={cn(
                  'size-11 flex items-center justify-center rounded-full transition-colors hover:bg-black/5',
                  focusRing
                )}
                style={{ background: 'var(--l-surface-2)', border: '1px solid var(--l-border)' }}
                aria-label="Закрити навігацію"
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                  <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" style={{ color: 'var(--l-ink)' }} />
                </svg>
              </button>
            </div>

            <nav className="flex flex-col px-6 flex-1">
              {[...NAV_LINKS, { label: 'Увійти', href: '/login' }].map((l, i) => (
                <motion.div
                  key={l.href}
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ ...spring, delay: i * 0.07 + 0.05 }}
                >
                  <Link
                    href={l.href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      'block text-[2.5rem] font-[family-name:var(--font-cormorant)] font-semibold py-5 leading-none transition-opacity hover:opacity-70',
                      focusRing
                    )}
                    style={{
                      color: 'var(--l-ink)',
                      borderBottom: '1px solid var(--l-border)',
                    }}
                  >
                    {l.label}
                  </Link>
                </motion.div>
              ))}
            </nav>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...spring, delay: 0.32 }}
              className="px-6 pb-10"
            >
              <Link
                href="/register"
                onClick={() => setOpen(false)}
                className={cn(
                  'flex items-center justify-center h-14 rounded-2xl font-semibold text-base active:scale-[0.97] transition-all',
                  focusRing
                )}
                style={{
                  background: 'var(--l-accent)',
                  color: 'var(--l-accent-on)',
                  boxShadow: '0 4px 20px rgba(15,23,42,0.22)',
                }}
              >
                Починати безкоштовно
              </Link>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
