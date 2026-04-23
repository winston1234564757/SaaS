'use client';

import { motion, type Variants, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Loader2, Check, User, Zap, ChevronRight,
  Sparkles, Clock, Star,
} from 'lucide-react';
import { CATEGORY_TEMPLATES } from '@/lib/constants/onboardingTemplates';
import { inputCls } from './types';

interface StepProfilePreviewProps {
  direction: number;
  slideVariants: Variants;
  transition: object;
  fullName: string;
  avatarPreview: string;
  businessName: string;
  slug: string;
  serviceCategoryId: string;
  serviceBasePrice: string;
  selectedServiceTypes: Record<string, boolean>;
  flashDealsEnabled: boolean;
  isPro: boolean;
  saving: boolean;
  onBusinessNameChange: (v: string) => void;
  onSave: () => void;
  onBack: () => void;
}

/* ── Derive up to 3 service preview items from wizard state ── */
function deriveServices(
  categoryId: string,
  basePrice: string,
  selectedTypes: Record<string, boolean>,
) {
  const template = CATEGORY_TEMPLATES[categoryId];
  const base = parseFloat(basePrice);
  if (!template || isNaN(base) || base <= 0) return [];

  return (['express', 'standard', 'premium'] as const)
    .filter(t => selectedTypes?.[t])
    .map(t => ({
      name: template[t].name,
      price: Math.round(base * template[t].priceMult),
      time: template[t].time,
      tier: t,
    }))
    .slice(0, 3);
}

/* ── Tier accent colors ── */
const TIER_COLOR: Record<string, string> = {
  express:  '#C0927A',
  standard: '#789A99',
  premium:  '#A07820',
};

/* ── Phone Mockup ── */
function PhoneMockup({
  fullName,
  avatarPreview,
  businessName,
  slug,
  services,
  flashDealsEnabled,
}: {
  fullName: string;
  avatarPreview: string;
  businessName: string;
  slug: string;
  services: ReturnType<typeof deriveServices>;
  flashDealsEnabled: boolean;
}) {
  const displayName = businessName.trim() || fullName || 'Ваше ім\'я';
  const displaySlug = slug || 'your-name';

  return (
    <div className="relative mx-auto" style={{ width: 220 }}>
      {/* Glow behind phone */}
      <div
        className="absolute inset-0 rounded-[36px] blur-2xl opacity-30 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse, #789A99 0%, #FFE8DC 70%)' }}
      />

      {/* Phone body */}
      <div
        className="relative rounded-[32px] overflow-hidden shadow-2xl"
        style={{
          border: '5px solid #2C1A14',
          background: '#FFE8DC',
          height: 430,
        }}
      >
        {/* Side button decorations */}
        <div className="absolute left-[-8px] top-[70px] w-1 h-8 rounded-l-full bg-[#2C1A14]" />
        <div className="absolute left-[-8px] top-[110px] w-1 h-12 rounded-l-full bg-[#2C1A14]" />
        <div className="absolute right-[-8px] top-[90px] w-1 h-14 rounded-r-full bg-[#2C1A14]" />

        {/* Status bar */}
        <div className="flex justify-between items-center px-4 pt-3 pb-1">
          <span className="text-[9px] font-semibold text-[#2C1A14]">9:41</span>
          <div className="w-14 h-3 rounded-full bg-[#2C1A14]" />
          <div className="flex items-center gap-0.5">
            <div className="w-2.5 h-1.5 rounded-sm border border-[#2C1A14]/60" style={{ fontSize: 0 }}>
              <div className="h-full w-3/4 bg-[#2C1A14]/60 rounded-sm" />
            </div>
          </div>
        </div>

        {/* Scrollable content */}
        <div className="px-2.5 pb-3 space-y-2 overflow-hidden" style={{ height: 'calc(100% - 32px)' }}>

          {/* Profile card */}
          <div
            className="rounded-2xl px-3 py-2.5"
            style={{ background: 'rgba(255,255,255,0.72)', backdropFilter: 'blur(8px)' }}
          >
            <div className="flex items-center gap-2">
              {/* Avatar */}
              <div
                className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center shrink-0"
                style={{ background: '#E8D0C8' }}
              >
                {avatarPreview
                  ? <img src={avatarPreview} alt="" className="w-full h-full object-cover" />
                  : <User size={16} className="text-[#A8928D]" />}
              </div>

              <div className="min-w-0">
                <p className="text-[10px] font-bold text-[#2C1A14] font-display leading-tight truncate">
                  {displayName}
                </p>
                <p className="text-[8px] text-[#A8928D] truncate">
                  bookit.com.ua/{displaySlug}
                </p>
              </div>
            </div>

            {/* Flash deal badge */}
            <AnimatePresence>
              {flashDealsEnabled && (
                <motion.div
                  initial={{ opacity: 0, height: 0, marginTop: 0 }}
                  animate={{ opacity: 1, height: 'auto', marginTop: 6 }}
                  exit={{ opacity: 0, height: 0, marginTop: 0 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden"
                >
                  <div
                    className="flex items-center gap-1 px-2 py-1 rounded-lg"
                    style={{ background: 'linear-gradient(135deg, #FFFBF0, #FDF6E3)', border: '1px solid #E8C97A' }}
                  >
                    <Zap size={8} className="text-[#C99020] shrink-0" strokeWidth={2.5} />
                    <span className="text-[8px] font-semibold text-[#7A5800]">Flash Deal — вільні вікна зі знижкою</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Services */}
          {services.length > 0 ? (
            <div className="space-y-1.5">
              {services.map((svc, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.06 }}
                  className="flex items-center justify-between px-2.5 py-2 rounded-xl"
                  style={{ background: 'rgba(255,255,255,0.68)', border: `1.5px solid ${TIER_COLOR[svc.tier]}22` }}
                >
                  <div className="flex items-center gap-1.5 min-w-0">
                    <div
                      className="w-1 self-stretch rounded-full shrink-0"
                      style={{ background: TIER_COLOR[svc.tier] }}
                    />
                    <div className="min-w-0">
                      <p className="text-[8px] font-semibold text-[#2C1A14] leading-tight line-clamp-1">
                        {svc.name}
                      </p>
                      <div className="flex items-center gap-1 mt-0.5">
                        <Clock size={6} className="text-[#A8928D]" />
                        <span className="text-[7px] text-[#A8928D]">{svc.time} хв</span>
                      </div>
                    </div>
                  </div>
                  <p
                    className="text-[9px] font-bold shrink-0 ml-1"
                    style={{ color: TIER_COLOR[svc.tier] }}
                  >
                    {svc.price}₴
                  </p>
                </motion.div>
              ))}
            </div>
          ) : (
            <div
              className="rounded-xl px-3 py-3 text-center"
              style={{ background: 'rgba(255,255,255,0.5)', border: '1px dashed #E8D5CF' }}
            >
              <Sparkles size={12} className="mx-auto text-[#A8928D] mb-1" />
              <p className="text-[8px] text-[#A8928D]">Послуги з'являться тут</p>
            </div>
          )}

          {/* Rating row */}
          <div
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl"
            style={{ background: 'rgba(255,255,255,0.5)' }}
          >
            {[1,2,3,4,5].map(n => (
              <Star key={n} size={8} fill="#D4935A" color="#D4935A" />
            ))}
            <span className="text-[8px] text-[#A8928D] ml-0.5">Нові відгуки чекають!</span>
          </div>

          {/* Book CTA */}
          <div
            className="flex items-center justify-between px-3 py-2 rounded-2xl"
            style={{
              background: 'linear-gradient(135deg, #2C1A14 0%, #4A2E26 100%)',
              marginTop: 'auto',
            }}
          >
            <span className="text-[9px] font-bold text-white">Записатись</span>
            <ChevronRight size={10} className="text-white/70" />
          </div>
        </div>
      </div>

      {/* Live label */}
      <div className="flex justify-center mt-2">
        <span
          className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold"
          style={{ background: '#5C9E7A22', color: '#5C9E7A' }}
        >
          <motion.span
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{ duration: 1.8, repeat: Infinity }}
            className="w-1.5 h-1.5 rounded-full bg-[#5C9E7A] shrink-0"
          />
          Live preview
        </span>
      </div>
    </div>
  );
}

