'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Send, Users, MessageSquare, Percent, Link2,
  ChevronDown, ChevronUp, Eye, Loader2, Tag, ShoppingBag,
  Scissors, Zap, Search, Check, UserCheck, ChevronRight,
} from 'lucide-react';
import {
  useBroadcastMutations,
  usePreviewRecipients,
  useClientsForPicker,
} from '@/lib/supabase/hooks/useBroadcasts';
import { useServices } from '@/lib/supabase/hooks/useServices';
import type { BroadcastChannel, BroadcastTagFilter } from '@/types/database';
import type { CreateBroadcastInput } from '@/app/(master)/dashboard/marketing/actions';
import { resolveTagClientIds } from '@/app/(master)/dashboard/marketing/actions';
import { pluralUk } from '@/lib/utils/pluralUk';

// ── Types ─────────────────────────────────────────────────────────────────────

interface Product { id: string; name: string; price: number }

interface Props {
  onClose: () => void;
  onSent: () => void;
  products: Product[];
  broadcastsUsed: number;
  isStarter: boolean;
}

interface ClientPreviewItem {
  clientId: string;
  name: string;
  phone: string;
  retentionStatus: string | null;
  isVip: boolean;
  totalVisits: number;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const TAG_OPTIONS: { value: BroadcastTagFilter; label: string; color: string; bg: string }[] = [
  { value: 'vip',      label: 'VIP',          color: '#D4935A', bg: '#D4935A15' },
  { value: 'new',      label: 'Новий',         color: '#789A99', bg: '#789A9915' },
  { value: 'regular',  label: 'Постійний',     color: '#5C9E7A', bg: '#5C9E7A15' },
  { value: 'big_check',label: 'Великий чек',   color: '#D4935A', bg: '#D4935A15' },
  { value: 'sleeping', label: 'Спить',         color: '#A8928D', bg: '#A8928D15' },
  { value: 'at_risk',  label: 'Під ризиком',   color: '#C05B5B', bg: '#C05B5B15' },
  { value: 'lost',     label: 'Втрачений',     color: '#6B5750', bg: '#6B575015' },
  { value: 'active',   label: 'Активний',      color: '#5C9E7A', bg: '#5C9E7A15' },
];

const CHANNEL_OPTIONS: { value: BroadcastChannel; label: string; icon: string }[] = [
  { value: 'push',     label: 'Push',     icon: '🔔' },
  { value: 'telegram', label: 'Telegram', icon: '✈️' },
  { value: 'sms',      label: 'SMS',      icon: '📱' },
];

const EXPIRY_OPTIONS = [
  { value: 1,  label: '1 день' },
  { value: 3,  label: '3 дні' },
  { value: 7,  label: '7 днів' },
  { value: 14, label: '14 днів' },
  { value: 30, label: '30 днів' },
];

const TEMPLATES: Record<string, string> = {
  sleeping:  "{{ім'я}}, давно не бачились! Спеціально для тебе — {{знижка}} на повернення ✨",
  at_risk:   "{{ім'я}}, ми скучили! Тримай персональну пропозицію — {{знижка}} 🎁",
  lost:      "{{ім'я}}, повертайся! Отримай {{знижка}} на наступний візит 💝",
  vip:       "{{ім'я}}, ти наш VIP 💎 Першим дізнайся про нову послугу — записуйся зі знижкою {{знижка}}",
  new:       "{{ім'я}}, дякуємо за перший візит! Записуйся знову і отримай {{знижка}} ✨",
  regular:   "{{ім'я}}, для наших постійних клієнтів — особлива пропозиція! {{знижка}} на наступний візит",
  big_check: "{{ім'я}}, цінуємо твій вибір! Отримай {{знижка}} на наступний преміум-сервіс ✨",
  default:   "{{ім'я}}, у нас для тебе є особлива пропозиція! Записуйся зі знижкою {{знижка}} ✨",
};

// ── Component ─────────────────────────────────────────────────────────────────

export function BroadcastEditor({ onClose, onSent, products, broadcastsUsed, isStarter }: Props) {
  const [title, setTitle]               = useState('');
  const [message, setMessage]           = useState('');
  const [channels, setChannels]         = useState<BroadcastChannel[]>(['push', 'telegram', 'sms']);
  const [discountPct, setDiscountPct]   = useState<number | ''>('');
  const [discountServiceId, setDiscountServiceId] = useState('');
  const [discountDays, setDiscountDays] = useState(3);
  const [serviceLinkId, setServiceLinkId] = useState('');
  const [productLinkId, setProductLinkId] = useState('');
  const [showDiscount, setShowDiscount] = useState(false);
  const [showLinks, setShowLinks]       = useState(false);
  const [error, setError]               = useState('');
  const [step, setStep]                 = useState<'edit' | 'confirm'>('edit');
  const [resolvedClientIds, setResolvedClientIds] = useState<string[]>([]);
  const [resolving, setResolving]       = useState(false);

  // Audience mode
  const [targetMode, setTargetMode] = useState<'tags' | 'clients'>('tags');

  // Tags mode
  const [tags, setTags]             = useState<BroadcastTagFilter[]>([]);
  const [excludedIds, setExcludedIds] = useState<Set<string>>(new Set());
  const [tagPage, setTagPage]       = useState(0);

  // Clients mode
  const [search, setSearch]         = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [clientPage, setClientPage] = useState(0);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const searchTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const { create, send } = useBroadcastMutations();
  const { services } = useServices();

  // Tag-mode preview
  const { data: tagPreview } = usePreviewRecipients(tags, tagPage);
  // Clients-mode picker
  const { data: pickerData } = useClientsForPicker(search, clientPage);

  const isSending = create.isPending || send.isPending;

  // Auto-fill template on first tag
  useEffect(() => {
    if (tags.length > 0 && !message) {
      setMessage(TEMPLATES[tags[0]] ?? TEMPLATES.default);
    }
  }, [tags, message]);

  // Reset page when tags change
  useEffect(() => { setTagPage(0); setExcludedIds(new Set()); }, [tags]);

  // Debounce search
  const handleSearchInput = (v: string) => {
    setSearchInput(v);
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      setSearch(v);
      setClientPage(0);
    }, 300);
  };

  const toggleTag = (tag: BroadcastTagFilter) =>
    setTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);

  const toggleChannel = (ch: BroadcastChannel) =>
    setChannels(prev => prev.includes(ch) ? prev.filter(c => c !== ch) : [...prev, ch]);

  const toggleExclude = (clientId: string) =>
    setExcludedIds(prev => {
      const next = new Set(prev);
      next.has(clientId) ? next.delete(clientId) : next.add(clientId);
      return next;
    });

  const toggleSelect = (client: ClientPreviewItem) =>
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(client.clientId) ? next.delete(client.clientId) : next.add(client.clientId);
      return next;
    });

  const currentCount = targetMode === 'clients'
    ? selectedIds.size
    : Math.max(0, (tagPreview?.count ?? 0) - excludedIds.size);

  const handlePreview = useCallback(async () => {
    if (!title.trim())   return setError('Вкажіть назву розсилки');
    if (!message.trim()) return setError('Напишіть повідомлення');
    if (channels.length === 0) return setError('Оберіть хоча б один канал');
    if (targetMode === 'clients' && selectedIds.size === 0) {
      return setError('Оберіть хоча б одного клієнта');
    }

    setError('');
    setResolving(true);

    try {
      let finalIds: string[];
      if (targetMode === 'clients') {
        finalIds = Array.from(selectedIds);
      } else {
        const allTagIds = await resolveTagClientIds(tags);
        finalIds = allTagIds.filter(id => !excludedIds.has(id));
        if (finalIds.length === 0) return setError('Всі клієнти виключені або в cooldown');
      }
      setResolvedClientIds(finalIds);
      setStep('confirm');
    } finally {
      setResolving(false);
    }
  }, [title, message, channels, targetMode, selectedIds, tags, excludedIds]);

  const handleSend = useCallback(async () => {
    setError('');

    const input: CreateBroadcastInput = {
      title:                title.trim(),
      message_template:     message.trim(),
      channels,
      tag_filters:          targetMode === 'tags' ? tags : [],
      discount_percent:     discountPct !== '' ? discountPct : null,
      discount_service_id:  discountServiceId || null,
      discount_expires_days: discountPct !== '' ? discountDays : null,
      service_link_id:      serviceLinkId || null,
      product_link_id:      productLinkId || null,
    };

    const created = await create.mutateAsync(input);
    if ('error' in created && created.error) return setError(created.error);

    const result = await send.mutateAsync({ id: created.id!, clientIds: resolvedClientIds });
    if ('error' in result && result.error) {
      if (result.error === 'STARTER_LIMIT') {
        return setError('Вичерпано ліміт (3 безкоштовні розсилки). Перейди на Pro.');
      }
      return setError(result.error);
    }

    onSent();
  }, [title, message, channels, targetMode, tags, discountPct, discountServiceId, discountDays,
      serviceLinkId, productLinkId, resolvedClientIds, create, send, onSent]);

  // ── Tag-mode client list ────────────────────────────────────────────────────

  const tagClients: ClientPreviewItem[] = (tagPreview?.clients ?? []) as ClientPreviewItem[];
  const pickerClients: ClientPreviewItem[] = (pickerData?.clients ?? []) as ClientPreviewItem[];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <motion.div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        onClick={onClose}
      />

      <motion.div
        className="relative w-full sm:max-w-lg max-h-[92dvh] overflow-y-auto rounded-t-3xl sm:rounded-3xl flex flex-col"
        style={{ background: 'rgba(255,232,220,0.98)', backdropFilter: 'blur(20px)' }}
        initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
        exit={{ y: 60, opacity: 0 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-secondary sticky top-0 z-10"
          style={{ background: 'rgba(255,232,220,0.98)' }}>
          <div>
            <h2 className="font-semibold text-foreground text-base">
              {step === 'confirm' ? 'Підтвердження розсилки' : 'Нова розсилка'}
            </h2>
            {isStarter && (
              <p className="text-xs text-muted-foreground/60 mt-0.5">
                Використано {broadcastsUsed} / 3 безкоштовних
              </p>
            )}
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-secondary transition-colors active:scale-95 transition-all">
            <X size={18} className="text-muted-foreground" />
          </button>
        </div>

        <AnimatePresence mode="wait">
          {step === 'confirm' ? (
            <motion.div key="confirm"
              initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="px-5 py-4 flex flex-col gap-4"
            >
              <div className="rounded-2xl p-4 space-y-3" style={{ background: 'rgba(255,255,255,0.68)' }}>
                <ConfirmRow icon={<MessageSquare size={15} />} label="Повідомлення" value={message} multiline />
                <ConfirmRow icon={<Users size={15} />} label="Отримувачів" value={`${resolvedClientIds.length} клієнтів`} />
                <ConfirmRow
                  icon={<Tag size={15} />}
                  label="Аудиторія"
                  value={targetMode === 'clients'
                    ? `Конкретні клієнти (${selectedIds.size})`
                    : tags.length > 0
                      ? TAG_OPTIONS.filter(t => tags.includes(t.value)).map(t => t.label).join(', ')
                      : 'Всі клієнти'}
                />
                <ConfirmRow
                  icon={<Zap size={15} />}
                  label="Канали"
                  value={channels.join(' + ').toUpperCase()}
                />
                {discountPct !== '' && (
                  <ConfirmRow
                    icon={<Percent size={15} />}
                    label="Знижка"
                    value={`${discountPct}% · ${discountDays} ${pluralUk(discountDays, 'день', 'дні', 'днів')}`}
                  />
                )}
              </div>

              {error && <p className="text-xs text-destructive px-1">{error}</p>}

              <div className="flex gap-3">
                <button onClick={() => setStep('edit')}
                  className="flex-1 py-3 rounded-2xl border border-[#E8D5CC] text-sm text-muted-foreground font-medium">
                  Назад
                </button>
                <button
                  onClick={handleSend}
                  disabled={isSending}
                  data-testid="confirm-send-btn"
                  className="flex-[2] py-3 rounded-2xl text-sm font-semibold text-white flex items-center justify-center gap-2 transition-opacity disabled:opacity-60 active:scale-95 transition-all"
                  style={{ background: 'linear-gradient(135deg, #2C1A14, #4A2E24)' }}
                >
                  {isSending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                  {isSending ? 'Відправляємо...' : `Відправити (${resolvedClientIds.length})`}
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div key="edit"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="px-5 py-4 flex flex-col gap-5"
            >
              {/* Title */}
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Назва (для вас)</label>
                <input
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  data-testid="broadcast-title-input"
                  placeholder="Напр. «Повернення сплячих клієнтів»"
                  className="w-full px-4 py-3 rounded-2xl text-sm text-foreground placeholder:text-muted-foreground/60 outline-none border border-[#E8D5CC] focus:border-primary transition-colors"
                  style={{ background: 'rgba(255,255,255,0.68)' }}
                />
              </div>

              {/* Audience */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                    <Users size={13} />
                    Аудиторія
                    {currentCount > 0 && (
                      <span className="ml-1 text-primary font-semibold">~{currentCount}</span>
                    )}
                  </label>
                  {/* Mode switcher */}
                  <div className="flex rounded-xl overflow-hidden border border-[#E8D5CC] text-[11px] font-medium">
                    {(['tags', 'clients'] as const).map(mode => (
                      <button
                        key={mode}
                        onClick={() => setTargetMode(mode)}
                        className="px-3 py-1.5 transition-all"
                        style={targetMode === mode
                          ? { background: '#2C1A14', color: '#fff' }
                          : { background: 'rgba(255,255,255,0.5)', color: '#6B5750' }}
                      >
                        {mode === 'tags' ? 'За тегом' : 'Клієнти'}
                      </button>
                    ))}
                  </div>
                </div>

                <AnimatePresence mode="wait">
                  {targetMode === 'tags' ? (
                    <motion.div key="tags-mode"
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      className="space-y-3"
                    >
                      {/* Tag chips */}
                      <div className="flex flex-wrap gap-2">
                        {TAG_OPTIONS.map(tag => (
                          <button
                            key={tag.value}
                            onClick={() => toggleTag(tag.value)}
                            data-testid={`tag-filter-${tag.value}`}
                            className="text-xs font-bold px-3 py-1.5 rounded-full border transition-all"
                            style={tags.includes(tag.value)
                              ? { color: tag.color, background: tag.bg, borderColor: tag.color + '40' }
                              : { color: '#A8928D', background: 'rgba(255,255,255,0.5)', borderColor: '#E8D5CC' }}
                          >
                            {tag.label}
                          </button>
                        ))}
                        {tags.length === 0 && (
                          <span className="text-xs text-muted-foreground/60 self-center">Без фільтру — всі клієнти</span>
                        )}
                      </div>

                      {/* Tag client list with toggles */}
                      {tagClients.length > 0 && (
                        <div className="rounded-2xl overflow-hidden border border-[#E8D5CC]"
                          style={{ background: 'rgba(255,255,255,0.5)' }}>
                          <div className="px-3 py-2 border-b border-secondary flex items-center justify-between">
                            <span className="text-[11px] text-muted-foreground/60">
                              Клієнти за фільтром · {tagPreview?.count ?? 0}
                            </span>
                            {excludedIds.size > 0 && (
                              <span className="text-[11px] text-destructive">
                                Виключено: {excludedIds.size}
                              </span>
                            )}
                          </div>
                          {tagClients.map(c => (
                            <ClientRow
                              key={c.clientId}
                              client={c}
                              checked={!excludedIds.has(c.clientId)}
                              onToggle={() => toggleExclude(c.clientId)}
                            />
                          ))}
                          {/* Pagination */}
                          {((tagPreview?.hasMore) || tagPage > 0) && (
                            <div className="flex gap-2 px-3 py-2 border-t border-secondary">
                              {tagPage > 0 && (
                                <button onClick={() => setTagPage(p => p - 1)}
                                  className="text-[11px] text-primary flex items-center gap-1">
                                  ← Назад
                                </button>
                              )}
                              <span className="flex-1" />
                              {tagPreview?.hasMore && (
                                <button onClick={() => setTagPage(p => p + 1)}
                                  className="text-[11px] text-primary flex items-center gap-1">
                                  Ще <ChevronRight size={11} />
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </motion.div>
                  ) : (
                    <motion.div key="clients-mode"
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      className="space-y-2"
                    >
                      {/* Search */}
                      <div className="relative">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/60" />
                        <input
                          value={searchInput}
                          onChange={e => handleSearchInput(e.target.value)}
                          placeholder="Пошук за ім'ям або телефоном"
                          className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm text-foreground placeholder:text-muted-foreground/60 outline-none border border-[#E8D5CC] focus:border-primary"
                          style={{ background: 'rgba(255,255,255,0.68)' }}
                        />
                      </div>

                      {/* Selected chips */}
                      {selectedIds.size > 0 && (
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[11px] text-primary font-medium">
                            Обрано: {selectedIds.size}
                          </span>
                          <button onClick={() => setSelectedIds(new Set())}
                            className="text-[11px] text-destructive underline">
                            Скинути
                          </button>
                        </div>
                      )}

                      {/* Client list */}
                      {pickerClients.length > 0 && (
                        <div className="rounded-2xl overflow-hidden border border-[#E8D5CC]"
                          style={{ background: 'rgba(255,255,255,0.5)' }}>
                          {pickerClients.map(c => (
                            <ClientRow
                              key={c.clientId}
                              client={c}
                              checked={selectedIds.has(c.clientId)}
                              onToggle={() => toggleSelect(c)}
                            />
                          ))}
                          {((pickerData?.hasMore) || clientPage > 0) && (
                            <div className="flex gap-2 px-3 py-2 border-t border-secondary">
                              {clientPage > 0 && (
                                <button onClick={() => setClientPage(p => p - 1)}
                                  className="text-[11px] text-primary">← Назад</button>
                              )}
                              <span className="flex-1" />
                              {pickerData?.hasMore && (
                                <button onClick={() => setClientPage(p => p + 1)}
                                  className="text-[11px] text-primary flex items-center gap-1">
                                  Ще <ChevronRight size={11} />
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      )}

                      {pickerClients.length === 0 && search && (
                        <p className="text-xs text-muted-foreground/60 text-center py-3">Клієнтів не знайдено</p>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Channels */}
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-2 block">Канали</label>
                <div className="flex gap-2">
                  {CHANNEL_OPTIONS.map(ch => (
                    <button
                      key={ch.value}
                      onClick={() => toggleChannel(ch.value)}
                      className="flex-1 py-2.5 rounded-2xl text-xs font-medium border transition-all"
                      style={channels.includes(ch.value)
                        ? { background: '#2C1A14', color: '#fff', borderColor: '#2C1A14' }
                        : { background: 'rgba(255,255,255,0.5)', color: '#6B5750', borderColor: '#E8D5CC' }}
                    >
                      {ch.icon} {ch.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Message */}
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 flex items-center gap-1.5">
                  <MessageSquare size={13} />
                  Повідомлення
                </label>
                <textarea
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  data-testid="broadcast-message-textarea"
                  rows={4}
                  placeholder="Напишіть повідомлення або оберіть тег — ми підкажемо шаблон"
                  className="w-full px-4 py-3 rounded-2xl text-sm text-foreground placeholder:text-muted-foreground/60 outline-none border border-[#E8D5CC] focus:border-primary transition-colors resize-none"
                  style={{ background: 'rgba(255,255,255,0.68)' }}
                />
                <div className="flex flex-wrap gap-1.5 mt-2">
                  <span className="text-[10px] text-muted-foreground/60 self-center">Вставити:</span>
                  {["{{ім'я}}", '{{кількість_візитів}}', '{{знижка}}'].map(v => (
                    <button key={v}
                      onClick={() => setMessage(prev => prev + v)}
                      className="text-[10px] px-2 py-0.5 rounded-full border border-primary/40 text-primary hover:bg-primary/10 transition-colors">
                      {v}
                    </button>
                  ))}
                  {tags.length > 0 && (
                    <button
                      onClick={() => setMessage(TEMPLATES[tags[0]] ?? TEMPLATES.default)}
                      className="text-[10px] px-2 py-0.5 rounded-full border border-warning/40 text-warning hover:bg-warning/10 transition-colors ml-auto">
                      Шаблон для тегу
                    </button>
                  )}
                </div>
              </div>

              {/* Discount section */}
              <CollapsibleSection
                icon={<Percent size={15} className="text-primary" />}
                label="Знижка за посиланням"
                open={showDiscount}
                onToggle={() => setShowDiscount(v => !v)}
              >
                <div className="pt-3 space-y-3">
                  <div className="flex gap-3">
                    <div className="flex-1">
                      <label className="text-xs text-muted-foreground/60 mb-1 block">Знижка %</label>
                      <input type="number" min={1} max={99}
                        value={discountPct}
                        onChange={e => setDiscountPct(e.target.value === '' ? '' : Number(e.target.value))}
                        placeholder="20"
                        className="w-full px-3 py-2.5 rounded-xl text-sm text-foreground outline-none border border-[#E8D5CC] focus:border-primary"
                        style={{ background: 'rgba(255,255,255,0.68)' }}
                      />
                    </div>
                    <div className="flex-1">
                      <label className="text-xs text-muted-foreground/60 mb-1 block">Діє</label>
                      <select value={discountDays} onChange={e => setDiscountDays(Number(e.target.value))}
                        className="w-full px-3 py-2.5 rounded-xl text-sm text-foreground outline-none border border-[#E8D5CC]"
                        style={{ background: 'rgba(255,255,255,0.68)' }}>
                        {EXPIRY_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                      </select>
                    </div>
                  </div>
                  <select value={discountServiceId} onChange={e => setDiscountServiceId(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl text-sm text-foreground outline-none border border-[#E8D5CC]"
                    style={{ background: 'rgba(255,255,255,0.68)' }}>
                    <option value="">Будь-яка послуга</option>
                    {(services ?? []).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                  <p className="text-[11px] text-muted-foreground/60 leading-relaxed">
                    Клієнт отримає знижку автоматично після підтвердження номера телефону при записі.
                  </p>
                </div>
              </CollapsibleSection>

              {/* Links section */}
              <CollapsibleSection
                icon={<Link2 size={15} className="text-primary" />}
                label="Посилання в повідомленні"
                open={showLinks}
                onToggle={() => setShowLinks(v => !v)}
              >
                <div className="pt-3 space-y-3">
                  <div>
                    <label className="text-xs text-muted-foreground/60 mb-1 flex items-center gap-1">
                      <Scissors size={11} /> Послуга
                    </label>
                    <select value={serviceLinkId} onChange={e => setServiceLinkId(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl text-sm text-foreground outline-none border border-[#E8D5CC]"
                      style={{ background: 'rgba(255,255,255,0.68)' }}>
                      <option value="">Не обрано</option>
                      {(services ?? []).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground/60 mb-1 flex items-center gap-1">
                      <ShoppingBag size={11} /> Товар
                    </label>
                    <select value={productLinkId} onChange={e => setProductLinkId(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl text-sm text-foreground outline-none border border-[#E8D5CC]"
                      style={{ background: 'rgba(255,255,255,0.68)' }}>
                      <option value="">Не обрано</option>
                      {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  </div>
                  {(serviceLinkId || productLinkId) && (
                    <p className="text-[11px] text-success">
                      Клієнт перейде одразу в форму запису{productLinkId ? ' з товаром' : ''}.
                    </p>
                  )}
                </div>
              </CollapsibleSection>

              {error && <p className="text-xs text-destructive">{error}</p>}

              {isStarter && broadcastsUsed >= 3 && (
                <div className="rounded-2xl p-4 text-sm"
                  style={{ background: 'linear-gradient(135deg, rgba(212,147,90,0.12), rgba(120,154,153,0.10))', border: '1px solid rgba(212,147,90,0.28)' }}>
                  <p className="font-semibold text-foreground mb-1">Ліміт вичерпано</p>
                  <p className="text-xs text-muted-foreground">
                    У Starter плані доступно 3 безкоштовні розсилки. Перейди на Pro для необмежених.
                  </p>
                </div>
              )}

              <button
                onClick={handlePreview}
                disabled={resolving || (isStarter && broadcastsUsed >= 3)}
                data-testid="preview-broadcast-btn"
                className="w-full py-4 rounded-2xl text-sm font-semibold text-white flex items-center justify-center gap-2 transition-opacity disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg, #2C1A14, #4A2E24)' }}
              >
                {resolving ? <Loader2 size={16} className="animate-spin" /> : <Eye size={16} />}
                {resolving ? 'Формуємо список...' : 'Переглянути і відправити'}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

// ── Client row with toggle ─────────────────────────────────────────────────────

function ClientRow({
  client, checked, onToggle,
}: { client: ClientPreviewItem; checked: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      className="w-full flex items-center gap-3 px-3 py-2.5 border-b border-secondary/60 last:border-0 transition-colors hover:bg-secondary/40 text-left active:scale-95 transition-all"
    >
      <div
        className="w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all"
        style={checked
          ? { background: '#789A99', borderColor: '#789A99' }
          : { background: 'transparent', borderColor: '#E8D5CC' }}
      >
        {checked && <Check size={11} color="#fff" strokeWidth={3} />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-medium text-foreground truncate">{client.name}</span>
          {client.isVip && (
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-[#D4935A15] text-warning">VIP</span>
          )}
        </div>
        <span className="text-[11px] text-muted-foreground/60">{client.phone}</span>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        {client.retentionStatus && (
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-secondary text-muted-foreground">
            {client.retentionStatus}
          </span>
        )}
        <UserCheck size={13} className={checked ? 'text-primary' : 'text-[#E8D5CC]'} />
      </div>
    </button>
  );
}

// ── Collapsible section ───────────────────────────────────────────────────────

function CollapsibleSection({
  icon, label, open, onToggle, children,
}: {
  icon: React.ReactNode;
  label: string;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div>
      <button onClick={onToggle} className="flex items-center gap-2 text-sm font-medium text-foreground w-full active:scale-95 transition-all">
        {icon}
        {label}
        <span className="ml-auto">
          {open ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
        </span>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Confirm row ───────────────────────────────────────────────────────────────

function ConfirmRow({
  icon, label, value, multiline,
}: { icon: React.ReactNode; label: string; value: string; multiline?: boolean }) {
  return (
    <div className="flex items-start gap-2.5">
      <span className="text-primary mt-0.5 shrink-0">{icon}</span>
      <div className="min-w-0">
        <p className="text-[11px] text-muted-foreground/60">{label}</p>
        <p className={`text-sm text-foreground font-medium ${multiline ? 'line-clamp-3' : ''}`}>{value}</p>
      </div>
    </div>
  );
}
