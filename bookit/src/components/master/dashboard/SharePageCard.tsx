'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Copy, Check, Share2, ExternalLink, QrCode, X, Download } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMasterContext } from '@/lib/supabase/context';
import { PromoTemplates } from '@/components/shared/PromoTemplates';

export function SharePageCard() {
  const { masterProfile } = useMasterContext();
  const [copied, setCopied] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);

  if (!masterProfile?.slug) return null;

  const slug = masterProfile.slug;
  const url = `${typeof window !== 'undefined' ? window.location.origin : 'https://bookit.com.ua'}/${slug}`;
  const displayUrl = `bookit.com.ua/${slug}`;

  function handleCopy() {
    navigator.clipboard.writeText(url).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  }

  function handleShare() {
    if (typeof navigator !== 'undefined' && navigator.share) {
      navigator.share({ title: 'Моя сторінка на Bookit', url }).catch(() => {});
    } else {
      handleCopy();
    }
  }

  return (
    <div className="bento-card p-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-semibold text-[#6B5750] uppercase tracking-wide">Моя публічна сторінка</p>
        <Link
          href={`/${slug}`}
          target="_blank"
          className="text-[#A8928D] hover:text-[#789A99] transition-colors"
        >
          <ExternalLink size={14} />
        </Link>
      </div>

      <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/60 border border-white/80 mb-3">
        <span className="text-xs text-[#2C1A14] truncate flex-1 font-mono">{displayUrl}</span>
      </div>

      <div className="flex gap-2">
        <button
          onClick={handleCopy}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold transition-all ${
            copied
              ? 'bg-[#5C9E7A]/15 text-[#5C9E7A]'
              : 'bg-[#789A99]/10 text-[#789A99] hover:bg-[#789A99]/20'
          }`}
        >
          {copied ? <><Check size={13} /> Скопійовано</> : <><Copy size={13} /> Копіювати</>}
        </button>
        <button
          onClick={handleShare}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold bg-white/60 text-[#6B5750] hover:bg-white/80 transition-all"
        >
          <Share2 size={13} />
          Поділитись
        </button>
        <button
          onClick={() => setQrOpen(true)}
          className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-white/60 text-[#6B5750] hover:bg-white/80 transition-all"
        >
          <QrCode size={13} />
        </button>
      </div>

      <PromoTemplates slug={slug} />

      {/* QR Modal */}
      <AnimatePresence>
        {qrOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setQrOpen(false)}
              className="fixed inset-0 bg-black/25 backdrop-blur-[2px] z-50"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: 'spring', stiffness: 380, damping: 28 }}
              className="fixed inset-0 z-50 flex items-center justify-center px-6 pointer-events-none"
            >
              <div
                className="pointer-events-auto rounded-3xl p-6 flex flex-col items-center gap-4 w-full max-w-xs"
                style={{
                  background: 'rgba(255,248,244,0.97)',
                  backdropFilter: 'blur(24px)',
                  boxShadow: '0 20px 60px rgba(44,26,20,0.18)',
                  border: '1px solid rgba(255,255,255,0.7)',
                }}
              >
                <div className="flex items-center justify-between w-full">
                  <p className="text-sm font-semibold text-[#2C1A14]">QR-код сторінки</p>
                  <button
                    onClick={() => setQrOpen(false)}
                    className="w-7 h-7 flex items-center justify-center rounded-xl bg-white/70 border border-white/80 text-[#A8928D] hover:text-[#6B5750] transition-colors"
                  >
                    <X size={13} />
                  </button>
                </div>

                <div className="w-48 h-48 rounded-2xl overflow-hidden bg-white p-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(url)}&bgcolor=ffffff&color=2c1a14&margin=0`}
                    alt="QR код"
                    width={180}
                    height={180}
                    className="w-full h-full"
                  />
                </div>

                <p className="text-xs text-[#A8928D] text-center font-mono">{displayUrl}</p>

                <a
                  href={`https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(url)}&bgcolor=ffffff&color=2c1a14&margin=10`}
                  download={`qr-${slug}.png`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-2xl bg-[#789A99]/10 text-[#789A99] text-xs font-semibold hover:bg-[#789A99]/20 transition-all"
                >
                  <Download size={13} />
                  Завантажити PNG
                </a>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
