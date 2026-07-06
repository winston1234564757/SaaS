'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { X, LifeBuoy, Sparkles, History, Plus } from 'lucide-react';
import { useLiveChat } from '@/lib/hooks/useLiveChat';
import { getSupportPresence } from '@/lib/utils/supportHours';
import { createSupportTicketAction, sendSupportMessageAction } from '@/lib/actions/support';
import { parseError } from '@/lib/utils/errors';
import { createClient } from '@/lib/supabase/client';
import { ScrollStrip } from '@/components/shared/ScrollStrip';
import { ChatShell } from '@/components/shared/chat/ChatShell';
import { ChatHeader } from '@/components/shared/chat/ChatHeader';
import { ChatMessageList } from '@/components/shared/chat/ChatMessageList';
import { ChatComposer } from '@/components/shared/chat/ChatComposer';

interface SupportChatPageProps {
  user: { id: string };
  userRole: 'master' | 'client';
  initialTicketId: string | null;
  /** Desktop 2-pane: render contained inside the pane, drop the back button. */
  inPane?: boolean;
}

const SUGGESTIONS = [
  'Не приходить Telegram сповіщення',
  'Як змінити робочі години або додати вихідні?',
  'Проблема з нарахуванням оплати',
  'Як кастомізувати посилання на сторінку (Slug)?',
];

interface TicketRow { id: string; type: string; status: string; created_at: string }
const STATUS_LABEL: Record<string, string> = {
  open: 'Активна',
  active: 'Активна',
  resolved: 'Вирішена',
  closed: 'Вирішена',
};

