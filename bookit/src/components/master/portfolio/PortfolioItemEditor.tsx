'use client';

import { useState, useTransition } from 'react';
import { X, ChevronDown, User, Scissors, Star, Trash2, Loader2, Eye, EyeOff, UserX } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { PortfolioPhotoUploader } from './PortfolioPhotoUploader';
import {
  createPortfolioItem, updatePortfolioItem, deletePortfolioItem,
  tagClientOnPortfolioItem, removeClientTag, setPortfolioItemReviews,
  togglePublishPortfolioItem,
} from '@/app/(master)/dashboard/portfolio/actions';
import type { PortfolioItemFull, PortfolioItemPhoto } from '@/types/database';

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
  item?: PortfolioItemFull | null;
  masterId: string;
  masterSlug: string;
  services: Service[];
  reviews: Review[];
  clients: Client[];
  onClose: () => void;
  onSaved: () => void;
}

export function PortfolioItemEditor({ item, masterId, masterSlug, services, reviews, clients, onClose, onSaved }: Props) {
  const isNew = !item;

  const [title, setTitle] = useState(item?.title ?? '');
  const [description, setDescription] = useState(item?.description ?? '');
  const [serviceId, setServiceId] = useState(item?.service_id ?? '');
  const [selectedReviewIds, setSelectedReviewIds] = useState<string[]>(item?.review_ids ?? []);
  const [selectedClientId, setSelectedClientId] = useState(item?.tagged_client_id ?? '');
  const [photos, setPhotos] = useState<PortfolioItemPhoto[]>(item?.photos ?? []);
  const [isPublished, setIsPublished] = useState(item?.is_published ?? true);
  const [createdItemId, setCreatedItemId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [pending, startTransition] = useTransition();

  const effectiveItemId = item?.id ?? createdItemId;

  const handleSaveMeta = () => {
    if (!title.trim()) { setError("Назва обов'язкова"); return; }
    setError('');

    startTransition(async () => {
      const fd = new FormData();
      fd.set('title', title.trim());
      fd.set('description', description.trim());
      fd.set('service_id', serviceId);
      fd.set('is_published', String(isPublished));

      if (isNew && !createdItemId) {
        const res = await createPortfolioItem(fd);
        if (res.error === 'limit_reached') { setError('Ліміт 5 робіт на Starter тарифі'); return; }
        if (res.error) { setError('Помилка збереження'); return; }
        setCreatedItemId(res.id!);
      } else if (effectiveItemId) {
        await updatePortfolioItem(effectiveItemId, fd);
      }
    });
  };

  const handleTagClient = () => {
    if (!effectiveItemId || !selectedClientId) return;
    startTransition(async () => {
      await tagClientOnPortfolioItem(effectiveItemId, selectedClientId);
    });
  };

  const handleRemoveTag = () => {
    if (!effectiveItemId) return;
    startTransition(async () => {
      await removeClientTag(effectiveItemId);
      setSelectedClientId('');
    });
  };

  const handleSaveReviews = () => {
    if (!effectiveItemId) return;
    startTransition(async () => {
      await setPortfolioItemReviews(effectiveItemId, selectedReviewIds);
    });
  };

  const handleTogglePublish = () => {
    if (!effectiveItemId) return;
    const next = !isPublished;
    setIsPublished(next);
    startTransition(async () => {
      await togglePublishPortfolioItem(effectiveItemId, next);
    });
  };

  const handleDelete = () => {
    if (!effectiveItemId) { onClose(); return; }
    startTransition(async () => {
      await deletePortfolioItem(effectiveItemId);
      onSaved();
      onClose();
    });
  };

  const handleFinish = () => {
    onSaved();
    onClose();
  };

  const consentBadge = item?.consent_status === 'pending'
    ? <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#D4935A]/15 text-[#D4935A]">Очікує</span>
    : item?.consent_status === 'approved'
      ? <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#5C9E7A]/15 text-[#5C9E7A]">Підтверджено</span>
      : null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-end md:items-center justify-center p-0 md:p-4"
        onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      >
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', stiffness: 300, damping: 32 }}
          className="w-full md:max-w-xl max-h-[92dvh] overflow-y-auto rounded-t-[28px] md:rounded-[28px]"
          style={{ background: 'rgba(255,248,244,0.98)', backdropFilter: 'blur(24px)' }}
        >
          {/* Header */}
          <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-4 border-b border-[#E8D5CF]/60"
            style={{ background: 'rgba(255,248,244,0.97)' }}>
            <h2 className="text-base font-bold text-[#2C1A14]">
              {isNew ? 'Нова робота' : 'Редагування'}
            </h2>
            <div className="flex items-center gap-2">
              {effectiveItemId && (
                <button
                  onClick={handleTogglePublish}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors"
                  style={isPublished
                    ? { background: '#5C9E7A/10', borderColor: '#5C9E7A', color: '#5C9E7A' }
                    : { background: 'transparent', borderColor: '#C8B8B2', color: '#A8928D' }
                  }
                >
                  {isPublished ? <Eye size={13} /> : <EyeOff size={13} />}
                  {isPublished ? 'Опублікована' : 'Прихована'}
                </button>
              )}
              <button onClick={onClose} className="w-8 h-8 rounded-xl bg-[#F5E8E3] flex items-center justify-center text-[#A8928D]">
                <X size={16} />
              </button>
            </div>
          </div>

          <div className="p-5 space-y-5">
            {/* Title */}
            <div>
              <label className="block text-xs font-semibold text-[#6B5750] mb-1.5">Назва роботи*</label>
              <input
                value={title}
                onChange={e => setTitle(e.target.value)}
                maxLength={120}
                placeholder="Наприклад: Весільний образ Марини"
                className="w-full rounded-xl border border-[#E8D5CF] bg-white/70 px-4 py-3 text-sm text-[#2C1A14] placeholder:text-[#C8B8B2] focus:outline-none focus:border-[#789A99]"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-semibold text-[#6B5750] mb-1.5">Опис</label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                maxLength={1000}
                rows={3}
                placeholder="Розкажіть про цю роботу..."
                className="w-full rounded-xl border border-[#E8D5CF] bg-white/70 px-4 py-3 text-sm text-[#2C1A14] placeholder:text-[#C8B8B2] focus:outline-none focus:border-[#789A99] resize-none"
              />
            </div>

            {/* Service */}
            <div>
              <label className="flex items-center gap-1.5 text-xs font-semibold text-[#6B5750] mb-1.5">
                <Scissors size={13} /> Послуга
              </label>
              <div className="relative">
                <select
                  value={serviceId}
                  onChange={e => setServiceId(e.target.value)}
                  className="w-full rounded-xl border border-[#E8D5CF] bg-white/70 px-4 py-3 text-sm text-[#2C1A14] focus:outline-none focus:border-[#789A99] appearance-none"
                >
                  <option value="">Не вказано</option>
                  {services.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#A8928D] pointer-events-none" />
              </div>
            </div>

            {error && <p className="text-xs text-[#C05B5B] font-medium">{error}</p>}

            {/* Save meta button */}
            <button
              onClick={handleSaveMeta}
              disabled={pending || !title.trim()}
              className="w-full rounded-2xl py-3 text-sm font-semibold text-white transition-opacity disabled:opacity-50"
              style={{ background: '#789A99' }}
            >
              {pending ? <Loader2 size={16} className="animate-spin mx-auto" /> : effectiveItemId ? 'Зберегти зміни' : 'Створити роботу'}
            </button>

            {/* Photos — only after item is created */}
            {effectiveItemId && (
              <div className="space-y-3 pt-1">
                <div className="h-px bg-[#E8D5CF]/60" />
                <label className="block text-xs font-semibold text-[#6B5750]">Фотографії</label>
                <PortfolioPhotoUploader
                  itemId={effectiveItemId}
                  masterId={masterId}
                  photos={photos}
                  onPhotosChange={setPhotos}
                />
              </div>
            )}

            {/* Client tagging — only after item is created */}
            {effectiveItemId && (
              <div className="space-y-3">
                <div className="h-px bg-[#E8D5CF]/60" />
                <label className="flex items-center gap-1.5 text-xs font-semibold text-[#6B5750]">
                  <User size={13} /> Клієнт
                </label>

                {item?.tagged_client_id ? (
                  <div className="flex items-center justify-between rounded-2xl bg-[#789A99]/8 px-4 py-3">
                    <div>
                      <p className="text-sm font-semibold text-[#2C1A14]">{item.tagged_client_name ?? 'Клієнт'}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">{consentBadge}</div>
                    </div>
                    {item.consent_status === 'pending' && (
                      <button
                        onClick={handleRemoveTag}
                        disabled={pending}
                        className="flex items-center gap-1 text-xs text-[#C05B5B] font-medium"
                      >
                        <UserX size={13} /> Скасувати запит
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <select
                        value={selectedClientId}
                        onChange={e => setSelectedClientId(e.target.value)}
                        className="w-full rounded-xl border border-[#E8D5CF] bg-white/70 px-4 py-2.5 text-sm text-[#2C1A14] focus:outline-none focus:border-[#789A99] appearance-none"
                      >
                        <option value="">Оберіть клієнта</option>
                        {clients.map(c => <option key={c.id} value={c.id}>{c.full_name}</option>)}
                      </select>
                      <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#A8928D] pointer-events-none" />
                    </div>
                    <button
                      onClick={handleTagClient}
                      disabled={!selectedClientId || pending}
                      className="px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity disabled:opacity-40"
                      style={{ background: '#789A99' }}
                    >
                      Відмітити
                    </button>
                  </div>
                )}
                <p className="text-[11px] text-[#A8928D]">Клієнт отримає сповіщення і має підтвердити участь</p>
              </div>
            )}

            {/* Reviews — only after item is created */}
            {effectiveItemId && reviews.length > 0 && (
              <div className="space-y-3">
                <div className="h-px bg-[#E8D5CF]/60" />
                <label className="flex items-center gap-1.5 text-xs font-semibold text-[#6B5750]">
                  <Star size={13} /> Відгуки
                </label>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {reviews.map(r => {
                    const isSelected = selectedReviewIds.includes(r.id);
                    return (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => setSelectedReviewIds(
                          isSelected ? selectedReviewIds.filter(id => id !== r.id) : [...selectedReviewIds, r.id]
                        )}
                        className="w-full flex items-start gap-3 rounded-2xl p-3 text-left transition-colors"
                        style={{ background: isSelected ? 'rgba(120,154,153,0.1)' : 'rgba(255,255,255,0.5)', border: `1px solid ${isSelected ? '#789A99' : 'transparent'}` }}
                      >
                        <div className="w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5"
                          style={{ borderColor: isSelected ? '#789A99' : '#C8B8B2', background: isSelected ? '#789A99' : 'transparent' }}
                        >
                          {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-[#2C1A14]">{'★'.repeat(r.rating)} {r.client_name ?? 'Клієнт'}</p>
                          {r.comment && <p className="text-xs text-[#6B5750] truncate mt-0.5">{r.comment}</p>}
                        </div>
                      </button>
                    );
                  })}
                </div>
                <button
                  onClick={handleSaveReviews}
                  disabled={pending}
                  className="w-full rounded-xl py-2.5 text-xs font-semibold border border-[#789A99] text-[#789A99] hover:bg-[#789A99]/8 transition-colors"
                >
                  Зберегти відгуки
                </button>
              </div>
            )}

            {/* Footer actions */}
            <div className="flex gap-2 pt-2">
              {effectiveItemId && (
                <button
                  onClick={handleDelete}
                  disabled={pending}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold text-[#C05B5B] border border-[#C05B5B]/30 hover:bg-[#C05B5B]/8 transition-colors"
                >
                  <Trash2 size={13} /> Видалити
                </button>
              )}
              <button
                onClick={handleFinish}
                className="flex-1 rounded-xl py-2.5 text-sm font-semibold text-[#2C1A14] bg-[#F5E8E3] hover:bg-[#EBD5CC] transition-colors"
              >
                Готово
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
