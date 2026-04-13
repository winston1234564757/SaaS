'use client';

import { useEffect, useRef } from 'react';
import { motion, type Variants } from 'framer-motion';
import { ArrowRight, Camera, Loader2 } from 'lucide-react';
import { formatPhoneDisplay, normalizePhoneInput } from '@/lib/utils/phone';
import { SPECIALIZATIONS, inputCls } from './types';

interface StepBasicProps {
  direction: number;
  slideVariants: Variants;
  transition: object;
  avatarPreview: string;
  specialization: string;
  fullName: string;
  phone: string;
  hasPhone: boolean;
  saving: boolean;
  onAvatarChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSpecializationChange: (emoji: string) => void;
  onFullNameChange: (v: string) => void;
  onPhoneChange: (v: string) => void;
  onSave: () => void;
}

export function StepBasic({
  direction,
  slideVariants,
  transition,
  avatarPreview,
  specialization,
  fullName,
  phone,
  hasPhone,
  saving,
  onAvatarChange,
  onSpecializationChange,
  onFullNameChange,
  onPhoneChange,
  onSave,
}: StepBasicProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const firstInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const t = setTimeout(() => firstInputRef.current?.focus(), 150);
    return () => clearTimeout(t);
  }, []);

  return (
    <motion.div
      key="BASIC"
      custom={direction}
      variants={slideVariants}
      initial="enter"
      animate="center"
      exit="exit"
      transition={transition}
      className="bento-card p-6"
    >
      <h2 className="heading-serif text-xl text-[#2C1A14] mb-0.5">Обличчя бренду</h2>
      <p className="text-sm text-[#A8928D] mb-6">Як тебе побачать клієнти</p>

      <div className="flex flex-col items-center mb-6">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="relative w-24 h-24 rounded-full overflow-hidden border-2 border-[#789A99]/30 bg-white/70 flex items-center justify-center group hover:border-[#789A99] transition-colors"
        >
          {avatarPreview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatarPreview} alt="Аватар" className="w-full h-full object-cover" />
          ) : (
            <span className="text-4xl">{specialization}</span>
          )}
          <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-full">
            <Camera size={20} className="text-white" />
          </div>
        </button>
        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={onAvatarChange} />
        <p className="text-xs text-[#A8928D] mt-2">Натисни щоб додати фото</p>
      </div>

      <div className="flex flex-col gap-4">
        <div>
          <label className="text-xs font-medium text-[#6B5750] mb-1.5 block">{"Ім'я та прізвище"}</label>
          <input ref={firstInputRef} value={fullName} onChange={e => onFullNameChange(e.target.value)} placeholder="Ксенія Коваль" className={inputCls} />
        </div>
        {!hasPhone && (
          <div>
            <label className="text-xs font-medium text-[#6B5750] mb-1.5 block">Мобільний телефон</label>
            <div className="flex items-center gap-0 rounded-2xl border border-white/80 bg-white/70 overflow-hidden focus-within:border-[#789A99] focus-within:ring-2 focus-within:ring-[#789A99]/20 transition-all">
              <span className="pl-4 pr-2 text-[#6B5750] font-medium text-sm select-none shrink-0">+38</span>
              <input
                type="tel"
                inputMode="numeric"
                placeholder="0XX XXX XX XX"
                value={formatPhoneDisplay(phone)}
                onChange={e => onPhoneChange(normalizePhoneInput(e.target.value))}
                className="flex-1 py-3 pr-4 text-[#2C1A14] text-sm bg-transparent outline-none placeholder:text-[#A8928D]"
              />
            </div>
          </div>
        )}
        <div>
          <label className="text-xs font-medium text-[#6B5750] mb-2 block">Спеціалізація</label>
          <div className="grid grid-cols-4 gap-2">
            {SPECIALIZATIONS.map(s => (
              <button
                key={s.emoji}
                type="button"
                onClick={() => onSpecializationChange(s.emoji)}
                className={`flex flex-col items-center gap-1 py-2.5 rounded-2xl text-xs transition-all ${
                  specialization === s.emoji
                    ? 'bg-[#789A99]/15 ring-2 ring-[#789A99] text-[#2C1A14] font-medium'
                    : 'bg-white/70 border border-white/80 text-[#6B5750] hover:bg-white'
                }`}
              >
                <span className="text-xl">{s.emoji}</span>
                <span className="text-[9px] leading-tight text-center">{s.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={onSave}
        disabled={!fullName.trim() || saving}
        className="mt-6 w-full py-3.5 rounded-2xl bg-[#789A99] text-white font-semibold text-sm flex items-center justify-center gap-2 hover:bg-[#5C7E7D] transition-colors disabled:opacity-50"
      >
        {saving
          ? <><Loader2 size={16} className="animate-spin" /> Зберігаємо...</>
          : <>Далі <ArrowRight size={16} /></>}
      </button>
    </motion.div>
  );
}
