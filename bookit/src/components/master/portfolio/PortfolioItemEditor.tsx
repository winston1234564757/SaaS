'use client';

import { useState, useTransition, useEffect, useRef } from 'react';
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

interface Client { id: string; full_name: string }
interface Service { id: string; name: string }

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

export function PortfolioItemEditor({
  item, masterId, services, reviews, clients, onClose, onSaved,
}: Props) {
  const isNew = !item;

  const [itemId, setItemId]               = useState<string | null>(item?.id ?? null);
  const [title, setTitle]                 = useState(item?.title ?? '');
  const [description, setDescription]     = useState(item?.description ?? '');
  const [serviceId, setServiceId]         = useState(item?.service_id ?? '');
  const [selectedReviewIds, setSelectedReviewIds] = useState<string[]>(item?.review_ids ?? []);
  const [selectedClientId, setSelectedClientId]   = useState('');
  const [photos, setPhotos]               = useState<PortfolioItemPhoto[]>(item?.photos ?? []);
  const [isPublished, setIsPublished]     = useState(item?.is_published ?? true);
  const [consentStatus, setConsentStatus] = useState(item?.consent_status ?? null);
  const [taggedClientName, setTaggedClientName]   = useState(item?.tagged_client_name ?? null);

  const [autoCreating, setAutoCreating]   = useState(false);
  const [closingAndSaving, setClosingAndSaving] = useState(false);
  const [reviewsPending, startReviewsTransition] = useTransition();
  const [clientPending,  startClientTransition]  = useTransition();
  const [publishPending, startPublishTransition] = useTransition();
  const [deletePending,  startDeleteTransition]  = useTransition();

  const initDone = useRef(false);

  // Auto-create item on open for new entries → all sections available immediately
  useEffect(() => {
    if (!isNew || itemId || initDone.current) return;
    initDone.current = true;
    setAutoCreating(true);
    const fd = new FormData();
    fd.set('title', 'Нова робота');
    fd.set('description', '');
    fd.set('service_id', '');
    fd.set('is_published', 'false');
    createPortfolioItem(fd).then(res => {
      if (res.id) setItemId(res.id);
      setAutoCreating(false);
    });
  }, [isNew, itemId]);

  const saveMeta = async (id: string) => {
    if (!title.trim()) return;
    const fd = new FormData();
    fd.set('title', title.trim());
    fd.set('description', description.trim());
    fd.set('service_id', serviceId);
    fd.set('is_published', String(isPublished));
    await updatePortfolioItem(id, fd);
  };

  const handleClose = async () => {
    if (itemId) {
      if (!title.trim()) {
        // Empty title = abandoned draft → delete
        await deletePortfolioItem(itemId).catch(() => {});
      } else {
        setClosingAndSaving(true);
        await saveMeta(itemId).catch(() => {});
      }
    }
    onSaved();
    onClose();
  };

  const handleTagClient = () => {
    if (!itemId || !selectedClientId) return;
    const client = clients.find(c => c.id === selectedClientId);
    startClientTransition(async () => {
      await tagClientOnPortfolioItem(itemId, selectedClientId);
      setConsentStatus('pending');
      setTaggedClientName(client?.full_name ?? null);
    });
  };

  const handleRemoveTag = () => {
    if (!itemId) return;
    startClientTransition(async () => {
      await removeClientTag(itemId);
      setConsentStatus(null);
      setTaggedClientName(null);
      setSelectedClientId('');
    });
  };

  const handleSaveReviews = () => {
    if (!itemId) return;
    startReviewsTransition(async () => {
      await setPortfolioItemReviews(itemId, selectedReviewIds);
    });
  };

  const handleTogglePublish = () => {
    if (!itemId) return;
    const next = !isPublished;
    setIsPublished(next);
    startPublishTransition(async () => {
      await togglePublishPortfolioItem(itemId, next);
    });
  };

  const handleDelete = () => {
    startDeleteTransition(async () => {
      if (itemId) await deletePortfolioItem(itemId);
      onSaved();
      onClose();
    });
  };

  const consentBadge =
    consentStatus === 'pending'
      ? <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-warning/15 text-warning">Очікує</span>
      : consentStatus === 'approved'
        ? <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-success/15 text-success">Підтверджено</span>
        : null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-end md:items-center justify-center p-0 md:p-4"
        onClick={e => { if (e.target === e.currentTarget) handleClose(); }}
      >
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', stiffness: 300, damping: 32 }}
          className="w-full md:max-w-xl max-h-[92dvh] overflow-y-auto rounded-t-[28px] md:rounded-[28px]"
          style={{ background: 'rgba(255,248,244,0.98)', backdropFilter: 'blur(24px)' }}
        >
          {/* ── Header ── */}
          <div
            className="sticky top-0 z-10 flex items-center justify-between px-5 py-4 border-b border-secondary/80/60"
            style={{ background: 'rgba(255,248,244,0.97)' }}
          >
            <h2 className="text-base font-bold text-foreground">
              {isNew ? 'Нова робота' : 'Редагування'}
            </h2>
            <div className="flex items-center gap-2">
              {itemId && (
                <button
                  onClick={handleTogglePublish}
                  disabled={publishPending}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors disabled:opacity-60 active:scale-95 transition-all"
                  style={isPublished
                    ? { borderColor: '#5C9E7A', color: '#5C9E7A', background: 'rgba(92,158,122,0.08)' }
                    : { borderColor: '#C8B8B2', color: '#A8928D', background: 'transparent' }}
                >
                  {isPublished ? <Eye size={13} /> : <EyeOff size={13} />}
                  {isPublished ? 'Опублікована' : 'Прихована'}
                </button>
              )}
              <button
                onClick={handleClose}
                disabled={closingAndSaving}
                className="w-8 h-8 rounded-xl bg-secondary flex items-center justify-center text-muted-foreground/60 active:scale-95 transition-all"
              >
                {closingAndSaving ? <Loader2 size={14} className="animate-spin" /> : <X size={16} />}
              </button>
            </div>
          </div>

          {/* ── Body ── */}
          {autoCreating ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 size={28} className="text-primary animate-spin" />
            </div>
          ) : (
            <div className="p-5 space-y-5">

              {/* Title */}
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Назва роботи*</label>
                <input
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  maxLength={120}
                  placeholder="Наприклад: Весільний образ Марини"
                  className="w-full rounded-xl border border-secondary/80 bg-white/70 px-4 py-3 text-sm text-foreground placeholder:text-[#C8B8B2] focus:outline-none focus:border-primary"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Опис</label>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  maxLength={1000}
                  rows={3}
                  placeholder="Розкажіть про цю роботу..."
                  className="w-full rounded-xl border border-secondary/80 bg-white/70 px-4 py-3 text-sm text-foreground placeholder:text-[#C8B8B2] focus:outline-none focus:border-primary resize-none"
                />
              </div>

              {/* Service */}
              <div>
                <label className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground mb-1.5">
                  <Scissors size={13} /> Послуга
                </label>
                <div className="relative">
                  <select
                    value={serviceId}
                    onChange={e => setServiceId(e.target.value)}
                    className="w-full rounded-xl border border-secondary/80 bg-white/70 px-4 py-3 text-sm text-foreground focus:outline-none focus:border-primary appearance-none"
                  >
                    <option value="">Не вказано</option>
                    {services.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                  <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/60 pointer-events-none" />
                </div>
              </div>

              <div className="h-px bg-secondary/80/60" />

              {/* Photos */}
              <div className="space-y-3">
                <label className="block text-xs font-semibold text-muted-foreground">Фотографії</label>
                <PortfolioPhotoUploader
                  itemId={itemId ?? ''}
                  masterId={masterId}
                  photos={photos}
                  onPhotosChange={setPhotos}
                  disabled={!itemId}
                />
              </div>

              <div className="h-px bg-secondary/80/60" />

              {/* Client tagging */}
              <div className="space-y-3">
                <label className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                  <User size={13} /> Клієнт
                </label>

                {(consentStatus !== null || taggedClientName) ? (
                  <div className="flex items-center justify-between rounded-2xl bg-primary/8 px-4 py-3">
                    <div>
                      <p className="text-sm font-semibold text-foreground">{taggedClientName ?? 'Клієнт'}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">{consentBadge}</div>
                    </div>
                    {consentStatus === 'pending' && (
                      <button
                        onClick={handleRemoveTag}
                        disabled={clientPending}
                        className="flex items-center gap-1 text-xs text-destructive font-medium active:scale-95 transition-all"
                      >
                        <UserX size={13} /> Скасувати
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <select
                        value={selectedClientId}
                        onChange={e => setSelectedClientId(e.target.value)}
                        className="w-full rounded-xl border border-secondary/80 bg-white/70 px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary appearance-none"
                      >
                        <option value="">
                          {clients.length === 0 ? 'Немає зареєстрованих клієнтів' : 'Оберіть клієнта'}
                        </option>
                        {clients.map(c => <option key={c.id} value={c.id}>{c.full_name}</option>)}
                      </select>
                      <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/60 pointer-events-none" />
                    </div>
                    <button
                      onClick={handleTagClient}
                      disabled={!selectedClientId || clientPending || !itemId}
                      className="px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity disabled:opacity-40 active:scale-95 transition-all"
                      style={{ background: '#789A99' }}
                    >
                      {clientPending ? <Loader2 size={14} className="animate-spin" /> : 'Відмітити'}
                    </button>
                  </div>
                )}
                <p className="text-[11px] text-muted-foreground/60">
                  Клієнт отримає сповіщення і має підтвердити участь
                </p>
                {!(consentStatus !== null || taggedClientName) && (
                  <p className="text-[11px] text-muted-foreground/60 bg-secondary rounded-xl px-3 py-2 leading-relaxed">
                    Не знаходите потрібного клієнта? Попросіть їх зареєструватися на{' '}
                    <span className="font-semibold text-muted-foreground">BOOKIT</span> — після цього вони з&apos;являться у списку.
                  </p>
                )}
              </div>

              {/* Reviews */}
              {reviews.length > 0 && (
                <>
                  <div className="h-px bg-secondary/80/60" />
                  <div className="space-y-3">
                    <label className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                      <Star size={13} /> Відгуки
                    </label>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {reviews.map(r => {
                        const isSelected = selectedReviewIds.includes(r.id);
                        return (
                          <button
                            key={r.id}
                            type="button"
                            onClick={() =>
                              setSelectedReviewIds(
                                isSelected
                                  ? selectedReviewIds.filter(id => id !== r.id)
                                  : [...selectedReviewIds, r.id]
                              )
                            }
                            className="w-full flex items-start gap-3 rounded-2xl p-3 text-left transition-colors"
                            style={{
                              background: isSelected ? 'rgba(120,154,153,0.10)' : 'rgba(255,255,255,0.50)',
                              border: `1px solid ${isSelected ? '#789A99' : 'transparent'}`,
                            }}
                          >
                            <div
                              className="w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5"
                              style={{
                                borderColor: isSelected ? '#789A99' : '#C8B8B2',
                                background: isSelected ? '#789A99' : 'transparent',
                              }}
                            >
                              {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-semibold text-foreground">
                                {'★'.repeat(r.rating)} {r.client_name ?? 'Клієнт'}
                              </p>
                              {r.comment && (
                                <p className="text-xs text-muted-foreground truncate mt-0.5">{r.comment}</p>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                    <button
                      onClick={handleSaveReviews}
                      disabled={reviewsPending || !itemId}
                      className="w-full rounded-xl py-2.5 text-xs font-semibold border border-primary text-primary hover:bg-primary/8 transition-colors disabled:opacity-50 active:scale-95 transition-all"
                    >
                      {reviewsPending
                        ? <Loader2 size={13} className="animate-spin mx-auto" />
                        : 'Зберегти відгуки'}
                    </button>
                  </div>
                </>
              )}

              {/* Footer */}
              <div className="flex gap-2 pt-1">
                {itemId && (
                  <button
                    onClick={handleDelete}
                    disabled={deletePending}
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold text-destructive border border-destructive/30 hover:bg-destructive/8 transition-colors active:scale-95 transition-all"
                  >
                    {deletePending
                      ? <Loader2 size={13} className="animate-spin" />
                      : <><Trash2 size={13} /> Видалити</>}
                  </button>
                )}
                <button
                  onClick={handleClose}
                  disabled={closingAndSaving}
                  className="flex-1 rounded-xl py-2.5 text-sm font-semibold text-white transition-colors disabled:opacity-60 active:scale-95 transition-all"
                  style={{ background: '#789A99' }}
                >
                  {closingAndSaving
                    ? <Loader2 size={16} className="animate-spin mx-auto" />
                    : 'Готово'}
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
