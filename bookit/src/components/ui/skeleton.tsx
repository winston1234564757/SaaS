import { cn } from '@/lib/utils/cn';

export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('animate-pulse rounded-md bg-[#F5E8E3]', className)}
      {...props}
    />
  );
}
