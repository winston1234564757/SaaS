'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useRouter, usePathname } from 'next/navigation';
import { useMasterContext } from '@/lib/supabase/context';
import { createClient } from '@/lib/supabase/client';
import { Sheet } from '@/components/ui/Sheet';
import {
  createSupportTicketAction
} from '@/lib/actions/support';
import {
  MessageCircle,
  Bug,
  Lightbulb,
  MessageSquare,
  Paperclip,
  X,
  FileText,
  ChevronRight,
  ShieldCheck,
  Loader2
} from 'lucide-react';
import { parseError } from '@/lib/utils/errors';
import { useUrlActionBus } from '@/lib/actions/UrlActionBus';

type TicketType = 'feedback' | 'bug' | 'idea';

export function SupportWidget() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, profile } = useMasterContext();
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<'selection' | 'form' | 'success'>('selection');
  const [ticketType, setTicketType] = useState<TicketType>('feedback');

  // Form fields
  const [messageText, setMessageText] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  // Clean file preview url
  useEffect(() => {
    return () => {
      if (filePreview) URL.revokeObjectURL(filePreview);
    };
  }, [filePreview]);

  const handleStartChat = () => {
    const isMaster = profile?.role === 'master' || profile?.role === 'admin';
    setIsOpen(false);
    if (isMaster) {
      router.push('/dashboard/support/chat');
    } else {
      router.push('/my/support/chat');
    }
  };

  useUrlActionBus('ui:open_drawer', (payload) => {
    if (payload.drawerId === 'support') {
      if (payload.targetId === 'chat') {
        handleStartChat();
      } else {
        setIsOpen(true);
        setStep('selection');
      }
    }
  });

  // Don't render for anonymous/unauthenticated users or on active chat routes
  if (!user || pathname === '/dashboard/support/chat' || pathname === '/my/support/chat') {
    return null;
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setSubmitError('Розмір файлу не повинен перевищувати 10 МБ');
        return;
      }
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

    const { error: uploadError } = await supabase.storage
      .from('support_attachments')
      .upload(path, selectedFile, { cacheControl: '3600', upsert: true });

    if (uploadError) {
      console.error('[Support] Upload error:', uploadError.message);
      return null;
    }

    const { data } = supabase.storage
      .from('support_attachments')
      .getPublicUrl(path);

    return data?.publicUrl || null;
  };

  const handleSubmitTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim()) return;

    setSubmitting(true);
    setSubmitError(null);

    try {
      // Standard ticket flow (feedback, bug, idea)
      // Temporary ID to upload file safely
      const tempTicketId = crypto.randomUUID();
      let finalFileUrl: string | null = null;
      if (selectedFile) {
        finalFileUrl = await uploadFile(tempTicketId);
      }

      const { error } = await createSupportTicketAction(ticketType, messageText, finalFileUrl);
      if (error) throw new Error(error);

      setStep('success');
      setMessageText('');
      removeFile();
      setTimeout(() => {
        setIsOpen(false);
        setStep('selection');
      }, 3000);
    } catch (err) {
      setSubmitError(parseError(err));
    } finally {
      setSubmitting(false);
    }
  };

  const getStepTitle = () => {
    if (step === 'selection') return 'Центр підтримки BookIT';
    if (step === 'success') return 'Звернення надіслано';

    switch (ticketType) {
      case 'bug': return 'Повідомити про помилку';
      case 'idea': return 'Запропонувати ідею';
      default: return 'Надіслати відгук';
    }
  };

  const HIDE_PATHS = ['/dashboard/support/chat', '/my/support/chat'];
  if (HIDE_PATHS.some(p => pathname.startsWith(p))) return null;

  return (
    <>
      {/* Floating Action Button */}
      <motion.button
        onClick={() => {
          setIsOpen(true);
          setStep('selection');
        }}
        initial={{ opacity: 0, scale: 0.8, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        whileHover={{ scale: 1.06, y: -2 }}
        whileTap={{ scale: 0.95 }}
        transition={{ type: 'spring' as const, stiffness: 300, damping: 25 }}
        className="fixed bottom-24 right-4 lg:bottom-8 lg:right-8 z-[99] flex size-12 items-center justify-center rounded-full bg-[var(--surface)] border border-[var(--border-strong)] backdrop-blur-xl text-[var(--text-primary)] shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer relative overflow-hidden group active:scale-[0.95]"
      >
        {/* Ambient light pulse effect */}
        <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-emerald-500/5 via-[var(--accent-light)] to-emerald-500/5 opacity-60 animate-pulse pointer-events-none" />

        <div className="relative flex items-center justify-center">
          <MessageCircle className="size-6 relative z-10 text-[var(--accent)] group-hover:rotate-6 transition-transform duration-200" />
          {/* Status green dot */}
          <span className="absolute -top-0.5 -right-0.5 flex size-2 z-20">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full size-2 bg-emerald-500"></span>
          </span>
        </div>
      </motion.button>

      <Sheet
        variant="bottom"
        open={isOpen}
        onOpenChange={(v) => {
          if (!v) {
            setIsOpen(false);
            removeFile();
            setMessageText('');
            setSubmitError(null);
          }
        }}
        title={getStepTitle()}
        className="bg-[#EFF2FF] border-slate-200"
      >
        <div className="text-slate-900 flex flex-col h-full max-h-[70vh]">

          {submitError && (
            <div className="mb-4 rounded-xl bg-red-50 p-3.5 text-xs text-red-600 border border-red-100 shrink-0">
              {submitError}
            </div>
          )}

          {step === 'selection' && (
            <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
              <button type="button"
                onClick={handleStartChat}
                disabled={submitting}
                className="relative overflow-hidden flex items-center justify-between rounded-3xl border-2 border-indigo-400 bg-gradient-to-br from-indigo-50/50 to-white p-5 text-left transition hover:from-indigo-50/80 hover:to-indigo-50/30 active:scale-[0.98] group cursor-pointer shadow-md"
              >
                {/* Glow/Light effect inside */}
                <span className="absolute -top-10 -right-10 size-24 bg-indigo-400/10 rounded-full blur-xl animate-pulse" />
                <div className="flex gap-4 relative z-10">
                  <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-indigo-600 shadow-inner">
                    <MessageSquare className="size-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h3 className="font-bold text-slate-900 group-hover:text-indigo-600 transition">Чат підтримки</h3>
                      <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-[9px] font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-600/10 animate-pulse">
                        Онлайн
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1 font-medium">Швидка відповідь в реальному часі</p>
                  </div>
                </div>
                <ChevronRight className="size-5 text-indigo-500 relative z-10 group-hover:translate-x-0.5 transition-transform" />
              </button>

              <button type="button"
                onClick={() => {
                  setTicketType('bug');
                  setStep('form');
                }}
                className="flex items-center justify-between rounded-3xl border border-red-100 bg-white p-5 text-left transition hover:bg-red-50/20 hover:border-red-200 active:scale-[0.98] group cursor-pointer shadow-sm"
              >
                <div className="flex gap-4">
                  <div className="flex size-12 items-center justify-center rounded-full bg-red-50 text-red-600">
                    <Bug className="size-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 group-hover:text-red-600 transition">Звіт про помилку</h3>
                    <p className="text-xs text-slate-500 mt-1">Знайшов баг? Повідом нам</p>
                  </div>
                </div>
                <ChevronRight className="size-5 text-slate-400" />
              </button>

              <button type="button"
                onClick={() => {
                  setTicketType('idea');
                  setStep('form');
                }}
                className="flex items-center justify-between rounded-3xl border border-amber-100 bg-white p-5 text-left transition hover:bg-amber-50/20 hover:border-amber-200 active:scale-[0.98] group cursor-pointer shadow-sm"
              >
                <div className="flex gap-4">
                  <div className="flex size-12 items-center justify-center rounded-full bg-amber-50 text-amber-600">
                    <Lightbulb className="size-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 group-hover:text-amber-600 transition">Запропонувати ідею</h3>
                    <p className="text-xs text-slate-500 mt-1">Що можна покращити?</p>
                  </div>
                </div>
                <ChevronRight className="size-5 text-slate-400" />
              </button>

              <button type="button"
                onClick={() => {
                  setTicketType('feedback');
                  setStep('form');
                }}
                className="flex items-center justify-between rounded-3xl border border-slate-100 bg-white p-5 text-left transition hover:bg-slate-50 hover:border-slate-200 active:scale-[0.98] group cursor-pointer shadow-sm"
              >
                <div className="flex gap-4">
                  <div className="flex size-12 items-center justify-center rounded-full bg-slate-50 text-slate-600">
                    <FileText className="size-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 group-hover:text-slate-800 transition">Надіслати відгук</h3>
                    <p className="text-xs text-slate-500 mt-1">Поділись своїм враженням</p>
                  </div>
                </div>
                <ChevronRight className="size-5 text-slate-400" />
              </button>
            </div>
          )}

          {step === 'form' && (
            <form onSubmit={handleSubmitTicket} className="space-y-4 shrink-0">
              <div>
                <textarea
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder={
                    ticketType === 'bug'
                      ? 'Опишіть проблему детально. Що сталось і як це повторити?'
                      : ticketType === 'idea'
                      ? 'Опишіть вашу ідею. Яку функцію ви хотіли б бачити в BookIT?'
                      : 'Ваш загальний відгук або побажання щодо платформи...'
                  }
                  required
                  rows={4}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder-slate-400 outline-none focus:border-slate-400 transition resize-none"
                />
              </div>

              {/* Upload screenshot bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white border border-slate-100 p-3">
                <div className="flex items-center gap-2">
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
                    className="flex h-9 items-center gap-1.5 rounded-full bg-slate-50 px-4 text-xs font-semibold text-slate-700 border border-slate-200 transition hover:bg-slate-100 active:scale-[0.95] cursor-pointer"
                  >
                    <Paperclip className="size-3.5" />
                    Прикріпити скріншот
                  </button>
                </div>

                {filePreview && (
                  <div className="relative flex items-center gap-2 rounded-xl bg-slate-50 border border-slate-200 p-1.5 pr-8">
                    <img src={filePreview} alt="Preview" className="size-7 rounded object-cover" />
                    <span className="text-[11px] font-medium text-slate-600 truncate max-w-[120px] sm:max-w-[180px]">
                      {selectedFile?.name}
                    </span>
                    <button
                      type="button"
                      onClick={removeFile}
                      aria-label="Видалити файл"
                      className="absolute right-1 size-5 flex items-center justify-center rounded-full bg-slate-200 text-slate-600 hover:bg-slate-300 hover:text-slate-800 active:scale-[0.90] cursor-pointer"
                    >
                      <X className="size-3" />
                    </button>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setStep('selection')}
                  className="rounded-full px-5 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 active:scale-[0.95]"
                >
                  Назад
                </button>
                <button
                  type="submit"
                  disabled={submitting || !messageText.trim()}
                  className="flex items-center gap-2 rounded-full bg-slate-900 px-6 py-2.5 text-sm font-bold text-slate-50 transition hover:bg-slate-800 active:scale-[0.95] disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      Надсилання...
                    </>
                  ) : (
                    <>
                      Надіслати
                      <ChevronRight className="size-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {step === 'success' && (
            <div className="flex flex-col items-center justify-center py-12 text-center shrink-0">
              <div className="flex size-16 items-center justify-center rounded-full bg-green-50 text-green-600 mb-4 animate-bounce">
                <ShieldCheck className="size-8" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Успішно надіслано!</h3>
              <p className="text-sm text-slate-500 max-w-sm mt-2 px-4">
                Дякуємо! Твоє звернення зареєстровано в системі. Наші модератори розглянуть його найближчим часом.
              </p>
            </div>
          )}

        </div>
      </Sheet>
    </>
  );
}
