import { SystemLogsViewer } from '@/components/admin/SystemLogsViewer';

export const dynamic = 'force-dynamic';

export default function AdminLogsPage() {
  return (
    <div className="space-y-8 flex flex-col">
      {/* Top Header */}
      <div>
        <h1 className="heading-serif text-3xl font-bold tracking-tight text-slate-950">Системні логи</h1>
        <p className="text-sm text-slate-500 mt-1">
          Діагностика та аналіз логів відправки сповіщень та SMS OTP-кодів верифікації
        </p>
      </div>

      {/* Main Content */}
      <SystemLogsViewer />
    </div>
  );
}
