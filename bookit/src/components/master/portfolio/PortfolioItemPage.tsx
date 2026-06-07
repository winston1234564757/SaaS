'use client';

import { useState, useTransition, useRef, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ChevronLeft, ChevronDown, User, Scissors, Star, Trash2, Loader2, Eye, EyeOff, UserX } from 'lucide-react';
import { motion } from 'framer-motion';
import { useToast } from '@/lib/toast/context';
import { PortfolioPhotoUploader } from './PortfolioPhotoUploader';
import {
  createPortfolioItem, updatePortfolioItem, deletePortfolioItem,
  tagClientOnPortfolioItem, removeClientTag, setPortfolioItemReviews,
  togglePublishPortfolioItem,
} from '@/app/(master)/dashboard/portfolio/actions';
import { usePortfolioItems, useInvalidatePortfolio } from '@/lib/supabase/hooks/usePortfolioItems';
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
  id?: string;
  masterId: string;
  services: Service[];
  reviews: Review[];
  clients: Client[];
}

export function PortfolioItemPage({ id, masterId, services, reviews, clients }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showToast } = useToast();
  const isDraft = searchParams.get('draft') === 'true';
  const { data: items } = usePortfolioItems([]);
  const invalidate = useInvalidatePortfolio();
  const existing = id ? (items ?? []).find(i => i.id === id) ?? null : null;
  const isNew = !id;

  const [saving, setSaving] = useState(false);
  const [itemId, setItemId] = useState<string | null>(existing?.id ?? id ?? null);
  const [title, setTitle] = useState(isDraft ? '' : (existing?.title ?? ''));
  const [description, setDescription] = useState(existing?.description ?? '');
  const [serviceId, setServiceId] = useState(existing?.service_id ?? '');
  const [selectedReviewIds, setSelectedReviewIds] = useState<string[]>(existing?.review_ids ?? []);
  const [selectedClientId, setSelectedClientId] = useState('');
  const [photos, setPhotos] = useState<PortfolioItemPhoto[]>(existing?.photos ?? []);
  const [isPublished, setIsPublished] = useState(isDraft ? false : (existing?.is_published ?? true));
  const [consentStatus, setConsentStatus] = useState(existing?.consent_status ?? null);
  const [taggedClientName, setTaggedClientName] = useState(existing?.tagged_client_name ?? null);

  useEffect(() => {
    if (existing) {
      setItemId(existing.id);
      setTitle(isDraft ? '' : existing.title);
      setDescription(existing.description ?? '');
      setServiceId(existing.service_id ?? '');
      setSelectedReviewIds(existing.review_ids ?? []);
      setPhotos(existing.photos ?? []);
      setIsPublished(isDraft ? false : existing.is_published);
      setConsentStatus(existing.consent_status ?? null);
      setTaggedClientName(existing.tagged_client_name ?? null);
    }
  }, [existing, isDraft]);

  const [reviewsPending, startReviewsTransition] = useTransition();
  const [clientPending, startClientTransition] = useTransition();
  const [publishPending, startPublishTransition] = useTransition();
  const [deletePending, startDeleteTransition] = useTransition();
  const [errors, setErrors] = useState<{ title?: string }>({});

  const consentBadge =
    consentStatus === 'pending'
      ? <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-warning/15 text-warning">Очікує</span>
      : consentStatus === 'approved'
        ? <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-success/15 text-success">Підтверджено</span>
        : null;

  const handleSave = async () => {
    setErrors({});
    if (!title.trim()) {
      setErrors({ title: 'Вкажіть назву роботи' });
      return;
    }
    setSaving(true);
    try {
      let currentId = itemId;
      // Create if new
      if (!currentId) {
        const fd = new FormData();
        fd.set('title', title.trim());
        fd.set('description', description.trim());
        fd.set('service_id', serviceId);
        fd.set('is_published', String(isPublished));
        const res = await createPortfolioItem(fd);
        if (res.id) currentId = res.id;
        else { setSaving(false); return; }
      } else {
        const fd = new FormData();
        fd.set('title', title.trim());
        fd.set('description', description.trim());
        fd.set('service_id', serviceId);
        fd.set('is_published', String(isPublished));
        const updateRes = await updatePortfolioItem(currentId, fd);
        if (updateRes && 'error' in updateRes && updateRes.error === 'limit_reached') {
          setIsPublished(false);
          showToast({ type: 'error', title: 'Ліміт Starter: 5 активних робіт', message: 'Перейдіть на Pro для необмеженого портфоліо.' });
          setSaving(false);
          return;
        }
      }
      // Save reviews
      if (currentId) {
        await setPortfolioItemReviews(currentId, selectedReviewIds);
      }
      invalidate();
      router.push('/dashboard/portfolio');
    } catch {
      setSaving(false);
    }
  };

  const handleBack = async () => {
    if (isDraft && itemId) {
      try {
        await deletePortfolioItem(itemId);
      } catch (err) {
        console.error('Failed to delete portfolio draft:', err);
      }
    }
    router.push('/dashboard/portfolio');
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
      try {
        const res = await togglePublishPortfolioItem(itemId, next);
        if ('error' in res) {
          setIsPublished(!next);
          if (res.error === 'limit_reached') {
            showToast({ type: 'error', title: 'Ліміт Starter: 5 активних робіт', message: 'Перейдіть на Pro для необмеженого портфоліо.' });
          }
        }
      } catch {
        setIsPublished(!next);
      }
    });
  };

  const handleDelete = () => {
    startDeleteTransition(async () => {
      if (itemId) await deletePortfolioItem(itemId);
      invalidate();
      router.push('/dashboard/portfolio');
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-xl mx-auto"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button type="button"
          onClick={handleBack}
          className="flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground active:scale-[0.95] transition-all cursor-pointer"
        >
          <ChevronLeft size={18} /> Назад
        </button>
        <div className="flex items-center gap-2">
          {itemId && (
            <button type="button"
              onClick={handleTogglePublish}
              disabled={publishPending}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all active:scale-[0.95] cursor-pointer ${
                isPublished
                  ? 'border-success/30 text-success bg-success/10 hover:bg-success/15'
                  : 'border-border text-muted-foreground bg-transparent hover:bg-secondary/40'
              }`}
            >
              {isPublished ? <Eye size={13} /> : <EyeOff size={13} />}
              {isPublished ? 'Опублікована' : 'Прихована'}
            </button>
          )}
        </div>
      </div>

      <h1 className="heading-serif text-xl text-foreground mb-6">
        {isNew ? 'Нова робота' : 'Редагувати роботу'}
      </h1>

      <div className="space-y-5">
        {/* Title */}
        <div>
          <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Назва роботи*</label>
          <input
            value={title}
            onChange={e => { setTitle(e.target.value); if (errors.title) setErrors({}); }}
            maxLength={120}
            placeholder="Наприклад: Весільний образ Марини"
            aria-label="Назва роботи"
            className={`w-full rounded-xl border px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none transition-all ${
              errors.title ? 'border-error bg-error/5' : 'border-border bg-secondary/40 focus:border-primary'
            }`}
          />
          {errors.title && (
            <p className="text-xs text-error mt-1.5">{errors.title}</p>
          )}
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
            className="w-full rounded-xl border border-border bg-secondary/40 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 resize-none"
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
              className="w-full rounded-xl border border-border bg-secondary/40 px-4 py-3 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 appearance-none"
            >
              <option value="">Не вказано</option>
              {services.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/60 pointer-events-none" />
          </div>
        </div>

        <div className="h-px bg-border" />

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

        <div className="h-px bg-border" />

        {/* Client tagging */}
        <div className="space-y-3">
          <label className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
            <User size={13} /> Клієнт
          </label>

          {(consentStatus !== null || taggedClientName) ? (
            <div className="flex items-center justify-between rounded-2xl bg-secondary/40 border border-border px-4 py-3">
              <div>
                <p className="text-sm font-semibold text-foreground">{taggedClientName ?? 'Клієнт'}</p>
                <div className="flex items-center gap-1.5 mt-0.5">{consentBadge}</div>
              </div>
              {consentStatus === 'pending' && (
                <button type="button"
                  onClick={handleRemoveTag}
                  disabled={clientPending}
                  className="flex items-center gap-1 text-xs text-destructive font-medium active:scale-[0.88] cursor-pointer transition-all"
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
                  className="w-full rounded-xl border border-border bg-secondary/40 px-4 py-2.5 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 appearance-none"
                >
                  <option value="">
                    {clients.length === 0 ? 'Немає зареєстрованих клієнтів' : 'Оберіть клієнта'}
                  </option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.full_name}</option>)}
                </select>
                <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/60 pointer-events-none" />
              </div>
              <button type="button"
                onClick={handleTagClient}
                disabled={!selectedClientId || clientPending || !itemId}
                className="px-4 py-2.5 rounded-xl text-sm font-semibold bg-primary text-primary-foreground hover:opacity-90 transition-all disabled:opacity-40 active:scale-[0.95] cursor-pointer"
              >
                {clientPending ? <Loader2 size={14} className="animate-spin" /> : 'Відмітити'}
              </button>
            </div>
          )}
          <p className="text-[11px] text-muted-foreground/60">
            Клієнт отримає сповіщення і має підтвердити участь
          </p>
          {!(consentStatus !== null || taggedClientName) && (
            <p className="text-[11px] text-muted-foreground/60 bg-secondary/40 border border-border rounded-xl px-3 py-2 leading-relaxed">
              Не знаходите потрібного клієнта? Попросіть їх зареєструватися на{' '}
              <span className="font-semibold text-muted-foreground">BOOKIT</span> — після цього вони з&apos;являться у списку.
            </p>
          )}
        </div>

        {/* Reviews */}
        {reviews.length > 0 && (
          <>
            <div className="h-px bg-border" />
            <div className="space-y-3">
              <label className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                <Star size={13} /> Відгуки
              </label>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {reviews.map(r => {
                  const isSelected = selectedReviewIds.includes(r.id);
                  return (
                    <button type="button"
                      key={r.id}
                      onClick={() =>
                        setSelectedReviewIds(
                          isSelected
                            ? selectedReviewIds.filter(id => id !== r.id)
                            : [...selectedReviewIds, r.id]
                        )
                      }
                      className={`w-full flex items-start gap-3 rounded-2xl p-3 text-left transition-all border active:scale-[0.95] cursor-pointer ${
                        isSelected
                          ? 'bg-primary/10 border-primary/30'
                          : 'bg-secondary/40 border-transparent hover:bg-secondary/60'
                      }`}
                    >
                      <div className={`size-4 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                        isSelected ? 'border-primary bg-primary' : 'border-border bg-transparent'
                      }`}>
                        {isSelected && <div className="size-1.5 rounded-full bg-primary-foreground" />}
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
              <button type="button"
                onClick={handleSaveReviews}
                disabled={reviewsPending || !itemId}
                className="w-full rounded-xl py-2.5 text-xs font-semibold border border-primary text-primary hover:bg-primary/10 transition-colors disabled:opacity-50 active:scale-[0.95] cursor-pointer"
              >
                {reviewsPending
                  ? <Loader2 size={13} className="animate-spin mx-auto" />
                  : 'Зберегти відгуки'}
              </button>
            </div>
          </>
        )}

        <div className="h-px bg-border" />

        {/* Footer actions */}
        <div className="flex gap-2 pt-2">
          {itemId && (
            <button type="button"
              onClick={handleDelete}
              disabled={deletePending}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold text-destructive border border-destructive/30 hover:bg-destructive/10 transition-all active:scale-[0.95] cursor-pointer"
            >
              {deletePending
                ? <Loader2 size={13} className="animate-spin" />
                : <><Trash2 size={13} /> Видалити</>}
            </button>
          )}
          <button type="button"
            onClick={handleSave}
            disabled={saving}
            className="flex-1 rounded-xl py-2.5 text-sm font-semibold bg-primary text-primary-foreground hover:opacity-90 transition-all disabled:opacity-60 active:scale-[0.95] cursor-pointer"
          >
            {saving ? <Loader2 size={16} className="animate-spin mx-auto" /> : 'Зберегти'}
          </button>
        </div>
      </div>
    </motion.div>
  );
}
