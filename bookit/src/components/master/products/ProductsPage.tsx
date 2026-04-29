'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Package, ShoppingBag, AlertTriangle } from 'lucide-react';
import { useProducts } from '@/lib/supabase/hooks/useProducts';
import { useOrders } from '@/lib/supabase/hooks/useOrders';
import type { UnifiedSale } from '@/lib/supabase/hooks/useOrders';
import { ProductCard } from './ProductCard';
import { ProductFormDrawer } from './ProductFormDrawer';
import { RestockDrawer } from './RestockDrawer';
import { OrderCard } from './OrderCard';
import type { Product, OrderStatus } from '@/types/database';

type Tab = 'products' | 'orders';

export function ProductsPage() {
  const [tab, setTab]               = useState<Tab>('products');
  const [formOpen, setFormOpen]     = useState(false);
  const [editTarget, setEditTarget] = useState<Product | null>(null);
  const [restockTarget, setRestockTarget] = useState<Product | null>(null);
  const [orderFilter, setOrderFilter] = useState<OrderStatus | undefined>(undefined);

  const { products, isLoading: pLoading, toggleActive } = useProducts();
  const { orders, isLoading: oLoading, updateStatus } = useOrders(orderFilter);

  const activeCount  = products.filter(p => p.is_active).length;
  const lowStock     = products.filter(p => p.is_active && p.stock_qty <= 3).length;
  const newOrders    = orders.filter(o => o.status === 'new').length;
  const confirmedCount = orders.filter(o => o.status === 'confirmed').length;
  const totalOrders   = orders.length;

  const today = new Date().toISOString().split('T')[0];
  const todayOrdersCount = orders.filter(o => o.created_at.split('T')[0] === today).length;
  const shopRevenue = orders
    .filter(o => o.status !== 'cancelled')
    .reduce((sum, o) => sum + (o.total_kopecks / 100), 0);

  function openEdit(p: Product) {
    setEditTarget(p);
    setFormOpen(true);
  }

  function closeForm() {
    setFormOpen(false);
    setEditTarget(null);
  }

  const ORDER_FILTERS: { label: string; value: OrderStatus | undefined }[] = [
    { label: 'Всі',        value: undefined    },
    { label: 'Нові',       value: 'new'        },
    { label: 'Підтверджені', value: 'confirmed' },
    { label: 'Відправлені', value: 'shipped'   },
    { label: 'Завершені',  value: 'completed'  },
    { label: 'Скасовані',  value: 'cancelled'  },
  ];

  return (
    <div className="flex flex-col gap-4 pb-24">
      {/* Header */}
      <div className="bento-card p-5">
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

        {/* Stats row */}
        <div className="flex gap-2">
          {tab === 'products' ? (
            <>
              <StatChip label="Активних" value={activeCount} />
              <StatChip label="Всього" value={products.length} />
              {lowStock > 0 && (
                <StatChip label="Мало на складі" value={lowStock} warn />
              )}
            </>
          ) : (
            <>
              <StatChip label="Сьогодні" value={todayOrdersCount} />
              <StatChip label="Виручка (Shop)" value={`${Math.round(shopRevenue)} ₴`} />
              <StatChip label="Всього" value={totalOrders} />
            </>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mt-4">
          <TabBtn active={tab === 'products'} onClick={() => setTab('products')}>
            <Package size={14} /> Товари
          </TabBtn>
          <TabBtn active={tab === 'orders'} onClick={() => setTab('orders')}>
            <ShoppingBag size={14} />
            Замовлення
            {newOrders > 0 && (
              <span className="ml-1 w-4 h-4 rounded-full bg-warning text-white text-[9px] font-bold flex items-center justify-center">
                {newOrders > 9 ? '9+' : newOrders}
              </span>
            )}
          </TabBtn>
        </div>
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        {tab === 'products' ? (
          <motion.div
            key="products"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.15 }}
            className="flex flex-col gap-3"
          >
            {pLoading ? (
              <SkeletonList />
            ) : products.length === 0 ? (
              <EmptyProducts onAdd={() => setFormOpen(true)} />
            ) : (
              products.map(p => (
                <ProductCard
                  key={p.id}
                  product={p}
                  onEdit={() => openEdit(p)}
                  onRestock={() => setRestockTarget(p)}
                  onToggle={() => toggleActive(p.id, p.is_active)}
                />
              ))
            )}
          </motion.div>
        ) : (
          <motion.div
            key="orders"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            transition={{ duration: 0.15 }}
            className="flex flex-col gap-3"
          >
            {/* Status filter chips */}
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
              {ORDER_FILTERS.map(f => (
                <button
                  key={f.label}
                  onClick={() => setOrderFilter(f.value)}
                  className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                    orderFilter === f.value
                      ? 'bg-primary text-white'
                      : 'bg-white/60 text-muted-foreground hover:bg-white/80'
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

      {/* FAB — only on products tab */}
      {tab === 'products' && (
        <motion.button
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 400, damping: 22 }}
          whileTap={{ scale: 0.94 }}
          onClick={() => setFormOpen(true)}
          className="fixed bottom-24 right-5 w-14 h-14 rounded-full bg-primary text-white shadow-lg flex items-center justify-center z-30 hover:bg-[#6B8C8B] transition-colors"
          style={{ boxShadow: '0 4px 20px rgba(120, 154, 153, 0.4)' }}
        >
          <Plus size={24} />
        </motion.button>
      )}

      <ProductFormDrawer
        open={formOpen}
        initial={editTarget}
        onClose={closeForm}
      />

      {restockTarget && (
        <RestockDrawer
          product={restockTarget}
          open={!!restockTarget}
          onClose={() => setRestockTarget(null)}
        />
      )}
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

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
      onClick={onClick}
      className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-2xl text-sm font-medium transition-all ${
        active ? 'bg-primary text-white shadow-sm' : 'bg-white/60 text-muted-foreground hover:bg-white/80'
      } active:scale-95 transition-all`}
    >
      {children}
    </button>
  );
}

function EmptyProducts({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="bento-card p-10 flex flex-col items-center gap-3 text-center">
      <div className="w-14 h-14 rounded-full bg-secondary flex items-center justify-center">
        <Package size={28} className="text-muted-foreground/60" />
      </div>
      <div>
        <p className="text-sm font-semibold text-foreground">Товарів ще немає</p>
        <p className="text-xs text-muted-foreground/60 mt-1">Додайте перший продукт для продажу</p>
      </div>
      <button
        onClick={onAdd}
        className="mt-1 inline-flex items-center gap-1.5 px-5 py-2.5 rounded-2xl bg-primary text-white text-xs font-bold hover:bg-primary/90 transition-colors shadow-lg shadow-[#789A99]/20 active:scale-95 transition-all"
      >
        <Plus size={14} /> Додати товар
      </button>
    </div>
  );
}

function EmptyOrders() {
  return (
    <div className="bento-card p-10 flex flex-col items-center gap-3 text-center">
      <div className="w-14 h-14 rounded-full bg-secondary flex items-center justify-center">
        <ShoppingBag size={28} className="text-muted-foreground/60" />
      </div>
      <p className="text-sm font-semibold text-foreground">Замовлень поки немає</p>
      <p className="text-xs text-muted-foreground/60">Вони з'являться тут після перших покупок</p>
    </div>
  );
}

function SkeletonList() {
  return (
    <div className="flex flex-col gap-3">
      {[1, 2, 3].map(i => (
        <div key={i} className="bento-card p-4 animate-pulse">
          <div className="flex gap-3">
            <div className="w-16 h-16 rounded-2xl bg-secondary" />
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