/* ── Main step component ── */
export function StepProfilePreview({
  direction,
  slideVariants,
  transition,
  fullName,
  avatarPreview,
  businessName,
  slug,
  serviceCategoryId,
  serviceBasePrice,
  selectedServiceTypes,
  flashDealsEnabled,
  saving,
  onBusinessNameChange,
  onSave,
  onBack,
}: StepProfilePreviewProps) {
  const services = deriveServices(serviceCategoryId, serviceBasePrice, selectedServiceTypes);

  return (
    <motion.div
      custom={direction}
      variants={slideVariants}
      initial="enter"
      animate="center"
      exit="exit"
      transition={transition}
      className="bento-card overflow-hidden"
    >
      {/* ── Header ── */}
      <div className="px-6 pt-6 pb-5">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs text-[#A8928D] hover:text-[#6B5750] transition-colors mb-5 cursor-pointer"
        >
          <ArrowLeft size={13} /> Назад
        </button>

        <h2 className="font-display text-2xl font-semibold text-[#2C1A14] leading-tight mb-1">
          Твоя сторінка готова 🎉
        </h2>
        <p className="text-sm text-[#A8928D]">
          Так клієнти бачитимуть тебе у Bookit
        </p>
      </div>

      {/* ── Business name input ── */}
      <div className="px-6 pb-4">
        <label className="block text-xs font-semibold text-[#6B5750] mb-1.5">
          Назва кабінету / студії
        </label>
        <input
          type="text"
          placeholder={fullName || 'Nail Studio by Катя'}
          value={businessName}
          onChange={e => onBusinessNameChange(e.target.value)}
          maxLength={60}
          className={inputCls}
        />
        <p className="text-[11px] text-[#A8928D] mt-1.5">
          Показується клієнтам як назва майстра. Залиш порожнім — використаємо ім'я.
        </p>
      </div>

      {/* ── Phone preview ── */}
      <div className="pb-5 px-6">
        <PhoneMockup
          fullName={fullName}
          avatarPreview={avatarPreview}
          businessName={businessName}
          slug={slug}
          services={services}
          flashDealsEnabled={flashDealsEnabled}
        />
      </div>

      {/* ── Actions ── */}
      <div className="flex flex-col gap-2 px-6 pb-6">
        <button
          type="button"
          onClick={onSave}
          disabled={saving}
          className="w-full py-4 rounded-2xl font-semibold text-sm flex items-center justify-center gap-2 transition-all duration-200 disabled:opacity-40 cursor-pointer"
          style={{
            background: 'linear-gradient(135deg, #789A99 0%, #5C7E7D 100%)',
            color: '#fff',
            boxShadow: '0 4px 16px rgba(120,154,153,0.35)',
          }}
        >
          {saving
            ? <><Loader2 size={16} className="animate-spin" /> Зберігаємо...</>
            : <><Check size={16} /> Запустити профіль</>}
        </button>
        <button
          type="button"
          onClick={onBack}
          disabled={saving}
          className="w-full py-2 text-sm text-[#A8928D] hover:text-[#789A99] transition-colors cursor-pointer"
        >
          Назад
        </button>
      </div>
    </motion.div>
  );
}
