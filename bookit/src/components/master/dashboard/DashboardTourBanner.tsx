'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronRight, GraduationCap } from 'lucide-react';
import Link from 'next/link';
import { useTourStep } from './DashboardTourContext';

export function DashboardTourBanner() {
  const { tourStep, totalSteps, currentStepData, handleNextStep, closeTour } = useTourStep();

  const isVisible = tourStep >= 0 && !!currentStepData;
  const isLast = tourStep === totalSteps - 1;

  return (
    <AnimatePresence mode="popLayout">
      {isVisible && currentStepData && (
        <motion.div
          key={tourStep}
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 24 }}
          transition={{ type: 'spring' as const, stiffness: 340, damping: 28 }}
          className="fixed bottom-[calc(var(--bottom-nav-height,76px)+12px)] left-4 right-4 z-50 lg:left-auto lg:right-6 lg:w-80"
        >
          <div
            className="rounded-2xl p-4 shadow-xl"
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border-strong)',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
            }}
          >
            {/* Progress dots */}
            <div className="flex items-center gap-1.5 mb-3">
              {Array.from({ length: totalSteps }).map((_, i) => (
                <div
                  key={i}
                  className="rounded-full transition-all duration-300"
                  style={{
                    width: i === tourStep ? '16px' : '6px',
                    height: '6px',
                    background: i <= tourStep
                      ? 'var(--accent)'
                      : 'color-mix(in srgb, var(--accent) 20%, transparent)',
                  }}
                />
              ))}
              <span
                className="ml-auto text-[10px] font-semibold"
                style={{ color: 'var(--text-tertiary)' }}
              >
                {tourStep + 1} / {totalSteps}
              </span>
            </div>

            {/* Content */}
            <p className="text-[14px] font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
              {currentStepData.title}
            </p>
            <p className="text-[12px] leading-relaxed mb-4" style={{ color: 'var(--text-secondary)' }}>
              {currentStepData.text}
            </p>

            {/* Actions */}
            <div className="flex items-center gap-2">
              {isLast ? (
                <Link
                  href="/dashboard/academy"
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[12px] font-semibold transition-all active:scale-[0.95] cursor-pointer"
                  style={{ background: 'var(--accent)', color: 'var(--accent-on)' }}
                  onClick={closeTour}
                >
                  <GraduationCap size={14} />
                  Відкрити Академію
                </Link>
              ) : (
                <button
                  onClick={handleNextStep}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-[12px] font-semibold transition-all active:scale-[0.95] cursor-pointer"
                  style={{ background: 'var(--accent)', color: 'var(--accent-on)' }}
                >
                  Далі
                  <ChevronRight size={14} />
                </button>
              )}

              <button
                onClick={closeTour}
                className="flex items-center justify-center w-10 h-10 rounded-xl transition-all active:scale-[0.95] cursor-pointer"
                style={{
                  background: 'color-mix(in srgb, var(--accent) 10%, transparent)',
                  color: 'var(--text-secondary)',
                }}
                aria-label="Закрити тур"
              >
                <X size={15} />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
