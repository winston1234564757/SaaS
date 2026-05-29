import { MastersDirectory } from '@/components/admin/MastersDirectory';

export const dynamic = 'force-dynamic';

export default function AdminMastersPage() {
  return (
    <div className="space-y-6 flex flex-col">
      <div>
        <h1 className="heading-serif text-3xl font-bold tracking-tight text-slate-950">Керування майстрами</h1>
        <p className="text-sm text-slate-500 mt-1">Перегляд профілів, оновлення підписок та імітація робочих столів</p>
      </div>

      <MastersDirectory />
    </div>
  );
}
