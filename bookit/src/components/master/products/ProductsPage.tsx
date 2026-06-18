'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Package, ShoppingBag } from 'lucide-react';
import { DragDropContext, Droppable, Draggable, type DropResult } from '@hello-pangea/dnd';
import { useProducts } from '@/lib/supabase/hooks/useProducts';
import { useOrders } from '@/lib/supabase/hooks/useOrders';
import type { UnifiedSale } from '@/lib/supabase/hooks/useOrders';
import { ProductCard } from './ProductCard';
import { RestockDrawer } from './RestockDrawer';
import { OrderCard } from './OrderCard';
import type { Product, OrderStatus } from '@/types/database';
import { useUrlActionBus } from '@/lib/actions/UrlActionBus';
import { useMasterContext } from '@/lib/supabase/context';
import { useTour } from '@/lib/hooks/useTour';
import { TourBanner, type TourStep } from '@/components/master/onboarding/TourBanner';

// humanized
const PRODUCTS_STEPS: TourStep[] = [
  {
    title: 'Магазин',
    text: 'Продавай товари через свій лінк — засоби, аксесуари, подарункові сертифікати.',
    tourKey: 'prd-sidebar',
  },
  {
    title: 'Додати товар',
    text: 'Фото, назва, ціна, залишок. Клієнт бачить товар на твоїй сторінці і робить замовлення.',
    tourKey: 'prd-add',
  },
  {
    title: 'Товари i замовлення',
    text: 'Вкладка Замовлення покаже нові та активні замовлення від клієнтів.',
    tourKey: 'prd-list',
  },
  {
    title: 'Магазин готовий',
    text: 'Товари одразу доступні на твоїй публічній сторінці після збереження.',
  },
];

