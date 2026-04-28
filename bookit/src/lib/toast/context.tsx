'use client';

import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, CheckCircle2, AlertCircle, Info, AlertTriangle } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
  action?: { label: string; onClick: () => void };
  createdAt: number;
}

interface ToastContextValue {
  showToast: (options: Omit<Toast, 'id' | 'createdAt'>) => void;
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

function getRelativeTime(timestamp: number) {
  const now = Date.now();
  const diffInSeconds = Math.floor((now - timestamp) / 1000);
  
  if (diffInSeconds < 60) return 'Зараз';
  
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes} хв. тому`;
  
  const date = new Date(timestamp);
  return date.toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' });
}

function ToastItem({ 
  toast, 
  onDismiss, 
  index, 
  isExpanded, 
  onExpand 
}: { 
  toast: Toast; 
  onDismiss: (id: string) => void; 
  index: number;
  isExpanded: boolean;
  onExpand: () => void;
}) {
  const c = COLORS[toast.type];
  const [timeLabel, setTimeLabel] = useState(() => getRelativeTime(toast.createdAt));

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLabel(getRelativeTime(toast.createdAt));
    }, 30000); // Оновлюємо кожні 30 секунд
    return () => clearInterval(interval);
  }, [toast.createdAt]);

  // В iOS стилі: якщо не розгорнуто — вони стосом з невеликим зміщенням.
  // Якщо розгорнуто — вони йдуть списком вгору.
  const yOffset = isExpanded ? index * 80 : index * 10;
  const opacity = isExpanded ? 1 : 1 - index * 0.2;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 30 }}
      animate={{ 
        opacity, 
        x: 0, 
        y: -yOffset,
        zIndex: 100 - index,
        filter: isExpanded ? 'blur(0px)' : `blur(${index * 1.5}px)`
      }}
      exit={{ opacity: 0, x: 50 }}
      transition={{ type: 'spring', stiffness: 350, damping: 30 }}
      onClick={(e) => {
        if (!isExpanded) {
          e.stopPropagation();
          onExpand();
        }
      }}
      className={`absolute bottom-0 right-0 w-full max-w-[340px] overflow-hidden rounded-[28px] border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.15)] ${!isExpanded && index > 0 ? 'cursor-pointer' : ''}`}
      style={{
        background: `rgba(255, 255, 255, 0.18)`,
        backdropFilter: 'blur(40px) saturate(170%)',
        WebkitBackdropFilter: 'blur(40px) saturate(170%)',
      }}
    >
      <div className="flex items-start gap-3.5 px-6 py-5">
        <div className="flex-shrink-0 mt-0.5" style={{ color: c.icon }}>
          {ICONS[toast.type]}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[15px] font-bold text-[#2C1A14] leading-tight tracking-tight">{toast.title}</p>
            <span className="text-[10px] font-bold text-[#2C1A14]/40 uppercase tracking-widest">{timeLabel}</span>
          </div>
          {toast.message && (
            <p className="text-[13px] text-[#2C1A14]/80 mt-1.5 leading-snug font-medium line-clamp-3">{toast.message}</p>
          )}
          {toast.action && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toast.action?.onClick();
              }}
              className="mt-4 w-full py-3 px-3 rounded-2xl bg-white/30 border border-white/40 text-[12px] font-bold text-[#2C1A14] hover:bg-white/50 transition-all flex items-center justify-center"
            >
              {toast.action.label}
            </button>
          )}
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDismiss(toast.id);
          }}
          className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-black/5 text-[#2C1A14]/40 hover:bg-black/10 transition-colors"
        >
          <X size={15} />
        </button>
      </div>
    </motion.div>
  );
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);

  const showToast = useCallback((options: Omit<Toast, 'id' | 'createdAt'>) => {
    const id = crypto.randomUUID();
    const createdAt = Date.now();
    
    // PERSISTENT: тільки нові записи та відгуки (тип 'success')
    const isPersistent = options.type === 'success';
    const duration = isPersistent ? 0 : 5000;

    setToasts(prev => [{ ...options, id, createdAt }, ...prev].slice(0, 8));

    if (duration > 0) {
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, duration);
    }
  }, []);

  const dismiss = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  // Скидаємо розгортання, якщо тостів не залишилось
  useEffect(() => {
    if (toasts.length === 0) setIsExpanded(false);
  }, [toasts.length]);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div 
        className={`fixed bottom-8 right-6 z-[500] w-[calc(100vw-3rem)] max-w-[340px] pointer-events-none transition-all duration-500 ${isExpanded ? 'h-full' : 'h-[100px]'}`}
      >
        <AnimatePresence mode="popLayout">
          {toasts.map((t, index) => (
            <div key={t.id} className="pointer-events-auto absolute bottom-0 right-0 w-full">
              <ToastItem 
                toast={t} 
                onDismiss={dismiss} 
                index={index} 
                isExpanded={isExpanded}
                onExpand={() => setIsExpanded(true)}
              />
            </div>
          ))}
        </AnimatePresence>

        {isExpanded && (
          <button 
            onClick={() => setIsExpanded(false)}
            className="pointer-events-auto absolute -bottom-4 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full bg-black/10 backdrop-blur-md text-[10px] font-bold text-black/40 uppercase tracking-tighter"
          >
            Згорнути
          </button>
        )}
      </div>
    </ToastContext.Provider>
  );
}
