'use client';

import { useState, useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { AlertTriangle, Plus, Scissors, LayoutGrid, List } from 'lucide-react';
import type { DropResult } from '@hello-pangea/dnd';
import { type Service, CATEGORIES, formatPrice } from './types';
import { ServiceCard, type ServiceView } from './ServiceCard';
import { ServiceDetailSheet, type ServiceDetailData } from '@/components/shared/wizard/ServiceDetailSheet';
import { cn } from '@/lib/utils/cn';
import { useServices, type ServiceRow } from '@/lib/supabase/hooks/useServices';
import { TourBanner, type TourStep } from '@/components/master/onboarding/TourBanner';
import { useDestinationTour } from '@/lib/hooks/useDestinationTour';
import { useToast } from '@/lib/toast/context';

// DnD is excluded from the initial bundle — loads async after hydration
const DragDropContext = dynamic(
  () => import('@hello-pangea/dnd').then(m => ({ default: m.DragDropContext })),
  { ssr: false }
);
const Droppable = dynamic(
  () => import('@hello-pangea/dnd').then(m => ({ default: m.Droppable })),
  { ssr: false }
);
const Draggable = dynamic(
  () => import('@hello-pangea/dnd').then(m => ({ default: m.Draggable })),
  { ssr: false }
);

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

interface ServicesPageProps {
  initialServicesData?: ServiceRow[];
}

// humanized
const SERVICES_STEPS: TourStep[] = [
  {
    title: 'Послуги',
    text: 'Тут ти додаєш послуги — вони одразу з\'являться на твоїй публічній сторінці.',
    tourKey: 'svc-sidebar',
  },
  {
    title: 'Додати послугу',
    text: 'Натисни кнопку щоб створити нову послугу: назва, ціна, тривалість.',
    tourKey: 'svc-add',
  },
  {
    title: 'Список послуг',
    text: 'Перетягуй картки щоб змінити порядок. Вимикай послуги без їх видалення.',
    tourKey: 'svc-list',
  },
  {
    title: 'Послуги готові',
    text: 'Клієнти побачать їх одразу після збереження. Мінімум 1 послуга — щоб запис працював.',
  },
];

export function ServicesPage({ initialServicesData }: ServicesPageProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const [view, setView] = useState<ServiceView>('grid');
  useEffect(() => {
    const saved = localStorage.getItem('services_view');
    if (saved === 'list' || saved === 'grid') setView(saved);
  }, []);
  function changeView(v: ServiceView) {
    setView(v);
    try { localStorage.setItem('services_view', v); } catch { /* private mode */ }
  }

  const router = useRouter();
  const { currentStep, nextStep, closeTour, dynamicSteps } = useDestinationTour('services_v1', SERVICES_STEPS);

  const { showToast } = useToast();
  const _s = useServices({ initialRows: initialServicesData });
  const services: Service[] = _s.services;
  const { isLoading: sLoading, error: sError, deleteService, toggleService, reorderServices } = _s;

  const grouped = useMemo(() => groupByCategory(services), [services]);

  async function handleServiceDragEnd(result: DropResult) {
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

    try {
      await reorderServices(next);
      showToast({ type: 'success', title: 'Порядок збережено', duration: 1500 });
    } catch {
      showToast({ type: 'error', title: 'Не вдалося зберегти порядок' });
    }
  }

  function openEditService(s: Service) {
    router.push(`/dashboard/services/${s.id}`);
  }

  const [previewService, setPreviewService] = useState<Service | null>(null);
  const previewData: ServiceDetailData | null = previewService
    ? {
        id: previewService.id,
        name: previewService.name,
        category: previewService.category,
        price: previewService.price,
        duration: previewService.duration,
        description: previewService.description ?? null,
        imageUrl: previewService.imageUrl ?? null,
        iconName: previewService.icon_name,
        popular: previewService.popular,
      }
    : null;

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
                  className={cn("mt-2", view === 'list' ? "flex flex-col gap-2" : "grid grid-cols-1 md:grid-cols-2 gap-3")}
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
                            view={view}
                            dragHandleProps={prov.dragHandleProps}
                            onEdit={openEditService}
                            onDelete={deleteService}
                            onToggle={id => toggleService(id, s.active)}
                            onPreview={setPreviewService}
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
            <div className={cn("mt-2", view === 'list' ? "flex flex-col gap-2" : "grid grid-cols-1 md:grid-cols-2 gap-3")}>
              {items.map((s, i) => (
                <ServiceCard
                  key={s.id}
                  service={s}
                  index={i}
                  view={view}
                  onEdit={openEditService}
                  onDelete={deleteService}
                  onToggle={id => toggleService(id, s.active)}
                  onPreview={setPreviewService}
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
        <div className="widget-card p-4 md:p-5 mt-4 lg:mt-0 flex flex-col gap-3 lg:gap-4" data-tour-key="svc-sidebar">
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
            data-tour-key="svc-add"
            onClick={() => router.push('/dashboard/services/new')}
            className="w-full flex items-center justify-center gap-2 min-h-[44px] rounded-xl bg-accent text-accent-foreground text-sm font-semibold hover:bg-accent/90 transition-colors active:scale-[0.98]"
          >
            <Plus size={16} />
            Додати послугу
          </button>

          {services.length > 0 && (
            <div className="flex items-center gap-1 p-1 rounded-xl bg-secondary/40 border border-border self-start" role="group" aria-label="Режим перегляду">
              <button
                type="button"
                onClick={() => changeView('grid')}
                aria-label="Перегляд сіткою"
                aria-pressed={view === 'grid'}
                className={cn(
                  "size-9 flex items-center justify-center rounded-lg transition-colors",
                  view === 'grid' ? "bg-background text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <LayoutGrid size={16} />
              </button>
              <button
                type="button"
                onClick={() => changeView('list')}
                aria-label="Перегляд списком"
                aria-pressed={view === 'list'}
                className={cn(
                  "size-9 flex items-center justify-center rounded-lg transition-colors",
                  view === 'list' ? "bg-background text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <List size={16} />
              </button>
            </div>
          )}
        </div>

        {/* Right: content */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col gap-8"
          data-tour-key="svc-list"
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

      <TourBanner steps={dynamicSteps} currentStep={currentStep} onNext={nextStep} onClose={closeTour} />

      <ServiceDetailSheet
        open={!!previewService}
        onOpenChange={(o) => { if (!o) setPreviewService(null); }}
        service={previewData}
        mode="master"
        formatPrice={formatPrice}
      />
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
    <div className="flex flex-col gap-6 animate-pulse">
      {[0, 1].map(g => (
        <div key={g}>
          <div className="h-3 w-24 rounded-full bg-secondary/80 mb-3 mx-1" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[0, 1, 2, 3].map(i => (
              <div key={i} className="bento-card p-0 overflow-hidden flex flex-col">
                <div className="aspect-[16/10] w-full bg-secondary/70" />
                <div className="px-3 pt-3 pb-1.5 flex flex-col gap-2">
                  <div className="h-3.5 w-32 rounded-full bg-secondary/80" />
                  <div className="h-2.5 w-40 rounded-full bg-secondary/55" />
                  <div className="h-2.5 w-20 rounded-full bg-secondary/55" />
                  <div className="h-4 w-16 rounded-full bg-secondary/80" />
                </div>
                <div className="flex items-center justify-between px-3 py-2 border-t border-secondary/40">
                  <div className="flex gap-1">
                    <div className="size-9 rounded-full bg-secondary/60" />
                    <div className="size-9 rounded-full bg-secondary/60" />
                  </div>
                  <div className="w-11 h-6 rounded-full bg-secondary/60" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
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
