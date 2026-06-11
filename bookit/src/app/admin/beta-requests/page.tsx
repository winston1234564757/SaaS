import { createAdminClient } from '@/lib/supabase/admin';
import { ClipboardList } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function AdminBetaRequestsPage() {
  const admin = createAdminClient();

  const { data: requests, error } = await admin
    .from('beta_requests')
    .select('id, created_at, name, contact, studio_size, master_id')
    .order('created_at', { ascending: false });

  const SIZE_LABELS: Record<string, string> = {
    '1':   '1 майстер',
    '2-5': '2–5 майстрів',
    '5+':  '5+ майстрів',
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="heading-serif text-3xl font-bold tracking-tight text-slate-950">Бета-заявки Studio</h1>
        <p className="text-sm text-slate-500 mt-1">
          Заявки на Studio Beta від майстрів — {requests?.length ?? 0} всього
        </p>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          Помилка завантаження: {error.message}
        </div>
      )}

      {!error && (!requests || requests.length === 0) && (
        <div className="rounded-3xl border border-slate-200/60 bg-white/70 backdrop-blur-md p-16 flex flex-col items-center justify-center gap-4 text-center">
          <div className="size-14 rounded-2xl bg-slate-100 flex items-center justify-center">
            <ClipboardList className="size-7 text-slate-400" />
          </div>
          <div>
            <p className="text-base font-semibold text-slate-700">Заявок ще немає</p>
            <p className="text-sm text-slate-400 mt-1">Вони з'являться тут після першої відправки форми</p>
          </div>
        </div>
      )}

      {requests && requests.length > 0 && (
        <div className="rounded-3xl border border-slate-200/60 bg-white/70 backdrop-blur-md overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Ім'я / Студія</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Контакт</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Розмір</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Дата</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {requests.map((req) => (
                <tr key={req.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="px-5 py-4">
                    <p className="font-semibold text-slate-800">{req.name}</p>
                    {req.master_id && (
                      <p className="text-[11px] text-slate-400 mt-0.5 font-mono">{req.master_id.slice(0, 8)}…</p>
                    )}
                  </td>
                  <td className="px-5 py-4 text-slate-600">{req.contact}</td>
                  <td className="px-5 py-4">
                    <span className="inline-block px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100">
                      {SIZE_LABELS[req.studio_size] ?? req.studio_size}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-slate-500 text-xs">
                    {new Date(req.created_at).toLocaleDateString('uk-UA', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
