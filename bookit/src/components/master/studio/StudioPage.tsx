'use client';

import { useState, useTransition } from 'react';
import { motion } from 'framer-motion';
import { Building2, Copy, Check, UserX, LogOut, Plus, Users, Crown, Link as LinkIcon, AlertCircle } from 'lucide-react';
import { createStudio, leaveStudio, removeMember } from '@/app/(master)/dashboard/studio/actions';
import { pluralize } from '@/lib/utils/dates';
import Link from 'next/link';

interface Member {
  masterId: string;
  role: 'owner' | 'member';
  joinedAt: string;
  fullName: string;
  slug: string;
  avatarEmoji: string;
  bookingsThisMonth: number;
}

interface StudioData {
  id: string;
  name: string;
  inviteToken: string;
  ownerId: string;
}

interface Props {
  currentUserId: string;
  subscriptionTier: string;
  studio: StudioData | null;
  members: Member[];
}

export function StudioPage({ currentUserId, subscriptionTier, studio, members }: Props) {
  const isStudioTier = subscriptionTier === 'studio';
  const isOwner = studio?.ownerId === currentUserId;

  return (
    <div className="flex flex-col gap-4 pb-8">
      <div className="bento-card p-5">
        <h1 className="heading-serif text-xl text-[#2C1A14] mb-0.5">Студія</h1>
        <p className="text-sm text-[#A8928D]">Управління командою майстрів</p>
      </div>

      {!isStudioTier && !studio ? (
        <NoStudioAccess />
      ) : !studio ? (
        <CreateStudioForm />
      ) : isOwner ? (
        <OwnerView studio={studio} members={members} currentUserId={currentUserId} />
      ) : (
        <MemberView studio={studio} members={members} currentUserId={currentUserId} />
      )}
    </div>
  );
}

// ── No access ─────────────────────────────────────────────────────────────────
function NoStudioAccess() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 280, damping: 24 }}
      className="bento-card p-8 flex flex-col items-center gap-4 text-center"
    >
      <div className="w-16 h-16 rounded-3xl bg-[#5C9E7A]/12 flex items-center justify-center">
        <Building2 size={28} className="text-[#5C9E7A]" />
      </div>
      <div>
        <p className="text-base font-semibold text-[#2C1A14] mb-1">Studio тариф</p>
        <p className="text-sm text-[#A8928D] max-w-xs leading-relaxed">
          Створюй команду майстрів, переглядай зведену аналітику і керуй студією з одного кабінету
        </p>
      </div>
      <div className="flex flex-col gap-2 text-left w-full max-w-xs">
        {[
          'Необмежені майстри у команді',
          'Зведена аналітика по студії',
          'Кожен майстер зберігає свій кабінет',
          '199 ₴/майстер на місяць',
        ].map(f => (
          <div key={f} className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-[#5C9E7A] flex-shrink-0" />
            <span className="text-xs text-[#6B5750]">{f}</span>
          </div>
        ))}
      </div>
      <Link
        href="/dashboard/billing"
        className="w-full max-w-xs py-3 rounded-2xl bg-[#5C9E7A] text-white text-sm font-semibold text-center block"
        style={{ boxShadow: '0 4px 16px rgba(92,158,122,0.35)' }}
      >
        Перейти на Studio — 199 ₴/майстер
      </Link>
    </motion.div>
  );
}

