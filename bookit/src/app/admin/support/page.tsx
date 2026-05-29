import { AdminSupportConsole } from '@/components/admin/AdminSupportConsole';

export const dynamic = 'force-dynamic';

export default function AdminSupportPage() {
  return (
    <div className="space-y-6 flex flex-col flex-1 h-full min-h-0 overflow-hidden">
      <div className="shrink-0">
        <h1 className="heading-serif text-3xl font-bold tracking-tight text-slate-950">Онлайн підтримка</h1>
        <p className="text-sm text-slate-500 mt-1">Чат у реальному часі з майстрами та клієнтами платформи</p>
      </div>

      <AdminSupportConsole />
    </div>
  );
}
