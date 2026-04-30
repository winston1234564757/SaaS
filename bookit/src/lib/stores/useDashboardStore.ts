import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type WidgetId = 'schedule' | 'revenue' | 'activity' | 'marketing' | 'loyalty' | 'stats' | 'reviews';

export type DashboardLayout = 'operational' | 'business' | 'balanced';

interface DashboardState {
  layout: DashboardLayout;
  activeWidgets: WidgetId[];
  isCustomizing: boolean;
  
  // Actions
  setLayout: (layout: DashboardLayout) => void;
  toggleWidget: (id: WidgetId) => void;
  setCustomizing: (val: boolean) => void;
  resetLayout: () => void;
}

const DEFAULT_WIDGETS: Record<DashboardLayout, WidgetId[]> = {
  operational: ['schedule', 'activity', 'marketing'],
  business: ['revenue', 'stats', 'loyalty'],
  balanced: ['schedule', 'revenue', 'activity', 'marketing'],
};

export const useDashboardStore = create<DashboardState>()(
  persist(
    (set) => ({
      layout: 'balanced',
      activeWidgets: DEFAULT_WIDGETS.balanced,
      isCustomizing: false,

      setLayout: (layout) => set({ 
        layout, 
        activeWidgets: DEFAULT_WIDGETS[layout] 
      }),

      toggleWidget: (id) => set((state) => ({
        activeWidgets: state.activeWidgets.includes(id)
          ? state.activeWidgets.filter((w) => w !== id)
          : [...state.activeWidgets, id],
      })),

      setCustomizing: (isCustomizing) => set({ isCustomizing }),

      resetLayout: () => set((state) => ({
        activeWidgets: DEFAULT_WIDGETS[state.layout]
      })),
    }),
    {
      name: 'bookit-dashboard-layout',
    }
  )
);
