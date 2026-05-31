'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Loader2, CheckCircle2 } from 'lucide-react';
import { generateTelegramConnectToken } from '@/app/(master)/dashboard/settings/actions';

interface Props {
  direction: 1 | -1;
  slideVariants: Record<string, unknown>;
  transition: Record<string, unknown>;
  saving: boolean;
  onComplete: () => void;
}

export function StepChannels({ direction, slideVariants, transition, saving, onComplete }: Props) {
  const [tgState, setTgState] = useState<'idle' | 'loading' | 'opened'>('idle');
  const [pushState, setPushState] = useState<'idle' | 'loading' | 'done' | 'unsupported'>('idle');

  const botName = (process.env.NEXT_PUBLIC_TELEGRAM_BOT_NAME ?? '').replace('@', '').trim();

  async function handleTelegram() {
    if (!botName) return;
    setTgState('loading');
    try {
      const { token } = await generateTelegramConnectToken();
      const link = token ? `https://t.me/${botName}?start=${token}` : `https://t.me/${botName}`;
      window.open(link, '_blank', 'noopener,noreferrer');
      setTgState('opened');
    } catch {
      setTgState('idle');
    }
  }

  async function handlePush() {
    if (!('Notification' in window) || !('serviceWorker' in navigator)) {
      setPushState('unsupported');
      return;
    }
    setPushState('loading');
    try {
      const perm = await Notification.requestPermission();
      if (perm !== 'granted') { setPushState('idle'); return; }
      const reg = await navigator.serviceWorker.ready;
      const key = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!key) { setPushState('done'); return; }
      const pad = '='.repeat((4 - key.length % 4) % 4);
      const b64 = (key + pad).replace(/-/g, '+').replace(/_/g, '/');
      const raw = atob(b64);
      const buf = new Uint8Array(raw.length);
      for (let i = 0; i < raw.length; i++) buf[i] = raw.charCodeAt(i);
      const sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: buf });
      await fetch('/api/push/subscribe', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(sub) });
      setPushState('done');
    } catch {
      setPushState('idle');
    }
  }

  return (
    <motion.div
      key="CHANNELS"
      custom={direction}
      variants={slideVariants as Parameters<typeof motion.div>[0]['variants']}
      initial="enter"
      animate="center"
      exit="exit"
      transition={transition as Parameters<typeof motion.div>[0]['transition']}
    >
      <div className="mb-6">
        <p className="text-[11px] font-semibold text-primary uppercase tracking-widest mb-1">Крок 4</p>
        <h2 className="heading-serif text-2xl text-foreground mb-2">Сповіщення</h2>
        <p className="text-sm text-muted-foreground/70 leading-relaxed">
          Підключи канали — дізнавайся про нові записи миттєво, навіть коли Bookit закритий
        </p>
      </div>

      <div className="flex flex-col gap-3 mb-7">
        {/* Telegram */}
        <div
          className={`rounded-xl p-4 flex items-center gap-3 transition-all ${
            tgState === 'opened'
              ? 'bg-sage/8 border-[1.5px] border-sage/35'
              : 'bg-secondary/80 border border-border'
          }`}
          style={{ boxShadow: '0 2px 12px rgba(44,26,20,0.06)' }}
        >
          <div
            className="size-11 rounded-xl shrink-0 flex items-center justify-center text-xl"
            style={{ background: tgState === 'opened' ? 'color-mix(in srgb, var(--color-sage) 15%, transparent)' : '#229ED9' }}
          >
            {tgState === 'opened' ? '✓' : '✈️'}
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-foreground">Telegram-бот</p>
            <p className="text-[11px] text-muted-foreground/60 leading-tight mt-0.5">
              {tgState === 'opened'
                ? 'Відкрито — натисни START у боті щоб підключити'
                : 'Нові записи, нагадування та оповіщення'}
            </p>
          </div>
          {botName && (
            <button
              type="button"
              onClick={handleTelegram}
              disabled={tgState === 'loading'}
              className="shrink-0 px-3 py-1.5 rounded-xl text-xs font-semibold active:scale-95 transition-all disabled:opacity-60"
              style={{
                background: tgState === 'opened' ? 'color-mix(in srgb, var(--color-sage) 15%, transparent)' : '#229ED9',
                color: tgState === 'opened' ? 'var(--color-sage)' : '#fff',
              }}
            >
              {tgState === 'loading' ? <Loader2 size={12} className="animate-spin" /> : tgState === 'opened' ? 'Відкрито ✓' : 'Підключити'}
            </button>
          )}
        </div>

        {/* Push */}
        <div
          className={`rounded-xl p-4 flex items-center gap-3 transition-all ${
            pushState === 'done'
              ? 'bg-sage/8 border-[1.5px] border-sage/35'
              : 'bg-secondary/80 border border-border'
          }`}
          style={{ boxShadow: '0 2px 12px rgba(44,26,20,0.06)' }}
        >
          <div className="size-11 rounded-xl bg-primary/15 shrink-0 flex items-center justify-center text-xl">
            {pushState === 'done' ? <CheckCircle2 size={20} className="text-primary" /> : '🔔'}
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-foreground">Push-сповіщення</p>
            <p className="text-[11px] text-muted-foreground/60 leading-tight mt-0.5">
              {pushState === 'done' ? 'Підключено — готово!' : 'Миттєво у браузері або на телефоні'}
            </p>
          </div>
          {pushState !== 'done' && pushState !== 'unsupported' && (
            <button
              type="button"
              onClick={handlePush}
              disabled={pushState === 'loading'}
              className="shrink-0 px-3 py-1.5 rounded-xl bg-primary text-white text-xs font-semibold active:scale-95 transition-all disabled:opacity-60"
            >
              {pushState === 'loading' ? <Loader2 size={12} className="animate-spin" /> : 'Увімкнути'}
            </button>
          )}
          {pushState === 'done' && (
            <span className="shrink-0 text-xs font-semibold text-primary">✓</span>
          )}
        </div>

        {/* Info card */}
        <div className="rounded-xl px-4 py-3 flex items-start gap-2.5 bg-sage/6 border border-sage/15">
          <span className="text-sm shrink-0 mt-0.5">💡</span>
          <p className="text-[11px] text-muted-foreground/70 leading-relaxed">
            Майстри з підключеними сповіщеннями відповідають на записи на 40% швидше і отримують більше постійних клієнтів
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={onComplete}
        disabled={saving}
        className="flex items-center justify-center gap-2 w-full py-4 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-sage-dark active:scale-[0.98] transition-all shadow-lg shadow-sage/25 disabled:opacity-60"
      >
        {saving && <Loader2 size={15} className="animate-spin" />}
        {tgState === 'opened' || pushState === 'done' ? 'Завершити налаштування →' : 'Пропустити, налаштую пізніше →'}
      </button>
    </motion.div>
  );
}
