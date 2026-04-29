'use client';

import { useState, useTransition } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShoppingBag, Plus, Minus, X, ArrowLeft, Package,
  MapPin, Truck, ChevronRight, Loader2, CheckCircle2, Check,
  CalendarDays, User, Phone, ChevronLeft,
} from 'lucide-react';
import { createOrder } from '@/app/(master)/dashboard/products/actions';
import type { Product, ProductCategory } from '@/types/database';
import { cn } from '@/lib/utils/cn';

// ── Types ─────────────────────────────────────────────────────────────────────

interface CartItem { product: Product; qty: number }

const CATEGORY_LABELS: Record<ProductCategory, string> = {
  hair:  'Волосся', nails: 'Нігті',  skin:  'Шкіра',
  brows: 'Брови',   body:  'Тіло',   tools: 'Інструменти', other: 'Інше',
};

interface Props {
  masterId:        string;
  masterSlug:      string;
  masterName:      string;
  shipsNovaPoshta: boolean;
  products:        Product[];
  isAuth:          boolean;
  workingHours?:   any;
  schedule?:       any[];
}

// ── Component ─────────────────────────────────────────────────────────────────

export function ShopPage({ masterId, masterSlug, masterName, shipsNovaPoshta, products, isAuth, workingHours, schedule }: Props) {
  const [cart, setCart]                   = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen]           = useState(false);
  const [catFilter, setCatFilter]         = useState<ProductCategory | null>(null);
  const [orderDone, setOrderDone]         = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const categories = [...new Set(products.map(p => p.category))] as ProductCategory[];
  const filtered   = catFilter ? products.filter(p => p.category === catFilter) : products;

  const cartCount = cart.reduce((s, i) => s + i.qty, 0);
  const cartTotal = cart.reduce((s, i) => s + i.product.price_kopecks * i.qty, 0);

  function addToCart(p: Product, qty = 1) {
    setCart(prev => {
      const existing = prev.find(i => i.product.id === p.id);
      if (existing) return prev.map(i => i.product.id === p.id ? { ...i, qty: i.qty + qty } : i);
      return [...prev, { product: p, qty }];
    });
  }

  function setQty(productId: string, qty: number) {
    if (qty <= 0) setCart(prev => prev.filter(i => i.product.id !== productId));
    else setCart(prev => prev.map(i => i.product.id === productId ? { ...i, qty } : i));
  }

  function getQty(productId: string) {
    return cart.find(i => i.product.id === productId)?.qty ?? 0;
  }

  if (orderDone) return <OrderSuccess masterSlug={masterSlug} masterName={masterName} />;

  return (
    <div className="max-w-lg mx-auto px-4 py-6 pb-32 flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center gap-3 pt-2">
        <Link
          href={`/${masterSlug}`}
          className="w-9 h-9 rounded-2xl bg-white/70 border border-white/70 flex items-center justify-center text-muted-foreground hover:bg-white transition-all shrink-0"
        >
          <ArrowLeft size={18} />
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="heading-serif text-xl text-foreground leading-tight">Магазин</h1>
          <p className="text-xs text-muted-foreground/60">{masterName}</p>
        </div>
      </div>

      {/* Category filter */}
      {categories.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          <FilterChip active={catFilter === null} onClick={() => setCatFilter(null)}>Всі</FilterChip>
          {categories.map(c => (
            <FilterChip key={c} active={catFilter === c} onClick={() => setCatFilter(c)}>
              {CATEGORY_LABELS[c]}
            </FilterChip>
          ))}
        </div>
      )}

      {/* Product grid */}
      {products.length === 0 ? (
        <EmptyShop masterSlug={masterSlug} />
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {filtered.map(p => (
            <ProductTile
              key={p.id}
              product={p}
              qty={getQty(p.id)}
              onOpen={() => setSelectedProduct(p)}
            />
          ))}
        </div>
      )}

      {/* Product Detail Sheet */}
      <ProductDetailSheet
        product={selectedProduct}
        qty={selectedProduct ? getQty(selectedProduct.id) : 0}
        onClose={() => setSelectedProduct(null)}
        onAdd={(qty) => { if (selectedProduct) { addToCart(selectedProduct, qty); setSelectedProduct(null); setCartOpen(true); } }}
        onQtyChange={(qty) => { if (selectedProduct) { if (qty === 0) setQty(selectedProduct.id, 0); else addToCart(selectedProduct, qty - getQty(selectedProduct.id)); } }}
      />

      {/* Sticky cart button */}
      <AnimatePresence>
        {cartCount > 0 && (
          <motion.div
            className="fixed bottom-0 left-0 right-0 z-40 px-4 pb-28 pt-3 bg-gradient-to-t from-[#FFE8DC] via-[#FFE8DC]/90 to-transparent pointer-events-none"
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
          >
            <button
              onClick={() => setCartOpen(true)}
              className="pointer-events-auto w-full max-w-lg mx-auto flex items-center justify-between px-5 py-4 rounded-2xl bg-foreground text-white shadow-xl active:scale-[0.98] transition-all"
            >
              <div className="flex items-center gap-2.5">
                <div className="relative">
                  <ShoppingBag size={20} />
                  <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-primary text-[9px] font-bold flex items-center justify-center">
                    {cartCount}
                  </span>
                </div>
                <span className="text-sm font-semibold">Кошик</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-bold">{(cartTotal / 100).toFixed(0)} ₴</span>
                <ChevronRight size={16} className="opacity-60" />
              </div>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cart + Checkout drawer */}
      <CartDrawer
        open={cartOpen}
        cart={cart}
        masterId={masterId}
        masterSlug={masterSlug}
        shipsNovaPoshta={shipsNovaPoshta}
        isAuth={isAuth}
        onClose={() => setCartOpen(false)}
        onQtyChange={setQty}
        onSuccess={() => { setCartOpen(false); setOrderDone(true); }}
        schedule={schedule}
      />
    </div>
  );
}