export function ProductsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [orderFilter, setOrderFilter] = useState<OrderStatus | undefined>(undefined);

  const tab = (searchParams.get('tab') as 'products' | 'orders') || 'products';
  const restockId = searchParams.get('restockId');

  const { masterProfile } = useMasterContext();
  const seenTours = masterProfile?.seen_tours as Record<string, boolean> | null;
  const { currentStep, nextStep, closeTour } = useTour('products_v1', PRODUCTS_STEPS.length, {
    initialSeen: !!(seenTours?.['products_v1']),
    masterId: masterProfile?.id ?? '',
  });

  const { products, isLoading: pLoading, toggleActive, reorderProducts } = useProducts();
  const { orders, isLoading: oLoading, updateStatus } = useOrders(orderFilter);

  useUrlActionBus('product:create', () => {
    router.push('/dashboard/products/new');
  });
  useUrlActionBus('product:edit', ({ productId: id }) => {
    router.push(`/dashboard/products/${id}`);
  });

  const handleProductDragEnd = async (result: DropResult) => {
    if (!result.destination || result.source.index === result.destination.index) return;
    const reordered = Array.from(products);
    const [moved] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, moved);
    await reorderProducts(reordered.map(p => p.id));
  };

  const restockTarget = restockId ? (products.find(p => p.id === restockId) ?? null) : null;
  const activeCount = products.filter(p => p.is_active).length;
  const lowStock = products.filter(p => p.is_active && p.stock_qty <= 3).length;
  const newOrders = orders.filter(o => o.status === 'new').length;
  const totalOrders = orders.length;
  const today = new Date().toISOString().split('T')[0];
  const todayOrdersCount = orders.filter(o => o.created_at.split('T')[0] === today).length;
  const shopRevenue = orders
    .filter(o => o.status !== 'cancelled')
    .reduce((sum, o) => sum + (o.total_kopecks / 100), 0);

  function setParam(key: string, value: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (value === null) params.delete(key);
    else params.set(key, value);
    router.replace(`/dashboard/products?${params.toString()}`, { scroll: false });
  }

  function openEdit(p: Product) {
    router.push(`/dashboard/products/${p.id}`);
  }

  function openRestock(p: Product) {
    setParam('restockId', p.id);
  }

  function closeRestock() {
    setParam('restockId', null);
  }

  const ORDER_FILTERS: { label: string; value: OrderStatus | undefined }[] = [
    { label: 'Всі', value: undefined },
    { label: 'Нові', value: 'new' },
    { label: 'Підтверджені', value: 'confirmed' },
    { label: 'Відправлені', value: 'shipped' },
    { label: 'Завершені', value: 'completed' },
    { label: 'Скасовані', value: 'cancelled' },
  ];

  return (
    <div className="flex flex-col gap-4 pb-24 lg:pb-8">
      <div className="flex flex-col gap-4 lg:grid lg:grid-cols-[260px_1fr] lg:gap-6 lg:items-start">

        {/* Left sidebar: header + stats + tabs */}
        <div className="bento-card p-5" data-tour-key="prd-sidebar">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h1 className="heading-serif text-xl text-foreground">Магазин</h1>
              <p className="text-sm text-muted-foreground/60 mt-0.5">Товари та замовлення</p>
            </div>
            {newOrders > 0 && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-warning/12 text-warning">
                <ShoppingBag size={14} strokeWidth={2.5} />
                <span className="text-xs font-bold">{newOrders} нових</span>
              </div>
            )}
          </div>

          <div className="flex gap-2">
            {tab === 'products' ? (
              <>
                <StatChip label="Активних" value={activeCount} />
                <StatChip label="Всього" value={products.length} />
                {lowStock > 0 && <StatChip label="Мало на складі" value={lowStock} warn />}
              </>
            ) : (
              <>
                <StatChip label="Сьогодні" value={todayOrdersCount} />
                <StatChip label="Виручка (Shop)" value={`${Math.round(shopRevenue)} грн`} />
                <StatChip label="Всього" value={totalOrders} />
              </>
            )}
          </div>

          <div className="flex gap-2 mt-4 lg:flex-col">
            <TabBtn active={tab === 'products'} onClick={() => setParam('tab', 'products')}>
              <Package size={14} /> Товари
            </TabBtn>
            <TabBtn active={tab === 'orders'} onClick={() => setParam('tab', 'orders')}>
              <ShoppingBag size={14} />
              Замовлення
              {newOrders > 0 && (
                <span className="ml-1 size-4 rounded-full bg-warning text-white text-[9px] font-bold flex items-center justify-center">
                  {newOrders > 9 ? '9+' : newOrders}
                </span>
              )}
            </TabBtn>
          </div>

          {tab === 'products' && (
            <button
              type="button"
              data-tour-key="prd-add"
              onClick={() => router.push('/dashboard/products/new')}
              className="mt-3 w-full flex items-center justify-center gap-2 min-h-[44px] rounded-xl bg-accent text-accent-foreground text-sm font-semibold hover:bg-accent/90 transition-colors active:scale-[0.98]"
            >
              <Plus size={16} />
              Додати
            </button>
          )}
        </div>

        {/* Right: content */}
        <div data-tour-key="prd-list">
          <AnimatePresence mode="popLayout">
            {tab === 'products' ? (
              <motion.div
                key="products"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 4 }}
                transition={{ duration: 0.15 }}
                className="flex flex-col gap-3"
              >
                {pLoading ? (
                  <SkeletonList />
                ) : products.length === 0 ? (
                  <EmptyProducts onAdd={() => router.push('/dashboard/products/new')} />
                ) : (
                  <DragDropContext onDragEnd={handleProductDragEnd}>
                    <Droppable droppableId="products">
                      {(provided) => (
                        <div ref={provided.innerRef} {...provided.droppableProps} className="flex flex-col gap-3">
                          {products.map((p, i) => (
                            <Draggable key={p.id} draggableId={p.id} index={i}>
                              {(prov, snap) => (
                                <div
                                  ref={prov.innerRef}
                                  {...prov.draggableProps}
                                  style={{
                                    ...prov.draggableProps.style,
                                    opacity: snap.isDragging ? 0.5 : 1,
                                  }}
                                >
                                  <ProductCard
                                    product={p}
                                    dragHandleProps={prov.dragHandleProps}
                                    onEdit={() => openEdit(p)}
                                    onRestock={() => openRestock(p)}
                                    onToggle={() => toggleActive(p.id, p.is_active)}
                                  />
                                </div>
                              )}
                            </Draggable>
                          ))}
                          {provided.placeholder}
                        </div>
                      )}
                    </Droppable>
                  </DragDropContext>
                )}
              </motion.div>
            ) : (
              <motion.div
                key="orders"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 4 }}
                transition={{ duration: 0.15 }}
                className="flex flex-col gap-3"
              >
                <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                  {ORDER_FILTERS.map(f => (
                    <button
                      key={f.label}
                      type="button"
                      aria-pressed={orderFilter === f.value}
                      onClick={() => setOrderFilter(f.value)}
                      className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                        orderFilter === f.value
                          ? 'bg-primary text-white'
                          : 'bg-secondary/60 text-muted-foreground hover:bg-secondary/80'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>

                {oLoading ? (
                  <SkeletonList />
                ) : orders.length === 0 ? (
                  <EmptyOrders />
                ) : (
                  orders.map(o => (
                    <OrderCard
                      key={o.id}
                      order={o as UnifiedSale}
                      onStatusChange={(status) => updateStatus(o.id, status, (o as UnifiedSale).source)}
                    />
                  ))
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {restockTarget && (
        <RestockDrawer
          product={restockTarget}
          open={!!restockTarget}
          onClose={closeRestock}
        />
      )}

      <TourBanner steps={PRODUCTS_STEPS} currentStep={currentStep} onNext={nextStep} onClose={closeTour} />
    </div>
  );
}

function StatChip({ label, value, warn }: { label: string; value: number | string; warn?: boolean }) {
  return (
    <div className={`flex-1 px-3 py-2 rounded-xl text-center ${warn ? 'bg-warning/10' : 'bg-secondary'}`}>
      <p className={`text-base font-bold ${warn ? 'text-warning' : 'text-foreground'}`}>{value}</p>
      <p className={`text-[10px] ${warn ? 'text-warning' : 'text-muted-foreground/60'}`}>{label}</p>
    </div>
  );
}

function TabBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-sm font-medium transition-all lg:flex-none lg:w-full lg:justify-start lg:px-4 ${
        active ? 'bg-accent text-accent-foreground shadow-sm' : 'border border-border bg-transparent text-muted-foreground hover:bg-secondary/40'
      } active:scale-95`}
    >
      {children}
    </button>
  );
}

function EmptyProducts({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="bento-card p-10 flex flex-col items-center gap-3 text-center">
      <div className="size-14 rounded-full bg-secondary flex items-center justify-center">
        <Package size={28} className="text-muted-foreground/60" />
      </div>
      <div>
        <p className="text-sm font-semibold text-foreground">Товарів ще немає</p>
        <p className="text-xs text-muted-foreground/60 mt-1">Додайте перший продукт для продажу</p>
      </div>
      <button
        type="button"
        onClick={onAdd}
        className="mt-1 inline-flex items-center gap-1.5 px-5 py-2.5 rounded-lg bg-primary text-white text-xs font-bold hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20 active:scale-95"
      >
        <Plus size={14} /> Додати товар
      </button>
    </div>
  );
}

function EmptyOrders() {
  return (
    <div className="bento-card p-10 flex flex-col items-center gap-3 text-center">
      <div className="size-14 rounded-full bg-secondary flex items-center justify-center">
        <ShoppingBag size={28} className="text-muted-foreground/60" />
      </div>
      <p className="text-sm font-semibold text-foreground">Замовлень поки немає</p>
      <p className="text-xs text-muted-foreground/60">Вони з&apos;являться тут після перших покупок</p>
    </div>
  );
}

function SkeletonList() {
  return (
    <div className="flex flex-col gap-3">
      {[1, 2, 3].map(i => (
        <div key={i} className="bento-card p-4 animate-pulse">
          <div className="flex gap-3">
            <div className="size-16 rounded-lg bg-secondary" />
            <div className="flex-1 flex flex-col gap-2 pt-1">
              <div className="h-3.5 bg-secondary rounded-full w-2/3" />
              <div className="h-3 bg-secondary rounded-full w-1/3" />
              <div className="h-3 bg-secondary rounded-full w-1/2" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
