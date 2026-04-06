import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <div className="flex flex-col gap-4 p-4 pb-8">
      {/* Header */}
      <div className="rounded-3xl bg-white/60 p-5">
        <Skeleton className="h-6 w-44 rounded-xl mb-2" />
        <Skeleton className="h-4 w-56 rounded-lg" />
      </div>

      {/* Trial / upgrade banner */}
      <div className="rounded-3xl bg-white/60 p-5 flex flex-col gap-3">
        <Skeleton className="h-5 w-40 rounded-lg" />
        <Skeleton className="h-2 w-full rounded-full" />
        <Skeleton className="h-3 w-48 rounded-md" />
        <Skeleton className="h-10 w-full rounded-2xl" />
      </div>

      {/* Тихий час */}
      <div className="rounded-3xl bg-white/60 p-5 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-28 rounded-lg" />
          <Skeleton className="h-6 w-12 rounded-full" />
        </div>
        <div className="flex gap-3">
          <Skeleton className="h-10 flex-1 rounded-xl" />
          <Skeleton className="h-10 flex-1 rounded-xl" />
        </div>
        <div className="flex gap-2 flex-wrap">
          {[0, 1, 2, 3, 4, 5, 6].map(i => (
            <Skeleton key={i} className="h-8 w-10 rounded-xl" />
          ))}
        </div>
      </div>

      {/* Правила ціноутворення */}
      {[0, 1].map(i => (
        <div key={i} className="rounded-3xl bg-white/60 p-5 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <Skeleton className="h-5 w-36 rounded-lg" />
            <Skeleton className="h-6 w-12 rounded-full" />
          </div>
          <Skeleton className="h-28 w-full rounded-2xl" />
        </div>
      ))}
    </div>
  );
}
