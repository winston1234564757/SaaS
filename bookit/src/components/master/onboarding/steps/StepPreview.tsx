'use client';

import { useState, type ComponentType } from 'react';
import { motion, type Variants } from 'framer-motion';
import {
  ArrowRight, BadgeCheck, Check, Clock, Copy, ExternalLink,
  Eye, Leaf, Loader2, Pencil, Scissors, Sparkles, Star, X, Zap,
} from 'lucide-react';
import { serviceCategories } from '@/lib/constants/categories';
import { CATEGORY_TEMPLATES } from '@/lib/constants/onboardingTemplates';
import { checkAndUpdateSlug } from '@/app/(master)/dashboard/onboarding/actions';
import type { DayKey, DaySchedule } from './types';

const CAT_TO_TEMPLATE: Record<string, string> = {
  nails: 'nails',
  hair: 'hair',
  brows: 'brows',
  makeup: 'makeup',
  massage: 'massage',
  barber: 'barbershop',
  other: '',
};

const GRADIENT_PAIRS: [string, string][] = [
  ['#6366f1', '#8b5cf6'],
  ['#ec4899', '#f43f5e'],
  ['#f59e0b', '#f97316'],
  ['#10b981', '#0ea5e9'],
  ['#06b6d4', '#6366f1'],
  ['#a78bfa', '#ec4899'],
  ['#34d399', '#059669'],
  ['#fb923c', '#ec4899'],
];

const TILE_ACCENTS = [
  { bg: 'rgba(99,102,241,0.10)',  border: 'rgba(99,102,241,0.18)',  dot: '#6366f1' },
  { bg: 'rgba(236,72,153,0.09)',  border: 'rgba(236,72,153,0.16)',  dot: '#ec4899' },
  { bg: 'rgba(16,185,129,0.09)', border: 'rgba(16,185,129,0.16)', dot: '#10b981' },
];

type IconComp = ComponentType<{ size?: number; style?: React.CSSProperties }>;
const CAT_ICON_MAP: Record<string, IconComp> = {
  nails: Sparkles,
  hair: Scissors,
  barber: Scissors,
  brows: Eye,
  makeup: Star,
  massage: Leaf,
};

const DAY_LABELS: Record<DayKey, string> = {
  mon: 'Пн', tue: 'Вт', wed: 'Ср', thu: 'Чт', fri: 'Пт', sat: 'Сб', sun: 'Нд',
};
const DAY_ORDER: DayKey[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

const SLUG_RE = /^[a-z0-9-]{3,32}$/;

function nameToGradient(name: string): [string, string] {
  const idx = name.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) % GRADIENT_PAIRS.length;
  return GRADIENT_PAIRS[idx];
}

function hexLuminance(hex: string): number {
  const h = hex.replace('#', '');
  const toLinear = (v: number) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
  const r = toLinear(parseInt(h.slice(0, 2), 16) / 255);
  const g = toLinear(parseInt(h.slice(2, 4), 16) / 255);
  const b = toLinear(parseInt(h.slice(4, 6), 16) / 255);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

interface PreviewService {
  name: string;
  price: number;
  duration: number;
  catId: string;
}

interface StepPreviewProps {
  direction: number;
  slideVariants: Variants;
  transition: object;
  fullName: string;
  avatarUrl?: string;
  selectedCategories: string[];
  categoryPrices: Record<string, string>;
  categoryServiceTypes: Record<string, Record<string, boolean>>;
  schedule: Record<DayKey, DaySchedule>;
  slug: string;
  onNext: () => void;
  onSlugChange: (newSlug: string) => void;
}

function buildPreviewServices(
  selectedCategories: string[],
  categoryPrices: Record<string, string>,
  categoryServiceTypes: Record<string, Record<string, boolean>>,
): PreviewService[] {
  const services: PreviewService[] = [];
  for (const catId of selectedCategories) {
    const templateKey = CAT_TO_TEMPLATE[catId];
    if (!templateKey || !CATEGORY_TEMPLATES[templateKey]) continue;
    const template = CATEGORY_TEMPLATES[templateKey];
    const basePrice = parseFloat(categoryPrices[catId] ?? '0') || 0;
    if (basePrice <= 0) continue;
    const types = categoryServiceTypes[catId] ?? { express: true, standard: true, premium: true };
    const tiers = ['express', 'standard', 'premium'] as const;
    tiers
      .filter(tier => types[tier] !== false)
      .forEach(tier => {
        const def = template[tier];
        services.push({
          name: def.name,
          price: Math.round(basePrice * def.priceMult),
          duration: def.time,
          catId,
        });
      });
  }
  return services;
}

function formatDur(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h > 0) return m > 0 ? `${h} год ${m} хв` : `${h} год`;
  return `${m} хв`;
}

