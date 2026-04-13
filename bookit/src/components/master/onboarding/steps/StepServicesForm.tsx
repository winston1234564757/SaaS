'use client';

import { motion, type Variants } from 'framer-motion';
import { ArrowLeft, Check, Loader2 } from 'lucide-react';
import { DURATION_PRESETS, inputCls } from './types';

interface StepServicesFormProps {
  direction: number;
  slideVariants: Variants;
  transition: object;
  serviceName: string;
  servicePrice: string;
  serviceDuration: number;
  saving: boolean;
  onServiceNameChange: (v: string) => void;
  onServicePriceChange: (v: string) => void;
  onServiceDurationChange: (min: number) => void;
  onSave: () => void;
  onBack: () => void;
}

export function StepServicesForm({
  direction,
  slideVariants,
  transition,
  serviceName,
  servicePrice,
  serviceDuration,
  saving,
  onServiceNameChange,
  onServicePriceChange,
  onServiceDurationChange,
  onSave,
  onBack,
}: StepServicesFormProps) {
  return (
    <motion.div
      key="SERVICES_FORM"
      custom={direction}
      variants={slideVariants}
      initial="enter"
      animate="center"
      exit="exit"
      transition={transition}
      className="bento-card p-6"
    >
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-1.5 text-xs text-[#A8928D] hover:text-[#6B5750] transition-colors mb-4"
      >
        <ArrowLeft size={13} /> Назад
      </button>

      <h2 className="heading-serif text-xl text-[#2C1A14] mb-0.5">Ваша коронна послуга</h2>
      <p className="text-sm text-[#A8928D] mb-5">
        Додайте послугу, яку записують найчастіше. Решту зможете додати пізніше.
      </p>

      <div className="flex flex-col gap-4">
        <div>
          <label className="text-xs font-medium text-[#6B5750] mb-1.5 block">Назва послуги</label>
          <input value={serviceName} onChange={e => onServiceNameChange(e.target.value)} placeholder="Манікюр класичний" className={inputCls} />
        </div>
        <div>
          <label className="text-xs font-medium text-[#6B5750] mb-1.5 block">Ціна, ₴</label>
          <input type="number" value={servicePrice} onChange={e => onServicePriceChange(e.target.value)} placeholder="500" min="0" className={inputCls} />
        </div>
        <div>
          <label className="text-xs font-medium text-[#6B5750] mb-2 block">Тривалість</label>
          <div className="flex gap-1.5">
            {DURATION_PRESETS.map(min => (
              <button
                key={min}
                type="button"
                onClick={() => onServiceDurationChange(min)}
                className={`flex-1 py-2 rounded-xl text-xs font-medium transition-all ${
                  serviceDuration === min ? 'bg-[#789A99] text-white' : 'bg-white/70 border border-white/80 text-[#6B5750] hover:bg-white'
                }`}
              >
                {min < 60 ? `${min}хв` : `${min / 60}г`}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-2 mt-6">
        <button
          type="button"
          onClick={onSave}
          disabled={saving || !serviceName.trim() || !servicePrice}
          className="w-full py-3.5 rounded-2xl bg-[#789A99] text-white font-semibold text-sm flex items-center justify-center gap-2 hover:bg-[#5C7E7D] transition-colors disabled:opacity-50"
        >
          {saving
            ? <><Loader2 size={16} className="animate-spin" /> Зберігаємо...</>
            : <><Check size={16} /> Додати послугу</>}
        </button>
        <button
          type="button"
          onClick={onBack}
          disabled={saving}
          className="w-full py-2 text-sm text-[#A8928D] hover:text-[#789A99] transition-colors"
        >
          Скасувати
        </button>
      </div>
    </motion.div>
  );
}
