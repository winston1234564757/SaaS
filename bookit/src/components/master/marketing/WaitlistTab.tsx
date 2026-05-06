'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import { Bolt, Percent, Users } from 'lucide-react';

interface Props {
  config: {
    discountPct: number | null;
    lookbackDays: number;
    lookaheadDays: number;
  };
}

export function WaitlistTab({ config }: Props) {
  const [discount, setDiscount] = useState<number | null>(config.discountPct);
  const [lookback, setLookback] = useState<number>(config.lookbackDays);
  const [lookahead, setLookahead] = useState<number>(config.lookaheadDays);
  const [isSaving, setIsSaving] = useState(false);

  async function handleSave() {
    setIsSaving(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not auth');

      const { error } = await supabase.from('master_profiles').update({
        waitlist_discount_pct: discount,
        waitlist_lookback_days: lookback,
        waitlist_lookahead_days: lookahead
      }).eq('id', user.id);

      if (error) throw error;
      toast.success('Налаштування Waitlist збережено');
    } catch (err) {
      console.error(err);
      toast.error('Помилка при збереженні');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="p-4 space-y-4">
      <div className="bento-card p-4 space-y-3">
        <div className="flex gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#FFE8DC] text-[#D4935A] flex items-center justify-center shrink-0 shadow-inner">
            <Bolt size={20} />
          </div>
          <div>
            <h3 className="font-display font-bold text-lg text-[#2C1A14]">Авто-повернення (Waitlist)</h3>
            <p className="text-sm text-[#6B5750]">
              Коли звільняється вікно, система автоматично пропонує його вашим сплячим клієнтам.
            </p>
          </div>
        </div>

        <div className="h-px bg-white/40 my-2" />

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-[#2C1A14] flex items-center gap-1.5">
              <Percent size={14} className="text-[#D4935A]" />
              Знижка на гаряче вікно
              <span
                className="text-[10px] text-[#A8928D] cursor-help underline decoration-dotted"
                title="Система автоматично застосує цю знижку, якщо клієнт запишеться за пуш-повідомленням."
              >
                ?
              </span>
            </label>
            <select
              value={discount === null ? '0' : discount.toString()}
              onChange={(e) => setDiscount(e.target.value === '0' ? null : Number(e.target.value))}
              className="w-full bg-white/50 border border-white/60 rounded-xl px-4 py-2.5 text-[#2C1A14] focus:outline-none focus:ring-2 focus:ring-[#789A99]/30"
            >
              <option value="0">Не давати знижку</option>
              <option value="5">-5% Знижки</option>
              <option value="10">-10% Знижки</option>
              <option value="15">-15% Знижки</option>
              <option value="20">-20% Знижки</option>
              <option value="25">-25% Знижки</option>
              <option value="30">-30% Знижки</option>
              <option value="40">-40% Знижки</option>
              <option value="50">-50% Знижки</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-[#2C1A14] flex items-center gap-1.5">
              <Users size={14} className="text-[#789A99]" />
              Таргетинг клієнтів
            </label>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <span className="text-xs text-[#A8928D]">Не були у мене:</span>
                <div className="flex items-center gap-2 bg-white/50 border border-white/60 rounded-xl px-3 py-2">
                  <input
                    type="number"
                    min="1"
                    max="365"
                    value={lookback}
                    onChange={(e) => setLookback(Number(e.target.value))}
                    className="w-full bg-transparent outline-none text-[#2C1A14] font-medium"
                  />
                  <span className="text-sm text-[#6B5750]">днів</span>
                </div>
              </div>
              
              <div className="space-y-1">
                <span className="text-xs text-[#A8928D]">Не мають записів:</span>
                <div className="flex items-center gap-2 bg-white/50 border border-white/60 rounded-xl px-3 py-2">
                  <span className="text-sm text-[#6B5750]">найближчі</span>
                  <input
                    type="number"
                    min="1"
                    max="30"
                    value={lookahead}
                    onChange={(e) => setLookahead(Number(e.target.value))}
                    className="w-full bg-transparent outline-none text-[#2C1A14] font-medium text-right"
                  />
                  <span className="text-sm text-[#6B5750]">днів</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={isSaving}
          className="w-full py-3 bg-[#2C1A14] text-white rounded-xl font-medium mt-4 active:scale-95 transition-all disabled:opacity-70"
        >
          {isSaving ? 'Збереження...' : 'Зберегти налаштування'}
        </button>
      </div>
    </div>
  );
}
