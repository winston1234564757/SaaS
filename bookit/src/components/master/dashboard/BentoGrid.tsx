'use client';

import { useState } from 'react';
import { useDashboardStore, WidgetId } from '@/lib/stores/useDashboardStore';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils/cn';
import { X, GripVertical, Settings2, Plus } from 'lucide-react';

import { ScheduleWidget } from './widgets/ScheduleWidget';
import { RevenueWidget } from './widgets/RevenueWidget';
import { ActivityWidget } from './widgets/ActivityWidget';
import { MarketingWidget } from './widgets/MarketingWidget';

// Temporary Mock Widgets (will be replaced by real ones)
const WIDGET_COMPONENTS: Record<WidgetId, React.FC> = {
  schedule: ScheduleWidget,
  revenue: RevenueWidget,
  activity: ActivityWidget,
  marketing: MarketingWidget,
  loyalty: () => <div className="p-6 h-full">Лояльність</div>,
  stats: () => <div className="p-6 h-full">Статистика</div>,
  reviews: () => <div className="p-6 h-full">Відгуки</div>,
};

interface BentoWidgetProps {
  id: WidgetId;
  span?: string;
}

function BentoWidget({ id, span = "col-span-1 row-span-1" }: BentoWidgetProps) {
  const { isCustomizing, toggleWidget } = useDashboardStore();
  const Component = WIDGET_COMPONENTS[id];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      whileHover={!isCustomizing ? { 
        y: -4, 
        rotateX: 1, 
        rotateY: -1,
        transition: { duration: 0.2 } 
      } : {}}
      className={cn(
        "group relative bg-white/68 backdrop-blur-md border border-white/40 rounded-[32px] shadow-sm hover:shadow-xl transition-all overflow-hidden cursor-default",
        span,
        isCustomizing && "ring-2 ring-primary ring-offset-4 ring-offset-[#FFE8DC] cursor-grab active:cursor-grabbing"
      )}
      style={{ perspective: '1000px' }}
    >
      <Component />

      {/* Customization Overlay */}
      <AnimatePresence>
        {isCustomizing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-primary/5 backdrop-blur-[2px] flex items-center justify-center gap-2"
          >
            <button
              onClick={() => toggleWidget(id)}
              className="w-10 h-10 rounded-full bg-destructive text-white flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
            >
              <X size={20} />
            </button>
            <div className="w-10 h-10 rounded-full bg-white text-primary flex items-center justify-center shadow-lg cursor-grab active:cursor-grabbing">
              <GripVertical size={20} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

import { WidgetLibraryModal } from './WidgetLibraryModal';

export function BentoGrid() {
  const { activeWidgets, isCustomizing, setCustomizing, layout, setLayout } = useDashboardStore();
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);

  // Widget sizing logic
  const getWidgetSpan = (id: WidgetId) => {
    if (id === 'schedule') return 'md:col-span-2 md:row-span-2';
    if (id === 'revenue') return 'md:col-span-2 md:row-span-1';
    return 'md:col-span-1 md:row-span-1';
  };

  return (
    <div className="space-y-8">
      {/* ... header code ... */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="heading-serif text-3xl text-foreground">Ваш Дашборд</h2>
          <p className="text-sm text-muted-foreground mt-1">Керуйте своїм бізнесом в один клік</p>
        </div>
        
        <div className="flex items-center gap-3">
          <select 
            value={layout} 
            onChange={(e) => setLayout(e.target.value as any)}
            className="bg-white/40 border border-white/60 rounded-2xl px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="balanced">Збалансований</option>
            <option value="operational">Операційний</option>
            <option value="business">Бізнес-фокус</option>
          </select>

          <button
            onClick={() => setCustomizing(!isCustomizing)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-2xl text-sm font-semibold transition-all",
              isCustomizing 
                ? "bg-primary text-white shadow-lg" 
                : "bg-white/40 text-primary border border-white/60 hover:bg-white/80"
            )}
          >
            {isCustomizing ? (
              <><Settings2 size={16} /> Готово</>
            ) : (
              <><Settings2 size={16} /> Налаштувати</>
            )}
          </button>
        </div>
      </div>

      {/* The Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 auto-rows-[200px]">
        <AnimatePresence mode="popLayout">
          {activeWidgets.map((id) => (
            <BentoWidget key={id} id={id} span={getWidgetSpan(id)} />
          ))}

          {/* Add Widget Button (only in customizing mode) */}
          {isCustomizing && (
            <motion.button
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              onClick={() => setIsLibraryOpen(true)}
              className="md:col-span-1 md:row-span-1 rounded-[32px] border-4 border-dashed border-primary/20 hover:border-primary/40 hover:bg-primary/5 transition-all flex flex-col items-center justify-center gap-2 text-primary/40 hover:text-primary"
            >
              <Plus size={32} />
              <span className="text-xs font-bold uppercase tracking-wider">Додати блок</span>
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      <WidgetLibraryModal 
        isOpen={isLibraryOpen} 
        onClose={() => setIsLibraryOpen(false)} 
      />
    </div>
  );
}
