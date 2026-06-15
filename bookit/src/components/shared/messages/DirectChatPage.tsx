'use client';

import { useState, useRef, useEffect, useTransition } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Paperclip, Send, Check, CheckCheck, X } from 'lucide-react';
import { useDMChat } from '@/lib/hooks/useDMChat';
import { sendDirectMessage, markConversationRead } from '@/lib/actions/messages';
import { createClient } from '@/lib/supabase/client';

const SPRING = { type: 'spring', stiffness: 280, damping: 24 } as const;

interface DirectChatPageProps {
  conversationId: string;
  userId: string;
  participantName: string;
  participantAvatarUrl: string | null;
  userRole: 'client' | 'master';
  backHref: string;
}

export function DirectChatPage({
  conversationId,
  userId,
  participantName,
  participantAvatarUrl,
  backHref,
}: DirectChatPageProps) {
  const { messages, loading } = useDMChat(conversationId);
  const [text, setText] = useState('');
  const [attachUrl, setAttachUrl] = useState<string | null>(null);
  const [attachLoading, setAttachLoading] = useState(false);
  const [, start] = useTransition();
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  useEffect(() => {
    const handler = () => {
      const el = scrollRef.current;
      if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'instant' });
    };
    window.visualViewport?.addEventListener('resize', handler);
    return () => window.visualViewport?.removeEventListener('resize', handler);
  }, []);

  useEffect(() => {
    markConversationRead(conversationId);
  }, [conversationId]);

  async function handleFileUpload(file: File) {
    setAttachLoading(true);
    try {
      const supabase = createClient();
      const ext = file.name.split('.').pop() ?? 'jpg';
      const path = `dm/${conversationId}/${Date.now()}.${ext}`;
      await supabase.storage.from('support_attachments').upload(path, file, { upsert: false });
      const { data } = supabase.storage.from('support_attachments').getPublicUrl(path);
      setAttachUrl(data.publicUrl);
    } finally {
      setAttachLoading(false);
    }
  }

  function handleSend() {
    const msg = text.trim();
    if (!msg && !attachUrl) return;
    const url = attachUrl;
    setText('');
    setAttachUrl(null);
    start(async () => {
      await sendDirectMessage(conversationId, msg, url ?? undefined);
    });
  }

  const initials = participantName.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div className="h-dvh flex flex-col bg-background">
      <header className="shrink-0 flex items-center gap-3 px-4 py-3 border-b border-border/40 bg-background/95 backdrop-blur-sm">
        <Link
          href={backHref}
          aria-label="Назад"
          className="size-11 flex items-center justify-center rounded-full hover:bg-secondary active:bg-secondary/70 transition-colors"
        >
          <ArrowLeft size={20} />
        </Link>

        {participantAvatarUrl ? (
          <Image
            src={participantAvatarUrl}
            alt={participantName}
            width={36}
            height={36}
            className="rounded-full object-cover size-9 shrink-0"
          />
        ) : (
          <div className="size-9 rounded-full bg-accent/15 flex items-center justify-center shrink-0">
            <span className="text-xs font-semibold text-accent">{initials}</span>
          </div>
        )}

        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground truncate">{participantName}</p>
          <p className="text-[10px] text-muted-foreground/60">зазвичай відповідає швидко</p>
        </div>
      </header>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-2">
        {loading && (
          <div className="flex flex-col gap-3 pt-2">
            {[56, 40, 64].map((w, i) => (
              <div
                key={i}
                className={`h-10 rounded-2xl bg-secondary animate-pulse ${i % 2 === 0 ? 'self-start' : 'self-end'}`}
                style={{ width: `${w}%` }}
              />
            ))}
          </div>
        )}

        <AnimatePresence mode="popLayout" initial={false}>
          {messages.map(msg => {
            const isOwn = msg.sender_id === userId;
            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 8, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={SPRING}
                className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[75%] flex flex-col gap-1 ${isOwn ? 'items-end' : 'items-start'}`}>
                  {msg.attachment_url && (
                    <Image
                      src={msg.attachment_url}
                      alt="Вкладення"
                      width={200}
                      height={150}
                      className={`rounded-2xl object-cover ${isOwn ? 'rounded-br-sm' : 'rounded-bl-sm'}`}
                    />
                  )}
                  {msg.message && (
                    <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                      isOwn
                        ? 'bg-accent text-accent-foreground rounded-br-sm'
                        : 'bg-secondary text-foreground rounded-bl-sm'
                    }`}>
                      {msg.message}
                    </div>
                  )}
                  <div className={`flex items-center gap-1 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
                    <span className="text-[10px] text-muted-foreground/50">
                      {new Date(msg.created_at).toLocaleTimeString('uk', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    {isOwn && (
                      msg.read_at
                        ? <CheckCheck size={12} className="text-accent" aria-label="Прочитано" />
                        : <Check size={12} className="text-muted-foreground/40" aria-label="Надіслано" />
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {attachUrl && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={SPRING}
            className="shrink-0 px-4 py-2 flex items-center gap-2 border-t border-border/40"
          >
            <Image
              src={attachUrl}
              alt="Попередній перегляд"
              width={48}
              height={48}
              className="rounded-xl object-cover size-12"
            />
            <span className="text-xs text-muted-foreground flex-1">Фото готове до відправлення</span>
            <button
              type="button"
              onClick={() => setAttachUrl(null)}
              aria-label="Видалити вкладення"
              className="size-8 rounded-full bg-secondary flex items-center justify-center active:scale-90 transition-transform"
            >
              <X size={14} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="shrink-0 px-4 py-3 border-t border-border/40 bg-background pb-[calc(env(safe-area-inset-bottom,0px)+12px)]">
        <div className="flex items-end gap-2">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={attachLoading}
            aria-label="Прикріпити фото"
            className="size-11 rounded-full bg-secondary flex items-center justify-center shrink-0 active:scale-[0.94] transition-transform disabled:opacity-40"
          >
            <Paperclip size={18} className="text-muted-foreground" />
          </button>

          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={e => {
              const file = e.target.files?.[0];
              if (file) handleFileUpload(file);
              e.target.value = '';
            }}
          />

          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
            }}
            placeholder="Написати повідомлення..."
            rows={1}
            className="flex-1 min-h-[44px] max-h-[120px] resize-none rounded-2xl bg-secondary px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none focus:ring-2 focus:ring-accent/30 transition-all"
          />

          <button
            type="button"
            onClick={handleSend}
            disabled={!text.trim() && !attachUrl}
            aria-label="Надіслати"
            className="size-11 rounded-full bg-accent text-accent-foreground flex items-center justify-center shrink-0 active:scale-[0.94] transition-transform disabled:opacity-30"
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
