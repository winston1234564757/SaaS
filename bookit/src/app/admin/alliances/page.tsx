import { AllianceMap } from '@/components/admin/AllianceMap';

export const dynamic = 'force-dynamic';

export default function AdminAlliancesPage() {
  return (
    <div className="space-y-6 flex flex-col">
      <div>
        <h1 className="heading-serif text-3xl font-bold tracking-tight text-slate-950">B2B Альянси</h1>
        <p className="text-sm text-slate-500 mt-1">Візуальне реферальне дерево запрошень та білінгова аналітика альянсів</p>
      </div>

      <AllianceMap />
    </div>
  );
}
