'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Instagram, Send, MessageSquare, Palette, CreditCard,
  ChevronRight, ExternalLink, Bot, Check, AlertCircle, Loader2, Lock
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { generateTelegramConnectToken } from '@/app/(master)/dashboard/settings/actions';
import { useToast } from '@/lib/toast/context';
import type { MoodThemeKey } from '@/lib/constants/themes';
import { PushSubscribeCard } from '@/components/shared/PushSubscribeCard';

interface TechnicalIslandProps {
  instagram: string;
  telegram: string;
  telegramChatId: string;
  themeKey: MoodThemeKey;
  tier: string;
  onInstagramChange: (val: string) => void;
  onTelegramChange: (val: string) => void;
  onTelegramChatIdChange: (val: string) => void;
  onThemeChange: (key: MoodThemeKey) => void;
}

const THEMES: { key: MoodThemeKey; label: string; color: string; requiresPro: boolean; wip?: boolean }[] = [
  { key: 'default', label: 'Blossom', color: '#DDD5C6', requiresPro: true,  wip: true },
  { key: 'studio',  label: 'Studio',  color: '#0E1D21', requiresPro: true,  wip: true },
  { key: 'frost',   label: 'Frost',   color: '#A5B4FC', requiresPro: false },
];

export function TechnicalIsland({
  instagram,
  telegram,
  telegramChatId,
  themeKey,
  tier,
  onInstagramChange,
  onTelegramChange,
  onTelegramChatIdChange,
  onThemeChange
}: TechnicalIslandProps) {
  const { showToast } = useToast();
  const [connectingBot, setConnectingBot] = useState(false);
  const [waitingForBot, setWaitingForBot] = useState(false);

  const canChangeTheme = tier === 'pro' || tier === 'studio';
  const wipTheme = THEMES.find(t => t.key === themeKey)?.wip ?? false;
  const effectiveThemeKey = (canChangeTheme && !wipTheme) ? themeKey : 'frost';

  const handleConnectTelegram = async () => {
    setConnectingBot(true);
    const { token, error } = await generateTelegramConnectToken();
    setConnectingBot(false);

    if (error) {
      showToast({ type: 'error', title: 'Помилка', message: error });
      return;
    }
    if (token) {
      const botName = (process.env.NEXT_PUBLIC_TELEGRAM_BOT_NAME || 'BookIT_APP_bot').replace('@', '').trim();
      window.open(`https://t.me/${botName}?start=${token}`, '_blank');

      // Poll for DB update every 3s after user opens the bot, up to 60s
      setWaitingForBot(true);
      let attempts = 0;
      const poll = setInterval(async () => {
        attempts++;
        try {
          const res = await fetch('/api/settings/telegram-status');
          if (res.ok) {
            const json = await res.json() as { connected: boolean; chatId: string | null };
            if (json.connected && json.chatId) {
              clearInterval(poll);
              setWaitingForBot(false);
              onTelegramChatIdChange(json.chatId);
              showToast({ type: 'success', title: 'Підключено!', message: 'Telegram бот активовано.' });
              return;
            }
          }
        } catch {}
        if (attempts >= 20) {
          clearInterval(poll);
          showToast({ type: 'warning', title: 'Бот не відповів', message: `Натисніть «Підключити бота» ще раз або відкрийте @${botName} вручну` });
          setWaitingForBot(false);
        }
      }, 3000);
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
              aria-label="Посилання на Instagram"
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/40"
            />
          </div>
          <div className="flex items-center gap-3 p-3 rounded-2xl bg-secondary/40 border border-border focus-within:border-accent/40 transition-all">
            <Send size={18} className="text-[#0088cc]" />
            <input
              value={telegram}
              onChange={(e) => onTelegramChange(e.target.value)}
              placeholder="Username в Telegram"
              aria-label="Username в Telegram"
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
              "size-10 rounded-xl flex items-center justify-center shrink-0",
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
            <button type="button"
              onClick={handleConnectTelegram}
              disabled={connectingBot || waitingForBot}
              className="w-full py-3 rounded-xl bg-accent text-accent-foreground text-xs font-bold flex items-center justify-center gap-2 active:scale-[0.95] transition-all shadow-md shadow-accent/10 cursor-pointer"
            >
              {(connectingBot || waitingForBot) && <Loader2 size={14} className="animate-spin" />}
              {!connectingBot && (waitingForBot ? "Очікуємо з'єднання..." : "Підключити бота")}
            </button>
          )}
        </div>

        <div className="mt-3">
          <PushSubscribeCard />
        </div>
      </div>

      {/* Theme Section */}
      <div>
        <h4 className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mb-4 flex items-center gap-2">
          <Palette size={12} /> Оформлення
        </h4>
        <div className="grid grid-cols-3 gap-3">
          {THEMES.map((theme) => {
            const isLocked = theme.requiresPro && !canChangeTheme;
            const isActive = effectiveThemeKey === theme.key;

            return (
              <button type="button"
                key={theme.key}
                aria-pressed={isActive && !isLocked && !theme.wip}
                onClick={() => {
                  if (theme.wip) {
                    showToast({ type: 'info', title: 'Незабаром', message: 'Ця тема зараз у розробці' });
                    return;
                  }
                  if (isLocked) {
                    showToast({ type: 'info', title: 'Тільки Pro', message: 'Ця тема відкривається на Pro' });
                    return;
                  }
                  onThemeChange(theme.key);
                }}
                className={cn(
                  "p-3 rounded-2xl border transition-all text-left min-w-0",
                  theme.wip || isLocked
                    ? "cursor-not-allowed"
                    : "cursor-pointer active:scale-[0.95]",
                  isActive && !isLocked && !theme.wip
                    ? "bg-surface border-accent shadow-sm opacity-100"
                    : theme.wip
                    ? "bg-secondary/40 border-border opacity-35"
                    : "bg-secondary/40 border-border grayscale opacity-50 hover:grayscale-0 hover:opacity-100 hover:bg-secondary/60"
                )}
              >
                <div
                  className="w-full h-12 rounded-xl mb-3 shadow-inner relative overflow-hidden"
                  style={{ backgroundColor: theme.color }}
                >
                  {isLocked && !theme.wip && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-xl">
                      <Lock size={14} className="text-white" />
                    </div>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold">{theme.label}</span>
                  {theme.wip ? (
                    <span className="text-[9px] font-bold text-muted-foreground bg-secondary px-1.5 py-0.5 rounded-full leading-none">
                      Розробка
                    </span>
                  ) : isLocked ? (
                    <span className="text-[9px] font-bold text-accent bg-accent/10 px-1.5 py-0.5 rounded-full leading-none">
                      Pro
                    </span>
                  ) : (
                    isActive && <Check size={14} className="text-accent" />
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Billing Link */}
      <div className="pt-4 border-t border-border">
        <a
          href="/dashboard/billing"
          className="flex items-center justify-between p-4 rounded-2xl bg-secondary/40 border border-border hover:bg-secondary/80 transition-all group cursor-pointer active:scale-[0.95]"
        >
          <div className="flex items-center gap-3">
            <div className="size-9 rounded-xl bg-muted/40 flex items-center justify-center text-muted-foreground group-hover:bg-accent/10 group-hover:text-accent transition-colors">
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
