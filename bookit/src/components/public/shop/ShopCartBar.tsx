'use client';

import { useState, useTransition, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShoppingBag, X, ArrowLeft, MapPin, Truck, ChevronRight, ChevronLeft,
  CheckCircle2, Minus, Plus, User, Phone, CalendarDays,
} from 'lucide-react';
import { createOrder } from '@/app/(master)/dashboard/products/actions';
import { cn } from '@/lib/utils/cn';
import { useShopCart } from './ShopCartContext';
import { Button } from '@/components/ui/Button';

const CART_SPRING    = { type: 'spring' as const, stiffness: 380, damping: 32 } as const;
const SUCCESS_SPRING = { type: 'spring' as const, stiffness: 300, damping: 20 } as const;

interface Props {
  masterId:        string;
  masterSlug:      string;
  masterName:      string;
  shipsNovaPoshta: boolean;
  isAuth:          boolean;
  schedule?:       { day_of_week: string; is_working: boolean; start_time: string; end_time: string }[];
}

/**
 * Shared cart surface — sticky cart button + checkout drawer + success state.
 * Reads the cart from ShopCartContext, so it works identically on the catalog
 * and on a product page. Only one instance is mounted at a time (one active route).
 */
export function ShopCartBar({ masterId, masterSlug, masterName, shipsNovaPoshta, isAuth, schedule }: Props) {
  const { count, total, clear } = useShopCart();
  const [cartOpen, setCartOpen] = useState(false);
  const [orderDone, setOrderDone] = useState(false);

  if (orderDone) return <OrderSuccess masterSlug={masterSlug} masterName={masterName} />;

  return (
    <>
      <AnimatePresence>
        {count > 0 && (
          <motion.div
            className="fixed bottom-0 left-0 right-0 z-40 px-4 pb-28 pt-3 bg-gradient-to-t from-background via-background/90 to-transparent pointer-events-none"
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
          >
            <button
              type="button"
              onClick={() => setCartOpen(true)}
              className="pointer-events-auto w-full max-w-lg mx-auto flex items-center justify-between px-5 py-4 rounded-lg bg-primary text-primary-foreground shadow-lg shadow-primary/20 active:scale-[0.95] transition-all cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <div className="relative">
                  <ShoppingBag size={20} />
                  <span className="absolute -top-1.5 -right-1.5 size-4 rounded-full bg-primary text-[9px] font-bold flex items-center justify-center">
                    {count}
                  </span>
                </div>
                <span className="text-sm font-semibold">Кошик</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-bold">{(total / 100).toFixed(0)} ₴</span>
                <ChevronRight size={16} className="opacity-60" />
              </div>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <CartDrawer
        open={cartOpen}
        masterId={masterId}
        shipsNovaPoshta={shipsNovaPoshta}
        isAuth={isAuth}
        onClose={() => setCartOpen(false)}
        onSuccess={() => { setCartOpen(false); clear(); setOrderDone(true); }}
        schedule={schedule}
      />
    </>
  );
}

// ── CartDrawer ────────────────────────────────────────────────────────────────

function CartDrawer({ open, masterId, shipsNovaPoshta, isAuth, onClose, onSuccess, schedule }: {
  open: boolean;
  masterId: string;
  shipsNovaPoshta: boolean; isAuth: boolean;
  onClose: () => void;
  onSuccess: () => void;
  schedule?: { day_of_week: string; is_working: boolean; start_time: string; end_time: string }[];
}) {
  const { items: cart, setQty, total } = useShopCart();
  const [delivery, setDelivery]      = useState<'pickup' | 'nova_poshta'>('pickup');
  const [address, setAddress]        = useState('');
  const [note, setNote]              = useState('');
  const [name, setName]              = useState('');
  const [phone, setPhone]            = useState('+380');
  const [pickupDate, setPickupDate]  = useState<string | null>(null);
  const [error, setError]            = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const sliderRef                    = useRef<HTMLDivElement>(null);

  function handlePhoneChange(val: string) {
    if (!val.startsWith('+380')) {
      if (val.length < 4) setPhone('+380');
      return;
    }
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

  const nextDays = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const dayNames = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const;
    const dayKey   = dayNames[d.getDay()];
    const templ    = schedule?.find(s => s.day_of_week === dayKey);
    return {
      date:      d.toISOString().split('T')[0],
      label:     d.toLocaleDateString('uk-UA', { weekday: 'short', day: 'numeric', month: 'short' }),
      isWorking: templ?.is_working ?? false,
      hours:     templ?.is_working ? `${templ.start_time.slice(0, 5)} - ${templ.end_time.slice(0, 5)}` : 'Вихідний',
    };
  });

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 bg-black/30 z-40"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="fixed bottom-0 left-0 right-0 z-50 bg-background rounded-t-xl max-w-lg mx-auto flex flex-col max-h-[90dvh]"
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            transition={CART_SPRING}
          >
            <div className="pt-3 pb-1 flex justify-center shrink-0">
              <div className="w-10 h-1 bg-border rounded-full" />
            </div>

            <div className="flex items-center justify-between px-5 py-3 shrink-0">
              <h2 className="text-base font-bold text-foreground">Оформлення замовлення</h2>
              <button
                type="button"
                aria-label="Закрити"
                onClick={onClose}
                className="size-8 rounded-full bg-secondary flex items-center justify-center text-text-sub active:scale-[0.95] transition-all cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 pb-28 flex flex-col gap-5">
              {/* Cart items summary */}
              <div className="flex flex-col gap-2">
                <p className="text-xs font-bold text-foreground">Товари</p>
                {cart.map(item => (
                  <div key={item.product.id} className="flex items-center gap-3">
                    <div className="size-10 rounded-lg overflow-hidden bg-secondary shrink-0">
                      {item.product.photos[0] && <Image src={item.product.photos[0]} alt="" width={40} height={40} className="object-cover w-full h-full" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-foreground truncate">{item.product.name}</p>
                      <p className="text-[10px] text-text-sub">{item.qty} шт × {(item.product.price_kopecks / 100).toFixed(0)} ₴</p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        aria-label="Зменшити кількість"
                        onClick={() => setQty(item.product.id, item.qty - 1)}
                        className="size-7 rounded-md bg-secondary flex items-center justify-center text-text-sub active:scale-[0.95] transition-all"
                      >
                        <Minus size={13} />
                      </button>
                      <span className="w-6 text-center text-xs font-bold text-foreground tabular-nums">{item.qty}</span>
                      <button
                        type="button"
                        aria-label="Збільшити кількість"
                        onClick={() => item.qty < item.product.stock_qty ? setQty(item.product.id, item.qty + 1) : undefined}
                        disabled={item.qty >= item.product.stock_qty}
                        className="size-7 rounded-md bg-secondary flex items-center justify-center text-foreground active:scale-[0.95] transition-all disabled:opacity-30"
                      >
                        <Plus size={13} />
                      </button>
                    </div>
                    <p className="text-xs font-bold text-foreground w-14 text-right shrink-0">
                      {((item.product.price_kopecks * item.qty) / 100).toFixed(0)} ₴
                    </p>
                  </div>
                ))}
              </div>

              {/* Contact info if not auth */}
              {!isAuth && (
                <div className="flex flex-col gap-3">
                  <p className="text-xs font-bold text-foreground">Ваші контакти</p>
                  <div className="flex flex-col gap-2">
                    <div className="relative">
                      <User size={16} className="absolute left-4 top-3.5 text-text-sub" />
                      <input
                        type="text"
                        placeholder="Ваше ім'я"
                        value={name}
                        onChange={e => setName(e.target.value)}
                        aria-label="Ваше ім'я"
                        className="w-full pl-11 pr-4 py-3 rounded-md bg-secondary border border-border text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 shadow-sm transition-all"
                      />
                    </div>
                    <div className="relative">
                      <Phone size={16} className="absolute left-4 top-3.5 text-text-sub" />
                      <input
                        type="tel"
                        placeholder="Номер телефону"
                        value={phone}
                        onChange={e => handlePhoneChange(e.target.value)}
                        aria-label="Номер телефону"
                        className="w-full pl-11 pr-4 py-3 rounded-md bg-secondary border border-border text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 shadow-sm transition-all"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Delivery / Pickup */}
              <div className="flex flex-col gap-3">
                <p className="text-xs font-bold text-foreground">Спосіб отримання</p>
                <div className="flex gap-2">
                  <DeliveryBtn active={delivery === 'pickup'} onClick={() => setDelivery('pickup')} icon={<MapPin size={15} />} label="Самовивіз" />
                  {shipsNovaPoshta && (
                    <DeliveryBtn active={delivery === 'nova_poshta'} onClick={() => setDelivery('nova_poshta')} icon={<Truck size={15} />} label="Нова Пошта" />
                  )}
                </div>

                {delivery === 'pickup' ? (
                  <div className="flex flex-col gap-3">
                    <p className="text-[11px] text-text-sub flex items-center gap-1.5 px-1">
                      <CalendarDays size={14} className="text-primary" /> Оберіть зручний день
                    </p>

                    <div className="relative group">
                      <button
                        type="button"
                        aria-label="Прокрутити назад"
                        onClick={() => sliderRef.current?.scrollBy({ left: -120, behavior: 'smooth' })}
                        className="absolute -left-2 top-1/2 -translate-y-1/2 z-10 size-8 rounded-full bg-secondary/90 shadow-md flex items-center justify-center text-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <ChevronLeft size={16} />
                      </button>
                      <button
                        type="button"
                        aria-label="Прокрутити вперед"
                        onClick={() => sliderRef.current?.scrollBy({ left: 120, behavior: 'smooth' })}
                        className="absolute -right-2 top-1/2 -translate-y-1/2 z-10 size-8 rounded-full bg-secondary/90 shadow-md flex items-center justify-center text-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <ChevronRight size={16} />
                      </button>

                      <div ref={sliderRef} className="flex gap-2 overflow-x-auto pb-4 pt-1 scrollbar-hide px-1 snap-x">
                        {nextDays.map(d => (
                          <button
                            type="button"
                            key={d.date}
                            disabled={!d.isWorking}
                            aria-pressed={pickupDate === d.date}
                            onClick={() => setPickupDate(d.date)}
                            className={cn(
                              'shrink-0 flex flex-col items-center justify-center size-24 rounded-xl border transition-all snap-start',
                              pickupDate === d.date
                                ? 'bg-primary border-primary text-primary-foreground shadow-lg shadow-primary/20 scale-[1.02] active:scale-[0.95] cursor-pointer'
                                : d.isWorking
                                  ? 'bg-secondary border-border text-foreground hover:border-primary active:scale-[0.95] cursor-pointer'
                                  : 'bg-secondary/30 border-transparent text-text-sub opacity-50 cursor-not-allowed'
                            )}
                          >
                            <span className="text-[10px] uppercase font-bold opacity-70 mb-0.5">{d.label.split(' ')[0]}</span>
                            <span className="text-base font-bold">{d.label.split(' ')[1]}</span>
                            <span className="text-[10px] mt-1.5 font-bold tabular-nums">{d.hours}</span>
                          </button>
                        ))}
                      </div>

                      <div className="flex justify-center gap-1 mt-1">
                        {nextDays.map((d, i) => (
                          <div
                            key={i}
                            className={cn('size-1.5 rounded-full transition-all', pickupDate === d.date ? 'bg-primary w-3' : 'bg-border/40')}
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
                    aria-label="Адреса доставки"
                    className="w-full px-4 py-3 rounded-md bg-secondary border border-border text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 shadow-sm transition-all"
                  />
                )}
              </div>

              {/* Note */}
              <input
                type="text"
                placeholder="Примітка (необов'язково)"
                value={note}
                onChange={e => setNote(e.target.value)}
                aria-label="Примітка до замовлення"
                className="w-full px-4 py-3 rounded-md bg-secondary border border-border text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 shadow-sm transition-all"
              />

              {/* Total & Action */}
              <div className="mt-auto pt-4 flex flex-col gap-4">
                <div className="flex items-center justify-between px-1">
                  <span className="text-sm font-medium text-text-sub">До сплати</span>
                  <span className="metric-value text-2xl text-foreground">{(total / 100).toFixed(0)} ₴</span>
                </div>

                {error && <p className="text-xs text-destructive bg-destructive/5 py-2 px-3 rounded-xl border border-destructive/10">{error}</p>}

                <Button
                  variant="primary"
                  size="lg"
                  fullWidth
                  onClick={handleOrder}
                  disabled={isPending || cart.length === 0}
                  isLoading={isPending}
                  className="shadow-lg"
                >
                  {isPending ? 'Обробка...' : 'Підтвердити замовлення'}
                </Button>
                <p className="text-[10px] text-text-sub text-center">
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

function OrderSuccess({ masterSlug, masterName }: { masterSlug: string; masterName: string }) {
  return (
    <div className="fixed inset-0 z-50 bg-background flex items-center justify-center px-4">
      <div className="max-w-lg w-full flex flex-col items-center gap-5 text-center">
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={SUCCESS_SPRING}
          className="size-20 rounded-full bg-success/15 flex items-center justify-center"
        >
          <CheckCircle2 size={40} className="text-success" />
        </motion.div>
        <div>
          <h2 className="heading-serif text-2xl text-foreground mb-2">Замовлення прийнято!</h2>
          <p className="text-sm text-text-sub leading-relaxed">
            {masterName} отримав ваше замовлення і невдовзі зв&apos;яжеться з вами для підтвердження.
          </p>
        </div>
        <Link
          href={`/${masterSlug}`}
          className="mt-2 inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 active:scale-[0.95] transition-all cursor-pointer shadow-lg shadow-primary/20"
        >
          <ArrowLeft size={16} /> Назад до майстра
        </Link>
      </div>
    </div>
  );
}

function DeliveryBtn({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-medium transition-all border active:scale-[0.95] cursor-pointer',
        active ? 'bg-primary text-primary-foreground border-primary' : 'bg-secondary/60 text-text-sub border-border hover:bg-secondary/80'
      )}
    >
      {icon} {label}
    </button>
  );
}
