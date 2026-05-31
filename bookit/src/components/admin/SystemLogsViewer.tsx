'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Search, Loader2, RefreshCw, AlertTriangle, ShieldCheck } from 'lucide-react';

interface NotifLogRecord {
  id: string;
  event_type: string;
  channel: string;
  status: 'success' | 'failed' | 'skipped';
  error_text: string | null;
  recipient_id: string;
  created_at: string;
  profiles?: {
    full_name: string;
    phone: string | null;
  } | null;
}

interface OtpLogRecord {
  id: number;
  phone: string;
  otp: string;
  used: boolean;
  created_at: string;
}

export function SystemLogsViewer() {
  const [notifLogs, setNotifLogs] = useState<NotifLogRecord[]>([]);
  const [otpLogs, setOtpLogs] = useState<OtpLogRecord[]>([]);
  const [activeTab, setActiveTab] = useState<'notif' | 'otp'>('notif');
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  const supabase = createClient();

  const loadLogs = async () => {
    setLoading(true);
    try {
      if (activeTab === 'notif') {
        const { data, error } = await supabase
          .from('notification_logs')
          .select(`
            id, event_type, channel, status, error_text, recipient_id, created_at,
            profiles:recipient_id ( full_name, phone )
          `)
          .order('created_at', { ascending: false })
          .limit(50);

        if (error) throw error;
        setNotifLogs((data as any) || []);
      } else {
        const { data, error } = await supabase
          .from('sms_otps')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(50);

        if (error) throw error;
        setOtpLogs((data as any) || []);
      }
    } catch (err) {
      console.error('[AdminLogs] Load error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, [activeTab]);

  const filteredNotifLogs = notifLogs.filter(l => {
    return (l.event_type || '').toLowerCase().includes(search.toLowerCase()) ||
      (l.profiles?.full_name || '').toLowerCase().includes(search.toLowerCase()) ||
      (l.profiles?.phone || '').includes(search) ||
      (l.error_text || '').toLowerCase().includes(search.toLowerCase());
  });

  const filteredOtpLogs = otpLogs.filter(l => {
    return (l.phone || '').includes(search) || (l.otp || '').includes(search);
  });

  return (
    <div className="space-y-6">
      {/* Search and Tab controller */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between rounded-3xl border border-slate-200/60 bg-white/70 backdrop-blur-md p-4 shadow-sm">
        
        <div className="flex gap-1 overflow-x-auto scrollbar-hide py-1">
          <button
            onClick={() => {
              setActiveTab('notif');
              setSearch('');
            }}
            className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-wider transition cursor-pointer shrink-0 ${
              activeTab === 'notif'
                ? 'bg-slate-900 text-slate-50'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-250'
            }`}
          >
            Сповіщення (logs)
          </button>
          <button
            onClick={() => {
              setActiveTab('otp');
              setSearch('');
            }}
            className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-wider transition cursor-pointer shrink-0 ${
              activeTab === 'otp'
                ? 'bg-slate-900 text-slate-50'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-250'
            }`}
          >
            OTP Верифікації (SMS)
          </button>
        </div>

        <div className="flex gap-3 w-full sm:w-auto items-center shrink-0 justify-end">
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-3.5 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Пошук по логах..."
              className="w-full rounded-full border border-slate-200 bg-white pl-9 pr-4 py-2 text-xs text-slate-900 placeholder-slate-400 outline-none focus:border-slate-400 transition"
            />
          </div>

          <button
            onClick={loadLogs}
            className="flex size-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 active:scale-[0.90] cursor-pointer"
          >
            <RefreshCw className="size-4" />
          </button>
        </div>

      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="size-8 animate-spin text-slate-400" />
        </div>
      ) : activeTab === 'notif' ? (
        // Notification logs table
        <div className="overflow-hidden rounded-3xl border border-slate-200/60 bg-white/70 backdrop-blur-md shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4">Тип події / Отримувач</th>
                  <th className="px-6 py-4">Канал</th>
                  <th className="px-6 py-4">Статус</th>
                  <th className="px-6 py-4">Помилка</th>
                  <th className="px-6 py-4">Час відправки</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-150">
                {filteredNotifLogs.map((l) => (
                  <tr key={l.id} className="hover:bg-slate-50/50 transition">
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-semibold text-slate-900 font-mono text-[11px]">{l.event_type}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          {l.profiles?.full_name || 'Невідомий'} ({l.profiles?.phone || l.recipient_id})
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono font-medium uppercase text-[10px] text-slate-500">
                      {l.channel}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded border ${
                        l.status === 'success'
                          ? 'bg-green-50 text-green-700 border-green-200'
                          : l.status === 'failed'
                          ? 'bg-red-50 text-red-700 border-red-200'
                          : 'bg-slate-50 text-slate-500 border-slate-200'
                      }`}>
                        {l.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 max-w-xs truncate text-[11px] text-red-600 font-mono" title={l.error_text || ''}>
                      {l.error_text || '—'}
                    </td>
                    <td className="px-6 py-4 text-slate-400">
                      {new Date(l.created_at).toLocaleString('uk-UA')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        // OTP logs table
        <div className="overflow-hidden rounded-3xl border border-slate-200/60 bg-white/70 backdrop-blur-md shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4">Номер телефону</th>
                  <th className="px-6 py-4">Згенерований OTP</th>
                  <th className="px-6 py-4">Статус</th>
                  <th className="px-6 py-4">Створено</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-150">
                {filteredOtpLogs.map((l) => (
                  <tr key={l.id} className="hover:bg-slate-50/50 transition">
                    <td className="px-6 py-4 font-semibold text-slate-900">{l.phone}</td>
                    <td className="px-6 py-4 font-mono font-semibold text-indigo-600 tracking-wider">
                      {l.otp}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${
                        l.used
                          ? 'bg-green-50 border-green-200 text-green-700'
                          : 'bg-amber-50 border-amber-200 text-amber-700'
                      }`}>
                        {l.used ? (
                          <>
                            <ShieldCheck className="size-3 shrink-0" />
                            використано
                          </>
                        ) : (
                          <>
                            <AlertTriangle className="size-3 shrink-0 animate-pulse" />
                            активний / невикористано
                          </>
                        )}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-400">
                      {new Date(l.created_at).toLocaleString('uk-UA')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
