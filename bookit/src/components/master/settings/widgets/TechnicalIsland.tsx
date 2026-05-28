'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Instagram, Send, MessageSquare, Palette, CreditCard, 
  ChevronRight, ExternalLink, Bot, Check, AlertCircle, Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { generateTelegramConnectToken } from '@/app/(master)/dashboard/settings/actions';
import { useToast } from '@/lib/toast/context';
import type { MoodThemeKey } from '@/lib/constants/themes';

interface TechnicalIslandProps {
  instagram: string;
  telegram: string;
  telegramChatId: string;
  themeKey: MoodThemeKey;
  onInstagramChange: (val: string) => void;
  onTelegramChange: (val: string) => void;
  onTelegramChatIdChange: (val: string) => void;
  onThemeChange: (key: MoodThemeKey) => void;
}

const THEMES: { key: MoodThemeKey; label: string; color: string }[] = [
  { key: 'default', label: 'Blossom', color: '#DDD5C6' },
  { key: 'studio',  label: 'Studio',  color: '#0E1D21' },
  { key: 'frost',   label: 'Frost',   color: '#A5B4FC' },
];

export function TechnicalIsland({
  instagram,
  telegram,
  telegramChatId,
  themeKey,
  onInstagramChange,
  onTelegramChange,
  onTelegramChatIdChange,
  onThemeChange
}: TechnicalIslandProps) {
  const { showToast } = useToast();
  const [connectingBot, setConnectingBot] = useState(false);

  const handleConnectTelegram = async () => {
    setConnectingBot(true);
    const { token, error } = await generateTelegramConnectToken();
    setConnectingBot(false);

    if (error) {
      showToast({ type: 'error', title: 'Помилка', message: error });
      return;
    }
    if (token) {
      window.open(`https://t.me/bookit_notify_bot?start=${token}`, '_blank');
    }
  };

  return (
    <div className="widget-card p-5 space-y-8">
      {/* Social Links Section */}
      <div>
        <h4 className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mb-4 flex items-center gap-2">
          <MessageSquare size={12} /> Соціальні мережі
        </h4>
        <div className="grid grid-cols-1 gap-3">
          <div className="flex items-center gap-3 p-3 rounded-2xl bg-secondary/40 border border-border focus-within:border-accent/40 transition-all">
            <Instagram size={18} className="text-[#E1306C]" />
            <input
              value={instagram}
              onChange={(e) => onInstagramChange(e.target.value)}
              placeholder="Посилання на Instagram"
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/40"
            />
          </div>
          <div className="flex items-center gap-3 p-3 rounded-2xl bg-secondary/40 border border-border focus-within:border-accent/40 transition-all">
            <Send size={18} className="text-[#0088cc]" />
            <input
              value={telegram}
              onChange={(e) => onTelegramChange(e.target.value)}
              placeholder="Username в Telegram"
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/40"
            />
          </div>
        </div>
      </div>

      {/* Telegram Bot Section */}
      <div>
        <h4 className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mb-4 flex items-center gap-2">
          <Bot size={12} /> Сповіщення
        </h4>
        <div className={cn(
          "p-4 rounded-2xl border transition-all",
          telegramChatId ? "bg-success/5 border-success/10" : "bg-warning/5 border-warning/10"
        )}>
          <div className="flex items-start gap-3 mb-4">
            <div className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
              telegramChatId ? "bg-success/10 text-success" : "bg-warning/10 text-warning"
            )}>
              {telegramChatId ? <Check size={20} /> : <AlertCircle size={20} />}
            </div>
            <div>
              <p className="text-sm font-bold">Telegram Бот</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {telegramChatId 
                  ? "Сповіщення про нові записи підключено." 
                  : "Підключіть бота, щоб миттєво отримувати повідомлення про нові записи."}
              </p>
            </div>
          </div>
          
          {!telegramChatId && (
            <button
              onClick={handleConnectTelegram}
              disabled={connectingBot}
              className="w-full py-3 rounded-xl bg-accent text-accent-foreground text-xs font-bold flex items-center justify-center gap-2 active:scale-[0.95] transition-all shadow-md shadow-accent/10 cursor-pointer"
            >
              {connectingBot ? <Loader2 size={14} className="animate-spin" /> : "Підключити бота"}
            </button>
          )}
        </div>
      </div>

      {/* Theme Section */}
      <div>
        <h4 className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mb-4 flex items-center gap-2">
          <Palette size={12} /> Оформлення
        </h4>
        <div className="flex gap-3">
          {THEMES.map((theme) => (
            <button
              key={theme.key}
              onClick={() => onThemeChange(theme.key)}
              className={cn(
                "flex-1 p-3 rounded-2xl border transition-all text-left group cursor-pointer active:scale-[0.95]",
                themeKey === theme.key 
                  ? "bg-surface border-accent shadow-sm" 
                  : "bg-secondary/40 border-border grayscale opacity-60 hover:grayscale-0 hover:opacity-100 hover:bg-secondary/60"
              )}
            >
              <div 
                className="w-full h-12 rounded-xl mb-3 shadow-inner" 
                style={{ backgroundColor: theme.color }}
              />
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold">{theme.label}</span>
                {themeKey === theme.key && <Check size={14} className="text-accent" />}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Billing Link */}
      <div className="pt-4 border-t border-border">
        <a 
          href="/dashboard/billing"
          className="flex items-center justify-between p-4 rounded-2xl bg-secondary/40 border border-border hover:bg-secondary/80 transition-all group cursor-pointer active:scale-[0.95]"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-muted/40 flex items-center justify-center text-muted-foreground group-hover:bg-accent/10 group-hover:text-accent transition-colors">
              <CreditCard size={18} />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wide">Мій тариф</p>
              <p className="text-[10px] text-muted-foreground">Керування підпискою</p>
            </div>
          </div>
          <ChevronRight size={16} className="text-muted-foreground group-hover:text-accent transition-colors" />
        </a>
      </div>
    </div>
  );
}
