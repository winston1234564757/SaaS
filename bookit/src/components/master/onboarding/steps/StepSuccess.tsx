'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import { Check, Copy, ExternalLink, Share2, ArrowRight, Sparkles, ImagePlay } from 'lucide-react';
import Link from 'next/link';
import { ConfettiParticles } from './ConfettiParticles';

interface StepSuccessProps {
  direction: number;
  slideVariants: Variants;
  transition: object;
  savedSlug: string;
  copied: boolean;
  onCopyLink: () => void;
  onComplete: () => void;
}

/* ── Copy button with per-item check animation ── */
function CopyButton({ text, size = 'sm' }: { text: string; size?: 'sm' | 'xs' }) {
  const [done, setDone] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
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

  const cls = size === 'xs'
    ? 'px-2.5 py-1.5 text-[11px] rounded-xl gap-1'
    : 'px-3 py-2 text-xs rounded-xl gap-1.5';

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={`flex items-center font-semibold transition-all duration-200 cursor-pointer shrink-0 ${cls} ${done ? 'bg-[#5C9E7A]/15 text-[#5C9E7A]' : 'bg-[#789A99]/10 text-[#789A99] hover:bg-[#789A99]/20'}`}
    >
      <AnimatePresence mode="wait" initial={false}>
        {done ? (
          <motion.span key="check" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} transition={{ duration: 0.15 }}>
            <Check size={size === 'xs' ? 10 : 12} strokeWidth={3} />
          </motion.span>
        ) : (
          <motion.span key="copy" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} transition={{ duration: 0.15 }}>
            <Copy size={size === 'xs' ? 10 : 12} />
          </motion.span>
        )}
      </AnimatePresence>
      {done ? 'Скопійовано' : 'Скопіювати'}
    </button>
  );
}

