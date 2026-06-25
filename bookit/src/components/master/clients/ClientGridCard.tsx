'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, PenLine, Phone, Sparkles, Zap } from 'lucide-react';
import { formatPrice } from '@/components/master/services/types';
import { saveClientNote } from '@/app/(master)/dashboard/clients/actions';
import { useClientNoteInvalidate } from '@/lib/supabase/hooks/useClientNote';
import { useToast } from '@/lib/toast/context';
import { parseError } from '@/lib/utils/errors';
import type { ClientRow } from '@/lib/supabase/hooks/useClients';
import {
  RETENTION_CONFIG,
  ClientIconStack,
  formatClientName,
  type SmartSegment,
} from './clientsUtils';

const CARD_SPRING = { type: 'spring' as const, stiffness: 300, damping: 30 } as const;

interface ClientGridCardProps {
  client: ClientRow;
  smartSegment: SmartSegment | 'none';
  onOpen: (client: ClientRow) => void;
  onBooking: (client: ClientRow) => void;
  onSmartAction: (client: ClientRow) => void;
}

export const ClientGridCard = React.memo(function ClientGridCard({
  client,
  smartSegment,
  onOpen,
  onBooking,
  onSmartAction,
}: ClientGridCardProps) {
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
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={CARD_SPRING}
      className="bento-card p-4 hover:shadow-md transition-shadow flex flex-col gap-3 relative h-full"
      style={{ border: `1px solid ${ret.color}`, background: `${ret.color}08` }}
    >
      <ClientIconStack client={client} />

      {/* Info section — button opens detail sheet */}
      <button
        type="button"
        onClick={() => onOpen(client)}
        className="w-full text-left flex flex-col flex-1 cursor-pointer"
      >
        {/* Name + status */}
        <div className="mb-4">
          <p className="font-display text-lg font-bold text-foreground leading-tight tracking-tight max-w-[70%] min-h-[2.8rem]">
            {formatClientName(client.client_name)}
          </p>
          <div className="flex items-center flex-wrap gap-1.5 mt-2 max-w-[70%]">
            <span
              className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-1 rounded-full"
              style={{ color: ret.color, background: ret.bg }}
            >
              {ret.label}
            </span>
            {client.is_vip && (
              <span className="text-[11px] font-bold text-warning border border-[var(--accent-on)]/30 px-1.5 py-1 rounded-lg flex-shrink-0">
                VIP
              </span>
            )}
          </div>
        </div>

        {/* Avatar + last visit */}
        <div className="flex items-center gap-3 mb-4">
          <div className="relative">
            <div
              className="size-12 rounded-xl flex items-center justify-center text-lg flex-shrink-0 font-bold relative z-10"
              style={{
                background: client.is_vip ? 'var(--warning-bg)' : 'var(--surface-strong)',
                color: client.is_vip ? 'var(--warning)' : 'var(--text-primary)',
                boxShadow: '0 0 0 2px var(--background)',
              }}
            >
              {client.client_name[0]?.toUpperCase() ?? '?'}
            </div>
            <div
              className="absolute -inset-1 rounded-xl opacity-60 z-0"
              style={{ border: `2.5px solid ${ret.color}` }}
            />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] text-muted-foreground/40 font-bold uppercase tracking-wider">
              Останній візит
            </p>
            <div className="flex flex-col mt-0.5">
              <p className="text-sm text-foreground/90 font-display italic tracking-tight truncate leading-tight">
                {client.last_service_name || 'Остання послуга'}
              </p>
              <p className="text-[10px] text-muted-foreground/50 mt-1 uppercase tracking-tighter">
                {client.last_visit_at
                  ? new Date(client.last_visit_at).toLocaleDateString('uk-UA', {
                      day: 'numeric',
                      month: 'short',
                    })
                  : 'Перший візит'}
              </p>
            </div>
          </div>
        </div>

        {/* Smart Follow-up alert */}
        {client.retention_status === 'at_risk' && (
          <div className="mb-3 px-2 py-1 rounded-lg bg-primary/5 border border-primary/10 flex items-center gap-1.5">
            <Zap size={10} className="text-primary" />
            <p className="text-[10px] font-bold text-primary/80 uppercase tracking-tighter">
              Пора нагадати про себе
            </p>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 gap-2 pt-2 mt-auto border-t border-secondary/60">
          <div>
            <p className="text-[10px] text-muted-foreground/40 font-bold uppercase tracking-tighter">Візитів</p>
            <p className="text-xl font-bold text-primary leading-none mt-1">{client.total_visits}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-muted-foreground/40 font-bold uppercase tracking-tighter">Витрачено</p>
            <p className="text-xl font-bold text-foreground leading-none mt-1">
              {formatPrice(client.total_spent).replace('₴', '')}
              <span className="text-xs font-normal text-muted-foreground/40 ml-0.5">₴</span>
            </p>
          </div>
        </div>
      </button>

      {/* Grid Action Bar */}
      <div className="flex flex-col gap-3 pt-4 border-t border-secondary/40">
        {editing ? (
          <div className="flex flex-col gap-2">
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
                className="flex-1 py-2 rounded-lg bg-[var(--btn-primary-bg)] text-[var(--accent-on)] text-[10px] font-bold active:scale-[0.88] transition-colors duration-150 cursor-pointer"
              >
                {saving ? 'Збереження...' : 'Зберегти'}
              </button>
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="px-3 py-2 rounded-lg bg-secondary/40 text-muted-foreground text-[10px] active:scale-[0.88] transition-colors duration-150 cursor-pointer"
              >
                Скасувати
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <div className="flex justify-center gap-4">
              <button
                type="button"
                onClick={() => { setEditing(true); setNoteValue(''); }}
                className="size-11 rounded-full bg-secondary/60 border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary shadow-sm transition-colors duration-150 cursor-pointer active:scale-[0.88]"
                aria-label="Швидка нотатка"
              >
                <PenLine size={16} />
              </button>
              <button
                type="button"
                onClick={() => onSmartAction(client)}
                className="size-11 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-sm transition-colors duration-150 cursor-pointer active:scale-[0.88] hover:bg-primary hover:text-white"
                aria-label="Smart-дія"
              >
                <Sparkles size={16} />
              </button>
              <button
                type="button"
                onClick={() => { window.location.href = `tel:${client.client_phone}`; }}
                className="size-11 rounded-full bg-secondary/60 border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary shadow-sm transition-colors duration-150 cursor-pointer active:scale-[0.88]"
                aria-label="Подзвонити"
              >
                <Phone size={16} />
              </button>
            </div>
            <button
              type="button"
              onClick={() => onBooking(client)}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-[var(--btn-primary-bg)] text-[var(--accent-on)] text-xs font-bold transition-colors duration-150 cursor-pointer active:scale-[0.88] shadow-lg shadow-black/5"
            >
              <Calendar size={14} />
              Записати
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
});
