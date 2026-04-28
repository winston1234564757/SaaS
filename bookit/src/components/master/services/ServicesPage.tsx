'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Plus, Scissors, Loader2 } from 'lucide-react';
import { type Service } from './types';
import { ServiceCard } from './ServiceCard';
import { ServiceForm } from './ServiceForm';
import { useServices } from '@/lib/supabase/hooks/useServices';
import { useMasterContext } from '@/lib/supabase/context';

export function ServicesPage() {
  const { masterProfile } = useMasterContext();
  const masterId = masterProfile?.id ?? '';

  const [serviceFormOpen, setServiceFormOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);

  const _s = useServices();
  const services: Service[] = _s.services;
  const { isLoading: sLoading, error: sError, addService, editService, deleteService, toggleService, reorderServices } = _s;

  function handleMoveService(index: number, direction: 'up' | 'down') {
    const next = [...services];
    const swap = direction === 'up' ? index - 1 : index + 1;
    [next[index], next[swap]] = [next[swap], next[index]];
    reorderServices(next);
  }

  function handleSaveService(data: Omit<Service, 'id'>) {
    if (editingService) {
      editService(editingService.id, data);
    } else {
      addService(data);
    }
  }

  function openEditService(s: Service) {
    setEditingService(s);
    setServiceFormOpen(true);
  }

  function closeServiceForm() {
    setServiceFormOpen(false);
    setEditingService(null);
  }

  const activeServices = services.filter(s => s.active).length;

  return (
    <div className="flex flex-col gap-4 pb-24">
      {/* Header */}
      <div className="bento-card p-5">
        <h1 className="heading-serif text-xl text-[#2C1A14] mb-0.5">Послуги</h1>
        <p className="text-sm text-[#A8928D]">
          {activeServices > 0
            ? `${activeServices} активних послуг`
            : 'Додайте послуги для публічної сторінки'}
        </p>
      </div>

      {/* Content */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-3"
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
            icon={<Scissors size={28} className="text-[#A8928D]" />}
            text="Додайте першу послугу"
            sub="Вона з'явиться на вашій публічній сторінці"
          />
        ) : (
          services.map((s, i) => (
            <ServiceCard
              key={s.id}
              service={s}
              index={i}
              onEdit={openEditService}
              onDelete={deleteService}
              onToggle={id => toggleService(id, s.active)}
              onMoveUp={i > 0 ? () => handleMoveService(i, 'up') : undefined}
              onMoveDown={i < services.length - 1 ? () => handleMoveService(i, 'down') : undefined}
            />
          ))
        )}
      </motion.div>

      {/* FAB */}
      <motion.button
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.3, type: 'spring', stiffness: 400, damping: 22 }}
        whileTap={{ scale: 0.94 }}
        id="tour-services-add"
        onClick={() => setServiceFormOpen(true)}
        className="fixed bottom-24 right-5 w-14 h-14 rounded-full bg-[#789A99] text-white shadow-lg flex items-center justify-center z-30 hover:bg-[#6B8C8B] transition-colors"
        style={{ boxShadow: '0 4px 20px rgba(120, 154, 153, 0.4)' }}
      >
        <Plus size={24} />
      </motion.button>

      <ServiceForm
        isOpen={serviceFormOpen}
        onClose={closeServiceForm}
        onSave={handleSaveService}
        initial={editingService}
        masterId={masterId}
      />
    </div>
  );
}

function LoadingState() {
  return (
    <div className="bento-card p-10 flex flex-col items-center gap-3">
      <Loader2 size={24} className="text-[#789A99] animate-spin" />
      <p className="text-sm text-[#A8928D]">Завантаження...</p>
    </div>
  );
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="bento-card p-3 flex items-start gap-2 border border-[#D4935A]/40 bg-[#FFF7F0]">
      <div className="mt-0.5 text-[#D4935A]">
        <AlertTriangle size={16} />
      </div>
      <div className="text-xs text-[#6B5750]">
        <p className="font-semibold">Проблема з завантаженням даних.</p>
        <p className="mt-0.5">{message}</p>
      </div>
    </div>
  );
}

function EmptyState({ icon, text, sub }: { icon: React.ReactNode; text: string; sub: string }) {
  return (
    <div className="bento-card p-10 flex flex-col items-center gap-3 text-center">
      <div className="w-14 h-14 rounded-full bg-[#F5E8E3] flex items-center justify-center">
        {icon}
      </div>
      <p className="text-sm font-semibold text-[#2C1A14]">{text}</p>
      <p className="text-xs text-[#A8928D]">{sub}</p>
    </div>
  );
}
