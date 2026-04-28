'use client';

import { useState } from 'react';
import { Plus, ExternalLink, Images, Lock } from 'lucide-react';
import { motion } from 'framer-motion';
import { usePortfolioItems, useInvalidatePortfolio } from '@/lib/supabase/hooks/usePortfolioItems';
import { PortfolioItemCard } from './PortfolioItemCard';
import { PortfolioItemEditor } from './PortfolioItemEditor';
import { pluralUk } from '@/lib/utils/pluralUk';
import type { PortfolioItemFull, SubscriptionTier } from '@/types/database';

const STARTER_LIMIT = 5;

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  client_name: string | null;
  created_at: string;
}

interface Client {
  id: string;
  full_name: string;
}

interface Service {
  id: string;
  name: string;
}

interface Props {
  initialItems: PortfolioItemFull[];
  tier: SubscriptionTier;
  masterSlug: string;
  masterId: string;
  services: Service[];
  reviews: Review[];
  clients: Client[];
}

export function PortfolioPage({ initialItems, tier, masterSlug, masterId, services, reviews, clients }: Props) {
  const { data: items = initialItems } = usePortfolioItems(initialItems);
  const invalidate = useInvalidatePortfolio();

  const [editingItem, setEditingItem] = useState<PortfolioItemFull | null | undefined>(undefined);
  const isEditorOpen = editingItem !== undefined;

  const isStarter = tier === 'starter';
  const atLimit = isStarter && items.length >= STARTER_LIMIT;

  const handleCreate = () => {
    if (atLimit) return;
    setEditingItem(null);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-[#2C1A14]">Портфоліо</h1>
          <p className="text-sm text-[#6B5750] mt-0.5">
            {items.length} {pluralUk(items.length, 'робота', 'роботи', 'робіт')}
            {isStarter && ` · ${STARTER_LIMIT} макс.`}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {masterSlug && (
            <a
              href={`/${masterSlug}/portfolio`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-[#789A99] border border-[#789A99]/40 hover:bg-[#789A99]/8 transition-colors"
            >
              <ExternalLink size={13} /> Переглянути
            </a>
          )}
          <button
            onClick={handleCreate}
            disabled={atLimit}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-opacity disabled:opacity-50"
            style={{ background: '#789A99' }}
          >
            <Plus size={16} /> Додати
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
          <div className="w-9 h-9 rounded-2xl bg-[#D4935A]/15 flex items-center justify-center shrink-0">
            <Lock size={16} className="text-[#D4935A]" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-[#2C1A14]">Ліміт Starter: {STARTER_LIMIT} робіт</p>
            <p className="text-xs text-[#6B5750] mt-0.5">
              Перейдіть на Pro — необмежена кількість робіт, більше фото та повний доступ до аналітики.
            </p>
            <a
              href="/dashboard/billing"
              className="inline-block mt-2 text-xs font-semibold text-[#D4935A] underline underline-offset-2"
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
          <div className="w-16 h-16 rounded-3xl bg-[#F5E8E3] flex items-center justify-center">
            <Images size={28} className="text-[#C8B8B2]" />
          </div>
          <div>
            <p className="text-base font-bold text-[#2C1A14]">Портфоліо порожнє</p>
            <p className="text-sm text-[#6B5750] mt-1 max-w-xs mx-auto">
              Додайте свої роботи, щоб клієнти бачили ваш стиль і рівень
            </p>
          </div>
          <button
            onClick={handleCreate}
            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-semibold text-white"
            style={{ background: '#789A99' }}
          >
            <Plus size={16} /> Додати першу роботу
          </button>
        </motion.div>
      )}

      {/* Grid */}
      {items.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {items.map((item, i) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
            >
              <PortfolioItemCard
                item={item}
                onClick={() => setEditingItem(item)}
              />
            </motion.div>
          ))}

          {/* Add card — shown when not at limit */}
          {!atLimit && (
            <button
              onClick={handleCreate}
              className="rounded-3xl aspect-[4/3] flex flex-col items-center justify-center gap-2 text-[#A8928D] hover:text-[#789A99] transition-colors"
              style={{ border: '2px dashed #E8D5CF' }}
            >
              <Plus size={20} />
              <span className="text-xs font-medium">Додати</span>
            </button>
          )}
        </div>
      )}

      {/* Editor drawer */}
      {isEditorOpen && (
        <PortfolioItemEditor
          item={editingItem}
          masterId={masterId}
          masterSlug={masterSlug}
          services={services}
          reviews={reviews}
          clients={clients}
          onClose={() => setEditingItem(undefined)}
          onSaved={() => { invalidate(); setEditingItem(undefined); }}
        />
      )}
    </div>
  );
}
