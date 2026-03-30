import { useState, useTransition } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Check, Loader2, CalendarDays, Mail, ArrowLeft, LogOut, Send, Gift, Copy, Share2 } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { PushSubscribeCard } from '@/components/shared/PushSubscribeCard';
// We still import this logic if it was ported, or we inline it. Let's assume getOrCreateReferralLink is in lib/actions/referrals
import { getOrCreateReferralLink } from '@/lib/actions/referrals';
import { useQueryClient } from '@tanstack/react-query';

interface Props {
  profile: {
    fullName: string;
    phone: string;
    email: string;
    memberSince: string;
    telegramChatId: string | null;
    userId: string;
    lastMasterId: string | null;
  };
}

const inputCls = 'w-full px-4 py-3 rounded-2xl bg-white/70 border border-white/80 text-sm text-[#2C1A14] placeholder-[#A8928D] outline-none focus:bg-white focus:border-[#789A99] focus:ring-2 focus:ring-[#789A99]/20 transition-all';

async function updateClientProfile(name: string, phone: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');
  
  await supabase
    .from('profiles')
    .update({
      full_name: name.trim(),
      phone: phone.trim() || null,
    })
    .eq('id', user.id);
}

async function disconnectClientTelegram() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  await supabase
    .from('profiles')
    .update({ telegram_chat_id: null })
    .eq('id', user.id);
}

