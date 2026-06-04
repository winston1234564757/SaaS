'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  ChevronLeft,
  Send,
  Image as ImageIcon,
  Loader2,
  X,
  LifeBuoy,
  Sparkles,
  MessageSquare
} from 'lucide-react';
import { useLiveChat } from '@/lib/hooks/useLiveChat';
import { createSupportTicketAction, sendSupportMessageAction } from '@/lib/actions/support';
import { parseError } from '@/lib/utils/errors';
import { createClient } from '@/lib/supabase/client';

interface SupportChatPageProps {
  user: { id: string };
  userRole: 'master' | 'client';
  initialTicketId: string | null;
}

const SUGGESTIONS = [
  'Не приходить Telegram сповіщення',
  'Як змінити робочі години або додати вихідні?',
  'Проблема з нарахуванням оплати',
  'Як кастомізувати посилання на сторінку (Slug)?',
];

export function SupportChatPage({ user, userRole, initialTicketId }: SupportChatPageProps) {
  const router = useRouter();
  const supabase = createClient();

  const [activeTicketId, setActiveTicketId] = useState<string | null>(initialTicketId);
  const { messages, loading: chatLoading, setMessages } = useLiveChat(activeTicketId);

  const [messageText, setMessageText] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    return () => { if (filePreview) URL.revokeObjectURL(filePreview); };
  }, [filePreview]);

  useEffect(() => {
    if (chatEndRef.current) chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
  }, [messages, chatLoading]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (file) {
      if (file.size > 10 * 1024 * 1024) { setSubmitError('Розмір файлу не повинен перевищувати 10 МБ'); return; }
      setSelectedFile(file);
      setFilePreview(URL.createObjectURL(file));
      setSubmitError(null);
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
    if (filePreview) URL.revokeObjectURL(filePreview);
    setFilePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const uploadFile = async (ticketId: string): Promise<string | null> => {
    if (!selectedFile) return null;
    const fileExt = selectedFile.name.split('.').pop();
    const randomName = `${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const path = `${ticketId}/${randomName}.${fileExt}`;
    const { error: uploadError } = await supabase.storage.from('support_attachments').upload(path, selectedFile, { cacheControl: '3600', upsert: true });
    if (uploadError) { console.error('[SupportChatPage] Upload error:', uploadError.message); return null; }
    const { data } = supabase.storage.from('support_attachments').getPublicUrl(path);
    return data?.publicUrl || null;
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() && !selectedFile) return;
    if (submitting) return;
    setSubmitting(true);
    setSubmitError(null);
    const currentMsg = messageText;
    setMessageText('');
    try {
      let ticketId = activeTicketId;
      if (!ticketId) {
        const { error, ticketId: newTicketId } = await createSupportTicketAction('chat', currentMsg.trim() || 'Початок чату');
        if (error) throw new Error(error);
        if (newTicketId) { ticketId = newTicketId; setActiveTicketId(newTicketId); }
      }
      if (ticketId) {
        let fileUrl: string | null = null;
        if (selectedFile) { fileUrl = await uploadFile(ticketId); removeFile(); }
        if (activeTicketId || fileUrl) {
          const { error, messageData } = await sendSupportMessageAction(ticketId, currentMsg.trim() || 'Файл прикріплено', fileUrl);
          if (error) throw new Error(error);
          if (messageData) {
            setMessages((prev) => {
              if (prev.some((m) => m.id === messageData.id)) return prev;
              return [...prev, messageData];
            });
          }
        }
      }
    } catch (err) {
      setSubmitError(parseError(err));
      setMessageText(currentMsg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSuggestionClick = (text: string) => setMessageText(text);

  const handleBack = () => {
    if (window.history.length > 1) router.back();
    else router.push(userRole === 'master' ? '/dashboard/support' : '/my/bookings');
  };

  return (
    <div className="flex flex-col h-dvh w-full overflow-hidden bg-transparent text-[var(--text-primary)]">
      <header className="flex items-center justify-between px-4 py-3.5 border-b border-[var(--border)] bg-[var(--surface)] backdrop-blur-xl shrink-0 z-10">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleBack}
            aria-label="Назад"
            className="flex items-center justify-center size-10 rounded-full border border-[var(--border)] hover:bg-[var(--surface-hover)] active:scale-[0.95] transition-all cursor-pointer"
          >
            <ChevronLeft className="size-5 text-[var(--text-primary)]" />
          </button>
          <div className="flex items-center gap-3">
            <div className="relative size-10 rounded-full bg-[var(--accent-light)] border border-[var(--border-strong)] flex items-center justify-center shrink-0">
              <LifeBuoy className="size-5 text-[var(--accent)]" />
              <span className="absolute bottom-0 right-0 block size-2.5 rounded-full bg-emerald-500 ring-2 ring-white animate-pulse" />
            </div>
            <div>
              <h1 className="text-sm font-bold leading-tight">Служба підтримки BookIT</h1>
              <p className="text-[11px] text-[var(--text-secondary)] font-medium">Зазвичай відповідає за 15 хвилин</p>
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4 scrollbar-hide bg-slate-50/5 dark:bg-black/5">
        {chatLoading && messages.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <Loader2 className="size-7 animate-spin text-[var(--accent)]" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[50vh] text-center max-w-sm mx-auto space-y-4 px-4">
            <div className="size-16 rounded-full bg-[var(--accent-light)] border border-[var(--border-strong)] flex items-center justify-center text-[var(--accent)] shadow-inner">
              <Sparkles className="size-7" />
            </div>
            <h3 className="text-base font-bold">Потрібна допомога?</h3>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed font-medium">
              Напиши своє запитання нижче. Наша команда підтримки зв&apos;яжеться з тобою найближчим часом.
            </p>
            <div className="w-full space-y-2 pt-4">
              <p className="text-[11px] font-bold text-[var(--text-secondary)] text-left px-1">Популярні запити:</p>
              <div className="flex flex-col gap-2">
                {SUGGESTIONS.map((text) => (
                  <button
                    type="button"
                    key={text}
                    onClick={() => handleSuggestionClick(text)}
                    className="text-left text-xs bg-[var(--surface)] border border-[var(--border)] hover:bg-[var(--surface-hover)] p-3 rounded-2xl transition cursor-pointer shadow-sm active:scale-[0.98]"
                  >
                    {text}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4 max-w-2xl mx-auto w-full">
            {messages.map((msg) => {
              const isOwn = msg.sender_id === user.id;
              return (
                <div key={msg.id} className={`flex w-full ${isOwn ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] sm:max-w-[70%] rounded-2xl px-4 py-2.5 text-sm shadow-sm ${isOwn ? 'bg-[var(--accent)] text-[var(--accent-on)] rounded-br-none' : 'bg-[var(--surface)] text-[var(--text-primary)] border border-[var(--border)] rounded-bl-none backdrop-blur-md'}`}>
                    <div className="whitespace-pre-line leading-relaxed">{msg.message}</div>
                    {msg.attachment_url && (
                      <div className="mt-2 overflow-hidden rounded-xl border border-[var(--border)] shadow-inner">
                        <a href={msg.attachment_url} target="_blank" rel="noopener noreferrer">
                          <img src={msg.attachment_url} alt="Вкладення" className="max-h-60 w-full object-cover transition hover:scale-102 cursor-zoom-in" />
                        </a>
                      </div>
                    )}
                    <div className={`text-[9px] mt-1.5 text-right ${isOwn ? 'opacity-80' : 'text-[var(--text-tertiary)]'}`}>
                      {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={chatEndRef} />
          </div>
        )}
      </div>

      <div className="shrink-0 bg-[var(--surface)] border-t border-[var(--border)] p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] backdrop-blur-xl z-10">
        <div className="max-w-2xl mx-auto w-full space-y-3">
          {messages.length > 0 && (
            <div className="flex gap-2 overflow-x-auto scrollbar-hide py-1 shrink-0">
              {SUGGESTIONS.map((text) => (
                <button
                  type="button"
                  key={text}
                  onClick={() => handleSuggestionClick(text)}
                  className="whitespace-nowrap text-[10px] font-bold bg-[var(--surface-hover)] border border-[var(--border)] hover:bg-[var(--surface)] px-3 py-1.5 rounded-full transition cursor-pointer shadow-sm shrink-0 active:scale-[0.95]"
                >
                  {text}
                </button>
              ))}
            </div>
          )}
          {submitError && (
            <div className="rounded-xl bg-red-50 dark:bg-red-950/20 p-3 text-xs text-red-600 dark:text-red-400 border border-red-100 dark:border-red-900/40">
              {submitError}
            </div>
          )}
          {filePreview && (
            <div className="relative flex items-center gap-2.5 rounded-2xl bg-[var(--surface-hover)] border border-[var(--border)] p-2 pr-9 w-fit shadow-sm">
              <img src={filePreview} alt="Screenshot preview" className="size-9 rounded-lg object-cover" />
              <div className="text-xs font-semibold truncate max-w-[200px]">{selectedFile?.name}</div>
              <button
                type="button"
                onClick={removeFile}
                aria-label="Видалити файл"
                className="absolute right-2.5 size-5 flex items-center justify-center rounded-full bg-[var(--surface)] text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] active:scale-[0.90] cursor-pointer"
              >
                <X className="size-3" />
              </button>
            </div>
          )}
          <form onSubmit={handleSendMessage} className="flex items-center gap-2">
            <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              aria-label="Додати зображення"
              className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[var(--surface-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface)] border border-[var(--border)] transition active:scale-[0.90] cursor-pointer"
            >
              <ImageIcon className="h-4.5 w-4.5" />
            </button>
            <input
              type="text"
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              placeholder="Напишіть повідомлення..."
              className="flex-1 text-sm bg-[var(--surface-hover)] border border-[var(--border)] rounded-full px-4 py-2.5 outline-none focus:bg-[var(--surface)] transition text-[var(--text-primary)] placeholder-[var(--text-tertiary)]"
            />
            <button
              type="submit"
              aria-label="Надіслати"
              disabled={submitting || (!messageText.trim() && !selectedFile)}
              className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[var(--accent)] text-[var(--accent-on)] transition hover:opacity-90 active:scale-[0.90] disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
            >
              {submitting ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