export function StepPreview({
  direction,
  slideVariants,
  transition,
  fullName,
  avatarUrl,
  selectedCategories,
  categoryPrices,
  categoryServiceTypes,
  schedule,
  slug,
  onNext,
  onSlugChange,
}: StepPreviewProps) {
  const [copied, setCopied] = useState(false);
  const [isEditingSlug, setIsEditingSlug] = useState(false);
  const [slugDraft, setSlugDraft] = useState(slug);
  const [slugChecking, setSlugChecking] = useState(false);
  const [slugError, setSlugError] = useState<string | null>(null);

  const publicUrl     = slug ? `bookit.com.ua/${slug}` : 'bookit.com.ua/твій-нік';
  const fullPublicUrl = slug ? `https://bookit.com.ua/${slug}` : '#';

  const previewServices = buildPreviewServices(selectedCategories, categoryPrices, categoryServiceTypes);

  const [g1, g2] = nameToGradient(fullName || 'M');
  const avatarFg = hexLuminance(g1) > 0.35 ? '#1e293b' : '#ffffff';

  const initials = (fullName || '')
    .split(' ')
    .map(w => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase() || '?';

  const specialtyLabel = selectedCategories
    .map(id => serviceCategories.find(c => c.id === id)?.label)
    .filter(Boolean)
    .slice(0, 2)
    .join(', ');

  async function handleCopy() {
    if (!slug) return;
    try {
      await navigator.clipboard.writeText(fullPublicUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* clipboard unavailable in some envs */ }
  }

  async function handleSlugSave() {
    const trimmed = slugDraft.trim().toLowerCase();
    if (!SLUG_RE.test(trimmed)) {
      setSlugError('Тільки латиниця, цифри та дефіс (3–32 символи)');
      return;
    }
    if (trimmed === slug) { setIsEditingSlug(false); return; }
    setSlugChecking(true);
    setSlugError(null);
    const { error } = await checkAndUpdateSlug(trimmed);
    setSlugChecking(false);
    if (error) { setSlugError(error); return; }
    onSlugChange(trimmed);
    setSlugDraft(trimmed);
    setIsEditingSlug(false);
  }

  function handleSlugKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') { e.preventDefault(); handleSlugSave(); }
    if (e.key === 'Escape') { setIsEditingSlug(false); setSlugDraft(slug); setSlugError(null); }
  }

  return (
    <motion.div
      key="PREVIEW"
      custom={direction}
      variants={slideVariants}
      initial="enter"
      animate="center"
      exit="exit"
      transition={transition}
    >
      <h2 className="heading-serif text-xl text-foreground mb-0.5">Ось твоя сторінка</h2>
      <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
        Клієнти побачать саме це
      </p>

      {/* Glassmorphism portrait card */}
      <div className="flex justify-center mb-5">
        <div
          className="relative overflow-hidden"
          style={{
            width: 280,
            height: 456,
            borderRadius: 28,
            background: 'rgba(218, 226, 255, 0.48)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            border: '1px solid rgba(255, 255, 255, 0.72)',
            boxShadow: [
              '0 32px 72px -12px rgba(15, 23, 42, 0.20)',
              '0 8px 24px -4px rgba(99, 102, 241, 0.12)',
              '0 0 0 0.5px rgba(255,255,255,0.38)',
            ].join(', '),
          }}
        >
          {/* Ambient aurora blobs */}
          <div aria-hidden="true" className="absolute inset-0 pointer-events-none overflow-hidden">
            <div style={{
              position: 'absolute', top: '-25%', right: '-15%',
              width: '55%', height: '50%',
              background: `radial-gradient(ellipse, ${g1}28 0%, transparent 70%)`,
              filter: 'blur(30px)',
            }} />
            <div style={{
              position: 'absolute', bottom: '-20%', left: '-10%',
              width: '50%', height: '45%',
              background: `radial-gradient(ellipse, ${g2}22 0%, transparent 70%)`,
              filter: 'blur(26px)',
            }} />
          </div>

          <div className="relative z-10 flex flex-col h-full px-5 pt-5 pb-4">

            {/* Avatar + identity */}
            <div className="flex flex-col items-center mb-3">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center mb-2.5 overflow-hidden flex-shrink-0"
                style={{
                  background: avatarUrl ? undefined : `linear-gradient(140deg, ${g1} 0%, ${g2} 100%)`,
                  boxShadow: avatarUrl
                    ? '0 4px 16px -2px rgba(15, 23, 42, 0.18)'
                    : `0 6px 20px -4px ${g1}50`,
                }}
              >
                {avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-[20px] font-bold tracking-tight" style={{ color: avatarFg }}>{initials}</span>
                )}
              </div>

              <div className="flex items-center gap-1 mb-0.5">
                <p className="text-[14px] font-bold text-foreground leading-tight text-center">
                  {fullName || "Ваше ім'я"}
                </p>
                <BadgeCheck size={13} style={{ color: g1 }} />
              </div>

              {specialtyLabel && (
                <p className="text-[9px] mb-2" style={{ color: 'var(--text-secondary)' }}>
                  {specialtyLabel}
                </p>
              )}

              <div
                className="flex items-center gap-1 px-2 py-0.5 rounded-full"
                style={{ background: `${g1}18`, border: `1px solid ${g1}28` }}
              >
                <Star size={8} fill={g1} style={{ color: g1 }} />
                <span className="text-[9px] font-semibold text-foreground">5.0</span>
                <span className="text-[9px]" style={{ color: 'var(--text-secondary)' }}>· перший запис</span>
              </div>
            </div>

            {/* Separator */}
            <div className="w-full mb-2.5" style={{ height: 1, background: 'rgba(255,255,255,0.45)' }} />

            {/* Schedule */}
            <div className="mb-2.5">
              <p className="text-[8px] font-semibold uppercase tracking-widest mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                Графік роботи
              </p>
              <div className="grid grid-cols-7">
                {DAY_ORDER.map(day => {
                  const d = schedule[day];
                  const isWorking = d?.is_working;
                  return (
                    <div key={day} className="flex flex-col items-center gap-0.5">
                      <span
                        className="text-[8px] font-semibold"
                        style={{
                          color: isWorking ? 'var(--foreground)' : 'var(--text-secondary)',
                          opacity: isWorking ? 1 : 0.35,
                        }}
                      >
                        {DAY_LABELS[day]}
                      </span>
                      <span
                        className="text-[7px]"
                        style={{
                          color: isWorking ? 'var(--foreground)' : 'var(--text-secondary)',
                          opacity: isWorking ? 0.75 : 0.25,
                        }}
                      >
                        {isWorking ? d.start_time.slice(0, 5) : '—'}
                      </span>
                      <span
                        className="text-[7px]"
                        style={{ color: 'var(--text-secondary)', opacity: isWorking ? 0.5 : 0 }}
                      >
                        {isWorking ? d.end_time.slice(0, 5) : ''}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Separator */}
            <div className="w-full mb-2.5" style={{ height: 1, background: 'rgba(255,255,255,0.45)' }} />

            {/* Services */}
            <div className="flex-1 min-h-0">
              <p className="text-[8px] font-semibold uppercase tracking-widest mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                Основні послуги
              </p>
              {previewServices.length > 0 ? (
                <div className="flex flex-col gap-1">
                  {previewServices.slice(0, 3).map((svc, i) => {
                    const acc = TILE_ACCENTS[i % TILE_ACCENTS.length];
                    const Icon = CAT_ICON_MAP[svc.catId] ?? Zap;
                    return (
                      <div
                        key={i}
                        className="flex items-center justify-between rounded-xl px-2.5 py-1.5 border"
                        style={{ background: acc.bg, borderColor: acc.border }}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <div
                            className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0"
                            style={{ background: `${acc.dot}20` }}
                          >
                            <Icon size={11} style={{ color: acc.dot }} />
                          </div>
                          <div className="min-w-0">
                            <p className="text-[10px] font-semibold text-foreground truncate leading-tight">
                              {svc.name}
                            </p>
                            <p className="text-[8px] flex items-center gap-0.5" style={{ color: 'var(--text-secondary)' }}>
                              <Clock size={6} className="inline" />
                              {formatDur(svc.duration)}
                            </p>
                          </div>
                        </div>
                        <p className="text-[11px] font-bold text-foreground flex-shrink-0 ml-2">
                          {svc.price.toLocaleString('uk-UA')} ₴
                        </p>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div
                  className="rounded-xl border p-3 text-center"
                  style={{ background: 'rgba(218,226,255,0.35)', borderColor: 'rgba(99,102,241,0.12)' }}
                >
                  <p className="text-[10px] font-medium text-foreground">Послуги незабаром</p>
                </div>
              )}
            </div>

            {/* Decorative CTA */}
            <div
              className="mt-3 w-full py-2 rounded-2xl text-center text-[11px] font-semibold"
              style={{ background: 'var(--accent)', color: 'var(--accent-on)' }}
              aria-hidden="true"
            >
              Записатися
            </div>
          </div>
        </div>
      </div>

      {/* URL block with slug editing */}
      <div
        className="rounded-2xl px-4 py-3.5 mb-5 border"
        style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
      >
        {isEditingSlug ? (
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <span className="text-[12px] font-mono flex-shrink-0" style={{ color: 'var(--text-secondary)', opacity: 0.6 }}>
                bookit.com.ua/
              </span>
              <input
                type="text"
                value={slugDraft}
                onChange={e => {
                  setSlugDraft(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''));
                  setSlugError(null);
                }}
                onKeyDown={handleSlugKeyDown}
                autoFocus
                maxLength={32}
                placeholder="твій-нік"
                className="flex-1 text-[13px] font-mono bg-transparent outline-none border-b text-foreground min-w-0"
                style={{ borderColor: slugError ? 'var(--destructive)' : 'var(--accent)' }}
                aria-label="Адреса публічної сторінки"
              />
              {slugChecking ? (
                <Loader2 size={15} className="animate-spin flex-shrink-0" style={{ color: 'var(--text-secondary)' }} />
              ) : (
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    type="button"
                    onClick={handleSlugSave}
                    aria-label="Зберегти"
                    className="w-7 h-7 flex items-center justify-center rounded-lg cursor-pointer active:scale-[0.95]"
                    style={{ background: 'color-mix(in srgb, var(--accent) 14%, transparent)', color: 'var(--accent)' }}
                  >
                    <Check size={13} />
                  </button>
                  <button
                    type="button"
                    onClick={() => { setIsEditingSlug(false); setSlugDraft(slug); setSlugError(null); }}
                    aria-label="Скасувати"
                    className="w-7 h-7 flex items-center justify-center rounded-lg cursor-pointer active:scale-[0.95]"
                    style={{ background: 'var(--secondary)', color: 'var(--text-secondary)' }}
                  >
                    <X size={13} />
                  </button>
                </div>
              )}
            </div>
            {slugError && (
              <p className="text-[11px] font-medium" style={{ color: 'var(--destructive)' }}>
                {slugError}
              </p>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <p className="flex-1 text-[13px] font-mono truncate text-foreground">
              {publicUrl}
            </p>
            {slug && (
              <button
                type="button"
                onClick={() => setIsEditingSlug(true)}
                aria-label="Змінити адресу"
                className="w-8 h-8 flex items-center justify-center rounded-xl cursor-pointer active:scale-[0.95]"
                style={{ background: 'var(--secondary)', color: 'var(--text-secondary)' }}
              >
                <Pencil size={12} />
              </button>
            )}
            <button
              type="button"
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[12px] font-medium transition-all cursor-pointer active:scale-[0.95]"
              style={{
                background: copied
                  ? 'color-mix(in srgb, var(--accent) 14%, transparent)'
                  : 'var(--secondary)',
                color: copied ? 'var(--accent)' : 'var(--text-secondary)',
              }}
            >
              {copied ? <Check size={12} /> : <Copy size={12} />}
              {copied ? 'Скопійовано' : 'Копіювати'}
            </button>
            {slug && (
              <a
                href={fullPublicUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Відкрити сторінку"
                className="w-8 h-8 flex items-center justify-center rounded-xl cursor-pointer active:scale-[0.95]"
                style={{ background: 'var(--secondary)', color: 'var(--text-secondary)' }}
              >
                <ExternalLink size={13} />
              </a>
            )}
          </div>
        )}
      </div>

      {/* Next step */}
      <button
        type="button"
        onClick={onNext}
        className="w-full py-3.5 rounded-full font-semibold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-[0.97]"
        style={{ background: 'var(--btn-primary-bg, var(--accent))', color: 'var(--accent-on)' }}
      >
        Далі <ArrowRight size={15} />
      </button>
    </motion.div>
  );
}
