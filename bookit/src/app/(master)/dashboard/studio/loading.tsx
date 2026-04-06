import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <div className="flex flex-col gap-4 pb-8">
      {/* Header */}
      <div className="rounded-3xl bg-white/60 p-5">
        <div className="flex items-center gap-2 mb-1">
          <Skeleton className="h-6 w-24 rounded-xl" />
          <Skeleton className="h-5 w-20 rounded-full" />
        </div>
        <Skeleton className="h-4 w-48 rounded-lg" />
      </div>

      {/* Hero блок */}
      <div className="rounded-3xl bg-white/60 p-6 flex flex-col items-center gap-5">
        <Skeleton className="h-20 w-20 rounded-3xl" />
        <div className="flex flex-col items-center gap-2 w-full max-w-xs">
          <Skeleton className="h-6 w-52 rounded-xl" />
          <Skeleton className="h-4 w-64 rounded-lg" />
          <Skeleton className="h-4 w-56 rounded-lg" />
        </div>

        {/* Feature items */}
        {[0, 1, 2].map(i => (
          <div key={i} className="flex gap-3 p-3 rounded-2xl bg-white/50 w-full max-w-xs">
            <Skeleton className="h-8 w-8 rounded-xl flex-shrink-0 mt-0.5" />
            <div className="flex flex-col gap-1.5 flex-1">
              <Skeleton className="h-4 w-36 rounded-lg" />
              <Skeleton className="h-3 w-full rounded-md" />
            </div>
          </div>
        ))}

        <Skeleton className="h-12 w-full max-w-xs rounded-2xl" />
      </div>
    </div>
  );
}
