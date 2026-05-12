'use client';

import { useState } from 'react';
import { Plus, Pencil } from 'lucide-react';
import { motion } from 'framer-motion';
import { SegmentBuilder, getSegmentIcon } from '@/components/master/clients/SegmentBuilder';
import type { CustomSegment } from '@/lib/types/segments';
import type { ClientRow } from '@/components/master/clients/ClientsPage';
import { useClients } from '@/lib/supabase/hooks/useClients';

interface SegmentConfigWidgetProps {
  segments: CustomSegment[];
  onChange: (segments: CustomSegment[]) => void;
}

export function SegmentConfigWidget({ segments, onChange }: SegmentConfigWidgetProps) {
  const [builderOpen, setBuilderOpen] = useState(false);
  const [editing, setEditing] = useState<CustomSegment | null>(null);
  const { clients } = useClients();

  const openNew = () => { setEditing(null); setBuilderOpen(true); };
  const openEdit = (s: CustomSegment) => { setEditing(s); setBuilderOpen(true); };

  const handleSave = (seg: CustomSegment) => {
    const exists = segments.find(s => s.id === seg.id);
    onChange(exists ? segments.map(s => s.id === seg.id ? seg : s) : [...segments, seg]);
  };

  const handleDelete = (id: string) => onChange(segments.filter(s => s.id !== id));

  return (
    <>
      <div className="widget-card p-6 flex flex-col gap-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-accent/10 flex items-center justify-center shrink-0">
            <Plus size={18} className="text-accent" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground">Мої сегменти</h3>
            <p className="text-[11px] text-muted-foreground/60 mt-0.5">Кастомні фільтри клієнтів</p>
          </div>
        </div>

        {segments.length === 0 ? (
          <div
            onClick={openNew}
            className="flex flex-col items-center justify-center py-8 rounded-2xl border border-dashed border-muted-foreground/20 text-muted-foreground/40 cursor-pointer hover:border-accent/30 hover:text-accent/60 transition-colors gap-2"
          >
            <Plus size={22} strokeWidth={1.5} />
            <p className="text-xs font-medium">Створіть перший сегмент</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {segments.map(seg => (
              <motion.button
                key={seg.id}
                layout
                onClick={() => openEdit(seg)}
                className="flex items-center gap-2.5 p-3 rounded-2xl border border-white/80 bg-white/60 hover:bg-white transition-all active:scale-[0.98] text-left"
              >
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: `${seg.color}18`, color: seg.color }}
                >
                  {getSegmentIcon(seg.icon, 14)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-foreground truncate">{seg.name}</p>
                  <p className="text-[10px] text-muted-foreground/50">{seg.conditions.length} умов</p>
                </div>
                <Pencil size={11} className="text-muted-foreground/30 shrink-0" />
              </motion.button>
            ))}
          </div>
        )}

        <button
          onClick={openNew}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-accent text-white text-sm font-bold hover:bg-accent/90 active:scale-[0.98] transition-all shadow-sm shadow-accent/20"
        >
          <Plus size={16} />
          Новий сегмент
        </button>
      </div>

      <SegmentBuilder
        isOpen={builderOpen}
        onClose={() => setBuilderOpen(false)}
        initial={editing}
        allClients={clients as ClientRow[]}
        onSave={handleSave}
        onDelete={handleDelete}
      />
    </>
  );
}