// ── Create studio ─────────────────────────────────────────────────────────────
function CreateStudioForm() {
  const [name, setName] = useState('');
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleCreate = () => {
    if (!name.trim()) return;
    setError(null);
    startTransition(async () => {
      const result = await createStudio(name);
      if (result.error) setError(result.error);
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 280, damping: 24 }}
      className="bento-card p-6 flex flex-col gap-4"
    >
      <div className="flex items-center gap-3 mb-1">
        <div className="w-11 h-11 rounded-2xl bg-[#5C9E7A]/12 flex items-center justify-center">
          <Plus size={20} className="text-[#5C9E7A]" />
        </div>
        <div>
          <p className="text-sm font-semibold text-[#2C1A14]">Створити студію</p>
          <p className="text-xs text-[#A8928D]">Потім запросіть колег за посиланням</p>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-[#C05B5B]/10 border border-[#C05B5B]/20">
          <AlertCircle size={14} className="text-[#C05B5B] shrink-0" />
          <p className="text-xs text-[#C05B5B]">{error}</p>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-[#2C1A14] mb-1.5">Назва студії</label>
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Наприклад: Beauty Studio by Anna"
          className="w-full px-4 py-3 rounded-xl border border-white/80 bg-white/70 text-sm text-[#2C1A14] placeholder:text-[#A8928D] focus:outline-none focus:border-[#789A99] focus:ring-2 focus:ring-[#789A99]/20 transition-all"
          maxLength={60}
        />
      </div>
      <button
        onClick={handleCreate}
        disabled={!name.trim() || isPending}
        className="w-full py-3 rounded-2xl bg-[#5C9E7A] text-white text-sm font-semibold disabled:opacity-50 transition-all"
        style={{ boxShadow: '0 4px 16px rgba(92,158,122,0.3)' }}
      >
        {isPending ? 'Створюємо...' : 'Створити студію →'}
      </button>
    </motion.div>
  );
}

// ── Owner view ────────────────────────────────────────────────────────────────
function OwnerView({ studio, members, currentUserId }: { studio: StudioData; members: Member[]; currentUserId: string }) {
  const [copied, setCopied] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const inviteLink = `${typeof window !== 'undefined' ? window.location.origin : 'https://bookit.com.ua'}/studio/join?token=${studio.inviteToken}`;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRemove = (masterId: string) => {
    setRemovingId(masterId);
    startTransition(async () => {
      await removeMember(masterId);
      setRemovingId(null);
    });
  };

  const totalBookings = members.reduce((s, m) => s + m.bookingsThisMonth, 0);

  return (
    <div className="flex flex-col gap-4">
      {/* Studio header */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05, type: 'spring', stiffness: 280, damping: 24 }}
        className="bento-card p-5"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-[#5C9E7A]/12 flex items-center justify-center">
            <Building2 size={22} className="text-[#5C9E7A]" />
          </div>
          <div>
            <p className="text-base font-bold text-[#2C1A14]">{studio.name}</p>
            <p className="text-xs text-[#A8928D]">{pluralize(members.length, ['майстер', 'майстри', 'майстрів'])}</p>
          </div>
          <span className="ml-auto text-[10px] font-bold text-[#5C9E7A] bg-[#5C9E7A]/12 px-2.5 py-1 rounded-full">Studio</span>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-2xl bg-white/50 text-center">
            <p className="text-xl font-bold text-[#2C1A14]">{members.length}</p>
            <p className="text-xs text-[#A8928D]">Майстрів</p>
          </div>
          <div className="p-3 rounded-2xl bg-white/50 text-center">
            <p className="text-xl font-bold text-[#2C1A14]">{totalBookings}</p>
            <p className="text-xs text-[#A8928D]">Записів цього місяця</p>
          </div>
        </div>
      </motion.div>

      {/* Invite link */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, type: 'spring', stiffness: 280, damping: 24 }}
        className="bento-card p-5"
      >
        <p className="text-xs font-semibold text-[#6B5750] uppercase tracking-wide mb-3">Запросити майстра</p>
        <div className="flex items-center rounded-2xl border border-white/80 bg-white/60 overflow-hidden mb-3">
          <LinkIcon size={13} className="ml-3 text-[#A8928D] flex-shrink-0" />
          <p className="flex-1 px-3 py-3 text-xs text-[#6B5750] truncate">/studio/join?token=<span className="font-mono font-semibold text-[#789A99]">{studio.inviteToken}</span></p>
          <button
            onClick={handleCopy}
            className="px-4 py-3 text-[#789A99] hover:bg-[#789A99]/10 transition-colors border-l border-white/80 flex-shrink-0"
          >
            {copied ? <Check size={14} className="text-[#5C9E7A]" /> : <Copy size={14} />}
          </button>
        </div>
        <button
          onClick={handleCopy}
          className="w-full py-3 rounded-2xl bg-[#789A99]/10 text-[#789A99] text-sm font-semibold hover:bg-[#789A99]/20 transition-colors flex items-center justify-center gap-2"
        >
          {copied ? <Check size={15} /> : <Copy size={15} />}
          {copied ? 'Скопійовано!' : 'Копіювати посилання'}
        </button>
      </motion.div>

      {/* Members list */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, type: 'spring', stiffness: 280, damping: 24 }}
        className="bento-card overflow-hidden"
      >
        <div className="flex items-center gap-2 px-5 py-4 border-b border-[#F5E8E3]/60">
          <Users size={15} className="text-[#789A99]" />
          <p className="text-xs font-semibold text-[#6B5750] uppercase tracking-wide">Команда</p>
        </div>
        <div className="flex flex-col divide-y divide-[#F5E8E3]/60">
          {members.map(m => (
            <div key={m.masterId} className="flex items-center gap-3 px-5 py-4">
              <div
                className="w-10 h-10 rounded-2xl flex items-center justify-center text-lg flex-shrink-0"
                style={{ background: 'rgba(255,210,194,0.5)' }}
              >
                {m.avatarEmoji}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="text-sm font-semibold text-[#2C1A14] truncate">{m.fullName}</p>
                  {m.role === 'owner' && <Crown size={11} className="text-[#D4935A] flex-shrink-0" />}
                </div>
                <p className="text-xs text-[#A8928D]">{m.bookingsThisMonth} записів цього місяця</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <Link
                  href={`/${m.slug}`}
                  target="_blank"
                  className="text-xs text-[#789A99] font-medium hover:underline"
                >
                  Профіль
                </Link>
                {m.masterId !== currentUserId && (
                  <button
                    onClick={() => handleRemove(m.masterId)}
                    disabled={isPending && removingId === m.masterId}
                    className="p-1.5 rounded-xl text-[#A8928D] hover:text-[#C05B5B] hover:bg-[#C05B5B]/10 transition-colors"
                    title="Видалити з команди"
                  >
                    <UserX size={14} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

// ── Member view ───────────────────────────────────────────────────────────────
function MemberView({ studio, members, currentUserId }: { studio: StudioData; members: Member[]; currentUserId: string }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [confirm, setConfirm] = useState(false);

  const handleLeave = () => {
    setError(null);
    startTransition(async () => {
      const result = await leaveStudio();
      if (result.error) setError(result.error);
    });
  };

  return (
    <div className="flex flex-col gap-4">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 280, damping: 24 }}
        className="bento-card p-5"
      >
        <div className="flex items-center gap-3 mb-3">
          <div className="w-11 h-11 rounded-2xl bg-[#5C9E7A]/12 flex items-center justify-center">
            <Building2 size={20} className="text-[#5C9E7A]" />
          </div>
          <div>
            <p className="text-sm font-semibold text-[#2C1A14]">{studio.name}</p>
            <p className="text-xs text-[#A8928D]">Ви учасник Studio</p>
          </div>
        </div>
        <p className="text-xs text-[#6B5750]">
          {members.length} майстрів у команді · Pro функції активні
        </p>
      </motion.div>

      {/* Team */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08, type: 'spring', stiffness: 280, damping: 24 }}
        className="bento-card overflow-hidden"
      >
        <div className="px-5 py-4 border-b border-[#F5E8E3]/60">
          <p className="text-xs font-semibold text-[#6B5750] uppercase tracking-wide">Команда</p>
        </div>
        <div className="flex flex-col divide-y divide-[#F5E8E3]/60">
          {members.map(m => (
            <div key={m.masterId} className="flex items-center gap-3 px-5 py-3">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center text-base flex-shrink-0"
                style={{ background: 'rgba(255,210,194,0.5)' }}
              >
                {m.avatarEmoji}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="text-sm font-medium text-[#2C1A14] truncate">{m.fullName}</p>
                  {m.role === 'owner' && <Crown size={10} className="text-[#D4935A] flex-shrink-0" />}
                </div>
              </div>
              <Link
                href={`/${m.slug}`}
                target="_blank"
                className="text-xs text-[#789A99] font-medium hover:underline flex-shrink-0"
              >
                Профіль
              </Link>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Leave */}
      {error && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-[#C05B5B]/10 border border-[#C05B5B]/20">
          <AlertCircle size={14} className="text-[#C05B5B] shrink-0" />
          <p className="text-xs text-[#C05B5B]">{error}</p>
        </div>
      )}
      {!confirm ? (
        <button
          onClick={() => setConfirm(true)}
          className="flex items-center justify-center gap-2 py-3 rounded-2xl border border-[#C05B5B]/30 text-[#C05B5B] text-sm font-medium hover:bg-[#C05B5B]/8 transition-colors"
        >
          <LogOut size={14} />
          Покинути студію
        </button>
      ) : (
        <div className="bento-card p-4 flex flex-col gap-3">
          <p className="text-sm text-[#2C1A14] font-medium text-center">Покинути студію «{studio.name}»?</p>
          <p className="text-xs text-[#A8928D] text-center">Тариф повернеться до Starter</p>
          <div className="flex gap-2">
            <button onClick={() => setConfirm(false)} className="flex-1 py-2.5 rounded-xl bg-white/70 border border-white/80 text-sm text-[#6B5750] font-medium">
              Скасувати
            </button>
            <button
              onClick={handleLeave}
              disabled={isPending}
              className="flex-1 py-2.5 rounded-xl bg-[#C05B5B] text-white text-sm font-semibold disabled:opacity-60"
            >
              {isPending ? 'Виходимо...' : 'Так, покинути'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
