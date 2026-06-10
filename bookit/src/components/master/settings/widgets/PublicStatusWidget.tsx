'use client';

import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Globe, QrCode, Download, Loader2, Check, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { useToast } from '@/lib/toast/context';

interface PublicStatusWidgetProps {
  slug: string;
  isPublished: boolean;
  slugStatus: 'idle' | 'checking' | 'available' | 'taken';
  onSlugChange: (val: string) => void;
  onPublishToggle: () => void;
}

export function PublicStatusWidget({
  slug,
  isPublished,
  slugStatus,
  onSlugChange,
  onPublishToggle
}: PublicStatusWidgetProps) {
  const { showToast } = useToast();
  const [showQr, setShowQr] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const qrRef = useRef<HTMLImageElement>(null);

  const publicUrl = `https://bookit.com.ua/${slug}`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(publicUrl)}&bgcolor=FFFFFF&color=2C1A14`;

  const handleDownloadQr = () => {
    setDownloading(true);
    const canvas = document.createElement('canvas');
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = qrUrl;
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0);
        try {
          const url = canvas.toDataURL('image/png');
          const link = document.createElement('a');
          link.download = `bookit-qr-${slug}.png`;
          link.href = url;
          link.click();
          showToast({ type: 'success', title: 'Завантажено', message: 'QR-код збережено' });
        } catch (err) {
          showToast({ type: 'error', title: 'Помилка', message: 'Не вдалося зберегти QR' });
        }
      }
      setDownloading(false);
    };
    img.onerror = () => {
      showToast({ type: 'error', title: 'Помилка', message: 'Не вдалося завантажити зображення' });
      setDownloading(false);
    };
  };

  return (
    <div className="widget-card p-6 h-full flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className={cn(
            "size-9 rounded-2xl flex items-center justify-center transition-all shadow-sm",
            isPublished ? "bg-success text-white" : "bg-muted text-text-mute"
          )}>
            <Globe size={18} />
          </div>
          <div>
            <h3 className="font-bold text-[11px] uppercase tracking-widest text-text-mute">Публікація</h3>
            <p className={cn("text-[10px] font-bold", isPublished ? "text-success" : "text-text-mute")}>
              {isPublished ? "Опубліковано" : "Чернетка"}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onPublishToggle}
          aria-label={isPublished ? "Приховати профіль" : "Опублікувати профіль"}
          aria-pressed={isPublished}
          className={cn(
            "relative w-12 h-7 rounded-full transition-colors duration-300 shadow-inner",
            isPublished ? "bg-success" : "bg-muted-foreground/30"
          )}
        >
          <motion.div
            animate={{ x: isPublished ? 20 : 4 }}
            className="absolute top-1 left-1 size-5 rounded-full bg-white shadow-md"
          />
        </button>
      </div>

      {/* Slug Input */}
      <div className="space-y-2">
        <label htmlFor="settings-slug" className="text-[10px] font-bold text-text-mute uppercase tracking-widest px-1">Ваша унікальна адреса</label>
        <div className="flex items-center gap-2 px-4 py-3.5 rounded-2xl bg-secondary border border-border focus-within:border-accent focus-within:ring-4 focus-within:ring-accent/5 transition-all shadow-inner-sm">
          <span className="text-sm text-text-mute/40 font-medium select-none">bookit.ua/</span>
          <input
            id="settings-slug"
            value={slug}
            onChange={(e) => onSlugChange(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
            aria-label="Ваша унікальна адреса"
            className="flex-1 bg-transparent text-sm font-bold text-text-primary outline-none placeholder:text-text-mute/30"
            placeholder="your-name"
          />
          {slugStatus === 'checking' && <Loader2 size={16} className="animate-spin text-accent" />}
          {slugStatus === 'available' && <Check size={16} className="text-success" />}
        </div>

        {slugStatus === 'taken' && (
           <p className="text-[10px] font-bold text-destructive px-1">Ця адреса вже зайнята іншим майстром</p>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col gap-3 mt-auto">
        <a
          href={publicUrl}
          target="_blank"
          rel="noreferrer"
          className="w-full py-4 rounded-2xl bg-secondary border border-border text-text-primary text-xs font-bold flex items-center justify-center gap-2 hover:bg-muted/10 active:scale-95 transition-all shadow-sm"
        >
          Відкрити сторінку <ExternalLink size={14} />
        </a>

        {!showQr ? (
          <button type="button"
            onClick={() => setShowQr(true)}
            className="w-full py-4 rounded-2xl bg-accent text-white text-xs font-bold flex items-center justify-center gap-2 active:scale-95 transition-all shadow-lg shadow-accent/20"
          >
            <QrCode size={14} /> Керувати QR-кодом
          </button>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center gap-4 bg-secondary/40 p-4 rounded-xl border border-border"
          >
            <div className="p-4 rounded-[24px] bg-surface shadow-xl border border-border">
              <img
                ref={qrRef}
                src={qrUrl}
                alt="QR-код вашого профілю"
                width={128}
                height={128}
                loading="lazy"
                className="size-32"
                crossOrigin="anonymous"
              />
            </div>
            <div className="flex w-full gap-2">
              <button type="button"
                onClick={handleDownloadQr}
                disabled={downloading}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-accent text-white text-[11px] font-bold shadow-md shadow-accent/10 active:scale-95 transition-all disabled:opacity-50"
              >
                {downloading ? <Loader2 size={12} className="animate-spin" /> : <Download size={14} />}
                Скачати
              </button>
              <button type="button"
                onClick={() => setShowQr(false)}
                className="px-4 py-3 rounded-xl bg-secondary/80 text-text-mute text-[11px] font-bold border border-border active:scale-95 transition-all"
              >
                Сховати
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
