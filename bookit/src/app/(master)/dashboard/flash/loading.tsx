import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <div className="flex flex-col gap-4 p-4 pb-8">
      {/* Header */}
      <div className="rounded-3xl bg-white/60 p-5">
        <Skeleton className="h-6 w-36 rounded-xl mb-2" />
        <Skeleton className="h-4 w-48 rounded-lg" />
      </div>

      {/* Ліміт / статистика */}
      <div className="rounded-3xl bg-white/60 p-4 flex items-center gap-3">
        <Skeleton className="h-10 w-10 rounded-2xl flex-shrink-0" />
        <div className="flex flex-col gap-1.5 flex-1">
          <Skeleton className="h-4 w-32 rounded-lg" />
          <Skeleton className="h-3 w-24 rounded-md" />
        </div>
      </div>

      {/* Кнопка нової акції */}
      <Skeleton className="h-12 w-full rounded-2xl" />

      {/* Список флеш-акцій */}
      {[0, 1, 2].map(i => (
        <div key={i} className="rounded-3xl bg-white/60 p-4 flex flex-col gap-2">
          <div className="flex justify-between items-start">
            <Skeleton className="h-5 w-40 rounded-lg" />
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>
          <div className="flex gap-4">
            <Skeleton className="h-3 w-24 rounded-md" />
            <Skeleton className="h-3 w-20 rounded-md" />
          </div>
          <Skeleton className="h-3 w-32 rounded-md" />
        </div>
      ))}
    </div>
  );
}
