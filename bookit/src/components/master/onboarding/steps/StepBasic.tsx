'use client';

import { useEffect, useRef } from 'react';
import { motion, type Variants } from 'framer-motion';
import { ArrowRight, Camera, Loader2, User } from 'lucide-react';
import { formatPhoneDisplay, normalizePhoneInput } from '@/lib/utils/phone';
import { inputCls } from './types';

interface StepBasicProps {
  direction: number;
  slideVariants: Variants;
  transition: object;
  avatarPreview: string;
  fullName: string;
  phone: string;
  hasPhone: boolean;
  saving: boolean;
  onAvatarChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onFullNameChange: (v: string) => void;
  onPhoneChange: (v: string) => void;
  onSave: () => void;
}

export function StepBasic({
  direction,
  slideVariants,
  transition,
  avatarPreview,
  fullName,
  phone,
  hasPhone,
  saving,
  onAvatarChange,
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

      {/* Avatar */}
      <div className="flex flex-col items-center mb-6">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="relative w-24 h-24 rounded-full overflow-hidden border-2 border-[#789A99]/30 bg-white/70 flex items-center justify-center group hover:border-[#789A99] transition-colors cursor-pointer"
        >
          {avatarPreview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatarPreview} alt="Аватар" className="w-full h-full object-cover" />
          ) : (
            <User size={36} className="text-[#A8928D]" />
          )}
          <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-full">
            <Camera size={20} className="text-white" />
          </div>
        </button>
        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={onAvatarChange} />
        <p className="text-xs text-[#A8928D] mt-2">Натисни щоб додати фото</p>
      </div>

      <div className="flex flex-col gap-4">
        {/* Name */}
        <div>
          <label className="text-xs font-medium text-[#6B5750] mb-1.5 block">{"Ім'я та прізвище"}</label>
          <input
            ref={firstInputRef}
            value={fullName}
            onChange={e => onFullNameChange(e.target.value)}
            placeholder="Ксенія Коваль"
            className={inputCls}
          />
        </div>

        {/* Phone */}
        {!hasPhone && (
          <div>
            <label className="text-xs font-medium text-[#6B5750] mb-1.5 block">Мобільний телефон</label>
            <div className="flex items-center rounded-2xl border border-white/80 bg-white/70 overflow-hidden focus-within:border-[#789A99] focus-within:ring-2 focus-within:ring-[#789A99]/20 transition-all">
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
      </div>

      <button
        type="button"
        onClick={onSave}
        disabled={!fullName.trim() || saving}
        className="mt-6 w-full py-3.5 rounded-2xl bg-[#789A99] text-white font-semibold text-sm flex items-center justify-center gap-2 hover:bg-[#5C7E7D] transition-colors disabled:opacity-50 cursor-pointer"
      >
        {saving
          ? <><Loader2 size={16} className="animate-spin" /> Зберігаємо...</>
          : <>Далі <ArrowRight size={16} /></>}
      </button>
    </motion.div>
  );
}
