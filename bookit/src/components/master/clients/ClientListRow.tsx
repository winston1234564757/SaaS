'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, PenLine, MessageSquare, Phone } from 'lucide-react';
import { formatPrice } from '@/components/master/services/types';
import { saveClientNote } from '@/app/(master)/dashboard/clients/actions';
import { useClientNoteInvalidate } from '@/lib/supabase/hooks/useClientNote';
import { useToast } from '@/lib/toast/context';
import { parseError } from '@/lib/utils/errors';
import { useRouter } from 'next/navigation';
import type { ClientRow } from '@/lib/supabase/hooks/useClients';
import { RETENTION_CONFIG } from './clientsUtils';

interface ClientListRowProps {
  client: ClientRow;
  onOpen: (client: ClientRow) => void;
  onBooking: (client: ClientRow) => void;
}

export const ClientListRow = React.memo(function ClientListRow({
  client,
  onOpen,
  onBooking,
}: ClientListRowProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const invalidateNote = useClientNoteInvalidate();

  const [editing, setEditing] = useState(false);
  const [noteValue, setNoteValue] = useState('');
  const [saving, setSaving] = useState(false);

  const ret = RETENTION_CONFIG[client.retention_status];

  async function handleSave() {
    if (!noteValue.trim()) { setEditing(false); return; }
    setSaving(true);
    const { error } = await saveClientNote(client.client_phone, noteValue);
    if (error) {
      showToast({ type: 'error', title: 'Помилка', message: parseError(error) });
    } else {
      showToast({ type: 'success', title: 'Нотатку збережено' });
      invalidateNote(client.client_phone);
      setEditing(false);
      setNoteValue('');
    }
    setSaving(false);
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.15 }}
      className="bento-card p-4 hover:shadow-md transition-shadow relative group"
      style={{ border: `1px solid ${ret.color}`, background: `${ret.color}08` }}
    >
      {/* Main info row — opens detail sheet */}
      <button
        type="button"
        onClick={() => onOpen(client)}
        className="w-full text-left flex items-center gap-3"
      >
        <div className="relative flex-shrink-0">
          <div
            className="size-11 rounded-xl flex items-center justify-center text-lg font-bold relative z-10"
            style={{
              background: client.is_vip ? 'var(--warning-bg)' : 'var(--surface-strong)',
              color: client.is_vip ? 'var(--warning)' : 'var(--text-primary)',
              boxShadow: '0 0 0 2px var(--background)',
            }}
          >
            {client.client_name[0]?.toUpperCase() ?? '?'}
          </div>
          <div
            className="absolute -inset-1 rounded-lg opacity-40 z-0"
            style={{ border: `2px solid ${ret.color}` }}
          />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-bold text-foreground truncate">{client.client_name}</p>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <span
                className="inline-flex items-center gap-1 text-[8px] font-bold px-2 py-0.5 rounded-full uppercase tracking-tighter"
                style={{ color: ret.color, background: ret.bg }}
              >
                {ret.label}
              </span>
              {client.is_vip && (
                <span className="text-[8px] font-bold text-warning border border-warning/30 px-1.5 py-0.5 rounded-lg uppercase">
                  VIP
                </span>
              )}
            </div>
          </div>
          {client.last_visit_at && (
            <span className="text-[10px] text-muted-foreground/60 font-medium mt-1 block">
              Останній візит:{' '}
              {new Date(client.last_visit_at).toLocaleDateString('uk-UA', { day: 'numeric', month: 'short' })}
              {client.last_service_name && (
                <span className="opacity-40 ml-1.5">· {client.last_service_name}</span>
              )}
            </span>
          )}
        </div>

        {/* Revenue — hidden on hover (desktop) */}
        {!editing && (
          <div className="text-right flex-shrink-0 flex flex-col items-end gap-1 sm:group-hover:hidden">
            <p className="text-sm font-bold text-foreground">{formatPrice(client.total_spent)}</p>
            <div className="flex items-center gap-1">
              <Calendar size={10} className="text-muted-foreground/60" />
              <span className="text-[11px] text-muted-foreground/60">{client.total_visits}</span>
            </div>
          </div>
        )}
      </button>

      {/* Desktop action buttons — absolute right, visible on group-hover */}
      {!editing && (
        <div className="hidden sm:flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity absolute right-4 top-1/2 -translate-y-1/2 z-10">
          <button
            type="button"
            onClick={() => { setEditing(true); setNoteValue(''); }}
            className="p-2 rounded-lg bg-secondary/40 text-muted-foreground hover:bg-secondary hover:text-foreground transition-all active:scale-[0.88]"
            aria-label="Швидка нотатка"
          >
            <PenLine size={14} />
          </button>
          <button
            type="button"
            onClick={() => router.push(`/dashboard/marketing?phone=${client.client_phone}`)}
            className="p-2 rounded-lg bg-secondary/40 text-muted-foreground hover:bg-secondary hover:text-foreground transition-all active:scale-[0.88]"
            aria-label="Розсилка"
          >
            <MessageSquare size={14} />
          </button>
          <button
            type="button"
            onClick={() => { window.location.href = `tel:${client.client_phone}`; }}
            className="p-2 rounded-lg bg-secondary/40 text-muted-foreground hover:bg-secondary hover:text-foreground transition-all active:scale-[0.88]"
            aria-label="Подзвонити"
          >
            <Phone size={14} />
          </button>
          <button
            type="button"
            onClick={() => onBooking(client)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[var(--btn-primary-bg)] text-[var(--accent-on)] text-[10px] font-bold transition-all active:scale-[0.88] ml-1"
          >
            <Calendar size={12} />
            Записати
          </button>
        </div>
      )}

      {/* Inline note editor */}
      {editing && (
        <div className="mt-3 p-3 rounded-xl bg-secondary/40 border border-secondary/40 flex flex-col gap-2">
          <textarea
            autoFocus
            value={noteValue}
            onChange={(e) => setNoteValue(e.target.value)}
            placeholder="Текст нотатки..."
            className="w-full p-2.5 text-xs rounded-xl bg-secondary/60 border border-secondary focus:border-primary outline-none min-h-[70px] resize-none"
            style={{ borderRadius: '12px' }}
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="flex-1 py-2 rounded-lg bg-[var(--btn-primary-bg)] text-[var(--accent-on)] text-[11px] font-bold active:scale-[0.88] transition-all"
            >
              {saving ? 'Збереження...' : 'Зберегти'}
            </button>
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="px-4 py-2 rounded-lg bg-secondary/40 text-muted-foreground text-[11px] active:scale-[0.88] transition-all"
            >
              Скасувати
            </button>
          </div>
        </div>
      )}

      {/* Mobile action bar */}
      <div className="flex sm:hidden items-center justify-between gap-1 mt-3 pt-3 border-t border-secondary/40">
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => { setEditing(true); setNoteValue(''); }}
            className="min-h-[44px] px-3 rounded-lg bg-secondary/40 text-muted-foreground active:scale-[0.88] transition-all flex items-center justify-center"
            aria-label="Швидка нотатка"
          >
            <PenLine size={14} />
          </button>
          <button
            type="button"
            onClick={() => router.push(`/dashboard/marketing?phone=${client.client_phone}`)}
            className="min-h-[44px] px-3 rounded-lg bg-secondary/40 text-muted-foreground active:scale-[0.88] transition-all flex items-center justify-center"
            aria-label="Розсилка"
          >
            <MessageSquare size={14} />
          </button>
          <button
            type="button"
            onClick={() => { window.location.href = `tel:${client.client_phone}`; }}
            className="min-h-[44px] px-3 rounded-lg bg-secondary/40 text-muted-foreground active:scale-[0.88] transition-all flex items-center justify-center"
            aria-label="Подзвонити"
          >
            <Phone size={14} />
          </button>
        </div>
        <button
          type="button"
          onClick={() => onBooking(client)}
          className="flex items-center gap-1.5 px-3 min-h-[44px] rounded-xl bg-[var(--btn-primary-bg)] text-[var(--accent-on)] text-[10px] font-bold active:scale-[0.88] transition-all"
        >
          <Calendar size={12} />
          Записати
        </button>
      </div>
    </motion.div>
  );
});
