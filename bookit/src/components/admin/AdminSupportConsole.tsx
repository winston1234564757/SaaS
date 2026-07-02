'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useLiveChat } from '@/lib/hooks/useLiveChat';
import { ChatMessageList } from '@/components/shared/chat/ChatMessageList';
import { Sheet } from '@/components/ui/Sheet';
import {
  sendSupportMessageAction,
  resolveSupportTicketAction,
  getAdminMessageTargets,
  createAdminTicketForUser,
  type AdminTarget,
} from '@/lib/actions/support';
import {
  MessageSquare,
  CheckCircle2,
  Paperclip,
  Send,
  Loader2,
  X,
  Search,
  User,
  Image as ImageIcon
} from 'lucide-react';

interface TicketRecord {
  id: string;
  user_id: string;
  type: 'feedback' | 'bug' | 'idea' | 'chat';
  status: 'open' | 'active' | 'resolved';
  created_at: string;
  updated_at: string;
  profiles: {
    full_name: string;
    phone: string | null;
    role: string;
  } | null;
}

export function AdminSupportConsole({ adminId }: { adminId: string }) {
  const [tickets, setTickets] = useState<TicketRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'active' | 'resolved'>('all');
  const [activeTicketId, setActiveTicketId] = useState<string | null>(null);

  // New-conversation picker (admin → master/client)
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerTab, setPickerTab] = useState<'master' | 'client'>('master');
  const [pickerSearch, setPickerSearch] = useState('');
  const [targets, setTargets] = useState<{ masters: AdminTarget[]; clients: AdminTarget[] } | null>(null);
  const [startingId, setStartingId] = useState<string | null>(null);

  // Chat message send states
  const [messageText, setMessageText] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { messages, loading: chatLoading } = useLiveChat(activeTicketId);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  const fetchTickets = async () => {
    try {
      const { data, error: fetchErr } = await supabase
        .from('support_tickets')
        .select(`
          id, user_id, type, status, created_at, updated_at,
          profiles:user_id ( full_name, phone, role )
        `)
        .order('updated_at', { ascending: false });

      if (fetchErr) throw fetchErr;
      setTickets(data || []);
    } catch (err) {
      console.error('[AdminSupport] Fetch tickets error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();

    // Subscribe to support ticket inserts/updates in real-time
    const channel = supabase
      .channel('support_tickets_realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'support_tickets' },
        () => {
          fetchTickets();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Clean file preview url
  useEffect(() => {
    return () => {
      if (filePreview) URL.revokeObjectURL(filePreview);
    };
  }, [filePreview]);

  const activeTicket = tickets.find(t => t.id === activeTicketId) || null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setError('Розмір файлу не повинен перевищувати 10 МБ');
        return;
      }
      setSelectedFile(file);
      setFilePreview(URL.createObjectURL(file));
      setError(null);
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

    const { error: uploadError } = await supabase.storage
      .from('support_attachments')
      .upload(path, selectedFile, { cacheControl: '3600', upsert: true });

    if (uploadError) {
      console.error('[SupportAdmin] Upload error:', uploadError.message);
      return null;
    }

    const { data } = supabase.storage
      .from('support_attachments')
      .getPublicUrl(path);

    return data?.publicUrl || null;
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() && !selectedFile) return;
    if (!activeTicketId) return;

    setSending(true);
    setError(null);
    const currentMsg = messageText;
    setMessageText('');

    try {
      let fileUrl: string | null = null;
      if (selectedFile) {
        fileUrl = await uploadFile(activeTicketId);
        removeFile();
      }

      if (currentMsg.trim() || fileUrl) {
        const { error: sendErr } = await sendSupportMessageAction(
          activeTicketId,
          currentMsg.trim() || 'Зображення прикріплено',
          fileUrl
        );
        if (sendErr) throw new Error(sendErr);
      }
    } catch (err: any) {
      setError(err.message);
      setMessageText(currentMsg);
    } finally {
      setSending(false);
    }
  };

  const handleResolveTicket = async () => {
    if (!activeTicketId) return;
    setSending(true);
    try {
      const { error: resolveErr } = await resolveSupportTicketAction(activeTicketId);
      if (resolveErr) throw new Error(resolveErr);
      await fetchTickets();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  };

  const openPicker = () => {
    setPickerOpen(true);
    if (!targets) getAdminMessageTargets().then(setTargets).catch(() => setTargets({ masters: [], clients: [] }));
  };

  const startWithUser = async (userId: string) => {
    setStartingId(userId);
    try {
      const { ticketId, error: startErr } = await createAdminTicketForUser(userId);
      if (startErr) throw new Error(startErr);
      await fetchTickets();
      if (ticketId) setActiveTicketId(ticketId);
      setPickerOpen(false);
      setPickerSearch('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setStartingId(null);
    }
  };

  const pickerList = ((pickerTab === 'master' ? targets?.masters : targets?.clients) ?? [])
    .filter(t => !pickerSearch.trim() || t.name.toLowerCase().includes(pickerSearch.trim().toLowerCase()));

  const filteredTickets = tickets.filter(t => {
    const nameMatch = (t.profiles?.full_name || '').toLowerCase().includes(search.toLowerCase()) ||
      (t.profiles?.phone || '').includes(search);

    const statusMatch = statusFilter === 'all' || t.status === statusFilter;

    return nameMatch && statusMatch;
  });

  return (
    <div className="flex-1 flex gap-6 overflow-hidden rounded-3xl border border-slate-200/60 bg-white/70 backdrop-blur-md shadow-sm h-[72vh]">

      {/* Left pane: Ticket list */}
      <div className="w-[320px] shrink-0 border-r border-slate-200/60 flex flex-col overflow-hidden">
        {/* Search */}
        <div className="p-4 border-b border-slate-100 space-y-3">
          <button
            type="button"
            onClick={openPicker}
            className="w-full flex items-center justify-center gap-2 rounded-full bg-slate-900 text-slate-50 py-2.5 text-xs font-bold hover:bg-slate-800 active:scale-[0.98] transition cursor-pointer"
          >
            <MessageSquare className="size-3.5" /> Нова розмова
          </button>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Пошук користувача..."
              aria-label="Пошук користувача"
              className="w-full rounded-full border border-slate-200 bg-white pl-9 pr-4 py-2 text-xs text-slate-900 placeholder-slate-400 outline-none focus:border-slate-400 transition"
            />
          </div>
          <div className="flex gap-1.5 overflow-x-auto scrollbar-hide py-1">
            {['all', 'open', 'active', 'resolved'].map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setStatusFilter(s as 'all' | 'open' | 'active' | 'resolved')}
                className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider transition cursor-pointer shrink-0 ${
                  statusFilter === s
                    ? 'bg-slate-900 text-slate-50'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {s === 'all' ? 'всі' : s}
              </button>
            ))}
          </div>
        </div>

        {/* Tickets Scroll list */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100 scrollbar-hide">
          {loading ? (
            <div className="flex h-32 items-center justify-center">
              <Loader2 className="size-5 animate-spin text-slate-400" />
            </div>
          ) : filteredTickets.length === 0 ? (
            <div className="p-6 text-center text-slate-400 text-xs">
              Тікетів не знайдено
            </div>
          ) : (
            filteredTickets.map((t) => {
              const isActive = t.id === activeTicketId;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => {
                    setActiveTicketId(t.id);
                    setError(null);
                  }}
                  className={`w-full text-left p-4 hover:bg-slate-50/50 transition cursor-pointer flex justify-between items-start gap-2 ${
                    isActive ? 'bg-slate-100/60 border-r-2 border-slate-900' : ''
                  }`}
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-slate-900 text-xs truncate max-w-[120px]">
                        {t.profiles?.full_name || 'Користувач'}
                      </span>
                      <span className={`text-[9px] font-bold uppercase px-1 rounded border ${
                        t.profiles?.role === 'master'
                          ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                          : 'bg-slate-50 border-slate-200 text-slate-500'
                      }`}>
                        {t.profiles?.role}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono">
                      тип: {t.type}
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <span className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide border ${
                      t.status === 'open'
                        ? 'bg-red-50 text-red-700 border-red-200'
                        : t.status === 'active'
                        ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                        : 'bg-slate-100 text-slate-500 border-slate-200'
                    }`}>
                      {t.status}
                    </span>
                    <span className="text-[9px] text-slate-400">
                      {new Date(t.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Right pane: Chat Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {activeTicket ? (
          <>
            {/* Header info */}
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 shrink-0">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-slate-900 text-sm">
                    {activeTicket.profiles?.full_name || 'Підтримка'}
                  </h3>
                  <span className="text-xs text-slate-500">• {activeTicket.profiles?.phone || ''}</span>
                </div>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Тікет ID: {activeTicket.id}
                </p>
              </div>

              {activeTicket.status !== 'resolved' && (
                <button
                  type="button"
                  onClick={handleResolveTicket}
                  disabled={sending}
                  className="flex items-center gap-1.5 rounded-full bg-slate-900 px-4 py-2 text-xs font-bold text-slate-50 hover:bg-slate-800 transition active:scale-[0.95] cursor-pointer"
                >
                  <CheckCircle2 className="size-3.5" />
                  Вирішено
                </button>
              )}
            </div>

            {error && (
              <div className="mx-6 mt-4 rounded-xl bg-red-50 p-3 text-xs text-red-600 border border-red-100 shrink-0">
                {error}
              </div>
            )}

            {/* Chat Messages — shared grouped stream (admin = own → right) */}
            <ChatMessageList
              messages={messages}
              currentUserId={adminId}
              loading={chatLoading}
              className="p-2"
            />

            {/* Chat Send Form */}
            {activeTicket.status !== 'resolved' ? (
              <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-100 shrink-0 space-y-2">
                {filePreview && (
                  <div className="relative flex items-center gap-2 rounded-2xl bg-slate-50 border border-slate-200 p-2 pr-8">
                    <img src={filePreview} alt="Preview" className="size-8 rounded object-cover" />
                    <span className="text-xs font-semibold text-slate-700 truncate max-w-[200px]">
                      {selectedFile?.name}
                    </span>
                    <button
                      type="button"
                      onClick={removeFile}
                      aria-label="Видалити файл"
                      className="absolute right-2 size-5 flex items-center justify-center rounded-full bg-slate-200 text-slate-500 hover:bg-slate-300 active:scale-[0.90] cursor-pointer"
                    >
                      <X className="size-3" />
                    </button>
                  </div>
                )}

                <div className="flex items-center gap-2 rounded-full bg-slate-50 border border-slate-200 px-4 py-2">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/*"
                    className="hidden"
                    aria-hidden="true"
                    tabIndex={-1}
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    aria-label="Додати зображення"
                    className="flex size-8 shrink-0 items-center justify-center rounded-full bg-white text-slate-500 hover:bg-slate-100 active:scale-[0.90] cursor-pointer border border-slate-200"
                  >
                    <ImageIcon className="size-4" />
                  </button>

                  <input
                    type="text"
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    placeholder="Напишіть відповідь підтримки..."
                    aria-label="Текст відповіді"
                    className="flex-1 text-xs bg-transparent outline-none text-slate-900 placeholder-slate-400"
                  />

                  <button
                    type="submit"
                    disabled={sending || (!messageText.trim() && !selectedFile)}
                    aria-label="Надіслати"
                    className="flex size-8 shrink-0 items-center justify-center rounded-full bg-slate-900 text-slate-50 transition hover:bg-slate-800 active:scale-[0.90] disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                  >
                    {sending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
                  </button>
                </div>
              </form>
            ) : (
              <div className="p-6 text-center border-t border-slate-100 bg-slate-50/30 text-xs text-slate-400 shrink-0 font-medium">
                Цей тікет вирішено та закрито.
              </div>
            )}
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 gap-2">
            <MessageSquare className="size-10 text-slate-350" />
            <p className="text-xs">Оберіть тікет підтримки зі списку ліворуч, щоб почати чат</p>
          </div>
        )}
      </div>

      {/* New-conversation picker: masters / clients → start a support ticket */}
      <Sheet open={pickerOpen} onOpenChange={setPickerOpen} title="Нова розмова" variant="dialog" maxWidth="md">
        <div className="flex flex-col gap-4">
          <div className="flex gap-2">
            {(['master', 'client'] as const).map(tab => (
              <button
                key={tab}
                type="button"
                onClick={() => setPickerTab(tab)}
                aria-pressed={pickerTab === tab}
                className={`flex-1 rounded-full py-2 text-xs font-bold transition cursor-pointer ${
                  pickerTab === tab ? 'bg-slate-900 text-slate-50' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {tab === 'master' ? 'Майстри' : 'Клієнти'}
              </button>
            ))}
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-slate-400" />
            <input
              type="text"
              value={pickerSearch}
              onChange={e => setPickerSearch(e.target.value)}
              placeholder="Пошук за іменем"
              aria-label="Пошук за іменем"
              className="w-full rounded-full border border-slate-200 bg-white pl-9 pr-4 py-2 text-xs text-slate-900 placeholder-slate-400 outline-none focus:border-slate-400 transition"
            />
          </div>

          <div className="max-h-[50vh] overflow-y-auto scrollbar-hide flex flex-col gap-1">
            {!targets ? (
              <div className="flex justify-center py-8"><Loader2 className="size-5 animate-spin text-slate-400" /></div>
            ) : pickerList.length === 0 ? (
              <p className="text-center text-xs text-slate-400 py-8">Нікого не знайдено</p>
            ) : (
              pickerList.map(t => {
                const initials = t.name.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase();
                return (
                  <button
                    key={t.id}
                    type="button"
                    disabled={!!startingId}
                    onClick={() => startWithUser(t.id)}
                    className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-50 active:scale-[0.99] transition text-left disabled:opacity-60"
                  >
                    {t.avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={t.avatarUrl} alt={t.name} className="size-9 rounded-full object-cover shrink-0" />
                    ) : (
                      <div className="size-9 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                        <span className="text-[11px] font-semibold text-slate-500">{initials}</span>
                      </div>
                    )}
                    <span className="flex-1 text-sm font-medium text-slate-900 truncate">{t.name}</span>
                    {startingId === t.id
                      ? <Loader2 className="size-4 animate-spin text-slate-400" />
                      : <Send className="size-4 text-slate-400" />}
                  </button>
                );
              })
            )}
          </div>
        </div>
      </Sheet>
    </div>
  );
}