/* ── Template card ── */
function TemplateCard({
  label,
  badge,
  text,
  delay,
}: {
  label: string;
  badge: string;
  text: string;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="rounded-2xl overflow-hidden"
      style={{ background: 'rgba(255,255,255,0.72)', border: '1px solid rgba(255,255,255,0.85)', boxShadow: '0 2px 12px rgba(44,26,20,0.06)' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-3 pb-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-[#2C1A14]">{label}</span>
          <span
            className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
            style={{ background: '#789A99/15', color: '#789A99', backgroundColor: 'rgba(120,154,153,0.12)' }}
          >
            {badge}
          </span>
        </div>
        <CopyButton text={text} size="xs" />
      </div>

      {/* Body */}
      <div className="px-4 pb-3">
        <p className="text-[11px] text-[#6B5750] leading-relaxed whitespace-pre-line">
          {text}
        </p>
      </div>
    </motion.div>
  );
}

/* ── Main component ── */
export function StepSuccess({
  direction,
  slideVariants,
  transition,
  savedSlug,
  onComplete,
}: StepSuccessProps) {
  const publicUrl = `https://bookit.com.ua/${savedSlug}`;
  const shortUrl  = `bookit.com.ua/${savedSlug}`;

  const [linkCopied, setLinkCopied] = useState(false);
  const [shareLoading, setShareLoading] = useState(false);

  const copyLink = useCallback(async () => {
    try { await navigator.clipboard.writeText(publicUrl); }
    catch { /* silent */ }
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2200);
  }, [publicUrl]);

  const handleShare = useCallback(async () => {
    setShareLoading(true);
    try {
      if (typeof navigator !== 'undefined' && navigator.share) {
        await navigator.share({
          title: 'Запис онлайн',
          text: 'Записуйтесь до мене онлайн!',
          url: publicUrl,
        });
      } else {
        await navigator.clipboard.writeText(publicUrl);
        setLinkCopied(true);
        setTimeout(() => setLinkCopied(false), 2200);
      }
    } catch { /* user cancelled share */ }
    finally { setShareLoading(false); }
  }, [publicUrl]);

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
    <motion.div
      key="SUCCESS"
      custom={direction}
      variants={slideVariants}
      initial="enter"
      animate="center"
      exit="exit"
      transition={transition}
      className="relative bento-card overflow-hidden"
    >
      <ConfettiParticles />

      <div className="relative z-10">

        {/* ── Hero ── */}
        <div className="flex flex-col items-center text-center pt-7 pb-5 px-6">
          <motion.div
            initial={{ scale: 0, rotate: -12 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 380, damping: 16, delay: 0.08 }}
            className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
            style={{ background: 'linear-gradient(135deg, #5C9E7A22 0%, #5C9E7A44 100%)', border: '1.5px solid #5C9E7A44' }}
          >
            <Sparkles size={28} className="text-[#5C9E7A]" strokeWidth={1.8} />
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.22 }}
            className="font-display text-[1.65rem] font-semibold text-[#2C1A14] leading-tight mb-1.5"
          >
            Твоя студія онлайн!
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.32 }}
            className="text-sm text-[#A8928D]"
          >
            Клієнти вже можуть записуватись — ділись посиланням
          </motion.p>
        </div>

        {/* ── Public link card ── */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.42 }}
          className="mx-6 mb-4 rounded-2xl px-4 py-3.5"
          style={{ background: 'rgba(255,255,255,0.80)', border: '1px solid rgba(255,255,255,0.9)', boxShadow: '0 2px 12px rgba(44,26,20,0.06)' }}
        >
          <p className="text-[10px] font-semibold text-[#A8928D] uppercase tracking-wider mb-1.5">Твоя публічна сторінка</p>
          <p className="text-sm font-mono font-semibold text-[#2C1A14] mb-3 truncate">{shortUrl}</p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={copyLink}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${linkCopied ? 'bg-[#5C9E7A]/15 text-[#5C9E7A]' : 'bg-[#789A99]/10 text-[#789A99] hover:bg-[#789A99]/20'}`}
            >
              <AnimatePresence mode="wait" initial={false}>
                {linkCopied
                  ? <motion.span key="c" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}><Check size={12} strokeWidth={3} /></motion.span>
                  : <motion.span key="n" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}><Copy size={12} /></motion.span>}
              </AnimatePresence>
              {linkCopied ? 'Скопійовано!' : 'Копіювати'}
            </button>
            <a
              href={`/${savedSlug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-white/60 text-[#6B5750] hover:bg-white/80 transition-all"
            >
              <ExternalLink size={12} />
            </a>
          </div>
        </motion.div>

        {/* ── Templates section ── */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.52 }}
          className="px-6 text-[11px] font-semibold text-[#A8928D] uppercase tracking-wider mb-2.5"
        >
          Готові шаблони для постів
        </motion.p>

        <div className="px-6 space-y-2.5 mb-5">
          {templates.map((t, i) => (
            <TemplateCard key={i} {...t} delay={0.58 + i * 0.1} />
          ))}
        </div>

        {/* ── Actions ── */}
        <div className="px-6 pb-7 flex flex-col gap-2.5">
          {/* Share primary */}
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.88 }}
            whileTap={{ scale: 0.97 }}
            type="button"
            onClick={handleShare}
            disabled={shareLoading}
            className="w-full py-4 rounded-2xl font-semibold text-sm flex items-center justify-center gap-2 transition-all duration-200 disabled:opacity-50 cursor-pointer"
            style={{
              background: 'linear-gradient(135deg, #2C1A14 0%, #4A2E26 100%)',
              color: '#fff',
              boxShadow: '0 6px 20px rgba(44,26,20,0.30)',
            }}
          >
            <Share2 size={16} />
            Поділитися посиланням
          </motion.button>

          {/* Story generator */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.96 }}>
            <Link
              href="/dashboard/marketing"
              onClick={onComplete}
              className="w-full py-3.5 rounded-2xl font-semibold text-sm flex items-center justify-center gap-2 transition-all duration-200 cursor-pointer"
              style={{
                background: 'rgba(120,154,153,0.12)',
                color: '#789A99',
                border: '1.5px solid rgba(120,154,153,0.25)',
              }}
            >
              <ImagePlay size={15} /> Створити Сторі для Instagram
            </Link>
          </motion.div>

          {/* Dashboard */}
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.04 }}
            whileTap={{ scale: 0.98 }}
            type="button"
            onClick={onComplete}
            className="w-full py-2.5 text-sm font-medium text-[#A8928D] hover:text-[#789A99] transition-colors cursor-pointer"
          >
            Перейти в Dashboard <ArrowRight size={13} className="inline" />
          </motion.button>
        </div>

      </div>
    </motion.div>
  );
}
