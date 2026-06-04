'use client';

import { useState, useEffect } from 'react';
import Cookies from 'js-cookie';
import { createClient } from '@/lib/supabase/client';
import { BottomSheet } from '@/components/ui/BottomSheet';
import {
  Search,
  Zap,
  Key,
  ShieldCheck,
  ShieldAlert,
  Loader2,
  ExternalLink,
  ChevronRight,
  User
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils/currency';

interface MasterRecord {
  id: string;
  slug: string;
  business_name: string | null;
  subscription_tier: 'starter' | 'pro' | 'studio';
  subscription_expires_at: string | null;
  is_published: boolean;
  rating: number;
  created_at: string;
  profiles: {
    full_name: string;
    phone: string | null;
    email: string | null;
  } | null;
}

export function MastersDirectory() {
  const [masters, setMasters] = useState<MasterRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [tierFilter, setTierFilter] = useState<string>('all');
  const [selectedMaster, setSelectedMaster] = useState<MasterRecord | null>(null);

  // Edit state
  const [editTier, setEditTier] = useState<'starter' | 'pro' | 'studio'>('starter');
  const [editExpires, setEditExpires] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  const fetchMasters = async () => {
    setLoading(true);
    try {
      const { data, error: fetchErr } = await supabase
        .from('master_profiles')
        .select(`
          id, slug, business_name, subscription_tier, subscription_expires_at, is_published, rating, created_at,
          profiles:profiles!master_profiles_id_fkey ( full_name, phone, email )
        `)
        .order('created_at', { ascending: false });

      if (fetchErr) throw fetchErr;
      setMasters((data as any) || []);
    } catch (err: any) {
      console.error('[AdminMasters] Fetch error:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMasters();
  }, []);

  const handleOpenDetails = (master: MasterRecord) => {
    setSelectedMaster(master);
    setEditTier(master.subscription_tier);
    setEditExpires(master.subscription_expires_at ? master.subscription_expires_at.split('T')[0] : '');
    setError(null);
  };

  const handleSaveChanges = async () => {
    if (!selectedMaster) return;
    setSaving(true);
    setError(null);

    try {
      const { error: updateErr } = await supabase
        .from('master_profiles')
        .update({
          subscription_tier: editTier,
          subscription_expires_at: editExpires ? new Date(editExpires).toISOString() : null
        })
        .eq('id', selectedMaster.id);

      if (updateErr) throw updateErr;

      // Refresh listing
      await fetchMasters();
      setSelectedMaster(prev => prev ? {
        ...prev,
        subscription_tier: editTier,
        subscription_expires_at: editExpires ? new Date(editExpires).toISOString() : null
      } : null);

    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleTogglePublish = async () => {
    if (!selectedMaster) return;
    setSaving(true);
    setError(null);

    const nextPublishState = !selectedMaster.is_published;

    try {
      const { error: updateErr } = await supabase
        .from('master_profiles')
        .update({ is_published: nextPublishState })
        .eq('id', selectedMaster.id);

      if (updateErr) throw updateErr;

      await fetchMasters();
      setSelectedMaster(prev => prev ? { ...prev, is_published: nextPublishState } : null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleImpersonate = (master: MasterRecord) => {
    // Set cookie and navigate
    Cookies.set('impersonate_master_id', master.id, { path: '/', expires: 1 });
    Cookies.set('view_mode', 'master', { path: '/', expires: 1 });
    window.location.href = '/dashboard';
  };

  const filteredMasters = masters.filter(m => {
    const nameMatch = (m.profiles?.full_name || '').toLowerCase().includes(search.toLowerCase()) ||
      (m.business_name || '').toLowerCase().includes(search.toLowerCase()) ||
      (m.slug || '').toLowerCase().includes(search.toLowerCase()) ||
      (m.profiles?.phone || '').includes(search);

    const tierMatch = tierFilter === 'all' || m.subscription_tier === tierFilter;

    return nameMatch && tierMatch;
  });

  return (
    <div className="space-y-6">
      {/* Search and Filters Bar */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between rounded-3xl border border-slate-200/60 bg-white/70 backdrop-blur-md p-4 shadow-sm">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Пошук майстра за ім'ям, телефоном..."
            className="w-full rounded-full border border-slate-200 bg-white pl-10 pr-4 py-2.5 text-xs text-slate-900 placeholder-slate-400 outline-none focus:border-slate-400 transition"
          />
        </div>

        <div className="flex gap-2 w-full sm:w-auto shrink-0 justify-end">
          {['all', 'starter', 'pro', 'studio'].map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTierFilter(t)}
              className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-wider transition active:scale-[0.95] cursor-pointer ${
                tierFilter === t
                  ? 'bg-slate-900 text-slate-50'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {t === 'all' ? 'Всі тарифи' : t}
            </button>
          ))}
        </div>
      </div>

      {/* Directory Grid */}
      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="size-8 animate-spin text-slate-400" />
        </div>
      ) : filteredMasters.length === 0 ? (
        <div className="rounded-3xl border border-slate-200/60 bg-white/70 backdrop-blur-md p-12 text-center text-slate-400">
          Майстрів не знайдено за вказаними фільтрами.
        </div>
      ) : (
        <div className="overflow-hidden rounded-3xl border border-slate-200/60 bg-white/70 backdrop-blur-md shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4">Майстер / Бізнес</th>
                  <th className="px-6 py-4">Контакти</th>
                  <th className="px-6 py-4">Тарифний План</th>
                  <th className="px-6 py-4">Статус</th>
                  <th className="px-6 py-4">Дата реєстрації</th>
                  <th className="px-6 py-4 text-right">Дії</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-150">
                {filteredMasters.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50/50 transition">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                          <User className="h-4.5 w-4.5" />
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900">
                            {m.profiles?.full_name || 'Без імені'}
                          </div>
                          {m.business_name && (
                            <div className="text-[10px] text-slate-400 mt-0.5">{m.business_name}</div>
                          )}
                          <div className="text-[10px] font-mono text-indigo-600 mt-0.5">@{m.slug}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>{m.profiles?.phone || 'Немає'}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">{m.profiles?.email || ''}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5">
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide border ${
                          m.subscription_tier === 'studio'
                            ? 'bg-indigo-50 text-indigo-600 border-indigo-100'
                            : m.subscription_tier === 'pro'
                            ? 'bg-amber-50 text-amber-600 border-amber-100'
                            : 'bg-slate-50 text-slate-500 border-slate-200'
                        }`}>
                          {m.subscription_tier}
                        </span>
                        {m.subscription_expires_at && (
                          <span className="text-[10px] text-slate-400">
                            до {new Date(m.subscription_expires_at).toLocaleDateString('uk-UA')}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 text-[11px] font-medium ${
                        m.is_published ? 'text-green-600' : 'text-slate-400'
                      }`}>
                        <span className={`size-1.5 rounded-full ${m.is_published ? 'bg-green-500' : 'bg-slate-400'}`} />
                        {m.is_published ? 'Опубліковано' : 'Чернетка'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-400">
                      {new Date(m.created_at).toLocaleDateString('uk-UA')}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        type="button"
                        onClick={() => handleOpenDetails(m)}
                        className="inline-flex h-8 items-center gap-1 rounded-full border border-slate-200 bg-white px-3 text-[11px] font-semibold text-slate-700 transition hover:bg-slate-50 active:scale-[0.95] cursor-pointer"
                      >
                        Керування
                        <ChevronRight className="size-3 text-slate-400" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Details Sheet */}
      <BottomSheet
        isOpen={!!selectedMaster}
        onClose={() => setSelectedMaster(null)}
        title={selectedMaster?.profiles?.full_name || 'Дії над майстром'}
        className="bg-[#EFF2FF] border-slate-200"
      >
        {selectedMaster && (
          <div className="space-y-6 text-slate-900">
            {error && (
              <div className="rounded-2xl bg-red-50 border border-red-100 p-3 text-xs text-red-600">
                {error}
              </div>
            )}

            {/* Quick Actions Panel */}
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleImpersonate(selectedMaster)}
                className="flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-xs font-bold text-slate-50 transition hover:bg-slate-800 active:scale-[0.95] cursor-pointer"
              >
                <Key className="size-4" />
                Увійти як майстер
              </button>

              <button
                type="button"
                onClick={handleTogglePublish}
                disabled={saving}
                className={`flex items-center justify-center gap-2 rounded-2xl border px-4 py-3 text-xs font-bold transition active:scale-[0.95] cursor-pointer ${
                  selectedMaster.is_published
                    ? 'bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100/50'
                    : 'bg-green-50 border-green-200 text-green-700 hover:bg-green-100/50'
                }`}
              >
                {selectedMaster.is_published ? (
                  <>
                    <ShieldAlert className="size-4" />
                    Зняти з публікації
                  </>
                ) : (
                  <>
                    <ShieldCheck className="size-4" />
                    Опублікувати
                  </>
                )}
              </button>
            </div>

            {/* Subscription Form */}
            <div className="rounded-3xl border border-slate-200/60 bg-white/70 backdrop-blur-md p-5 space-y-4 shadow-sm">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Управління підпискою</h3>

              <div className="space-y-3.5">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1.5">Тарифний план</label>
                  <div className="flex gap-2">
                    {['starter', 'pro', 'studio'].map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setEditTier(t as any)}
                        className={`flex-1 rounded-xl py-2 text-xs font-bold uppercase tracking-wide border transition cursor-pointer ${
                          editTier === t
                            ? 'bg-indigo-50 border-indigo-300 text-indigo-700'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1.5">Діє до (expires_at)</label>
                  <input
                    type="date"
                    value={editExpires}
                    onChange={(e) => setEditExpires(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs text-slate-900 placeholder-slate-400 outline-none focus:border-slate-400 transition"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleSaveChanges}
                  disabled={saving}
                  className="w-full flex items-center justify-center gap-2 rounded-full bg-slate-900 py-3 text-xs font-bold text-slate-50 transition hover:bg-slate-800 active:scale-[0.95] disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
                >
                  {saving && <Loader2 className="size-4 animate-spin" />}
                  Зберегти зміни тарифу
                </button>
              </div>
            </div>

            {/* Profile Info Details */}
            <div className="rounded-3xl border border-slate-200/60 bg-white/70 backdrop-blur-md p-5 space-y-3 shadow-sm text-xs">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Картка користувача</h3>

              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Slug сторінки:</span>
                <a
                  href={`/${selectedMaster.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-indigo-600 hover:underline flex items-center gap-1"
                >
                  {selectedMaster.slug}
                  <ExternalLink className="size-3" />
                </a>
              </div>

              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">ID Майстра:</span>
                <span className="font-mono text-slate-600">{selectedMaster.id}</span>
              </div>

              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Контактний телефон:</span>
                <span className="font-medium text-slate-900">{selectedMaster.profiles?.phone || 'Немає'}</span>
              </div>

              <div className="flex justify-between py-1">
                <span className="text-slate-500">Рейтинг відгуків:</span>
                <span className="font-medium text-slate-900">★ {selectedMaster.rating.toFixed(1)}</span>
              </div>
            </div>
          </div>
        )}
      </BottomSheet>
    </div>
  );
}
