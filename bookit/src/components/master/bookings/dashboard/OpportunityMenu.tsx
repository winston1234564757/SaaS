'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Zap, Image as ImageIcon, X } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  time: string;
  onAction: (action: 'booking' | 'flash' | 'story') => void;
}

export function OpportunityMenu({ isOpen, onClose, time, onAction }: Props) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100]"
          />

          {/* Menu */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed inset-x-0 bottom-1/4 mx-auto w-[85%] max-w-sm z-[101] bg-white/90 backdrop-blur-2xl rounded-[32px] p-6 shadow-2xl border border-white/40"
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-black text-foreground">Вільне вікно</h3>
                <p className="text-xs text-muted-foreground/60">Оберіть дію на {time}</p>
              </div>
              <button 
                onClick={onClose}
                className="w-10 h-10 rounded-full bg-muted/10 flex items-center justify-center text-muted-foreground hover:bg-muted/20 transition-all"
              >
                <X size={20} />
              </button>
            </div>

            <div className="grid grid-cols-1 gap-3">
              <button
                onClick={() => onAction('booking')}
                className="group flex items-center gap-4 p-4 rounded-2xl bg-white border border-white shadow-sm hover:border-primary/20 hover:bg-primary/5 transition-all active:scale-95"
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                  <Plus size={24} />
                </div>
                <div className="text-left">
                  <p className="text-sm font-bold text-foreground">Записати вручну</p>
                  <p className="text-[10px] text-muted-foreground">Додати клієнта в розклад</p>
                </div>
              </button>

              <button
                onClick={() => onAction('flash')}
                className="group flex items-center gap-4 p-4 rounded-2xl bg-white border border-white shadow-sm hover:border-warning/20 hover:bg-warning/5 transition-all active:scale-95"
              >
                <div className="w-12 h-12 rounded-xl bg-warning/10 flex items-center justify-center text-warning group-hover:scale-110 transition-transform">
                  <Zap size={24} />
                </div>
                <div className="text-left">
                  <p className="text-sm font-bold text-foreground">Flash Deal</p>
                  <p className="text-[10px] text-muted-foreground">Заповнити гаряче вікно знижкою</p>
                </div>
              </button>

              <button
                onClick={() => onAction('story')}
                className="group flex items-center gap-4 p-4 rounded-2xl bg-white border border-white shadow-sm hover:border-sage/20 hover:bg-sage/5 transition-all active:scale-95"
              >
                <div className="w-12 h-12 rounded-xl bg-sage/10 flex items-center justify-center text-sage group-hover:scale-110 transition-transform">
                  <ImageIcon size={24} />
                </div>
                <div className="text-left">
                  <p className="text-sm font-bold text-foreground">Створити Story</p>
                  <p className="text-[10px] text-muted-foreground">Генерація картки для Instagram</p>
                </div>
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
