import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <div className="flex flex-col gap-4 p-4 pb-8">
      {/* Header */}
      <div className="rounded-3xl bg-white/60 p-5">
        <Skeleton className="h-6 w-32 rounded-xl mb-2" />
        <Skeleton className="h-4 w-52 rounded-lg" />
      </div>

      {/* Поточний тариф */}
      <div className="rounded-3xl bg-white/60 p-5 flex flex-col gap-3">
        <Skeleton className="h-4 w-28 rounded-lg" />
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-2xl" />
          <div className="flex flex-col gap-1.5 flex-1">
            <Skeleton className="h-5 w-24 rounded-lg" />
            <Skeleton className="h-3 w-40 rounded-md" />
          </div>
          <Skeleton className="h-8 w-20 rounded-2xl" />
        </div>
      </div>

      {/* Тарифна картка Starter */}
      <div className="rounded-3xl bg-white/60 p-5 flex flex-col gap-3">
        <Skeleton className="h-5 w-20 rounded-lg" />
        <Skeleton className="h-8 w-28 rounded-xl" />
        <div className="flex flex-col gap-2">
          <Skeleton className="h-3 w-full rounded-md" />
          <Skeleton className="h-3 w-4/5 rounded-md" />
          <Skeleton className="h-3 w-3/4 rounded-md" />
        </div>
        <Skeleton className="h-12 w-full rounded-2xl mt-1" />
      </div>

      {/* Тарифна картка Pro */}
      <div className="rounded-3xl bg-white/60 p-5 flex flex-col gap-3">
        <Skeleton className="h-5 w-16 rounded-lg" />
        <Skeleton className="h-8 w-32 rounded-xl" />
        <div className="flex flex-col gap-2">
          <Skeleton className="h-3 w-full rounded-md" />
          <Skeleton className="h-3 w-4/5 rounded-md" />
          <Skeleton className="h-3 w-3/4 rounded-md" />
          <Skeleton className="h-3 w-2/3 rounded-md" />
        </div>
        <Skeleton className="h-12 w-full rounded-2xl mt-1" />
      </div>

      {/* Тарифна картка Studio */}
      <div className="rounded-3xl bg-white/60 p-5 flex flex-col gap-3">
        <Skeleton className="h-5 w-20 rounded-lg" />
        <Skeleton className="h-8 w-36 rounded-xl" />
        <div className="flex flex-col gap-2">
          <Skeleton className="h-3 w-full rounded-md" />
          <Skeleton className="h-3 w-4/5 rounded-md" />
        </div>
        <Skeleton className="h-12 w-full rounded-2xl mt-1" />
      </div>
    </div>
  );
}
