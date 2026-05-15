'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { AlertTriangle, Plus, Scissors, Loader2 } from 'lucide-react';
import { type Service } from './types';
import { ServiceCard } from './ServiceCard';
import { useServices } from '@/lib/supabase/hooks/useServices';
import { useMasterContext } from '@/lib/supabase/context';

export function ServicesPage() {
  const router = useRouter();
  const { masterProfile } = useMasterContext();
  const masterId = masterProfile?.id ?? '';

  const _s = useServices();
  const services: Service[] = _s.services;
  const { isLoading: sLoading, error: sError, addService, editService, deleteService, toggleService, reorderServices } = _s;

  function handleMoveService(index: number, direction: 'up' | 'down') {
    const next = [...services];
    const swap = direction === 'up' ? index - 1 : index + 1;
    [next[index], next[swap]] = [next[swap], next[index]];
    reorderServices(next);
  }

  function openEditService(s: Service) {
    router.push(`/dashboard/services/${s.id}`);
  }

  const activeServices = services.filter(s => s.active).length;

  return (
    <div className="flex flex-col gap-4 pb-24">
      {/* Command Bar (Desktop) & Header (Mobile) */}
      <div className="widget-card p-4 md:p-5 flex items-center justify-between z-40 sticky top-[72px] lg:top-4">
        <div>
          <h1 className="heading-serif text-xl text-foreground mb-0.5">Послуги</h1>
          <p className="text-sm text-muted-foreground/60">
            {activeServices > 0
              ? `${activeServices} активних послуг`
              : 'Додайте послуги для публічної сторінки'}
          </p>
        </div>
        <button
          onClick={() => router.push('/dashboard/services/new')}
          className="hidden md:flex items-center gap-2 px-5 h-11 rounded-2xl bg-primary text-white font-semibold hover:bg-[#6B8C8B] active:scale-95 transition-all shadow-sm"
        >
          <Plus size={18} strokeWidth={2.5} />
          Додати послугу
        </button>
      </div>

      {/* Content */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-8"
      >
        {sError && (
          <ErrorBanner
            message="Не вдалося завантажити послуги. Перезавантажте сторінку або перевірте підключення/RLS-права."
          />
        )}
        {sLoading ? (
          <LoadingState />
        ) : services.length === 0 ? (
          <EmptyState
            icon={<Scissors size={28} className="text-muted-foreground/60" />}
            text="Додайте першу послугу"
            sub="Вона з'явиться на вашій публічній сторінці"
          />
        ) : (
          <div className="flex flex-col gap-10">
            {Object.entries(
              services.reduce((acc, s) => {
                if (!acc[s.category]) acc[s.category] = [];
                acc[s.category].push(s);
                return acc;
              }, {} as Record<string, Service[]>)
            )
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([category, categoryServices]) => (
              <div key={category} className="flex flex-col gap-4">
                <div className="flex items-center gap-3">
                  <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-widest pl-1">{category}</h2>
                  <div className="h-px bg-secondary flex-1" />
                  <span className="text-xs font-medium text-muted-foreground/50 pr-1">{categoryServices.length}</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {categoryServices.map((s) => {
                    const originalIndex = services.findIndex(x => x.id === s.id);
                    return (
                      <ServiceCard
                        key={s.id}
                        service={s}
                        index={originalIndex}
                        onEdit={openEditService}
                        onDelete={deleteService}
                        onToggle={id => toggleService(id, s.active)}
                        onMoveUp={originalIndex > 0 ? () => handleMoveService(originalIndex, 'up') : undefined}
                        onMoveDown={originalIndex < services.length - 1 ? () => handleMoveService(originalIndex, 'down') : undefined}
                      />
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Mobile FAB */}
      <motion.button
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.3, type: 'spring', stiffness: 400, damping: 22 }}
        whileTap={{ scale: 0.94 }}
        id="tour-services-add"
        onClick={() => router.push('/dashboard/services/new')}
        className="md:hidden fixed bottom-24 right-5 w-14 h-14 rounded-full bg-primary text-white shadow-lg flex items-center justify-center z-30 hover:bg-[#6B8C8B] transition-colors"
        style={{ boxShadow: '0 4px 20px rgba(120, 154, 153, 0.4)' }}
      >
        <Plus size={24} />
      </motion.button>


    </div>
  );
}

function LoadingState() {
  return (
    <div className="bento-card p-10 flex flex-col items-center gap-3">
      <Loader2 size={24} className="text-primary animate-spin" />
      <p className="text-sm text-muted-foreground/60">Завантаження...</p>
    </div>
  );
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="bento-card p-3 flex items-start gap-2 border border-warning/40 bg-[#FFF7F0]">
      <div className="mt-0.5 text-warning">
        <AlertTriangle size={16} />
      </div>
      <div className="text-xs text-muted-foreground">
        <p className="font-semibold">Проблема з завантаженням даних.</p>
        <p className="mt-0.5">{message}</p>
      </div>
    </div>
  );
}

function EmptyState({ icon, text, sub }: { icon: React.ReactNode; text: string; sub: string }) {
  return (
    <div className="bento-card p-10 flex flex-col items-center gap-3 text-center">
      <div className="w-14 h-14 rounded-full bg-secondary flex items-center justify-center">
        {icon}
      </div>
      <p className="text-sm font-semibold text-foreground">{text}</p>
      <p className="text-xs text-muted-foreground/60">{sub}</p>
    </div>
  );
}
