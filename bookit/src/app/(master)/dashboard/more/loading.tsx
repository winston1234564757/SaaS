import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <div className="flex flex-col gap-4 p-4 pb-8">
      {/* Header */}
      <div className="rounded-3xl bg-white/60 p-5">
        <Skeleton className="h-6 w-28 rounded-xl mb-2" />
        <Skeleton className="h-4 w-44 rounded-lg" />
      </div>

      {/* Пункти меню */}
      {[0, 1, 2, 3, 4].map(i => (
        <div key={i} className="rounded-3xl bg-white/60 p-4 flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-2xl flex-shrink-0" />
          <div className="flex flex-col gap-1.5 flex-1">
            <Skeleton className="h-4 w-36 rounded-lg" />
            <Skeleton className="h-3 w-52 rounded-md" />
          </div>
          <Skeleton className="h-5 w-5 rounded-md flex-shrink-0" />
        </div>
      ))}
    </div>
  );
}
