import { ModerationHub } from '@/components/admin/ModerationHub';

export const dynamic = 'force-dynamic';

export default function AdminModerationPage() {
  return (
    <div className="space-y-6 flex flex-col">
      <div>
        <h1 className="heading-serif text-3xl font-bold tracking-tight text-slate-950">Модерація контенту</h1>
        <p className="text-sm text-slate-500 mt-1">Огляд скарг та примусове управління видимістю відгуків та портфоліо робіт</p>
      </div>

      <ModerationHub />
    </div>
  );
}
