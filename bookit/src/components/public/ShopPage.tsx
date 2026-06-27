'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import type { Product, ProductCategory } from '@/types/database';
import { useState } from 'react';
import { cn } from '@/lib/utils/cn';
import { ProductIcon } from '@/lib/product-icons';
import { ScrollStrip } from '@/components/shared/ScrollStrip';
import { ShopCartBar } from '@/components/public/shop/ShopCartBar';
import { useShopCart } from '@/components/public/shop/ShopCartContext';

const CATEGORY_LABELS: Record<ProductCategory, string> = {
  hair:  'Волосся', nails: 'Нігті',  skin:  'Шкіра',
  brows: 'Брови',   body:  'Тіло',   tools: 'Інструменти', other: 'Інше',
};

const CATEGORY_COLORS: Record<string, string> = {
  hair: 'var(--cat-hair)', nails: 'var(--cat-nails)', skin: 'var(--cat-skin)',
  brows: 'var(--cat-brows)', body: 'var(--cat-body)', tools: 'var(--cat-tools)', other: 'var(--cat-other)',
};

interface Props {
  masterId:        string;
  masterSlug:      string;
  masterName:      string;
  shipsNovaPoshta: boolean;
  products:        Product[];
  isAuth:          boolean;
  workingHours?:   unknown;
  schedule?:       { day_of_week: string; is_working: boolean; start_time: string; end_time: string }[];
}

export function ShopPage({ masterId, masterSlug, masterName, shipsNovaPoshta, products, isAuth, schedule }: Props) {
  const { getQty } = useShopCart();
  const [catFilter, setCatFilter] = useState<ProductCategory | null>(null);

  const categories = [...new Set(products.map(p => p.category))] as ProductCategory[];
  const filtered   = catFilter ? products.filter(p => p.category === catFilter) : products;

  return (
    <div className="max-w-lg mx-auto px-4 py-6 pb-32 flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center gap-3 pt-2">
        <Link
          href={`/${masterSlug}`}
          aria-label="Назад до майстра"
          className="size-9 rounded-lg bg-secondary/70 border border-border flex items-center justify-center text-muted-foreground hover:bg-secondary active:scale-[0.95] transition-all cursor-pointer shrink-0"
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
        <ScrollStrip className="flex gap-2 pb-1">
          <FilterChip active={catFilter === null} onClick={() => setCatFilter(null)}>Всі</FilterChip>
          {categories.map(c => (
            <FilterChip key={c} active={catFilter === c} onClick={() => setCatFilter(c)}>
              {CATEGORY_LABELS[c]}
            </FilterChip>
          ))}
        </ScrollStrip>
      )}

      {/* Product grid */}
      {products.length === 0 ? (
        <EmptyShop masterSlug={masterSlug} />
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {filtered.map(p => (
            <ProductTile key={p.id} product={p} qty={getQty(p.id)} masterSlug={masterSlug} />
          ))}
        </div>
      )}

      <ShopCartBar
        masterId={masterId}
        masterSlug={masterSlug}
        masterName={masterName}
        shipsNovaPoshta={shipsNovaPoshta}
        isAuth={isAuth}
        schedule={schedule}
      />
    </div>
  );
}

// ── ProductTile — links to the product page ───────────────────────────────────

function ProductTile({ product: p, qty, masterSlug }: { product: Product; qty: number; masterSlug: string }) {
  const photo    = p.photos[0] ?? null;
  const catColor = CATEGORY_COLORS[p.category] ?? 'var(--cat-other)';

  return (
    <Link
      href={`/${masterSlug}/shop/${p.id}`}
      className="flex flex-col overflow-hidden rounded-xl bg-secondary border border-border/40 text-left w-full shadow-sm active:scale-[0.97] cursor-pointer transition-all"
    >
      <div className="relative w-full aspect-[4/3] overflow-hidden bg-secondary">
        {photo
          ? <Image src={photo} alt={p.name} fill className="object-cover" sizes="(max-width:640px) 50vw,220px" />
          : <div className="w-full h-full flex items-center justify-center"><ProductIcon name={p.icon_name} size={32} className="text-muted-foreground" /></div>
        }
        <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent pointer-events-none" />
        <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-bold text-white" style={{ background: `color-mix(in srgb, ${catColor} 87%, transparent)`, backdropFilter: 'blur(4px)' }}>
          {CATEGORY_LABELS[p.category]}
        </div>
        {p.stock_qty <= 0 && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <span className="px-2.5 py-1 rounded-full bg-black/60 text-white text-[11px] font-bold backdrop-blur-sm">Немає</span>
          </div>
        )}
        {qty > 0 && (
          <div className="absolute top-2 right-2 min-w-[22px] h-[22px] px-1.5 rounded-full bg-primary flex items-center justify-center">
            <span className="text-[10px] font-bold text-white tabular-nums">{qty}</span>
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
        <p className="text-base font-bold text-foreground mt-0.5">{(p.price_kopecks / 100).toFixed(0)} ₴</p>
      </div>
    </Link>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function FilterChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'shrink-0 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all',
        active
          ? 'bg-primary text-primary-foreground active:scale-[0.95] cursor-pointer'
          : 'bg-secondary/70 text-muted-foreground border border-border hover:bg-secondary active:scale-[0.95] cursor-pointer'
      )}
    >
      {children}
    </button>
  );
}

function EmptyShop({ masterSlug }: { masterSlug: string }) {
  return (
    <div className="col-span-2 bento-card p-10 flex flex-col items-center gap-3 text-center">
      <ProductIcon name="package" size={28} className="text-muted-foreground/60" />
      <p className="text-sm font-semibold text-foreground">Товарів поки немає</p>
      <Link href={`/${masterSlug}`} className="text-xs text-primary hover:underline flex items-center gap-1">
        <ArrowLeft size={12} /> Повернутись
      </Link>
    </div>
  );
}
