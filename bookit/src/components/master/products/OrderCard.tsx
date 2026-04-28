'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, MapPin, Truck, Package, CalendarDays, ShoppingBag } from 'lucide-react';
import type { OrderStatus } from '@/types/database';
import type { UnifiedSale } from '@/lib/supabase/hooks/useOrders';
import { cn } from '@/lib/utils/cn';

const STATUS_CONFIG: Record<OrderStatus, { label: string; color: string; bg: string }> = {
  new:       { label: 'Нове',         color: 'text-[#D4935A]', bg: 'bg-[#D4935A]/10' },
  confirmed: { label: 'Підтверджено', color: 'text-[#789A99]', bg: 'bg-[#789A99]/10' },
  shipped:   { label: 'Відправлено',  color: 'text-[#5C9E7A]', bg: 'bg-[#5C9E7A]/10' },
  completed: { label: 'Завершено',    color: 'text-[#5C9E7A]', bg: 'bg-[#5C9E7A]/10' },
  cancelled: { label: 'Скасовано',    color: 'text-[#C05B5B]', bg: 'bg-[#C05B5B]/10' },
};

const NEXT_STATUSES: Record<OrderStatus, OrderStatus[]> = {
  new:       ['confirmed', 'cancelled'],
  confirmed: ['shipped', 'completed', 'cancelled'],
  shipped:   ['completed', 'cancelled'],
  completed: [],
  cancelled: [],
};

interface Props {
  order: UnifiedSale;
  onStatusChange: (status: OrderStatus) => void;
}

export function OrderCard({ order, onStatusChange }: Props) {
  const [expanded, setExpanded] = useState(false);
  const cfg = STATUS_CONFIG[order.status];
  const nextStatuses = order.source === 'shop' ? NEXT_STATUSES[order.status] : []; // booking status managed in bookings tab
  const totalUah = (order.total_kopecks / 100).toFixed(0);
  const shortId = order.id.slice(0, 8).toUpperCase();
  const dateStr = new Date(order.created_at).toLocaleDateString('uk-UA', {
    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
  });

  const clientLabel = order.client_name ?? order.client_phone ?? null;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="bento-card overflow-hidden"
    >
      {/* Main row */}
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full p-4 flex items-start gap-3 text-left"
      >
        {/* Source icon */}
        <div
          className={cn(
            'w-9 h-9 rounded-xl flex items-center justify-center shrink-0',
            order.source === 'booking' ? 'bg-[#789A99]/15' : 'bg-[#D4935A]/12',
          )}
        >
          {order.source === 'booking'
            ? <CalendarDays size={16} className="text-[#789A99]" />
            : <ShoppingBag  size={16} className="text-[#D4935A]" />
          }
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="text-xs font-mono text-[#A8928D]">#{shortId}</span>
            <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full', cfg.color, cfg.bg)}>
              {cfg.label}
            </span>
            {/* Source badge */}
            <span className={cn(
              'text-[10px] font-medium px-1.5 py-0.5 rounded-full',
              order.source === 'booking'
                ? 'bg-[#789A99]/12 text-[#789A99]'
                : 'bg-[#D4935A]/12 text-[#D4935A]',
            )}>
              {order.source === 'booking' ? 'Бронювання' : 'Магазин'}
            </span>
            {order.source === 'shop' && order.delivery_type === 'nova_poshta' && (
              <span className="text-[10px] text-[#6B5750] flex items-center gap-0.5">
                <Truck size={10} /> НП
              </span>
            )}
            {order.source === 'shop' && order.delivery_type === 'pickup' && (
              <span className="text-[10px] text-[#6B5750] flex items-center gap-0.5">
                <MapPin size={10} /> Самовивіз
              </span>
            )}
          </div>

          {/* Client label */}
          {clientLabel && (
            <p className="text-xs text-[#6B5750] font-medium mb-0.5">{clientLabel}</p>
          )}

          {/* Items preview */}
          <p className="text-xs text-[#6B5750] truncate">
            {order.items.map(i => `${i.product_name} ×${i.qty}`).join(', ')}
          </p>

          <div className="flex items-center justify-between mt-2">
            <span className="text-sm font-bold text-[#2C1A14]">{totalUah} ₴</span>
            <span className="text-[10px] text-[#A8928D]">{dateStr}</span>
          </div>
        </div>

        <ChevronDown
          size={16}
          className={cn('text-[#A8928D] shrink-0 mt-1 transition-transform', expanded && 'rotate-180')}
        />
      </button>

      {/* Expanded details */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 border-t border-[#F5E8E3] pt-3 flex flex-col gap-3">
              {/* Items list */}
              <div className="flex flex-col gap-2">
                {order.items.map(item => (
                  <div key={item.id} className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-[#F5E8E3] flex items-center justify-center shrink-0">
                      <Package size={14} className="text-[#A8928D]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-[#2C1A14] truncate">{item.product_name}</p>
                      <p className="text-[10px] text-[#A8928D]">
                        {item.qty} шт × {(item.price_kopecks / 100).toFixed(0)} ₴
                      </p>
                    </div>
                    <p className="text-xs font-semibold text-[#2C1A14] shrink-0">
                      {((item.price_kopecks * item.qty) / 100).toFixed(0)} ₴
                    </p>
                  </div>
                ))}
              </div>

              {/* Delivery address (shop only) */}
              {order.delivery_address && (
                <div className="flex items-start gap-2 px-3 py-2 rounded-xl bg-[#F5E8E3]">
                  <Truck size={13} className="text-[#A8928D] mt-0.5 shrink-0" />
                  <p className="text-xs text-[#6B5750]">{order.delivery_address}</p>
                </div>
              )}

              {/* Booking note */}
              {order.source === 'booking' && (
                <p className="text-[10px] text-[#A8928D] px-1">
                  ℹ️ Статус замовлення синхронізований з бронюванням. Змінюйте в розділі «Записи».
                </p>
              )}

              {/* Note */}
              {order.note && (
                <p className="text-xs text-[#6B5750] italic px-1">"{order.note}"</p>
              )}

              {/* Pickup Date */}
              {order.pickup_at && (
                <div className="flex items-start gap-2 px-3 py-2 rounded-xl bg-[#789A99]/5 border border-[#789A99]/10">
                  <CalendarDays size={13} className="text-[#789A99] mt-0.5 shrink-0" />
                  <div>
                    <p className="text-[10px] font-bold text-[#789A99] uppercase tracking-wider">Дата самовивозу</p>
                    <p className="text-xs text-[#2C1A14]">
                      {new Date(order.pickup_at).toLocaleDateString('uk-UA', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              )}

              {/* Status actions — only for shop orders */}
              {nextStatuses.length > 0 && (
                <div className="flex gap-2 flex-wrap">
                  {nextStatuses.map(s => {
                    const c = STATUS_CONFIG[s];
                    return (
                      <button
                        key={s}
                        onClick={() => onStatusChange(s)}
                        className={cn(
                          'flex-1 py-2 rounded-xl text-xs font-semibold transition-all active:scale-[0.97] border',
                          s === 'cancelled'
                            ? 'border-[#C05B5B]/30 text-[#C05B5B] bg-[#C05B5B]/8 hover:bg-[#C05B5B]/12'
                            : 'border-[#789A99]/30 text-[#789A99] bg-[#789A99]/8 hover:bg-[#789A99]/12',
                        )}
                      >
                        {c.label}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
