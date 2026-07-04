'use client';

import { useRef, type ReactNode } from 'react';
import { Image as ImageIcon, Send, Loader2 } from 'lucide-react';

interface ChatComposerProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  /** Enables the attach button; receives the picked image file. */
  onPickFile?: (file: File) => void;
  submitting?: boolean;
  /** Whether send is allowed (page decides — text and/or attachment). */
  canSend: boolean;
  placeholder?: string;
  /** Slot above the input row: suggestions, file preview, error. */
  children?: ReactNode;
}

/**
 * Shared chat composer: optional attach, auto-height textarea (Enter sends,
 * Shift+Enter newline), send button. Owns the safe-area bottom inset.
 */
export function ChatComposer({
  value,
  onChange,
  onSubmit,
  onPickFile,
  submitting = false,
  canSend,
  placeholder = 'Напишіть повідомлення...',
  children,
}: ChatComposerProps) {
  const fileRef = useRef<HTMLInputElement>(null);

  return (
    <div className="shrink-0 border-t border-border bg-background/95 backdrop-blur-xl px-4 py-3 pb-[calc(env(safe-area-inset-bottom)+12px)]">
      <div className="max-w-2xl mx-auto w-full space-y-3">
        {children}
        <form
          onSubmit={(e) => { e.preventDefault(); onSubmit(); }}
          className="flex items-end gap-2"
        >
          {onPickFile && (
            <>
              <input
                type="file"
                ref={fileRef}
                accept="image/*"
                className="hidden"
                aria-hidden="true"
                tabIndex={-1}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) onPickFile(file);
                  e.target.value = '';
                }}
              />
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                aria-label="Додати зображення"
                className="flex size-11 shrink-0 items-center justify-center rounded-full bg-secondary text-text-sub hover:text-foreground border border-border transition active:scale-[0.90] cursor-pointer"
              >
                <ImageIcon className="size-5" />
              </button>
            </>
          )}

          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                onSubmit();
              }
            }}
            placeholder={placeholder}
            aria-label="Текст повідомлення"
            rows={1}
            className="flex-1 min-h-[44px] max-h-[120px] resize-none text-sm bg-secondary border border-border rounded-2xl px-4 py-3 outline-none focus:ring-2 focus:ring-accent/25 transition text-foreground placeholder:text-foreground/40"
          />

          <button
            type="submit"
            aria-label="Надіслати"
            disabled={submitting || !canSend}
            className="flex size-11 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground transition hover:opacity-90 active:scale-[0.90] disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
          >
            {submitting ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
          </button>
        </form>
      </div>
    </div>
  );
}
