import { cn } from '@/lib/utils/cn';

type BadgeVariant = 'default' | 'success' | 'warning' | 'error' | 'info' | 'purple';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  pulse?: boolean;
}

const variantClasses: Record<BadgeVariant, string> = {
  default: 'bg-[#2C1A14]/8 text-[#2C1A14]',
  success: 'bg-[#5C9E7A]/12 text-[#5C9E7A]',
  warning: 'bg-[#D4935A]/12 text-[#D4935A]',
  error:   'bg-[#C05B5B]/12 text-[#C05B5B]',
  info:    'bg-[#789A99]/12 text-[#789A99]',
  purple:  'bg-[#8B7AB5]/12 text-[#8B7AB5]',
};

export function Badge({ variant = 'default', pulse = false, className, children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold',
        variantClasses[variant],
        className
      )}
      {...props}
    >
      {pulse && (
        <span className="relative flex h-1.5 w-1.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-current opacity-75" />
          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-current" />
        </span>
      )}
      {children}
    </span>
  );
}
