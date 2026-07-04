'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, type Variants } from 'framer-motion';
import { ArrowRight, Camera, Loader2, User } from 'lucide-react';
import { formatPhoneDisplay, normalizePhoneInput } from '@/lib/utils/phone';
import { serviceCategories } from '@/lib/constants/categories';
import { cn } from '@/lib/utils/cn';
import { inputCls } from './types';

interface StepProfileProps {
  direction: number;
  slideVariants: Variants;
  transition: object;
  avatarPreview: string;
  fullName: string;
  phone: string;
  hasPhone: boolean;
  saving: boolean;
  selectedCategories: string[];
  onAvatarChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onFullNameChange: (v: string) => void;
  onPhoneChange: (v: string) => void;
  onCategoriesChange: (v: string[]) => void;
  onSave: () => void;
}

export function StepProfile({
  direction,
  slideVariants,
  transition,
  avatarPreview,
  fullName,
  phone,
  hasPhone,
  saving,
  selectedCategories,
  onAvatarChange,
  onFullNameChange,
  onPhoneChange,
  onCategoriesChange,
  onSave,
}: StepProfileProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const firstInputRef = useRef<HTMLInputElement>(null);
  const [showErrors, setShowErrors] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => firstInputRef.current?.focus(), 180);
    return () => clearTimeout(t);
  }, []);

  function handleSubmit() {
    const phoneDigits = phone.replace(/\D/g, '');
    if (!fullName.trim() || (!hasPhone && phoneDigits.length < 9)) {
      setShowErrors(true);
      return;
    }
    onSave();
  }

  function toggleCategory(id: string) {
    if (selectedCategories.includes(id)) {
      onCategoriesChange(selectedCategories.filter(c => c !== id));
    } else {
      onCategoriesChange([...selectedCategories, id]);
    }
  }

  return (
    <motion.div
      key="PROFILE"
      custom={direction}
      variants={slideVariants}
      initial="enter"
      animate="center"
      exit="exit"
      transition={transition}
      className="bento-card p-6"
    >
      <h2 className="heading-serif text-xl text-foreground mb-0.5">Як тебе звати?</h2>
      <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
        Так тебе побачать клієнти
      </p>

      {/* Avatar uploader */}
      <div className="flex flex-col items-center mb-6">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="relative size-20 rounded-[22px] overflow-hidden border border-border bg-surface flex items-center justify-center group hover:border-accent/40 transition-colors cursor-pointer active:scale-[0.97]"
          aria-label="Додати фото"
        >
          {avatarPreview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatarPreview} alt="" className="w-full h-full object-cover" />
          ) : (
            <User size={28} style={{ color: 'var(--text-secondary)' }} />
          )}
          <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <Camera size={18} className="text-white" />
          </div>
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          aria-hidden="true"
          tabIndex={-1}
          onChange={onAvatarChange}
        />
        <p className="text-[11px] mt-2" style={{ color: 'var(--text-secondary)' }}>
          Додай фото
        </p>
      </div>

      <div className="flex flex-col gap-4">
        {/* Name */}
        <div>
          <label className="text-xs font-medium mb-1.5 block" style={{ color: 'var(--text-secondary)' }}>
            {"Ім'я та прізвище"}
          </label>
          <input
            ref={firstInputRef}
            value={fullName}
            onChange={e => { onFullNameChange(e.target.value); setShowErrors(false); }}
            placeholder="Ксенія Коваль"
            aria-label="Ім'я та прізвище"
            aria-invalid={showErrors && !fullName.trim()}
            aria-describedby={showErrors && !fullName.trim() ? 'name-error' : undefined}
            className={inputCls}
          />
          {showErrors && !fullName.trim() && (
            <p className="text-destructive text-[11px] mt-1.5 ml-1 font-medium" id="name-error">
              Вкажи своє ім'я
            </p>
          )}
        </div>

        {/* Phone */}
        {!hasPhone && (
          <div>
            <label className="text-xs font-medium mb-1.5 block" style={{ color: 'var(--text-secondary)' }}>
              Мобільний
            </label>
            <div className="flex items-center rounded-lg border border-border bg-secondary/70 overflow-hidden focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/20 transition-all">
              <span className="pl-4 pr-2 font-medium text-sm select-none shrink-0" style={{ color: 'var(--text-secondary)' }}>
                +38
              </span>
              <input
                type="tel"
                inputMode="numeric"
                placeholder="0XX XXX XX XX"
                value={formatPhoneDisplay(phone)}
                onChange={e => { onPhoneChange(normalizePhoneInput(e.target.value)); setShowErrors(false); }}
                aria-label="Мобільний телефон"
                aria-invalid={showErrors && phone.replace(/\D/g, '').length < 9}
                className="flex-1 py-3 pr-4 text-foreground text-sm bg-transparent outline-none placeholder:text-text-sub"
              />
            </div>
            {showErrors && phone.replace(/\D/g, '').length < 9 && (
              <p className="text-destructive text-[11px] mt-1.5 ml-1 font-medium">
                Введи коректний номер
              </p>
            )}
          </div>
        )}

        {/* Categories */}
        <div>
          <label className="text-xs font-medium mb-3 block" style={{ color: 'var(--text-secondary)' }}>
            Чим займаєшся?
          </label>
          <div className="grid grid-cols-3 gap-2.5">
            {serviceCategories.map(cat => {
              const isSelected = selectedCategories.includes(cat.id);
              return (
                <button
                  key={cat.id}
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => toggleCategory(cat.id)}
                  className={cn(
                    'py-4 px-2 rounded-2xl border-2 text-xs font-semibold text-center leading-tight transition-all cursor-pointer active:scale-[0.95]',
                    isSelected
                      ? 'border-accent'
                      : 'border-border/60 bg-secondary/40 hover:border-accent/40',
                  )}
                  style={isSelected
                    ? { background: 'var(--accent)', color: 'var(--accent-on)' }
                    : { color: 'var(--foreground)' }
                  }
                >
                  {cat.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={handleSubmit}
        disabled={saving}
        className="mt-6 w-full py-3.5 rounded-full font-semibold text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer active:scale-[0.97]"
        style={{ background: 'var(--btn-primary-bg, var(--accent))', color: 'var(--accent-on)' }}
      >
        {saving
          ? <><Loader2 size={16} className="animate-spin" /> Зберігаємо...</>
          : <>Далі <ArrowRight size={15} /></>
        }
      </button>
    </motion.div>
  );
}
