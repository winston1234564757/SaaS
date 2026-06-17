'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronRight } from 'lucide-react';

export interface TourNavLink {
  icon: React.ComponentType<{ size?: number }>;
  label: string;
  href: string;
}

export interface TourStep {
  title: string;
  text: string;
  /** Matches [data-tour-key="tourKey"] in DOM for spotlight */
  tourKey?: string;
  cta?: string;
  isNavigator?: boolean;
  links?: TourNavLink[];
}

interface TourBannerProps {
  steps: TourStep[];
  currentStep: number; // -1 = hidden
  onNext: () => void;
  onClose: () => void;
}

const SPRING = { type: 'spring' as const, stiffness: 340, damping: 28 };

export function TourBanner({ steps, currentStep, onNext, onClose }: TourBannerProps) {
  const overlayRef = useRef<HTMLDivElement | null>(null);

  const stepData    = steps[currentStep];
  const isVisible   = currentStep >= 0 && !!stepData;
  const isLast      = currentStep === steps.length - 1;
  const total       = steps.length;
  const progressPct = total > 1 ? ((currentStep + 1) / total) * 100 : 100;
  const tourKey     = stepData?.tourKey;
  const isNavigator = stepData?.isNavigator;

  // Spotlight with ResizeObserver + scroll/resize for continuous accurate tracking
  useEffect(() => {
    if (currentStep < 0) {
      const ov = overlayRef.current;
      if (ov) {
        ov.style.opacity = '0';
        const t = setTimeout(() => { ov.remove(); overlayRef.current = null; }, 250);
        return () => clearTimeout(t);
      }
      return;
    }

    // Navigator or keyless step — fade out spotlight
    if (isNavigator || !tourKey) {
      if (overlayRef.current) overlayRef.current.style.opacity = '0';
      return;
    }

    if (!overlayRef.current) {
      const overlay = document.createElement('div');
      overlay.setAttribute('data-tour-overlay', 'true');
      overlay.style.cssText = [
        'position:fixed',
        'top:0', 'left:0', 'width:0', 'height:0',
        'border-radius:var(--card-radius,20px)',
        'border:2px solid var(--accent)',
        'box-shadow:0 0 0 9999px rgba(0,0,0,0.55),0 0 0 5px color-mix(in srgb,var(--accent) 15%,transparent),0 0 32px color-mix(in srgb,var(--accent) 12%,transparent)',
        'pointer-events:none',
        'z-index:48',
        'opacity:0',
        'transition:top 320ms cubic-bezier(0.34,1.56,0.64,1),left 320ms cubic-bezier(0.34,1.56,0.64,1),width 280ms cubic-bezier(0.25,0.46,0.45,0.94),height 280ms cubic-bezier(0.25,0.46,0.45,0.94),opacity 220ms ease',
      ].join(';');
      document.body.appendChild(overlay);
      overlayRef.current = overlay;
    }

    const key = tourKey;

    const findVisible = (): HTMLElement | null =>
      (Array.from(document.querySelectorAll(`[data-tour-key="${key}"]`)).find(e => {
        const r = (e as HTMLElement).getBoundingClientRect();
        return r.width > 0 && r.height > 0;
      }) as HTMLElement | null) ?? null;

    const updatePos = () => {
      const ov = overlayRef.current;
      if (!ov) return;
      const el = findVisible();
      if (!el) { ov.style.opacity = '0'; return; }
      const rect = el.getBoundingClientRect();
      ov.style.top    = `${rect.top    - 8}px`;
      ov.style.left   = `${rect.left   - 8}px`;
      ov.style.width  = `${rect.width  + 16}px`;
      ov.style.height = `${rect.height + 16}px`;
      ov.style.opacity = '1';
    };

    // Scroll into view once on step change, then position
    const initTimer = setTimeout(() => {
      const el = findVisible();
      if (el) el.scrollIntoView({ behavior: 'instant', block: 'center' });
      updatePos();
    }, 80);

    const ro = new ResizeObserver(updatePos);
    document.querySelectorAll(`[data-tour-key="${key}"]`).forEach(el => ro.observe(el));
    ro.observe(document.body);

    window.addEventListener('scroll', updatePos, { passive: true });
    window.addEventListener('resize', updatePos);

    return () => {
      clearTimeout(initTimer);
      ro.disconnect();
      window.removeEventListener('scroll', updatePos);
      window.removeEventListener('resize', updatePos);
    };
  }, [currentStep, tourKey, isNavigator]);

  useEffect(() => () => {
    overlayRef.current?.remove();
    overlayRef.current = null;
  }, []);

  return (
    <AnimatePresence mode="popLayout">
      {isVisible && stepData && (
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, y: 28, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.97 }}
          transition={SPRING}
          className="fixed bottom-[calc(var(--bottom-nav-height,76px)+12px)] left-4 right-4 z-50 lg:left-auto lg:right-6 lg:w-[320px]"
        >
          <div
            className="rounded-2xl overflow-hidden shadow-2xl"
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border-strong)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              boxShadow: '0 20px 60px rgba(0,0,0,0.18), 0 0 0 1px var(--border-strong)',
            }}
          >
            {/* Accent top strip */}
            <div
              className="h-[3px] w-full"
              style={{ background: 'linear-gradient(90deg, var(--accent), color-mix(in srgb, var(--accent) 50%, transparent))' }}
            />

            <div className="p-4">
              {/* Progress */}
              <div className="flex items-center gap-2.5 mb-3.5">
                <div className="flex gap-1 flex-1">
                  {steps.map((_, i) => (
                    <div
                      key={i}
                      className="flex-1 h-[3px] rounded-full transition-all duration-500"
                      style={{
                        background: i <= currentStep
                          ? 'var(--accent)'
                          : 'color-mix(in srgb, var(--accent) 18%, transparent)',
                      }}
                    />
                  ))}
                </div>
                <span className="text-[10px] font-bold tabular-nums shrink-0" style={{ color: 'var(--text-tertiary)' }}>
                  {currentStep + 1}/{total}
                </span>
              </div>

              {/* Content */}
              <p className="text-[14px] font-bold leading-snug mb-1.5" style={{ color: 'var(--text-primary)' }}>
                {stepData.title}
              </p>
              <p className="text-[12px] leading-relaxed mb-3.5" style={{ color: 'var(--text-secondary)' }}
              >
                {stepData.text}
              </p>

              {/* Navigator: 3 destination cards */}
              {stepData.isNavigator && stepData.links && (
                <div className="grid grid-cols-3 gap-2 mt-3.5">
                  {stepData.links.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={onClose}
                      className="flex flex-col items-center gap-2 py-3.5 px-1 rounded-2xl text-center transition-all duration-150 active:scale-[0.93]"
                      style={{
                        background: 'color-mix(in srgb, var(--accent) 7%, transparent)',
                        border: '1px solid color-mix(in srgb, var(--accent) 14%, transparent)',
                      }}
                    >
                      <div
                        className="size-8 rounded-xl flex items-center justify-center"
                        style={{ background: 'color-mix(in srgb, var(--accent) 12%, transparent)' }}
                      >
                        <span style={{ color: 'var(--accent)', display: 'flex' }}>
                          <link.icon size={16} />
                        </span>
                      </div>
                      <span
                        className="text-[10px] font-semibold leading-tight"
                        style={{ color: 'var(--text-primary)' }}
                      >
                        {link.label}
                      </span>
                    </Link>
                  ))}
                </div>
              )}

              {/* CTA row */}
              {!stepData.isNavigator && (
                <div className="flex items-center gap-2 mt-3.5">
                  <button
                    type="button"
                    onClick={onNext}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-[13px] font-semibold transition-all active:scale-[0.95] cursor-pointer"
                    style={{
                      background: 'var(--accent)',
                      color: 'var(--accent-on)',
                      boxShadow: '0 4px 14px color-mix(in srgb, var(--accent) 35%, transparent)',
                    }}
                  >
                    {stepData.cta ?? (isLast ? 'Завершити' : 'Далі')}
                    {!isLast && !stepData.cta && <ChevronRight size={14} />}
                  </button>

                  <button
                    type="button"
                    onClick={onClose}
                    aria-label="Закрити тур"
                    className="size-10 flex items-center justify-center rounded-xl transition-all active:scale-[0.95] cursor-pointer shrink-0"
                    style={{
                      background: 'color-mix(in srgb, var(--accent) 8%, transparent)',
                      color: 'var(--text-tertiary)',
                      border: '1px solid var(--border)',
                    }}
                  >
                    <X size={14} />
                  </button>
                </div>
              )}

              {/* Navigator dismiss */}
              {stepData.isNavigator && (
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full text-center text-[11px] mt-3 py-1 cursor-pointer transition-opacity hover:opacity-60"
                  style={{ color: 'var(--text-tertiary)' }}
                >
                  Пропустити
                </button>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
