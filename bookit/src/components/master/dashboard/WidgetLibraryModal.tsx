'use client';

import { WidgetId, useDashboardStore } from '@/lib/stores/useDashboardStore';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, LayoutDashboard, Calendar, BarChart, Users, Star, MessageSquare, Zap } from 'lucide-react';

const WIDGET_INFO: Record<WidgetId, { label: string; desc: string; icon: any }> = {
  schedule: { label: 'Розклад', desc: 'Ваші записи на сьогодні', icon: Calendar },
  revenue: { label: 'Дохід', desc: 'Виручка та аналітика за день', icon: BarChart },
  activity: { label: 'Активність', desc: 'Стрічка останніх подій', icon: Zap },
  marketing: { label: 'Маркетинг', desc: 'Поради та Сторіс Генератор', icon: ImagePlayIcon }, // See below
  loyalty: { label: 'Лояльність', desc: 'Бонуси та знижки клієнтів', icon: Star },
  stats: { label: 'Статистика', desc: 'Детальні звіти за період', icon: LayoutDashboard },
  reviews: { label: 'Відгуки', desc: 'Останні оцінки від клієнтів', icon: MessageSquare },
};

import { ImagePlay as ImagePlayIcon } from 'lucide-react';

export function WidgetLibraryModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { activeWidgets, toggleWidget } = useDashboardStore();
  
  const available = (Object.keys(WIDGET_INFO) as WidgetId[]).filter(id => !activeWidgets.includes(id));

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60]"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-white/90 backdrop-blur-2xl rounded-[40px] shadow-2xl border border-white/50 p-8 z-[70]"
          >
            <div className="flex justify-between items-center mb-8">
              <div>
                <h3 className="heading-serif text-2xl text-foreground">Бібліотека віджетів</h3>
                <p className="text-sm text-muted-foreground">Оберіть блоки для свого ідеального дашборду</p>
              </div>
              <button onClick={onClose} className="w-10 h-10 rounded-full bg-secondary/60 flex items-center justify-center hover:bg-secondary transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="grid grid-cols-1 gap-3 max-h-[400px] overflow-y-auto pr-2 no-scrollbar">
              {available.length > 0 ? (
                available.map((id) => {
                  const info = WIDGET_INFO[id];
                  const Icon = info.icon;
                  return (
                    <button
                      key={id}
                      onClick={() => { toggleWidget(id); }}
                      className="group flex items-center gap-4 p-4 rounded-3xl bg-white/40 border border-white/60 hover:bg-white hover:border-primary/20 hover:shadow-md transition-all text-left"
                    >
                      <div className="w-12 h-12 rounded-2xl bg-peach/40 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Icon size={20} className="text-primary" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-bold text-foreground">{info.label}</p>
                        <p className="text-xs text-muted-foreground">{info.desc}</p>
                      </div>
                      <Plus size={20} className="text-primary/40 group-hover:text-primary transition-colors" />
                    </button>
                  );
                })
              ) : (
                <div className="py-12 text-center opacity-40">
                  <LayoutDashboard size={48} strokeWidth={1} className="mx-auto mb-3" />
                  <p className="text-sm font-medium">Всі доступні віджети вже на екрані!</p>
                </div>
              )}
            </div>

            <button
              onClick={onClose}
              className="w-full mt-8 py-4 bg-primary text-white rounded-2xl font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all"
            >
              Закрити
            </button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
