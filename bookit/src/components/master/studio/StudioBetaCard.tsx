'use client';

import { useState, useTransition } from 'react';
import { Check, Loader2 } from 'lucide-react';
import { submitBetaRequest } from '@/app/(master)/dashboard/billing/actions';
import { Sheet } from '@/components/ui/Sheet';
import { cn } from '@/lib/utils/cn';

const STUDIO_COLOR = '#5C9E7A';

const SIZES = [
  { key: '1',   label: '1 майстер' },
  { key: '2-5', label: '2–5 майстрів' },
  { key: '5+',  label: '5+ майстрів' },
] as const;

export function StudioBetaCard() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [size, setSize] = useState<'1' | '2-5' | '5+'>('2-5');
  const [isPending, startTransition] = useTransition();
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleClose(val: boolean) {
    if (!val && !isPending) {
      setOpen(false);
      if (submitted) setSubmitted(false);
    }
  }

  function handleSubmit() {
    if (!name.trim() || !contact.trim()) return;
    setError(null);
    startTransition(async () => {
      const result = await submitBetaRequest({
        name: name.trim(),
        contact: contact.trim(),
        studio_size: size,
      });
      if ('error' in result) {
        setError(result.error);
      } else {
        setSubmitted(true);
      }
    });
  }

  return (
    <>
      <div className="bento-card p-5">
        <p className="text-base font-bold text-foreground mb-1.5">Беремо перших</p>
        <p className="text-sm text-text-sub leading-relaxed mb-4">
          Шукаємо 10–15 команд для закритого тесту. Хто потрапить — отримає доступ раніше всіх і вплине на те, яким вийде продукт. Я сам переглядаю заявки.
        </p>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="w-full py-3 rounded-2xl text-sm font-semibold text-white transition-all active:scale-[0.98]"
          style={{ background: STUDIO_COLOR, boxShadow: `0 4px 16px ${STUDIO_COLOR}40` }}
        >
          Хочу в бету
        </button>
      </div>

      <Sheet open={open} onOpenChange={handleClose} title="Заявка на Studio Beta">
        <div className="p-6">
          {submitted ? (
            <div className="flex flex-col items-center text-center gap-4 py-4">
              <div
                className="size-16 rounded-3xl flex items-center justify-center"
                style={{ background: `${STUDIO_COLOR}20` }}
              >
                <Check size={28} style={{ color: STUDIO_COLOR }} />
              </div>
              <div>
                <p className="text-base font-bold text-foreground">Заявку отримано</p>
                <p className="text-sm text-text-sub mt-1 leading-relaxed">
                  Якщо підійдете — напишу особисто.
                </p>
              </div>
              <button
                type="button"
                onClick={() => { setOpen(false); setSubmitted(false); }}
                className="w-full py-3 rounded-2xl text-sm font-semibold bg-secondary text-text-sub active:scale-[0.98] transition-all"
              >
                Закрити
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {error && (
                <p className="text-xs text-destructive p-3 rounded-xl bg-destructive/10">{error}</p>
              )}

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-text-sub">
                  Ваше ім&apos;я або назва студії
                </label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Glow Studio"
                  className="w-full px-4 py-3 rounded-xl bg-secondary/60 border border-border text-sm outline-none focus:border-accent/40 transition-colors placeholder:text-text-sub"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-text-sub">
                  Telegram або телефон
                </label>
                <input
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  placeholder="@username або +380..."
                  className="w-full px-4 py-3 rounded-xl bg-secondary/60 border border-border text-sm outline-none focus:border-accent/40 transition-colors placeholder:text-text-sub"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-text-sub">
                  Скільки майстрів?
                </label>
                <div className="flex gap-2">
                  {SIZES.map((s) => (
                    <button
                      key={s.key}
                      type="button"
                      aria-pressed={size === s.key}
                      onClick={() => setSize(s.key)}
                      className={cn(
                        'flex-1 py-2.5 rounded-xl border text-xs font-semibold transition-all active:scale-[0.95]',
                        size === s.key
                          ? 'text-white border-transparent'
                          : 'bg-secondary/60 border-border text-text-sub'
                      )}
                      style={size === s.key ? { background: STUDIO_COLOR } : {}}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="button"
                disabled={isPending || !name.trim() || !contact.trim()}
                onClick={handleSubmit}
                className="w-full py-3.5 rounded-2xl text-sm font-semibold text-white transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
                style={{ background: STUDIO_COLOR, boxShadow: `0 4px 16px ${STUDIO_COLOR}40` }}
              >
                {isPending ? (
                  <><Loader2 size={15} className="animate-spin" /> Надсилаємо...</>
                ) : (
                  'Надіслати заявку'
                )}
              </button>
            </div>
          )}
        </div>
      </Sheet>
    </>
  );
}
