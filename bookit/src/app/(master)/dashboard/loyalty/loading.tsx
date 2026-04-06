import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <div className="flex flex-col gap-4 p-4 pb-8">
      {/* Header */}
      <div className="rounded-3xl bg-white/60 p-5">
        <Skeleton className="h-6 w-36 rounded-xl mb-2" />
        <Skeleton className="h-4 w-52 rounded-lg" />
      </div>

      {/* Статистика */}
      <div className="rounded-3xl bg-white/60 p-4 flex gap-3">
        <div className="flex-1 flex flex-col gap-2">
          <Skeleton className="h-3 w-20 rounded-md" />
          <Skeleton className="h-7 w-12 rounded-lg" />
        </div>
        <div className="w-px bg-white/40" />
        <div className="flex-1 flex flex-col gap-2">
          <Skeleton className="h-3 w-24 rounded-md" />
          <Skeleton className="h-7 w-16 rounded-lg" />
        </div>
      </div>

      {/* Програма лояльності */}
      <div className="rounded-3xl bg-white/60 p-5 flex flex-col gap-3">
        <Skeleton className="h-5 w-44 rounded-lg" />
        <div className="flex flex-col gap-2">
          <Skeleton className="h-10 w-full rounded-xl" />
          <Skeleton className="h-10 w-full rounded-xl" />
        </div>
        <Skeleton className="h-3 w-3/4 rounded-md" />
      </div>

      {/* Картки рівнів */}
      {[0, 1].map(i => (
        <div key={i} className="rounded-3xl bg-white/60 p-4 flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-2xl flex-shrink-0" />
          <div className="flex flex-col gap-1.5 flex-1">
            <Skeleton className="h-4 w-32 rounded-lg" />
            <Skeleton className="h-3 w-48 rounded-md" />
          </div>
        </div>
      ))}
    </div>
  );
}
