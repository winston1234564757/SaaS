'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, CheckCheck } from 'lucide-react';
import { formatDayLabel, isNewDay, startsGroup, endsGroup } from '@/lib/utils/chatGrouping';
import type { ChatMessage } from './types';

const SPRING = { type: 'spring', stiffness: 280, damping: 24 } as const;

interface ChatMessageListProps {
  messages: ChatMessage[];
  currentUserId: string;
  loading?: boolean;
  /** Render CheckCheck / Check on own messages (DM only). */
  showReadReceipts?: boolean;
  /** Shown when not loading and there are no messages. */
  emptyState?: ReactNode;
  className?: string;
}

/**
 * Scrollable, grouped message stream shared by every chat surface.
 *
 * Owns its scroll container and keeps the latest message pinned to the bottom:
 * on new messages, and on container resize (i.e. when the keyboard opens and
 * the viewport collapses) — matching messenger behaviour.
 */
export function ChatMessageList({
  messages,
  currentUserId,
  loading = false,
  showReadReceipts = false,
  emptyState,
  className = '',
}: ChatMessageListProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = (behavior: ScrollBehavior = 'auto') => {
    const el = scrollRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  // Re-pin to the bottom when the container resizes (keyboard open/close).
  useEffect(() => {
    const el = scrollRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(() => scrollToBottom());
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const showEmpty = !loading && messages.length === 0;

  return (
    <div ref={scrollRef} className={`flex-1 min-h-0 overflow-y-auto scrollbar-hide ${className}`}>
      {loading && messages.length === 0 ? (
        <div className="flex flex-col gap-3 px-4 pt-6">
          {[56, 40, 64].map((w, i) => (
            <div
              key={i}
              className={`h-10 rounded-2xl bg-secondary animate-pulse ${i % 2 === 0 ? 'self-start' : 'self-end'}`}
              style={{ width: `${w}%` }}
            />
          ))}
        </div>
      ) : showEmpty ? (
        emptyState
      ) : (
        <div className="flex flex-col px-4 py-4 max-w-2xl mx-auto w-full">
          <AnimatePresence mode="popLayout" initial={false}>
            {messages.map((msg, i) => {
              const isOwn = msg.sender_id === currentUserId;
              const prev = messages[i - 1] ?? null;
              const next = messages[i + 1] ?? null;
              const newDay = isNewDay(prev?.created_at ?? null, msg.created_at);
              const groupStart = startsGroup(prev, msg);
              const groupEnd = endsGroup(msg, next);
              return (
                <motion.div
                  key={msg.id}
                  layout
                  initial={{ opacity: 0, y: 8, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={SPRING}
                  className={newDay ? 'mt-4' : groupStart ? 'mt-3' : 'mt-0.5'}
                >
                  {newDay && (
                    <div className="flex justify-center pb-3 pt-1">
                      <span className="rounded-full bg-secondary px-3 py-1 text-[11px] font-medium text-foreground/65">
                        {formatDayLabel(msg.created_at)}
                      </span>
                    </div>
                  )}
                  <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                    <div className={`flex max-w-[80%] flex-col gap-1 sm:max-w-[75%] ${isOwn ? 'items-end' : 'items-start'}`}>
                      {msg.attachment_url && (
                        <a
                          href={msg.attachment_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`overflow-hidden rounded-2xl border border-border/60 shadow-sm ${isOwn ? 'rounded-br-sm' : 'rounded-bl-sm'}`}
                        >
                          {msg.attachment_width && msg.attachment_height ? (
                            <Image
                              src={msg.attachment_url}
                              alt="Вкладення"
                              width={msg.attachment_width}
                              height={msg.attachment_height}
                              sizes="(min-width: 640px) 480px, 80vw"
                              {...(msg.attachment_blur
                                ? { placeholder: 'blur' as const, blurDataURL: msg.attachment_blur }
                                : {})}
                              className="h-auto max-h-64 w-full object-cover transition hover:scale-[1.02] cursor-zoom-in"
                            />
                          ) : (
                            // Rows written before migration 20260710000000 carry no dimensions,
                            // and next/image cannot render without them.
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={msg.attachment_url}
                              alt="Вкладення"
                              className="max-h-64 w-full object-cover transition hover:scale-[1.02] cursor-zoom-in"
                            />
                          )}
                        </a>
                      )}
                      {msg.message && (
                        <div
                          className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-line ${
                            isOwn
                              ? `bg-accent text-accent-foreground ${groupEnd ? 'rounded-br-sm' : ''}`
                              : `bg-secondary text-foreground border border-border/60 ${groupEnd ? 'rounded-bl-sm' : ''}`
                          }`}
                        >
                          {msg.message}
                        </div>
                      )}
                      {groupEnd && (
                        <div className={`flex items-center gap-1 px-1 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
                          <span className="text-[10px] text-foreground/45">
                            {new Date(msg.created_at).toLocaleTimeString('uk', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          {showReadReceipts && isOwn && (
                            msg.read_at
                              ? <CheckCheck size={12} className="text-accent" aria-label="Прочитано" />
                              : <Check size={12} className="text-foreground/40" aria-label="Надіслано" />
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
