'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Copy, Check, ChevronDown } from 'lucide-react';

function CopyButton({ text }: { text: string }) {
  const [done, setDone] = useState(false);

  const handleCopy = useCallback(async () => {
    try { await navigator.clipboard.writeText(text); }
    catch {
      const el = document.createElement('textarea');
      el.value = text;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
    }
    setDone(true);
    setTimeout(() => setDone(false), 2200);
  }, [text]);

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={`flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-semibold rounded-xl transition-all cursor-pointer shrink-0 ${
        done ? 'bg-[#5C9E7A]/15 text-[#5C9E7A]' : 'bg-[#789A99]/10 text-[#789A99] hover:bg-[#789A99]/20'
      }`}
    >
      <AnimatePresence mode="wait" initial={false}>
        {done
          ? <motion.span key="c" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} transition={{ duration: 0.12 }}><Check size={10} strokeWidth={3} /></motion.span>
          : <motion.span key="n" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} transition={{ duration: 0.12 }}><Copy size={10} /></motion.span>}
      </AnimatePresence>
      {done ? 'Скопійовано' : 'Скопіювати'}
    </button>
  );
}

interface PromoTemplatesProps {
  slug: string;
  /** Якщо true — секція розгорнута одразу */
  defaultOpen?: boolean;
}

export function PromoTemplates({ slug, defaultOpen = false }: PromoTemplatesProps) {
  const [open, setOpen] = useState(defaultOpen);
  const shortUrl = `bookit.com.ua/${slug}`;

  const templates = [
    {
      label: 'Stories / Reels',
      badge: 'Instagram',
      text: `Мій розклад тепер у вашому телефоні 24/7! 🤍 Більше ніяких довгих переписок — обирайте зручний час самостійно за посиланням:\n${shortUrl}`,
    },
    {
      label: 'Bio',
      badge: 'Профіль',
      text: `Онлайн-запис 24/7 👇\n${shortUrl}`,
    },
    {
      label: 'Швидка відповідь',
      badge: 'Direct / Viber',
      text: `Привіт! Щоб не чекати мою відповідь, ти можеш переглянути всі вільні віконечка та записатися самостійно ось тут: ${shortUrl}. Це дуже зручно!`,
    },
  ];

  return (
    <div className="mt-3">
      {/* Toggle */}
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-white/40 hover:bg-white/60 transition-all cursor-pointer group"
      >
        <span className="text-xs font-semibold text-[#6B5750] group-hover:text-[#2C1A14] transition-colors">
          Шаблони для постів
        </span>
        <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown size={13} className="text-[#A8928D]" />
        </motion.span>
      </button>

      {/* Expandable cards */}
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="pt-2 space-y-2">
              {templates.map((t, i) => (
                <div
                  key={i}
                  className="rounded-xl overflow-hidden"
                  style={{
                    background: 'rgba(255,255,255,0.70)',
                    border: '1px solid rgba(255,255,255,0.85)',
                  }}
                >
                  {/* Header */}
                  <div className="flex items-center justify-between px-3 pt-2.5 pb-1.5">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] font-bold text-[#2C1A14]">{t.label}</span>
                      <span
                        className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full"
                        style={{ background: 'rgba(120,154,153,0.12)', color: '#789A99' }}
                      >
                        {t.badge}
                      </span>
                    </div>
                    <CopyButton text={t.text} />
                  </div>
                  {/* Body */}
                  <p className="px-3 pb-2.5 text-[11px] text-[#6B5750] leading-relaxed whitespace-pre-line">
                    {t.text}
                  </p>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