export function SupportChatPage({ user, userRole, initialTicketId, inPane = false }: SupportChatPageProps) {
  const router = useRouter();
  const supabase = createClient();

  const [activeTicketId, setActiveTicketId] = useState<string | null>(initialTicketId);
  const { messages, loading: chatLoading, setMessages } = useLiveChat(activeTicketId);

  const [messageText, setMessageText] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [tickets, setTickets] = useState<TicketRow[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  // Load the user's support ticket history (refetch when a new ticket is created)
  useEffect(() => {
    let active = true;
    (async () => {
      const { data } = await supabase
        .from('support_tickets')
        .select('id, type, status, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (active && data) setTickets(data as TicketRow[]);
    })();
    return () => { active = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user.id, activeTicketId]);

  const openTicket = (id: string) => {
    setShowHistory(false);
    if (id === activeTicketId) return;
    setMessages([]);
    setActiveTicketId(id);
  };

  const startNewConversation = () => {
    setShowHistory(false);
    setMessages([]);
    setActiveTicketId(null);
  };

  useEffect(() => {
    return () => { if (filePreview) URL.revokeObjectURL(filePreview); };
  }, [filePreview]);

  const handlePickFile = (file: File) => {
    if (file.size > 10 * 1024 * 1024) { setSubmitError('Розмір файлу не повинен перевищувати 10 МБ'); return; }
    setSelectedFile(file);
    setFilePreview(URL.createObjectURL(file));
    setSubmitError(null);
  };

  const removeFile = () => {
    setSelectedFile(null);
    if (filePreview) URL.revokeObjectURL(filePreview);
    setFilePreview(null);
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

  const handleSend = async () => {
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

  const presence = getSupportPresence();
  const currentStatus = tickets.find((t) => t.id === activeTicketId)?.status ?? null;
  const isResolved = currentStatus === 'resolved' || currentStatus === 'closed';

  const avatar = (
    <div className="relative size-9 rounded-full bg-accent/10 border border-border flex items-center justify-center shrink-0">
      <LifeBuoy className="size-5 text-accent" />
      <span
        className={`absolute -bottom-0.5 -right-0.5 block size-2.5 rounded-full ring-2 ring-background ${
          presence.online ? 'bg-[var(--success)] animate-pulse' : 'bg-[var(--text-tertiary)]'
        }`}
      />
    </div>
  );

  const emptyState = (
    <div className="flex h-full flex-col items-center justify-center text-center px-6">
      <div className="max-w-sm space-y-4">
        <div className="mx-auto size-16 rounded-full bg-accent/10 border border-border flex items-center justify-center text-accent">
          <Sparkles className="size-7" />
        </div>
        <h3 className="text-base font-bold text-foreground">Потрібна допомога?</h3>
        <p className="text-xs text-foreground/60 leading-relaxed font-medium">
          Напиши своє запитання нижче. Наша команда підтримки зв&apos;яжеться з тобою найближчим часом.
        </p>
        <div className="w-full space-y-2 pt-4 text-left">
          <p className="text-[11px] font-bold text-foreground/60 px-1">Популярні запити:</p>
          <div className="flex flex-col gap-2">
            {SUGGESTIONS.map((text) => (
              <button
                type="button"
                key={text}
                onClick={() => handleSuggestionClick(text)}
                className="text-left text-xs bg-secondary border border-border hover:bg-secondary/70 p-3 rounded-2xl transition cursor-pointer shadow-sm active:scale-[0.98]"
              >
                {text}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <ChatShell
      contained={inPane}
      header={
        <ChatHeader
          avatar={avatar}
          title="Служба підтримки BookIT"
          subtitle={presence.label}
          onBack={inPane ? undefined : handleBack}
          action={
            <div className="flex items-center gap-2">
              {currentStatus && (
                <span
                  className={`inline-flex items-center text-[10px] font-bold px-2 py-1 rounded-full ${
                    isResolved ? 'bg-secondary text-text-sub' : 'bg-[var(--success)]/12 text-[#0D6B2F]'
                  }`}
                >
                  {isResolved ? 'Вирішено' : 'Відкрито'}
                </span>
              )}
              <button
                type="button"
                onClick={() => setShowHistory(true)}
                aria-label="Історія розмов"
                className="flex items-center justify-center size-11 shrink-0 rounded-full border border-border hover:bg-secondary active:scale-[0.95] transition-all cursor-pointer"
              >
                <History className="size-5 text-text-sub" />
              </button>
            </div>
          }
        />
      }
      composer={
        <ChatComposer
          value={messageText}
          onChange={setMessageText}
          onSubmit={handleSend}
          onPickFile={handlePickFile}
          canSend={!!messageText.trim() || !!selectedFile}
          submitting={submitting}
        >
          {messages.length > 0 && (
            <ScrollStrip className="flex gap-2 py-1">
              {SUGGESTIONS.map((text) => (
                <button
                  type="button"
                  key={text}
                  onClick={() => handleSuggestionClick(text)}
                  className="whitespace-nowrap text-[10px] font-bold bg-secondary border border-border hover:bg-secondary/70 px-3 py-2 rounded-full transition cursor-pointer shadow-sm shrink-0 active:scale-[0.95]"
                >
                  {text}
                </button>
              ))}
            </ScrollStrip>
          )}
          {submitError && (
            <div className="rounded-xl bg-destructive/10 p-3 text-xs text-destructive border border-destructive/20">
              {submitError}
            </div>
          )}
          {filePreview && (
            <div className="relative flex items-center gap-2.5 rounded-2xl bg-secondary border border-border p-2 pr-9 w-fit shadow-sm">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={filePreview} alt="Попередній перегляд" className="size-9 rounded-lg object-cover" />
              <div className="text-xs font-semibold truncate max-w-[200px] text-foreground">{selectedFile?.name}</div>
              <button
                type="button"
                onClick={removeFile}
                aria-label="Видалити файл"
                className="absolute right-2.5 size-6 flex items-center justify-center rounded-full bg-background text-text-sub hover:bg-secondary active:scale-[0.90] cursor-pointer"
              >
                <X className="size-3" />
              </button>
            </div>
          )}
        </ChatComposer>
      }
    >
      <ChatMessageList
        messages={messages}
        currentUserId={user.id}
        loading={chatLoading}
        emptyState={emptyState}
      />

      {/* Ticket history overlay */}
      {showHistory && (
        <div className="absolute inset-0 z-30 flex flex-col bg-background backdrop-blur-xl pt-[env(safe-area-inset-top)]">
          <div className="flex items-center justify-between px-4 py-3.5 border-b border-border shrink-0">
            <h2 className="text-sm font-bold text-foreground">Історія розмов</h2>
            <button
              type="button"
              onClick={() => setShowHistory(false)}
              aria-label="Закрити"
              className="flex items-center justify-center size-11 rounded-full border border-border hover:bg-secondary active:scale-[0.95] transition-all cursor-pointer"
            >
              <X className="size-5 text-text-sub" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-2 max-w-2xl mx-auto w-full">
            <button
              type="button"
              onClick={startNewConversation}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-accent text-accent-foreground text-sm font-bold active:scale-[0.98] transition cursor-pointer"
            >
              <Plus className="size-4" /> Нова розмова
            </button>
            {tickets.length === 0 ? (
              <p className="text-center text-xs text-foreground/60 py-8">Немає попередніх розмов</p>
            ) : (
              tickets.map((t) => {
                const isActive = t.id === activeTicketId;
                return (
                  <button
                    type="button"
                    key={t.id}
                    onClick={() => openTicket(t.id)}
                    aria-pressed={isActive}
                    className={`w-full flex items-center justify-between gap-3 px-4 py-3 rounded-2xl border text-left transition cursor-pointer active:scale-[0.98] ${isActive ? 'bg-accent/10 border-border' : 'bg-secondary border-border hover:bg-secondary/70'}`}
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground">
                        Звернення від {new Date(t.created_at).toLocaleDateString('uk-UA', { day: 'numeric', month: 'long' })}
                      </p>
                      <p className="text-[11px] text-foreground/60 mt-0.5">{STATUS_LABEL[t.status] ?? t.status}</p>
                    </div>
                    {isActive && <span className="shrink-0 text-[10px] font-bold text-accent">Поточна</span>}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </ChatShell>
  );
}
