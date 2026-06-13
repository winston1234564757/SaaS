'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { AlertTriangle, Plus, Scissors, Loader2 } from 'lucide-react';
import { DragDropContext, Droppable, Draggable, type DropResult } from '@hello-pangea/dnd';
import { type Service, CATEGORIES } from './types';
import { ServiceCard } from './ServiceCard';
import { useServices } from '@/lib/supabase/hooks/useServices';

const CATEGORY_ORDER = CATEGORIES as readonly string[];

function groupByCategory(services: Service[]): Map<string, Service[]> {
  const activeCats = CATEGORY_ORDER.filter(cat => services.some(s => s.category === cat));
  const extraCats = [...new Set(services.map(s => s.category))].filter(cat => !CATEGORY_ORDER.includes(cat));
  const map = new Map<string, Service[]>();
  for (const cat of [...activeCats, ...extraCats]) {
    const items = services.filter(s => s.category === cat);
    if (items.length > 0) map.set(cat, items);
  }
  return map;
}

export function ServicesPage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const router = useRouter();

  const _s = useServices();
  const services: Service[] = _s.services;
  const { isLoading: sLoading, error: sError, deleteService, toggleService, reorderServices } = _s;

  const grouped = useMemo(() => groupByCategory(services), [services]);

  function handleServiceDragEnd(result: DropResult) {
    if (!result.destination) return;
    if (result.source.droppableId !== result.destination.droppableId) return;
    if (result.source.index === result.destination.index) return;

    const category = result.source.droppableId;
    const catServices = services.filter(s => s.category === category);

    const reordered = [...catServices];
    const [moved] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, moved);

    const positions: number[] = [];
    services.forEach((s, i) => { if (s.category === category) positions.push(i); });

    const next = [...services];
    positions.forEach((pos, i) => { next[pos] = reordered[i]; });
    reorderServices(next);
  }

  function openEditService(s: Service) {
    router.push(`/dashboard/services/${s.id}`);
  }

  const activeServices = services.filter(s => s.active).length;

  const groupedContent = (withDnd: boolean) => (
    <div className="flex flex-col gap-6">
      {Array.from(grouped.entries()).map(([cat, items]) => (
        <div key={cat}>
          <CategoryHeader name={cat} count={items.length} />
          {withDnd ? (
            <Droppable droppableId={cat}>
              {(provided) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2"
                >
                  {items.map((s, i) => (
                    <Draggable key={s.id} draggableId={s.id} index={i}>
                      {(prov, snap) => (
                        <div
                          ref={prov.innerRef}
                          {...prov.draggableProps}
                          style={{ ...prov.draggableProps.style, opacity: snap.isDragging ? 0.5 : 1 }}
                        >
                          <ServiceCard
                            service={s}
                            index={i}
                            dragHandleProps={prov.dragHandleProps}
                            onEdit={openEditService}
                            onDelete={deleteService}
                            onToggle={id => toggleService(id, s.active)}
                          />
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
              {items.map((s, i) => (
                <ServiceCard
                  key={s.id}
                  service={s}
                  index={i}
                  onEdit={openEditService}
                  onDelete={deleteService}
                  onToggle={id => toggleService(id, s.active)}
                />
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );

  return (
    <div className="flex flex-col gap-4 pb-24 lg:pb-8">
      <div className="flex flex-col gap-4 lg:grid lg:grid-cols-[260px_1fr] lg:gap-6 lg:items-start">

        {/* Left sidebar: header + add button */}
        <div className="widget-card p-4 md:p-5 mt-4 lg:mt-0 flex flex-col gap-3 lg:gap-4">
          <div>
            <h1 className="heading-serif text-xl text-foreground mb-0.5">Послуги</h1>
            <p className="text-sm text-muted-foreground/60">
              {activeServices > 0
                ? `${activeServices} активних послуг`
                : 'Додайте послуги для публічної сторінки'}
            </p>
          </div>
          <button
            type="button"
            id="tour-services-add"
            onClick={() => router.push('/dashboard/services/new')}
            className="w-full flex items-center justify-center gap-2 min-h-[44px] rounded-xl bg-accent text-accent-foreground text-sm font-semibold hover:bg-accent/90 transition-colors active:scale-[0.98]"
          >
            <Plus size={16} />
            Додати послугу
          </button>
        </div>

        {/* Right: content */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col gap-8"
        >
          {sError && (
            <ErrorBanner message="Не вдалося завантажити послуги. Перезавантажте сторінку або перевірте підключення/RLS-права." />
          )}
          {sLoading ? (
            <LoadingState />
          ) : services.length === 0 ? (
            <EmptyState
              icon={<Scissors size={28} className="text-muted-foreground/60" />}
              text="Додайте першу послугу"
              sub="Вона з'явиться на вашій публічній сторінці"
            />
          ) : !mounted ? (
            groupedContent(false)
          ) : (
            <DragDropContext onDragEnd={handleServiceDragEnd}>
              {groupedContent(true)}
            </DragDropContext>
          )}
        </motion.div>
      </div>
    </div>
  );
}

function CategoryHeader({ name, count }: { name: string; count: number }) {
  return (
    <div className="flex items-center gap-2 px-1 mb-2">
      <span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/50">{name}</span>
      <span className="text-[11px] text-muted-foreground/30">{count}</span>
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
    <div className="bento-card p-3 flex items-start gap-2 border border-warning/40 bg-warning/5">
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
      <div className="size-14 rounded-full bg-secondary flex items-center justify-center">
        {icon}
      </div>
      <p className="text-sm font-semibold text-foreground">{text}</p>
      <p className="text-xs text-muted-foreground/60">{sub}</p>
    </div>
  );
}