export function MyProfilePage({ profile }: Props) {

  const queryClient = useQueryClient();
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [c2cLink, setC2cLink] = useState<string | null>(null);
  const [c2cCopied, setC2cCopied] = useState(false);
  const [c2cLoading, setC2cLoading] = useState(false);

  const [fullName, setFullName] = useState(profile.fullName);
  const [phone, setPhone] = useState(profile.phone);

  const memberSinceFormatted = profile.memberSince
    ? new Date(profile.memberSince).toLocaleDateString('uk-UA', {
        day: 'numeric', month: 'long', year: 'numeric',
      })
    : '';

  function handleSave() {
    startTransition(async () => {
      await updateClientProfile(fullName, phone);
      setSaved(true);
      queryClient.invalidateQueries({ queryKey: ['client-profile'] });
      setTimeout(() => setSaved(false), 2500);
    });
  }

  async function handleDisconnectTelegram() {
    setDisconnecting(true);
    try {
      await disconnectClientTelegram();
      queryClient.invalidateQueries({ queryKey: ['client-profile'] });
    } finally {
      setDisconnecting(false);
    }
  }

  const botName = import.meta.env.VITE_TELEGRAM_BOT_NAME;

  async function handleGenerateC2C() {
    if (!profile.lastMasterId) return;
    setC2cLoading(true);
    const result = await getOrCreateReferralLink(
      profile.userId, 'client', 'C2C', profile.lastMasterId,
    );
    setC2cLoading(false);
    if (result.success) setC2cLink(result.link);
  }

  async function handleCopyC2C() {
    if (!c2cLink) return;
    await navigator.clipboard.writeText(c2cLink);
    setC2cCopied(true);
    setTimeout(() => setC2cCopied(false), 2000);
  }

  async function handleShareC2C() {
    if (!c2cLink) return;
    if (navigator.share) {
      await navigator.share({
        title: 'Запис до майстра — Bookit',
        text: 'Поділіться своїм майстром з подругою! Вона отримає знижку 10%, а ви — бонус на наступний візит 🎁',
        url: c2cLink,
      });
    } else {
      handleCopyC2C();
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          to="/my/bookings"
          className="w-9 h-9 rounded-2xl bg-white/70 border border-white/80 flex items-center justify-center text-[#6B5750] hover:bg-white transition-colors flex-shrink-0"
        >
          <ArrowLeft size={16} />
        </Link>
        <div className="bento-card p-4 flex-1">
          <h1 className="heading-serif text-xl text-[#2C1A14] leading-none">Мій профіль</h1>
        </div>
      </div>

      {/* Avatar + meta */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 24 }}
        className="bento-card p-5 flex items-center gap-4"
      >
        <div
          className="w-16 h-16 rounded-3xl flex items-center justify-center text-3xl flex-shrink-0"
          style={{ background: 'rgba(255, 210, 194, 0.55)' }}
        >
          {fullName ? fullName.charAt(0).toUpperCase() : '👤'}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-base font-semibold text-[#2C1A14] truncate">
            {fullName || 'Ваше ім\'я'}
          </p>
          <div className="flex items-center gap-1 mt-1">
            <Mail size={11} className="text-[#A8928D]" />
            <span className="text-xs text-[#A8928D] truncate">{profile.email}</span>
          </div>
          {memberSinceFormatted && (
            <div className="flex items-center gap-1 mt-0.5">
              <CalendarDays size={11} className="text-[#A8928D]" />
              <span className="text-xs text-[#A8928D]">З {memberSinceFormatted}</span>
            </div>
          )}
        </div>
      </motion.div>

      {/* Особисті дані */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08, type: 'spring', stiffness: 300, damping: 24 }}
        className="bento-card p-5"
      >
        <p className="text-sm font-semibold text-[#2C1A14] mb-4">Особисті дані</p>

        <div className="flex flex-col gap-3">
          <div>
            <label className="text-xs font-medium text-[#6B5750] mb-1.5 block">{"Ім'я та прізвище"}</label>
            <input
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              placeholder="Ваше повне ім'я"
              className={inputCls}
            />
          </div>

          <div>
            <label className="text-xs font-medium text-[#6B5750] mb-1.5 block">Телефон</label>
            <input
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="+38 (050) 000-00-00"
              type="tel"
              className={inputCls}
            />
          </div>

          <div>
            <label className="text-xs font-medium text-[#6B5750] mb-1.5 block">Email</label>
            <input
              value={profile.email}
              disabled
              className={`${inputCls} opacity-50 cursor-not-allowed`}
            />
            <p className="text-[11px] text-[#A8928D] mt-1">Email змінити неможливо</p>
          </div>
        </div>
      </motion.div>

      {/* Telegram */}
      {botName && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12, type: 'spring', stiffness: 300, damping: 24 }}
          className="bento-card p-5"
        >
          <p className="text-sm font-semibold text-[#2C1A14] mb-4">Сповіщення в Telegram</p>
          {profile.telegramChatId ? (
            <div className="flex items-center gap-3 px-3 py-2.5 rounded-2xl bg-[#5C9E7A]/8 border border-[#5C9E7A]/20">
              <span className="text-xs text-[#5C9E7A] font-medium flex-1">Підключено</span>
              <button
                onClick={handleDisconnectTelegram}
                disabled={disconnecting}
                className="text-[11px] text-[#C05B5B] hover:underline disabled:opacity-50"
              >
                {disconnecting ? 'Відключення...' : 'Відключити'}
              </button>
            </div>
          ) : (
            <a
              href={`https://t.me/${botName}?start=${profile.userId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-2.5 rounded-2xl bg-[#229ED9] text-white text-sm font-semibold hover:bg-[#1a85c4] transition-colors"
            >
              <Send size={14} /> Підключити бота
            </a>
          )}
          <p className="text-[11px] text-[#A8928D] mt-2">
            Отримуйте сповіщення про ваші записи прямо в Telegram
          </p>
        </motion.div>
      )}

      {/* C2C: Подаруй подрузі знижку */}
      {profile.lastMasterId && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.14, type: 'spring', stiffness: 300, damping: 24 }}
          className="bento-card p-5"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-2xl bg-[#D4935A]/12 flex items-center justify-center flex-shrink-0">
              <Gift size={18} className="text-[#D4935A]" />
            </div>
            <div>
              <p className="text-sm font-semibold text-[#2C1A14]">Подаруй подрузі знижку</p>
              <p className="text-xs text-[#A8928D]">Вона отримає знижку 10%, а ти — бонус на наступний візит</p>
            </div>
          </div>

          {!c2cLink ? (
            <button
              onClick={handleGenerateC2C}
              disabled={c2cLoading}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-[#D4935A] text-white text-sm font-semibold hover:bg-[#c07d45] transition-colors disabled:opacity-60"
            >
              {c2cLoading ? <Loader2 size={15} className="animate-spin" /> : <Gift size={15} />}
              {c2cLoading ? 'Генеруємо...' : 'Отримати посилання'}
            </button>
          ) : (
            <div className="flex flex-col gap-2">
              <div className="flex items-center rounded-2xl border border-white/80 bg-white/60 overflow-hidden">
                <input
                  readOnly
                  value={c2cLink}
                  className="flex-1 px-4 py-3 text-xs text-[#2C1A14] bg-transparent outline-none truncate"
                />
                <button
                  onClick={handleCopyC2C}
                  className="px-4 py-3 text-[#789A99] hover:bg-[#789A99]/10 transition-colors border-l border-white/80 flex-shrink-0"
                >
                  {c2cCopied ? <Check size={15} className="text-[#5C9E7A]" /> : <Copy size={15} />}
                </button>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleCopyC2C}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-2xl bg-[#789A99]/10 text-[#789A99] text-sm font-semibold hover:bg-[#789A99]/20 transition-colors"
                >
                  {c2cCopied ? <Check size={14} /> : <Copy size={14} />}
                  {c2cCopied ? 'Скопійовано!' : 'Копіювати'}
                </button>
                <button
                  onClick={handleShareC2C}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-2xl bg-[#D4935A] text-white text-sm font-semibold hover:bg-[#c07d45] transition-colors"
                >
                  <Share2 size={14} />
                  Поділитись
                </button>
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* Push notifications */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.16, type: 'spring', stiffness: 300, damping: 24 }}
      >
        <PushSubscribeCard />
      </motion.div>

      {/* Save */}
      <motion.button
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.14, type: 'spring', stiffness: 300, damping: 24 }}
        onClick={handleSave}
        disabled={isPending || !fullName.trim()}
        className={`w-full py-4 rounded-2xl font-semibold text-sm flex items-center justify-center gap-2 transition-all ${
          saved
            ? 'bg-[#5C9E7A] text-white'
            : 'bg-[#789A99] text-white hover:bg-[#6B8C8B] active:scale-[0.98]'
        } disabled:opacity-60`}
      >
        {isPending ? (
          <><Loader2 size={16} className="animate-spin" /> Збереження...</>
        ) : saved ? (
          <><Check size={16} /> Збережено</>
        ) : (
          'Зберегти зміни'
        )}
      </motion.button>

      {/* Navigation */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="bento-card p-4"
      >
        <p className="text-xs font-semibold text-[#6B5750] mb-2.5">Мої записи</p>
        <Link
          to="/my/bookings"
          className="flex items-center justify-between py-2 px-3 rounded-xl hover:bg-white/60 transition-colors"
        >
          <span className="text-sm text-[#2C1A14]">Переглянути всі записи</span>
          <span className="text-[#789A99] text-sm">→</span>
        </Link>
      </motion.div>

      {/* Вийти */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.25 }}
        onClick={async () => {
          await supabase.auth.signOut();
          document.cookie = 'user_role=; path=/; max-age=0';
          window.location.href = '/login';
        }}
        className="w-full py-3.5 rounded-2xl text-sm font-medium text-[#C05B5B] bg-[#C05B5B]/8 hover:bg-[#C05B5B]/15 border border-[#C05B5B]/20 transition-colors flex items-center justify-center gap-2"
      >
        <LogOut size={15} />
        Вийти з акаунту
      </motion.button>
    </div>
  );
}