// ── ProductTile — клік відкриває DetailSheet ──────────────────────────────────

const CATEGORY_COLORS: Record<string, string> = {
  hair: '#A87C5C', nails: '#C2739A', skin: '#5FA89A',
  brows: '#8A7EC2', body: '#6DAB7F', tools: '#7F8FAB', other: '#A89F7C',
};

function ProductTile({ product: p, qty, onOpen }: {
  product: Product; qty: number; onOpen: () => void;
}) {
  const photo = p.photos[0] ?? null;
  const catColor = CATEGORY_COLORS[p.category] ?? '#A89F7C';

  return (
    <motion.button
      layout
      onClick={onOpen}
      className="flex flex-col overflow-hidden rounded-[22px] bg-white text-left w-full"
      style={{ boxShadow: '0 2px 16px rgba(44,26,20,0.08), 0 0 0 1px rgba(44,26,20,0.06)' }}
      whileTap={{ scale: 0.96 }}
    >
      <div className="relative w-full aspect-[4/3] overflow-hidden bg-[#F5EDE8]">
        {photo
          ? <Image src={photo} alt={p.name} fill className="object-cover" sizes="(max-width:640px) 50vw,220px" />
          : <div className="w-full h-full flex items-center justify-center"><Package size={36} className="text-[#C9AFA8]" /></div>
        }
        <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent pointer-events-none" />
        <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-bold text-white" style={{ background: `${catColor}dd`, backdropFilter: 'blur(4px)' }}>
          {CATEGORY_LABELS[p.category as ProductCategory]}
        </div>
        {p.stock_qty <= 0 && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <span className="px-2.5 py-1 rounded-full bg-black/60 text-white text-[11px] font-bold backdrop-blur-sm">Немає</span>
          </div>
        )}
        {qty > 0 && (
          <div className="absolute top-2 right-2 min-w-[22px] h-[22px] px-1.5 rounded-full bg-primary flex items-center justify-center">
            <span className="text-[10px] font-black text-white">{qty}</span>
          </div>
        )}
        {p.stock_qty > 0 && p.stock_qty <= 5 && qty === 0 && (
          <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded-full bg-warning/90 backdrop-blur-sm">
            <span className="text-[10px] font-bold text-white">Залишок: {p.stock_qty}</span>
          </div>
        )}
      </div>
      <div className="flex flex-col gap-1 p-3">
        <p className="text-xs font-bold text-foreground leading-tight line-clamp-2">{p.name}</p>
        {p.description && <p className="text-[10px] text-muted-foreground/60 line-clamp-1">{p.description}</p>}
        <p className="text-base font-black text-foreground mt-0.5">{(p.price_kopecks / 100).toFixed(0)} ₴</p>
      </div>
    </motion.button>
  );
}

