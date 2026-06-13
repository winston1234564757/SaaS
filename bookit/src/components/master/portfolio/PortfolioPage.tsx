'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, Plus, ExternalLink, Images, Lock, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { DragDropContext, Droppable, Draggable, type DropResult } from '@hello-pangea/dnd';
import { usePortfolioItems, useInvalidatePortfolio } from '@/lib/supabase/hooks/usePortfolioItems';
import { PortfolioItemCard } from './PortfolioItemCard';
import { pluralUk } from '@/lib/utils/pluralUk';
import { reorderPortfolioItems, createPortfolioDraft } from '@/app/(master)/dashboard/portfolio/actions';
import { useToast } from '@/lib/toast/context';
import type { PortfolioItemFull, SubscriptionTier } from '@/types/database';

const STARTER_LIMIT = 5;

interface Props {
  initialItems: PortfolioItemFull[];
  tier: SubscriptionTier;
  masterSlug: string;
}

export function PortfolioPage({ initialItems, tier, masterSlug }: Props) {
  const { data: items = initialItems } = usePortfolioItems(initialItems);
  const invalidate = useInvalidatePortfolio();
  const { showToast } = useToast();
  const router = useRouter();
  const [isCreating, setIsCreating] = useState(false);

  const isStarter = tier === 'starter';
  const publishedCount = items.filter(i => i.is_published).length;
  const atLimit = isStarter && publishedCount >= STARTER_LIMIT;

  const handleGridDragEnd = async (result: DropResult) => {
    if (!result.destination || result.source.index === result.destination.index) return;
    const reordered = Array.from(items);
    const [moved] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, moved);
    invalidate();
    await reorderPortfolioItems(reordered.map(i => i.id));
  };

  const handleCreate = async () => {
    if (atLimit || isCreating) return;
    setIsCreating(true);
    try {
      const id = await createPortfolioDraft();
      invalidate();
      router.push(`/dashboard/portfolio/${id}?draft=true`);
    } catch {
      setIsCreating(false);
      showToast({ type: 'error', title: 'Не вдалося створити роботу', message: 'Спробуйте ще раз.' });
    }
  };

  const handleOpenStories = useCallback(() => {
    const firstId = items.find(i => i.photos.length > 0)?.id ?? items[0]?.id;
    const url = firstId
      ? `/dashboard/marketing?tab=stories&portfolioId=${firstId}`
      : '/dashboard/marketing?tab=stories';
    router.push(url);
  }, [items, router]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Портфоліо</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {publishedCount} {pluralUk(publishedCount, 'робота', 'роботи', 'робіт')}
            {isStarter && ` · ${STARTER_LIMIT} макс.`}
          </p>
          <p className="text-xs text-muted-foreground/50 mt-1">
            Роботи, які бачать клієнти на вашій публічній сторінці
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleOpenStories}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-3 rounded-2xl text-sm font-semibold text-muted-foreground border border-border bg-secondary/60 hover:bg-secondary transition-all active:scale-95"
          >
            <Sparkles size={15} /> Сторіс
          </button>
          {masterSlug && (
            <a
              href={`/${masterSlug}/portfolio`}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden xs:flex flex-1 sm:flex-none items-center justify-center gap-2 px-5 py-3 rounded-2xl text-sm font-semibold text-muted-foreground border border-border bg-secondary/60 hover:bg-secondary transition-all"
            >
              <ExternalLink size={15} /> Перегляд
            </a>
          )}
          <button
            type="button"
            onClick={handleCreate}
            disabled={atLimit || isCreating}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-3 rounded-2xl text-sm font-semibold bg-accent text-accent-foreground transition-all disabled:opacity-50 active:scale-95 shadow-sm"
          >
            {isCreating ? <Loader2 size={15} className="animate-spin" /> : <Plus size={17} />}
            {isCreating ? 'Створення...' : 'Додати'}
          </button>
        </div>
      </div>

      {/* Starter upsell */}
      {atLimit && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl p-4 flex items-start gap-3"
          style={{ background: 'rgba(212,147,90,0.08)', border: '1px solid rgba(212,147,90,0.2)' }}
        >
          <div className="size-9 rounded-2xl bg-warning/15 flex items-center justify-center shrink-0">
            <Lock size={16} className="text-warning" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-foreground">Ліміт Starter: {STARTER_LIMIT} робіт</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Перейдіть на Pro — необмежена кількість робіт, більше фото та повний доступ до аналітики.
            </p>
            <a
              href="/dashboard/billing"
              className="inline-block mt-2 text-xs font-semibold text-warning underline underline-offset-2"
            >
              Переглянути тарифи →
            </a>
          </div>
        </motion.div>
      )}

      {/* Empty state */}
      {items.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl py-16 flex flex-col items-center justify-center gap-4 text-center"
          style={{ background: 'rgba(255,255,255,0.55)', border: '1px solid rgba(255,255,255,0.4)' }}
        >
          <div className="size-16 rounded-3xl bg-secondary flex items-center justify-center">
            <Images size={28} className="text-[#C8B8B2]" />
          </div>
          <div>
            <p className="text-base font-bold text-foreground">Портфоліо порожнє</p>
            <p className="text-sm text-muted-foreground mt-1 max-w-xs mx-auto">
              Додайте свої роботи, щоб клієнти бачили ваш стиль і рівень
            </p>
          </div>
          <button type="button"
            onClick={handleCreate}
            disabled={isCreating}
            className="flex items-center gap-2 px-5 py-3 rounded-2xl text-sm font-semibold bg-accent text-accent-foreground active:scale-95 transition-all disabled:opacity-50"
          >
            {isCreating ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
            {isCreating ? 'Створення...' : 'Додати першу роботу'}
          </button>
        </motion.div>
      )}

      {/* Grid with DnD */}
      {items.length > 0 && (
        <DragDropContext onDragEnd={handleGridDragEnd}>
          <Droppable droppableId="portfolio-grid" direction="vertical">
            {(provided) => (
              <div ref={provided.innerRef} {...provided.droppableProps} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {items.map((item, i) => (
                  <Draggable key={item.id} draggableId={item.id} index={i}>
                    {(prov, snap) => (
                      <motion.div
                        ref={prov.innerRef}
                        {...prov.draggableProps}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.04 }}
                        className=""
                        style={{
                          ...prov.draggableProps.style,
                          opacity: snap.isDragging ? 0.5 : 1,
                        }}
                      >
                        <PortfolioItemCard
                          item={item}
                          dragHandleProps={prov.dragHandleProps}
                          onClick={() => router.push(`/dashboard/portfolio/${item.id}`)}
                          onStoryClick={() => router.push(`/dashboard/marketing?tab=stories&portfolioId=${item.id}`)}
                        />
                      </motion.div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}

                {/* Add card — shown when not at limit */}
                {!atLimit && (
                  <div className="">
                    <button type="button"
                      onClick={handleCreate}
                      disabled={isCreating}
                      className="w-full rounded-3xl aspect-[4/3] flex flex-col items-center justify-center gap-2 text-muted-foreground/60 hover:text-accent transition-colors active:scale-95 transition-all disabled:opacity-50"
                      style={{ border: '2px dashed #E8D5CF' }}
                    >
                      {isCreating ? <Loader2 size={20} className="animate-spin" /> : <Plus size={20} />}
                      <span className="text-xs font-medium">{isCreating ? 'Створення...' : 'Додати'}</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      )}
    </div>
  );
}
