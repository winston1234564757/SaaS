'use client';

import { createContext, useContext, useState, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, CheckCircle2, AlertCircle, Info, AlertTriangle } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

interface ToastContextValue {
  showToast: (options: Omit<Toast, 'id'>) => void;
}

const ToastContext = createContext<ToastContextValue>({ showToast: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

const ICONS: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle2 size={17} />,
  error:   <AlertCircle size={17} />,
  warning: <AlertTriangle size={17} />,
  info:    <Info size={17} />,
};

const COLORS: Record<ToastType, { icon: string; bar: string; bg: string }> = {
  success: { icon: '#5C9E7A', bar: '#5C9E7A', bg: 'rgba(92,158,122,0.08)'  },
  error:   { icon: '#C05B5B', bar: '#C05B5B', bg: 'rgba(192,91,91,0.08)'   },
  warning: { icon: '#D4935A', bar: '#D4935A', bg: 'rgba(212,147,90,0.08)'  },
  info:    { icon: '#789A99', bar: '#789A99', bg: 'rgba(120,154,153,0.08)' },
};

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: (id: string) => void }) {
  const c = COLORS[toast.type];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -16, scale: 0.94 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -12, scale: 0.94 }}
      transition={{ type: 'spring', stiffness: 420, damping: 28 }}
      className="relative w-full max-w-sm overflow-hidden rounded-2xl border border-white/60 shadow-[0_8px_28px_rgba(44,26,20,0.13),inset_0_1px_0_rgba(255,255,255,0.9)]"
      style={{
        background: `linear-gradient(135deg, rgba(255,255,255,0.92) 0%, rgba(255,248,244,0.92) 100%)`,
        backdropFilter: 'blur(20px)',
      }}
    >
      {/* Кольорова полоска зліва */}
      <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl" style={{ background: c.bar }} />

      <div className="flex items-start gap-3 px-4 py-3.5 pl-5">
        <div className="flex-shrink-0 mt-0.5" style={{ color: c.icon }}>
          {ICONS[toast.type]}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-[#2C1A14] leading-snug">{toast.title}</p>
          {toast.message && (
            <p className="text-xs text-[#6B5750] mt-0.5 leading-relaxed">{toast.message}</p>
          )}
        </div>
        <button
          onClick={() => onDismiss(toast.id)}
          className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-lg text-[#A8928D] hover:bg-[#F5E8E3] transition-colors"
        >
          <X size={13} />
        </button>
      </div>

      {/* Прогрес-бар */}
      <motion.div
        className="absolute bottom-0 left-0 h-0.5 rounded-full"
        style={{ background: c.bar }}
        initial={{ width: '100%' }}
        animate={{ width: '0%' }}
        transition={{ duration: (toast.duration ?? 4000) / 1000, ease: 'linear' }}
      />
    </motion.div>
  );
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((options: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).slice(2);
    const duration = options.duration ?? 4000;
    setToasts(prev => [{ ...options, id, duration }, ...prev].slice(0, 5));
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), duration + 400);
  }, []);

  const dismiss = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[300] flex flex-col gap-2 w-[calc(100vw-2rem)] max-w-sm pointer-events-none">
        <AnimatePresence mode="sync">
          {toasts.map(t => (
            <div key={t.id} className="pointer-events-auto">
              <ToastItem toast={t} onDismiss={dismiss} />
            </div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}