// ── ProductDetailSheet — marketplace-level detail ─────────────────────────────

function ProductDetailSheet({ product: p, qty, onClose, onAdd, onQtyChange }: {
  product: Product | null; qty: number;
  onClose: () => void;
  onAdd: (qty: number) => void;
  onQtyChange: (qty: number) => void;
}) {
  const [localQty, setLocalQty] = useState(1);
  const [photoIdx, setPhotoIdx] = useState(0);

  if (!p) return null;

  const photos = p.photos.length > 0 ? p.photos : [];
  const currentPhoto = photos[photoIdx] ?? null;
  const catColor = CATEGORY_COLORS[p.category] ?? '#A89F7C';
  const price = (p.price_kopecks / 100).toFixed(0);
  const inCart = qty > 0;

  function handleAddToCart() {
    onAdd(localQty);
    setLocalQty(1);
    setPhotoIdx(0);
  }

  return (
    <AnimatePresence>
      {p && (
        <>
          <motion.div
            className="fixed inset-0 bg-black/50 md:bg-black/5 z-40 backdrop-blur-[2px] md:backdrop-blur-sm"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="fixed bottom-0 left-0 right-0 z-50 max-w-lg mx-auto bg-[#FFF8F5] rounded-t-[28px] flex flex-col max-h-[92dvh] overflow-hidden"
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 360, damping: 34 }}
          >
            {/* Drag handle */}
            <div className="pt-3 pb-2 flex justify-center shrink-0">
              <div className="w-10 h-1 bg-[#D4B9B0] rounded-full" />
            </div>

            {/* Close */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-black/10 backdrop-blur-sm flex items-center justify-center active:scale-95 transition-all"
            >
              <X size={16} className="text-foreground" />
            </button>

            <div className="flex-1 overflow-y-auto">
              {/* Photo gallery */}
              <div className="relative w-full aspect-square bg-[#F5EDE8] overflow-hidden group">
                {photos.length > 0 ? (
                  <motion.div
                    className="flex h-full"
                    animate={{ x: `-${photoIdx * 100}%` }}
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    drag="x"
                    dragConstraints={{ left: -(photos.length - 1) * 100, right: 0 }}
                    dragElastic={0.2}
                    onDragEnd={(e, { offset, velocity }) => {
                      const swipeThreshold = 50;
                      if (offset.x < -swipeThreshold && photoIdx < photos.length - 1) {
                        setPhotoIdx(p => p + 1);
                      } else if (offset.x > swipeThreshold && photoIdx > 0) {
                        setPhotoIdx(p => p - 1);
                      }
                    }}
                  >
                    {photos.map((ph, i) => (
                      <div key={i} className="relative w-full h-full shrink-0">
                        <Image
                          src={ph}
                          alt={p.name}
                          fill
                          className="object-cover pointer-events-none"
                          sizes="(max-width:640px) 100vw,512px"
                          priority={i === 0}
                        />
                      </div>
                    ))}
                  </motion.div>
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Package size={64} className="text-[#C9AFA8]" />
                  </div>
                )}

                {/* Navigation Arrows (Desktop) */}
                {photos.length > 1 && (
                  <>
                    <button
                      onClick={(e) => { e.stopPropagation(); setPhotoIdx(p => (p - 1 + photos.length) % photos.length); }}
                      className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 shadow-lg flex items-center justify-center text-foreground opacity-0 group-hover:opacity-100 transition-all hover:scale-110 active:scale-90 z-20 hidden md:flex"
                    >
                      <ChevronLeft size={24} />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); setPhotoIdx(p => (p + 1) % photos.length); }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 shadow-lg flex items-center justify-center text-foreground opacity-0 group-hover:opacity-100 transition-all hover:scale-110 active:scale-90 z-20 hidden md:flex"
                    >
                      <ChevronRight size={24} />
                    </button>
                  </>
                )}

                {/* Category badge */}
                <div className="absolute top-4 left-4 px-3 py-1.5 rounded-full text-xs font-bold text-white z-20" style={{ background: `${catColor}ee`, backdropFilter: 'blur(6px)' }}>
                  {CATEGORY_LABELS[p.category as ProductCategory]}
                </div>

                {/* Photo dots */}
                {photos.length > 1 && (
                  <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-1.5 z-20">
                    {photos.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setPhotoIdx(i)}
                        className="w-2 h-2 rounded-full transition-all"
                        style={{ background: i === photoIdx ? '#2C1A14' : 'rgba(44,26,20,0.3)' }}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Thumbnail row */}
              {photos.length > 1 && (
                <div className="flex gap-2 px-4 pt-3 overflow-x-auto scrollbar-hide">
                  {photos.map((ph, i) => (
                    <button
                      key={i}
                      onClick={() => setPhotoIdx(i)}
                      className="relative shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 transition-all"
                      style={{ borderColor: i === photoIdx ? '#2C1A14' : 'transparent' }}
                    >
                      <Image src={ph} alt="" fill className="object-cover" sizes="64px" />
                    </button>
                  ))}
                </div>
              )}

              {/* Info */}
              <div className="px-5 pt-4 pb-28 flex flex-col gap-4">
                <div>
                  <h2 className="text-xl font-black text-foreground leading-tight">{p.name}</h2>
                  <p className="text-2xl font-black text-foreground mt-2">{price} ₴</p>
                  {p.stock_qty > 0 && p.stock_qty <= 10 && (
                    <p className="text-xs text-warning font-semibold mt-1">⚡ Залишилось {p.stock_qty} шт</p>
                  )}
                  {p.stock_qty <= 0 && (
                    <p className="text-xs text-destructive font-semibold mt-1">Немає в наявності</p>
                  )}
                </div>

                {p.description && (
                  <div>
                    <p className="text-xs font-bold text-muted-foreground/60 uppercase tracking-wider mb-1.5">Про товар</p>
                    <p className="text-sm text-muted-foreground leading-relaxed">{p.description}</p>
                  </div>
                )}

                {/* Qty + Cart CTA */}
                {p.stock_qty > 0 && (
                  <div className="flex flex-col gap-3">
                    {!inCart ? (
                      <>
                        {/* Local qty stepper */}
                        <div className="flex items-center gap-3">
                          <p className="text-xs font-semibold text-muted-foreground">Кількість</p>
                          <div className="flex items-center rounded-2xl overflow-hidden border" style={{ background: '#F5E8E3', borderColor: 'rgba(44,26,20,0.10)' }}>
                            <button onClick={() => setLocalQty(q => Math.max(1, q - 1))} className="w-10 h-10 flex items-center justify-center text-muted-foreground active:bg-secondary/80 transition-colors">
                              <Minus size={15} />
                            </button>
                            <span className="w-8 text-center font-black text-foreground">{localQty}</span>
                            <button onClick={() => setLocalQty(q => Math.min(p.stock_qty, q + 1))} disabled={localQty >= p.stock_qty} className="w-10 h-10 flex items-center justify-center text-foreground active:bg-secondary/80 transition-colors disabled:opacity-30">
                              <Plus size={15} />
                            </button>
                          </div>
                          <p className="text-xs text-muted-foreground/60 ml-auto">{((p.price_kopecks * localQty) / 100).toFixed(0)} ₴</p>
                        </div>
                        <motion.button
                          onClick={handleAddToCart}
                          whileTap={{ scale: 0.97 }}
                          className="w-full py-4 rounded-2xl bg-foreground text-white font-bold text-base flex items-center justify-center gap-2"
                          style={{ boxShadow: '0 8px 24px rgba(44,26,20,0.30)' }}
                        >
                          <ShoppingBag size={18} /> В кошик · {((p.price_kopecks * localQty) / 100).toFixed(0)} ₴
                        </motion.button>
                      </>
                    ) : (
                      <>
                        <p className="text-xs font-semibold text-success flex items-center gap-1.5">
                          <Check size={14} /> У кошику: {qty} шт
                        </p>
                        <div className="flex items-center gap-3">
                          <div className="flex items-center rounded-2xl overflow-hidden border flex-1" style={{ background: '#F5E8E3', borderColor: 'rgba(44,26,20,0.10)' }}>
                            <button onClick={() => onQtyChange(qty - 1)} className="w-10 h-10 flex items-center justify-center text-muted-foreground active:bg-secondary/80 transition-colors">
                              <Minus size={15} />
                            </button>
                            <span className="flex-1 text-center font-black text-foreground">{qty}</span>
                            <button onClick={() => qty < p.stock_qty ? onQtyChange(qty + 1) : undefined} disabled={qty >= p.stock_qty} className="w-10 h-10 flex items-center justify-center text-foreground active:bg-secondary/80 transition-colors disabled:opacity-30">
                              <Plus size={15} />
                            </button>
                          </div>
                          <button onClick={() => { onQtyChange(0); onClose(); }} className="px-4 py-3 rounded-2xl border border-foreground/20 text-foreground text-sm font-semibold">
                            Видалити
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

import { useRef } from 'react';

// ── CartDrawer ────────────────────────────────────────────────────────────────

function CartDrawer({ open, cart, masterId, masterSlug, shipsNovaPoshta, isAuth, onClose, onQtyChange, onSuccess, schedule }: {
  open: boolean; cart: CartItem[];
  masterId: string; masterSlug: string;
  shipsNovaPoshta: boolean; isAuth: boolean;
  onClose: () => void;
  onQtyChange: (id: string, qty: number) => void;
  onSuccess: () => void;
  schedule?: any[];
}) {
  const [delivery, setDelivery]   = useState<'pickup' | 'nova_poshta'>('pickup');
  const [address, setAddress]     = useState('');
  const [note, setNote]           = useState('');
  const [name, setName]           = useState('');
  const [phone, setPhone]         = useState('+380');
  const [pickupDate, setPickupDate] = useState<string | null>(null);
  const [error, setError]         = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const total = cart.reduce((s, i) => s + i.product.price_kopecks * i.qty, 0);

  function handlePhoneChange(val: string) {
    if (!val.startsWith('+380')) {
      if (val.length < 4) setPhone('+380');
      return;
    }
    // Only digits after prefix
    const suffix = val.slice(4).replace(/\D/g, '');
    if (suffix.length <= 9) setPhone('+380' + suffix);
  }

  function handleOrder() {
    if (!isAuth && (!name.trim() || !phone.trim())) {
      setError("Вкажіть ім'я та номер телефону"); return;
    }
    if (delivery === 'nova_poshta' && !address.trim()) {
      setError('Вкажіть адресу Нової Пошти'); return;
    }
    if (delivery === 'pickup' && !pickupDate) {
      setError('Оберіть дату самовивозу'); return;
    }
    setError(null);
    startTransition(async () => {
      const res = await createOrder({
        master_id:        masterId,
        delivery_type:    delivery,
        delivery_address: delivery === 'nova_poshta' ? address.trim() : null,
        note:             note.trim() || null,
        client_name:      isAuth ? null : name.trim(),
        client_phone:     isAuth ? null : phone.trim(),
        pickup_at:        delivery === 'pickup' ? pickupDate : null,
        items: cart.map(i => ({ product_id: i.product.id, qty: i.qty })),
      });
      if (res.error) { setError(res.error); return; }
      onSuccess();
    });
  }

  // Generate next 7 days for pickup
  const nextDays = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const dayNames = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const;
    const dayKey = dayNames[d.getDay()];
    const templ = schedule?.find(s => s.day_of_week === dayKey);
    return {
      date: d.toISOString().split('T')[0],
      label: d.toLocaleDateString('uk-UA', { weekday: 'short', day: 'numeric', month: 'short' }),
      isWorking: templ?.is_working ?? false,
      hours: templ?.is_working ? `${templ.start_time.slice(0, 5)} - ${templ.end_time.slice(0, 5)}` : 'Вихідний',
      fullDate: d,
    };
  });

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div className="fixed inset-0 bg-black/30 z-40" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
          <motion.div
            className="fixed bottom-0 left-0 right-0 z-50 bg-[#FFF8F5] rounded-t-3xl max-w-lg mx-auto flex flex-col max-h-[90dvh]"
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 380, damping: 32 }}
          >
            <div className="pt-3 pb-1 flex justify-center shrink-0">
              <div className="w-10 h-1 bg-[#D4B9B0] rounded-full" />
            </div>

            <div className="flex items-center justify-between px-5 py-3 shrink-0">
              <h2 className="text-base font-bold text-foreground">Оформлення замовлення</h2>
              <button onClick={onClose} className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-muted-foreground active:scale-95 transition-all">
                <X size={16} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 pb-28 flex flex-col gap-5">
              {/* Cart items summary */}
              <div className="flex flex-col gap-2">
                <p className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-wider">Товари</p>
                {cart.map(item => (
                  <div key={item.product.id} className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg overflow-hidden bg-secondary shrink-0">
                      {item.product.photos[0] && <Image src={item.product.photos[0]} alt="" width={40} height={40} className="object-cover w-full h-full" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-foreground truncate">{item.product.name}</p>
                      <p className="text-[10px] text-muted-foreground/60">{item.qty} шт × {(item.product.price_kopecks / 100).toFixed(0)} ₴</p>
                    </div>
                    <p className="text-xs font-bold text-foreground">
                      {((item.product.price_kopecks * item.qty) / 100).toFixed(0)} ₴
                    </p>
                  </div>
                ))}
              </div>

              {/* Contact info if not auth */}
              {!isAuth && (
                <div className="flex flex-col gap-3">
                  <p className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-wider">Ваші контакти</p>
                  <div className="flex flex-col gap-2">
                    <div className="relative">
                      <User size={16} className="absolute left-4 top-3.5 text-muted-foreground/60" />
                      <input
                        type="text"
                        placeholder="Ваше ім'я"
                        value={name}
                        onChange={e => setName(e.target.value)}
                        className="w-full pl-11 pr-4 py-3 rounded-2xl bg-white border border-white/80 text-sm text-foreground outline-none focus:border-primary/50 shadow-sm"
                      />
                    </div>
                    <div className="relative">
                      <Phone size={16} className="absolute left-4 top-3.5 text-muted-foreground/60" />
                      <input
                        type="tel"
                        placeholder="Номер телефону"
                        value={phone}
                        onChange={e => handlePhoneChange(e.target.value)}
                        className="w-full pl-11 pr-4 py-3 rounded-2xl bg-white border border-white/80 text-sm text-foreground outline-none focus:border-primary/50 shadow-sm"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Delivery / Pickup */}
              <div className="flex flex-col gap-3">
                <p className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-wider">Спосіб отримання</p>
                <div className="flex gap-2">
                  <DeliveryBtn
                    active={delivery === 'pickup'}
                    onClick={() => setDelivery('pickup')}
                    icon={<MapPin size={15} />}
                    label="Самовивіз"
                  />
                  {shipsNovaPoshta && (
                    <DeliveryBtn
                      active={delivery === 'nova_poshta'}
                      onClick={() => setDelivery('nova_poshta')}
                      icon={<Truck size={15} />}
                      label="Нова Пошта"
                    />
                  )}
                </div>

                {delivery === 'pickup' ? (
                  <div className="flex flex-col gap-3">
                    <p className="text-[11px] text-muted-foreground flex items-center gap-1.5 px-1">
                      <CalendarDays size={14} className="text-primary" /> Оберіть зручний день
                    </p>
                    
                    <div className="relative group">
                      {/* Arrows */}
                      <button 
                        onClick={() => { const el = document.getElementById('day-slider'); el?.scrollBy({ left: -120, behavior: 'smooth' }); }}
                        className="absolute -left-2 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-white/90 shadow-md flex items-center justify-center text-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <ChevronLeft size={16} />
                      </button>
                      <button 
                        onClick={() => { const el = document.getElementById('day-slider'); el?.scrollBy({ left: 120, behavior: 'smooth' }); }}
                        className="absolute -right-2 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-white/90 shadow-md flex items-center justify-center text-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <ChevronRight size={16} />
                      </button>

                      <div 
                        id="day-slider"
                        className="flex gap-2 overflow-x-auto pb-4 pt-1 scrollbar-hide px-1 snap-x"
                      >
                        {nextDays.map(d => (
                          <button
                            key={d.date}
                            disabled={!d.isWorking}
                            onClick={() => setPickupDate(d.date)}
                            className={cn(
                              'shrink-0 flex flex-col items-center justify-center w-24 h-24 rounded-2xl border transition-all snap-start',
                              pickupDate === d.date
                                ? 'bg-foreground border-foreground text-white shadow-lg shadow-[#2C1A14]/20 scale-[1.02]'
                                : d.isWorking
                                  ? 'bg-white border-white/80 text-foreground hover:border-primary'
                                  : 'bg-secondary/30 border-transparent text-muted-foreground/60 opacity-50 cursor-not-allowed'
                            )}
                          >
                            <span className="text-[10px] uppercase font-bold opacity-70 mb-0.5">{d.label.split(' ')[0]}</span>
                            <span className="text-base font-black">{d.label.split(' ')[1]}</span>
                            <span className="text-[10px] mt-1.5 font-bold tabular-nums">{d.hours}</span>
                          </button>
                        ))}
                      </div>

                      {/* Pagination Pills */}
                      <div className="flex justify-center gap-1 mt-1">
                        {nextDays.map((d, i) => (
                          <div 
                            key={i} 
                            className={cn(
                              "w-1.5 h-1.5 rounded-full transition-all",
                              pickupDate === d.date ? "bg-foreground w-3" : "bg-[#D4B9B0]/40"
                            )} 
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <input
                    type="text"
                    placeholder="Місто, відділення або адреса"
                    value={address}
                    onChange={e => setAddress(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl bg-white border border-white/80 text-sm text-foreground outline-none focus:border-primary/50 shadow-sm"
                  />
                )}
              </div>

              {/* Note */}
              <input
                type="text"
                placeholder="Примітка (необов'язково)"
                value={note}
                onChange={e => setNote(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl bg-white border border-white/80 text-sm text-foreground outline-none focus:border-primary/50 shadow-sm"
              />

              {/* Total & Action */}
              <div className="mt-auto pt-4 flex flex-col gap-4">
                <div className="flex items-center justify-between px-1">
                  <span className="text-sm font-medium text-muted-foreground">До сплати</span>
                  <span className="text-2xl font-black text-foreground">{(total / 100).toFixed(0)} ₴</span>
                </div>

                {error && <p className="text-xs text-destructive bg-destructive/5 py-2 px-3 rounded-xl border border-destructive/10">{error}</p>}

                <button
                  onClick={handleOrder}
                  disabled={isPending || cart.length === 0}
                  className="w-full py-4 rounded-2xl bg-foreground text-white font-bold text-base flex items-center justify-center gap-2 disabled:opacity-50 active:scale-[0.98] transition-all shadow-lg shadow-[#2C1A14]/20"
                >
                  {isPending
                    ? <><Loader2 size={18} className="animate-spin" /> Обробка...</>
                    : <>Підтвердити замовлення</>
                  }
                </button>
                <p className="text-[10px] text-muted-foreground/60 text-center">
                  Оплата готівкою або картою при отриманні
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ── Order Success ─────────────────────────────────────────────────────────────

function OrderSuccess({ masterSlug, masterName }: { masterSlug: string; masterName: string }) {
  return (
    <div className="max-w-lg mx-auto px-4 py-24 flex flex-col items-center gap-5 text-center">
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        className="w-20 h-20 rounded-full bg-success/15 flex items-center justify-center"
      >
        <CheckCircle2 size={40} className="text-success" />
      </motion.div>
      <div>
        <h2 className="heading-serif text-2xl text-foreground mb-2">Замовлення прийнято!</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {masterName} отримав ваше замовлення і невдовзі зв'яжеться з вами для підтвердження.
        </p>
      </div>
      <Link
        href={`/${masterSlug}`}
        className="mt-2 inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-colors shadow-lg shadow-[#789A99]/20"
      >
        <ArrowLeft size={16} /> Назад до майстра
      </Link>
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function FilterChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'shrink-0 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all',
        active ? 'bg-foreground text-white' : 'bg-white/70 text-muted-foreground border border-white/70 hover:bg-white'
      )}
    >
      {children}
    </button>
  );
}

function DeliveryBtn({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-medium transition-all border',
        active
          ? 'bg-primary text-white border-primary'
          : 'bg-white/60 text-muted-foreground border-white/80 hover:bg-white/80'
      )}
    >
      {icon} {label}
    </button>
  );
}

function EmptyShop({ masterSlug }: { masterSlug: string }) {
  return (
    <div className="col-span-2 bento-card p-10 flex flex-col items-center gap-3 text-center">
      <Package size={32} className="text-muted-foreground/60" />
      <p className="text-sm font-semibold text-foreground">Товарів поки немає</p>
      <Link href={`/${masterSlug}`} className="text-xs text-primary hover:underline flex items-center gap-1">
        <ArrowLeft size={12} /> Повернутись
      </Link>
    </div>
  );
}
