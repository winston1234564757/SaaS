import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Plus, Scissors, Package, Loader2 } from 'lucide-react';
import { type Service, type Product } from './types';
import { ServiceCard } from './ServiceCard';
import { ProductCard } from './ProductCard';
import { ServiceForm } from './ServiceForm';
import { ProductForm } from './ProductForm';
import { useServices } from '@/lib/supabase/hooks/useServices';
import { useProducts } from '@/lib/supabase/hooks/useProducts';
import { useProductLinks, setProductLinks, type ProductLink } from '@/lib/supabase/hooks/useProductLinks';
import { useMasterContext } from '@/lib/supabase/context';

type Tab = 'services' | 'products';

export function ServicesPage() {
  const { masterProfile } = useMasterContext();
  const masterId = masterProfile?.id ?? '';

  const [tab, setTab] = useState<Tab>('services');
  const [serviceFormOpen, setServiceFormOpen] = useState(false);
  const [productFormOpen, setProductFormOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const _s = useServices();
  const services: Service[] = _s.services;
  const { isLoading: sLoading, error: sError, addService, editService, deleteService, toggleService, reorderServices } = _s;

  const _p = useProducts();
  const products: Product[] = _p.products;
  const { isLoading: pLoading, error: pError, addProductAsync, editProduct, deleteProduct, toggleProduct } = _p;

  // Load links for the product currently being edited (null when creating new)
  const _pl = useProductLinks(editingProduct?.id ?? null);
  const editingProductLinks: ProductLink[] = _pl.links ?? [];

  function handleMoveService(index: number, direction: 'up' | 'down') {
    const next = [...services];
    const swap = direction === 'up' ? index - 1 : index + 1;
    [next[index], next[swap]] = [next[swap], next[index]];
    reorderServices(next);
  }

  // --- Service handlers ---
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

  // --- Product handlers ---
  async function handleSaveProduct(data: Omit<Product, 'id'>, links: ProductLink[]) {
    if (editingProduct) {
      editProduct(editingProduct.id, data);
      await setProductLinks(editingProduct.id, links);
    } else {
      const newProduct = await addProductAsync(data);
      await setProductLinks(newProduct.id, links);
    }
  }

  function openEditProduct(p: Product) {
    setEditingProduct(p);
    setProductFormOpen(true);
  }

  function closeProductForm() {
    setProductFormOpen(false);
    setEditingProduct(null);
  }

  const activeServices = services.filter(s => s.active).length;
  const activeProducts = products.filter(p => p.active).length;

  return (
    <div className="flex flex-col gap-4 pb-24">
      {/* Header */}
      <div className="bento-card p-5">
        <h1 className="heading-serif text-xl text-[#2C1A14] mb-0.5">Послуги та товари</h1>
        <p className="text-sm text-[#A8928D]">Керуйте каталогом для публічної сторінки</p>

        {/* Tabs */}
        <div id="tour-services-tabs" className="flex gap-2 mt-4">
          <button
            onClick={() => setTab('services')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-2xl text-sm font-medium transition-all ${
              tab === 'services'
                ? 'bg-[#789A99] text-white shadow-sm'
                : 'bg-white/60 text-[#6B5750] hover:bg-white/80'
            }`}
          >
            <Scissors size={15} />
            Послуги
            <span className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${
              tab === 'services' ? 'bg-white/25 text-white' : 'bg-[#789A99]/15 text-[#789A99]'
            }`}>
              {activeServices}
            </span>
          </button>
          <button
            onClick={() => setTab('products')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-2xl text-sm font-medium transition-all ${
              tab === 'products'
                ? 'bg-[#789A99] text-white shadow-sm'
                : 'bg-white/60 text-[#6B5750] hover:bg-white/80'
            }`}
          >
            <Package size={15} />
            Товари
            <span className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${
              tab === 'products' ? 'bg-white/25 text-white' : 'bg-[#789A99]/15 text-[#789A99]'
            }`}>
              {activeProducts}
            </span>
          </button>
        </div>
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        {tab === 'services' ? (
          <motion.div
            key="services"
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -12 }}
            transition={{ duration: 0.18 }}
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
        ) : (
          <motion.div
            key="products"
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 12 }}
            transition={{ duration: 0.18 }}
            className="flex flex-col gap-3"
          >
            {pError && (
              <ErrorBanner
                message="Не вдалося завантажити товари. Перезавантажте сторінку або перевірте підключення/RLS-права."
              />
            )}
            {pLoading ? (
              <LoadingState />
            ) : products.length === 0 ? (
              <EmptyState
                icon={<Package size={28} className="text-[#A8928D]" />}
                text="Додайте перший товар"
                sub="Клієнти зможуть бачити ваш асортимент"
              />
            ) : (
              products.map((p, i) => (
                <ProductCard
                  key={p.id}
                  product={p}
                  index={i}
                  onEdit={openEditProduct}
                  onDelete={deleteProduct}
                  onToggle={id => toggleProduct(id, p.active)}
                />
              ))
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* FAB */}
      <motion.button
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.3, type: 'spring', stiffness: 400, damping: 22 }}
        whileTap={{ scale: 0.94 }}
        id="tour-services-add"
        onClick={() => tab === 'services' ? setServiceFormOpen(true) : setProductFormOpen(true)}
        className="fixed bottom-24 right-5 w-14 h-14 rounded-full bg-[#789A99] text-white shadow-lg flex items-center justify-center z-30 hover:bg-[#6B8C8B] transition-colors"
        style={{ boxShadow: '0 4px 20px rgba(120, 154, 153, 0.4)' }}
      >
        <Plus size={24} />
      </motion.button>

      {/* Forms */}
      <ServiceForm
        isOpen={serviceFormOpen}
        onClose={closeServiceForm}
        onSave={handleSaveService}
        initial={editingService}
        masterId={masterId}
      />
      <ProductForm
        isOpen={productFormOpen}
        onClose={closeProductForm}
        onSave={handleSaveProduct}
        initial={editingProduct}
        initialLinks={editingProductLinks}
        masterId={masterId}
        services={services}
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
