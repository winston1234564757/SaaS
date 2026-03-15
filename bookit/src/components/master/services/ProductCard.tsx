'use client';

import { useState } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { Pencil, Trash2, Package } from 'lucide-react';
import { Tooltip } from '@/components/ui/Tooltip';
import { type Product, formatPrice } from './types';

interface ProductCardProps {
  product: Product;
  onEdit: (p: Product) => void;
  onDelete: (id: string) => void;
  onToggle: (id: string) => void;
  index: number;
}

export function ProductCard({ product, onEdit, onDelete, onToggle, index }: ProductCardProps) {
  const [confirmDelete, setConfirmDelete] = useState(false);

  const stockLabel = product.stock === null
    ? 'Необмежено'
    : product.stock === 0
    ? 'Немає в наявності'
    : `${product.stock} шт.`;

  const stockColor = product.stock === 0
    ? '#C05B5B'
    : product.stock !== null && product.stock <= 3
    ? '#D4935A'
    : '#5C9E7A';

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, type: 'spring', stiffness: 300, damping: 24 }}
      className={`bento-card p-4 transition-opacity ${!product.active ? 'opacity-55' : ''}`}
    >
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-2xl overflow-hidden flex-shrink-0" style={{ background: 'rgba(120, 154, 153, 0.12)' }}>
          {product.imageUrl ? (
            <Image src={product.imageUrl} alt={product.name} width={48} height={48} className="w-full h-full object-cover" unoptimized />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-2xl">{product.emoji}</div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-[#2C1A14]">{product.name}</p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <Package size={11} style={{ color: stockColor }} />
            <span className="text-xs" style={{ color: stockColor }}>{stockLabel}</span>
          </div>
        </div>

        <p className="text-base font-bold text-[#2C1A14] flex-shrink-0">{formatPrice(product.price)}</p>
      </div>

      <div className="flex items-center justify-between mt-3 pt-3 border-t border-[#F5E8E3]/60">
        <div className="flex items-center gap-1">
          <Tooltip content={<p className="text-[11px] text-[#2C1A14]">Редагувати товар</p>} position="top">
            <button
              onClick={() => onEdit(product)}
              className="w-8 h-8 flex items-center justify-center rounded-xl bg-white/70 border border-white/80 text-[#6B5750] hover:bg-white hover:text-[#789A99] transition-colors"
            >
              <Pencil size={14} />
            </button>
          </Tooltip>

          <AnimatePresence mode="wait">
            {confirmDelete ? (
              <motion.div
                key="confirm"
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                className="flex items-center gap-1 overflow-hidden"
              >
                <span className="text-xs text-[#C05B5B] font-medium whitespace-nowrap ml-1">Видалити?</span>
                <button onClick={() => onDelete(product.id)} className="px-2.5 h-7 rounded-lg bg-[#C05B5B] text-white text-xs font-semibold hover:bg-[#a84a4a] transition-colors">Так</button>
                <button onClick={() => setConfirmDelete(false)} className="px-2.5 h-7 rounded-lg bg-white/70 border border-white/80 text-xs font-medium text-[#6B5750] hover:bg-white transition-colors">Ні</button>
              </motion.div>
            ) : (
              <Tooltip key="btn" content={<p className="text-[11px] text-[#2C1A14]">Видалити товар</p>} position="top">
                <button
                  onClick={() => setConfirmDelete(true)}
                  className="w-8 h-8 flex items-center justify-center rounded-xl bg-white/70 border border-white/80 text-[#6B5750] hover:bg-[#C05B5B]/10 hover:text-[#C05B5B] hover:border-[#C05B5B]/20 transition-colors"
                >
                  <Trash2 size={14} />
                </button>
              </Tooltip>
            )}
          </AnimatePresence>
        </div>

        <Tooltip content={<p className="text-[11px] text-[#2C1A14]">{product.active ? 'Приховати товар' : 'Показати товар'}</p>} position="top">
          <button
            onClick={() => onToggle(product.id)}
            className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${product.active ? 'bg-[#789A99]' : 'bg-[#E8D5CF]'}`}
          >
            <motion.div
              animate={{ x: product.active ? 20 : 2 }}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              className="absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm"
            />
          </button>
        </Tooltip>
      </div>
    </motion.div>
  );
}
