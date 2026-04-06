import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <div className="flex flex-col gap-4 p-4 pb-8">
      {/* Header */}
      <div className="rounded-3xl bg-white/60 p-5">
        <Skeleton className="h-6 w-52 rounded-xl mb-2" />
        <Skeleton className="h-4 w-44 rounded-lg" />
      </div>

      {/* Реферальний код */}
      <div className="rounded-3xl bg-white/60 p-5 flex flex-col gap-3">
        <Skeleton className="h-4 w-32 rounded-lg" />
        <div className="flex gap-2">
          <Skeleton className="h-12 flex-1 rounded-2xl" />
          <Skeleton className="h-12 w-12 rounded-2xl" />
        </div>
        <Skeleton className="h-3 w-3/4 rounded-md" />
      </div>

      {/* Статистика запрошень */}
      <div className="rounded-3xl bg-white/60 p-4 flex gap-3">
        <div className="flex-1 flex flex-col gap-2">
          <Skeleton className="h-3 w-24 rounded-md" />
          <Skeleton className="h-7 w-10 rounded-lg" />
        </div>
        <div className="w-px bg-white/40" />
        <div className="flex-1 flex flex-col gap-2">
          <Skeleton className="h-3 w-28 rounded-md" />
          <Skeleton className="h-7 w-16 rounded-lg" />
        </div>
      </div>

      {/* Умови програми */}
      <div className="rounded-3xl bg-white/60 p-5 flex flex-col gap-3">
        <Skeleton className="h-5 w-36 rounded-lg" />
        <div className="flex flex-col gap-2">
          <Skeleton className="h-3 w-full rounded-md" />
          <Skeleton className="h-3 w-4/5 rounded-md" />
          <Skeleton className="h-3 w-3/4 rounded-md" />
        </div>
      </div>
    </div>
  );
}
