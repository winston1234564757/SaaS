'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Pencil, Trash2, Gift, Users, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useMasterContext } from '@/lib/supabase/context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface LoyaltyProgram {
  id: string;
  name: string;
  targetVisits: number;
  rewardType: string;
  rewardValue: number;
  isActive: boolean;
}

function formatPrice(kopecks: number) {
  return kopecks.toLocaleString('uk-UA') + ' ₴';
}

function ProgramForm({
  initial,
  onSave,
  onCancel,
  isSaving,
}: {
  initial?: Partial<LoyaltyProgram>;
  onSave: (data: Omit<LoyaltyProgram, 'id' | 'isActive'>) => void;
  onCancel: () => void;
  isSaving: boolean;
}) {
  const [name, setName] = useState(initial?.name ?? '');
  const [targetVisits, setTargetVisits] = useState(String(initial?.targetVisits ?? 5));
  const [rewardValue, setRewardValue] = useState(String(initial?.rewardValue ?? 10));

  const canSave = name.trim() && Number(targetVisits) > 0 && Number(rewardValue) > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      className="bento-card p-4 border-2 border-[#789A99]/30"
    >
      <div className="flex flex-col gap-3">
        <div>
          <label className="text-xs font-medium text-[#6B5750] mb-1 block">Назва програми</label>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Наприклад: Постійний клієнт"
            className="w-full px-3 py-2.5 rounded-xl bg-white/80 border border-white/80 text-sm text-[#2C1A14] placeholder-[#A8928D] outline-none focus:border-[#789A99] transition-colors"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-[#6B5750] mb-1 block">Після скільки візитів</label>
            <input
              type="number"
              min="1"
              value={targetVisits}
              onChange={e => setTargetVisits(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-white/80 border border-white/80 text-sm text-[#2C1A14] outline-none focus:border-[#789A99] transition-colors"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-[#6B5750] mb-1 block">Знижка (%)</label>
            <input
              type="number"
              min="1"
              max="100"
              value={rewardValue}
              onChange={e => setRewardValue(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-white/80 border border-white/80 text-sm text-[#2C1A14] outline-none focus:border-[#789A99] transition-colors"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 mt-1">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl bg-white/70 border border-white/80 text-sm font-medium text-[#6B5750] hover:bg-white transition-colors"
          >
            Скасувати
          </button>
          <button
            onClick={() => onSave({ name: name.trim(), targetVisits: Number(targetVisits), rewardType: 'percent_discount', rewardValue: Number(rewardValue) })}
            disabled={!canSave || isSaving}
            className="flex-1 py-2.5 rounded-xl bg-[#789A99] text-white text-sm font-semibold hover:bg-[#5C7E7D] transition-colors disabled:opacity-50"
          >
            {isSaving ? <Loader2 size={16} className="animate-spin mx-auto" /> : 'Зберегти'}
          </button>
        </div>
      </div>
    </motion.div>
  );
}

export function LoyaltyPage() {
  const { masterProfile } = useMasterContext();
  const masterId = masterProfile?.id;
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const { data: programs = [], isLoading } = useQuery<LoyaltyProgram[]>({
    queryKey: ['loyaltyPrograms', masterId],
    enabled: !!masterId,
    queryFn: async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from('loyalty_programs')
        .select('id, name, target_visits, reward_type, reward_value, is_active')
        .eq('master_id', masterId!)
        .order('target_visits', { ascending: true });
      return (data ?? []).map((p: any) => ({
        id: p.id as string,
        name: p.name as string,
        targetVisits: p.target_visits as number,
        rewardType: p.reward_type as string,
        rewardValue: Number(p.reward_value),
        isActive: p.is_active as boolean,
      }));
    },
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ['loyaltyPrograms', masterId] });

  const createMutation = useMutation({
    mutationFn: async (data: Omit<LoyaltyProgram, 'id' | 'isActive'>) => {
      const supabase = createClient();
      const { error } = await supabase.from('loyalty_programs').insert({
        master_id: masterId!,
        name: data.name,
        target_visits: data.targetVisits,
        reward_type: data.rewardType,
        reward_value: data.rewardValue,
        is_active: true,
      });
      if (error) throw error;
    },
    onSuccess: () => { invalidate(); setShowForm(false); },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Omit<LoyaltyProgram, 'id' | 'isActive'> }) => {
      const supabase = createClient();
      const { error } = await supabase.from('loyalty_programs').update({
        name: data.name,
        target_visits: data.targetVisits,
        reward_type: data.rewardType,
        reward_value: data.rewardValue,
      }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { invalidate(); setEditingId(null); },
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const supabase = createClient();
      const { error } = await supabase.from('loyalty_programs').update({ is_active: !isActive }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const supabase = createClient();
      const { error } = await supabase.from('loyalty_programs').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { invalidate(); setConfirmDelete(null); },
  });

  return (
    <div className="flex flex-col gap-4 pb-8">
      <div className="bento-card p-5">
        <h1 className="heading-serif text-xl text-[#2C1A14] mb-0.5">Програми лояльності</h1>
        <p className="text-sm text-[#A8928D]">Знижки для постійних клієнтів</p>
      </div>

      {/* Info banner */}
      <div className="bento-card p-4 flex items-start gap-3" style={{ background: 'rgba(120, 154, 153, 0.08)' }}>
        <Gift size={16} className="text-[#789A99] flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-xs font-semibold text-[#2C1A14]">Як це працює</p>
          <p className="text-xs text-[#6B5750] mt-0.5 leading-relaxed">
            Коли клієнт досягає потрібної кількості візитів, він автоматично отримує знижку при наступному записі через публічну сторінку.
          </p>
        </div>
      </div>

      {/* Add button */}
      {!showForm && (
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => setShowForm(true)}
          className="flex items-center justify-center gap-2 py-3 rounded-2xl bg-[#789A99] text-white font-semibold text-sm hover:bg-[#5C7E7D] transition-colors shadow-[0_4px_14px_rgba(120,154,153,0.3)]"
        >
          <Plus size={16} /> Нова програма
        </motion.button>
      )}

      <AnimatePresence>
        {showForm && (
          <ProgramForm
            onSave={data => createMutation.mutate(data)}
            onCancel={() => setShowForm(false)}
            isSaving={createMutation.isPending}
          />
        )}
      </AnimatePresence>

      {/* List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-10 gap-2">
          <Loader2 size={20} className="text-[#789A99] animate-spin" />
          <span className="text-sm text-[#A8928D]">Завантаження...</span>
        </div>
      ) : programs.length === 0 && !showForm ? (
        <div className="bento-card p-8 flex flex-col items-center gap-3 text-center">
          <div className="w-14 h-14 rounded-full bg-[#F5E8E3] flex items-center justify-center">
            <Users size={26} className="text-[#A8928D]" />
          </div>
          <p className="text-sm font-semibold text-[#2C1A14]">Програм лояльності ще немає</p>
          <p className="text-xs text-[#A8928D]">Створіть першу знижку для постійних клієнтів</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <AnimatePresence>
            {programs.map((p, i) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ delay: i * 0.04, type: 'spring', stiffness: 300, damping: 24 }}
                className={`bento-card p-4 transition-opacity ${!p.isActive ? 'opacity-55' : ''}`}
              >
                {editingId === p.id ? (
                  <ProgramForm
                    initial={p}
                    onSave={data => updateMutation.mutate({ id: p.id, data })}
                    onCancel={() => setEditingId(null)}
                    isSaving={updateMutation.isPending}
                  />
                ) : (
                  <>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl flex items-center justify-center bg-[#789A99]/10 flex-shrink-0">
                        <Gift size={18} className="text-[#789A99]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-[#2C1A14]">{p.name}</p>
                        <p className="text-xs text-[#A8928D]">
                          Після {p.targetVisits} візитів · знижка {p.rewardValue}%
                        </p>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        p.isActive ? 'bg-[#5C9E7A]/15 text-[#5C9E7A]' : 'bg-[#E8D5CF] text-[#A8928D]'
                      }`}>
                        {p.isActive ? 'Активна' : 'Вимкнена'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-[#F5E8E3]/60">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setEditingId(p.id)}
                          className="w-8 h-8 flex items-center justify-center rounded-xl bg-white/70 border border-white/80 text-[#6B5750] hover:bg-white hover:text-[#789A99] transition-colors"
                        >
                          <Pencil size={14} />
                        </button>

                        <AnimatePresence mode="wait">
                          {confirmDelete === p.id ? (
                            <motion.div
                              key="confirm"
                              initial={{ opacity: 0, width: 0 }}
                              animate={{ opacity: 1, width: 'auto' }}
                              exit={{ opacity: 0, width: 0 }}
                              className="flex items-center gap-1 overflow-hidden"
                            >
                              <span className="text-xs text-[#C05B5B] font-medium whitespace-nowrap ml-1">Видалити?</span>
                              <button
                                onClick={() => deleteMutation.mutate(p.id)}
                                className="px-2.5 h-7 rounded-lg bg-[#C05B5B] text-white text-xs font-semibold hover:bg-[#a84a4a] transition-colors"
                              >
                                Так
                              </button>
                              <button
                                onClick={() => setConfirmDelete(null)}
                                className="px-2.5 h-7 rounded-lg bg-white/70 border border-white/80 text-xs font-medium text-[#6B5750] hover:bg-white transition-colors"
                              >
                                Ні
                              </button>
                            </motion.div>
                          ) : (
                            <button
                              onClick={() => setConfirmDelete(p.id)}
                              className="w-8 h-8 flex items-center justify-center rounded-xl bg-white/70 border border-white/80 text-[#6B5750] hover:bg-[#C05B5B]/10 hover:text-[#C05B5B] hover:border-[#C05B5B]/20 transition-colors"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </AnimatePresence>
                      </div>

                      <button
                        onClick={() => toggleMutation.mutate({ id: p.id, isActive: p.isActive })}
                        className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${p.isActive ? 'bg-[#789A99]' : 'bg-[#E8D5CF]'}`}
                      >
                        <motion.div
                          animate={{ x: p.isActive ? 20 : 2 }}
                          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                          className="absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm"
                        />
                      </button>
                    </div>
                  </>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
