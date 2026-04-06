import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <div className="flex flex-col gap-4 p-4 pb-8">
      {/* Header */}
      <div className="rounded-3xl bg-white/60 p-5">
        <Skeleton className="h-6 w-40 rounded-xl mb-2" />
        <Skeleton className="h-4 w-52 rounded-lg" />
      </div>

      {/* Профіль — аватар + поля */}
      <div className="rounded-3xl bg-white/60 p-5 flex flex-col gap-4">
        <Skeleton className="h-4 w-24 rounded-lg" />
        <div className="flex items-center gap-3">
          <Skeleton className="h-16 w-16 rounded-full flex-shrink-0" />
          <Skeleton className="h-8 w-28 rounded-2xl" />
        </div>
        {/* Поле ім'я */}
        <div className="flex flex-col gap-1.5">
          <Skeleton className="h-3 w-24 rounded-md" />
          <Skeleton className="h-12 w-full rounded-xl" />
        </div>
        {/* Поле телефону */}
        <div className="flex flex-col gap-1.5">
          <Skeleton className="h-3 w-28 rounded-md" />
          <Skeleton className="h-12 w-full rounded-xl" />
        </div>
        {/* Поле slug */}
        <div className="flex flex-col gap-1.5">
          <Skeleton className="h-3 w-20 rounded-md" />
          <Skeleton className="h-12 w-full rounded-xl" />
        </div>
        {/* Поле Telegram */}
        <div className="flex flex-col gap-1.5">
          <Skeleton className="h-3 w-32 rounded-md" />
          <Skeleton className="h-12 w-full rounded-xl" />
        </div>
        <Skeleton className="h-12 w-full rounded-2xl mt-1" />
      </div>

      {/* Зміна паролю */}
      <div className="rounded-3xl bg-white/60 p-5 flex flex-col gap-3">
        <Skeleton className="h-4 w-36 rounded-lg" />
        <div className="flex flex-col gap-1.5">
          <Skeleton className="h-3 w-28 rounded-md" />
          <Skeleton className="h-12 w-full rounded-xl" />
        </div>
        <div className="flex flex-col gap-1.5">
          <Skeleton className="h-3 w-32 rounded-md" />
          <Skeleton className="h-12 w-full rounded-xl" />
        </div>
        <Skeleton className="h-12 w-full rounded-2xl mt-1" />
      </div>
    </div>
  );
}
