'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, type Variants } from 'framer-motion';
import { ArrowRight, Camera, Loader2, User } from 'lucide-react';
import { formatPhoneDisplay, normalizePhoneInput } from '@/lib/utils/phone';
import { serviceCategories } from '@/lib/constants/categories';
import { cn } from '@/lib/utils/cn';
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
  selectedCategories: string[];
  onCategoriesChange: (v: string[]) => void;
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
  selectedCategories,
  onCategoriesChange,
  onSave,
}: StepBasicProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const firstInputRef = useRef<HTMLInputElement>(null);
  const [showErrors, setShowErrors] = useState(false);

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
      <h2 className="heading-serif text-xl text-foreground mb-0.5">Обличчя бренду</h2>
      <p className="text-sm text-muted-foreground/60 mb-6">Як тебе побачать клієнти</p>

      {/* Avatar */}
      <div className="flex flex-col items-center mb-6">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="relative w-24 h-24 rounded-full overflow-hidden border-2 border-primary/30 bg-white/70 flex items-center justify-center group hover:border-primary transition-colors cursor-pointer"
        >
          {avatarPreview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatarPreview} alt="Аватар" className="w-full h-full object-cover" />
          ) : (
            <User size={36} className="text-muted-foreground/60" />
          )}
          <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-full">
            <Camera size={20} className="text-white" />
          </div>
        </button>
        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={onAvatarChange} />
        <p className="text-xs text-muted-foreground/60 mt-2">Натисни щоб додати фото</p>
      </div>

      <div className="flex flex-col gap-4">
        {/* Name */}
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1.5 block">{"Ім'я та прізвище"}</label>
          <input
            ref={firstInputRef}
            value={fullName}
            onChange={e => { onFullNameChange(e.target.value); setShowErrors(false); }}
            placeholder="Ксенія Коваль"
            className={inputCls}
            aria-invalid={showErrors && !fullName.trim()}
            aria-describedby={showErrors && !fullName.trim() ? "name-error" : undefined}
          />
          {showErrors && !fullName.trim() && (
            <p className="text-destructive text-[11px] mt-1.5 ml-1 font-medium" id="name-error">
              Будь ласка, вкажіть ваше ім'я
            </p>
          )}
        </div>

        {/* Phone */}
        {!hasPhone && (
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Мобільний телефон</label>
            <div className="flex items-center rounded-2xl border border-white/80 bg-white/70 overflow-hidden focus-within:border-primary focus-within:ring-2 focus-within:ring-[#789A99]/20 transition-all">
              <span className="pl-4 pr-2 text-muted-foreground font-medium text-sm select-none shrink-0">+38</span>
              <input
                type="tel"
                inputMode="numeric"
                placeholder="0XX XXX XX XX"
                value={formatPhoneDisplay(phone)}
                onChange={e => { onPhoneChange(normalizePhoneInput(e.target.value)); setShowErrors(false); }}
                className="flex-1 py-3 pr-4 text-foreground text-sm bg-transparent outline-none placeholder:text-muted-foreground/60"
                aria-invalid={showErrors && phone.replace(/\D/g, '').length < 9}
              />
            </div>
            {showErrors && phone.replace(/\D/g, '').length < 9 && (
              <p className="text-destructive text-[11px] mt-1.5 ml-1 font-medium">
                Введіть коректний номер телефону
              </p>
            )}
          </div>
        )}

        {/* Categories Multi-select */}
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-3 block">Твоя спеціалізація (можна кілька)</label>
          <div className="flex flex-wrap gap-2">
            {serviceCategories.map(cat => {
              const isSelected = selectedCategories.includes(cat.id);
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => {
                    if (isSelected) {
                      onCategoriesChange(selectedCategories.filter(c => c !== cat.id));
                    } else {
                      onCategoriesChange([...selectedCategories, cat.id]);
                    }
                  }}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all border",
                    isSelected 
                      ? "bg-primary/15 border-primary text-primary" 
                      : "bg-white/50 border-white/80 text-muted-foreground hover:border-primary/30"
                  )}
                >
                  <span>{cat.emoji}</span>
                  {cat.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={() => {
          if (!fullName.trim() || (!hasPhone && phone.replace(/\D/g, '').length < 9)) {
            setShowErrors(true);
            return;
          }
          onSave();
        }}
        disabled={saving}
        className="mt-6 w-full py-3.5 rounded-2xl bg-primary text-white font-semibold text-sm flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors disabled:opacity-50 cursor-pointer active:scale-95 transition-all"
      >
        {saving
          ? <><Loader2 size={16} className="animate-spin" /> Зберігаємо...</>
          : <>Далі <ArrowRight size={16} /></>}
      </button>
    </motion.div>
  );
}
